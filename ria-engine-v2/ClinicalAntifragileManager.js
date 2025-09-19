/**
 * Clinical Antifragile Manager - Specialized for Healthcare Crisis Learning
 *
 * Extends the base AntifragileManager to handle clinical crises and patient-specific
 * physiological fracture patterns. Learns from medical events to build personalized
 * crisis prediction models that reduce false positives and improve accuracy.
 *
 * Key Adaptations for Healthcare:
 * - Clinical crisis pattern recognition
 * - Patient-specific physiological baselines
 * - Medical intervention outcome learning
 * - Integration with clinical decision support
 */

import { AntifragileManager } from './AntifragileManager.js';

export class ClinicalAntifragileManager extends AntifragileManager {
  constructor(config = {}) {
    // Extend base config with clinical parameters
    const clinicalConfig = {
      // Clinical-specific learning parameters
      clinicalLearning: {
        crisisMemorySize: 100,
        patientProfileSize: 50,
        interventionLearning: true,
        outcomeTracking: true,
        falsePositivePenalty: 0.3,
        crisisSeverityWeighting: true
      },

      // Physiological pattern recognition
      physiologicalPatterns: {
        seizure: {
          eegMarkers: ['spike_wave', 'rhythmic_discharges'],
          pfiThreshold: 0.8,
          precursorWindow: 300 // 5 minutes
        },
        cardiac: {
          ecgMarkers: ['arrhythmia', 'st_elevation'],
          pfiThreshold: 0.85,
          precursorWindow: 600 // 10 minutes
        },
        sepsis: {
          vitalMarkers: ['temp_elevation', 'tachycardia', 'hypotension'],
          pfiThreshold: 0.75,
          precursorWindow: 1800 // 30 minutes
        },
        respiratory: {
          spo2Markers: ['desaturation', 'apnea'],
          pfiThreshold: 0.8,
          precursorWindow: 300 // 5 minutes
        }
      },

      // Patient-specific adaptation
      patientAdaptation: {
        baselineWindow: 24 * 60 * 60 * 1000, // 24 hours
        adaptationRate: 0.1,
        minimumSamples: 10,
        confidenceThreshold: 0.7
      },

      ...config
    };

    super(clinicalConfig);

    // Clinical-specific state
    this.clinicalState = {
      patientProfiles: new Map(), // patientId -> profile
      crisisPatterns: new Map(), // patternType -> patterns
      interventionOutcomes: new Map(), // interventionId -> outcomes
      physiologicalBaselines: new Map(), // patientId -> baselines
      falsePositiveHistory: [],
      clinicalMetrics: {
        totalCrises: 0,
        preventedCrises: 0,
        falsePositives: 0,
        interventionSuccessRate: 0,
        patientSpecificity: 0
      }
    };

    // Initialize clinical pattern recognition
    this.initializeClinicalPatterns();
  }

  /**
   * Initialize clinical pattern recognition
   */
  initializeClinicalPatterns() {
    // Initialize crisis pattern databases
    for (const [patternType, config] of Object.entries(this.config.physiologicalPatterns)) {
      this.clinicalState.crisisPatterns.set(patternType, {
        patterns: [],
        successRate: 0,
        falsePositiveRate: 0,
        averageLeadTime: 0,
        config
      });
    }

    console.log('🩺 Clinical Antifragile Manager initialized with physiological pattern recognition');
  }

  /**
   * Process clinical frame data
   */
  async processClinicalFrame(frameData) {
    // Extract clinical context
    const clinicalContext = this.extractClinicalContext(frameData);

    // Add clinical context to frame
    const enrichedFrame = {
      ...frameData,
      clinicalContext,
      patientId: frameData.patientId,
      crisisType: this.detectCrisisType(frameData),
      physiologicalMarkers: this.extractPhysiologicalMarkers(frameData)
    };

    // Process through base antifragile system
    await super.processFrame(enrichedFrame);

    // Clinical-specific processing
    await this.processClinicalLearning(enrichedFrame);

    // Update patient profile
    this.updatePatientProfile(enrichedFrame);
  }

