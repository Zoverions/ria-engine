import { Wallet, Mnemonic } from 'ethers';

export class WalletManager {
  constructor({ mode = 'paper', privateKey = null, mnemonic = null } = {}) {
    this.mode = mode; // 'paper' | 'live'
    this.wallet = null;
    this.paperBalances = new Map(); // token -> number

    if (mode === 'live') {
      if (privateKey) {
        this.wallet = new Wallet(privateKey);
      } else if (mnemonic) {
        this.wallet = Wallet.fromPhrase(mnemonic);
      } else {
        throw new Error('Live mode requires PRIVATE_KEY or MNEMONIC');
      }
    }
  }

  getAddress() {
    if (this.mode === 'paper') return '0xPAPER000000000000000000000000000000000001';
    return this.wallet.address;
  }

  // Paper mode: manage balances
  setPaperBalance(symbol, amount) {
    this.paperBalances.set(symbol, amount);
  }

  getPaperBalance(symbol) {
    return this.paperBalances.get(symbol) || 0;
  }

  adjustPaperBalance(symbol, delta) {
    const current = this.getPaperBalance(symbol);
    this.paperBalances.set(symbol, current + delta);
  }

  // Live mode helpers
  connect(provider) {
    if (this.mode === 'live' && provider) {
      this.wallet = this.wallet.connect(provider);
    }
  }
}
