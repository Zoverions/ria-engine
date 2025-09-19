/**
 * Trading Platform Demo - RIA Financial Markets Application
 *
 * Comprehensive demonstration of the Resonant Interface Architecture
 * applied to predictive algorithmic trading. Shows Market Fracture Index (MFI)
 * calculation, crisis detection, antifragile learning, and automated interventions.
 *
 * Features:
 * - Real-time market simulation with realistic crash scenarios
 * - MFI calculation and crisis prediction
 * - Tiered trading interventions (gentle → moderate → aggressive)
 * - Antifragile learning from market crashes
 * - Performance tracking and risk management
 * - Interactive demo controls and visualization
 */

import { EventEmitter } from 'events';
import { MarketStabilityMonitor } from './MarketStabilityMonitor.js';
import { FinancialAntifragileManager } from './FinancialAntifragileManager.js';

export class TradingPlatformDemo extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      // Demo configuration
      duration: 10 * 60 * 1000, // 10 minutes
      assets: ['SPY', 'QQQ', 'IWM', 'TLT'],
      crashScenarios: {
        flashCrash: { probability: 0.1, magnitude: 0.08, duration: 300000 },
        blackSwan: { probability: 0.05, magnitude: 0.15, duration: 3600000 },
        systemicCrisis: { probability: 0.02, magnitude: 0.25, duration: 86400000 }
      },

      // Trading parameters
      initialCapital: 1000000, // $1M
      maxPositionSize: 100000,
      riskLimit: 0.02, // 2% max loss per trade

      ...config
    };

    // Core components
    this.monitor = new MarketStabilityMonitor({
      asset: 'SPY',
      monitoringMode: 'continuous',
      updateInterval: 1000
    });

    this.antifragileManager = new FinancialAntifragileManager();

    // Demo state
    this.state = {
      isRunning: false,
      startTime: null,
      currentTime: null,
      assets: new Map(),
      portfolio: {
        cash: this.config.initialCapital,
        positions: new Map(),
        totalValue: this.config.initialCapital,
        dailyPnL: 0,
        maxDrawdown: 0
      },
      activeCrashes: [],
      interventionHistory: [],
      performance: {
        totalReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        winRate: 0,
        totalTrades: 0
      }
    };

    // Market simulation
    this.marketSimulator = new MarketSimulator(this.config.assets);

    // Demo controls
    this.controls = {
      speed: 1, // 1x real-time
      paused: false,
      crashMode: false,
      interventionMode: 'automatic'
    };

    this.setupEventHandlers();
  }

  /**
   * Initialize the trading demo
   */
  async initialize() {
    try {
      this.emit('initializing', { assets: this.config.assets });

      // Initialize market simulator
      await this.marketSimulator.initialize();

      // Initialize RIA components
      await this.monitor.initialize();
      // Antifragile manager doesn't need async init

      // Setup initial portfolio
      this.initializePortfolio();

      this.emit('initialized', {
        assets: this.config.assets,
        initialCapital: this.config.initialCapital,
        duration: this.config.duration
      });

    } catch (error) {
      this.emit('error', { phase: 'initialization', error });
      throw error;
    }
  }

  /**
   * Start the trading demo
   */
  async startDemo() {
    if (this.state.isRunning) {
      this.emit('warning', 'Demo already running');
      return;
    }

    try {
      this.emit('starting', {
        duration: this.config.duration,
        assets: this.config.assets
      });

      // Start market simulation
      this.marketSimulator.start();

      // Start RIA monitoring
      await this.monitor.startMonitoring();

      this.state.isRunning = true;
      this.state.startTime = Date.now();
      this.state.currentTime = Date.now();

      // Start main demo loop
      this.startDemoLoop();

      this.emit('started', {
        startTime: this.state.startTime,
        portfolio: { ...this.state.portfolio }
      });

    } catch (error) {
      this.emit('error', { phase: 'start', error });
      throw error;
    }
  }

  /**
   * Stop the trading demo
   */
  async stopDemo() {
    if (!this.state.isRunning) {
      this.emit('warning', 'Demo not running');
      return;
    }

    try {
      this.emit('stopping');

      // Stop all components
      this.marketSimulator.stop();
      await this.monitor.stopMonitoring();

      this.state.isRunning = false;

      // Calculate final performance
      const finalPerformance = this.calculateFinalPerformance();

      this.emit('stopped', {
        duration: Date.now() - this.state.startTime,
        finalPerformance,
        portfolio: { ...this.state.portfolio }
      });

    } catch (error) {
      this.emit('error', { phase: 'stop', error });
      throw error;
    }
  }

  /**
   * Start main demo loop
   */
  startDemoLoop() {
    this.demoInterval = setInterval(async () => {
      if (!this.state.isRunning || this.controls.paused) return;

      this.state.currentTime = Date.now();

      // Check for demo completion
      if (this.state.currentTime - this.state.startTime >= this.config.duration) {
        await this.stopDemo();
        return;
      }

      // Update market simulation
      await this.updateMarketSimulation();

      // Process RIA components
      await this.processRIAComponents();

      // Update portfolio
      await this.updatePortfolio();

      // Check for crash scenarios
      await this.checkCrashScenarios();

      // Emit demo update
      this.emit('demoUpdate', {
        currentTime: this.state.currentTime,
        elapsed: this.state.currentTime - this.state.startTime,
        portfolio: { ...this.state.portfolio },
        marketState: this.marketSimulator.getMarketState(),
        riaState: this.monitor.getAssetStatus()
      });

    }, 1000 / this.controls.speed); // Adjust for demo speed
  }

  /**
   * Update market simulation
   */
  async updateMarketSimulation() {
    // Get simulated market data
    const marketData = this.marketSimulator.getCurrentData();

    // Feed data to RIA monitor
    for (const [asset, data] of Object.entries(marketData)) {
      await this.monitor.ingestMarketData('price', data.price, this.state.currentTime);
      await this.monitor.ingestMarketData('volume', data.volume, this.state.currentTime);

      if (data.orderbook) {
        await this.monitor.ingestMarketData('orderbook', data.orderbook, this.state.currentTime);
      }

      if (data.volatility) {
        await this.monitor.ingestMarketData('volatility', data.volatility, this.state.currentTime);
      }
    }
  }

  /**
   * Process RIA components
   */
  async processRIAComponents() {
    // Get current MFI result
    const mfiResult = this.monitor.mfiCalculator.getMFIStatus();

    if (mfiResult) {
      // Get current market data for antifragile learning
      const marketData = this.marketSimulator.getCurrentData();
      const interventions = Array.from(this.monitor.activeInterventions.values());

      // Process through antifragile manager
      await this.antifragileManager.processFinancialFrame(
        marketData,
        mfiResult,
        interventions
      );
    }
  }

  /**
   * Update portfolio based on market conditions and interventions
   */
  async updatePortfolio() {
    const marketData = this.marketSimulator.getCurrentData();

    // Update position values
    for (const [asset, position] of this.state.portfolio.positions) {
      const currentPrice = marketData[asset]?.price || position.entryPrice;
      const priceChange = currentPrice - position.entryPrice;
      const pnl = priceChange * position.shares;

      position.currentPrice = currentPrice;
      position.unrealizedPnL = pnl;
      position.marketValue = currentPrice * position.shares;
    }

    // Calculate total portfolio value
    let totalValue = this.state.portfolio.cash;
    for (const position of this.state.portfolio.positions.values()) {
      totalValue += position.marketValue;
    }

    // Update portfolio metrics
    const previousValue = this.state.portfolio.totalValue;
    const dailyPnL = totalValue - previousValue;
    const maxDrawdown = Math.max(this.state.portfolio.maxDrawdown,
      (previousValue - totalValue) / previousValue);

    this.state.portfolio.totalValue = totalValue;
    this.state.portfolio.dailyPnL = dailyPnL;
    this.state.portfolio.maxDrawdown = maxDrawdown;
  }

  /**
   * Check for and trigger crash scenarios
   */
  async checkCrashScenarios() {
    if (this.controls.crashMode) {
      // Force crash for demonstration
      await this.triggerCrashScenario('flashCrash');
      this.controls.crashMode = false;
      return;
    }

    // Random crash probability
    for (const [scenario, config] of Object.entries(this.config.crashScenarios)) {
      if (Math.random() < config.probability / 3600) { // Per second probability
        await this.triggerCrashScenario(scenario);
        break;
      }
    }
  }

  /**
   * Trigger a specific crash scenario
   */
  async triggerCrashScenario(scenario) {
    const config = this.config.crashScenarios[scenario];
    if (!config) return;

    const crash = {
      id: `crash_${Date.now()}`,
      scenario,
      startTime: this.state.currentTime,
      magnitude: config.magnitude,
      duration: config.duration,
      affectedAssets: this.config.assets.slice(0, 2), // First 2 assets
      active: true
    };

    this.state.activeCrashes.push(crash);
    this.marketSimulator.triggerCrash(crash);

    this.emit('crashTriggered', crash);

    // Schedule crash end
    setTimeout(() => {
      this.endCrashScenario(crash.id);
    }, config.duration);
  }

  /**
   * End a crash scenario
   */
  endCrashScenario(crashId) {
    const crashIndex = this.state.activeCrashes.findIndex(c => c.id === crashId);
    if (crashIndex >= 0) {
      const crash = this.state.activeCrashes[crashIndex];
      crash.active = false;
      crash.endTime = Date.now();

      this.marketSimulator.endCrash(crash);
      this.emit('crashEnded', crash);
    }
  }

  /**
   * Initialize portfolio
   */
  initializePortfolio() {
    // Start with equal allocation to each asset
    const allocationPerAsset = this.config.initialCapital / this.config.assets.length;

    for (const asset of this.config.assets) {
      const initialPrice = 100; // Simplified initial price
      const shares = Math.floor(allocationPerAsset / initialPrice);

      this.state.portfolio.positions.set(asset, {
        asset,
        shares,
        entryPrice: initialPrice,
        currentPrice: initialPrice,
        marketValue: shares * initialPrice,
        unrealizedPnL: 0
      });
    }
  }

  /**
   * Execute trading intervention
   */
  async executeIntervention(intervention) {
    this.state.interventionHistory.push({
      ...intervention,
      executedAt: Date.now(),
      portfolioBefore: { ...this.state.portfolio }
    });

    // Execute based on intervention type
    switch (intervention.type) {
      case 'portfolio_hedging':
        await this.executePortfolioHedging(intervention);
        break;
      case 'position_liquidation':
        await this.executePositionLiquidation(intervention);
        break;
      case 'options_positioning':
        await this.executeOptionsPositioning(intervention);
        break;
      default:
        this.emit('interventionExecuted', {
          intervention,
          result: 'no_action_required'
        });
    }
  }

  /**
   * Execute portfolio hedging
   */
  async executePortfolioHedging(intervention) {
    const hedgeRatio = intervention.parameters?.ratio || 0.1;

    // Reduce position sizes by hedge ratio
    for (const [asset, position] of this.state.portfolio.positions) {
      const sharesToSell = Math.floor(position.shares * hedgeRatio);
      if (sharesToSell > 0) {
        const saleValue = sharesToSell * position.currentPrice;
        position.shares -= sharesToSell;
        position.marketValue = position.shares * position.currentPrice;
        this.state.portfolio.cash += saleValue;

        this.emit('positionAdjusted', {
          asset,
          action: 'sell',
          shares: sharesToSell,
          price: position.currentPrice,
          value: saleValue
        });
      }
    }
  }

  /**
   * Execute position liquidation
   */
  async executePositionLiquidation(intervention) {
    const reductionPercentage = intervention.parameters?.percentage || 0.5;

    // Liquidate portion of positions
    for (const [asset, position] of this.state.portfolio.positions) {
      const sharesToSell = Math.floor(position.shares * reductionPercentage);
      if (sharesToSell > 0) {
        const saleValue = sharesToSell * position.currentPrice;
        position.shares -= sharesToSell;
        position.marketValue = position.shares * position.currentPrice;
        this.state.portfolio.cash += saleValue;

        this.emit('positionAdjusted', {
          asset,
          action: 'liquidate',
          shares: sharesToSell,
          price: position.currentPrice,
          value: saleValue
        });
      }
    }
  }

  /**
   * Execute options positioning
   */
  async executeOptionsPositioning(intervention) {
    // Simplified options trading simulation
    const optionPremium = 1000; // $1,000 premium cost

    if (this.state.portfolio.cash >= optionPremium) {
      this.state.portfolio.cash -= optionPremium;

      this.emit('optionsTrade', {
        type: intervention.parameters?.action || 'buy_put',
        premium: optionPremium,
        strike: intervention.parameters?.strike || 'atm'
      });
    }
  }

  /**
   * Calculate final performance metrics
   */
  calculateFinalPerformance() {
    const totalReturn = (this.state.portfolio.totalValue - this.config.initialCapital) / this.config.initialCapital;
    const duration = (Date.now() - this.state.startTime) / (1000 * 60 * 60 * 24); // Days

    return {
      totalReturn,
      annualizedReturn: totalReturn / duration * 365,
      maxDrawdown: this.state.portfolio.maxDrawdown,
      totalTrades: this.state.interventionHistory.length,
      finalValue: this.state.portfolio.totalValue,
      cash: this.state.portfolio.cash,
      positions: Array.from(this.state.portfolio.positions.values()),
      interventions: this.state.interventionHistory.length,
      crashes: this.state.activeCrashes.length
    };
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    // Monitor events
    this.monitor.on('mfiUpdate', (data) => {
      this.emit('mfiUpdate', data);
    });

    this.monitor.on('crisisSuspected', (data) => {
      this.emit('crisisSuspected', data);
    });

    this.monitor.on('crisisConfirmed', (data) => {
      this.emit('crisisConfirmed', data);
    });

    this.monitor.on('interventionTriggered', async (intervention) => {
      await this.executeIntervention(intervention);
      this.emit('interventionTriggered', intervention);
    });

    // Antifragile manager events
    this.antifragileManager.on('financialFrameProcessed', (data) => {
      this.emit('antifragileUpdate', data);
    });

    this.antifragileManager.on('crisisLearned', (data) => {
      this.emit('crisisLearned', data);
    });

    this.antifragileManager.on('regimeTransition', (data) => {
      this.emit('regimeTransition', data);
    });
  }

  /**
   * Demo controls
   */
  pauseDemo() {
    this.controls.paused = true;
    this.emit('demoPaused');
  }

  resumeDemo() {
    this.controls.paused = false;
    this.emit('demoResumed');
  }

  setSpeed(speed) {
    this.controls.speed = Math.max(0.1, Math.min(10, speed));
    if (this.demoInterval) {
      clearInterval(this.demoInterval);
      this.startDemoLoop();
    }
    this.emit('speedChanged', { speed: this.controls.speed });
  }

  triggerManualCrash(scenario = 'flashCrash') {
    this.controls.crashMode = true;
    this.emit('manualCrashTriggered', { scenario });
  }

  /**
   * Get demo status
   */
  getDemoStatus() {
    return {
      isRunning: this.state.isRunning,
      currentTime: this.state.currentTime,
      elapsed: this.state.startTime ? this.state.currentTime - this.state.startTime : 0,
      portfolio: { ...this.state.portfolio },
      activeCrashes: this.state.activeCrashes.filter(c => c.active),
      controls: { ...this.controls },
      performance: this.calculateFinalPerformance(),
      riaStatus: {
        monitor: this.monitor.getAssetStatus(),
        antifragile: this.antifragileManager.getFinancialLearningMetrics()
      }
    };
  }
}

