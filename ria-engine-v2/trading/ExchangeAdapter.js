export class ExchangeAdapter {
  constructor({ mode = 'paper' } = {}) {
    this.mode = mode;
    this.orderBook = new Map(); // symbol -> {price, liquidity}
    this.lastPrices = new Map();
  }

  // Simulated quote for paper mode
  setQuote(symbol, price, liquidity = 100000) {
    this.orderBook.set(symbol, { price, liquidity });
    this.lastPrices.set(symbol, price);
  }

  getPrice(symbol) {
    return this.lastPrices.get(symbol) || 0;
  }

  async marketBuy(symbol, amount) {
    const quote = this.orderBook.get(symbol);
    if (!quote) throw new Error(`No quote for ${symbol}`);
    // Slippage model: price impacts with size
    const priceImpact = Math.min(0.02, amount / quote.liquidity);
    const execPrice = quote.price * (1 + priceImpact);
    const cost = execPrice * amount;
    return { execPrice, filled: amount, cost };
  }

  async marketSell(symbol, amount) {
    const quote = this.orderBook.get(symbol);
    if (!quote) throw new Error(`No quote for ${symbol}`);
    const priceImpact = Math.min(0.02, amount / quote.liquidity);
    const execPrice = quote.price * (1 - priceImpact);
    const proceeds = execPrice * amount;
    return { execPrice, filled: amount, proceeds };
  }
}
