/**
 * Unit Tests for MLPersonalization
 * 
 * Tests machine learning personalization features including adaptive thresholds,
 * user modeling, and federated learning capabilities.
 */

import { MLPersonalization } from '../../ml/MLPersonalization.js';

export default {
  setup: async () => {
    // Test setup code
  },
  
  teardown: async () => {
    // Test cleanup code
  },
  
  tests: [
    {
      name: 'should initialize with default configuration',
      async run(assert) {
        const ml = new MLPersonalization();
        
        assert.equal(ml.config.enablePersonalization, true);
        assert.equal(ml.config.adaptiveThresholds, true);
        assert.equal(ml.config.federatedLearning, false);
        assert.equal(ml.config.modelType, 'adaptive');
        assert.equal(ml.config.updateInterval, 300000); // 5 minutes
        assert.equal(ml.userModel.id, null);
        assert.equal(ml.userModel.version, '1.0.0');
      }
    },
    
    {
      name: 'should initialize with custom configuration',
      async run(assert) {
        const config = {
          enablePersonalization: true,
          adaptiveThresholds: true,
          federatedLearning: true,
          modelType: 'neural',
          updateInterval: 600000
        };
        
        const ml = new MLPersonalization(config);
        
        assert.equal(ml.config.federatedLearning, true);
        assert.equal(ml.config.modelType, 'neural');
        assert.equal(ml.config.updateInterval, 600000);
      }
    },
    
    {
      name: 'should set user profile correctly',
      async run(assert) {
        const ml = new MLPersonalization();
        
        const userProfile = {
          id: 'user-123',
          age: 25,
          fitnessLevel: 'intermediate',
          preferences: {
            sensitivity: 'medium',
            feedback: 'visual'
          }
        };
        
        ml.setUserProfile(userProfile);
        
        assert.equal(ml.userModel.id, 'user-123');
        assert.equal(ml.userModel.profile.age, 25);
        assert.equal(ml.userModel.profile.fitnessLevel, 'intermediate');
        assert.equal(ml.userModel.profile.preferences.sensitivity, 'medium');
        assert.equal(ml.userModel.lastUpdated > 0, true);
      }
    },
    
    {
      name: 'should update model with biometric data',
      async run(assert) {
        const ml = new MLPersonalization();
        
        const biometricData = {
          heartRate: 75,
          rrInterval: 800,
          stress: 0.3,
          focus: 0.7,
          timestamp: Date.now()
        };
        
        ml.updateModel(biometricData);
        
        // Check that data was processed
        assert.equal(ml.userModel.dataPoints > 0, true, 'Should have data points');
        assert.equal(ml.userModel.lastUpdated > 0, true, 'Should have update timestamp');
        
        // Check feature extraction
        const features = ml.extractFeatures(biometricData);
        assert.equal(typeof features, 'object');
        assert.equal(typeof features.heartRate, 'number');
        assert.equal(typeof features.stress, 'number');
        assert.equal(typeof features.focus, 'number');
      }
    },
    
    {
      name: 'should extract features correctly',
      async run(assert) {
        const ml = new MLPersonalization();
        
        const biometricData = {
          heartRate: 75,
          rrInterval: 800,
          stress: 0.3,
          focus: 0.7,
          timestamp: Date.now()
        };
        
        const features = ml.extractFeatures(biometricData);
        
        assert.equal(typeof features.heartRate, 'number');
        assert.equal(features.heartRate, 75);
        assert.equal(typeof features.hrvScore, 'number');
        assert.equal(features.hrvScore, 62.5); // 50000 / 800
        assert.equal(typeof features.stress, 'number');
        assert.equal(features.stress, 0.3);
        assert.equal(typeof features.focus, 'number');
        assert.equal(features.focus, 0.7);
        assert.equal(typeof features.cognitiveLoad, 'number');
        assert.equal(features.cognitiveLoad, 0.85); // stress + focus
        assert.equal(typeof features.autonomicBalance, 'number');
        assert.equal(features.autonomicBalance, 0.4); // focus - stress
      }
    },
    
    {
      name: 'should adapt thresholds correctly',
      async run(assert) {
        const ml = new MLPersonalization({ adaptiveThresholds: true });
        
        // Set initial user profile
        ml.setUserProfile({
          id: 'user-123',
          fitnessLevel: 'intermediate'
        });
        
        // Simulate learning data
        const learningData = [
          { value: 0.5, outcome: 'positive' },
          { value: 0.7, outcome: 'positive' },
          { value: 0.9, outcome: 'negative' },
          { value: 0.3, outcome: 'positive' },
          { value: 0.8, outcome: 'negative' }
        ];
        
        ml.adaptThresholds('stress', learningData);
        
        const adaptedThreshold = ml.getThreshold('stress');
        
        assert.equal(typeof adaptedThreshold, 'number');
        assert.equal(adaptedThreshold > 0 && adaptedThreshold < 1, true,
          `Stress threshold should be 0-1, got ${adaptedThreshold}`);
        
        // Should be adjusted based on learning data (around 0.6-0.75)
        assert.equal(adaptedThreshold > 0.5 && adaptedThreshold < 0.8, true,
          `Threshold should be learned from data, got ${adaptedThreshold}`);
      }
    },
    
    {
      name: 'should get threshold correctly',
      async run(assert) {
        const ml = new MLPersonalization();
        
        // Test default thresholds
        const stressThreshold = ml.getThreshold('stress');
        const focusThreshold = ml.getThreshold('focus');
        const hrvThreshold = ml.getThreshold('hrv');
        
        assert.equal(typeof stressThreshold, 'number');
        assert.equal(typeof focusThreshold, 'number');
        assert.equal(typeof hrvThreshold, 'number');
        
        // Should be reasonable default values
        assert.equal(stressThreshold > 0 && stressThreshold < 1, true);
        assert.equal(focusThreshold > 0 && focusThreshold < 1, true);
        assert.equal(hrvThreshold > 0, true);
        
        // Test unknown threshold
        const unknownThreshold = ml.getThreshold('unknown');
        assert.equal(unknownThreshold, 0.5, 'Unknown threshold should default to 0.5');
      }
    },
    
    {
      name: 'should predict user response correctly',
      async run(assert) {
        const ml = new MLPersonalization();
        
        // Set user profile for better predictions
        ml.setUserProfile({
          id: 'user-123',
          fitnessLevel: 'intermediate'
        });
        
        const biometricState = {
          heartRate: 75,
          stress: 0.4,
          focus: 0.8,
          hrv: 65
        };
        
        const prediction = ml.predictUserResponse(biometricState);
        
        assert.equal(typeof prediction, 'object');
        assert.equal(typeof prediction.responseType, 'string');
        assert.equal(typeof prediction.confidence, 'number');
        assert.equal(typeof prediction.reasoning, 'string');
        assert.equal(typeof prediction.recommendations, 'object');
        
        // Confidence should be 0-1
        assert.equal(prediction.confidence >= 0 && prediction.confidence <= 1, true,
          `Confidence should be 0-1, got ${prediction.confidence}`);
        
        // Should have valid response type
        const validTypes = ['optimal', 'stressed', 'unfocused', 'fatigued', 'alert'];
        assert.equal(validTypes.includes(prediction.responseType), true,
          `Invalid response type: ${prediction.responseType}`);
      }
    },
    
    {
      name: 'should provide valid recommendations',
      async run(assert) {
        const ml = new MLPersonalization();
        
        const biometricState = {
          heartRate: 95, // High
          stress: 0.8,   // High stress
          focus: 0.3,    // Low focus
          hrv: 35        // Low HRV
        };
        
        const recommendations = ml.getRecommendations(biometricState);
        
        assert.equal(typeof recommendations, 'object');
        assert.equal(Array.isArray(recommendations.immediate), true);
        assert.equal(Array.isArray(recommendations.longTerm), true);
        assert.equal(typeof recommendations.priority, 'string');
        assert.equal(typeof recommendations.reasoning, 'string');
        
        // Should have at least one recommendation
        assert.equal(recommendations.immediate.length > 0, true,
          'Should have immediate recommendations for stressed state');
        
        // Recommendations should be strings
        recommendations.immediate.forEach(rec => {
          assert.equal(typeof rec, 'string', 'Recommendations should be strings');
        });
        
        // Priority should be valid
        const validPriorities = ['low', 'medium', 'high', 'critical'];
        assert.equal(validPriorities.includes(recommendations.priority), true,
          `Invalid priority: ${recommendations.priority}`);
      }
    },
    
    {
      name: 'should export user model correctly',
      async run(assert) {
        const ml = new MLPersonalization();
        
        // Set up user model
        ml.setUserProfile({
          id: 'user-123',
          age: 30,
          fitnessLevel: 'advanced'
        });
        
        // Add some data
        ml.updateModel({
          heartRate: 70,
          stress: 0.2,
          focus: 0.9
        });
        
        const exportedModel = ml.exportUserModel();
        
        assert.equal(typeof exportedModel, 'object');
        assert.equal(exportedModel.id, 'user-123');
        assert.equal(typeof exportedModel.version, 'string');
        assert.equal(typeof exportedModel.profile, 'object');
        assert.equal(typeof exportedModel.thresholds, 'object');
        assert.equal(typeof exportedModel.metadata, 'object');
        
        // Should include learning data
        assert.equal(typeof exportedModel.dataPoints, 'number');
        assert.equal(exportedModel.dataPoints > 0, true);
        
        // Should include timestamps
        assert.equal(typeof exportedModel.createdAt, 'number');
        assert.equal(typeof exportedModel.lastUpdated, 'number');
      }
    },
    
    {
      name: 'should import user model correctly',
      async run(assert) {
        const ml = new MLPersonalization();
        
        const modelData = {
          id: 'imported-user',
          version: '1.0.0',
          profile: {
            age: 28,
            fitnessLevel: 'beginner'
          },
          thresholds: {
            stress: 0.4,
            focus: 0.6,
            hrv: 55
          },
          dataPoints: 150,
          createdAt: Date.now() - 86400000, // 1 day ago
          lastUpdated: Date.now() - 3600000  // 1 hour ago
        };
        
        ml.importUserModel(modelData);
        
        assert.equal(ml.userModel.id, 'imported-user');
        assert.equal(ml.userModel.profile.age, 28);
        assert.equal(ml.userModel.profile.fitnessLevel, 'beginner');
        assert.equal(ml.userModel.dataPoints, 150);
        
        // Check thresholds were imported
        assert.equal(ml.getThreshold('stress'), 0.4);
        assert.equal(ml.getThreshold('focus'), 0.6);
        assert.equal(ml.getThreshold('hrv'), 55);
      }
    },
    
    {
      name: 'should update configuration correctly',
      async run(assert) {
        const ml = new MLPersonalization({
          updateInterval: 300000,
          modelType: 'adaptive'
        });
        
        assert.equal(ml.config.updateInterval, 300000);
        assert.equal(ml.config.modelType, 'adaptive');
        
        ml.updateConfig({
          updateInterval: 600000,
          modelType: 'neural',
          federatedLearning: true
        });
        
        assert.equal(ml.config.updateInterval, 600000);
        assert.equal(ml.config.modelType, 'neural');
        assert.equal(ml.config.federatedLearning, true);
      }
    },
    
    {
      name: 'should get status information correctly',
      async run(assert) {
        const ml = new MLPersonalization();
        
        ml.setUserProfile({
          id: 'status-test-user',
          fitnessLevel: 'intermediate'
        });
        
        const status = ml.getStatus();
        
        assert.equal(typeof status, 'object');
        assert.equal(typeof status.userModelStatus, 'object');
        assert.equal(typeof status.learningMetrics, 'object');
        assert.equal(typeof status.currentThresholds, 'object');
        assert.equal(typeof status.configuration, 'object');
        
        // Check user model status
        assert.equal(status.userModelStatus.hasProfile, true);
        assert.equal(status.userModelStatus.userId, 'status-test-user');
        assert.equal(typeof status.userModelStatus.dataPoints, 'number');
        assert.equal(typeof status.userModelStatus.lastUpdated, 'number');
        
        // Check learning metrics
        assert.equal(typeof status.learningMetrics.adaptationRate, 'number');
        assert.equal(typeof status.learningMetrics.predictionAccuracy, 'number');
        assert.equal(typeof status.learningMetrics.modelComplexity, 'number');
        
        // Check current thresholds
        assert.equal(typeof status.currentThresholds.stress, 'number');
        assert.equal(typeof status.currentThresholds.focus, 'number');
        assert.equal(typeof status.currentThresholds.hrv, 'number');
      }
    }
  ]
};