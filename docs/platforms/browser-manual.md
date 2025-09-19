# 🌐 Browser Extension Installation Guide

## Prerequisites

- **Supported Browsers**: Chrome 88+, Firefox 78+, Edge 88+, Safari 14+
- **Operating System**: Windows 10+, macOS 10.14+, Linux (Ubuntu 18.04+)
- **Memory**: 4GB RAM recommended for optimal performance

## Quick Installation

### Chrome Web Store (Coming Soon)
1. Visit [Chrome Web Store](https://chrome.google.com/webstore)
2. Search for "RIA Cognitive Web Enhancer"
3. Click `Add to Chrome`
4. Follow installation prompts

### Manual Installation (Current)

#### For Chrome/Edge/Brave

1. **Download Extension**
   ```bash
   git clone https://github.com/Zoverions/ria-engine
   cd ria-engine/extensions/browser-ria-pro
   ```

2. **Enable Developer Mode**
   - Open Chrome and go to `chrome://extensions/`
   - Toggle "Developer mode" in the top right
   - For Edge: go to `edge://extensions/`

3. **Load Extension**
   - Click "Load unpacked"
   - Select the `browser-ria-pro` folder
   - Extension will appear in your toolbar

#### For Firefox

1. **Download Extension**
   ```bash
   git clone https://github.com/Zoverions/ria-engine
   cd ria-engine/extensions/browser-ria-pro
   ```

2. **Create Temporary Installation**
   - Go to `about:debugging`
   - Click "This Firefox"
   - Click "Load Temporary Add-on"
   - Select `manifest.json` from the extension folder

3. **Permanent Installation** (for developers)
   ```bash
   # Package extension for Firefox
   zip -r ria-cognitive-enhancer.xpi . -x "*.git*" "node_modules/*"
   ```

#### For Safari

1. **Enable Developer Features**
   - Safari > Preferences > Advanced
   - Check "Show Develop menu in menu bar"

2. **Load Extension**
   - Develop > Web Extension > Load Extension
   - Select the `browser-ria-pro` folder
   - Grant necessary permissions

## Extension Setup

### First-Time Configuration

1. **Click Extension Icon**
   - Look for the 🧠 icon in your browser toolbar
   - If not visible, click the puzzle piece icon and pin RIA

2. **Complete Setup Wizard**
   - Choose your cognitive profile (adaptive recommended)
   - Configure privacy preferences
   - Enable desired enhancement features

3. **Grant Permissions**
   - Active tab access (required)
   - Storage access (required)
   - Cross-site scripting (optional, for advanced features)

### Privacy & Permissions

The extension requests these permissions:

#### Required Permissions
- **Active Tab**: To analyze current page content
- **Storage**: To save settings and learning data
- **Scripting**: To inject cognitive enhancement features

#### Optional Permissions
- **All Sites**: For cross-site cognitive tracking (can be disabled)
- **Background**: For persistent cognitive state monitoring
- **Notifications**: For break reminders and cognitive alerts

## Configuration

### Basic Settings

Access via extension popup > gear icon:

```javascript
// Default configuration
{
  "core": {
    "enabled": true,
    "analysisFrequency": 2000,
    "cognitiveProfile": "adaptive"
  },
  
  "features": {
    "readingAssistance": true,
    "focusMode": true,
    "crossTabTracking": true,
    "interventionOverlays": true
  },
  
  "privacy": {
    "telemetryEnabled": false,
    "localStorageOnly": true,
    "anonymousAnalytics": false
  }
}
```

### Advanced Configuration

Access via Options page (right-click extension icon > Options):

```javascript
// Advanced settings
{
  "enhancements": {
    "generativeInterventions": {
      "enabled": true,
      "contextWindow": 1000,
      "interventionThreshold": 0.7,
      "adaptiveMode": true
    },
    
    "multiSensoryResonance": {
      "enabled": true,
      "audioFeedback": {
        "binauralBeats": true,
        "adaptiveVolume": true,
        "readingEnhancement": true
      },
      "hapticFeedback": {
        "enabled": false,
        "intensity": "medium"
      }
    },
    
    "antifragileMode": {
      "enabled": true,
      "learningRate": 0.01,
      "resilienceTraining": true,
      "adaptationThreshold": 0.05
    }
  },
  
  "performance": {
    "optimizationLevel": "balanced",
    "maxMemoryUsage": 50,
    "backgroundProcessing": true,
    "batchAnalysis": true
  },
  
  "ui": {
    "overlayStyle": "subtle",
    "notificationStyle": "minimal",
    "darkMode": "auto",
    "animationsEnabled": true
  }
}
```

## Features & Usage

### Reading Assistance

#### Text Complexity Analysis
- **Automatic Detection**: Identifies complex sentences and vocabulary
- **Visual Highlighting**: Subtle indicators for difficult passages
- **Reading Speed Adaptation**: Adjusts based on your reading patterns
- **Comprehension Support**: Context-aware assistance

#### Focus Enhancement
- **Distraction Filtering**: Dims irrelevant page elements
- **Reading Flow**: Optimizes text layout for better comprehension
- **Progress Tracking**: Monitors reading progress and fatigue
- **Break Suggestions**: Intelligent break timing

### Cross-Tab Cognitive Tracking

#### Unified Cognitive State
- **Tab Switching Patterns**: Analyzes context switching behavior
- **Cognitive Load Aggregation**: Combines load from multiple tabs
- **Session Continuity**: Maintains cognitive context across browsing
- **Task Correlation**: Links related browsing activities

#### Smart Tab Management
- **Priority Queue**: Identifies most cognitively important tabs
- **Memory Optimization**: Reduces memory usage for background tabs
- **Attention Restoration**: Helps recover from tab-switching fatigue

### Intervention Overlays

#### Cognitive Support Overlays
- **Reading Guides**: Dynamic reading assistance
- **Focus Indicators**: Visual attention management
- **Complexity Warnings**: Alerts for cognitively demanding content
- **Break Reminders**: Proactive rest suggestions

#### Customizable Interface
- **Overlay Positioning**: Adjustable placement and size
- **Visual Styling**: Customizable appearance and opacity
- **Interaction Methods**: Mouse, keyboard, and touch support
- **Accessibility**: Screen reader and keyboard navigation support

## Browser-Specific Features

### Chrome/Chromium Features
- **Service Worker Background**: Persistent cognitive monitoring
- **Tab Groups Integration**: Cognitive grouping of related tabs
- **Performance API**: Advanced performance monitoring
- **Chrome Storage Sync**: Settings sync across devices

### Firefox Features
- **Container Integration**: Cognitive context for different containers
- **Enhanced Privacy**: Stronger privacy protections
- **Memory Efficiency**: Optimized for Firefox's memory management
- **WebExtension API**: Full WebExtension standard support

### Safari Features
- **Native Integration**: Optimized for macOS/iOS
- **Energy Efficiency**: Battery-aware processing
- **Privacy Focus**: Enhanced privacy protections
- **Handoff Support**: Continuity across Apple devices

### Edge Features
- **Collections Integration**: Cognitive enhancement for collections
- **Productivity Features**: Integration with Microsoft productivity tools
- **Enterprise Support**: Enhanced security for business use
- **Chromium Compatibility**: Full Chrome extension compatibility

## Usage Scenarios

### Academic Research
- **Paper Reading**: Enhanced comprehension for complex academic papers
- **Research Organization**: Cognitive load management during research
- **Citation Tracking**: Context-aware reference management
- **Note-Taking Support**: Cognitive assistance during note compilation

### Web Development
- **Documentation Reading**: Enhanced comprehension of technical docs
- **Code Review**: Cognitive support during web-based code reviews
- **Multi-Tab Debugging**: Context management during debugging sessions
- **Learning Resources**: Optimized experience for tutorials and guides

### Content Creation
- **Writing Support**: Cognitive enhancement during web-based writing
- **Research Compilation**: Managing cognitive load during content research
- **Image Editing**: Web-based design tool cognitive optimization
- **Social Media Management**: Attention management for social platforms

### General Browsing
- **News Reading**: Enhanced comprehension and fatigue management
- **Online Shopping**: Decision fatigue reduction
- **Entertainment**: Balanced engagement with media content
- **Social Networking**: Mindful social media interaction

## Troubleshooting

### Common Issues

**Extension Not Working**
```javascript
// Check extension status
chrome.management.get("extension-id", (result) => {
  console.log("Extension enabled:", result.enabled);
});

// Reload extension
chrome.runtime.reload();
```

**High Memory Usage**
1. Open Options page
2. Set optimization level to "Performance"
3. Reduce analysis frequency to 5000ms
4. Disable cross-tab tracking if not needed

**Permission Issues**
1. Right-click extension icon
2. Select "Manage extension"
3. Review and adjust permissions
4. Reload affected tabs

### Performance Optimization

#### For Low-Memory Systems
```javascript
{
  "performance": {
    "optimizationLevel": "performance",
    "maxMemoryUsage": 25,
    "backgroundProcessing": false,
    "reducedAnalysis": true
  }
}
```

#### For Slow Internet
```javascript
{
  "features": {
    "crossTabTracking": false,
    "backgroundSync": false,
    "remoteAnalysis": false
  }
}
```

### Debug Mode

Enable debug logging:
1. Open Options page
2. Go to Advanced settings
3. Enable "Debug mode"
4. Check browser console (F12) for detailed logs

## Data Privacy & Security

### Local Data Storage
- **Settings**: Stored locally in browser storage
- **Learning Data**: Encrypted local storage only
- **Session History**: Temporary storage, cleared on restart
- **No Personal Data**: No personally identifiable information stored

### Network Communication
- **Minimal Requests**: Only for updates and optional features
- **Encrypted**: All network communication uses HTTPS
- **Anonymous**: No user identification in requests
- **Opt-Out**: All network features can be disabled

### Third-Party Integration
- **No Third-Party Tracking**: Extension blocks tracking scripts
- **Ad Blocking**: Optional ad and tracker blocking
- **Cookie Management**: Respects browser cookie settings
- **CSP Compliance**: Content Security Policy compliance

## Updates & Maintenance

### Automatic Updates
- **Store Updates**: Automatic via browser extension store
- **Manual Updates**: Check for updates in extension management
- **Beta Channel**: Optional beta updates for testing new features

### Manual Update Process
```bash
# For development installations
cd ria-engine
git pull origin main
cd extensions/browser-ria-pro

# Reload extension in browser
# Chrome: chrome://extensions/ > Reload
# Firefox: about:debugging > Reload
```

### Backup & Restore
```javascript
// Export settings
chrome.storage.sync.get(null, (data) => {
  const backup = JSON.stringify(data, null, 2);
  // Save backup to file
});

// Import settings
const settings = JSON.parse(backupData);
chrome.storage.sync.set(settings);
```

## Uninstallation

### Complete Removal
1. **Remove Extension**
   - Chrome: `chrome://extensions/` > Remove
   - Firefox: `about:addons` > Remove
   - Safari: Safari > Preferences > Extensions > Uninstall

2. **Clear Data** (optional)
   ```javascript
   // Clear all extension data
   chrome.storage.local.clear();
   chrome.storage.sync.clear();
   ```

3. **Reset Browser** (if needed)
   - Clear cache and cookies if experiencing issues
   - Restart browser to ensure complete removal

## Advanced Usage

### Developer Integration

#### API Access
```javascript
// Access extension API from web pages
window.postMessage({
  type: 'RIA_API_REQUEST',
  action: 'getCognitiveState'
}, '*');

// Listen for responses
window.addEventListener('message', (event) => {
  if (event.data.type === 'RIA_API_RESPONSE') {
    console.log('Cognitive state:', event.data.cognitiveState);
  }
});
```

#### Custom Interventions
```javascript
// Register custom intervention
window.postMessage({
  type: 'RIA_REGISTER_INTERVENTION',
  intervention: {
    name: 'custom-focus',
    trigger: (cognitiveState) => cognitiveState.fractureIndex > 0.8,
    action: (context) => {
      // Custom intervention logic
    }
  }
}, '*');
```

### Enterprise Deployment

#### Group Policy Configuration
```json
{
  "force_install": {
    "ria-cognitive-enhancer": {
      "installation_mode": "force_installed",
      "update_url": "https://clients2.google.com/service/update2/crx"
    }
  },
  "default_settings": {
    "privacy": {
      "telemetryEnabled": false,
      "localStorageOnly": true
    }
  }
}
```

#### Centralized Management
- **Configuration Distribution**: Centralized settings management
- **Usage Analytics**: Aggregated cognitive enhancement metrics
- **Compliance Monitoring**: Privacy and security compliance
- **Support Integration**: Enterprise support and troubleshooting

## Support & Resources

- **Extension Issues**: [GitHub Issues](https://github.com/Zoverions/ria-engine/issues)
- **User Guide**: [Complete Documentation](https://github.com/Zoverions/ria-engine/docs)
- **Community**: [Discord Server](https://discord.gg/ria-engine)
- **Updates**: [Release Notes](https://github.com/Zoverions/ria-engine/releases)

---

**The RIA Browser Extension transforms your web browsing into a cognitive-aware experience that enhances reading comprehension, manages attention, and optimizes your digital interactions for better cognitive health.**