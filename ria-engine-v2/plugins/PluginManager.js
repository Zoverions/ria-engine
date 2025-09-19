/**
 * Plugin Manager for RIA Engine v2.0
 * 
 * Comprehensive plugin architecture supporting multiple platforms:
 * - Web browsers (Chrome, Firefox, Safari extensions)
 * - Desktop applications (Electron, native apps)
 * - Mobile platforms (React Native, native iOS/Android)
 * - Design tools (Figma, Sketch, Adobe XD)
 * - Development environments (VS Code, IntelliJ, etc.)
 * 
 * @version 2.0.0
 * @author Zoverions Grand Unified Model ZGUM v16.2
 */

import { EventEmitter } from 'events';
import { PluginLoader } from './loaders/PluginLoader.js';
import { PluginSandbox } from './security/PluginSandbox.js';
import { PluginAPI } from './api/PluginAPI.js';
import { PluginRegistry } from './registry/PluginRegistry.js';
import { PluginValidator } from './validation/PluginValidator.js';

export class PluginManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Plugin discovery
      pluginPaths: ['./plugins', './custom-plugins'],
      autoLoad: true,
      
      // Security
      sandboxMode: true,
      allowedPermissions: ['ui', 'data', 'storage'],
      trustedPlugins: [],
      
      // Performance
      maxPlugins: 50,
      maxMemoryPerPlugin: 100, // MB
      timeoutMs: 5000,
      
      // API versioning
      apiVersion: '2.0.0',
      backwardCompatibility: ['1.x'],
      
      ...config
    };
    
    // Core components
    this.loader = new PluginLoader(this.config);
    this.sandbox = new PluginSandbox(this.config);
    this.api = new PluginAPI(this.config);
    this.registry = new PluginRegistry(this.config);
    this.validator = new PluginValidator(this.config);
    
    // Plugin state
    this.plugins = new Map();
    this.activePlugins = new Set();
    this.pluginInstances = new Map();
    
    // Event routing
    this.eventRoutes = new Map();
    this.dataStreams = new Map();
    
    // Performance monitoring
    this.metrics = {
      totalPlugins: 0,
      activePlugins: 0,
      memoryUsage: 0,
      totalEvents: 0,
      avgResponseTime: 0
    };
    
    this.setupEventHandlers();
  }

  /**
   * Initialize the plugin manager
   */
  async initialize() {
    try {
      // Initialize core components
      await Promise.all([
        this.loader.initialize(),
        this.sandbox.initialize(),
        this.api.initialize(),
        this.registry.initialize(),
        this.validator.initialize()
      ]);
      
      // Load built-in plugins
      await this.loadBuiltinPlugins();
      
      // Auto-discover plugins if enabled
      if (this.config.autoLoad) {
        await this.discoverPlugins();
      }
      
      this.emit('initialized', {
        pluginsDiscovered: this.plugins.size,
        apiVersion: this.config.apiVersion
      });
      
    } catch (error) {
      this.emit('error', { phase: 'initialization', error });
      throw error;
    }
  }

  /**
   * Load built-in platform plugins
   */
  async loadBuiltinPlugins() {
    const builtinPlugins = [
      { id: 'web-browser', path: './plugins/builtin/WebBrowserPlugin.js' },
      { id: 'figma', path: './plugins/builtin/FigmaPlugin.js' },
      { id: 'vscode', path: './plugins/builtin/VSCodePlugin.js' },
      { id: 'electron', path: './plugins/builtin/ElectronPlugin.js' },
      { id: 'mobile', path: './plugins/builtin/MobilePlugin.js' },
      { id: 'analytics', path: './plugins/builtin/AnalyticsPlugin.js' }
    ];
    
    for (const plugin of builtinPlugins) {
      try {
        await this.loadPlugin(plugin.path, { builtin: true, id: plugin.id });
      } catch (error) {
        console.warn(`Failed to load builtin plugin ${plugin.id}:`, error);
      }
    }
  }

  /**
   * Discover and register available plugins
   */
  async discoverPlugins() {
    const discovered = await this.loader.discoverPlugins(this.config.pluginPaths);
    
    for (const pluginPath of discovered) {
      try {
        await this.loadPlugin(pluginPath);
      } catch (error) {
        console.warn(`Failed to load plugin from ${pluginPath}:`, error);
      }
    }
  }

  /**
   * Load a specific plugin
   */
  async loadPlugin(pluginPath, options = {}) {
    try {
      // Load plugin code
      const pluginCode = await this.loader.loadPluginCode(pluginPath);
      
      // Validate plugin
      const validation = await this.validator.validate(pluginCode);
      if (!validation.valid) {
        throw new Error(`Plugin validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Create plugin instance in sandbox
      const instance = await this.sandbox.createInstance(pluginCode, {
        api: this.api,
        config: options,
        pluginPath
      });
      
      // Register plugin
      const pluginInfo = await this.registry.register(instance, validation.metadata);
      
      // Store plugin
      this.plugins.set(pluginInfo.id, {
        info: pluginInfo,
        instance,
        loaded: Date.now(),
        active: false,
        metrics: {
          events: 0,
          errors: 0,
          memoryUsage: 0,
          responseTime: []
        }
      });
      
      this.emit('pluginLoaded', { pluginId: pluginInfo.id, info: pluginInfo });
      
      return pluginInfo.id;
      
    } catch (error) {
      this.emit('pluginError', { pluginPath, error });
      throw error;
    }
  }

  /**
   * Activate a plugin
   */
  async activatePlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }
    
    if (plugin.active) {
      return; // Already active
    }
    
    try {
      // Check resource limits
      if (this.activePlugins.size >= this.config.maxPlugins) {
        throw new Error('Maximum number of active plugins reached');
      }
      
      // Initialize plugin
      await plugin.instance.initialize();
      
      // Set up event routing
      this.setupPluginEventRouting(pluginId, plugin);
      
      // Mark as active
      plugin.active = true;
      this.activePlugins.add(pluginId);
      this.pluginInstances.set(pluginId, plugin.instance);
      
      // Update metrics
      this.updateMetrics();
      
      this.emit('pluginActivated', { pluginId, plugin: plugin.info });
      
    } catch (error) {
      this.emit('pluginError', { pluginId, phase: 'activation', error });
      throw error;
    }
  }

  /**
   * Deactivate a plugin
   */
  async deactivatePlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || !plugin.active) {
      return;
    }
    
    try {
      // Clean up event routing
      this.cleanupPluginEventRouting(pluginId);
      
      // Shutdown plugin
      await plugin.instance.shutdown();
      
      // Mark as inactive
      plugin.active = false;
      this.activePlugins.delete(pluginId);
      this.pluginInstances.delete(pluginId);
      
      // Update metrics
      this.updateMetrics();
      
      this.emit('pluginDeactivated', { pluginId });
      
    } catch (error) {
      this.emit('pluginError', { pluginId, phase: 'deactivation', error });
      throw error;
    }
  }

  /**
   * Set up event routing for a plugin
   */
  setupPluginEventRouting(pluginId, plugin) {
    const { instance, info } = plugin;
    
    // Register event handlers based on plugin capabilities
    if (info.capabilities.includes('data-input')) {
      this.eventRoutes.set(`data-${pluginId}`, (data) => {
        this.routeDataToPlugin(pluginId, data);
      });
    }
    
    if (info.capabilities.includes('ui-output')) {
      this.eventRoutes.set(`ui-${pluginId}`, (uiState) => {
        this.routeUIToPlugin(pluginId, uiState);
      });
    }
    
    if (info.capabilities.includes('analytics')) {
      this.eventRoutes.set(`analytics-${pluginId}`, (analytics) => {
        this.routeAnalyticsToPlugin(pluginId, analytics);
      });
    }
    
    // Set up plugin-to-engine communication
    instance.on('dataReceived', (data) => {
      this.emit('dataReceived', pluginId, data);
    });
    
    instance.on('error', (error) => {
      this.handlePluginError(pluginId, error);
    });
  }

  /**
   * Route data to a specific plugin
   */
  async routeDataToPlugin(pluginId, data) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || !plugin.active) return;
    
    const startTime = performance.now();
    
    try {
      await plugin.instance.processData(data);
      
      // Update metrics
      const responseTime = performance.now() - startTime;
      plugin.metrics.events++;
      plugin.metrics.responseTime.push(responseTime);
      
      // Limit response time history
      if (plugin.metrics.responseTime.length > 100) {
        plugin.metrics.responseTime.shift();
      }
      
    } catch (error) {
      plugin.metrics.errors++;
      this.handlePluginError(pluginId, error);
    }
  }

  /**
   * Route UI updates to a specific plugin
   */
  async routeUIToPlugin(pluginId, uiState) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || !plugin.active) return;
    
    try {
      if (typeof plugin.instance.updateUI === 'function') {
        await plugin.instance.updateUI(uiState);
      }
    } catch (error) {
      this.handlePluginError(pluginId, error);
    }
  }

  /**
   * Route analytics to a specific plugin
   */
  async routeAnalyticsToPlugin(pluginId, analytics) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || !plugin.active) return;
    
    try {
      if (typeof plugin.instance.processAnalytics === 'function') {
        await plugin.instance.processAnalytics(analytics);
      }
    } catch (error) {
      this.handlePluginError(pluginId, error);
    }
  }

  /**
   * Distribute results to all active plugins
   */
  async distributeResults(source, results) {
    const distribution = Array.from(this.activePlugins.values()).map(async (pluginId) => {
      const plugin = this.plugins.get(pluginId);
      if (!plugin) return;
      
      try {
        // Check if plugin accepts this type of data
        if (this.shouldReceiveResults(plugin, source, results)) {
          await this.routeDataToPlugin(pluginId, {
            source,
            results,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        this.handlePluginError(pluginId, error);
      }
    });
    
    await Promise.allSettled(distribution);
    this.metrics.totalEvents += distribution.length;
  }

  /**
   * Check if plugin should receive specific results
   */
  shouldReceiveResults(plugin, source, results) {
    const { info } = plugin;
    
    // Check plugin filters
    if (info.filters) {
      if (info.filters.sources && !info.filters.sources.includes(source)) {
        return false;
      }
      
      if (info.filters.resultTypes) {
        const hasMatchingType = info.filters.resultTypes.some(type => 
          results.hasOwnProperty(type)
        );
        if (!hasMatchingType) return false;
      }
    }
    
    return true;
  }

  /**
   * Handle plugin errors
   */
  handlePluginError(pluginId, error) {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.metrics.errors++;
    }
    
    this.emit('pluginError', { pluginId, error });
    
    // Deactivate plugin if too many errors
    if (plugin && plugin.metrics.errors > 10) {
      console.warn(`Deactivating plugin ${pluginId} due to excessive errors`);
      this.deactivatePlugin(pluginId);
    }
  }

  /**
   * Install a new plugin from package
   */
  async installPlugin(packagePath, options = {}) {
    try {
      // Extract and validate package
      const extractedPath = await this.loader.extractPackage(packagePath);
      const pluginId = await this.loadPlugin(extractedPath, options);
      
      // Auto-activate if requested
      if (options.autoActivate) {
        await this.activatePlugin(pluginId);
      }
      
      this.emit('pluginInstalled', { pluginId, packagePath });
      
      return pluginId;
      
    } catch (error) {
      this.emit('installError', { packagePath, error });
      throw error;
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginId) {
    try {
      // Deactivate if active
      if (this.activePlugins.has(pluginId)) {
        await this.deactivatePlugin(pluginId);
      }
      
      // Unregister from registry
      await this.registry.unregister(pluginId);
      
      // Remove from plugins map
      this.plugins.delete(pluginId);
      
      this.emit('pluginUninstalled', { pluginId });
      
    } catch (error) {
      this.emit('uninstallError', { pluginId, error });
      throw error;
    }
  }

  /**
   * Get plugin information
   */
  getPluginInfo(pluginId) {
    const plugin = this.plugins.get(pluginId);
    return plugin ? {
      ...plugin.info,
      active: plugin.active,
      metrics: plugin.metrics,
      loaded: plugin.loaded
    } : null;
  }

  /**
   * List all plugins
   */
  listPlugins(filter = {}) {
    const plugins = Array.from(this.plugins.entries()).map(([id, plugin]) => ({
      id,
      ...plugin.info,
      active: plugin.active,
      metrics: plugin.metrics
    }));
    
    // Apply filters
    if (filter.active !== undefined) {
      return plugins.filter(p => p.active === filter.active);
    }
    
    if (filter.platform) {
      return plugins.filter(p => p.platforms.includes(filter.platform));
    }
    
    if (filter.capability) {
      return plugins.filter(p => p.capabilities.includes(filter.capability));
    }
    
    return plugins;
  }

  /**
   * Update plugin configuration
   */
  async updatePluginConfig(pluginId, newConfig) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }
    
    try {
      if (typeof plugin.instance.updateConfig === 'function') {
        await plugin.instance.updateConfig(newConfig);
      }
      
      this.emit('pluginConfigUpdated', { pluginId, config: newConfig });
      
    } catch (error) {
      this.handlePluginError(pluginId, error);
      throw error;
    }
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    // Monitor memory usage
    setInterval(() => {
      this.monitorMemoryUsage();
    }, 30000); // Every 30 seconds
  }

  /**
   * Monitor memory usage of plugins
   */
  monitorMemoryUsage() {
    for (const [pluginId, plugin] of this.plugins) {
      if (plugin.active && typeof plugin.instance.getMemoryUsage === 'function') {
        try {
          const usage = plugin.instance.getMemoryUsage();
          plugin.metrics.memoryUsage = usage;
          
          // Check memory limits
          if (usage > this.config.maxMemoryPerPlugin * 1024 * 1024) {
            console.warn(`Plugin ${pluginId} exceeding memory limit: ${usage / 1024 / 1024}MB`);
            this.emit('memoryWarning', { pluginId, usage });
          }
        } catch (error) {
          // Ignore memory monitoring errors
        }
      }
    }
  }

  /**
   * Update metrics
   */
  updateMetrics() {
    this.metrics.totalPlugins = this.plugins.size;
    this.metrics.activePlugins = this.activePlugins.size;
    this.metrics.memoryUsage = Array.from(this.plugins.values())
      .reduce((total, plugin) => total + (plugin.metrics.memoryUsage || 0), 0);
    
    // Calculate average response time
    const allResponseTimes = Array.from(this.plugins.values())
      .flatMap(plugin => plugin.metrics.responseTime);
    
    if (allResponseTimes.length > 0) {
      this.metrics.avgResponseTime = 
        allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length;
    }
  }

  /**
   * Cleanup plugin event routing
   */
  cleanupPluginEventRouting(pluginId) {
    // Remove event routes
    for (const [route, handler] of this.eventRoutes) {
      if (route.includes(pluginId)) {
        this.eventRoutes.delete(route);
      }
    }
    
    // Remove data streams
    for (const [streamId, stream] of this.dataStreams) {
      if (stream.pluginId === pluginId) {
        this.dataStreams.delete(streamId);
      }
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      initialized: true,
      metrics: this.metrics,
      plugins: {
        total: this.plugins.size,
        active: this.activePlugins.size,
        list: this.listPlugins()
      },
      api: {
        version: this.config.apiVersion,
        endpoints: this.api.getEndpoints()
      }
    };
  }

  /**
   * Start plugin manager
   */
  async start() {
    // Start all active plugins
    const startPromises = Array.from(this.activePlugins).map(async (pluginId) => {
      const plugin = this.plugins.get(pluginId);
      if (plugin && typeof plugin.instance.start === 'function') {
        try {
          await plugin.instance.start();
        } catch (error) {
          this.handlePluginError(pluginId, error);
        }
      }
    });
    
    await Promise.allSettled(startPromises);
  }

  /**
   * Stop plugin manager
   */
  async stop() {
    // Stop all active plugins
    const stopPromises = Array.from(this.activePlugins).map(async (pluginId) => {
      await this.deactivatePlugin(pluginId);
    });
    
    await Promise.allSettled(stopPromises);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
    
    // Update component configs
    this.loader.updateConfig(this.config);
    this.sandbox.updateConfig(this.config);
    this.api.updateConfig(this.config);
    this.registry.updateConfig(this.config);
    this.validator.updateConfig(this.config);
  }

  /**
   * Shutdown plugin manager
   */
  async shutdown() {
    await this.stop();
    
    // Shutdown all components
    await Promise.all([
      this.loader.shutdown(),
      this.sandbox.shutdown(),
      this.api.shutdown(),
      this.registry.shutdown(),
      this.validator.shutdown()
    ]);
    
    // Clear all data
    this.plugins.clear();
    this.activePlugins.clear();
    this.pluginInstances.clear();
    this.eventRoutes.clear();
    this.dataStreams.clear();
  }
}

export default PluginManager;