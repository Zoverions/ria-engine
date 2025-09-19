/**
 * RIA Engine v2.1 - Novel Enhancements Demo
 * 
 * Demonstrates the three revolutionary enhancement vectors:
 * 1. Generative Interventions: Proactive context-aware assistance
 * 2. Multi-Sensory Resonance: Adaptive audio and haptic feedback
 * 3. Antifragile Learning: Learning from attention fractures
 */

import { RIAEngine } from '../core/RIAEngine.js';

console.log('🧠 RIA Engine v2.1 - Novel Enhancements Demo');
console.log('================================================');

async function runDemo() {
  // Initialize RIA Engine v2.1 with all enhancements
  const engine = new RIAEngine({
    biometrics: { enableHRV: true },
    ml: { enablePersonalization: true },
    generative: { enabled: true, triggerThreshold: 0.6 },
    resonance: { enabled: true, audioEnabled: true },
    antifragile: { enabled: true, learningRate: 0.1 }
  });

  try {
    await engine.initialize();
    console.log('✅ RIA Engine v2.1 initialized successfully\n');

    // Simulate user working session
    console.log('📊 DEMO: Simulating cognitive load escalation...\n');

    // Stage 1: Focused work
    console.log('1. 🎯 Deep focus state');
    await simulateState(engine, {
      fi: 0.2,
      stress: 0.3,
      context: { domain: 'javascript', task: 'coding' },
      description: 'User in deep flow'
    });

    await delay(1000);

    // Stage 2: Moderate load - Generative intervention trigger
    console.log('2. 🧠 Pre-fracture state - generative help triggered');
    await simulateState(engine, {
      fi: 0.65,
      stress: 0.6,
      context: { 
        domain: 'javascript', 
        task: 'Debugging Array.prototype.reduce operations' 
      },
      description: 'Complexity increasing, system provides help'
    });

    await delay(1500);

    // Stage 3: High stress - Multi-sensory resonance
    console.log('3. 🎵 High stress - resonance systems activate');
    await simulateState(engine, {
      fi: 0.75,
      stress: 0.8,
      interactionCadence: 95,
      description: 'Audio/haptic feedback providing guidance'
    });

    await delay(1000);

    // Stage 4: Attention fracture - Antifragile learning
    console.log('4. 💥 Attention fracture - antifragile learning activated');
    await simulateState(engine, {
      fi: 0.87,
      stress: 0.9,
      taskComplexity: 0.9,
      description: 'System learns from cognitive failure'
    });

    await delay(1500);

    // Stage 5: Recovery with learned adaptations
    console.log('5. 🔄 Recovery with system adaptations');
    await simulateState(engine, {
      fi: 0.55,
      stress: 0.5,
      description: 'Antifragile adaptations prevent similar fractures'
    });

    // Get final status
    const status = engine.getStatus();
    
    console.log('\n📊 DEMO RESULTS:');
    console.log('==================');
    console.log(`Version: ${status.engine.version}`);
    console.log(`Frames Processed: ${status.engine.frameCount}`);
    console.log(`Session Duration: ${Math.round(status.engine.uptime / 1000)}s`);
    
    if (status.enhancements) {
      console.log('\n🚀 Enhancement Systems Status:');
      console.log(`• Generative: ${status.enhancements.generative?.enabled ? 'Active' : 'Inactive'}`);
      console.log(`• Resonance: ${status.enhancements.resonance?.enabled ? 'Active' : 'Inactive'}`);
      console.log(`• Antifragile: ${status.enhancements.antifragile?.enabled ? 'Active' : 'Inactive'}`);
    }

    await engine.stop();
    console.log('\n🏁 Demo completed successfully!');
    console.log('RIA v2.1 novel enhancements demonstrated! 🚀');

  } catch (error) {
    console.error('❌ Demo error:', error.message);
  }
}

