/**
 * StatisticalProcessor - Advanced statistical analysis
 * 
 * Performs comprehensive statistical computations including:
 * - Descriptive statistics
 * - Time series analysis
 * - Correlation analysis
 * - Distribution analysis
 * 
 * @version 2.0.0
 */

export class StatisticalProcessor {
  constructor(config = {}) {
    this.config = {
      windowSize: 100,
      overlap: 0.5,
      enableRobustStats: true,
      enableDistributionFitting: true,
      ...config
    };
  }

  /**
   * Compute comprehensive statistical features
   */
  async computeFeatures(signal) {
    try {
      const basicStats = this.computeBasicStatistics(signal);
      const momentStats = this.computeMoments(signal);
      const timeSeriesStats = this.computeTimeSeriesFeatures(signal);
      const distributionStats = this.analyzeDistribution(signal);
      
      return {
        basic: basicStats,
        moments: momentStats,
        timeSeries: timeSeriesStats,
        distribution: distributionStats,
        autocorrelation: this.computeAutocorrelation(signal),
        crosscorrelation: this.computeCrosscorrelation(signal),
        entropy: this.computeEntropy(signal),
        timestamp: Date.now()
      };
      
    } catch (error) {
      throw new Error(`Statistical analysis failed: ${error.message}`);
    }
  }

  /**
   * Compute basic descriptive statistics
   */
  computeBasicStatistics(signal) {
    const n = signal.length;
    if (n === 0) return null;
    
    // Sort for quantile calculations
    const sorted = [...signal].sort((a, b) => a - b);
    
    // Basic measures
    const sum = signal.reduce((acc, val) => acc + val, 0);
    const mean = sum / n;
    
    // Variance and standard deviation
    const variance = signal.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1);
    const stdDev = Math.sqrt(variance);
    
    // Quantiles
    const q1 = this.quantile(sorted, 0.25);
    const median = this.quantile(sorted, 0.5);
    const q3 = this.quantile(sorted, 0.75);
    const iqr = q3 - q1;
    
    // Range and extremes
    const min = sorted[0];
    const max = sorted[n - 1];
    const range = max - min;
    
    // Robust statistics
    const mad = this.computeMAD(signal, median);
    const trimmedMean = this.computeTrimmedMean(sorted, 0.1); // 10% trimmed
    
