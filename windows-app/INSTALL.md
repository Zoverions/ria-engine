# Installation Instructions for RIA Trading Desktop

## Quick Install (Recommended)

### For End Users
1. **Download** the latest installer from releases
2. **Run** `RIA-Trading-Desktop-Setup.exe`
3. **Follow** the installation wizard
4. **Launch** from Start Menu or Desktop shortcut

### System Requirements
- **Operating System**: Windows 10 or later (64-bit recommended)
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 500MB free disk space
- **Network**: Internet connection for trading and data feeds

## Development Installation

### Prerequisites
```bash
# Install Node.js (version 18 or later)
# Download from: https://nodejs.org/

# Verify installation
node --version
npm --version
```

### Setup Steps
```bash
# 1. Clone the repository
git clone https://github.com/Zoverions/ria-engine.git
cd ria-engine/windows-app

# 2. Install dependencies
npm install

# 3. Run in development mode
npm run dev

# 4. Build for production
npm run build:win
```

## Manual Installation

### Option 1: Installer Package
1. Download `RIA-Trading-Desktop-Setup.exe`
2. Right-click and select "Run as administrator" (if needed)
3. Choose installation directory (default: `C:\Program Files\RIA Trading Desktop`)
4. Select additional options:
   - Create desktop shortcut
   - Add to Start Menu
   - Create Quick Launch icon
5. Click "Install" and wait for completion
6. Launch application from installed location

### Option 2: Portable Version
1. Download `RIA-Trading-Desktop-Portable.exe`
2. Create a folder (e.g., `C:\RIA-Trading`)
3. Move the portable executable to this folder
4. Double-click to run (no installation required)
5. All data will be stored in the same folder

## Build from Source

### Windows Build Environment
```powershell
# Install build tools (optional, for native modules)
npm install --global windows-build-tools

# Or install Visual Studio Build Tools
# Download from: https://visualstudio.microsoft.com/downloads/
```

### Build Commands
```bash
# Install all dependencies
npm install

# Development build with hot reload
npm run dev

# Production build for Windows
npm run build:win

# Build both architectures
npm run build:win64
npm run build:win32

# Create portable version
npm run build -- --win portable

# Package without installer
npm run pack
```

### Build Output
After building, files will be available in the `dist/` directory:
```
dist/
├── RIA-Trading-Desktop-Setup.exe     # Main installer
├── RIA-Trading-Desktop-Portable.exe  # Portable version
├── win-unpacked/                     # Unpacked application
└── latest.yml                        # Update metadata
```

## Configuration

### Default Installation Paths
- **Program Files**: `C:\Program Files\RIA Trading Desktop\`
- **User Data**: `%APPDATA%\ria-trading-desktop\`
- **Logs**: `%APPDATA%\ria-trading-desktop\logs\`
- **Settings**: `%APPDATA%\ria-trading-desktop\config.json`

### Environment Variables
```bash
# Set custom data directory
set RIA_DATA_DIR=C:\MyTradingData

# Enable debug logging
set DEBUG=ria:*

# Custom configuration file
set RIA_CONFIG=C:\path\to\config.json
```

### Command Line Options
```bash
# Run with specific configuration
RIA-Trading-Desktop.exe --config="path/to/config.json"

# Enable debug mode
RIA-Trading-Desktop.exe --debug

# Specify data directory
RIA-Trading-Desktop.exe --data-dir="C:\MyData"

# Run in safe mode
RIA-Trading-Desktop.exe --safe-mode
```

## Firewall and Security

### Windows Defender
If Windows Defender blocks the application:
1. Open Windows Security
2. Go to "Virus & threat protection"
3. Click "Manage settings" under "Virus & threat protection settings"
4. Add exclusion for the application folder

### Firewall Settings
The application may need network access for:
- Trading data feeds
- Market price updates
- Strategy backtesting data

To allow through Windows Firewall:
1. Open Windows Defender Firewall
2. Click "Allow an app or feature through Windows Defender Firewall"
3. Click "Change Settings" then "Allow another app..."
4. Browse and select `RIA-Trading-Desktop.exe`
5. Check both "Private" and "Public" network boxes

## Troubleshooting

### Installation Issues

**"Windows protected your PC" message:**
1. Click "More info"
2. Click "Run anyway"
3. Or download from trusted source/official releases

**Permission denied errors:**
1. Run installer as administrator
2. Choose a different installation directory
3. Check disk space availability

**Missing dependencies:**
1. Install Microsoft Visual C++ Redistributable
2. Install .NET Framework 4.7.2 or later
3. Update Windows to latest version

### Runtime Issues

**Application won't start:**
```bash
# Check if Node.js is properly installed
node --version

# Verify all files are present
dir "C:\Program Files\RIA Trading Desktop"

# Run from command line to see errors
"C:\Program Files\RIA Trading Desktop\RIA-Trading-Desktop.exe" --debug
```

**Performance issues:**
1. Close other resource-intensive applications
2. Increase virtual memory (pagefile)
3. Check available RAM and disk space
4. Disable unnecessary startup programs

### Data Recovery

**Backup important files:**
- Wallet data: `%APPDATA%\ria-trading-desktop\wallet.json`
- Settings: `%APPDATA%\ria-trading-desktop\config.json`
- Trading logs: `%APPDATA%\ria-trading-desktop\logs\`

**Restore from backup:**
1. Close the application completely
2. Copy backup files to the data directory
3. Restart the application

## Uninstallation

### Using Control Panel
1. Open "Add or remove programs"
2. Search for "RIA Trading Desktop"
3. Click and select "Uninstall"
4. Follow the uninstaller prompts

### Manual Removal
1. Delete installation directory
2. Remove user data: `%APPDATA%\ria-trading-desktop\`
3. Clear registry entries (optional):
   - `HKEY_CURRENT_USER\Software\ria-trading-desktop`
   - `HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\ria-trading-desktop`

### Clean Uninstall Script
```batch
@echo off
echo Removing RIA Trading Desktop...

REM Stop any running processes
taskkill /f /im "RIA-Trading-Desktop.exe" 2>nul

REM Remove installation directory
rmdir /s /q "C:\Program Files\RIA Trading Desktop" 2>nul

REM Remove user data
rmdir /s /q "%APPDATA%\ria-trading-desktop" 2>nul

REM Remove desktop shortcut
del "%USERPROFILE%\Desktop\RIA Trading Desktop.lnk" 2>nul

echo Uninstallation completed.
pause
```

## Updates

### Automatic Updates
The application will check for updates automatically and notify you when new versions are available.

### Manual Updates
1. Download the latest installer
2. Run the installer (existing installation will be updated)
3. Your settings and wallet data will be preserved

### Pre-release Versions
To install beta or pre-release versions:
1. Download from the releases page
2. Backup your data first
3. Install following the same process

---

For additional support, visit the [GitHub repository](https://github.com/Zoverions/ria-engine) or check the [documentation](README.md).