# FinancialMetricProcessor Documentation

## Overview

The `FinancialMetricProcessor` is a comprehensive financial analysis tool that provides advanced risk-adjusted performance metrics for trading strategies and investment portfolios. It calculates a wide range of financial ratios, risk metrics, and drawdown statistics commonly used in quantitative finance.

## Features

### Risk-Adjusted Ratios
- **Sharpe Ratio**: Risk-adjusted returns relative to a risk-free rate
- **Sortino Ratio**: Risk-adjusted returns focusing on downside deviation
- **Calmar Ratio**: Annual return divided by maximum drawdown
- **Information Ratio**: Excess return per unit of tracking error
- **Treynor Ratio**: Risk-adjusted returns relative to market risk (beta)

### Risk Metrics
- **Value at Risk (VaR)**: Potential loss at a given confidence level
- **Conditional VaR (CVaR)**: Expected loss beyond the VaR threshold
- **Volatility**: Standard deviation of returns (annualized)
- **Downside Deviation**: Volatility of negative returns only
- **Skewness**: Asymmetry of return distribution
- **Kurtosis**: Tail thickness of return distribution

### Drawdown Analysis
- **Maximum Drawdown**: Largest peak-to-trough decline
- **Drawdown Duration**: Length of drawdown periods
- **Recovery Time**: Time to recover from drawdowns
- **Current Drawdown**: Real-time drawdown status

### Performance Attribution
- **Win Rate**: Percentage of profitable periods
- **Profit Factor**: Ratio of total gains to total losses
- **Average Win/Loss**: Mean return in winning/losing periods
- **Gain-to-Pain Ratio**: Total gains relative to total losses

## Installation

The `FinancialMetricProcessor` is part of the RIA Engine v2 core math processors:

```javascript
import { FinancialMetricProcessor } from '../core/math/processors/FinancialMetricProcessor.js';
```

## Basic Usage

### Analyzing Returns Data

```javascript
const processor = new FinancialMetricProcessor({
  riskFreeRate: 0.02,      // 2% annual risk-free rate
  confidenceLevel: 0.05,   // 95% confidence for VaR
  periodsPerYear: 252      // Daily data (252 trading days)
});

// Daily returns array
const returns = [0.01, -0.005, 0.02, 0.0, -0.01, ...];

const metrics = await processor.computeMetrics(returns, {
  type: 'returns',
  timeframe: 'daily'
});

console.log('Sharpe Ratio:', metrics.ratios.sharpeRatio);
console.log('Max Drawdown:', metrics.drawdown?.maxDrawdown);
```

### Analyzing Equity Curve

```javascript
// Equity curve with timestamps
const equityCurve = [
  { ts: 1640995200000, value: 100000 },
  { ts: 1641081600000, value: 101000 },
  { ts: 1641168000000, value: 99500 },
  // ... more data points
];

const metrics = await processor.computeMetrics(equityCurve, {
  type: 'equity',
  timeframe: 'daily'
});

// Get formatted summary
const summary = processor.getPerformanceSummary(equityCurve, {
  type: 'equity',
  timeframe: 'daily'
});

console.log(summary);
// Output:
// {
//   totalReturn: "15.25%",
//   annualizedReturn: "8.45%",
//   volatility: "12.30%",
//   sharpeRatio: "0.524",
//   sortinoRatio: "0.612",
//   maxDrawdown: "5.80%",
//   calmarRatio: "1.457",
//   winRate: "58.3%",
//   profitFactor: "1.85"
// }
```

## Configuration Options

```javascript
const config = {
  riskFreeRate: 0.02,        // Annual risk-free rate (default: 2%)
  confidenceLevel: 0.05,     // VaR confidence level (default: 5% = 95% confidence)
  periodsPerYear: 252,       // Periods for annualization (default: 252)
  minObservations: 30        // Minimum data points required (default: 30)
};

const processor = new FinancialMetricProcessor(config);
```

## Timeframe Support

The processor supports different data frequencies:

```javascript
const timeframes = {
  'minute': 525600,    // Minutes per year
  'hourly': 8760,      // Hours per year  
  'daily': 252,        // Trading days per year
  'weekly': 52,        // Weeks per year
  'monthly': 12,       // Months per year
  'quarterly': 4,      // Quarters per year
  'yearly': 1          // Years per year
};
```

## Advanced Features

### Rolling Metrics Analysis

```javascript
// Calculate 30-period rolling metrics
const rollingMetrics = processor.computeRollingMetrics(returns, 30);

// Analyze time-varying risk
rollingMetrics.forEach((metric, index) => {
  console.log(`Period ${index}: Sharpe = ${metric.sharpeRatio.toFixed(3)}`);
});
```

### Benchmark Comparison

```javascript
// Compare against benchmark returns
const portfolioReturns = [...]; // Your strategy returns
const benchmarkReturns = [...]; // S&P 500 returns (same length)

const comparison = processor.compareAgainstBenchmark(
  portfolioReturns,
  benchmarkReturns
);

console.log('Beta:', comparison.beta);
console.log('Alpha:', comparison.alpha);
console.log('Information Ratio:', comparison.informationRatio);
console.log('Tracking Error:', comparison.trackingError);
```

