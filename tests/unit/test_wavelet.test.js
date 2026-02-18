import { test, describe, it, before } from 'node:test';
import assert from 'node:assert';
import { WaveletProcessor } from '../../core/math/processors/WaveletProcessor.js';

describe('WaveletProcessor', () => {
  let processor;

  before(() => {
    processor = new WaveletProcessor();
  });

  it('should find time-frequency ridges', () => {
    // Create a mock scalogram with a clear ridge
    const scalogram = [
      { scale: 1, frequency: 10, magnitude: [0.1, 0.1, 0.1], power: [0.01, 0.01, 0.01] },
      { scale: 2, frequency: 5, magnitude: [0.8, 0.9, 0.8], power: [0.64, 0.81, 0.64] }, // Ridge here
      { scale: 4, frequency: 2.5, magnitude: [0.1, 0.1, 0.1], power: [0.01, 0.01, 0.01] }
    ];

    const ridges = processor.findTimeFrequencyRidges(scalogram);

    assert.strictEqual(ridges.count, 3, 'Should find ridges for each time point');
    assert.strictEqual(ridges.ridges[1].frequency, 5, 'Should identify dominant frequency');
  });

  it('should compute instantaneous frequency', () => {
    const scalogram = [
      { scale: 1, frequency: 10, magnitude: [0.1, 0.1], power: [0.01, 0.01] },
      { scale: 2, frequency: 5, magnitude: [0.9, 0.9], power: [0.81, 0.81] }
    ];

    const freq = processor.computeInstantaneousFrequency(scalogram);

    assert.strictEqual(freq.avg, 5, 'Average frequency should be 5');
    assert.strictEqual(freq.variation, 0, 'Variation should be 0 for constant signal');
  });

  it('should compute frequency bandwidth', () => {
    const scalogram = [
      { scale: 1, frequency: 10, magnitude: [0.1], power: [0.1] },
      { scale: 2, frequency: 5, magnitude: [0.8], power: [0.8] },
      { scale: 4, frequency: 2.5, magnitude: [0.1], power: [0.1] }
    ];

    const bandwidth = processor.computeFrequencyBandwidth(scalogram);
    assert.ok(bandwidth > 0, 'Bandwidth should be positive');
  });

  it('should compute time-frequency concentration', () => {
    // Highly concentrated signal (one non-zero value)
    const concentrated = [
      { scale: 1, frequency: 10, power: [0, 0] },
      { scale: 2, frequency: 5, power: [1, 0] }
    ];

    const conc = processor.computeTimeFrequencyConcentration(concentrated);
    // Entropy of [1, 0, 0, 0] is 0. 1 - 0 = 1.
    assert.strictEqual(conc, 1, 'Concentration should be max (1)');

    // Dispersed signal
    const dispersed = [
      { scale: 1, frequency: 10, power: [0.25, 0.25] },
      { scale: 2, frequency: 5, power: [0.25, 0.25] }
    ];

    const concDisp = processor.computeTimeFrequencyConcentration(dispersed);
    // Entropy of uniform distribution is max. 1 - 1 = 0.
    assert.strictEqual(concDisp, 0, 'Concentration should be min (0)');
  });
});
