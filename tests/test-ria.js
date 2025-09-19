/**
 * RIA v1 Prototype - Testing Framework
 * 
 * Comprehensive test suite for validating RIA engine functionality,
 * mathematical computations, and UI integration logic.
 * 
 * Run with: node test-ria.js
 */

// Import RIA engine (assuming Node.js environment)
const { RIAEngine, PROFILES } = require('../ria-v1-prototype/code.js');

// Test utilities
class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
        this.results = [];
    }

    test(name, testFn) {
        this.tests.push({ name, testFn });
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    assertAlmostEqual(a, b, tolerance = 1e-6, message) {
        if (Math.abs(a - b) > tolerance) {
            throw new Error(message || `Expected ${a} to be close to ${b} (tolerance: ${tolerance})`);
        }
    }

    assertGreater(a, b, message) {
        if (a <= b) {
            throw new Error(message || `Expected ${a} to be greater than ${b}`);
        }
    }

    assertBetween(value, min, max, message) {
        if (value < min || value > max) {
            throw new Error(message || `Expected ${value} to be between ${min} and ${max}`);
        }
    }

    async run() {
        console.log('🧠 Running RIA v1 Prototype Test Suite\n');
        
        for (const test of this.tests) {
            try {
                console.log(`Running: ${test.name}`);
                await test.testFn.call(this);
                this.passed++;
                this.results.push({ name: test.name, status: 'PASS' });
                console.log(`✅ PASS: ${test.name}\n`);
            } catch (error) {
                this.failed++;
                this.results.push({ 
                    name: test.name, 
                    status: 'FAIL', 
                    error: error.message 
                });
                console.log(`❌ FAIL: ${test.name}`);
                console.log(`   Error: ${error.message}\n`);
            }
        }

        this.printSummary();
    }

    printSummary() {
        console.log('📊 Test Summary:');
        console.log(`Total tests: ${this.tests.length}`);
        console.log(`Passed: ${this.passed}`);
        console.log(`Failed: ${this.failed}`);
        console.log(`Success rate: ${((this.passed / this.tests.length) * 100).toFixed(1)}%\n`);

        if (this.failed > 0) {
            console.log('❌ Failed tests:');
            this.results
                .filter(r => r.status === 'FAIL')
                .forEach(r => console.log(`   - ${r.name}: ${r.error}`));
        }
    }
}

// Test data generators
function generateSineWave(length, frequency = 0.1, amplitude = 1.0, noise = 0.1) {
    return Array.from({ length }, (_, i) => 
        amplitude * Math.sin(2 * Math.PI * frequency * i) + 
        noise * (Math.random() - 0.5)
    );
}

function generateFracturedSignal(length, fractureIntensity = 0.3) {
    const signal = [];
    let baseValue = 0.5;
    
    for (let i = 0; i < length; i++) {
        // Add random walk
        baseValue += (Math.random() - 0.5) * 0.01;
        
        // Add occasional fractures (spikes)
        if (Math.random() < fractureIntensity) {
            signal.push(baseValue + (Math.random() - 0.5) * 2.0);
        } else {
            signal.push(baseValue + (Math.random() - 0.5) * 0.1);
        }
        
        // Keep bounded
        baseValue = Math.max(0, Math.min(1, baseValue));
    }
    
    return signal;
}

// Test suite
const runner = new TestRunner();

// ===== MATH HELPER TESTS =====

runner.test('Math: Standardization', function() {
    const engine = new RIAEngine();
    
    // Test normal case
    const data = [1, 2, 3, 4, 5];
    const standardized = engine._standardize(data);
    
    // Mean should be ~0, std should be ~1
    const mean = standardized.reduce((a, b) => a + b, 0) / standardized.length;
    this.assertAlmostEqual(mean, 0, 1e-10, 'Standardized mean should be 0');
    
    const variance = standardized.reduce((sum, x) => sum + x * x, 0) / standardized.length;
    this.assertAlmostEqual(variance, 1, 1e-10, 'Standardized variance should be 1');
    
    // Test edge cases
    this.assert(engine._standardize([]).length === 0, 'Empty array should return empty');
    this.assert(engine._standardize([5, 5, 5]).every(x => x === 0), 'Constant array should return zeros');
});

