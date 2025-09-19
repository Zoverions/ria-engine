const EventEmitter = require('events');
const { AntifragileManager } = require('./AntifragileManager');

class FinancialAntifragileManager extends AntifragileManager {
    constructor(config = {}) {
        super({
            learningRate: 0.01,
            memorySize: 1000,
            adaptationThreshold: 0.1,
            crisisDetectionThreshold: 0.8,
            ...config
        });

        this.financialConfig = {
            marketRegimes: ['bull', 'bear', 'sideways', 'crash'],
            assetClasses: ['equity', 'bond', 'commodity', 'crypto', 'forex'],
            timeframes: ['1m', '5m', '15m', '1h', '1d'],
            riskFactors: ['volatility', 'liquidity', 'correlation', 'momentum'],
            ...config.financialConfig
        };

        this.marketMemory = {
            crisisPatterns: new Map(),
            assetBehaviors: new Map(),
            regimeTransitions: new Map(),
            interventionEffectiveness: new Map(),
            predictiveModels: new Map()
        };

        this.currentRegime = 'sideways';
        this.crisisCounter = 0;
        this.learningMetrics = {
            predictionAccuracy: 0,
            interventionSuccess: 0,
            adaptationSpeed: 0
        };
    }

    async initialize() {
        await super.initialize();

        // Initialize financial-specific memory structures
        this.initializeMarketMemory();

        console.log('🏦 Financial Antifragile Manager initialized');
    }

    initializeMarketMemory() {
        // Initialize crisis pattern recognition
        this.financialConfig.marketRegimes.forEach(regime => {
            this.marketMemory.crisisPatterns.set(regime, {
                patterns: [],
                successRate: 0,
                avgDuration: 0,
                recoveryTime: 0
            });
        });

        // Initialize asset-specific behaviors
        this.financialConfig.assetClasses.forEach(assetClass => {
            this.marketMemory.assetBehaviors.set(assetClass, {
                volatilityProfile: [],
                correlationMatrix: new Map(),
                crisisSensitivity: 0,
                recoveryPatterns: []
            });
        });

        // Initialize intervention tracking
        ['gentle', 'moderate', 'aggressive'].forEach(level => {
            this.marketMemory.interventionEffectiveness.set(level, {
                successCount: 0,
                totalCount: 0,
                avgEffectiveness: 0,
                contextPatterns: []
            });
        });
    }

    async processMarketFrame(marketData) {
        const { mfi, components, marketData: rawData } = marketData;

        // Detect market regime
        const regime = this.detectMarketRegime(marketData);
        this.updateRegimeTransition(regime);

        // Process crisis patterns if MFI indicates high risk
        if (mfi >= this.config.crisisDetectionThreshold) {
            await this.processCrisisEvent(marketData);
        }

        // Update asset behaviors
        this.updateAssetBehaviors(components);

        // Learn from intervention outcomes
        this.learnFromInterventions(marketData);

        // Generate predictive insights
        const insights = this.generatePredictiveInsights(marketData);

        // Call parent class processing
        await super.processFrame({
            ...marketData,
            regime,
            insights,
            financialContext: this.getFinancialContext()
        });

        this.emit('marketFrameProcessed', {
            timestamp: Date.now(),
            regime,
            mfi,
            insights,
            learningMetrics: this.learningMetrics
        });
    }

    detectMarketRegime(marketData) {
        const { components } = marketData;

        // Analyze multiple indicators to determine market regime
        const spectralSlope = this.calculateAverageSpectralSlope(components);
        const volatility = this.calculateMarketVolatility(components);
        const momentum = this.calculateMarketMomentum(components);

        // Regime classification logic
        if (spectralSlope < -0.7 && volatility > 0.8) {
            return 'crash';
        } else if (spectralSlope < -0.3 && momentum < -0.5) {
            return 'bear';
        } else if (spectralSlope > 0.3 && momentum > 0.5) {
            return 'bull';
        } else {
            return 'sideways';
        }
    }

    calculateAverageSpectralSlope(components) {
        const slopes = Object.values(components)
            .map(data => data.spectralSlope)
            .filter(slope => !isNaN(slope));

        return slopes.length > 0 ?
            slopes.reduce((sum, slope) => sum + slope, 0) / slopes.length : 0;
    }

