// options.js - RIA Cognitive Web Enhancer Options/Settings Page
class RIAOptions {
  constructor() {
    this.settings = {
      // Core Settings
      enabled: true,
      autoStart: false,
      fiSensitivity: 1.0,
      updateFrequency: 2,
      
      // Enhancement Modules
      generativeInterventions: true,
      resonanceMode: true,
      antifragileMode: true,
      
      // Intervention Settings
      readingAssistance: true,
      focusNotifications: true,
      breakReminders: true,
      interventionFrequency: 'medium',
      
      // Privacy & Data
      dataCollection: false,
      localStorage: true,
      dataRetention: 30,
      
      // Advanced Settings
      debugMode: false,
      performanceMode: false,
      customCSS: ''
    };
    
    this.init();
  }
  
  async init() {
    await this.loadSettings();
    this.bindEvents();
    this.updateUI();
    this.setupEnhancementCards();
  }
  
  async loadSettings() {
    try {
      const stored = await chrome.storage.sync.get(this.settings);
      this.settings = { ...this.settings, ...stored };
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }
  
  async saveSettings() {
    try {
      await chrome.storage.sync.set(this.settings);
      
      // Notify background service of settings change
      chrome.runtime.sendMessage({
        action: 'updateSettings',
        settings: this.settings
      });
      
      this.showStatus('Settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showStatus('Error saving settings', 'error');
    }
  }
  
  bindEvents() {
    // Switch toggles
    document.querySelectorAll('.switch').forEach(switchEl => {
      switchEl.addEventListener('click', (e) => {
        const setting = e.currentTarget.dataset.setting;
        this.toggleSetting(setting);
      });
    });
    
    // Sliders
    document.querySelectorAll('.slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const setting = e.target.dataset.setting;
        const value = parseFloat(e.target.value);
        this.updateSetting(setting, value);
        this.updateSliderDisplay(slider, value);
      });
    });
    
    // Select dropdowns
    document.querySelectorAll('.select').forEach(select => {
      select.addEventListener('change', (e) => {
        const setting = e.target.dataset.setting;
        const value = e.target.value;
        this.updateSetting(setting, isNaN(value) ? value : parseInt(value));
      });
    });
    
    // Text inputs
    document.querySelectorAll('.input').forEach(input => {
      input.addEventListener('blur', (e) => {
        const setting = e.target.dataset.setting;
        const value = e.target.value;
        this.updateSetting(setting, value);
      });
    });
    
    // Enhancement cards
    document.querySelectorAll('.enhancement-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const enhancement = e.currentTarget.dataset.enhancement;
        this.toggleEnhancement(enhancement);
      });
    });
    
    // Action buttons
    document.getElementById('saveBtn').addEventListener('click', () => {
      this.saveSettings();
    });
    
    document.getElementById('resetBtn').addEventListener('click', () => {
      this.resetSettings();
    });
    
    document.getElementById('clearDataBtn').addEventListener('click', () => {
      this.clearData();
    });
  }
  
  setupEnhancementCards() {
    const enhancementMap = {
      'generative': 'generativeInterventions',
      'resonance': 'resonanceMode',
      'antifragile': 'antifragileMode'
    };
    
    document.querySelectorAll('.enhancement-card').forEach(card => {
      const enhancement = card.dataset.enhancement;
      const setting = enhancementMap[enhancement];
      
      if (setting && this.settings[setting]) {
        card.classList.add('enabled');
      } else {
        card.classList.remove('enabled');
      }
    });
  }
  
  toggleSetting(setting) {
    this.settings[setting] = !this.settings[setting];
    this.updateUI();
  }
  
  updateSetting(setting, value) {
    this.settings[setting] = value;
  }
  
  toggleEnhancement(enhancement) {
    const enhancementMap = {
      'generative': 'generativeInterventions',
      'resonance': 'resonanceMode',
      'antifragile': 'antifragileMode'
    };
    
    const setting = enhancementMap[enhancement];
    if (setting) {
      this.toggleSetting(setting);
      this.setupEnhancementCards();
    }
  }
  
  updateUI() {
    // Update switches
    document.querySelectorAll('.switch').forEach(switchEl => {
      const setting = switchEl.dataset.setting;
      const isOn = this.settings[setting];
      
      switchEl.classList.toggle('on', isOn);
    });
    
    // Update sliders
    document.querySelectorAll('.slider').forEach(slider => {
      const setting = slider.dataset.setting;
      const value = this.settings[setting];
      
      slider.value = value;
      this.updateSliderDisplay(slider, value);
    });
    
    // Update selects
    document.querySelectorAll('.select').forEach(select => {
      const setting = select.dataset.setting;
      const value = this.settings[setting];
      
      select.value = value;
    });
    
    // Update inputs
    document.querySelectorAll('.input').forEach(input => {
      const setting = input.dataset.setting;
      const value = this.settings[setting];
      
      input.value = value;
    });
  }
  
  updateSliderDisplay(slider, value) {
    const valueDisplay = slider.parentNode.querySelector('.slider-value');
    if (valueDisplay) {
      valueDisplay.textContent = value.toFixed(1);
    }
  }
  
  async resetSettings() {
    if (confirm('Reset all settings to defaults? This cannot be undone.')) {
      // Reset to default values
      const defaults = {
        enabled: true,
        autoStart: false,
        fiSensitivity: 1.0,
        updateFrequency: 2,
        generativeInterventions: true,
        resonanceMode: true,
        antifragileMode: true,
        readingAssistance: true,
        focusNotifications: true,
        breakReminders: true,
        interventionFrequency: 'medium',
        dataCollection: false,
        localStorage: true,
        dataRetention: 30,
        debugMode: false,
        performanceMode: false,
        customCSS: ''
      };
      
      this.settings = defaults;
      await this.saveSettings();
      this.updateUI();
      this.setupEnhancementCards();
      
      this.showStatus('Settings reset to defaults', 'success');
    }
  }
  
  async clearData() {
    if (confirm('Clear all stored cognitive pattern data? This cannot be undone.')) {
      try {
        // Clear all stored data except settings
        await chrome.storage.local.clear();
        
        // Notify background service
        chrome.runtime.sendMessage({
          action: 'clearData'
        });
        
        this.showStatus('All data cleared successfully', 'success');
      } catch (error) {
        console.error('Error clearing data:', error);
        this.showStatus('Error clearing data', 'error');
      }
    }
  }
  
  showStatus(message, type = 'success') {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusDot = statusIndicator.querySelector('.status-dot');
    
    // Update status indicator
    statusIndicator.className = `status-indicator ${type}`;
    statusDot.className = `status-dot ${type}`;
    statusIndicator.textContent = message;
    
    // Reset after 3 seconds
    setTimeout(() => {
      statusIndicator.className = 'status-indicator success';
      statusDot.className = 'status-dot success';
      statusIndicator.innerHTML = '<div class="status-dot success"></div>Settings Synchronized';
    }, 3000);
  }
  
  // Export settings for backup
  exportSettings() {
    const dataStr = JSON.stringify(this.settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ria-settings-backup.json';
    link.click();
    
    URL.revokeObjectURL(url);
  }
  
  // Import settings from backup
  async importSettings(file) {
    try {
      const text = await file.text();
      const importedSettings = JSON.parse(text);
      
      // Validate settings structure
      if (this.validateSettings(importedSettings)) {
        this.settings = { ...this.settings, ...importedSettings };
        await this.saveSettings();
        this.updateUI();
        this.setupEnhancementCards();
        
        this.showStatus('Settings imported successfully', 'success');
      } else {
        this.showStatus('Invalid settings file format', 'error');
      }
    } catch (error) {
      console.error('Error importing settings:', error);
      this.showStatus('Error importing settings', 'error');
    }
  }
  
  validateSettings(settings) {
    // Basic validation of settings structure
    const requiredKeys = ['enabled', 'fiSensitivity', 'updateFrequency'];
    return requiredKeys.every(key => key in settings);
  }
}

