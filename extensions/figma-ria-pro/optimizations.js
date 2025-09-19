// Platform-Specific Optimizations for Figma Plugin
// This file contains Figma-specific performance and feature optimizations

class FigmaOptimizations {
  constructor() {
    this.optimizationLevel = 'balanced';
    this.frameCache = new Map();
    this.complexityCache = new Map();
    this.performanceMetrics = {
      analysisTime: [],
      renderTime: [],
      memoryUsage: []
    };
  }
  
  /**
   * Initialize Figma-specific optimizations
   */
  async initialize() {
    await this.detectFigmaEnvironment();
    this.setupFrameOptimizations();
    this.setupLayerOptimizations();
    this.setupPerformanceMonitoring();
    this.setupMemoryManagement();
    
    console.log('Figma RIA optimizations initialized');
  }
  
  /**
   * Detect Figma environment capabilities
   */
  async detectFigmaEnvironment() {
    // Check if we're in Figma or FigJam
    const isFigJam = figma.editorType === 'figjam';
    
    // Detect document complexity
    const documentComplexity = this.analyzeDocumentComplexity();
    
    // Adjust optimization level based on environment
    if (isFigJam) {
      this.optimizationLevel = 'performance'; // FigJam has different needs
    } else if (documentComplexity > 1000) {
      this.optimizationLevel = 'performance'; // Complex documents need performance focus
    } else {
      this.optimizationLevel = 'balanced';
    }
    
    console.log(`Figma RIA: ${this.optimizationLevel} mode for ${isFigJam ? 'FigJam' : 'Figma'}`);
  }
  
  /**
   * Analyze document complexity for optimization decisions
   */
  analyzeDocumentComplexity() {
    let totalNodes = 0;
    let totalPages = figma.root.children.length;
    
    // Sample complexity from first few pages
    const samplePages = figma.root.children.slice(0, 3);
    
    for (const page of samplePages) {
      totalNodes += this.countNodesRecursively(page);
    }
    
    // Estimate total complexity
    const estimatedTotalNodes = (totalNodes / samplePages.length) * totalPages;
    
    return estimatedTotalNodes;
  }
  
  /**
   * Count nodes recursively for complexity estimation
   */
  countNodesRecursively(node) {
    let count = 1;
    
    if ('children' in node) {
      for (const child of node.children) {
        count += this.countNodesRecursively(child);
      }
    }
    
    return count;
  }
  
  /**
   * Setup frame-specific optimizations
   */
  setupFrameOptimizations() {
    // Optimize frame analysis based on viewport visibility
    this.visibleFrameTracker = new Set();
    
    // Cache frame analysis results
    this.frameAnalysisCache = new Map();
    
    // Setup frame change detection
    figma.on('selectionchange', () => {
      this.updateVisibleFrames();
    });
  }
  
  /**
   * Update visible frames for optimized analysis
   */
  updateVisibleFrames() {
    const selection = figma.currentPage.selection;
    const newVisibleFrames = new Set();
    
    for (const node of selection) {
      if (node.type === 'FRAME') {
        newVisibleFrames.add(node.id);
      }
      
      // Find parent frames
      let parent = node.parent;
      while (parent && parent.type !== 'PAGE') {
        if (parent.type === 'FRAME') {
          newVisibleFrames.add(parent.id);
        }
        parent = parent.parent;
      }
    }
    
    this.visibleFrameTracker = newVisibleFrames;
  }
  
  /**
   * Optimized complexity analysis for frames
   */
  analyzeFrameComplexity(frame, options = {}) {
    const startTime = performance.now();
    
    // Check cache first
    const cacheKey = this.generateCacheKey(frame, options);
    if (this.frameAnalysisCache.has(cacheKey)) {
      return this.frameAnalysisCache.get(cacheKey);
    }
    
    let complexity = 0;
    
    // Visual complexity factors
    complexity += this.calculateVisualComplexity(frame);
    
    // Structural complexity
    complexity += this.calculateStructuralComplexity(frame);
    
    // Interactive complexity
    complexity += this.calculateInteractiveComplexity(frame);
    
    // Content complexity
    complexity += this.calculateContentComplexity(frame);
    
    const result = {
      totalComplexity: complexity,
      visualComplexity: complexity * 0.4,
      structuralComplexity: complexity * 0.3,
      interactiveComplexity: complexity * 0.2,
      contentComplexity: complexity * 0.1,
      analysisTime: performance.now() - startTime
    };
    
    // Cache result with TTL
    this.cacheResult(cacheKey, result);
    
    // Track performance
    this.performanceMetrics.analysisTime.push(result.analysisTime);
    
    return result;
  }
  
