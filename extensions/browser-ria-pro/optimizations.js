// Platform-Specific Optimizations for Browser Extension
// This file contains browser-specific performance and feature optimizations

class BrowserOptimizations {
  constructor() {
    this.optimizationLevel = 'balanced';
    this.tabManager = new TabManager();
    this.performanceMonitor = new PerformanceMonitor();
    this.resourceManager = new ResourceManager();
    this.browserCapabilities = null;
  }
  
  /**
   * Initialize browser-specific optimizations
   */
  async initialize() {
    await this.detectBrowserCapabilities();
    await this.setupTabOptimizations();
    await this.setupPerformanceOptimizations();
    await this.setupResourceOptimizations();
    await this.setupBrowserSpecificFeatures();
    
    console.log('Browser RIA optimizations initialized');
  }
  
  /**
   * Detect browser capabilities for optimization
   */
  async detectBrowserCapabilities() {
    const userAgent = navigator.userAgent;
    const isChrome = userAgent.includes('Chrome');
    const isFirefox = userAgent.includes('Firefox');
    const isEdge = userAgent.includes('Edg');
    const isSafari = userAgent.includes('Safari') && !isChrome;
    
    // Detect available APIs
    const capabilities = {
      browser: isChrome ? 'chrome' : isFirefox ? 'firefox' : isEdge ? 'edge' : 'safari',
      webGL: !!window.WebGLRenderingContext,
      webWorkers: !!window.Worker,
      indexedDB: !!window.indexedDB,
      webAssembly: !!window.WebAssembly,
      intersectionObserver: !!window.IntersectionObserver,
      mutationObserver: !!window.MutationObserver,
      performanceObserver: !!window.PerformanceObserver,
      memoryAPI: !!(performance && performance.memory)
    };
    
    // Detect system capabilities
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      capabilities.networkSpeed = connection.effectiveType;
      capabilities.saveData = connection.saveData;
    }
    
    // Detect hardware capabilities
    capabilities.hardwareConcurrency = navigator.hardwareConcurrency || 4;
    capabilities.deviceMemory = navigator.deviceMemory || 4;
    
    this.browserCapabilities = capabilities;
    
    // Adjust optimization level based on capabilities
    if (capabilities.deviceMemory < 4 || capabilities.hardwareConcurrency < 4) {
      this.optimizationLevel = 'performance';
    } else if (capabilities.deviceMemory >= 8 && capabilities.hardwareConcurrency >= 8) {
      this.optimizationLevel = 'accuracy';
    }
    