  /**
   * Extract clinical context from frame data
   */
  extractClinicalContext(frameData) {
    return {
      patientId: frameData.patientId,
      department: frameData.department || 'unknown',
      careLevel: frameData.careLevel || 'ward', // ICU, ward, etc.
      comorbidities: frameData.comorbidities || [],
      medications: frameData.medications || [],
      recentProcedures: frameData.recentProcedures || [],
      vitalSigns: frameData.vitalSigns || {},
      labResults: frameData.labResults || {},
      timestamp: frameData.timestamp || Date.now()
    };
  }

  /**
   * Detect potential crisis type from physiological data
   */
  detectCrisisType(frameData) {
    const { pfi, components } = frameData;

    // Analyze PFI components for crisis patterns
    if (components?.spectralSlope > 0.7 && frameData.eegData) {
      return 'seizure';
    }

    if (components?.autocorrelation > 0.8 && frameData.ecgData) {
      return 'cardiac';
    }

    if (pfi > 0.75 && this.hasSepsisMarkers(frameData)) {
      return 'sepsis';
    }

    if (frameData.spo2 < 90 || frameData.respiratoryRate > 30) {
      return 'respiratory';
    }

    return 'general';
  }

  /**
   * Extract physiological markers from frame data
   */
  extractPhysiologicalMarkers(frameData) {
    const markers = [];

    // EEG markers
    if (frameData.eegData) {
      if (this.detectSpikeWave(frameData.eegData)) {
        markers.push('spike_wave');
      }
      if (this.detectRhythmicDischarges(frameData.eegData)) {
        markers.push('rhythmic_discharges');
      }
    }

    // ECG markers
    if (frameData.ecgData) {
      if (this.detectArrhythmia(frameData.ecgData)) {
        markers.push('arrhythmia');
      }
      if (this.detectSTElevation(frameData.ecgData)) {
        markers.push('st_elevation');
      }
    }

    // Vital sign markers
    if (frameData.temperature > 38.5) {
      markers.push('temp_elevation');
    }
    if (frameData.heartRate > 100) {
      markers.push('tachycardia');
    }
    if (frameData.bloodPressure?.systolic < 90) {
      markers.push('hypotension');
    }

    return markers;
  }

  /**
   * Process clinical-specific learning
   */
  async processClinicalLearning(frameData) {
    // Update crisis patterns
    this.updateCrisisPatterns(frameData);

    // Learn from interventions
    if (frameData.intervention) {
      await this.learnFromIntervention(frameData);
    }

    // Update physiological baselines
    this.updatePhysiologicalBaselines(frameData);

    // Track false positives
    if (frameData.falsePositive) {
      this.trackFalsePositive(frameData);
    }
  }

  /**
   * Update crisis pattern recognition
   */
  updateCrisisPatterns(frameData) {
    const crisisType = frameData.crisisType;
    const patternData = this.clinicalState.crisisPatterns.get(crisisType);

    if (!patternData) return;

    // Extract pattern from precursor data
    const pattern = this.extractCrisisPattern(frameData);

    if (pattern) {
      patternData.patterns.push({
        pattern,
        timestamp: frameData.timestamp,
        outcome: frameData.crisis ? 'crisis' : 'stable',
        confidence: frameData.pfi || 0
      });

      // Maintain pattern history size
      if (patternData.patterns.length > this.config.clinicalLearning.crisisMemorySize) {
        patternData.patterns.shift();
      }

      // Update pattern statistics
      this.updatePatternStatistics(patternData);
    }
  }