    return {
      count: n,
      sum,
      mean,
      median,
      mode: this.computeMode(signal),
      variance,
      stdDev,
      min,
      max,
      range,
      q1,
      q3,
      iqr,
      mad,
      trimmedMean,
      coefficientOfVariation: stdDev / Math.abs(mean)
    };
  }

  /**
   * Compute statistical moments
   */
  computeMoments(signal) {
    const n = signal.length;
    if (n === 0) return null;
    
    const mean = signal.reduce((acc, val) => acc + val, 0) / n;
    
    let m2 = 0, m3 = 0, m4 = 0;
    
    for (const val of signal) {
      const dev = val - mean;
      const dev2 = dev * dev;
      const dev3 = dev2 * dev;
      const dev4 = dev3 * dev;
      
      m2 += dev2;
      m3 += dev3;
      m4 += dev4;
    }
    
    m2 /= n;
    m3 /= n;
    m4 /= n;
    
    const variance = m2;
    const skewness = variance > 0 ? m3 / Math.pow(variance, 1.5) : 0;
    const kurtosis = variance > 0 ? (m4 / (variance * variance)) - 3 : 0; // Excess kurtosis
    
    return {
      variance,
      skewness,
      kurtosis,
      centralMoments: { m2, m3, m4 }
    };
  }

  /**
   * Compute time series specific features
   */
  computeTimeSeriesFeatures(signal) {
    const n = signal.length;
    if (n < 2) return null;
    
    // First differences
    const differences = [];
    for (let i = 1; i < n; i++) {
      differences.push(signal[i] - signal[i - 1]);
    }
    
    // Trend analysis
    const trend = this.computeLinearTrend(signal);
    
    // Stationarity tests
    const stationarity = this.testStationarity(signal);
    
    // Seasonality detection
    const seasonality = this.detectSeasonality(signal);
    
    // Change point detection
    const changePoints = this.detectChangePoints(signal);
    
    return {
      differences: this.computeBasicStatistics(differences),
      trend,
      stationarity,
      seasonality,
      changePoints,
      volatility: this.computeVolatility(signal),
      persistence: this.computePersistence(signal)
    };
  }

  /**
   * Analyze distribution characteristics
   */
  analyzeDistribution(signal) {
    const sorted = [...signal].sort((a, b) => a - b);
    const n = signal.length;
    
    // Histogram analysis
    const histogram = this.computeHistogram(signal, 20);
    
    // Normality tests
    const normality = this.testNormality(signal);
    
    // Distribution fitting
    const fittedDistributions = this.fitDistributions(signal);
    
    return {
      histogram,
      normality,
      fittedDistributions,
      outliers: this.detectOutliers(signal),
      symmetry: this.measureSymmetry(signal)
    };
  }

  /**
   * Compute autocorrelation function
   */
  computeAutocorrelation(signal, maxLag = null) {
    const n = signal.length;
    maxLag = maxLag || Math.min(n - 1, 50);
    
    const mean = signal.reduce((acc, val) => acc + val, 0) / n;
    const variance = signal.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    
    const autocorr = [];
    
    for (let lag = 0; lag <= maxLag; lag++) {
      let covariance = 0;
      const count = n - lag;
      
      for (let i = 0; i < count; i++) {
        covariance += (signal[i] - mean) * (signal[i + lag] - mean);
      }
      
      covariance /= count;
      autocorr.push(variance > 0 ? covariance / variance : 0);
    }
    
    return {
      values: autocorr,
      lag1: autocorr[1] || 0,
      significantLags: this.findSignificantLags(autocorr)
    };
  }

  /**
   * Compute crosscorrelation with lagged versions
   */
  computeCrosscorrelation(signal) {
    // Self-correlation with different lags
    const lags = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
    const correlations = {};
    
    for (const lag of lags) {
      correlations[`lag${lag}`] = this.computeLaggedCorrelation(signal, lag);
    }
    
    return correlations;
  }

  /**
   * Compute entropy measures
   */
  computeEntropy(signal) {
    // Shannon entropy
    const shannon = this.computeShannonEntropy(signal);
    
    // Approximate entropy
    const approximate = this.computeApproximateEntropy(signal);
    
    // Sample entropy
    const sample = this.computeSampleEntropy(signal);
    
    return {
      shannon,
      approximate,
      sample
    };
  }

  /**
   * Utility functions
   */
  
  quantile(sortedArray, p) {
    const n = sortedArray.length;
    const index = p * (n - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedArray[lower];
    }
    
    const weight = index - lower;
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  computeMAD(signal, median) {
    const deviations = signal.map(val => Math.abs(val - median));
    deviations.sort((a, b) => a - b);
    return this.quantile(deviations, 0.5);
  }

  computeTrimmedMean(sortedArray, trimProportion) {
    const n = sortedArray.length;
    const trimCount = Math.floor(n * trimProportion);
    const trimmed = sortedArray.slice(trimCount, n - trimCount);
    
    return trimmed.reduce((acc, val) => acc + val, 0) / trimmed.length;
  }

  computeMode(signal) {
    const frequency = {};
    let maxFreq = 0;
    let mode = null;
    
    for (const val of signal) {
      const rounded = Math.round(val * 1000) / 1000; // Round to avoid floating point issues
      frequency[rounded] = (frequency[rounded] || 0) + 1;
      
      if (frequency[rounded] > maxFreq) {
        maxFreq = frequency[rounded];
        mode = rounded;
      }
    }
    
    return mode;
  }

  computeLinearTrend(signal) {
    const n = signal.length;
    const x = Array.from({ length: n }, (_, i) => i);
    
    const meanX = x.reduce((acc, val) => acc + val, 0) / n;
    const meanY = signal.reduce((acc, val) => acc + val, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      const deltaX = x[i] - meanX;
      const deltaY = signal[i] - meanY;
      numerator += deltaX * deltaY;
      denominator += deltaX * deltaX;
    }
    
    const slope = denominator > 0 ? numerator / denominator : 0;
    const intercept = meanY - slope * meanX;
    
    return { slope, intercept };
  }

  computeHistogram(signal, bins) {
    const min = Math.min(...signal);
    const max = Math.max(...signal);
    const binWidth = (max - min) / bins;
    
    const histogram = new Array(bins).fill(0);
    
    for (const val of signal) {
      const binIndex = Math.min(Math.floor((val - min) / binWidth), bins - 1);
      histogram[binIndex]++;
    }
    
    return {
      bins: histogram,
      binWidth,
      range: { min, max }
    };
  }

  computeShannonEntropy(signal) {
    const histogram = this.computeHistogram(signal, 20);
    const total = signal.length;
    let entropy = 0;
    
    for (const count of histogram.bins) {
      if (count > 0) {
        const probability = count / total;
        entropy -= probability * Math.log2(probability);
      }
    }
    
    return entropy;
  }

  computeApproximateEntropy(signal, m = 2, r = null) {
    const n = signal.length;
    if (r === null) {
      const std = Math.sqrt(signal.reduce((acc, val, i) => {
        const mean = signal.reduce((sum, v) => sum + v, 0) / n;
        return acc + Math.pow(val - mean, 2);
      }, 0) / (n - 1));
      r = 0.2 * std;
    }
    
    const phi = (m) => {
      const patterns = [];
      for (let i = 0; i <= n - m; i++) {
        patterns.push(signal.slice(i, i + m));
      }
      
      let sum = 0;
      for (let i = 0; i < patterns.length; i++) {
        let matches = 0;
        for (let j = 0; j < patterns.length; j++) {
          const distance = Math.max(...patterns[i].map((val, k) => Math.abs(val - patterns[j][k])));
          if (distance <= r) {
            matches++;
          }
        }
        sum += Math.log(matches / patterns.length);
      }
      
      return sum / patterns.length;
    };
    
    return phi(m) - phi(m + 1);
  }

  computeSampleEntropy(signal, m = 2, r = null) {
    // Simplified sample entropy implementation
    return this.computeApproximateEntropy(signal, m, r);
  }

  computeLaggedCorrelation(signal, lag) {
    const n = signal.length;
    if (Math.abs(lag) >= n) return 0;
    
    let x, y;
    if (lag >= 0) {
      x = signal.slice(0, n - lag);
      y = signal.slice(lag);
    } else {
      x = signal.slice(-lag);
      y = signal.slice(0, n + lag);
    }
    
    const meanX = x.reduce((acc, val) => acc + val, 0) / x.length;
    const meanY = y.reduce((acc, val) => acc + val, 0) / y.length;
    
    let numerator = 0;
    let denominatorX = 0;
    let denominatorY = 0;
    
    for (let i = 0; i < x.length; i++) {
      const deltaX = x[i] - meanX;
      const deltaY = y[i] - meanY;
      
      numerator += deltaX * deltaY;
      denominatorX += deltaX * deltaX;
      denominatorY += deltaY * deltaY;
    }
    
    const denominator = Math.sqrt(denominatorX * denominatorY);
    return denominator > 0 ? numerator / denominator : 0;
  }

  findSignificantLags(autocorr, threshold = 0.2) {
    const significant = [];
    for (let i = 1; i < autocorr.length; i++) {
      if (Math.abs(autocorr[i]) > threshold) {
        significant.push({ lag: i, value: autocorr[i] });
      }
    }
    return significant;
  }

  // Placeholder implementations for advanced methods
  testStationarity(signal) {
    // Simplified stationarity test
    const firstHalf = signal.slice(0, Math.floor(signal.length / 2));
    const secondHalf = signal.slice(Math.floor(signal.length / 2));
    
    const mean1 = firstHalf.reduce((acc, val) => acc + val, 0) / firstHalf.length;
    const mean2 = secondHalf.reduce((acc, val) => acc + val, 0) / secondHalf.length;
    
    return {
      isStationary: Math.abs(mean1 - mean2) < 0.1 * Math.abs(mean1),
      meanDifference: Math.abs(mean1 - mean2)
    };
  }

  detectSeasonality(signal) {
    // Basic seasonality detection using autocorrelation
    const autocorr = this.computeAutocorrelation(signal);
    const significantLags = this.findSignificantLags(autocorr.values, 0.3);
    
    return {
      detected: significantLags.length > 0,
      periods: significantLags.map(lag => lag.lag)
    };
  }

  detectChangePoints(signal) {
    // Simple change point detection
    const changes = [];
    const windowSize = Math.max(10, Math.floor(signal.length / 10));
    
    for (let i = windowSize; i < signal.length - windowSize; i++) {
      const before = signal.slice(i - windowSize, i);
      const after = signal.slice(i, i + windowSize);
      
      const meanBefore = before.reduce((acc, val) => acc + val, 0) / before.length;
      const meanAfter = after.reduce((acc, val) => acc + val, 0) / after.length;
      
      if (Math.abs(meanAfter - meanBefore) > 0.5) {
        changes.push({ index: i, magnitude: Math.abs(meanAfter - meanBefore) });
      }
    }
    
    return changes;
  }

  computeVolatility(signal) {
    const differences = [];
    for (let i = 1; i < signal.length; i++) {
      differences.push(signal[i] - signal[i - 1]);
    }
    
    const variance = differences.reduce((acc, val) => {
      const mean = differences.reduce((sum, v) => sum + v, 0) / differences.length;
      return acc + Math.pow(val - mean, 2);
    }, 0) / (differences.length - 1);
    
    return Math.sqrt(variance);
  }

  computePersistence(signal) {
    // Hurst exponent estimation (simplified)
    const n = signal.length;
    if (n < 4) return 0.5;
    
    // Use rescaled range analysis
    const ranges = [];
    const lags = [2, 4, 8, 16, Math.min(32, Math.floor(n / 2))];
    
    for (const lag of lags) {
      if (lag >= n) continue;
      
      const subseries = [];
      for (let i = 0; i <= n - lag; i++) {
        subseries.push(signal.slice(i, i + lag));
      }
      
      let avgRange = 0;
      for (const series of subseries) {
        const mean = series.reduce((acc, val) => acc + val, 0) / series.length;
        const cumulative = [];
        let sum = 0;
        
        for (const val of series) {
          sum += val - mean;
          cumulative.push(sum);
        }
        
        const range = Math.max(...cumulative) - Math.min(...cumulative);
        const std = Math.sqrt(series.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (series.length - 1));
        
        avgRange += std > 0 ? range / std : 0;
      }
      
      avgRange /= subseries.length;
      ranges.push({ lag, rs: avgRange });
    }
    
    // Estimate Hurst exponent from log-log slope
    if (ranges.length < 2) return 0.5;
    
    const logLags = ranges.map(r => Math.log(r.lag));
    const logRS = ranges.map(r => Math.log(r.rs));
    
    const trend = this.computeLinearTrend(logRS);
    return Math.max(0, Math.min(1, trend.slope)); // Hurst exponent
  }

  testNormality(signal) {
    // Simplified normality test using skewness and kurtosis
    const moments = this.computeMoments(signal);
    
    const skewnessTest = Math.abs(moments.skewness) < 2;
    const kurtosisTest = Math.abs(moments.kurtosis) < 4;
    
    return {
      isNormal: skewnessTest && kurtosisTest,
      skewness: moments.skewness,
      kurtosis: moments.kurtosis
    };
  }

  fitDistributions(signal) {
    // Placeholder for distribution fitting
    return {
      normal: { fitted: false },
      exponential: { fitted: false },
      uniform: { fitted: false }
    };
  }

  detectOutliers(signal) {
    const sorted = [...signal].sort((a, b) => a - b);
    const q1 = this.quantile(sorted, 0.25);
    const q3 = this.quantile(sorted, 0.75);
    const iqr = q3 - q1;
    
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    return signal.filter(val => val < lowerBound || val > upperBound);
  }

  measureSymmetry(signal) {
    const moments = this.computeMoments(signal);
    return {
      skewness: moments.skewness,
      isSymmetric: Math.abs(moments.skewness) < 0.5
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}