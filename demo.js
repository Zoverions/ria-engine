#!/usr/bin/env node

/**
 * RIA v1 Prototype - Interactive Demo
 * 
 * This script demonstrates the core RIA functionality with simulated data
 * Run with: node demo.js
 */

const { RIAEngine, PROFILES } = require('./ria-v1-prototype/code.js');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Demo configuration
const DEMO_CONFIG = {
  duration: 30,        // seconds
  frameRate: 20,       // fps
  profileToTest: 'neurodiverse',
  enableBiometrics: true
};

class RIADemo {
  constructor() {
    this.engine = new RIAEngine(
      DEMO_CONFIG.profileToTest, 
      DEMO_CONFIG.enableBiometrics, 
      'champion'
    );
    this.frameCount = 0;
    this.maxFrames = DEMO_CONFIG.duration * DEMO_CONFIG.frameRate;
    this.startTime = Date.now();
    
    // Simulation state
    this.attentionState = 'focused';  // 'focused', 'distracted', 'fractured'
    this.stressLevel = 0.3;  // 0-1
    this.taskComplexity = 0.5;  // 0-1
  }

  generatePhiProxy() {
    let baseEntropy = 0.2;  // Baseline attention entropy
    
    // Simulate different attention states
    switch (this.attentionState) {
      case 'focused':
        baseEntropy = 0.1 + Math.random() * 0.2;
        break;
      case 'distracted':
        baseEntropy = 0.3 + Math.random() * 0.3;
        break;
      case 'fractured':
        baseEntropy = 0.6 + Math.random() * 0.4;
        break;
    }
    
    // Add task complexity influence
    baseEntropy += this.taskComplexity * 0.2;
    
    // Add temporal patterns (fatigue over time)
    const timeProgress = this.frameCount / this.maxFrames;
    baseEntropy += timeProgress * 0.1;  // Gradual entropy increase
    
    // Random spikes to simulate attention fractures
    if (Math.random() < 0.05) {  // 5% chance per frame
      baseEntropy += 0.3;
      this.attentionState = 'fractured';
    } else if (Math.random() < 0.1) {  // 10% chance
      this.attentionState = 'distracted';
    } else if (Math.random() < 0.7) {  // 70% chance to return to focus
      this.attentionState = 'focused';
    }
    
    return Math.max(0, Math.min(1, baseEntropy));
  }

  generateMockHRV() {
    // Simulate HRV based on stress level and time
    const baseHRV = 0.7 - this.stressLevel * 0.4;
    const timeVariation = Math.sin(this.frameCount / 100) * 0.1;
    const randomNoise = (Math.random() - 0.5) * 0.1;
    
    return Math.max(0.1, Math.min(1.0, baseHRV + timeVariation + randomNoise));
  }

  simulateComplexityChanges() {
    // Simulate changing task complexity over time
    if (this.frameCount % 200 === 0) {  // Every 10 seconds at 20fps
      this.taskComplexity = Math.random();
      this.logEvent(`Task complexity changed to ${(this.taskComplexity * 100).toFixed(0)}%`);
    }
    
    // Simulate stress events
    if (this.frameCount % 300 === 0) {  // Every 15 seconds
      this.stressLevel = Math.random() * 0.8;
      this.logEvent(`Stress level changed to ${(this.stressLevel * 100).toFixed(0)}%`);
    }
  }

  logEvent(message) {
    const timestamp = ((Date.now() - this.startTime) / 1000).toFixed(1);
    console.log(`${colors.cyan}[${timestamp}s]${colors.reset} ${message}`);
  }

