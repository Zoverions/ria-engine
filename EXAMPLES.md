# RIA v1 Prototype - Usage Examples

## Example 1: Basic Figma Plugin Usage

### Setup and Initialization

```javascript
// Basic setup in Figma plugin environment
const ria = new RIAEngine('average', true, 'champion');

// Handle cursor movement for phi proxy generation
figma.ui.onmessage = msg => {
  if (msg.type === 'cursor_move') {
    const entropy = calculatePhiProxy(msg.x, msg.y);
    const result = ria.process_frame(entropy, Math.random());
    
    // Apply UI deltas to selected elements
    figma.currentPage.selection.forEach(node => {
      if (result.ui_update.gamma < 1.0) {
        node.opacity *= result.ui_update.gamma;
      }
    });
  }
};
```

### Real-Time Monitoring

```javascript
// Monitor FI and trigger alerts
function monitorSession(ria) {
  setInterval(() => {
    const state = ria.get_state();
    
    if (state.metrics.fir > 12) {
      console.warn('High false intervention rate detected - consider tuning');
    }
    
    if (state.last_fi > ria.th2) {
      console.log('Attention fracture detected - applying aggressive intervention');
    }
  }, 1000);
}
```

## Example 2: SwiftUI Integration

### Basic View Modifier Application

```swift
import SwiftUI

struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .riaOverlay()  // Enable RIA for entire app
        }
    }
}

struct ContentView: View {
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("RIA-Enhanced Interface")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                ScrollView {
                    LazyVStack(spacing: 16) {
                        ForEach(0..<50) { index in
                            CardView(title: "Item \(index)")
                        }
                    }
                    .padding()
                }
            }
        }
    }
}

struct CardView: View {
    let title: String
    
    var body: some View {
        HStack {
            RoundedRectangle(cornerRadius: 8)
                .fill(.blue)
                .frame(width: 50, height: 50)
            
            VStack(alignment: .leading) {
                Text(title)
                    .font(.headline)
                Text("Sample content that may cause cognitive load")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
        .padding()
        .background(.background, in: RoundedRectangle(cornerRadius: 12))
    }
}
```

### Custom RIA Configuration

```swift
struct CustomRIAView: View {
    @StateObject private var riaEngine = RIAEngine(
        profile: .neurodiverse,
        biometricMode: true,
        mode: .champion
    )
    
    var body: some View {
        VStack {
            // Your content here
            ComplexContentView()
        }
        .opacity(riaEngine.uiState.gamma)
        .overlay(
            // Custom coherence anchor
            Circle()
                .fill(.purple.opacity(0.6))
                .frame(width: 40, height: 40)
                .scaleEffect(1.0 + 0.3 * abs(riaEngine.uiState.anchorPhase))
                .position(x: 100, y: 100)
                .opacity(riaEngine.isActive ? 1 : 0)
        )
        .onAppear {
            riaEngine.startMockDataGeneration()
        }
        .onDisappear {
            riaEngine.stopMockDataGeneration()
        }
    }
}
```

## Example 3: Advanced Configuration and Tuning

### Profile-Based Initialization

```javascript
// Detect user behavior patterns and select appropriate profile
function detectUserProfile(interactionHistory) {
  const avgInteractionSpeed = calculateAverageSpeed(interactionHistory);
  const errorRate = calculateErrorRate(interactionHistory);
  
  if (avgInteractionSpeed > 2.0) {
    return 'fast_typist';
  } else if (errorRate > 0.15) {
    return 'neurodiverse';
  } else {
    return 'average';
  }
}

// Initialize with detected profile
const profile = detectUserProfile(userHistory);
const ria = new RIAEngine(profile, true, 'champion');
```

### Dynamic Threshold Adjustment

```javascript
// Adaptive threshold tuning based on session performance
function adaptiveThresholds(ria) {
  const state = ria.get_state();
  const firRate = state.metrics.fir / Math.max(state.metrics.interventions, 1);
  
  // If too many false interventions, increase thresholds
  if (firRate > 0.12) {
    ria.th1 = Math.min(ria.th1 * 1.1, 1.0);
    ria.th2 = Math.min(ria.th2 * 1.1, 1.5);
    console.log(`Adjusted thresholds: th1=${ria.th1.toFixed(2)}, th2=${ria.th2.toFixed(2)}`);
  }
  
  // If too few interventions but high fractures, decrease thresholds
  const fractureRate = state.metrics.fractures / ria.frameCount;
  if (firRate < 0.05 && fractureRate > 0.3) {
    ria.th1 = Math.max(ria.th1 * 0.95, 0.5);
    ria.th2 = Math.max(ria.th2 * 0.95, 0.8);
    console.log(`Lowered thresholds: th1=${ria.th1.toFixed(2)}, th2=${ria.th2.toFixed(2)}`);
  }
}
```

