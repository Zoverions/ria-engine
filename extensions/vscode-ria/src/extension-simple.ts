/**
 * Simple VS Code RIA Extension - Demonstrates core RIA integration
 */

// Simple event emitter implementation
class SimpleEventEmitter {
    private listeners: { [event: string]: Function[] } = {};

    on(event: string, listener: Function) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(listener);
    }

    emit(event: string, ...args: any[]) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(listener => listener(...args));
        }
    }
}

// Mock VS Code API for demonstration
const vscode = {
    window: {
        showInformationMessage: (msg: string, ...options: string[]) => {
            console.log(`VS Code Info: ${msg}`, options);
            return Promise.resolve(options[0]);
        },
        showErrorMessage: (msg: string) => {
            console.log(`VS Code Error: ${msg}`);
        },
        createStatusBarItem: () => ({
            text: '',
            tooltip: '',
            show: () => console.log('Status bar item shown'),
            hide: () => console.log('Status bar item hidden'),
            dispose: () => console.log('Status bar item disposed')
        }),
        activeTextEditor: {
            document: {
                languageId: 'typescript',
                fileName: 'test.ts',
                lineCount: 150
            },
            selection: { active: { line: 50 } }
        }
    },
    workspace: {
        getConfiguration: (section: string) => ({
            get: (key: string) => true
        })
    },
    commands: {
        registerCommand: (command: string, handler: Function) => {
            console.log(`Registered command: ${command}`);
            return { dispose: () => {} };
        }
    }
};

class RIAVSCodeExtension extends SimpleEventEmitter {
    private isActive = false;
    private currentFI = 0.3;
    private statusBarItem: any;
    private activityMonitor: any;

    async activate() {
        console.log('🧠 RIA VS Code Extension activating...');

        // Create status bar item
        this.statusBarItem = vscode.window.createStatusBarItem();
        this.statusBarItem.text = '$(pulse) RIA: Optimal';
        this.statusBarItem.tooltip = 'RIA Cognitive Enhancement Status';
        this.statusBarItem.show();

        // Register commands
        vscode.commands.registerCommand('ria.enable', () => this.enable());
        vscode.commands.registerCommand('ria.disable', () => this.disable());
        vscode.commands.registerCommand('ria.showStatus', () => this.showStatus());

        // Start cognitive monitoring
        this.startCognitiveMonitoring();

        this.isActive = true;
        console.log('✅ RIA VS Code Extension activated');
    }

    private startCognitiveMonitoring() {
        let sessionTime = 0;
        
        this.activityMonitor = setInterval(() => {
            sessionTime += 1000;
            
            // Simulate cognitive load calculation
            this.currentFI = this.calculateCognitiveLoad(sessionTime);
            
            // Update status bar
            this.updateStatusBar();
            
            // Check for interventions
            this.checkInterventions();
            
        }, 1000);
    }

    private calculateCognitiveLoad(sessionTime: number): number {
        const editor = vscode.window.activeTextEditor;
        let load = 0.2; // Base load

        if (editor) {
            // File complexity
            if (editor.document.lineCount > 200) load += 0.2;
            if (editor.document.lineCount > 500) load += 0.3;

            // Language complexity
            if (['typescript', 'javascript'].includes(editor.document.languageId)) {
                load += 0.15;
            }

            // Session fatigue
            if (sessionTime > 3600000) load += 0.2; // 1 hour
            if (sessionTime > 7200000) load += 0.3; // 2 hours
        }

        // Add some realistic variation
        load += (Math.random() - 0.5) * 0.1;

        return Math.max(0, Math.min(1, load));
    }

    private updateStatusBar() {
        const mode = this.currentFI > 0.8 ? 'Critical' : 
                    this.currentFI > 0.6 ? 'High Load' : 
                    this.currentFI > 0.4 ? 'Moderate' : 'Optimal';
        
        const icon = this.currentFI > 0.8 ? '$(alert)' : 
                    this.currentFI > 0.6 ? '$(warning)' : '$(pulse)';

        this.statusBarItem.text = `${icon} RIA: ${mode}`;
        this.statusBarItem.tooltip = `Fracture Index: ${this.currentFI.toFixed(2)}`;
    }