// Animation utilities for smooth interactions
class OptionsAnimations {
  static highlightSection(element) {
    element.style.transition = 'background-color 0.3s ease';
    element.style.backgroundColor = '#f0f9ff';
    
    setTimeout(() => {
      element.style.backgroundColor = '';
    }, 1000);
  }
  
  static pulseButton(button) {
    button.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
      button.style.transform = 'scale(1)';
    }, 150);
  }
  
  static slideInCard(card) {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      card.style.transition = 'all 0.4s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, 100);
  }
}

// Keyboard shortcuts and accessibility
function setupAccessibility() {
  // Add keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.target.classList.contains('switch') || 
          e.target.classList.contains('enhancement-card')) {
        e.target.click();
        e.preventDefault();
      }
    }
    
    // Ctrl+S to save
    if (e.ctrlKey && e.key === 's') {
      document.getElementById('saveBtn').click();
      e.preventDefault();
    }
    
    // Ctrl+R to reset
    if (e.ctrlKey && e.key === 'r') {
      document.getElementById('resetBtn').click();
      e.preventDefault();
    }
  });
  
  // Add focus styles for keyboard navigation
  const style = document.createElement('style');
  style.textContent = `
    .switch:focus,
    .enhancement-card:focus,
    .btn:focus {
      outline: 2px solid #4f46e5;
      outline-offset: 2px;
    }
  `;
  document.head.appendChild(style);
}

// Search functionality for settings
function setupSearch() {
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search settings...';
  searchInput.className = 'input';
  searchInput.style.marginBottom = '20px';
  
  const container = document.querySelector('.container');
  container.insertBefore(searchInput, container.children[1]);
  
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const sections = document.querySelectorAll('.settings-section');
    
    sections.forEach(section => {
      const items = section.querySelectorAll('.setting-item');
      let hasVisibleItems = false;
      
      items.forEach(item => {
        const label = item.querySelector('.setting-label').textContent.toLowerCase();
        const description = item.querySelector('.setting-description').textContent.toLowerCase();
        const matches = label.includes(query) || description.includes(query);
        
        item.style.display = matches ? 'flex' : 'none';
        if (matches) hasVisibleItems = true;
      });
      
      section.style.display = hasVisibleItems || !query ? 'block' : 'none';
    });
  });
}

// Initialize options page
document.addEventListener('DOMContentLoaded', () => {
  window.riaOptions = new RIAOptions();
  setupAccessibility();
  setupSearch();
  
  // Add smooth animations for cards
  document.querySelectorAll('.enhancement-card').forEach((card, index) => {
    setTimeout(() => {
      OptionsAnimations.slideInCard(card);
    }, index * 100);
  });
  
  // Add hover effects
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mousedown', () => {
      OptionsAnimations.pulseButton(btn);
    });
  });
  
  // Add section highlighting on focus
  document.querySelectorAll('.setting-item').forEach(item => {
    item.addEventListener('click', () => {
      OptionsAnimations.highlightSection(item);
    });
  });
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RIAOptions, OptionsAnimations };
}