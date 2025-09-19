/**
 * Multi-Wallet Manager
 * Supports up to 5 wallets with individual tracking and simultaneous trading
 */

import { ethers } from 'ethers';

export class MultiWalletManager {
    constructor() {
        this.wallets = new Map(); // walletId -> wallet data
        this.maxWallets = 5;
        this.activeWallet = null;
        this.providers = new Map(); // chainId -> provider
        this.initializeProviders();
    }

    initializeProviders() {
        // Initialize providers for different chains
        this.providers.set(1, new ethers.JsonRpcProvider('https://eth.llamarpc.com')); // Ethereum
        this.providers.set(56, new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org')); // BSC
        this.providers.set(137, new ethers.JsonRpcProvider('https://polygon-rpc.com')); // Polygon
        this.providers.set(369, new ethers.JsonRpcProvider('https://rpc.pulsechain.com')); // PulseChain
        this.providers.set(42161, new ethers.JsonRpcProvider('https://arb1.arbitrum.io/rpc')); // Arbitrum
    }

    // Create a new wallet
    async createWallet(name = null, chainId = 1) {
        if (this.wallets.size >= this.maxWallets) {
            throw new Error(`Maximum ${this.maxWallets} wallets allowed`);
        }

        const wallet = ethers.Wallet.createRandom();
        const walletId = `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const walletData = {
            id: walletId,
            name: name || `Wallet ${this.wallets.size + 1}`,
            address: wallet.address,
            privateKey: wallet.privateKey,
            mnemonic: wallet.mnemonic.phrase,
            chainId: chainId,
            balances: new Map(), // tokenAddress -> balance
            nonce: 0,
            created: Date.now(),
            isActive: true
        };

        // Connect wallet to provider
        const provider = this.providers.get(chainId);
        if (provider) {
            walletData.connectedWallet = wallet.connect(provider);
        }

        this.wallets.set(walletId, walletData);
        
        if (!this.activeWallet) {
            this.activeWallet = walletId;
        }

        await this.updateWalletBalances(walletId);
        return walletData;
    }

    // Import existing wallet
    async importWallet(privateKey, name = null, chainId = 1) {
        if (this.wallets.size >= this.maxWallets) {
            throw new Error(`Maximum ${this.maxWallets} wallets allowed`);
        }

        const wallet = new ethers.Wallet(privateKey);
        const walletId = `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const walletData = {
            id: walletId,
            name: name || `Imported Wallet ${this.wallets.size + 1}`,
            address: wallet.address,
            privateKey: wallet.privateKey,
            mnemonic: wallet.mnemonic?.phrase || null,
            chainId: chainId,
            balances: new Map(),
            nonce: 0,
            imported: true,
            created: Date.now(),
            isActive: true
        };

        // Connect wallet to provider
        const provider = this.providers.get(chainId);
        if (provider) {
            walletData.connectedWallet = wallet.connect(provider);
        }

        this.wallets.set(walletId, walletData);
        
        if (!this.activeWallet) {
            this.activeWallet = walletId;
        }

        await this.updateWalletBalances(walletId);
        return walletData;
    }

    // Update balances for a specific wallet
    async updateWalletBalances(walletId) {
        const walletData = this.wallets.get(walletId);
        if (!walletData) throw new Error('Wallet not found');

        const provider = this.providers.get(walletData.chainId);
        if (!provider) throw new Error('Provider not available for chain');

        try {
            // Get native token balance (ETH, BNB, MATIC, etc.)
            const nativeBalance = await provider.getBalance(walletData.address);
            walletData.balances.set('native', ethers.formatEther(nativeBalance));

            // Get ERC-20 token balances for known tokens
            await this.updateTokenBalances(walletData, provider);
            
            // Update nonce
            walletData.nonce = await provider.getTransactionCount(walletData.address);
            
        } catch (error) {
            console.error(`Error updating balances for ${walletId}:`, error);
        }
    }

    // Update ERC-20 token balances
    async updateTokenBalances(walletData, provider) {
        const tokenList = await this.getTokensForChain(walletData.chainId);
        
        for (const token of tokenList.slice(0, 20)) { // Limit to top 20 for performance
            try {
                const contract = new ethers.Contract(
                    token.address,
                    ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'],
                    provider
                );
                
                const balance = await contract.balanceOf(walletData.address);
                const decimals = await contract.decimals();
                const formattedBalance = ethers.formatUnits(balance, decimals);
                
                if (parseFloat(formattedBalance) > 0) {
                    walletData.balances.set(token.address, {
                        balance: formattedBalance,
                        symbol: token.symbol,
                        decimals: decimals
                    });
                }
            } catch (error) {
                // Skip tokens that fail to load
                console.warn(`Failed to load balance for ${token.symbol}:`, error.message);
            }
        }
    }

    // Get all wallets
    getAllWallets() {
        return Array.from(this.wallets.values()).map(wallet => ({
            id: wallet.id,
            name: wallet.name,
            address: wallet.address,
            chainId: wallet.chainId,
            balances: Object.fromEntries(wallet.balances),
            isActive: wallet.isActive,
            created: wallet.created
        }));
    }

    // Get specific wallet
    getWallet(walletId) {
        return this.wallets.get(walletId);
    }

    // Set active wallet
    setActiveWallet(walletId) {
        if (this.wallets.has(walletId)) {
            this.activeWallet = walletId;
            return true;
        }
        return false;
    }

    // Get active wallet
    getActiveWallet() {
        return this.wallets.get(this.activeWallet);
    }

    // Switch wallet to different chain
    async switchChain(walletId, newChainId) {
        const walletData = this.wallets.get(walletId);
        if (!walletData) throw new Error('Wallet not found');

        const provider = this.providers.get(newChainId);
        if (!provider) throw new Error('Unsupported chain');

        // Create new wallet instance for different chain
        const wallet = new ethers.Wallet(walletData.privateKey);
        walletData.connectedWallet = wallet.connect(provider);
        walletData.chainId = newChainId;
        
        // Clear old balances and update for new chain
        walletData.balances.clear();
        await this.updateWalletBalances(walletId);
    }

    // Execute trade on specific wallet
    async executeTrade(walletId, tradeParams) {
        const walletData = this.wallets.get(walletId);
        if (!walletData || !walletData.connectedWallet) {
            throw new Error('Wallet not available for trading');
        }

        const {
            tokenIn,
            tokenOut,
            amountIn,
            minAmountOut,
            slippage = 0.5,
            dexRouter = 'uniswap'
        } = tradeParams;

        try {
            // This would integrate with actual DEX routers
            const trade = await this.executeSwap(walletData, {
                tokenIn,
                tokenOut,
                amountIn,
                minAmountOut,
                slippage,
                dexRouter
            });

            return trade;
        } catch (error) {
            throw new Error(`Trade execution failed: ${error.message}`);
        }
    }

    // Execute simultaneous trades across multiple wallets
    async executeMultiWalletTrades(tradeConfigs) {
        const trades = [];
        const promises = [];

        for (const config of tradeConfigs) {
            const { walletId, tradeParams } = config;
            const promise = this.executeTrade(walletId, tradeParams)
                .then(result => ({ walletId, success: true, result }))
                .catch(error => ({ walletId, success: false, error: error.message }));
            
            promises.push(promise);
        }

        const results = await Promise.allSettled(promises);
        return results.map(result => result.value);
    }

    // Portfolio allocation across wallets
    getPortfolioAllocation() {
        const totalValue = this.getTotalPortfolioValue();
        const allocations = [];

        for (const [walletId, walletData] of this.wallets) {
            const walletValue = this.getWalletValue(walletId);
            const percentage = totalValue > 0 ? (walletValue / totalValue) * 100 : 0;
            
            allocations.push({
                walletId,
                name: walletData.name,
                value: walletValue,
                percentage: percentage.toFixed(2),
                address: walletData.address,
                chainId: walletData.chainId
            });
        }

        return allocations;
    }

    // Calculate total portfolio value in USD
    getTotalPortfolioValue() {
        let total = 0;
        for (const [walletId] of this.wallets) {
            total += this.getWalletValue(walletId);
        }
        return total;
    }

    // Calculate individual wallet value
    getWalletValue(walletId) {
        const walletData = this.wallets.get(walletId);
        if (!walletData) return 0;

        let totalValue = 0;
        
        // Add native token value
        const nativeBalance = walletData.balances.get('native');
        if (nativeBalance) {
            // This would use real price data
            const nativePrice = this.getNativeTokenPrice(walletData.chainId);
            totalValue += parseFloat(nativeBalance) * nativePrice;
        }

        // Add ERC-20 token values
        for (const [tokenAddress, tokenData] of walletData.balances) {
            if (tokenAddress !== 'native' && tokenData.balance) {
                // This would use real price data from DEX aggregators
                const tokenPrice = this.getTokenPrice(tokenAddress, walletData.chainId);
                totalValue += parseFloat(tokenData.balance) * tokenPrice;
            }
        }

        return totalValue;
    }

    // Stub for getting native token price
    getNativeTokenPrice(chainId) {
        const prices = {
            1: 2500,    // ETH
            56: 300,    // BNB
            137: 0.8,   // MATIC
            42161: 2500 // ETH on Arbitrum
        };
        return prices[chainId] || 0;
    }

    // Stub for getting token price
    getTokenPrice(tokenAddress, chainId) {
        // This would integrate with real price APIs
        return Math.random() * 100; // Mock price
    }

    // Delete wallet
    async deleteWallet(walletId) {
        if (!this.wallets.has(walletId)) {
            throw new Error('Wallet not found');
        }

        this.wallets.delete(walletId);
        
        if (this.activeWallet === walletId) {
            // Set new active wallet if available
            const remainingWallets = Array.from(this.wallets.keys());
            this.activeWallet = remainingWallets.length > 0 ? remainingWallets[0] : null;
        }
    }

    // Export wallet data
    exportWallet(walletId) {
        const walletData = this.wallets.get(walletId);
        if (!walletData) throw new Error('Wallet not found');

        return {
            name: walletData.name,
            address: walletData.address,
            privateKey: walletData.privateKey,
            mnemonic: walletData.mnemonic,
            chainId: walletData.chainId,
            created: walletData.created
        };
    }

    // Stub for actual swap execution
    async executeSwap(walletData, swapParams) {
        // This would integrate with actual DEX routers
        // For now, return mock trade data
        return {
            txHash: '0x' + Math.random().toString(16).substr(2, 64),
            amountIn: swapParams.amountIn,
            amountOut: swapParams.amountIn * 0.99, // Mock 1% slippage
            gasUsed: '21000',
            gasPrice: '20000000000',
            timestamp: Date.now()
        };
    }

    // Get supported tokens for chain
    async getTokensForChain(chainId) {
        // This would load from a comprehensive token database
        const tokenDatabase = {
            1: [ // Ethereum
                { symbol: 'USDC', address: '0xA0b86a33E6441C41508e8e1dF82a12b6CBB9A0aA', decimals: 6 },
                { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
                { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
                { symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
                { symbol: 'UNI', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18 }
            ],
            56: [ // BSC
                { symbol: 'BUSD', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18 },
                { symbol: 'USDT', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
                { symbol: 'CAKE', address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', decimals: 18 }
            ],
            137: [ // Polygon
                { symbol: 'USDC', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6 },
                { symbol: 'USDT', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
                { symbol: 'WMATIC', address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', decimals: 18 }
            ]
        };

        return tokenDatabase[chainId] || [];
    }
}