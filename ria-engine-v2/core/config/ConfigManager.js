/**
 * Configuration Manager for RIA Engine v2.0
 * 
 * Advanced configuration system providing:
 * - Hierarchical configuration with inheritance
 * - Environment-specific settings
 * - Real-time configuration updates
 * - A/B testing configuration
 * - Schema validation
 * - Configuration versioning
 * - Hot reloading
 * 
 * @version 2.0.0
 * @author Zoverions Grand Unified Model ZGUM v16.2
 */

import { EventEmitter } from 'events';
import { ConfigSchema } from './schema/ConfigSchema.js';
import { EnvironmentManager } from './environments/EnvironmentManager.js';
import { ProfileManager } from './profiles/ProfileManager.js';
import { ABTestManager } from './testing/ABTestManager.js';
import { ConfigValidator } from './validation/ConfigValidator.js';
import { ConfigPersistence } from './persistence/ConfigPersistence.js';

export class ConfigManager extends EventEmitter {
  constructor(initialConfig = {}) {
    super();
    
    // Core configuration structure
    this.defaultConfig = {
      // Engine core settings
      engine: {
        version: '2.0.0',
        frameRate: 60,
        maxProcessingTime: 5,
        enableGPU: true,
        enableWorkers: true,
        workerCount: 4
      },
      
      // Mathematical processing
      math: {
        windowSize: 64,
        samplingRate: 50,
        floatPrecision: 'float64',
        numericalStability: true,
        enableWavelets: true,
        enableFractals: true,
        enableAdaptive: true,
        cacheSize: 1000
      },
      
      // User profiles and personalization
      profiles: {
        default: 'average',
        available: ['average', 'fast_typist', 'neurodiverse', 'accessibility'],
        customProfiles: {},
        adaptiveThresholds: true,
        learningRate: 0.1
      },
      
      // Intervention thresholds
      thresholds: {
        preventive: 0.5,
        gentle: 0.7,
        aggressive: 1.1,
        critical: 1.8,
        adaptive: true,
        adaptationRate: 0.05,
        userSpecific: true
      },
      
      // UI intervention settings
      interventions: {
        enablePreventive: true,
        enableGentle: true,
        enableAggressive: true,
        enableCritical: false,
        smoothTransitions: true,
        maxChangePerFrame: 0.1,
        recoveryRate: 0.001,
        visualEffects: {
          blur: true,
          saturation: true,
          spacing: true,
          coherenceAnchor: true
        }
      },
      
      // Biometric integration
      biometrics: {
        enabled: false,
        sources: ['hrv', 'eeg', 'gsr', 'eye_tracking'],
        samplingRate: 100,
        bufferSize: 1000,
        enableRealtime: true,
        enablePredictive: true,
        weightingFactor: 0.3
      },
      
      // Analytics and monitoring
      analytics: {
        enabled: true,
        enableRealtime: true,
        enableLongitudinal: true,
        retentionDays: 90,
        enableAnonymization: true,
        enableDifferentialPrivacy: true,
        batchSize: 100,
        flushInterval: 10000,
        enableCloudSync: false
      },
      
      // Plugin system
      plugins: {
        enabled: true,
        autoLoad: true,
        sandboxMode: true,
        maxPlugins: 50,
        maxMemoryPerPlugin: 100,
        timeoutMs: 5000,
        trustedPlugins: [],
        allowedPermissions: ['ui', 'data', 'storage']
      },
      
      // Machine Learning
      ml: {
        enabled: true,
        enablePersonalization: true,
        enablePredictive: true,
        enableAnomalyDetection: true,
        modelUpdateFrequency: 24 * 60 * 60 * 1000, // 24 hours
        batchSize: 1000,
        learningRate: 0.001,
        enableFederatedLearning: false
      },
      
      // Security and Privacy
      security: {
        enableEncryption: true,
        encryptionAlgorithm: 'AES-256-GCM',
        enableAuthentication: false,
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        enableAuditLog: true,
        dataRetentionPolicy: '90d'
      },
      
      // Performance monitoring
      performance: {
        enableMonitoring: true,
        maxFrameTime: 16, // 60fps
        maxMemoryUsage: 500, // MB
        enableProfiling: false,
        alertThresholds: {
          frameTime: 20,
          memoryUsage: 400,
          errorRate: 0.05
        }
      },
      
      // Development and debugging
      development: {
        enableDebugMode: false,
        enableVerboseLogging: false,
        enablePerformanceTrace: false,
        enableTestMode: false,
        mockBiometrics: false,
        mockAnalytics: false
      }
    };
    
    // Initialize components
    this.schema = new ConfigSchema();
    this.environments = new EnvironmentManager();
    this.profiles = new ProfileManager();
    this.abTests = new ABTestManager();
    this.validator = new ConfigValidator(this.schema);
    this.persistence = new ConfigPersistence();
    
    // Configuration state
    this.currentConfig = {};
    this.configHistory = [];
    this.activeEnvironment = 'production';
    this.activeProfile = 'average';
    this.activeABTests = new Map();
    
    // Configuration metadata
    this.metadata = {
      version: '1.0.0',
      lastUpdated: Date.now(),
      source: 'default',
      schema: '2.0.0'
    };
    
    // Initialize with provided config
    this.initialize(initialConfig);
  }

