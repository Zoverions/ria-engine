/**
 * RIA Extension Manager - Core integration with RIA Engine v2.1
 */

import { EventEmitter } from 'events';
import * as vscode from 'vscode';
import { ConfigurationManager } from './config/configurationManager';

export interface RIAStatus {
    enabled: boolean;
    mode: string;
    fi: number;
    interventions: number;
}

export interface RIAIntervention {
    type: string;
    content?: any;
    value?: any;
    duration?: number;
    priority: number;
}

export interface RIAInsight {
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
    timestamp: number;
}

export class RIAExtensionManager extends EventEmitter {
    private context: vscode.ExtensionContext;
    private configManager: ConfigurationManager;
    private riaEngine: any; // Will be RIAEngine instance
    private isActive: boolean = false;
    private currentFI: number = 0;
    private lastActivity: number = Date.now();
    private activityMonitor: NodeJS.Timeout | undefined;
    
    constructor(context: vscode.ExtensionContext, configManager: ConfigurationManager) {
        super();
        this.context = context;
        this.configManager = configManager;
    }

    async initialize(): Promise<void> {
        try {
            // Initialize mock RIA Engine (in production, this would import the actual RIA Engine)
            this.riaEngine = new MockRIAEngine();
            await this.riaEngine.initialize();

            // Set up activity monitoring
            this.startActivityMonitoring();

            this.isActive = true;
            this.emit('statusChanged', this.getStatus());

        } catch (error) {
            throw new Error(`Failed to initialize RIA Engine: ${error}`);
        }
    }

    private startActivityMonitoring(): void {
        this.activityMonitor = setInterval(() => {
            this.analyzeCurrentContext();
        }, 1000); // Analyze every second
    }

    private analyzeCurrentContext(): void {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) return;

        const document = activeEditor.document;
        const context = {
            language: document.languageId,
            fileName: document.fileName,
            lineCount: document.lineCount,
            currentLine: activeEditor.selection.active.line,
            timeSinceLastActivity: Date.now() - this.lastActivity
        };

        // Calculate cognitive load based on context
        const cognitiveLoad = this.calculateCognitiveLoad(context);
        this.currentFI = cognitiveLoad;

        // Check for interventions
        if (cognitiveLoad > 0.6) {
            this.triggerGenerativeIntervention(context);
        }

        if (cognitiveLoad > 0.8) {
            this.triggerUIIntervention(cognitiveLoad);
        }
    }

    private calculateCognitiveLoad(context: any): number {
        let load = 0.3; // Base load

        // Increase load based on file complexity
        if (context.lineCount > 500) load += 0.2;
        if (context.lineCount > 1000) load += 0.2;

        // Increase load based on language complexity
        const complexLanguages = ['typescript', 'javascript', 'python', 'java', 'cpp'];
        if (complexLanguages.includes(context.language)) load += 0.1;

        // Increase load based on inactivity (context switching indicator)
        if (context.timeSinceLastActivity > 30000) load += 0.3; // 30 seconds

        return Math.min(load, 1.0);
    }

    private triggerGenerativeIntervention(context: any): void {
        if (!this.configManager.get('generative.enabled')) return;

        const intervention: RIAIntervention = {
            type: 'generative_intervention',
            content: this.getContextualHelp(context),
            priority: 1
        };

        this.emit('interventionTriggered', intervention);
    }

    private getContextualHelp(context: any): any {
        const helpDatabase: { [key: string]: any } = {
            typescript: {
                title: 'TypeScript Best Practices',
                description: 'Use strong typing and interfaces for better code maintainability',
                examples: ['interface User { id: number; name: string; }'],
                relatedConcepts: ['interfaces', 'generics', 'type guards']
            },
            javascript: {
                title: 'Modern JavaScript',
                description: 'Use ES6+ features for cleaner, more readable code',
                examples: ['const users = data.map(user => ({ ...user, active: true }))'],
                relatedConcepts: ['arrow functions', 'destructuring', 'spread operator']
            },
            python: {
                title: 'Python Optimization',
                description: 'Use list comprehensions and built-in functions for better performance',
                examples: ['result = [x for x in data if x.is_valid()]'],
                relatedConcepts: ['comprehensions', 'generators', 'decorators']
            }
        };

        return helpDatabase[context.language] || {
            title: 'Code Organization',
            description: 'Keep functions small and focused on a single responsibility',
            examples: [],
            relatedConcepts: ['clean code', 'SOLID principles']
        };
    }

    private triggerUIIntervention(cognitiveLoad: number): void {
        if (!this.configManager.get('ui.opacityDamping')) return;

        const intervention: RIAIntervention = {
            type: 'ui_opacity_damping',
            value: 1 - (cognitiveLoad - 0.5) * 2, // Scale opacity from 1 to 0
            priority: 2
        };

        this.emit('interventionTriggered', intervention);
    }

    onEditorChanged(): void {
        this.lastActivity = Date.now();
    }

    onDocumentChanged(event: any): void {
        this.lastActivity = Date.now();
    }

    onSelectionChanged(event: any): void {
        this.lastActivity = Date.now();
    }

    updateConfiguration(): void {
        // Configuration updated, refresh settings
        this.emit('statusChanged', this.getStatus());
    }

    getStatus(): RIAStatus {
        return {
            enabled: this.isActive,
            mode: this.currentFI > 0.8 ? 'High Load' : this.currentFI > 0.6 ? 'Moderate Load' : 'Optimal',
            fi: this.currentFI,
            interventions: 0 // Would track actual interventions
        };
    }

    async exportSessionData(): Promise<string> {
        return JSON.stringify({
            timestamp: new Date().toISOString(),
            session: this.getStatus(),
            configuration: this.configManager.getAll()
        }, null, 2);
    }

    dispose(): void {
        if (this.activityMonitor) {
            clearInterval(this.activityMonitor);
        }
        this.removeAllListeners();
    }
}

// Mock RIA Engine for demonstration
class MockRIAEngine {
    async initialize(): Promise<void> {
        console.log('Mock RIA Engine initialized');
    }
}