  logMetrics(result) {
    const { fi, ui_update, ncb_estimate, session_metrics } = result;
    
    // Create visual indicators
    const fiBar = this.createProgressBar(fi / 2.0, 20);  // Scale FI to 0-2 range
    const gammaBar = this.createProgressBar(ui_update.gamma, 20);
    const ncbBar = this.createProgressBar(ncb_estimate / 100, 20);
    
    // Clear screen and show current metrics
    if (this.frameCount % 20 === 0) {  // Update display every second
      console.clear();
      console.log(`${colors.bold}${colors.magenta}🧠 RIA v1 Prototype Demo${colors.reset}\n`);
      
      console.log(`${colors.bold}Session Info:${colors.reset}`);
      console.log(`  Profile: ${colors.yellow}${DEMO_CONFIG.profileToTest}${colors.reset}`);
      console.log(`  Mode: ${colors.yellow}champion${colors.reset}`);
      console.log(`  Time: ${colors.yellow}${((Date.now() - this.startTime) / 1000).toFixed(1)}s${colors.reset} / ${DEMO_CONFIG.duration}s`);
      console.log(`  Frames: ${colors.yellow}${this.frameCount}${colors.reset} / ${this.maxFrames}\n`);
      
      console.log(`${colors.bold}Current State:${colors.reset}`);
      console.log(`  Attention: ${this.getAttentionColor()}${this.attentionState}${colors.reset}`);
      console.log(`  Task Complexity: ${colors.yellow}${(this.taskComplexity * 100).toFixed(0)}%${colors.reset}`);
      console.log(`  Stress Level: ${colors.yellow}${(this.stressLevel * 100).toFixed(0)}%${colors.reset}\n`);
      
      console.log(`${colors.bold}RIA Metrics:${colors.reset}`);
      console.log(`  FI (Fracture Index): ${fiBar} ${colors.yellow}${fi.toFixed(3)}${colors.reset}`);
      console.log(`  UI Gamma (Opacity): ${gammaBar} ${colors.yellow}${(ui_update.gamma * 100).toFixed(0)}%${colors.reset}`);
      console.log(`  NCB Estimate: ${ncbBar} ${colors.yellow}${ncb_estimate.toFixed(1)}%${colors.reset}\n`);
      
      console.log(`${colors.bold}Session Metrics:${colors.reset}`);
      console.log(`  Fractures: ${colors.red}${session_metrics.fractures}${colors.reset}`);
      console.log(`  Interventions: ${colors.blue}${session_metrics.interventions}${colors.reset}`);
      console.log(`  False Interventions: ${colors.yellow}${session_metrics.fir}${colors.reset}`);
      
      const firRate = session_metrics.interventions > 0 ? 
        (session_metrics.fir / session_metrics.interventions * 100).toFixed(1) : '0.0';
      console.log(`  FIR Rate: ${this.getFIRColor(firRate)}${firRate}%${colors.reset}\n`);
      
      if (ui_update.interveneType) {
        console.log(`${colors.bold}${colors.red}⚠️  INTERVENTION ACTIVE: ${ui_update.interveneType.toUpperCase()}${colors.reset}\n`);
      }
      
      console.log(`${colors.cyan}Press Ctrl+C to stop demo${colors.reset}`);
    }
  }

  createProgressBar(value, width) {
    const clampedValue = Math.max(0, Math.min(1, value));
    const filled = Math.round(clampedValue * width);
    const empty = Math.max(0, width - filled);
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    
    let color = colors.green;
    if (clampedValue > 0.8) color = colors.red;
    else if (clampedValue > 0.6) color = colors.yellow;
    
    return `${color}${bar}${colors.reset}`;
  }

  getAttentionColor() {
    switch (this.attentionState) {
      case 'focused': return colors.green;
      case 'distracted': return colors.yellow;
      case 'fractured': return colors.red;
      default: return colors.reset;
    }
  }

  getFIRColor(rate) {
    const numRate = parseFloat(rate);
    if (numRate <= 5) return colors.green;
    if (numRate <= 12) return colors.yellow;
    return colors.red;
  }

