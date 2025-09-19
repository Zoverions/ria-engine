import * as vscode from 'vscode';
import { RIAEngineAdapter } from './riaEngineAdapter';
import { CognitiveStatusProvider } from './cognitiveStatusProvider';
import { InterventionManager } from './interventionManager';
import { BiometricCollector } from './biometricCollector';

/**
 * VS Code Extension for RIA Engine v2.1
 * 
 * Provides real-time cognitive load monitoring, context-aware assistance,
 * and adaptive UI modifications within the VS Code environment.
 */
export class RIAExtension {
    private riaEngine: RIAEngineAdapter;
    private statusProvider: CognitiveStatusProvider;
    private interventionManager: InterventionManager;
    private biometricCollector: BiometricCollector;
    private statusBar: vscode.StatusBarItem;
    private isActive = false;
    private disposables: vscode.Disposable[] = [];

    constructor(private context: vscode.ExtensionContext) {
        this.riaEngine = new RIAEngineAdapter();
        this.statusProvider = new CognitiveStatusProvider();
        this.interventionManager = new InterventionManager(context);
        this.biometricCollector = new BiometricCollector();
        
        this.createStatusBar();
        this.registerCommands();
        this.setupEventListeners();
    }

    private createStatusBar() {
        this.statusBar = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right, 
            100
        );
        this.statusBar.command = 'ria.showStatus';
        this.statusBar.text = '🧠 RIA: Inactive';
        this.statusBar.tooltip = 'RIA Cognitive Enhancer - Click for details';
        this.statusBar.show();
        this.disposables.push(this.statusBar);
    }

    private registerCommands() {
        const commands = [
            vscode.commands.registerCommand('ria.start', () => this.startRIA()),
            vscode.commands.registerCommand('ria.stop', () => this.stopRIA()),
            vscode.commands.registerCommand('ria.showStatus', () => this.showStatus()),
            vscode.commands.registerCommand('ria.settings', () => this.openSettings()),
            vscode.commands.registerCommand('ria.focusMode', () => this.enterFocusMode()),
            vscode.commands.registerCommand('ria.resetLearning', () => this.resetLearning())
        ];

        this.disposables.push(...commands);
    }

    private setupEventListeners() {
        // Document change events for cognitive load analysis
        vscode.workspace.onDidChangeTextDocument((event) => {
            if (this.isActive) {
                this.analyzeTextChange(event);
            }
        }, null, this.disposables);

        // Window focus events for attention tracking
        vscode.window.onDidChangeWindowState((state) => {
            if (this.isActive) {
                this.handleWindowStateChange(state);
            }
        }, null, this.disposables);

        // Active editor changes for context analysis
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (this.isActive && editor) {
                this.analyzeEditorContext(editor);
            }
        }, null, this.disposables);

        // Configuration changes
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('ria')) {
                this.updateConfiguration();
            }
        }, null, this.disposables);
    }

    async startRIA() {
        try {
            await this.riaEngine.initialize();
            await this.biometricCollector.start();
            
            this.isActive = true;
            this.statusBar.text = '🧠 RIA: Active';
            this.statusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
            
            // Set context for when clause
            vscode.commands.executeCommand('setContext', 'ria.running', true);
            
            // Start cognitive monitoring
            this.startCognitiveMonitoring();
            
            vscode.window.showInformationMessage(
                'RIA Cognitive Enhancer activated! 🧠',
                'View Status'
            ).then(selection => {
                if (selection === 'View Status') {
                    this.showStatus();
                }
            });

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to start RIA: ${error}`);
        }
    }

    async stopRIA() {
        try {
            await this.riaEngine.stop();
            await this.biometricCollector.stop();
            
            this.isActive = false;
            this.statusBar.text = '🧠 RIA: Inactive';
            this.statusBar.backgroundColor = undefined;
            
            vscode.commands.executeCommand('setContext', 'ria.running', false);
            
            vscode.window.showInformationMessage('RIA Cognitive Enhancer deactivated');

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to stop RIA: ${error}`);
        }
    }

    private async analyzeTextChange(event: vscode.TextDocumentChangeEvent) {
        const document = event.document;
        const changes = event.contentChanges;
        
        // Calculate cognitive load metrics
        const complexity = this.calculateCodeComplexity(document);
        const changeVelocity = this.calculateChangeVelocity(changes);
        const contextSwitching = this.detectContextSwitching(document);
        
        // Send data to RIA Engine
        const cognitiveData = {
            timestamp: Date.now(),
            document: {
                languageId: document.languageId,
                lineCount: document.lineCount,
                wordCount: this.countWords(document.getText())
            },
            complexity,
            changeVelocity,
            contextSwitching,
            context: {
                domain: this.getDomainFromLanguage(document.languageId),
                task: this.inferTaskFromChanges(changes),
                currentFile: document.fileName,
                activity: 'coding'
            }
        };

        const result = await this.riaEngine.processFrame(cognitiveData);
        
        // Apply interventions if needed
        if (result.interventions.length > 0) {
            this.interventionManager.applyInterventions(result.interventions);
        }
        
        // Update status
        this.updateStatus(result);
    }

    private calculateCodeComplexity(document: vscode.TextDocument): number {
        const text = document.getText();
        let complexity = 0;
        
        // Count various complexity indicators
        complexity += (text.match(/\bif\b/g) || []).length * 0.1;
        complexity += (text.match(/\bfor\b|\bwhile\b/g) || []).length * 0.15;
        complexity += (text.match(/\bswitch\b/g) || []).length * 0.2;
        complexity += (text.match(/\btry\b|\bcatch\b/g) || []).length * 0.1;
        complexity += (text.match(/\bfunction\b|\bclass\b/g) || []).length * 0.05;
        
        // Normalize to 0-1 range
        return Math.min(1, complexity / 10);
    }

    private calculateChangeVelocity(changes: readonly vscode.TextDocumentContentChangeEvent[]): number {
        const totalChanges = changes.reduce((sum, change) => sum + change.text.length, 0);
        const timeWindow = 5000; // 5 seconds
        
        // Store in rolling window and calculate velocity
        // This is a simplified implementation
        return Math.min(1, totalChanges / 100);
    }

    private detectContextSwitching(document: vscode.TextDocument): number {
        // Simplified context switching detection
        // In a real implementation, this would track file switches, tab changes, etc.
        return 0.3; // Placeholder
    }

    private countWords(text: string): number {
        return text.split(/\s+/).filter(word => word.length > 0).length;
    }

    private getDomainFromLanguage(languageId: string): string {
        const domainMap: { [key: string]: string } = {
            'javascript': 'javascript',
            'typescript': 'javascript',
            'python': 'python',
            'java': 'java',
            'csharp': 'csharp',
            'html': 'web',
            'css': 'web',
            'json': 'config'
        };
        
        return domainMap[languageId] || 'general';
    }

    private inferTaskFromChanges(changes: readonly vscode.TextDocumentContentChangeEvent[]): string {
        const totalText = changes.map(c => c.text).join(' ');
        
        if (totalText.includes('debug') || totalText.includes('console.log')) {
            return 'debugging';
        }
        if (totalText.includes('function') || totalText.includes('class')) {
            return 'implementing new functionality';
        }
        if (totalText.includes('test') || totalText.includes('expect')) {
            return 'testing';
        }
        
        return 'coding';
    }

    private handleWindowStateChange(state: vscode.WindowState) {
        const attentionData = {
            focused: state.focused,
            timestamp: Date.now()
        };
        
        this.riaEngine.updateAttention(attentionData);
    }

    private analyzeEditorContext(editor: vscode.TextEditor) {
        const document = editor.document;
        const selection = editor.selection;
        
        const contextData = {
            languageId: document.languageId,
            fileName: document.fileName,
            lineNumber: selection.start.line,
            selectionLength: document.getText(selection).length,
            timestamp: Date.now()
        };
        
        this.riaEngine.updateContext(contextData);
    }

    private startCognitiveMonitoring() {
        // Start periodic monitoring
        const monitoringInterval = setInterval(async () => {
            if (!this.isActive) {
                clearInterval(monitoringInterval);
                return;
            }
            
            // Collect biometric data
            const biometricData = await this.biometricCollector.collect();
            
            // Send to RIA Engine
            if (biometricData) {
                await this.riaEngine.processBiometrics(biometricData);
            }
            
        }, 1000); // Monitor every second
        
        // Store interval for cleanup
        this.disposables.push({
            dispose: () => clearInterval(monitoringInterval)
        });
    }

    private updateStatus(result: any) {
        const fi = result.personalizedResult?.fi || 0;
        
        let statusText = '🧠 RIA: ';
        let statusColor: vscode.ThemeColor | undefined;
        
        if (fi < 0.3) {
            statusText += 'Flow';
            statusColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
        } else if (fi < 0.6) {
            statusText += 'Focused';
            statusColor = undefined;
        } else if (fi < 0.8) {
            statusText += 'Elevated';
            statusColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        } else {
            statusText += 'Overload';
            statusColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        }
        
        statusText += ` (${(fi * 100).toFixed(0)}%)`;
        
        this.statusBar.text = statusText;
        this.statusBar.backgroundColor = statusColor;
    }

    private async showStatus() {
        const status = await this.riaEngine.getStatus();
        const enhancements = status.enhancements || {};
        
        const statusMessage = `
RIA Cognitive Enhancer Status:

🧠 Generative Interventions: ${enhancements.generative?.enabled ? 'Active' : 'Inactive'}
🎵 Multi-Sensory Resonance: ${enhancements.resonance?.enabled ? 'Active' : 'Inactive'}  
🧬 Antifragile Learning: ${enhancements.antifragile?.enabled ? 'Active' : 'Inactive'}

Current FI: ${status.currentFI?.toFixed(3) || 'N/A'}
Session Duration: ${Math.round((status.uptime || 0) / 1000)}s
Interventions Applied: ${status.totalInterventions || 0}
        `.trim();
        
        const action = await vscode.window.showInformationMessage(
            statusMessage,
            'Settings',
            'Focus Mode',
            'View Insights'
        );
        
        switch (action) {
            case 'Settings':
                this.openSettings();
                break;
            case 'Focus Mode':
                this.enterFocusMode();
                break;
            case 'View Insights':
                this.showInsights();
                break;
        }
    }

    private openSettings() {
        vscode.commands.executeCommand('workbench.action.openSettings', 'ria');
    }

    private async enterFocusMode() {
        // Apply focus mode interventions
        await vscode.commands.executeCommand('workbench.action.toggleSidebarVisibility');
        await vscode.commands.executeCommand('workbench.action.togglePanel');
        
        vscode.window.showInformationMessage(
            'Focus Mode activated! 🎯 Distractions minimized.',
            'Exit Focus Mode'
        ).then(selection => {
            if (selection === 'Exit Focus Mode') {
                vscode.commands.executeCommand('workbench.action.toggleSidebarVisibility');
                vscode.commands.executeCommand('workbench.action.togglePanel');
            }
        });
    }

    private async resetLearning() {
        const confirmation = await vscode.window.showWarningMessage(
            'Reset all learned patterns? This cannot be undone.',
            'Reset',
            'Cancel'
        );
        
        if (confirmation === 'Reset') {
            await this.riaEngine.resetLearning();
            vscode.window.showInformationMessage('Antifragile learning patterns reset');
        }
    }

    private showInsights() {
        // This would show detailed cognitive insights
        vscode.window.showInformationMessage('Cognitive insights panel coming soon!');
    }

    private updateConfiguration() {
        const config = vscode.workspace.getConfiguration('ria');
        this.riaEngine.updateConfig({
            generativeInterventions: config.get('generativeInterventions'),
            multiSensoryResonance: config.get('multiSensoryResonance'),
            antifraggileLearning: config.get('antifraggileLearning'),
            sensitivityLevel: config.get('sensitivityLevel'),
            interventionThreshold: config.get('interventionThreshold'),
            audioFeedback: config.get('audioFeedback'),
            debugMode: config.get('debugMode')
        });
    }

    dispose() {
        this.disposables.forEach(d => d.dispose());
        if (this.isActive) {
            this.stopRIA();
        }
    }
}