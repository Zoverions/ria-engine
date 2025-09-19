# RIA Trading Desktop

A complete Windows desktop application for cryptocurrency trading with advanced financial analytics.

## Features

### 🔐 Wallet Management
- **Create New Wallets**: Generate secure Ethereum wallets with private key management
- **Import Existing Wallets**: Import wallets using private keys
- **Secure Backup & Export**: Export wallet backups with encryption
- **Address Display**: Copy-friendly public address for funding
- **Private Key Protection**: Secure storage and display controls

### 📊 Live Trading
- **Real-time Trading**: Automated trading with multiple strategies
- **Risk Management**: Configurable position sizing and stop losses
- **Performance Monitoring**: Live P&L tracking and risk metrics
- **Trade History**: Complete trade log with performance attribution
- **Emergency Controls**: Instant stop functionality for risk management

### 📈 Advanced Analytics
- **Sharpe Ratio**: Risk-adjusted return analysis
- **Sortino Ratio**: Downside risk-focused metrics
- **Calmar Ratio**: Return vs maximum drawdown
- **Value at Risk (VaR)**: Risk assessment at confidence levels
- **Drawdown Analysis**: Peak-to-trough decline tracking

### 🧪 Strategy Backtesting
- **Historical Testing**: Test strategies on historical data
- **Performance Reports**: Comprehensive backtest results
- **Multiple Timeframes**: Support for various data frequencies
- **Export Results**: Save and compare backtest outcomes
- **Visual Analytics**: Charts and performance summaries

### ⚙️ Configuration & Settings
- **Trading Parameters**: Customize risk-free rates, fees, cooldowns
- **Security Settings**: Password protection and encryption
- **Display Options**: Dark mode, notifications, alerts
- **Data Management**: Secure storage and backup options

## Installation

### Prerequisites
- Windows 10 or later
- Node.js 18+ (for development)

### For End Users
1. Download the latest release from the [releases page]
2. Run the installer: `RIA-Trading-Desktop-Setup.exe`
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

### For Developers
```bash
# Clone the repository
git clone https://github.com/Zoverions/ria-engine.git
cd ria-engine/windows-app

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build:win
```

## Getting Started

### 1. Wallet Setup
- Launch the application
- Navigate to "Wallet" section
- Click "Create New Wallet" or "Import Wallet"
- **IMPORTANT**: Backup your private key securely!
- Copy your public address for funding

### 2. Fund Your Wallet
- Send USDC to your wallet address
- Wait for blockchain confirmation
- Balance will appear in the wallet section

### 3. Configure Trading
- Go to "Trading" section
- Select your preferred strategy
- Set position size and risk parameters
- Configure stop loss levels

### 4. Start Trading
- Click "Start Trading" to begin automated trading
- Monitor performance in the dashboard
- Use "Emergency Stop" if needed

### 5. Run Backtests
- Navigate to "Backtest" section
- Configure test parameters
- Select data source and timeframe
- Click "Run Backtest" to analyze strategy performance

## Security Features

### 🔒 Private Key Protection
- **Secure Storage**: Encrypted local storage using industry-standard AES encryption
- **Password Protection**: Optional password encryption for wallet data
- **Memory Safety**: Secure memory handling and cleanup
- **Backup Encryption**: Encrypted wallet backup exports

### 🛡️ Trading Safety
- **Paper Mode**: Safe testing environment before live trading
- **Risk Controls**: Position sizing and stop loss enforcement
- **Emergency Stop**: Immediate trading halt capability
- **Audit Trail**: Complete logging of all trading activities

### 🔐 Data Security
- **Local Storage**: All data stored locally, no cloud dependencies
- **Encryption**: Sensitive data encrypted at rest
- **Secure Communication**: Encrypted communication with trading engines
- **Access Controls**: Application-level security measures

## Architecture

### Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Electron (Node.js)
- **Trading Engine**: RIA Engine v2 (Advanced financial algorithms)
- **Security**: CryptoJS for encryption, Electron-Store for secure storage
- **UI Framework**: Custom responsive design with CSS Grid/Flexbox

### Key Components
```
windows-app/
├── main.js              # Electron main process
├── preload.js           # Secure IPC bridge
├── renderer/            # Frontend application
│   ├── index.html       # Main UI layout
│   ├── styles.css       # Application styling
│   ├── app.js           # Main application controller
│   ├── wallet.js        # Wallet management
│   ├── trading.js       # Trading interface
│   └── backtest.js      # Backtesting interface
├── security.js         # Security and encryption
└── assets/              # Application resources
```

## Development

### Building from Source
```bash
# Install dependencies
npm install

# Development mode with hot reload
npm run dev

# Build for Windows (64-bit)
npm run build:win64

# Build for Windows (32-bit)
npm run build:win32

# Create portable version
npm run build:win
```

### Development Scripts
- `npm start` - Start the application
- `npm run dev` - Development mode with DevTools
- `npm run build` - Build for production
- `npm run pack` - Package without installer
- `npm run dist` - Create distribution files

## Configuration

### Default Settings
```json
{
  "riskFreeRate": 2.0,
  "tradeCooldown": 0,
  "feeRate": 10,
  "darkMode": true,
  "soundAlerts": false,
  "autoSave": true
}
```

### Trading Strategies
- **Market Fracture Index**: Advanced market stability analysis
- **Mean Reversion**: Statistical arbitrage strategy
- **Momentum**: Trend-following algorithm

### Risk Management
- **Position Sizing**: 1-100% of portfolio
- **Maximum Risk**: 0.1-10% per trade
- **Stop Loss**: 1-20% loss limits

## Performance Metrics

### Core Analytics
- **Total Return**: Overall portfolio performance
- **Sharpe Ratio**: Risk-adjusted returns
- **Sortino Ratio**: Downside risk analysis
- **Maximum Drawdown**: Worst peak-to-trough decline
- **Win Rate**: Percentage of profitable trades
- **Profit Factor**: Gross profit vs gross loss ratio

### Risk Metrics
- **Value at Risk (VaR)**: Potential loss at 95% confidence
- **Conditional VaR**: Expected shortfall beyond VaR
- **Volatility**: Annualized standard deviation
- **Skewness**: Return distribution asymmetry
- **Kurtosis**: Tail risk assessment

## Troubleshooting

### Common Issues

**Application won't start**
- Ensure Windows 10 or later
- Check Node.js installation (for development)
- Verify all dependencies are installed

**Wallet creation fails**
- Check available disk space
- Ensure write permissions to app directory
- Try running as administrator

**Trading won't start**
- Verify wallet is created and funded
- Check network connectivity
- Ensure RIA Engine components are accessible

**Backtest fails**
- Verify data files exist
- Check file permissions
- Ensure sufficient system resources

### Logs and Debugging
- Application logs: `%APPDATA%/ria-trading-desktop/logs/`
- Error reports: Check Developer Tools (Ctrl+Shift+I)
- Trading logs: Real-time display in application

## Support

### Documentation
- [API Reference](docs/API.md)
- [Trading Strategies](docs/STRATEGIES.md)
- [Security Guide](docs/SECURITY.md)

### Community
- [GitHub Issues](https://github.com/Zoverions/ria-engine/issues)
- [Discussions](https://github.com/Zoverions/ria-engine/discussions)

## License

Apache License 2.0 - see [LICENSE](../LICENSE) file for details.

## Disclaimer

**IMPORTANT**: This software is for educational and research purposes. Cryptocurrency trading involves substantial risk of loss. Never trade with funds you cannot afford to lose. Always test strategies thoroughly before live trading. The developers are not responsible for any financial losses.

---

*RIA Trading Desktop - Professional cryptocurrency trading platform for Windows*