    calculateMarketVolatility(components) {
        const volatilities = Object.values(components)
            .map(data => Math.abs(data.volumeVelocity || 0))
            .filter(vol => !isNaN(vol));

        return volatilities.length > 0 ?
            volatilities.reduce((sum, vol) => sum + vol, 0) / volatilities.length : 0;
    }

    calculateMarketMomentum(components) {
        const momentums = Object.values(components)
            .map(data => data.autocorrelation || 0)
            .filter(mom => !isNaN(mom));

        return momentums.length > 0 ?
            momentums.reduce((sum, mom) => sum + mom, 0) / momentums.length : 0;
    }

    updateRegimeTransition(newRegime) {
        if (newRegime !== this.currentRegime) {
            const prior = this.currentRegime;
            const transitionKey = `${prior}_to_${newRegime}`;
            const transitionCount = this.marketMemory.regimeTransitions.get(transitionKey) || 0;
            this.marketMemory.regimeTransitions.set(transitionKey, transitionCount + 1);

            console.log(`📊 Market regime transition: ${prior} → ${newRegime}`);
            this.currentRegime = newRegime;

            this.emit('regimeTransition', {
                from: prior,
                to: newRegime,
                timestamp: Date.now()
            });
        }
    }

    async processCrisisEvent(marketData) {
        this.crisisCounter++;

        const crisisPattern = this.extractCrisisPattern(marketData);
        const regime = this.currentRegime;

        // Store crisis pattern
        const regimePatterns = this.marketMemory.crisisPatterns.get(regime);
        regimePatterns.patterns.push({
            ...crisisPattern,
            timestamp: Date.now(),
            crisisId: this.crisisCounter
        });

        // Keep only recent patterns
        if (regimePatterns.patterns.length > 50) {
            regimePatterns.patterns = regimePatterns.patterns.slice(-50);
        }

        // Update success metrics
        this.updateCrisisMetrics(regime);

        console.log(`🚨 Crisis event processed (ID: ${this.crisisCounter}, Regime: ${regime})`);

        this.emit('crisisProcessed', {
            crisisId: this.crisisCounter,
            pattern: crisisPattern,
            regime,
            timestamp: Date.now()
        });
    }

    extractCrisisPattern(marketData) {
        const { components } = marketData;

        return {
            spectralSignature: this.extractSpectralSignature(components),
            volatilityProfile: this.extractVolatilityProfile(components),
            correlationBreakdown: this.extractCorrelationBreakdown(components),
            liquidityStress: this.extractLiquidityStress(components),
            momentumReversal: this.extractMomentumReversal(components)
        };
    }

    extractSpectralSignature(components) {
        const spectralData = Object.values(components).map(data => ({
            slope: data.spectralSlope,
            power: data.spectralPower || 0,
            frequency: data.dominantFrequency || 0
        }));

        return {
            avgSlope: spectralData.reduce((sum, d) => sum + d.slope, 0) / spectralData.length,
            powerDistribution: spectralData.map(d => d.power),
            dominantFrequencies: spectralData.map(d => d.frequency)
        };
    }

    extractVolatilityProfile(components) {
        const volatilityData = Object.values(components).map(data => ({
            level: Math.abs(data.volumeVelocity || 0),
            skew: data.volatilitySkew || 0,
            kurtosis: data.volatilityKurtosis || 0
        }));

        return {
            avgVolatility: volatilityData.reduce((sum, d) => sum + d.level, 0) / volatilityData.length,
            volatilitySkew: volatilityData.reduce((sum, d) => sum + d.skew, 0) / volatilityData.length,
            volatilityKurtosis: volatilityData.reduce((sum, d) => sum + d.kurtosis, 0) / volatilityData.length
        };
    }

    extractCorrelationBreakdown(components) {
        const assets = Object.keys(components);
        const correlations = [];

        for (let i = 0; i < assets.length; i++) {
            for (let j = i + 1; j < assets.length; j++) {
                const asset1 = assets[i];
                const asset2 = assets[j];

                const correlation = this.calculateAssetCorrelation(
                    components[asset1],
                    components[asset2]
                );
                correlations.push(correlation);
            }
        }

        return {
            avgCorrelation: correlations.reduce((sum, c) => sum + c, 0) / correlations.length,
            correlationVariance: this.calculateVariance(correlations),
            breakdownSeverity: 1 - Math.abs(correlations.reduce((sum, c) => sum + c, 0) / correlations.length)
        };
    }

