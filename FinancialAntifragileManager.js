/**
 * Financial Antifragile Manager - Market Crisis Learning System
 *
 * Extends the RIA AntifragileManager to specialize in financial markets.
 * Learns from market crashes and builds asset-specific crisis patterns
 * to improve predictive capabilities and intervention effectiveness.
 *
 * Core Features:
 * - Market crash pattern recognition and learning
 * - Asset-specific crisis profiles
 * - Volatility regime adaptation
 * - Cross-market correlation learning
 * - Risk-adjusted antifragile strategies
 */

import { EventEmitter } from 'events';
import { AntifragileManager } from './antifragile/AntifragileManager.js';

export class FinancialAntifragileManager extends AntifragileManager {
  constructor(config = {}) {
    super({
      // Base antifragile configuration
      learningRate: 0.01,
      adaptationThreshold: 0.1,
      memorySize: 1000,
      reinforcementStrength: 0.8,

      // Financial-specific configuration
      marketRegimes: {
        normal: { volatility: 0.15, correlation: 0.3 },
        stressed: { volatility: 0.25, correlation: 0.6 },
        crisis: { volatility: 0.40, correlation: 0.8 }
      },

      crisisPatterns: {
        flashCrash: { duration: 300000, magnitude: 0.1 }, // 5 min, 10% drop
        blackSwan: { duration: 86400000, magnitude: 0.2 }, // 1 day, 20% drop
        systemicCrisis: { duration: 604800000, magnitude: 0.3 } // 1 week, 30% drop
      },

      assetClasses: {
        equities: { beta: 1.0, volatility: 0.2 },
        bonds: { beta: 0.3, volatility: 0.1 },
        commodities: { beta: 1.2, volatility: 0.25 },
        currencies: { beta: 0.8, volatility: 0.12 },
        crypto: { beta: 2.0, volatility: 0.5 }
      },

      ...config
    });

    // Financial-specific state
    this.financialState = {
      currentRegime: 'normal',
      regimeHistory: [],
      assetProfiles: new Map(),
      crisisPatterns: new Map(),
      correlationMatrix: new Map(),
      volatilitySurface: new Map(),
      riskMetrics: new Map()
    };

    // Market learning data
    this.marketLearning = {
      crashPatterns: [],
      regimeTransitions: [],
      assetCorrelations: new Map(),
      interventionEffectiveness: new Map(),
      predictiveAccuracy: new Map()
    };

    // Financial metrics tracking
    this.financialMetrics = {
      totalCrashesLearned: 0,
      regimeAccuracy: 0,
      predictionImprovement: 0,
      interventionSuccessRate: 0,
      sharpeRatioImprovement: 0
    };

    this.setupFinancialEventHandlers();
  }

  /**
   * Process financial market frame for antifragile learning
   */
  async processFinancialFrame(marketData, mfiResult, interventions = []) {
    const frame = {
      timestamp: Date.now(),
      marketData,
      mfi: mfiResult,
      interventions,
      regime: this.financialState.currentRegime,
      asset: marketData.asset || 'unknown'
    };

    // Update market regime
    await this.updateMarketRegime(frame);

    // Learn from crisis patterns
    if (mfiResult.mfi > 0.8) {
      await this.learnFromCrisis(frame);
    }

    // Update asset-specific profiles
    await this.updateAssetProfile(frame);

    // Learn from intervention effectiveness
    if (interventions.length > 0) {
      await this.learnFromInterventions(frame);
    }

    // Update correlation matrix
    await this.updateCorrelationMatrix(frame);

    // Process through base antifragile learning
    await this.processFrame(frame);

    this.emit('financialFrameProcessed', {
      frame,
      regime: this.financialState.currentRegime,
      learningMetrics: this.getFinancialLearningMetrics()
    });
  }

  /**
   * Update market regime based on current conditions
   */
  async updateMarketRegime(frame) {
    const { marketData, mfi } = frame;

    // Calculate regime indicators
    const volatility = this.calculateVolatilityRegime(marketData);
    const correlation = this.calculateCorrelationRegime(marketData);
    const mfiLevel = mfi.mfi;

    // Determine current regime
    let newRegime = 'normal';

    if (mfiLevel > 0.8 || volatility > 0.35 || correlation > 0.7) {
      newRegime = 'crisis';
    } else if (mfiLevel > 0.6 || volatility > 0.25 || correlation > 0.5) {
      newRegime = 'stressed';
    }

    // Track regime transition
    if (newRegime !== this.financialState.currentRegime) {
      const transition = {
        from: this.financialState.currentRegime,
        to: newRegime,
        timestamp: frame.timestamp,
        triggers: { volatility, correlation, mfi: mfiLevel },
        marketData: frame.marketData
      };

      this.marketLearning.regimeTransitions.push(transition);
      this.financialState.regimeHistory.push(transition);

      this.emit('regimeTransition', transition);
    }

    this.financialState.currentRegime = newRegime;
  }

