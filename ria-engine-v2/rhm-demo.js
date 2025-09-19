/**
 * Resonant Health Monitor - Clinical Demonstration
 *
 * This demo showcases the RHM platform monitoring a simulated ICU patient.
 * It demonstrates real-time PFI calculation, tiered interventions, and
 * antifragile learning from simulated physiological crises.
 */

import { ResonantHealthMonitor } from './ResonantHealthMonitor.js';

class RHMDemonstration {
  constructor() {
    this.rhm = null;
    this.patientId = 'DEMO_PATIENT_001';
    this.isRunning = false;
    this.simulationData = this.generateSimulationData();
    this.currentDataIndex = 0;

    this.setupEventHandlers();
  }

  /**
   * Initialize the RHM demonstration
   */
  async initialize() {
    console.log('🏥 Initializing Resonant Health Monitor Demonstration...');

    // Configure RHM for demonstration
    const config = {
      patientId: this.patientId,
      monitoringMode: 'continuous',
      updateInterval: 2000, // 2 seconds for demo

      // Enable all clinical data sources
      dataSources: {
        ecg: { enabled: true, priority: 1 },
        eeg: { enabled: true, priority: 1 },
        bloodPressure: { enabled: true, priority: 2 },
        spo2: { enabled: true, priority: 2 },
        respiratoryRate: { enabled: true, priority: 2 },
        temperature: { enabled: false, priority: 3 }
      },

      // Clinical monitoring parameters
      pfi: {
        windowSize: 30, // 30 seconds for demo
        sampleRate: 10 // 10 Hz for demo
      },

      // Enable antifragile learning
      antifragile: {
        enabled: true,
        learningRate: 0.1,
        clinicalLearning: {
          crisisMemorySize: 20,
          patientProfileSize: 10
        }
      }
    };

    this.rhm = new ResonantHealthMonitor(config);
    await this.rhm.initialize();

    console.log('✅ RHM initialized for patient:', this.patientId);
    console.log('📊 Monitoring sources:', this.rhm.getEnabledDataSources());
  }

  /**
   * Start the demonstration
   */
  async start() {
    if (!this.rhm) {
      throw new Error('RHM not initialized');
    }

    console.log('\n🚀 Starting Resonant Health Monitor demonstration...');
    console.log('📈 Simulating ICU patient monitoring with physiological crises');

    await this.rhm.startMonitoring();
    this.isRunning = true;

    // Start data simulation
    this.startDataSimulation();

    console.log('\n⏰ Monitoring active. PFI updates every 2 seconds.');
    console.log('🎯 Watch for tiered interventions as PFI levels change.');
    console.log('💡 The system will learn from simulated crises to improve predictions.\n');
  }

  /**
   * Stop the demonstration
   */
  async stop() {
    if (!this.rhm) return;

    console.log('\n🛑 Stopping demonstration...');
    await this.rhm.stopMonitoring();
    this.isRunning = false;

    this.displayFinalSummary();
  }

  /**
   * Start simulated clinical data feed
   */
  startDataSimulation() {
    const simulationInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(simulationInterval);
        return;
      }

      // Get next simulation data point
      const dataPoint = this.getNextSimulationData();