/**
 * Market Simulator - Realistic market data generation
 */
class MarketSimulator {
  constructor(assets) {
    this.assets = assets;
    this.state = {
      isRunning: false,
      basePrices: { SPY: 450, QQQ: 380, IWM: 180, TLT: 95 },
      currentPrices: {},
      trends: {},
      volatilities: {},
      activeCrash: null
    };

    // Initialize prices
    for (const asset of assets) {
      this.state.currentPrices[asset] = this.state.basePrices[asset] || 100;
      this.state.trends[asset] = 0;
      this.state.volatilities[asset] = 0.15; // 15% annualized
    }
  }

  async initialize() {
    // Initialize market simulation parameters
    this.emit('initialized');
  }

  start() {
    this.state.isRunning = true;
    this.emit('started');
  }

  stop() {
    this.state.isRunning = false;
    this.emit('stopped');
  }

  getCurrentData() {
    const data = {};

    for (const asset of this.assets) {
      const price = this.state.currentPrices[asset];
      const volume = this.generateVolume(asset);
      const orderbook = this.generateOrderbook(asset, price);
      const volatility = this.state.volatilities[asset];

      data[asset] = {
        price,
        volume,
        orderbook,
        volatility,
        timestamp: Date.now()
      };

      // Update price with random walk
      this.updatePrice(asset);
    }

    return data;
  }

