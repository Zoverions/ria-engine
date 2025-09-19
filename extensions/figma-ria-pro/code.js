/**
 * RIA Cognitive Design Enhancer - Figma Plugin
 * 
 * Integrates RIA Engine v2.1 with Figma for design-focused cognitive enhancement.
 * Provides real-time design complexity analysis, creative flow enhancement,
 * and adaptive interface modifications.
 */

// RIA Engine adapter for Figma
class FigmaRIAEngine {
  constructor() {
    this.isActive = false;
    this.currentFI = 0;
    this.designComplexity = 0;
    this.sessionStart = Date.now();
    this.interventions = 0;
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for selection changes to analyze design complexity
    figma.on('selectionchange', () => {
      if (this.isActive) {
        this.analyzeSelection();
      }
    });

    // Listen for document changes
    figma.on('documentchange', (event) => {
      if (this.isActive) {
        this.analyzeDocumentChanges(event);
      }
    });
  }

  start() {
    this.isActive = true;
    this.sessionStart = Date.now();
    figma.ui.postMessage({
      type: 'status-update',
      data: { active: true, fi: this.currentFI }
    });
    
    // Start periodic analysis
    this.startPeriodicAnalysis();
  }

  stop() {
    this.isActive = false;
    figma.ui.postMessage({
      type: 'status-update',
      data: { active: false, fi: 0 }
    });
  }

  analyzeSelection() {
    const selection = figma.currentPage.selection;
    
    if (selection.length === 0) {
      this.currentFI = Math.max(0, this.currentFI - 0.05);
      return;
    }

    // Calculate design complexity metrics
    const complexity = this.calculateDesignComplexity(selection);
    const diversity = this.calculateTypeDiversity(selection);
    const nesting = this.calculateNestingDepth(selection);
    
    // Update Fracture Index based on design factors
    this.currentFI = Math.min(1, (complexity + diversity + nesting) / 3);
    this.designComplexity = complexity;

    // Generate interventions if needed
    if (this.currentFI > 0.6) {
      this.generateDesignInterventions();
    }

    // Update UI
    figma.ui.postMessage({
      type: 'analysis-update',
      data: {
        fi: this.currentFI,
        complexity: complexity,
        diversity: diversity,
        nesting: nesting,
        selectionCount: selection.length
      }
    });
  }

  calculateDesignComplexity(nodes) {
    let complexity = 0;
    const maxNodes = 20; // Normalize against this

    // Factor 1: Number of selected nodes
    complexity += Math.min(1, nodes.length / maxNodes) * 0.4;

    // Factor 2: Variety of node types
    const types = new Set(nodes.map(node => node.type));
    complexity += Math.min(1, types.size / 10) * 0.3;

    // Factor 3: Style diversity
    const fills = new Set();
    const strokes = new Set();
    
    nodes.forEach(node => {
      if ('fills' in node && node.fills) {
        node.fills.forEach(fill => {
          if (fill.type === 'SOLID') {
            fills.add(JSON.stringify(fill.color));
          }
        });
      }
      if ('strokes' in node && node.strokes) {
        node.strokes.forEach(stroke => {
          if (stroke.type === 'SOLID') {
            strokes.add(JSON.stringify(stroke.color));
          }
        });
      }
    });

    complexity += Math.min(1, (fills.size + strokes.size) / 20) * 0.3;

    return complexity;
  }

  calculateTypeDiversity(nodes) {
    const types = new Set(nodes.map(node => node.type));
    return Math.min(1, types.size / 8); // Normalize against 8 different types
  }

  calculateNestingDepth(nodes) {
    let maxDepth = 0;
    
    nodes.forEach(node => {
      let depth = 0;
      let current = node.parent;
      
      while (current && current.type !== 'PAGE') {
        depth++;
        current = current.parent;
      }
      
      maxDepth = Math.max(maxDepth, depth);
    });

    return Math.min(1, maxDepth / 5); // Normalize against 5 levels deep
  }

  analyzeDocumentChanges(event) {
    const changeComplexity = event.documentChanges.length / 10; // Normalize
    this.currentFI = Math.min(1, this.currentFI + changeComplexity * 0.1);

    // Analyze type of changes for context
    const changeTypes = event.documentChanges.map(change => change.type);
    const context = this.inferDesignContext(changeTypes);

    figma.ui.postMessage({
      type: 'context-update',
      data: { context, changeCount: event.documentChanges.length }
    });
  }

  inferDesignContext(changeTypes) {
    if (changeTypes.includes('PROPERTY_CHANGE')) {
      return 'styling';
    }
    if (changeTypes.includes('CREATE')) {
      return 'creating';
    }
    if (changeTypes.includes('DELETE')) {
      return 'editing';
    }
    return 'general';
  }

