import { test, describe, it, before } from 'node:test';
import assert from 'node:assert';
import { AntifragileManager } from '../../antifragile/AntifragileManager.js';

describe('AntifragileManager', () => {
  let manager;

  before(() => {
    manager = new AntifragileManager();
  });

  it('should identify periodic temporal patterns', () => {
    const now = Date.now();
    const interval = 60000; // 1 minute

    // Create recurring fractures
    const fractures = [
      { timestamp: now - interval * 4 },
      { timestamp: now - interval * 3 },
      { timestamp: now - interval * 2 },
      { timestamp: now - interval * 1 }
    ];

    const patterns = manager.findTemporalPatterns(fractures);

    assert.strictEqual(patterns.length > 0, true, 'Should find at least one pattern');
    assert.strictEqual(patterns[0].type, 'periodic_fracture');
    assert.ok(Math.abs(patterns[0].interval - interval) < 100, 'Interval should be approximately 1 minute');
  });

  it('should identify contextual triggers', () => {
    const fractures = [
      { context: { domain: 'coding', task: 'debugging' } },
      { context: { domain: 'coding', task: 'debugging' } },
      { context: { domain: 'writing', task: 'email' } },
      { context: { domain: 'coding', task: 'debugging' } }
    ];

    const triggers = manager.findContextualTriggers(fractures);

    assert.strictEqual(triggers.length > 0, true, 'Should find contextual triggers');
    assert.strictEqual(triggers[0].domain, 'coding');
    assert.strictEqual(triggers[0].task, 'debugging');
    assert.strictEqual(triggers[0].count, 3);
  });

  it('should identify user vulnerabilities based on personality factors', () => {
    manager.state.userCognitiveProfile.personalityFactors = {
      stressSensitivity: 0.8,
      complexityTolerance: 0.2,
      notificationSensitivity: 0.5
    };

    const fractures = []; // Not needed for this check as it uses state
    const vulnerabilities = manager.identifyUserVulnerabilities(fractures);

    assert.strictEqual(vulnerabilities.length, 2, 'Should identify 2 vulnerabilities');
    assert.ok(vulnerabilities.some(v => v.type === 'high_stress_sensitivity'));
    assert.ok(vulnerabilities.some(v => v.type === 'low_complexity_tolerance'));
  });

  it('should calculate dynamic critical threshold', () => {
    // Simulated FI progression with a spike
    const preFrames = [
      { fi: 0.1 }, { fi: 0.2 }, { fi: 0.25 }, // Steady increase
      { fi: 0.3 }, { fi: 0.6 }, { fi: 0.8 }   // Sudden acceleration
    ];

    const fractureFrame = { fi: 0.9 };

    const threshold = manager.findCriticalThreshold(preFrames, fractureFrame);

    // The max acceleration is between 0.3, 0.6, 0.8
    // 0.6 - 2*0.3 + 0.25 = 0.25
    // 0.8 - 2*0.6 + 0.3 = -0.1
    // Wait, let's trace:
    // i=2 (fi=0.25): 0.25 - 2*0.2 + 0.1 = -0.05
    // i=3 (fi=0.3): 0.3 - 2*0.25 + 0.2 = 0
    // i=4 (fi=0.6): 0.6 - 2*0.3 + 0.25 = 0.25  <-- Max acceleration
    // i=5 (fi=0.8): 0.8 - 2*0.6 + 0.3 = -0.1

    // So critical index is 4, value is 0.6

    assert.strictEqual(threshold, 0.6, 'Should identify 0.6 as critical threshold');
  });
});