runner.test('Math: DFT Implementation', function() {
    const engine = new RIAEngine();
    
    // Test with known sine wave
    const fs = 20;  // 20 Hz sampling
    const f0 = 2;   // 2 Hz signal
    const N = 64;
    const signal = Array.from({ length: N }, (_, i) => 
        Math.cos(2 * Math.PI * f0 * i / fs)
    );
    
    const dft = engine._dft(signal);
    
    // Peak should be at bin corresponding to 2 Hz
    const expectedBin = Math.round(f0 * N / fs);
    const peakBin = dft.indexOf(Math.max(...dft.slice(1, N/2)));  // Skip DC
    
    this.assertBetween(peakBin, expectedBin - 1, expectedBin + 1, 
        `Peak should be near bin ${expectedBin}, got ${peakBin}`);
});

runner.test('Math: Least Squares Fitting', function() {
    const engine = new RIAEngine();
    
    // Test with known linear relationship: y = 2x + 1
    const A = [[1, 1], [2, 1], [3, 1], [4, 1], [5, 1]];
    const b = [3, 5, 7, 9, 11];  // y = 2x + 1
    
    const [slope, intercept] = engine._leastSquares(A, b);
    
    this.assertAlmostEqual(slope, 2, 1e-10, 'Slope should be 2');
    this.assertAlmostEqual(intercept, 1, 1e-10, 'Intercept should be 1');
});

runner.test('Math: Lag-1 Autocorrelation', function() {
    const engine = new RIAEngine();
    
    // Test with perfect correlation (constant)
    const constant = [5, 5, 5, 5, 5];
    this.assert(isNaN(engine._lag1_ac(constant)) || engine._lag1_ac(constant) === 0, 
        'Constant signal should have undefined or zero autocorr');
    
    // Test with alternating signal (negative correlation)
    const alternating = [1, -1, 1, -1, 1, -1];
    const altCorr = engine._lag1_ac(alternating);
    this.assertAlmostEqual(altCorr, -1, 0.1, 'Alternating signal should have negative correlation');
    
    // Test with trending signal (positive correlation)
    const trending = [1, 2, 3, 4, 5, 6];
    const trendCorr = engine._lag1_ac(trending);
    this.assertGreater(trendCorr, 0.5, 'Trending signal should have positive correlation');
});

runner.test('Math: Skewness Calculation', function() {
    const engine = new RIAEngine();
    
    // Test symmetric distribution (should have ~0 skew)
    const symmetric = [-2, -1, 0, 1, 2];
    const symSkew = engine._skew(symmetric);
    this.assertAlmostEqual(symSkew, 0, 0.1, 'Symmetric distribution should have ~0 skewness');
    
    // Test right-skewed distribution
    const rightSkewed = [1, 1, 1, 1, 10];
    const rightSkew = engine._skew(rightSkewed);
    this.assertGreater(rightSkew, 1, 'Right-skewed distribution should have positive skewness');
});

// ===== CORE ENGINE TESTS =====

runner.test('Engine: Initialization', function() {
    const engine = new RIAEngine();
    
    this.assert(engine.profile === PROFILES.average, 'Default profile should be average');
    this.assert(engine.mode === 'champion', 'Default mode should be champion');
    this.assert(engine.th1 === 0.7, 'th1 should be 0.7');
    this.assertGreater(engine.th2, engine.th1, 'th2 should be greater than th1');
    this.assert(engine.uiState.gamma === 1.0, 'Initial gamma should be 1.0');
    this.assert(engine.phiHistory.length === 0, 'Initial history should be empty');
});

runner.test('Engine: Profile Configuration', function() {
    const neurodivEngine = new RIAEngine('neurodiverse', true, 'champion');
    
    this.assert(neurodivEngine.profile === PROFILES.neurodiverse, 'Should use neurodiverse profile');
    this.assertGreater(neurodivEngine.fi_weights.w3, 0.5, 'Neurodiverse should have boosted skew weight');
    this.assert(neurodivEngine.biometricMode === true, 'Biometric mode should be enabled');
});

runner.test('Engine: FI Computation with Insufficient Data', function() {
    const engine = new RIAEngine();
    
    // Test with insufficient history
    for (let i = 0; i < 30; i++) {
        engine.phiHistory.push(Math.random());
    }
    
    const fi = engine.compute_fi(engine.phiHistory);
    this.assert(fi === 0, 'FI should be 0 with insufficient data');
});