## Output Structure

### Complete Metrics Object

```javascript
{
  basic: {
    totalReturn: 0.1525,           // 15.25% total return
    arithmeticMean: 0.0008,        // Average daily return
    geometricMean: 0.0007,         // Geometric average
    volatility: 0.025,             // Daily volatility
    winRate: 0.583,                // 58.3% win rate
    averageWin: 0.015,             // Average winning return
    averageLoss: -0.012,           // Average losing return
    maxReturn: 0.045,              // Best single period
    minReturn: -0.038              // Worst single period
  },
  
  risk: {
    volatility: 0.123,             // Annualized volatility
    downsideDeviation: 0.089,      // Downside volatility
    valueAtRisk: -0.032,           // 95% VaR
    conditionalVaR: -0.045,        // 95% CVaR
    skewness: -0.25,               // Return skewness
    kurtosis: 2.1                  // Excess kurtosis
  },
  
  ratios: {
    sharpeRatio: 0.524,            // Risk-adjusted return
    sortinoRatio: 0.612,           // Downside risk-adjusted
    informationRatio: 0.524,       // vs benchmark
    treynorRatio: 0.524,           // Beta-adjusted
    profitFactor: 1.85,            // Gains/losses ratio
    calmarRatio: 1.457             // Return/max drawdown
  },
  
  drawdown: {
    maxDrawdown: 0.058,            // 5.8% max drawdown
    maxDrawdownDuration: 15,       // 15 periods
    totalDrawdowns: 8,             // Number of DD periods
    averageDrawdown: 0.025,        // Average DD magnitude
    averageRecoveryTime: 5.2,      // Average recovery periods
    currentDrawdown: 0.01          // Current DD if any
  }
}
```

## Error Handling

The processor includes robust error handling:

```javascript
try {
  const metrics = await processor.computeMetrics(data, options);
  // Use metrics
} catch (error) {
  if (error.message.includes('Insufficient data')) {
    console.log('Need more data points for analysis');
  } else {
    console.error('Analysis failed:', error.message);
  }
}
```

## Integration with Trading Systems

### Backtesting Integration

```javascript
// In your backtest loop
const equityCurve = [];
const returns = [];

// ... trading simulation ...

equityCurve.push({
  ts: currentTimestamp,
  value: portfolioValue
});

// Analyze performance periodically
if (equityCurve.length >= 30) {
  const metrics = await processor.computeMetrics(equityCurve, {
    type: 'equity',
    timeframe: 'daily'
  });
  
  // Log key metrics
  console.log(`Sharpe: ${metrics.ratios.sharpeRatio.toFixed(3)}`);
  console.log(`Max DD: ${(metrics.drawdown.maxDrawdown * 100).toFixed(2)}%`);
}
```

### Real-time Monitoring

```javascript
// Update metrics as new data arrives
class StrategyMonitor {
  constructor() {
    this.processor = new FinancialMetricProcessor();
    this.returns = [];
  }
  
  async updateMetrics(newReturn) {
    this.returns.push(newReturn);
    
    if (this.returns.length >= 30) {
      const metrics = await this.processor.computeMetrics(this.returns);
      
      // Alert on risk threshold breach
      if (metrics.ratios.sharpeRatio < 0) {
        console.warn('⚠️ Strategy Sharpe ratio turned negative');
      }
      
      if (metrics.drawdown?.currentDrawdown > 0.10) {
        console.warn('⚠️ Drawdown exceeds 10%');
      }
    }
  }
}
```

## Performance Considerations

- **Memory Usage**: The processor keeps minimal state; pass data as needed
- **Computation Time**: O(n) for most calculations, O(n²) for some correlation metrics
- **Data Requirements**: Minimum 30 observations for meaningful statistics
- **Precision**: Uses double-precision floating point arithmetic

## Best Practices

1. **Data Quality**: Ensure clean, consistent return data
2. **Timeframe Consistency**: Match your data frequency with the timeframe parameter
3. **Sample Size**: Use at least 30 observations for stable statistics
4. **Risk-Free Rate**: Update the risk-free rate parameter regularly
5. **Benchmark Selection**: Choose appropriate benchmarks for comparison

## Examples

See the comprehensive demo:

```bash
cd ria-engine-v2
npm run demo:financial
```

This demonstrates all features including:
- Basic metrics calculation
- Equity curve analysis  
- Rolling window analysis
- Strategy comparison
- Performance summaries

## API Reference

### Constructor

```javascript
new FinancialMetricProcessor(config)
```

### Methods

- `computeMetrics(data, options)` - Main analysis method
- `getPerformanceSummary(data, options)` - Formatted summary
- `computeRollingMetrics(returns, windowSize)` - Rolling analysis
- `compareAgainstBenchmark(returns, benchmark)` - Benchmark comparison
- `updateConfig(newConfig)` - Update configuration

### Configuration

- `riskFreeRate: number` - Annual risk-free rate
- `confidenceLevel: number` - VaR confidence level (0.05 = 95%)
- `periodsPerYear: number` - Periods for annualization
- `minObservations: number` - Minimum required data points