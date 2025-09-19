/**
 * Backtesting Interface Module
 * Handles backtest configuration, execution, and results display
 */

class BacktestInterface {
    constructor() {
        this.isRunning = false;
        this.lastResults = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Run backtest button
        document.getElementById('runBacktestBtn')?.addEventListener('click', () => {
            this.runBacktest();
        });

        // Data source change
        document.getElementById('dataSource')?.addEventListener('change', (e) => {
            this.updateDataSourceOptions(e.target.value);
        });
    }

    updateDataSourceOptions(source) {
        // Update UI based on data source selection
        console.log('Data source changed to:', source);
    }

    async runBacktest() {
        if (this.isRunning) {
            await window.electronAPI.showMessageBox({
                type: 'info',
                title: 'Backtest Running',
                message: 'A backtest is already running. Please wait for it to complete.'
            });
            return;
        }

        try {
            this.isRunning = true;
            this.updateRunButton(true);
            this.showProgress('Initializing backtest...');

            // Get backtest configuration
            const config = this.getBacktestConfig();
            
            // Validate configuration
            if (!this.validateConfig(config)) {
                return;
            }

            this.showProgress('Running backtest analysis...');
            
            // Run the backtest
            const result = await window.electronAPI.runBacktest(config);
            
            if (result.success) {
                this.lastResults = this.parseBacktestOutput(result.output);
                this.displayResults(this.lastResults);
                this.showProgress('Backtest completed successfully!');
            } else {
                throw new Error(result.error || 'Backtest failed');
            }
            
        } catch (error) {
            console.error('Backtest error:', error);
            this.showError('Backtest failed: ' + error.message);
            
            await window.electronAPI.showMessageBox({
                type: 'error',
                title: 'Backtest Failed',
                message: 'The backtest could not be completed.',
                detail: error.message
            });
        } finally {
            this.isRunning = false;
            this.updateRunButton(false);
        }
    }

    getBacktestConfig() {
        return {
            CSV: '../ria-engine-v2/data/eth_extended.csv', // Use extended dataset
            SYMBOL: document.getElementById('backtestSymbol')?.value || 'ETH',
            TIMEFRAME: document.getElementById('backtestTimeframe')?.value || '1h',
            INITIAL_CAPITAL: document.getElementById('initialCapital')?.value || '100000',
            DATA_SOURCE: document.getElementById('dataSource')?.value || 'csv'
        };
    }

    validateConfig(config) {
        if (!config.INITIAL_CAPITAL || parseFloat(config.INITIAL_CAPITAL) <= 0) {
            this.showError('Please enter a valid initial capital amount.');
            return false;
        }
        return true;
    }

    updateRunButton(isRunning) {
        const button = document.getElementById('runBacktestBtn');
        if (button) {
            if (isRunning) {
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running...';
                button.disabled = true;
            } else {
                button.innerHTML = '<i class="fas fa-play"></i> Run Backtest';
                button.disabled = false;
            }
        }
    }

    showProgress(message) {
        const resultsContainer = document.getElementById('backtestResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="progress-container">
                    <div class="progress-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                    <div class="progress-message">${message}</div>
                </div>
            `;
        }
    }

    showError(message) {
        const resultsContainer = document.getElementById('backtestResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="error-container">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="error-message">${message}</div>
                </div>
            `;
        }
    }

