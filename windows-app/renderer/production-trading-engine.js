/**
 * Production Trading Engine
 * Handles real blockchain transactions with risk management and optimization
 */

import { ethers } from 'ethers';
import { DEXIntegration } from './dex-integration.js';

export class ProductionTradingEngine {
    constructor(multiWalletManager, tokenDatabase, dexIntegration) {
        this.multiWalletManager = multiWalletManager;
        this.tokenDatabase = tokenDatabase;
        this.dexIntegration = dexIntegration || new DEXIntegration();
        
        this.tradingState = {
            activeTrades: new Map(),
            pendingTrades: new Map(),
            tradeHistory: [],
            totalVolume: '0',
            totalFees: '0'
        };
        
        this.riskLimits = {
            maxSlippage: 5.0,          // 5% maximum slippage
            maxTradeSize: 0.1,         // 10% of wallet balance
            maxDailyLoss: 0.05,        // 5% daily loss limit
            maxOpenTrades: 10,         // Maximum concurrent trades
            gasMultiplier: 1.2         // 20% gas buffer
        };
        
        this.performance = {
            successfulTrades: 0,
            failedTrades: 0,
            totalPnL: '0',
            averageSlippage: 0,
            averageGasCost: '0'
        };
    }

    // Execute a production trade with full validation
    async executeTrade(tradeParams) {
        const tradeId = this.generateTradeId();
        
        try {
            // Validate trade parameters
            const validation = await this.validateTrade(tradeParams);
            if (!validation.valid) {
                throw new Error(`Trade validation failed: ${validation.reason}`);
            }

            // Create trade object
            const trade = {
                id: tradeId,
                walletId: tradeParams.walletId,
                chainId: tradeParams.chainId,
                fromToken: tradeParams.fromToken,
                toToken: tradeParams.toToken,
                amount: tradeParams.amount,
                slippage: tradeParams.slippage || 1,
                gasPrice: tradeParams.gasPrice || 'standard',
                status: 'pending',
                timestamp: Date.now(),
                estimatedOutput: '0',
                actualOutput: '0',
                gasUsed: '0',
                fees: '0'
            };

            this.tradingState.pendingTrades.set(tradeId, trade);

            // Get wallet and provider
            const wallet = this.multiWalletManager.getWallet(tradeParams.walletId);
            const provider = this.multiWalletManager.getProvider(tradeParams.chainId);
            
            if (!wallet || !provider) {
                throw new Error('Invalid wallet or chain configuration');
            }

            // Connect wallet to provider
            const connectedWallet = wallet.connect(provider);

            // Check and approve token if needed
            if (tradeParams.fromToken !== ethers.constants.AddressZero) {
                await this.ensureTokenApproval(
                    provider, 
                    connectedWallet, 
                    tradeParams.fromToken, 
                    tradeParams.amount,
                    tradeParams.chainId
                );
            }

            // Get best quote with price impact analysis
            const quote = await this.dexIntegration.getBestQuote(
                tradeParams.chainId,
                provider,
                tradeParams.fromToken,
                tradeParams.toToken,
                tradeParams.amount
            );

            // Validate price impact
            const impact = await this.dexIntegration.estimateTradeImpact(
                tradeParams.chainId,
                provider,
                tradeParams.fromToken,
                tradeParams.toToken,
                tradeParams.amount
            );

            if (impact.impact > this.riskLimits.maxSlippage) {
                throw new Error(`Price impact too high: ${impact.impact.toFixed(2)}%`);
            }

            // Calculate minimum output with slippage
            const minAmountOut = this.calculateMinAmountOut(quote.toAmount, tradeParams.slippage);

            // Update trade with estimates
            trade.estimatedOutput = quote.toAmount;
            trade.priceImpact = impact.impact;
            trade.dex = quote.dex;

            // Execute the trade
            const txResult = await this.dexIntegration.executeBestTrade(
                tradeParams.chainId,
                provider,
                connectedWallet,
                tradeParams.fromToken,
                tradeParams.toToken,
                tradeParams.amount,
                minAmountOut,
                tradeParams.slippage
            );

            // Update trade status
            trade.status = 'executed';
            trade.txHash = txResult.hash;
            trade.gasLimit = txResult.gasLimit;

            // Move to active trades
            this.tradingState.activeTrades.set(tradeId, trade);
            this.tradingState.pendingTrades.delete(tradeId);

            // Wait for confirmation in background
            this.confirmTrade(tradeId, txResult.wait);

            return {
                success: true,
                tradeId,
                txHash: txResult.hash,
                estimatedOutput: quote.toAmount,
                priceImpact: impact.impact,
                dex: quote.dex
            };

        } catch (error) {
            // Handle trade failure
            const trade = this.tradingState.pendingTrades.get(tradeId);
            if (trade) {
                trade.status = 'failed';
                trade.error = error.message;
                this.tradingState.tradeHistory.push(trade);
                this.tradingState.pendingTrades.delete(tradeId);
            }

            this.performance.failedTrades++;
            
            console.error('Trade execution failed:', error);
            return {
                success: false,
                error: error.message,
                tradeId
            };
        }
    }