## Example 4: Biometric Integration

### HRV Sensor Integration (Pseudo-code)

```javascript
// Simulated HRV sensor integration
class HRVSensor {
  constructor() {
    this.currentHRV = 0.7;  // Baseline
    this.rrIntervals = [];
  }
  
  // Simulate real HRV calculation from R-R intervals
  calculateHRV() {
    // In real implementation, this would connect to actual sensor
    // e.g., Polar H10, Apple Watch, etc.
    const rmssd = this.calculateRMSSD(this.rrIntervals);
    return Math.max(0, Math.min(1, rmssd / 50));  // Normalize to 0-1
  }
  
  calculateRMSSD(intervals) {
    if (intervals.length < 2) return 30;  // Default
    
    let sumSquaredDiffs = 0;
    for (let i = 1; i < intervals.length; i++) {
      const diff = intervals[i] - intervals[i-1];
      sumSquaredDiffs += diff * diff;
    }
    
    return Math.sqrt(sumSquaredDiffs / (intervals.length - 1));
  }
}

// Integration with RIA
const hrvSensor = new HRVSensor();
const ria = new RIAEngine('average', true, 'champion');

setInterval(() => {
  const hrv = hrvSensor.calculateHRV();
  const phiProxy = calculateCurrentPhiProxy();
  const result = ria.process_frame(phiProxy, hrv);
  
  // Apply UI modifications based on biometric-enhanced FI
  applyUIModifications(result);
}, 50);  // 20fps
```

## Example 5: Data Collection and Analysis

### Session Data Export

```javascript
// Comprehensive session data collection
function exportSessionData(ria) {
  const state = ria.get_state();
  const sessionDuration = (Date.now() - state.metrics.startTime) / 1000;
  
  const sessionData = {
    timestamp: new Date().toISOString(),
    profile: state.profile,
    mode: state.mode,
    session_duration_seconds: sessionDuration,
    total_frames: ria.frameCount,
    
    // Performance metrics
    fracture_count: state.metrics.fractures,
    intervention_count: state.metrics.interventions,
    false_intervention_count: state.metrics.fir,
    
    // Calculated rates
    fracture_rate: state.metrics.fractures / ria.frameCount,
    intervention_rate: state.metrics.interventions / ria.frameCount,
    fir_rate: state.metrics.fir / Math.max(state.metrics.interventions, 1),
    
    // Final states
    final_gamma: state.ui_state.gamma,
    final_ncb_estimate: state.ncb_estimate,
    
    // Configuration
    hyperparameters: {
      th1: state.thresholds.th1,
      th2: state.thresholds.th2,
      aggr: state.damping.aggr,
      gentle: state.damping.gentle,
      fi_weights: state.weights
    }
  };
  
  // Save to file or send to analytics
  downloadJSON(sessionData, `ria-session-${Date.now()}.json`);
  
  return sessionData;
}

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { 
    type: 'application/json' 
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

### Statistical Analysis

```javascript
// Analyze multiple session files for research
function analyzeSessionBatch(sessionFiles) {
  const analysis = {
    total_sessions: sessionFiles.length,
    avg_session_duration: 0,
    avg_ncb: 0,
    avg_fir_rate: 0,
    profile_breakdown: {},
    mode_effectiveness: {}
  };
  
  sessionFiles.forEach(session => {
    analysis.avg_session_duration += session.session_duration_seconds;
    analysis.avg_ncb += session.final_ncb_estimate;
    analysis.avg_fir_rate += session.fir_rate;
    
    // Profile breakdown
    if (!analysis.profile_breakdown[session.profile]) {
      analysis.profile_breakdown[session.profile] = {
        count: 0,
        avg_ncb: 0,
        avg_fir: 0
      };
    }
    
    const profile = analysis.profile_breakdown[session.profile];
    profile.count++;
    profile.avg_ncb += session.final_ncb_estimate;
    profile.avg_fir += session.fir_rate;
  });
  
  // Calculate averages
  analysis.avg_session_duration /= analysis.total_sessions;
  analysis.avg_ncb /= analysis.total_sessions;
  analysis.avg_fir_rate /= analysis.total_sessions;
  
  // Finalize profile breakdowns
  Object.keys(analysis.profile_breakdown).forEach(profile => {
    const data = analysis.profile_breakdown[profile];
    data.avg_ncb /= data.count;
    data.avg_fir /= data.count;
  });
  
  console.log('Session Analysis:', analysis);
  return analysis;
}
```

## Example 6: Custom UI Interventions

### Advanced UI Manipulation

```javascript
// Custom intervention strategies beyond simple opacity
function applyAdvancedInterventions(result, elements) {
  const { gamma, interveneType } = result.ui_update;
  
  elements.forEach(element => {
    switch (interveneType) {
      case 'gentle':
        // Subtle blur and slight opacity reduction
        element.style.filter = `blur(${(1-gamma) * 2}px)`;
        element.style.opacity = gamma;
        break;
        
      case 'aggressive':
        // More dramatic effects
        element.style.filter = `blur(${(1-gamma) * 5}px) grayscale(${(1-gamma) * 0.5})`;
        element.style.opacity = gamma;
        element.style.transform = `scale(${0.9 + gamma * 0.1})`;
        break;
        
      default:
        // Recovery phase - gradually restore
        element.style.filter = '';
        element.style.transform = '';
        element.style.opacity = Math.min(1, parseFloat(element.style.opacity || 1) * 1.01);
    }
  });
}
```

### Contextual Interventions

```javascript
// Apply different interventions based on UI element type
function contextualInterventions(result, context) {
  const { gamma, interveneType } = result.ui_update;
  
  if (context.type === 'text') {
    // For text: adjust line spacing and letter spacing
    context.element.style.lineHeight = `${1.2 + (1-gamma) * 0.3}em`;
    context.element.style.letterSpacing = `${(1-gamma) * 2}px`;
  } else if (context.type === 'interactive') {
    // For buttons/links: reduce visual complexity
    context.element.style.boxShadow = `0 0 ${gamma * 10}px rgba(0,0,0,0.1)`;
    context.element.style.borderRadius = `${gamma * 8}px`;
  } else if (context.type === 'media') {
    // For images/videos: apply blur and desaturation
    context.element.style.filter = `blur(${(1-gamma) * 3}px) saturate(${gamma})`;
  }
}
```

## Example 7: Performance Optimization

### Optimized Frame Processing

```javascript
// Throttled processing for better performance
class OptimizedRIA extends RIAEngine {
  constructor(...args) {
    super(...args);
    this.lastProcessTime = 0;
    this.processingInterval = 50;  // 20fps max
    this.pendingFrame = null;
  }
  