    parseBacktestOutput(output) {
        // Parse the backtest output to extract metrics
        const lines = output.split('\n');
        const results = {
            totalReturn: '0.00%',
            maxDrawdown: '0.00%',
            sharpeRatio: '0.00',
            sortinoRatio: '0.00',
            calmarRatio: '0.00',
            winRate: '0.0%',
            profitFactor: '0.00',
            trades: 0,
            startBalance: '$0.00',
            endBalance: '$0.00',
            annualizedReturn: '0.00%',
            volatility: '0.00%',
            valueAtRisk: '0.00%',
            dataset: 'N/A'
        };

        // Extract key metrics from output
        lines.forEach(line => {
            if (line.includes('Total Return:')) {
                results.totalReturn = this.extractValue(line, '%');
            } else if (line.includes('Max Drawdown:') || line.includes('Max DD:')) {
                results.maxDrawdown = this.extractValue(line, '%');
            } else if (line.includes('Sharpe Ratio:') || line.includes('Sharpe:')) {
                results.sharpeRatio = this.extractValue(line);
            } else if (line.includes('Sortino Ratio:')) {
                results.sortinoRatio = this.extractValue(line);
            } else if (line.includes('Calmar Ratio:')) {
                results.calmarRatio = this.extractValue(line);
            } else if (line.includes('Win Rate:')) {
                results.winRate = this.extractValue(line, '%');
            } else if (line.includes('Profit Factor:')) {
                results.profitFactor = this.extractValue(line);
            } else if (line.includes('Start USDC:')) {
                results.startBalance = '$' + this.extractValue(line);
            } else if (line.includes('End USDC:')) {
                results.endBalance = '$' + this.extractValue(line);
            } else if (line.includes('Annualized Return:')) {
                results.annualizedReturn = this.extractValue(line, '%');
            } else if (line.includes('Annualized Vol:') || line.includes('Volatility:')) {
                results.volatility = this.extractValue(line, '%');
            } else if (line.includes('Value at Risk')) {
                results.valueAtRisk = this.extractValue(line, '%');
            } else if (line.includes('Dataset:') || line.includes('Loaded')) {
                const match = line.match(/(\d+)/);
                if (match) {
                    results.dataset = `${match[1]} candles`;
                }
            }
        });

        return results;
    }

    extractValue(line, suffix = '') {
        // Extract numeric value from a line like "Sharpe Ratio: 1.23"
        const parts = line.split(':');
        if (parts.length >= 2) {
            const value = parts[1].trim().replace(/[^\d.-]/g, '');
            return value + suffix;
        }
        return '0.00' + suffix;
    }

    displayResults(results) {
        const resultsContainer = document.getElementById('backtestResults');
        if (!resultsContainer) return;

        resultsContainer.innerHTML = `
            <div class="backtest-results">
                <div class="results-header">
                    <h4>Backtest Results</h4>
                    <div class="results-meta">
                        <span>Dataset: ${results.dataset}</span>
                        <span>Completed: ${new Date().toLocaleString()}</span>
                    </div>
                </div>
                
                <div class="results-grid">
                    <div class="results-section">
                        <h5>Performance Summary</h5>
                        <div class="metric-grid">
                            <div class="metric-item">
                                <span class="metric-label">Total Return</span>
                                <span class="metric-value ${this.getReturnClass(results.totalReturn)}">${results.totalReturn}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">Annualized Return</span>
                                <span class="metric-value">${results.annualizedReturn}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">Start Balance</span>
                                <span class="metric-value">${results.startBalance}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">End Balance</span>
                                <span class="metric-value">${results.endBalance}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="results-section">
                        <h5>Risk Metrics</h5>
                        <div class="metric-grid">
                            <div class="metric-item">
                                <span class="metric-label">Sharpe Ratio</span>
                                <span class="metric-value">${results.sharpeRatio}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">Sortino Ratio</span>
                                <span class="metric-value">${results.sortinoRatio}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">Max Drawdown</span>
                                <span class="metric-value">${results.maxDrawdown}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">Volatility</span>
                                <span class="metric-value">${results.volatility}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="results-section">
                        <h5>Trading Statistics</h5>
                        <div class="metric-grid">
                            <div class="metric-item">
                                <span class="metric-label">Win Rate</span>
                                <span class="metric-value">${results.winRate}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">Profit Factor</span>
                                <span class="metric-value">${results.profitFactor}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">Calmar Ratio</span>
                                <span class="metric-value">${results.calmarRatio}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">Value at Risk</span>
                                <span class="metric-value">${results.valueAtRisk}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="results-actions">
                    <button class="btn btn-primary" onclick="window.backtestInterface.exportResults()">
                        <i class="fas fa-download"></i>
                        Export Results
                    </button>
                    <button class="btn btn-secondary" onclick="window.backtestInterface.compareResults()">
                        <i class="fas fa-chart-bar"></i>
                        Compare Strategies
                    </button>
                </div>
            </div>
        `;
    }

