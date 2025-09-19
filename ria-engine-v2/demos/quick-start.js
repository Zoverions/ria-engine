#!/usr/bin/env node

/**
 * RIA Engine v2.0 - Quick Start Demo
 * 
 * A simplified demo showing the basic capabilities of RIA Engine v2.0
 * Perfect for first-time users and quick evaluation.
 * 
 * Run with: node demos/quick-start.js
 */

import { createEngine, createEngineWithPreset, VERSION } from '../index.js';

console.log(`\n🧠 RIA Engine v${VERSION} - Quick Start Demo\n`);

async function runQuickDemo() {
  try {
    // 1. Create a basic engine
    console.log('1. Creating RIA Engine...');
    const engine = createEngine();
    console.log('   ✓ Engine created');

    // 2. Initialize the engine
    console.log('\n2. Initializing engine systems...');
    await engine.initialize();
    console.log('   ✓ Math core ready');
    console.log('   ✓ Analytics engine ready');
    console.log('   ✓ Plugin system ready');
    console.log('   ✓ Configuration loaded');

    // 3. Start processing
    console.log('\n3. Starting real-time processing...');
    await engine.start();
    console.log('   ✓ Engine is now running');

    // 4. Process some sample data
    console.log('\n4. Processing sample user interaction...');
    
    const sampleInput = {
      phiProxy: 0.75,
      biometric: { hrv: 0.65 },
      context: { platform: 'demo', timestamp: Date.now() }
    };

    // Simulate a few processing cycles
    for (let i = 0; i < 5; i++) {
      const result = await engine.processFrame(sampleInput);
      const fi = result.fi.toFixed(3);
      const interventions = result.interventions.length;
      
      process.stdout.write(`\r   Frame ${i + 1}/5: FI=${fi}, Interventions=${interventions}`);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('\n   ✓ Sample processing completed');

    // 5. Show engine status
    console.log('\n5. Engine Status:');
    const status = engine.getStatus();
    console.log(`   Frames processed: ${status.engine.frameCount}`);
    console.log(`   Average frame time: ${status.engine.performance.avgFrameTime.toFixed(2)}ms`);
    console.log(`   Active plugins: ${status.subsystems.plugins.metrics.activePlugins}`);
    console.log(`   Total analytics events: ${status.subsystems.analytics.totalEvents}`);

    // 6. Generate quick insights
    console.log('\n6. Generating insights...');
    const insights = await engine.analytics.generateInsights();
    console.log(`   ✓ Generated ${insights.length} insights`);
    
    if (insights.length > 0) {
      console.log(`   Latest insight: ${insights[0].message}`);
    }

    // 7. Stop the engine
    console.log('\n7. Stopping engine...');
    await engine.stop();
    console.log('   ✓ Engine stopped gracefully');

    console.log('\n🎉 Quick demo completed successfully!');
    console.log('\nNext steps:');
    console.log('  • Run the comprehensive demo: node demos/comprehensive-demo.js');
    console.log('  • Try different presets: PRODUCTION, HIGH_PERFORMANCE, ACCESSIBILITY');
    console.log('  • Read the documentation in /docs/');
    console.log('  • Explore configuration options in /config/');

  } catch (error) {
    console.error('\n❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Run the demo
runQuickDemo();