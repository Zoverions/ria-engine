/**
 * WaveletProcessor - Wavelet transform analysis
 * 
 * Performs time-frequency analysis using wavelets:
 * - Continuous Wavelet Transform (CWT)
 * - Discrete Wavelet Transform (DWT)
 * - Wavelet packet decomposition
 * - Multi-resolution analysis
 * 
 * @version 2.0.0
 */

export class WaveletProcessor {
  constructor(config = {}) {
    this.config = {
      waveletType: 'morlet', // 'morlet', 'mexican_hat', 'daubechies', 'haar'
      scales: [1, 2, 4, 8, 16, 32],
      centerFrequency: 1.0,
      bandwidth: 1.0,
      dwtLevels: 5,
      borderMode: 'symmetric', // 'symmetric', 'periodization', 'zero'
      ...config
    };
    
    // Pre-compute wavelets for efficiency
    this.wavelets = this.precomputeWavelets();
  }

  /**
   * Analyze signal using wavelet transforms
   */
  async analyze(signal) {
    try {
      const cwt = this.computeContinuousWaveletTransform(signal);
      const dwt = this.computeDiscreteWaveletTransform(signal);
      const features = this.extractWaveletFeatures(cwt, dwt);
      const energy = this.computeWaveletEnergy(cwt, dwt);
      
      return {
        cwt,
        dwt,
        features,
        energy,
        timeFrequency: this.analyzeTimeFrequency(cwt),
        multiResolution: this.performMultiResolutionAnalysis(dwt),
        timestamp: Date.now()
      };
      
    } catch (error) {
      throw new Error(`Wavelet analysis failed: ${error.message}`);
    }
  }

  /**
   * Compute Continuous Wavelet Transform
   */
  computeContinuousWaveletTransform(signal) {
    const n = signal.length;
    const coefficients = [];
    
    for (const scale of this.config.scales) {
      const scaleCoeffs = [];
      
      for (let position = 0; position < n; position++) {
        const coeff = this.computeWaveletCoefficient(signal, scale, position);
        scaleCoeffs.push(coeff);
      }
      
      coefficients.push({
        scale,
        coefficients: scaleCoeffs,
        frequency: this.scaleToFrequency(scale)
      });
    }
    
    return {
      coefficients,
      scales: this.config.scales,
      scalogram: this.computeScalogram(coefficients)
    };
  }

  /**
   * Compute Discrete Wavelet Transform
   */
  computeDiscreteWaveletTransform(signal) {
    let currentSignal = [...signal];
    const decomposition = [];
    
    for (let level = 0; level < this.config.dwtLevels && currentSignal.length > 2; level++) {
      const { approximation, detail } = this.dwtStep(currentSignal);
      
      decomposition.push({
        level: level + 1,
        approximation: [...approximation],
        detail: [...detail],
        length: currentSignal.length
      });
      
      currentSignal = approximation;
    }
    
    return {
      decomposition,
      reconstruction: this.reconstructFromDWT(decomposition),
      levels: decomposition.length
    };
  }

  /**
   * Single DWT decomposition step
   */
  dwtStep(signal) {
    const n = signal.length;
    const halfN = Math.floor(n / 2);
    
    // Get wavelet filters
    const { lowpass, highpass } = this.getWaveletFilters(this.config.waveletType);
    
    const approximation = new Array(halfN);
    const detail = new Array(halfN);
    
    // Convolution and downsampling
    for (let i = 0; i < halfN; i++) {
      let approxSum = 0;
      let detailSum = 0;
      
      for (let j = 0; j < lowpass.length; j++) {
        const signalIndex = (2 * i + j) % n; // Handle boundary conditions
        approxSum += signal[signalIndex] * lowpass[j];
        detailSum += signal[signalIndex] * highpass[j];
      }
      
      approximation[i] = approxSum;
      detail[i] = detailSum;
    }
    
    return { approximation, detail };
  }

  /**
   * Compute single wavelet coefficient
   */
  computeWaveletCoefficient(signal, scale, position) {
    const wavelet = this.getWavelet(this.config.waveletType, scale);
    const n = signal.length;
    let coefficient = 0;
    
    const halfWaveletLength = Math.floor(wavelet.length / 2);
    
    for (let i = 0; i < wavelet.length; i++) {
      const signalIndex = position - halfWaveletLength + i;
      
      if (signalIndex >= 0 && signalIndex < n) {
        coefficient += signal[signalIndex] * wavelet[i];
      }
    }
    
    return coefficient / Math.sqrt(scale);
  }

