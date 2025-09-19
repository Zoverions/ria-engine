/**
 * Financial Metrics Demo - Showcasing the FinancialMetricProcessor
 * 
 * This demo shows how to use the FinancialMetricProcessor to analyze
 * financial performance with comprehensive metrics including Sharpe,
 * Sortino ratios, VaR, and drawdown analysis.
 */

import { FinancialMetricProcessor } from '../core/math/processors/FinancialMetricProcessor.js';

// Generate sample return data for demonstration
function generateSampleReturns(days = 252, annualVol = 0.15, annualReturn = 0.08) {
  const returns = [];
  const dailyVol = annualVol / Math.sqrt(252);
  const dailyReturn = annualReturn / 252;
  
  for (let i = 0; i < days; i++) {
    // Generate returns with some realistic patterns
    const randomReturn = (Math.random() - 0.5) * 2 * dailyVol * 3; // Box-Muller approximation
    const trendReturn = dailyReturn + randomReturn;
    
    // Add some occasional large moves (fat tails)
    const extremeMove = Math.random() < 0.02 ? (Math.random() - 0.5) * 0.1 : 0;
    
    returns.push(trendReturn + extremeMove);
  }
  
  return returns;
}

// Generate sample equity curve
function generateSampleEquityCurve(returns, initialValue = 100000) {
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

async function main() {
  console.log('🧮 Financial Metrics Processor Demo\n');
  
  // Initialize the processor
  const processor = new FinancialMetricProcessor({
    riskFreeRate: 0.03, // 3% annual risk-free rate
    confidenceLevel: 0.05, // 95% confidence for VaR
    periodsPerYear: 252 // Daily data
  });

  // Example 1: Analyzing return series directly
  console.log('📊 Example 1: Analyzing Daily Returns');
  console.log('=====================================');
  
  const returns = generateSampleReturns(252, 0.20, 0.12); // Volatile but positive strategy
  const metrics = await processor.computeMetrics(returns, { type: 'returns', timeframe: 'daily' });
  
  console.log('Basic Metrics:');
  console.log(`  Total Return:      ${(metrics.basic.totalReturn * 100).toFixed(2)}%`);
  console.log(`  Win Rate:          ${(metrics.basic.winRate * 100).toFixed(1)}%`);
  console.log(`  Avg Win:           ${(metrics.basic.averageWin * 100).toFixed(3)}%`);
  console.log(`  Avg Loss:          ${(metrics.basic.averageLoss * 100).toFixed(3)}%`);
  
  console.log('\nRisk-Adjusted Ratios:');
  console.log(`  Sharpe Ratio:      ${metrics.ratios.sharpeRatio.toFixed(3)}`);
  console.log(`  Sortino Ratio:     ${metrics.ratios.sortinoRatio.toFixed(3)}`);
  console.log(`  Information Ratio: ${metrics.ratios.informationRatio.toFixed(3)}`);
  console.log(`  Profit Factor:     ${metrics.ratios.profitFactor.toFixed(2)}`);
  
  console.log('\nRisk Metrics:');
  console.log(`  Annualized Vol:    ${(metrics.risk.volatility * 100).toFixed(2)}%`);
  console.log(`  VaR (95%):         ${(metrics.risk.valueAtRisk * 100).toFixed(3)}%`);
  console.log(`  Conditional VaR:   ${(metrics.risk.conditionalVaR * 100).toFixed(3)}%`);
  console.log(`  Skewness:          ${metrics.risk.skewness.toFixed(3)}`);
  console.log(`  Excess Kurtosis:   ${metrics.risk.kurtosis.toFixed(3)}`);

  // Example 2: Analyzing equity curve
  console.log('\n\n📈 Example 2: Analyzing Equity Curve');
  console.log('====================================');
  
  const equityCurve = generateSampleEquityCurve(returns);
  const equityMetrics = await processor.computeMetrics(equityCurve, { 
    type: 'equity', 
    timeframe: 'daily' 
  });
  
  console.log('Drawdown Analysis:');
  console.log(`  Max Drawdown:      ${(equityMetrics.drawdown.maxDrawdown * 100).toFixed(2)}%`);
  console.log(`  Max DD Duration:   ${equityMetrics.drawdown.maxDrawdownDuration} days`);
  console.log(`  Calmar Ratio:      ${equityMetrics.drawdown.calmarRatio.toFixed(3)}`);
  console.log(`  Total DD Periods:  ${equityMetrics.drawdown.totalDrawdowns}`);
  console.log(`  Avg Recovery Time: ${equityMetrics.drawdown.averageRecoveryTime?.toFixed(1) || 'N/A'} days`);
  
  // Example 3: Rolling metrics analysis
  console.log('\n\n📊 Example 3: Rolling Metrics (30-day window)');
  console.log('==============================================');
  
  const rollingMetrics = processor.computeRollingMetrics(returns, 30);
  const recentRolling = rollingMetrics.slice(-5); // Last 5 windows
  
  console.log('Recent 30-day Rolling Sharpe Ratios:');
  recentRolling.forEach((metric, idx) => {
    console.log(`  Window ${idx + 1}: ${metric.sharpeRatio.toFixed(3)}`);
  });
  
  // Example 4: Performance summary
  console.log('\n\n📋 Example 4: Performance Summary');
  console.log('=================================');
  
  const summary = {
    totalReturn: `${(equityMetrics.basic.totalReturn * 100).toFixed(2)}%`,
    annualizedReturn: `${(equityMetrics.ratios.annualizedReturn * 100).toFixed(2)}%`,
    volatility: `${(equityMetrics.ratios.annualizedVolatility * 100).toFixed(2)}%`,
    sharpeRatio: equityMetrics.ratios.sharpeRatio.toFixed(3),
    sortinoRatio: equityMetrics.ratios.sortinoRatio.toFixed(3),
    maxDrawdown: `${(equityMetrics.drawdown.maxDrawdown * 100).toFixed(2)}%`,
    calmarRatio: equityMetrics.drawdown.calmarRatio.toFixed(3),
    winRate: `${(equityMetrics.basic.winRate * 100).toFixed(1)}%`,
    profitFactor: equityMetrics.ratios.profitFactor.toFixed(2)
  };
  
  console.log('Strategy Performance Summary:');
  Object.entries(summary).forEach(([key, value]) => {
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`  ${label.padEnd(18)}: ${value}`);
  });

  // Example 5: Compare different strategies
  console.log('\n\n⚖️  Example 5: Strategy Comparison');
  console.log('==================================');
  
  const conservativeReturns = generateSampleReturns(252, 0.08, 0.06);
  const aggressiveReturns = generateSampleReturns(252, 0.35, 0.15);
  
  const conservativeMetrics = await processor.computeMetrics(conservativeReturns, { 
    type: 'returns', 
    timeframe: 'daily' 
  });
  
  const aggressiveMetrics = await processor.computeMetrics(aggressiveReturns, { 
    type: 'returns', 
    timeframe: 'daily' 
  });
  
  console.log('Strategy Comparison:');
  console.log('                     Conservative   Aggressive');
  console.log('                     -----------    ----------');
  console.log(`Annual Return:       ${(conservativeMetrics.ratios.annualizedReturn * 100).toFixed(1)}%         ${(aggressiveMetrics.ratios.annualizedReturn * 100).toFixed(1)}%`);
  console.log(`Volatility:          ${(conservativeMetrics.risk.volatility * 100).toFixed(1)}%          ${(aggressiveMetrics.risk.volatility * 100).toFixed(1)}%`);
  console.log(`Sharpe Ratio:        ${conservativeMetrics.ratios.sharpeRatio.toFixed(2)}           ${aggressiveMetrics.ratios.sharpeRatio.toFixed(2)}`);
  console.log(`Sortino Ratio:       ${conservativeMetrics.ratios.sortinoRatio.toFixed(2)}           ${aggressiveMetrics.ratios.sortinoRatio.toFixed(2)}`);
  console.log(`Win Rate:            ${(conservativeMetrics.basic.winRate * 100).toFixed(1)}%          ${(aggressiveMetrics.basic.winRate * 100).toFixed(1)}%`);
  
  console.log('\n✅ Financial Metrics Processor Demo Complete!');
  console.log('\nThe FinancialMetricProcessor provides comprehensive financial analysis including:');
  console.log('• Risk-adjusted ratios (Sharpe, Sortino, Calmar, Information)');
  console.log('• Risk metrics (VaR, CVaR, volatility, skewness, kurtosis)');
  console.log('• Drawdown analysis (max DD, duration, recovery times)');
  console.log('• Performance attribution (win rate, profit factor)');
  console.log('• Rolling window analysis for time-varying risk assessment');
}

main().catch(console.error);