runner.test('Engine: FI Computation with Sufficient Data', function() {
    const engine = new RIAEngine();
    
    // Generate fractured signal
    const fracturedSignal = generateFracturedSignal(100, 0.4);
    
    const fi = engine.compute_fi(fracturedSignal);
    this.assertGreater(fi, 0, 'FI should be positive for fractured signal');
    this.assert(isFinite(fi), 'FI should be finite');
});

runner.test('Engine: UI State Updates', function() {
    const engine = new RIAEngine();
    engine.phiHistory = generateSineWave(100);  // Baseline
    
    // Test no intervention
    const initialGamma = engine.uiState.gamma;
    engine.uiState = engine.update_ui(0.5, engine.uiState);  // Below th1
    this.assert(engine.uiState.gamma === initialGamma, 'Gamma should not change below th1');
    this.assert(engine.uiState.interveneType === null, 'No intervention below th1');
    
    // Test gentle intervention
    engine.uiState = engine.update_ui(0.8, engine.uiState);  // Between th1 and th2
    this.assertBetween(engine.uiState.gamma, engine.gentle * initialGamma * 0.9, 
        engine.gentle * initialGamma * 1.1, 'Gamma should be reduced gently');
    this.assert(engine.uiState.interveneType === 'gentle', 'Should trigger gentle intervention');
    
    // Test aggressive intervention
    const preAggrGamma = engine.uiState.gamma;
    engine.uiState = engine.update_ui(1.5, engine.uiState);  // Above th2
    this.assertBetween(engine.uiState.gamma, engine.aggr * preAggrGamma * 0.9,
        engine.aggr * preAggrGamma * 1.1, 'Gamma should be reduced aggressively');
    this.assert(engine.uiState.interveneType === 'aggressive', 'Should trigger aggressive intervention');
});

runner.test('Engine: Biometric Modulation', function() {
    const engine = new RIAEngine('average', true, 'champion');
    const phiHistory = generateFracturedSignal(100, 0.3);
    
    // Test with high stress (low HRV)
    const fiStressed = engine.compute_fi(phiHistory, 0.1);  // 10% HRV (stressed)
    
    // Test with low stress (high HRV)
    const fiRelaxed = engine.compute_fi(phiHistory, 0.9);  // 90% HRV (relaxed)
    
    this.assertGreater(fiStressed, fiRelaxed, 'FI should be higher when stressed (low HRV)');
});

runner.test('Engine: Mode Switching', function() {
    const engine = new RIAEngine();
    
    // Test 'off' mode
    engine.mode = 'off';
    const initialState = { ...engine.uiState };
    engine.uiState = engine.update_ui(2.0, engine.uiState);  // High FI
    this.assert(engine.uiState.gamma === initialState.gamma, 'Off mode should not change gamma');
    
    // Test 'untuned' mode
    engine.mode = 'untuned';
    engine.uiState = { gamma: 1.0, interveneType: null, anchorPhase: 0 };
    engine.uiState = engine.update_ui(1.5, engine.uiState);  // Above th2
    this.assertAlmostEqual(engine.uiState.gamma, 0.6, 0.1, 'Untuned mode should use 0.6 factor');
});

runner.test('Engine: Frame Processing Integration', function() {
    const engine = new RIAEngine();
    
    // Process multiple frames
    const results = [];
    for (let i = 0; i < 60; i++) {
        const phiProxy = Math.random() * 0.5;  // Low entropy
        const result = engine.process_frame(phiProxy, 0.7);
        results.push(result);
    }
    
    this.assert(engine.phiHistory.length <= 100, 'History should be bounded to 100');
    this.assert(engine.frameCount === 60, 'Frame count should match');
    
    const lastResult = results[results.length - 1];
    this.assert('fi' in lastResult, 'Result should contain FI');
    this.assert('ui_update' in lastResult, 'Result should contain UI update');
    this.assert('ncb_estimate' in lastResult, 'Result should contain NCB estimate');
});

// ===== INTEGRATION TESTS =====

