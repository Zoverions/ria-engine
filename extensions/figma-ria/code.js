/**
 * Figma RIA Plugin - Main Thread Code
 * 
 * Integrates RIA Engine v2.1 with Figma for design-focused cognitive enhancement.
 * Monitors design complexity, creative flow state, and provides context-aware assistance.
 */

// RIA Engine integration for Figma
class RIAFigmaPlugin {
  constructor() {
    this.isActive = false;
    this.currentFI = 0.3;
    this.sessionStartTime = Date.now();
    this.lastActivity = Date.now();
    this.designComplexity = 0;
    this.monitoringInterval = null;
    
    // Design context tracking
    this.currentDesignPhase = 'exploration'; // exploration, refinement, delivery
    this.componentCount = 0;
    this.layerDepth = 0;
    this.colorCount = 0;
    
    console.log('🎨 RIA Figma Plugin initialized');
  }

  async initialize() {
    try {
      // Set up UI
      figma.showUI(__html__, { 
        width: 320, 
        height: 480,
        title: 'RIA Cognitive Enhancement'
      });

      // Start monitoring
      this.startDesignMonitoring();
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.isActive = true;
      this.updateUI();
      
      console.log('✅ RIA Figma Plugin activated');
      
    } catch (error) {
      console.error('❌ Failed to initialize RIA Figma Plugin:', error);
    }
  }

  setupEventListeners() {
    // Listen for selection changes
    figma.on('selectionchange', () => {
      this.onSelectionChanged();
    });

    // Listen for UI messages
    figma.ui.onmessage = (msg) => {
      this.handleUIMessage(msg);
    };

    // Listen for document changes
    figma.on('documentchange', () => {
      this.onDocumentChanged();
    });
  }

  startDesignMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.analyzeDesignContext();
      this.calculateCognitiveLoad();
      this.checkInterventions();
      this.updateUI();
    }, 2000); // Check every 2 seconds
  }

  analyzeDesignContext() {
    const selection = figma.currentPage.selection;
    const allNodes = figma.currentPage.findAll();
    
    // Calculate design complexity metrics
    this.componentCount = allNodes.filter(node => node.type === 'COMPONENT').length;
    this.layerDepth = this.calculateMaxDepth(figma.currentPage);
    this.colorCount = this.calculateUniqueColors(allNodes);
    
    // Determine design phase based on complexity and patterns
    this.currentDesignPhase = this.determineDesignPhase();
    
    // Calculate overall design complexity
    this.designComplexity = this.calculateDesignComplexity();
  }

  calculateMaxDepth(node, currentDepth = 0) {
    let maxDepth = currentDepth;
    
    if ('children' in node) {
      for (const child of node.children) {
        const childDepth = this.calculateMaxDepth(child, currentDepth + 1);
        maxDepth = Math.max(maxDepth, childDepth);
      }
    }
    
    return maxDepth;
  }

  calculateUniqueColors(nodes) {
    const colors = new Set();
    
    nodes.forEach(node => {
      if ('fills' in node && node.fills) {
        node.fills.forEach(fill => {
          if (fill.type === 'SOLID' && fill.color) {
            const colorKey = `${fill.color.r},${fill.color.g},${fill.color.b}`;
            colors.add(colorKey);
          }
        });
      }
    });
    
    return colors.size;
  }

  determineDesignPhase() {
    const sessionTime = Date.now() - this.sessionStartTime;
    const timeSinceActivity = Date.now() - this.lastActivity;
    
    // Early session with high activity = exploration
    if (sessionTime < 1800000 && timeSinceActivity < 30000) { // 30 minutes, active
      return 'exploration';
    }
    
    // Mid session with components = refinement
    if (this.componentCount > 3 && this.layerDepth > 5) {
      return 'refinement';
    }
    
    // Later session with organized structure = delivery
    if (sessionTime > 3600000 && this.componentCount > 5) { // 1 hour+
      return 'delivery';
    }
    
    return 'exploration';
  }

  calculateDesignComplexity() {
    let complexity = 0.2; // Base complexity
    
    // Component complexity
    complexity += Math.min(this.componentCount * 0.05, 0.3);
    
    // Layer depth complexity
    complexity += Math.min(this.layerDepth * 0.02, 0.2);
    
    // Color complexity
    complexity += Math.min(this.colorCount * 0.01, 0.15);
    
    // Selection complexity
    const selectionCount = figma.currentPage.selection.length;
    if (selectionCount > 10) complexity += 0.1;
    if (selectionCount > 20) complexity += 0.15;
    
    return Math.min(complexity, 1.0);
  }

  calculateCognitiveLoad() {
    let load = this.designComplexity;
    
    // Session fatigue
    const sessionTime = Date.now() - this.sessionStartTime;
    if (sessionTime > 3600000) load += 0.2; // 1 hour
    if (sessionTime > 7200000) load += 0.3; // 2 hours
    
    // Activity patterns
    const timeSinceActivity = Date.now() - this.lastActivity;
    if (timeSinceActivity > 120000) load += 0.3; // 2 minutes idle
    
    // Design phase stress
    if (this.currentDesignPhase === 'delivery') load += 0.15;
    
    // Add some realistic variation
    load += (Math.random() - 0.5) * 0.1;
    
    this.currentFI = Math.max(0, Math.min(1, load));
  }

  checkInterventions() {
    // Generative Design Assistance (FI 0.6-0.8)
    if (this.currentFI > 0.6 && this.currentFI < 0.8) {
      this.triggerDesignAssistance();
    }

    // Critical Intervention (FI > 0.8)
    if (this.currentFI > 0.8) {
      this.triggerCriticalIntervention();
    }

    // Design System Suggestions
    if (this.shouldSuggestDesignSystem()) {
      this.triggerDesignSystemSuggestion();
    }
  }

  triggerDesignAssistance() {
    const assistance = this.getContextualDesignHelp();
    
    figma.notify(`💡 ${assistance.title}: ${assistance.description}`, {
      timeout: 5000
    });
    
    // Send detailed help to UI
    figma.ui.postMessage({
      type: 'design-assistance',
      data: assistance
    });
    
    console.log(`🎨 Design assistance triggered: ${assistance.title}`);
  }

  getContextualDesignHelp() {
    const phase = this.currentDesignPhase;
    const complexity = this.designComplexity;
    
    const helpDatabase = {
      exploration: {
        high: {
          title: 'Simplify Exploration',
          description: 'Too many elements. Focus on 2-3 key concepts first',
          suggestion: 'Create a simple wireframe before adding details',
          action: 'reduce_complexity'
        },
        medium: {
          title: 'Design System',
          description: 'Consider establishing a basic design system',
          suggestion: 'Define colors, typography, and spacing early',
          action: 'create_system'
        },
        low: {
          title: 'Creative Flow',
          description: 'Great exploration pace! Keep experimenting',
          suggestion: 'Try different layout approaches',
          action: 'encourage'
        }
      },
      refinement: {
        high: {
          title: 'Component Organization',
          description: 'Complex structure detected. Consider componentizing',
          suggestion: 'Group similar elements into reusable components',
          action: 'componentize'
        },
        medium: {
          title: 'Consistency Check',
          description: 'Ensure consistent spacing and alignment',
          suggestion: 'Use auto-layout for responsive components',
          action: 'align'
        },
        low: {
          title: 'Polish Phase',
          description: 'Good structure! Focus on visual details',
          suggestion: 'Refine micro-interactions and transitions',
          action: 'polish'
        }
      },
      delivery: {
        high: {
          title: 'Delivery Optimization',
          description: 'Complex delivery setup. Simplify handoff',
          suggestion: 'Organize layers and add clear annotations',
          action: 'organize'
        },
        medium: {
          title: 'Documentation',
          description: 'Add specifications for development',
          suggestion: 'Include measurements and interaction notes',
          action: 'document'
        },
        low: {
          title: 'Final Review',
          description: 'Ready for handoff! Final quality check',
          suggestion: 'Review accessibility and responsiveness',
          action: 'review'
        }
      }
    };
    
    const complexityLevel = complexity > 0.7 ? 'high' : complexity > 0.4 ? 'medium' : 'low';
    return helpDatabase[phase][complexityLevel];
  }

  shouldSuggestDesignSystem() {
    return this.colorCount > 8 && this.componentCount < 3;
  }

  triggerDesignSystemSuggestion() {
    figma.notify('🎨 Consider creating a design system for better consistency', {
      timeout: 4000
    });
    
    figma.ui.postMessage({
      type: 'design-system-suggestion',
      data: {
        colorCount: this.colorCount,
        componentCount: this.componentCount,
        suggestion: 'Convert repeated elements to components'
      }
    });
  }

  triggerCriticalIntervention() {
    figma.notify('🚨 High design complexity detected! Consider simplifying', {
      timeout: 6000
    });
    
    figma.ui.postMessage({
      type: 'critical-intervention',
      data: {
        fi: this.currentFI,
        suggestion: 'Take a break or reduce design complexity',
        actions: ['take_break', 'simplify_design', 'organize_layers']
      }
    });
    
    console.log(`🚨 Critical intervention triggered (FI: ${this.currentFI.toFixed(2)})`);
  }

  onSelectionChanged() {
    this.lastActivity = Date.now();
    const selection = figma.currentPage.selection;
    
    figma.ui.postMessage({
      type: 'selection-update',
      data: {
        count: selection.length,
        types: selection.map(node => node.type)
      }
    });
  }

  onDocumentChanged() {
    this.lastActivity = Date.now();
  }

  handleUIMessage(msg) {
    switch (msg.type) {
      case 'get-status':
        this.sendStatus();
        break;
      case 'toggle-ria':
        this.toggleRIA();
        break;
      case 'apply-suggestion':
        this.applySuggestion(msg.data);
        break;
      case 'export-data':
        this.exportData();
        break;
    }
  }

  sendStatus() {
    const status = {
      enabled: this.isActive,
      fi: this.currentFI,
      mode: this.getFIMode(),
      designPhase: this.currentDesignPhase,
      complexity: this.designComplexity,
      metrics: {
        components: this.componentCount,
        layers: this.layerDepth,
        colors: this.colorCount,
        sessionTime: Date.now() - this.sessionStartTime
      }
    };
    
    figma.ui.postMessage({
      type: 'status-update',
      data: status
    });
  }

  getFIMode() {
    return this.currentFI > 0.8 ? 'Critical' :
           this.currentFI > 0.6 ? 'High Load' :
           this.currentFI > 0.4 ? 'Moderate' : 'Optimal';
  }

  toggleRIA() {
    this.isActive = !this.isActive;
    
    if (this.isActive) {
      this.startDesignMonitoring();
      figma.notify('✅ RIA Cognitive Enhancement enabled');
    } else {
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
      }
      figma.notify('❌ RIA Cognitive Enhancement disabled');
    }
    
    this.updateUI();
  }

  applySuggestion(suggestionData) {
    const { action } = suggestionData;
    
    switch (action) {
      case 'reduce_complexity':
        this.reduceComplexity();
        break;
      case 'componentize':
        this.suggestComponentization();
        break;
      case 'organize':
        this.organizeForHandoff();
        break;
      default:
        figma.notify(`Applied suggestion: ${action}`);
    }
  }

  reduceComplexity() {
    figma.notify('💡 Try grouping related elements or hiding unnecessary layers');
  }

  suggestComponentization() {
    const selection = figma.currentPage.selection;
    if (selection.length > 1) {
      figma.notify('💡 Selected elements could become a component');
    } else {
      figma.notify('💡 Look for repeated patterns to convert to components');
    }
  }

  organizeForHandoff() {
    figma.notify('💡 Organize layers with clear names and group related elements');
  }

  exportData() {
    const exportData = {
      timestamp: new Date().toISOString(),
      session: {
        duration: Date.now() - this.sessionStartTime,
        designPhase: this.currentDesignPhase,
        finalFI: this.currentFI,
        finalComplexity: this.designComplexity
      },
      metrics: {
        components: this.componentCount,
        layers: this.layerDepth,
        colors: this.colorCount
      }
    };
    
    figma.ui.postMessage({
      type: 'data-export',
      data: exportData
    });
  }

  updateUI() {
    this.sendStatus();
  }

  shutdown() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    console.log('🎨 RIA Figma Plugin shut down');
  }
}

// Initialize plugin
const riaPlugin = new RIAFigmaPlugin();
riaPlugin.initialize();

// Handle plugin shutdown
figma.on('close', () => {
  riaPlugin.shutdown();
});