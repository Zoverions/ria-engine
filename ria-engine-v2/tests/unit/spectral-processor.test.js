/**
 * Unit Tests for SpectralProcessor
 * 
 * Tests the spectral analysis functionality including FFT computation,
 * spectral feature extraction, and frequency analysis accuracy.
 */

import { SpectralProcessor } from '../../core/math/processors/SpectralProcessor.js';

export default {
  setup: async () => {
    // Test setup code
  },
  
  teardown: async () => {
    // Test cleanup code
  },
  
  beforeEach: async () => {
    // Run before each test
  },
  
  afterEach: async () => {
    // Run after each test
  },
  
  tests: [
    {
      name: 'should initialize with default configuration',
      async run(assert) {
        const processor = new SpectralProcessor();
        
        assert.equal(processor.config.windowSize, 256);
        assert.equal(processor.config.overlap, 0.5);
        assert.equal(processor.config.windowType, 'hann');
        assert.equal(processor.config.fftSize, 512);
        assert.equal(processor.config.sampleRate, 1000);
      }
    },
    
    {
      name: 'should initialize with custom configuration',
      async run(assert) {
        const config = {
          windowSize: 128,
          fftSize: 256,
          sampleRate: 500,
          windowType: 'hamming'
        };
        
        const processor = new SpectralProcessor(config);
        
        assert.equal(processor.config.windowSize, 128);
        assert.equal(processor.config.fftSize, 256);
        assert.equal(processor.config.sampleRate, 500);
        assert.equal(processor.config.windowType, 'hamming');
      }
    },
    
    {
      name: 'should generate correct window functions',
      async run(assert) {
        const processor = new SpectralProcessor({ windowSize: 4 });
        
        // Test Hann window
        const hannWindow = processor.generateWindow('hann', 4);
        assert.equal(hannWindow.length, 4);
        assert.equal(hannWindow[0], 0); // Hann window starts at 0
        assert.equal(hannWindow[3], 0); // Hann window ends at 0
        
        // Test Hamming window
        const hammingWindow = processor.generateWindow('hamming', 4);
        assert.equal(hammingWindow.length, 4);
        
        // Test rectangular window
        const rectWindow = processor.generateWindow('rectangular', 4);
        assert.equal(rectWindow.length, 4);
        assert.equal(rectWindow[0], 1);
        assert.equal(rectWindow[3], 1);
      }
    },
    
    {
      name: 'should apply window function correctly',
      async run(assert) {
        const processor = new SpectralProcessor({ windowSize: 4 });
        const signal = [1, 2, 3, 4];
        
        const windowed = processor.applyWindow(signal);
        
        assert.equal(windowed.length, signal.length);
        // Windowed signal should be different from original (except for rectangular window)
        // First and last samples should be reduced due to window tapering
      }
    },
    
    {
      name: 'should compute FFT correctly for known signals',
      async run(assert) {
        const processor = new SpectralProcessor({ fftSize: 8 });
        
        // Test with DC signal (all ones)
        const dcSignal = new Float32Array([1, 1, 1, 1, 1, 1, 1, 1]);
        const fftResult = processor.computeFFT(dcSignal);
        
        assert.equal(fftResult.length, 8);
        
        // DC component should be at index 0 with maximum energy
        assert.equal(fftResult[0].real, 8); // Sum of all samples
        assert.equal(fftResult[0].imag, 0);
        
        // Other frequency bins should have minimal energy for DC signal
        for (let i = 1; i < fftResult.length; i++) {
          const magnitude = Math.sqrt(fftResult[i].real ** 2 + fftResult[i].imag ** 2);
          assert.equal(magnitude < 0.001, true, `Frequency bin ${i} should have minimal energy`);
        }
      }
    },
    
    {
      name: 'should compute power spectrum correctly',
      async run(assert) {
        const processor = new SpectralProcessor();
        
        const fftResult = [
          { real: 4, imag: 0 },    // DC: power = 16
          { real: 3, imag: 4 },    // power = 9 + 16 = 25
          { real: 0, imag: 5 },    // power = 0 + 25 = 25
          { real: -2, imag: -1 }   // power = 4 + 1 = 5
        ];
        
        const powerSpectrum = processor.computePowerSpectrum(fftResult);
        
        assert.equal(powerSpectrum.length, 4);
        assert.equal(powerSpectrum[0], 16);
        assert.equal(powerSpectrum[1], 25);
        assert.equal(powerSpectrum[2], 25);
        assert.equal(powerSpectrum[3], 5);
      }
    },
    
    {
      name: 'should extract spectral features correctly',
      async run(assert) {
        const processor = new SpectralProcessor({ 
          fftSize: 8, 
          sampleRate: 8 
        });
        
        // Create a known FFT result with energy concentrated at 2 Hz
        const fftResult = [
          { real: 0, imag: 0 },    // 0 Hz: power = 0
          { real: 0, imag: 0 },    // 1 Hz: power = 0  
          { real: 4, imag: 0 },    // 2 Hz: power = 16 (dominant)
          { real: 0, imag: 0 },    // 3 Hz: power = 0
          { real: 0, imag: 0 },    // 4 Hz: power = 0
          { real: 0, imag: 0 },    // 5 Hz: power = 0
          { real: 0, imag: 0 },    // 6 Hz: power = 0
          { real: 0, imag: 0 }     // 7 Hz: power = 0
        ];
        
        const features = processor.extractSpectralFeatures(fftResult);
        
        // Spectral centroid should be at 2 Hz (where the energy is concentrated)
        assert.equal(Math.abs(features.centroid - 2) < 0.1, true, 
          `Centroid should be ~2Hz, got ${features.centroid}`);
        
        // Bandwidth should be very small (energy concentrated at one frequency)
        assert.equal(features.bandwidth < 1, true, 
          `Bandwidth should be small, got ${features.bandwidth}`);
        
        // Total energy should be 16
        assert.equal(features.energy, 16);
        
        // Rolloff should be at or near 2 Hz
        assert.equal(Math.abs(features.rolloff - 2) < 0.5, true,
          `Rolloff should be ~2Hz, got ${features.rolloff}`);
      }
    },
    
    {
      name: 'should handle empty or invalid input gracefully',
      async run(assert) {
        const processor = new SpectralProcessor();
        
        // Test with empty signal
        const emptyResult = await processor.analyze([]);
        assert.equal(emptyResult.features.centroid, 0);
        assert.equal(emptyResult.features.bandwidth, 0);
        assert.equal(emptyResult.features.energy, 0);
        
        // Test with single sample
        const singleResult = await processor.analyze([1]);
        assert.equal(typeof singleResult.features.centroid, 'number');
        assert.equal(isNaN(singleResult.features.centroid), false);
      }
    },
    
    {
      name: 'should analyze real sine wave signal accurately',
      async run(assert) {
        const processor = new SpectralProcessor({
          windowSize: 128,
          fftSize: 256,
          sampleRate: 1000
        });
        
        // Generate 50 Hz sine wave
        const frequency = 50;
        const sampleRate = 1000;
        const signal = Array.from({ length: 128 }, (_, i) => 
          Math.sin(2 * Math.PI * frequency * i / sampleRate)
        );
        
        const result = await processor.analyze(signal);
        
        // Spectral centroid should be close to 50 Hz
        assert.equal(Math.abs(result.features.centroid - frequency) < 5, true,
          `Centroid should be ~${frequency}Hz, got ${result.features.centroid}`);
        
        // Energy should be positive
        assert.equal(result.features.energy > 0, true);
        
        // Bandwidth should be reasonable for a sine wave
        assert.equal(result.features.bandwidth < 20, true,
          `Bandwidth should be small for sine wave, got ${result.features.bandwidth}`);
      }
    },
    
    {
      name: 'should update configuration correctly',
      async run(assert) {
        const processor = new SpectralProcessor({ windowSize: 256 });
        
        assert.equal(processor.config.windowSize, 256);
        assert.equal(processor.config.windowType, 'hann');
        
        processor.updateConfig({ 
          windowSize: 512, 
          windowType: 'hamming' 
        });
        
        assert.equal(processor.config.windowSize, 512);
        assert.equal(processor.config.windowType, 'hamming');
        
        // Window function should be regenerated
        assert.equal(processor.windowFunction.length, 512);
      }
    }
  ]
};