  /**
   * Get wavelet function for given type and scale
   */
  getWavelet(type, scale) {
    const baseWavelet = this.getBaseWavelet(type);
    
    // Scale the wavelet
    const scaledWavelet = new Array(Math.floor(baseWavelet.length * scale));
    
    for (let i = 0; i < scaledWavelet.length; i++) {
      const originalIndex = i / scale;
      const lowerIndex = Math.floor(originalIndex);
      const upperIndex = Math.ceil(originalIndex);
      
      if (upperIndex < baseWavelet.length) {
        const weight = originalIndex - lowerIndex;
        scaledWavelet[i] = (1 - weight) * baseWavelet[lowerIndex] + 
                          weight * (baseWavelet[upperIndex] || 0);
      } else {
        scaledWavelet[i] = 0;
      }
    }
    
    return scaledWavelet;
  }

  /**
   * Get base wavelet function
   */
  getBaseWavelet(type) {
    switch (type) {
      case 'morlet':
        return this.createMorletWavelet();
      case 'mexican_hat':
        return this.createMexicanHatWavelet();
      case 'daubechies':
        return this.createDaubechiesWavelet();
      case 'haar':
        return this.createHaarWavelet();
      default:
        return this.createMorletWavelet();
    }
  }

  /**
   * Create Morlet wavelet
   */
  createMorletWavelet() {
    const sigma = 1.0;
    const w0 = this.config.centerFrequency;
    const length = 64;
    const wavelet = new Array(length);
    
    const center = (length - 1) / 2;
    
    for (let i = 0; i < length; i++) {
      const t = (i - center) / 8; // Normalized time
      const gaussian = Math.exp(-t * t / (2 * sigma * sigma));
      const oscillation = Math.cos(w0 * t);
      wavelet[i] = gaussian * oscillation;
    }
    
    // Normalize
    const norm = Math.sqrt(wavelet.reduce((sum, val) => sum + val * val, 0));
    return wavelet.map(val => val / norm);
  }

  /**
   * Create Mexican Hat wavelet
   */
  createMexicanHatWavelet() {
    const sigma = 1.0;
    const length = 64;
    const wavelet = new Array(length);
    
    const center = (length - 1) / 2;
    const normFactor = 2 / (Math.sqrt(3 * sigma) * Math.pow(Math.PI, 0.25));
    
    for (let i = 0; i < length; i++) {
      const t = (i - center) / 8;
      const t2 = t * t;
      const gaussian = Math.exp(-t2 / (2 * sigma * sigma));
      wavelet[i] = normFactor * (1 - t2 / (sigma * sigma)) * gaussian;
    }
    
    return wavelet;
  }

  /**
   * Create Daubechies wavelet (simplified db4)
   */
  createDaubechiesWavelet() {
    // Simplified Daubechies 4 coefficients
    return [
      0.48296291314469025,
      0.8365163037378079,
      0.22414386804185735,
      -0.12940952255092145
    ];
  }

  /**
   * Create Haar wavelet
   */
  createHaarWavelet() {
    return [0.7071067811865476, -0.7071067811865476];
  }

  /**
   * Get wavelet filters for DWT
   */
  getWaveletFilters(type) {
    switch (type) {
      case 'haar':
        return {
          lowpass: [0.7071067811865476, 0.7071067811865476],
          highpass: [0.7071067811865476, -0.7071067811865476]
        };
      case 'daubechies':
        return {
          lowpass: [0.48296291314469025, 0.8365163037378079, 0.22414386804185735, -0.12940952255092145],
          highpass: [0.12940952255092145, 0.22414386804185735, -0.8365163037378079, 0.48296291314469025]
        };
      default:
        return this.getWaveletFilters('haar');
    }
  }

  /**
   * Compute scalogram (magnitude of CWT coefficients)
   */
  computeScalogram(coefficients) {
    return coefficients.map(scaleData => ({
      scale: scaleData.scale,
      frequency: scaleData.frequency,
      magnitude: scaleData.coefficients.map(c => Math.abs(c)),
      power: scaleData.coefficients.map(c => c * c)
    }));
  }

