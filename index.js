/**
 * RIA Engine v2.0 - Main Entry Point
 * 
 * Complete Resonant Interface Architecture Engine
 * Production-ready cognitive load reduction system
 * 
 * @version 2.0.0
 * @author Zoverions Grand Unified Model ZGUM v16.2
 * @license Apache-2.0
 */

import { RIAEngine } from './core/RIAEngine.js';
import { ConfigManager } from './core/config/ConfigManager.js';
import { PluginManager } from './plugins/PluginManager.js';
import { AnalyticsEngine } from './analytics/AnalyticsEngine.js';
import { BiometricManager } from './biometrics/BiometricManager.js';
import { MLPersonalization } from './ml/MLPersonalization.js';
import { MathCore } from './core/math/MathCore.js';
import { Logger } from './core/utils/Logger.js';

// Version information
export const VERSION = '2.0.0';
export const API_VERSION = '2.0.0';

// Core exports
export { RIAEngine };
export { ConfigManager };
export { PluginManager };
export { AnalyticsEngine };
export { BiometricManager };
export { MLPersonalization };
export { MathCore };
export { Logger };

// Utility exports
// export { PerformanceMonitor } from './core/utils/PerformanceMonitor.js';
// export { EventRouter } from './core/utils/EventRouter.js';

// Plugin exports
// export { PluginAPI } from './plugins/api/PluginAPI.js';
// export { PluginBase } from './plugins/base/PluginBase.js';

// Analytics exports
// export { MetricsCollector } from './analytics/collectors/MetricsCollector.js';
// export { InsightGenerator } from './analytics/insights/InsightGenerator.js';

// ML exports
// export { PersonalizationModel } from './ml/models/PersonalizationModel.js';
// export { PredictiveModel } from './ml/models/PredictiveModel.js';

// Configuration presets
export const PRESETS = {
  // Development preset
  DEVELOPMENT: {
    engine: { frameRate: 30, enableGPU: false },
    development: { enableDebugMode: true, enableVerboseLogging: true },
    analytics: { enableCloudSync: false },
    security: { enableEncryption: false }
  },
  
  // Production preset
  PRODUCTION: {
    engine: { frameRate: 60, enableGPU: true },
    development: { enableDebugMode: false, enableVerboseLogging: false },
    analytics: { enableCloudSync: true },
    security: { enableEncryption: true, enableAuthentication: true }
  },
  
  // High-performance preset
  HIGH_PERFORMANCE: {
    engine: { frameRate: 120, enableGPU: true, workerCount: 8 },
    math: { windowSize: 128, enableWavelets: true, enableFractals: true },
    performance: { maxFrameTime: 8, enableProfiling: true }
  },
  
  // Privacy-focused preset
  PRIVACY_FOCUSED: {
    analytics: { 
      enableAnonymization: true, 
      enableDifferentialPrivacy: true,
      enableCloudSync: false 
    },
    security: { 
      enableEncryption: true, 
      dataRetentionPolicy: '30d',
      enableAuditLog: true 
    },
    biometrics: { enabled: false }
  },
  
  // Accessibility preset
  ACCESSIBILITY: {
    profiles: { default: 'accessibility' },
    thresholds: { 
      preventive: 0.4, 
      gentle: 0.6, 
      aggressive: 0.9, 
      critical: 1.5 
    },
    interventions: { 
      enablePreventive: true,
      smoothTransitions: true,
      maxChangePerFrame: 0.05
    }
  },
  
  // Research preset
  RESEARCH: {
    analytics: { 
      enableLongitudinal: true, 
      retentionDays: 365,
      enableRealtime: true 
    },
    ml: { 
      enablePersonalization: true, 
      enablePredictive: true,
      enableFederatedLearning: true 
    },
    development: { enableTestMode: true, mockBiometrics: true }
  }
};

// Profile definitions
export const PROFILES = {
  AVERAGE: {
    id: 'average',
    name: 'Average User',
    omega: 1.0,
    D_base: 0.08,
    thresholds: { gentle: 0.7, aggressive: 1.1 },
    description: 'Standard configuration for typical users'
  },
  
  FAST_TYPIST: {
    id: 'fast_typist',
    name: 'Fast Typist',
    omega: 1.2,
    D_base: 0.05,
    thresholds: { gentle: 0.8, aggressive: 1.3 },
    description: 'Optimized for users with high-speed interaction patterns'
  },
  
  NEURODIVERSE: {
    id: 'neurodiverse',
    name: 'Neurodiverse',
    omega: 0.8,
    D_base: 0.12,
    thresholds: { gentle: 0.6, aggressive: 0.9 },
    description: 'Enhanced sensitivity for neurodiverse users'
  },
  
  ACCESSIBILITY: {
    id: 'accessibility',
    name: 'Accessibility',
    omega: 0.7,
    D_base: 0.15,
    thresholds: { gentle: 0.5, aggressive: 0.8 },
    description: 'Maximum assistance for users with accessibility needs'
  },
  
  GAMING: {
    id: 'gaming',
    name: 'Gaming',
    omega: 1.5,
    D_base: 0.03,
    thresholds: { gentle: 0.9, aggressive: 1.5 },
    description: 'High-performance configuration for gaming scenarios'
  },
  
  ELDERLY: {
    id: 'elderly',
    name: 'Elderly',
    omega: 0.6,
    D_base: 0.18,
    thresholds: { gentle: 0.4, aggressive: 0.7 },
    description: 'Gentle configuration optimized for elderly users'
  }
};

