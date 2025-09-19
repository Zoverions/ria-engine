/**
 * RIA v1 Prototype - SwiftUI Overlay
 * 
 * macOS SwiftUI implementation of the Resonant Interface Architecture
 * Provides system-wide cognitive load reduction through view modifiers
 * 
 * Usage: Apply .riaOverlay() modifier to any SwiftUI view
 * 
 * @author Zoverions Grand Unified Model ZGUM v16.2
 * @version 1.0
 * @date September 19, 2025
 */

import SwiftUI
import Combine
import Foundation

// MARK: - Data Models

struct RIAProfile {
    let omega: Double
    let dBase: Double
    
    static let average = RIAProfile(omega: 1.0, dBase: 0.08)
    static let fastTypist = RIAProfile(omega: 1.2, dBase: 0.05)
    static let neurodiverse = RIAProfile(omega: 0.8, dBase: 0.12)
}

enum RIAMode: String, CaseIterable {
    case off = "off"
    case untuned = "untuned"
    case champion = "champion"
    
    var displayName: String {
        switch self {
        case .off: return "Disabled"
        case .untuned: return "Untuned Baseline"
        case .champion: return "Champion (Tuned)"
        }
    }
}

struct UIState {
    var gamma: Double = 1.0
    var interveneType: String? = nil
    var anchorPhase: Double = 0.0
}

struct SessionMetrics {
    var fractures: Int = 0
    var interventions: Int = 0
    var fir: Int = 0
    var startTime: Date = Date()
}

// MARK: - RIA Engine (Swift Port)

@MainActor
class RIAEngine: ObservableObject {
    // Configuration
    let profile: RIAProfile
    let omega: Double
    let dBase: Double
    let th1: Double = 0.7
    let th2: Double
    let aggr: Double = 0.4
    let gentle: Double = 0.85
    
    // FI Weights
    let fiWeights: (w1: Double, w2: Double, w3: Double)
    
    // State
    @Published var mode: RIAMode = .champion
    @Published var biometricMode: Bool = true
    @Published var uiState = UIState()
    @Published var sessionMetrics = SessionMetrics()
    @Published var isActive: Bool = false
    
    // Internal
    private var phiHistory: [Double] = []
    private var frameCount: Int = 0
    private var lastFI: Double = 0.0
    private let maxHistoryLength = 100
    
    // Timer for mock data
    private var timer: Timer?
    
    init(profile: RIAProfile = .average, biometricMode: Bool = true, mode: RIAMode = .champion) {
        self.profile = profile
        self.omega = profile.omega
        self.dBase = profile.dBase
        self.th2 = 1.1 + 0.1 * (profile.dBase / profile.omega)
        self.biometricMode = biometricMode
        self.mode = mode
        
        // Calculate FI weights
        self.fiWeights = (
            w1: 1.0,  // Δα
            w2: 1.0,  // AC₁
            w3: 0.5 + (profile.dBase > 0.1 ? 0.3 : 0.0)  // Skew, neuro boost
        )
        
        resetSession()
    }
    
    // MARK: - Math Helper Functions
    
    private func standardize(_ window: [Double]) -> [Double] {
        guard !window.isEmpty else { return window }
        
        let mean = window.reduce(0, +) / Double(window.count)
        let variance = window.reduce(0) { $0 + pow($1 - mean, 2) } / Double(window.count)
        let std = max(sqrt(variance), 1e-8)
        
        return window.map { ($0 - mean) / std }
    }
    
    private func mean(_ array: [Double]) -> Double {
        guard !array.isEmpty else { return 0 }
        return array.reduce(0, +) / Double(array.count)
    }
    
    private func dft(_ signal: [Double]) -> [Double] {
        let n = signal.count
        var real = Array(repeating: 0.0, count: n)
        
        for k in 0..<n {
            for j in 0..<n {
                real[k] += signal[j] * cos(2 * .pi * Double(k * j) / Double(n))
            }
        }
        
        return real
    }
    