  generateDesignInterventions() {
    const interventions = [];

    // Generative intervention: Design system suggestions
    if (this.currentFI > 0.6 && this.designComplexity > 0.7) {
      interventions.push({
        type: 'design_system_suggestion',
        title: 'Consider Using Components',
        message: 'High complexity detected. Consider converting repeated elements to components.',
        action: 'create_component'
      });
    }

    // Layout simplification
    if (this.currentFI > 0.75) {
      interventions.push({
        type: 'layout_simplification',
        title: 'Simplify Layout',
        message: 'Consider using auto-layout to reduce visual complexity.',
        action: 'suggest_autolayout'
      });
    }

    // Color palette intervention
    if (this.currentFI > 0.8) {
      interventions.push({
        type: 'color_harmony',
        title: 'Color Harmony',
        message: 'Too many colors detected. Consider using a consistent color palette.',
        action: 'suggest_palette'
      });
    }

    if (interventions.length > 0) {
      this.interventions += interventions.length;
      figma.ui.postMessage({
        type: 'interventions',
        data: interventions
      });
    }
  }

  startPeriodicAnalysis() {
    // Analyze viewport and document state periodically
    setInterval(() => {
      if (!this.isActive) return;

      const viewportNodes = figma.viewport.center;
      const currentPage = figma.currentPage;
      
      // Analyze visible content complexity
      const visibleComplexity = this.analyzeVisibleComplexity();
      
      // Gradual FI decay when not actively designing
      this.currentFI = Math.max(0, this.currentFI - 0.02);

      figma.ui.postMessage({
        type: 'periodic-update',
        data: {
          fi: this.currentFI,
          visibleComplexity,
          sessionDuration: Date.now() - this.sessionStart
        }
      });
    }, 2000); // Every 2 seconds
  }

  analyzeVisibleComplexity() {
    // Simplified visible complexity analysis
    const viewport = figma.viewport;
    const bounds = {
      x: viewport.center.x - viewport.zoom * 400,
      y: viewport.center.y - viewport.zoom * 300,
      width: viewport.zoom * 800,
      height: viewport.zoom * 600
    };

    // Count nodes in viewport (simplified)
    const allNodes = figma.currentPage.findAll();
    const visibleNodes = allNodes.filter(node => {
      if ('x' in node && 'y' in node && 'width' in node && 'height' in node) {
        return node.x < bounds.x + bounds.width &&
               node.x + node.width > bounds.x &&
               node.y < bounds.y + bounds.height &&
               node.y + node.height > bounds.y;
      }
      return false;
    });

    return Math.min(1, visibleNodes.length / 50);
  }

  getStatus() {
    return {
      active: this.isActive,
      fi: this.currentFI,
      complexity: this.designComplexity,
      interventions: this.interventions,
      sessionDuration: Date.now() - this.sessionStart
    };
  }

  // Handle messages from UI
  handleUIMessage(message) {
    switch (message.type) {
      case 'start':
        this.start();
        break;
      case 'stop':
        this.stop();
        break;
      case 'get-status':
        figma.ui.postMessage({
          type: 'status-response',
          data: this.getStatus()
        });
        break;
      case 'apply-intervention':
        this.applyIntervention(message.intervention);
        break;
    }
  }

  applyIntervention(intervention) {
    const selection = figma.currentPage.selection;
    
    switch (intervention.action) {
      case 'create_component':
        if (selection.length > 0) {
          const component = figma.createComponent();
          component.name = "Generated Component";
          
          // Move selected nodes into component
          selection.forEach(node => {
            component.appendChild(node);
          });
          
          figma.notify('Component created from selection');
        }
        break;
        
      case 'suggest_autolayout':
        if (selection.length === 1 && selection[0].type === 'FRAME') {
          const frame = selection[0];
          frame.layoutMode = 'VERTICAL';
          frame.paddingTop = frame.paddingBottom = frame.paddingLeft = frame.paddingRight = 16;
          frame.itemSpacing = 8;
          figma.notify('Auto-layout applied');
        }
        break;
        
      case 'suggest_palette':
        // Apply a harmonious color palette (simplified)
        const colors = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE'];
        let colorIndex = 0;
        
        selection.forEach(node => {
          if ('fills' in node) {
            const fills = [{
              type: 'SOLID',
              color: this.hexToRgb(colors[colorIndex % colors.length])
            }];
            node.fills = fills;
            colorIndex++;
          }
        });
        
        figma.notify('Color harmony applied');
        break;
    }
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
  }
}

// Initialize RIA Engine for Figma
const riaEngine = new FigmaRIAEngine();

// Handle UI messages
figma.ui.onmessage = (message) => {
  riaEngine.handleUIMessage(message);
};

// Show the plugin UI
figma.showUI(__html__, { width: 320, height: 480 });

// Send initial status
figma.ui.postMessage({
  type: 'init',
  data: { version: '2.1.0' }
});