  async run() {
    console.log(`${colors.bold}${colors.cyan}Starting RIA v1 Prototype Demo...${colors.reset}\n`);
    
    const interval = 1000 / DEMO_CONFIG.frameRate;  // Frame interval in ms
    
    const frameLoop = setInterval(() => {
      // Generate synthetic data
      const phiProxy = this.generatePhiProxy();
      const hrv = this.generateMockHRV();
      
      // Process frame through RIA engine
      const result = this.engine.process_frame(phiProxy, hrv);
      
      // Simulate environmental changes
      this.simulateComplexityChanges();
      
      // Update display
      this.logMetrics(result);
      
      // Check for significant events
      if (result.ui_update.interveneType && this.frameCount % 20 !== 0) {
        this.logEvent(`${result.ui_update.interveneType} intervention (FI=${result.fi.toFixed(3)})`);
      }
      
      this.frameCount++;
      
      // End demo after specified duration
      if (this.frameCount >= this.maxFrames) {
        clearInterval(frameLoop);
        this.showFinalReport(result);
      }
    }, interval);
    
    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      clearInterval(frameLoop);
      console.log(`\n${colors.yellow}Demo stopped by user${colors.reset}`);
      this.showFinalReport(this.engine.get_state());
      process.exit(0);
    });
  }

  showFinalReport(finalState) {
    console.clear();
    console.log(`${colors.bold}${colors.magenta}🧠 RIA v1 Demo - Final Report${colors.reset}\n`);
    
    const sessionDuration = (Date.now() - this.startTime) / 1000;
    const state = typeof finalState.metrics !== 'undefined' ? finalState : { metrics: finalState.session_metrics };
    
    console.log(`${colors.bold}Session Summary:${colors.reset}`);
    console.log(`  Duration: ${colors.yellow}${sessionDuration.toFixed(1)}s${colors.reset}`);
    console.log(`  Total Frames: ${colors.yellow}${this.frameCount}${colors.reset}`);
    console.log(`  Average FPS: ${colors.yellow}${(this.frameCount / sessionDuration).toFixed(1)}${colors.reset}\n`);
    
    console.log(`${colors.bold}Performance Metrics:${colors.reset}`);
    console.log(`  Total Fractures: ${colors.red}${state.metrics?.fractures || 0}${colors.reset}`);
    console.log(`  Total Interventions: ${colors.blue}${state.metrics?.interventions || 0}${colors.reset}`);
    console.log(`  False Interventions: ${colors.yellow}${state.metrics?.fir || 0}${colors.reset}`);
    
    const fractures = state.metrics?.fractures || 0;
    const interventions = state.metrics?.interventions || 0;
    const fir = state.metrics?.fir || 0;
    
    const fractureRate = (fractures / this.frameCount * 100).toFixed(1);
    const interventionRate = (interventions / this.frameCount * 100).toFixed(1);
    const firRate = interventions > 0 ? (fir / interventions * 100).toFixed(1) : '0.0';
    
    console.log(`  Fracture Rate: ${colors.red}${fractureRate}%${colors.reset}`);
    console.log(`  Intervention Rate: ${colors.blue}${interventionRate}%${colors.reset}`);
    console.log(`  FIR Rate: ${this.getFIRColor(firRate)}${firRate}%${colors.reset}\n`);
    
    // Calculate estimated NCB
    const estimatedNCB = this.engine._est_ncb();
    console.log(`${colors.bold}Estimated Benefits:${colors.reset}`);
    console.log(`  Net Cognitive Benefit: ${colors.green}${estimatedNCB.toFixed(1)}%${colors.reset}`);
    
    if (estimatedNCB >= 15) {
      console.log(`  ${colors.green}✅ Target NCB achieved (≥15%)${colors.reset}`);
    } else if (estimatedNCB >= 10) {
      console.log(`  ${colors.yellow}⚠️  Moderate NCB achieved${colors.reset}`);
    } else {
      console.log(`  ${colors.red}❌ Low NCB - consider tuning${colors.reset}`);
    }
    
    console.log(`\n${colors.bold}Configuration Used:${colors.reset}`);
    console.log(`  Profile: ${colors.yellow}${DEMO_CONFIG.profileToTest}${colors.reset}`);
    console.log(`  Biometrics: ${colors.yellow}${DEMO_CONFIG.enableBiometrics ? 'Enabled' : 'Disabled'}${colors.reset}`);
    console.log(`  Mode: ${colors.yellow}champion${colors.reset}`);
    console.log(`  th1: ${colors.yellow}${this.engine.th1}${colors.reset}, th2: ${colors.yellow}${this.engine.th2.toFixed(2)}${colors.reset}`);
    
    console.log(`\n${colors.cyan}Demo completed successfully!${colors.reset}`);
    console.log(`${colors.cyan}For more information, see README.md and EXAMPLES.md${colors.reset}`);
  }
}

// Run demo if called directly
if (require.main === module) {
  const demo = new RIADemo();
  demo.run().catch(console.error);
}

module.exports = RIADemo;