    // Validate trade before execution
    async validateTrade(params) {
        try {
            // Check if wallet exists
            const wallet = this.multiWalletManager.getWallet(params.walletId);
            if (!wallet) {
                return { valid: false, reason: 'Wallet not found' };
            }

            // Check if chain is supported
            const provider = this.multiWalletManager.getProvider(params.chainId);
            if (!provider) {
                return { valid: false, reason: 'Chain not supported' };
            }

            // Validate token addresses
            if (!ethers.utils.isAddress(params.fromToken) || !ethers.utils.isAddress(params.toToken)) {
                return { valid: false, reason: 'Invalid token address' };
            }

            // Check wallet balance
            const balance = await this.multiWalletManager.getTokenBalance(
                params.walletId,
                params.chainId,
                params.fromToken
            );

            if (ethers.BigNumber.from(balance).lt(ethers.BigNumber.from(params.amount))) {
                return { valid: false, reason: 'Insufficient balance' };
            }

            // Check trade size limits
            const walletValue = await this.multiWalletManager.getWalletValue(params.walletId, params.chainId);
            const tradeValue = await this.estimateTradeValue(params);
            
            if (tradeValue > walletValue * this.riskLimits.maxTradeSize) {
                return { valid: false, reason: 'Trade size exceeds limit' };
            }

            // Check maximum open trades
            if (this.tradingState.activeTrades.size >= this.riskLimits.maxOpenTrades) {
                return { valid: false, reason: 'Maximum open trades reached' };
            }

            // Check daily loss limits
            const dailyPnL = this.calculateDailyPnL();
            if (dailyPnL < -walletValue * this.riskLimits.maxDailyLoss) {
                return { valid: false, reason: 'Daily loss limit reached' };
            }

            return { valid: true };

        } catch (error) {
            return { valid: false, reason: error.message };
        }
    }

    // Ensure token approval for DEX spending
    async ensureTokenApproval(provider, wallet, tokenAddress, amount, chainId) {
        try {
            // Get router address for the chain
            const routerAddress = this.getRouterAddress(chainId);
            
            const approval = await this.dexIntegration.approveToken(
                provider,
                wallet,
                tokenAddress,
                routerAddress,
                amount
            );

            if (approval) {
                console.log('Token approval transaction:', approval.hash);
                await approval.wait();
                console.log('Token approval confirmed');
            }

        } catch (error) {
            console.error('Token approval failed:', error);
            throw error;
        }
    }

    // Execute multiple trades simultaneously across different wallets
    async executeSimultaneousTrades(trades) {
        const results = [];
        const promises = [];

        for (let i = 0; i < trades.length && i < 5; i++) { // Max 5 simultaneous trades
            const promise = this.executeTrade(trades[i])
                .then(result => ({ index: i, result }))
                .catch(error => ({ index: i, error: error.message }));
            
            promises.push(promise);
        }

        const outcomes = await Promise.allSettled(promises);
        
        outcomes.forEach((outcome, index) => {
            if (outcome.status === 'fulfilled') {
                results[outcome.value.index] = outcome.value.result || { success: false, error: outcome.value.error };
            } else {
                results[index] = { success: false, error: outcome.reason };
            }
        });

        return results;
    }

