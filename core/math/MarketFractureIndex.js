/**
 * Market Fracture Index (MFI) Calculator
 *
 * Adapts RIA mathematical processors to calculate MFI from financial market data.
 * MFI measures the precursors to market resonance fracture (systemic crashes).
 *
 * Core metrics:
 * - Spectral Slope Change (Δα): Flattening of price action spectral slope
 * - Lag-1 Autocorrelation (AC₁): Critical slowing down in market dynamics
 * - Order Book Imbalance: Buy/sell pressure asymmetry
 * - Composite MFI: Weighted combination of above metrics
 */

import { SpectralProcessor } from './processors/SpectralProcessor.js';
import { StatisticalProcessor } from './processors/StatisticalProcessor.js';

export class MarketFractureIndex {
  constructor(config = {}) {
    this.config = {
      // MFI calculation parameters
      windowSize: 300, // 5 minutes of market data (at 1Hz)
      updateInterval: 1000, // Update MFI every second
      sampleRate: 1, // 1 Hz for market data

      // Metric weights for MFI composite
      weights: {
        spectralSlope: 0.3,
        autocorrelation: 0.25,
        orderImbalance: 0.25,
        volumeVelocity: 0.2
      },

      // Thresholds for MFI levels
      thresholds: {
        gentle: 0.3,    // Early warning
        moderate: 0.6,  // Prepare hedging
        aggressive: 0.8 // Emergency action
      },

      // Market-specific parameters
      markets: {
        equities: {
          volatilityBands: [0.1, 0.3, 0.5], // Low, medium, high volatility thresholds
          orderBookDepth: 10, // Levels to analyze
          volumeThreshold: 1.5 // Standard deviations for abnormal volume
        },
        forex: {
          pairs: ['EURUSD', 'GBPUSD', 'USDJPY'],
          spreadThreshold: 2.0, // Pips for normal spreads
          momentumWindow: 60 // Seconds for momentum calculation
        },
        crypto: {
          assets: ['BTC', 'ETH', 'SOL'],
          volatilityMultiplier: 2.0, // Higher volatility tolerance
          liquidityThreshold: 1000000 // USD for sufficient liquidity
        }
      },

      ...config
    };

    // Initialize processors
    this.spectralProcessor = new SpectralProcessor({
      windowSize: this.config.windowSize * this.config.sampleRate,
      sampleRate: this.config.sampleRate
    });

    this.statisticalProcessor = new StatisticalProcessor({
      windowSize: this.config.windowSize * this.config.sampleRate
    });

    // Data buffers for each market data type
    this.marketBuffers = new Map();
    this.lastMFI = 0;
    this.mfiHistory = [];
    this.baselineMetrics = new Map();

    // Initialize market data buffers
    ['price', 'volume', 'orderbook', 'volatility', 'sentiment'].forEach(dataType => {
      this.marketBuffers.set(dataType, []);
    });
  }

  /**
   * Add market data to processing buffers
   */
  addMarketData(dataType, data, timestamp = Date.now()) {
    const buffer = this.marketBuffers.get(dataType);
    if (!buffer) return;

    // Add timestamped data point
    buffer.push({ value: data, timestamp });

    // Maintain buffer size (sliding window)
    const maxBufferSize = this.config.windowSize * this.config.sampleRate;
    if (buffer.length > maxBufferSize) {
      buffer.shift();
    }

    // Trigger MFI update if enough data
    if (this.shouldUpdateMFI(dataType)) {
      this.updateMFI();
    }
  }

  /**
   * Calculate Market Fracture Index
   */
  async calculateMFI() {
    const metrics = await this.computeAllMarketMetrics();

    if (!metrics) return null;

    // Calculate individual components
    const spectralSlopeScore = this.calculateSpectralSlopeScore(metrics);
    const autocorrelationScore = this.calculateAutocorrelationScore(metrics);
    const orderImbalanceScore = this.calculateOrderImbalanceScore(metrics);
    const volumeVelocityScore = this.calculateVolumeVelocityScore(metrics);

    // Weighted composite MFI
    const mfi = (
      this.config.weights.spectralSlope * spectralSlopeScore +
      this.config.weights.autocorrelation * autocorrelationScore +
      this.config.weights.orderImbalance * orderImbalanceScore +
      this.config.weights.volumeVelocity * volumeVelocityScore
    );

    // Normalize to [0, 1]
    const normalizedMFI = Math.max(0, Math.min(1, mfi));

    // Store in history
    this.mfiHistory.push({
      value: normalizedMFI,
      timestamp: Date.now(),
      components: {
        spectralSlope: spectralSlopeScore,
        autocorrelation: autocorrelationScore,
        orderImbalance: orderImbalanceScore,
        volumeVelocity: volumeVelocityScore
      },
      rawMetrics: metrics
    });

    // Maintain history size
    if (this.mfiHistory.length > 100) {
      this.mfiHistory.shift();
    }

    this.lastMFI = normalizedMFI;

    return {
      mfi: normalizedMFI,
      components: {
        spectralSlope: spectralSlopeScore,
        autocorrelation: autocorrelationScore,
        orderImbalance: orderImbalanceScore,
        volumeVelocity: volumeVelocityScore
      },
      level: this.classifyMFILevel(normalizedMFI),
      trend: this.calculateMFITrend(),
      confidence: this.calculateMFIConfidence(metrics)
    };
  }