  process_frame_throttled(phiProxy, hrv = null) {
    const now = Date.now();
    
    // Store the latest frame data
    this.pendingFrame = { phiProxy, hrv, timestamp: now };
    
    // Only process if enough time has passed
    if (now - this.lastProcessTime >= this.processingInterval) {
      const result = this.process_frame(
        this.pendingFrame.phiProxy, 
        this.pendingFrame.hrv
      );
      this.lastProcessTime = now;
      this.pendingFrame = null;
      return result;
    }
    
    return null;  // Skip this frame
  }
}
```

### Memory-Efficient History Management

```javascript
// Circular buffer for efficient memory usage
class CircularBuffer {
  constructor(maxSize) {
    this.buffer = new Array(maxSize);
    this.size = 0;
    this.head = 0;
    this.maxSize = maxSize;
  }
  
  push(item) {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.maxSize;
    if (this.size < this.maxSize) {
      this.size++;
    }
  }
  
  toArray() {
    if (this.size < this.maxSize) {
      return this.buffer.slice(0, this.size);
    }
    
    return [
      ...this.buffer.slice(this.head),
      ...this.buffer.slice(0, this.head)
    ];
  }
  
  get length() {
    return this.size;
  }
}

// Usage in RIA engine
class MemoryOptimizedRIA extends RIAEngine {
  constructor(...args) {
    super(...args);
    this.phiHistory = new CircularBuffer(100);
  }
  
  process_frame(phiProxy, hrv = null) {
    this.frameCount++;
    this.phiHistory.push(phiProxy);
    
    // Convert to array for computation
    const historyArray = this.phiHistory.toArray();
    const fi = this.compute_fi(historyArray, hrv);
    
    // ... rest of processing
  }
}
```

These examples demonstrate the flexibility and power of the RIA v1 prototype across different platforms and use cases. The system is designed to be modular and extensible, allowing for custom implementations while maintaining the core cognitive load reduction functionality.