    extractLiquidityStress(components) {
        const liquidityData = Object.values(components).map(data => ({
            orderImbalance: data.orderImbalance,
            spread: data.bidAskSpread || 0,
            volume: data.volume || 0
        }));

        return {
            avgImbalance: liquidityData.reduce((sum, d) => sum + d.orderImbalance, 0) / liquidityData.length,
            avgSpread: liquidityData.reduce((sum, d) => sum + d.spread, 0) / liquidityData.length,
            volumeStress: liquidityData.filter(d => d.volume < 0.3).length / liquidityData.length
        };
    }

    extractMomentumReversal(components) {
        const momentumData = Object.values(components).map(data => ({
            autocorrelation: data.autocorrelation,
            trendStrength: Math.abs(data.spectralSlope),
            reversalSignal: data.reversalSignal || 0
        }));

        return {
            avgAutocorrelation: momentumData.reduce((sum, d) => sum + d.autocorrelation, 0) / momentumData.length,
            trendReversalCount: momentumData.filter(d => d.reversalSignal > 0.7).length,
            momentumDivergence: this.calculateMomentumDivergence(momentumData)
        };
    }

    calculateAssetCorrelation(asset1Data, asset2Data) {
        // Simplified correlation calculation
        const price1 = asset1Data.price || [];
        const price2 = asset2Data.price || [];

        if (price1.length !== price2.length || price1.length < 2) return 0;

        const returns1 = this.calculateReturns(price1);
        const returns2 = this.calculateReturns(price2);

        return this.correlationCoefficient(returns1, returns2);
    }

