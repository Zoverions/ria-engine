import { EventEmitter } from 'events';
import { MarketFractureIndex } from './math/MarketFractureIndex.js';
import { FinancialAntifragileManager } from '../antifragile/FinancialAntifragileManager.js';

export class MarketStabilityMonitor extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      mfiThresholds: { gentle: 0.3, moderate: 0.6, aggressive: 0.8 },
      interventionCooldown: 30000,
      maxPositions: 100,
      riskLimits: { maxDrawdown: 0.15, maxVolatility: 0.25 },
      ...config,
    };

    this.mfiCalculator = new MarketFractureIndex();
    this.antifragileManager = new FinancialAntifragileManager();
    this.activeInterventions = new Map();
    this.marketState = {
      currentMFI: 0,
      riskMetrics: { drawdown: 0, volatility: 0, correlation: 0 },
      lastIntervention: null,
    };

    this.aggregates = { priceSeries: [], volumeSeries: [], timestamps: [] };

    this.mfiCalculator.on('mfiUpdated', (data) => this.processMFIUpdate(data));
    this.antifragileManager.on('interventionLearned', (d) => this.applyLearnedIntervention(d));
  }

  async startMonitoring() {
    console.log('🚀 Starting Market Stability Monitoring...');
    await this.antifragileManager.initialize?.();
    this.emit('monitoringStarted', { timestamp: Date.now(), config: this.config });
    console.log('✅ Market Stability Monitor active');
  }

  async stopMonitoring() {
    console.log('🛑 Stopping Market Stability Monitoring...');
    await this.antifragileManager.shutdown?.();
    this.emit('monitoringStopped', { timestamp: Date.now(), finalState: this.marketState });
    console.log('✅ Market Stability Monitor stopped');
  }

  processMFIUpdate(mfiData) {
    const { mfi } = mfiData;
    this.marketState.currentMFI = mfi;
    this.updateRiskMetrics();

    const interventionLevel = this.determineInterventionLevel(mfi);
    if (interventionLevel && this.shouldTriggerIntervention()) {
      this.triggerIntervention(interventionLevel, mfiData);
    }

    this.emit('marketStateUpdate', {
      timestamp: Date.now(),
      mfi,
      interventionLevel,
      riskMetrics: this.marketState.riskMetrics,
      activeInterventions: Array.from(this.activeInterventions.keys()),
    });
  }

  determineInterventionLevel(mfi) {
    if (mfi >= this.config.mfiThresholds.aggressive) return 'aggressive';
    if (mfi >= this.config.mfiThresholds.moderate) return 'moderate';
    if (mfi >= this.config.mfiThresholds.gentle) return 'gentle';
    return null;
  }

  shouldTriggerIntervention() {
    const now = Date.now();
    const last = this.marketState.lastIntervention;
    return !last || now - last >= this.config.interventionCooldown;
  }

  triggerIntervention(level, mfiData) {
    const interventionId = `intervention_${Date.now()}_${level}`;
    const intervention = { type: level, actions: [], mfiAtTrigger: mfiData.mfi };
    this.activeInterventions.set(interventionId, { ...intervention, id: interventionId, timestamp: Date.now() });
    this.marketState.lastIntervention = Date.now();
    this.emit('interventionTriggered', { interventionId, level, intervention, mfiData });
  }

  updateRiskMetrics() {
    const prices = this.aggregates.priceSeries;
    // drawdown
    let drawdown = 0;
    if (prices.length > 1) {
      const peak = Math.max(...prices);
      const current = prices[prices.length - 1];
      drawdown = Math.max(0, (peak - current) / (peak || 1));
    }
    // volatility
    let vol = 0;
    if (prices.length > 1) {
      const rets = [];
      for (let i = 1; i < prices.length; i++) {
        const prev = prices[i - 1] || 1;
        rets.push((prices[i] - prev) / prev);
      }
      const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
      const variance = rets.reduce((s, r) => s + (r - mean) * (r - mean), 0) / rets.length;
      vol = Math.sqrt(Math.max(0, variance));
    }
    this.marketState.riskMetrics = { drawdown, volatility: vol, correlation: 0 };
  }

  applyLearnedIntervention(learnedData) {
    const { adjustments = {} } = learnedData || {};
    if (adjustments.thresholds) this.config.mfiThresholds = { ...this.config.mfiThresholds, ...adjustments.thresholds };
    if (adjustments.cooldown) this.config.interventionCooldown = adjustments.cooldown;
    this.emit('interventionLearned', learnedData);
  }

  addMarketData(marketData) {
    const priceValues = Object.values(marketData.price || {});
    const volumeValues = Object.values(marketData.volume || {});
    const orderbooks = Object.values(marketData.orderbook || {});

    const avgPrice = priceValues.length ? priceValues.reduce((a, b) => a + b, 0) / priceValues.length : null;
    const totalVolume = volumeValues.length ? volumeValues.reduce((a, b) => a + b, 0) : null;
    const obAgg = orderbooks.length
      ? orderbooks.reduce(
          (acc, ob) => {
            const buyVol = (ob.bids || []).reduce((s, o) => s + (o.volume || 0), 0);
            const sellVol = (ob.asks || []).reduce((s, o) => s + (o.volume || 0), 0);
            acc.buyVolume += buyVol;
            acc.sellVolume += sellVol;
            return acc;
          },
          { buyVolume: 0, sellVolume: 0 }
        )
      : null;

    const ts = Date.now();
    if (avgPrice != null) {
      this.mfiCalculator.addMarketData('price', avgPrice, ts);
      this.aggregates.priceSeries.push(avgPrice);
      if (this.aggregates.priceSeries.length > 500) this.aggregates.priceSeries.shift();
    }
    if (totalVolume != null) {
      this.mfiCalculator.addMarketData('volume', totalVolume, ts);
      this.aggregates.volumeSeries.push(totalVolume);
      if (this.aggregates.volumeSeries.length > 500) this.aggregates.volumeSeries.shift();
    }
    if (obAgg) this.mfiCalculator.addMarketData('orderbook', obAgg, ts);
    this.aggregates.timestamps.push(ts);
    if (this.aggregates.timestamps.length > 500) this.aggregates.timestamps.shift();
  }
}

export default MarketStabilityMonitor;