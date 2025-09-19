/**
 * Comprehensive ERC-20 Token Database
 * Contains metadata for major tokens across multiple chains
 */

export class TokenDatabase {
    constructor() {
        this.tokens = new Map();
        this.loadTokenDatabase();
    }

    loadTokenDatabase() {
        // Ethereum Mainnet (Chain ID: 1)
        this.addTokens(1, [
            {
                symbol: 'USDC',
                name: 'USD Coin',
                address: '0xA0b86a33E6441C41508e8e1dF82a12b6CBB9A0aA',
                decimals: 6,
                logoURI: 'https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png',
                coingeckoId: 'usd-coin',
                category: 'stablecoin',
                volume24h: 1000000000,
                marketCap: 25000000000
            },
            {
                symbol: 'USDT',
                name: 'Tether USD',
                address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                decimals: 6,
                logoURI: 'https://assets.coingecko.com/coins/images/325/thumb/Tether.png',
                coingeckoId: 'tether',
                category: 'stablecoin',
                volume24h: 2000000000,
                marketCap: 83000000000
            },
            {
                symbol: 'DAI',
                name: 'Dai Stablecoin',
                address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
                decimals: 18,
                logoURI: 'https://assets.coingecko.com/coins/images/9956/thumb/Badge_Dai.png',
                coingeckoId: 'dai',
                category: 'stablecoin',
                volume24h: 150000000,
                marketCap: 5300000000
            },
            {
                symbol: 'WETH',
                name: 'Wrapped Ether',
                address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                decimals: 18,
                logoURI: 'https://assets.coingecko.com/coins/images/2518/thumb/weth.png',
                coingeckoId: 'weth',
                category: 'wrapped',
                volume24h: 800000000,
                marketCap: 6000000000
            },
            {
                symbol: 'UNI',
                name: 'Uniswap',
                address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
                decimals: 18,
                logoURI: 'https://assets.coingecko.com/coins/images/12504/thumb/uni.jpg',
                coingeckoId: 'uniswap',
                category: 'defi',
                volume24h: 120000000,
                marketCap: 4200000000
            },
            {
                symbol: 'LINK',
                name: 'Chainlink',
                address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
                decimals: 18,
                logoURI: 'https://assets.coingecko.com/coins/images/877/thumb/chainlink-new-logo.png',
                coingeckoId: 'chainlink',
                category: 'oracle',
                volume24h: 300000000,
                marketCap: 7500000000
            },
            {
                symbol: 'AAVE',
                name: 'Aave',
                address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
                decimals: 18,
                logoURI: 'https://assets.coingecko.com/coins/images/12645/thumb/AAVE.png',
                coingeckoId: 'aave',
                category: 'defi',
                volume24h: 80000000,
                marketCap: 1500000000
            },
            {
                symbol: 'COMP',
                name: 'Compound',
                address: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
                decimals: 18,
                logoURI: 'https://assets.coingecko.com/coins/images/10775/thumb/COMP.png',
                coingeckoId: 'compound-governance-token',
                category: 'defi',
                volume24h: 45000000,
                marketCap: 600000000
            },
            {
                symbol: 'MKR',
                name: 'Maker',
                address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
                decimals: 18,
                logoURI: 'https://assets.coingecko.com/coins/images/1364/thumb/Mark_Maker.png',
                coingeckoId: 'maker',
                category: 'defi',
                volume24h: 25000000,
                marketCap: 1200000000
            },
            {
                symbol: 'CRV',
                name: 'Curve DAO Token',
                address: '0xD533a949740bb3306d119CC777fa900bA034cd52',
                decimals: 18,
                logoURI: 'https://assets.coingecko.com/coins/images/12124/thumb/Curve.png',
                coingeckoId: 'curve-dao-token',
                category: 'defi',
                volume24h: 35000000,
                marketCap: 400000000
            }
        ]);

        // Binance Smart Chain (Chain ID: 56)
        this.addTokens(56, [
            {
                symbol: 'BUSD',
                name: 'Binance USD',
                address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
                decimals: 18,
                logoURI: 'https://assets.coingecko.com/coins/images/9576/thumb/BUSD.png',
                coingeckoId: 'binance-usd',
                category: 'stablecoin',
                volume24h: 500000000,
                marketCap: 4000000000
            },
            {
                symbol: 'USDT',
                name: 'Tether USD',
                address: '0x55d398326f99059fF775485246999027B3197955',
                decimals: 18,
                logoURI: 'https://assets.coingecko.com/coins/images/325/thumb/Tether.png',
                coingeckoId: 'tether',
                category: 'stablecoin',
                volume24h: 400000000,
                marketCap: 2000000000
            },
            {
                symbol: 'CAKE',
                name: 'PancakeSwap Token',
                address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
                decimals: 18,
                logoURI: 'https://assets.coingecko.com/coins/images/12632/thumb/pancakeswap-cake-logo.png',
                coingeckoId: 'pancakeswap-token',
                category: 'defi',
                volume24h: 60000000,
                marketCap: 400000000
            },
            {
                symbol: 'WBNB',
                name: 'Wrapped BNB',
                address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
                decimals: 18,
                logoURI: 'https://assets.coingecko.com/coins/images/12591/thumb/binance-coin-logo.png',
                coingeckoId: 'wbnb',
                category: 'wrapped',
                volume24h: 200000000,
                marketCap: 1500000000
            },
            {
                symbol: 'XVS',
                name: 'Venus',
                address: '0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63',
                decimals: 18,
                logoURI: 'https://assets.coingecko.com/coins/images/12677/thumb/venus.png',
                coingeckoId: 'venus',
                category: 'defi',
                volume24h: 15000000,
                marketCap: 120000000
            }
        ]);

        // Polygon (Chain ID: 137)
        this.addTokens(137, [
            {
                symbol: 'USDC',
                name: 'USD Coin',
                address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
                decimals: 6,
                logoURI: 'https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png',
                coingeckoId: 'usd-coin',
                category: 'stablecoin',
                volume24h: 200000000,
                marketCap: 5000000000
            },
            {
                symbol: 'USDT',
                name: 'Tether USD',
                address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
                decimals: 6,
                logoURI: 'https://assets.coingecko.com/coins/images/325/thumb/Tether.png',
                coingeckoId: 'tether',
                category: 'stablecoin',
                volume24h: 180000000,
                marketCap: 1800000000
            },
            {
                symbol: 'WMATIC',
                name: 'Wrapped Matic',
                address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
                decimals: 18,
                logoURI: 'https://assets.coingecko.com/coins/images/4713/thumb/matic-token-icon.png',
                coingeckoId: 'wmatic',
                category: 'wrapped',
                volume24h: 100000000,
                marketCap: 800000000
            },
            {
                symbol: 'WETH',
                name: 'Wrapped Ether',
                address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
                decimals: 18,
                logoURI: 'https://assets.coingecko.com/coins/images/2518/thumb/weth.png',
                coingeckoId: 'weth',
                category: 'wrapped',
                volume24h: 150000000,
                marketCap: 1000000000
            },
            {
                symbol: 'QUICK',
                name: 'QuickSwap',
                address: '0x831753DD7087CaC61aB5644b308642cc1c33Dc13',
                decimals: 18,
                logoURI: 'https://assets.coingecko.com/coins/images/13970/thumb/1_pOc_ZO_NZHX4VqUaMTW2kg.png',
                coingeckoId: 'quickswap',
                category: 'defi',
                volume24h: 8000000,
                marketCap: 50000000
            }
        ]);

        // Arbitrum (Chain ID: 42161)
        this.addTokens(42161, [
            {
                symbol: 'USDC',
                name: 'USD Coin',
                address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
                decimals: 6,
                logoURI: 'https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png',
                coingeckoId: 'usd-coin',
                category: 'stablecoin',
                volume24h: 150000000,
                marketCap: 2000000000
            },
            {
                symbol: 'WETH',
                name: 'Wrapped Ether',
                address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
                decimals: 18,
                logoURI: 'https://assets.coingecko.com/coins/images/2518/thumb/weth.png',
                coingeckoId: 'weth',
                category: 'wrapped',
                volume24h: 200000000,
                marketCap: 1500000000
            },
            {
                symbol: 'ARB',
                name: 'Arbitrum',
                address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
                decimals: 18,
                logoURI: 'https://assets.coingecko.com/coins/images/16547/thumb/photo_2023-03-29_21.47.00.jpeg',
                coingeckoId: 'arbitrum',
                category: 'layer2',
                volume24h: 80000000,
                marketCap: 1200000000
            },
            {
                symbol: 'GMX',
                name: 'GMX',
                address: '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a',
                decimals: 18,
                logoURI: 'https://assets.coingecko.com/coins/images/18323/thumb/arbit.png',
                coingeckoId: 'gmx',
                category: 'defi',
                volume24h: 25000000,
                marketCap: 400000000
            }
        ]);

        // PulseChain (Chain ID: 369)
        this.addTokens(369, [
            {
                symbol: 'PLS',
                name: 'Pulse',
                address: '0x0000000000000000000000000000000000000000',
                decimals: 18,
                logoURI: 'https://assets.coingecko.com/coins/images/27044/thumb/pulse-logo.png',
                coingeckoId: 'pulsechain',
                category: 'native',
                volume24h: 50000000,
                marketCap: 15000000000
            },
            {
                symbol: 'PLSX',
                name: 'PulseX',
                address: '0x95B303987A60C71504D99Aa1b13B4DA07b0790ab',
                decimals: 18,
                logoURI: 'https://assets.coingecko.com/coins/images/27045/thumb/pulsex-logo.png',
                coingeckoId: 'pulsex',
                category: 'defi',
                volume24h: 80000000,
                marketCap: 8000000000
            },
            {
                symbol: 'HEX',
                name: 'HEX',
                address: '0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39',
                decimals: 8,
                logoURI: 'https://assets.coingecko.com/coins/images/10103/thumb/HEX-logo.png',
                coingeckoId: 'hex',
                category: 'defi',
                volume24h: 120000000,
                marketCap: 45000000000
            },
            {
                symbol: 'WPLS',
                name: 'Wrapped Pulse',
                address: '0xA1077a294dDE1B09bB078844df40758a5D0f9a27',
                decimals: 18,
                logoURI: 'https://assets.coingecko.com/coins/images/27044/thumb/pulse-logo.png',
                coingeckoId: 'pulsechain',
                category: 'wrapped',
                volume24h: 35000000,
                marketCap: 2000000000
            },
            {
                symbol: 'INC',
                name: 'Incentive',
                address: '0x2fa878Ab3F87CC1C9737Fc071108F904c0B0C95d',
                decimals: 18,
                logoURI: 'https://assets.coingecko.com/coins/images/27046/thumb/inc-logo.png',
                coingeckoId: 'incentive',
                category: 'defi',
                volume24h: 15000000,
                marketCap: 500000000
            },
            {
                symbol: 'TEXAN',
                name: 'Texan',
                address: '0x7238390d5f6F64e67c3211C343A410E2A3DEc142',
                decimals: 8,
                logoURI: 'https://assets.coingecko.com/coins/images/27047/thumb/texan-logo.png',
                coingeckoId: 'texan',
                category: 'meme',
                volume24h: 8000000,
                marketCap: 200000000
            }
        ]);
    }

