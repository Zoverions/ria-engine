# 🎨 Figma Plugin Installation Guide

## Prerequisites

- **Figma Desktop App**: Latest version recommended
- **Figma Account**: Personal or team account
- **Development Mode**: Enabled in Figma settings (for development)

## Quick Installation

### Option 1: Figma Community (Coming Soon)
1. Open Figma
2. Go to `Plugins` > `Browse all plugins`
3. Search for "RIA Cognitive Design Enhancer"
4. Click `Install`

### Option 2: Manual Installation (Current)

#### Step 1: Download Plugin Files
```bash
git clone https://github.com/Zoverions/ria-engine
cd ria-engine/extensions/figma-ria-pro
```

#### Step 2: Install in Figma Desktop

1. **Open Figma Desktop** (required for plugin development)

2. **Access Plugin Menu**
   - Go to `Plugins` > `Development` > `Import plugin from manifest...`

3. **Select Manifest File**
   - Navigate to `ria-engine/extensions/figma-ria-pro/`
   - Select `manifest.json`

4. **Confirm Installation**
   - Click `Save` when prompted
   - The plugin will appear in your `Plugins` > `Development` menu

#### Step 3: Enable Plugin
1. Select any frame or object in your design
2. Go to `Plugins` > `Development` > `RIA Cognitive Design Enhancer`
3. Accept permissions and start using the plugin

## Development Setup

For developers who want to modify or contribute to the plugin:

### 1. Setup Development Environment
```bash
# Clone repository
git clone https://github.com/Zoverions/ria-engine
cd ria-engine/extensions/figma-ria-pro

# Install dependencies (if using build tools)
npm install

# Optional: Setup TypeScript compilation
npm run build
```

### 2. Development Workflow

#### Hot Reload Setup
For faster development, you can set up hot reloading:

1. **Use Figma Plugin Development Tools**
   ```bash
   # Install Figma plugin CLI (optional)
   npm install -g @figma/plugin-typings
   ```

2. **Watch Mode** (if using TypeScript)
   ```bash
   # Watch for changes and auto-compile
   npm run watch
   ```

3. **Manual Reload in Figma**
   - After making changes, go to `Plugins` > `Development` > `Reload plugin`

### 3. Plugin Structure

Understanding the plugin architecture:

```
figma-ria-pro/
├── manifest.json      # Plugin configuration
├── code.js           # Main plugin logic (runs in Figma context)
├── ui.html           # Plugin UI interface
├── optimizations.js  # Figma-specific performance optimizations
└── assets/           # Plugin icons and resources
```

## Configuration

### Plugin Settings

Access settings through the plugin UI:

1. **Launch Plugin**
   - `Plugins` > `Development` > `RIA Cognitive Design Enhancer`

2. **Open Settings Panel**
   - Click the gear icon in the plugin UI
   - Or use the "Settings" tab

### Basic Configuration

```javascript
// Default settings (customizable in UI)
{
  "analysisMode": "realtime",
  "complexityThreshold": 7.0,
  "enableOptimizations": true,
  "
": {
    "generativeInterventions": true,
    "designComplexityAnalysis": true,
    "componentIntelligence": true,
    "creativeFlowOptimization": true
  }
}
```

### Advanced Configuration

```javascript
// Advanced settings for power users
{
  "performance": {
    "cacheEnabled": true,
    "batchSize": 10,
    "analysisDelay": 500
  },
  
  "complexity": {
    "visualWeight": 0.4,
    "structuralWeight": 0.3,
    "interactiveWeight": 0.2,
    "contentWeight": 0.1
  },
  
  "interventions": {
    "subtleHints": true,
    "complexityWarnings": true,
    "simplificationSuggestions": true,
    "componentOptimization": true
  },
  
  "ui": {
    "compactMode": false,
    "darkTheme": "auto",
    "animationsEnabled": true
  }
}
```

## Features & Usage

### Real-Time Design Analysis

The plugin automatically analyzes your designs for:

#### Visual Complexity
- **Color Usage**: Analyzes color variety and harmony
- **Typography**: Evaluates font usage and hierarchy
- **Visual Effects**: Monitors shadows, blurs, and other effects
- **Layout Density**: Calculates element density and spacing

#### Structural Complexity
- **Layer Hierarchy**: Analyzes nesting depth and organization
- **Component Usage**: Tracks component instances and variations
- **Auto Layout**: Evaluates auto layout complexity
- **Constraints**: Monitors constraint usage patterns

#### Interactive Complexity
- **Prototyping**: Analyzes interaction flows and transitions
- **Overlay Handling**: Evaluates modal and overlay complexity
- **State Management**: Tracks component state variations

### Plugin Interface

#### Main Dashboard
- **Complexity Score**: Overall design complexity (0-10 scale)
- **Real-time Metrics**: Live updating analysis
- **Recommendations**: AI-powered design suggestions
- **Enhancement Status**: Active enhancement indicators

#### Analysis Panel
- **Frame Analysis**: Detailed complexity breakdown
- **Component Insights**: Component library optimization
- **Performance Metrics**: Plugin performance statistics
- **Historical Data**: Session analysis and trends

### Keyboard Shortcuts

When plugin is active:
- `Cmd/Ctrl + R`: Refresh analysis
- `Cmd/Ctrl + S`: Save current analysis
- `Cmd/Ctrl + E`: Export complexity report
- `Escape`: Close plugin

