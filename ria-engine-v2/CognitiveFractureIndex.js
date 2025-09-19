/**
 * Cognitive Fracture Index - Educational Learning State Analysis
 *
 * Applies RIA architecture to analyze student learning patterns and detect
 * cognitive resonance fractures. Monitors learning effectiveness as a resonant
 * field and provides predictive insights into learning difficulties.
 *
 * Core Features:
 * - Real-time CFI calculation from learning interaction data
 * - Multi-modal learning state analysis (attention, comprehension, engagement)
 * - Learning pattern recognition and adaptation
 * - Cognitive load assessment and optimization
 * - Predictive learning intervention recommendations
 */

import { EventEmitter } from 'events';

export class CognitiveFractureIndex extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      // CFI calculation parameters
      windowSize: 300, // 5 minutes of data
      updateInterval: 1000, // 1 second updates
      learningThresholds: {
        attention: { optimal: 0.8, critical: 0.3 },
        comprehension: { optimal: 0.85, critical: 0.4 },
        engagement: { optimal: 0.75, critical: 0.25 },
        cognitiveLoad: { optimal: 0.6, critical: 0.9 }
      },

      // Analysis weights
      weights: {
        attention: 0.3,
        comprehension: 0.3,
        engagement: 0.25,
        cognitiveLoad: 0.15
      },

      // Learning state classification
      cfiThresholds: {
        optimal: 0.2,    // Excellent learning state
        good: 0.4,       // Good learning state
        moderate: 0.6,   // Moderate learning difficulties
        poor: 0.8,       // Significant learning difficulties
        critical: 0.9    // Critical learning fracture
      },

      ...config
    };

    // Learning data buffers
    this.buffers = {
      attention: [],
      comprehension: [],
      engagement: [],
      cognitiveLoad: [],
      interactionPatterns: [],
      timeSeries: []
    };

    // CFI calculation state
    this.state = {
      currentCFI: 0,
      cfiLevel: 'optimal',
      trend: 'stable',
      confidence: 0,
      lastUpdate: null,
      components: {
        attentionScore: 0,
        comprehensionScore: 0,
        engagementScore: 0,
        cognitiveLoadScore: 0
      }
    };

    // Learning pattern analysis
    this.patterns = {
      attentionSpans: [],
      comprehensionTrends: [],
      engagementCycles: [],
      fatiguePatterns: [],
      learningVelocity: []
    };

    // Student profile
    this.studentProfile = {
      baselineMetrics: {},
      learningStyle: 'unknown',
      difficultyPatterns: [],
      adaptationHistory: [],
      performanceTrajectory: []
    };

    // Analysis metrics
    this.metrics = {
      totalReadings: 0,
      patternDetections: 0,
      interventionSuggestions: 0,
      accuracyScore: 0,
      adaptationRate: 0
    };

    this.setupEventHandlers();
  }

  /**
   * Add learning interaction data
   */
  async addLearningData(data, timestamp = Date.now()) {
    const learningFrame = {
      timestamp,
      attention: data.attention || 0,
      comprehension: data.comprehension || 0,
      engagement: data.engagement || 0,
      cognitiveLoad: data.cognitiveLoad || 0,
      interactionType: data.interactionType || 'unknown',
      contentType: data.contentType || 'unknown',
      responseTime: data.responseTime || 0,
      correctness: data.correctness || 0,
      metadata: data.metadata || {}
    };

    // Add to buffers
    this.addToBuffer('attention', learningFrame.attention, timestamp);
    this.addToBuffer('comprehension', learningFrame.comprehension, timestamp);
    this.addToBuffer('engagement', learningFrame.engagement, timestamp);
    this.addToBuffer('cognitiveLoad', learningFrame.cognitiveLoad, timestamp);
    this.buffers.interactionPatterns.push(learningFrame);
    this.buffers.timeSeries.push(learningFrame);

    // Maintain buffer sizes
    this.maintainBuffers();

    // Update patterns
    await this.updateLearningPatterns(learningFrame);

    // Calculate CFI
    const cfiResult = await this.calculateCFI();

    if (cfiResult) {
      this.processCFIUpdate(cfiResult);
    }

    this.metrics.totalReadings++;

    this.emit('learningDataAdded', {
      frame: learningFrame,
      cfi: this.state.currentCFI,
      level: this.state.cfiLevel
    });
  }

  /**
   * Calculate Cognitive Fracture Index
   */
  async calculateCFI() {
    if (this.buffers.attention.length < 10) return null; // Need minimum data

    // Calculate component scores
    const attentionScore = this.calculateAttentionScore();
    const comprehensionScore = this.calculateComprehensionScore();
    const engagementScore = this.calculateEngagementScore();
    const cognitiveLoadScore = this.calculateCognitiveLoadScore();

    // Weighted composite CFI
    const cfi = (
      attentionScore * this.config.weights.attention +
      comprehensionScore * this.config.weights.comprehension +
      engagementScore * this.config.weights.engagement +
      cognitiveLoadScore * this.config.weights.cognitiveLoad
    );

    // Determine CFI level
    let level = 'optimal';
    if (cfi >= this.config.cfiThresholds.critical) level = 'critical';
    else if (cfi >= this.config.cfiThresholds.poor) level = 'poor';
    else if (cfi >= this.config.cfiThresholds.moderate) level = 'moderate';
    else if (cfi >= this.config.cfiThresholds.good) level = 'good';

    // Calculate trend
    const trend = this.calculateCFITrend(cfi);

    // Calculate confidence
    const confidence = this.calculateCFIConfidence();

    const result = {
      cfi,
      level,
      trend,
      confidence,
      components: {
        attentionScore,
        comprehensionScore,
        engagementScore,
        cognitiveLoadScore
      },
      timestamp: Date.now()
    };

    return result;
  }

  /**
   * Calculate attention score component
   */
  calculateAttentionScore() {
    const attentionData = this.buffers.attention.slice(-this.config.windowSize);
    if (attentionData.length === 0) return 0;

    // Spectral analysis of attention patterns
    const spectralSlope = this.calculateSpectralSlope(attentionData);
    const autocorrelation = this.calculateAutocorrelation(attentionData);
    const variability = this.calculateVariability(attentionData);

    // Attention fracture indicators:
    // - High spectral slope = rapid attention changes (fractured)
    // - Low autocorrelation = inconsistent attention (fractured)
    // - High variability = unstable attention (fractured)

    const spectralScore = Math.min(Math.abs(spectralSlope) / 2, 1); // Normalize spectral slope
    const autocorrelationScore = 1 - autocorrelation; // Low autocorrelation = high fracture
    const variabilityScore = Math.min(variability / 0.5, 1); // Normalize variability

    // Weighted combination
    const attentionFracture = (
      spectralScore * 0.4 +
      autocorrelationScore * 0.4 +
      variabilityScore * 0.2
    );

    return Math.min(attentionFracture, 1);
  }

  /**
   * Calculate comprehension score component
   */
  calculateComprehensionScore() {
    const comprehensionData = this.buffers.comprehension.slice(-this.config.windowSize);
    if (comprehensionData.length === 0) return 0;

    // Analyze comprehension patterns
    const trend = this.calculateTrend(comprehensionData);
    const consistency = this.calculateConsistency(comprehensionData);
    const recentPerformance = comprehensionData.slice(-10).reduce((a, b) => a + b, 0) / 10;

    // Comprehension fracture indicators:
    // - Negative trend = declining comprehension (fractured)
    // - Low consistency = variable understanding (fractured)
    // - Low recent performance = current difficulties (fractured)

    const trendScore = trend < 0 ? Math.abs(trend) * 2 : 0; // Negative trend indicates fracture
    const consistencyScore = 1 - consistency; // Low consistency = high fracture
    const performanceScore = 1 - recentPerformance; // Low performance = high fracture

    const comprehensionFracture = (
      trendScore * 0.4 +
      consistencyScore * 0.3 +
      performanceScore * 0.3
    );

    return Math.min(comprehensionFracture, 1);
  }

  /**
   * Calculate engagement score component
   */
  calculateEngagementScore() {
    const engagementData = this.buffers.engagement.slice(-this.config.windowSize);
    if (engagementData.length === 0) return 0;

    // Analyze engagement patterns
    const meanEngagement = engagementData.reduce((a, b) => a + b, 0) / engagementData.length;
    const engagementVariability = this.calculateVariability(engagementData);
    const sustainedAttention = this.calculateSustainedAttention(engagementData);

    // Engagement fracture indicators:
    // - Low mean engagement = disengaged learning (fractured)
    // - High variability = inconsistent participation (fractured)
    // - Low sustained attention = attention lapses (fractured)

    const meanScore = 1 - meanEngagement; // Low engagement = high fracture
    const variabilityScore = Math.min(engagementVariability / 0.3, 1);
    const sustainedScore = 1 - sustainedAttention; // Low sustained attention = high fracture

    const engagementFracture = (
      meanScore * 0.4 +
      variabilityScore * 0.3 +
      sustainedScore * 0.3
    );

    return Math.min(engagementFracture, 1);
  }

  /**
   * Calculate cognitive load score component
   */
  calculateCognitiveLoadScore() {
    const loadData = this.buffers.cognitiveLoad.slice(-this.config.windowSize);
    if (loadData.length === 0) return 0;

    // Analyze cognitive load patterns
    const meanLoad = loadData.reduce((a, b) => a + b, 0) / loadData.length;
    const loadTrend = this.calculateTrend(loadData);
    const loadPeaks = this.calculateLoadPeaks(loadData);

    // Cognitive load fracture indicators:
    // - High mean load = cognitive overload (fractured)
    // - Increasing load trend = accumulating fatigue (fractured)
    // - Frequent load peaks = inconsistent processing (fractured)

    const meanScore = Math.min(meanLoad / this.config.learningThresholds.cognitiveLoad.critical, 1);
    const trendScore = loadTrend > 0 ? loadTrend * 2 : 0; // Increasing load = fracture
    const peakScore = Math.min(loadPeaks / 5, 1); // Many peaks = high fracture

    const loadFracture = (
      meanScore * 0.5 +
      trendScore * 0.3 +
      peakScore * 0.2
    );

    return Math.min(loadFracture, 1);
  }

  /**
   * Calculate spectral slope for frequency domain analysis
   */
  calculateSpectralSlope(data) {
    if (data.length < 10) return 0;

    // Simple spectral slope approximation using linear regression on log-log spectrum
    // In practice, this would use proper FFT analysis
    const logData = data.map((val, i) => Math.log(Math.abs(val) + 1e-10));
    const frequencies = data.map((_, i) => Math.log(i + 1));

    const n = logData.length;
    const sumX = frequencies.reduce((a, b) => a + b, 0);
    const sumY = logData.reduce((a, b) => a + b, 0);
    const sumXY = frequencies.reduce((sum, x, i) => sum + x * logData[i], 0);
    const sumXX = frequencies.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  /**
   * Calculate autocorrelation
   */
  calculateAutocorrelation(data, lag = 1) {
    if (data.length < lag + 1) return 0;

    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;

    if (variance === 0) return 1;

    let covariance = 0;
    for (let i = 0; i < data.length - lag; i++) {
      covariance += (data[i] - mean) * (data[i + lag] - mean);
    }
    covariance /= (data.length - lag);

    return covariance / variance;
  }

  /**
   * Calculate variability (coefficient of variation)
   */
  calculateVariability(data) {
    if (data.length === 0) return 0;

    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    if (mean === 0) return 0;

    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);

    return stdDev / mean;
  }

  /**
   * Calculate trend using linear regression
   */
  calculateTrend(data) {
    if (data.length < 2) return 0;

    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  /**
   * Calculate consistency (1 - coefficient of variation)
   */
  calculateConsistency(data) {
    return 1 - this.calculateVariability(data);
  }

  /**
   * Calculate sustained attention periods
   */
  calculateSustainedAttention(data) {
    if (data.length === 0) return 0;

    // Count periods of sustained high attention
    let sustainedPeriods = 0;
    let currentStreak = 0;
    const threshold = this.config.learningThresholds.attention.optimal;

    for (const value of data) {
      if (value >= threshold) {
        currentStreak++;
        if (currentStreak >= 5) { // 5 consecutive high attention points
          sustainedPeriods++;
        }
      } else {
        currentStreak = 0;
      }
    }

    return sustainedPeriods / (data.length / 5); // Normalize by expected periods
  }

  /**
   * Calculate cognitive load peaks
   */
  calculateLoadPeaks(data) {
    if (data.length === 0) return 0;

    const threshold = this.config.learningThresholds.cognitiveLoad.critical;
    return data.filter(val => val >= threshold).length;
  }

  /**
   * Calculate CFI trend
   */
  calculateCFITrend(currentCFI) {
    if (!this.state.lastUpdate) return 'stable';

    const timeDiff = Date.now() - this.state.lastUpdate;
    const cfiDiff = currentCFI - this.state.currentCFI;

    if (Math.abs(cfiDiff) < 0.05) return 'stable';
    if (cfiDiff > 0.1) return 'worsening';
    if (cfiDiff < -0.1) return 'improving';

    return cfiDiff > 0 ? 'slightly_worsening' : 'slightly_improving';
  }

  /**
   * Calculate CFI confidence
   */
  calculateCFIConfidence() {
    const dataPoints = Math.min(
      this.buffers.attention.length,
      this.buffers.comprehension.length,
      this.buffers.engagement.length,
      this.buffers.cognitiveLoad.length
    );

    // Confidence increases with more data points
    const dataConfidence = Math.min(dataPoints / 50, 1); // 50 points for full confidence

    // Confidence based on data consistency
    const consistencyConfidence = (
      this.calculateConsistency(this.buffers.attention) +
      this.calculateConsistency(this.buffers.comprehension) +
      this.calculateConsistency(this.buffers.engagement) +
      this.calculateConsistency(this.buffers.cognitiveLoad)
    ) / 4;

    return (dataConfidence + consistencyConfidence) / 2;
  }

  /**
   * Update learning patterns
   */
  async updateLearningPatterns(frame) {
    // Update attention span patterns
    this.patterns.attentionSpans.push({
      duration: this.calculateAttentionSpan(frame),
      quality: frame.attention,
      timestamp: frame.timestamp
    });

    // Update comprehension trends
    this.patterns.comprehensionTrends.push({
      level: frame.comprehension,
      trend: this.calculateTrend(this.buffers.comprehension.slice(-20)),
      timestamp: frame.timestamp
    });

    // Update engagement cycles
    this.patterns.engagementCycles.push({
      level: frame.engagement,
      cycle: this.detectEngagementCycle(),
      timestamp: frame.timestamp
    });

    // Maintain pattern history
    this.maintainPatterns();

    this.metrics.patternDetections++;
  }

  /**
   * Calculate attention span
   */
  calculateAttentionSpan(frame) {
    // Simplified attention span calculation
    // In practice, this would analyze sustained attention periods
    return frame.attention * 300; // Scale to seconds
  }

  /**
   * Detect engagement cycle
   */
  detectEngagementCycle() {
    const recent = this.buffers.engagement.slice(-20);
    if (recent.length < 20) return 'unknown';

    const trend = this.calculateTrend(recent);
    if (trend > 0.01) return 'increasing';
    if (trend < -0.01) return 'decreasing';
    return 'stable';
  }

  /**
   * Add data to buffer
   */
  addToBuffer(type, value, timestamp) {
    this.buffers[type].push({ value, timestamp });

    // Maintain buffer size
    if (this.buffers[type].length > this.config.windowSize * 2) {
      this.buffers[type].shift();
    }
  }

  /**
   * Maintain buffer sizes
   */
  maintainBuffers() {
    for (const [type, buffer] of Object.entries(this.buffers)) {
      if (Array.isArray(buffer)) {
        if (buffer.length > this.config.windowSize * 2) {
          buffer.splice(0, buffer.length - this.config.windowSize * 2);
        }
      }
    }
  }

  /**
   * Maintain pattern history sizes
   */
  maintainPatterns() {
    const maxPatterns = 100;

    for (const [type, pattern] of Object.entries(this.patterns)) {
      if (pattern.length > maxPatterns) {
        pattern.splice(0, pattern.length - maxPatterns);
      }
    }
  }

  /**
   * Process CFI update
   */
  processCFIUpdate(cfiResult) {
    const { cfi, level, trend, confidence, components } = cfiResult;

    // Update state
    this.state.currentCFI = cfi;
    this.state.cfiLevel = level;
    this.state.trend = trend;
    this.state.confidence = confidence;
    this.state.components = components;
    this.state.lastUpdate = Date.now();

    // Emit CFI update
    this.emit('cfiUpdate', {
      cfi: cfiResult,
      studentProfile: this.getStudentProfile(),
      interventionSuggestions: this.generateInterventionSuggestions(cfiResult)
    });
  }

  /**
   * Generate intervention suggestions
   */
  generateInterventionSuggestions(cfiResult) {
    const { cfi, level, components } = cfiResult;
    const suggestions = [];

    if (components.attentionScore > 0.7) {
      suggestions.push({
        type: 'attention_intervention',
        priority: 'high',
        description: 'Attention fracture detected - implement focus enhancement techniques',
        actions: [
          'Break content into smaller chunks',
          'Add interactive elements',
          'Implement attention checks',
          'Use multimedia reinforcement'
        ]
      });
    }

    if (components.comprehensionScore > 0.6) {
      suggestions.push({
        type: 'comprehension_support',
        priority: 'high',
        description: 'Comprehension difficulties detected - provide additional scaffolding',
        actions: [
          'Add prerequisite review',
          'Use analogies and examples',
          'Implement peer learning',
          'Provide guided practice'
        ]
      });
    }

    if (components.engagementScore > 0.6) {
      suggestions.push({
        type: 'engagement_boosting',
        priority: 'medium',
        description: 'Low engagement detected - increase motivation and participation',
        actions: [
          'Gamify learning activities',
          'Connect to real-world applications',
          'Provide choice and autonomy',
          'Celebrate progress and achievements'
        ]
      });
    }

    if (components.cognitiveLoadScore > 0.7) {
      suggestions.push({
        type: 'cognitive_unloading',
        priority: 'high',
        description: 'Cognitive overload detected - reduce processing demands',
        actions: [
          'Simplify content presentation',
          'Break complex tasks into steps',
          'Provide worked examples',
          'Allow more processing time'
        ]
      });
    }

    this.metrics.interventionSuggestions += suggestions.length;

    return suggestions;
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    // CFI-specific events are handled in processCFIUpdate
  }

  /**
   * Get current CFI status
   */
  getCFIStatus() {
    return {
      ...this.state,
      metrics: this.metrics,
      patterns: {
        attentionSpans: this.patterns.attentionSpans.length,
        comprehensionTrends: this.patterns.comprehensionTrends.length,
        engagementCycles: this.patterns.engagementCycles.length,
        fatiguePatterns: this.patterns.fatiguePatterns.length
      },
      buffers: {
        attention: this.buffers.attention.length,
        comprehension: this.buffers.comprehension.length,
        engagement: this.buffers.engagement.length,
        cognitiveLoad: this.buffers.cognitiveLoad.length,
        interactions: this.buffers.interactionPatterns.length
      }
    };
  }

  /**
   * Get student profile
   */
  getStudentProfile() {
    return {
      ...this.studentProfile,
      currentCFI: this.state.currentCFI,
      cfiLevel: this.state.cfiLevel,
      learningPatterns: this.analyzeLearningPatterns(),
      recommendations: this.generateLearningRecommendations()
    };
  }

  /**
   * Analyze learning patterns
   */
  analyzeLearningPatterns() {
    return {
      attentionPattern: this.analyzeAttentionPattern(),
      comprehensionPattern: this.analyzeComprehensionPattern(),
      engagementPattern: this.analyzeEngagementPattern(),
      cognitiveLoadPattern: this.analyzeCognitiveLoadPattern()
    };
  }

  /**
   * Analyze attention pattern
   */
  analyzeAttentionPattern() {
    if (this.buffers.attention.length === 0) return 'insufficient_data';

    const recent = this.buffers.attention.slice(-50);
    const mean = recent.reduce((a, b) => a + b.value, 0) / recent.length;
    const trend = this.calculateTrend(recent.map(d => d.value));

    if (mean > 0.8 && trend > 0) return 'strong_sustained';
    if (mean > 0.6 && trend > -0.01) return 'good_stable';
    if (mean > 0.4) return 'moderate_variable';
    return 'weak_inconsistent';
  }

  /**
   * Analyze comprehension pattern
   */
  analyzeComprehensionPattern() {
    if (this.buffers.comprehension.length === 0) return 'insufficient_data';

    const recent = this.buffers.comprehension.slice(-50);
    const mean = recent.reduce((a, b) => a + b.value, 0) / recent.length;
    const trend = this.calculateTrend(recent.map(d => d.value));

    if (mean > 0.85 && trend > 0) return 'excellent_improving';
    if (mean > 0.7 && trend > -0.01) return 'good_stable';
    if (mean > 0.5) return 'moderate_developing';
    return 'needs_improvement';
  }

  /**
   * Analyze engagement pattern
   */
  analyzeEngagementPattern() {
    if (this.buffers.engagement.length === 0) return 'insufficient_data';

    const recent = this.buffers.engagement.slice(-50);
    const mean = recent.reduce((a, b) => a + b.value, 0) / recent.length;
    const variability = this.calculateVariability(recent.map(d => d.value));

    if (mean > 0.8 && variability < 0.2) return 'highly_engaged';
    if (mean > 0.6 && variability < 0.3) return 'well_engaged';
    if (mean > 0.4) return 'moderately_engaged';
    return 'disengaged';
  }

  /**
   * Analyze cognitive load pattern
   */
  analyzeCognitiveLoadPattern() {
    if (this.buffers.cognitiveLoad.length === 0) return 'insufficient_data';

    const recent = this.buffers.cognitiveLoad.slice(-50);
    const mean = recent.reduce((a, b) => a + b.value, 0) / recent.length;
    const peaks = recent.filter(d => d.value > 0.8).length;

    if (mean < 0.4 && peaks < 5) return 'optimal_load';
    if (mean < 0.6 && peaks < 10) return 'manageable_load';
    if (mean < 0.8) return 'high_load';
    return 'overload';
  }

  /**
   * Generate learning recommendations
   */
  generateLearningRecommendations() {
    const patterns = this.analyzeLearningPatterns();
    const recommendations = [];

    if (patterns.attentionPattern === 'weak_inconsistent') {
      recommendations.push('Implement attention training exercises');
    }

    if (patterns.comprehensionPattern === 'needs_improvement') {
      recommendations.push('Provide additional foundational content');
    }

    if (patterns.engagementPattern === 'disengaged') {
      recommendations.push('Incorporate more interactive learning activities');
    }

    if (patterns.cognitiveLoadPattern === 'overload') {
      recommendations.push('Break learning into smaller, manageable chunks');
    }

    return recommendations;
  }

  /**
   * Reset CFI calculator
   */
  reset() {
    // Clear all buffers
    for (const buffer of Object.values(this.buffers)) {
      if (Array.isArray(buffer)) {
        buffer.length = 0;
      }
    }

    // Clear patterns
    for (const pattern of Object.values(this.patterns)) {
      pattern.length = 0;
    }

    // Reset state
    this.state = {
      currentCFI: 0,
      cfiLevel: 'optimal',
      trend: 'stable',
      confidence: 0,
      lastUpdate: null,
      components: {
        attentionScore: 0,
        comprehensionScore: 0,
        engagementScore: 0,
        cognitiveLoadScore: 0
      }
    };

    // Reset metrics
    this.metrics = {
      totalReadings: 0,
      patternDetections: 0,
      interventionSuggestions: 0,
      accuracyScore: 0,
      adaptationRate: 0
    };

    this.emit('reset');
  }
}

export default CognitiveFractureIndex;