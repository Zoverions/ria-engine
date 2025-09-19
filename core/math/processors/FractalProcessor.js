/**
 * FractalProcessor - Fractal dimension analysis
 * 
 * Computes various fractal dimension measures for complexity analysis:
 * - Box counting dimension
 * - Correlation dimension
 * - Higuchi fractal dimension
 * - Detrended fluctuation analysis
 * 
 * @version 2.0.0
 */

export class FractalProcessor {
  constructor(config = {}) {
    this.config = {
      maxBoxSize: 64,
      minBoxSize: 2,
      correlationDimension: {
        maxDistance: 1.0,
        minDistance: 0.01,
        numPoints: 100
      },
      higuchi: {
        maxK: 20,
        minK: 2
      },
      dfa: {
        minWindowSize: 4,
        maxWindowSize: 64,
        overlap: 0.5
      },
      ...config
    };
  }

  /**
   * Analyze fractal properties of signal
   */
  async analyze(signal) {
    try {
      const boxCounting = this.computeBoxCountingDimension(signal);
      const correlation = this.computeCorrelationDimension(signal);
      const higuchi = this.computeHiguchiFractalDimension(signal);
      const dfa = this.computeDetrendedFluctuationAnalysis(signal);
      
      return {
        boxCounting,
        correlation,
        higuchi,
        dfa,
        complexity: this.assessComplexity(boxCounting, correlation, higuchi),
        timestamp: Date.now()
      };
      
    } catch (error) {
      throw new Error(`Fractal analysis failed: ${error.message}`);
    }
  }

  /**
   * Compute box counting fractal dimension
   */
  computeBoxCountingDimension(signal) {
    const n = signal.length;
    if (n < 4) return { dimension: 1, boxes: [] };
    
    // Normalize signal to [0, 1]
    const min = Math.min(...signal);
    const max = Math.max(...signal);
    const range = max - min;
    
    if (range === 0) return { dimension: 1, boxes: [] };
    
    const normalized = signal.map(val => (val - min) / range);
    
    const boxSizes = [];
    const boxCounts = [];
    
    // Try different box sizes
    for (let boxSize = this.config.minBoxSize; boxSize <= Math.min(this.config.maxBoxSize, n / 4); boxSize *= 2) {
      const count = this.countBoxes(normalized, boxSize);
      boxSizes.push(boxSize);
      boxCounts.push(count);
    }
    
    // Compute fractal dimension from log-log slope
    const dimension = this.computeFractalDimension(boxSizes, boxCounts);
    
    return {
      dimension,
      boxes: boxSizes.map((size, i) => ({ size, count: boxCounts[i] })),
      goodness: this.computeGoodnessOfFit(boxSizes, boxCounts, dimension)
    };
  }

  /**
   * Count boxes needed to cover the signal at given resolution
   */
  countBoxes(normalizedSignal, boxSize) {
    const n = normalizedSignal.length;
    const boxes = new Set();
    
    for (let i = 0; i < n; i++) {
      const x = Math.floor(i / boxSize);
      const y = Math.floor(normalizedSignal[i] * boxSize);
      boxes.add(`${x},${y}`);
    }
    
    return boxes.size;
  }

  /**
   * Compute correlation dimension
   */
  computeCorrelationDimension(signal) {
    const n = signal.length;
    if (n < 10) return { dimension: 1, correlations: [] };
    
    // Embed signal in phase space (simple embedding with lag=1)
    const embedded = [];
    const m = 2; // Embedding dimension
    
    for (let i = 0; i < n - m + 1; i++) {
      embedded.push(signal.slice(i, i + m));
    }
    
    const distances = [];
    const correlations = [];
    
    // Compute correlation integral for different distances
    const logMinDist = Math.log(this.config.correlationDimension.minDistance);
    const logMaxDist = Math.log(this.config.correlationDimension.maxDistance);
    const stepSize = (logMaxDist - logMinDist) / this.config.correlationDimension.numPoints;
    
    for (let step = 0; step < this.config.correlationDimension.numPoints; step++) {
      const logDist = logMinDist + step * stepSize;
      const distance = Math.exp(logDist);
      
      const correlation = this.computeCorrelationIntegral(embedded, distance);
      
      distances.push(distance);
      correlations.push(correlation);
    }
    
    // Compute dimension from log-log slope
    const logDistances = distances.map(d => Math.log(d));
    const logCorrelations = correlations.map(c => Math.log(Math.max(c, 1e-10)));
    
    const dimension = this.computeLinearSlope(logDistances, logCorrelations);
    
    return {
      dimension: Math.max(0, dimension),
      correlations: distances.map((d, i) => ({ distance: d, correlation: correlations[i] }))
    };
  }

