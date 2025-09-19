# 🔧 VS Code Extension Installation Guide

## Prerequisites

- **Visual Studio Code**: Version 1.74.0 or higher
- **Node.js**: Version 16.x or higher
- **TypeScript**: Version 4.8.0 or higher (automatically installed)

## Quick Installation (Recommended)

### Option 1: VS Code Marketplace (Coming Soon)
```bash
# Install from VS Code Marketplace (when published)
code --install-extension ria-cognitive-enhancer
```

### Option 2: Manual Installation (Current)

1. **Clone Repository**
   ```bash
   git clone https://github.com/Zoverions/ria-engine
   cd ria-engine/extensions/vscode-ria-pro
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Compile TypeScript**
   ```bash
   npm run compile
   ```

4. **Package Extension**
   ```bash
   npm install -g vsce
   vsce package
   ```

5. **Install in VS Code**
   ```bash
   code --install-extension ria-cognitive-enhancer-*.vsix
   ```

## Development Setup

For developers who want to modify or contribute to the extension:

### 1. Development Environment
```bash
# Clone and setup
git clone https://github.com/Zoverions/ria-engine
cd ria-engine/extensions/vscode-ria-pro

# Install development dependencies
npm install

# Open in VS Code for development
code .
```

### 2. Run Extension in Debug Mode
1. Open the project in VS Code
2. Press `F5` or go to `Run > Start Debugging`
3. A new VS Code window will open with the extension loaded
4. Test the extension in the new window

### 3. Watch Mode for Development
```bash
# Automatically recompile on changes
npm run watch
```

## Configuration

### Basic Configuration

Add to your VS Code `settings.json`:

```json
{
  "ria.enabled": true,
  "ria.analysisFrequency": 2000,
  "ria.optimizationLevel": "balanced",
  "ria.enhancementVectors": {
    "generativeInterventions": true,
    "multiSensoryResonance": true,
    "antifragileMode": true
  }
}
```

### Advanced Configuration

```json
{
  "ria.enabled": true,
  "ria.analysisFrequency": 2000,
  "ria.optimizationLevel": "balanced",
  "ria.enableDeepAnalysis": true,
  "ria.maxFileSize": 100000,
  "ria.enableRealTimeTracking": true,
  
  "ria.enhancementVectors": {
    "generativeInterventions": {
      "enabled": true,
      "contextWindow": 1000,
      "interventionThreshold": 0.7,
      "adaptiveMode": true
    },
    "multiSensoryResonance": {
      "enabled": true,
      "audioFeedback": true,
      "hapticFeedback": false
    },
    "antifragileMode": {
      "enabled": true,
      "learningRate": 0.01,
      "resilienceTraining": true
    }
  },
  
  "ria.workspace": {
    "focusFiles": ["*.js", "*.ts", "*.py", "*.md"],
    "excludePatterns": ["node_modules/**", ".git/**", "dist/**"],
    "projectTypeDetection": true
  },
  
  "ria.ui": {
    "statusBarEnabled": true,
    "notificationsEnabled": true,
    "cognitiveIndicator": "subtle"
  },
  
  "ria.privacy": {
    "telemetryEnabled": false,
    "localStorageOnly": true,
    "dataRetentionDays": 30
  }
}
```

## Features & Usage

### Real-Time Cognitive Load Monitoring

The extension automatically monitors your coding activity and provides:

- **Code Complexity Analysis**: Real-time analysis of cognitive load
- **Language-Specific Optimization**: Adapts to JavaScript, TypeScript, Python, etc.
- **IntelliSense Integration**: Smart assistance based on cognitive state
- **Debug Session Monitoring**: Stress detection during debugging

### Status Bar Integration

Look for the RIA cognitive indicator in your status bar:
- 🧠 **Green**: Low cognitive load
- 🧠 **Yellow**: Moderate cognitive load  
- 🧠 **Red**: High cognitive load

Click the indicator to:
- View detailed cognitive metrics
- Adjust sensitivity settings
- Enable/disable specific features

### Commands

Access RIA commands via Command Palette (`Ctrl+Shift+P`):

- `RIA: Enable Cognitive Enhancement`
- `RIA: Disable Cognitive Enhancement`
- `RIA: Show Cognitive Dashboard`
- `RIA: Reset Learning Data`
- `RIA: Export Session Data`
- `RIA: Configure Workspace Settings`

### Keyboard Shortcuts

Default shortcuts (customizable):
- `Ctrl+Alt+R`: Toggle RIA active state
- `Ctrl+Alt+D`: Open cognitive dashboard
- `Ctrl+Alt+F`: Activate focus mode

## Workspace-Specific Setup

### Project Type Detection

RIA automatically detects and optimizes for:

- **Node.js Projects**: Enhanced JavaScript/TypeScript analysis
- **Python Projects**: Scientific computing and data analysis optimization
- **Web Projects**: Frontend development cognitive patterns
- **C#/.NET Projects**: Enterprise development optimization

### Custom Project Configuration

Create `.vscode/ria.json` in your project root:

```json
{
  "projectType": "web",
  "cognitiveProfile": "complex",
  "analysisRules": {
    "complexity": {
      "functions": 2.0,
      "classes": 1.5,
      "loops": 1.8,
      "conditionals": 1.2
    }
  },
  "interventions": {
    "breakSuggestions": true,
    "complexityWarnings": true,
    "focusModeAuto": false
  }
}
```

## Troubleshooting

### Common Issues

**Extension Not Activating**
```bash
# Check VS Code version
code --version