  /**
   * Initialize configuration manager
   */
  async initialize(initialConfig = {}) {
    try {
      // Load environment-specific configuration
      const envConfig = await this.environments.loadEnvironment(this.activeEnvironment);
      
      // Load user profile configuration
      const profileConfig = await this.profiles.loadProfile(this.activeProfile);
      
      // Load A/B test configurations
      const abTestConfigs = await this.abTests.getActiveTests();
      
      // Merge configurations in priority order
      this.currentConfig = this.mergeConfigurations([
        this.defaultConfig,
        envConfig,
        profileConfig,
        ...abTestConfigs,
        initialConfig
      ]);
      
      // Validate merged configuration
      const validation = this.validator.validate(this.currentConfig);
      if (!validation.valid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Apply configuration
      await this.applyConfiguration(this.currentConfig);
      
      // Save to history
      this.saveToHistory();
      
      this.emit('initialized', {
        timestamp: Date.now(),
        environment: this.activeEnvironment,
        profile: this.activeProfile,
        abTests: Array.from(this.activeABTests.keys())
      });
      
    } catch (error) {
      this.emit('error', { phase: 'initialization', error });
      throw error;
    }
  }

  /**
   * Get configuration value with path notation
   */
  get(path, defaultValue = undefined) {
    return this.getNestedValue(this.currentConfig, path, defaultValue);
  }

  /**
   * Set configuration value with path notation
   */
  async set(path, value, options = {}) {
    try {
      // Validate the change
      const testConfig = { ...this.currentConfig };
      this.setNestedValue(testConfig, path, value);
      
      const validation = this.validator.validate(testConfig);
      if (!validation.valid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Apply the change
      this.setNestedValue(this.currentConfig, path, value);
      
      // Update metadata
      this.metadata.lastUpdated = Date.now();
      this.metadata.version = this.incrementVersion(this.metadata.version);
      
      // Persist if requested
      if (options.persist !== false) {
        await this.persistence.save(this.currentConfig, this.metadata);
      }
      
      // Save to history
      this.saveToHistory();
      
      // Emit change event
      this.emit('configChanged', {
        path,
        value,
        timestamp: Date.now(),
        version: this.metadata.version
      });
      
      // Apply configuration changes
      if (options.immediate !== false) {
        await this.applyConfiguration(this.currentConfig);
      }
      
    } catch (error) {
      this.emit('error', { phase: 'set', path, error });
      throw error;
    }
  }

  /**
   * Update multiple configuration values
   */
  async update(configUpdate, options = {}) {
    try {
      // Create test configuration
      const testConfig = this.mergeConfigurations([this.currentConfig, configUpdate]);
      
      // Validate merged configuration
      const validation = this.validator.validate(testConfig);
      if (!validation.valid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Apply updates
      this.currentConfig = testConfig;
      
      // Update metadata
      this.metadata.lastUpdated = Date.now();
      this.metadata.version = this.incrementVersion(this.metadata.version);
      
      // Persist if requested
      if (options.persist !== false) {
        await this.persistence.save(this.currentConfig, this.metadata);
      }
      
      // Save to history
      this.saveToHistory();
      
      // Emit change event
      this.emit('configUpdated', {
        changes: configUpdate,
        timestamp: Date.now(),
        version: this.metadata.version
      });
      
      // Apply configuration changes
      if (options.immediate !== false) {
        await this.applyConfiguration(this.currentConfig);
      }
      
    } catch (error) {
      this.emit('error', { phase: 'update', error });
      throw error;
    }
  }

  /**
   * Switch to different environment
   */
  async switchEnvironment(environmentName) {
    try {
      const envConfig = await this.environments.loadEnvironment(environmentName);
      
      // Merge with current configuration
      const newConfig = this.mergeConfigurations([
        this.defaultConfig,
        envConfig,
        await this.profiles.loadProfile(this.activeProfile)
      ]);
      
      // Validate
      const validation = this.validator.validate(newConfig);
      if (!validation.valid) {
        throw new Error(`Environment configuration validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Apply new configuration
      this.currentConfig = newConfig;
      this.activeEnvironment = environmentName;
      
      // Update metadata
      this.metadata.lastUpdated = Date.now();
      this.metadata.source = `environment:${environmentName}`;
      
      await this.applyConfiguration(this.currentConfig);
      
      this.emit('environmentChanged', {
        environment: environmentName,
        timestamp: Date.now()
      });
      
    } catch (error) {
      this.emit('error', { phase: 'environmentSwitch', environment: environmentName, error });
      throw error;
    }
  }

  /**
   * Switch to different user profile
   */
  async switchProfile(profileName) {
    try {
      const profileConfig = await this.profiles.loadProfile(profileName);
      
      // Merge with current configuration
      const newConfig = this.mergeConfigurations([
        this.defaultConfig,
        await this.environments.loadEnvironment(this.activeEnvironment),
        profileConfig
      ]);
      
      // Validate
      const validation = this.validator.validate(newConfig);
      if (!validation.valid) {
        throw new Error(`Profile configuration validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Apply new configuration
      this.currentConfig = newConfig;
      this.activeProfile = profileName;
      
      // Update metadata
      this.metadata.lastUpdated = Date.now();
      this.metadata.source = `profile:${profileName}`;
      
      await this.applyConfiguration(this.currentConfig);
      
      this.emit('profileChanged', {
        profile: profileName,
        timestamp: Date.now()
      });
      
    } catch (error) {
      this.emit('error', { phase: 'profileSwitch', profile: profileName, error });
      throw error;
    }
  }

  /**
   * Start A/B test
   */
  async startABTest(testId, testConfig) {
    try {
      // Validate test configuration
      const validation = this.validator.validateABTest(testConfig);
      if (!validation.valid) {
        throw new Error(`A/B test validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Determine user's variant
      const variant = this.abTests.assignVariant(testId, testConfig);
      
      // Apply variant configuration
      if (variant && testConfig.variants[variant]) {
        const variantConfig = testConfig.variants[variant];
        await this.update(variantConfig, { persist: false });
        
        this.activeABTests.set(testId, {
          variant,
          config: testConfig,
          startTime: Date.now()
        });
        
        this.emit('abTestStarted', {
          testId,
          variant,
          timestamp: Date.now()
        });
      }
      
    } catch (error) {
      this.emit('error', { phase: 'abTestStart', testId, error });
      throw error;
    }
  }

  /**
   * Stop A/B test
   */
  async stopABTest(testId) {
    try {
      const test = this.activeABTests.get(testId);
      if (!test) {
        throw new Error(`A/B test not found: ${testId}`);
      }
      
      // Revert to baseline configuration
      await this.reloadConfiguration();
      
      // Remove from active tests
      this.activeABTests.delete(testId);
      
      this.emit('abTestStopped', {
        testId,
        duration: Date.now() - test.startTime,
        timestamp: Date.now()
      });
      
    } catch (error) {
      this.emit('error', { phase: 'abTestStop', testId, error });
      throw error;
    }
  }

  /**
   * Create custom user profile
   */
  async createProfile(profileName, profileConfig) {
    try {
      // Validate profile configuration
      const validation = this.validator.validateProfile(profileConfig);
      if (!validation.valid) {
        throw new Error(`Profile validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Save profile
      await this.profiles.saveProfile(profileName, profileConfig);
      
      // Update available profiles
      this.currentConfig.profiles.available.push(profileName);
      
      this.emit('profileCreated', {
        profileName,
        timestamp: Date.now()
      });
      
    } catch (error) {
      this.emit('error', { phase: 'profileCreation', profileName, error });
      throw error;
    }
  }

  /**
   * Export configuration
   */
  export(format = 'json') {
    const exportData = {
      config: this.currentConfig,
      metadata: this.metadata,
      environment: this.activeEnvironment,
      profile: this.activeProfile,
      abTests: Array.from(this.activeABTests.entries())
    };
    
    switch (format) {
      case 'json':
        return JSON.stringify(exportData, null, 2);
      case 'yaml':
        return this.convertToYAML(exportData);
      case 'toml':
        return this.convertToTOML(exportData);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Import configuration
   */
  async import(configData, format = 'json') {
    try {
      let importData;
      
      switch (format) {
        case 'json':
          importData = JSON.parse(configData);
          break;
        case 'yaml':
          importData = this.parseYAML(configData);
          break;
        case 'toml':
          importData = this.parseTOML(configData);
          break;
        default:
          throw new Error(`Unsupported import format: ${format}`);
      }
      
      // Validate imported configuration
      const validation = this.validator.validate(importData.config);
      if (!validation.valid) {
        throw new Error(`Imported configuration validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Apply imported configuration
      await this.update(importData.config);
      
      // Update metadata
      this.metadata = { ...this.metadata, ...importData.metadata };
      
      this.emit('configImported', {
        format,
        timestamp: Date.now()
      });
      
    } catch (error) {
      this.emit('error', { phase: 'import', format, error });
      throw error;
    }
  }

  /**
   * Rollback to previous configuration
   */
  async rollback(steps = 1) {
    try {
      if (this.configHistory.length < steps) {
        throw new Error('Not enough configuration history for rollback');
      }
      
      const targetConfig = this.configHistory[this.configHistory.length - steps - 1];
      
      // Apply target configuration
      this.currentConfig = { ...targetConfig.config };
      this.metadata = { ...targetConfig.metadata };
      
      await this.applyConfiguration(this.currentConfig);
      
      this.emit('configRolledBack', {
        steps,
        targetVersion: targetConfig.metadata.version,
        timestamp: Date.now()
      });
      
    } catch (error) {
      this.emit('error', { phase: 'rollback', steps, error });
      throw error;
    }
  }

  /**
   * Get configuration summary
   */
  summary() {
    return {
      version: this.metadata.version,
      environment: this.activeEnvironment,
      profile: this.activeProfile,
      abTests: Array.from(this.activeABTests.keys()),
      lastUpdated: this.metadata.lastUpdated,
      features: {
        analytics: this.get('analytics.enabled'),
        biometrics: this.get('biometrics.enabled'),
        plugins: this.get('plugins.enabled'),
        ml: this.get('ml.enabled')
      },
      performance: {
        frameRate: this.get('engine.frameRate'),
        maxProcessingTime: this.get('engine.maxProcessingTime'),
        enableGPU: this.get('engine.enableGPU')
      }
    };
  }

  /**
   * Validate current configuration
   */
  validate() {
    return this.validator.validate(this.currentConfig);
  }

  /**
   * Watch for configuration file changes
   */
  watch(configPath) {
    return this.persistence.watch(configPath, async (newConfig) => {
      try {
        await this.update(newConfig);
        this.emit('configFileChanged', {
          path: configPath,
          timestamp: Date.now()
        });
      } catch (error) {
        this.emit('error', { phase: 'fileWatch', path: configPath, error });
      }
    });
  }

  // Helper methods
  mergeConfigurations(configs) {
    return configs.reduce((merged, config) => {
      return this.deepMerge(merged, config);
    }, {});
  }

  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  getNestedValue(obj, path, defaultValue) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : defaultValue;
    }, obj);
  }

  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  incrementVersion(version) {
    const parts = version.split('.').map(Number);
    parts[2]++; // Increment patch version
    return parts.join('.');
  }

  saveToHistory() {
    this.configHistory.push({
      config: { ...this.currentConfig },
      metadata: { ...this.metadata },
      timestamp: Date.now()
    });
    
    // Limit history size
    if (this.configHistory.length > 100) {
      this.configHistory.shift();
    }
  }

  async applyConfiguration(config) {
    // This would notify all subsystems of configuration changes
    this.emit('configApplied', {
      config,
      timestamp: Date.now()
    });
  }

  async reloadConfiguration() {
    return this.initialize();
  }

  // Format conversion helpers (simplified implementations)
  convertToYAML(data) { return 'yaml_data'; } // Would use actual YAML library
  convertToTOML(data) { return 'toml_data'; } // Would use actual TOML library
  parseYAML(yaml) { return {}; } // Would use actual YAML library
  parseTOML(toml) { return {}; } // Would use actual TOML library
}

export default ConfigManager;