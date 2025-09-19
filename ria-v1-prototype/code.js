/**
 * RIA v1 Prototype - Resonant Interface Architecture Engine
 * 
 * Core engine implementing the RIA v1 specification with:
 * - Fleet-wide hyperparameters (Cell 2 champion: th1=0.7, th2=1.1 + adaptive scaling)
 * - Full FI model (Δα + AC₁ + |skew|)
 * - Ablation modes (off, untuned, champion)
 * - Biometric integration stubs
 * - Real-time UI state management
 * 
 * @author Zoverions Grand Unified Model ZGUM v16.2
 * @version 1.0
 * @date September 19, 2025
 */

// Fleet profiles for different user types
const PROFILES = {
  average: { omega: 1.0, D_base: 0.08 },
  fast_typist: { omega: 1.2, D_base: 0.05 },
  neurodiverse: { omega: 0.8, D_base: 0.12 }
};

/**
 * Core RIA Engine Class
 * Processes frames, computes Fracture Index (FI), and updates UI state
 */
class RIAEngine {
  constructor(profile = 'average', biometricMode = false, mode = 'champion') {
    this.profile = PROFILES[profile] || PROFILES.average;
    this.omega = this.profile.omega;
    this.D_base = this.profile.D_base;
    
    // Fleet-wide hyperparameters (Cell 2 champion configuration)
    this.th1 = 0.7;  // Gentle intervention threshold
    this.th2 = 1.1 + 0.1 * (this.D_base / this.omega);  // Adaptive aggressive threshold
    this.aggr = 0.4;  // Aggressive damping factor
    this.gentle = 0.85;  // Gentle damping factor
    
    // FI model weights (Δα + AC₁ + |skew|)
    this.fi_weights = {
      w1: 1.0,  // Δα (spectral slope change)
      w2: 1.0,  // AC₁ (lag-1 autocorrelation)
      w3: 0.5 + 0.3 * (this.D_base > 0.1 ? 1 : 0)  // Skew, neurodiverse boost
    };
    
    this.biometricMode = biometricMode;
    this.mode = mode;  // 'off', 'untuned', 'champion'
    this.phiHistory = [];  // Rolling buffer (max 100 steps)
    this.uiState = { 
      gamma: 1.0, 
      interveneType: null, 
      anchorPhase: 0 
    };
    this.sessionMetrics = { 
      fractures: 0, 
      interventions: 0, 
      fir: 0,  // False Intervention Rate
      startTime: Date.now()
    };
    
    // Internal state
    this.frameCount = 0;
    this.lastFI = 0;
  }

  /**
   * Math Helper Functions
   * Implementing lightweight versions without external dependencies
   */

  /**
   * Standardize a window (z-score normalization)
   * @param {number[]} window - Input data window
   * @returns {number[]} Standardized window
   */
  _standardize(window) {
    const n = window.length;
    if (n === 0) return window;
    
    const mean = window.reduce((a, b) => a + b, 0) / n;
    const variance = window.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
    const std = Math.sqrt(variance) || 1e-8;  // Prevent division by zero
    
    return window.map(x => (x - mean) / std);
  }

  /**
   * Calculate mean of array
   * @param {number[]} arr - Input array
   * @returns {number} Mean value
   */
  _mean(arr) { 
    return arr.reduce((a, b) => a + b, 0) / arr.length; 
  }

  /**
   * Basic DFT implementation (O(n^2) but adequate for n=50-100)
   * @param {number[]} signal - Input signal
   * @returns {number[]} Real part of DFT
   */
  _dft(signal) {
    const n = signal.length;
    const real = new Array(n).fill(0);
    
    for (let k = 0; k < n; k++) {
      for (let j = 0; j < n; j++) {
        real[k] += signal[j] * Math.cos(2 * Math.PI * k * j / n);
      }
    }
    return real;
  }

