/**
 * Enhanced Trading Bot with 90-day Historical Data Analysis
 * Uses comprehensive technical analysis for intelligent trading decisions
 */

import { HistoricalDataService } from './historical-data-service.js';
import { ethers } from 'ethers';

export class EnhancedTradingBot {
    constructor(multiWalletManager, tokenDatabase, productionTradingEngine, dexIntegration) {
        this.multiWalletManager = multiWalletManager;
        this.tokenDatabase = tokenDatabase;
        this.productionTradingEngine = productionTradingEngine;
        this.dexIntegration = dexIntegration;
        this.historicalDataService = new HistoricalDataService();
        
        this.isRunning = false;
        this.strategies = new Map();
        this.positions = new Map();
        this.initializeStrategies();
        
        // Bot configuration
        this.config = {
            dataRequirements: {
                days: 90,                    // 90 days of historical data
                intervals: ['1h', '15m'],    // Hourly and 15-minute data
                minDataPoints: 100           // Minimum data points required
            },
            riskManagement: {
                maxPositionSize: 0.05,       // 5% of portfolio per trade
                stopLoss: 0.03,              // 3% stop loss
                takeProfit: 0.06,            // 6% take profit
                maxDailyTrades: 10,          // Maximum trades per day
                maxDrawdown: 0.15            // 15% maximum drawdown
            },
            analysisConfig: {
                rsiPeriod: 14,
                macdFast: 12,
                macdSlow: 26,
                macdSignal: 9,
                bollinger: { period: 20, stdDev: 2 },
                volumeThreshold: 1.5         // Volume surge threshold
            }
        };
        
        this.performance = {
            totalTrades: 0,
            successfulTrades: 0,
            totalReturn: 0,
            maxDrawdown: 0,
            sharpeRatio: 0,
            lastAnalysis: 0
        };
    }

    // Initialize trading strategies
    initializeStrategies() {
        // Multi-timeframe momentum strategy
        this.strategies.set('momentum', {
            name: 'Multi-Timeframe Momentum',
            enabled: true,
            weight: 0.3,
            analyze: this.analyzeMomentum.bind(this)
        });

        // Mean reversion strategy
        this.strategies.set('meanReversion', {
            name: 'Mean Reversion with RSI',
            enabled: true,
            weight: 0.25,
            analyze: this.analyzeMeanReversion.bind(this)
        });

        // Breakout strategy
        this.strategies.set('breakout', {
            name: 'Bollinger Band Breakout',
            enabled: true,
            weight: 0.25,
            analyze: this.analyzeBreakout.bind(this)
        });

        // Volume surge strategy
        this.strategies.set('volumeSurge', {
            name: 'Volume Surge Detection',
            enabled: true,
            weight: 0.2,
            analyze: this.analyzeVolumeSurge.bind(this)
        });
    }

    // Start the enhanced trading bot
    async startBot(walletIds, tokens, chains) {
        if (this.isRunning) {
            throw new Error('Bot is already running');
        }

        console.log('Starting Enhanced Trading Bot with 90-day analysis...');
        this.isRunning = true;

        try {
            // Pre-load historical data for all tokens
            await this.preloadHistoricalData(tokens, chains);
            
            // Start main trading loop
            this.tradingLoop(walletIds, tokens, chains);
            
            console.log('Enhanced Trading Bot started successfully');

        } catch (error) {
            console.error('Bot startup error:', error);
            this.isRunning = false;
            throw error;
        }
    }

    // Stop the trading bot
    stopBot() {
        console.log('Stopping Enhanced Trading Bot...');
        this.isRunning = false;
    }

