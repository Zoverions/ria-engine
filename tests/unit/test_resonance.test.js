import { test, describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { MultiSensoryResonanceManager } from '../../resonance/MultiSensoryResonanceManager.js';

describe('MultiSensoryResonanceManager', () => {
  let manager;
  let originalWindow;
  let originalNavigator;

  before(() => {
    // Save originals
    originalWindow = global.window;

    // Mock window
    global.window = {
      AudioContext: class {
        constructor() {
          this.state = 'running';
          this.destination = {};
        }
        createGain() {
          return {
            gain: {
              value: 0,
              setValueAtTime: () => {},
              linearRampToValueAtTime: () => {}
            },
            connect: () => {},
            disconnect: () => {}
          };
        }
        createOscillator() {
          return {
            frequency: { value: 0 },
            connect: () => {},
            disconnect: () => {},
            start: () => {},
            stop: () => {}
          };
        }
        get currentTime() { return Date.now() / 1000; }
        resume() { return Promise.resolve(); }
        suspend() { return Promise.resolve(); }
      },
      addEventListener: () => {},
      removeEventListener: () => {}
    };

    // Try to mock navigator
    try {
      if (global.navigator) {
         // If it exists and is read-only, we might be stuck unless we use Object.defineProperty
         // But usually in Node it shouldn't exist unless added by a polyfill.
         // If it exists, let's see if we can overwrite it.
         Object.defineProperty(global, 'navigator', {
            value: { vibrate: () => {} },
            writable: true,
            configurable: true
         });
      } else {
         global.navigator = {
            vibrate: () => {}
         };
      }
    } catch (e) {
      console.log('Could not mock navigator:', e.message);
    }

    manager = new MultiSensoryResonanceManager();
    manager.initialize();
  });

  after(() => {
    if (originalWindow) global.window = originalWindow;
    else delete global.window;

    // Cleanup navigator if we messed with it
    // Note: restoring might be hard if we used defineProperty and it was non-configurable before
  });

  it('should initialize correctly', () => {
    assert.ok(manager.state.audioContext, 'AudioContext should be initialized');
    assert.ok(manager.masterGain, 'Master gain should be created');
  });

  it('should transition soundscapes with crossfading', async () => {
    // Mock oscillators creation
    const createFn = () => [manager.createOscillator(440)];

    await manager.transitionToSoundscape('test_scape', createFn);

    assert.strictEqual(manager.state.currentSoundscapeName, 'test_scape');
    assert.ok(manager.state.activeSoundscape, 'Should have active soundscape');
    assert.strictEqual(manager.state.activeSoundscape.oscillators.length, 1);

    // Transition to another
    await manager.transitionToSoundscape('new_scape', createFn);

    assert.strictEqual(manager.state.currentSoundscapeName, 'new_scape');
    assert.strictEqual(manager.state.fadingSoundscapes.length, 1, 'Old soundscape should be fading');
  });

  it('should handle suspended AudioContext', async () => {
    manager.state.audioContext.state = 'suspended';
    let resumed = false;
    manager.state.audioContext.resume = async () => { resumed = true; };

    await manager.updateAudioResonance('deep_flow', 0.2, 0);

    assert.strictEqual(resumed, true, 'Should attempt to resume suspended context');
  });
});
