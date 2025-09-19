#!/usr/bin/env node

/**
 * RIA Engine v2.0 - Platform Integration Demo
 * 
 * Demonstrates how RIA Engine v2.0 integrates with different platforms:
 * - Web browsers
 * - Figma plugins
 * - VS Code extensions
 * - Electron applications
 * - React Native apps
 * - Native applications
 * 
 * Run with: node demos/platform-demo.js
 */

import { createEngineWithPreset, PRESETS, VERSION } from '../index.js';

class PlatformIntegrationDemo {
  constructor() {
    this.engines = new Map();
    this.platforms = [
      {
        id: 'web-browser',
        name: 'Web Browser',
        description: 'Client-side integration for web applications',
        preset: 'WEB_OPTIMIZED'
      },
      {
        id: 'figma',
        name: 'Figma Plugin',
        description: 'Design tool integration for UI/UX workflows',
        preset: 'DESIGN_TOOLS'
      },
      {
        id: 'vscode',
        name: 'VS Code Extension',
        description: 'Code editor integration for developer productivity',
        preset: 'DEVELOPER_TOOLS'
      },
      {
        id: 'electron',
        name: 'Electron App',
        description: 'Desktop application integration',
        preset: 'DESKTOP'
      },
      {
        id: 'react-native',
        name: 'React Native',
        description: 'Mobile application integration',
        preset: 'MOBILE'
      },
      {
        id: 'node-server',
        name: 'Node.js Server',
        description: 'Server-side analytics and processing',
        preset: 'SERVER'
      }
    ];
  }

  async run() {
    console.log(`🚀 RIA Engine v${VERSION} - Platform Integration Demo\n`);
    
    console.log('This demo shows how RIA Engine v2.0 adapts to different platforms');
    console.log('with optimized configurations and platform-specific features.\n');

    try {
      await this.initializePlatforms();
      await this.demonstrateIntegrations();
      await this.showCrossplatformFeatures();
      await this.cleanup();
      
      console.log('🎉 Platform demo completed successfully!\n');
      this.printNextSteps();
      
    } catch (error) {
      console.error('❌ Platform demo failed:', error.message);
      process.exit(1);
    }
  }

  async initializePlatforms() {
    console.log('📦 Initializing platform-specific engines...\n');
    
    for (const platform of this.platforms) {
      try {
        console.log(`⚙️  Setting up ${platform.name}...`);
        
        // Create engine with platform-specific preset
        const engine = createEngineWithPreset(platform.preset || 'PRODUCTION');
        
        // Configure for platform
        await this.configurePlatform(engine, platform);
        
        // Initialize
        await engine.initialize();
        
        this.engines.set(platform.id, engine);
        console.log(`   ✓ ${platform.name} engine ready`);
        
      } catch (error) {
        console.log(`   ⚠ ${platform.name} setup warning: ${error.message}`);
      }
    }
    
    console.log(`\n✅ ${this.engines.size} platform engines initialized\n`);
  }

  async configurePlatform(engine, platform) {
    // Platform-specific configuration
    const platformConfigs = {
      'web-browser': {
        performance: { targetFPS: 60, enableWebGL: true },
        features: { biometric: false, fileSystem: false },
        analytics: { realtime: true, batching: true }
      },
      'figma': {
        performance: { targetFPS: 30, lowLatency: true },
        features: { designMode: true, vectorAnalysis: true },
        plugins: { enableDesignTools: true }
      },
      'vscode': {
        performance: { backgroundProcessing: true },
        features: { codeAnalysis: true, syntaxAware: true },
        analytics: { developmentMetrics: true }
      },
      'electron': {
        performance: { nativeOptimization: true },
        features: { fullSystemAccess: true, notifications: true },
        security: { sandboxing: false }
      },
      'react-native': {
        performance: { batteryOptimized: true, lowMemory: true },
        features: { deviceSensors: true, hapticFeedback: true },
        analytics: { offlineSupport: true }
      },
      'node-server': {
        performance: { multiThreading: true, clustering: true },
        features: { databaseIntegration: true, apiEndpoints: true },
        analytics: { populationAnalytics: true, bigData: true }
      }
    };

    const config = platformConfigs[platform.id];
    if (config && engine.config) {
      await engine.config.updateConfig(config);
    }
  }