    private checkInterventions() {
        // Generative Intervention (FI 0.6-0.8)
        if (this.currentFI > 0.6 && this.currentFI < 0.8) {
            this.triggerGenerativeIntervention();
        }

        // Critical Intervention (FI > 0.8)
        if (this.currentFI > 0.8) {
            this.triggerCriticalIntervention();
        }
    }

    private triggerGenerativeIntervention() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const language = editor.document.languageId;
        const help = this.getContextualHelp(language);

        vscode.window.showInformationMessage(
            `💡 ${help.title}: ${help.description}`,
            'Show Example',
            'Dismiss'
        ).then(selection => {
            if (selection === 'Show Example' && help.example) {
                vscode.window.showInformationMessage(`Example: ${help.example}`);
            }
        });

        console.log(`🧠 Generative intervention triggered for ${language}`);
    }

    private getContextualHelp(language: string) {
        const helpDatabase: { [key: string]: any } = {
            typescript: {
                title: 'TypeScript Optimization',
                description: 'Use interfaces and type guards for better type safety',
                example: 'interface User { id: number; name: string; }'
            },
            javascript: {
                title: 'Modern JavaScript',
                description: 'Use destructuring and arrow functions',
                example: 'const { name, age } = user;'
            },
            python: {
                title: 'Python Best Practices',
                description: 'Use list comprehensions for better performance',
                example: 'result = [x for x in data if x.valid]'
            }
        };

        return helpDatabase[language] || {
            title: 'Code Quality',
            description: 'Keep functions small and focused',
            example: 'Split large functions into smaller, reusable components'
        };
    }

    private triggerCriticalIntervention() {
        vscode.window.showErrorMessage(
            '🚨 High cognitive load detected! Consider taking a break.',
            'Take Break',
            'Continue'
        ).then(selection => {
            if (selection === 'Take Break') {
                console.log('User chose to take a break');
            }
        });

        console.log(`🚨 Critical intervention triggered (FI: ${this.currentFI.toFixed(2)})`);
    }

    private enable() {
        this.isActive = true;
        vscode.window.showInformationMessage('RIA Cognitive Enhancement enabled');
        console.log('✅ RIA enabled');
    }

    private disable() {
        this.isActive = false;
        vscode.window.showInformationMessage('RIA Cognitive Enhancement disabled');
        console.log('❌ RIA disabled');
    }

    private showStatus() {
        const status = {
            enabled: this.isActive,
            fractureIndex: this.currentFI,
            mode: this.currentFI > 0.8 ? 'Critical' : 
                  this.currentFI > 0.6 ? 'High Load' : 
                  this.currentFI > 0.4 ? 'Moderate' : 'Optimal'
        };

        vscode.window.showInformationMessage(
            `RIA Status: ${status.mode} (FI: ${status.fractureIndex.toFixed(2)})`
        );

        console.log('📊 RIA Status:', status);
    }

    deactivate() {
        if (this.activityMonitor) {
            clearInterval(this.activityMonitor);
        }
        this.statusBarItem?.dispose();
        console.log('🧠 RIA VS Code Extension deactivated');
    }
}

// Export for VS Code extension system
function activate(context: any) {
    const riaExtension = new RIAVSCodeExtension();
    riaExtension.activate();
    
    context.subscriptions.push({
        dispose: () => riaExtension.deactivate()
    });
}

function deactivate() {
    console.log('Extension deactivated');
}

// Demo simulation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { activate, deactivate };
}

// Run demo if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    console.log('🧠 VS Code RIA Extension Demo');
    console.log('===============================\n');

    const extension = new RIAVSCodeExtension();
    extension.activate();

    // Simulate some activity
    setTimeout(() => {
        console.log('\n📝 Simulating development session...');
        extension.showStatus();
    }, 2000);

    setTimeout(() => {
        extension.deactivate();
    }, 5000);
}