  /**
   * Simple 2-column least squares fitting (for log-log spectral slope)
   * @param {number[][]} A - Matrix [[x1, 1], [x2, 1], ...]
   * @param {number[]} b - Response vector
   * @returns {number[]} [slope, intercept]
   */
  _leastSquares(A, b) {
    const n = A.length;
    if (n === 0) return [0, 0];
    
    const sumX = A.reduce((s, row) => s + row[0], 0);
    const sumY = b.reduce((s, y) => s + y, 0);
    const sumXY = A.reduce((s, row, i) => s + row[0] * b[i], 0);
    const sumXX = A.reduce((s, row) => s + row[0] * row[0], 0);
    
    const denom = n * sumXX - sumX * sumX;
    if (Math.abs(denom) < 1e-8) return [0, 0];
    
    const m = (n * sumXY - sumX * sumY) / denom;
    const c = (sumY - m * sumX) / n;
    
    return [m, c];
  }

  /**
   * Spectral slope calculation (simplified Welch method)
   * @param {number[]} window - Input window
   * @param {number} fs - Sampling frequency (default 20 Hz)
   * @returns {number} Spectral slope (α)
   */
  _spectral_slope(window, fs = 20) {
    if (window.length < 16) return 0;  // Minimum window size
    
    // Simple periodogram: |FFT|^2
    const n = window.length;
    const fft = this._dft(window);
    const psd = fft.map(re => re * re / n);  // Power spectral density
    
    // Frequency bins
    const freqs = Array.from({length: Math.floor(n/2)}, (_, i) => i * fs / n);
    
    // Filter mid-band frequencies (0.1 - fs/4 Hz)
    const validIndices = [];
    const validFreqs = [];
    const validPSD = [];
    
    for (let i = 1; i < freqs.length; i++) {  // Skip DC
      if (freqs[i] > 0.1 && freqs[i] < fs/4) {
        validIndices.push(i);
        validFreqs.push(freqs[i]);
        validPSD.push(psd[i]);
      }
    }
    
    if (validFreqs.length < 4) return 0;
    
    // Log-log linear fit
    const logf = validFreqs.map(f => Math.log(f));
    const logp = validPSD.map(p => Math.log(p + 1e-12));  // Floor to prevent log(0)
    
    const A = logf.map(f => [f, 1]);
    const slope = this._leastSquares(A, logp)[0];
    
    return slope;
  }

  /**
   * Spectral slope change (Δα)
   * @param {number[]} currWindow - Current window
   * @param {number[]} prevWindow - Previous window
   * @returns {number} Change in spectral slope
   */
  _spectral_slope_delta(currWindow, prevWindow) {
    const slopeCurr = this._spectral_slope(currWindow);
    const slopePrev = this._spectral_slope(prevWindow);
    return slopeCurr - slopePrev;
  }

  /**
   * Lag-1 autocorrelation
   * @param {number[]} window - Input window
   * @returns {number} Lag-1 autocorrelation coefficient
   */
  _lag1_ac(window) {
    if (window.length < 2) return 0;
    
    const n = window.length;
    const mean = this._mean(window);
    
    // Calculate lag-1 correlation using proper formula
    let num = 0;
    let den = 0;
    
    for (let i = 0; i < n - 1; i++) {
      num += (window[i] - mean) * (window[i + 1] - mean);
    }
    
    for (let i = 0; i < n; i++) {
      den += Math.pow(window[i] - mean, 2);
    }
    
    return den === 0 ? 0 : num / den;
  }

  /**
   * Skewness calculation (manual third moment)
   * @param {number[]} window - Input window
   * @returns {number} Skewness value
   */
  _skew(window) {
    const n = window.length;
    if (n < 3) return 0;
    
    const mean = this._mean(window);
    const m3 = window.reduce((s, x) => s + Math.pow(x - mean, 3), 0) / n;
    const m2 = window.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / n;
    
    return m2 === 0 ? 0 : (m3 / Math.pow(m2, 1.5)) || 0;
  }

