# RIA Engine v2.0 Demos

This directory contains comprehensive demonstrations of RIA Engine v2.0 capabilities.

## Available Demos

### 1. Quick Start Demo (`quick-start.js`)
**Perfect for first-time users**
- Basic engine setup and initialization
- Simple data processing example
- Engine status and metrics
- 5-minute introduction to core features

```bash
node demos/quick-start.js
```

### 2. Comprehensive Demo (`comprehensive-demo.js`)
**Full feature showcase**
- Complete system demonstration
- All subsystems and capabilities
- Performance benchmarking
- Real-world usage scenarios
- Version comparison (v1.0 vs v2.0)

```bash
node demos/comprehensive-demo.js
```

### 3. Platform Integration Demo (`platform-demo.js`)
**Multi-platform capabilities**
- Platform-specific configurations
- Cross-platform synchronization
- Plugin ecosystem demonstration
- Integration examples for:
  - Web browsers
  - Figma plugins
  - VS Code extensions
  - Electron applications
  - React Native apps
  - Node.js servers

```bash
node demos/platform-demo.js
```

## Demo Features

### Interactive Elements
- Real-time progress indicators
- Color-coded terminal output
- Performance metrics display
- Error handling demonstrations

### Educational Content
- Step-by-step explanations
- Feature comparison matrices
- Best practices examples
- Configuration showcases

### Technical Demonstrations
- Event processing pipelines
- Analytics engine capabilities
- Machine learning personalization
- Plugin system architecture
- Security and compliance features

## Running the Demos

### Prerequisites
```bash
# Ensure RIA Engine v2.0 is properly installed
npm install

# Verify Node.js version (18+ required)
node --version
```

### Quick Evaluation
For a rapid overview of capabilities:
```bash
npm run demo:quick
```

### Full Demonstration
For comprehensive evaluation:
```bash
npm run demo:full
```

### Platform-Specific Testing
For integration testing:
```bash
npm run demo:platforms
```

## Demo Architecture

### Modular Design
Each demo is self-contained with:
- Independent execution capability
- Shared utility functions
- Platform-specific adaptations
- Error recovery mechanisms

### Performance Monitoring
All demos include:
- Real-time metrics collection
- Memory usage tracking
- Processing time measurement
- Throughput analysis

### Educational Structure
Demos follow a consistent pattern:
1. **Introduction** - Overview and objectives
2. **Setup** - System initialization
3. **Demonstration** - Feature showcases
4. **Analysis** - Results and insights
5. **Cleanup** - Resource management
6. **Next Steps** - Guidance for further exploration

## Customization

### Configuration Options
```javascript
// Custom demo configuration
const demoConfig = {
  duration: '5min',        // Demo length
  complexity: 'advanced',  // Feature depth
  platforms: ['web'],      // Target platforms
  analytics: true,         // Include analytics
  performance: true        // Show benchmarks
};
```

### Data Sources
Demos support various data inputs:
- Simulated user interactions
- Real-world data sets
- Custom data generators
- Live platform integrations

## Troubleshooting

### Common Issues

#### Demo Won't Start
```bash
# Check dependencies
npm install

# Verify engine installation
npm run verify

# Check Node.js version
node --version  # Should be 18+
```

#### Performance Issues
```bash
# Run with performance profiling
node --prof demos/comprehensive-demo.js

# Monitor resource usage
npm run demo:monitor
```

#### Platform Errors
```bash
# Test specific platform
npm run test:platform web

# Check platform compatibility
npm run check:platforms
```

## Development

### Adding New Demos
1. Create demo file in `/demos/`
2. Follow naming convention: `feature-demo.js`
3. Include proper documentation header
4. Add entry to package.json scripts
5. Update this README

### Demo Guidelines
- **Educational First**: Prioritize learning value
- **Real-World Examples**: Use practical scenarios
- **Error Handling**: Include failure demonstrations
- **Performance Aware**: Show optimization opportunities
- **Platform Agnostic**: Support multiple environments

## Integration Examples

### Web Application
```javascript
import { createEngineWithPreset } from '@ria-engine/core';

const engine = createEngineWithPreset('WEB_OPTIMIZED');
await engine.initialize();

// Your web app integration code
```

### Figma Plugin
```javascript
import { createEngineWithProfile } from '@ria-engine/core';

const engine = createEngineWithProfile('DESIGN_TOOLS');
await engine.initialize();

// Your Figma plugin code
```

### VS Code Extension
```javascript
import { createEngine } from '@ria-engine/core';

const engine = createEngine({
  platform: 'vscode',
  features: ['code-analysis', 'syntax-aware']
});

// Your VS Code extension code
```

## Support

### Documentation
- [API Reference](/docs/api/)
- [Integration Guides](/docs/integration/)
- [Configuration Manual](/docs/configuration/)
- [Performance Tuning](/docs/performance/)

### Community
- [GitHub Issues](https://github.com/ria-engine/issues)
- [Discord Community](https://discord.gg/ria-engine)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/ria-engine)

### Enterprise Support
- Technical consultation
- Custom integration assistance
- Performance optimization
- Training and workshops

---

**Note**: All demos are designed to run independently and safely. They use simulated data and do not require external services or credentials.