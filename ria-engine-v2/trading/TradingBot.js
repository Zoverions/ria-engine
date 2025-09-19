import { WalletManager } from './WalletManager.js';
import { ExchangeAdapter } from './ExchangeAdapter.js';
import { StrategyEngine } from './StrategyEngine.js';

export class TradingBot {
  constructor({ mode = 'paper', baseUSD = 100000, tokens = ['AAPL','GOOGL','BTC','ETH'] } = {}) {
    this.mode = mode;
    this.wallet = new WalletManager({ mode });
    this.exchange = new ExchangeAdapter({ mode });
    this.strategy = new StrategyEngine();
    this.tokens = tokens;

    // Initialize paper balances
    if (mode === 'paper') {
      this.wallet.setPaperBalance('USD', baseUSD);
      tokens.forEach(t => this.wallet.setPaperBalance(t, 0));
    }
  }

  setQuotes(quotes) {
    Object.entries(quotes).forEach(([symbol, price]) => {
      this.exchange.setQuote(symbol, price);
    });
  }

  async onMfiUpdate(mfiData) {
    const { components } = mfiData;
    const signals = this.strategy.getSignals(components);
    await this.executeSignals(signals);
  }

  async executeSignals(signals) {
    for (const sig of signals.slice(0, 3)) { // act on top 3
      const symbol = sig.asset;
      const side = sig.side;

      // position sizing: 1% of USD per trade scaled by strength
      const usdBalance = this.wallet.getPaperBalance('USD');
      const riskPct = Math.min(0.01 * sig.strength * 5, 0.03); // up to 3%
      const usdToUse = usdBalance * riskPct;
      const price = this.exchange.getPrice(symbol) || 1;
      const qty = usdToUse / price;

      if (side === 'BUY' && usdToUse > 1) {
        const { execPrice, filled, cost } = await this.exchange.marketBuy(symbol, qty);
        this.wallet.adjustPaperBalance('USD', -cost);
        this.wallet.adjustPaperBalance(symbol, filled);
        this.log(`BUY ${symbol} qty=${filled.toFixed(4)} @ ${execPrice.toFixed(4)} cost=$${cost.toFixed(2)}`);
      }

      if (side === 'SELL' && this.wallet.getPaperBalance(symbol) > 0) {
        const have = this.wallet.getPaperBalance(symbol);
        const sellQty = Math.min(have, qty);
        const { execPrice, filled, proceeds } = await this.exchange.marketSell(symbol, sellQty);
        this.wallet.adjustPaperBalance('USD', proceeds);
        this.wallet.adjustPaperBalance(symbol, -filled);
        this.log(`SELL ${symbol} qty=${filled.toFixed(4)} @ ${execPrice.toFixed(4)} proceeds=$${proceeds.toFixed(2)}`);
      }
    }
  }

  portfolioValue() {
    let total = this.wallet.getPaperBalance('USD');
    for (const t of this.tokens) {
      total += this.wallet.getPaperBalance(t) * (this.exchange.getPrice(t) || 0);
    }
    return total;
  }

  log(msg) {
    console.log(`[BOT] ${msg}`);
  }
}