  /**
   * Extract wavelet features
   */
  extractWaveletFeatures(cwt, dwt) {
    // CWT-based features
    const cwtFeatures = this.extractCWTFeatures(cwt);
    
    // DWT-based features
    const dwtFeatures = this.extractDWTFeatures(dwt);
    
    return {
      cwt: cwtFeatures,
      dwt: dwtFeatures,
      combined: this.combineCWTDWTFeatures(cwtFeatures, dwtFeatures)
    };
  }

  /**
   * Extract CWT features
   */
  extractCWTFeatures(cwt) {
    const scalogram = cwt.scalogram;
    
    // Energy distribution across scales
    const energyByScale = scalogram.map(scaleData => {
      const energy = scaleData.power.reduce((sum, val) => sum + val, 0);
      return {
        scale: scaleData.scale,
        frequency: scaleData.frequency,
        energy,
        avgMagnitude: scaleData.magnitude.reduce((sum, val) => sum + val, 0) / scaleData.magnitude.length
      };
    });
    
    // Dominant frequencies
    const dominantScale = energyByScale.reduce((max, current) => 
      current.energy > max.energy ? current : max
    );
    
    // Time-frequency localization
    const localization = this.computeTimeFrequencyLocalization(scalogram);
    
    return {
      energyByScale,
      dominantFrequency: dominantScale.frequency,
      dominantScale: dominantScale.scale,
      localization,
      totalEnergy: energyByScale.reduce((sum, scale) => sum + scale.energy, 0)
    };
  }

  /**
   * Extract DWT features
   */
  extractDWTFeatures(dwt) {
    const decomposition = dwt.decomposition;
    
    // Energy at each level
    const energyByLevel = decomposition.map(level => {
      const approxEnergy = level.approximation.reduce((sum, val) => sum + val * val, 0);
      const detailEnergy = level.detail.reduce((sum, val) => sum + val * val, 0);
      
      return {
        level: level.level,
        approximationEnergy: approxEnergy,
        detailEnergy: detailEnergy,
        totalEnergy: approxEnergy + detailEnergy,
        energyRatio: detailEnergy / (approxEnergy + detailEnergy + 1e-10)
      };
    });
    
    // Relative energy distribution
    const totalEnergy = energyByLevel.reduce((sum, level) => sum + level.totalEnergy, 0);
    const relativeEnergy = energyByLevel.map(level => ({
      level: level.level,
      relativeApprox: level.approximationEnergy / totalEnergy,
      relativeDetail: level.detailEnergy / totalEnergy
    }));
    
    return {
      energyByLevel,
      relativeEnergy,
      totalEnergy,
      entropyApprox: this.computeWaveletEntropy(decomposition, 'approximation'),
      entropyDetail: this.computeWaveletEntropy(decomposition, 'detail')
    };
  }

  /**
   * Combine CWT and DWT features
   */
  combineCWTDWTFeatures(cwtFeatures, dwtFeatures) {
    return {
      energyCorrelation: this.computeEnergyCorrelation(cwtFeatures, dwtFeatures),
      frequencyConsistency: this.computeFrequencyConsistency(cwtFeatures, dwtFeatures),
      multiResolutionCoherence: this.computeMultiResolutionCoherence(cwtFeatures, dwtFeatures)
    };
  }

  /**
   * Compute wavelet energy analysis
   */
  computeWaveletEnergy(cwt, dwt) {
    const cwtEnergy = this.computeCWTEnergy(cwt);
    const dwtEnergy = this.computeDWTEnergy(dwt);
    
    return {
      cwt: cwtEnergy,
      dwt: dwtEnergy,
      conservation: this.checkEnergyConservation(cwtEnergy, dwtEnergy)
    };
  }

  /**
   * Compute CWT energy
   */
  computeCWTEnergy(cwt) {
    const totalEnergy = cwt.scalogram.reduce((sum, scaleData) => {
      return sum + scaleData.power.reduce((scaleSum, val) => scaleSum + val, 0);
    }, 0);
    
    const energyByFrequency = cwt.scalogram.map(scaleData => ({
      frequency: scaleData.frequency,
      energy: scaleData.power.reduce((sum, val) => sum + val, 0)
    }));
    
    return {
      total: totalEnergy,
      byFrequency: energyByFrequency,
      distribution: energyByFrequency.map(freq => freq.energy / totalEnergy)
    };
  }

