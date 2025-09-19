/**
 * DEX Integration Module
 * Supports Uniswap, 1inch, and other DEX aggregators for real trading
 */

import { ethers } from 'ethers';

export class DEXIntegration {
    constructor() {
        this.dexes = new Map();
        this.initializeDEXes();
        this.apiKeys = {
            oneInch: process.env.ONEINCH_API_KEY || '',
            moralis: process.env.MORALIS_API_KEY || '',
            coingecko: process.env.COINGECKO_API_KEY || ''
        };
    }

    initializeDEXes() {
        // Uniswap V3 Router addresses
        this.dexes.set('uniswap', {
            1: '0xE592427A0AEce92De3Edee1F18E0157C05861564',    // Ethereum
            137: '0xE592427A0AEce92De3Edee1F18E0157C05861564',  // Polygon
            42161: '0xE592427A0AEce92De3Edee1F18E0157C05861564' // Arbitrum
        });

        // PancakeSwap Router
        this.dexes.set('pancakeswap', {
            56: '0x10ED43C718714eb63d5aA57B78B54704E256024E'     // BSC
        });

        // SushiSwap Router
        this.dexes.set('sushiswap', {
            1: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',    // Ethereum
            137: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',  // Polygon
            42161: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506' // Arbitrum
        });

        // PulseX Router (PulseChain DEX)
        this.dexes.set('pulsex', {
            369: '0x98bf93ebf5c380C0e6Ae8e192A7e2AE08edAcc02'     // PulseChain
        });

        // PulseX Router
        this.dexes.set('pulsex', {
            369: '0x98bf93ebf5c380C0e6Ae8e192A7e2AE08edAcc02'     // PulseChain
        });
    }

