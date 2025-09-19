/**
 * Wallet abstraction for ERC-20 trading
 * - Paper mode by default (no external dependencies)
 * - Optional EVM mode (requires ethers and RPC/PRIVATE_KEY)
 */
import { EventEmitter } from 'events';

export class Wallet extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      mode: process.env.TRADING_MODE || 'paper', // 'paper' | 'evm'
      chainId: Number(process.env.CHAIN_ID || 1),
      rpcUrl: process.env.RPC_URL || '',
      privateKey: process.env.PRIVATE_KEY || '',
      baseToken: 'USDC',
      initialBalances: {
        USDC: 100000,
      },
      ...config,
    };

    this.mode = this.config.mode;
    this.balances = new Map(Object.entries(this.config.initialBalances));
    this.positions = new Map(); // token -> { qty, avgPrice }
    this.address = 'paper-wallet';

    if (this.mode === 'evm') {
      this.setupEvm().catch((err) => {
        console.warn('EVM setup failed, falling back to paper:', err.message);
        this.mode = 'paper';
      });
    }
  }

  async setupEvm() {
    const { rpcUrl, privateKey } = this.config;
    if (!rpcUrl || !privateKey) throw new Error('RPC_URL and PRIVATE_KEY required for EVM mode');
    const { JsonRpcProvider, Wallet: EthersWallet } = await import('ethers');
    this.provider = new JsonRpcProvider(rpcUrl);
    this.signer = new EthersWallet(privateKey, this.provider);
    this.address = await this.signer.getAddress();
    this.emit('ready', { mode: 'evm', address: this.address });
  }

  getMode() {
    return this.mode;
  }

  getAddress() {
    return this.address;
  }

  getBalance(symbol) {
    return this.balances.get(symbol) || 0;
  }

  setBalance(symbol, amount) {
    this.balances.set(symbol, amount);
    this.emit('balanceUpdated', { symbol, amount });
  }

  credit(symbol, amount) {
    this.setBalance(symbol, this.getBalance(symbol) + amount);
  }

  debit(symbol, amount) {
    const bal = this.getBalance(symbol);
    if (amount > bal) throw new Error(`Insufficient ${symbol} balance`);
    this.setBalance(symbol, bal - amount);
  }

  getPosition(symbol) {
    return this.positions.get(symbol) || { qty: 0, avgPrice: 0 };
  }

  updatePosition(symbol, qtyDelta, price) {
    const pos = this.getPosition(symbol);
    let { qty, avgPrice } = pos;

    // If adding to position, recalc avg price; if reducing, keep avg
    const newQty = qty + qtyDelta;
    if (newQty > 0) {
      if (qtyDelta > 0) {
        avgPrice = (qty * avgPrice + qtyDelta * price) / newQty;
      }
    } else {
      avgPrice = 0;
    }

    const updated = { qty: newQty, avgPrice };
    this.positions.set(symbol, updated);
    this.emit('positionUpdated', { symbol, ...updated });
    return updated;
  }
}

export default Wallet;