  /**
   * Learn from market crisis patterns
   */
  async learnFromCrisis(frame) {
    const { marketData, mfi, asset } = frame;

    // Identify crisis pattern
    const crisisPattern = this.identifyCrisisPattern(frame);

    if (crisisPattern) {
      // Store crisis pattern for future recognition
      const patternKey = `${asset}_${crisisPattern.type}_${Date.now()}`;
      this.marketLearning.crashPatterns.push({
        key: patternKey,
        asset,
        pattern: crisisPattern,
        frame,
        learnedAt: Date.now()
      });

      // Update asset-specific crisis profile
      await this.updateCrisisProfile(asset, crisisPattern, frame);

      this.financialMetrics.totalCrashesLearned++;

      this.emit('crisisLearned', {
        asset,
        pattern: crisisPattern,
        frame,
        totalLearned: this.financialMetrics.totalCrashesLearned
      });
    }
  }

  /**
   * Identify the type of crisis pattern
   */
  identifyCrisisPattern(frame) {
    const { marketData, mfi } = frame;
    const duration = this.calculateCrisisDuration(frame);
    const magnitude = this.calculateCrisisMagnitude(frame);

    // Classify crisis type
    if (duration < 300000 && magnitude > 0.08) { // < 5 min, > 8% drop
      return {
        type: 'flashCrash',
        duration,
        magnitude,
        characteristics: {
          speed: 'extreme',
          recovery: this.predictRecoveryTime('flashCrash'),
          contagion: this.assessContagionRisk(frame)
        }
      };
    } else if (duration > 86400000 && magnitude > 0.15) { // > 1 day, > 15% drop
      return {
        type: 'blackSwan',
        duration,
        magnitude,
        characteristics: {
          speed: 'gradual',
          recovery: this.predictRecoveryTime('blackSwan'),
          contagion: this.assessContagionRisk(frame)
        }
      };
    } else if (magnitude > 0.2) { // > 20% drop
      return {
        type: 'systemicCrisis',
        duration,
        magnitude,
        characteristics: {
          speed: 'moderate',
          recovery: this.predictRecoveryTime('systemicCrisis'),
          contagion: this.assessContagionRisk(frame)
        }
      };
    }

    return null;
  }

  /**
   * Update asset-specific crisis profile
   */
  async updateAssetProfile(frame) {
    const { asset, marketData, mfi } = frame;

    if (!this.financialState.assetProfiles.has(asset)) {
      this.financialState.assetProfiles.set(asset, {
        asset,
        crisisHistory: [],
        volatilityProfile: [],
        correlationProfile: [],
        mfiSensitivity: [],
        interventionResponse: [],
        lastUpdated: Date.now()
      });
    }

    const profile = this.financialState.assetProfiles.get(asset);

    // Update crisis history
    if (mfi.mfi > 0.8) {
      profile.crisisHistory.push({
        timestamp: frame.timestamp,
        mfi: mfi.mfi,
        marketData,
        regime: this.financialState.currentRegime
      });
    }

    // Update volatility profile
    profile.volatilityProfile.push({
      timestamp: frame.timestamp,
      volatility: this.calculateVolatilityRegime(marketData),
      regime: this.financialState.currentRegime
    });

    // Maintain profile size
    if (profile.volatilityProfile.length > 100) {
      profile.volatilityProfile.shift();
    }

    profile.lastUpdated = Date.now();

    this.emit('assetProfileUpdated', {
      asset,
      profile: { ...profile },
      updateType: 'crisis'
    });
  }

  /**
   * Learn from intervention effectiveness
   */
  async learnFromInterventions(frame) {
    const { interventions, asset } = frame;

    for (const intervention of interventions) {
      const effectiveness = await this.assessInterventionEffectiveness(intervention, frame);

      // Store intervention learning
      const key = `${asset}_${intervention.type}`;
      if (!this.marketLearning.interventionEffectiveness.has(key)) {
        this.marketLearning.interventionEffectiveness.set(key, []);
      }

      this.marketLearning.interventionEffectiveness.get(key).push({
        intervention,
        effectiveness,
        frame,
        timestamp: Date.now()
      });

      // Update success rate
      this.updateInterventionSuccessRate(key);

      this.emit('interventionLearned', {
        asset,
        intervention: intervention.type,
        effectiveness,
        cumulativeSuccess: this.financialMetrics.interventionSuccessRate
      });
    }
  }

