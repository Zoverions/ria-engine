import { Wallet } from '../trading/Wallet.js';
import { Exchange } from '../trading/Exchange.js';
import { StrategyEngine } from '../trading/StrategyEngine.js';
import { FinancialMetricProcessor } from '../core/math/processors/FinancialMetricProcessor.js';

async function fetchETHHourly(days = 365) {
  const url = `https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=${days}&interval=hourly`;
  const res = await fetch(url, { headers: { 'accept': 'application/json' } });
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  const data = await res.json();
  // data.prices: [[ts, price]], data.total_volumes: [[ts, volume]]
  const series = [];
  const prices = data.prices || [];
  const vols = new Map((data.total_volumes || []).map(([t, v]) => [Number(t), Number(v)]));
  for (const [ts, p] of prices) {
    series.push({ ts: Number(ts), price: Number(p), volume: vols.get(Number(ts)) || 0 });
  }
  return series;
}

async function loadCsv(path) {
  const fs = await import('node:fs/promises');
  const content = await fs.readFile(path, 'utf8');
  const lines = content.trim().split(/\r?\n/);
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const [ts, price, volume] = lines[i].split(',');
    out.push({ ts: Number(ts), price: Number(price), volume: Number(volume) });
  }
  return out;
}

async function computeEnhancedMetrics(equityCurve, timeframe = 'hourly') {
  const processor = new FinancialMetricProcessor({
    riskFreeRate: 0.02, // 2% annual risk-free rate
    confidenceLevel: 0.05 // 95% confidence for VaR
  });
  
  try {
    const metrics = await processor.computeMetrics(equityCurve, { 
      type: 'equity', 
      timeframe 
    });
    
    // Create summary manually to avoid potential issues
    const summary = {
      totalReturn: `${(metrics.basic.totalReturn * 100).toFixed(2)}%`,
      annualizedReturn: `${(metrics.ratios.annualizedReturn * 100).toFixed(2)}%`,
      volatility: `${(metrics.ratios.annualizedVolatility * 100).toFixed(2)}%`,
      sharpeRatio: metrics.ratios.sharpeRatio.toFixed(3),
      sortinoRatio: metrics.ratios.sortinoRatio.toFixed(3),
      maxDrawdown: metrics.drawdown ? `${(metrics.drawdown.maxDrawdown * 100).toFixed(2)}%` : 'N/A',
      calmarRatio: metrics.drawdown ? metrics.drawdown.calmarRatio.toFixed(3) : 'N/A',
      winRate: `${(metrics.basic.winRate * 100).toFixed(1)}%`,
      profitFactor: metrics.ratios.profitFactor.toFixed(2)
    };
    
    return { metrics, summary };
  } catch (error) {
    console.warn(`Enhanced metrics calculation failed: ${error.message}`);
    console.warn(`Stack trace: ${error.stack}`);
    // Fallback to simple metrics
    return { metrics: null, summary: null };
  }
}

function metricsFromEquity(equityCurve) {
  const eq = equityCurve.map(e => e.value);
  let peak = eq[0] || 1;
  let maxDD = 0;
  for (const v of eq) { peak = Math.max(peak, v); maxDD = Math.max(maxDD, (peak - v) / peak); }
  // Simple returns
  const rets = [];
  for (let i = 1; i < eq.length; i++) rets.push((eq[i] - eq[i-1]) / (eq[i-1] || 1));
  const avg = rets.length ? rets.reduce((a,b)=>a+b,0)/rets.length : 0;
  const varr = rets.length ? rets.reduce((s,r)=>s+(r-avg)*(r-avg),0)/rets.length : 0;
  const sharpe = varr > 0 ? (avg / Math.sqrt(varr)) * Math.sqrt(24*365) : 0; // annualize hourly
  return { maxDrawdown: maxDD, sharpe, totalReturn: (eq.at(-1) - eq[0]) / (eq[0]||1) };
}

