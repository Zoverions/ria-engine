const EventEmitter = require('events');
const { SpectralProcessor } = require('./processors/SpectralProcessor');
const { StatisticalProcessor } = require('./processors/StatisticalProcessor');

class CognitiveFractureIndex extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            windowSize: 50,           // Number of recent interactions to analyze
            spectralWindow: 32,       // Window size for spectral analysis
            minDataPoints: 10,        // Minimum data points needed for calculation
            updateThreshold: 0.05,    // Minimum change to trigger update
            learningRate: 0.1,        // Learning rate for adaptive thresholds
            ...config
        };

        this.spectralProcessor = new SpectralProcessor();
        this.statisticalProcessor = new StatisticalProcessor();

        this.studentData = new Map(); // studentId -> interaction history
        this.baselineProfiles = new Map(); // studentId -> baseline cognitive profile
        this.fractureHistory = new Map(); // studentId -> CFI history

        this.lastCalculation = new Map();
    }

    /**
     * Add cognitive interaction data for a student
     * @param {string} studentId - Unique student identifier
     * @param {Object} interactionData - Student interaction data
     */
    addCognitiveData(studentId, interactionData) {
        if (!this.studentData.has(studentId)) {
            this.studentData.set(studentId, []);
            this.fractureHistory.set(studentId, []);
        }

        const studentHistory = this.studentData.get(studentId);

        // Add timestamp if not provided
        const dataWithTimestamp = {
            timestamp: Date.now(),
            ...interactionData
        };

        studentHistory.push(dataWithTimestamp);

        // Maintain window size
        if (studentHistory.length > this.config.windowSize * 2) {
            studentHistory.splice(0, studentHistory.length - this.config.windowSize * 2);
        }

        // Calculate CFI if we have enough data
        if (studentHistory.length >= this.config.minDataPoints) {
            this.calculateCFI(studentId);
        }

        this.emit('dataAdded', {
            studentId,
            interactionCount: studentHistory.length,
            data: dataWithTimestamp
        });
    }

    /**
     * Calculate Cognitive Fracture Index for a student
     * @param {string} studentId - Student identifier
     */
    calculateCFI(studentId) {
        const studentHistory = this.studentData.get(studentId);
        if (!studentHistory || studentHistory.length < this.config.minDataPoints) {
            return null;
        }

        // Extract time series data
        const timeSeries = this.extractTimeSeries(studentHistory);

        // Calculate component scores
        const components = {
            responseTimeScore: this.calculateResponseTimeScore(timeSeries.responseTimes),
            accuracyScore: this.calculateAccuracyScore(timeSeries.accuracies),
            interactionScore: this.calculateInteractionScore(timeSeries.timestamps),
            difficultyScore: this.calculateDifficultyScore(timeSeries.difficulties, timeSeries.accuracies),
            momentumScore: this.calculateMomentumScore(timeSeries.accuracies, timeSeries.timestamps)
        };

        // Calculate weighted CFI
        const cfi = this.calculateWeightedCFI(components);

        // Store result
        const result = {
            studentId,
            cfi,
            components,
            timestamp: Date.now(),
            confidence: this.calculateConfidence(studentHistory.length)
        };

        // Update fracture history
        const history = this.fractureHistory.get(studentId);
        history.push(result);

        // Maintain history size
        if (history.length > 100) {
            history.splice(0, history.length - 100);
        }

        // Check if significant change occurred
        const lastResult = this.lastCalculation.get(studentId);
        if (lastResult && Math.abs(cfi - lastResult.cfi) >= this.config.updateThreshold) {
            this.emit('cfiUpdated', result);
        }

        this.lastCalculation.set(studentId, result);

        // Emit calculation complete
        this.emit('cfiCalculated', result);

        return result;
    }

    /**
     * Extract time series data from student interactions
     */
    extractTimeSeries(history) {
        return {
            timestamps: history.map(h => h.timestamp),
            responseTimes: history.map(h => h.responseTime || 0),
            accuracies: history.map(h => h.accuracy || 0),
            difficulties: history.map(h => h.difficulty || 0.5),
            interactionTypes: history.map(h => h.interactionType || 'unknown')
        };
    }

    /**
     * Calculate response time fracture score
     * Analyzes patterns in response times to detect cognitive fatigue or confusion
     */
    calculateResponseTimeScore(responseTimes) {
        if (responseTimes.length < this.config.minDataPoints) return 0;

        // Remove outliers
        const filteredTimes = this.removeOutliers(responseTimes);

        // Calculate spectral slope (trend in response times)
        const spectralSlope = this.calculateSpectralSlope(filteredTimes);

        // Calculate autocorrelation (consistency in response patterns)
        const autocorrelation = this.calculateAutocorrelation(filteredTimes);

        // Calculate variability score
        const variability = this.calculateCoefficientOfVariation(filteredTimes);

        // Normalize and combine scores
        const slopeScore = Math.max(0, Math.min(1, Math.abs(spectralSlope) * 2));
        const consistencyScore = 1 - Math.abs(autocorrelation);
        const variabilityScore = Math.min(1, variability / 0.5);

        return (slopeScore * 0.4 + consistencyScore * 0.3 + variabilityScore * 0.3);
    }

    /**
     * Calculate accuracy fracture score
     * Detects declining performance or learning plateaus
     */
    calculateAccuracyScore(accuracies) {
        if (accuracies.length < this.config.minDataPoints) return 0;

        // Calculate trend in accuracy
        const spectralSlope = this.calculateSpectralSlope(accuracies);

        // Calculate accuracy volatility
        const volatility = this.calculateVolatility(accuracies);

        // Calculate recent vs historical performance
        const recentAccuracy = this.calculateRecentAverage(accuracies, 10);
        const historicalAccuracy = this.calculateRecentAverage(accuracies, accuracies.length);

        const performanceDecline = Math.max(0, historicalAccuracy - recentAccuracy);

        // Normalize scores
        const trendScore = Math.max(0, -spectralSlope); // Negative slope = declining accuracy
        const volatilityScore = Math.min(1, volatility * 2);
        const declineScore = Math.min(1, performanceDecline * 2);

        return (trendScore * 0.4 + volatilityScore * 0.3 + declineScore * 0.3);
    }

    /**
     * Calculate interaction frequency score
     * Detects engagement patterns and attention fluctuations
     */
    calculateInteractionScore(timestamps) {
        if (timestamps.length < this.config.minDataPoints) return 0;

        // Calculate inter-interaction intervals
        const intervals = [];
        for (let i = 1; i < timestamps.length; i++) {
            intervals.push(timestamps[i] - timestamps[i-1]);
        }

        if (intervals.length === 0) return 0;

        // Calculate interval variability
        const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
        const intervalVariability = this.calculateCoefficientOfVariation(intervals);

        // Calculate burst patterns (rapid interactions followed by pauses)
        const burstScore = this.calculateBurstScore(intervals);

        // Normalize scores
        const variabilityScore = Math.min(1, intervalVariability / 0.8);
        const burstScoreNorm = Math.min(1, burstScore);

        return (variabilityScore * 0.6 + burstScoreNorm * 0.4);
    }

    /**
     * Calculate difficulty progression score
     * Analyzes how student handles increasingly difficult content
     */
    calculateDifficultyScore(difficulties, accuraciesForAdaptation = null) {
        if (difficulties.length < this.config.minDataPoints) return 0;

        // Calculate difficulty trend
        const spectralSlope = this.calculateSpectralSlope(difficulties);

        // Calculate difficulty volatility
        const volatility = this.calculateVolatility(difficulties);

        // Calculate difficulty adaptation (how well student adjusts to harder content)
    const adaptationScore = this.calculateDifficultyAdaptation(difficulties, accuraciesForAdaptation);

        // Normalize scores
        const trendScore = Math.max(0, spectralSlope); // Positive slope = increasing difficulty
        const volatilityScore = Math.min(1, volatility * 2);
        const adaptationScoreNorm = 1 - adaptationScore; // Lower adaptation = higher fracture

        return (trendScore * 0.4 + volatilityScore * 0.3 + adaptationScoreNorm * 0.3);
    }

    /**
     * Calculate learning momentum score
     * Detects acceleration or deceleration in learning progress
     */
    calculateMomentumScore(accuracies, timestamps) {
        if (accuracies.length < this.config.minDataPoints) return 0;

        // Calculate learning velocity (rate of accuracy improvement)
        const velocity = this.calculateLearningVelocity(accuracies, timestamps);

        // Calculate momentum consistency
        const momentumConsistency = this.calculateMomentumConsistency(accuracies);

        // Calculate plateau detection
        const plateauScore = this.calculatePlateauScore(accuracies);

        // Normalize scores
        const velocityScore = Math.max(0, Math.min(1, Math.abs(velocity) * 5));
        const consistencyScore = 1 - momentumConsistency;
        const plateauScoreNorm = Math.min(1, plateauScore);

        return (velocityScore * 0.4 + consistencyScore * 0.3 + plateauScoreNorm * 0.3);
    }

    /**
     * Calculate weighted Cognitive Fracture Index
     */
    calculateWeightedCFI(components) {
        const weights = {
            responseTimeScore: 0.25,
            accuracyScore: 0.30,
            interactionScore: 0.15,
            difficultyScore: 0.15,
            momentumScore: 0.15
        };

        let weightedSum = 0;
        let totalWeight = 0;

        Object.entries(components).forEach(([component, score]) => {
            const weight = weights[component] || 0;
            weightedSum += score * weight;
            totalWeight += weight;
        });

        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }

    /**
     * Calculate confidence in CFI measurement
     */
    calculateConfidence(dataPoints) {
        const baseConfidence = Math.min(1, dataPoints / this.config.minDataPoints);
        const recencyFactor = Math.min(1, dataPoints / (this.config.windowSize * 0.5));

        return (baseConfidence + recencyFactor) / 2;
    }

    // Helper calculation methods

    calculateSpectralSlope(data) {
        if (data.length < this.config.spectralWindow) return 0;

        // Use spectral processor for slope calculation
        const spectralData = this.spectralProcessor.processData(data.slice(-this.config.spectralWindow));
        return spectralData ? spectralData.slope || 0 : 0;
    }

    calculateAutocorrelation(data) {
        if (data.length < 10) return 0;

        const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
        const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;

        if (variance === 0) return 1;

        let autocorrelation = 0;
        for (let lag = 1; lag < Math.min(10, data.length); lag++) {
            let cov = 0;
            for (let i = 0; i < data.length - lag; i++) {
                cov += (data[i] - mean) * (data[i + lag] - mean);
            }
            autocorrelation += cov / ((data.length - lag) * variance);
        }

        return autocorrelation / Math.min(10, data.length - 1);
    }

    calculateVolatility(data) {
        if (data.length < 2) return 0;

        const returns = [];
        for (let i = 1; i < data.length; i++) {
            returns.push((data[i] - data[i-1]) / data[i-1]);
        }

        const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;

        return Math.sqrt(variance);
    }

    calculateCoefficientOfVariation(data) {
        const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
        if (mean === 0) return 0;

        const std = Math.sqrt(
            data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
        );

        return std / mean;
    }

    calculateRecentAverage(data, windowSize) {
        const window = data.slice(-windowSize);
        return window.reduce((sum, val) => sum + val, 0) / window.length;
    }

    calculateBurstScore(intervals) {
        if (intervals.length < 5) return 0;

        // Detect rapid interaction bursts followed by long pauses
        let burstCount = 0;
        const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;

        for (let i = 0; i < intervals.length - 2; i++) {
            const currentInterval = intervals[i];
            const nextInterval = intervals[i + 1];

            // Burst pattern: short interval followed by long interval
            if (currentInterval < avgInterval * 0.5 && nextInterval > avgInterval * 1.5) {
                burstCount++;
            }
        }

        return burstCount / (intervals.length - 2);
    }

    calculateDifficultyAdaptation(difficulties, accuraciesInput) {
        if (difficulties.length < 10) return 0;
        const accuracies = accuraciesInput && accuraciesInput.length === difficulties.length
            ? accuraciesInput
            : null;
        if (!accuracies) return 0;
        const correlation = this.calculateCorrelation(difficulties, accuracies);
        return Math.max(0, correlation);
    }

    calculateLearningVelocity(accuracies, timestamps) {
        if (accuracies.length < 5) return 0;

        // Calculate time-weighted learning velocity
        const timeSpans = [];
        for (let i = 1; i < timestamps.length; i++) {
            timeSpans.push(timestamps[i] - timestamps[i-1]);
        }

        const accuracyChanges = [];
        for (let i = 1; i < accuracies.length; i++) {
            accuracyChanges.push(accuracies[i] - accuracies[i-1]);
        }

        // Weight recent changes more heavily
        let weightedVelocity = 0;
        let totalWeight = 0;

        for (let i = 0; i < accuracyChanges.length; i++) {
            const weight = Math.exp(i / accuracyChanges.length); // Exponential weighting
            weightedVelocity += accuracyChanges[i] * weight;
            totalWeight += weight;
        }

        return totalWeight > 0 ? weightedVelocity / totalWeight : 0;
    }

    calculateMomentumConsistency(accuracies) {
        if (accuracies.length < 5) return 0;

        // Calculate consistency of learning direction
        const directions = [];
        for (let i = 1; i < accuracies.length; i++) {
            directions.push(Math.sign(accuracies[i] - accuracies[i-1]));
        }

        // Count direction changes
        let changes = 0;
        for (let i = 1; i < directions.length; i++) {
            if (directions[i] !== directions[i-1]) {
                changes++;
            }
        }

        return changes / (directions.length - 1);
    }

    calculatePlateauScore(accuracies) {
        if (accuracies.length < 10) return 0;

        // Detect learning plateaus (periods of no improvement)
        const windowSize = 5;
        let plateauPeriods = 0;

        for (let i = windowSize; i < accuracies.length; i++) {
            const window = accuracies.slice(i - windowSize, i);
            const avgImprovement = window.reduce((sum, val, idx) => {
                if (idx === 0) return 0;
                return sum + (val - window[idx-1]);
            }, 0) / (windowSize - 1);

            if (Math.abs(avgImprovement) < 0.01) { // Very little improvement
                plateauPeriods++;
            }
        }

        return plateauPeriods / (accuracies.length - windowSize);
    }

    calculateCorrelation(x, y) {
        if (x.length !== y.length || x.length < 2) return 0;

        const n = x.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

        for (let i = 0; i < n; i++) {
            sumX += x[i];
            sumY += y[i];
            sumXY += x[i] * y[i];
            sumX2 += x[i] * x[i];
            sumY2 += y[i] * y[i];
        }

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

        return denominator === 0 ? 0 : numerator / denominator;
    }

    removeOutliers(data) {
        if (data.length < 4) return data;

        const sorted = [...data].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;

        return data.filter(val => val >= lowerBound && val <= upperBound);
    }

    /**
     * Get CFI history for a student
     */
    getCFIHistory(studentId) {
        return this.fractureHistory.get(studentId) || [];
    }

    /**
     * Get current CFI for a student
     */
    getCurrentCFI(studentId) {
        const history = this.getCFIHistory(studentId);
        return history.length > 0 ? history[history.length - 1] : null;
    }

    /**
     * Get all student CFI data
     */
    getAllStudentCFI() {
        const result = {};

        for (const [studentId, history] of this.fractureHistory) {
            if (history.length > 0) {
                result[studentId] = history[history.length - 1];
            }
        }

        return result;
    }

    /**
     * Reset student data
     */
    resetStudent(studentId) {
        this.studentData.delete(studentId);
        this.baselineProfiles.delete(studentId);
        this.fractureHistory.delete(studentId);
        this.lastCalculation.delete(studentId);

        this.emit('studentReset', { studentId });
    }

    /**
     * Get system statistics
     */
    getStatistics() {
        const studentIds = Array.from(this.studentData.keys());
        const totalInteractions = studentIds.reduce((sum, id) => {
            return sum + (this.studentData.get(id)?.length || 0);
        }, 0);

        const avgCFI = studentIds.reduce((sum, id) => {
            const currentCFI = this.getCurrentCFI(id);
            return sum + (currentCFI?.cfi || 0);
        }, 0) / studentIds.length;

        return {
            totalStudents: studentIds.length,
            totalInteractions,
            avgInteractionsPerStudent: totalInteractions / studentIds.length,
            avgCFI: avgCFI || 0,
            activeStudents: studentIds.filter(id => {
                const history = this.getCFIHistory(id);
                return history.length > 0;
            }).length
        };
    }
}

module.exports = { CognitiveFractureIndex };