    console.log(`Browser RIA: ${this.optimizationLevel} mode for ${capabilities.browser}`);
  }
  
  /**
   * Setup tab-specific optimizations
   */
  async setupTabOptimizations() {
    await this.tabManager.initialize(this.optimizationLevel);
    
    // Listen for tab changes
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.tabManager.handleTabActivated(activeInfo.tabId);
    });
    
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete') {
        this.tabManager.handleTabUpdated(tabId, tab);
      }
    });
    
    chrome.tabs.onRemoved.addListener((tabId) => {
      this.tabManager.handleTabRemoved(tabId);
    });
  }
  
  /**
   * Setup performance optimizations
   */
  async setupPerformanceOptimizations() {
    await this.performanceMonitor.initialize(this.browserCapabilities);
    
    // Adjust processing frequency based on performance
    this.performanceMonitor.onPerformanceChange((metrics) => {
      this.adjustProcessingFrequency(metrics);
    });
    
    // Setup frame rate optimization
    this.setupFrameRateOptimization();
    
    // Setup memory monitoring
    this.setupMemoryMonitoring();
  }
  
  /**
   * Adjust processing frequency based on performance metrics
   */
  adjustProcessingFrequency(metrics) {
    const { cpu, memory, frameRate } = metrics;
    
    let newFrequency = 2000; // Default 2 seconds
    
    if (cpu > 80 || memory > 80 || frameRate < 30) {
      // High resource usage - reduce frequency
      newFrequency = 5000;
      this.optimizationLevel = 'performance';
    } else if (cpu < 30 && memory < 50 && frameRate > 50) {
      // Low resource usage - increase frequency
      newFrequency = 1000;
      this.optimizationLevel = 'accuracy';
    }
    
    chrome.storage.local.set({ analysisFrequency: newFrequency });
  }
  
  /**
   * Setup frame rate optimization
   */
  setupFrameRateOptimization() {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFrameRate = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;
        
        this.performanceMonitor.updateFrameRate(fps);
      }
      
      requestAnimationFrame(measureFrameRate);
    };
    
    requestAnimationFrame(measureFrameRate);
  }
  
  /**
   * Setup memory monitoring
   */
  setupMemoryMonitoring() {
    if (!this.browserCapabilities.memoryAPI) return;
    
    setInterval(() => {
      const memInfo = performance.memory;
      const usagePercent = (memInfo.usedJSHeapSize / memInfo.totalJSHeapSize) * 100;
      
      this.performanceMonitor.updateMemoryUsage(usagePercent);
      
      // Trigger cleanup if memory usage is high
      if (usagePercent > 85) {
        this.triggerMemoryCleanup();
      }
    }, 5000);
  }
  
  /**
   * Trigger memory cleanup
   */
  triggerMemoryCleanup() {
    // Clear old cache entries
    this.resourceManager.clearOldCaches();
    
    // Reduce active analyses
    this.tabManager.pauseInactiveTabs();
    
    // Notify content scripts to reduce activity
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'reduceActivity',
          level: 'high'
        }).catch(() => {
          // Ignore errors for tabs without content scripts
        });
      });
    });
  }
  
  /**
   * Setup resource optimizations
   */
  async setupResourceOptimizations() {
    await this.resourceManager.initialize(this.browserCapabilities);
    
    // Setup intelligent caching
    this.setupIntelligentCaching();
    
    // Setup lazy loading
    this.setupLazyLoading();
    
    // Setup compression
    this.setupCompression();
  }
  
  /**
   * Setup intelligent caching based on usage patterns
   */
  setupIntelligentCaching() {
    const cacheConfig = {
      maxSize: this.browserCapabilities.deviceMemory * 10, // MB
      ttl: this.optimizationLevel === 'performance' ? 300000 : 600000, // 5-10 minutes
      compressionThreshold: 1024 // Compress objects > 1KB
    };
    
    this.resourceManager.configureCaching(cacheConfig);
  }
  
  /**
   * Setup lazy loading for heavy operations
   */
  setupLazyLoading() {
    // Only analyze visible tabs
    const intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.tabManager.prioritizeTab(entry.target.tabId);
        } else {
          this.tabManager.deprioritizeTab(entry.target.tabId);
        }
      });
    });
    
    // Use observer for content visibility
    this.visibilityObserver = intersectionObserver;
  }
  
  /**
   * Setup compression for data storage
   */
  setupCompression() {
    if (!this.browserCapabilities.webWorkers) return;
    
    // Use web worker for compression tasks
    this.compressionWorker = new Worker('compression-worker.js');
    this.compressionWorker.onmessage = (event) => {
      const { action, data, requestId } = event.data;
      
      if (action === 'compressed') {
        this.resourceManager.handleCompressedData(requestId, data);
      }
    };
  }
  
  /**
   * Setup browser-specific features
   */
  async setupBrowserSpecificFeatures() {
    switch (this.browserCapabilities.browser) {
      case 'chrome':
        await this.setupChromeFeatures();
        break;
      case 'firefox':
        await this.setupFirefoxFeatures();
        break;
      case 'edge':
        await this.setupEdgeFeatures();
        break;
      case 'safari':
        await this.setupSafariFeatures();
        break;
    }
  }
  
  /**
   * Setup Chrome-specific features
   */
  async setupChromeFeatures() {
    // Use Chrome's tab groups API if available
    if (chrome.tabGroups) {
      chrome.tabGroups.onUpdated.addListener((group) => {
        this.tabManager.handleTabGroupUpdate(group);
      });
    }
    
    // Use Chrome's declarative content API
    if (chrome.declarativeContent) {
      chrome.declarativeContent.onPageChanged.addRules([{
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { schemes: ['http', 'https'] }
          })
        ],
        actions: [new chrome.declarativeContent.ShowAction()]
      }]);
    }
    
    // Chrome-specific performance optimizations
    if (chrome.system && chrome.system.cpu) {
      chrome.system.cpu.getInfo((cpuInfo) => {
        this.optimizeByCPUInfo(cpuInfo);
      });
    }
  }
  
  /**
   * Setup Firefox-specific features
   */
  async setupFirefoxFeatures() {
    // Firefox-specific optimizations
    
    // Use Firefox's containers if available
    if (browser.contextualIdentities) {
      browser.contextualIdentities.onUpdated.addListener((changeInfo) => {
        this.tabManager.handleContainerUpdate(changeInfo);
      });
    }
    
    // Firefox performance optimizations
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches) {
      this.optimizationLevel = 'performance';
    }
  }
  
  /**
   * Setup Edge-specific features
   */
  async setupEdgeFeatures() {
    // Edge-specific optimizations
    
    // Use Edge's collections API if available
    if (chrome.collections) {
      chrome.collections.onCreated.addListener((collection) => {
        this.tabManager.handleCollectionCreated(collection);
      });
    }
  }
  
  /**
   * Setup Safari-specific features
   */
  async setupSafariFeatures() {
    // Safari-specific optimizations
    
    // Safari has more restrictive resource limits
    this.optimizationLevel = 'performance';
    
    // Reduce storage usage for Safari
    const safariCacheConfig = {
      maxSize: 5, // 5MB limit
      ttl: 180000, // 3 minutes
      compressionThreshold: 512 // Compress > 512 bytes
    };
    
    this.resourceManager.configureCaching(safariCacheConfig);
  }
  
  /**
   * Optimize based on CPU information
   */
  optimizeByCPUInfo(cpuInfo) {
    const { numOfProcessors, archName } = cpuInfo;
    
    if (numOfProcessors < 4 || archName.includes('arm')) {
      this.optimizationLevel = 'performance';
      
      // Reduce analysis complexity
      chrome.storage.local.set({
        reducedAnalysis: true,
        batchSize: 25,
        analysisFrequency: 5000
      });
    }
  }
  
  /**
   * Get optimization statistics
   */
  getOptimizationStats() {
    return {
      optimizationLevel: this.optimizationLevel,
      browserCapabilities: this.browserCapabilities,
      tabManagerStats: this.tabManager.getStats(),
      performanceStats: this.performanceMonitor.getStats(),
      resourceStats: this.resourceManager.getStats()
    };
  }
}

