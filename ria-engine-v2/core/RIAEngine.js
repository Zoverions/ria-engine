/**
 * RIA Engine v2.0 - Complete Production Architecture
 * 
 * A comprehensive, enterprise-grade Resonant Interface Architecture engine
 * designed for scalability, extensibility, and production deployment across
 * multiple platforms and use cases.
 * 
 * @author Zoverions Grand Unified Model ZGUM v16.2
 * @version 2.0.0
 * @date September 19, 2025
 */

import { EventEmitter } from 'events';
import { MathCore } from './math/MathCore.js';
import { AnalyticsEngine } from '../analytics/AnalyticsEngine.js';
import { BiometricManager } from '../biometrics/BiometricManager.js';
import { MLPersonalization } from '../ml/MLPersonalization.js';
import { PluginManager } from '../plugins/PluginManager.js';
import { ConfigManager } from './config/ConfigManager.js';
import { Logger } from './utils/Logger.js';

/**
 * Main RIA Engine class - orchestrates all subsystems
 * Provides unified API for cognitive load reduction across platforms
 */
export class RIAEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Initialize configuration
    this.config = new ConfigManager(config);
    
    // Initialize logging
    this.logger = new Logger(this.config.get('logging'));
    
    // Initialize core subsystems
    this.mathCore = new MathCore(this.config.get('math'));
    this.analytics = new AnalyticsEngine(this.config.get('analytics'));
    this.biometrics = new BiometricManager(this.config.get('biometrics'));
    this.ml = new MLPersonalization(this.config.get('ml'));
    this.plugins = new PluginManager(this.config.get('plugins'));
    
    // Engine state
    this.state = {
      isRunning: false,
      frameCount: 0,
      startTime: null,
      lastProcessTime: 0,
      performance: {
        avgFrameTime: 0,
        maxFrameTime: 0,
        totalFrames: 0
      }
    };
    
    // Data streams
    this.dataStreams = new Map();
    this.processingQueue = [];
    this.resultBuffer = [];
    
    // Initialize subsystems
    this.initialize();
    
    this.logger.info('RIA Engine v2.0 initialized', {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      config: this.config.summary()
    });
  }

  /**
   * Initialize all subsystems and establish connections
   */
  async initialize() {
    try {
      // Initialize math core with optimized algorithms
      await this.mathCore.initialize();
      
      // Initialize analytics with cloud connectivity
      await this.analytics.initialize();
      
      // Initialize biometric sensors
      await this.biometrics.initialize();
      
      // Initialize ML models
      await this.ml.initialize();
      
      // Initialize plugins
      await this.plugins.initialize();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Emit ready event
      this.emit('ready', {
        engine: 'RIA Engine v2.0',
        timestamp: Date.now(),
        subsystems: this.getSubsystemStatus()
      });
      
    } catch (error) {
      this.logger.error('Failed to initialize RIA Engine', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Set up inter-subsystem event listeners
   */
  setupEventListeners() {
    // Biometric data events
    this.biometrics.on('data', (data) => {
      this.handleBiometricData(data);
    });
    
    // ML model updates
    this.ml.on('modelUpdated', (model) => {
      this.handleModelUpdate(model);
    });
    
    // Analytics insights
    this.analytics.on('insight', (insight) => {
      this.handleAnalyticsInsight(insight);
    });
    
    // Plugin events
    this.plugins.on('dataReceived', (source, data) => {
      this.handlePluginData(source, data);
    });
    
    // Error handling
    [this.mathCore, this.analytics, this.biometrics, this.ml, this.plugins].forEach(subsystem => {
      subsystem.on('error', (error) => {
        this.logger.error(`Subsystem error: ${subsystem.constructor.name}`, error);
        this.emit('subsystemError', { subsystem: subsystem.constructor.name, error });
      });
    });
  }

  /**
   * Start the RIA Engine processing
   */
  async start() {
    if (this.state.isRunning) {
      this.logger.warn('Engine already running');
      return;
    }
    
    this.state.isRunning = true;
    this.state.startTime = Date.now();
    this.state.frameCount = 0;
    
    // Start all subsystems
    await Promise.all([
      this.mathCore.start(),
      this.analytics.start(),
      this.biometrics.start(),
      this.ml.start(),
      this.plugins.start()
    ]);
    
    // Start main processing loop
    this.startProcessingLoop();
    
    this.logger.info('RIA Engine started');
    this.emit('started', { timestamp: this.state.startTime });
  }

  /**
   * Stop the RIA Engine processing
   */
  async stop() {
    if (!this.state.isRunning) {
      this.logger.warn('Engine not running');
      return;
    }
    
    this.state.isRunning = false;
    
    // Stop all subsystems
    await Promise.all([
      this.mathCore.stop(),
      this.analytics.stop(),
      this.biometrics.stop(),
      this.ml.stop(),
      this.plugins.stop()
    ]);
    
    this.logger.info('RIA Engine stopped', {
      duration: Date.now() - this.state.startTime,
      totalFrames: this.state.frameCount,
      avgFrameTime: this.state.performance.avgFrameTime
    });
    
    this.emit('stopped', { 
      timestamp: Date.now(),
      sessionStats: this.getSessionStats()
    });
  }

  /**
   * Main processing loop - coordinates all subsystems
   */
  startProcessingLoop() {
    const frameInterval = 1000 / this.config.get('engine.frameRate', 60);
    
    const processFrame = async () => {
      if (!this.state.isRunning) return;
      
      const frameStartTime = performance.now();
      
      try {
        // Process queued data
        await this.processQueue();
        
        // Update performance metrics
        const frameTime = performance.now() - frameStartTime;
        this.updatePerformanceMetrics(frameTime);
        
        this.state.frameCount++;
        
        // Emit frame processed event
        this.emit('frameProcessed', {
          frameNumber: this.state.frameCount,
          frameTime,
          queueSize: this.processingQueue.length
        });
        
      } catch (error) {
        this.logger.error('Frame processing error', error);
        this.emit('frameError', { frameNumber: this.state.frameCount, error });
      }
      
      // Schedule next frame
      setTimeout(processFrame, frameInterval);
    };
    
    // Start processing
    processFrame();
  }

  /**
   * Process the data queue
   */
  async processQueue() {
    while (this.processingQueue.length > 0 && this.state.isRunning) {
      const dataPacket = this.processingQueue.shift();
      await this.processDataPacket(dataPacket);
    }
  }

  /**
   * Process a single data packet through the RIA pipeline
   */
  async processDataPacket(dataPacket) {
    const { source, timestamp, data } = dataPacket;
    
    try {
      // Stage 1: Math Core - Compute FI and related metrics
      const mathResult = await this.mathCore.process(data);
      
      // Stage 2: ML Personalization - Apply learned parameters
      const personalizedResult = await this.ml.personalize(mathResult, data.userId);
      
      // Stage 3: Generate UI interventions
      const interventions = this.generateInterventions(personalizedResult);
      
      // Stage 4: Analytics - Track and learn
      await this.analytics.record(source, data, personalizedResult, interventions);
      
      // Stage 5: Distribute results to plugins
      await this.plugins.distributeResults(source, {
        original: data,
        math: mathResult,
        personalized: personalizedResult,
        interventions,
        metadata: {
          timestamp,
          frameNumber: this.state.frameCount,
          processingTime: performance.now() - timestamp
        }
      });
      
      // Store in result buffer for real-time monitoring
      this.resultBuffer.push({
        timestamp,
        source,
        fi: personalizedResult.fi,
        interventions: interventions.length,
        gamma: personalizedResult.uiState.gamma
      });
      
      // Limit buffer size
      if (this.resultBuffer.length > 1000) {
        this.resultBuffer.shift();
      }
      
    } catch (error) {
      this.logger.error('Data packet processing error', { source, error });
      this.emit('processingError', { source, timestamp, error });
    }
  }

  /**
   * Generate UI interventions based on processing results
   */
  generateInterventions(result) {
    const interventions = [];
    const { fi, uiState, thresholds } = result;
    
    // Primary intervention based on FI thresholds
    if (fi >= thresholds.aggressive) {
      interventions.push({
        type: 'aggressive_damping',
        target: 'ui_opacity',
        value: uiState.gamma,
        priority: 1,
        duration: this.config.get('interventions.aggressiveDuration', 2000)
      });
    } else if (fi >= thresholds.gentle) {
      interventions.push({
        type: 'gentle_damping',
        target: 'ui_opacity',
        value: uiState.gamma,
        priority: 2,
        duration: this.config.get('interventions.gentleDuration', 1000)
      });
    }
    
    // Coherence anchor
    if (Math.abs(uiState.anchorPhase) > 0.3) {
      interventions.push({
        type: 'coherence_anchor',
        target: 'visual_anchor',
        value: {
          phase: uiState.anchorPhase,
          intensity: Math.abs(uiState.anchorPhase),
          frequency: result.omega
        },
        priority: 3,
        duration: 1000
      });
    }
    
    // Biometric-based interventions
    if (result.biometricState && result.biometricState.stress > 0.7) {
      interventions.push({
        type: 'stress_mitigation',
        target: 'breathing_guide',
        value: {
          pattern: 'box_breathing',
          duration: 30000
        },
        priority: 4
      });
    }
    
    return interventions;
  }

  /**
   * Add data to processing queue
   */
  addData(source, data) {
    const dataPacket = {
      source,
      timestamp: performance.now(),
      data: {
        ...data,
        engineTimestamp: Date.now()
      }
    };
    
    this.processingQueue.push(dataPacket);
    
    // Emit data received event
    this.emit('dataReceived', { source, queueSize: this.processingQueue.length });
  }

  /**
   * Register a new data stream
   */
  registerDataStream(streamId, config) {
    this.dataStreams.set(streamId, {
      ...config,
      registered: Date.now(),
      active: true,
      frameCount: 0
    });
    
    this.logger.info('Data stream registered', { streamId, config });
    this.emit('streamRegistered', { streamId, config });
  }

  /**
   * Unregister a data stream
   */
  unregisterDataStream(streamId) {
    const stream = this.dataStreams.get(streamId);
    if (stream) {
      stream.active = false;
      this.dataStreams.delete(streamId);
      
      this.logger.info('Data stream unregistered', { streamId });
      this.emit('streamUnregistered', { streamId });
    }
  }

  /**
   * Handle biometric data updates
   */
  handleBiometricData(data) {
    this.addData('biometrics', data);
  }

  /**
   * Handle ML model updates
   */
  handleModelUpdate(model) {
    this.logger.info('ML model updated', { modelType: model.type, version: model.version });
    this.emit('modelUpdated', model);
  }

  /**
   * Handle analytics insights
   */
  handleAnalyticsInsight(insight) {
    this.logger.info('Analytics insight', insight);
    this.emit('insight', insight);
  }

  /**
   * Handle plugin data
   */
  handlePluginData(source, data) {
    this.addData(source, data);
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(frameTime) {
    const perf = this.state.performance;
    
    perf.totalFrames++;
    perf.avgFrameTime = ((perf.avgFrameTime * (perf.totalFrames - 1)) + frameTime) / perf.totalFrames;
    perf.maxFrameTime = Math.max(perf.maxFrameTime, frameTime);
    
    // Emit performance warning if frame time is too high
    if (frameTime > this.config.get('performance.maxFrameTime', 16)) {
      this.emit('performanceWarning', {
        frameTime,
        frameNumber: this.state.frameCount,
        threshold: this.config.get('performance.maxFrameTime', 16)
      });
    }
  }

  /**
   * Get current engine status
   */
  getStatus() {
    return {
      engine: {
        version: '2.0.0',
        isRunning: this.state.isRunning,
        uptime: this.state.startTime ? Date.now() - this.state.startTime : 0,
        frameCount: this.state.frameCount,
        performance: this.state.performance
      },
      subsystems: this.getSubsystemStatus(),
      dataStreams: Array.from(this.dataStreams.entries()).map(([id, stream]) => ({
        id,
        ...stream
      })),
      queue: {
        size: this.processingQueue.length,
        processing: this.state.isRunning
      }
    };
  }

  /**
   * Get subsystem status
   */
  getSubsystemStatus() {
    return {
      mathCore: this.mathCore.getStatus(),
      analytics: this.analytics.getStatus(),
      biometrics: this.biometrics.getStatus(),
      ml: this.ml.getStatus(),
      plugins: this.plugins.getStatus()
    };
  }

  /**
   * Get session statistics
   */
  getSessionStats() {
    const duration = Date.now() - (this.state.startTime || 0);
    const analytics = this.analytics.getSessionStats();
    
    return {
      duration,
      frameCount: this.state.frameCount,
      frameRate: this.state.frameCount / (duration / 1000),
      performance: this.state.performance,
      analytics,
      dataStreams: this.dataStreams.size,
      queuedItems: this.processingQueue.length,
      resultBufferSize: this.resultBuffer.length
    };
  }

  /**
   * Export session data
   */
  async exportSessionData(format = 'json') {
    const sessionData = {
      metadata: {
        engine: 'RIA Engine v2.0',
        version: '2.0.0',
        exportTime: new Date().toISOString(),
        session: this.getSessionStats()
      },
      analytics: await this.analytics.exportData(),
      results: this.resultBuffer,
      configuration: this.config.export(),
      biometrics: await this.biometrics.exportData(),
      ml: await this.ml.exportData()
    };
    
    switch (format) {
      case 'json':
        return JSON.stringify(sessionData, null, 2);
      case 'csv':
        return this.analytics.exportCSV(sessionData);
      case 'binary':
        return this.analytics.exportBinary(sessionData);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config.update(newConfig);
    
    // Propagate configuration updates to subsystems
    this.mathCore.updateConfig(this.config.get('math'));
    this.analytics.updateConfig(this.config.get('analytics'));
    this.biometrics.updateConfig(this.config.get('biometrics'));
    this.ml.updateConfig(this.config.get('ml'));
    this.plugins.updateConfig(this.config.get('plugins'));
    
    this.logger.info('Configuration updated', { changes: newConfig });
    this.emit('configUpdated', newConfig);
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    this.logger.info('Shutting down RIA Engine...');
    
    try {
      await this.stop();
      
      // Close all subsystems
      await Promise.all([
        this.mathCore.shutdown(),
        this.analytics.shutdown(),
        this.biometrics.shutdown(),
        this.ml.shutdown(),
        this.plugins.shutdown()
      ]);
      
      // Final cleanup
      this.removeAllListeners();
      
      this.logger.info('RIA Engine shutdown complete');
      
    } catch (error) {
      this.logger.error('Error during shutdown', error);
      throw error;
    }
  }
}

export default RIAEngine;