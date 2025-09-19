/**
 * Advanced Math Core for RIA Engine v2.0
 * 
 * Optimized mathematical engine with advanced algorithms for:
 * - High-performance spectral analysis (FFT-based)
 * - Multi-scale time-frequency analysis
 * - Advanced statistical computations
 * - Real-time optimization
 * - GPU acceleration support
 * 
 * @version 2.0.0
 * @author Zoverions Grand Unified Model ZGUM v16.2
 */

import { EventEmitter } from 'events';
import { FFTProcessor } from './processors/FFTProcessor.js';
import { StatisticalProcessor } from './processors/StatisticalProcessor.js';
import { SpectralAnalyzer } from './processors/SpectralAnalyzer.js';
import { FractalAnalyzer } from './processors/FractalAnalyzer.js';
import { WaveletProcessor } from './processors/WaveletProcessor.js';
import { PerformanceOptimizer } from './utils/PerformanceOptimizer.js';

export class MathCore extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Core parameters
      windowSize: 64,              // Primary analysis window
      samplingRate: 50,            // Hz
      frameRate: 60,               // Processing frame rate
      
      // Advanced features
      enableGPU: true,             // GPU acceleration
      enableWavelets: true,        // Wavelet analysis
      enableFractals: true,        // Fractal dimension analysis
      enableAdaptive: true,        // Adaptive parameters
      
      // Performance
      maxProcessingTime: 5,        // ms per frame
      cacheSize: 1000,            // Result cache size
      parallelWorkers: 4,         // Web workers for parallel processing
      
      // Precision
      floatPrecision: 'float64',   // float32 | float64
      numericalStability: true,    // Enhanced numerical stability
      
      ...config
    };
    
    // Initialize processors
    this.fft = new FFTProcessor(this.config);
    this.stats = new StatisticalProcessor(this.config);
    this.spectral = new SpectralAnalyzer(this.config);
    this.fractal = new FractalAnalyzer(this.config);
    this.wavelet = new WaveletProcessor(this.config);
    this.optimizer = new PerformanceOptimizer(this.config);
    
    // Processing state
    this.state = {
      initialized: false,
      processing: false,
      frameCount: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    
    // Data buffers
    this.dataBuffer = new CircularBuffer(this.config.windowSize * 4);
    this.resultCache = new Map();
    this.processingQueue = [];
    
    // Performance metrics
    this.metrics = {
      avgProcessingTime: 0,
      maxProcessingTime: 0,
      totalFrames: 0,
      cacheEfficiency: 0
    };
  }

  /**
   * Initialize the math core and all processors
   */
  async initialize() {
    if (this.state.initialized) return;
    
    try {
      // Initialize processors in parallel
      await Promise.all([
        this.fft.initialize(),
        this.stats.initialize(),
        this.spectral.initialize(),
        this.fractal.initialize(),
        this.wavelet.initialize(),
        this.optimizer.initialize()
      ]);
      
      // Set up performance monitoring
      this.setupPerformanceMonitoring();
      
      this.state.initialized = true;
      this.emit('initialized', { timestamp: Date.now() });
      
    } catch (error) {
      this.emit('error', { phase: 'initialization', error });
      throw error;
    }
  }

  /**
   * Main processing function - computes comprehensive FI metrics
   */
  async process(inputData) {
    if (!this.state.initialized) {
      throw new Error('MathCore not initialized');
    }
    
    const startTime = performance.now();
    this.state.frameCount++;
    
    try {
      // Extract and validate input
      const { phiHistory, biometricData, metadata } = this.validateInput(inputData);
      
      // Check cache for identical input
      const cacheKey = this.generateCacheKey(phiHistory, biometricData);
      const cached = this.resultCache.get(cacheKey);
      
      if (cached && this.isCacheValid(cached)) {
        this.state.cacheHits++;
        this.updateMetrics(performance.now() - startTime);
        return this.enhanceResult(cached.result, metadata);
      }
      
      this.state.cacheMisses++;
      
      // Ensure sufficient data
      if (phiHistory.length < this.config.windowSize) {
        return this.createMinimalResult(phiHistory, metadata);
      }
      
      // Stage 1: Preprocessing and windowing
      const processedData = await this.preprocessData(phiHistory);
      
      // Stage 2: Parallel feature extraction
      const features = await this.extractFeatures(processedData, biometricData);
      
      // Stage 3: Compute Fracture Index
      const fi = this.computeAdvancedFI(features);
      
      // Stage 4: Generate UI state
      const uiState = this.computeUIState(fi, features, metadata);
      
      // Stage 5: Adaptive thresholds
      const thresholds = this.computeAdaptiveThresholds(features, metadata);
      
      // Compile final result
      const result = {
        fi,
        uiState,
        thresholds,
        features,
        metadata: {
          ...metadata,
          processingTime: performance.now() - startTime,
          frameNumber: this.state.frameCount,
          cacheKey
        }
      };
      
      // Cache result
      this.cacheResult(cacheKey, result);
      
      // Update metrics
      this.updateMetrics(performance.now() - startTime);
      
      // Emit processing complete event
      this.emit('processed', {
        frameNumber: this.state.frameCount,
        processingTime: performance.now() - startTime,
        fi: result.fi
      });
      
      return this.enhanceResult(result, metadata);
      
    } catch (error) {
      this.emit('error', { 
        phase: 'processing', 
        frameNumber: this.state.frameCount, 
        error 
      });
      throw error;
    }
  }

  /**
   * Advanced preprocessing with multiple techniques
   */
  async preprocessData(phiHistory) {
    const data = Array.from(phiHistory);
    
    // Stage 1: Outlier detection and removal
    const cleaned = this.stats.removeOutliers(data, { method: 'iqr', factor: 1.5 });
    
    // Stage 2: Detrending
    const detrended = this.stats.detrend(cleaned, { method: 'linear' });
    
    // Stage 3: Normalization
    const normalized = this.stats.standardize(detrended);
    
    // Stage 4: Windowing
    const windowed = this.applyWindow(normalized, 'hann');
    
    return {
      original: data,
      cleaned,
      detrended,
      normalized,
      windowed,
      metadata: {
        outliers: data.length - cleaned.length,
        trend: this.stats.getTrendStrength(data),
        stationarity: this.stats.testStationarity(data)
      }
    };
  }

  /**
   * Extract comprehensive features using multiple processors
   */
  async extractFeatures(processedData, biometricData = null) {
    const { windowed, normalized } = processedData;
    
    // Parallel feature extraction
    const [
      spectralFeatures,
      statisticalFeatures,
      fractalFeatures,
      waveletFeatures
    ] = await Promise.all([
      this.spectral.analyze(windowed),
      this.stats.computeFeatures(normalized),
      this.config.enableFractals ? this.fractal.analyze(normalized) : null,
      this.config.enableWavelets ? this.wavelet.analyze(windowed) : null
    ]);
    
    // Biometric features if available
    const biometricFeatures = biometricData ? 
      this.computeBiometricFeatures(biometricData) : null;
    
    return {
      spectral: spectralFeatures,
      statistical: statisticalFeatures,
      fractal: fractalFeatures,
      wavelet: waveletFeatures,
      biometric: biometricFeatures,
      temporal: this.computeTemporalFeatures(normalized),
      complexity: this.computeComplexityFeatures(normalized)
    };
  }

  /**
   * Compute advanced Fracture Index using multiple feature sets
   */
  computeAdvancedFI(features) {
    const weights = this.getAdaptiveWeights(features);
    
    // Primary FI components (enhanced from v1)
    const deltaAlpha = features.spectral.slopeChange || 0;
    const autocorr = features.statistical.lag1Autocorr || 0;
    const skewness = Math.abs(features.statistical.skewness || 0);
    
    // Advanced components
    const complexity = features.complexity.sampleEntropy || 0;
    const fractalDim = features.fractal?.dimension || 0;
    const waveletEntropy = features.wavelet?.entropy || 0;
    
    // Multi-scale analysis
    const shortScale = this.computeShortScaleFI(features);
    const longScale = this.computeLongScaleFI(features);
    
    // Weighted combination
    let fi = weights.primary * (
      weights.deltaAlpha * (-deltaAlpha) +
      weights.autocorr * autocorr +
      weights.skewness * skewness
    );
    
    // Add advanced components
    fi += weights.complexity * complexity;
    fi += weights.fractal * fractalDim;
    fi += weights.wavelet * waveletEntropy;
    
    // Multi-scale integration
    fi += weights.shortScale * shortScale;
    fi += weights.longScale * longScale;
    
    // Biometric modulation
    if (features.biometric) {
      const biometricFactor = this.computeBiometricFactor(features.biometric);
      fi *= biometricFactor;
    }
    
    // Ensure non-negative and bounded
    return Math.max(0, Math.min(10, fi));
  }

  /**
   * Compute adaptive weights based on current features
   */
  getAdaptiveWeights(features) {
    const base = {
      primary: 1.0,
      deltaAlpha: 1.0,
      autocorr: 1.0,
      skewness: 0.7,
      complexity: 0.5,
      fractal: 0.3,
      wavelet: 0.4,
      shortScale: 0.2,
      longScale: 0.1
    };
    
    // Adapt based on signal characteristics
    if (features.statistical.snr < 10) {
      // Low SNR - reduce emphasis on spectral features
      base.deltaAlpha *= 0.7;
      base.complexity *= 1.2;
    }
    
    if (features.temporal.stationarity < 0.5) {
      // Non-stationary - increase temporal features
      base.shortScale *= 1.5;
      base.longScale *= 1.3;
    }
    
    return base;
  }

  /**
   * Compute UI state with enhanced responsiveness
   */
  computeUIState(fi, features, metadata) {
    const thresholds = this.computeAdaptiveThresholds(features, metadata);
    
    let gamma = 1.0;
    let interveneType = null;
    
    // Multi-level intervention logic
    if (fi >= thresholds.critical) {
      gamma = 0.2;  // Critical intervention
      interveneType = 'critical';
    } else if (fi >= thresholds.aggressive) {
      gamma = 0.4;  // Aggressive intervention
      interveneType = 'aggressive';
    } else if (fi >= thresholds.gentle) {
      gamma = 0.75; // Gentle intervention
      interveneType = 'gentle';
    } else if (fi >= thresholds.preventive) {
      gamma = 0.9;  // Preventive intervention
      interveneType = 'preventive';
    }
    
    // Smooth transitions
    if (metadata.previousGamma) {
      const maxChange = 0.1; // Maximum change per frame
      const targetChange = gamma - metadata.previousGamma;
      const limitedChange = Math.sign(targetChange) * Math.min(Math.abs(targetChange), maxChange);
      gamma = metadata.previousGamma + limitedChange;
    }
    
    // Coherence anchor with enhanced dynamics
    const anchorPhase = this.computeCoherenceAnchor(features, metadata);
    
    // Additional UI elements
    const visualComplexity = this.computeVisualComplexity(features);
    const attentionFocus = this.computeAttentionFocus(features);
    
    return {
      gamma: Math.max(0.1, Math.min(1.0, gamma)),
      interveneType,
      anchorPhase,
      visualComplexity,
      attentionFocus,
      confidence: this.computeConfidence(features),
      adaptiveElements: {
        blur: this.computeBlurLevel(fi, features),
        saturation: this.computeSaturationLevel(fi, features),
        spacing: this.computeSpacingAdjustment(fi, features)
      }
    };
  }

  /**
   * Compute adaptive thresholds based on user behavior and context
   */
  computeAdaptiveThresholds(features, metadata) {
    const base = {
      preventive: 0.5,
      gentle: 0.7,
      aggressive: 1.1,
      critical: 1.8
    };
    
    // Adapt based on user profile
    if (metadata.userProfile === 'neurodiverse') {
      Object.keys(base).forEach(key => base[key] *= 0.8);
    } else if (metadata.userProfile === 'fast_typist') {
      Object.keys(base).forEach(key => base[key] *= 1.2);
    }
    
    // Adapt based on time of day
    if (metadata.timeOfDay) {
      const hour = new Date().getHours();
      if (hour < 9 || hour > 18) {
        // Outside work hours - more sensitive
        Object.keys(base).forEach(key => base[key] *= 0.9);
      }
    }
    
    // Adapt based on recent performance
    if (features.performance) {
      const errorRate = features.performance.errorRate || 0;
      if (errorRate > 0.1) {
        // High error rate - more aggressive intervention
        Object.keys(base).forEach(key => base[key] *= 0.8);
      }
    }
    
    return base;
  }

  /**
   * Validate and structure input data
   */
  validateInput(inputData) {
    if (!inputData || typeof inputData !== 'object') {
      throw new Error('Invalid input data');
    }
    
    const phiHistory = Array.isArray(inputData.phiHistory) ? 
      inputData.phiHistory : 
      Array.isArray(inputData) ? inputData : [];
    
    if (phiHistory.length === 0) {
      throw new Error('No phi history provided');
    }
    
    // Validate data types
    if (!phiHistory.every(val => typeof val === 'number' && isFinite(val))) {
      throw new Error('Invalid phi history values');
    }
    
    return {
      phiHistory,
      biometricData: inputData.biometricData || null,
      metadata: inputData.metadata || {}
    };
  }

  /**
   * Generate cache key for input data
   */
  generateCacheKey(phiHistory, biometricData) {
    const phiHash = this.hashArray(phiHistory.slice(-this.config.windowSize));
    const bioHash = biometricData ? this.hashObject(biometricData) : 'none';
    return `${phiHash}_${bioHash}`;
  }

  /**
   * Simple hash function for arrays
   */
  hashArray(arr) {
    let hash = 0;
    for (let i = 0; i < arr.length; i++) {
      const val = Math.round(arr[i] * 1000); // 3 decimal precision
      hash = ((hash << 5) - hash + val) & 0xffffffff;
    }
    return hash.toString(36);
  }

  /**
   * Simple hash function for objects
   */
  hashObject(obj) {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0xffffffff;
    }
    return hash.toString(36);
  }

  /**
   * Check if cached result is still valid
   */
  isCacheValid(cached) {
    const maxAge = 100; // ms
    return (Date.now() - cached.timestamp) < maxAge;
  }

  /**
   * Cache processing result
   */
  cacheResult(key, result) {
    this.resultCache.set(key, {
      result: { ...result },
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (this.resultCache.size > this.config.cacheSize) {
      const oldestKey = this.resultCache.keys().next().value;
      this.resultCache.delete(oldestKey);
    }
  }

  /**
   * Apply windowing function
   */
  applyWindow(data, windowType = 'hann') {
    const N = data.length;
    const windowed = new Array(N);
    
    switch (windowType) {
      case 'hann':
        for (let i = 0; i < N; i++) {
          const window = 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1)));
          windowed[i] = data[i] * window;
        }
        break;
      case 'hamming':
        for (let i = 0; i < N; i++) {
          const window = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (N - 1));
          windowed[i] = data[i] * window;
        }
        break;
      default:
        return data; // No windowing
    }
    
    return windowed;
  }

  /**
   * Update performance metrics
   */
  updateMetrics(processingTime) {
    this.metrics.totalFrames++;
    this.metrics.avgProcessingTime = 
      ((this.metrics.avgProcessingTime * (this.metrics.totalFrames - 1)) + processingTime) / 
      this.metrics.totalFrames;
    this.metrics.maxProcessingTime = Math.max(this.metrics.maxProcessingTime, processingTime);
    this.metrics.cacheEfficiency = 
      this.state.cacheHits / (this.state.cacheHits + this.state.cacheMisses);
    
    // Emit performance warning if needed
    if (processingTime > this.config.maxProcessingTime) {
      this.emit('performanceWarning', {
        processingTime,
        threshold: this.config.maxProcessingTime,
        frameNumber: this.state.frameCount
      });
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      initialized: this.state.initialized,
      processing: this.state.processing,
      frameCount: this.state.frameCount,
      metrics: this.metrics,
      cache: {
        size: this.resultCache.size,
        hits: this.state.cacheHits,
        misses: this.state.cacheMisses,
        efficiency: this.metrics.cacheEfficiency
      },
      processors: {
        fft: this.fft.getStatus(),
        spectral: this.spectral.getStatus(),
        statistical: this.stats.getStatus(),
        fractal: this.fractal?.getStatus(),
        wavelet: this.wavelet?.getStatus()
      }
    };
  }

  /**
   * Start processing
   */
  async start() {
    this.state.processing = true;
    await Promise.all([
      this.fft.start(),
      this.spectral.start(),
      this.stats.start(),
      this.fractal?.start(),
      this.wavelet?.start()
    ]);
  }

  /**
   * Stop processing
   */
  async stop() {
    this.state.processing = false;
    await Promise.all([
      this.fft.stop(),
      this.spectral.stop(),
      this.stats.stop(),
      this.fractal?.stop(),
      this.wavelet?.stop()
    ]);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
    
    // Propagate to processors
    this.fft.updateConfig(this.config);
    this.spectral.updateConfig(this.config);
    this.stats.updateConfig(this.config);
    this.fractal?.updateConfig(this.config);
    this.wavelet?.updateConfig(this.config);
  }

  /**
   * Shutdown math core
   */
  async shutdown() {
    await this.stop();
    
    // Clean up resources
    this.resultCache.clear();
    this.processingQueue.length = 0;
    
    // Shutdown processors
    await Promise.all([
      this.fft.shutdown(),
      this.spectral.shutdown(),
      this.stats.shutdown(),
      this.fractal?.shutdown(),
      this.wavelet?.shutdown(),
      this.optimizer.shutdown()
    ]);
  }
}

/**
 * Circular buffer for efficient data management
 */
class CircularBuffer {
  constructor(size) {
    this.buffer = new Array(size);
    this.size = size;
    this.head = 0;
    this.tail = 0;
    this.count = 0;
  }
  
  push(item) {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.size;
    
    if (this.count < this.size) {
      this.count++;
    } else {
      this.tail = (this.tail + 1) % this.size;
    }
  }
  
  toArray() {
    if (this.count === 0) return [];
    
    const result = new Array(this.count);
    let bufferIndex = this.tail;
    
    for (let i = 0; i < this.count; i++) {
      result[i] = this.buffer[bufferIndex];
      bufferIndex = (bufferIndex + 1) % this.size;
    }
    
    return result;
  }
  
  get length() {
    return this.count;
  }
}

export default MathCore;