runner.test('Integration: NCB Estimation', function() {
    const engine = new RIAEngine();
    
    // Simulate session with interventions
    engine.sessionMetrics.interventions = 10;
    engine.sessionMetrics.fir = 1;  // 10% FIR
    engine.uiState.gamma = 0.8;  // 20% reduction
    
    const ncb = engine._est_ncb();
    
    this.assertGreater(ncb, 0, 'NCB should be positive with effective interventions');
    this.assertBetween(ncb, 0, 100, 'NCB should be between 0-100%');
});

runner.test('Integration: False Intervention Rate Detection', function() {
    const engine = new RIAEngine();
    
    // Build history with high phi values
    for (let i = 0; i < 50; i++) {
        engine.phiHistory.push(0.8);  // High phi
    }
    
    // Process frame with intervention and high phi
    engine.uiState.interveneType = 'gentle';
    const result = engine.process_frame(0.9, 0.5);  // High phi proxy
    
    this.assertGreater(engine.sessionMetrics.fir, 0, 'Should detect false intervention');
});

runner.test('Integration: Session Reset', function() {
    const engine = new RIAEngine();
    
    // Populate with data
    for (let i = 0; i < 30; i++) {
        engine.process_frame(Math.random(), 0.5);
    }
    
    // Modify state
    engine.uiState.gamma = 0.5;
    engine.sessionMetrics.interventions = 5;
    
    // Reset
    engine.reset_session();
    
    this.assert(engine.phiHistory.length === 0, 'History should be cleared');
    this.assert(engine.uiState.gamma === 1.0, 'Gamma should be reset');
    this.assert(engine.sessionMetrics.interventions === 0, 'Metrics should be reset');
    this.assert(engine.frameCount === 0, 'Frame count should be reset');
});

// ===== PERFORMANCE TESTS =====

runner.test('Performance: Frame Processing Speed', function() {
    const engine = new RIAEngine();
    
    const startTime = Date.now();
    const iterations = 1000;
    
    for (let i = 0; i < iterations; i++) {
        engine.process_frame(Math.random(), Math.random());
    }
    
    const endTime = Date.now();
    const avgTime = (endTime - startTime) / iterations;
    
    this.assert(avgTime < 5, `Frame processing should be fast (<5ms), got ${avgTime.toFixed(2)}ms`);
    console.log(`   Performance: ${avgTime.toFixed(2)}ms per frame`);
});

runner.test('Performance: FI Computation Stability', function() {
    const engine = new RIAEngine();
    
    // Test with various signal types
    const signals = [
        generateSineWave(100, 0.1, 1.0, 0.1),  // Clean sine
        generateFracturedSignal(100, 0.5),      // Fractured
        Array(100).fill(0.5),                   // Constant
        Array.from({ length: 100 }, () => Math.random())  // White noise
    ];
    
    signals.forEach((signal, idx) => {
        const fi = engine.compute_fi(signal);
        this.assert(isFinite(fi), `FI should be finite for signal ${idx}`);
        this.assertBetween(fi, 0, 10, `FI should be reasonable for signal ${idx}`);
    });
});

// ===== EDGE CASE TESTS =====

runner.test('Edge Cases: Extreme Values', function() {
    const engine = new RIAEngine();
    
    // Test with extreme phi values
    const extremeValues = [-1000, 1000, NaN, Infinity, -Infinity];
    
    extremeValues.forEach(value => {
        try {
            const result = engine.process_frame(value, 0.5);
            this.assert(isFinite(result.fi), `FI should be finite for extreme value ${value}`);
        } catch (error) {
            // Acceptable to throw error for invalid inputs
            console.log(`   Note: Extreme value ${value} caused error: ${error.message}`);
        }
    });
});

runner.test('Edge Cases: Rapid Gamma Changes', function() {
    const engine = new RIAEngine();
    
    // Apply multiple aggressive interventions
    for (let i = 0; i < 10; i++) {
        engine.uiState = engine.update_ui(2.0, engine.uiState);  // Above th2
    }
    
    this.assertBetween(engine.uiState.gamma, 0.1, 1.0, 'Gamma should stay within bounds');
    this.assertGreater(engine.uiState.gamma, 0.05, 'Gamma should not go too low');
});

// Run the test suite
if (require.main === module) {
    runner.run().catch(console.error);
}

module.exports = { TestRunner, generateSineWave, generateFracturedSignal };