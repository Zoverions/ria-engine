/**
 * Unit Tests for BiometricManager
 * 
 * Tests biometric sensor integration, data fusion, and real-time processing
 * capabilities of the BiometricManager class.
 */

import { BiometricManager } from '../../biometrics/BiometricManager.js';

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
        const manager = new BiometricManager();
        
        assert.equal(manager.config.enableHRV, true);
        assert.equal(manager.config.enableEEG, false);
        assert.equal(manager.config.enableGSR, false);
        assert.equal(manager.config.samplingRate, 250);
        assert.equal(manager.config.bufferSize, 1000);
        assert.equal(manager.state.initialized, false);
      }
    },
    
    {
      name: 'should initialize with custom configuration',
      async run(assert) {
        const config = {
          enableHRV: true,
          enableEEG: true,
          enableGSR: true,
          samplingRate: 500,
          bufferSize: 2000
        };
        
        const manager = new BiometricManager(config);
        
        assert.equal(manager.config.enableHRV, true);
        assert.equal(manager.config.enableEEG, true);
        assert.equal(manager.config.enableGSR, true);
        assert.equal(manager.config.samplingRate, 500);
        assert.equal(manager.config.bufferSize, 2000);
      }
    },
    
    {
      name: 'should initialize successfully',
      async run(assert) {
        const manager = new BiometricManager({
          enableHRV: true,
          enableEEG: false,
          enableGSR: false
        });
        
        await manager.initialize();
        
        assert.equal(manager.state.initialized, true);
        assert.equal(manager.state.activeSensors.size >= 1, true, 'Should have at least HRV sensor active');
        
        // Check that HRV sensor is active
        const hrvSensor = manager.state.activeSensors.get('hrv');
        assert.equal(hrvSensor !== undefined, true, 'HRV sensor should be active');
        assert.equal(hrvSensor.status, 'active');
      }
    },
    
    {
      name: 'should initialize multiple sensors',
      async run(assert) {
        const manager = new BiometricManager({
          enableHRV: true,
          enableEEG: true,
          enableGSR: true
        });
        
        await manager.initialize();
        
        assert.equal(manager.state.initialized, true);
        assert.equal(manager.state.activeSensors.size, 3, 'Should have 3 active sensors');
        
        // Check each sensor type
        assert.equal(manager.state.activeSensors.has('hrv'), true);
        assert.equal(manager.state.activeSensors.has('eeg'), true);
        assert.equal(manager.state.activeSensors.has('gsr'), true);
      }
    },
    
    {
      name: 'should handle sensor data correctly',
      async run(assert) {
        const manager = new BiometricManager({ enableHRV: true });
        await manager.initialize();
        
        // Simulate sensor data
        const testData = {
          rrInterval: 800,
          heartRate: 75,
          timestamp: Date.now()
        };
        
        manager.handleSensorData('hrv', testData);
        
        // Check that data was buffered
        const buffer = manager.state.dataBuffers.get('hrv');
        assert.equal(buffer !== undefined, true, 'Data buffer should exist');
        assert.equal(buffer.length > 0, true, 'Buffer should contain data');
        
        // Check sensor status update
        const sensorInfo = manager.state.activeSensors.get('hrv');
        assert.equal(sensorInfo.lastData > 0, true, 'Last data timestamp should be updated');
      }
    },
    
    {
      name: 'should provide biometric state correctly',
      async run(assert) {
        const manager = new BiometricManager({ enableHRV: true });
        await manager.initialize();
        
        const state = manager.getBiometricState();
        
        assert.equal(typeof state.timestamp, 'number');
        assert.equal(Array.isArray(state.sensors.active), true);
        assert.equal(state.sensors.active.length >= 1, true, 'Should have at least one active sensor');
        assert.equal(typeof state.sensors.status, 'object');
        assert.equal(typeof state.realTime, 'object');
        assert.equal(typeof state.quality, 'number');
      }
    },
    
    {
      name: 'should calculate data rate correctly',
      async run(assert) {
        const manager = new BiometricManager({ enableHRV: true });
        await manager.initialize();
        
        // Simulate multiple data points
        const now = Date.now();
        for (let i = 0; i < 10; i++) {
          manager.handleSensorData('hrv', {
            rrInterval: 800 + Math.random() * 100,
            heartRate: 70 + Math.random() * 20,
            timestamp: now + i * 100 // 10 Hz data
          });
        }
        
        const dataRate = manager.calculateDataRate('hrv');
        
        // Should be approximately 10 Hz (allowing for some variance)
        assert.equal(dataRate >= 8 && dataRate <= 12, true, 
          `Data rate should be ~10Hz, got ${dataRate}`);
      }
    },
    
    {
      name: 'should assess data quality correctly',
      async run(assert) {
        const manager = new BiometricManager();
        
        // Test with good data
        const goodData = {
          rrInterval: 800,
          heartRate: 75,
          timestamp: Date.now()
        };
        
        const goodQuality = manager.assessDataQuality('hrv', goodData);
        assert.equal(goodQuality > 0.8, true, `Good data should have high quality, got ${goodQuality}`);
        
        // Test with bad data (NaN values)
        const badData = {
          rrInterval: NaN,
          heartRate: Infinity,
          timestamp: Date.now()
        };
        
        const badQuality = manager.assessDataQuality('hrv', badData);
        assert.equal(badQuality < 0.5, true, `Bad data should have low quality, got ${badQuality}`);
      }
    },
    
    {
      name: 'should calculate overall data quality',
      async run(assert) {
        const manager = new BiometricManager({ 
          enableHRV: true,
          enableEEG: true 
        });
        await manager.initialize();
        
        // Simulate data for both sensors
        manager.handleSensorData('hrv', { rrInterval: 800, heartRate: 75 });
        manager.handleSensorData('eeg', { 
          channels: { Fp1: 10, Fp2: 12, F3: 8, F4: 11 }
        });
        
        const overallQuality = manager.getOverallDataQuality();
        
        assert.equal(typeof overallQuality, 'number');
        assert.equal(overallQuality >= 0 && overallQuality <= 1, true,
          `Quality should be 0-1, got ${overallQuality}`);
      }
    },
    
    {
      name: 'should start and stop correctly',
      async run(assert) {
        const manager = new BiometricManager({ enableHRV: true });
        await manager.initialize();
        
        // Start monitoring
        await manager.start();
        
        const sensorInfo = manager.state.activeSensors.get('hrv');
        assert.equal(sensorInfo.status, 'running');
        
        // Stop monitoring
        await manager.stop();
        
        assert.equal(sensorInfo.status, 'stopped');
        assert.equal(manager.state.processingSchedulers.size, 0, 
          'Processing schedulers should be cleared');
      }
    },
    
    {
      name: 'should update configuration correctly',
      async run(assert) {
        const manager = new BiometricManager({ samplingRate: 250 });
        
        assert.equal(manager.config.samplingRate, 250);
        
        manager.updateConfig({ samplingRate: 500, bufferSize: 2000 });
        
        assert.equal(manager.config.samplingRate, 500);
        assert.equal(manager.config.bufferSize, 2000);
      }
    },
    
    {
      name: 'should provide status information',
      async run(assert) {
        const manager = new BiometricManager({ enableHRV: true });
        await manager.initialize();
        
        const status = manager.getStatus();
        
        assert.equal(status.initialized, true);
        assert.equal(Array.isArray(status.activeSensors), true);
        assert.equal(typeof status.sensorStatus, 'object');
        assert.equal(typeof status.metrics, 'object');
        assert.equal(typeof status.realTimeData, 'object');
        
        // Check metrics structure
        assert.equal(typeof status.metrics.overallQuality, 'number');
        assert.equal(typeof status.metrics.fusionAccuracy, 'number');
      }
    },
    
    {
      name: 'should export data correctly',
      async run(assert) {
        const manager = new BiometricManager({ enableHRV: true });
        await manager.initialize();
        
        // Add some test data
        manager.handleSensorData('hrv', { rrInterval: 800, heartRate: 75 });
        manager.handleSensorData('hrv', { rrInterval: 820, heartRate: 73 });
        
        // Export as JSON
        const jsonExport = manager.exportData('json');
        
        assert.equal(typeof jsonExport, 'string');
        
        const parsed = JSON.parse(jsonExport);
        assert.equal(typeof parsed.metadata, 'object');
        assert.equal(typeof parsed.data, 'object');
        assert.equal(typeof parsed.processedMetrics, 'object');
        
        // Export as object
        const objectExport = manager.exportData('object');
        assert.equal(typeof objectExport, 'object');
        assert.equal(typeof objectExport.metadata, 'object');
        assert.equal(typeof objectExport.data, 'object');
      }
    }
  ]
};