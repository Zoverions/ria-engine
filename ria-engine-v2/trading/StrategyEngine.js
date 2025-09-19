import { MarketStabilityMonitor } from '../core/MarketStabilityMonitor.js';

export class StrategyEngine {
  constructor(config = {}) {
    this.monitor = new MarketStabilityMonitor(config.monitor);
    this.state = {
      signals: [],
      regime: 'sideways',
      lastMfi: 0,
    };

    // Listen to antifragile insights
    this.monitor.antifragileManager.on('marketFrameProcessed', (data) => {
      this.state.regime = data.regime;
    });

    this.monitor.mfiCalculator.on('mfiUpdated', (result) => {
      this.state.lastMfi = result.mfi;
    });
  }

  getSignals(components) {
    // Combine established metrics and novel insights
    // Established: price momentum, volatility breakout
    // Novel: MFI-based fracture risk, intervention recommendations

    const signals = [];

    Object.entries(components).forEach(([asset, data]) => {
      const momentum = Math.sign(data.spectralSlope);
      const autocorr = data.autocorrelation || 0;
      const imbalance = data.orderImbalance || 0;

      let score = 0;
      score += momentum * 0.4;
      score += (autocorr - 0.5) * 0.3;
      score += (0.5 - imbalance) * 0.3; // prefer balanced orderbooks

      // Adjust by MFI novelty factor
      const novelty = 1 - this.state.lastMfi; // lower MFI -> more confidence
      score *= novelty;

      if (score > 0.2) {
        signals.push({ asset, side: 'BUY', strength: score });
      } else if (score < -0.2) {
        signals.push({ asset, side: 'SELL', strength: -score });
      }
    });

    return signals.sort((a, b) => b.strength - a.strength);
  }
}
