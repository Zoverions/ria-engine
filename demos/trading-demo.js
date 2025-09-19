const { MarketFractureIndex } = require('../core/math/MarketFractureIndex');
const { MarketStabilityMonitor } = require('../core/MarketStabilityMonitor');
const { FinancialAntifragileManager } = require('../antifragile/FinancialAntifragileManager');

class TradingPlatformDemo {
    constructor(config = {}) {
        this.config = {
            simulationDuration: 60000, // 60 seconds
            dataPoints: 1000,
            assets: ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'BTC', 'ETH'],
            updateInterval: 100, // 100ms between data points
            crashScenarios: 2,
            ...config
        };

        this.mfiCalculator = new MarketFractureIndex();
        this.monitor = new MarketStabilityMonitor();
        this.antifragileManager = new FinancialAntifragileManager();

        this.simulationData = {
            marketData: [],
            mfiHistory: [],
            interventions: [],
            regimeTransitions: [],
            learningMetrics: []
        };

        this.isRunning = false;
        this.startTime = null;
        this.crashCounter = 0;
    }

    async initialize() {
        console.log('🚀 Initializing Trading Platform Demo...');

        // Setup event handlers
        this.setupEventHandlers();

        // Initialize components
        await this.antifragileManager.initialize();

        console.log('✅ Trading Platform Demo initialized');
        console.log(`📊 Simulating ${this.config.assets.length} assets for ${this.config.simulationDuration / 1000}s`);
    }

    setupEventHandlers() {
        // MFI Calculator events
        this.mfiCalculator.on('mfiCalculated', (data) => {
            this.handleMfiUpdate(data);
        });

        // Monitor events
        this.monitor.on('interventionTriggered', (data) => {
            this.handleIntervention(data);
        });

        this.monitor.on('marketStateUpdate', (data) => {
            this.handleMarketStateUpdate(data);
        });

        // Antifragile Manager events
        this.antifragileManager.on('regimeTransition', (data) => {
            this.handleRegimeTransition(data);
        });

        this.antifragileManager.on('crisisProcessed', (data) => {
            this.handleCrisisProcessed(data);
        });

        this.antifragileManager.on('marketFrameProcessed', (data) => {
            this.handleLearningUpdate(data);
        });
    }

    async startDemo() {
        console.log('\n🎯 Starting Trading Platform Demonstration...');
        console.log('=' .repeat(60));

        this.isRunning = true;
        this.startTime = Date.now();

    // Start the monitoring subsystems
    await this.monitor.startMonitoring();

    // Start the simulation
        await this.runSimulation();

        // Generate final report
        this.generateFinalReport();
    }

    async runSimulation() {
        const endTime = this.startTime + this.config.simulationDuration;

        for (let i = 0; i < this.config.dataPoints && this.isRunning; i++) {
            const currentTime = Date.now();

            if (currentTime >= endTime) break;

            // Generate market data
            const marketData = this.generateMarketData(i);

            // Add to MFI calculator
            this.mfiCalculator.addMarketData(marketData);

            // Add to monitor
            this.monitor.addMarketData(marketData);

            // Store simulation data
            this.simulationData.marketData.push({
                timestamp: currentTime,
                ...marketData
            });

            // Small delay between data points
            await this.delay(this.config.updateInterval);
        }

        this.isRunning = false;
    }

    generateMarketData(dataPoint) {
        const timestamp = Date.now();
        const marketData = {
            price: {},
            volume: {},
            orderbook: {}
        };

        // Base market conditions
        let baseTrend = Math.sin(dataPoint * 0.01) * 0.02; // Slow market trend
        let baseVolatility = 0.01; // Base volatility

        // Introduce crash scenarios
        if (this.shouldTriggerCrash(dataPoint)) {
            baseTrend = -0.15; // Sharp downward trend
            baseVolatility = 0.08; // High volatility
            this.crashCounter++;
            console.log(`💥 Market crash scenario ${this.crashCounter} triggered!`);
        }

        // Generate data for each asset
        this.config.assets.forEach(asset => {
            const assetSpecificTrend = this.generateAssetTrend(asset, dataPoint);
            const combinedTrend = baseTrend + assetSpecificTrend;

            // Generate price movement
            const priceChange = combinedTrend + (Math.random() - 0.5) * baseVolatility;
            const lastPrice = this.getLastPrice(asset) || this.getInitialPrice(asset);
            const newPrice = lastPrice * (1 + priceChange);

            marketData.price[asset] = newPrice;

            // Generate volume (higher during volatile periods)
            const baseVolume = this.getBaseVolume(asset);
            const volumeMultiplier = 1 + (baseVolatility * 10);
            marketData.volume[asset] = baseVolume * volumeMultiplier * (0.5 + Math.random());

            // Generate order book data
            marketData.orderbook[asset] = this.generateOrderBook(newPrice, baseVolatility);
        });

        return marketData;
    }

    shouldTriggerCrash(dataPoint) {
        // Trigger crashes at specific points in the simulation
        const crashPoints = [
            Math.floor(this.config.dataPoints * 0.3),
            Math.floor(this.config.dataPoints * 0.7)
        ];

        return crashPoints.includes(dataPoint) && this.crashCounter < this.config.crashScenarios;
    }

    generateAssetTrend(asset, dataPoint) {
        // Each asset has its own trend characteristics
        const assetTrends = {
            'AAPL': Math.sin(dataPoint * 0.005) * 0.01,
            'GOOGL': Math.cos(dataPoint * 0.007) * 0.008,
            'MSFT': Math.sin(dataPoint * 0.006) * 0.009,
            'TSLA': Math.sin(dataPoint * 0.008) * 0.015, // More volatile
            'BTC': Math.sin(dataPoint * 0.01) * 0.02, // High volatility
            'ETH': Math.sin(dataPoint * 0.009) * 0.018
        };

        return assetTrends[asset] || 0;
    }

    getLastPrice(asset) {
        if (this.simulationData.marketData.length === 0) return null;

        const lastData = this.simulationData.marketData[this.simulationData.marketData.length - 1];
        return lastData.price[asset];
    }

    getInitialPrice(asset) {
        const initialPrices = {
            'AAPL': 150,
            'GOOGL': 2800,
            'MSFT': 300,
            'TSLA': 250,
            'BTC': 45000,
            'ETH': 3000
        };

        return initialPrices[asset] || 100;
    }

    getBaseVolume(asset) {
        const baseVolumes = {
            'AAPL': 1000000,
            'GOOGL': 500000,
            'MSFT': 800000,
            'TSLA': 1500000,
            'BTC': 20000,
            'ETH': 15000
        };

        return baseVolumes[asset] || 100000;
    }

    generateOrderBook(midPrice, volatility) {
        const spread = midPrice * volatility * 0.001; // Bid-ask spread
        const depth = 5; // Order book depth

        const bids = [];
        const asks = [];

        for (let i = 1; i <= depth; i++) {
            // Generate bid orders (below mid price)
            const bidPrice = midPrice - (spread * i * 0.5);
            const bidVolume = Math.random() * 1000;
            bids.push({ price: bidPrice, volume: bidVolume });

            // Generate ask orders (above mid price)
            const askPrice = midPrice + (spread * i * 0.5);
            const askVolume = Math.random() * 1000;
            asks.push({ price: askPrice, volume: askVolume });
        }

        return { bids, asks, spread };
    }

    handleMfiUpdate(data) {
        const { mfi, components } = data;

        this.simulationData.mfiHistory.push({
            timestamp: Date.now(),
            mfi,
            components
        });

        // Display MFI update
        const elapsed = (Date.now() - this.startTime) / 1000;
        console.log(`⏱️  ${elapsed.toFixed(1)}s | MFI: ${(mfi * 100).toFixed(2)}% | Components: ${Object.keys(components).length} assets`);

        // Show high-risk assets
        if (mfi > 0.6) {
            const highRiskAssets = Object.entries(components)
                .filter(([_, data]) => data.spectralSlope < -0.5)
                .map(([asset]) => asset);

            if (highRiskAssets.length > 0) {
                console.log(`⚠️  High-risk assets: ${highRiskAssets.join(', ')}`);
            }
        }
    }

    handleIntervention(data) {
        const { interventionId, level, intervention, mfiData } = data;

        this.simulationData.interventions.push({
            timestamp: Date.now(),
            ...data
        });

        console.log(`🚨 ${level.toUpperCase()} INTERVENTION TRIGGERED (MFI: ${(mfiData.mfi * 100).toFixed(2)}%)`);
        console.log(`   Actions: ${intervention.actions.map(a => a.action).join(', ')}`);

        // Show intervention details
        intervention.actions.forEach(action => {
            console.log(`   • ${action.action}: ${action.reason}`);
        });
    }

    handleMarketStateUpdate(data) {
        const { mfi, interventionLevel, riskMetrics } = data;

        if (interventionLevel) {
            console.log(`📊 Market State: ${interventionLevel} risk | Drawdown: ${(riskMetrics.drawdown * 100).toFixed(2)}% | Volatility: ${(riskMetrics.volatility * 100).toFixed(2)}%`);
        }
    }

    handleRegimeTransition(data) {
        const { from, to, timestamp } = data;

        this.simulationData.regimeTransitions.push(data);

        const elapsed = (timestamp - this.startTime) / 1000;
        console.log(`📈 ${elapsed.toFixed(1)}s | Regime Transition: ${from} → ${to}`);
    }

    handleCrisisProcessed(data) {
        const { crisisId, regime, timestamp } = data;

        const elapsed = (timestamp - this.startTime) / 1000;
        console.log(`🚨 ${elapsed.toFixed(1)}s | Crisis ${crisisId} processed in ${regime} regime`);
    }

    handleLearningUpdate(data) {
        const { learningMetrics } = data;

        this.simulationData.learningMetrics.push({
            timestamp: Date.now(),
            ...learningMetrics
        });
    }

    generateFinalReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📋 TRADING PLATFORM DEMO - FINAL REPORT');
        console.log('='.repeat(60));

        // Simulation summary
        const duration = (Date.now() - this.startTime) / 1000;
        console.log(`\n⏱️  Simulation Duration: ${duration.toFixed(1)} seconds`);
        console.log(`📊 Data Points Generated: ${this.simulationData.marketData.length}`);
        console.log(`🚨 Crashes Simulated: ${this.crashCounter}`);

        // MFI Statistics
        if (this.simulationData.mfiHistory.length > 0) {
            const mfiValues = this.simulationData.mfiHistory.map(h => h.mfi);
            const avgMfi = mfiValues.reduce((sum, mfi) => sum + mfi, 0) / mfiValues.length;
            const maxMfi = Math.max(...mfiValues);
            const minMfi = Math.min(...mfiValues);

            console.log(`\n📈 MFI Statistics:`);
            console.log(`   Average MFI: ${(avgMfi * 100).toFixed(2)}%`);
            console.log(`   Peak MFI: ${(maxMfi * 100).toFixed(2)}%`);
            console.log(`   Minimum MFI: ${(minMfi * 100).toFixed(2)}%`);
        }

        // Intervention Summary
        console.log(`\n🚨 Interventions Triggered: ${this.simulationData.interventions.length}`);
        const interventionCounts = {};
        this.simulationData.interventions.forEach(int => {
            interventionCounts[int.level] = (interventionCounts[int.level] || 0) + 1;
        });

        Object.entries(interventionCounts).forEach(([level, count]) => {
            console.log(`   ${level}: ${count} interventions`);
        });

        // Regime Transitions
        console.log(`\n📈 Regime Transitions: ${this.simulationData.regimeTransitions.length}`);
        this.simulationData.regimeTransitions.forEach(transition => {
            const elapsed = (transition.timestamp - this.startTime) / 1000;
            console.log(`   ${elapsed.toFixed(1)}s: ${transition.from} → ${transition.to}`);
        });

        // Learning Metrics
        if (this.simulationData.learningMetrics.length > 0) {
            const latestMetrics = this.simulationData.learningMetrics[this.simulationData.learningMetrics.length - 1];
            console.log(`\n🧠 Final Learning Metrics:`);
            console.log(`   Prediction Accuracy: ${(latestMetrics.predictionAccuracy * 100).toFixed(1)}%`);
            console.log(`   Intervention Success: ${(latestMetrics.interventionSuccess * 100).toFixed(1)}%`);
            console.log(`   Adaptation Speed: ${(latestMetrics.adaptationSpeed * 100).toFixed(1)}%`);
        }

        // System Performance
        const marketState = this.monitor.getMarketState();
        console.log(`\n⚡ System Performance:`);
        console.log(`   Active Interventions: ${marketState.activeInterventions.length}`);
        console.log(`   Risk Metrics - Drawdown: ${(marketState.riskMetrics.drawdown * 100).toFixed(2)}%`);
        console.log(`   Risk Metrics - Volatility: ${(marketState.riskMetrics.volatility * 100).toFixed(2)}%`);

        console.log('\n✅ Trading Platform Demo completed successfully!');
        console.log('=' .repeat(60));
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async stopDemo() {
        console.log('\n🛑 Stopping Trading Platform Demo...');
        this.isRunning = false;

    // Cleanup
    await this.monitor.stopMonitoring();

        console.log('✅ Demo stopped');
    }

    getSimulationData() {
        return {
            ...this.simulationData,
            config: this.config,
            duration: Date.now() - this.startTime,
            isRunning: this.isRunning
        };
    }
}

// Export for use in other modules
module.exports = { TradingPlatformDemo };

// If run directly, start the demo
if (require.main === module) {
    const demo = new TradingPlatformDemo();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n⏹️  Received shutdown signal...');
        await demo.stopDemo();
        process.exit(0);
    });

    // Start the demo
    demo.initialize().then(() => {
        demo.startDemo();
    }).catch(error => {
        console.error('❌ Demo initialization failed:', error);
        process.exit(1);
    });
}