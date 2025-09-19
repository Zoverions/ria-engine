/**
 * Performance Tests for RIA Engine v2.0
 * 
 * Tests performance characteristics of mathematical processors,
 * biometric data processing, and ML prediction latency.
 */

export default {
  setup: async () => {
    // Performance test setup
  },
  
  teardown: async () => {
    // Performance test cleanup
  },
  
  tests: [
    {
      name: 'should process biometric data within latency requirements',
      async run(assert) {
        const { BiometricManager } = await import('../../biometrics/BiometricManager.js');
        const manager = new BiometricManager({ enableHRV: true, enableEEG: true });
        await manager.initialize();
        
        const dataPoints = 1000;
        const startTime = performance.now();
        
        // Process large dataset
        for (let i = 0; i < dataPoints; i++) {
          manager.handleSensorData('hrv', {
            heartRate: 70 + Math.random() * 30,
            rrInterval: 800 + Math.random() * 200,
            timestamp: Date.now() + i
          });
        }
        
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        const avgLatency = totalTime / dataPoints;
        
        console.log(`Processed ${dataPoints} data points in ${totalTime.toFixed(2)}ms`);
        console.log(`Average latency: ${avgLatency.toFixed(3)}ms per data point`);
        
        // Requirements: < 1ms per data point on average
        assert.equal(avgLatency < 1.0, true, 
          `Average latency ${avgLatency.toFixed(3)}ms exceeds 1ms requirement`);
        
        // Peak latency check - no single operation should take > 10ms
        const singleStartTime = performance.now();
        manager.handleSensorData('hrv', {
          heartRate: 75,
          rrInterval: 800,
          timestamp: Date.now()
        });
        const singleEndTime = performance.now();
        const singleLatency = singleEndTime - singleStartTime;
        
        assert.equal(singleLatency < 10.0, true,
          `Single operation latency ${singleLatency.toFixed(3)}ms exceeds 10ms limit`);
      }
    },
    
    {
      name: 'should handle high-frequency biometric data streams',
      async run(assert) {
        const { BiometricManager } = await import('../../biometrics/BiometricManager.js');
        const manager = new BiometricManager({ 
          enableHRV: true,
          samplingRate: 1000 // 1kHz
        });
        await manager.initialize();
        await manager.start();
        
        const sampleRate = 1000; // Hz
        const testDuration = 1000; // ms
        const expectedSamples = sampleRate * (testDuration / 1000);
        
        let processedCount = 0;
        const startTime = performance.now();
        
        // Simulate high-frequency data stream
        const interval = setInterval(() => {
          manager.handleSensorData('hrv', {
            heartRate: 70 + Math.random() * 30,
            rrInterval: 800 + Math.random() * 200,
            timestamp: Date.now()
          });
          processedCount++;
        }, 1); // 1ms intervals = 1kHz
        
        // Wait for test duration
        await new Promise(resolve => setTimeout(resolve, testDuration));
        clearInterval(interval);
        
        const endTime = performance.now();
        const actualDuration = endTime - startTime;
        const actualRate = processedCount / (actualDuration / 1000);
        
        console.log(`Processed ${processedCount} samples in ${actualDuration.toFixed(2)}ms`);
        console.log(`Actual sample rate: ${actualRate.toFixed(1)} Hz`);
        
        // Should handle at least 90% of target rate
        assert.equal(actualRate >= sampleRate * 0.9, true,
          `Sample rate ${actualRate.toFixed(1)}Hz below 90% of target ${sampleRate}Hz`);
        
        await manager.stop();
      }
    },
    
    {
      name: 'should process FFT calculations efficiently',
      async run(assert) {
        const { SpectralProcessor } = await import('../../core/math/processors/SpectralProcessor.js');
        const processor = new SpectralProcessor();
        
        const signalLengths = [128, 256, 512, 1024, 2048];
        const results = [];
        
        for (const length of signalLengths) {
          // Generate test signal
          const signal = new Array(length).fill(0).map((_, i) => 
            Math.sin(2 * Math.PI * 50 * i / 1000) + // 50Hz component
            0.5 * Math.sin(2 * Math.PI * 120 * i / 1000) // 120Hz component
          );
          
          const startTime = performance.now();
          
          // Process multiple times for accurate measurement
          const iterations = 100;
          for (let i = 0; i < iterations; i++) {
            processor.processSpectrum(signal, 1000);
          }
          
          const endTime = performance.now();
          const avgTime = (endTime - startTime) / iterations;
          
          results.push({ length, avgTime });
          console.log(`FFT ${length} points: ${avgTime.toFixed(3)}ms average`);
          
          // Performance requirements based on signal length
          const maxTime = length <= 512 ? 1.0 : length <= 1024 ? 5.0 : 20.0;
          assert.equal(avgTime < maxTime, true,
            `FFT ${length} points took ${avgTime.toFixed(3)}ms, exceeds ${maxTime}ms limit`);
        }
        
        // Check scaling characteristics - should be roughly O(n log n)
        const ratio2048to256 = results[4].avgTime / results[1].avgTime;
        const expectedRatio = (2048 * Math.log2(2048)) / (256 * Math.log2(256));
        const scalingFactor = ratio2048to256 / expectedRatio;
        
        console.log(`FFT scaling factor: ${scalingFactor.toFixed(2)} (1.0 = ideal O(n log n))`);
        assert.equal(scalingFactor < 3.0, true,
          `FFT scaling factor ${scalingFactor.toFixed(2)} suggests poor algorithmic complexity`);
      }
    },
    
    {
      name: 'should generate ML predictions efficiently',
      async run(assert) {
        const { MLPersonalization } = await import('../../ml/MLPersonalization.js');
        const ml = new MLPersonalization({ enablePersonalization: true });
        
        // Set up user profile
        ml.setUserProfile({
          id: 'perf-test-user',
          age: 30,
          fitnessLevel: 'intermediate'
        });
        
        // Add training data
        for (let i = 0; i < 100; i++) {
          ml.updateModel({
            heartRate: 70 + Math.random() * 30,
            stress: Math.random(),
            focus: Math.random(),
            timestamp: Date.now() + i * 1000
          });
        }
        
        const iterations = 1000;
        const startTime = performance.now();
        
        // Test prediction performance
        for (let i = 0; i < iterations; i++) {
          const prediction = ml.predictUserResponse({
            heartRate: 75 + Math.random() * 20,
            stress: Math.random(),
            focus: Math.random(),
            hrv: 50 + Math.random() * 30
          });
          
          // Verify prediction structure (minimal validation to avoid skewing timing)
          assert.equal(typeof prediction.responseType, 'string');
          assert.equal(typeof prediction.confidence, 'number');
        }
        
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        const avgPredictionTime = totalTime / iterations;
        
        console.log(`Generated ${iterations} predictions in ${totalTime.toFixed(2)}ms`);
        console.log(`Average prediction time: ${avgPredictionTime.toFixed(3)}ms`);
        
        // Requirement: < 0.5ms per prediction for real-time use
        assert.equal(avgPredictionTime < 0.5, true,
          `Prediction time ${avgPredictionTime.toFixed(3)}ms exceeds 0.5ms requirement`);
      }
    },
    
    {
      name: 'should handle memory efficiently under load',
      async run(assert) {
        if (typeof process === 'undefined' || !process.memoryUsage) {
          console.log('Memory test skipped - process.memoryUsage not available');
          return;
        }
        
        const { RIAEngine } = await import('../../core/RIAEngine.js');
        
        const initialMemory = process.memoryUsage();
        console.log(`Initial memory: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
        
        const engine = new RIAEngine({
          biometrics: { enableHRV: true, bufferSize: 10000 },
          ml: { enablePersonalization: true },
          analytics: { enableRealTimeAnalytics: true }
        });
        
        await engine.initialize();
        await engine.start();
        
        // Simulate sustained data processing
        const dataPoints = 10000;
        for (let i = 0; i < dataPoints; i++) {
          engine.biometricManager.handleSensorData('hrv', {
            heartRate: 70 + Math.random() * 30,
            rrInterval: 800 + Math.random() * 200,
            stress: Math.random(),
            focus: Math.random(),
            timestamp: Date.now() + i * 100
          });
          
          // Periodic garbage collection hint
          if (i % 1000 === 0 && global.gc) {
            global.gc();
          }
        }
        
        const peakMemory = process.memoryUsage();
        console.log(`Peak memory: ${(peakMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
        
        await engine.stop();
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const finalMemory = process.memoryUsage();
        console.log(`Final memory: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
        
        const memoryIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
        const peakIncrease = (peakMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
        
        console.log(`Memory increase: ${memoryIncrease.toFixed(2)}MB`);
        console.log(`Peak increase: ${peakIncrease.toFixed(2)}MB`);
        
        // Memory requirements
        assert.equal(peakIncrease < 100, true, // < 100MB peak increase
          `Peak memory increase ${peakIncrease.toFixed(2)}MB exceeds 100MB limit`);
        
        assert.equal(memoryIncrease < 50, true, // < 50MB residual increase
          `Residual memory increase ${memoryIncrease.toFixed(2)}MB exceeds 50MB limit`);
      }
    },
    
    {
      name: 'should handle concurrent processing efficiently',
      async run(assert) {
        const { RIAEngine } = await import('../../core/RIAEngine.js');
        
        const concurrentEngines = 5;
        const engines = [];
        const startTime = performance.now();
        
        // Initialize multiple engines concurrently
        const initPromises = [];
        for (let i = 0; i < concurrentEngines; i++) {
          const engine = new RIAEngine({
            biometrics: { enableHRV: true },
            ml: { enablePersonalization: true }
          });
          engines.push(engine);
          initPromises.push(engine.initialize());
        }
        
        await Promise.all(initPromises);
        
        // Start all engines
        const startPromises = engines.map(engine => engine.start());
        await Promise.all(startPromises);
        
        // Process data concurrently
        const processingPromises = engines.map(async (engine, index) => {
          const dataPoints = 100;
          for (let i = 0; i < dataPoints; i++) {
            engine.biometricManager.handleSensorData('hrv', {
              heartRate: 70 + Math.random() * 30,
              rrInterval: 800 + Math.random() * 200,
              timestamp: Date.now() + i * 100
            });
          }
          
          // Get prediction
          const prediction = engine.mlPersonalization.predictUserResponse({
            heartRate: 75,
            stress: 0.3,
            focus: 0.7
          });
          
          return { engineIndex: index, prediction };
        });
        
        const results = await Promise.all(processingPromises);
        
        // Stop all engines
        const stopPromises = engines.map(engine => engine.stop());
        await Promise.all(stopPromises);
        
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        
        console.log(`Concurrent processing with ${concurrentEngines} engines: ${totalTime.toFixed(2)}ms`);
        
        // Verify all engines processed successfully
        assert.equal(results.length, concurrentEngines);
        results.forEach((result, index) => {
          assert.equal(result.engineIndex, index);
          assert.equal(typeof result.prediction.responseType, 'string');
        });
        
        // Performance requirement: < 5 seconds for concurrent initialization and processing
        assert.equal(totalTime < 5000, true,
          `Concurrent processing took ${totalTime.toFixed(2)}ms, exceeds 5000ms limit`);
      }
    },
    
    {
      name: 'should maintain performance under sustained load',
      async run(assert) {
        const { BiometricManager } = await import('../../biometrics/BiometricManager.js');
        const manager = new BiometricManager({ enableHRV: true });
        await manager.initialize();
        await manager.start();
        
        const testDuration = 5000; // 5 seconds
        const batchSize = 10;
        const batches = [];
        
        const startTime = performance.now();
        let processedCount = 0;
        
        // Process data in batches with timing measurements
        const processInterval = setInterval(() => {
          const batchStart = performance.now();
          
          for (let i = 0; i < batchSize; i++) {
            manager.handleSensorData('hrv', {
              heartRate: 70 + Math.random() * 30,
              rrInterval: 800 + Math.random() * 200,
              timestamp: Date.now()
            });
            processedCount++;
          }
          
          const batchEnd = performance.now();
          const batchTime = batchEnd - batchStart;
          batches.push(batchTime);
          
          if (performance.now() - startTime >= testDuration) {
            clearInterval(processInterval);
          }
        }, 10); // Every 10ms
        
        // Wait for test completion
        await new Promise(resolve => {
          const checkInterval = setInterval(() => {
            if (performance.now() - startTime >= testDuration) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 100);
        });
        
        const endTime = performance.now();
        const actualDuration = endTime - startTime;
        
        // Calculate performance metrics
        const avgBatchTime = batches.reduce((sum, time) => sum + time, 0) / batches.length;
        const maxBatchTime = Math.max(...batches);
        const minBatchTime = Math.min(...batches);
        const throughput = processedCount / (actualDuration / 1000);
        
        console.log(`Sustained load test results:`);
        console.log(`  Duration: ${actualDuration.toFixed(2)}ms`);
        console.log(`  Processed: ${processedCount} data points`);
        console.log(`  Throughput: ${throughput.toFixed(1)} points/second`);
        console.log(`  Batch times - Avg: ${avgBatchTime.toFixed(3)}ms, Max: ${maxBatchTime.toFixed(3)}ms, Min: ${minBatchTime.toFixed(3)}ms`);
        
        // Performance requirements
        assert.equal(throughput >= 500, true, // At least 500 points/second
          `Throughput ${throughput.toFixed(1)} points/second below 500 requirement`);
        
        assert.equal(avgBatchTime < 2.0, true, // Average batch time < 2ms
          `Average batch time ${avgBatchTime.toFixed(3)}ms exceeds 2ms limit`);
        
        assert.equal(maxBatchTime < 10.0, true, // Max batch time < 10ms
          `Maximum batch time ${maxBatchTime.toFixed(3)}ms exceeds 10ms limit`);
        
        // Check for performance degradation (last 20% vs first 20%)
        const firstBatches = batches.slice(0, Math.floor(batches.length * 0.2));
        const lastBatches = batches.slice(-Math.floor(batches.length * 0.2));
        
        const firstAvg = firstBatches.reduce((sum, time) => sum + time, 0) / firstBatches.length;
        const lastAvg = lastBatches.reduce((sum, time) => sum + time, 0) / lastBatches.length;
        const degradation = (lastAvg - firstAvg) / firstAvg;
        
        console.log(`  Performance degradation: ${(degradation * 100).toFixed(1)}%`);
        
        assert.equal(degradation < 0.2, true, // Less than 20% degradation
          `Performance degraded by ${(degradation * 100).toFixed(1)}%, exceeds 20% limit`);
        
        await manager.stop();
      }
    }
  ]
};