async function main() {
  let candles;
  const csvPath = process.env.CSV || '';
  if (csvPath) {
    console.log(`📥 Loading ETH hourly CSV: ${csvPath}`);
    candles = await loadCsv(csvPath);
  } else {
    console.log('⬇️  Fetching ETH hourly data (1y) from CoinGecko... (set CSV=path to use offline data)');
    candles = await fetchETHHourly(365);
  }
  console.log(`✅ Loaded ${candles.length} hourly candles`);

  const symbol = 'ETH';
  const wallet = new Wallet({ mode: 'paper', initialBalances: { USDC: 100000 } });
  const exchange = new Exchange(wallet, { baseToken: 'USDC', feeBps: 10, slippageBps: 5 });
  const strategy = new StrategyEngine({ symbols: [symbol], tradeCooldownMs: 0, targetPositionPct: 25, maxRiskPerTradePct: 5 });

  const priceHistory = new Map([[symbol, []]]);
  exchange.setPriceOracle((sym) => priceHistory.get(sym).slice(-1)[0] || 0);
  strategy.attachPriceFeed(() => ({ [symbol]: priceHistory.get(symbol).slice(-1)[0] || 0 }));

  const equity = [];
  const startBal = wallet.getBalance('USDC');

  for (let i = 0; i < candles.length; i++) {
    const { ts, price, volume } = candles[i];
    // update price history
    const arr = priceHistory.get(symbol); arr.push(price); if (arr.length > 2000) arr.shift();

    // build a minimal orderbook around price
    const orderbook = { bids: [{ price: price*0.999, volume: 100 }], asks: [{ price: price*1.001, volume: 100 }], spread: price*0.002 };
    const tick = { prices: { [symbol]: price }, volumes: { [symbol]: volume }, orderbooks: { [symbol]: orderbook } };

    strategy.feedMarketTick({ price: tick.prices, volume: tick.volumes, orderbook: tick.orderbooks });
    await strategy.maybeTrade(exchange, wallet, priceHistory);

    // compute equity
    const pos = wallet.getPosition(symbol);
    const value = wallet.getBalance('USDC') + pos.qty * price;
    equity.push({ ts, value });
  }

  // Compute enhanced financial metrics
  const { metrics: enhancedMetrics, summary } = await computeEnhancedMetrics(equity, 'hourly');
  const { totalReturn, maxDrawdown, sharpe } = metricsFromEquity(equity);
  const endBal = wallet.getBalance('USDC');
  const lastPrice = priceHistory.get(symbol).slice(-1)[0] || 0;
  const pos = wallet.getPosition(symbol);

  console.log('\n==== ETH Backtest Results ====');
  console.log(`Dataset: ${candles.length} hourly candles`);
  console.log(`Start USDC: ${startBal.toFixed(2)}`);
  console.log(`End USDC:   ${endBal.toFixed(2)}`);
  console.log(`End Pos:    ${pos.qty.toFixed(4)} ${symbol} @ avg ${pos.avgPrice.toFixed(2)} (MV ${(pos.qty*lastPrice).toFixed(2)})`);
  
  console.log('\n--- Basic Performance ---');
  console.log(`Total Return:     ${(totalReturn*100).toFixed(2)}%`);
  console.log(`Max Drawdown:     ${(maxDrawdown*100).toFixed(2)}%`);
  console.log(`Basic Sharpe:     ${sharpe.toFixed(2)}`);

  if (enhancedMetrics && summary) {
    console.log('\n--- Enhanced Financial Metrics ---');
    console.log(`Annualized Return: ${summary.annualizedReturn}`);
    console.log(`Annualized Vol:    ${summary.volatility}`);
    console.log(`Sharpe Ratio:      ${summary.sharpeRatio}`);
    console.log(`Sortino Ratio:     ${summary.sortinoRatio}`);
    console.log(`Calmar Ratio:      ${summary.calmarRatio}`);
    console.log(`Win Rate:          ${summary.winRate}`);
    console.log(`Profit Factor:     ${summary.profitFactor}`);
    
    if (enhancedMetrics.risk) {
      console.log('\n--- Risk Metrics ---');
      console.log(`Value at Risk (95%): ${(enhancedMetrics.risk.valueAtRisk * 100).toFixed(3)}%`);
      console.log(`Conditional VaR:     ${(enhancedMetrics.risk.conditionalVaR * 100).toFixed(3)}%`);
      console.log(`Skewness:            ${enhancedMetrics.risk.skewness.toFixed(3)}`);
      console.log(`Excess Kurtosis:     ${enhancedMetrics.risk.kurtosis.toFixed(3)}`);
    }
    
    if (enhancedMetrics.drawdown) {
      console.log('\n--- Drawdown Analysis ---');
      console.log(`Max DD Duration:     ${enhancedMetrics.drawdown.maxDrawdownDuration} periods`);
      console.log(`Total DD Periods:    ${enhancedMetrics.drawdown.totalDrawdowns}`);
      console.log(`Average DD:          ${(enhancedMetrics.drawdown.averageDrawdown * 100).toFixed(2)}%`);
      if (enhancedMetrics.drawdown.averageRecoveryTime !== null) {
        console.log(`Avg Recovery Time:   ${enhancedMetrics.drawdown.averageRecoveryTime.toFixed(1)} periods`);
      }
    }
  } else {
    console.log('\n--- Note ---');
    console.log('Enhanced metrics not available (insufficient data or calculation error)');
  }
}

main().catch((e) => {
  console.error('Backtest error:', e.message);
  console.error('If network access is restricted, you can provide a CSV loader instead.');
  process.exit(1);
});
