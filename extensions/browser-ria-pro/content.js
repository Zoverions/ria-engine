/**
 * RIA Cognitive Web Enhancer - Content Script
 * 
 * Monitors web page interactions and cognitive load indicators.
 * Provides real-time analysis and interventions for web browsing.
 */

class RIAContentMonitor {
  constructor() {
    this.isActive = false;
    this.cognitiveMetrics = {
      fi: 0,
      textComplexity: 0,
      distractionEvents: 0,
      readingPace: 1,
      scrollEvents: 0,
      clickEvents: 0,
      focusTime: 0
    };
    
    this.readingData = {
      startTime: Date.now(),
      wordsRead: 0,
      totalWords: 0,
      progress: 0
    };
    
    this.setupEventListeners();
    this.startMonitoring();
  }

  setupEventListeners() {
    // Scroll tracking for reading progress
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      this.cognitiveMetrics.scrollEvents++;
      this.updateReadingProgress();
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.sendCognitiveData();
      }, 500);
    }, { passive: true });

    // Click tracking for distraction events
    document.addEventListener('click', (event) => {
      this.cognitiveMetrics.clickEvents++;
      this.analyzeClickBehavior(event);
    });

    // Focus/blur tracking
    window.addEventListener('focus', () => {
      this.cognitiveMetrics.focusStartTime = Date.now();
    });

    window.addEventListener('blur', () => {
      if (this.cognitiveMetrics.focusStartTime) {
        this.cognitiveMetrics.focusTime += Date.now() - this.cognitiveMetrics.focusStartTime;
        delete this.cognitiveMetrics.focusStartTime;
      }
    });

    // Text selection for reading analysis
    document.addEventListener('selectionchange', () => {
      this.analyzeTextSelection();
    });

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sendResponse);
      return true;
    });

    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handlePageHidden();
      } else {
        this.handlePageVisible();
      }
    });
  }

  startMonitoring() {
    this.isActive = true;
    this.analyzePageContent();
    
    // Start periodic monitoring
    setInterval(() => {
      if (this.isActive) {
        this.updateCognitiveMetrics();
        this.sendCognitiveData();
      }
    }, 2000); // Every 2 seconds
  }

  analyzePageContent() {
    // Analyze text complexity
    const textContent = document.body.innerText || '';
    this.readingData.totalWords = textContent.split(/\s+/).length;
    this.cognitiveMetrics.textComplexity = this.calculateTextComplexity(textContent);
    
    // Analyze page structure complexity
    const structuralComplexity = this.calculateStructuralComplexity();
    
    // Calculate initial FI
    this.cognitiveMetrics.fi = Math.min(1, 
      (this.cognitiveMetrics.textComplexity * 0.4) + 
      (structuralComplexity * 0.3) + 
      (this.calculateVisualComplexity() * 0.3)
    );
  }

  calculateTextComplexity(text) {
    if (!text || text.length < 100) return 0.1;
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/);
    
    // Average sentence length
    const avgSentenceLength = words.length / sentences.length;
    
    // Syllable complexity (simplified)
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    // Technical terms (words > 8 characters)
    const technicalWords = words.filter(word => word.length > 8).length;
    const technicalRatio = technicalWords / words.length;
    
    // Normalize complexity score
    let complexity = 0;
    complexity += Math.min(1, avgSentenceLength / 20) * 0.4; // Sentence length
    complexity += Math.min(1, avgWordLength / 8) * 0.3; // Word length
    complexity += Math.min(1, technicalRatio * 5) * 0.3; // Technical density
    
    return complexity;
  }

  calculateStructuralComplexity() {
    // Count various structural elements
    const elements = {
      links: document.querySelectorAll('a').length,
      images: document.querySelectorAll('img').length,
      videos: document.querySelectorAll('video').length,
      buttons: document.querySelectorAll('button').length,
      inputs: document.querySelectorAll('input').length,
      divs: document.querySelectorAll('div').length
    };
    
    // Calculate complexity based on element density
    const totalElements = Object.values(elements).reduce((sum, count) => sum + count, 0);
    const bodyArea = document.body.offsetWidth * document.body.offsetHeight;
    const density = bodyArea > 0 ? totalElements / (bodyArea / 10000) : 0;
    
    return Math.min(1, density / 10);
  }

  calculateVisualComplexity() {
    // Analyze visual elements that could cause cognitive overload
    const coloredElements = document.querySelectorAll('[style*="color"]').length;
    const animatedElements = document.querySelectorAll('[style*="animation"], .animate').length;
    const overlayElements = document.querySelectorAll('[style*="position: fixed"], [style*="position: absolute"]').length;
    
    const visualScore = (coloredElements + animatedElements * 2 + overlayElements * 3) / 100;
    return Math.min(1, visualScore);
  }

  updateReadingProgress() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    if (scrollHeight > 0) {
      this.readingData.progress = scrollTop / scrollHeight;
      
      // Estimate words read based on scroll position
      this.readingData.wordsRead = Math.floor(this.readingData.totalWords * this.readingData.progress);
      
      // Calculate reading pace
      const timeElapsed = (Date.now() - this.readingData.startTime) / 60000; // minutes
      const wordsPerMinute = timeElapsed > 0 ? this.readingData.wordsRead / timeElapsed : 0;
      
      // Normalize reading pace (average reading speed is ~200-250 WPM)
      this.cognitiveMetrics.readingPace = Math.min(1, wordsPerMinute / 225);
    }
  }

  analyzeClickBehavior(event) {
    // Detect potentially distracting clicks
    const target = event.target;
    
    if (target.tagName === 'A' && target.hostname !== window.location.hostname) {
      this.cognitiveMetrics.distractionEvents++;
    }
    
    if (target.closest('.advertisement') || target.closest('[id*="ad"]')) {
      this.cognitiveMetrics.distractionEvents++;
    }
    
    // Rapid clicking pattern detection
    const now = Date.now();
    if (!this.lastClickTime) {
      this.lastClickTime = now;
      this.rapidClicks = 0;
    } else if (now - this.lastClickTime < 1000) {
      this.rapidClicks++;
      if (this.rapidClicks > 3) {
        this.cognitiveMetrics.distractionEvents++;
        this.rapidClicks = 0;
      }
    } else {
      this.rapidClicks = 0;
    }
    this.lastClickTime = now;
  }

  analyzeTextSelection() {
    const selection = window.getSelection();
    if (selection.toString().length > 20) {
      // User is selecting text - might indicate difficulty
      this.cognitiveMetrics.fi = Math.min(1, this.cognitiveMetrics.fi + 0.1);
    }
  }

  updateCognitiveMetrics() {
    // Update FI based on recent activity
    const activityLevel = (this.cognitiveMetrics.scrollEvents + this.cognitiveMetrics.clickEvents) / 10;
    const distractionImpact = this.cognitiveMetrics.distractionEvents * 0.1;
    const readingPaceImpact = this.cognitiveMetrics.readingPace < 0.5 ? 0.1 : 0;
    
    this.cognitiveMetrics.fi = Math.min(1, 
      this.cognitiveMetrics.fi + 
      distractionImpact + 
      readingPaceImpact - 
      (activityLevel * 0.05) // Gradual decay
    );
    
    // Reset counters
    this.cognitiveMetrics.scrollEvents = 0;
    this.cognitiveMetrics.clickEvents = 0;
    this.cognitiveMetrics.distractionEvents = Math.max(0, this.cognitiveMetrics.distractionEvents - 1);
  }

  sendCognitiveData() {
    chrome.runtime.sendMessage({
      type: 'cognitive-data',
      data: { ...this.cognitiveMetrics }
    });
    
    chrome.runtime.sendMessage({
      type: 'reading-progress',
      data: { ...this.readingData }
    });
  }

  handleMessage(message, sendResponse) {
    switch (message.type) {
      case 'display-interventions':
        this.displayInterventions(message.interventions);
        break;
      case 'summarize-content':
        this.summarizeContent();
        break;
      case 'enable-focus-mode':
        this.enableFocusMode();
        break;
      case 'suggest-break':
        this.suggestBreak();
        break;
    }
    sendResponse({ received: true });
  }

  displayInterventions(interventions) {
    // Remove existing interventions
    const existing = document.getElementById('ria-interventions');
    if (existing) existing.remove();
    
    if (interventions.length === 0) return;
    
    // Create intervention overlay
    const overlay = document.createElement('div');
    overlay.id = 'ria-interventions';
    overlay.className = 'ria-intervention-overlay';
    
    interventions.forEach((intervention, index) => {
      const card = document.createElement('div');
      card.className = 'ria-intervention-card';
      card.innerHTML = `
        <div class="ria-intervention-header">
          <span class="ria-intervention-icon">💡</span>
          <span class="ria-intervention-title">${intervention.title}</span>
          <button class="ria-intervention-close" onclick="this.closest('.ria-intervention-card').remove()">×</button>
        </div>
        <div class="ria-intervention-message">${intervention.message}</div>
        <div class="ria-intervention-actions">
          <button class="ria-intervention-btn primary" onclick="riaContentMonitor.applyIntervention(${index})">Apply</button>
          <button class="ria-intervention-btn secondary" onclick="this.closest('.ria-intervention-card').remove()">Dismiss</button>
        </div>
      `;
      overlay.appendChild(card);
    });
    
    document.body.appendChild(overlay);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.remove();
      }
    }, 10000);
  }

  applyIntervention(index) {
    // Send to background script
    chrome.runtime.sendMessage({
      type: 'apply-intervention',
      data: { index }
    });
  }

  summarizeContent() {
    // Simplified content summarization
    const mainContent = this.extractMainContent();
    const summary = this.generateSummary(mainContent);
    
    this.displaySummary(summary);
  }

  extractMainContent() {
    // Try to find main content area
    const candidates = [
      document.querySelector('main'),
      document.querySelector('[role="main"]'),
      document.querySelector('article'),
      document.querySelector('.content'),
      document.querySelector('#content'),
      document.body
    ];
    
    const mainElement = candidates.find(el => el) || document.body;
    return mainElement.innerText || '';
  }

  generateSummary(text) {
    // Very simplified summarization - take first sentences of paragraphs
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 50);
    const summary = paragraphs
      .slice(0, 3)
      .map(p => p.split('.')[0] + '.')
      .join(' ');
    
    return summary || 'Content summary not available.';
  }

  displaySummary(summary) {
    const summaryBox = document.createElement('div');
    summaryBox.className = 'ria-summary-box';
    summaryBox.innerHTML = `
      <div class="ria-summary-header">
        <span>📄 Content Summary</span>
        <button onclick="this.closest('.ria-summary-box').remove()">×</button>
      </div>
      <div class="ria-summary-content">${summary}</div>
    `;
    
    document.body.appendChild(summaryBox);
  }

  enableFocusMode() {
    // Hide potentially distracting elements
    const distractingSelectors = [
      '.advertisement',
      '[id*="ad"]',
      '.sidebar',
      '.comments',
      '.social-share',
      '.popup',
      '.modal'
    ];
    
    distractingSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        el.style.display = 'none';
        el.classList.add('ria-hidden');
      });
    });
    
    // Add focus mode indicator
    const indicator = document.createElement('div');
    indicator.className = 'ria-focus-indicator';
    indicator.innerHTML = '🎯 Focus Mode Active';
    document.body.appendChild(indicator);
    
    // Auto-disable after 30 minutes
    setTimeout(() => {
      this.disableFocusMode();
    }, 30 * 60 * 1000);
  }

  disableFocusMode() {
    // Restore hidden elements
    const hiddenElements = document.querySelectorAll('.ria-hidden');
    hiddenElements.forEach(el => {
      el.style.display = '';
      el.classList.remove('ria-hidden');
    });
    
    // Remove focus indicator
    const indicator = document.querySelector('.ria-focus-indicator');
    if (indicator) indicator.remove();
  }

  suggestBreak() {
    const breakSuggestion = document.createElement('div');
    breakSuggestion.className = 'ria-break-suggestion';
    breakSuggestion.innerHTML = `
      <div class="ria-break-content">
        <span class="ria-break-icon">☕</span>
        <div class="ria-break-text">
          <h3>Take a Short Break</h3>
          <p>You've been reading for a while. A 5-minute break can help maintain focus.</p>
        </div>
        <button class="ria-break-btn" onclick="this.closest('.ria-break-suggestion').remove()">OK</button>
      </div>
    `;
    
    document.body.appendChild(breakSuggestion);
    
    setTimeout(() => {
      if (breakSuggestion.parentNode) {
        breakSuggestion.remove();
      }
    }, 15000);
  }

  handlePageHidden() {
    // Page is hidden - pause monitoring
    this.isActive = false;
  }

  handlePageVisible() {
    // Page is visible - resume monitoring
    this.isActive = true;
  }
}

// Make it globally accessible for intervention buttons
window.riaContentMonitor = new RIAContentMonitor();

console.log('RIA Content Monitor initialized');