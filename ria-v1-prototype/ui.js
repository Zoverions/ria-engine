/**
 * RIA v1 Prototype - UI Dashboard Controller
 * 
 * Handles dashboard interactions, real-time data visualization,
 * and communication with the Figma plugin backend.
 */

// UI State
let isActive = false;
let consentGiven = false;
let lastUpdate = null;
let cursorTrackingActive = false;

// Data for visualizations
let fiHistory = [];
let phiHistory = [];
let maxHistoryLength = 100;

/**
 * Initialize dashboard when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('RIA Dashboard initialized');
    
    // Start cursor tracking for phi proxy calculation
    startCursorTracking();
    
    // Initialize UI state
    updateStatusDisplay();
    addLog('Dashboard initialized', 'info');
});

/**
 * Consent Management
 */
function giveConsent() {
    consentGiven = true;
    document.getElementById('consentModal').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    
    // Notify plugin
    parent.postMessage({ 
        pluginMessage: { type: 'consent_given' } 
    }, '*');
    
    addLog('User consent given', 'info');
}

function denyConsent() {
    parent.postMessage({ 
        pluginMessage: { type: 'consent_denied' } 
    }, '*');
}

/**
 * Cursor Tracking for Phi Proxy
 */
function startCursorTracking() {
    let lastCursorUpdate = 0;
    const updateInterval = 50; // 20fps
    
    document.addEventListener('mousemove', (event) => {
        if (!isActive || !consentGiven) return;
        
        const now = Date.now();
        if (now - lastCursorUpdate < updateInterval) return;
        
        lastCursorUpdate = now;
        
        // Send cursor data to plugin
        parent.postMessage({ 
            pluginMessage: { 
                type: 'cursor_move',
                x: event.clientX,
                y: event.clientY,
                timestamp: now
            } 
        }, '*');
    });
    
    cursorTrackingActive = true;
    addLog('Cursor tracking started', 'info');
}

/**
 * Control Functions
 */
function toggleActive() {
    isActive = !isActive;
    
    parent.postMessage({ 
        pluginMessage: { 
            type: 'toggle_active', 
            active: isActive 
        } 
    }, '*');
    
    updateStatusDisplay();
    addLog(`RIA ${isActive ? 'activated' : 'deactivated'}`, isActive ? 'info' : 'warning');
}

function changeProfile() {
    const profile = document.getElementById('profileSelect').value;
    
    parent.postMessage({ 
        pluginMessage: { 
            type: 'change_profile', 
            profile: profile 
        } 
    }, '*');
    
    addLog(`Profile changed to: ${profile}`, 'info');
}

function changeMode() {
    const mode = document.getElementById('modeSelect').value;
    
    parent.postMessage({ 
        pluginMessage: { 
            type: 'change_mode', 
            mode: mode 
        } 
    }, '*');
    
    addLog(`Mode changed to: ${mode}`, 'info');
}

function resetSession() {
    parent.postMessage({ 
        pluginMessage: { type: 'reset_session' } 
    }, '*');
    
    // Reset local data
    fiHistory = [];
    phiHistory = [];
    
    // Reset UI displays
    updateMetricsDisplay({
        fi: 0,
        ui_update: { gamma: 1.0, interveneType: null, anchorPhase: 0 },
        ncb_estimate: 0,
        session_metrics: { fractures: 0, interventions: 0, fir: 0 }
    });
    
    addLog('Session reset', 'info');
}

function exportData() {
    parent.postMessage({ 
        pluginMessage: { type: 'export_data' } 
    }, '*');
    
    addLog('Export requested', 'info');
}

/**
 * UI Update Functions
 */
function updateStatusDisplay() {
    const indicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const toggleBtn = document.getElementById('toggleBtn');
    
    if (isActive) {
        indicator.className = 'status-indicator status-active';
        statusText.textContent = 'Active';
        toggleBtn.textContent = 'Deactivate RIA';
        toggleBtn.className = 'btn btn-primary';
    } else {
        indicator.className = 'status-indicator status-inactive';
        statusText.textContent = 'Inactive';
        toggleBtn.textContent = 'Activate RIA';
        toggleBtn.className = 'btn btn-secondary';
    }
}