  /**
   * Extract crisis pattern from frame data
   */
  extractCrisisPattern(frameData) {
    const pattern = {
      pfi: frameData.pfi || 0,
      trend: frameData.trend || 'stable',
      markers: frameData.physiologicalMarkers || [],
      vitals: {
        heartRate: frameData.heartRate,
        bloodPressure: frameData.bloodPressure,
        temperature: frameData.temperature,
        respiratoryRate: frameData.respiratoryRate,
        spo2: frameData.spo2
      },
      clinicalContext: frameData.clinicalContext
    };

    return pattern;
  }

  /**
   * Update pattern recognition statistics
   */
  updatePatternStatistics(patternData) {
    const patterns = patternData.patterns;
    if (patterns.length < 5) return; // Need minimum samples

    const recentPatterns = patterns.slice(-20); // Last 20 patterns

    // Calculate success rate (true positives)
    const truePositives = recentPatterns.filter(p => p.outcome === 'crisis').length;
    const totalCrises = recentPatterns.length;
    patternData.successRate = truePositives / totalCrises;

    // Calculate false positive rate
    const falsePositives = recentPatterns.filter(p =>
      p.outcome === 'stable' && p.confidence > 0.7
    ).length;
    const totalPredictions = recentPatterns.filter(p => p.confidence > 0.7).length;
    patternData.falsePositiveRate = totalPredictions > 0 ? falsePositives / totalPredictions : 0;

    // Calculate average lead time
    const leadTimes = recentPatterns
      .filter(p => p.outcome === 'crisis')
      .map(p => p.timestamp - (p.detectionTime || p.timestamp));
    patternData.averageLeadTime = leadTimes.length > 0 ?
      leadTimes.reduce((sum, time) => sum + time, 0) / leadTimes.length : 0;
  }

  /**
   * Learn from intervention outcomes
   */
  async learnFromIntervention(frameData) {
    const intervention = frameData.intervention;
    const outcome = frameData.interventionOutcome;

    if (!intervention || !outcome) return;

    // Store intervention outcome
    this.clinicalState.interventionOutcomes.set(intervention.id, {
      intervention,
      outcome,
      frameData,
      timestamp: Date.now()
    });

    // Update intervention success patterns
    this.updateInterventionPatterns(intervention, outcome);

    // Learn intervention timing
    this.learnOptimalInterventionTiming(intervention, outcome);
  }

  /**
   * Update patient-specific profile
   */
  updatePatientProfile(frameData) {
    const patientId = frameData.patientId;
    if (!patientId) return;

    let profile = this.clinicalState.patientProfiles.get(patientId);

    if (!profile) {
      profile = this.initializePatientProfile(patientId);
      this.clinicalState.patientProfiles.set(patientId, profile);
    }

    // Update profile with new data
    this.updateProfileData(profile, frameData);

    // Update physiological baselines
    this.updatePatientBaselines(profile, frameData);

    // Learn patient-specific patterns
    this.learnPatientPatterns(profile, frameData);
  }

  /**
   * Initialize patient profile
   */
  initializePatientProfile(patientId) {
    return {
      patientId,
      created: Date.now(),
      baselineData: {
        vitals: {},
        pfi: { mean: 0, std: 0, samples: [] },
        patterns: [],
        crisisHistory: [],
        interventionHistory: []
      },
      adaptationData: {
        falsePositivePatterns: [],
        optimalThresholds: {},
        preferredInterventions: [],
        riskFactors: []
      },
      statistics: {
        totalMonitoringTime: 0,
        crisesExperienced: 0,
        interventionsReceived: 0,
        falsePositives: 0
      }
    };
  }

  /**
   * Update profile with new frame data
   */
  updateProfileData(profile, frameData) {
    // Update PFI baseline
    const pfiSamples = profile.baselineData.pfi.samples;
    pfiSamples.push(frameData.pfi || 0);

    // Maintain sample window
    if (pfiSamples.length > this.config.patientAdaptation.baselineWindow / (5 * 60 * 1000)) { // 5 min intervals
      pfiSamples.shift();
    }

    // Recalculate PFI statistics
    if (pfiSamples.length >= this.config.patientAdaptation.minimumSamples) {
      profile.baselineData.pfi.mean = pfiSamples.reduce((sum, val) => sum + val, 0) / pfiSamples.length;
      profile.baselineData.pfi.std = Math.sqrt(
        pfiSamples.reduce((sum, val) => sum + Math.pow(val - profile.baselineData.pfi.mean, 2), 0) / pfiSamples.length
      );
    }

    // Update vital sign baselines
    this.updateVitalBaselines(profile, frameData);
  }

