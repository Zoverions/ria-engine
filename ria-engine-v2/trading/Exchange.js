import { EventEmitter } from 'events';

export class Exchange extends EventEmitter {
  constructor(wallet, config = {}) {
    super();
    this.wallet = wallet;
    this.config = {
      mode: wallet.getMode(),
      feeBps: 20, // 0.20%
      slippageBps: 30, // 0.30% default slippage model
      baseToken: wallet.config.baseToken || 'USDC',
      priceOracle: null, // function(symbol)->price
      ...config,
    };
  }

  setPriceOracle(fn) { this.config.priceOracle = fn; }

  getPrice(symbol) {
    if (!this.config.priceOracle) throw new Error('Price oracle not set');
    return this.config.priceOracle(symbol);
  }

  // Market buy amount in base (USDC) => returns qty of token
  async marketBuy(symbol, baseAmount) {
    const price = this.getPrice(symbol);
    const fee = (baseAmount * this.config.feeBps) / 10000;
    const slipPrice = price * (1 + this.config.slippageBps / 10000);
    const spend = baseAmount + fee;

    if (this.wallet.getMode() === 'paper') {
      this.wallet.debit(this.config.baseToken, spend);
      const qty = baseAmount / slipPrice;
      const pos = this.wallet.updatePosition(symbol, qty, slipPrice);
      this.emit('filled', { side: 'BUY', symbol, qty, price: slipPrice, fee });
      return { qty, price: slipPrice, fee, position: pos };
    }

    // EVM mode implementation placeholder
    throw new Error('EVM execution not implemented in this demo');
  }

  // Market sell qty of token => returns base received
  async marketSell(symbol, qty) {
    const price = this.getPrice(symbol);
    const slipPrice = price * (1 - this.config.slippageBps / 10000);
    const gross = qty * slipPrice;
    const fee = (gross * this.config.feeBps) / 10000;
    const receive = gross - fee;

    if (this.wallet.getMode() === 'paper') {
      // reduce position
      this.wallet.updatePosition(symbol, -qty, slipPrice);
      this.wallet.credit(this.config.baseToken, receive);
      this.emit('filled', { side: 'SELL', symbol, qty, price: slipPrice, fee });
      return { baseReceived: receive, price: slipPrice, fee };
    }

    // EVM mode implementation placeholder
    throw new Error('EVM execution not implemented in this demo');
  }
}

export default Exchange;