  /**
   * Quantile calculation
   * @param {number[]} arr - Input array
   * @param {number} q - Quantile (0-1)
   * @returns {number} Quantile value
   */
  _quantile(arr, q) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.floor(q * (sorted.length - 1));
    return sorted[index];
  }

  /**
   * Core FI Computation
   * Implements the full FI model: FI = w1*(-Δα) + w2*AC₁ + w3*|skew|
   * @param {number[]} phiHistory - Complete phi history
   * @param {number|null} hrvNorm - Normalized HRV (0-1, optional)
   * @returns {number} Fracture Index
   */
  compute_fi(phiHistory, hrvNorm = null) {
    const w_steps = 50;  // Window size
    
    if (phiHistory.length < w_steps) return 0;
    
    // Current and previous windows
    const windowZ = this._standardize(phiHistory.slice(-w_steps));
    const prevWindow = phiHistory.length >= 2 * w_steps ? 
      this._standardize(phiHistory.slice(-2 * w_steps, -w_steps)) : 
      windowZ;  // Fallback to current if insufficient history
    
    // FI components
    const deltaAlpha = this._spectral_slope_delta(windowZ, prevWindow);
    const ac1 = this._lag1_ac(windowZ);
    const sk = Math.abs(this._skew(windowZ));
    
    // Weighted combination
    let fi = this.fi_weights.w1 * (-deltaAlpha) + 
             this.fi_weights.w2 * ac1 + 
             this.fi_weights.w3 * sk;
    
    // Biometric modulation (if enabled)
    if (this.biometricMode && hrvNorm !== null) {
      fi *= (1 + 0.2 * (1 - hrvNorm));  // Amplify if stressed (low HRV)
    }
    
    return Math.max(0, fi);  // Ensure non-negative
  }

  /**
   * UI State Update Logic
   * Applies damping based on FI thresholds and mode
   * @param {number} fi - Current fracture index
   * @param {Object} uiState - Current UI state
   * @returns {Object} Updated UI state
   */
  update_ui(fi, uiState) {
    if (this.mode === 'off') return uiState;
    
    // Reset intervention type
    uiState.interveneType = null;
    
    let factor = 1.0;
    
    // Threshold-based intervention
    if (fi >= this.th2) {
      // Aggressive intervention
      factor = this.mode === 'untuned' ? 0.6 : this.aggr;
      uiState.gamma *= factor;
      uiState.interveneType = 'aggressive';
      this.sessionMetrics.interventions++;
    } else if (fi >= this.th1) {
      // Gentle intervention
      factor = this.mode === 'untuned' ? 0.7 : this.gentle;
      uiState.gamma *= factor;
      uiState.interveneType = 'gentle';
      this.sessionMetrics.interventions++;
    }
    
    // Coherence anchor phase calculation
    const recentPhi = this.phiHistory.slice(-10);
    if (recentPhi.length > 0) {
      const meanPhi = this._mean(recentPhi);
      uiState.anchorPhase = Math.sin(2 * Math.PI * this.omega * meanPhi);
    }
    
    // Gamma recovery (slow drift back to 1.0)
    if (uiState.interveneType === null && uiState.gamma < 1.0) {
      uiState.gamma = Math.min(1.0, uiState.gamma * 1.001);  // 0.1% recovery per frame
    }
    
    // Clamp gamma to reasonable bounds
    uiState.gamma = Math.max(0.1, Math.min(1.0, uiState.gamma));
    
    return uiState;
  }

  /**
   * NCB (Net Cognitive Benefit) Estimation
   * Proxy calculation for cognitive load reduction
   * @returns {number} NCB estimate (%)
   */
  _est_ncb() {
    const totalInterventions = this.sessionMetrics.interventions;
    if (totalInterventions === 0) return 0;
    
    // FIR (False Intervention Rate) calculation
    const firRate = (this.sessionMetrics.fir / totalInterventions) * 100;
    
    // MTTR proxy based on gamma reduction
    const mttrProxy = 5.7 * this.uiState.gamma;  // Baseline 5.7s
    const reduction = ((5.7 - mttrProxy) / 5.7) * 100;
    
    // NCB = reduction benefit - FIR penalty
    const ncb = reduction - 2 * firRate;
    
    return Math.max(0, ncb);  // Ensure non-negative
  }

  /**
   * Main Frame Processing Loop
   * Processes incoming phi proxy and HRV data, updates UI state
   * @param {number} phiProxy - Phi proxy value (0-1 normalized)
   * @param {number|null} hrv - Heart rate variability (0-1 normalized, optional)
   * @returns {Object} Processing results
   */
  process_frame(phiProxy, hrv = null) {
    this.frameCount++;
    
    // Add to history with rolling window
    this.phiHistory.push(phiProxy);
    if (this.phiHistory.length > 100) {
      this.phiHistory.shift();
    }
    
    // Compute FI
    const fi = this.compute_fi(this.phiHistory, hrv);
    this.lastFI = fi;
    
    // Update UI state
    this.uiState = this.update_ui(fi, this.uiState);
    
    // FIR detection: If we intervened but phi is high (>75th percentile)
    if (this.uiState.interveneType && this.phiHistory.length > 10) {
      const phi75 = this._quantile(this.phiHistory, 0.75);
      if (phiProxy > phi75) {
        this.sessionMetrics.fir++;
      }
    }
    
    // Fracture logging
    if (fi > this.th2) {
      this.sessionMetrics.fractures++;
    }
    
    // Return comprehensive results
    return {
      fi: fi,
      ui_update: { ...this.uiState },
      ncb_estimate: this._est_ncb(),
      session_metrics: { ...this.sessionMetrics },
      frame_count: this.frameCount,
      phi_history_length: this.phiHistory.length
    };
  }

  /**
   * Reset session state
   */
  reset_session() {
    this.phiHistory = [];
    this.uiState = { gamma: 1.0, interveneType: null, anchorPhase: 0 };
    this.sessionMetrics = { 
      fractures: 0, 
      interventions: 0, 
      fir: 0,
      startTime: Date.now()
    };
    this.frameCount = 0;
    this.lastFI = 0;
  }

  /**
   * Get current engine state for debugging
   * @returns {Object} Engine state
   */
  get_state() {
    return {
      profile: this.profile,
      mode: this.mode,
      thresholds: { th1: this.th1, th2: this.th2 },
      damping: { aggr: this.aggr, gentle: this.gentle },
      weights: this.fi_weights,
      ui_state: this.uiState,
      metrics: this.sessionMetrics,
      history_length: this.phiHistory.length,
      last_fi: this.lastFI
    };
  }
}