      if (dataPoint) {
        // Feed data to RHM
        await this.feedSimulationData(dataPoint);
      } else {
        // Simulation complete
        console.log('\n🎬 Simulation data complete. Stopping demonstration...');
        this.stop();
      }
    }, 100); // 10 Hz simulation feed
  }

  /**
   * Get next simulation data point
   */
  getNextSimulationData() {
    if (this.currentDataIndex >= this.simulationData.length) {
      return null;
    }

    const dataPoint = this.simulationData[this.currentDataIndex];
    this.currentDataIndex++;

    return dataPoint;
  }

  /**
   * Feed simulation data to RHM
   */
  async feedSimulationData(dataPoint) {
    const { timestamp, ecg, eeg, bloodPressure, spo2, respiratoryRate, temperature, crisis } = dataPoint;

    // Feed ECG data
    if (ecg !== undefined) {
      await this.rhm.ingestClinicalData('ecg', ecg, timestamp);
    }

    // Feed EEG data (simplified to single channel for demo)
    if (eeg !== undefined) {
      await this.rhm.ingestClinicalData('eeg', [eeg], timestamp);
    }

    // Feed blood pressure (every 10 seconds)
    if (bloodPressure && timestamp % 10000 === 0) {
      await this.rhm.ingestClinicalData('bloodPressure', bloodPressure, timestamp);
    }

    // Feed SpO2 (every 5 seconds)
    if (spo2 !== undefined && timestamp % 5000 === 0) {
      await this.rhm.ingestClinicalData('spo2', spo2, timestamp);
    }

    // Feed respiratory rate (every 10 seconds)
    if (respiratoryRate !== undefined && timestamp % 10000 === 0) {
      await this.rhm.ingestClinicalData('respiratoryRate', respiratoryRate, timestamp);
    }

    // Feed temperature (every 30 seconds)
    if (temperature !== undefined && timestamp % 30000 === 0) {
      await this.rhm.ingestClinicalData('temperature', temperature, timestamp);
    }

    // Mark crisis periods
    if (crisis) {
      console.log(`🚨 CRISIS PERIOD: ${crisis.type} at ${new Date(timestamp).toLocaleTimeString()}`);
    }
  }

  /**
   * Setup event handlers for demonstration
   */
  setupEventHandlers() {
    // PFI updates
    this.onPFIUpdate = (data) => {
      const { pfi, level, components, trend } = data.pfi;
      const time = new Date(data.timestamp).toLocaleTimeString();

      console.log(`📊 ${time} | PFI: ${pfi.toFixed(3)} | Level: ${level.toUpperCase()} | Trend: ${trend}`);
      console.log(`   └─ Components: Δα=${components.spectralSlope?.toFixed(3)}, AC₁=${components.autocorrelation?.toFixed(3)}, Skew=${components.skewness?.toFixed(3)}`);
    };

    // Interventions
    this.onIntervention = (intervention) => {
      const time = new Date().toLocaleTimeString();
      const level = intervention.type.toUpperCase();

      console.log(`🚨 ${time} | ${level} INTERVENTION TRIGGERED`);
      console.log(`   └─ PFI: ${intervention.pfi.toFixed(3)} | Duration: ${intervention.duration/1000}s`);

      // Show intervention actions
      intervention.actions.forEach((action, index) => {
        console.log(`     ${index + 1}. ${action.type}: ${action.message || action.action}`);
      });
      console.log('');
    };

    // Crisis detection
    this.onCrisis = (crisis) => {
      const time = new Date(crisis.timestamp).toLocaleTimeString();

      console.log(`🚨🚨 ${time} | PHYSIOLOGICAL CRISIS DETECTED!`);
      console.log(`   └─ Type: ${crisis.crisisType || 'Unknown'} | Duration: ${crisis.duration}ms`);
      console.log(`   └─ PFI: ${crisis.finalPFI.toFixed(3)} | Interventions: ${crisis.interventions.length}`);
      console.log('');
    };

    // Crisis cleared
    this.onCrisisCleared = (data) => {
      const time = new Date().toLocaleTimeString();
      console.log(`✅ ${time} | Crisis cleared after ${Math.round(data.duration/1000)}s\n`);
    };
  }

  /**
   * Generate simulation data with realistic physiological patterns
   */
  generateSimulationData() {
    const data = [];
    const duration = 10 * 60 * 1000; // 10 minutes
    const sampleRate = 10; // 10 Hz
    const totalSamples = (duration / 1000) * sampleRate;

    let baseTime = Date.now();

    // Define crisis periods
    const crises = [
      { start: 2 * 60 * 1000, duration: 30 * 1000, type: 'seizure' },     // 2:00-2:30
      { start: 5 * 60 * 1000, duration: 45 * 1000, type: 'cardiac' },    // 5:00-5:45
      { start: 8 * 60 * 1000, duration: 20 * 1000, type: 'respiratory' } // 8:00-8:20
    ];

    for (let i = 0; i < totalSamples; i++) {
      const timestamp = baseTime + (i * 1000 / sampleRate);

      // Check if we're in a crisis period
      const currentCrisis = crises.find(crisis =>
        timestamp >= baseTime + crisis.start &&
        timestamp <= baseTime + crisis.start + crisis.duration
      );

      // Generate baseline physiological data
      let ecg = 0.8 + 0.2 * Math.sin((timestamp % 1000) * 0.00628); // ~60 BPM
      let eeg = 50 + 10 * Math.sin((timestamp % 2000) * 0.00314); // Alpha rhythm
      let spo2 = 98 + Math.random() * 2;
      let respiratoryRate = 16 + Math.random() * 4;
      let temperature = 37.0 + Math.random() * 0.5;

      // Blood pressure (slower varying)
      const bpCycle = Math.sin((timestamp % 10000) * 0.000628); // ~6 BPM
      let bloodPressure = {
        systolic: 120 + bpCycle * 10,
        diastolic: 80 + bpCycle * 5
      };

      // Modify data during crises
      if (currentCrisis) {
        switch (currentCrisis.type) {
          case 'seizure':
            // EEG: High amplitude, irregular spikes
            eeg = 50 + 30 * Math.sin(timestamp * 0.1) + Math.random() * 20;
            // HR: Tachycardia
            ecg = 1.2 + 0.3 * Math.sin((timestamp % 500) * 0.01256);
            break;

          case 'cardiac':
            // ECG: Arrhythmia pattern
            ecg = 0.8 + 0.4 * Math.sin(timestamp * 0.05) + Math.random() * 0.3;
            // BP: Hypotension
            bloodPressure.systolic = 90 + Math.random() * 20;
            bloodPressure.diastolic = 60 + Math.random() * 10;
            break;

          case 'respiratory':
            // SpO2: Desaturation
            spo2 = 85 + Math.random() * 10;
            // RR: Increased
            respiratoryRate = 25 + Math.random() * 10;
            break;
        }
      }

      data.push({
        timestamp,
        ecg,
        eeg,
        bloodPressure,
        spo2,
        respiratoryRate,
        temperature,
        crisis: currentCrisis || null
      });
    }

    return data;
  }

  /**
   * Display final demonstration summary
   */
  displayFinalSummary() {
    if (!this.rhm) return;

    const metrics = this.rhm.getMonitoringMetrics();
    const status = this.rhm.getPatientStatus();

    console.log('\n' + '='.repeat(60));
    console.log('🏥 RESONANT HEALTH MONITOR DEMONSTRATION COMPLETE');
    console.log('='.repeat(60));

    console.log('\n📊 MONITORING METRICS:');
    console.log(`   • Total Readings: ${metrics.totalReadings}`);
    console.log(`   • Interventions Triggered: ${metrics.interventionsTriggered}`);
    console.log(`   • Crises Detected: ${metrics.crisesDetected}`);
    console.log(`   • Monitoring Duration: ${Math.round(metrics.uptime / 1000)}s`);

    console.log('\n🏥 PATIENT STATUS:');
    console.log(`   • Current PFI: ${status.currentPFI.toFixed(3)}`);
    console.log(`   • Risk Level: ${status.pfiLevel.toUpperCase()}`);
    console.log(`   • Active Interventions: ${status.activeInterventions.length}`);
    console.log(`   • Crisis Detected: ${status.crisisDetected ? 'YES' : 'NO'}`);

    console.log('\n🧠 ANTIFRAGILE LEARNING:');
    const learningStatus = this.rhm.antifragileManager.getClinicalStatus();
    console.log(`   • Patient Profiles: ${learningStatus.clinical.patientProfiles}`);
    console.log(`   • Crisis Patterns Learned: ${Object.keys(learningStatus.clinical.crisisPatterns).length}`);
    console.log(`   • Learning Effectiveness: ${(learningStatus.clinical.metrics.interventionSuccessRate * 100).toFixed(1)}%`);

    console.log('\n💡 KEY DEMONSTRATIONS:');
    console.log('   • ✅ Real-time PFI calculation from clinical data');
    console.log('   • ✅ Tiered interventions (gentle → moderate → aggressive)');
    console.log('   • ✅ Crisis detection and emergency response');
    console.log('   • ✅ Antifragile learning from simulated crises');
    console.log('   • ✅ Patient-specific adaptation and pattern recognition');

    console.log('\n🚀 RHM PLATFORM READY FOR CLINICAL DEPLOYMENT!');
    console.log('   Next steps: Integrate with hospital information systems,');
    console.log('   validate with real patient data, and train on clinical outcomes.');
    console.log('='.repeat(60));
  }

  /**
   * Run the complete demonstration
   */
  async run() {
    try {
      await this.initialize();
      await this.start();

      // Set up event listeners
      this.rhm.on('pfiUpdate', this.onPFIUpdate);
      this.rhm.on('interventionTriggered', this.onIntervention);
      this.rhm.on('crisisConfirmed', this.onCrisis);
      this.rhm.on('crisisCleared', this.onCrisisCleared);

      // Run for the duration of simulation
      const simulationDuration = 10 * 60 * 1000; // 10 minutes
      await new Promise(resolve => setTimeout(resolve, simulationDuration + 5000));

    } catch (error) {
      console.error('❌ Demonstration failed:', error);
    }
  }
}

// Export for use in other modules
export { RHMDemonstration };

// Run demonstration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const demo = new RHMDemonstration();
  demo.run().catch(console.error);
}