    private func leastSquares(_ A: [[Double]], _ b: [Double]) -> (slope: Double, intercept: Double) {
        let n = Double(A.count)
        guard n > 0 else { return (0, 0) }
        
        let sumX = A.reduce(0) { $0 + $1[0] }
        let sumY = b.reduce(0, +)
        let sumXY = zip(A, b).reduce(0) { $0 + $1.0[0] * $1.1 }
        let sumXX = A.reduce(0) { $0 + pow($1[0], 2) }
        
        let denom = n * sumXX - pow(sumX, 2)
        guard abs(denom) >= 1e-8 else { return (0, 0) }
        
        let slope = (n * sumXY - sumX * sumY) / denom
        let intercept = (sumY - slope * sumX) / n
        
        return (slope, intercept)
    }
    
    private func spectralSlope(_ window: [Double], fs: Double = 20) -> Double {
        guard window.count >= 16 else { return 0 }
        
        let n = window.count
        let fft = dft(window)
        let psd = fft.map { pow($0, 2) / Double(n) }
        
        // Filter mid-band frequencies
        var validFreqs: [Double] = []
        var validPSD: [Double] = []
        
        for i in 1..<(n/2) {
            let freq = Double(i) * fs / Double(n)
            if freq > 0.1 && freq < fs/4 {
                validFreqs.append(freq)
                validPSD.append(psd[i])
            }
        }
        
        guard validFreqs.count >= 4 else { return 0 }
        
        let logf = validFreqs.map { log($0) }
        let logp = validPSD.map { log(max($0, 1e-12)) }
        let A = logf.map { [$0, 1.0] }
        
        return leastSquares(A, logp).slope
    }
    
    private func spectralSlopeDelta(_ currWindow: [Double], _ prevWindow: [Double]) -> Double {
        let slopeCurr = spectralSlope(currWindow)
        let slopePrev = spectralSlope(prevWindow)
        return slopeCurr - slopePrev
    }
    
    private func lag1AC(_ window: [Double]) -> Double {
        guard window.count >= 2 else { return 0 }
        
        let meanVal = mean(window)
        var num = 0.0
        var den = 0.0
        
        for i in 0..<(window.count - 1) {
            num += (window[i] - meanVal) * (window[i + 1] - meanVal)
        }
        
        for value in window {
            den += pow(value - meanVal, 2)
        }
        
        return den == 0 ? 0 : num / den
    }
    
    private func skewness(_ window: [Double]) -> Double {
        guard window.count >= 3 else { return 0 }
        
        let meanVal = mean(window)
        let n = Double(window.count)
        
        let m3 = window.reduce(0) { $0 + pow($1 - meanVal, 3) } / n
        let m2 = window.reduce(0) { $0 + pow($1 - meanVal, 2) } / n
        
        guard m2 > 0 else { return 0 }
        return m3 / pow(m2, 1.5)
    }
    
    private func quantile(_ array: [Double], _ q: Double) -> Double {
        guard !array.isEmpty else { return 0 }
        let sorted = array.sorted()
        let index = Int(q * Double(sorted.count - 1))
        return sorted[index]
    }
    
    // MARK: - Core RIA Functions
    
    private func computeFI(_ phiHistory: [Double], hrvNorm: Double? = nil) -> Double {
        let wSteps = 50
        guard phiHistory.count >= wSteps else { return 0 }
        
        let windowZ = standardize(Array(phiHistory.suffix(wSteps)))
        let prevWindow: [Double]
        
        if phiHistory.count >= 2 * wSteps {
            let start = phiHistory.count - 2 * wSteps
            let end = phiHistory.count - wSteps
            prevWindow = standardize(Array(phiHistory[start..<end]))
        } else {
            prevWindow = windowZ
        }
        
        let deltaAlpha = spectralSlopeDelta(windowZ, prevWindow)
        let ac1 = lag1AC(windowZ)
        let sk = abs(skewness(windowZ))
        
        var fi = fiWeights.w1 * (-deltaAlpha) +
                fiWeights.w2 * ac1 +
                fiWeights.w3 * sk
        
        if biometricMode, let hrv = hrvNorm {
            fi *= (1 - 0.2 * (1 - hrv))
        }
        
        return max(0, fi)
    }
    