  /**
   * Assess intervention effectiveness
   */
  async assessInterventionEffectiveness(intervention, frame) {
    // In a real implementation, this would analyze:
    // - Pre/post intervention MFI levels
    // - Market impact of the intervention
    // - Risk reduction achieved
    // - Cost/benefit analysis

    const baseEffectiveness = {
      portfolio_hedging: 0.7,
      options_positioning: 0.8,
      alert_generation: 0.6,
      emergency_alert: 0.9,
      position_liquidation: 0.85,
      circuit_breaker: 0.95
    };

    let effectiveness = baseEffectiveness[intervention.type] || 0.5;

    // Adjust based on market conditions
    if (frame.mfi.mfi > 0.9) {
      effectiveness *= 1.2; // More effective in extreme conditions
    }

    // Adjust based on timing
    const interventionDelay = Date.now() - frame.timestamp;
    if (interventionDelay < 5000) { // Within 5 seconds
      effectiveness *= 1.1;
    }

    return Math.min(effectiveness, 1.0);
  }

  /**
   * Update correlation matrix across assets
   */
  async updateCorrelationMatrix(frame) {
    const { asset, marketData } = frame;

    // In a real implementation, this would track correlations
    // between different assets during various market conditions

    const correlations = this.financialState.correlationMatrix.get(asset) || new Map();

    // Simulate correlation updates with major indices
    const majorAssets = ['SPY', 'QQQ', 'IWM', 'TLT', 'GLD', 'EURUSD'];

    for (const otherAsset of majorAssets) {
      if (otherAsset !== asset) {
        const correlation = this.calculateAssetCorrelation(asset, otherAsset, frame);
        correlations.set(otherAsset, {
          value: correlation,
          timestamp: frame.timestamp,
          regime: this.financialState.currentRegime
        });
      }
    }

    this.financialState.correlationMatrix.set(asset, correlations);

    this.emit('correlationUpdated', {
      asset,
      correlations: Object.fromEntries(correlations),
      regime: this.financialState.currentRegime
    });
  }

  /**
   * Calculate volatility regime indicator
   */
  calculateVolatilityRegime(marketData) {
    // Simplified volatility calculation
    // In real implementation, would use proper statistical measures
    if (marketData.volatility) {
      return marketData.volatility;
    }

    // Estimate from price movements
    const priceChange = marketData.price ? Math.abs(marketData.price - (marketData.previousPrice || marketData.price)) / marketData.price : 0;
    return Math.min(priceChange * 10, 1.0); // Scale to 0-1
  }

  /**
   * Calculate correlation regime indicator
   */
  calculateCorrelationRegime(marketData) {
    // Simplified correlation calculation
    // In real implementation, would track cross-asset movements
    return this.financialState.currentRegime === 'crisis' ? 0.8 :
           this.financialState.currentRegime === 'stressed' ? 0.5 : 0.3;
  }

  /**
   * Calculate crisis duration
   */
  calculateCrisisDuration(frame) {
    // Simplified duration calculation
    // In real implementation, would track crisis start/end times
    return 3600000; // 1 hour default
  }

  /**
   * Calculate crisis magnitude
   */
  calculateCrisisMagnitude(frame) {
    // Simplified magnitude calculation
    return frame.mfi.mfi - 0.5; // Scale MFI to magnitude
  }

  /**
   * Predict recovery time for crisis type
   */
  predictRecoveryTime(crisisType) {
    const recoveryTimes = {
      flashCrash: 1800000,    // 30 minutes
      blackSwan: 604800000,   // 1 week
      systemicCrisis: 2592000000 // 1 month
    };

    return recoveryTimes[crisisType] || 86400000; // 1 day default
  }

  /**
   * Assess contagion risk
   */
  assessContagionRisk(frame) {
    // Simplified contagion assessment
    const baseRisk = frame.mfi.mfi > 0.9 ? 0.8 : 0.4;
    return this.financialState.currentRegime === 'crisis' ? baseRisk * 1.5 : baseRisk;
  }

  /**
   * Calculate asset correlation
   */
  calculateAssetCorrelation(asset1, asset2, frame) {
    // Simplified correlation calculation
    // In real implementation, would use historical price data
    const baseCorrelation = 0.5; // Default moderate correlation
    const regimeMultiplier = {
      normal: 1.0,
      stressed: 1.2,
      crisis: 1.5
    };

    return Math.min(baseCorrelation * regimeMultiplier[this.financialState.currentRegime], 1.0);
  }

  /**
   * Update intervention success rate
   */
  updateInterventionSuccessRate(key) {
    const history = this.marketLearning.interventionEffectiveness.get(key);
    if (history && history.length > 0) {
      const avgEffectiveness = history.reduce((sum, item) => sum + item.effectiveness, 0) / history.length;
      this.financialMetrics.interventionSuccessRate = avgEffectiveness;
    }
  }

