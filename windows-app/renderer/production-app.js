/**
 * Production Trading Application - Main Integration
 * Coordinates all production components: multi-wallet, DEX trading, bridging, and funding
 */

import { MultiWalletManager } from './multi-wallet.js';
import { TokenDatabase } from './token-database.js';
import { DEXIntegration } from './dex-integration.js';
import { ProductionTradingEngine } from './production-trading-engine.js';
import { CrossChainBridge } from './cross-chain-bridge.js';
import { FundingInterface } from './funding-interface.js';

class ProductionApp {
    constructor() {
        this.initializeComponents();
        this.setupEventHandlers();
        this.loadState();
    }

    initializeComponents() {
        // Initialize core components
        this.multiWalletManager = new MultiWalletManager();
        this.tokenDatabase = new TokenDatabase();
        this.dexIntegration = new DEXIntegration();
        this.productionTradingEngine = new ProductionTradingEngine(
            this.multiWalletManager,
            this.tokenDatabase,
            this.dexIntegration
        );
        this.crossChainBridge = new CrossChainBridge();
        this.fundingInterface = new FundingInterface(this.multiWalletManager);

        // Application state
        this.currentView = 'dashboard';
        this.selectedWallet = null;
        this.selectedChain = 1; // Default to Ethereum
    }

    setupEventHandlers() {
        // Navigation
        document.getElementById('nav-dashboard')?.addEventListener('click', () => this.showView('dashboard'));
        document.getElementById('nav-wallets')?.addEventListener('click', () => this.showView('wallets'));
        document.getElementById('nav-trading')?.addEventListener('click', () => this.showView('trading'));
        document.getElementById('nav-bridge')?.addEventListener('click', () => this.showView('bridge'));
        document.getElementById('nav-funding')?.addEventListener('click', () => this.showView('funding'));

        // Wallet management
        document.getElementById('create-wallet-btn')?.addEventListener('click', () => this.createWallet());
        document.getElementById('import-wallet-btn')?.addEventListener('click', () => this.importWallet());

        // Trading
        document.getElementById('execute-trade-btn')?.addEventListener('click', () => this.executeTrade());
        document.getElementById('get-quote-btn')?.addEventListener('click', () => this.getTradeQuote());

        // Bridge
        document.getElementById('execute-bridge-btn')?.addEventListener('click', () => this.executeBridge());
        document.getElementById('get-bridge-quote-btn')?.addEventListener('click', () => this.getBridgeQuote());

        // Funding
        document.getElementById('fund-wallet-btn')?.addEventListener('click', () => this.fundWallet());

        // Auto-refresh data
        setInterval(() => this.refreshData(), 30000); // Every 30 seconds
    }