    private func updateUI(_ fi: Double) {
        guard mode != .off else { return }
        
        uiState.interveneType = nil
        
        if fi >= th2 {
            let factor = mode == .untuned ? 0.6 : aggr
            uiState.gamma *= factor
            uiState.interveneType = "aggressive"
            sessionMetrics.interventions += 1
        } else if fi >= th1 {
            let factor = mode == .untuned ? 0.7 : gentle
            uiState.gamma *= factor
            uiState.interveneType = "gentle"
            sessionMetrics.interventions += 1
        }
        
        // Coherence anchor
        let recentPhi = Array(phiHistory.suffix(10))
        if !recentPhi.isEmpty {
            let meanPhi = mean(recentPhi)
            uiState.anchorPhase = sin(2 * .pi * omega * meanPhi)
        }
        
        // Gamma recovery
        if uiState.interveneType == nil && uiState.gamma < 1.0 {
            uiState.gamma = min(1.0, uiState.gamma * 1.001)
        }
        
        // Clamp gamma
        uiState.gamma = max(0.1, min(1.0, uiState.gamma))
    }
    
    func processFrame(phiProxy: Double, hrv: Double? = nil) -> (fi: Double, ncb: Double) {
        frameCount += 1
        
        phiHistory.append(phiProxy)
        if phiHistory.count > maxHistoryLength {
            phiHistory.removeFirst()
        }
        
        let fi = computeFI(phiHistory, hrvNorm: hrv)
        lastFI = fi
        
        updateUI(fi)
        
        // FIR detection
        if uiState.interveneType != nil && phiHistory.count > 10 {
            let phi75 = quantile(phiHistory, 0.75)
            if phiProxy > phi75 {
                sessionMetrics.fir += 1
            }
        }
        
        // Fracture logging
        if fi > th2 {
            sessionMetrics.fractures += 1
        }
        
        let ncb = estimateNCB()
        return (fi, ncb)
    }
    
    private func estimateNCB() -> Double {
        guard sessionMetrics.interventions > 0 else { return 0 }
        
        let firRate = Double(sessionMetrics.fir) / Double(sessionMetrics.interventions) * 100
        let mttrProxy = 5.7 * uiState.gamma
        let reduction = (5.7 - mttrProxy) / 5.7 * 100
        
        return max(0, reduction - 2 * firRate)
    }
    
    func resetSession() {
        phiHistory.removeAll()
        uiState = UIState()
        sessionMetrics = SessionMetrics()
        frameCount = 0
        lastFI = 0.0
    }
    
    // MARK: - Mock Data Generation
    
    func startMockDataGeneration() {
        timer = Timer.scheduledTimer(withTimeInterval: 0.05, repeats: true) { _ in
            let phi = Double.random(in: 0...1)
            let hrv = 0.6 + 0.3 * sin(Date().timeIntervalSince1970 / 10)
            _ = self.processFrame(phiProxy: phi, hrv: hrv)
        }
    }
    
    func stopMockDataGeneration() {
        timer?.invalidate()
        timer = nil
    }
}

// MARK: - SwiftUI View Modifier

struct RIAViewModifier: ViewModifier {
    @StateObject private var engine = RIAEngine()
    @State private var showDashboard = false
    
    func body(content: Content) -> some View {
        ZStack {
            content
                .opacity(engine.uiState.gamma)
                .overlay(
                    coherenceAnchor
                        .opacity(engine.isActive ? 1 : 0)
                        .animation(.easeInOut(duration: 0.3), value: engine.isActive)
                )
                .onAppear {
                    if engine.isActive {
                        engine.startMockDataGeneration()
                    }
                }
                .onChange(of: engine.isActive) { newValue in
                    if newValue {
                        engine.startMockDataGeneration()
                    } else {
                        engine.stopMockDataGeneration()
                        engine.resetSession()
                    }
                }
            
            // Dashboard overlay
            if showDashboard {
                RIADashboard(engine: engine, isPresented: $showDashboard)
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: NSApplication.willTerminateNotification)) { _ in
            engine.stopMockDataGeneration()
        }
        .keyboardShortcut("r", modifiers: [.command, .option])
    }
    
