/**
 * Multi-Sensory Resonance Manager for RIA Engine v2.1
 * 
 * Extends adaptive damping to auditory and haptic channels, creating a truly
 * resonant system that reinforces cognitive state through multiple sensory modalities.
 * 
 * Features:
 * - Auditory Resonance: Ambient soundscapes that adapt to focus state
 * - Haptic Pacemaker: Subtle vibrations that guide interaction tempo
 * - Cross-modal synchronization for coherent sensory experience
 */

import { EventEmitter } from 'events';

export class MultiSensoryResonanceManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enabled: true,
      audioEnabled: true,
      hapticEnabled: true,
      
      // Audio configuration
      baseFrequency: 220, // A3 note, naturally calming
      harmonicComplexity: 0.3, // Base harmonic richness
      volumeRange: [0.1, 0.4], // Subtle background presence
      crossfadeTime: 2000, // Smooth transitions
      
      // Haptic configuration
      basePulseRate: 60, // BPM, heart rate resonance
      pulseIntensity: 0.2, // Subtle, almost imperceptible
      cadenceAdaptation: 0.8, // How much to adapt to user tempo
      
      // Resonance parameters
      focusResonanceThreshold: 0.3, // FI below which to apply resonance
      dissonanceThreshold: 0.7, // FI above which to apply warning dissonance
      
      ...config
    };
    
    this.state = {
      currentSoundscapeName: null,
      activeSoundscape: null, // { gainNode, oscillators: [] }
      fadingSoundscapes: [], // Array of soundscapes currently fading out
      audioContext: null,
      hapticDevice: null,
      currentCadence: this.config.basePulseRate,
      lastFocusState: null,
      resonanceActive: false,
      hapticInterval: null
    };
    
    this.harmonics = [1, 0.5, 0.33, 0.25, 0.2]; // Harmonic series ratios
    this.dissonanceIntervals = [1.414, 1.059]; // Tritone and minor second ratios
    
    console.log('🎵 MultiSensoryResonanceManager initialized');
  }
  
  /**
   * Initialize audio and haptic systems
   */
  async initialize() {
    try {
      if (this.config.audioEnabled) {
        await this.initializeAudio();
      }
      
      if (this.config.hapticEnabled) {
        await this.initializeHaptics();
      }
      
      this.emit('initialized');
      console.log('🎵 Multi-sensory systems initialized');
      
    } catch (error) {
      console.warn('Multi-sensory initialization warning:', error.message);
      // Graceful degradation - continue without audio/haptic
    }
  }
  
  async initializeAudio() {
    // Check for Web Audio API support
    if (typeof window === 'undefined' || !window.AudioContext) {
      console.log('Web Audio API not available, using mock audio system');
      this.state.audioContext = this.createMockAudioContext();
      return;
    }
    
    try {
      this.state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create master gain node for volume control
      this.masterGain = this.state.audioContext.createGain();
      this.masterGain.connect(this.state.audioContext.destination);
      this.masterGain.gain.value = this.config.volumeRange[0];
      
      // Handle suspension
      if (this.state.audioContext.state === 'suspended') {
        console.log('AudioContext suspended, waiting for interaction');
        const resumeHandler = () => {
          this.state.audioContext.resume().then(() => {
            console.log('AudioContext resumed');
            window.removeEventListener('click', resumeHandler);
            window.removeEventListener('keydown', resumeHandler);
          });
        };
        window.addEventListener('click', resumeHandler);
        window.addEventListener('keydown', resumeHandler);
      }

    } catch (error) {
      console.warn('Audio context creation failed:', error.message);
      this.state.audioContext = this.createMockAudioContext();
    }
  }
  
  async initializeHaptics() {
    // Check for haptic support
    if (typeof navigator === 'undefined' || !navigator.vibrate) {
      console.log('Haptic feedback not available, using mock haptic system');
      this.state.hapticDevice = this.createMockHapticDevice();
      return;
    }
    
    this.state.hapticDevice = {
      vibrate: (pattern) => navigator.vibrate(pattern),
      supported: true
    };
  }
  
  /**
   * Update resonance based on current cognitive state
   */
  async updateResonance(cognitiveState) {
    const { fi, focusTrend, interactionCadence, stressLevel } = cognitiveState;
    
    // Determine resonance mode
    const resonanceMode = this.determineResonanceMode(fi, stressLevel);
    
    // Update audio resonance
    if (this.config.audioEnabled) {
      await this.updateAudioResonance(resonanceMode, fi, focusTrend);
    }
    
    // Update haptic resonance
    if (this.config.hapticEnabled) {
      await this.updateHapticResonance(resonanceMode, interactionCadence);
    }
    
    this.state.lastFocusState = { fi, focusTrend, stressLevel };
    this.state.resonanceActive = resonanceMode !== 'off';
    
    this.emit('resonanceUpdated', {
      mode: resonanceMode,
      fi,
      audioActive: this.config.audioEnabled,
      hapticActive: this.config.hapticEnabled
    });
  }
  
  determineResonanceMode(fi, stressLevel) {
    if (fi < this.config.focusResonanceThreshold) {
      return stressLevel < 0.3 ? 'deep_flow' : 'focused_calm';
    } else if (fi < this.config.dissonanceThreshold) {
      return 'gentle_guidance';
    } else {
      return 'warning_dissonance';
    }
  }
  
  async updateAudioResonance(mode, fi, focusTrend) {
    // Check context state and attempt resume if needed
    if (this.state.audioContext && this.state.audioContext.state === 'suspended') {
        try {
            await this.state.audioContext.resume();
        } catch (e) {
            // Ignore resume errors (likely need user interaction)
        }
    }

    switch (mode) {
      case 'deep_flow':
        await this.generatePureTone();
        break;
      case 'focused_calm':
        await this.generateSimpleHarmonics();
        break;
      case 'gentle_guidance':
        await this.generateRichHarmonics(fi);
        break;
      case 'warning_dissonance':
        await this.generateDissonance(fi);
        break;
      default:
        await this.fadeToSilence();
    }
  }
  
  async generatePureTone() {
    await this.transitionToSoundscape('pure_tone', () => {
      const oscillator = this.createOscillator(this.config.baseFrequency, 'sine');
      this.setOscillatorVolume(oscillator, this.config.volumeRange[0]);
      return [oscillator];
    });
  }
  
  async generateSimpleHarmonics() {
    await this.transitionToSoundscape('simple_harmonics', () => {
      const oscillators = [];
      
      // Fundamental + first harmonic only
      oscillators.push(this.createOscillator(this.config.baseFrequency, 'sine'));
      oscillators.push(this.createOscillator(this.config.baseFrequency * 2, 'sine'));
      
      this.setOscillatorVolume(oscillators[0], this.config.volumeRange[0]);
      this.setOscillatorVolume(oscillators[1], this.config.volumeRange[0] * 0.3);
      
      return oscillators;
    });
  }
  
  async generateRichHarmonics(fi) {
    await this.transitionToSoundscape('rich_harmonics', () => {
      const oscillators = [];
      const complexity = this.config.harmonicComplexity + (fi * 0.4); // Increase complexity with FI
      
      this.harmonics.forEach((ratio, index) => {
        if (index === 0 || Math.random() < complexity) {
          const frequency = this.config.baseFrequency * (1 / ratio);
          const oscillator = this.createOscillator(frequency, 'sine');
          const volume = this.config.volumeRange[0] * Math.pow(0.7, index);
          this.setOscillatorVolume(oscillator, volume);
          oscillators.push(oscillator);
        }
      });
      
      return oscillators;
    });
  }
  
  async generateDissonance(fi) {
    await this.transitionToSoundscape('dissonance', () => {
      const oscillators = [];
      const dissonanceIntensity = (fi - this.config.dissonanceThreshold) / (1 - this.config.dissonanceThreshold);
      
      // Base frequency
      oscillators.push(this.createOscillator(this.config.baseFrequency, 'sine'));
      
      // Add dissonant intervals
      this.dissonanceIntervals.forEach(ratio => {
        if (Math.random() < dissonanceIntensity) {
          const frequency = this.config.baseFrequency * ratio;
          const oscillator = this.createOscillator(frequency, 'triangle');
          this.setOscillatorVolume(oscillator, this.config.volumeRange[0] * 0.4);
          oscillators.push(oscillator);
        }
      });
      
      // Add subtle rhythmic jitter
      oscillators.forEach(osc => {
        const lfo = this.createOscillator(0.1 + Math.random() * 0.3, 'sine');
        const gain = this.state.audioContext.createGain();
        gain.gain.value = 0.02; // Very subtle modulation
        
        lfo.connect(gain);
        gain.connect(osc.frequency);
        lfo.start();
      });
      
      return oscillators;
    });
  }
  
  async transitionToSoundscape(name, createFn) {
    if (this.state.currentSoundscapeName === name) return;

    // 1. Create new soundscape container
    const newSoundscape = {
        name,
        oscillators: [],
        gainNode: this.state.audioContext.createGain()
    };
    newSoundscape.gainNode.gain.value = 0; // Start silent
    newSoundscape.gainNode.connect(this.masterGain);

    // 2. Populate with oscillators (connected to soundscape gain, not master)
    // We need to modify createOscillator/createFn slightly or adapt them here.
    // Since createFn calls createOscillator which currently connects to masterGain,
    // we need to intercept or change createOscillator to return disconnected/flexible nodes.
    // For simplicity, let's redefine createOscillator context within this scope or passed arg.

    // Better: redefine createOscillator to take a destination node
    const createOscillatorForSoundscape = (frequency, type, destination) => {
        const oscillator = this.state.audioContext.createOscillator();
        const oscGain = this.state.audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        oscillator.connect(oscGain);
        oscGain.connect(destination);

        // Attach gain control to oscillator for volume setting
        oscillator._gainNode = oscGain;

        return oscillator;
    };

    // Helper wrapper for the createFn to use the new creator
    // We actually need to change how createFn works.
    // But createFn is just a closure using `this.createOscillator`.
    // I will override `this.createOscillator` temporarily or change the pattern.

    // Let's change the pattern of `createFn`. It calls `this.createOscillator`.
    // I'll update `createOscillator` to use a temporary target if set, or just return the node.
    // But `createOscillator` connects to `masterGain`.
    
    // Strategy: Modify `createOscillator` in the class to support optional destination.
    // But I can't easily change the `createFn` closures passed from other methods without changing those methods.
    // Wait, the methods like `generatePureTone` call `this.createOscillator`.
    // I can update `createOscillator` to check `this.state.targetGainNode`.
    
    this.state.targetGainNode = newSoundscape.gainNode;
    const oscillators = createFn();
    this.state.targetGainNode = null; // Reset
    
    newSoundscape.oscillators = oscillators;
    
    // Start oscillators
    oscillators.forEach(osc => osc.start());

    // 3. Fade in new soundscape
    const now = this.state.audioContext.currentTime;
    const duration = this.config.crossfadeTime / 1000;

    newSoundscape.gainNode.gain.setValueAtTime(0, now);
    newSoundscape.gainNode.gain.linearRampToValueAtTime(1.0, now + duration);

    // 4. Fade out old soundscape
    if (this.state.activeSoundscape) {
        const oldSoundscape = this.state.activeSoundscape;
        this.state.fadingSoundscapes.push(oldSoundscape);

        oldSoundscape.gainNode.gain.setValueAtTime(oldSoundscape.gainNode.gain.value, now);
        oldSoundscape.gainNode.gain.linearRampToValueAtTime(0, now + duration);

        // Cleanup after fade
        setTimeout(() => {
            oldSoundscape.oscillators.forEach(osc => {
                try { osc.stop(); } catch(e) {}
                osc.disconnect();
            });
            oldSoundscape.gainNode.disconnect();

            // Remove from fading list
            const index = this.state.fadingSoundscapes.indexOf(oldSoundscape);
            if (index > -1) this.state.fadingSoundscapes.splice(index, 1);

        }, this.config.crossfadeTime);
    }
    
    this.state.activeSoundscape = newSoundscape;
    this.state.currentSoundscapeName = name;
  }
  
  createOscillator(frequency, type = 'sine') {
    const oscillator = this.state.audioContext.createOscillator();
    const gainNode = this.state.audioContext.createGain();
    
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.value = 0; // Default silent
    
    oscillator.connect(gainNode);

    // Connect to target (for soundscape) or master (fallback)
    const destination = this.state.targetGainNode || this.masterGain;
    gainNode.connect(destination);
    
    // Store gain node reference for volume control
    oscillator._gainNode = gainNode;
    
    return oscillator;
  }
  
  setOscillatorVolume(oscillator, volume) {
    if (oscillator._gainNode) {
        // Set volume immediately on the individual oscillator's gain
        // The crossfade happens on the soundscape's master gain
        oscillator._gainNode.gain.value = volume;
    }
  }
  
  // Deprecated/Unused fadeIn/fadeOut methods (replaced by transition logic)
  async fadeIn() { return Promise.resolve(); }
  async fadeOut() { return Promise.resolve(); }
  
  async fadeToSilence() {
    if (!this.state.activeSoundscape) return;

    const now = this.state.audioContext.currentTime;
    const duration = this.config.crossfadeTime / 1000;

    const oldSoundscape = this.state.activeSoundscape;
    this.state.activeSoundscape = null;
    this.state.currentSoundscapeName = null;

    oldSoundscape.gainNode.gain.setValueAtTime(oldSoundscape.gainNode.gain.value, now);
    oldSoundscape.gainNode.gain.linearRampToValueAtTime(0, now + duration);

    setTimeout(() => {
        oldSoundscape.oscillators.forEach(osc => {
            try { osc.stop(); } catch(e) {}
            osc.disconnect();
        });
        oldSoundscape.gainNode.disconnect();
    }, this.config.crossfadeTime);
  }
  
  async updateHapticResonance(mode, interactionCadence) {
    if (!this.state.hapticDevice || !this.state.hapticDevice.supported) return;
    
    const cadence = this.calculateOptimalCadence(mode, interactionCadence);
    
    if (cadence !== this.state.currentCadence) {
      this.state.currentCadence = cadence;
      await this.startHapticPacemaker(cadence, mode);
    }
  }
  
  calculateOptimalCadence(mode, interactionCadence) {
    let targetCadence = this.config.basePulseRate;
    
    // Adapt to user's natural interaction rhythm
    if (interactionCadence && interactionCadence > 30 && interactionCadence < 120) {
      targetCadence = interactionCadence * this.config.cadenceAdaptation + 
                     this.config.basePulseRate * (1 - this.config.cadenceAdaptation);
    }
    
    // Adjust based on mode
    switch (mode) {
      case 'deep_flow':
        return targetCadence * 0.8; // Slower, deeper rhythm
      case 'focused_calm':
        return targetCadence;
      case 'gentle_guidance':
        return targetCadence * 1.1; // Slightly faster guidance
      case 'warning_dissonance':
        return targetCadence * 1.3; // More urgent rhythm
      default:
        return 0; // No haptic feedback
    }
  }
  
  async startHapticPacemaker(cadence, mode) {
    if (cadence === 0) {
      this.stopHapticPacemaker();
      return;
    }
    
    const interval = 60000 / cadence; // Convert BPM to milliseconds
    const intensity = this.getHapticIntensity(mode);
    
    // Clear existing pacemaker
    this.stopHapticPacemaker();
    
    // Start new pacemaker rhythm
    this.state.hapticInterval = setInterval(() => {
      this.pulseHaptic(intensity);
    }, interval);
  }
  
  getHapticIntensity(mode) {
    const base = this.config.pulseIntensity;
    
    switch (mode) {
      case 'deep_flow': return base * 0.5; // Very subtle
      case 'focused_calm': return base;
      case 'gentle_guidance': return base * 1.2;
      case 'warning_dissonance': return base * 1.5;
      default: return 0;
    }
  }
  
  pulseHaptic(intensity) {
    if (!this.state.hapticDevice || !this.state.hapticDevice.supported) return;
    
    // Convert intensity to vibration duration (10-50ms)
    // Validate intensity
    const safeIntensity = Math.max(0, Math.min(1, intensity));
    const duration = Math.round(10 + safeIntensity * 40);

    // Validate duration (must be positive integer)
    if (duration <= 0 || !Number.isInteger(duration)) return;
    
    try {
      this.state.hapticDevice.vibrate(duration);
    } catch (error) {
      console.warn('Haptic pulse failed:', error.message);
    }
  }
  
  stopHapticPacemaker() {
    if (this.state.hapticInterval) {
      clearInterval(this.state.hapticInterval);
      this.state.hapticInterval = null;
    }
  }
  
  /**
   * Stop all resonance systems
   */
  async stop() {
    await this.fadeToSilence();
    this.stopHapticPacemaker();
    
    if (this.state.audioContext && this.state.audioContext.state === 'running') {
      await this.state.audioContext.suspend();
    }
    
    this.state.resonanceActive = false;
    this.emit('stopped');
  }
  
  /**
   * Create mock audio context for environments without Web Audio API
   */
  createMockAudioContext() {
    return {
      createOscillator: () => ({
        type: 'sine',
        frequency: { value: 440 },
        connect: () => {},
        start: () => {},
        stop: () => {},
        _gainNode: { gain: { value: 0 } }
      }),
      createGain: () => ({
        gain: { 
          value: 0,
          setValueAtTime: () => {},
          linearRampToValueAtTime: () => {}
        },
        connect: () => {}
      }),
      currentTime: 0,
      destination: {},
      state: 'suspended',
      resume: async () => {},
      suspend: async () => {}
    };
  }
  
  /**
   * Create mock haptic device for environments without haptic support
   */
  createMockHapticDevice() {
    return {
      vibrate: (pattern) => {
        // console.log(`Mock haptic vibration: ${pattern}ms`);
      },
      supported: false
    };
  }
  
  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }
  
  /**
   * Get current resonance status
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      resonanceActive: this.state.resonanceActive,
      currentSoundscape: this.state.currentSoundscapeName,
      currentCadence: this.state.currentCadence,
      audioEnabled: this.config.audioEnabled,
      hapticEnabled: this.config.hapticEnabled,
      audioSupported: this.state.audioContext && this.state.audioContext !== this.createMockAudioContext(),
      hapticSupported: this.state.hapticDevice && this.state.hapticDevice.supported,
      config: this.config
    };
  }
}