    addTokens(chainId, tokens) {
        if (!this.tokens.has(chainId)) {
            this.tokens.set(chainId, new Map());
        }
        
        const chainTokens = this.tokens.get(chainId);
        tokens.forEach(token => {
            chainTokens.set(token.address.toLowerCase(), token);
        });
    }

    // Get all tokens for a specific chain
    getTokensForChain(chainId) {
        const chainTokens = this.tokens.get(chainId);
        return chainTokens ? Array.from(chainTokens.values()) : [];
    }

    // Get token by address
    getToken(chainId, address) {
        const chainTokens = this.tokens.get(chainId);
        return chainTokens ? chainTokens.get(address.toLowerCase()) : null;
    }

    // Search tokens by symbol or name
    searchTokens(query, chainId = null) {
        const results = [];
        const queryLower = query.toLowerCase();
        
        const searchInChain = (chainId) => {
            const chainTokens = this.tokens.get(chainId);
            if (!chainTokens) return;
            
            for (const token of chainTokens.values()) {
                if (
                    token.symbol.toLowerCase().includes(queryLower) ||
                    token.name.toLowerCase().includes(queryLower)
                ) {
                    results.push({ ...token, chainId });
                }
            }
        };

        if (chainId) {
            searchInChain(chainId);
        } else {
            // Search all chains
            for (const [cId] of this.tokens) {
                searchInChain(cId);
            }
        }

        return results;
    }

