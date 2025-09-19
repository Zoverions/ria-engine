// popup.js - RIA Cognitive Web Enhancer Popup Interface
class RIAPopup {
  constructor() {
    this.isActive = false;
    this.stats = {
      fi: 0.00,
      activeTabs: 0,
      interventions: 0,
      readingProgress: 0,
      focusTime: 0,
      distractionEvents: 0,
      sessionDuration: 0
    };
    
    this.settings = {
      generativeInterventions: true,
      readingAssistance: true,
      attentionTracking: true,
      focusMode: false
    };
    
    this.init();
  }
  
  async init() {
    await this.loadState();
    this.bindEvents();
    this.setupTabs();
    this.startPeriodicUpdates();
    this.updateUI();
  }
  
  async loadState() {
    try {
      // Get current state from background service
      const response = await chrome.runtime.sendMessage({
        action: 'getState'
      });
      
      if (response && response.success) {
        this.isActive = response.data.isActive || false;
        this.stats = { ...this.stats, ...response.data.stats };
      }
      
      // Load settings from storage
      const storage = await chrome.storage.sync.get(this.settings);
      this.settings = { ...this.settings, ...storage };
    } catch (error) {
      console.error('Error loading state:', error);
    }
  }
  
  bindEvents() {
    // Toggle activation
    const toggleBtn = document.getElementById('toggleBtn');
    toggleBtn.addEventListener('click', () => this.toggleActivation());
    
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        this.switchTab(tabName);
      });
    });
    
    // Settings switches
    document.querySelectorAll('.switch').forEach(switchEl => {
      switchEl.addEventListener('click', (e) => {
        const setting = e.currentTarget.dataset.setting;
        this.toggleSetting(setting);
      });
    });
  }
  
  setupTabs() {
    // Ensure insights tab is active by default
    this.switchTab('insights');
  }
  
  async toggleActivation() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: this.isActive ? 'stop' : 'start'
      });
      
      if (response && response.success) {
        this.isActive = !this.isActive;
        this.updateUI();
      }
    } catch (error) {
      console.error('Error toggling activation:', error);
    }
  }
  
  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === tabName);
    });
  }
  
  async toggleSetting(setting) {
    this.settings[setting] = !this.settings[setting];
    
    // Save to storage
    await chrome.storage.sync.set({ [setting]: this.settings[setting] });
    
    // Notify background service
    chrome.runtime.sendMessage({
      action: 'updateSettings',
      settings: this.settings
    });
    
    this.updateSettingsUI();
  }
  
  updateUI() {
    this.updateStatusUI();
    this.updateStatsUI();
    this.updateSettingsUI();
  }
  
  updateStatusUI() {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const toggleBtn = document.getElementById('toggleBtn');
    
    if (this.isActive) {
      statusDot.className = 'status-dot active';
      statusText.textContent = 'Active';
      toggleBtn.className = 'toggle-btn stop';
      toggleBtn.textContent = 'Stop';
    } else {
      statusDot.className = 'status-dot inactive';
      statusText.textContent = 'Inactive';
      toggleBtn.className = 'toggle-btn start';
      toggleBtn.textContent = 'Start';
    }
  }
  
  updateStatsUI() {
    // Fracture Index display
    document.getElementById('fiValue').textContent = this.stats.fi.toFixed(2);
    
    // Metrics
    document.getElementById('tabsValue').textContent = this.stats.activeTabs;
    document.getElementById('interventionsValue').textContent = this.stats.interventions;
    
    // Insights
    document.getElementById('readingProgress').textContent = `${this.stats.readingProgress}%`;
    document.getElementById('focusTime').textContent = `${this.stats.focusTime}m`;
    document.getElementById('distractionEvents').textContent = this.stats.distractionEvents;
    document.getElementById('sessionDuration').textContent = `${this.stats.sessionDuration}m`;
  }
  
  updateSettingsUI() {
    document.querySelectorAll('.switch').forEach(switchEl => {
      const setting = switchEl.dataset.setting;
      const isOn = this.settings[setting];
      
      switchEl.classList.toggle('on', isOn);
    });
  }
  
  async updateStats() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getStats'
      });
      
      if (response && response.success) {
        this.stats = { ...this.stats, ...response.data };
        this.updateStatsUI();
      }
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }
  
  startPeriodicUpdates() {
    // Update stats every 2 seconds
    setInterval(() => {
      if (this.isActive) {
        this.updateStats();
      }
    }, 2000);
    
    // Update session duration every minute
    setInterval(() => {
      if (this.isActive) {
        this.stats.sessionDuration = Math.floor(
          (Date.now() - this.sessionStartTime) / 60000
        );
        this.updateStatsUI();
      }
    }, 60000);
  }
  
  // Listen for messages from background service
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'statsUpdate') {
        this.stats = { ...this.stats, ...request.data };
        this.updateStatsUI();
      }
      
      if (request.action === 'statusUpdate') {
        this.isActive = request.data.isActive;
        this.updateStatusUI();
      }
    });
  }
}

// Animation utilities for smooth transitions
class PopupAnimations {
  static fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.display = 'block';
    
    const start = performance.now();
    
    function animate(currentTime) {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      
      element.style.opacity = progress;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }
    
    requestAnimationFrame(animate);
  }
  
  static slideIn(element, direction = 'down', duration = 300) {
    const distance = 20;
    const translateY = direction === 'down' ? -distance : distance;
    
    element.style.transform = `translateY(${translateY}px)`;
    element.style.opacity = '0';
    element.style.display = 'block';
    
    const start = performance.now();
    
    function animate(currentTime) {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentTranslateY = translateY * (1 - easeOut);
      element.style.transform = `translateY(${currentTranslateY}px)`;
      element.style.opacity = easeOut;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.style.transform = '';
      }
    }
    
    requestAnimationFrame(animate);
  }
  
  static pulseElement(element, color = '#4f46e5') {
    const originalBackground = element.style.backgroundColor;
    
    element.style.transition = 'background-color 0.3s ease';
    element.style.backgroundColor = color;
    
    setTimeout(() => {
      element.style.backgroundColor = originalBackground;
    }, 300);
  }
}

// Utility functions
function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes}m`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
}

function formatPercentage(value, decimals = 0) {
  return `${value.toFixed(decimals)}%`;
}

function formatNumber(value) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toString();
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.riaPopup = new RIAPopup();
  
  // Add keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.target.classList.contains('toggle-btn')) {
        e.target.click();
      }
    }
    
    if (e.key === 'Tab') {
      // Cycle through tabs with Tab key
      const currentTab = document.querySelector('.tab.active');
      const tabs = Array.from(document.querySelectorAll('.tab'));
      const currentIndex = tabs.indexOf(currentTab);
      const nextIndex = (currentIndex + 1) % tabs.length;
      
      tabs[nextIndex].click();
      e.preventDefault();
    }
  });
  
  // Add visual feedback for interactions
  document.querySelectorAll('.toggle-btn, .tab, .switch').forEach(element => {
    element.addEventListener('mouseenter', () => {
      element.style.transform = 'scale(1.02)';
    });
    
    element.addEventListener('mouseleave', () => {
      element.style.transform = 'scale(1)';
    });
    
    element.addEventListener('mousedown', () => {
      element.style.transform = 'scale(0.98)';
    });
    
    element.addEventListener('mouseup', () => {
      element.style.transform = 'scale(1.02)';
    });
  });
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RIAPopup, PopupAnimations };
}