  async demonstrateIntegrations() {
    console.log('🔗 Demonstrating platform integrations...\n');
    
    for (const platform of this.platforms) {
      const engine = this.engines.get(platform.id);
      if (!engine) continue;
      
      console.log(`📱 ${platform.name} Integration:`);
      console.log(`   ${platform.description}`);
      
      // Start the engine
      await engine.start();
      
      // Simulate platform-specific usage
      await this.simulatePlatformUsage(engine, platform);
      
      // Show platform-specific metrics
      this.showPlatformMetrics(engine, platform);
      
      console.log('');
    }
  }

  async simulatePlatformUsage(engine, platform) {
    const simulations = {
      'web-browser': async () => {
        // Simulate user scrolling and interactions
        for (let i = 0; i < 10; i++) {
          await engine.processFrame({
            phiProxy: 0.5 + Math.sin(i / 5) * 0.3,
            interaction: { type: 'scroll', velocity: Math.random() },
            viewport: { width: 1920, height: 1080 }
          });
        }
      },
      'figma': async () => {
        // Simulate design operations
        const designOps = ['select', 'drag', 'resize', 'color-pick', 'align'];
        for (const op of designOps) {
          await engine.processFrame({
            phiProxy: 0.4 + Math.random() * 0.4,
            designOperation: op,
            selectionCount: Math.floor(Math.random() * 5) + 1
          });
        }
      },
      'vscode': async () => {
        // Simulate coding activity
        const codeActions = ['typing', 'debugging', 'refactoring', 'searching'];
        for (const action of codeActions) {
          await engine.processFrame({
            phiProxy: 0.3 + Math.random() * 0.5,
            codeAction: action,
            linesOfCode: Math.floor(Math.random() * 1000) + 100
          });
        }
      },
      'electron': async () => {
        // Simulate desktop app usage
        for (let i = 0; i < 8; i++) {
          await engine.processFrame({
            phiProxy: 0.6 + Math.random() * 0.3,
            windowState: i % 2 === 0 ? 'focused' : 'background',
            systemLoad: Math.random()
          });
        }
      },
      'react-native': async () => {
        // Simulate mobile interactions
        const mobileActions = ['tap', 'swipe', 'pinch', 'rotate'];
        for (const action of mobileActions) {
          await engine.processFrame({
            phiProxy: 0.7 + Math.random() * 0.2,
            touchAction: action,
            deviceOrientation: Math.random() > 0.5 ? 'portrait' : 'landscape'
          });
        }
      },
      'node-server': async () => {
        // Simulate server processing
        for (let i = 0; i < 20; i++) {
          await engine.processFrame({
            phiProxy: Math.random(),
            requestType: 'analytics',
            concurrent: Math.floor(Math.random() * 10) + 1
          });
        }
      }
    };

    const simulation = simulations[platform.id];
    if (simulation) {
      await simulation();
      console.log('   ✓ Platform simulation completed');
    }
  }

  showPlatformMetrics(engine, platform) {
    const status = engine.getStatus();
    const metrics = this.getPlatformSpecificMetrics(status, platform);
    
    console.log('   📊 Platform Metrics:');
    Object.entries(metrics).forEach(([key, value]) => {
      console.log(`      ${key}: ${value}`);
    });
  }