    // Confirm trade completion
    async confirmTrade(tradeId, waitFunction) {
        try {
            const receipt = await waitFunction();
            const trade = this.tradingState.activeTrades.get(tradeId);
            
            if (trade) {
                trade.status = receipt.status === 1 ? 'confirmed' : 'failed';
                trade.blockNumber = receipt.blockNumber;
                trade.gasUsed = receipt.gasUsed.toString();
                trade.actualGasPrice = receipt.effectiveGasPrice?.toString() || '0';
                
                // Calculate fees
                trade.fees = ethers.BigNumber.from(trade.gasUsed)
                    .mul(ethers.BigNumber.from(trade.actualGasPrice))
                    .toString();

                // Update performance metrics
                if (trade.status === 'confirmed') {
                    this.performance.successfulTrades++;
                    
                    // Calculate actual slippage if we have the output amount
                    if (trade.actualOutput !== '0') {
                        const slippage = this.dexIntegration.calculateSlippage(
                            trade.estimatedOutput,
                            trade.actualOutput
                        );
                        trade.actualSlippage = slippage;
                        this.updateAverageSlippage(slippage);
                    }
                } else {
                    this.performance.failedTrades++;
                }

                // Move to history
                this.tradingState.tradeHistory.push(trade);
                this.tradingState.activeTrades.delete(tradeId);

                // Update volume and fees
                this.updateTradingMetrics(trade);
            }

        } catch (error) {
            console.error('Trade confirmation error:', error);
            const trade = this.tradingState.activeTrades.get(tradeId);
            if (trade) {
                trade.status = 'failed';
                trade.error = error.message;
                this.tradingState.tradeHistory.push(trade);
                this.tradingState.activeTrades.delete(tradeId);
                this.performance.failedTrades++;
            }
        }
    }

    // Get optimal gas price for trade
    async getOptimalGasPrice(chainId, priority = 'standard') {
        try {
            const gasPrices = await this.dexIntegration.getGasPrices(chainId);
            let gasPrice = gasPrices[priority] || gasPrices.standard;
            
            // Apply gas multiplier for reliability
            return ethers.BigNumber.from(gasPrice)
                .mul(Math.floor(this.riskLimits.gasMultiplier * 100))
                .div(100)
                .toString();
                
        } catch (error) {
            console.error('Gas price fetch failed:', error);
            // Return default gas price
            return ethers.utils.parseUnits('25', 'gwei').toString();
        }
    }

    // Calculate minimum amount out with slippage
    calculateMinAmountOut(expectedAmount, slippagePercent) {
        const slippageBasisPoints = Math.floor(slippagePercent * 100);
        return ethers.BigNumber.from(expectedAmount)
            .mul(10000 - slippageBasisPoints)
            .div(10000)
            .toString();
    }

    // Estimate trade value in USD
    async estimateTradeValue(params) {
        try {
            // Get token price from CoinGecko
            const tokenInfo = this.tokenDatabase.getTokenByAddress(params.fromToken, params.chainId);
            if (!tokenInfo || !tokenInfo.coingeckoId) {
                return 0;
            }

            const prices = await this.dexIntegration.getTokenPrices(tokenInfo.coingeckoId);
            const tokenPrice = prices[tokenInfo.coingeckoId]?.usd || 0;
            
            const amount = ethers.utils.formatUnits(params.amount, tokenInfo.decimals);
            return parseFloat(amount) * tokenPrice;

        } catch (error) {
            console.error('Trade value estimation failed:', error);
            return 0;
        }
    }

    // Calculate daily P&L
    calculateDailyPnL() {
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        let dailyPnL = 0;

        this.tradingState.tradeHistory.forEach(trade => {
            if (trade.timestamp >= oneDayAgo && trade.status === 'confirmed') {
                // Simplified P&L calculation - would need more complex logic for real implementation
                if (trade.actualOutput && trade.estimatedOutput) {
                    const slippage = this.dexIntegration.calculateSlippage(
                        trade.estimatedOutput,
                        trade.actualOutput
                    );
                    dailyPnL += slippage; // Negative slippage reduces P&L
                }
            }
        });

        return dailyPnL;
    }

