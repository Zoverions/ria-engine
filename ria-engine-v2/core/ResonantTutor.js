const EventEmitter = require('events');
const { CognitiveFractureIndex } = require('../core/math/CognitiveFractureIndex');
const { EducationalAntifragileManager } = require('../antifragile/EducationalAntifragileManager');

class ResonantTutor extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            cfiThresholds: {
                gentle: 0.3,      // Suggest hints or slower pacing
                moderate: 0.6,    // Adaptive content and active retrieval
                aggressive: 0.8   // Intervene with mastery loop and breaks
            },
            interventionCooldown: 20000,
            pacing: 'adaptive',
            maxSessionLength: 45 * 60 * 1000, // 45 minutes
            ...config
        };

        this.cfiCalculator = new CognitiveFractureIndex();
        this.antifragileManager = new EducationalAntifragileManager();
        this.activeInterventions = new Map();
        this.studentProfiles = new Map(); // studentId -> profile
        this.sessionState = new Map(); // studentId -> session state

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.cfiCalculator.on('cfiCalculated', (data) => {
            this.processCFIUpdate(data);
        });

        this.antifragileManager.on('interventionLearned', (data) => {
            this.applyLearnedIntervention(data);
        });
    }

    async startSession(studentId, profile = {}) {
        const sessionId = `session_${studentId}_${Date.now()}`;

        this.studentProfiles.set(studentId, {
            preferences: {
                learningStyle: 'mixed', // visual, auditory, kinesthetic, mixed
                pace: 'moderate',
                ...profile.preferences
            },
            goals: profile.goals || [],
            baseline: profile.baseline || {}
        });

        this.sessionState.set(studentId, {
            sessionId,
            startTime: Date.now(),
            lastIntervention: null,
            progress: 0,
            contentPath: [],
            currentActivity: null
        });

        await this.antifragileManager.initialize();

        this.emit('sessionStarted', { studentId, sessionId, profile: this.studentProfiles.get(studentId) });
        return sessionId;
    }

    async endSession(studentId) {
        const state = this.sessionState.get(studentId);
        if (!state) return false;

        await this.antifragileManager.shutdown();

        this.emit('sessionEnded', {
            studentId,
            sessionId: state.sessionId,
            duration: Date.now() - state.startTime,
            progress: state.progress
        });

        this.sessionState.delete(studentId);
        return true;
    }

    addInteraction(studentId, interactionData) {
        this.cfiCalculator.addCognitiveData(studentId, interactionData);
    }

    processCFIUpdate({ studentId, cfi, components, timestamp, confidence }) {
        const state = this.sessionState.get(studentId);
        if (!state) return;

        const level = this.determineInterventionLevel(cfi);
        if (level && this.shouldTriggerIntervention(state)) {
            this.triggerIntervention(studentId, level, { studentId, cfi, components, timestamp, confidence });
        }

        this.emit('studentStateUpdate', {
            studentId,
            cfi,
            level,
            progress: state.progress,
            confidence
        });
    }

    determineInterventionLevel(cfi) {
        if (cfi >= this.config.cfiThresholds.aggressive) return 'aggressive';
        if (cfi >= this.config.cfiThresholds.moderate) return 'moderate';
        if (cfi >= this.config.cfiThresholds.gentle) return 'gentle';
        return null;
    }

    shouldTriggerIntervention(state) {
        const now = Date.now();
        if (!state.lastIntervention) return true;
        return now - state.lastIntervention >= this.config.interventionCooldown;
    }

    triggerIntervention(studentId, level, cfiData) {
        const interventionId = `intervention_${studentId}_${Date.now()}_${level}`;

        let intervention;
        switch (level) {
            case 'gentle':
                intervention = this.createGentleIntervention(studentId, cfiData);
                break;
            case 'moderate':
                intervention = this.createModerateIntervention(studentId, cfiData);
                break;
            case 'aggressive':
                intervention = this.createAggressiveIntervention(studentId, cfiData);
                break;
        }

        if (intervention) {
            this.activeInterventions.set(interventionId, {
                ...intervention,
                id: interventionId,
                level,
                studentId,
                timestamp: Date.now(),
                cfiAtTrigger: cfiData.cfi
            });

            const state = this.sessionState.get(studentId);
            state.lastIntervention = Date.now();

            this.antifragileManager.processEducationalFrame({ studentId, ...cfiData, intervention });

            this.emit('interventionTriggered', { interventionId, level, studentId, intervention, cfiData });
        }
    }

    createGentleIntervention(studentId, cfiData) {
        const profile = this.studentProfiles.get(studentId) || {};
        return {
            type: 'adaptive_hinting',
            actions: [
                {
                    action: 'provide_hint',
                    hintLevel: 'contextual',
                    reason: 'Slight cognitive struggle detected'
                },
                {
                    action: 'adjust_pacing',
                    pace: 'slower',
                    reason: 'Reduce cognitive load subtly'
                }
            ],
            expectedImpact: {
                stressReduction: 0.1,
                engagementIncrease: 0.05
            }
        };
    }

    createModerateIntervention(studentId, cfiData) {
        const profile = this.studentProfiles.get(studentId) || {};
        return {
            type: 'content_adaptation',
            actions: [
                {
                    action: 'switch_strategy',
                    strategy: 'active_retrieval',
                    reason: 'Moderate cognitive fracture; switch to retrieval practice'
                },
                {
                    action: 'insert_micro_break',
                    duration: '60s',
                    reason: 'Short break to restore attention'
                },
                {
                    action: 'adaptive_practice',
                    difficultyAdjust: -0.1,
                    reason: 'Slightly reduce difficulty to rebuild momentum'
                }
            ],
            expectedImpact: {
                learningMomentum: 0.2,
                errorReduction: 0.15
            }
        };
    }

    createAggressiveIntervention(studentId, cfiData) {
        const profile = this.studentProfiles.get(studentId) || {};
        return {
            type: 'mastery_loop',
            actions: [
                {
                    action: 'focus_foundation',
                    reason: 'High fracture; reinforce foundational knowledge'
                },
                {
                    action: 'guided_practice',
                    reason: 'Step-by-step guidance to regain confidence'
                },
                {
                    action: 'long_break',
                    duration: '5m',
                    reason: 'Reduce cognitive overwhelm'
                }
            ],
            expectedImpact: {
                confidenceRestoration: 0.4,
                conceptMastery: 0.3
            }
        };
    }

    applyLearnedIntervention(learnedData) {
        const { interventionType, effectiveness, adjustments } = learnedData;

        // Update thresholds or pacing based on learning
        if (adjustments?.thresholds) {
            this.config.cfiThresholds = { ...this.config.cfiThresholds, ...adjustments.thresholds };
        }
        if (adjustments?.pacing) {
            this.config.pacing = adjustments.pacing;
        }

        this.emit('interventionLearned', learnedData);
    }

    getStudentState(studentId) {
        return this.sessionState.get(studentId) || null;
    }

    getActiveInterventions(studentId = null) {
        const interventions = Array.from(this.activeInterventions.values());
        if (!studentId) return interventions;
        return interventions.filter(i => i.studentId === studentId);
    }

    clearIntervention(interventionId) {
        if (this.activeInterventions.has(interventionId)) {
            const intervention = this.activeInterventions.get(interventionId);
            this.activeInterventions.delete(interventionId);
            this.emit('interventionCleared', { interventionId, intervention, timestamp: Date.now() });
            return true;
        }
        return false;
    }
}

module.exports = { ResonantTutor };