    // Get tokens by category
    getTokensByCategory(category, chainId = null) {
        const results = [];
        
        const searchInChain = (chainId) => {
            const chainTokens = this.tokens.get(chainId);
            if (!chainTokens) return;
            
            for (const token of chainTokens.values()) {
                if (token.category === category) {
                    results.push({ ...token, chainId });
                }
            }
        };

        if (chainId) {
            searchInChain(chainId);
        } else {
            for (const [cId] of this.tokens) {
                searchInChain(cId);
            }
        }

        return results;
    }

    // Get top tokens by volume
    getTopTokensByVolume(chainId, limit = 10) {
        const chainTokens = this.tokens.get(chainId);
        if (!chainTokens) return [];

        return Array.from(chainTokens.values())
            .sort((a, b) => b.volume24h - a.volume24h)
            .slice(0, limit);
    }

    // Get top tokens by market cap
    getTopTokensByMarketCap(chainId, limit = 10) {
        const chainTokens = this.tokens.get(chainId);
        if (!chainTokens) return [];

        return Array.from(chainTokens.values())
            .sort((a, b) => b.marketCap - a.marketCap)
            .slice(0, limit);
    }

    // Get stablecoins for a chain
    getStablecoins(chainId) {
        return this.getTokensByCategory('stablecoin', chainId);
    }