  /**
   * Compute all required market metrics from available data
   */
  async computeAllMarketMetrics() {
    const metrics = {
      spectral: {},
      statistical: {},
      market: {}
    };

    // Process each data type
    for (const [dataType, buffer] of this.marketBuffers) {
      if (buffer.length < this.config.windowSize * this.config.sampleRate * 0.5) {
        continue; // Need at least 50% of window
      }

      const dataValues = buffer.map(point => point.value);

      try {
        // Spectral analysis for price data
        if (dataType === 'price') {
          const spectralResult = await this.spectralProcessor.analyze(dataValues);
          metrics.spectral.price = spectralResult;
        }

        // Statistical analysis for all data types
        const statisticalResult = await this.statisticalProcessor.computeFeatures(dataValues);
        metrics.statistical[dataType] = statisticalResult;

        metrics.market[dataType] = {
          length: dataValues.length,
          quality: this.assessDataQuality(dataValues),
          lastUpdate: buffer.length > 0 ? buffer[buffer.length - 1].timestamp : null
        };

      } catch (error) {
        console.warn(`Failed to process ${dataType} data:`, error);
      }
    }

    return Object.keys(metrics.spectral).length > 0 ? metrics : null;
  }

  /**
   * Calculate spectral slope change score (Δα)
   */
  calculateSpectralSlopeScore(metrics) {
    if (!metrics.spectral.price) return 0;

    const priceSpectral = metrics.spectral.price;
    const slope = this.calculatePriceSpectralSlope(priceSpectral.powerSpectrum);

    // Normalize slope change (flattening indicates instability)
    const baselineSlope = this.baselineMetrics.get('price_slope') || slope;
    const slopeChange = Math.abs(slope - baselineSlope) / Math.abs(baselineSlope);

    // Update baseline
    this.baselineMetrics.set('price_slope', baselineSlope * 0.9 + slope * 0.1);

    // Higher slope change indicates higher fracture risk
    return Math.min(1, slopeChange * 1.5);
  }

  /**
   * Calculate autocorrelation score (AC₁ - critical slowing down)
   */
  calculateAutocorrelationScore(metrics) {
    let totalScore = 0;
    let dataCount = 0;

    for (const [dataType, statistical] of Object.entries(metrics.statistical)) {
      if (statistical.autocorrelation) {
        const ac1 = statistical.autocorrelation.lag1 || 0;

        // High autocorrelation indicates critical slowing down
        const score = Math.min(1, Math.max(0, (ac1 - 0.2) / 0.3)); // AC₁ > 0.5 is concerning

        totalScore += score;
        dataCount++;
      }
    }

    return dataCount > 0 ? totalScore / dataCount : 0;
  }

  /**
   * Calculate order book imbalance score
   */
  calculateOrderImbalanceScore(metrics) {
    const orderbookBuffer = this.marketBuffers.get('orderbook');
    if (!orderbookBuffer || orderbookBuffer.length < 10) return 0;

    // Calculate recent order imbalance
    const recentOrders = orderbookBuffer.slice(-10);
    let totalBuyVolume = 0;
    let totalSellVolume = 0;

    recentOrders.forEach(order => {
      if (order.value && order.value.buyVolume && order.value.sellVolume) {
        totalBuyVolume += order.value.buyVolume;
        totalSellVolume += order.value.sellVolume;
      }
    });

    if (totalBuyVolume + totalSellVolume === 0) return 0;

    // Calculate imbalance ratio
    const imbalanceRatio = Math.abs(totalBuyVolume - totalSellVolume) / (totalBuyVolume + totalSellVolume);

    // High imbalance indicates potential instability
    return Math.min(1, imbalanceRatio * 2);
  }

  /**
   * Calculate volume velocity score
   */
  calculateVolumeVelocityScore(metrics) {
    const volumeBuffer = this.marketBuffers.get('volume');
    if (!volumeBuffer || volumeBuffer.length < 20) return 0;

    // Calculate volume velocity (rate of change)
    const recentVolumes = volumeBuffer.slice(-20).map(point => point.value);
    const velocities = [];

    for (let i = 1; i < recentVolumes.length; i++) {
      velocities.push(recentVolumes[i] - recentVolumes[i - 1]);
    }

    if (velocities.length === 0) return 0;

    // Calculate average absolute velocity
    const avgVelocity = velocities.reduce((sum, vel) => sum + Math.abs(vel), 0) / velocities.length;

    // Normalize by recent average volume
    const recentAvgVolume = recentVolumes.reduce((sum, vol) => sum + vol, 0) / recentVolumes.length;
    const normalizedVelocity = recentAvgVolume > 0 ? avgVelocity / recentAvgVolume : 0;

    // High velocity indicates market stress
    return Math.min(1, normalizedVelocity * 3);
  }