  /**
   * Compute correlation integral
   */
  computeCorrelationIntegral(embedded, distance) {
    const n = embedded.length;
    let count = 0;
    let pairs = 0;
    
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dist = this.euclideanDistance(embedded[i], embedded[j]);
        pairs++;
        
        if (dist < distance) {
          count++;
        }
      }
    }
    
    return pairs > 0 ? count / pairs : 0;
  }

  /**
   * Compute Higuchi fractal dimension
   */
  computeHiguchiFractalDimension(signal) {
    const n = signal.length;
    if (n < 10) return { dimension: 1, curves: [] };
    
    const lengths = [];
    const kValues = [];
    
    for (let k = this.config.higuchi.minK; k <= Math.min(this.config.higuchi.maxK, n / 4); k++) {
      const length = this.computeHiguchiLength(signal, k);
      lengths.push(length);
      kValues.push(k);
    }
    
    // Compute fractal dimension from log-log slope
    const logK = kValues.map(k => Math.log(1 / k));
    const logL = lengths.map(l => Math.log(l));
    
    const dimension = this.computeLinearSlope(logK, logL);
    
    return {
      dimension: Math.max(1, Math.min(2, dimension)),
      curves: kValues.map((k, i) => ({ k, length: lengths[i] }))
    };
  }

  /**
   * Compute Higuchi length for given k
   */
  computeHiguchiLength(signal, k) {
    const n = signal.length;
    let totalLength = 0;
    
    for (let m = 1; m <= k; m++) {
      let length = 0;
      const numPoints = Math.floor((n - m) / k);
      
      if (numPoints < 2) continue;
      
      for (let i = 1; i <= numPoints; i++) {
        const idx1 = m + (i - 1) * k - 1; // Convert to 0-based indexing
        const idx2 = m + i * k - 1;
        
        if (idx2 < n) {
          length += Math.abs(signal[idx2] - signal[idx1]);
        }
      }
      
      if (numPoints > 0) {
        length = (length * (n - 1)) / (numPoints * k * k);
        totalLength += length;
      }
    }
    
    return totalLength / k;
  }

  /**
   * Compute Detrended Fluctuation Analysis
   */
  computeDetrendedFluctuationAnalysis(signal) {
    const n = signal.length;
    if (n < 16) return { exponent: 0.5, fluctuations: [] };
    
    // Integrate signal (create cumulative sum)
    const integrated = new Array(n);
    const mean = signal.reduce((sum, val) => sum + val, 0) / n;
    
    integrated[0] = signal[0] - mean;
    for (let i = 1; i < n; i++) {
      integrated[i] = integrated[i - 1] + (signal[i] - mean);
    }
    
    const windowSizes = [];
    const fluctuations = [];
    
    // Try different window sizes
    for (let windowSize = this.config.dfa.minWindowSize; 
         windowSize <= Math.min(this.config.dfa.maxWindowSize, n / 4); 
         windowSize = Math.floor(windowSize * 1.2)) {
      
      const fluctuation = this.computeDFAFluctuation(integrated, windowSize);
      windowSizes.push(windowSize);
      fluctuations.push(fluctuation);
    }
    
    // Compute scaling exponent from log-log slope
    const logSizes = windowSizes.map(s => Math.log(s));
    const logFluctuations = fluctuations.map(f => Math.log(f));
    
    const exponent = this.computeLinearSlope(logSizes, logFluctuations);
    
    return {
      exponent: Math.max(0, Math.min(2, exponent)),
      fluctuations: windowSizes.map((size, i) => ({ 
        windowSize: size, 
        fluctuation: fluctuations[i] 
      })),
      classification: this.classifyDFAExponent(exponent)
    };
  }

  /**
   * Compute DFA fluctuation for given window size
   */
  computeDFAFluctuation(integrated, windowSize) {
    const n = integrated.length;
    const numWindows = Math.floor(n / windowSize);
    let totalVariance = 0;
    
    for (let i = 0; i < numWindows; i++) {
      const start = i * windowSize;
      const end = start + windowSize;
      const window = integrated.slice(start, end);
      
      // Fit linear trend to window
      const trend = this.computeLinearTrend(window);
      
      // Compute detrended variance
      let variance = 0;
      for (let j = 0; j < window.length; j++) {
        const predicted = trend.slope * j + trend.intercept;
        const residual = window[j] - predicted;
        variance += residual * residual;
      }
      
      totalVariance += variance / window.length;
    }
    
    return Math.sqrt(totalVariance / numWindows);
  }

  /**
   * Classify DFA exponent
   */
  classifyDFAExponent(exponent) {
    if (exponent < 0.5) {
      return 'anti-persistent';
    } else if (exponent > 0.5 && exponent < 1.0) {
      return 'persistent';
    } else if (exponent === 0.5) {
      return 'random';
    } else {
      return 'non-stationary';
    }
  }

  /**
   * Assess overall complexity based on fractal measures
   */
  assessComplexity(boxCounting, correlation, higuchi) {
    const dimensions = [
      boxCounting.dimension,
      correlation.dimension,
      higuchi.dimension
    ];
    
    const avgDimension = dimensions.reduce((sum, d) => sum + d, 0) / dimensions.length;
    const variance = dimensions.reduce((sum, d) => sum + Math.pow(d - avgDimension, 2), 0) / dimensions.length;
    
    return {
      averageDimension: avgDimension,
      dimensionVariance: variance,
      complexity: avgDimension > 1.5 ? 'high' : avgDimension > 1.2 ? 'medium' : 'low',
      consistency: variance < 0.1 ? 'high' : variance < 0.3 ? 'medium' : 'low'
    };
  }

  /**
   * Utility functions
   */
  
  computeFractalDimension(boxSizes, boxCounts) {
    const logSizes = boxSizes.map(s => Math.log(s));
    const logCounts = boxCounts.map(c => Math.log(c));
    
    return -this.computeLinearSlope(logSizes, logCounts);
  }

  computeLinearSlope(x, y) {
    const n = x.length;
    if (n < 2) return 0;
    
    const meanX = x.reduce((sum, val) => sum + val, 0) / n;
    const meanY = y.reduce((sum, val) => sum + val, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      const deltaX = x[i] - meanX;
      const deltaY = y[i] - meanY;
      numerator += deltaX * deltaY;
      denominator += deltaX * deltaX;
    }
    
    return denominator > 0 ? numerator / denominator : 0;
  }

  computeLinearTrend(signal) {
    const n = signal.length;
    const x = Array.from({ length: n }, (_, i) => i);
    
    const meanX = x.reduce((sum, val) => sum + val, 0) / n;
    const meanY = signal.reduce((sum, val) => sum + val, 0) / n;
    
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

  euclideanDistance(point1, point2) {
    let sum = 0;
    for (let i = 0; i < point1.length; i++) {
      const diff = point1[i] - point2[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  computeGoodnessOfFit(x, y, slope) {
    const n = x.length;
    if (n < 2) return 0;
    
    const logX = x.map(val => Math.log(val));
    const logY = y.map(val => Math.log(val));
    
    const meanLogX = logX.reduce((sum, val) => sum + val, 0) / n;
    const meanLogY = logY.reduce((sum, val) => sum + val, 0) / n;
    
    const intercept = meanLogY - slope * meanLogX;
    
    let ssRes = 0;
    let ssTot = 0;
    
    for (let i = 0; i < n; i++) {
      const predicted = slope * logX[i] + intercept;
      const residual = logY[i] - predicted;
      const total = logY[i] - meanLogY;
      
      ssRes += residual * residual;
      ssTot += total * total;
    }
    
    return ssTot > 0 ? 1 - (ssRes / ssTot) : 0; // R-squared
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}