    // Pre-load historical data for all tokens
    async preloadHistoricalData(tokens, chains) {
        console.log('Pre-loading 90 days of historical data...');
        
        for (const chainId of chains) {
            const chainTokens = this.tokenDatabase.getTopTokensByChain(chainId, 20);
            
            for (const token of chainTokens) {
                if (token.coingeckoId) {
                    try {
                        // Load both hourly and 15-minute data
                        await this.historicalDataService.getHistoricalData(token.coingeckoId, '1h', 90);
                        await this.historicalDataService.getHistoricalData(token.coingeckoId, '15m', 90);
                        
                        console.log(`Loaded data for ${token.symbol} on chain ${chainId}`);
                    } catch (error) {
                        console.warn(`Failed to load data for ${token.symbol}:`, error.message);
                    }
                }
            }
        }
        
        console.log('Historical data pre-loading completed');
    }

    // Main trading loop with comprehensive analysis
    async tradingLoop(walletIds, tokens, chains) {
        while (this.isRunning) {
            try {
                // Analyze market conditions across all chains
                const marketAnalysis = await this.analyzeMarketConditions(chains);
                
                // Generate trading signals for each token
                for (const chainId of chains) {
                    const chainTokens = this.tokenDatabase.getTopTokensByChain(chainId, 10);
                    
                    for (const token of chainTokens) {
                        if (!token.coingeckoId) continue;
                        
                        // Get comprehensive analysis
                        const analysis = await this.analyzeToken(token, chainId);
                        
                        if (analysis.signals.length > 0) {
                            // Execute trades based on signals
                            await this.executeSignalBasedTrades(analysis, walletIds, chainId, marketAnalysis);
                        }
                    }
                }

                // Risk management check
                await this.performRiskManagement(walletIds);
                
                // Update performance metrics
                this.updatePerformanceMetrics();
                
                // Wait before next analysis cycle (15 minutes)
                await this.sleep(15 * 60 * 1000);

            } catch (error) {
                console.error('Trading loop error:', error);
                await this.sleep(60000); // Wait 1 minute before retry
            }
        }
    }

    // Comprehensive token analysis using 90-day data
    async analyzeToken(token, chainId) {
        try {
            // Get multi-timeframe data
            const hourlyData = await this.historicalDataService.getHistoricalData(token.coingeckoId, '1h', 90);
            const fifteenMinData = await this.historicalDataService.getHistoricalData(token.coingeckoId, '15m', 7); // Last 7 days for 15m

            // Validate data quality
            if (!this.validateDataQuality(hourlyData) || !this.validateDataQuality(fifteenMinData)) {
                return { signals: [], confidence: 0, analysis: null };
            }

            // Run all strategies
            const strategyResults = [];
            
            for (const [strategyName, strategy] of this.strategies) {
                if (strategy.enabled) {
                    const result = await strategy.analyze(hourlyData, fifteenMinData, token);
                    result.weight = strategy.weight;
                    strategyResults.push(result);
                }
            }

            // Combine strategy signals
            const combinedAnalysis = this.combineStrategySignals(strategyResults);
            
            return {
                token,
                chainId,
                signals: combinedAnalysis.signals,
                confidence: combinedAnalysis.confidence,
                analysis: {
                    hourlyData: hourlyData.slice(-24), // Last 24 hours
                    fifteenMinData: fifteenMinData.slice(-96), // Last 24 hours
                    strategies: strategyResults,
                    combined: combinedAnalysis
                }
            };

        } catch (error) {
            console.error(`Token analysis error for ${token.symbol}:`, error);
            return { signals: [], confidence: 0, analysis: null };
        }
    }

    // Momentum strategy analysis
    async analyzeMomentum(hourlyData, fifteenMinData, token) {
        const signals = [];
        let confidence = 0;

        // Analyze hourly momentum
        const hourlyMomentum = this.calculateMomentum(hourlyData, 24); // 24-hour momentum
        const weeklyMomentum = this.calculateMomentum(hourlyData, 168); // 7-day momentum

        // Analyze 15-minute momentum for short-term confirmation
        const shortMomentum = this.calculateMomentum(fifteenMinData, 96); // 24-hour in 15m

        // Multi-timeframe alignment
        if (hourlyMomentum > 0.02 && weeklyMomentum > 0.05 && shortMomentum > 0.01) {
            signals.push({
                type: 'BUY',
                strategy: 'momentum',
                reason: 'Strong multi-timeframe bullish momentum',
                strength: 0.8,
                timeframe: 'multi'
            });
            confidence += 0.8;
        } else if (hourlyMomentum < -0.02 && weeklyMomentum < -0.05 && shortMomentum < -0.01) {
            signals.push({
                type: 'SELL',
                strategy: 'momentum',
                reason: 'Strong multi-timeframe bearish momentum',
                strength: 0.8,
                timeframe: 'multi'
            });
            confidence += 0.8;
        }

        return { signals, confidence: Math.min(confidence, 1) };
    }

