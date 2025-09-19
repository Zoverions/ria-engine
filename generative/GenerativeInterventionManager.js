/**
 * Generative Intervention Manager for RIA Engine v2.1
 * 
 * Transforms RIA from purely reductive (noise-dampening) to generative (signal-amplifying).
 * Proactively provides contextually relevant information when focus begins to wane,
 * maximizing system self-coherence (g) rather than just minimizing entropy (γ).
 */

import { EventEmitter } from 'events';

export class GenerativeInterventionManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enabled: true,
      triggerThreshold: 0.6, // FI level to trigger intervention
      maxInterventionsPerMinute: 3,
      contextSearchDepth: 5,
      relevanceThreshold: 0.7,
      ...config
    };
    
    this.state = {
      recentInterventions: new Map(),
      contextHistory: [],
      learningData: new Map(),
      knowledgeCache: new Map()
    };
    
    // Comprehensive knowledge base for contextual interventions
    this.knowledgeBase = this.initializeKnowledgeBase();
    
    // Context analyzers for different domains
    this.contextAnalyzers = {
      javascript: this.analyzeJavaScriptContext.bind(this),
      figma: this.analyzeFigmaContext.bind(this),
      vscode: this.analyzeVSCodeContext.bind(this),
      web: this.analyzeWebContext.bind(this),
      general: this.analyzeGeneralContext.bind(this)
    };
    
    console.log('🧠 GenerativeInterventionManager initialized');
  }
  
  initializeKnowledgeBase() {
    return {
      javascript: {
        patterns: {
          'Array.prototype.map': {
            content: 'Creates a new array with results of calling a function for every array element',
            examples: ['array.map(x => x * 2)', 'users.map(user => user.name)'],
            relatedConcepts: ['forEach', 'filter', 'reduce'],
            complexity: 'beginner'
          },
          'Array.prototype.reduce': {
            content: 'Executes a reducer function on each element, resulting in a single output value',
            examples: ['array.reduce((sum, num) => sum + num, 0)', 'objects.reduce((acc, obj) => ({...acc, [obj.id]: obj}), {})'],
            relatedConcepts: ['map', 'filter', 'accumulator'],
            complexity: 'intermediate'
          },
          'async/await': {
            content: 'Modern syntax for handling asynchronous operations in a synchronous-looking way',
            examples: ['const data = await fetch(url)', 'try { await operation() } catch (error) { }'],
            relatedConcepts: ['Promise', 'then', 'catch'],
            complexity: 'intermediate'
          },
          'destructuring': {
            content: 'Extract values from arrays or properties from objects into distinct variables',
            examples: ['const {name, age} = person', 'const [first, second] = array'],
            relatedConcepts: ['spread operator', 'rest parameters'],
            complexity: 'beginner'
          }
        },
        debugging: {
          'console.log': 'Use console.dir() for objects, console.table() for arrays',
          'debugger': 'Set breakpoints with debugger; statement in code',
          'performance': 'Use console.time() and console.timeEnd() for timing'
        },
        optimization: {
          'memoization': 'Cache expensive function results to avoid recalculation',
          'debouncing': 'Limit function execution frequency for performance',
          'lazy loading': 'Load resources only when needed'
        }
      },
      
      figma: {
        layout: {
          'auto-layout': {
            content: 'Create responsive frames that adapt to their content automatically',
            examples: ['Set spacing between items', 'Choose fill or hug contents'],
            relatedConcepts: ['constraints', 'alignment', 'distribution'],
            complexity: 'beginner'
          },
          'constraints': {
            content: 'Define how objects resize and reposition when their frame changes',
            examples: ['Pin to edges', 'Scale proportionally', 'Fix position'],
            relatedConcepts: ['auto-layout', 'responsive design'],
            complexity: 'beginner'
          }
        },
        components: {
          'variants': {
            content: 'Combine similar components into a single set with configurable properties',
            examples: ['Button with different states', 'Icon with size variants'],
            relatedConcepts: ['properties', 'instances', 'overrides'],
            complexity: 'intermediate'
          },
          'properties': {
            content: 'Create customizable aspects of components that can be changed in instances',
            examples: ['Boolean for show/hide', 'Text for labels', 'Instance swap for icons'],
            relatedConcepts: ['variants', 'component sets'],
            complexity: 'intermediate'
          }
        },
        prototyping: {
          'smart-animate': 'Animate between frames with matching layer names',
          'overlay': 'Show content on top of current frame',
          'scroll': 'Enable scrolling within frames'
        }
      },
      
      vscode: {
        navigation: {
          'quick-open': {
            content: 'Quickly open files, run commands, or navigate symbols',
            shortcuts: ['Ctrl+P (files)', 'Ctrl+Shift+P (commands)', 'Ctrl+T (symbols)'],
            relatedConcepts: ['fuzzy search', 'workspace'],
            complexity: 'beginner'
          },
          'go-to-definition': {
            content: 'Jump to where a symbol is defined',
            shortcuts: ['F12', 'Ctrl+Click'],
            relatedConcepts: ['peek definition', 'find references'],
            complexity: 'beginner'
          }
        },
        editing: {
          'multi-cursor': {
            content: 'Edit multiple locations simultaneously',
            shortcuts: ['Ctrl+Alt+Down/Up', 'Alt+Click', 'Ctrl+D (select next)'],
            relatedConcepts: ['column selection', 'find and replace'],
            complexity: 'intermediate'
          },
          'code-folding': {
            content: 'Collapse code sections to reduce visual complexity',
            shortcuts: ['Ctrl+Shift+[', 'Ctrl+Shift+]'],
            relatedConcepts: ['outline view', 'minimap'],
            complexity: 'beginner'
          }
        },
        debugging: {
          'breakpoints': 'Set conditional breakpoints for targeted debugging',
          'watch': 'Monitor variable values during execution',
          'call-stack': 'Navigate through function call hierarchy'
        }
      },
      
      design: {
        principles: {
          'contrast': 'Ensure sufficient color contrast for accessibility (4.5:1 minimum)',
          'hierarchy': 'Use size, weight, and spacing to guide attention',
          'alignment': 'Create visual connections through consistent positioning',
          'proximity': 'Group related elements together'
        },
        accessibility: {
          'alt-text': 'Provide descriptive alternative text for images',
          'focus-indicators': 'Ensure keyboard navigation is visible',
          'color-independence': 'Don\'t rely solely on color to convey information'
        }
      },
      
      productivity: {
        focus: {
          'pomodoro': 'Work in 25-minute focused intervals with 5-minute breaks',
          'time-blocking': 'Assign specific time slots to different types of work',
          'single-tasking': 'Focus on one task at a time for better quality'
        },
        organization: {
          'gtd': 'Getting Things Done - capture, clarify, organize, reflect, engage',
          'kanban': 'Visualize work stages: To Do, In Progress, Done',
          'eisenhower': 'Prioritize by urgency and importance matrix'
        }
      }
    };
  }
  
  /**
   * Generate contextual intervention based on current user state
   */
  async generateIntervention(context, userState) {
    if (!this.config.enabled || !this.shouldTriggerIntervention(userState)) {
      return null;
    }
    
    try {
      // Analyze context to determine relevant domain and topic
      const analyzedContext = await this.analyzeContext(context);
      if (!analyzedContext) return null;
      
      // Find most relevant knowledge
      const relevantKnowledge = this.findRelevantKnowledge(analyzedContext);
      if (!relevantKnowledge) return null;
      
      // Generate intervention based on knowledge and user state
      const intervention = this.createIntervention(relevantKnowledge, analyzedContext, userState);
      
      // Record intervention for learning
      this.recordIntervention(intervention, userState);
      
      this.emit('interventionGenerated', {
        intervention,
        context: analyzedContext,
        userState
      });
      
      return intervention;
      
    } catch (error) {
      console.error('Error generating intervention:', error);
      return null;
    }
  }
  
  shouldTriggerIntervention(userState) {
    const { fi, focusTrend, lastInteraction } = userState;
    
    // Trigger when FI is in pre-fracture range (0.6-0.8)
    if (fi < this.config.triggerThreshold || fi > 0.8) return false;
    
    // Check rate limiting
    const now = Date.now();
    const recentCount = Array.from(this.state.recentInterventions.values())
      .filter(timestamp => now - timestamp < 60000).length;
    
    if (recentCount >= this.config.maxInterventionsPerMinute) return false;
    
    // Consider focus trend - only intervene if focus is declining
    if (focusTrend && focusTrend > 0) return false;
    
    // Don't interrupt during active interaction
    if (lastInteraction && now - lastInteraction < 2000) return false;
    
    return true;
  }
  
  async analyzeContext(context) {
    if (!context) return null;
    
    const domain = this.detectDomain(context);
    const analyzer = this.contextAnalyzers[domain] || this.contextAnalyzers.general;
    
    return await analyzer(context);
  }
  
  detectDomain(context) {
    if (!context) return 'general';
    
    // Check for explicit domain
    if (context.domain) return context.domain;
    
    // Infer from context clues
    const text = (context.task || context.activity || context.currentFile || '').toLowerCase();
    
    if (text.includes('.js') || text.includes('javascript') || text.includes('node')) return 'javascript';
    if (text.includes('figma') || text.includes('design') || text.includes('prototype')) return 'figma';
    if (text.includes('vscode') || text.includes('editor') || text.includes('code')) return 'vscode';
    if (text.includes('html') || text.includes('css') || text.includes('web')) return 'web';
    
    return 'general';
  }
  
  async analyzeJavaScriptContext(context) {
    const task = (context.task || '').toLowerCase();
    const code = context.currentCode || '';
    const errorMessage = context.error || '';
    
    // Extract JavaScript concepts being used
    const concepts = [];
    if (task.includes('map') || code.includes('.map(')) concepts.push('Array.prototype.map');
    if (task.includes('reduce') || code.includes('.reduce(')) concepts.push('Array.prototype.reduce');
    if (task.includes('async') || code.includes('async') || code.includes('await')) concepts.push('async/await');
    if (code.includes('{') && code.includes('}') && code.includes('=')) concepts.push('destructuring');
    
    return {
      domain: 'javascript',
      concepts,
      difficulty: this.assessDifficulty(concepts),
      intent: this.inferIntent(task, errorMessage),
      confidence: 0.8
    };
  }
  
  async analyzeFigmaContext(context) {
    const task = (context.task || '').toLowerCase();
    const tool = context.currentTool || '';
    
    const concepts = [];
    if (task.includes('layout') || task.includes('responsive')) concepts.push('auto-layout');
    if (task.includes('component') || task.includes('variant')) concepts.push('variants');
    if (task.includes('prototype') || task.includes('animate')) concepts.push('smart-animate');
    
    return {
      domain: 'figma',
      concepts,
      intent: this.inferDesignIntent(task),
      confidence: 0.7
    };
  }
  
  async analyzeVSCodeContext(context) {
    const task = (context.task || '').toLowerCase();
    const command = context.lastCommand || '';
    
    const concepts = [];
    if (task.includes('navigate') || task.includes('find')) concepts.push('quick-open');
    if (task.includes('debug') || task.includes('breakpoint')) concepts.push('breakpoints');
    if (task.includes('edit') || task.includes('multiple')) concepts.push('multi-cursor');
    
    return {
      domain: 'vscode',
      concepts,
      intent: this.inferEditorIntent(task),
      confidence: 0.7
    };
  }
  
  async analyzeWebContext(context) {
    return {
      domain: 'web',
      concepts: ['html', 'css', 'accessibility'],
      intent: 'web-development',
      confidence: 0.6
    };
  }
  
  async analyzeGeneralContext(context) {
    return {
      domain: 'productivity',
      concepts: ['focus', 'organization'],
      intent: 'general-productivity',
      confidence: 0.5
    };
  }
  
  findRelevantKnowledge(analyzedContext) {
    const { domain, concepts, intent } = analyzedContext;
    const domainKnowledge = this.knowledgeBase[domain];
    
    if (!domainKnowledge) return null;
    
    // Find best matching concept
    for (const concept of concepts) {
      for (const category of Object.values(domainKnowledge)) {
        if (category[concept]) {
          return {
            concept,
            knowledge: category[concept],
            category: Object.keys(domainKnowledge).find(key => domainKnowledge[key] === category),
            relevance: this.calculateRelevance(concept, intent)
          };
        }
      }
    }
    
    // Fallback to general category knowledge
    if (domainKnowledge.general) {
      const generalKnowledge = Object.entries(domainKnowledge.general)[0];
      if (generalKnowledge) {
        return {
          concept: generalKnowledge[0],
          knowledge: generalKnowledge[1],
          category: 'general',
          relevance: 0.5
        };
      }
    }
    
    return null;
  }
  
  createIntervention(relevantKnowledge, context, userState) {
    const { concept, knowledge, category, relevance } = relevantKnowledge;
    
    // Format knowledge for presentation
    let content;
    if (typeof knowledge === 'object') {
      content = {
        title: concept.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: knowledge.content || knowledge,
        examples: knowledge.examples || [],
        relatedConcepts: knowledge.relatedConcepts || [],
        shortcuts: knowledge.shortcuts || [],
        complexity: knowledge.complexity || 'intermediate'
      };
    } else {
      content = {
        title: concept.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: knowledge,
        examples: [],
        relatedConcepts: [],
        shortcuts: [],
        complexity: 'general'
      };
    }
    
    // Determine intervention type based on context and user state
    const interventionType = this.determineInterventionType(userState, context);
    
    return {
      type: 'generative_intervention',
      subtype: interventionType,
      target: 'contextual_overlay',
      priority: Math.ceil(relevance * 10),
      timing: 'immediate',
      duration: 8000, // 8 seconds default display
      content,
      metadata: {
        domain: context.domain,
        concept,
        category,
        relevance,
        timestamp: Date.now(),
        userFI: userState.fi,
        triggerReason: 'focus_preservation'
      }
    };
  }
  
  determineInterventionType(userState, context) {
    const { fi, stressLevel, taskComplexity } = userState;
    
    if (fi < 0.7 && stressLevel < 0.5) return 'gentle_hint';
    if (fi < 0.75) return 'contextual_help';
    if (taskComplexity > 0.7) return 'detailed_guidance';
    
    return 'focused_tip';
  }
  
  calculateRelevance(concept, intent) {
    // Simple relevance scoring based on concept-intent matching
    const intentKeywords = intent.split(/[-_\s]+/);
    const conceptKeywords = concept.toLowerCase().split(/[._\s]+/);
    
    const matches = intentKeywords.filter(keyword => 
      conceptKeywords.some(ck => ck.includes(keyword) || keyword.includes(ck))
    );
    
    return Math.min(1.0, (matches.length / intentKeywords.length) + 0.3);
  }
  
  assessDifficulty(concepts) {
    const complexityMap = { beginner: 1, intermediate: 2, advanced: 3 };
    const difficulties = concepts.map(concept => {
      // Find concept in knowledge base and get complexity
      for (const domain of Object.values(this.knowledgeBase)) {
        for (const category of Object.values(domain)) {
          if (category[concept] && category[concept].complexity) {
            return complexityMap[category[concept].complexity] || 2;
          }
        }
      }
      return 2; // Default to intermediate
    });
    
    return difficulties.length ? Math.max(...difficulties) / 3 : 0.5;
  }
  
  inferIntent(task, errorMessage) {
    if (errorMessage) return 'error_resolution';
    if (task.includes('optim')) return 'optimization';
    if (task.includes('debug')) return 'debugging';
    if (task.includes('learn')) return 'learning';
    if (task.includes('implement')) return 'implementation';
    
    return 'general_development';
  }
  
  inferDesignIntent(task) {
    if (task.includes('prototype')) return 'prototyping';
    if (task.includes('component')) return 'component_design';
    if (task.includes('layout')) return 'layout_design';
    
    return 'general_design';
  }
  
  inferEditorIntent(task) {
    if (task.includes('navigate')) return 'navigation';
    if (task.includes('debug')) return 'debugging';
    if (task.includes('refactor')) return 'refactoring';
    
    return 'general_editing';
  }
  
  recordIntervention(intervention, userState) {
    const id = `${intervention.metadata.concept}_${Date.now()}`;
    this.state.recentInterventions.set(id, Date.now());
    
    // Clean up old interventions
    const cutoff = Date.now() - 300000; // 5 minutes
    for (const [key, timestamp] of this.state.recentInterventions) {
      if (timestamp < cutoff) {
        this.state.recentInterventions.delete(key);
      }
    }
    
    // Store for learning
    this.state.learningData.set(id, {
      intervention,
      userState: { ...userState },
      timestamp: Date.now()
    });
  }
  
  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }
  
  /**
   * Get intervention statistics
   */
  getStats() {
    const now = Date.now();
    const recentInterventions = Array.from(this.state.recentInterventions.values())
      .filter(timestamp => now - timestamp < 3600000); // Last hour
    
    return {
      totalInterventions: this.state.learningData.size,
      recentInterventions: recentInterventions.length,
      averageRelevance: this.calculateAverageRelevance(),
      domainDistribution: this.getDomainDistribution(),
      config: this.config
    };
  }
  
  calculateAverageRelevance() {
    const relevanceValues = Array.from(this.state.learningData.values())
      .map(data => data.intervention.metadata.relevance)
      .filter(rel => rel !== undefined);
    
    return relevanceValues.length ? 
      relevanceValues.reduce((sum, rel) => sum + rel, 0) / relevanceValues.length : 
      0;
  }
  
  getDomainDistribution() {
    const domains = {};
    
    for (const data of this.state.learningData.values()) {
      const domain = data.intervention.metadata.domain;
      domains[domain] = (domains[domain] || 0) + 1;
    }
    
    return domains;
  }
}