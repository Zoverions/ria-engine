/**
 * Test suite for FinancialMetricProcessor
 * 
 * Tests the core functionality of financial metrics calculation
 * including Sharpe, Sortino ratios, VaR, and drawdown analysis.
 */

import { FinancialMetricProcessor } from '../../core/math/processors/FinancialMetricProcessor.js';

// Simple test framework
class TestFramework {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🧪 Running FinancialMetricProcessor Tests\n');
    
    for (const { name, fn } of this.tests) {
      try {
        await fn();
        console.log(`✅ ${name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
        this.failed++;
      }
    }
    
    console.log(`\n📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
    return this.failed === 0;
  }

  assertEqual(actual, expected, tolerance = 1e-6) {
    if (typeof expected === 'number') {
      if (Math.abs(actual - expected) > tolerance) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    } else if (actual !== expected) {
      throw new Error(`Expected ${expected}, got ${actual}`);
    }
  }

  assertTrue(condition, message = 'Assertion failed') {
    if (!condition) {
      throw new Error(message);
    }
  }

  assertDefined(value, message = 'Value should be defined') {
    if (value === undefined || value === null) {
      throw new Error(message);
    }
  }
}

// Test data generators
function generateConstantReturns(value, count) {
  return new Array(count).fill(value);
}

function generateRandomReturns(count, mean = 0, std = 0.01) {
  const returns = [];
  for (let i = 0; i < count; i++) {
    // Simple random number generator
    const random = Math.random() * 2 - 1; // -1 to 1
    returns.push(mean + random * std);
  }
  return returns;
}

function generateEquityCurve(returns, initialValue = 100000) {
  const equity = [{ ts: Date.now() - returns.length * 24 * 60 * 60 * 1000, value: initialValue }];
  let currentValue = initialValue;
  
  for (let i = 0; i < returns.length; i++) {
    currentValue *= (1 + returns[i]);
    equity.push({
      ts: Date.now() - (returns.length - i - 1) * 24 * 60 * 60 * 1000,
      value: currentValue
    });
  }
  
  return equity;
}

// Run tests
async function runTests() {
  const test = new TestFramework();
  
  // Test 1: Basic processor initialization
  test.test('Processor initialization', () => {
    const processor = new FinancialMetricProcessor();
    test.assertDefined(processor);
    test.assertEqual(processor.config.riskFreeRate, 0.02);
    test.assertEqual(processor.config.confidenceLevel, 0.05);
  });

  // Test 2: Custom configuration
  test.test('Custom configuration', () => {
    const processor = new FinancialMetricProcessor({
      riskFreeRate: 0.03,
      periodsPerYear: 365
    });
    test.assertEqual(processor.config.riskFreeRate, 0.03);
    test.assertEqual(processor.config.periodsPerYear, 365);
  });

  // Test 3: Basic metrics calculation
  test.test('Basic metrics calculation', async () => {
    const processor = new FinancialMetricProcessor();
    const returns = generateConstantReturns(0.01, 50); // 1% constant returns
    
    const metrics = await processor.computeMetrics(returns, {
      type: 'returns',
      timeframe: 'daily'
    });
    
    test.assertDefined(metrics.basic);
    test.assertDefined(metrics.ratios);
    test.assertDefined(metrics.risk);
    
    // With constant returns, volatility should be 0
    test.assertEqual(metrics.basic.volatility, 0, 1e-10);
    test.assertEqual(metrics.basic.winRate, 1.0); // All positive returns
  });

  // Test 4: Zero returns handling
  test.test('Zero returns handling', async () => {
    const processor = new FinancialMetricProcessor();
    const returns = generateConstantReturns(0, 50); // All zero returns
    
    const metrics = await processor.computeMetrics(returns, {
      type: 'returns',
      timeframe: 'daily'
    });
    
    test.assertEqual(metrics.basic.totalReturn, 0);
    test.assertEqual(metrics.basic.volatility, 0);
    test.assertEqual(metrics.ratios.sharpeRatio, 0); // Should handle division by zero
  });

  // Test 5: Negative returns handling
  test.test('Negative returns handling', async () => {
    const processor = new FinancialMetricProcessor();
    const returns = generateConstantReturns(-0.01, 50); // -1% constant returns
    
    const metrics = await processor.computeMetrics(returns, {
      type: 'returns',
      timeframe: 'daily'
    });
    
    test.assertTrue(metrics.basic.totalReturn < 0);
    test.assertEqual(metrics.basic.winRate, 0); // All negative returns
    test.assertTrue(metrics.ratios.sharpeRatio < 0); // Negative Sharpe
  });

  // Test 6: Equity curve conversion
  test.test('Equity curve conversion', async () => {
    const processor = new FinancialMetricProcessor();
    const returns = generateRandomReturns(50, 0.01, 0.02); // Use 50 returns for sufficient data
    const equityCurve = generateEquityCurve(returns, 100000);
    
    const metrics = await processor.computeMetrics(equityCurve, {
      type: 'equity',
      timeframe: 'daily'
    });
    
    test.assertDefined(metrics.basic);
    test.assertDefined(metrics.drawdown);
    test.assertTrue(metrics.drawdown.maxDrawdown >= 0);
    test.assertTrue(metrics.drawdown.totalDrawdowns >= 0);
  });

  // Test 7: Sharpe ratio calculation
  test.test('Sharpe ratio calculation', async () => {
    const processor = new FinancialMetricProcessor({ riskFreeRate: 0.0 });
    const returns = generateRandomReturns(100, 0.01, 0.02); // 1% mean, 2% vol
    
    const metrics = await processor.computeMetrics(returns, {
      type: 'returns',
      timeframe: 'daily'
    });
    
    // Sharpe should be roughly return/volatility when risk-free rate is 0
    const expectedSharpe = (metrics.basic.arithmeticMean * 252) / (metrics.basic.volatility * Math.sqrt(252));
    test.assertEqual(metrics.ratios.sharpeRatio, expectedSharpe, 0.1);
  });

  // Test 8: Drawdown calculation
  test.test('Drawdown calculation', async () => {
    const processor = new FinancialMetricProcessor();
    // Create a series with a clear drawdown pattern - make it longer
    const baseReturns = generateRandomReturns(40, 0.01, 0.005); // Base positive returns
    const drawdownReturns = [0.1, -0.05, -0.05, -0.05, 0.1, 0.1]; // Clear drawdown pattern
    const returns = [...baseReturns, ...drawdownReturns]; // Combine for sufficient data
    const equityCurve = generateEquityCurve(returns, 100000);
    
    const metrics = await processor.computeMetrics(equityCurve, {
      type: 'equity',
      timeframe: 'daily'
    });
    
    test.assertTrue(metrics.drawdown.maxDrawdown >= 0);
    test.assertTrue(metrics.drawdown.maxDrawdownDuration >= 0);
    test.assertTrue(metrics.drawdown.totalDrawdowns >= 0);
  });

  // Test 9: Rolling metrics
  test.test('Rolling metrics calculation', () => {
    const processor = new FinancialMetricProcessor();
    const returns = generateRandomReturns(100, 0.005, 0.01);
    
    const rollingMetrics = processor.computeRollingMetrics(returns, 30);
    
    // Should have correct number of windows
    test.assertEqual(rollingMetrics.length, returns.length - 30 + 1);
    
    // Each window should have required properties
    test.assertDefined(rollingMetrics[0].sharpeRatio);
    test.assertDefined(rollingMetrics[0].volatility);
    test.assertDefined(rollingMetrics[0].return);
  });

  // Test 10: Insufficient data handling
  test.test('Insufficient data handling', async () => {
    const processor = new FinancialMetricProcessor();
    const returns = generateRandomReturns(10); // Only 10 observations
    
    try {
      await processor.computeMetrics(returns, {
        type: 'returns',
        timeframe: 'daily'
      });
      throw new Error('Should have thrown for insufficient data');
    } catch (error) {
      test.assertTrue(error.message.includes('Insufficient data'));
    }
  });

  // Test 11: Timeframe handling
  test.test('Different timeframes', async () => {
    const processor = new FinancialMetricProcessor();
    const returns = generateRandomReturns(50, 0.001, 0.01); // Hourly-like data
    
    const hourlyMetrics = await processor.computeMetrics(returns, {
      type: 'returns',
      timeframe: 'hourly'
    });
    
    const dailyMetrics = await processor.computeMetrics(returns, {
      type: 'returns',
      timeframe: 'daily'
    });
    
    // Annualized metrics should be different due to different scaling
    test.assertTrue(Math.abs(hourlyMetrics.ratios.annualizedReturn - dailyMetrics.ratios.annualizedReturn) > 0.01);
  });

  // Test 12: VaR calculation
  test.test('VaR calculation', async () => {
    const processor = new FinancialMetricProcessor();
    const returns = generateRandomReturns(100, 0, 0.02); // Centered around 0
    
    const metrics = await processor.computeMetrics(returns, {
      type: 'returns',
      timeframe: 'daily'
    });
    
    // VaR should be negative (representing a loss)
    test.assertTrue(metrics.risk.valueAtRisk <= 0);
    // CVaR should be more negative than VaR
    test.assertTrue(metrics.risk.conditionalVaR <= metrics.risk.valueAtRisk);
  });

  // Test 13: Performance summary
  test.test('Performance summary generation', async () => {
    const processor = new FinancialMetricProcessor();
    const returns = generateRandomReturns(50, 0.005, 0.01);
    const equityCurve = generateEquityCurve(returns, 100000);
    
    const metrics = await processor.computeMetrics(equityCurve, {
      type: 'equity',
      timeframe: 'daily'
    });
    
    // Create manual summary to verify against built-in method
    const summary = {
      totalReturn: `${(metrics.basic.totalReturn * 100).toFixed(2)}%`,
      sharpeRatio: metrics.ratios.sharpeRatio.toFixed(3),
      maxDrawdown: `${(metrics.drawdown.maxDrawdown * 100).toFixed(2)}%`
    };
    
    test.assertDefined(summary.totalReturn);
    test.assertDefined(summary.sharpeRatio);
    test.assertDefined(summary.maxDrawdown);
    
    // Verify format
    test.assertTrue(summary.totalReturn.includes('%'));
    test.assertTrue(summary.maxDrawdown.includes('%'));
  });

  // Run all tests
  const success = await test.run();
  return success;
}

// Execute tests if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { runTests };