  getPlatformSpecificMetrics(status, platform) {
    const base = {
      'Frame Rate': `${(1000 / status.engine.performance.avgFrameTime).toFixed(1)} fps`,
      'Memory Usage': `${(status.engine.performance.memoryUsage / 1024 / 1024).toFixed(1)}MB`,
      'Events Processed': status.subsystems.analytics.totalEvents
    };

    const platformSpecific = {
      'web-browser': {
        'DOM Updates': Math.floor(Math.random() * 100),
        'Network Requests': Math.floor(Math.random() * 20),
        'WebGL Enabled': 'Yes'
      },
      'figma': {
        'Design Operations': Math.floor(Math.random() * 50),
        'Vector Calculations': Math.floor(Math.random() * 200),
        'Plugin API Calls': Math.floor(Math.random() * 30)
      },
      'vscode': {
        'Code Intelligence': Math.floor(Math.random() * 150),
        'Syntax Highlights': Math.floor(Math.random() * 500),
        'IntelliSense Requests': Math.floor(Math.random() * 80)
      },
      'electron': {
        'Native API Calls': Math.floor(Math.random() * 40),
        'IPC Messages': Math.floor(Math.random() * 60),
        'System Integration': 'Active'
      },
      'react-native': {
        'Touch Events': Math.floor(Math.random() * 100),
        'Native Modules': Math.floor(Math.random() * 20),
        'Battery Impact': 'Low'
      },
      'node-server': {
        'Concurrent Sessions': Math.floor(Math.random() * 1000) + 100,
        'Database Queries': Math.floor(Math.random() * 200),
        'API Throughput': `${Math.floor(Math.random() * 500) + 100}/sec`
      }
    };

    return { ...base, ...platformSpecific[platform.id] };
  }

  async showCrossplatformFeatures() {
    console.log('🌐 Cross-platform Features:\n');
    
    // Data synchronization
    console.log('📡 Data Synchronization:');
    console.log('   • Real-time analytics across all platforms');
    console.log('   • User preference synchronization');
    console.log('   • Cross-device session continuity');
    console.log('   • Unified telemetry and insights\n');
    
    // Plugin compatibility
    console.log('🔌 Plugin Ecosystem:');
    console.log('   • Platform-agnostic plugin API');
    console.log('   • Automatic platform adaptation');
    console.log('   • Shared plugin marketplace');
    console.log('   • Cross-platform plugin development\n');
    
    // Configuration management
    console.log('⚙️  Configuration Management:');
    console.log('   • Environment-specific configurations');
    console.log('   • Platform capability detection');
    console.log('   • Automatic performance optimization');
    console.log('   • Centralized configuration deployment\n');
    
    // Analytics aggregation
    console.log('📊 Analytics Aggregation:');
    const totalEvents = Array.from(this.engines.values())
      .reduce((sum, engine) => sum + engine.getStatus().subsystems.analytics.totalEvents, 0);
    
    console.log(`   • Total events across platforms: ${totalEvents}`);
    console.log(`   • Active platform instances: ${this.engines.size}`);
    console.log('   • Cross-platform user journey tracking');
    console.log('   • Unified dashboard and reporting\n');
  }

  async cleanup() {
    console.log('🧹 Cleaning up platform engines...\n');
    
    for (const [platformId, engine] of this.engines) {
      try {
        await engine.stop();
        console.log(`   ✓ ${platformId} engine stopped`);
      } catch (error) {
        console.log(`   ⚠ ${platformId} cleanup warning: ${error.message}`);
      }
    }
    
    console.log('');
  }

  printNextSteps() {
    console.log('Next Steps:');
    console.log('  📖 Platform Integration Guides:');
    console.log('     • Web: /docs/platforms/web.md');
    console.log('     • Figma: /docs/platforms/figma.md');
    console.log('     • VS Code: /docs/platforms/vscode.md');
    console.log('     • Electron: /docs/platforms/electron.md');
    console.log('     • React Native: /docs/platforms/react-native.md');
    console.log('     • Node.js: /docs/platforms/nodejs.md');
    console.log('');
    console.log('  🛠️  Development Tools:');
    console.log('     • Platform SDK: npm install @ria-engine/platform-sdk');
    console.log('     • CLI Tools: npm install -g @ria-engine/cli');
    console.log('     • Testing Framework: npm install @ria-engine/testing');
    console.log('');
    console.log('  🚀 Deploy to Platforms:');
    console.log('     • npm run build:web');
    console.log('     • npm run build:figma');
    console.log('     • npm run build:vscode');
    console.log('     • npm run build:electron');
    console.log('     • npm run build:mobile');
    console.log('     • npm run deploy:server');
  }
}

// Run demo if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const demo = new PlatformIntegrationDemo();
  demo.run().catch(console.error);
}

export default PlatformIntegrationDemo;