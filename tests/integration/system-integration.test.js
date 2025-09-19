/**
 * Integration Tests for RIA Engine v2.0
 * 
 * Tests integration between core components including BiometricManager,
 * MLPersonalization, mathematical processors, and analytics engine.
 */

import { RIAEngine } from '../../core/RIAEngine.js';
import { BiometricManager } from '../../biometrics/BiometricManager.js';
import { MLPersonalization } from '../../ml/MLPersonalization.js';
import { AnalyticsEngine } from '../../analytics/AnalyticsEngine.js';

export default {
  setup: async () => {
    // Integration test setup
  },
  
  teardown: async () => {
    // Integration test cleanup
  },
  
  tests: [
    {
      name: 'should initialize complete RIA Engine system',
      async run(assert) {
        const config = {
          biometrics: {
            enableHRV: true,
            enableEEG: false,
            samplingRate: 250
          },
          ml: {
            enablePersonalization: true,
            adaptiveThresholds: true
          },
          analytics: {
            enableRealTimeAnalytics: true,
            retentionPeriod: 86400000
          }
        };
        
        const engine = new RIAEngine(config);
        await engine.initialize();
        
        assert.equal(engine.state.initialized, true);
        assert.equal(engine.biometricManager instanceof BiometricManager, true);
        assert.equal(engine.mlPersonalization instanceof MLPersonalization, true);
        assert.equal(engine.analyticsEngine instanceof AnalyticsEngine, true);
        
        // Check component initialization
        assert.equal(engine.biometricManager.state.initialized, true);
        assert.equal(engine.analyticsEngine.state.initialized, true);
      }
    },
    
    {
      name: 'should handle complete biometric data flow',
      async run(assert) {
        const engine = new RIAEngine({
          biometrics: { enableHRV: true },
          ml: { enablePersonalization: true },
          analytics: { enableRealTimeAnalytics: true }
        });
        
        await engine.initialize();
        await engine.start();
        
        // Set user profile
        await engine.setUserProfile({
          id: 'integration-test-user',
          age: 25,
          fitnessLevel: 'intermediate'
        });
        
        // Simulate biometric data flow
        const biometricData = {
          heartRate: 75,
          rrInterval: 800,
          stress: 0.3,
          focus: 0.7,
          timestamp: Date.now()
        };
        
        // Process data through the system
        engine.biometricManager.handleSensorData('hrv', biometricData);
        
        // Allow processing time
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check that data flowed through system
        const biometricState = engine.biometricManager.getBiometricState();
        assert.equal(biometricState.sensors.active.length > 0, true);
        
        const mlPrediction = engine.mlPersonalization.predictUserResponse({
          heartRate: 75,
          stress: 0.3,
          focus: 0.7
        });
        assert.equal(typeof mlPrediction.responseType, 'string');
        assert.equal(typeof mlPrediction.confidence, 'number');
        
        await engine.stop();
      }
    },
    
    {
      name: 'should synchronize data between components',
      async run(assert) {
        const engine = new RIAEngine({
          biometrics: { enableHRV: true },
          ml: { enablePersonalization: true },
          analytics: { enableRealTimeAnalytics: true }
        });
        
        await engine.initialize();
        
        // Set user profile in ML component
        await engine.setUserProfile({
          id: 'sync-test-user',
          preferences: { sensitivity: 'high' }
        });
        
        // Check that profile is accessible across components
        const mlStatus = engine.mlPersonalization.getStatus();
        assert.equal(mlStatus.userModelStatus.userId, 'sync-test-user');
        
        // Update ML thresholds and check sync
        engine.mlPersonalization.adaptThresholds('stress', [
          { value: 0.4, outcome: 'positive' },
          { value: 0.6, outcome: 'negative' }
        ]);
        
        const adaptedThreshold = engine.mlPersonalization.getThreshold('stress');
        assert.equal(typeof adaptedThreshold, 'number');
        assert.equal(adaptedThreshold > 0 && adaptedThreshold < 1, true);
      }
    },
    
    {
      name: 'should handle real-time processing pipeline',
      async run(assert) {
        const engine = new RIAEngine({
          biometrics: { enableHRV: true },
          ml: { enablePersonalization: true },
          analytics: { enableRealTimeAnalytics: true }
        });
        
        await engine.initialize();
        await engine.start();
        
        let eventCount = 0;
        const events = [];
        
        // Listen for processed events
        engine.on('biometricDataProcessed', (data) => {
          eventCount++;
          events.push(data);
        });
        
        engine.on('mlPredictionGenerated', (prediction) => {
          events.push(prediction);
        });
        
        // Process multiple data points
        for (let i = 0; i < 5; i++) {
          engine.biometricManager.handleSensorData('hrv', {
            heartRate: 70 + i * 2,
            rrInterval: 850 - i * 10,
            timestamp: Date.now() + i * 1000
          });
        }
        
        // Allow processing time
        await new Promise(resolve => setTimeout(resolve, 200));
        
        assert.equal(eventCount > 0, true, 'Should have processed biometric events');
        assert.equal(events.length > 0, true, 'Should have captured events');
        
        await engine.stop();
      }
    },
    
    {
      name: 'should handle error propagation correctly',
      async run(assert) {
        const engine = new RIAEngine({
          biometrics: { enableHRV: true },
          ml: { enablePersonalization: true }
        });
        
        await engine.initialize();
        
        let errorCaught = false;
        
        engine.on('error', (error) => {
          errorCaught = true;
          assert.equal(error instanceof Error, true);
        });
        
        // Trigger error by providing invalid data
        try {
          engine.biometricManager.handleSensorData('invalid-sensor', null);
        } catch (error) {
          // Expected to handle gracefully
        }
        
        // Should not crash the system
        const status = engine.getStatus();
        assert.equal(typeof status, 'object');
        assert.equal(status.initialized, true);
      }
    },
    
    {
      name: 'should maintain state consistency across operations',
      async run(assert) {
        const engine = new RIAEngine({
          biometrics: { enableHRV: true },
          ml: { enablePersonalization: true },
          analytics: { enableRealTimeAnalytics: true }
        });
        
        await engine.initialize();
        
        // Initial state
        let status1 = engine.getStatus();
        assert.equal(status1.initialized, true);
        
        // Start processing
        await engine.start();
        let status2 = engine.getStatus();
        assert.equal(status2.running, true);
        
        // Process data
        engine.biometricManager.handleSensorData('hrv', {
          heartRate: 75,
          rrInterval: 800
        });
        
        // Stop processing
        await engine.stop();
        let status3 = engine.getStatus();
        assert.equal(status3.running, false);
        assert.equal(status3.initialized, true);
        
        // Restart
        await engine.start();
        let status4 = engine.getStatus();
        assert.equal(status4.running, true);
        assert.equal(status4.initialized, true);
        
        await engine.stop();
      }
    },
    
    {
      name: 'should handle configuration updates dynamically',
      async run(assert) {
        const engine = new RIAEngine({
          biometrics: { enableHRV: true, samplingRate: 250 },
          ml: { updateInterval: 300000 }
        });
        
        await engine.initialize();
        
        // Initial configuration
        assert.equal(engine.biometricManager.config.samplingRate, 250);
        assert.equal(engine.mlPersonalization.config.updateInterval, 300000);
        
        // Update configuration
        await engine.updateConfig({
          biometrics: { samplingRate: 500 },
          ml: { updateInterval: 600000 }
        });
        
        // Check updated configuration
        assert.equal(engine.biometricManager.config.samplingRate, 500);
        assert.equal(engine.mlPersonalization.config.updateInterval, 600000);
        
        // Verify system still functional
        const status = engine.getStatus();
        assert.equal(status.initialized, true);
      }
    },
    
    {
      name: 'should export and import complete system state',
      async run(assert) {
        const engine1 = new RIAEngine({
          biometrics: { enableHRV: true },
          ml: { enablePersonalization: true }
        });
        
        await engine1.initialize();
        
        // Set up state
        await engine1.setUserProfile({
          id: 'export-test-user',
          age: 30,
          fitnessLevel: 'advanced'
        });
        
        // Process some data
        engine1.biometricManager.handleSensorData('hrv', {
          heartRate: 68,
          rrInterval: 882,
          stress: 0.2,
          focus: 0.8
        });
        
        // Export system state
        const exportedState = await engine1.exportState();
        
        assert.equal(typeof exportedState, 'object');
        assert.equal(typeof exportedState.userModel, 'object');
        assert.equal(typeof exportedState.biometricData, 'object');
        assert.equal(typeof exportedState.configuration, 'object');
        assert.equal(exportedState.userModel.id, 'export-test-user');
        
        // Create new engine and import state
        const engine2 = new RIAEngine();
        await engine2.initialize();
        await engine2.importState(exportedState);
        
        // Verify imported state
        const status = engine2.getStatus();
        assert.equal(status.initialized, true);
        
        const mlStatus = engine2.mlPersonalization.getStatus();
        assert.equal(mlStatus.userModelStatus.userId, 'export-test-user');
      }
    },
    
    {
      name: 'should handle multi-sensor integration',
      async run(assert) {
        const engine = new RIAEngine({
          biometrics: {
            enableHRV: true,
            enableEEG: true,
            enableGSR: true
          },
          ml: { enablePersonalization: true }
        });
        
        await engine.initialize();
        await engine.start();
        
        // Simulate multi-sensor data
        engine.biometricManager.handleSensorData('hrv', {
          heartRate: 75,
          rrInterval: 800
        });
        
        engine.biometricManager.handleSensorData('eeg', {
          channels: { Fp1: 10, Fp2: 12, F3: 8, F4: 11 },
          alpha: 0.6,
          beta: 0.3,
          theta: 0.1
        });
        
        engine.biometricManager.handleSensorData('gsr', {
          conductance: 15.5,
          resistance: 64.5
        });
        
        // Check sensor integration
        const biometricState = engine.biometricManager.getBiometricState();
        assert.equal(biometricState.sensors.active.length, 3);
        
        // Check fusion processing
        const overallQuality = engine.biometricManager.getOverallDataQuality();
        assert.equal(typeof overallQuality, 'number');
        assert.equal(overallQuality >= 0 && overallQuality <= 1, true);
        
        await engine.stop();
      }
    },
    
    {
      name: 'should generate comprehensive analytics',
      async run(assert) {
        const engine = new RIAEngine({
          biometrics: { enableHRV: true },
          analytics: { enableRealTimeAnalytics: true }
        });
        
        await engine.initialize();
        await engine.start();
        
        // Generate data for analytics
        for (let i = 0; i < 10; i++) {
          engine.biometricManager.handleSensorData('hrv', {
            heartRate: 70 + Math.random() * 20,
            rrInterval: 800 + Math.random() * 200,
            stress: Math.random(),
            focus: Math.random(),
            timestamp: Date.now() + i * 60000 // 1 minute intervals
          });
        }
        
        // Allow processing time
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get analytics
        const analytics = engine.analyticsEngine.getAnalytics();
        
        assert.equal(typeof analytics, 'object');
        assert.equal(typeof analytics.summary, 'object');
        assert.equal(typeof analytics.trends, 'object');
        assert.equal(typeof analytics.insights, 'object');
        
        // Check for meaningful analytics data
        assert.equal(analytics.summary.totalSessions > 0, true);
        assert.equal(typeof analytics.summary.averageStress, 'number');
        assert.equal(typeof analytics.summary.averageFocus, 'number');
        
        await engine.stop();
      }
    }
  ]
};