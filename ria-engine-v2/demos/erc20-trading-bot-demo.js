import { TradingBot } from '../trading/TradingBot.js';
import { MarketStabilityMonitor } from '../core/MarketStabilityMonitor.js';

async function main() {
  console.log('🚀 Starting ERC-20 Trading Bot (paper)');

  const bot = new TradingBot({ mode: 'paper', baseUSD: 100000, tokens: ['BTC','ETH','AAPL','GOOGL'] });
  const monitor = new MarketStabilityMonitor();

  // Wire MFI to bot
  monitor.mfiCalculator.on('mfiUpdated', async (data) => {
    await bot.onMfiUpdate({ ...data, components: synthesizeComponents(data) });
    const pv = bot.portfolioValue();
    console.log(`💼 Portfolio Value: $${pv.toFixed(2)}`);
  });

  // Simulate quotes and market data
  let t = 0;
  const timer = setInterval(() => {
    t++;
    const quotes = {
      BTC: 45000 * (1 + 0.01 * Math.sin(t * 0.05)) + (Math.random()-0.5)*50,
      ETH: 3000 * (1 + 0.012 * Math.sin(t * 0.06)) + (Math.random()-0.5)*5,
      AAPL: 150 * (1 + 0.002 * Math.sin(t * 0.03)) + (Math.random()-0.5)*0.2,
      GOOGL: 2800 * (1 + 0.003 * Math.sin(t * 0.02)) + (Math.random()-0.5)*2,
    };
    bot.setQuotes(quotes);

    // Feed aggregated market data to monitor
    const price = Object.fromEntries(Object.entries(quotes).map(([k,v]) => [k,v]));
    const volume = Object.fromEntries(Object.keys(quotes).map(k => [k, 1000 + Math.random()*500]));
    const orderbook = Object.fromEntries(Object.keys(quotes).map(k => [k, mkOrderBook(quotes[k])]));

    monitor.addMarketData({ price, volume, orderbook });
  }, 100);

  // Stop after 30 seconds
  setTimeout(() => {
    clearInterval(timer);
    console.log('🛑 Demo finished');
  }, 30000);
}

function mkOrderBook(mid) {
  const spread = mid * 0.001;
  const bids = Array.from({length:5}, (_,i)=>({ price: mid - spread*(i+1)*0.5, volume: 1+Math.random()*2 }));
  const asks = Array.from({length:5}, (_,i)=>({ price: mid + spread*(i+1)*0.5, volume: 1+Math.random()*2 }));
  return { bids, asks, spread };
}

// Create synthetic per-asset components aligned to monitor’s expectations
function synthesizeComponents(data) {
  // We don’t have per-asset breakdown from MFI, so synthesize components from recent MFI
  const assets = ['BTC','ETH','AAPL','GOOGL'];
  const base = data.mfi;
  const comps = {};
  for (const a of assets) {
    comps[a] = {
      spectralSlope: (Math.random()-0.5) * 1.2,
      autocorrelation: 0.4 + Math.random()*0.4,
      orderImbalance: Math.random()*0.6,
      volumeVelocity: (Math.random()-0.5)*0.5
    };
  }
  return comps;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('❌ Demo error', err);
    process.exit(1);
  });
}