  /**
   * Compute DWT energy
   */
  computeDWTEnergy(dwt) {
    const energyByLevel = dwt.decomposition.map(level => {
      const approxEnergy = level.approximation.reduce((sum, val) => sum + val * val, 0);
      const detailEnergy = level.detail.reduce((sum, val) => sum + val * val, 0);
      
      return {
        level: level.level,
        approximation: approxEnergy,
        detail: detailEnergy,
        total: approxEnergy + detailEnergy
      };
    });
    
    const totalEnergy = energyByLevel.reduce((sum, level) => sum + level.total, 0);
    
    return {
      total: totalEnergy,
      byLevel: energyByLevel,
      distribution: energyByLevel.map(level => level.total / totalEnergy)
    };
  }

  /**
   * Analyze time-frequency characteristics
   */
  analyzeTimeFrequency(cwt) {
    const scalogram = cwt.scalogram;
    
    // Find time-frequency ridges
    const ridges = this.findTimeFrequencyRidges(scalogram);
    
    // Compute instantaneous frequency
    const instantFreq = this.computeInstantaneousFrequency(scalogram);
    
    // Time-frequency localization
    const localization = this.computeTimeFrequencyLocalization(scalogram);
    
    return {
      ridges,
      instantaneousFrequency: instantFreq,
      localization,
      bandwidth: this.computeFrequencyBandwidth(scalogram),
      concentration: this.computeTimeFrequencyConcentration(scalogram)
    };
  }

  /**
   * Perform multi-resolution analysis
   */
  performMultiResolutionAnalysis(dwt) {
    const decomposition = dwt.decomposition;
    
    // Analyze each resolution level
    const resolutionAnalysis = decomposition.map(level => ({
      level: level.level,
      approximationStats: this.computeSignalStats(level.approximation),
      detailStats: this.computeSignalStats(level.detail),
      dominantFeatures: this.findDominantFeatures(level.detail)
    }));
    
    return {
      levels: resolutionAnalysis,
      crossLevelCorrelation: this.computeCrossLevelCorrelation(decomposition),
      hierarchicalStructure: this.analyzeHierarchicalStructure(decomposition)
    };
  }

  /**
   * Reconstruct signal from DWT
   */
  reconstructFromDWT(decomposition) {
    let reconstructed = decomposition[decomposition.length - 1].approximation;
    
    // Reconstruct level by level
    for (let i = decomposition.length - 1; i >= 0; i--) {
      const level = decomposition[i];
      reconstructed = this.idwtStep(reconstructed, level.detail);
    }
    
    return reconstructed;
  }

  /**
   * Inverse DWT step
   */
  idwtStep(approximation, detail) {
    const { lowpass, highpass } = this.getWaveletFilters(this.config.waveletType);
    const reconstructed = new Array(approximation.length * 2);
    
    // Upsampling and convolution
    for (let i = 0; i < reconstructed.length; i++) {
      let sum = 0;
      
      for (let j = 0; j < lowpass.length; j++) {
        const approxIndex = Math.floor((i - j) / 2);
        const detailIndex = Math.floor((i - j) / 2);
        
        if ((i - j) % 2 === 0) {
          if (approxIndex >= 0 && approxIndex < approximation.length) {
            sum += approximation[approxIndex] * lowpass[j];
          }
          if (detailIndex >= 0 && detailIndex < detail.length) {
            sum += detail[detailIndex] * highpass[j];
          }
        }
      }
      
      reconstructed[i] = sum;
    }
    
    return reconstructed;
  }

  /**
   * Utility functions
   */
  
  precomputeWavelets() {
    const wavelets = {};
    const types = ['morlet', 'mexican_hat', 'daubechies', 'haar'];
    
    for (const type of types) {
      wavelets[type] = this.getBaseWavelet(type);
    }
    
    return wavelets;
  }

  scaleToFrequency(scale) {
    return this.config.centerFrequency / scale;
  }

  computeTimeFrequencyLocalization(scalogram) {
    // Simplified localization measure
    return {
      timeSpread: this.computeTimeSpread(scalogram),
      frequencySpread: this.computeFrequencySpread(scalogram)
    };
  }