    calculateReturns(prices) {
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i-1]) / prices[i-1]);
        }
        return returns;
    }

    correlationCoefficient(x, y) {
        const n = x.length;
        if (n !== y.length || n === 0) return 0;

        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

        for (let i = 0; i < n; i++) {
            sumX += x[i];
            sumY += y[i];
            sumXY += x[i] * y[i];
            sumX2 += x[i] * x[i];
            sumY2 += y[i] * y[i];
        }

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

        return denominator === 0 ? 0 : numerator / denominator;
    }

    calculateVariance(values) {
        if (values.length === 0) return 0;

        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
    }

    calculateMomentumDivergence(momentumData) {
        const autocorrelations = momentumData.map(d => d.autocorrelation);
        const mean = autocorrelations.reduce((sum, a) => sum + a, 0) / autocorrelations.length;
        const variance = this.calculateVariance(autocorrelations);

        return Math.sqrt(variance) / Math.abs(mean);
    }

    updateCrisisMetrics(regime) {
        const regimePatterns = this.marketMemory.crisisPatterns.get(regime);
        const patterns = regimePatterns.patterns;

        if (patterns.length > 1) {
            // Calculate success rate based on pattern recognition improvement
            const recentPatterns = patterns.slice(-10);
            const avgSeverity = recentPatterns.reduce((sum, p) => sum + p.volatilityProfile.avgVolatility, 0) / recentPatterns.length;

            regimePatterns.successRate = Math.max(0, 1 - avgSeverity);
            regimePatterns.avgDuration = this.calculateAverageCrisisDuration(patterns);
        }
    }

    calculateAverageCrisisDuration(patterns) {
        if (patterns.length < 2) return 0;

        const durations = [];
        for (let i = 1; i < patterns.length; i++) {
            durations.push(patterns[i].timestamp - patterns[i-1].timestamp);
        }

        return durations.reduce((sum, d) => sum + d, 0) / durations.length;
    }

    updateAssetBehaviors(components) {
        Object.entries(components).forEach(([asset, data]) => {
            const assetClass = this.classifyAsset(asset);
            const behavior = this.marketMemory.assetBehaviors.get(assetClass);

            if (behavior) {
                // Update volatility profile
                behavior.volatilityProfile.push(Math.abs(data.volumeVelocity || 0));
                if (behavior.volatilityProfile.length > 100) {
                    behavior.volatilityProfile = behavior.volatilityProfile.slice(-100);
                }

                // Update crisis sensitivity
                if (data.spectralSlope < -0.5) {
                    behavior.crisisSensitivity += 0.1;
                    behavior.crisisSensitivity = Math.min(1, behavior.crisisSensitivity);
                } else {
                    behavior.crisisSensitivity *= 0.99; // Gradual decay
                }

                // Update correlation matrix
                Object.keys(components).forEach(otherAsset => {
                    if (otherAsset !== asset) {
                        const correlation = this.calculateAssetCorrelation(data, components[otherAsset]);
                        behavior.correlationMatrix.set(otherAsset, correlation);
                    }
                });
            }
        });
    }

    classifyAsset(asset) {
        // Simple asset classification logic
        if (asset.includes('BTC') || asset.includes('ETH')) return 'crypto';
        if (asset.includes('EUR') || asset.includes('USD') || asset.includes('JPY')) return 'forex';
        if (asset.includes('GOLD') || asset.includes('OIL')) return 'commodity';
        if (asset.includes('BOND')) return 'bond';
        return 'equity';
    }

    learnFromInterventions(marketData) {
        // This would be called when intervention outcomes are known
        // For now, we'll implement a framework for learning

        const { interventionLevel, outcome } = marketData.interventionOutcome || {};

        if (interventionLevel && outcome) {
            const effectiveness = this.marketMemory.interventionEffectiveness.get(interventionLevel);

            if (effectiveness) {
                effectiveness.totalCount++;
                if (outcome.success) {
                    effectiveness.successCount++;
                }

                effectiveness.avgEffectiveness =
                    effectiveness.successCount / effectiveness.totalCount;

                // Store context pattern for future reference
                effectiveness.contextPatterns.push({
                    marketData: marketData,
                    outcome: outcome,
                    timestamp: Date.now()
                });

                // Keep only recent patterns
                if (effectiveness.contextPatterns.length > 20) {
                    effectiveness.contextPatterns = effectiveness.contextPatterns.slice(-20);
                }
            }
        }
    }

    generatePredictiveInsights(marketData) {
        const insights = {
            regimePrediction: this.predictRegimeTransition(),
            crisisProbability: this.calculateCrisisProbability(marketData),
            assetStressIndicators: this.calculateAssetStressIndicators(),
            interventionRecommendations: this.generateInterventionRecommendations(marketData)
        };

        // Update learning metrics
        this.updateLearningMetrics(insights);

        return insights;
    }

    predictRegimeTransition() {
        const transitions = this.marketMemory.regimeTransitions;
        const currentRegime = this.currentRegime;

        const possibleTransitions = Array.from(transitions.entries())
            .filter(([key]) => key.startsWith(`${currentRegime}_to_`))
            .map(([key, count]) => ({
                to: key.split('_to_')[1],
                probability: count / Array.from(transitions.values()).reduce((sum, c) => sum + c, 0)
            }));

        return possibleTransitions.sort((a, b) => b.probability - a.probability);
    }

    calculateCrisisProbability(marketData) {
        const { mfi } = marketData;
        const regime = this.currentRegime;

        const regimePatterns = this.marketMemory.crisisPatterns.get(regime);
        const historicalCrises = regimePatterns.patterns;

        if (historicalCrises.length === 0) return 0;

        // Calculate similarity to historical crisis patterns
        const similarities = historicalCrises.map(pattern => {
            return this.calculatePatternSimilarity(marketData, pattern);
        });

        const avgSimilarity = similarities.reduce((sum, s) => sum + s, 0) / similarities.length;

        // Combine MFI and pattern similarity
        return Math.min(1, (mfi * 0.7) + (avgSimilarity * 0.3));
    }

    calculatePatternSimilarity(currentData, historicalPattern) {
        const currentSig = this.extractSpectralSignature(currentData.components || {});
        const historicalSig = historicalPattern.spectralSignature;

        const slopeDiff = Math.abs(currentSig.avgSlope - historicalSig.avgSlope);
        const powerDiff = this.calculateArraySimilarity(
            currentSig.powerDistribution,
            historicalSig.powerDistribution
        );

        return Math.max(0, 1 - (slopeDiff + powerDiff) / 2);
    }

    calculateArraySimilarity(arr1, arr2) {
        if (arr1.length !== arr2.length) return 1; // Maximum difference

        const diffs = arr1.map((val, i) => Math.abs(val - arr2[i]));
        return diffs.reduce((sum, diff) => sum + diff, 0) / diffs.length;
    }

    calculateAssetStressIndicators() {
        const indicators = {};

        this.marketMemory.assetBehaviors.forEach((behavior, assetClass) => {
            indicators[assetClass] = {
                volatilityStress: this.calculateVolatilityStress(behavior.volatilityProfile),
                correlationStress: this.calculateCorrelationStress(behavior.correlationMatrix),
                crisisSensitivity: behavior.crisisSensitivity
            };
        });

        return indicators;
    }

    calculateVolatilityStress(volatilityProfile) {
        if (volatilityProfile.length < 2) return 0;

        const recent = volatilityProfile.slice(-10);
        const historical = volatilityProfile.slice(0, -10);

        if (historical.length === 0) return 0;

        const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
        const historicalAvg = historical.reduce((sum, v) => sum + v, 0) / historical.length;

        return Math.max(0, recentAvg - historicalAvg);
    }

    calculateCorrelationStress(correlationMatrix) {
        const correlations = Array.from(correlationMatrix.values());
        if (correlations.length === 0) return 0;

        const avgCorrelation = correlations.reduce((sum, c) => sum + c, 0) / correlations.length;
        return Math.abs(avgCorrelation); // Higher absolute correlation = higher stress
    }

    generateInterventionRecommendations(marketData) {
        const recommendations = [];
        const { mfi } = marketData;

        // Analyze intervention effectiveness history
        this.marketMemory.interventionEffectiveness.forEach((effectiveness, level) => {
            if (effectiveness.totalCount > 0) {
                const confidence = effectiveness.avgEffectiveness;
                const threshold = this.getInterventionThreshold(level);

                if (mfi >= threshold) {
                    recommendations.push({
                        level,
                        confidence,
                        expectedEffectiveness: confidence,
                        historicalSuccess: effectiveness.successCount / effectiveness.totalCount,
                        recommended: confidence > 0.6
                    });
                }
            }
        });

        return recommendations.sort((a, b) => b.confidence - a.confidence);
    }

    getInterventionThreshold(level) {
        const thresholds = {
            gentle: 0.3,
            moderate: 0.6,
            aggressive: 0.8
        };
        return thresholds[level] || 0.5;
    }

    updateLearningMetrics(insights) {
        // Update prediction accuracy based on regime predictions
        const regimePredictions = insights.regimePrediction;
        if (regimePredictions.length > 0) {
            const topPrediction = regimePredictions[0];
            // This would be validated against actual outcomes
            this.learningMetrics.predictionAccuracy = topPrediction.probability;
        }

        // Update intervention success based on recommendations
        const recommendations = insights.interventionRecommendations;
        if (recommendations.length > 0) {
            const avgConfidence = recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length;
            this.learningMetrics.interventionSuccess = avgConfidence;
        }

        // Calculate adaptation speed (how quickly the system learns)
        const totalPatterns = Array.from(this.marketMemory.crisisPatterns.values())
            .reduce((sum, regime) => sum + regime.patterns.length, 0);

        this.learningMetrics.adaptationSpeed = Math.min(1, totalPatterns / 100);
    }

    getFinancialContext() {
        return {
            currentRegime: this.currentRegime,
            crisisCount: this.crisisCounter,
            learningMetrics: this.learningMetrics,
            assetBehaviors: Object.fromEntries(this.marketMemory.assetBehaviors),
            interventionEffectiveness: Object.fromEntries(this.marketMemory.interventionEffectiveness)
        };
    }

    getCrisisPatterns(regime = null) {
        if (regime) {
            return this.marketMemory.crisisPatterns.get(regime);
        }

        return Object.fromEntries(this.marketMemory.crisisPatterns);
    }

    getAssetBehavior(assetClass) {
        return this.marketMemory.assetBehaviors.get(assetClass);
    }

    resetLearning() {
        this.initializeMarketMemory();
        this.crisisCounter = 0;
        this.learningMetrics = {
            predictionAccuracy: 0,
            interventionSuccess: 0,
            adaptationSpeed: 0
        };

        console.log('🔄 Financial learning reset');
    }
}

module.exports = { FinancialAntifragileManager };