  /**
   * Calculate visual complexity of a frame
   */
  calculateVisualComplexity(frame) {
    let complexity = 0;
    
    // Color complexity
    const colors = this.extractColors(frame);
    complexity += Math.min(colors.size * 0.5, 10); // Cap at 10
    
    // Typography complexity
    const fonts = this.extractFonts(frame);
    complexity += Math.min(fonts.size * 1.0, 15); // Cap at 15
    
    // Visual effects complexity
    complexity += this.calculateEffectsComplexity(frame);
    
    // Layout density
    const density = this.calculateLayoutDensity(frame);
    complexity += Math.min(density * 0.1, 20); // Cap at 20
    
    return complexity;
  }
  
  /**
   * Extract colors from frame hierarchy
   */
  extractColors(node) {
    const colors = new Set();
    
    const extractNodeColors = (n) => {
      // Extract fill colors
      if ('fills' in n && n.fills) {
        for (const fill of n.fills) {
          if (fill.type === 'SOLID') {
            const color = `${fill.color.r},${fill.color.g},${fill.color.b}`;
            colors.add(color);
          }
        }
      }
      
      // Extract stroke colors
      if ('strokes' in n && n.strokes) {
        for (const stroke of n.strokes) {
          if (stroke.type === 'SOLID') {
            const color = `${stroke.color.r},${stroke.color.g},${stroke.color.b}`;
            colors.add(color);
          }
        }
      }
      
      // Recursively process children
      if ('children' in n) {
        for (const child of n.children) {
          extractNodeColors(child);
        }
      }
    };
    
    extractNodeColors(node);
    return colors;
  }
  
  /**
   * Extract fonts from frame hierarchy
   */
  extractFonts(node) {
    const fonts = new Set();
    
    const extractNodeFonts = (n) => {
      if (n.type === 'TEXT') {
        const fontName = `${n.fontName.family}-${n.fontName.style}`;
        fonts.add(fontName);
      }
      
      if ('children' in n) {
        for (const child of n.children) {
          extractNodeFonts(child);
        }
      }
    };
    
    extractNodeFonts(node);
    return fonts;
  }
  
  /**
   * Calculate effects complexity
   */
  calculateEffectsComplexity(node) {
    let complexity = 0;
    
    const calculateNodeEffects = (n) => {
      if ('effects' in n && n.effects) {
        complexity += n.effects.length * 2; // Each effect adds complexity
        
        // Specific effect types
        for (const effect of n.effects) {
          if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
            complexity += 3;
          } else if (effect.type === 'LAYER_BLUR' || effect.type === 'BACKGROUND_BLUR') {
            complexity += 5; // Blur is expensive
          }
        }
      }
      
      if ('children' in n) {
        for (const child of n.children) {
          calculateNodeEffects(child);
        }
      }
    };
    