  /**
   * Calculate spectral slope from price power spectrum
   */
  calculatePriceSpectralSlope(powerSpectrum) {
    // Focus on relevant frequency bands for market data
    const freqBins = this.spectralProcessor.getFrequencyBins();
    const startIdx = freqBins.findIndex(f => f >= 0.001); // Low frequency (long-term trends)
    const endIdx = freqBins.findIndex(f => f >= 0.1); // High frequency (short-term noise)

    if (startIdx === -1 || endIdx === -1) return 0;

    const logFreqs = freqBins.slice(startIdx, endIdx).map(f => Math.log10(f));
    const logPowers = powerSpectrum.slice(startIdx, endIdx).map(p => Math.log10(Math.max(p, 1e-10)));

    // Linear regression for slope
    const n = logFreqs.length;
    const sumX = logFreqs.reduce((sum, x) => sum + x, 0);
    const sumY = logPowers.reduce((sum, y) => sum + y, 0);
    const sumXY = logFreqs.reduce((sum, x, i) => sum + x * logPowers[i], 0);
    const sumX2 = logFreqs.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    return slope;
  }

  /**
   * Classify MFI level
   */
  classifyMFILevel(mfi) {
    if (mfi >= this.config.thresholds.aggressive) return 'aggressive';
    if (mfi >= this.config.thresholds.moderate) return 'moderate';
    if (mfi >= this.config.thresholds.gentle) return 'gentle';
    return 'normal';
  }

  /**
   * Calculate MFI trend
   */
  calculateMFITrend() {
    if (this.mfiHistory.length < 3) return 'stable';

    const recent = this.mfiHistory.slice(-3);
    const values = recent.map(h => h.value);
    const trend = values[2] - values[0];

    if (trend > 0.1) return 'increasing';
    if (trend < -0.1) return 'decreasing';
    return 'stable';
  }

  /**
   * Calculate MFI confidence based on data quality
   */
  calculateMFIConfidence(metrics) {
    let totalQuality = 0;
    let dataCount = 0;

    for (const [dataType, dataInfo] of Object.entries(metrics.market)) {
      totalQuality += dataInfo.quality;
      dataCount++;
    }

    return dataCount > 0 ? totalQuality / dataCount : 0;
  }

  /**
   * Assess market data quality
   */
  assessDataQuality(dataValues) {
    if (dataValues.length === 0) return 0;

    let quality = 1.0;

    // Check for missing values
    const missingValues = dataValues.filter(v => v === null || v === undefined).length;
    if (missingValues > 0) {
      quality -= (missingValues / dataValues.length) * 0.5;
    }

    // Check for extreme outliers (market-specific)
    const sorted = [...dataValues].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const outliers = dataValues.filter(v => v < q1 - 3 * iqr || v > q3 + 3 * iqr);

    if (outliers.length > dataValues.length * 0.05) {
      quality -= 0.2; // Too many outliers
    }

    // Check for NaN or infinite values
    const invalidValues = dataValues.filter(v => !isFinite(v));
    if (invalidValues.length > 0) {
      quality -= 0.3;
    }

    return Math.max(0, quality);
  }

  /**
   * Check if MFI should be updated
   */
  shouldUpdateMFI(dataType) {
    const buffer = this.marketBuffers.get(dataType);
    if (!buffer || buffer.length === 0) return false;

    const timeSinceLastUpdate = Date.now() - (this.mfiHistory.length > 0 ?
      this.mfiHistory[this.mfiHistory.length - 1].timestamp : 0);

    return timeSinceLastUpdate >= this.config.updateInterval;
  }

  /**
   * Update MFI calculation
   */
  async updateMFI() {
    const result = await this.calculateMFI();
    if (result) {
      this.emit('mfiUpdated', result);
    }
  }

  /**
   * Get current MFI status
   */
  getMFIStatus() {
    return {
      currentMFI: this.lastMFI,
      level: this.classifyMFILevel(this.lastMFI),
      trend: this.calculateMFITrend(),
      history: this.mfiHistory.slice(-10), // Last 10 readings
      dataQuality: this.getDataQualitySummary(),
      baselineMetrics: Object.fromEntries(this.baselineMetrics)
    };
  }

  /**
   * Get market data quality summary
   */
  getDataQualitySummary() {
    const summary = {};

    for (const [dataType, buffer] of this.marketBuffers) {
      const dataValues = buffer.map(point => point.value);
      summary[dataType] = {
        available: buffer.length > 0,
        sampleCount: buffer.length,
        quality: this.assessDataQuality(dataValues),
        lastUpdate: buffer.length > 0 ? buffer[buffer.length - 1].timestamp : null
      };
    }

    return summary;
  }

  /**
   * Reset MFI calculator
   */
  reset() {
    this.marketBuffers.forEach(buffer => buffer.length = 0);
    this.mfiHistory.length = 0;
    this.baselineMetrics.clear();
    this.lastMFI = 0;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

// EventEmitter mixin for MFI calculator
import { EventEmitter } from 'events';
Object.setPrototypeOf(MarketFractureIndex.prototype, EventEmitter.prototype);