    // Mean reversion strategy
    async analyzeMeanReversion(hourlyData, fifteenMinData, token) {
        const signals = [];
        let confidence = 0;

        const latest = hourlyData[hourlyData.length - 1];
        
        // RSI-based mean reversion
        if (latest.rsi) {
            if (latest.rsi < 25) { // Extremely oversold
                signals.push({
                    type: 'BUY',
                    strategy: 'meanReversion',
                    reason: `Extremely oversold RSI: ${latest.rsi.toFixed(2)}`,
                    strength: 0.9,
                    rsi: latest.rsi
                });
                confidence += 0.9;
            } else if (latest.rsi > 75) { // Extremely overbought
                signals.push({
                    type: 'SELL',
                    strategy: 'meanReversion',
                    reason: `Extremely overbought RSI: ${latest.rsi.toFixed(2)}`,
                    strength: 0.9,
                    rsi: latest.rsi
                });
                confidence += 0.9;
            }
        }

        // Price distance from moving averages
        if (latest.sma50 && latest.close) {
            const deviation = (latest.close - latest.sma50) / latest.sma50;
            if (deviation < -0.15) { // 15% below 50-day MA
                signals.push({
                    type: 'BUY',
                    strategy: 'meanReversion',
                    reason: `Price 15%+ below 50-day MA`,
                    strength: 0.7,
                    deviation: deviation
                });
                confidence += 0.7;
            } else if (deviation > 0.15) { // 15% above 50-day MA
                signals.push({
                    type: 'SELL',
                    strategy: 'meanReversion',
                    reason: `Price 15%+ above 50-day MA`,
                    strength: 0.7,
                    deviation: deviation
                });
                confidence += 0.7;
            }
        }

        return { signals, confidence: Math.min(confidence, 1) };
    }

    // Breakout strategy using Bollinger Bands
    async analyzeBreakout(hourlyData, fifteenMinData, token) {
        const signals = [];
        let confidence = 0;

        const latest = hourlyData[hourlyData.length - 1];
        const previous = hourlyData[hourlyData.length - 2];

        if (latest.bollingerUpper && latest.bollingerLower && previous) {
            // Bollinger Band squeeze detection
            const bandWidth = (latest.bollingerUpper - latest.bollingerLower) / latest.bollingerMiddle;
            const avgBandWidth = this.calculateAverageBandWidth(hourlyData, 20);

            // Breakout from squeeze
            if (bandWidth < avgBandWidth * 0.5) {
                if (latest.close > latest.bollingerUpper && previous.close <= previous.bollingerUpper) {
                    signals.push({
                        type: 'BUY',
                        strategy: 'breakout',
                        reason: 'Bullish breakout from Bollinger squeeze',
                        strength: 0.8,
                        bandWidth: bandWidth
                    });
                    confidence += 0.8;
                } else if (latest.close < latest.bollingerLower && previous.close >= previous.bollingerLower) {
                    signals.push({
                        type: 'SELL',
                        strategy: 'breakout',
                        reason: 'Bearish breakdown from Bollinger squeeze',
                        strength: 0.8,
                        bandWidth: bandWidth
                    });
                    confidence += 0.8;
                }
            }
        }

        return { signals, confidence: Math.min(confidence, 1) };
    }

