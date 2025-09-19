import { Wallet } from '../trading/Wallet.js';
import { Exchange } from '../trading/Exchange.js';
import { StrategyEngine } from '../trading/StrategyEngine.js';

// Synthetic price generator for demo
function makeSimulator(symbols) {
  const state = new Map();
  symbols.forEach((s) => state.set(s, { price: 10 + Math.random() * 10 }));
  return {
    tick() {
      const prices = {};
      const volumes = {};
      const orderbooks = {};
      for (const [s, st] of state) {
        // random walk with occasional spikes
        const drift = (Math.random() - 0.5) * 0.05;
        const spike = Math.random() < 0.01 ? (Math.random() - 0.5) * 2.0 : 0;
        st.price = Math.max(0.1, st.price * (1 + drift + spike));
        prices[s] = st.price;
        volumes[s] = 1000 * (1 + Math.random());
        orderbooks[s] = { bids: [{ price: st.price * 0.999, volume: 500 }], asks: [{ price: st.price * 1.001, volume: 500 }], spread: st.price * 0.002 };
      }
      return { prices, volumes, orderbooks };
    },
  };
}

async function main() {
  const symbols = ['UNI', 'LINK', 'AAVE', 'MKR'];
  const wallet = new Wallet({ mode: process.env.TRADING_MODE || 'paper', initialBalances: { USDC: 50000 } });
  const exchange = new Exchange(wallet, { baseToken: 'USDC' });
  const strategy = new StrategyEngine({ symbols });

  const sim = makeSimulator(symbols);
  const priceHistories = new Map(symbols.map((s) => [s, []]));

  // set oracle
  exchange.setPriceOracle((sym) => priceHistories.get(sym).slice(-1)[0] || 10);
  strategy.attachPriceFeed(() => Object.fromEntries(Array.from(priceHistories.entries()).map(([s, arr]) => [s, arr.slice(-1)[0] || 10])));

  // Events
  strategy.on('trades', (txs) => {
    txs.forEach((t) => {
      const baseBal = wallet.getBalance('USDC');
      const pos = wallet.getPosition(t.symbol);
      console.log(`🔁 ${t.action} ${t.symbol} at ${t.fill.price.toFixed(4)} | USDC: ${baseBal.toFixed(2)} | Pos: ${pos.qty.toFixed(4)} (${pos.avgPrice.toFixed(4)})`);
    });
  });

  console.log('🚀 Starting ERC-20 paper-trading bot (press Ctrl+C to stop)');
  const start = Date.now();
  const durationMs = Number(process.env.DURATION_MS || 30000);

  // Main loop
  while (Date.now() - start < durationMs) {
    const tick = sim.tick();

    // append history
    for (const s of symbols) {
      const arr = priceHistories.get(s);
      arr.push(tick.prices[s]);
      if (arr.length > 200) arr.shift();
    }

    // Feed to strategy/monitor
    strategy.feedMarketTick(tick);
    await strategy.maybeTrade(exchange, wallet, priceHistories);

    await new Promise((r) => setTimeout(r, 200));
  }

  console.log('\n📊 Final balances:');
  console.log('USDC:', wallet.getBalance('USDC').toFixed(2));
  for (const s of symbols) {
    const pos = wallet.getPosition(s);
    if (pos.qty > 0) {
      const price = priceHistories.get(s).slice(-1)[0] || 0;
      console.log(`${s}: ${pos.qty.toFixed(4)} (avg ${pos.avgPrice.toFixed(4)}), MV=${(pos.qty * price).toFixed(2)}`);
    }
  }
}

main().catch((e) => {
  console.error('Bot error:', e);
  process.exit(1);
});