    // Get quote from 1inch API
    async get1inchQuote(chainId, fromToken, toToken, amount, slippage = 1) {
        try {
            const baseUrl = `https://api.1inch.io/v5.0/${chainId}`;
            const url = `${baseUrl}/quote?fromTokenAddress=${fromToken}&toTokenAddress=${toToken}&amount=${amount}`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.apiKeys.oneInch}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`1inch API error: ${response.status}`);
            }
            
            const data = await response.json();
            return {
                fromToken,
                toToken,
                fromAmount: amount,
                toAmount: data.toTokenAmount,
                estimatedGas: data.estimatedGas,
                protocols: data.protocols,
                dex: '1inch'
            };
        } catch (error) {
            console.error('1inch quote error:', error);
            throw error;
        }
    }

    // Execute swap via 1inch
    async execute1inchSwap(chainId, fromToken, toToken, amount, fromAddress, slippage = 1) {
        try {
            const baseUrl = `https://api.1inch.io/v5.0/${chainId}`;
            const url = `${baseUrl}/swap?fromTokenAddress=${fromToken}&toTokenAddress=${toToken}&amount=${amount}&fromAddress=${fromAddress}&slippage=${slippage}`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.apiKeys.oneInch}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`1inch swap API error: ${response.status}`);
            }
            
            const data = await response.json();
            return {
                to: data.tx.to,
                data: data.tx.data,
                value: data.tx.value,
                gasPrice: data.tx.gasPrice,
                gas: data.tx.gas,
                toAmount: data.toTokenAmount
            };
        } catch (error) {
            console.error('1inch swap error:', error);
            throw error;
        }
    }

    // Get Uniswap quote using direct contract calls
    async getUniswapQuote(chainId, provider, fromToken, toToken, amount, fee = 3000) {
        try {
            const quoterABI = [
                'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)'
            ];
            
            const quoterAddress = this.getQuoterAddress(chainId);
            const quoterContract = new ethers.Contract(quoterAddress, quoterABI, provider);
            
            const amountOut = await quoterContract.quoteExactInputSingle(
                fromToken,
                toToken,
                fee,
                amount,
                0
            );
            
            return {
                fromToken,
                toToken,
                fromAmount: amount,
                toAmount: amountOut.toString(),
                fee,
                dex: 'uniswap'
            };
        } catch (error) {
            console.error('Uniswap quote error:', error);
            throw error;
        }
    }

    // Execute Uniswap swap
    async executeUniswapSwap(chainId, provider, wallet, fromToken, toToken, amount, minAmountOut, fee = 3000) {
        try {
            const routerABI = [
                'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut)'
            ];
            
            const routerAddress = this.dexes.get('uniswap')[chainId];
            const routerContract = new ethers.Contract(routerAddress, routerABI, wallet);
            
            const params = {
                tokenIn: fromToken,
                tokenOut: toToken,
                fee: fee,
                recipient: wallet.address,
                deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes
                amountIn: amount,
                amountOutMinimum: minAmountOut,
                sqrtPriceLimitX96: 0
            };
            
            // Estimate gas
            const gasEstimate = await routerContract.exactInputSingle.estimateGas(params);
            
            // Execute transaction
            const tx = await routerContract.exactInputSingle(params, {
                gasLimit: gasEstimate.mul(120).div(100) // 20% buffer
            });
            
            return {
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                gasLimit: tx.gasLimit?.toString(),
                gasPrice: tx.gasPrice?.toString(),
                wait: () => tx.wait()
            };
        } catch (error) {
            console.error('Uniswap swap error:', error);
            throw error;
        }
    }

    // Get best quote from multiple DEXes
    async getBestQuote(chainId, provider, fromToken, toToken, amount) {
        const quotes = [];
        
        try {
            // Get 1inch quote
            const oneInchQuote = await this.get1inchQuote(chainId, fromToken, toToken, amount);
            quotes.push(oneInchQuote);
        } catch (error) {
            console.warn('1inch quote failed:', error.message);
        }
        
        try {
            // Get Uniswap quote
            const uniswapQuote = await this.getUniswapQuote(chainId, provider, fromToken, toToken, amount);
            quotes.push(uniswapQuote);
        } catch (error) {
            console.warn('Uniswap quote failed:', error.message);
        }
        
        if (quotes.length === 0) {
            throw new Error('No quotes available from any DEX');
        }
        
        // Return quote with highest output amount
        return quotes.reduce((best, current) => {
            return ethers.BigNumber.from(current.toAmount).gt(ethers.BigNumber.from(best.toAmount)) 
                ? current : best;
        });
    }

    // Execute trade using best available DEX
    async executeBestTrade(chainId, provider, wallet, fromToken, toToken, amount, minAmountOut, slippage = 1) {
        try {
            const bestQuote = await this.getBestQuote(chainId, provider, fromToken, toToken, amount);
            
            if (bestQuote.dex === '1inch') {
                const swapData = await this.execute1inchSwap(
                    chainId, fromToken, toToken, amount, wallet.address, slippage
                );
                
                // Execute the transaction
                const tx = await wallet.sendTransaction({
                    to: swapData.to,
                    data: swapData.data,
                    value: swapData.value || 0,
                    gasPrice: swapData.gasPrice,
                    gasLimit: swapData.gas
                });
                
                return {
                    hash: tx.hash,
                    dex: '1inch',
                    expectedOutput: swapData.toAmount,
                    wait: () => tx.wait()
                };
            } else if (bestQuote.dex === 'uniswap') {
                return await this.executeUniswapSwap(
                    chainId, provider, wallet, fromToken, toToken, amount, minAmountOut
                );
            }
            
            throw new Error('Unsupported DEX');
        } catch (error) {
            console.error('Trade execution error:', error);
            throw error;
        }
    }

    // Get token prices from CoinGecko
    async getTokenPrices(tokenIds) {
        try {
            const ids = Array.isArray(tokenIds) ? tokenIds.join(',') : tokenIds;
            const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`;
            
            const response = await fetch(url, {
                headers: this.apiKeys.coingecko ? {
                    'x-cg-demo-api-key': this.apiKeys.coingecko
                } : {}
            });
            
            if (!response.ok) {
                throw new Error(`CoinGecko API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Price fetch error:', error);
            throw error;
        }
    }

    // Get historical prices
    async getHistoricalPrices(tokenId, days = 30) {
        try {
            const url = `https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart?vs_currency=usd&days=${days}`;
            
            const response = await fetch(url, {
                headers: this.apiKeys.coingecko ? {
                    'x-cg-demo-api-key': this.apiKeys.coingecko
                } : {}
            });
            
            if (!response.ok) {
                throw new Error(`CoinGecko API error: ${response.status}`);
            }
            
            const data = await response.json();
            return {
                prices: data.prices,
                volumes: data.total_volumes,
                marketCaps: data.market_caps
            };
        } catch (error) {
            console.error('Historical price fetch error:', error);
            throw error;
        }
    }

    // Approve token spending for DEX
    async approveToken(provider, wallet, tokenAddress, spenderAddress, amount) {
        try {
            const tokenABI = [
                'function approve(address spender, uint256 amount) external returns (bool)',
                'function allowance(address owner, address spender) external view returns (uint256)'
            ];
            
            const tokenContract = new ethers.Contract(tokenAddress, tokenABI, wallet);
            
            // Check current allowance
            const currentAllowance = await tokenContract.allowance(wallet.address, spenderAddress);
            
            if (ethers.BigNumber.from(currentAllowance).gte(ethers.BigNumber.from(amount))) {
                return null; // Already approved
            }
            
            // Approve maximum amount for gas efficiency
            const maxAmount = ethers.constants.MaxUint256;
            const tx = await tokenContract.approve(spenderAddress, maxAmount);
            
            return {
                hash: tx.hash,
                wait: () => tx.wait()
            };
        } catch (error) {
            console.error('Token approval error:', error);
            throw error;
        }
    }

    // Get gas price recommendations
    async getGasPrices(chainId) {
        try {
            let url;
            switch (chainId) {
                case 1: // Ethereum
                    url = 'https://api.etherscan.io/api?module=gastracker&action=gasoracle';
                    break;
                case 56: // BSC
                    url = 'https://api.bscscan.com/api?module=gastracker&action=gasoracle';
                    break;
                case 137: // Polygon
                    url = 'https://api.polygonscan.com/api?module=gastracker&action=gasoracle';
                    break;
                default:
                    return {
                        slow: '20000000000',
                        standard: '25000000000',
                        fast: '30000000000'
                    };
            }
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.status === '1') {
                return {
                    slow: ethers.utils.parseUnits(data.result.SafeGasPrice, 'gwei').toString(),
                    standard: ethers.utils.parseUnits(data.result.StandardGasPrice, 'gwei').toString(),
                    fast: ethers.utils.parseUnits(data.result.FastGasPrice, 'gwei').toString()
                };
            }
            
            throw new Error('Failed to fetch gas prices');
        } catch (error) {
            console.error('Gas price fetch error:', error);
            // Return default values
            return {
                slow: '20000000000',
                standard: '25000000000',
                fast: '30000000000'
            };
        }
    }

    // Calculate slippage
    calculateSlippage(expectedAmount, actualAmount) {
        const expected = ethers.BigNumber.from(expectedAmount);
        const actual = ethers.BigNumber.from(actualAmount);
        
        if (expected.eq(0)) return 0;
        
        const difference = expected.sub(actual);
        const slippage = difference.mul(10000).div(expected); // Basis points
        
        return slippage.toNumber() / 100; // Percentage
    }

    // Get quoter address for chain
    getQuoterAddress(chainId) {
        const quoterAddresses = {
            1: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',    // Ethereum
            137: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',  // Polygon
            42161: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6' // Arbitrum
        };
        
        return quoterAddresses[chainId];
    }

    // Get token info from on-chain data
    async getTokenInfo(provider, tokenAddress) {
        try {
            const tokenABI = [
                'function name() external view returns (string)',
                'function symbol() external view returns (string)',
                'function decimals() external view returns (uint8)',
                'function totalSupply() external view returns (uint256)'
            ];
            
            const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);
            
            const [name, symbol, decimals, totalSupply] = await Promise.all([
                tokenContract.name(),
                tokenContract.symbol(),
                tokenContract.decimals(),
                tokenContract.totalSupply()
            ]);
            
            return {
                name,
                symbol,
                decimals,
                totalSupply: totalSupply.toString(),
                address: tokenAddress
            };
        } catch (error) {
            console.error('Token info fetch error:', error);
            throw error;
        }
    }

    // Estimate trade impact
    async estimateTradeImpact(chainId, provider, fromToken, toToken, amount) {
        try {
            // Get quotes for different amounts to estimate impact
            const baseAmount = ethers.BigNumber.from(amount);
            const smallAmount = baseAmount.div(10); // 10% of original
            
            const [baseQuote, smallQuote] = await Promise.all([
                this.getBestQuote(chainId, provider, fromToken, toToken, amount),
                this.getBestQuote(chainId, provider, fromToken, toToken, smallAmount.toString())
            ]);
            
            // Calculate price impact
            const baseRate = ethers.BigNumber.from(baseQuote.toAmount).mul(1000000).div(baseAmount);
            const smallRate = ethers.BigNumber.from(smallQuote.toAmount).mul(1000000).div(smallAmount);
            
            const impact = smallRate.sub(baseRate).mul(10000).div(smallRate); // Basis points
            
            return {
                impact: impact.toNumber() / 100, // Percentage
                baseQuote,
                estimatedOutput: baseQuote.toAmount
            };
        } catch (error) {
            console.error('Trade impact estimation error:', error);
            return {
                impact: 0,
                baseQuote: null,
                estimatedOutput: '0'
            };
        }
    }
}