/**
 * Tab Manager for optimized tab handling
 */
class TabManager {
  constructor() {
    this.activeTabs = new Map();
    this.priorityQueue = [];
    this.analysisQueue = [];
  }
  
  async initialize(optimizationLevel) {
    this.optimizationLevel = optimizationLevel;
    this.maxConcurrentAnalyses = optimizationLevel === 'performance' ? 2 : 5;
    
    // Get all existing tabs
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
      if (tab.url && !tab.url.startsWith('chrome://')) {
        this.activeTabs.set(tab.id, {
          id: tab.id,
          url: tab.url,
          title: tab.title,
          active: tab.active,
          lastAnalyzed: 0,
          priority: tab.active ? 10 : 1
        });
      }
    });
  }
  
  handleTabActivated(tabId) {
    const tab = this.activeTabs.get(tabId);
    if (tab) {
      tab.active = true;
      tab.priority = 10;
      this.prioritizeTab(tabId);
    }
    
    // Deprioritize other tabs
    this.activeTabs.forEach((tab, id) => {
      if (id !== tabId) {
        tab.active = false;
        tab.priority = Math.max(tab.priority - 1, 1);
      }
    });
  }
  
  handleTabUpdated(tabId, tab) {
    if (this.activeTabs.has(tabId)) {
      const existingTab = this.activeTabs.get(tabId);
      existingTab.url = tab.url;
      existingTab.title = tab.title;
      existingTab.lastAnalyzed = 0; // Reset analysis timestamp
    } else if (tab.url && !tab.url.startsWith('chrome://')) {
      this.activeTabs.set(tabId, {
        id: tabId,
        url: tab.url,
        title: tab.title,
        active: tab.active,
        lastAnalyzed: 0,
        priority: tab.active ? 10 : 1
      });
    }
  }
  
  handleTabRemoved(tabId) {
    this.activeTabs.delete(tabId);
    this.priorityQueue = this.priorityQueue.filter(id => id !== tabId);
    this.analysisQueue = this.analysisQueue.filter(id => id !== tabId);
  }
  
  prioritizeTab(tabId) {
    // Move tab to front of priority queue
    this.priorityQueue = this.priorityQueue.filter(id => id !== tabId);
    this.priorityQueue.unshift(tabId);
    
    // Limit queue size
    if (this.priorityQueue.length > 10) {
      this.priorityQueue = this.priorityQueue.slice(0, 10);
    }
  }
  
  deprioritizeTab(tabId) {
    const tab = this.activeTabs.get(tabId);
    if (tab) {
      tab.priority = Math.max(tab.priority - 2, 1);
    }
  }
  
  pauseInactiveTabs() {
    this.activeTabs.forEach((tab, tabId) => {
      if (!tab.active) {
        chrome.tabs.sendMessage(tabId, {
          action: 'pauseAnalysis'
        }).catch(() => {
          // Ignore errors
        });
      }
    });
  }
  
  getStats() {
    return {
      totalTabs: this.activeTabs.size,
      priorityQueueSize: this.priorityQueue.length,
      analysisQueueSize: this.analysisQueue.length,
      activeTabs: Array.from(this.activeTabs.values()).filter(tab => tab.active).length
    };
  }
}

