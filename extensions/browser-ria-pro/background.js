/**
 * RIA Cognitive Web Enhancer - Background Script
 * 
 * Manages the browser extension lifecycle and coordinates between
 * content scripts and the popup interface.
 */

class RIABackgroundService {
  constructor() {
    this.isActive = false;
    this.tabStates = new Map();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Handle extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        this.initializeExtension();
      }
    });

    // Handle tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && this.isActive) {
        this.initializeTab(tabId, tab);
      }
    });

    // Handle tab activation
    chrome.tabs.onActivated.addListener((activeInfo) => {
      if (this.isActive) {
        this.handleTabSwitch(activeInfo.tabId);
      }
    });

    // Handle messages from content scripts and popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep channel open for async response
    });

    // Handle window focus changes
    chrome.windows.onFocusChanged.addListener((windowId) => {
      if (this.isActive) {
        this.handleWindowFocusChange(windowId);
      }
    });
  }

  async initializeExtension() {
    // Set default settings
    await chrome.storage.sync.set({
      enabled: true,
      sensitivityLevel: 'medium',
      generativeInterventions: true,
      readingAssistance: true,
      attentionTracking: true,
      interventionThreshold: 0.6
    });

    console.log('RIA Cognitive Web Enhancer initialized');
  }

  async initializeTab(tabId, tab) {
    if (!tab.url || tab.url.startsWith('chrome://')) return;

    // Initialize tab state
    this.tabStates.set(tabId, {
      url: tab.url,
      domain: new URL(tab.url).hostname,
      startTime: Date.now(),
      fi: 0,
      readingProgress: 0,
      scrollEvents: 0,
      focusTime: 0,
      lastActivity: Date.now()
    });

    // Inject RIA monitoring
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      });
    } catch (error) {
      console.error('Failed to inject content script:', error);
    }
  }

  handleTabSwitch(tabId) {
    // Update attention tracking
    const previousTab = this.getCurrentActiveTab();
    if (previousTab) {
      this.updateTabAttention(previousTab, false);
    }
    
    this.updateTabAttention(tabId, true);
  }

  handleWindowFocusChange(windowId) {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      // Browser lost focus
      this.handleBrowserFocusLoss();
    } else {
      // Browser gained focus
      this.handleBrowserFocusGain();
    }
  }

  async handleMessage(message, sender, sendResponse) {
    const { type, data } = message;

    switch (type) {
      case 'start-ria':
        await this.startRIA();
        sendResponse({ success: true });
        break;

      case 'stop-ria':
        await this.stopRIA();
        sendResponse({ success: true });
        break;

      case 'get-status':
        const status = await this.getStatus();
        sendResponse(status);
        break;

      case 'cognitive-data':
        await this.processCognitiveData(sender.tab.id, data);
        sendResponse({ received: true });
        break;

      case 'reading-progress':
        await this.updateReadingProgress(sender.tab.id, data);
        sendResponse({ received: true });
        break;

      case 'apply-intervention':
        await this.applyIntervention(sender.tab.id, data);
        sendResponse({ applied: true });
        break;

      case 'get-settings':
        const settings = await chrome.storage.sync.get();
        sendResponse(settings);
        break;

      case 'update-settings':
        await chrome.storage.sync.set(data);
        sendResponse({ updated: true });
        break;

      default:
        sendResponse({ error: 'Unknown message type' });
    }
  }

  async startRIA() {
    this.isActive = true;
    
    // Get all active tabs
    const tabs = await chrome.tabs.query({});
    
    for (const tab of tabs) {
      if (tab.url && !tab.url.startsWith('chrome://')) {
        await this.initializeTab(tab.id, tab);
      }
    }

    // Update badge
    chrome.action.setBadgeText({ text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });

    console.log('RIA monitoring started');
  }

  async stopRIA() {
    this.isActive = false;
    this.tabStates.clear();

    // Update badge
    chrome.action.setBadgeText({ text: '' });

    console.log('RIA monitoring stopped');
  }

  async processCognitiveData(tabId, data) {
    const tabState = this.tabStates.get(tabId);
    if (!tabState) return;

    // Update tab state with cognitive metrics
    tabState.fi = data.fi || 0;
    tabState.lastActivity = Date.now();
    tabState.scrollEvents += data.scrollEvents || 0;

    // Generate interventions if needed
    if (data.fi > 0.6) {
      await this.generateInterventions(tabId, data);
    }

    // Update badge with FI level
    const badgeColor = this.getFIColor(data.fi);
    chrome.action.setBadgeBackgroundColor({ color: badgeColor });
  }

  async updateReadingProgress(tabId, data) {
    const tabState = this.tabStates.get(tabId);
    if (!tabState) return;

    tabState.readingProgress = data.progress;
    tabState.readingTime = data.readingTime;
  }

  async generateInterventions(tabId, cognitiveData) {
    const settings = await chrome.storage.sync.get();
    const interventions = [];

    // Generative intervention for reading assistance
    if (settings.generativeInterventions && cognitiveData.textComplexity > 0.7) {
      interventions.push({
        type: 'reading_assistance',
        title: 'Complex Content Detected',
        message: 'This text appears complex. Would you like a summary?',
        action: 'summarize_text'
      });
    }

    // Attention management intervention
    if (settings.attentionTracking && cognitiveData.distractionEvents > 3) {
      interventions.push({
        type: 'attention_management',
        title: 'Attention Fragmentation',
        message: 'Multiple distractions detected. Consider using focus mode.',
        action: 'enable_focus_mode'
      });
    }

    // Reading pace intervention
    if (cognitiveData.readingPace < 0.3) {
      interventions.push({
        type: 'reading_pace',
        title: 'Slow Reading Detected',
        message: 'Reading pace is slower than usual. Take a break?',
        action: 'suggest_break'
      });
    }

    if (interventions.length > 0) {
      // Send interventions to content script
      chrome.tabs.sendMessage(tabId, {
        type: 'display-interventions',
        interventions
      });
    }
  }

  async applyIntervention(tabId, intervention) {
    switch (intervention.action) {
      case 'summarize_text':
        // Send message to content script to summarize text
        chrome.tabs.sendMessage(tabId, {
          type: 'summarize-content'
        });
        break;

      case 'enable_focus_mode':
        // Enable focus mode by hiding distracting elements
        chrome.tabs.sendMessage(tabId, {
          type: 'enable-focus-mode'
        });
        break;

      case 'suggest_break':
        // Show break suggestion
        chrome.tabs.sendMessage(tabId, {
          type: 'suggest-break'
        });
        break;
    }
  }

  updateTabAttention(tabId, focused) {
    const tabState = this.tabStates.get(tabId);
    if (!tabState) return;

    if (focused) {
      tabState.focusStartTime = Date.now();
    } else if (tabState.focusStartTime) {
      tabState.focusTime += Date.now() - tabState.focusStartTime;
      delete tabState.focusStartTime;
    }
  }

  handleBrowserFocusLoss() {
    // Update all active tabs as unfocused
    this.tabStates.forEach((state, tabId) => {
      this.updateTabAttention(tabId, false);
    });
  }

  handleBrowserFocusGain() {
    // Get current active tab and mark as focused
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        this.updateTabAttention(tabs[0].id, true);
      }
    });
  }

  getCurrentActiveTab() {
    // This is a simplified implementation
    // In practice, you'd track the currently active tab
    return null;
  }

  getFIColor(fi) {
    if (fi < 0.3) return '#22c55e'; // Green
    if (fi < 0.6) return '#3b82f6'; // Blue
    if (fi < 0.8) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  }

  async getStatus() {
    const tabStates = Array.from(this.tabStates.entries()).map(([tabId, state]) => ({
      tabId,
      ...state
    }));

    const totalTabs = this.tabStates.size;
    const avgFI = totalTabs > 0 ? 
      Array.from(this.tabStates.values()).reduce((sum, state) => sum + state.fi, 0) / totalTabs : 0;

    return {
      active: this.isActive,
      totalTabs,
      avgFI,
      tabStates
    };
  }
}

// Initialize the background service
const riaService = new RIABackgroundService();

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
  console.log('RIA Background Service started');
});