async function simulateState(engine, state) {
  console.log(`   ${state.description}`);
  console.log(`   FI: ${state.fi?.toFixed(3) || 'N/A'} | Stress: ${state.stress?.toFixed(2) || 'N/A'}`);

  // Create data packet
  const dataPacket = {
    fi: state.fi || 0.5,
    stressLevel: state.stress || 0.3,
    context: state.context || {},
    taskComplexity: state.taskComplexity || 0.5,
    interactionCadence: state.interactionCadence || 60,
    timestamp: Date.now()
  };

  // Process through engine
  engine.addData('demo', dataPacket);
  await delay(100);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the demo
runDemo().catch(console.error);

import { RIAEngine } from '../core/RIAEngine.js';

console.log('🧠 RIA Engine v2.1 - Novel Enhancements Demo');
console.log('================================================');
console.log('Demonstrating three revolutionary cognitive enhancement vectors:\n');

async function runNovelEnhancementsDemo() {
  // Initialize RIA Engine v2.1 with all enhancements enabled
  const engine = new RIAEngine({
    biometrics: {
      enableHRV: true,
      samplingRate: 250
    },
    ml: {
      enablePersonalization: true,
      adaptiveThresholds: true
    },
    analytics: {
      enableRealTimeAnalytics: true
    },
    
    // Novel Enhancement Configurations
    generative: {
      enabled: true,
      triggerThreshold: 0.6,
      maxInterventionsPerMinute: 3,
      relevanceThreshold: 0.7
    },
    resonance: {
      enabled: true,
      audioEnabled: true,
      hapticEnabled: true,
      baseFrequency: 220,
      basePulseRate: 60
    },
    antifragile: {
      enabled: true,
      learningRate: 0.1,
      explorationRate: 0.15,
      fractureThreshold: 0.85
    }
  });\n  
  try {
    await engine.initialize();\n    \n    // Set up user profile for personalized experience\n    await engine.setUserProfile({\n      id: 'demo-user-001',\n      age: 28,\n      fitnessLevel: 'intermediate',\n      experience: 'beginner',\n      goals: ['focus-enhancement', 'stress-reduction'],\n      preferences: {\n        sensitivity: 'medium',\n        feedback: 'multi-modal'\n      }\n    });\n    \n    console.log('✅ RIA Engine v2.1 initialized with novel enhancements\\n');\n    \n    // Start monitoring and enhancement systems\n    await engine.start();\n    \n    // Set up event listeners to observe enhancement activities\n    let generativeInterventions = 0;\n    let resonanceUpdates = 0;\n    let fracturesProcessed = 0;\n    \n    engine.generativeManager.on('interventionGenerated', (data) => {\n      generativeInterventions++;\n      console.log(`🧠 GENERATIVE INTERVENTION #${generativeInterventions}:`);\n      console.log(`   Context: ${data.context.domain || 'general'}`);\n      console.log(`   Help: \"${data.intervention.content.title}\"`);\n      console.log(`   Relevance: ${(data.intervention.metadata.relevance * 100).toFixed(1)}%\\n`);\n    });\n    \n    engine.resonanceManager.on('resonanceUpdated', (data) => {\n      resonanceUpdates++;\n      console.log(`🎵 RESONANCE UPDATE #${resonanceUpdates}:`);\n      console.log(`   Mode: ${data.mode}`);\n      console.log(`   FI: ${data.fi.toFixed(3)}`);\n      console.log(`   Audio: ${data.audioActive ? 'Active' : 'Inactive'}`);\n      console.log(`   Haptic: ${data.hapticActive ? 'Active' : 'Inactive'}\\n`);\n    });\n    \n    engine.antifragileManager.on('fractureProcessed', (data) => {\n      fracturesProcessed++;\n      console.log(`🧬 ANTIFRAGILE LEARNING #${fracturesProcessed}:`);\n      console.log(`   Fracture Severity: ${data.analysis.severity.toFixed(3)}`);\n      console.log(`   Contributing Factors: ${data.analysis.contributingFactors.length}`);\n      console.log(`   Intervention Points: ${data.analysis.interventionPoints.length}`);\n      console.log(`   Adaptations Made: ${data.adaptations}\\n`);\n    });\n    \n    // === SCENARIO 1: Focused Work Session ===\n    console.log('📊 SCENARIO 1: Starting focused work session...');\n    console.log('User begins working on a complex JavaScript optimization task\\n');\n    \n    // Simulate initial focused state\n    await simulateUserState(engine, {\n      fi: 0.2,\n      stress: 0.3,\n      focus: 0.8,\n      context: {\n        domain: 'javascript',\n        task: 'Optimizing array processing with Array.prototype.reduce',\n        currentFile: 'data-processor.js',\n        activity: 'coding'\n      },\n      description: 'Deep focus, low cognitive load'\n    });\n    \n    await delay(1000);\n    \n    // === SCENARIO 2: Gradual Cognitive Load Increase ===\n    console.log('📈 SCENARIO 2: Cognitive load gradually increasing...');\n    console.log('User encounters complexity, FI begins to rise\\n');\n    \n    await simulateUserState(engine, {\n      fi: 0.5,\n      stress: 0.4,\n      focus: 0.6,\n      context: {\n        domain: 'javascript',\n        task: 'Debugging reduce function with nested array operations',\n        currentCode: 'const result = data.reduce((acc, item) => { return item.values.reduce(...) }, [])',\n        activity: 'debugging'\n      },\n      description: 'Moderate load, still manageable'\n    });\n    \n    await delay(1500);\n    \n    // === SCENARIO 3: Pre-Fracture State - Generative Intervention Triggered ===\n    console.log('⚠️  SCENARIO 3: Entering pre-fracture state...');\n    console.log('FI crosses generative intervention threshold (0.6)\\n');\n    \n    await simulateUserState(engine, {\n      fi: 0.65,\n      stress: 0.6,\n      focus: 0.4,\n      focusTrend: -0.1, // Declining focus\n      context: {\n        domain: 'javascript',\n        task: 'Complex nested reduce operations causing confusion',\n        currentCode: 'data.reduce((acc, item) => acc.concat(item.nested.reduce(...)))',\n        error: 'TypeError: Cannot read property reduce of undefined',\n        activity: 'debugging'\n      },\n      description: 'Cognitive overload building, focus fragmenting'\n    });\n    \n    await delay(2000);\n    \n    // === SCENARIO 4: High Stress - Multi-Sensory Resonance Activation ===\n    console.log('🎵 SCENARIO 4: High stress state - resonance systems activate...');\n    console.log('Audio becomes more complex, haptic guidance increases\\n');\n    \n    await simulateUserState(engine, {\n      fi: 0.75,\n      stress: 0.8,\n      focus: 0.3,\n      interactionCadence: 95, // Faster, more agitated interactions\n      context: {\n        domain: 'javascript',\n        task: 'Multiple nested array operations failing',\n        activity: 'frustrated-debugging'\n      },\n      description: 'High stress, resonance systems providing calming feedback'\n    });\n    \n    await delay(1500);\n    \n    // === SCENARIO 5: Attention Fracture - Antifragile Learning ===\n    console.log('💥 SCENARIO 5: Attention fracture occurs!');\n    console.log('FI exceeds threshold, antifragile system learns from failure\\n');\n    \n    await simulateUserState(engine, {\n      fi: 0.87, // Above fracture threshold\n      stress: 0.9,\n      focus: 0.1,\n      taskComplexity: 0.9,\n      uiComplexity: 0.8,\n      notificationCount: 7,\n      context: {\n        domain: 'javascript',\n        task: 'Complete cognitive overload - context switching',\n        activity: 'context-switching'\n      },\n      description: 'FRACTURE: Attention completely fragmented'\n    });\n    \n    await delay(2000);\n    \n    // === SCENARIO 6: Recovery with Learned Adaptations ===\n    console.log('🔄 SCENARIO 6: Recovery phase with antifragile adaptations...');\n    console.log('System applies learned interventions to prevent similar fractures\\n');\n    \n    await simulateUserState(engine, {\n      fi: 0.55,\n      stress: 0.5,\n      focus: 0.6,\n      context: {\n        domain: 'javascript',\n        task: 'Simplified approach to array processing',\n        activity: 'coding'\n      },\n      description: 'Recovery aided by system adaptations'\n    });\n    \n    await delay(1000);\n    \n    // === SCENARIO 7: Demonstration of Structural Adaptation ===\n    console.log('🏗️  SCENARIO 7: Testing learned structural adaptations...');\n    console.log('Simulating similar conditions to previous fracture\\n');\n    \n    // Simulate conditions similar to the fracture to see if system prevents it\n    await simulateUserState(engine, {\n      fi: 0.72, // High but below previous fracture\n      stress: 0.7,\n      focus: 0.4,\n      taskComplexity: 0.8,\n      context: {\n        domain: 'javascript',\n        task: 'Similar complex task but with system adaptations',\n        activity: 'coding'\n      },\n      description: 'Testing antifragile adaptations under similar stress'\n    });\n    \n    await delay(1500);\n    \n    // === FINAL ANALYSIS ===\n    console.log('\\n📊 DEMO ANALYSIS:');\n    console.log('==================');\n    \n    const finalStatus = engine.getStatus();\n    \n    console.log(`\\n🧠 GENERATIVE INTERVENTIONS:`);\n    console.log(`   Total Interventions: ${generativeInterventions}`);\n    console.log(`   Knowledge Domains: ${Object.keys(finalStatus.enhancements.generative.domainDistribution || {}).length}`);\n    console.log(`   Average Relevance: ${(finalStatus.enhancements.generative.averageRelevance * 100).toFixed(1)}%`);\n    \n    console.log(`\\n🎵 MULTI-SENSORY RESONANCE:`);\n    console.log(`   Resonance Updates: ${resonanceUpdates}`);\n    console.log(`   Audio Support: ${finalStatus.enhancements.resonance.audioSupported ? 'Yes' : 'Mock'}`);\n    console.log(`   Haptic Support: ${finalStatus.enhancements.resonance.hapticSupported ? 'Yes' : 'Mock'}`);\n    console.log(`   Current Mode: ${finalStatus.enhancements.resonance.currentSoundscape || 'None'}`);\n    \n    console.log(`\\n🧬 ANTIFRAGILE LEARNING:`);\n    console.log(`   Fractures Processed: ${fracturesProcessed}`);\n    console.log(`   Total Adaptations: ${finalStatus.enhancements.antifragile.adaptationCount}`);\n    console.log(`   Q-Table Size: ${finalStatus.enhancements.antifragile.qTableSize} states`);\n    console.log(`   Learning Effectiveness: ${(finalStatus.enhancements.antifragile.learningEffectiveness * 100).toFixed(1)}%`);\n    console.log(`   Exploration Rate: ${(finalStatus.enhancements.antifragile.explorationRate * 100).toFixed(1)}%`);\n    \n    console.log(`\\n🎯 SYSTEM EVOLUTION:`);\n    console.log(`   Engine Version: ${finalStatus.engine.version}`);\n    console.log(`   Total Frames Processed: ${finalStatus.engine.frameCount}`);\n    console.log(`   Session Duration: ${Math.round(finalStatus.engine.uptime / 1000)}s`);\n    console.log(`   Average Processing Time: ${finalStatus.engine.performance.avgFrameTime.toFixed(2)}ms`);\n    \n    // Export session data for analysis\n    const sessionExport = await engine.exportSessionData('json');\n    console.log(`\\n💾 Session data exported (${(sessionExport.length / 1024).toFixed(1)}KB)`);\n    \n    await engine.stop();\n    \n    console.log('\\n🏁 Demo completed successfully!');\n    console.log('\\nRIA Engine v2.1 has demonstrated:');\n    console.log('• Proactive generative interventions that provide contextual help');\n    console.log('• Multi-sensory resonance that adapts to cognitive state');\n    console.log('• Antifragile learning that grows stronger from attention fractures');\n    console.log('\\nThe system has evolved from purely defensive to proactive and adaptive! 🚀');\n    \n  } catch (error) {\n    console.error('❌ Demo error:', error);\n  }\n}\n\n/**\n * Simulate user state and process through RIA Engine v2.1\n */\nasync function simulateUserState(engine, state) {\n  console.log(`📝 ${state.description}`);\n  console.log(`   FI: ${state.fi.toFixed(3)} | Stress: ${state.stress.toFixed(2)} | Focus: ${state.focus.toFixed(2)}`);\n  \n  // Create realistic data packet\n  const dataPacket = {\n    timestamp: Date.now(),\n    fi: state.fi,\n    fractureIndex: state.fi,\n    stressLevel: state.stress,\n    focus: state.focus,\n    focusTrend: state.focusTrend || 0,\n    taskComplexity: state.taskComplexity || 0.5,\n    uiComplexity: state.uiComplexity || 0.4,\n    notificationCount: state.notificationCount || 0,\n    interactionCadence: state.interactionCadence || 60,\n    lastInteraction: Date.now() - 1000,\n    context: state.context || {},\n    \n    // Biometric simulation\n    heartRate: 70 + (state.stress * 30) + (Math.random() - 0.5) * 10,\n    rrInterval: 800 - (state.stress * 200) + (Math.random() - 0.5) * 100\n  };\n  \n  // Process through engine\n  engine.addData('demo', dataPacket);\n  \n  // Allow processing time\n  await delay(100);\n}\n\n/**\n * Simple delay utility\n */\nfunction delay(ms) {\n  return new Promise(resolve => setTimeout(resolve, ms));\n}\n\n// Run the demo\nrunNovelEnhancementsDemo().catch(console.error);