  /**
   * Update vital sign baselines
   */
  updateVitalBaselines(profile, frameData) {
    const vitals = ['heartRate', 'bloodPressure', 'temperature', 'respiratoryRate', 'spo2'];

    vitals.forEach(vital => {
      if (frameData[vital] !== undefined) {
        if (!profile.baselineData.vitals[vital]) {
          profile.baselineData.vitals[vital] = { samples: [], mean: 0, std: 0 };
        }

        const vitalData = profile.baselineData.vitals[vital];
        vitalData.samples.push(frameData[vital]);

        // Maintain sample window
        if (vitalData.samples.length > 100) {
          vitalData.samples.shift();
        }

        // Update statistics
        if (vitalData.samples.length >= 10) {
          vitalData.mean = vitalData.samples.reduce((sum, val) => sum + val, 0) / vitalData.samples.length;
          vitalData.std = Math.sqrt(
            vitalData.samples.reduce((sum, val) => sum + Math.pow(val - vitalData.mean, 2), 0) / vitalData.samples.length
          );
        }
      }
    });
  }

  /**
   * Learn patient-specific patterns
   */
  learnPatientPatterns(profile, frameData) {
    // Identify patient-specific crisis precursors
    if (frameData.pfi > 0.6) {
      const pattern = {
        timestamp: frameData.timestamp,
        pfi: frameData.pfi,
        vitals: this.extractVitalsFromFrame(frameData),
        context: frameData.clinicalContext,
        outcome: frameData.crisis ? 'crisis' : 'warning'
      };

      profile.baselineData.patterns.push(pattern);

      // Maintain pattern history
      if (profile.baselineData.patterns.length > this.config.clinicalLearning.patientProfileSize) {
        profile.baselineData.patterns.shift();
      }
    }

    // Learn false positive patterns
    if (frameData.falsePositive) {
      profile.adaptationData.falsePositivePatterns.push({
        timestamp: frameData.timestamp,
        pfi: frameData.pfi,
        reason: frameData.falsePositiveReason,
        context: frameData.clinicalContext
      });
    }
  }

  /**
   * Get patient-specific PFI threshold
   */
  getPatientSpecificThreshold(patientId, baseThreshold) {
    const profile = this.clinicalState.patientProfiles.get(patientId);
    if (!profile) return baseThreshold;

    // Adjust threshold based on patient baseline
    const pfiBaseline = profile.baselineData.pfi;
    if (pfiBaseline.samples.length >= this.config.patientAdaptation.minimumSamples) {
      // Adjust threshold based on patient's normal PFI variation
      const adjustedThreshold = baseThreshold + (pfiBaseline.std * 0.5);
      return Math.min(adjustedThreshold, 0.9); // Cap at 0.9
    }

    return baseThreshold;
  }

  /**
   * Predict patient-specific crisis probability
   */
  predictPatientCrisis(patientId, currentData) {
    const profile = this.clinicalState.patientProfiles.get(patientId);
    if (!profile) return 0.5; // Default probability

    let riskScore = 0;
    let factors = 0;

    // Compare current vitals to patient baseline
    const vitals = this.extractVitalsFromFrame(currentData);
    for (const [vital, value] of Object.entries(vitals)) {
      const baseline = profile.baselineData.vitals[vital];
      if (baseline && baseline.samples.length >= 10) {
        const deviation = Math.abs(value - baseline.mean) / baseline.std;
        if (deviation > 2) { // 2 standard deviations
          riskScore += deviation * 0.1;
          factors++;
        }
      }
    }

    // Check against known patient patterns
    const matchingPatterns = profile.baselineData.patterns.filter(pattern =>
      this.patternMatches(pattern, currentData)
    );

    if (matchingPatterns.length > 0) {
      const crisisPatterns = matchingPatterns.filter(p => p.outcome === 'crisis');
      riskScore += (crisisPatterns.length / matchingPatterns.length) * 0.3;
      factors++;
    }

    return factors > 0 ? Math.min(riskScore / factors, 1) : 0.5;
  }