    private var coherenceAnchor: some View {
        Circle()
            .fill(
                RadialGradient(
                    colors: [.purple.opacity(0.8), .purple.opacity(0.3)],
                    center: .center,
                    startRadius: 5,
                    endRadius: 25
                )
            )
            .frame(width: 30 + 20 * abs(engine.uiState.anchorPhase),
                   height: 30 + 20 * abs(engine.uiState.anchorPhase))
            .opacity(0.3 + 0.7 * abs(engine.uiState.anchorPhase))
            .scaleEffect(0.8 + 0.4 * abs(engine.uiState.anchorPhase))
            .position(x: 100, y: 100)
            .animation(.easeInOut(duration: 0.1), value: engine.uiState.anchorPhase)
    }
}

// MARK: - Dashboard View

struct RIADashboard: View {
    @ObservedObject var engine: RIAEngine
    @Binding var isPresented: Bool
    
    var body: some View {
        VStack(spacing: 16) {
            // Header
            HStack {
                Text("RIA v1 Prototype")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Spacer()
                
                Button("×") {
                    isPresented = false
                }
                .font(.title)
                .foregroundColor(.secondary)
            }
            
            // Controls
            GroupBox("Controls") {
                VStack(spacing: 12) {
                    HStack {
                        Text("Status:")
                        Spacer()
                        Circle()
                            .fill(engine.isActive ? .green : .gray)
                            .frame(width: 12, height: 12)
                        Text(engine.isActive ? "Active" : "Inactive")
                    }
                    
                    Button(engine.isActive ? "Deactivate" : "Activate") {
                        engine.isActive.toggle()
                    }
                    .buttonStyle(.borderedProminent)
                    
                    Picker("Mode", selection: $engine.mode) {
                        ForEach(RIAMode.allCases, id: \.self) { mode in
                            Text(mode.displayName).tag(mode)
                        }
                    }
                    .pickerStyle(.segmented)
                }
                .padding(8)
            }
            
            // Metrics
            GroupBox("Metrics") {
                VStack(spacing: 8) {
                    MetricRow(label: "FI", value: String(format: "%.3f", engine.lastFI))
                    MetricRow(label: "Gamma", value: String(format: "%.0f%%", engine.uiState.gamma * 100))
                    MetricRow(label: "Interventions", value: "\(engine.sessionMetrics.interventions)")
                    MetricRow(label: "Fractures", value: "\(engine.sessionMetrics.fractures)")
                    MetricRow(label: "NCB", value: String(format: "%.1f%%", engine.estimateNCB()))
                }
                .padding(8)
            }
            
            // Actions
            HStack {
                Button("Reset") {
                    engine.resetSession()
                }
                
                Button("Export") {
                    exportData()
                }
            }
            
            Spacer()
        }
        .padding()
        .frame(width: 300, height: 400)
        .background(.ultraThinMaterial)
        .cornerRadius(12)
        .shadow(radius: 10)
    }
    
    private func exportData() {
        // Implementation for data export
        print("Export data functionality")
    }
}

struct MetricRow: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Text(label)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .fontWeight(.medium)
        }
    }
}

// MARK: - SwiftUI Extension

extension View {
    func riaOverlay() -> some View {
        self.modifier(RIAViewModifier())
    }
}

// MARK: - Preview

struct RIAOverlay_Previews: PreviewProvider {
    static var previews: some View {
        VStack {
            Text("Hello, RIA!")
                .font(.largeTitle)
                .padding()
            
            Rectangle()
                .fill(.blue)
                .frame(width: 200, height: 100)
        }
        .riaOverlay()
    }
}