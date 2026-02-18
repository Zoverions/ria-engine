/**
 * Antifragile Learning Manager for RIA Engine v2.1
 * 
 * Transforms attention fractures from failure events into valuable training signals
 * for radical adaptation. Uses Reinforcement Learning to evolve the UI policy,
 * making the system stronger through adversity.
 * 
 * The system becomes antifragile by:
 * 1. Treating fractures as high-value learning opportunities
 * 2. Analyzing failure pathways to understand breakdown patterns
 * 3. Evolving interface policies to prevent similar failures
 * 4. Structurally re-architecting based on user-specific cognitive failure modes
 */

import { EventEmitter } from 'events';

export class AntifragileManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enabled: true,
      learningRate: 0.1,
      explorationRate: 0.15, // Epsilon for ε-greedy exploration
      explorationDecay: 0.995,
      memorySize: 1000,
      batchSize: 32,
      updateFrequency: 10, // Updates per fracture event
      
      // Fracture analysis parameters
      fractureThreshold: 0.85, // FI level considered a fracture
      preFrameAnalysis: 10, // Frames to analyze before fracture
      postFrameAnalysis: 5, // Frames to analyze after fracture
      
      // Policy evolution parameters
      policyUpdateThreshold: 5, // Fractures before policy update
      structuralChangeThreshold: 20, // Fractures before structural changes
      
      ...config
    };
    
    this.state = {
      // Reinforcement Learning state
      qTable: new Map(), // State-action value pairs
      experienceReplay: [], // Memory buffer for batch learning
      
      // Fracture tracking
      fractureHistory: [],
      recentFrames: [], // Rolling buffer of recent frames
      
      // Policy evolution
      currentPolicy: this.initializeDefaultPolicy(),
      policyHistory: [],
      failurePatterns: new Map(),
      
      // Learning metrics
      totalFractures: 0,
      preventedFractures: 0,
      adaptationCount: 0,
      lastPolicyUpdate: Date.now(),
      
      // User-specific patterns
      userCognitiveProfile: {
        vulnerableStates: new Map(),
        triggerSequences: [],
        optimalConfigurations: new Map(),
        personalityFactors: {}
      }
    };
    
    // Action space for RL agent
    this.actionSpace = [
      'reduce_complexity',
      'increase_spacing',
      'dim_periphery',
      'highlight_focus',
      'delay_notifications',
      'simplify_navigation',
      'increase_contrast',
      'reduce_animation',
      'group_related_elements',
      'provide_context_hint',
      'adjust_color_temperature',
      'modify_layout_density'
    ];
    
    // State features for RL
    this.stateFeatures = [
      'fracture_index',
      'stress_level',
      'task_complexity',
      'time_in_session',
      'recent_interactions',
      'notification_count',
      'ui_complexity',
      'cognitive_load_trend'
    ];
    
    console.log('🧬 AntifragileManager initialized with RL policy evolution');
  }
  
  /**
   * Process a frame and learn from potential fractures
   */
  async processFrame(frameData) {
    // Add frame to rolling buffer
    this.addFrameToBuffer(frameData);
    
    // Check for fracture event
    if (this.detectFracture(frameData)) {
      await this.handleFractureEvent(frameData);
    }
    
    // Continuous learning from experience
    if (this.state.experienceReplay.length >= this.config.batchSize) {
      await this.performBatchLearning();
    }
    
    // Evolve exploration rate
    this.state.explorationRate = Math.max(0.01, 
      this.state.explorationRate * this.config.explorationDecay);
  }
  
  addFrameToBuffer(frameData) {
    const frame = {
      ...frameData,
      timestamp: Date.now(),
      stateVector: this.extractStateVector(frameData)
    };
    
    this.state.recentFrames.push(frame);
    
    // Keep buffer size manageable
    if (this.state.recentFrames.length > this.config.preFrameAnalysis + this.config.postFrameAnalysis + 5) {
      this.state.recentFrames.shift();
    }
  }
  
  detectFracture(frameData) {
    const fi = frameData.fi || frameData.fractureIndex || 0;
    return fi > this.config.fractureThreshold;
  }
  
  async handleFractureEvent(fractureFrame) {
    this.state.totalFractures++;
    
    console.log(`💥 Fracture detected! FI: ${fractureFrame.fi?.toFixed(3)} - Initiating post-mortem analysis`);
    
    // Perform comprehensive fracture analysis
    const fractureAnalysis = await this.analyzeFracture(fractureFrame);
    
    // Store fracture for learning
    this.state.fractureHistory.push(fractureAnalysis);
    
    // Extract high-value learning signal
    const learningSignal = this.extractLearningSignal(fractureAnalysis);
    
    // Update RL policy based on failure
    await this.updatePolicyFromFailure(learningSignal);
    
    // Check for structural adaptation needs
    await this.evaluateStructuralChanges(fractureAnalysis);
    
    // Update user cognitive profile
    this.updateCognitiveProfile(fractureAnalysis);
    
    this.emit('fractureProcessed', {
      analysis: fractureAnalysis,
      learning: learningSignal,
      adaptations: this.state.adaptationCount
    });
  }
  
  async analyzeFracture(fractureFrame) {
    const fractureIndex = this.state.recentFrames.length - 1;
    
    // Get pre-fracture sequence
    const preFrames = this.state.recentFrames.slice(
      Math.max(0, fractureIndex - this.config.preFrameAnalysis),
      fractureIndex
    );
    
    // Analyze the pathway to failure
    const failurePathway = this.analyzeFailurePathway(preFrames, fractureFrame);
    
    // Identify contributing factors
    const contributingFactors = this.identifyContributingFactors(preFrames, fractureFrame);
    
    // Determine intervention opportunities
    const interventionPoints = this.findInterventionPoints(preFrames);
    
    return {
      timestamp: Date.now(),
      fractureFrame,
      preFrames,
      failurePathway,
      contributingFactors,
      interventionPoints,
      severity: this.calculateFractureSeverity(fractureFrame),
      context: this.extractFractureContext(fractureFrame)
    };
  }
  
  analyzeFailurePathway(preFrames, fractureFrame) {
    const pathway = {
      fiProgression: preFrames.map(f => f.fi || 0),
      stressProgression: preFrames.map(f => f.stressLevel || 0),
      complexityProgression: preFrames.map(f => f.taskComplexity || 0),
      interactionPattern: preFrames.map(f => f.lastInteraction || 0),
      
      // Calculate trends
      fiTrend: this.calculateTrend(preFrames.map(f => f.fi || 0)),
      accelerationPoint: this.findAccelerationPoint(preFrames),
      criticalThreshold: this.findCriticalThreshold(preFrames, fractureFrame)
    };
    
    return pathway;
  }
  
  identifyContributingFactors(preFrames, fractureFrame) {
    const factors = [];
    
    // UI complexity factors
    if (this.isHighComplexity(preFrames)) {
      factors.push({
        type: 'ui_complexity',
        severity: this.calculateComplexitySeverity(preFrames),
        description: 'High interface complexity contributed to cognitive overload'
      });
    }
    
    // Notification pressure
    if (this.hasNotificationPressure(preFrames)) {
      factors.push({
        type: 'notification_pressure',
        severity: this.calculateNotificationSeverity(preFrames),
        description: 'Excessive notifications disrupted focus'
      });
    }
    
    // Task switching
    if (this.hasTaskSwitching(preFrames)) {
      factors.push({
        type: 'task_switching',
        severity: this.calculateSwitchingSeverity(preFrames),
        description: 'Frequent task switching fragmentated attention'
      });
    }
    
    // Stress accumulation
    if (this.hasStressAccumulation(preFrames)) {
      factors.push({
        type: 'stress_accumulation',
        severity: this.calculateStressSeverity(preFrames),
        description: 'Gradual stress buildup reached breaking point'
      });
    }
    
    return factors;
  }
  
  findInterventionPoints(preFrames) {
    const points = [];
    
    for (let i = 1; i < preFrames.length; i++) {
      const frame = preFrames[i];
      const prevFrame = preFrames[i - 1];
      
      // Sudden FI spike
      if ((frame.fi || 0) - (prevFrame.fi || 0) > 0.15) {
        points.push({
          frameIndex: i,
          type: 'fi_spike',
          opportunity: 'Apply immediate complexity reduction',
          potential: 'high'
        });
      }
      
      // Stress threshold crossing
      if ((frame.stressLevel || 0) > 0.6 && (prevFrame.stressLevel || 0) <= 0.6) {
        points.push({
          frameIndex: i,
          type: 'stress_threshold',
          opportunity: 'Trigger calming intervention',
          potential: 'medium'
        });
      }
      
      // Task complexity increase
      if ((frame.taskComplexity || 0) > (prevFrame.taskComplexity || 0) + 0.2) {
        points.push({
          frameIndex: i,
          type: 'complexity_jump',
          opportunity: 'Provide contextual guidance',
          potential: 'high'
        });
      }
    }
    
    return points;
  }
  
  extractLearningSignal(fractureAnalysis) {
    const { failurePathway, contributingFactors, interventionPoints } = fractureAnalysis;
    
    // Create training examples for RL
    const trainingExamples = [];
    
    // Negative examples: states that led to fracture
    failurePathway.fiProgression.forEach((fi, index) => {
      if (fi > 0.5) { // States above moderate risk
        const state = this.extractStateVector(fractureAnalysis.preFrames[index] || {});
        const action = 'no_action'; // What was actually done (nothing)
        const reward = -Math.pow(fi, 2); // Negative reward proportional to FI squared
        
        trainingExamples.push({
          state,
          action,
          reward,
          nextState: this.extractStateVector(fractureAnalysis.preFrames[index + 1] || {}),
          terminal: index === failurePathway.fiProgression.length - 1
        });
      }
    });
    
    // Positive examples: potential intervention points
    interventionPoints.forEach(point => {
      const state = this.extractStateVector(fractureAnalysis.preFrames[point.frameIndex] || {});
      const action = this.mapOpportunityToAction(point.opportunity);
      const reward = this.calculateInterventionReward(point.potential);
      
      trainingExamples.push({
        state,
        action,
        reward,
        nextState: state, // Hypothetical - would need simulation
        terminal: false,
        hypothetical: true
      });
    });
    
    return {
      examples: trainingExamples,
      failurePattern: this.categorizeFailurePattern(contributingFactors),
      severity: fractureAnalysis.severity,
      learnability: this.assessLearnability(fractureAnalysis)
    };
  }
  
  async updatePolicyFromFailure(learningSignal) {
    // Add experiences to replay buffer
    learningSignal.examples.forEach(example => {
      this.state.experienceReplay.push(example);
    });
    
    // Limit memory size
    if (this.state.experienceReplay.length > this.config.memorySize) {
      this.state.experienceReplay = this.state.experienceReplay.slice(-this.config.memorySize);
    }
    
    // Immediate learning from high-severity fractures
    if (learningSignal.severity > 0.8) {
      await this.performUrgentLearning(learningSignal.examples);
    }
    
    // Update failure patterns
    this.updateFailurePatterns(learningSignal.failurePattern);
    
    this.state.adaptationCount++;
  }
  
  async performBatchLearning() {
    // Sample random batch from experience replay
    const batch = this.sampleBatch();
    
    // Update Q-values using temporal difference learning
    batch.forEach(experience => {
      this.updateQValue(experience);
    });
    
    // Update policy based on new Q-values
    this.updatePolicy();
  }
  
  async performUrgentLearning(urgentExamples) {
    console.log('🚨 Performing urgent learning from severe fracture');
    
    // Higher learning rate for urgent updates
    const originalLearningRate = this.config.learningRate;
    this.config.learningRate *= 2;
    
    urgentExamples.forEach(example => {
      if (!example.hypothetical) { // Only learn from real examples urgently
        this.updateQValue(example);
      }
    });
    
    this.updatePolicy();
    
    // Restore original learning rate
    this.config.learningRate = originalLearningRate;
  }
  
  updateQValue(experience) {
    const { state, action, reward, nextState, terminal } = experience;
    const stateKey = this.serializeState(state);
    const actionIndex = this.actionSpace.indexOf(action);
    
    if (actionIndex === -1) return; // Unknown action
    
    // Initialize Q-table entry if needed
    if (!this.state.qTable.has(stateKey)) {
      this.state.qTable.set(stateKey, new Array(this.actionSpace.length).fill(0));
    }
    
    const qValues = this.state.qTable.get(stateKey);
    const currentQ = qValues[actionIndex];
    
    let targetQ = reward;
    if (!terminal) {
      const nextStateKey = this.serializeState(nextState);
      const nextQValues = this.state.qTable.get(nextStateKey) || new Array(this.actionSpace.length).fill(0);
      const maxNextQ = Math.max(...nextQValues);
      targetQ = reward + 0.95 * maxNextQ; // 0.95 discount factor
    }
    
    // Temporal difference update
    qValues[actionIndex] = currentQ + this.config.learningRate * (targetQ - currentQ);
  }
  
  updatePolicy() {
    // Convert Q-table to policy (probability distribution over actions)
    const newPolicy = new Map();
    
    for (const [stateKey, qValues] of this.state.qTable) {
      // Softmax action selection with temperature
      const temperature = 1.0;
      const expValues = qValues.map(q => Math.exp(q / temperature));
      const sumExp = expValues.reduce((sum, exp) => sum + exp, 0);
      const probabilities = expValues.map(exp => exp / sumExp);
      
      newPolicy.set(stateKey, probabilities);
    }
    
    this.state.currentPolicy = newPolicy;
    this.state.lastPolicyUpdate = Date.now();
    
    this.emit('policyUpdated', {
      statesLearned: this.state.qTable.size,
      adaptationCount: this.state.adaptationCount
    });
  }
  
  async evaluateStructuralChanges(fractureAnalysis) {
    // Check if enough fractures have occurred to consider structural changes
    if (this.state.totalFractures % this.config.structuralChangeThreshold !== 0) {
      return;
    }
    
    console.log('🏗️ Evaluating structural adaptations after multiple fractures');
    
    // Analyze patterns across recent fractures
    const recentFractures = this.state.fractureHistory.slice(-this.config.structuralChangeThreshold);
    const structuralInsights = this.analyzeStructuralPatterns(recentFractures);
    
    // Propose structural changes
    const proposedChanges = this.proposeStructuralChanges(structuralInsights);
    
    if (proposedChanges.length > 0) {
      this.emit('structuralAdaptation', {
        insights: structuralInsights,
        proposedChanges,
        fractureCount: this.state.totalFractures
      });
    }
  }
  
  analyzeStructuralPatterns(fractures) {
    const patterns = {
      commonFactors: this.findCommonFactors(fractures),
      temporalPatterns: this.findTemporalPatterns(fractures),
      contextualTriggers: this.findContextualTriggers(fractures),
      userVulnerabilities: this.identifyUserVulnerabilities(fractures)
    };
    
    return patterns;
  }
  
  proposeStructuralChanges(insights) {
    const changes = [];
    
    // UI complexity consistently causing fractures
    if (insights.commonFactors.ui_complexity > 0.7) {
      changes.push({
        type: 'layout_simplification',
        description: 'Permanently reduce default UI complexity',
        confidence: insights.commonFactors.ui_complexity,
        impact: 'high'
      });
    }
    
    // Notification patterns causing issues
    if (insights.commonFactors.notification_pressure > 0.6) {
      changes.push({
        type: 'notification_policy',
        description: 'Implement stricter notification filtering',
        confidence: insights.commonFactors.notification_pressure,
        impact: 'medium'
      });
    }
    
    // Context-specific vulnerabilities
    insights.contextualTriggers.forEach(trigger => {
      if (trigger.frequency > 0.5) {
        changes.push({
          type: 'context_adaptation',
          description: `Adapt interface for ${trigger.context} context`,
          confidence: trigger.frequency,
          impact: 'medium',
          context: trigger.context
        });
      }
    });
    
    return changes;
  }
  
  updateCognitiveProfile(fractureAnalysis) {
    const profile = this.state.userCognitiveProfile;
    
    // Update vulnerable states
    const state = this.extractStateVector(fractureAnalysis.fractureFrame);
    const stateKey = this.serializeState(state);
    
    profile.vulnerableStates.set(stateKey, 
      (profile.vulnerableStates.get(stateKey) || 0) + 1);
    
    // Update trigger sequences
    if (fractureAnalysis.failurePathway.fiProgression.length > 2) {
      const sequence = fractureAnalysis.failurePathway.fiProgression
        .slice(-3) // Last 3 FI values
        .map(fi => Math.round(fi * 10) / 10); // Discretize
      
      const existingSequence = profile.triggerSequences.find(seq => 
        JSON.stringify(seq.pattern) === JSON.stringify(sequence));
      
      if (existingSequence) {
        existingSequence.count++;
      } else {
        profile.triggerSequences.push({
          pattern: sequence,
          count: 1,
          lastSeen: Date.now()
        });
      }
    }
    
    // Update personality factors
    this.updatePersonalityFactors(fractureAnalysis);
  }
  
  updatePersonalityFactors(fractureAnalysis) {
    const factors = this.state.userCognitiveProfile.personalityFactors;
    
    // Stress sensitivity
    const stressContribution = fractureAnalysis.contributingFactors
      .find(f => f.type === 'stress_accumulation');
    if (stressContribution) {
      factors.stressSensitivity = (factors.stressSensitivity || 0.5) + 
        stressContribution.severity * 0.1;
    }
    
    // Complexity tolerance
    const complexityContribution = fractureAnalysis.contributingFactors
      .find(f => f.type === 'ui_complexity');
    if (complexityContribution) {
      factors.complexityTolerance = (factors.complexityTolerance || 0.5) - 
        complexityContribution.severity * 0.1;
    }
    
    // Notification sensitivity
    const notificationContribution = fractureAnalysis.contributingFactors
      .find(f => f.type === 'notification_pressure');
    if (notificationContribution) {
      factors.notificationSensitivity = (factors.notificationSensitivity || 0.5) + 
        notificationContribution.severity * 0.1;
    }
    
    // Clamp factors to valid range
    Object.keys(factors).forEach(key => {
      factors[key] = Math.max(0, Math.min(1, factors[key]));
    });
  }
  
  /**
   * Get optimal action for current state using learned policy
   */
  getOptimalAction(currentState) {
    const stateKey = this.serializeState(this.extractStateVector(currentState));
    const probabilities = this.state.currentPolicy.get(stateKey);
    
    if (!probabilities) {
      // Unknown state - use exploration
      return this.actionSpace[Math.floor(Math.random() * this.actionSpace.length)];
    }
    
    // ε-greedy action selection
    if (Math.random() < this.state.explorationRate) {
      // Explore
      return this.actionSpace[Math.floor(Math.random() * this.actionSpace.length)];
    } else {
      // Exploit - choose action with highest probability
      const maxProbIndex = probabilities.indexOf(Math.max(...probabilities));
      return this.actionSpace[maxProbIndex];
    }
  }
  
  /**
   * Helper methods for feature extraction and state management
   */
  extractStateVector(frameData) {
    return [
      frameData.fi || frameData.fractureIndex || 0,
      frameData.stressLevel || 0,
      frameData.taskComplexity || 0,
      this.normalizeTimeInSession(frameData.timeInSession || 0),
      this.normalizeInteractions(frameData.recentInteractions || 0),
      this.normalizeNotifications(frameData.notificationCount || 0),
      frameData.uiComplexity || 0,
      frameData.cognitiveLoadTrend || 0
    ];
  }
  
  serializeState(stateVector) {
    // Discretize continuous values for Q-table keys
    return stateVector.map(value => Math.round(value * 10) / 10).join(',');
  }
  
  sampleBatch() {
    const batchSize = Math.min(this.config.batchSize, this.state.experienceReplay.length);
    const batch = [];
    
    for (let i = 0; i < batchSize; i++) {
      const randomIndex = Math.floor(Math.random() * this.state.experienceReplay.length);
      batch.push(this.state.experienceReplay[randomIndex]);
    }
    
    return batch;
  }
  
  initializeDefaultPolicy() {
    // Start with uniform random policy
    return new Map();
  }
  
  // Utility methods for pattern analysis
  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, y) => sum + y, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }
  
  findAccelerationPoint(frames) {
    const fiValues = frames.map(f => f.fi || 0);
    let maxAcceleration = 0;
    let accelerationPoint = 0;
    
    for (let i = 2; i < fiValues.length; i++) {
      const acceleration = fiValues[i] - 2 * fiValues[i - 1] + fiValues[i - 2];
      if (acceleration > maxAcceleration) {
        maxAcceleration = acceleration;
        accelerationPoint = i;
      }
    }
    
    return accelerationPoint;
  }
  
  // Additional helper methods
  normalizeTimeInSession(time) {
    return Math.min(1, time / 3600000); // Normalize to 1 hour max
  }
  
  normalizeInteractions(interactions) {
    return Math.min(1, interactions / 100); // Normalize to 100 interactions max
  }
  
  normalizeNotifications(notifications) {
    return Math.min(1, notifications / 20); // Normalize to 20 notifications max
  }
  
  /**
   * Get comprehensive learning status
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      totalFractures: this.state.totalFractures,
      preventedFractures: this.state.preventedFractures,
      adaptationCount: this.state.adaptationCount,
      explorationRate: this.state.explorationRate,
      qTableSize: this.state.qTable.size,
      experienceBufferSize: this.state.experienceReplay.length,
      lastPolicyUpdate: this.state.lastPolicyUpdate,
      cognitiveProfile: this.state.userCognitiveProfile,
      recentFractureRate: this.calculateRecentFractureRate(),
      learningEffectiveness: this.calculateLearningEffectiveness()
    };
  }
  
  calculateRecentFractureRate() {
    const recentWindow = 3600000; // 1 hour
    const now = Date.now();
    const recentFractures = this.state.fractureHistory.filter(
      f => now - f.timestamp < recentWindow
    );
    
    return recentFractures.length / (recentWindow / 60000); // Fractures per minute
  }
  
  calculateLearningEffectiveness() {
    if (this.state.totalFractures < 5) return 0; // Need minimum data
    
    const recentFractures = this.state.fractureHistory.slice(-10);
    const olderFractures = this.state.fractureHistory.slice(-20, -10);
    
    if (olderFractures.length === 0) return 0;
    
    const recentAvgSeverity = recentFractures.reduce((sum, f) => sum + f.severity, 0) / recentFractures.length;
    const olderAvgSeverity = olderFractures.reduce((sum, f) => sum + f.severity, 0) / olderFractures.length;
    
    // Effectiveness is reduction in severity
    return Math.max(0, (olderAvgSeverity - recentAvgSeverity) / olderAvgSeverity);
  }
  
  // Placeholder implementations for pattern analysis methods
  isHighComplexity(frames) { return frames.some(f => (f.uiComplexity || 0) > 0.7); }
  hasNotificationPressure(frames) { return frames.some(f => (f.notificationCount || 0) > 5); }
  hasTaskSwitching(frames) { return frames.some(f => (f.taskSwitches || 0) > 2); }
  hasStressAccumulation(frames) { return frames.some(f => (f.stressLevel || 0) > 0.6); }
  
  calculateComplexitySeverity(frames) { return Math.max(...frames.map(f => f.uiComplexity || 0)); }
  calculateNotificationSeverity(frames) { return Math.max(...frames.map(f => (f.notificationCount || 0) / 10)); }
  calculateSwitchingSeverity(frames) { return Math.max(...frames.map(f => (f.taskSwitches || 0) / 5)); }
  calculateStressSeverity(frames) { return Math.max(...frames.map(f => f.stressLevel || 0)); }
  
  calculateFractureSeverity(frame) { return frame.fi || 0; }
  extractFractureContext(frame) { return { domain: frame.domain || 'unknown', task: frame.task || 'unknown' }; }
  categorizeFailurePattern(factors) { return factors.map(f => f.type).join('_'); }
  assessLearnability(analysis) { return analysis.interventionPoints.length > 0 ? 0.8 : 0.3; }
  
  mapOpportunityToAction(opportunity) {
    const mapping = {
      'Apply immediate complexity reduction': 'reduce_complexity',
      'Trigger calming intervention': 'dim_periphery',
      'Provide contextual guidance': 'provide_context_hint'
    };
    return mapping[opportunity] || 'reduce_complexity';
  }
  
  calculateInterventionReward(potential) {
    const rewards = { high: 0.8, medium: 0.5, low: 0.2 };
    return rewards[potential] || 0.2;
  }
  
  updateFailurePatterns(pattern) {
    const count = this.state.failurePatterns.get(pattern) || 0;
    this.state.failurePatterns.set(pattern, count + 1);
  }
  
  findCommonFactors(fractures) {
    const factorCounts = {};
    fractures.forEach(f => {
      f.contributingFactors.forEach(factor => {
        factorCounts[factor.type] = (factorCounts[factor.type] || 0) + 1;
      });
    });
    
    const total = fractures.length;
    const commonFactors = {};
    Object.keys(factorCounts).forEach(type => {
      commonFactors[type] = factorCounts[type] / total;
    });
    
    return commonFactors;
  }
  
  findTemporalPatterns(fractures) {
    if (fractures.length < 3) return [];

    const timestamps = fractures.map(f => f.timestamp).sort((a, b) => a - b);
    const intervals = [];

    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }

    // Check for periodicity
    const meanInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const stdDev = Math.sqrt(intervals.reduce((sum, val) => sum + Math.pow(val - meanInterval, 2), 0) / intervals.length);

    const patterns = [];

    // If standard deviation is low relative to mean, it's periodic
    if (stdDev < meanInterval * 0.2) {
      patterns.push({
        type: 'periodic_fracture',
        interval: meanInterval,
        confidence: 1 - (stdDev / meanInterval)
      });
    }

    // Check for bursts
    const burstThreshold = meanInterval * 0.5;
    const bursts = intervals.filter(interval => interval < burstThreshold);

    if (bursts.length > intervals.length * 0.3) {
      patterns.push({
        type: 'burst_pattern',
        intensity: bursts.length / intervals.length,
        confidence: 0.8
      });
    }

    return patterns;
  }

  findContextualTriggers(fractures) {
    const triggers = new Map();

    fractures.forEach(f => {
      const context = f.context;
      const key = `${context.domain}:${context.task}`;
      triggers.set(key, (triggers.get(key) || 0) + 1);
    });

    const total = fractures.length;
    const significantTriggers = [];

    triggers.forEach((count, key) => {
      const frequency = count / total;
      if (frequency > 0.3) {
        const [domain, task] = key.split(':');
        significantTriggers.push({
          context: key,
          domain,
          task,
          frequency,
          count
        });
      }
    });

    return significantTriggers;
  }

  identifyUserVulnerabilities(fractures) {
    const factors = this.state.userCognitiveProfile.personalityFactors;
    const vulnerabilities = [];

    if (factors.stressSensitivity > 0.7) {
      vulnerabilities.push({
        type: 'high_stress_sensitivity',
        level: factors.stressSensitivity,
        implication: 'Requires earlier stress mitigation'
      });
    }

    if (factors.complexityTolerance < 0.3) {
      vulnerabilities.push({
        type: 'low_complexity_tolerance',
        level: factors.complexityTolerance,
        implication: 'Requires aggressive simplification'
      });
    }

    if (factors.notificationSensitivity > 0.7) {
      vulnerabilities.push({
        type: 'notification_distractibility',
        level: factors.notificationSensitivity,
        implication: 'Requires strict notification filtering'
      });
    }

    return vulnerabilities;
  }

  findCriticalThreshold(preFrames, fractureFrame) {
    // Dynamic threshold detection
    // Look for the point where acceleration spiked before the fracture
    const fiValues = preFrames.map(f => f.fi || 0);
    let maxAccel = 0;
    let criticalIndex = -1;

    for (let i = 2; i < fiValues.length; i++) {
      const accel = fiValues[i] - 2 * fiValues[i - 1] + fiValues[i - 2];
      if (accel > maxAccel) {
        maxAccel = accel;
        criticalIndex = i;
      }
    }

    if (criticalIndex !== -1 && criticalIndex < fiValues.length) {
      return fiValues[criticalIndex];
    }

    // Fallback to default
    return this.config.fractureThreshold;
  }
}