# Reinstall extension
code --uninstall-extension ria-cognitive-enhancer
code --install-extension ria-cognitive-enhancer-*.vsix
```

**High CPU Usage**
```json
{
  "ria.optimizationLevel": "performance",
  "ria.analysisFrequency": 5000,
  "ria.enableDeepAnalysis": false
}
```

**TypeScript Compilation Errors**
```bash
# Clean and rebuild
npm run clean
npm install
npm run compile
```

### Debug Mode

Enable debug logging:
```json
{
  "ria.debug": true,
  "ria.logLevel": "verbose"
}
```

Check logs in:
- **Output Panel**: Select "RIA Cognitive Enhancer" from dropdown
- **Developer Console**: `Help > Toggle Developer Tools`

### Performance Optimization

For large workspaces:
```json
{
  "ria.optimizationLevel": "performance",
  "ria.maxFileSize": 50000,
  "ria.batchSize": 25,
  "ria.analysisFrequency": 5000
}
```

## Integration with Other Extensions

### Compatible Extensions

- **Prettier**: Code formatting integration
- **ESLint**: Enhanced error detection
- **GitLens**: Version control cognitive context
- **Live Server**: Web development optimization

### Potential Conflicts

If you experience issues, try disabling:
- Extensions that modify editor appearance extensively
- Other cognitive/productivity extensions
- Resource-intensive language servers

## Uninstallation

### Complete Removal
```bash
# Uninstall extension
code --uninstall-extension ria-cognitive-enhancer

# Remove configuration (optional)
# Windows: %APPDATA%\Code\User\settings.json
# macOS: ~/Library/Application\ Support/Code/User/settings.json
# Linux: ~/.config/Code/User/settings.json
# Remove all "ria.*" entries

# Remove workspace data (optional)
# Delete .vscode/ria.json from project roots
```

## Support & Feedback

- **Issues**: [GitHub Issues](https://github.com/Zoverions/ria-engine/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Zoverions/ria-engine/discussions)
- **Documentation**: [Full Documentation](https://github.com/Zoverions/ria-engine/docs)

---

**The RIA VS Code extension transforms your development environment into a cognitive-aware workspace that adapts to your coding patterns and enhances your productivity through intelligent assistance.**