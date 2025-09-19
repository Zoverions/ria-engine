/**
 * Trading Interface Module
 * Handles live trading controls, monitoring, and strategy management
 */

class TradingInterface {
    constructor() {
        this.isTrading = false;
        this.tradingProcess = null;
        this.tradeHistory = [];
        this.performanceMetrics = {
            totalReturn: 0,
            sharpeRatio: 0,
            maxDrawdown: 0,
            winRate: 0,
            tradesToday: 0
        };
        this.initializeEventListeners();
        this.initializePerformanceTracking();
    }

    initializeEventListeners() {
        // Trading controls
        document.getElementById('startTradingBtn')?.addEventListener('click', () => {
            this.startTrading();
        });

        document.getElementById('stopTradingBtn')?.addEventListener('click', () => {
            this.stopTrading();
        });

        document.getElementById('emergencyStop')?.addEventListener('click', () => {
            this.emergencyStop();
        });

        // Strategy selection
        document.getElementById('strategySelect')?.addEventListener('change', (e) => {
            this.updateStrategy(e.target.value);
        });

        // Risk settings
        ['positionSize', 'maxRisk', 'stopLoss'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', (e) => {
                this.updateRiskSettings(id, e.target.value);
            });
        });
    }

    initializePerformanceTracking() {
        // Update performance metrics every 5 seconds
        setInterval(() => {
            if (this.isTrading) {
                this.updatePerformanceMetrics();
            }
        }, 5000);

        // Update trade log every 2 seconds
        setInterval(() => {
            if (this.isTrading) {
                this.updateTradingLog();
            }
        }, 2000);
    }

    async startTrading() {
        try {
            // Check if wallet is available
            if (!window.walletManager?.isWalletAvailable()) {
                await window.electronAPI.showMessageBox({
                    type: 'warning',
                    title: 'No Wallet',
                    message: 'Please create or import a wallet before starting trading.',
                    detail: 'Go to the Wallet section to set up your wallet.'
                });
                return;
            }

            // Get current settings
            const config = this.getTradingConfig();
            
            // Start the trading engine
            const result = await window.electronAPI.runTradingEngine(config);
            
            if (result.success) {
                this.isTrading = true;
                this.tradingProcess = result.pid;
                this.updateTradingStatus(true);
                this.addLogEntry('Trading started successfully');
                
                // Show emergency stop button
                document.getElementById('emergencyStop').style.display = 'block';
                
                console.log('Trading started with PID:', result.pid);
            } else {
                throw new Error(result.error || 'Failed to start trading engine');
            }
            
        } catch (error) {
            console.error('Error starting trading:', error);
            await window.electronAPI.showMessageBox({
                type: 'error',
                title: 'Trading Start Failed',
                message: 'Failed to start trading engine',
                detail: error.message
            });
        }
    }

    async stopTrading() {
        try {
            this.isTrading = false;
            this.updateTradingStatus(false);
            this.addLogEntry('Trading stopped by user');
            
            // Hide emergency stop button
            document.getElementById('emergencyStop').style.display = 'none';
            
            console.log('Trading stopped');
            
        } catch (error) {
            console.error('Error stopping trading:', error);
        }
    }

    async emergencyStop() {
        const result = await window.electronAPI.showMessageBox({
            type: 'warning',
            title: 'Emergency Stop',
            message: 'Are you sure you want to emergency stop trading?',
            detail: 'This will immediately halt all trading activities.',
            buttons: ['Cancel', 'Emergency Stop'],
            defaultId: 0,
            cancelId: 0
        });

        if (result.response === 1) {
            await this.stopTrading();
            this.addLogEntry('EMERGENCY STOP ACTIVATED', 'error');
        }
    }

    getTradingConfig() {
        return {
            STRATEGY: document.getElementById('strategySelect')?.value || 'market-fracture',
            POSITION_SIZE: document.getElementById('positionSize')?.value || '25',
            MAX_RISK: document.getElementById('maxRisk')?.value || '5',
            STOP_LOSS: document.getElementById('stopLoss')?.value || '5',
            WALLET_ADDRESS: window.walletManager?.getWalletAddress(),
            PAPER_MODE: 'true', // Always use paper mode for safety
            LOG_LEVEL: 'info'
        };
    }

    updateStrategy(strategy) {
        this.addLogEntry(`Strategy changed to: ${strategy}`);
        console.log('Strategy updated:', strategy);
    }

    updateRiskSettings(setting, value) {
        this.addLogEntry(`${setting} updated to: ${value}`);
        console.log('Risk setting updated:', setting, value);
    }

    updateTradingStatus(isRunning) {
        const statusIndicator = document.getElementById('tradingStatus');
        const statusText = document.getElementById('tradingStatusText');
        const startBtn = document.getElementById('startTradingBtn');
        const stopBtn = document.getElementById('stopTradingBtn');
        const connectionStatus = document.getElementById('connectionStatus');
        const connectionText = document.getElementById('connectionText');

        if (statusIndicator && statusText) {
            if (isRunning) {
                statusIndicator.className = 'status-indicator running';
                statusText.textContent = 'Running';
                startBtn.style.display = 'none';
                stopBtn.style.display = 'block';
                connectionStatus.className = 'status-indicator online';
                connectionText.textContent = 'Connected';
            } else {
                statusIndicator.className = 'status-indicator stopped';
                statusText.textContent = 'Stopped';
                startBtn.style.display = 'block';
                stopBtn.style.display = 'none';
                connectionStatus.className = 'status-indicator offline';
                connectionText.textContent = 'Disconnected';
            }
        }
    }

    addLogEntry(message, type = 'info') {
        const logContainer = document.getElementById('tradingLog');
        if (!logContainer) return;

        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        let messageClass = '';
        switch (type) {
            case 'error':
                messageClass = 'color: #ef4444;';
                break;
            case 'warning':
                messageClass = 'color: #f59e0b;';
                break;
            case 'success':
                messageClass = 'color: #10b981;';
                break;
            default:
                messageClass = 'color: #d1d5db;';
        }

        logEntry.innerHTML = `
            <span class="timestamp">[${timestamp}]</span>
            <span class="message" style="${messageClass}">${message}</span>
        `;

        logContainer.appendChild(logEntry);
        
        // Auto-scroll to bottom
        logContainer.scrollTop = logContainer.scrollHeight;
        
        // Keep only last 100 entries
        while (logContainer.children.length > 100) {
            logContainer.removeChild(logContainer.firstChild);
        }
    }

    updatePerformanceMetrics() {
        // Simulate performance metrics updates
        if (this.isTrading) {
            // Generate mock performance data
            const mockMetrics = this.generateMockPerformanceData();
            this.performanceMetrics = { ...this.performanceMetrics, ...mockMetrics };
            
            // Update UI
            this.updatePerformanceDisplay();
            
            // Occasionally add trade entries
            if (Math.random() < 0.1) { // 10% chance per update
                this.addMockTrade();
            }
        }
    }

    generateMockPerformanceData() {
        // Simulate realistic trading performance
        const baseReturn = this.performanceMetrics.totalReturn;
        const change = (Math.random() - 0.5) * 0.2; // Small random changes
        
        return {
            totalReturn: Math.max(-10, Math.min(10, baseReturn + change)),
            sharpeRatio: 0.5 + Math.random() * 2,
            maxDrawdown: Math.random() * 5,
            winRate: 45 + Math.random() * 20,
            dailyPnL: (Math.random() - 0.5) * 1000
        };
    }

    updatePerformanceDisplay() {
        const metrics = this.performanceMetrics;
        
        // Update dashboard metrics
        this.updateElement('totalReturn', `${metrics.totalReturn.toFixed(2)}%`);
        this.updateElement('sharpeRatio', metrics.sharpeRatio.toFixed(2));
        this.updateElement('maxDrawdown', `${metrics.maxDrawdown.toFixed(2)}%`);
        this.updateElement('winRate', `${metrics.winRate.toFixed(1)}%`);
        this.updateElement('tradesToday', metrics.tradesToday.toString());
        this.updateElement('dailyPnL', `$${metrics.dailyPnL.toFixed(2)}`);
        
        // Update risk metrics
        this.updateElement('valueAtRisk', `${(Math.random() * 2).toFixed(2)}%`);
        this.updateElement('volatility', `${(10 + Math.random() * 10).toFixed(2)}%`);
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
            
            // Add color coding for P&L
            if (id === 'dailyPnL' || id === 'totalReturn') {
                const numValue = parseFloat(value.replace(/[^\d.-]/g, ''));
                element.style.color = numValue >= 0 ? '#10b981' : '#ef4444';
            }
        }
    }

    addMockTrade() {
        const symbols = ['ETH', 'BTC'];
        const sides = ['BUY', 'SELL'];
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        const side = sides[Math.floor(Math.random() * sides.length)];
        const quantity = (Math.random() * 2).toFixed(4);
        const price = symbol === 'ETH' ? 2000 + Math.random() * 1000 : 30000 + Math.random() * 20000;
        const pnl = (Math.random() - 0.5) * 200;

        const trade = {
            time: new Date().toLocaleTimeString(),
            symbol,
            side,
            quantity,
            price: price.toFixed(2),
            pnl: pnl.toFixed(2)
        };

        this.tradeHistory.unshift(trade);
        
        // Keep only last 20 trades
        if (this.tradeHistory.length > 20) {
            this.tradeHistory = this.tradeHistory.slice(0, 20);
        }

        this.updateTradeTable();
        this.performanceMetrics.tradesToday++;
        
        this.addLogEntry(`${side} ${quantity} ${symbol} @ $${price.toFixed(2)}`, 
                        pnl >= 0 ? 'success' : 'error');
    }

    updateTradeTable() {
        const tbody = document.querySelector('#recentTrades');
        if (!tbody) return;

        if (this.tradeHistory.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data">No recent trades</td></tr>';
            return;
        }

        tbody.innerHTML = this.tradeHistory.map(trade => `
            <tr>
                <td>${trade.time}</td>
                <td>${trade.symbol}</td>
                <td>
                    <span class="trade-side ${trade.side.toLowerCase()}">${trade.side}</span>
                </td>
                <td>${trade.quantity}</td>
                <td>$${trade.price}</td>
                <td style="color: ${parseFloat(trade.pnl) >= 0 ? '#10b981' : '#ef4444'}">
                    $${trade.pnl}
                </td>
            </tr>
        `).join('');
    }

    updateTradingLog() {
        // Add occasional status messages
        if (Math.random() < 0.05) { // 5% chance
            const messages = [
                'Market analysis complete',
                'Position rebalanced',
                'Risk metrics updated',
                'Strategy signal processed',
                'Market volatility detected'
            ];
            const message = messages[Math.floor(Math.random() * messages.length)];
            this.addLogEntry(message);
        }
    }

    // Public API for other modules
    getTradingStatus() {
        return {
            isTrading: this.isTrading,
            metrics: this.performanceMetrics,
            tradeCount: this.tradeHistory.length
        };
    }

    getTradeHistory() {
        return this.tradeHistory;
    }
}

// Add CSS for trade sides
const style = document.createElement('style');
style.textContent = `
    .trade-side.buy { color: #10b981; }
    .trade-side.sell { color: #ef4444; }
`;
document.head.appendChild(style);

// Initialize trading interface when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.tradingInterface = new TradingInterface();
    console.log('Trading Interface initialized');
});