  updatePrice(asset) {
    if (!this.state.isRunning) return;

    let price = this.state.currentPrices[asset];
    const volatility = this.state.volatilities[asset];
    const trend = this.state.trends[asset];

    // Random walk component
    const randomChange = (Math.random() - 0.5) * 2 * volatility * price * 0.01; // 1% max change per step

    // Trend component
    const trendChange = trend * price * 0.0001; // Small trend influence

    // Crash component
    let crashChange = 0;
    if (this.state.activeCrash && this.state.activeCrash.affectedAssets.includes(asset)) {
      const crashProgress = (Date.now() - this.state.activeCrash.startTime) / this.state.activeCrash.duration;
      const crashMagnitude = this.state.activeCrash.magnitude * Math.sin(Math.PI * crashProgress);
      crashChange = -crashMagnitude * price;
    }

    // Update price
    price += randomChange + trendChange + crashChange;
    price = Math.max(price * 0.5, price); // Floor at 50% of original

    this.state.currentPrices[asset] = price;
  }

  generateVolume(asset) {
    const baseVolume = { SPY: 1000000, QQQ: 800000, IWM: 500000, TLT: 300000 };
    const base = baseVolume[asset] || 100000;
    return base + (Math.random() - 0.5) * base * 0.5;
  }

  generateOrderbook(asset, midPrice) {
    const spread = midPrice * 0.001; // 0.1% spread
    const levels = 5;

    const bids = [];
    const asks = [];

    for (let i = 1; i <= levels; i++) {
      bids.push({
        price: midPrice - (spread * i / levels),
        volume: Math.floor(Math.random() * 1000) + 100
      });

      asks.push({
        price: midPrice + (spread * i / levels),
        volume: Math.floor(Math.random() * 1000) + 100
      });
    }

    return { bids, asks };
  }

  triggerCrash(crash) {
    this.state.activeCrash = crash;
    this.emit('crashStarted', crash);
  }

  endCrash(crash) {
    if (this.state.activeCrash && this.state.activeCrash.id === crash.id) {
      this.state.activeCrash = null;
      this.emit('crashEnded', crash);
    }
  }

  getMarketState() {
    return {
      ...this.state,
      currentPrices: { ...this.state.currentPrices },
      trends: { ...this.state.trends },
      volatilities: { ...this.state.volatilities }
    };
  }
}

// Extend EventEmitter for MarketSimulator
Object.setPrototypeOf(MarketSimulator.prototype, EventEmitter.prototype);

export default TradingPlatformDemo;