/**
 * Performance Monitor for tracking browser performance
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      cpu: 0,
      memory: 0,
      frameRate: 60,
      networkSpeed: 'unknown'
    };
    this.callbacks = [];
  }
  
  async initialize(browserCapabilities) {
    this.browserCapabilities = browserCapabilities;
    
    // Setup performance observers if available
    if (this.browserCapabilities.performanceObserver) {
      this.setupPerformanceObservers();
    }
    
    // Start monitoring
    this.startMonitoring();
  }
  
  setupPerformanceObservers() {
    // Monitor long tasks
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        const longTasks = list.getEntries();
        if (longTasks.length > 0) {
          this.metrics.cpu = Math.min(this.metrics.cpu + 10, 100);
        }
      });
      
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // Long task observer not supported
    }
    
    // Monitor navigation timing
    try {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.loadEventEnd > 0) {
            const loadTime = entry.loadEventEnd - entry.navigationStart;
            this.updateNetworkPerformance(loadTime);
          }
        });
      });
      
      navigationObserver.observe({ entryTypes: ['navigation'] });
    } catch (e) {
      // Navigation observer not supported
    }
  }
  
  startMonitoring() {
    setInterval(() => {
      this.updateMetrics();
      this.notifyCallbacks();
    }, 5000);
  }
  
  updateMetrics() {
    // Update CPU usage (simplified estimation)
    this.metrics.cpu = Math.max(this.metrics.cpu - 5, 0); // Decay over time
    
    // Update memory if available
    if (this.browserCapabilities.memoryAPI) {
      const memInfo = performance.memory;
      this.metrics.memory = (memInfo.usedJSHeapSize / memInfo.totalJSHeapSize) * 100;
    }
    
    // Update network speed
    const connection = navigator.connection;
    if (connection) {
      this.metrics.networkSpeed = connection.effectiveType;
    }
  }
  
  updateFrameRate(fps) {
    this.metrics.frameRate = fps;
  }
  
  updateMemoryUsage(percent) {
    this.metrics.memory = percent;
  }
  
  updateNetworkPerformance(loadTime) {
    // Estimate network performance from load times
    if (loadTime < 1000) {
      this.metrics.networkSpeed = 'fast';
    } else if (loadTime < 3000) {
      this.metrics.networkSpeed = 'medium';
    } else {
      this.metrics.networkSpeed = 'slow';
    }
  }
  
  onPerformanceChange(callback) {
    this.callbacks.push(callback);
  }
  
  notifyCallbacks() {
    this.callbacks.forEach(callback => {
      try {
        callback(this.metrics);
      } catch (e) {
        console.error('Performance callback error:', e);
      }
    });
  }
  
  getStats() {
    return { ...this.metrics };
  }
}

/**
 * Resource Manager for optimized resource usage
 */
class ResourceManager {
  constructor() {
    this.caches = new Map();
    this.cacheConfig = null;
  }
  
  async initialize(browserCapabilities) {
    this.browserCapabilities = browserCapabilities;
    this.setupDefaultCaching();
  }
  
  setupDefaultCaching() {
    this.cacheConfig = {
      maxSize: 50, // 50MB default
      ttl: 600000, // 10 minutes
      compressionThreshold: 1024
    };
  }
  
  configureCaching(config) {
    this.cacheConfig = { ...this.cacheConfig, ...config };
  }
  
  clearOldCaches() {
    const now = Date.now();
    
    this.caches.forEach((cache, key) => {
      if (now - cache.timestamp > this.cacheConfig.ttl) {
        this.caches.delete(key);
      }
    });
  }
  
  handleCompressedData(requestId, data) {
    // Handle compressed data from web worker
    const cache = this.caches.get(requestId);
    if (cache) {
      cache.compressedData = data;
      cache.compressed = true;
    }
  }
  
  getStats() {
    const totalSize = Array.from(this.caches.values())
      .reduce((total, cache) => total + (cache.size || 0), 0);
    
    return {
      cacheCount: this.caches.size,
      totalSize: totalSize,
      maxSize: this.cacheConfig.maxSize * 1024 * 1024, // Convert to bytes
      compressionEnabled: !!this.browserCapabilities.webWorkers
    };
  }
}

// Export the optimization class
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BrowserOptimizations;
}