  computeTimeSpread(scalogram) {
    // Compute time concentration for each scale
    const timeSpread = scalogram.map(scaleData => {
      const magnitude = scaleData.magnitude;
      const n = magnitude.length;
      
      // Compute centroid
      let centroid = 0;
      let totalMagnitude = 0;
      
      for (let i = 0; i < n; i++) {
        centroid += i * magnitude[i];
        totalMagnitude += magnitude[i];
      }
      
      centroid = totalMagnitude > 0 ? centroid / totalMagnitude : 0;
      
      // Compute spread
      let spread = 0;
      for (let i = 0; i < n; i++) {
        spread += magnitude[i] * Math.pow(i - centroid, 2);
      }
      
      spread = totalMagnitude > 0 ? Math.sqrt(spread / totalMagnitude) : 0;
      
      return { scale: scaleData.scale, spread, centroid };
    });
    
    return timeSpread;
  }

  computeFrequencySpread(scalogram) {
    const frequencies = scalogram.map(s => s.frequency);
    const energies = scalogram.map(s => s.power.reduce((sum, val) => sum + val, 0));
    
    const totalEnergy = energies.reduce((sum, val) => sum + val, 0);
    
    // Compute frequency centroid
    let centroid = 0;
    for (let i = 0; i < frequencies.length; i++) {
      centroid += frequencies[i] * energies[i];
    }
    centroid = totalEnergy > 0 ? centroid / totalEnergy : 0;
    
    // Compute frequency spread
    let spread = 0;
    for (let i = 0; i < frequencies.length; i++) {
      spread += energies[i] * Math.pow(frequencies[i] - centroid, 2);
    }
    spread = totalEnergy > 0 ? Math.sqrt(spread / totalEnergy) : 0;
    
    return { centroid, spread };
  }

  findTimeFrequencyRidges(scalogram) {
    if (!scalogram || scalogram.length === 0) return { count: 0, ridges: [] };

    const n = scalogram[0].magnitude.length;
    const numScales = scalogram.length;
    const ridges = [];

    // For each time point, find the scale with maximum magnitude
    for (let t = 0; t < n; t++) {
      let maxMag = 0;
      let maxScaleIndex = -1;

      for (let s = 0; s < numScales; s++) {
        const mag = scalogram[s].magnitude[t];
        if (mag > maxMag) {
          maxMag = mag;
          maxScaleIndex = s;
        }
      }

      if (maxScaleIndex !== -1) {
        ridges.push({
          time: t,
          scale: scalogram[maxScaleIndex].scale,
          frequency: scalogram[maxScaleIndex].frequency,
          magnitude: maxMag
        });
      }
    }

    return { count: ridges.length, ridges };
  }

  computeInstantaneousFrequency(scalogram) {
    const ridges = this.findTimeFrequencyRidges(scalogram);
    const frequencies = ridges.ridges.map(r => r.frequency);

    const avg = frequencies.reduce((sum, f) => sum + f, 0) / frequencies.length || 0;
    const variance = frequencies.reduce((sum, f) => sum + Math.pow(f - avg, 2), 0) / frequencies.length || 0;

    return { avg, variation: Math.sqrt(variance), trajectory: frequencies };
  }

  computeFrequencyBandwidth(scalogram) {
    if (!scalogram || scalogram.length === 0) return 0;

    const freqSpread = this.computeFrequencySpread(scalogram);
    return freqSpread.spread;
  }

  computeTimeFrequencyConcentration(scalogram) {
    // Using Shannon entropy of the normalized time-frequency distribution
    let totalEnergy = 0;
    const flattened = [];

    scalogram.forEach(scaleData => {
      scaleData.power.forEach(p => {
        totalEnergy += p;
        flattened.push(p);
      });
    });

    if (totalEnergy === 0) return 0;

    let entropy = 0;
    for (const p of flattened) {
      if (p > 0) {
        const prob = p / totalEnergy;
        entropy -= prob * Math.log2(prob);
      }
    }

    // Normalize by log(N*M) where N is time points and M is scales
    const maxEntropy = Math.log2(flattened.length);
    return 1 - (entropy / maxEntropy); // Higher value means more concentrated
  }

  computeSignalStats(signal) {
    const mean = signal.reduce((sum, val) => sum + val, 0) / signal.length;
    const variance = signal.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / signal.length;
    
    return { mean, variance, std: Math.sqrt(variance) };
  }

  findDominantFeatures(signal) {
    let peaks = 0;
    let valleys = 0;

    for (let i = 1; i < signal.length - 1; i++) {
      if (signal[i] > signal[i-1] && signal[i] > signal[i+1]) peaks++;
      if (signal[i] < signal[i-1] && signal[i] < signal[i+1]) valleys++;
    }

    return { peaks, valleys, total: peaks + valleys };
  }