function updateMetricsDisplay(data) {
    if (!data) return;
    
    // Update FI bar
    const fiPercent = Math.min(100, (data.fi / 2.0) * 100); // Scale to 0-2.0 range
    document.getElementById('fiFill').style.width = `${fiPercent}%`;
    
    // Update metric values
    const ncbElement = document.getElementById('ncbValue');
    const ncb = data.ncb_estimate || 0;
    ncbElement.textContent = `${ncb.toFixed(1)}%`;
    ncbElement.className = `metric-value ${getNCBClass(ncb)}`;
    
    const gammaElement = document.getElementById('gammaValue');
    const gamma = (data.ui_update?.gamma || 1.0) * 100;
    gammaElement.textContent = `${gamma.toFixed(0)}%`;
    gammaElement.className = `metric-value ${getGammaClass(gamma)}`;
    
    document.getElementById('interventionsValue').textContent = data.session_metrics?.interventions || 0;
    document.getElementById('fracturesValue').textContent = data.session_metrics?.fractures || 0;
    
    // FIR calculation and display
    const interventions = data.session_metrics?.interventions || 1;
    const fir = data.session_metrics?.fir || 0;
    const firRate = (fir / interventions) * 100;
    const firElement = document.getElementById('firValue');
    firElement.textContent = `${firRate.toFixed(1)}%`;
    firElement.className = `metric-value ${getFIRClass(firRate)}`;
    
    // Update gamma indicator
    const gammaIndicator = document.getElementById('gammaIndicator');
    gammaIndicator.textContent = `Opacity: ${gamma.toFixed(0)}%`;
    gammaIndicator.style.opacity = gamma / 100;
    
    // Update anchor phase visualization
    const anchorElement = document.getElementById('anchorPhase');
    const phase = data.ui_update?.anchorPhase || 0;
    const scale = 0.8 + 0.4 * Math.abs(phase);
    anchorElement.style.transform = `scale(${scale})`;
    anchorElement.style.opacity = 0.6 + 0.4 * Math.abs(phase);
    
    // Store for history
    fiHistory.push(data.fi);
    if (data.phi_proxy !== undefined) {
        phiHistory.push(data.phi_proxy);
    }
    
    // Trim history
    if (fiHistory.length > maxHistoryLength) {
        fiHistory.shift();
        phiHistory.shift();
    }
    
    // Log significant events
    if (data.ui_update?.interveneType) {
        const type = data.ui_update.interveneType;
        const message = `${type} intervention (FI=${data.fi.toFixed(3)}, γ=${gamma.toFixed(0)}%)`;
        addLog(message, type === 'aggressive' ? 'error' : 'warning');
    }
}

/**
 * Utility Functions for CSS Classes
 */
function getNCBClass(ncb) {
    if (ncb >= 15) return 'success';
    if (ncb >= 5) return 'warning';
    return 'danger';
}

function getGammaClass(gamma) {
    if (gamma >= 90) return 'success';
    if (gamma >= 70) return 'warning';
    return 'danger';
}

function getFIRClass(fir) {
    if (fir <= 5) return 'success';
    if (fir <= 12) return 'warning';
    return 'danger';
}

/**
 * Logging System
 */
function addLog(message, type = 'info') {
    const logsContainer = document.getElementById('logs');
    const timestamp = new Date().toLocaleTimeString();
    
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.innerHTML = `
        <span class="log-timestamp">[${timestamp}]</span>
        <span class="log-${type}">${message}</span>
    `;
    
    logsContainer.appendChild(logEntry);
    logsContainer.scrollTop = logsContainer.scrollHeight;
    
    // Limit log entries
    const entries = logsContainer.children;
    if (entries.length > 50) {
        logsContainer.removeChild(entries[0]);
    }
}

/**
 * Message Handler for Plugin Communication
 */
window.onmessage = (event) => {
    const message = event.data.pluginMessage;
    if (!message) return;
    
    switch (message.type) {
        case 'update':
            lastUpdate = message.data;
            updateMetricsDisplay(message.data);
            break;
            
        case 'export_ready':
            downloadData(message.data);
            addLog('Data exported successfully', 'info');
            break;
            
        default:
            console.log('Unknown message from plugin:', message);
    }
};

/**
 * Data Export Function
 */
function downloadData(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ria-session-${new Date().toISOString().slice(0, 19)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Keyboard Shortcuts
 */
document.addEventListener('keydown', (event) => {
    if (!consentGiven) return;
    
    // Space bar to toggle active state
    if (event.code === 'Space' && !event.target.matches('input, select, textarea')) {
        event.preventDefault();
        toggleActive();
    }
    
    // R key to reset session
    if (event.code === 'KeyR' && event.ctrlKey) {
        event.preventDefault();
        resetSession();
    }
    
    // E key to export data
    if (event.code === 'KeyE' && event.ctrlKey) {
        event.preventDefault();
        exportData();
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        giveConsent,
        denyConsent,
        toggleActive,
        changeProfile,
        changeMode,
        resetSession,
        exportData,
        updateMetricsDisplay,
        addLog
    };
}