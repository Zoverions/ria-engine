/**
 * Physiological Fracture Index (PFI) Calculator
 *
 * Adapts RIA mathematical processors to calculate PFI from clinical biometric data.
 * PFI measures the precursors to physiological resonance fracture (medical crisis).
 *
 * Core metrics:
 * - Spectral Slope Change (Δα): Flattening of power spectrum in EEG/HRV
 * - Lag-1 Autocorrelation (AC₁): Critical slowing down indicator
 * - Statistical Skewness: Distribution asymmetry indicating instability
 * - Composite PFI: Weighted combination of above metrics
 */

import { SpectralProcessor } from './SpectralProcessor.js';
import { StatisticalProcessor } from './StatisticalProcessor.js';

export class PhysiologicalFractureIndex {
  constructor(config = {}) {
    this.config = {
      // PFI calculation parameters
      windowSize: 60, // 60 seconds of data for analysis
      updateInterval: 5, // Update PFI every 5 seconds
      sampleRate: 250, // Hz for high-frequency signals

      // Metric weights for PFI composite
      weights: {
        spectralSlope: 0.4,
        autocorrelation: 0.3,
        skewness: 0.2,
        entropy: 0.1
      },

      // Thresholds for PFI levels
      thresholds: {
        gentle: 0.3,
        moderate: 0.6,
        aggressive: 0.8
      },

      // Signal-specific parameters
      signals: {
        ecg: {
          bands: { lf: [0.04, 0.15], hf: [0.15, 0.4] },
          spectralSlopeRange: [0.5, 40] // Hz
        },
        eeg: {
          bands: { delta: [0.5, 4], theta: [4, 8], alpha: [8, 13], beta: [13, 30] },
          spectralSlopeRange: [0.5, 50] // Hz
        },
        bp: {
          analysisWindow: 30, // seconds
          fluctuationThreshold: 0.1
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

    // Data buffers for each signal type
    this.signalBuffers = new Map();
    this.lastPFI = 0;
    this.pfiHistory = [];
    this.baselineMetrics = new Map();

    // Initialize signal buffers
    ['ecg', 'eeg', 'bp', 'spo2', 'rr'].forEach(signalType => {
      this.signalBuffers.set(signalType, []);
    });
  }

  /**
   * Add clinical data to processing buffers
   */
  addClinicalData(signalType, data, timestamp = Date.now()) {
    const buffer = this.signalBuffers.get(signalType);
    if (!buffer) return;

    // Add timestamped data point
    buffer.push({ value: data, timestamp });

    // Maintain buffer size (sliding window)
    const maxBufferSize = this.config.windowSize * this.config.sampleRate;
    if (buffer.length > maxBufferSize) {
      buffer.shift();
    }

    // Trigger PFI update if enough data
    if (this.shouldUpdatePFI(signalType)) {
      this.updatePFI();
    }
  }

  /**
   * Calculate Physiological Fracture Index
   */
  async calculatePFI() {
    const metrics = await this.computeAllMetrics();

    if (!metrics) return null;

    // Calculate individual components
    const spectralSlopeScore = this.calculateSpectralSlopeScore(metrics);
    const autocorrelationScore = this.calculateAutocorrelationScore(metrics);
    const skewnessScore = this.calculateSkewnessScore(metrics);
    const entropyScore = this.calculateEntropyScore(metrics);

    // Weighted composite PFI
    const pfi = (
      this.config.weights.spectralSlope * spectralSlopeScore +
      this.config.weights.autocorrelation * autocorrelationScore +
      this.config.weights.skewness * skewnessScore +
      this.config.weights.entropy * entropyScore
    );

    // Normalize to [0, 1]
    const normalizedPFI = Math.max(0, Math.min(1, pfi));

    // Store in history
    this.pfiHistory.push({
      value: normalizedPFI,
      timestamp: Date.now(),
      components: {
        spectralSlope: spectralSlopeScore,
        autocorrelation: autocorrelationScore,
        skewness: skewnessScore,
        entropy: entropyScore
      },
      rawMetrics: metrics
    });

    // Maintain history size
    if (this.pfiHistory.length > 100) {
      this.pfiHistory.shift();
    }

    this.lastPFI = normalizedPFI;

    return {
      pfi: normalizedPFI,
      components: {
        spectralSlope: spectralSlopeScore,
        autocorrelation: autocorrelationScore,
        skewness: skewnessScore,
        entropy: entropyScore
      },
      level: this.classifyPFILevel(normalizedPFI),
      trend: this.calculatePFITrend(),
      confidence: this.calculatePFIConfidence(metrics)
    };
  }

  /**
   * Compute all required metrics from available signals
   */
  async computeAllMetrics() {
    const metrics = {
      spectral: {},
      statistical: {},
      signals: {}
    };

    // Process each signal type
    for (const [signalType, buffer] of this.signalBuffers) {
      if (buffer.length < this.config.windowSize * this.config.sampleRate * 0.5) {
        continue; // Need at least 50% of window
      }

      const signalData = buffer.map(point => point.value);

      try {
        // Spectral analysis
        const spectralResult = await this.spectralProcessor.analyze(signalData);
        metrics.spectral[signalType] = spectralResult;

        // Statistical analysis
        const statisticalResult = await this.statisticalProcessor.computeFeatures(signalData);
        metrics.statistical[signalType] = statisticalResult;

        metrics.signals[signalType] = {
          length: signalData.length,
          quality: this.assessSignalQuality(signalData)
        };

      } catch (error) {
        console.warn(`Failed to process ${signalType} signal:`, error);
      }
    }

    return Object.keys(metrics.spectral).length > 0 ? metrics : null;
  }

  /**
   * Calculate spectral slope change score (Δα)
   */
  calculateSpectralSlopeScore(metrics) {
    let totalScore = 0;
    let signalCount = 0;

    // Analyze EEG spectral slope (most critical for seizure prediction)
    if (metrics.spectral.eeg) {
      const eegSpectral = metrics.spectral.eeg;
      const slope = this.calculateSpectralSlope(eegSpectral.powerSpectrum,
                                               this.config.signals.eeg.spectralSlopeRange);

      // Normalize slope change (flattening indicates instability)
      const baselineSlope = this.baselineMetrics.get('eeg_slope') || slope;
      const slopeChange = Math.abs(slope - baselineSlope) / Math.abs(baselineSlope);

      totalScore += Math.min(1, slopeChange * 2); // Scale for sensitivity
      signalCount++;

      // Update baseline
      this.baselineMetrics.set('eeg_slope', baselineSlope * 0.9 + slope * 0.1);
    }

    // Analyze HRV/ECG spectral slope
    if (metrics.spectral.ecg || metrics.spectral.hrv) {
      const cardiacSpectral = metrics.spectral.ecg || metrics.spectral.hrv;
      const slope = this.calculateSpectralSlope(cardiacSpectral.powerSpectrum,
                                               this.config.signals.ecg.spectralSlopeRange);

      const baselineSlope = this.baselineMetrics.get('cardiac_slope') || slope;
      const slopeChange = Math.abs(slope - baselineSlope) / Math.abs(baselineSlope);

      totalScore += Math.min(1, slopeChange * 1.5);
      signalCount++;

      this.baselineMetrics.set('cardiac_slope', baselineSlope * 0.9 + slope * 0.1);
    }

    return signalCount > 0 ? totalScore / signalCount : 0;
  }

  /**
   * Calculate autocorrelation score (AC₁ - critical slowing down)
   */
  calculateAutocorrelationScore(metrics) {
    let totalScore = 0;
    let signalCount = 0;

    for (const [signalType, statistical] of Object.entries(metrics.statistical)) {
      if (statistical.autocorrelation) {
        const ac1 = statistical.autocorrelation.lag1 || 0;

        // High autocorrelation indicates critical slowing down
        // Normalize to [0, 1] where 1 is maximum instability
        const score = Math.min(1, Math.max(0, (ac1 - 0.3) / 0.4)); // AC₁ > 0.7 is concerning

        totalScore += score;
        signalCount++;
      }
    }

    return signalCount > 0 ? totalScore / signalCount : 0;
  }

  /**
   * Calculate skewness score (distribution asymmetry)
   */
  calculateSkewnessScore(metrics) {
    let totalScore = 0;
    let signalCount = 0;

    for (const [signalType, statistical] of Object.entries(metrics.statistical)) {
      if (statistical.moments && statistical.moments.skewness !== undefined) {
        const skewness = Math.abs(statistical.moments.skewness);

        // High absolute skewness indicates instability
        const score = Math.min(1, skewness / 2); // |skewness| > 2 is highly skewed

        totalScore += score;
        signalCount++;
      }
    }

    return signalCount > 0 ? totalScore / signalCount : 0;
  }

  /**
   * Calculate entropy score (complexity loss)
   */
  calculateEntropyScore(metrics) {
    let totalScore = 0;
    let signalCount = 0;

    for (const [signalType, statistical] of Object.entries(metrics.statistical)) {
      if (statistical.entropy && statistical.entropy.shannon !== undefined) {
        const entropy = statistical.entropy.shannon;

        // Low entropy indicates loss of complexity (bad)
        // Normalize assuming normal entropy range [2, 8] for physiological signals
        const score = Math.max(0, (5 - entropy) / 3); // Score increases as entropy decreases

        totalScore += score;
        signalCount++;
      }
    }

    return signalCount > 0 ? totalScore / signalCount : 0;
  }

  /**
   * Calculate spectral slope from power spectrum
   */
  calculateSpectralSlope(powerSpectrum, freqRange) {
    // Extract frequencies within range
    const freqBins = this.spectralProcessor.getFrequencyBins();
    const startIdx = freqBins.findIndex(f => f >= freqRange[0]);
    const endIdx = freqBins.findIndex(f => f >= freqRange[1]);

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
   * Classify PFI level
   */
  classifyPFILevel(pfi) {
    if (pfi >= this.config.thresholds.aggressive) return 'aggressive';
    if (pfi >= this.config.thresholds.moderate) return 'moderate';
    if (pfi >= this.config.thresholds.gentle) return 'gentle';
    return 'normal';
  }

  /**
   * Calculate PFI trend
   */
  calculatePFITrend() {
    if (this.pfiHistory.length < 3) return 'stable';

    const recent = this.pfiHistory.slice(-3);
    const values = recent.map(h => h.value);
    const trend = values[2] - values[0];

    if (trend > 0.1) return 'increasing';
    if (trend < -0.1) return 'decreasing';
    return 'stable';
  }

  /**
   * Calculate PFI confidence based on data quality
   */
  calculatePFIConfidence(metrics) {
    let totalQuality = 0;
    let signalCount = 0;

    for (const [signalType, signalInfo] of Object.entries(metrics.signals)) {
      totalQuality += signalInfo.quality;
      signalCount++;
    }

    return signalCount > 0 ? totalQuality / signalCount : 0;
  }

  /**
   * Assess signal quality
   */
  assessSignalQuality(signalData) {
    if (signalData.length === 0) return 0;

    // Basic quality checks
    let quality = 1.0;

    // Check for saturation (flat signals)
    const uniqueValues = new Set(signalData.map(v => Math.round(v * 100) / 100));
    if (uniqueValues.size < signalData.length * 0.1) {
      quality -= 0.5; // Likely saturated
    }

    // Check for extreme outliers
    const sorted = [...signalData].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const outliers = signalData.filter(v => v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr);

    if (outliers.length > signalData.length * 0.1) {
      quality -= 0.3; // Too many outliers
    }

    // Check for NaN or infinite values
    const invalidValues = signalData.filter(v => !isFinite(v));
    if (invalidValues.length > 0) {
      quality -= 0.2;
    }

    return Math.max(0, quality);
  }

  /**
   * Check if PFI should be updated
   */
  shouldUpdatePFI(signalType) {
    const buffer = this.signalBuffers.get(signalType);
    if (!buffer || buffer.length === 0) return false;

    const timeSinceLastUpdate = Date.now() - (this.pfiHistory.length > 0 ?
      this.pfiHistory[this.pfiHistory.length - 1].timestamp : 0);

    return timeSinceLastUpdate >= this.config.updateInterval * 1000;
  }

  /**
   * Update PFI calculation
   */
  async updatePFI() {
    const result = await this.calculatePFI();
    if (result) {
      this.emit('pfiUpdated', result);
    }
  }

  /**
   * Get current PFI status
   */
  getPFIStatus() {
    return {
      currentPFI: this.lastPFI,
      level: this.classifyPFILevel(this.lastPFI),
      trend: this.calculatePFITrend(),
      history: this.pfiHistory.slice(-10), // Last 10 readings
      signalQuality: this.getSignalQualitySummary(),
      baselineMetrics: Object.fromEntries(this.baselineMetrics)
    };
  }

  /**
   * Get signal quality summary
   */
  getSignalQualitySummary() {
    const summary = {};

    for (const [signalType, buffer] of this.signalBuffers) {
      const signalData = buffer.map(point => point.value);
      summary[signalType] = {
        available: buffer.length > 0,
        sampleCount: buffer.length,
        quality: this.assessSignalQuality(signalData),
        lastUpdate: buffer.length > 0 ? buffer[buffer.length - 1].timestamp : null
      };
    }

    return summary;
  }

  /**
   * Reset PFI calculator
   */
  reset() {
    this.signalBuffers.forEach(buffer => buffer.length = 0);
    this.pfiHistory.length = 0;
    this.baselineMetrics.clear();
    this.lastPFI = 0;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

// EventEmitter mixin for PFI calculator
import { EventEmitter } from 'events';
Object.setPrototypeOf(PhysiologicalFractureIndex.prototype, EventEmitter.prototype);