/**
 * Create a new RIA Engine instance with simplified configuration
 */
export function createEngine(config = {}) {
  return new RIAEngine(config);
}

/**
 * Create a RIA Engine with a preset configuration
 */
export function createEngineWithPreset(presetName, additionalConfig = {}) {
  const preset = PRESETS[presetName.toUpperCase()];
  if (!preset) {
    throw new Error(`Unknown preset: ${presetName}. Available presets: ${Object.keys(PRESETS).join(', ')}`);
  }
  
  const config = {
    ...preset,
    ...additionalConfig
  };
  
  return new RIAEngine(config);
}

/**
 * Create a RIA Engine with a specific user profile
 */
export function createEngineWithProfile(profileName, additionalConfig = {}) {
  const profile = PROFILES[profileName.toUpperCase()];
  if (!profile) {
    throw new Error(`Unknown profile: ${profileName}. Available profiles: ${Object.keys(PROFILES).join(', ')}`);
  }
  
  const config = {
    profiles: { default: profile.id },
    thresholds: profile.thresholds,
    math: {
      omega: profile.omega,
      D_base: profile.D_base
    },
    ...additionalConfig
  };
  
  return new RIAEngine(config);
}

/**
 * Initialize RIA Engine with automatic platform detection
 */
export async function initializeForPlatform(platform, config = {}) {
  const platformConfigs = {
    web: {
      plugins: { 
        enabled: true,
        autoLoad: ['web-browser', 'analytics'] 
      },
      biometrics: { enabled: false }
    },
    
    figma: {
      plugins: { 
        enabled: true,
        autoLoad: ['figma', 'analytics'] 
      },
      engine: { frameRate: 30 }
    },
    
    vscode: {
      plugins: { 
        enabled: true,
        autoLoad: ['vscode', 'analytics'] 
      },
      interventions: { 
        visualEffects: { blur: false, saturation: true } 
      }
    },
    
    electron: {
      plugins: { 
        enabled: true,
        autoLoad: ['electron', 'analytics'] 
      },
      biometrics: { enabled: true }
    },
    
    mobile: {
      plugins: { 
        enabled: true,
        autoLoad: ['mobile', 'analytics'] 
      },
      engine: { frameRate: 30, enableGPU: false },
      performance: { maxMemoryUsage: 200 }
    }
  };
  
  const platformConfig = platformConfigs[platform];
  if (!platformConfig) {
    throw new Error(`Unsupported platform: ${platform}. Supported platforms: ${Object.keys(platformConfigs).join(', ')}`);
  }
  
  const mergedConfig = {
    ...platformConfig,
    ...config
  };
  
  const engine = new RIAEngine(mergedConfig);
  await engine.initialize();
  
  return engine;
}

/**
 * Utility function to validate configuration
 */
export function validateConfig(config) {
  const configManager = new ConfigManager();
  return configManager.validator.validate(config);
}

/**
 * Get system capabilities and recommendations
 */
export function getSystemRecommendations() {
  const recommendations = {
    gpu: typeof window !== 'undefined' && window.WebGLRenderingContext,
    workers: typeof Worker !== 'undefined',
    webgl2: typeof window !== 'undefined' && window.WebGL2RenderingContext,
    offscreenCanvas: typeof OffscreenCanvas !== 'undefined',
    sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined'
  };
  
  const config = {
    engine: {
      enableGPU: recommendations.gpu && recommendations.webgl2,
      enableWorkers: recommendations.workers,
      workerCount: navigator?.hardwareConcurrency || 4
    },
    performance: {
      maxFrameTime: recommendations.gpu ? 8 : 16
    }
  };
  
  return { recommendations, config };
}

/**
 * Create a minimal RIA Engine for testing
 */
export function createTestEngine() {
  return createEngineWithPreset('DEVELOPMENT', {
    development: { enableTestMode: true },
    analytics: { enabled: false },
    plugins: { enabled: false },
    biometrics: { enabled: false }
  });
}

// Default export
export default RIAEngine;

// CLI support
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧠 RIA Engine v2.0 - Resonant Interface Architecture');
  console.log('');
  console.log('Available presets:', Object.keys(PRESETS).join(', '));
  console.log('Available profiles:', Object.keys(PROFILES).join(', '));
  console.log('');
  console.log('For documentation, visit: https://github.com/Zoverions/ria-engine');
}