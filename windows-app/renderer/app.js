/**
 * Main Application Controller
 * Handles navigation, settings, and overall app coordination
 */

class RIATradingApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.settings = {
            darkMode: true,
            soundAlerts: false,
            autoSave: true,
            riskFreeRate: 2.0,
            tradeCooldown: 0,
            feeRate: 10
        };
        this.initializeApp();
    }

    async initializeApp() {
        this.setupNavigation();
        this.setupMenuHandlers();
        this.setupSettingsHandlers();
        await this.loadSettings();
        this.startPeriodicUpdates();
        this.showWelcomeMessage();
        console.log('RIA Trading Desktop initialized');
    }

    setupNavigation() {
        // Handle sidebar navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.getAttribute('data-page');
                if (page) {
                    this.navigateToPage(page);
                }
            });
        });
    }

    navigateToPage(pageName) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === pageName) {
                item.classList.add('active');
            }
        });

        // Show/hide pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = this.getPageTitle(pageName);
        }

        this.currentPage = pageName;
        console.log('Navigated to page:', pageName);
    }

    getPageTitle(pageName) {
        const titles = {
            dashboard: 'Dashboard',
            wallet: 'Wallet Management',
            trading: 'Live Trading',
            backtest: 'Strategy Backtesting',
            settings: 'Settings'
        };
        return titles[pageName] || 'RIA Trading Desktop';
    }

    setupMenuHandlers() {
        // Handle menu actions from main process
        window.electronAPI.onMenuAction((event, action) => {
            console.log('Menu action received:', action);
            
            switch (action) {
                case 'new-wallet':
                    this.navigateToPage('wallet');
                    document.getElementById('createWalletBtn')?.click();
                    break;
                case 'import-wallet':
                    this.navigateToPage('wallet');
                    document.getElementById('importWalletBtn')?.click();
                    break;
                case 'export-wallet':
                    this.navigateToPage('wallet');
                    document.getElementById('exportWalletBtn')?.click();
                    break;
                case 'start-trading':
                    this.navigateToPage('trading');
                    document.getElementById('startTradingBtn')?.click();
                    break;
                case 'stop-trading':
                    this.navigateToPage('trading');
                    document.getElementById('stopTradingBtn')?.click();
                    break;
                case 'run-backtest':
                    this.navigateToPage('backtest');
                    document.getElementById('runBacktestBtn')?.click();
                    break;
                case 'settings':
                    this.navigateToPage('settings');
                    break;
            }
        });
    }

    setupSettingsHandlers() {
        // Save settings button
        document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
            this.saveSettings();
        });

        // Reset settings button
        document.getElementById('resetSettingsBtn')?.addEventListener('click', () => {
            this.resetSettings();
        });

        // Auto-save on change
        ['riskFreeRate', 'tradeCooldown', 'feeRate'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => {
                if (this.settings.autoSave) {
                    this.saveSettings();
                }
            });
        });

        ['darkMode', 'soundAlerts', 'autoSave'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', (e) => {
                this.settings[id] = e.target.checked;
                if (id === 'darkMode') {
                    this.applyTheme();
                }
                if (this.settings.autoSave) {
                    this.saveSettings();
                }
            });
        });
    }

    async loadSettings() {
        try {
            const storedSettings = await window.electronAPI.getStoredData('settings');
            if (storedSettings) {
                this.settings = { ...this.settings, ...storedSettings };
                this.applySettings();
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async saveSettings() {
        try {
            // Get current values from form
            this.settings.riskFreeRate = parseFloat(document.getElementById('riskFreeRate')?.value || 2.0);
            this.settings.tradeCooldown = parseInt(document.getElementById('tradeCooldown')?.value || 0);
            this.settings.feeRate = parseInt(document.getElementById('feeRate')?.value || 10);
            this.settings.darkMode = document.getElementById('darkMode')?.checked ?? true;
            this.settings.soundAlerts = document.getElementById('soundAlerts')?.checked ?? false;
            this.settings.autoSave = document.getElementById('autoSave')?.checked ?? true;

            await window.electronAPI.setStoredData('settings', this.settings);
            
            this.showNotification('Settings saved successfully!', 'success');
            console.log('Settings saved:', this.settings);
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('Failed to save settings', 'error');
        }
    }

    async resetSettings() {
        const result = await window.electronAPI.showMessageBox({
            type: 'question',
            title: 'Reset Settings',
            message: 'Are you sure you want to reset all settings to defaults?',
            buttons: ['Cancel', 'Reset'],
            defaultId: 0,
            cancelId: 0
        });

        if (result.response === 1) {
            this.settings = {
                darkMode: true,
                soundAlerts: false,
                autoSave: true,
                riskFreeRate: 2.0,
                tradeCooldown: 0,
                feeRate: 10
            };
            
            this.applySettings();
            await this.saveSettings();
            this.showNotification('Settings reset to defaults', 'info');
        }
    }

    applySettings() {
        // Apply settings to UI
        document.getElementById('riskFreeRate').value = this.settings.riskFreeRate;
        document.getElementById('tradeCooldown').value = this.settings.tradeCooldown;
        document.getElementById('feeRate').value = this.settings.feeRate;
        document.getElementById('darkMode').checked = this.settings.darkMode;
        document.getElementById('soundAlerts').checked = this.settings.soundAlerts;
        document.getElementById('autoSave').checked = this.settings.autoSave;
        
        this.applyTheme();
    }

    applyTheme() {
        // Theme is always dark for now, but this can be extended
        document.body.className = this.settings.darkMode ? 'dark-theme' : 'light-theme';
    }

    startPeriodicUpdates() {
        // Update dashboard every 30 seconds
        setInterval(() => {
            if (this.currentPage === 'dashboard') {
                this.updateDashboard();
            }
        }, 30000);

        // Update wallet balances every 60 seconds
        setInterval(() => {
            if (window.walletManager?.isWalletAvailable()) {
                window.walletManager.updateBalances();
            }
        }, 60000);
    }

    updateDashboard() {
        // Update general dashboard info
        const now = new Date();
        console.log('Dashboard updated at:', now.toLocaleTimeString());
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);

        // Play sound if enabled
        if (this.settings.soundAlerts) {
            this.playNotificationSound(type);
        }
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    playNotificationSound(type) {
        // Placeholder for sound effects
        // In a real implementation, you'd play actual sound files
        console.log('Playing sound for notification type:', type);
    }

    async showWelcomeMessage() {
        // Show welcome message on first run
        const hasShownWelcome = await window.electronAPI.getStoredData('hasShownWelcome');
        
        if (!hasShownWelcome) {
            setTimeout(async () => {
                await window.electronAPI.showMessageBox({
                    type: 'info',
                    title: 'Welcome to RIA Trading Desktop',
                    message: 'Welcome to your complete Windows trading application!',
                    detail: 'To get started:\\n1. Create or import a wallet\\n2. Fund your wallet with USDC\\n3. Configure your trading strategy\\n4. Start trading or run backtests\\n\\nUse the sidebar to navigate between features.'
                });
                
                await window.electronAPI.setStoredData('hasShownWelcome', true);
            }, 1000);
        }
    }

    // Public API for other modules
    getCurrentSettings() {
        return { ...this.settings };
    }

    getCurrentPage() {
        return this.currentPage;
    }

    async getAppInfo() {
        const version = await window.electronAPI.getAppVersion();
        return {
            version,
            currentPage: this.currentPage,
            settings: this.settings
        };
    }
}

// Add notification styles
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 16px 20px;
        min-width: 300px;
        z-index: 1001;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        transform: translateX(100%);
        animation: slideIn 0.3s ease forwards;
    }
    
    .notification.success {
        border-left: 4px solid #10b981;
    }
    
    .notification.error {
        border-left: 4px solid #ef4444;
    }
    
    .notification.warning {
        border-left: 4px solid #f59e0b;
    }
    
    .notification.info {
        border-left: 4px solid #3b82f6;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
        color: #f1f5f9;
    }
    
    .notification.success i {
        color: #10b981;
    }
    
    .notification.error i {
        color: #ef4444;
    }
    
    .notification.warning i {
        color: #f59e0b;
    }
    
    .notification.info i {
        color: #3b82f6;
    }
    
    .notification.fade-out {
        animation: slideOut 0.3s ease forwards;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the main application when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.riaApp = new RIATradingApp();
});

// Handle app close
window.addEventListener('beforeunload', () => {
    console.log('RIA Trading Desktop closing...');
});