## Design Workflow Integration

### Automatic Analysis

The plugin automatically triggers analysis when:
- **Selecting frames**: Immediate analysis of selected elements
- **Making changes**: Real-time updates during design modifications
- **Component interactions**: Analysis when working with components
- **Page switches**: Context-aware analysis for different pages

### Design Optimization Features

#### Complexity Reduction
- **Simplification Suggestions**: AI-powered recommendations
- **Component Optimization**: Smart component usage advice
- **Color Palette Optimization**: Harmony and accessibility improvements
- **Typography Cleanup**: Font usage optimization

#### Creative Flow Enhancement
- **Focus Mode**: Reduces interface distractions during creative work
- **Cognitive Load Indicators**: Visual cues for design complexity
- **Break Suggestions**: Intelligent break timing based on creative fatigue
- **Inspiration Triggers**: Contextual creative inspiration

### Team Collaboration

#### Shared Analysis
- **Team Insights**: Aggregate complexity metrics across team
- **Design System Compliance**: Automated design system adherence checking
- **Review Optimization**: Cognitive load considerations for design reviews

#### Analytics & Reporting
- **Session Reports**: Detailed design session analysis
- **Complexity Trends**: Long-term complexity pattern tracking
- **Team Performance**: Collaborative cognitive enhancement metrics

## Troubleshooting

### Common Issues

**Plugin Not Loading**
1. Ensure you're using Figma Desktop (not browser version)
2. Check that Development mode is enabled
3. Verify manifest.json is valid JSON

```bash
# Validate manifest.json
cat manifest.json | python -m json.tool
```

**Performance Issues with Large Files**
```javascript
// Reduce analysis frequency in plugin settings
{
  "performance": {
    "analysisDelay": 1000,
    "batchSize": 5,
    "maxElementsPerFrame": 100
  }
}
```

**Analysis Not Updating**
1. Manually refresh: `Cmd/Ctrl + R` in plugin
2. Reload plugin: `Plugins` > `Development` > `Reload plugin`
3. Check browser console for errors

### Debug Mode

Enable debug logging in plugin UI:
1. Open plugin settings
2. Enable "Debug Mode"
3. Check browser console (`View` > `Developer` > `JavaScript Console`)

### Memory Issues

For large documents:
```javascript
{
  "performance": {
    "cacheEnabled": true,
    "maxCacheSize": 50,
    "enableCleanup": true,
    "cleanupInterval": 300000
  }
}
```

## Plugin Permissions

The RIA Figma plugin requests these permissions:

- **Read access**: To analyze design complexity
- **Write access**: To apply optimization suggestions (optional)
- **Network access**: For AI-powered recommendations (optional)
- **Storage access**: To save settings and analysis history

### Privacy Considerations

- **Local Analysis**: Core complexity analysis happens locally
- **Anonymous Data**: Only anonymized metrics shared for research
- **Opt-out Available**: All data sharing can be disabled
- **No Personal Data**: No personal or proprietary design data collected

## Updates & Maintenance

### Automatic Updates
- Plugin updates automatically when using Figma Community version
- Manual updates required for development installations

### Manual Update Process
```bash
# Pull latest changes
cd ria-engine
git pull origin main

# Reload plugin in Figma
# Plugins > Development > Reload plugin
```

### Version Compatibility
- **Figma Desktop**: All recent versions supported
- **Figma Browser**: Limited functionality (development mode unavailable)
- **Plugin API**: Compatible with current Figma Plugin API

## Uninstallation

### Remove from Figma
1. Go to `Plugins` > `Manage plugins`
2. Find "RIA Cognitive Design Enhancer"
3. Click `Remove`

### Clean Development Installation
1. Remove plugin from Figma (above steps)
2. Delete plugin files from local system
3. Clear any cached data in browser developer tools

## Advanced Usage

### Custom Analysis Rules

Create custom complexity rules for your design system:

```javascript
// Custom complexity configuration
{
  "customRules": {
    "brandColors": {
      "allowedColors": ["#FF6B6B", "#4ECDC4", "#45B7D1"],
      "penaltyMultiplier": 1.5
    },
    "typography": {
      "maxFontFamilies": 3,
      "maxFontSizes": 8,
      "penaltyMultiplier": 2.0
    },
    "componentUsage": {
      "preferComponents": true,
      "instancePenalty": 0.1,
      "detachedPenalty": 1.0
    }
  }
}
```

### API Integration

For advanced users, the plugin exposes an API:

```javascript
// Access plugin API (in Figma console)
figma.root.setPluginData('ria-api-enabled', 'true');

// Get current complexity analysis
const analysis = figma.root.getPluginData('ria-current-analysis');

// Trigger manual analysis
figma.root.setPluginData('ria-trigger-analysis', Date.now());
```

## Support & Resources

- **Plugin Issues**: [GitHub Issues](https://github.com/Zoverions/ria-engine/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/Zoverions/ria-engine/discussions)
- **Documentation**: [Complete Guide](https://github.com/Zoverions/ria-engine/docs)
- **Community**: [Figma Community Page](https://figma.com/@ria-engine) (coming soon)

---

**The RIA Figma plugin transforms your design workflow into a cognitive-aware environment that helps you create more accessible, maintainable, and cognitively optimized designs.**