import { EventEmitter } from 'events';
import { MarketStabilityMonitor } from '../core/MarketStabilityMonitor.js';

export class StrategyEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      symbols: ['UNI', 'LINK', 'AAVE', 'MKR'],
      baseToken: 'USDC',
      maxRiskPerTradePct: 2, // % of base balance
      targetPositionPct: 10, // max % base into one token
      noveltyWeight: 0.25,
      mfiWeight: 0.75,
      tradeCooldownMs: 20000,
      ...config,
    };

    this.monitor = new MarketStabilityMonitor();
    this.lastTradeAt = 0;
    this.latestMfi = 0;
    this.latestComponents = {};

    this.monitor.on('marketStateUpdate', (s) => {
      this.latestMfi = s.mfi;
    });
  }

  // Novelty score: synthetic example using random + minor signal from price divergence
  noveltyScore(symbol, price, history) {
    const rand = Math.random() * 0.2; // bounded randomness
    if (!history || history.length < 5) return 0.1 + rand;
    const recent = history.slice(-5);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const divergence = Math.min(1, Math.abs(price - avg) / (avg || 1));
    return Math.max(0, Math.min(1, 0.1 + rand + divergence * 0.3));
  }

  blendedSignal(symbol, price, history) {
    const novelty = this.noveltyScore(symbol, price, history);
    const mfiSignal = 1 - this.latestMfi; // lower MFI => safer to go long
    const score = this.config.noveltyWeight * novelty + this.config.mfiWeight * mfiSignal;
    return Math.max(0, Math.min(1, score));
  }

  positionTarget(baseBalance) {
    return (baseBalance * this.config.targetPositionPct) / 100;
  }

  riskBudget(baseBalance) {
    return (baseBalance * this.config.maxRiskPerTradePct) / 100;
  }

  shouldTrade(now) {
    return now - this.lastTradeAt >= this.config.tradeCooldownMs;
  }

  attachPriceFeed(getPrices) {
    this.getPrices = getPrices; // function()-> {symbol: price}
  }

  feedMarketTick(tick) {
    this.monitor.addMarketData({
      price: tick.prices,
      volume: tick.volumes,
      orderbook: tick.orderbooks,
    });
  }

  async maybeTrade(exchange, wallet, priceHistories) {
    const now = Date.now();
    if (!this.shouldTrade(now)) return null;

    const prices = this.getPrices ? this.getPrices() : {};
    const baseBal = wallet.getBalance(this.config.baseToken);
    const targetPerAsset = this.positionTarget(baseBal);
    const risk = this.riskBudget(baseBal);

    const decisions = [];
    for (const symbol of this.config.symbols) {
      const price = prices[symbol];
      if (!price) continue;
      const history = priceHistories.get(symbol) || [];
      const signal = this.blendedSignal(symbol, price, history);

      const pos = wallet.getPosition(symbol);
      const currentValue = pos.qty * price;
      const desired = targetPerAsset * signal; // 0..target

      if (desired > currentValue * 1.1 && risk > 1) {
        // buy some
        const delta = Math.min(desired - currentValue, risk);
        const fill = await exchange.marketBuy(symbol, delta);
        decisions.push({ action: 'BUY', symbol, delta, fill });
      } else if (currentValue > desired * 1.3 && pos.qty > 0) {
        // sell down to desired
        const sellValue = currentValue - desired;
        const qty = sellValue / price;
        const fill = await exchange.marketSell(symbol, Math.min(qty, pos.qty));
        decisions.push({ action: 'SELL', symbol, qty: Math.min(qty, pos.qty), fill });
      }
    }

    if (decisions.length) {
      this.lastTradeAt = now;
      this.emit('trades', decisions);
    }
    return decisions;
  }
}

export default StrategyEngine;import MonitorModule from '../core/MarketStabilityMonitor.js';
// cleanup of stray appended code