    // View Management
    showView(viewName) {
        this.currentView = viewName;
        
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.style.display = 'none';
        });

        // Show selected view
        const view = document.getElementById(`${viewName}-view`);
        if (view) {
            view.style.display = 'block';
            this.refreshViewData(viewName);
        }

        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.getElementById(`nav-${viewName}`)?.classList.add('active');
    }

    // Dashboard Management
    async refreshDashboard() {
        try {
            // Get portfolio overview
            const portfolioData = await this.getPortfolioOverview();
            this.updatePortfolioDisplay(portfolioData);

            // Get trading performance
            const tradingMetrics = this.productionTradingEngine.getPerformanceMetrics();
            this.updateTradingMetricsDisplay(tradingMetrics);

            // Get recent activity
            const recentActivity = await this.getRecentActivity();
            this.updateActivityDisplay(recentActivity);

        } catch (error) {
            console.error('Dashboard refresh error:', error);
            this.showNotification('Failed to refresh dashboard', 'error');
        }
    }

    async getPortfolioOverview() {
        const overview = {
            totalValue: 0,
            wallets: [],
            topTokens: [],
            chainDistribution: {}
        };

        // Get data for all wallets
        const wallets = await this.multiWalletManager.getAllWallets();
        
        for (const wallet of wallets) {
            const walletData = {
                id: wallet.id,
                address: wallet.address,
                chains: {}
            };

            // Get balances across all chains
            for (const chainId of [1, 56, 137, 42161]) {
                const chainValue = await this.multiWalletManager.getWalletValue(wallet.id, chainId);
                walletData.chains[chainId] = chainValue;
                overview.totalValue += chainValue;
                
                overview.chainDistribution[chainId] = (overview.chainDistribution[chainId] || 0) + chainValue;
            }

            overview.wallets.push(walletData);
        }

        return overview;
    }

    // Wallet Management
    async createWallet() {
        try {
            const walletName = prompt('Enter wallet name:');
            if (!walletName) return;

            const result = await this.multiWalletManager.createWallet(walletName);
            if (result.success) {
                this.showNotification(`Wallet "${walletName}" created successfully`, 'success');
                this.refreshWalletsView();
            }
        } catch (error) {
            console.error('Wallet creation error:', error);
            this.showNotification('Failed to create wallet', 'error');
        }
    }

    async importWallet() {
        try {
            const privateKey = prompt('Enter private key:');
            if (!privateKey) return;

            const walletName = prompt('Enter wallet name:');
            if (!walletName) return;

            const result = await this.multiWalletManager.importWallet(privateKey, walletName);
            if (result.success) {
                this.showNotification(`Wallet "${walletName}" imported successfully`, 'success');
                this.refreshWalletsView();
            }
        } catch (error) {
            console.error('Wallet import error:', error);
            this.showNotification('Failed to import wallet', 'error');
        }
    }

    async refreshWalletsView() {
        try {
            const wallets = await this.multiWalletManager.getAllWallets();
            this.updateWalletsDisplay(wallets);

            // Update wallet selection dropdown
            this.updateWalletSelectionDropdown(wallets);

        } catch (error) {
            console.error('Wallets refresh error:', error);
        }
    }

    // Trading Management
    async getTradeQuote() {
        try {
            const fromToken = document.getElementById('from-token')?.value;
            const toToken = document.getElementById('to-token')?.value;
            const amount = document.getElementById('trade-amount')?.value;
            const walletId = this.selectedWallet;

            if (!fromToken || !toToken || !amount || !walletId) {
                this.showNotification('Please fill all trade fields', 'warning');
                return;
            }

            const provider = this.multiWalletManager.getProvider(this.selectedChain);
            const quote = await this.dexIntegration.getBestQuote(
                this.selectedChain,
                provider,
                fromToken,
                toToken,
                ethers.utils.parseUnits(amount, 18).toString()
            );

            this.displayTradeQuote(quote);

        } catch (error) {
            console.error('Quote error:', error);
            this.showNotification('Failed to get quote', 'error');
        }
    }

    async executeTrade() {
        try {
            const tradeParams = this.getTradeParams();
            if (!tradeParams) return;

            // Show confirmation dialog
            const confirmed = confirm(`Execute trade: ${tradeParams.amount} ${tradeParams.fromToken} → ${tradeParams.toToken}?`);
            if (!confirmed) return;

            this.showNotification('Executing trade...', 'info');

            const result = await this.productionTradingEngine.executeTrade(tradeParams);
            
            if (result.success) {
                this.showNotification(`Trade executed! TX: ${result.txHash}`, 'success');
                this.refreshTradingView();
            } else {
                this.showNotification(`Trade failed: ${result.error}`, 'error');
            }

        } catch (error) {
            console.error('Trade execution error:', error);
            this.showNotification('Trade execution failed', 'error');
        }
    }

    getTradeParams() {
        const fromToken = document.getElementById('from-token')?.value;
        const toToken = document.getElementById('to-token')?.value;
        const amount = document.getElementById('trade-amount')?.value;
        const slippage = document.getElementById('slippage')?.value || 1;

        if (!fromToken || !toToken || !amount || !this.selectedWallet) {
            this.showNotification('Please fill all required fields', 'warning');
            return null;
        }

        return {
            walletId: this.selectedWallet,
            chainId: this.selectedChain,
            fromToken,
            toToken,
            amount: ethers.utils.parseUnits(amount, 18).toString(),
            slippage: parseFloat(slippage)
        };
    }

    // Bridge Management
    async getBridgeQuote() {
        try {
            const token = document.getElementById('bridge-token')?.value;
            const fromChain = parseInt(document.getElementById('from-chain')?.value);
            const toChain = parseInt(document.getElementById('to-chain')?.value);
            const amount = document.getElementById('bridge-amount')?.value;

            if (!token || !fromChain || !toChain || !amount) {
                this.showNotification('Please fill all bridge fields', 'warning');
                return;
            }

            const quote = await this.crossChainBridge.getBridgeQuote(
                fromChain,
                toChain,
                token,
                ethers.utils.parseUnits(amount, 6).toString() // Assuming 6 decimals for stablecoins
            );

            this.displayBridgeQuote(quote);

        } catch (error) {
            console.error('Bridge quote error:', error);
            this.showNotification('Failed to get bridge quote', 'error');
        }
    }

    async executeBridge() {
        try {
            const bridgeParams = this.getBridgeParams();
            if (!bridgeParams) return;

            const confirmed = confirm(`Bridge ${bridgeParams.amount} ${bridgeParams.token} from chain ${bridgeParams.fromChain} to ${bridgeParams.toChain}?`);
            if (!confirmed) return;

            this.showNotification('Executing bridge...', 'info');

            const wallet = this.multiWalletManager.getWallet(this.selectedWallet);
            const provider = this.multiWalletManager.getProvider(bridgeParams.fromChain);

            const result = await this.crossChainBridge.executeBridge(wallet, provider, bridgeParams);
            
            if (result.success) {
                this.showNotification(`Bridge executed! TX: ${result.txHash}`, 'success');
                this.refreshBridgeView();
            } else {
                this.showNotification(`Bridge failed: ${result.error}`, 'error');
            }

        } catch (error) {
            console.error('Bridge execution error:', error);
            this.showNotification('Bridge execution failed', 'error');
        }
    }

    getBridgeParams() {
        const token = document.getElementById('bridge-token')?.value;
        const fromChain = parseInt(document.getElementById('from-chain')?.value);
        const toChain = parseInt(document.getElementById('to-chain')?.value);
        const amount = document.getElementById('bridge-amount')?.value;
        const bridge = document.getElementById('bridge-protocol')?.value || 'auto';

        if (!token || !fromChain || !toChain || !amount || !this.selectedWallet) {
            this.showNotification('Please fill all required fields', 'warning');
            return null;
        }

        return {
            fromChain,
            toChain,
            token,
            amount: ethers.utils.parseUnits(amount, 6).toString(),
            bridge
        };
    }

    // Funding Management
    async fundWallet() {
        try {
            const fundingParams = this.getFundingParams();
            if (!fundingParams) return;

            this.showNotification('Initiating funding...', 'info');

            const result = await this.fundingInterface.executeFunding(this.selectedWallet, fundingParams);
            
            if (result.success) {
                if (result.redirectUrl) {
                    window.open(result.redirectUrl, '_blank');
                }
                this.showNotification('Funding initiated successfully', 'success');
                this.displayFundingInstructions(result.instructions);
                this.refreshFundingView();
            } else {
                this.showNotification(`Funding failed: ${result.error}`, 'error');
            }

        } catch (error) {
            console.error('Funding error:', error);
            this.showNotification('Funding failed', 'error');
        }
    }

    getFundingParams() {
        const method = document.getElementById('funding-method')?.value;
        const token = document.getElementById('funding-token')?.value;
        const chain = parseInt(document.getElementById('funding-chain')?.value);
        const amount = parseFloat(document.getElementById('funding-amount')?.value);
        const paymentMethod = document.getElementById('payment-method')?.value;

        if (!method || !token || !chain || !amount || !this.selectedWallet) {
            this.showNotification('Please fill all required fields', 'warning');
            return null;
        }

        return {
            method,
            token,
            chain,
            amount,
            paymentMethod
        };
    }

    // Data Management
    async refreshData() {
        if (this.currentView === 'dashboard') {
            await this.refreshDashboard();
        }
    }

    async refreshViewData(viewName) {
        switch (viewName) {
            case 'dashboard':
                await this.refreshDashboard();
                break;
            case 'wallets':
                await this.refreshWalletsView();
                break;
            case 'trading':
                await this.refreshTradingView();
                break;
            case 'bridge':
                await this.refreshBridgeView();
                break;
            case 'funding':
                await this.refreshFundingView();
                break;
        }
    }

    async refreshTradingView() {
        try {
            const tradingState = this.productionTradingEngine.getTradingState();
            this.updateTradingStateDisplay(tradingState);

            // Update token dropdowns
            this.updateTokenDropdowns();

        } catch (error) {
            console.error('Trading view refresh error:', error);
        }
    }

    async refreshBridgeView() {
        try {
            const bridgeState = this.crossChainBridge.getBridgeState();
            this.updateBridgeStateDisplay(bridgeState);

        } catch (error) {
            console.error('Bridge view refresh error:', error);
        }
    }

    async refreshFundingView() {
        try {
            const fundingState = this.fundingInterface.getFundingState();
            this.updateFundingStateDisplay(fundingState);

        } catch (error) {
            console.error('Funding view refresh error:', error);
        }
    }

    // UI Update Methods
    updatePortfolioDisplay(portfolioData) {
        const container = document.getElementById('portfolio-overview');
        if (!container) return;

        container.innerHTML = `
            <div class="portfolio-summary">
                <h3>Total Portfolio Value</h3>
                <div class="total-value">$${portfolioData.totalValue.toFixed(2)}</div>
            </div>
            <div class="wallet-breakdown">
                ${portfolioData.wallets.map(wallet => `
                    <div class="wallet-item">
                        <strong>Wallet: ${wallet.id}</strong>
                        <div class="wallet-chains">
                            ${Object.entries(wallet.chains).map(([chain, value]) => `
                                <span>Chain ${chain}: $${value.toFixed(2)}</span>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    updateTradingMetricsDisplay(metrics) {
        const container = document.getElementById('trading-metrics');
        if (!container) return;

        container.innerHTML = `
            <div class="metrics-grid">
                <div class="metric">
                    <label>Success Rate</label>
                    <value>${metrics.successRate}%</value>
                </div>
                <div class="metric">
                    <label>Total Trades</label>
                    <value>${metrics.totalTrades}</value>
                </div>
                <div class="metric">
                    <label>Avg Slippage</label>
                    <value>${metrics.avgSlippageFormatted}%</value>
                </div>
                <div class="metric">
                    <label>Total Volume</label>
                    <value>${metrics.totalVolumeFormatted} ETH</value>
                </div>
            </div>
        `;
    }

    updateTokenDropdowns() {
        const tokens = this.tokenDatabase.getTopTokensByChain(this.selectedChain);
        const dropdowns = ['from-token', 'to-token', 'bridge-token', 'funding-token'];

        dropdowns.forEach(dropdownId => {
            const dropdown = document.getElementById(dropdownId);
            if (dropdown) {
                dropdown.innerHTML = tokens.map(token => 
                    `<option value="${token.address}">${token.symbol}</option>`
                ).join('');
            }
        });
    }

    displayTradeQuote(quote) {
        const container = document.getElementById('trade-quote');
        if (!container) return;

        const fromAmount = ethers.utils.formatUnits(quote.fromAmount, 18);
        const toAmount = ethers.utils.formatUnits(quote.toAmount, 18);

        container.innerHTML = `
            <div class="quote-display">
                <h4>Best Quote from ${quote.dex}</h4>
                <div class="quote-details">
                    <p>You pay: ${fromAmount} tokens</p>
                    <p>You receive: ${toAmount} tokens</p>
                    <p>Rate: 1 = ${(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)}</p>
                </div>
            </div>
        `;
    }

    displayBridgeQuote(quote) {
        const container = document.getElementById('bridge-quote');
        if (!container) return;

        container.innerHTML = `
            <div class="quote-display">
                <h4>Bridge Quote via ${quote.bridge}</h4>
                <div class="quote-details">
                    <p>Amount: ${ethers.utils.formatUnits(quote.amount, 6)} ${quote.token}</p>
                    <p>Expected Output: ${ethers.utils.formatUnits(quote.estimatedOutput, 6)} ${quote.token}</p>
                    <p>Fees: ${ethers.utils.formatEther(quote.fees)} ETH</p>
                    <p>Estimated Time: ${Math.floor(quote.estimatedTime / 60)} minutes</p>
                </div>
            </div>
        `;
    }

    displayFundingInstructions(instructions) {
        const container = document.getElementById('funding-instructions');
        if (!container) return;

        if (Array.isArray(instructions)) {
            container.innerHTML = `
                <div class="instructions">
                    <h4>Instructions</h4>
                    <ol>
                        ${instructions.map(instruction => `<li>${instruction}</li>`).join('')}
                    </ol>
                </div>
            `;
        } else {
            container.innerHTML = `<p>${instructions}</p>`;
        }
    }

    // Utility Methods
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // Add to page
        document.body.appendChild(notification);

        // Remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    async loadState() {
        try {
            // Load saved application state
            const savedState = localStorage.getItem('production-app-state');
            if (savedState) {
                const state = JSON.parse(savedState);
                this.selectedWallet = state.selectedWallet;
                this.selectedChain = state.selectedChain;
            }

            // Initialize with dashboard view
            this.showView('dashboard');

        } catch (error) {
            console.error('State loading error:', error);
        }
    }

    saveState() {
        try {
            const state = {
                selectedWallet: this.selectedWallet,
                selectedChain: this.selectedChain
            };
            localStorage.setItem('production-app-state', JSON.stringify(state));
        } catch (error) {
            console.error('State saving error:', error);
        }
    }

    async getRecentActivity() {
        // Combine recent trades, bridges, and fundings
        const tradingState = this.productionTradingEngine.getTradingState();
        const bridgeState = this.crossChainBridge.getBridgeState();
        const fundingState = this.fundingInterface.getFundingState();

        const activity = [
            ...tradingState.recentTrades.map(t => ({ ...t, type: 'trade' })),
            ...bridgeState.recentBridges.map(b => ({ ...b, type: 'bridge' })),
            ...fundingState.recentFundings.map(f => ({ ...f, type: 'funding' }))
        ];

        return activity.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
    }

    updateActivityDisplay(activities) {
        const container = document.getElementById('recent-activity');
        if (!container) return;

        container.innerHTML = `
            <h3>Recent Activity</h3>
            <div class="activity-list">
                ${activities.map(activity => `
                    <div class="activity-item ${activity.type}">
                        <span class="type">${activity.type.toUpperCase()}</span>
                        <span class="status ${activity.status}">${activity.status}</span>
                        <span class="time">${new Date(activity.timestamp).toLocaleString()}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productionApp = new ProductionApp();
});

// Auto-save state on page unload
window.addEventListener('beforeunload', () => {
    if (window.productionApp) {
        window.productionApp.saveState();
    }
});

export { ProductionApp };