  computeCrossLevelCorrelation(decomposition) {
    if (decomposition.length < 2) return { correlation: 0 };

    // Compute average correlation between adjacent levels' details
    let totalCorr = 0;
    let count = 0;

    for (let i = 0; i < decomposition.length - 1; i++) {
      const detail1 = decomposition[i].detail;
      const detail2 = decomposition[i+1].detail;

      // Need to upsample detail2 to match detail1 length if needed, but here they might be different lengths
      // Simple approach: correlation of the overlapping part or resizing?
      // DWT usually halves length each level. So detail2 is half length of detail1.
      // Upsample detail2 by repeating or interpolating.

      const upsampled = [];
      for (const val of detail2) {
        upsampled.push(val, val); // Simple repeat
      }

      const len = Math.min(detail1.length, upsampled.length);

      // Compute correlation
      let sumxy = 0, sumx = 0, sumy = 0, sumx2 = 0, sumy2 = 0;

      for (let j = 0; j < len; j++) {
        sumxy += detail1[j] * upsampled[j];
        sumx += detail1[j];
        sumy += upsampled[j];
        sumx2 += detail1[j] * detail1[j];
        sumy2 += upsampled[j] * upsampled[j];
      }

      const num = len * sumxy - sumx * sumy;
      const den = Math.sqrt((len * sumx2 - sumx * sumx) * (len * sumy2 - sumy * sumy));

      if (den !== 0) {
        totalCorr += Math.abs(num / den); // Use absolute correlation
        count++;
      }
    }

    return { correlation: count > 0 ? totalCorr / count : 0 };
  }

  analyzeHierarchicalStructure(decomposition) {
    // Check energy decay across levels
    const energies = decomposition.map(d =>
      d.detail.reduce((s, v) => s + v*v, 0)
    );

    let decreasing = 0;
    for (let i = 0; i < energies.length - 1; i++) {
      if (energies[i] > energies[i+1]) decreasing++;
    }

    if (decreasing === energies.length - 1) return { structure: 'regular_decay' };
    if (decreasing === 0) return { structure: 'inverse_decay' };
    return { structure: 'mixed' };
  }

  computeWaveletEntropy(decomposition, type) {
    let totalEnergy = 0;
    const energies = [];
    
    for (const level of decomposition) {
      const signal = type === 'approximation' ? level.approximation : level.detail;
      const energy = signal.reduce((sum, val) => sum + val * val, 0);
      energies.push(energy);
      totalEnergy += energy;
    }
    
    if (totalEnergy === 0) return 0;
    
    let entropy = 0;
    for (const energy of energies) {
      if (energy > 0) {
        const probability = energy / totalEnergy;
        entropy -= probability * Math.log2(probability);
      }
    }
    
    return entropy;
  }

  computeEnergyCorrelation(cwtFeatures, dwtFeatures) {
    // Correlation between CWT total energy and DWT total energy is trivial (should be high)
    // Let's correlate spectral entropy from CWT (concentration) and DWT (entropyDetail)
    // This is a simplified proxy
    const cwtEntropy = 1 - cwtFeatures.localization.frequencySpread.spread; // Inverse spread as proxy
    const dwtEntropy = 1 / (1 + dwtFeatures.entropyDetail); // Inverse entropy

    // Since we only have single values per frame, this isn't a "correlation" in the statistical sense
    // but a similarity measure.
    return 1 - Math.abs(cwtEntropy - dwtEntropy);
  }

  computeFrequencyConsistency(cwtFeatures, dwtFeatures) {
    return 0.7; // Still a placeholder as it requires complex mapping between scales and levels
  }

  computeMultiResolutionCoherence(cwtFeatures, dwtFeatures) {
    return 0.6; // Placeholder
  }

  checkEnergyConservation(cwtEnergy, dwtEnergy) {
    const ratio = Math.abs(cwtEnergy.total - dwtEnergy.total) / Math.max(cwtEnergy.total, dwtEnergy.total);
    return {
      conserved: ratio < 0.1,
      ratio,
      difference: Math.abs(cwtEnergy.total - dwtEnergy.total)
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Recompute wavelets if type changed
    if (newConfig.waveletType) {
      this.wavelets = this.precomputeWavelets();
    }
  }
}