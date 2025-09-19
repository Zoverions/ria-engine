/**
 * Market Stability Monitor - Financial Markets Crisis Prevention
 *
 * Applies RIA architecture to financial markets to predict and prevent
 * systemic resonance fractures (market crashes). Monitors market stability
 * as a resonant field and provides predictive trading interventions.
 *
 * Core Features:
 * - Real-time MFI calculation from market data streams
 * - Tiered trading interventions (gentle hedging, generative alerts, aggressive reduction)
 * - Crisis detection and automated risk management
 * - Integration with trading platforms and risk systems
 */

import { EventEmitter } from 'events';
import { MarketFractureIndex } from './math/MarketFractureIndex.js';

export class MarketStabilityMonitor extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      // Market monitoring parameters
      asset: 'SPY', // Default asset to monitor
      monitoringMode: 'continuous', // 'continuous', 'intraday', 'crisis'
      updateInterval: 1000, // 1 second updates

      // Market data sources
      dataSources: {
        price: { enabled: true, priority: 1 },
        volume: { enabled: true, priority: 1 },
        orderbook: { enabled: true, priority: 2 },
        volatility: { enabled: true, priority: 2 },
        sentiment: { enabled: false, priority: 3 }
      },

      // Intervention thresholds
      interventionThresholds: {
        gentle: 0.3,    // Early warning - begin hedging
        moderate: 0.6,  // Prepare defensive measures
        aggressive: 0.8 // Emergency action
      },

      // Crisis detection
      crisisDetection: {
        mfiThreshold: 0.85,
        confirmationWindow: 5, // readings
        escalationTime: 60000  // 1 minute
      },

      // Trading parameters
      trading: {
        maxPositionSize: 100000, // USD
        hedgingRatio: 0.5, // 50% hedge ratio
        stopLossPercentage: 0.05, // 5% stop loss
        takeProfitPercentage: 0.10 // 10% take profit
      },

      ...config
    };

    // Core components
    this.mfiCalculator = new MarketFractureIndex(this.config.mfi || {});

    // Monitoring state
    this.state = {
      isMonitoring: false,
      asset: this.config.asset,
      startTime: null,
      lastUpdate: null,
      currentMFI: 0,
      mfiLevel: 'normal',
      crisisDetected: false,
      positions: new Map(), // Current positions
      hedges: new Map() // Active hedges
    };

    // Market data streams
    this.marketStreams = new Map();
    this.marketBuffers = new Map();

    // Intervention tracking
    this.activeInterventions = new Map();
    this.interventionHistory = [];

    // Crisis tracking
    this.crisisHistory = [];
    this.pendingCrisis = null;

    // Performance monitoring
    this.metrics = {
      totalReadings: 0,
      interventionsTriggered: 0,
      crisesDetected: 0,
      pnl: 0, // Profit/Loss
      maxDrawdown: 0,
      sharpeRatio: 0
    };

    this.setupEventHandlers();
  }

  /**
   * Initialize the market stability monitor
   */
  async initialize() {
    try {
      this.emit('initializing', { asset: this.config.asset });

      // Initialize MFI calculator
      // MFI calculator is stateless, no async init needed

      // Initialize market data streams
      this.initializeMarketStreams();

      this.emit('initialized', {
        asset: this.config.asset,
        dataSources: this.getEnabledDataSources(),
        monitoringMode: this.config.monitoringMode
      });

    } catch (error) {
      this.emit('error', { phase: 'initialization', error });
      throw error;
    }
  }

  /**
   * Initialize market data streams
   */
  initializeMarketStreams() {
    const streamConfigs = {
      price: { type: 'price', sampleRate: 1, channels: 1 },
      volume: { type: 'volume', sampleRate: 1, channels: 1 },
      orderbook: { type: 'orderbook', sampleRate: 0.1, channels: 20 }, // 10 levels bid/ask
      volatility: { type: 'volatility', sampleRate: 1/60, channels: 1 }, // Every minute
      sentiment: { type: 'sentiment', sampleRate: 1/300, channels: 1 } // Every 5 minutes
    };

    for (const [source, config] of Object.entries(streamConfigs)) {
      if (this.config.dataSources[source]?.enabled) {
        this.marketStreams.set(source, {
          ...config,
          active: false,
          lastData: null,
          buffer: []
        });

        this.marketBuffers.set(source, []);
      }
    }
  }

  /**
   * Start market monitoring
   */
  async startMonitoring() {
    if (this.state.isMonitoring) {
      this.emit('warning', 'Monitoring already active');
      return;
    }

    try {
      this.emit('starting', { asset: this.config.asset });

      // Start MFI calculation loop
      this.startMFIMonitoring();

      // Start market data ingestion
      this.startDataIngestion();

      this.state.isMonitoring = true;
      this.state.startTime = Date.now();
      this.state.lastUpdate = Date.now();

      this.emit('started', {
        asset: this.config.asset,
        startTime: this.state.startTime,
        enabledSources: this.getEnabledDataSources()
      });

    } catch (error) {
      this.emit('error', { phase: 'start', error });
      throw error;
    }
  }

  /**
   * Stop market monitoring
   */
  async stopMonitoring() {
    if (!this.state.isMonitoring) {
      this.emit('warning', 'Monitoring not active');
      return;
    }

    try {
      this.emit('stopping', { asset: this.config.asset });

      // Stop monitoring loops
      if (this.mfiInterval) {
        clearInterval(this.mfiInterval);
        this.mfiInterval = null;
      }

      if (this.dataIngestionInterval) {
        clearInterval(this.dataIngestionInterval);
        this.dataIngestionInterval = null;
      }

      this.state.isMonitoring = false;

      this.emit('stopped', {
        asset: this.config.asset,
        duration: Date.now() - this.state.startTime,
        finalMetrics: this.getMonitoringMetrics()
      });

    } catch (error) {
      this.emit('error', { phase: 'stop', error });
      throw error;
    }
  }

  /**
   * Start MFI monitoring loop
   */
  startMFIMonitoring() {
    this.mfiInterval = setInterval(async () => {
      if (!this.state.isMonitoring) return;

      try {
        // Calculate current MFI
        const mfiResult = await this.mfiCalculator.calculateMFI();

        if (mfiResult) {
          this.processMFIUpdate(mfiResult);
        }

        this.state.lastUpdate = Date.now();

      } catch (error) {
        this.emit('error', { phase: 'mfi_calculation', error });
      }
    }, this.config.updateInterval);
  }

  /**
   * Start market data ingestion
   */
  startDataIngestion() {
    // In a real implementation, this would connect to market data feeds
    // For now, we'll simulate data ingestion

    this.dataIngestionInterval = setInterval(() => {
      if (!this.state.isMonitoring) return;

      // Simulate market data ingestion
      this.ingestSimulatedMarketData();
    }, 1000); // 1Hz base rate
  }

  /**
   * Process MFI update and trigger interventions
   */
  async processMFIUpdate(mfiResult) {
    const { mfi, level, components, trend, confidence } = mfiResult;

    // Update state
    this.state.currentMFI = mfi;
    this.state.mfiLevel = level;

    // Check for crisis
    await this.checkForCrisis(mfiResult);

    // Trigger interventions based on level
    await this.triggerInterventions(mfiResult);

    // Emit MFI update
    this.emit('mfiUpdate', {
      asset: this.config.asset,
      timestamp: Date.now(),
      mfi: mfiResult,
      monitoringState: { ...this.state }
    });

    this.metrics.totalReadings++;
  }

  /**
   * Check for market crisis
   */
  async checkForCrisis(mfiResult) {
    const { mfi, trend } = mfiResult;

    if (mfi >= this.config.crisisDetection.mfiThreshold) {
      if (!this.pendingCrisis) {
        // Start crisis detection
        this.pendingCrisis = {
          startTime: Date.now(),
          initialMFI: mfi,
          confirmations: 1,
          escalating: trend === 'increasing'
        };

        this.emit('crisisSuspected', {
          asset: this.config.asset,
          mfi,
          timestamp: Date.now()
        });

      } else {
        // Confirm crisis
        this.pendingCrisis.confirmations++;

        if (this.pendingCrisis.confirmations >= this.config.crisisDetection.confirmationWindow) {
          await this.confirmCrisis();
        }
      }
    } else {
      // Reset pending crisis
      if (this.pendingCrisis) {
        this.emit('crisisCleared', {
          asset: this.config.asset,
          duration: Date.now() - this.pendingCrisis.startTime
        });
        this.pendingCrisis = null;
      }
    }
  }

  /**
   * Confirm and handle market crisis
   */
  async confirmCrisis() {
    if (!this.pendingCrisis) return;

    const crisis = {
      id: `crisis_${Date.now()}`,
      asset: this.config.asset,
      timestamp: Date.now(),
      duration: Date.now() - this.pendingCrisis.startTime,
      initialMFI: this.pendingCrisis.initialMFI,
      finalMFI: this.state.currentMFI,
      escalating: this.pendingCrisis.escalating,
      interventions: Array.from(this.activeInterventions.keys()),
      mfiComponents: this.mfiCalculator.getMFIStatus().components
    };

    this.crisisHistory.push(crisis);
    this.state.crisisDetected = true;
    this.metrics.crisesDetected++;

    // Trigger emergency interventions
    await this.triggerEmergencyInterventions(crisis);

    this.emit('crisisConfirmed', crisis);

    this.pendingCrisis = null;
  }

  /**
   * Trigger tiered interventions based on MFI level
   */
  async triggerInterventions(mfiResult) {
    const { mfi, level } = mfiResult;

    let interventionType = null;
    let priority = 0;

    if (mfi >= this.config.interventionThresholds.aggressive) {
      interventionType = 'aggressive';
      priority = 1;
    } else if (mfi >= this.config.interventionThresholds.moderate) {
      interventionType = 'moderate';
      priority = 2;
    } else if (mfi >= this.config.interventionThresholds.gentle) {
      interventionType = 'gentle';
      priority = 3;
    }

    if (interventionType) {
      await this.executeIntervention(interventionType, priority, mfiResult);
    }
  }

  /**
   * Execute trading intervention
   */
  async executeIntervention(type, priority, mfiResult) {
    const interventionId = `intervention_${Date.now()}`;

    const intervention = {
      id: interventionId,
      type,
      priority,
      timestamp: Date.now(),
      mfi: mfiResult.mfi,
      asset: this.config.asset,
      actions: this.getInterventionActions(type),
      status: 'active',
      duration: this.getInterventionDuration(type)
    };

    // Track active intervention
    this.activeInterventions.set(interventionId, intervention);
    this.interventionHistory.push(intervention);
    this.metrics.interventionsTriggered++;

    // Execute intervention actions
    await this.executeInterventionActions(intervention);

    // Schedule intervention completion
    setTimeout(() => {
      this.completeIntervention(interventionId);
    }, intervention.duration);

    this.emit('interventionTriggered', intervention);
  }

  /**
   * Get intervention actions for each type
   */
  getInterventionActions(type) {
    const actions = {
      gentle: [
        {
          type: 'portfolio_hedging',
          target: 'risk_management',
          action: 'reduce_leverage',
          parameters: { ratio: 0.1 } // Reduce by 10%
        },
        {
          type: 'options_positioning',
          target: 'derivatives_trading',
          action: 'buy_protective_put',
          parameters: { strike: 'atm', quantity: 0.5 } // 50% position
        },
        {
          type: 'position_sizing',
          target: 'order_management',
          action: 'limit_position_size',
          parameters: { maxSize: this.config.trading.maxPositionSize * 0.8 }
        }
      ],

      moderate: [
        {
          type: 'alert_generation',
          target: 'trading_desk',
          message: 'MFI indicates high probability of volatility spike in next 15 minutes. Execute defensive playbook.',
          priority: 'high'
        },
        {
          type: 'volatility_hedging',
          target: 'options_trading',
          action: 'implement_collar_strategy',
          parameters: { width: 0.05 } // 5% collar
        },
        {
          type: 'liquidity_management',
          target: 'order_routing',
          action: 'increase_spread_requirements',
          parameters: { multiplier: 1.5 }
        },
        {
          type: 'correlation_monitoring',
          target: 'market_analysis',
          action: 'track_sector_correlations',
          parameters: { threshold: 0.8 }
        }
      ],

      aggressive: [
        {
          type: 'emergency_alert',
          target: 'risk_committee',
          message: 'CRITICAL: Market fracture imminent. Immediate position reduction required.',
          priority: 'urgent'
        },
        {
          type: 'position_liquidation',
          target: 'portfolio_management',
          action: 'emergency_stop_loss',
          parameters: { percentage: this.config.trading.stopLossPercentage }
        },
        {
          type: 'circuit_breaker',
          target: 'trading_system',
          action: 'halt_automated_trading',
          parameters: { duration: 300000 } // 5 minutes
        },
        {
          type: 'counterparty_protection',
          target: 'clearing_house',
          action: 'increase_margin_requirements',
          parameters: { multiplier: 2.0 }
        }
      ]
    };

    return actions[type] || [];
  }

  /**
   * Get intervention duration
   */
  getInterventionDuration(type) {
    const durations = {
      gentle: 5 * 60 * 1000,    // 5 minutes
      moderate: 15 * 60 * 1000, // 15 minutes
      aggressive: 30 * 60 * 1000 // 30 minutes
    };

    return durations[type] || 300000; // 5 minutes default
  }

  /**
   * Execute intervention actions
   */
  async executeInterventionActions(intervention) {
    for (const action of intervention.actions) {
      try {
        await this.executeTradingAction(action);
      } catch (error) {
        this.emit('interventionError', {
          interventionId: intervention.id,
          action,
          error
        });
      }
    }
  }

  /**
   * Execute individual trading action
   */
  async executeTradingAction(action) {
    // In a real implementation, this would interface with:
    // - Trading platforms (Interactive Brokers, etc.)
    // - Risk management systems
    // - Order management systems
    // - Derivatives trading platforms

    switch (action.type) {
      case 'portfolio_hedging':
        this.emit('portfolioAdjustment', {
          action: action.action,
          parameters: action.parameters,
          asset: this.config.asset
        });
        break;

      case 'options_positioning':
        this.emit('optionsTrade', {
          action: action.action,
          parameters: action.parameters,
          asset: this.config.asset
        });
        break;

      case 'alert_generation':
        this.emit('tradingAlert', {
          target: action.target,
          message: action.message,
          priority: action.priority,
          asset: this.config.asset
        });
        break;

      case 'emergency_alert':
        this.emit('emergencyAlert', {
          target: action.target,
          message: action.message,
          priority: action.priority,
          asset: this.config.asset
        });
        break;

      default:
        this.emit('genericAction', {
          action,
          asset: this.config.asset
        });
    }
  }

  /**
   * Complete intervention
   */
  completeIntervention(interventionId) {
    const intervention = this.activeInterventions.get(interventionId);
    if (intervention) {
      intervention.status = 'completed';
      intervention.completedAt = Date.now();

      this.emit('interventionCompleted', intervention);
    }

    this.activeInterventions.delete(interventionId);
  }

  /**
   * Trigger emergency interventions for confirmed crisis
   */
  async triggerEmergencyInterventions(crisis) {
    // Immediate emergency actions
    const emergencyActions = [
      {
        type: 'emergency_alert',
        target: 'chief_risk_officer',
        message: `MARKET CRISIS CONFIRMED: ${crisis.asset} - MFI ${crisis.finalMFI.toFixed(3)}`,
        priority: 'critical'
      },
      {
        type: 'position_liquidation',
        target: 'portfolio_management',
        action: 'emergency_reduction',
        parameters: { percentage: 0.5 } // Reduce by 50%
      },
      {
        type: 'system_protection',
        target: 'trading_infrastructure',
        action: 'circuit_breaker_activation'
      }
    ];

    for (const action of emergencyActions) {
      await this.executeTradingAction(action);
    }
  }

  /**
   * Ingest market data from various sources
   */
  async ingestMarketData(source, data, timestamp = Date.now()) {
    if (!this.marketStreams.has(source)) return;

    // Add to market buffer
    const buffer = this.marketBuffers.get(source);
    buffer.push({ data, timestamp });

    // Maintain buffer size
    if (buffer.length > 1000) {
      buffer.shift();
    }

    // Forward to MFI calculator
    this.mfiCalculator.addMarketData(source, data, timestamp);

    // Update stream status
    const stream = this.marketStreams.get(source);
    stream.lastData = timestamp;
    stream.active = true;

    this.emit('dataReceived', {
      source,
      data,
      timestamp,
      asset: this.config.asset
    });
  }

  /**
   * Simulate market data ingestion (for development/testing)
   */
  ingestSimulatedMarketData() {
    const timestamp = Date.now();

    // Simulate price data (1Hz)
    if (this.marketStreams.has('price')) {
      // Generate realistic price movement with occasional volatility spikes
      const basePrice = 450; // Example SPY price
      const trend = Math.sin(timestamp * 0.000001) * 5; // Slow trend
      const noise = (Math.random() - 0.5) * 0.5; // Random noise
      const volatilitySpike = Math.random() > 0.95 ? (Math.random() - 0.5) * 10 : 0; // Occasional spikes

      const price = basePrice + trend + noise + volatilitySpike;
      this.ingestMarketData('price', price, timestamp);
    }

    // Simulate volume data (1Hz)
    if (this.marketStreams.has('volume')) {
      const baseVolume = 1000000; // 1M shares
      const volume = baseVolume + (Math.random() - 0.5) * 500000;
      this.ingestMarketData('volume', volume, timestamp);
    }

    // Simulate order book data (0.1Hz)
    if (this.marketStreams.has('orderbook') && Math.random() < 0.1) {
      const orderBook = {
        bids: Array.from({ length: 10 }, (_, i) => ({
          price: 449.50 - (i * 0.10),
          volume: Math.floor(Math.random() * 1000) + 100
        })),
        asks: Array.from({ length: 10 }, (_, i) => ({
          price: 450.50 + (i * 0.10),
          volume: Math.floor(Math.random() * 1000) + 100
        }))
      };
      this.ingestMarketData('orderbook', orderBook, timestamp);
    }

    // Simulate volatility data (every minute)
    if (this.marketStreams.has('volatility') && timestamp % 60000 < 1000) {
      const volatility = 0.15 + Math.random() * 0.1; // 15-25% annualized
      this.ingestMarketData('volatility', volatility, timestamp);
    }
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    // MFI calculator events
    this.mfiCalculator.on('mfiUpdated', (result) => {
      this.processMFIUpdate(result);
    });
  }

  /**
   * Get enabled data sources
   */
  getEnabledDataSources() {
    return Array.from(this.marketStreams.keys());
  }

  /**
   * Get monitoring metrics
   */
  getMonitoringMetrics() {
    return {
      ...this.metrics,
      uptime: this.state.startTime ? Date.now() - this.state.startTime : 0,
      currentMFI: this.state.currentMFI,
      mfiLevel: this.state.mfiLevel,
      crisisDetected: this.state.crisisDetected,
      activeInterventions: this.activeInterventions.size,
      crisisHistory: this.crisisHistory.length,
      positions: Object.fromEntries(this.state.positions),
      hedges: Object.fromEntries(this.state.hedges)
    };
  }

  /**
   * Get asset status summary
   */
  getAssetStatus() {
    return {
      asset: this.config.asset,
      monitoring: this.state.isMonitoring,
      currentMFI: this.state.currentMFI,
      mfiLevel: this.state.mfiLevel,
      crisisDetected: this.state.crisisDetected,
      activeInterventions: Array.from(this.activeInterventions.values()),
      recentCrises: this.crisisHistory.slice(-5),
      dataQuality: this.mfiCalculator.getDataQualitySummary(),
      lastUpdate: this.state.lastUpdate
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };

    // Update component configurations
    if (newConfig.mfi) {
      this.mfiCalculator.updateConfig(newConfig.mfi);
    }

    this.emit('configUpdated', newConfig);
  }

  /**
   * Reset monitoring state
   */
  reset() {
    this.state = {
      isMonitoring: false,
      asset: this.config.asset,
      startTime: null,
      lastUpdate: null,
      currentMFI: 0,
      mfiLevel: 'normal',
      crisisDetected: false,
      positions: new Map(),
      hedges: new Map()
    };

    this.activeInterventions.clear();
    this.interventionHistory.length = 0;
    this.crisisHistory.length = 0;
    this.pendingCrisis = null;

    this.mfiCalculator.reset();

    this.metrics = {
      totalReadings: 0,
      interventionsTriggered: 0,
      crisesDetected: 0,
      pnl: 0,
      maxDrawdown: 0,
      sharpeRatio: 0
    };

    this.emit('reset', { asset: this.config.asset });
  }
}

export default MarketStabilityMonitor;