    // Update trading metrics
    updateTradingMetrics(trade) {
        if (trade.status === 'confirmed') {
            // Update total volume (in wei/base units)
            this.tradingState.totalVolume = ethers.BigNumber.from(this.tradingState.totalVolume)
                .add(ethers.BigNumber.from(trade.amount))
                .toString();

            // Update total fees
            this.tradingState.totalFees = ethers.BigNumber.from(this.tradingState.totalFees)
                .add(ethers.BigNumber.from(trade.fees || '0'))
                .toString();

            // Update average gas cost
            this.updateAverageGasCost(trade.fees || '0');
        }
    }

    // Update average slippage
    updateAverageSlippage(newSlippage) {
        const totalTrades = this.performance.successfulTrades;
        if (totalTrades === 1) {
            this.performance.averageSlippage = newSlippage;
        } else {
            this.performance.averageSlippage = 
                (this.performance.averageSlippage * (totalTrades - 1) + newSlippage) / totalTrades;
        }
    }

    // Update average gas cost
    updateAverageGasCost(newGasCost) {
        const totalTrades = this.performance.successfulTrades;
        if (totalTrades === 1) {
            this.performance.averageGasCost = newGasCost;
        } else {
            const current = ethers.BigNumber.from(this.performance.averageGasCost);
            const newCost = ethers.BigNumber.from(newGasCost);
            this.performance.averageGasCost = current
                .mul(totalTrades - 1)
                .add(newCost)
                .div(totalTrades)
                .toString();
        }
    }

    // Get router address for chain
    getRouterAddress(chainId) {
        const routers = {
            1: '0xE592427A0AEce92De3Edee1F18E0157C05861564',    // Uniswap V3 Ethereum
            56: '0x10ED43C718714eb63d5aA57B78B54704E256024E',   // PancakeSwap BSC
            137: '0xE592427A0AEce92De3Edee1F18E0157C05861564',  // Uniswap V3 Polygon
            42161: '0xE592427A0AEce92De3Edee1F18E0157C05861564' // Uniswap V3 Arbitrum
        };
        
        return routers[chainId];
    }

    // Generate unique trade ID
    generateTradeId() {
        return `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Get trading performance metrics
    getPerformanceMetrics() {
        const totalTrades = this.performance.successfulTrades + this.performance.failedTrades;
        const successRate = totalTrades > 0 ? (this.performance.successfulTrades / totalTrades) * 100 : 0;

        return {
            ...this.performance,
            totalTrades,
            successRate: successRate.toFixed(2),
            avgSlippageFormatted: this.performance.averageSlippage.toFixed(4),
            avgGasCostFormatted: ethers.utils.formatEther(this.performance.averageGasCost || '0'),
            totalVolumeFormatted: ethers.utils.formatEther(this.tradingState.totalVolume),
            totalFeesFormatted: ethers.utils.formatEther(this.tradingState.totalFees)
        };
    }

    // Get current trading state
    getTradingState() {
        return {
            activeTrades: Array.from(this.tradingState.activeTrades.values()),
            pendingTrades: Array.from(this.tradingState.pendingTrades.values()),
            recentTrades: this.tradingState.tradeHistory.slice(-10),
            performance: this.getPerformanceMetrics()
        };
    }

    // Update risk limits
    updateRiskLimits(newLimits) {
        this.riskLimits = {
            ...this.riskLimits,
            ...newLimits
        };
    }

    // Emergency stop all trading
    emergencyStop() {
        // Cancel all pending trades
        this.tradingState.pendingTrades.forEach(trade => {
            trade.status = 'cancelled';
            trade.error = 'Emergency stop activated';
            this.tradingState.tradeHistory.push(trade);
        });
        
        this.tradingState.pendingTrades.clear();
        
        console.log('Emergency stop activated - all pending trades cancelled');
    }
}