    // Volume surge strategy
    async analyzeVolumeSurge(hourlyData, fifteenMinData, token) {
        const signals = [];
        let confidence = 0;

        const latest = hourlyData[hourlyData.length - 1];
        
        if (latest.volumeRatio && latest.volumeRatio > this.config.analysisConfig.volumeThreshold) {
            // Volume surge with price movement
            const priceChange = this.calculatePriceChange(hourlyData, 6); // 6-hour change
            
            if (priceChange > 0.03 && latest.volumeRatio > 2) { // 3%+ price increase with 2x volume
                signals.push({
                    type: 'BUY',
                    strategy: 'volumeSurge',
                    reason: `Volume surge with ${(priceChange * 100).toFixed(1)}% price increase`,
                    strength: 0.7,
                    volumeRatio: latest.volumeRatio,
                    priceChange: priceChange
                });
                confidence += 0.7;
            } else if (priceChange < -0.03 && latest.volumeRatio > 2) { // 3%+ price decrease with 2x volume
                signals.push({
                    type: 'SELL',
                    strategy: 'volumeSurge',
                    reason: `Volume surge with ${(Math.abs(priceChange) * 100).toFixed(1)}% price decrease`,
                    strength: 0.7,
                    volumeRatio: latest.volumeRatio,
                    priceChange: priceChange
                });
                confidence += 0.7;
            }
        }

        return { signals, confidence: Math.min(confidence, 1) };
    }

    // Combine signals from all strategies
    combineStrategySignals(strategyResults) {
        let totalBuySignal = 0;
        let totalSellSignal = 0;
        let totalWeight = 0;
        const allSignals = [];

        strategyResults.forEach(result => {
            totalWeight += result.weight;
            
            result.signals.forEach(signal => {
                allSignals.push(signal);
                const weightedStrength = signal.strength * result.weight;
                
                if (signal.type === 'BUY') {
                    totalBuySignal += weightedStrength;
                } else if (signal.type === 'SELL') {
                    totalSellSignal += weightedStrength;
                }
            });
        });

        const netSignal = totalBuySignal - totalSellSignal;
        const confidence = Math.abs(netSignal) / totalWeight;

        return {
            signals: allSignals,
            netSignal,
            confidence,
            recommendation: netSignal > 0.1 ? 'BUY' : netSignal < -0.1 ? 'SELL' : 'HOLD',
            buyStrength: totalBuySignal,
            sellStrength: totalSellSignal
        };
    }

    // Execute trades based on signals
    async executeSignalBasedTrades(analysis, walletIds, chainId, marketAnalysis) {
        if (analysis.confidence < 0.6) {
            return; // Require high confidence for trades
        }

        const { token, signals } = analysis;
        const recommendation = analysis.analysis.combined.recommendation;

        if (recommendation === 'HOLD') {
            return;
        }

        try {
            // Select best wallet for trade
            const walletId = await this.selectOptimalWallet(walletIds, chainId);
            
            // Calculate position size
            const positionSize = this.calculatePositionSize(walletId, chainId, analysis.confidence);
            
            if (positionSize < 0.001) { // Minimum trade size
                return;
            }

            // Execute trade
            if (recommendation === 'BUY') {
                await this.executeBuyOrder(walletId, chainId, token, positionSize, analysis);
            } else if (recommendation === 'SELL') {
                await this.executeSellOrder(walletId, chainId, token, positionSize, analysis);
            }

        } catch (error) {
            console.error('Trade execution error:', error);
        }
    }