  /**
   * Check if current data matches a known pattern
   */
  patternMatches(pattern, currentData) {
    // Simple pattern matching - could be enhanced with ML
    const pfiMatch = Math.abs(pattern.pfi - currentData.pfi) < 0.1;
    const vitalMatches = Object.entries(pattern.vitals).every(([vital, value]) =>
      Math.abs(value - currentData[vital]) < (currentData[vital] * 0.1) // 10% tolerance
    );

    return pfiMatch && vitalMatches;
  }

  /**
   * Get clinical learning status
   */
  getClinicalStatus() {
    const baseStatus = super.getStatus();

    return {
      ...baseStatus,
      clinical: {
        patientProfiles: this.clinicalState.patientProfiles.size,
        crisisPatterns: Object.fromEntries(
          Array.from(this.clinicalState.crisisPatterns.entries()).map(([type, data]) => [
            type,
            {
              patterns: data.patterns.length,
              successRate: data.successRate,
              falsePositiveRate: data.falsePositiveRate,
              averageLeadTime: data.averageLeadTime
            }
          ])
        ),
        interventionOutcomes: this.clinicalState.interventionOutcomes.size,
        metrics: this.clinicalState.clinicalMetrics
      }
    };
  }

  /**
   * Export patient-specific model
   */
  exportPatientModel(patientId) {
    const profile = this.clinicalState.patientProfiles.get(patientId);
    if (!profile) return null;

    return {
      patientId,
      exportTime: Date.now(),
      baselineData: profile.baselineData,
      adaptationData: profile.adaptationData,
      statistics: profile.statistics,
      patterns: profile.baselineData.patterns,
      config: this.config
    };
  }

  /**
   * Import patient-specific model
   */
  importPatientModel(model) {
    if (!model.patientId) return false;

    this.clinicalState.patientProfiles.set(model.patientId, {
      ...model,
      imported: Date.now()
    });

    return true;
  }

  // Helper methods for physiological marker detection
  detectSpikeWave(eegData) { return Math.random() > 0.95; } // Placeholder
  detectRhythmicDischarges(eegData) { return Math.random() > 0.97; } // Placeholder
  detectArrhythmia(ecgData) { return Math.random() > 0.96; } // Placeholder
  detectSTElevation(ecgData) { return Math.random() > 0.98; } // Placeholder
  hasSepsisMarkers(frameData) {
    return (frameData.temperature > 38 || frameData.heartRate > 90 || frameData.bloodPressure?.systolic < 100);
  }

  extractVitalsFromFrame(frameData) {
    return {
      heartRate: frameData.heartRate,
      bloodPressure: frameData.bloodPressure,
      temperature: frameData.temperature,
      respiratoryRate: frameData.respiratoryRate,
      spo2: frameData.spo2
    };
  }

  updateInterventionPatterns(intervention, outcome) {
    // Placeholder for intervention pattern learning
  }

  learnOptimalInterventionTiming(intervention, outcome) {
    // Placeholder for timing optimization
  }

  updatePhysiologicalBaselines(frameData) {
    // Placeholder for baseline updates
  }

  trackFalsePositive(frameData) {
    this.clinicalState.falsePositiveHistory.push(frameData);
    this.clinicalState.clinicalMetrics.falsePositives++;
  }
}

export default ClinicalAntifragileManager;