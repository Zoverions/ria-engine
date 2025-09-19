/**
 * SpectralProcessor - Advanced spectral analysis
 * 
 * Performs comprehensive frequency domain analysis including:
 * - FFT-based spectral analysis
 * - Power spectral density estimation
 * - Spectral features extraction
 * - Cross-spectral analysis
 * 
 * @version 2.0.0
 */

export class SpectralProcessor {
  constructor(config = {}) {
    this.config = {
      windowSize: 256,
      overlap: 0.5,
      windowType: 'hann',
      fftSize: 512,
      sampleRate: 1000,
      enableGPU: false,
      ...config
    };
    
    this.cache = new Map();
    this.windowFunction = this.generateWindow(this.config.windowType, this.config.windowSize);
  }

  /**
   * Analyze signal in frequency domain
   */
  async analyze(signal) {
    try {
      // Apply windowing
      const windowed = this.applyWindow(signal);
      
      // Compute FFT
      const fftResult = this.computeFFT(windowed);
      
      // Extract spectral features
      const features = this.extractSpectralFeatures(fftResult);
      
      return {
        fft: fftResult,
        features,
        powerSpectrum: this.computePowerSpectrum(fftResult),
        spectralCentroid: features.centroid,
        spectralBandwidth: features.bandwidth,
        spectralRolloff: features.rolloff,
        timestamp: Date.now()
      };
      
    } catch (error) {
      throw new Error(`Spectral analysis failed: ${error.message}`);
    }
  }

  /**
   * Generate window function
   */
  generateWindow(type, size) {
    const window = new Float32Array(size);
    
    switch (type) {
      case 'hann':
        for (let i = 0; i < size; i++) {
          window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1)));
        }
        break;
      case 'hamming':
        for (let i = 0; i < size; i++) {
          window[i] = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (size - 1));
        }
        break;
      case 'blackman':
        for (let i = 0; i < size; i++) {
          const a0 = 0.42;
          const a1 = 0.5;
          const a2 = 0.08;
          window[i] = a0 - a1 * Math.cos(2 * Math.PI * i / (size - 1)) +
                     a2 * Math.cos(4 * Math.PI * i / (size - 1));
        }
        break;
      default:
        window.fill(1); // Rectangular window
    }
    
    return window;
  }

  /**
   * Apply window function to signal
   */
  applyWindow(signal) {
    const windowed = new Float32Array(signal.length);
    const windowSize = Math.min(signal.length, this.windowFunction.length);
    
    for (let i = 0; i < windowSize; i++) {
      windowed[i] = signal[i] * this.windowFunction[i];
    }
    
    return windowed;
  }

  /**
   * Compute FFT using optimized algorithm
   */
  computeFFT(signal) {
    const N = this.config.fftSize;
    const padded = new Float32Array(N);
    
    // Zero-pad signal to FFT size
    const copyLength = Math.min(signal.length, N);
    for (let i = 0; i < copyLength; i++) {
      padded[i] = signal[i];
    }
    
    // Compute FFT using Cooley-Tukey algorithm
    return this.cooleyTukeyFFT(padded);
  }

  /**
   * Cooley-Tukey FFT implementation
   */
  cooleyTukeyFFT(x) {
    const N = x.length;
    if (N <= 1) return [{ real: x[0] || 0, imag: 0 }];
    
    // Bit-reverse permutation
    const X = new Array(N);
    for (let i = 0; i < N; i++) {
      const j = this.bitReverse(i, Math.log2(N));
      X[j] = { real: x[i], imag: 0 };
    }
    
    // Compute FFT
    for (let size = 2; size <= N; size *= 2) {
      const halfSize = size / 2;
      const w = { real: Math.cos(-2 * Math.PI / size), imag: Math.sin(-2 * Math.PI / size) };
      
      for (let i = 0; i < N; i += size) {
        let wn = { real: 1, imag: 0 };
        
        for (let j = 0; j < halfSize; j++) {
          const u = X[i + j];
          const t = this.complexMultiply(wn, X[i + j + halfSize]);
          
          X[i + j] = this.complexAdd(u, t);
          X[i + j + halfSize] = this.complexSubtract(u, t);
          
          wn = this.complexMultiply(wn, w);
        }
      }
    }
    
    return X;
  }

  /**
   * Bit reverse for FFT
   */
  bitReverse(n, bits) {
    let reversed = 0;
    for (let i = 0; i < bits; i++) {
      reversed = (reversed << 1) | (n & 1);
      n >>= 1;
    }
    return reversed;
  }

  /**
   * Complex number operations
   */
  complexMultiply(a, b) {
    return {
      real: a.real * b.real - a.imag * b.imag,
      imag: a.real * b.imag + a.imag * b.real
    };
  }

  complexAdd(a, b) {
    return {
      real: a.real + b.real,
      imag: a.imag + b.imag
    };
  }

  complexSubtract(a, b) {
    return {
      real: a.real - b.real,
      imag: a.imag - b.imag
    };
  }

  /**
   * Compute power spectrum
   */
  computePowerSpectrum(fftResult) {
    return fftResult.map(complex => 
      complex.real * complex.real + complex.imag * complex.imag
    );
  }

  /**
   * Extract spectral features
   */
  extractSpectralFeatures(fftResult) {
    const powerSpectrum = this.computePowerSpectrum(fftResult);
    const freqs = this.getFrequencyBins();
    
    // Spectral centroid
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < powerSpectrum.length; i++) {
      numerator += freqs[i] * powerSpectrum[i];
      denominator += powerSpectrum[i];
    }
    const centroid = denominator > 0 ? numerator / denominator : 0;
    
    // Spectral bandwidth
    let bandwidthNumerator = 0;
    for (let i = 0; i < powerSpectrum.length; i++) {
      const diff = freqs[i] - centroid;
      bandwidthNumerator += diff * diff * powerSpectrum[i];
    }
    const bandwidth = denominator > 0 ? Math.sqrt(bandwidthNumerator / denominator) : 0;
    
    // Spectral rolloff (85% of energy)
    const totalEnergy = powerSpectrum.reduce((sum, val) => sum + val, 0);
    const rolloffThreshold = 0.85 * totalEnergy;
    let cumulativeEnergy = 0;
    let rolloff = 0;
    for (let i = 0; i < powerSpectrum.length; i++) {
      cumulativeEnergy += powerSpectrum[i];
      if (cumulativeEnergy >= rolloffThreshold) {
        rolloff = freqs[i];
        break;
      }
    }
    
    return {
      centroid,
      bandwidth,
      rolloff,
      energy: totalEnergy,
      entropy: this.computeSpectralEntropy(powerSpectrum)
    };
  }

  /**
   * Get frequency bins
   */
  getFrequencyBins() {
    const bins = [];
    const binWidth = this.config.sampleRate / this.config.fftSize;
    
    for (let i = 0; i < this.config.fftSize / 2; i++) {
      bins.push(i * binWidth);
    }
    
    return bins;
  }

  /**
   * Compute spectral entropy
   */
  computeSpectralEntropy(powerSpectrum) {
    const total = powerSpectrum.reduce((sum, val) => sum + val, 0);
    if (total === 0) return 0;
    
    let entropy = 0;
    for (const power of powerSpectrum) {
      if (power > 0) {
        const probability = power / total;
        entropy -= probability * Math.log2(probability);
      }
    }
    
    return entropy;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Regenerate window function if changed
    if (newConfig.windowType || newConfig.windowSize) {
      this.windowFunction = this.generateWindow(this.config.windowType, this.config.windowSize);
    }
  }
}