/**
 * Figma Plugin Integration Layer
 * Handles real-time cursor tracking, UI manipulation, and dashboard communication
 */

// Global plugin state
let riaEngine = null;
let consentGiven = false;
let isActive = false;
let lastCursorTime = 0;
let cursorHistory = [];

/**
 * Plugin initialization
 */
function initializePlugin() {
  // Show consent modal first
  figma.showUI(__html__, { 
    width: 400, 
    height: 600,
    title: "RIA v1 Prototype - Cognitive Interface"
  });
  
  // Default engine setup
  riaEngine = new RIAEngine('average', true, 'champion');
  
  console.log('RIA v1 Prototype initialized');
}

/**
 * Apply UI delta to selected Figma elements
 * @param {number} gamma - Opacity multiplier (0-1)
 * @param {string} interveneType - Type of intervention ('gentle', 'aggressive', null)
 */
function applyUIDeltas(gamma, interveneType) {
  if (!isActive || gamma >= 1.0) return;
  
  // Apply opacity reduction to selected elements
  const selection = figma.currentPage.selection;
  let elementsAffected = 0;
  
  selection.forEach(node => {
    if (node.type === 'FRAME' || 
        node.type === 'GROUP' || 
        node.type === 'COMPONENT' ||
        node.type === 'INSTANCE') {
      
      // Apply gamma reduction
      const newOpacity = Math.max(0.1, node.opacity * gamma);
      node.opacity = newOpacity;
      elementsAffected++;
      
      // Add visual indicator for intervention type
      if (interveneType === 'aggressive') {
        // Add red tint for aggressive intervention
        if (node.effects) {
          const redGlow = {
            type: 'DROP_SHADOW',
            color: { r: 1, g: 0.2, b: 0.2, a: 0.3 },
            offset: { x: 0, y: 0 },
            radius: 4,
            spread: 0,
            visible: true,
            blendMode: 'NORMAL'
          };
          node.effects = [...node.effects, redGlow];
        }
      }
    }
  });
  
  return elementsAffected;
}