    // Get DeFi tokens for a chain
    getDeFiTokens(chainId) {
        return this.getTokensByCategory('defi', chainId);
    }

    // Get supported chains
    getSupportedChains() {
        return [
            { chainId: 1, name: 'Ethereum', symbol: 'ETH', explorer: 'https://etherscan.io' },
            { chainId: 56, name: 'Binance Smart Chain', symbol: 'BNB', explorer: 'https://bscscan.com' },
            { chainId: 137, name: 'Polygon', symbol: 'MATIC', explorer: 'https://polygonscan.com' },
            { chainId: 369, name: 'PulseChain', symbol: 'PLS', explorer: 'https://scan.pulsechain.com' },
            { chainId: 42161, name: 'Arbitrum', symbol: 'ETH', explorer: 'https://arbiscan.io' }
        ];
    }

    // Validate if token exists
    isValidToken(chainId, address) {
        const chainTokens = this.tokens.get(chainId);
        return chainTokens ? chainTokens.has(address.toLowerCase()) : false;
    }

    // Get trading pairs for a token
    getTradingPairs(chainId, tokenAddress) {
        const stablecoins = this.getStablecoins(chainId);
        const token = this.getToken(chainId, tokenAddress);
        
        if (!token) return [];

        // Return pairs with stablecoins and wrapped native tokens
        const pairs = [];
        
        stablecoins.forEach(stable => {
            if (stable.address.toLowerCase() !== tokenAddress.toLowerCase()) {
                pairs.push({
                    base: token,
                    quote: stable,
                    pair: `${token.symbol}/${stable.symbol}`
                });
            }
        });

        // Add native token pairs
        const nativeTokens = this.getTokensByCategory('wrapped', chainId);
        nativeTokens.forEach(native => {
            if (native.address.toLowerCase() !== tokenAddress.toLowerCase()) {
                pairs.push({
                    base: token,
                    quote: native,
                    pair: `${token.symbol}/${native.symbol}`
                });
            }
        });

        return pairs;
    }
}