    getReturnClass(returnValue) {
        const numValue = parseFloat(returnValue.replace('%', ''));
        return numValue >= 0 ? 'positive' : 'negative';
    }

    async exportResults() {
        if (!this.lastResults) {
            await window.electronAPI.showMessageBox({
                type: 'info',
                title: 'No Results',
                message: 'No backtest results to export. Run a backtest first.'
            });
            return;
        }

        try {
            const result = await window.electronAPI.showSaveDialog({
                title: 'Export Backtest Results',
                defaultPath: `backtest-results-${Date.now()}.json`,
                filters: [
                    { name: 'JSON Files', extensions: ['json'] },
                    { name: 'CSV Files', extensions: ['csv'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            });

            if (!result.canceled && result.filePath) {
                const exportData = {
                    timestamp: new Date().toISOString(),
                    config: this.getBacktestConfig(),
                    results: this.lastResults
                };

                console.log('Backtest results exported:', result.filePath);
                
                await window.electronAPI.showMessageBox({
                    type: 'info',
                    title: 'Export Complete',
                    message: 'Backtest results exported successfully!',
                    detail: `Saved to: ${result.filePath}`
                });
            }
        } catch (error) {
            console.error('Export error:', error);
            await window.electronAPI.showMessageBox({
                type: 'error',
                title: 'Export Failed',
                message: 'Failed to export results',
                detail: error.message
            });
        }
    }

    async compareResults() {
        await window.electronAPI.showMessageBox({
            type: 'info',
            title: 'Feature Coming Soon',
            message: 'Strategy comparison feature is coming soon!',
            detail: 'This will allow you to compare multiple backtest results side by side.'
        });
    }

    // Public API
    getLastResults() {
        return this.lastResults;
    }

    isBacktestRunning() {
        return this.isRunning;
    }
}

// Add CSS for backtest results
const style = document.createElement('style');
style.textContent = `
    .backtest-results {
        padding: 20px;
    }
    
    .results-header {
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid #334155;
    }
    
    .results-header h4 {
        margin-bottom: 8px;
        color: #60a5fa;
    }
    
    .results-meta {
        display: flex;
        gap: 20px;
        font-size: 12px;
        color: #94a3b8;
    }
    
    .results-grid {
        display: grid;
        gap: 24px;
        margin-bottom: 24px;
    }
    
    .results-section h5 {
        margin-bottom: 12px;
        color: #d1d5db;
        font-size: 14px;
        font-weight: 600;
    }
    
    .metric-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
    }
    
    .metric-item {
        background-color: #0f172a;
        padding: 12px;
        border-radius: 6px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .metric-label {
        color: #94a3b8;
        font-size: 12px;
    }
    
    .metric-value {
        font-weight: 600;
        color: #f1f5f9;
    }
    
    .metric-value.positive {
        color: #10b981;
    }
    
    .metric-value.negative {
        color: #ef4444;
    }
    
    .results-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        padding-top: 20px;
        border-top: 1px solid #334155;
    }
    
    .progress-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        gap: 16px;
    }
    
    .progress-spinner i {
        font-size: 32px;
        color: #3b82f6;
    }
    
    .progress-message {
        color: #d1d5db;
        font-size: 16px;
    }
    
    .error-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        gap: 16px;
    }
    
    .error-icon i {
        font-size: 32px;
        color: #ef4444;
    }
    
    .error-message {
        color: #ef4444;
        font-size: 16px;
        text-align: center;
    }
`;
document.head.appendChild(style);

// Initialize backtest interface when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.backtestInterface = new BacktestInterface();
    console.log('Backtest Interface initialized');
});