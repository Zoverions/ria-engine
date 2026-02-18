import { test, describe, it, before } from 'node:test';
import assert from 'node:assert';
import { MathCore } from '../../core/math/MathCore.js';

describe('MathCore', () => {
  let mathCore;

  before(() => {
    mathCore = new MathCore();
  });

  it('should initialize all processors correctly', async () => {
    await mathCore.initialize();

    assert.ok(mathCore.state.initialized, 'MathCore should be initialized');
    assert.ok(mathCore.stats, 'StatisticalProcessor should be initialized');
    assert.ok(mathCore.spectral, 'SpectralProcessor should be initialized');
    assert.ok(mathCore.fractal, 'FractalProcessor should be initialized');
    assert.ok(mathCore.wavelet, 'WaveletProcessor should be initialized');
  });

  it('should process input data and produce FI', async () => {
    const input = Array.from({ length: 100 }, () => Math.random());

    const result = await mathCore.process(input);

    assert.ok(typeof result.fi === 'number', 'FI should be a number');
    assert.ok(result.uiState, 'Should produce UI state');
    assert.ok(result.features.spectral, 'Should include spectral features');
    assert.ok(result.features.wavelet, 'Should include wavelet features');
  });

  it('should handle low SNR signals gracefully', async () => {
    const constantInput = Array.from({ length: 100 }, () => 0.5); // Zero variance

    const result = await mathCore.process(constantInput);

    assert.ok(result.fi >= 0, 'FI should be non-negative');
    assert.ok(result.uiState.gamma > 0, 'Gamma should be positive');
  });
});
