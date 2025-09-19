const EventEmitter = require('events');
const { MarketFractureIndex } = require('./math/MarketFractureIndex');
const { FinancialAntifragileManager } = require('../antifragile/FinancialAntifragileManager');

class MarketStabilityMonitor extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            mfiThresholds: {
                gentle: 0.3,      // Start hedging
                moderate: 0.6,    // Generate alerts
                aggressive: 0.8   // Reduce positions
            },
            interventionCooldown: 30000, // 30 seconds between interventions
            maxPositions: 100,
            riskLimits: {
                maxDrawdown: 0.15,
                maxVolatility: 0.25
            },
            ...config
        };

        this.mfiCalculator = new MarketFractureIndex();
        this.antifragileManager = new FinancialAntifragileManager();
        this.activeInterventions = new Map();
        this.marketState = {
            currentMFI: 0,
            positions: new Map(),
            riskMetrics: {
                drawdown: 0,
                volatility: 0,
                correlation: 0
            },
            lastIntervention: null
        };

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.mfiCalculator.on('mfiCalculated', (data) => {
            this.processMFIUpdate(data);
        });

        this.antifragileManager.on('interventionLearned', (data) => {
            this.applyLearnedIntervention(data);
        });
    }

    async startMonitoring() {
        console.log('🚀 Starting Market Stability Monitoring...');

        // Initialize market data stream
        this.mfiCalculator.startProcessing();

        // Start antifragile learning
        await this.antifragileManager.initialize();

        this.emit('monitoringStarted', {
            timestamp: Date.now(),
            config: this.config
        });

        console.log('✅ Market Stability Monitor active');
    }

    async stopMonitoring() {
        console.log('🛑 Stopping Market Stability Monitoring...');

        this.mfiCalculator.stopProcessing();
        await this.antifragileManager.shutdown();

        this.emit('monitoringStopped', {
            timestamp: Date.now(),
            finalState: this.marketState
        });

        console.log('✅ Market Stability Monitor stopped');
    }

    processMFIUpdate(mfiData) {
        const { mfi, components, marketData } = mfiData;
        this.marketState.currentMFI = mfi;

        // Update risk metrics
        this.updateRiskMetrics(marketData);

        // Check intervention thresholds
        const interventionLevel = this.determineInterventionLevel(mfi);

        if (interventionLevel && this.shouldTriggerIntervention()) {
            this.triggerIntervention(interventionLevel, mfiData);
        }

        // Emit market state update
        this.emit('marketStateUpdate', {
            timestamp: Date.now(),
            mfi,
            interventionLevel,
            riskMetrics: this.marketState.riskMetrics,
            activeInterventions: Array.from(this.activeInterventions.keys())
        });
    }

    determineInterventionLevel(mfi) {
        if (mfi >= this.config.mfiThresholds.aggressive) {
            return 'aggressive';
        } else if (mfi >= this.config.mfiThresholds.moderate) {
            return 'moderate';
        } else if (mfi >= this.config.mfiThresholds.gentle) {
            return 'gentle';
        }
        return null;
    }

    shouldTriggerIntervention() {
        const now = Date.now();
        const lastIntervention = this.marketState.lastIntervention;

        if (!lastIntervention) return true;

        const timeSinceLast = now - lastIntervention;
        return timeSinceLast >= this.config.interventionCooldown;
    }

    triggerIntervention(level, mfiData) {
        const interventionId = `intervention_${Date.now()}_${level}`;

        console.log(`🚨 Triggering ${level} intervention (MFI: ${mfiData.mfi.toFixed(4)})`);

        let intervention;

        switch (level) {
            case 'gentle':
                intervention = this.createGentleIntervention(mfiData);
                break;
            case 'moderate':
                intervention = this.createModerateIntervention(mfiData);
                break;
            case 'aggressive':
                intervention = this.createAggressiveIntervention(mfiData);
                break;
        }

        if (intervention) {
            this.activeInterventions.set(interventionId, {
                ...intervention,
                id: interventionId,
                timestamp: Date.now(),
                level,
                mfiAtTrigger: mfiData.mfi
            });

            this.marketState.lastIntervention = Date.now();

            // Send to antifragile learning
            this.antifragileManager.processMarketFrame(mfiData);

            this.emit('interventionTriggered', {
                interventionId,
                level,
                intervention,
                mfiData
            });
        }
    }

    createGentleIntervention(mfiData) {
        const { components } = mfiData;

        // Identify assets with highest fracture risk
        const highRiskAssets = this.identifyHighRiskAssets(components);

        return {
            type: 'hedging',
            actions: [
                {
                    action: 'hedge_positions',
                    assets: highRiskAssets,
                    hedgeRatio: 0.2, // 20% hedge
                    duration: '1h',
                    reason: 'Preventive hedging against market fracture'
                },
                {
                    action: 'diversify_exposure',
                    targetDiversification: 0.15, // Reduce concentration by 15%
                    reason: 'Reduce portfolio concentration risk'
                }
            ],
            expectedImpact: {
                volatilityReduction: 0.1,
                drawdownProtection: 0.05
            }
        };
    }

    createModerateIntervention(mfiData) {
        const { components } = mfiData;

        // Generate AI-powered trading signals
        const signals = this.generateTradingSignals(components);

        return {
            type: 'generative_alerts',
            actions: [
                {
                    action: 'generate_signals',
                    signals: signals,
                    confidence: this.calculateSignalConfidence(components),
                    reason: 'AI-generated trading signals for risk management'
                },
                {
                    action: 'adjust_position_limits',
                    newLimits: {
                        maxPositionSize: this.config.maxPositions * 0.7,
                        maxVolatility: this.config.riskLimits.maxVolatility * 0.8
                    },
                    reason: 'Reduce position sizes to manage elevated risk'
                },
                {
                    action: 'increase_monitoring',
                    frequency: '5s', // Increase monitoring frequency
                    reason: 'Enhanced monitoring during moderate risk period'
                }
            ],
            expectedImpact: {
                signalAccuracy: 0.75,
                riskReduction: 0.2
            }
        };
    }

    createAggressiveIntervention(mfiData) {
        const { components } = mfiData;

        // Identify critical risk assets
        const criticalAssets = this.identifyCriticalRiskAssets(components);

        return {
            type: 'position_reduction',
            actions: [
                {
                    action: 'reduce_positions',
                    assets: criticalAssets,
                    reductionPercentage: 0.5, // Reduce by 50%
                    reason: 'Aggressive position reduction to prevent catastrophic losses'
                },
                {
                    action: 'stop_loss_activation',
                    triggerLevel: 0.1, // 10% stop loss
                    assets: criticalAssets,
                    reason: 'Activate stop-loss orders for high-risk positions'
                },
                {
                    action: 'circuit_breaker',
                    triggerMFI: this.config.mfiThresholds.aggressive,
                    operation: 'halt_trading',
                    duration: '15m',
                    reason: 'Temporary trading halt to prevent cascade effects'
                },
                {
                    action: 'risk_isolation',
                    isolateAssets: criticalAssets,
                    reason: 'Isolate high-risk assets from portfolio'
                }
            ],
            expectedImpact: {
                lossPrevention: 0.4,
                portfolioProtection: 0.6
            }
        };
    }

    identifyHighRiskAssets(components) {
        // Analyze spectral components to identify assets with highest fracture risk
        const assetRisks = new Map();

        Object.entries(components).forEach(([asset, data]) => {
            const riskScore = this.calculateAssetRiskScore(data);
            assetRisks.set(asset, riskScore);
        });

        // Return top 20% highest risk assets
        const sortedAssets = Array.from(assetRisks.entries())
            .sort((a, b) => b[1] - a[1]);

        const topCount = Math.max(1, Math.floor(sortedAssets.length * 0.2));
        return sortedAssets.slice(0, topCount).map(([asset]) => asset);
    }

    identifyCriticalRiskAssets(components) {
        // More aggressive filtering for critical risks
        const highRiskAssets = this.identifyHighRiskAssets(components);

        // Filter for assets with extreme risk indicators
        return highRiskAssets.filter(asset => {
            const data = components[asset];
            return data.spectralSlope < -0.8 || // Very steep negative slope
                   data.orderImbalance > 0.7 || // Extreme order imbalance
                   data.volumeVelocity < -0.6;  // Sharp volume decline
        });
    }

    calculateAssetRiskScore(data) {
        // Combine multiple risk indicators
        const spectralRisk = Math.abs(data.spectralSlope) * 0.4;
        const imbalanceRisk = data.orderImbalance * 0.3;
        const volumeRisk = Math.abs(data.volumeVelocity) * 0.3;

        return spectralRisk + imbalanceRisk + volumeRisk;
    }

    generateTradingSignals(components) {
        const signals = [];

        Object.entries(components).forEach(([asset, data]) => {
            const signal = this.analyzeAssetSignal(asset, data);
            if (signal) {
                signals.push(signal);
            }
        });

        return signals;
    }

    analyzeAssetSignal(asset, data) {
        // Generate trading signal based on fracture components
        const signalStrength = this.calculateSignalStrength(data);

        if (signalStrength > 0.7) {
            return {
                asset,
                signal: data.spectralSlope < 0 ? 'SHORT' : 'LONG',
                strength: signalStrength,
                timeframe: '15m',
                reason: `Fracture analysis indicates ${data.spectralSlope < 0 ? 'downward' : 'upward'} momentum`
            };
        }

        return null;
    }

    calculateSignalStrength(data) {
        // Calculate signal confidence based on component alignment
        const spectralConfidence = Math.abs(data.spectralSlope);
        const autocorrelationConfidence = data.autocorrelation;
        const imbalanceConfidence = data.orderImbalance;

        return (spectralConfidence * 0.5 + autocorrelationConfidence * 0.3 + imbalanceConfidence * 0.2);
    }

    calculateSignalConfidence(components) {
        // Calculate overall confidence in generated signals
        const signalStrengths = Object.values(components)
            .map(data => this.calculateSignalStrength(data))
            .filter(strength => strength > 0.5);

        if (signalStrengths.length === 0) return 0;

        const avgStrength = signalStrengths.reduce((sum, s) => sum + s, 0) / signalStrengths.length;
        const consistency = signalStrengths.filter(s => s > avgStrength * 0.8).length / signalStrengths.length;

        return avgStrength * consistency;
    }

    updateRiskMetrics(marketData) {
        // Update portfolio risk metrics
        this.marketState.riskMetrics = {
            drawdown: this.calculateDrawdown(marketData),
            volatility: this.calculateVolatility(marketData),
            correlation: this.calculateCorrelation(marketData)
        };
    }

    calculateDrawdown(marketData) {
        // Simplified drawdown calculation
        if (!marketData.price) return 0;

        const prices = Object.values(marketData.price);
        if (prices.length < 2) return 0;

        const peak = Math.max(...prices);
        const current = prices[prices.length - 1];

        return Math.max(0, (peak - current) / peak);
    }

    calculateVolatility(marketData) {
        // Simplified volatility calculation
        if (!marketData.price) return 0;

        const prices = Object.values(marketData.price);
        if (prices.length < 2) return 0;

        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i-1]) / prices[i-1]);
        }

        const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;

        return Math.sqrt(variance);
    }

    calculateCorrelation(marketData) {
        // Simplified correlation calculation between assets
        if (!marketData.price) return 0;

        const assets = Object.keys(marketData.price);
        if (assets.length < 2) return 0;

        // In this simplified tick-based input, prices are scalars per asset.
        // Without a per-asset time series history, return 0 to avoid runtime errors.
        const v1 = marketData.price[assets[0]];
        const v2 = marketData.price[assets[1]];
        if (typeof v1 !== 'number' || typeof v2 !== 'number') return 0;
        return 0;
    }

    applyLearnedIntervention(learnedData) {
        // Apply insights from antifragile learning to improve interventions
        const { interventionType, effectiveness, adjustments } = learnedData;

        console.log(`🧠 Applying learned intervention: ${interventionType} (effectiveness: ${(effectiveness * 100).toFixed(1)}%)`);

        // Update intervention parameters based on learning
        if (adjustments.thresholds) {
            this.config.mfiThresholds = {
                ...this.config.mfiThresholds,
                ...adjustments.thresholds
            };
        }

        if (adjustments.cooldown) {
            this.config.interventionCooldown = adjustments.cooldown;
        }

        this.emit('interventionLearned', learnedData);
    }

    addMarketData(marketData) {
        this.mfiCalculator.addMarketData(marketData);
    }

    getMarketState() {
        return {
            ...this.marketState,
            activeInterventions: Array.from(this.activeInterventions.values()),
            config: this.config
        };
    }

    getInterventionHistory() {
        return Array.from(this.activeInterventions.values())
            .sort((a, b) => b.timestamp - a.timestamp);
    }

    clearIntervention(interventionId) {
        if (this.activeInterventions.has(interventionId)) {
            const intervention = this.activeInterventions.get(interventionId);
            this.activeInterventions.delete(interventionId);

            this.emit('interventionCleared', {
                interventionId,
                intervention,
                timestamp: Date.now()
            });

            return true;
        }
        return false;
    }
}

module.exports = { MarketStabilityMonitor };