    calculateNodeEffects(node);
    return complexity;
  }
  
  /**
   * Calculate layout density
   */
  calculateLayoutDensity(frame) {
    let totalNodes = 0;
    let totalArea = frame.width * frame.height;
    
    const countNodes = (node) => {
      totalNodes++;
      if ('children' in node) {
        for (const child of node.children) {
          countNodes(child);
        }
      }
    };
    
    countNodes(frame);
    
    return totalNodes / (totalArea / 10000); // Normalize to nodes per 10k pixels
  }
  
  /**
   * Calculate structural complexity
   */
  calculateStructuralComplexity(frame) {
    let complexity = 0;
    
    // Nesting depth
    const maxDepth = this.calculateMaxDepth(frame);
    complexity += maxDepth * 2;
    
    // Component instances
    const componentCount = this.countComponents(frame);
    complexity += componentCount * 1.5;
    
    // Auto layout usage
    const autoLayoutCount = this.countAutoLayouts(frame);
    complexity += autoLayoutCount * 1.0;
    
    return complexity;
  }
  
  /**
   * Calculate maximum nesting depth
   */
  calculateMaxDepth(node, currentDepth = 0) {
    if (!('children' in node) || node.children.length === 0) {
      return currentDepth;
    }
    
    let maxChildDepth = currentDepth;
    for (const child of node.children) {
      const childDepth = this.calculateMaxDepth(child, currentDepth + 1);
      maxChildDepth = Math.max(maxChildDepth, childDepth);
    }
    
    return maxChildDepth;
  }
  
  /**
   * Count component instances
   */
  countComponents(node) {
    let count = 0;
    
    if (node.type === 'INSTANCE') {
      count++;
    }
    
    if ('children' in node) {
      for (const child of node.children) {
        count += this.countComponents(child);
      }
    }
    
    return count;
  }
  
  /**
   * Count auto layout containers
   */
  countAutoLayouts(node) {
    let count = 0;
    
    if ('layoutMode' in node && node.layoutMode !== 'NONE') {
      count++;
    }
    
    if ('children' in node) {
      for (const child of node.children) {
        count += this.countAutoLayouts(child);
      }
    }
    
    return count;
  }
  
  /**
   * Calculate interactive complexity
   */
  calculateInteractiveComplexity(frame) {
    let complexity = 0;
    
    const calculateNodeInteractivity = (node) => {
      // Prototyping interactions
      if ('reactions' in node && node.reactions) {
        complexity += node.reactions.length * 3;
      }
      
      // Overlay interactions
      if (node.type === 'FRAME' && 'overlayPositionType' in node) {
        complexity += 2;
      }
      
      if ('children' in node) {
        for (const child of node.children) {
          calculateNodeInteractivity(child);
        }
      }
    };
    
    calculateNodeInteractivity(frame);
    return complexity;
  }
  
  /**
   * Calculate content complexity
   */
  calculateContentComplexity(frame) {
    let complexity = 0;
    
    const calculateNodeContent = (node) => {
      // Text complexity
      if (node.type === 'TEXT') {
        const textLength = node.characters.length;
        complexity += Math.min(textLength / 100, 5); // Cap at 5
        
        // Mixed text styles add complexity
        if ('getStyledTextSegments' in node) {
          try {
            const segments = node.getStyledTextSegments(['fontName', 'fontSize', 'fills']);
            complexity += Math.min(segments.length * 0.5, 3);
          } catch (e) {
            // Ignore if method not available
          }
        }
      }
      
      // Image complexity
      if ('fills' in node && node.fills) {
        for (const fill of node.fills) {
          if (fill.type === 'IMAGE') {
            complexity += 2;
          }
        }
      }
      
      if ('children' in node) {
        for (const child of node.children) {
          calculateNodeContent(child);
        }
      }
    };
    
    calculateNodeContent(frame);
    return complexity;
  }
  
  /**
   * Generate cache key for analysis results
   */
  generateCacheKey(frame, options) {
    const frameHash = this.hashNode(frame);
    const optionsHash = JSON.stringify(options);
    return `${frameHash}-${optionsHash}`;
  }
  
  /**
   * Simple hash function for nodes
   */
  hashNode(node) {
    const props = {
      id: node.id,
      type: node.type,
      childCount: 'children' in node ? node.children.length : 0,
      lastModified: node.lastModified || Date.now()
    };
    
    return JSON.stringify(props);
  }
  
  /**
   * Cache analysis result with TTL
   */
  cacheResult(key, result) {
    const ttl = this.optimizationLevel === 'performance' ? 30000 : 10000; // 30s or 10s
    
    this.frameAnalysisCache.set(key, result);
    
    // Cleanup old cache entries
    setTimeout(() => {
      this.frameAnalysisCache.delete(key);
    }, ttl);
  }
  
  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    // Monitor memory usage
    setInterval(() => {
      if (typeof performance !== 'undefined' && performance.memory) {
        this.performanceMetrics.memoryUsage.push({
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          timestamp: Date.now()
        });
        
        // Keep only last 100 measurements
        if (this.performanceMetrics.memoryUsage.length > 100) {
          this.performanceMetrics.memoryUsage.shift();
        }
      }
    }, 5000); // Every 5 seconds
  }
  
  /**
   * Setup memory management
   */
  setupMemoryManagement() {
    // Clear caches when memory usage is high
    setInterval(() => {
      if (this.performanceMetrics.memoryUsage.length > 0) {
        const latest = this.performanceMetrics.memoryUsage[this.performanceMetrics.memoryUsage.length - 1];
        const memoryUsageRatio = latest.used / latest.total;
        
        if (memoryUsageRatio > 0.8) { // 80% memory usage
          console.log('High memory usage detected, clearing caches');
          this.clearCaches();
        }
      }
    }, 10000); // Every 10 seconds
  }
  
  /**
   * Clear all caches
   */
  clearCaches() {
    this.frameAnalysisCache.clear();
    this.complexityCache.clear();
    this.frameCache.clear();
    
    // Trigger garbage collection if available
    if (typeof gc === 'function') {
      gc();
    }
  }
  
  /**
   * Get optimization statistics
   */
  getOptimizationStats() {
    const avgAnalysisTime = this.performanceMetrics.analysisTime.length > 0
      ? this.performanceMetrics.analysisTime.reduce((a, b) => a + b, 0) / this.performanceMetrics.analysisTime.length
      : 0;
    
    return {
      optimizationLevel: this.optimizationLevel,
      cacheSize: this.frameAnalysisCache.size,
      avgAnalysisTime: avgAnalysisTime,
      memoryUsage: this.performanceMetrics.memoryUsage.length > 0
        ? this.performanceMetrics.memoryUsage[this.performanceMetrics.memoryUsage.length - 1]
        : null
    };
  }
  
  /**
   * Batch process multiple frames efficiently
   */
  async batchAnalyzeFrames(frames) {
    const results = [];
    const batchSize = this.optimizationLevel === 'performance' ? 5 : 10;
    
    for (let i = 0; i < frames.length; i += batchSize) {
      const batch = frames.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(frame => this.analyzeFrameComplexity(frame))
      );
      
      results.push(...batchResults);
      
      // Yield control between batches
      if (i + batchSize < frames.length) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    return results;
  }
}

// Export the optimization class
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FigmaOptimizations;
}