  /**
   * Update crisis profile for asset
   */
  async updateCrisisProfile(asset, pattern, frame) {
    const key = `${asset}_crisis_profile`;
    if (!this.financialState.crisisPatterns.has(key)) {
      this.financialState.crisisPatterns.set(key, {
        asset,
        patterns: [],
        frequency: 0,
        avgMagnitude: 0,
        avgDuration: 0,
        triggers: [],
        lastUpdated: Date.now()
      });
    }

    const profile = this.financialState.crisisPatterns.get(key);
    profile.patterns.push({
      pattern,
      frame,
      timestamp: Date.now()
    });

    // Update statistics
    profile.frequency = profile.patterns.length;
    profile.avgMagnitude = profile.patterns.reduce((sum, p) => sum + p.pattern.magnitude, 0) / profile.frequency;
    profile.avgDuration = profile.patterns.reduce((sum, p) => sum + p.pattern.duration, 0) / profile.frequency;
    profile.lastUpdated = Date.now();

    this.emit('crisisProfileUpdated', {
      asset,
      profile: { ...profile }
    });
  }

  /**
   * Get financial learning metrics
   */
  getFinancialLearningMetrics() {
    return {
      ...this.financialMetrics,
      currentRegime: this.financialState.currentRegime,
      regimeTransitions: this.financialState.regimeHistory.length,
      assetsProfiled: this.financialState.assetProfiles.size,
      crisisPatternsLearned: this.marketLearning.crashPatterns.length,
      correlationMatrixSize: this.financialState.correlationMatrix.size,
      interventionTypesLearned: this.marketLearning.interventionEffectiveness.size
    };
  }

  /**
   * Get asset-specific crisis profile
   */
  getAssetCrisisProfile(asset) {
    return this.financialState.assetProfiles.get(asset) || null;
  }

  /**
   * Get market regime history
   */
  getRegimeHistory(limit = 10) {
    return this.financialState.regimeHistory.slice(-limit);
  }

  /**
   * Get crisis patterns for asset
   */
  getCrisisPatterns(asset) {
    const key = `${asset}_crisis_profile`;
    return this.financialState.crisisPatterns.get(key) || null;
  }

  /**
   * Predict crisis probability for asset
   */
  predictCrisisProbability(asset, timeframe = 3600000) { // 1 hour default
    const profile = this.getAssetCrisisProfile(asset);
    if (!profile || profile.crisisHistory.length === 0) {
      return 0.1; // Base probability
    }

    // Calculate probability based on historical frequency and recent activity
    const recentCrises = profile.crisisHistory.filter(
      crisis => Date.now() - crisis.timestamp < timeframe
    ).length;

    const historicalFrequency = profile.crisisHistory.length / (Date.now() - profile.crisisHistory[0].timestamp) * timeframe;

    return Math.min((recentCrises + historicalFrequency) / 2, 1.0);
  }

  /**
   * Setup financial-specific event handlers
   */
  setupFinancialEventHandlers() {
    // Listen to base antifragile events and add financial context
    this.on('learningProgress', (progress) => {
      this.emit('financialLearningProgress', {
        ...progress,
        financialMetrics: this.getFinancialLearningMetrics()
      });
    });

    this.on('adaptationTriggered', (adaptation) => {
      this.emit('financialAdaptation', {
        ...adaptation,
        regime: this.financialState.currentRegime,
        marketContext: this.getMarketContext()
      });
    });
  }

  /**
   * Get current market context
   */
  getMarketContext() {
    return {
      regime: this.financialState.currentRegime,
      assets: Array.from(this.financialState.assetProfiles.keys()),
      correlations: Object.fromEntries(this.financialState.correlationMatrix),
      crisisPatterns: this.marketLearning.crashPatterns.length,
      learningMetrics: this.getFinancialLearningMetrics()
    };
  }

  /**
   * Reset financial learning state
   */
  resetFinancialLearning() {
    this.financialState = {
      currentRegime: 'normal',
      regimeHistory: [],
      assetProfiles: new Map(),
      crisisPatterns: new Map(),
      correlationMatrix: new Map(),
      volatilitySurface: new Map(),
      riskMetrics: new Map()
    };

    this.marketLearning = {
      crashPatterns: [],
      regimeTransitions: [],
      assetCorrelations: new Map(),
      interventionEffectiveness: new Map(),
      predictiveAccuracy: new Map()
    };

    this.financialMetrics = {
      totalCrashesLearned: 0,
      regimeAccuracy: 0,
      predictionImprovement: 0,
      interventionSuccessRate: 0,
      sharpeRatioImprovement: 0
    };

    this.emit('financialLearningReset');
  }
}

export default FinancialAntifragileManager;