/**
 * Create or update coherence anchor visualization
 * @param {number} anchorPhase - Phase value (-1 to 1)
 * @param {number} omega - Frequency parameter
 */
function updateCoherenceAnchor(anchorPhase, omega) {
  const anchorName = '__ria_coherence_anchor__';
  
  // Remove existing anchor
  const existing = figma.currentPage.findChild(node => node.name === anchorName);
  if (existing) {
    existing.remove();
  }
  
  // Create new anchor visualization
  const anchor = figma.createEllipse();
  anchor.name = anchorName;
  anchor.x = 50;
  anchor.y = 50;
  anchor.resize(30 + 20 * Math.abs(anchorPhase), 30 + 20 * Math.abs(anchorPhase));
  
  // Pulsing purple color based on phase
  const alpha = 0.3 + 0.7 * Math.abs(anchorPhase);
  anchor.fills = [{
    type: 'SOLID',
    color: { r: 0.6, g: 0.2, b: 0.9 },
    opacity: alpha
  }];
  
  // Add to page
  figma.currentPage.appendChild(anchor);
  
  // Auto-remove after 1 second to prevent clutter
  setTimeout(() => {
    try {
      anchor.remove();
    } catch (e) {
      // Anchor may have been manually deleted
    }
  }, 1000);
}

/**
 * Calculate phi proxy from cursor movement entropy
 * @param {number} x - Cursor X position
 * @param {number} y - Cursor Y position
 * @returns {number} Phi proxy value (0-1)
 */
function calculatePhiProxy(x, y) {
  const now = Date.now();
  
  // Add to cursor history
  cursorHistory.push({ x, y, timestamp: now });
  
  // Keep only last 20 points (1 second at 20fps)
  if (cursorHistory.length > 20) {
    cursorHistory.shift();
  }
  
  if (cursorHistory.length < 2) {
    return Math.random() * 0.1;  // Low baseline entropy
  }
  
  // Calculate movement entropy
  let totalDistance = 0;
  let velocityVariance = 0;
  const velocities = [];
  
  for (let i = 1; i < cursorHistory.length; i++) {
    const prev = cursorHistory[i - 1];
    const curr = cursorHistory[i];
    
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const dt = (curr.timestamp - prev.timestamp) / 1000;  // seconds
    
    const distance = Math.sqrt(dx * dx + dy * dy);
    const velocity = dt > 0 ? distance / dt : 0;
    
    totalDistance += distance;
    velocities.push(velocity);
  }
  
  // Calculate velocity variance (proxy for chaos/attention fractures)
  if (velocities.length > 1) {
    const meanVel = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    velocityVariance = velocities.reduce((sum, v) => sum + Math.pow(v - meanVel, 2), 0) / velocities.length;
  }
  
  // Normalize to 0-1 range
  const normalizedDistance = Math.min(1.0, totalDistance / 1000);  // Max 1000px movement
  const normalizedVariance = Math.min(1.0, velocityVariance / 10000);  // Empirical scaling
  
  // Combined entropy measure
  const entropy = 0.6 * normalizedVariance + 0.4 * normalizedDistance;
  
  // Add small random component
  return Math.max(0, Math.min(1, entropy + Math.random() * 0.05));
}