    // Execute buy order
    async executeBuyOrder(walletId, chainId, token, amount, analysis) {
        try {
            const baseToken = this.getBaseToken(chainId); // USDC or native token
            
            const tradeParams = {
                walletId,
                chainId,
                fromToken: baseToken.address,
                toToken: token.address,
                amount: ethers.utils.parseUnits(amount.toString(), baseToken.decimals).toString(),
                slippage: 1.5 // Slightly higher slippage for bot trades
            };

            const result = await this.productionTradingEngine.executeTrade(tradeParams);
            
            if (result.success) {
                console.log(`✅ Bot BUY executed: ${amount} ${baseToken.symbol} → ${token.symbol}`);
                console.log(`   Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
                console.log(`   Signals: ${analysis.signals.length}`);
                
                this.recordTrade('BUY', token, amount, result, analysis);
            }

        } catch (error) {
            console.error('Buy order error:', error);
        }
    }

    // Execute sell order
    async executeSellOrder(walletId, chainId, token, amount, analysis) {
        try {
            const baseToken = this.getBaseToken(chainId);
            
            const tradeParams = {
                walletId,
                chainId,
                fromToken: token.address,
                toToken: baseToken.address,
                amount: ethers.utils.parseUnits(amount.toString(), token.decimals).toString(),
                slippage: 1.5
            };

            const result = await this.productionTradingEngine.executeTrade(tradeParams);
            
            if (result.success) {
                console.log(`✅ Bot SELL executed: ${amount} ${token.symbol} → ${baseToken.symbol}`);
                console.log(`   Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
                console.log(`   Signals: ${analysis.signals.length}`);
                
                this.recordTrade('SELL', token, amount, result, analysis);
            }

        } catch (error) {
            console.error('Sell order error:', error);
        }
    }

    // Helper functions
    validateDataQuality(data) {
        return data && data.length >= this.config.dataRequirements.minDataPoints;
    }

    calculateMomentum(data, periods) {
        if (data.length < periods + 1) return 0;
        const current = data[data.length - 1].close;
        const past = data[data.length - 1 - periods].close;
        return (current - past) / past;
    }

    calculateAverageBandWidth(data, periods) {
        let sum = 0;
        let count = 0;
        
        for (let i = Math.max(0, data.length - periods); i < data.length; i++) {
            if (data[i].bollingerUpper && data[i].bollingerLower && data[i].bollingerMiddle) {
                sum += (data[i].bollingerUpper - data[i].bollingerLower) / data[i].bollingerMiddle;
                count++;
            }
        }
        
        return count > 0 ? sum / count : 0;
    }

    calculatePriceChange(data, periods) {
        if (data.length < periods + 1) return 0;
        const current = data[data.length - 1].close;
        const past = data[data.length - 1 - periods].close;
        return (current - past) / past;
    }

    async selectOptimalWallet(walletIds, chainId) {
        // Select wallet with highest balance for the chain
        let bestWallet = walletIds[0];
        let highestBalance = 0;

        for (const walletId of walletIds) {
            const balance = await this.multiWalletManager.getWalletValue(walletId, chainId);
            if (balance > highestBalance) {
                highestBalance = balance;
                bestWallet = walletId;
            }
        }

        return bestWallet;
    }

    calculatePositionSize(walletId, chainId, confidence) {
        // Position size based on confidence and risk management
        const baseSize = this.config.riskManagement.maxPositionSize;
        return baseSize * confidence * 0.1; // 10% of max position as example
    }

    getBaseToken(chainId) {
        const baseTokens = {
            1: { symbol: 'USDC', address: '0xA0b86a33E6441C41508e8e1dF82a12b6CBB9A0aA', decimals: 6 },
            56: { symbol: 'USDT', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
            137: { symbol: 'USDC', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6 },
            369: { symbol: 'WPLS', address: '0xA1077a294dDE1B09bB078844df40758a5D0f9a27', decimals: 18 },
            42161: { symbol: 'USDC', address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', decimals: 6 }
        };
        return baseTokens[chainId] || baseTokens[1];
    }

    recordTrade(type, token, amount, result, analysis) {
        this.performance.totalTrades++;
        // Additional trade recording logic here
    }

    async analyzeMarketConditions(chains) {
        // Market-wide analysis across all chains
        return { sentiment: 'neutral', volatility: 'medium' };
    }

    async performRiskManagement(walletIds) {
        // Risk management checks
    }

    updatePerformanceMetrics() {
        // Update bot performance metrics
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get bot status and performance
    getBotStatus() {
        return {
            isRunning: this.isRunning,
            performance: this.performance,
            config: this.config,
            strategiesEnabled: Array.from(this.strategies.entries())
                .filter(([_, strategy]) => strategy.enabled)
                .map(([name, strategy]) => ({ name: strategy.name, weight: strategy.weight }))
        };
    }
}