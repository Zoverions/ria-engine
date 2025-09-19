/**
 * Resonant Health Monitor - Unit Tests
 *
 * Tests for PFI calculation accuracy, intervention logic, and system integration.
 */

import { PhysiologicalFractureIndex } from './math/PhysiologicalFractureIndex.js';
import { ResonantHealthMonitor } from './ResonantHealthMonitor.js';

class RHMTests {
  constructor() {
    this.tests = [];
    this.results = { passed: 0, failed: 0, total: 0 };
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🧪 Running Resonant Health Monitor Tests...\n');

    // PFI Calculator Tests
    await this.testPFICalculator();

    // RHM Integration Tests
    await this.testRHMIntegration();

    // Intervention Logic Tests
    await this.testInterventionLogic();

    // Display results
    this.displayResults();
  }

  /**
   * Test PFI Calculator functionality
   */
  async testPFICalculator() {
    console.log('📊 Testing PFI Calculator...');

    const pfi = new PhysiologicalFractureIndex();

    // Test 1: Normal physiological data
    this.test('Normal ECG data PFI', async () => {
      // Simulate normal ECG data (60 BPM)
      for (let i = 0; i < 300; i++) { // 30 seconds at 10Hz
        const ecgValue = 0.8 + 0.2 * Math.sin(i * 0.1);
        pfi.addClinicalData('ecg', ecgValue);
      }

      const result = await pfi.calculatePFI();
      return result && result.pfi < 0.3; // Should be low PFI for normal data
    });

    // Test 2: Abnormal EEG data (seizure-like)
    this.test('Abnormal EEG data PFI', async () => {
      // Simulate seizure-like EEG (high amplitude, irregular)
      for (let i = 0; i < 300; i++) {
        const eegValue = 50 + 30 * Math.sin(i * 0.5) + Math.random() * 20;
        pfi.addClinicalData('eeg', eegValue);
      }

      const result = await pfi.calculatePFI();
      return result && result.pfi > 0.5; // Should be elevated PFI
    });

    // Test 3: PFI components calculation
    this.test('PFI components calculation', async () => {
      const result = pfi.getPFIStatus();
      return result.components &&
             typeof result.components.spectralSlope === 'number' &&
             typeof result.components.autocorrelation === 'number' &&
             typeof result.components.skewness === 'number';
    });

    // Test 4: Signal quality assessment
    this.test('Signal quality assessment', async () => {
      const quality = pfi.getSignalQualitySummary();
      return quality.ecg && typeof quality.ecg.quality === 'number';
    });
  }

  /**
   * Test RHM integration
   */
  async testRHMIntegration() {
    console.log('🔗 Testing RHM Integration...');

    const rhm = new ResonantHealthMonitor({
      patientId: 'TEST_PATIENT',
      dataSources: { ecg: { enabled: true }, eeg: { enabled: true } }
    });

    // Test 1: RHM initialization
    this.test('RHM initialization', async () => {
      await rhm.initialize();
      const status = rhm.getPatientStatus();
      return status.patientId === 'TEST_PATIENT';
    });

    // Test 2: Clinical data ingestion
    this.test('Clinical data ingestion', async () => {
      await rhm.ingestClinicalData('ecg', 0.9, Date.now());
      const metrics = rhm.getMonitoringMetrics();
      return metrics.totalReadings >= 1;
    });

    // Test 3: Monitoring start/stop
    this.test('Monitoring lifecycle', async () => {
      await rhm.startMonitoring();
      const status1 = rhm.getPatientStatus();
      await rhm.stopMonitoring();
      const status2 = rhm.getPatientStatus();

      return status1.monitoring && !status2.monitoring;
    });
  }

  /**
   * Test intervention logic
   */
  async testInterventionLogic() {
    console.log('🚨 Testing Intervention Logic...');

    const rhm = new ResonantHealthMonitor({
      patientId: 'TEST_PATIENT',
      interventionThresholds: { gentle: 0.3, moderate: 0.6, aggressive: 0.8 }
    });

    // Test 1: Gentle intervention trigger
    this.test('Gentle intervention trigger', () => {
      let interventionTriggered = false;

      rhm.once('interventionTriggered', (intervention) => {
        interventionTriggered = intervention.type === 'gentle';
      });

      // Simulate gentle intervention trigger
      rhm.triggerInterventions({
        pfi: 0.4,
        level: 'gentle',
        components: {},
        trend: 'stable'
      });

      return interventionTriggered;
    });

    // Test 2: Moderate intervention trigger
    this.test('Moderate intervention trigger', () => {
      let interventionTriggered = false;

      rhm.once('interventionTriggered', (intervention) => {
        interventionTriggered = intervention.type === 'moderate';
      });

      // Simulate moderate intervention trigger
      rhm.triggerInterventions({
        pfi: 0.7,
        level: 'moderate',
        components: {},
        trend: 'increasing'
      });

      return interventionTriggered;
    });

    // Test 3: Aggressive intervention trigger
    this.test('Aggressive intervention trigger', () => {
      let interventionTriggered = false;

      rhm.once('interventionTriggered', (intervention) => {
        interventionTriggered = intervention.type === 'aggressive';
      });

      // Simulate aggressive intervention trigger
      rhm.triggerInterventions({
        pfi: 0.9,
        level: 'aggressive',
        components: {},
        trend: 'increasing'
      });

      return interventionTriggered;
    });
  }

  /**
   * Run a single test
   */
  async test(name, testFunction) {
    this.results.total++;

    try {
      const result = await testFunction();

      if (result) {
        console.log(`   ✅ ${name}`);
        this.results.passed++;
      } else {
        console.log(`   ❌ ${name} - Test returned false`);
        this.results.failed++;
      }
    } catch (error) {
      console.log(`   ❌ ${name} - Error: ${error.message}`);
      this.results.failed++;
    }
  }

  /**
   * Display test results
   */
  displayResults() {
    console.log('\n' + '='.repeat(50));
    console.log('🧪 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));

    console.log(`\n📊 Total Tests: ${this.results.total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);

    const successRate = (this.results.passed / this.results.total * 100).toFixed(1);
    console.log(`📈 Success Rate: ${successRate}%`);

    if (this.results.failed === 0) {
      console.log('\n🎉 All tests passed! RHM is ready for clinical deployment.');
    } else {
      console.log('\n⚠️  Some tests failed. Review and fix before deployment.');
    }

    console.log('='.repeat(50));
  }
}

// Export for use in other modules
export { RHMTests };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tests = new RHMTests();
  tests.runAllTests().catch(console.error);
}