/**
 * Generate mock HRV data (placeholder for real biometric integration)
 * @returns {number} Mock HRV value (0-1, where 1 = relaxed, 0 = stressed)
 */
function getMockHRV() {
  // Simulate HRV with some temporal correlation
  const baseHRV = 0.6 + 0.3 * Math.sin(Date.now() / 10000);  // Slow oscillation
  const noise = (Math.random() - 0.5) * 0.2;
  return Math.max(0, Math.min(1, baseHRV + noise));
}

/**
 * Main processing loop - called on cursor movement
 * @param {Object} message - Message from UI containing cursor data
 */
function processFrame(message) {
  if (!isActive || !riaEngine || !consentGiven) return;
  
  const { x, y, timestamp } = message;
  
  // Calculate phi proxy from cursor entropy
  const phiProxy = calculatePhiProxy(x, y);
  const hrv = getMockHRV();
  
  // Process through RIA engine
  const result = riaEngine.process_frame(phiProxy, hrv);
  
  // Apply UI deltas
  const elementsAffected = applyUIDeltas(result.ui_update.gamma, result.ui_update.interveneType);
  
  // Update coherence anchor
  updateCoherenceAnchor(result.ui_update.anchorPhase, riaEngine.omega);
  
  // Send results to dashboard
  figma.ui.postMessage({
    type: 'update',
    data: {
      ...result,
      elements_affected: elementsAffected,
      phi_proxy: phiProxy,
      hrv: hrv,
      engine_state: riaEngine.get_state()
    }
  });
  
  // Log significant events
  if (result.ui_update.interveneType) {
    console.log(`RIA Intervention: ${result.ui_update.interveneType}, FI=${result.fi.toFixed(3)}, γ=${result.ui_update.gamma.toFixed(3)}`);
  }
}

/**
 * Message handler for UI communication (Figma environment only)
 */
if (typeof figma !== 'undefined') {
  figma.ui.onmessage = (message) => {
    switch (message.type) {
      case 'consent_given':
        consentGiven = true;
        isActive = true;
        console.log('User consent given, RIA active');
        break;
        
      case 'consent_denied':
        figma.closePlugin('User declined consent. RIA disabled.');
        break;
        
      case 'cursor_move':
        processFrame(message);
        break;
        
      case 'toggle_active':
        isActive = message.active;
        if (!isActive) {
          // Reset all visual effects
          figma.currentPage.selection.forEach(node => {
            if (node.opacity < 1.0) {
              node.opacity = 1.0;
            }
            if (node.effects && node.effects.length > 0) {
              node.effects = node.effects.filter(effect => 
                !(effect.type === 'DROP_SHADOW' && effect.color.r > 0.8)
              );
            }
          });
        }
        break;
        
      case 'change_profile':
        const { profile } = message;
        riaEngine = new RIAEngine(profile, riaEngine.biometricMode, riaEngine.mode);
        console.log(`Profile changed to: ${profile}`);
        break;
        
      case 'change_mode':
        const { mode } = message;
        riaEngine.mode = mode;
        console.log(`Mode changed to: ${mode}`);
        break;
        
      case 'reset_session':
        riaEngine.reset_session();
        // Clear visual effects
        figma.currentPage.selection.forEach(node => {
          if (node.opacity < 1.0) node.opacity = 1.0;
        });
        console.log('Session reset');
        break;
        
      case 'export_data':
        // Export session data for analysis
        const sessionData = {
          timestamp: new Date().toISOString(),
          engine_state: riaEngine.get_state(),
          session_duration: (Date.now() - riaEngine.sessionMetrics.startTime) / 1000,
          total_frames: riaEngine.frameCount
        };
        
        figma.ui.postMessage({
          type: 'export_ready',
          data: sessionData
        });
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  };

  // Initialize plugin when loaded
  initializePlugin();
}// Export for use in testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    RIAEngine, 
    PROFILES, 
    calculatePhiProxy, 
    getMockHRV,
    processFrame 
  };
}