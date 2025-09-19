/**
 * VS Code RIA Extension - Main Entry Point
 * 
 * Integrates RIA Engine v2.1 with Visual Studio Code for real-time cognitive enhancement.
 * Provides context-aware assistance, adaptive UI modifications, and biometric integration.
 */

import * as vscode from 'vscode';
import { RIAExtensionManager } from './riaExtensionManager';
import { CognitiveStatusProvider } from './providers/cognitiveStatusProvider';
import { InsightsTreeProvider } from './providers/insightsTreeProvider';
import { InterventionsTreeProvider } from './providers/interventionsTreeProvider';
import { StatusBarManager } from './ui/statusBarManager';
import { CommandManager } from './commands/commandManager';
import { ConfigurationManager } from './config/configurationManager';

export async function activate(context: vscode.ExtensionContext) {
    console.log('🧠 RIA Cognitive Enhancement extension activating...');

    try {
        // Initialize core managers
        const configManager = new ConfigurationManager();
        const riaManager = new RIAExtensionManager(context, configManager);
        const statusBarManager = new StatusBarManager();
        const commandManager = new CommandManager(riaManager, statusBarManager);

        // Initialize providers
        const cognitiveStatusProvider = new CognitiveStatusProvider(context.extensionUri, riaManager);
        const insightsTreeProvider = new InsightsTreeProvider(riaManager);
        const interventionsTreeProvider = new InterventionsTreeProvider(riaManager);

        // Register webview provider
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider('ria.cognitiveStatus', cognitiveStatusProvider)
        );

        // Register tree data providers
        context.subscriptions.push(
            vscode.window.registerTreeDataProvider('ria.insights', insightsTreeProvider),
            vscode.window.registerTreeDataProvider('ria.interventions', interventionsTreeProvider)
        );

        // Register commands
        context.subscriptions.push(
            vscode.commands.registerCommand('ria.enable', () => commandManager.enableRIA()),
            vscode.commands.registerCommand('ria.disable', () => commandManager.disableRIA()),
            vscode.commands.registerCommand('ria.showStatus', () => commandManager.showStatus()),
            vscode.commands.registerCommand('ria.openSettings', () => commandManager.openSettings()),
            vscode.commands.registerCommand('ria.exportData', () => commandManager.exportData()),
            vscode.commands.registerCommand('ria.showInsights', () => commandManager.showInsights())
        );

        // Initialize RIA Engine
        await riaManager.initialize();

        // Set up event listeners
        setupEventListeners(context, riaManager, statusBarManager, insightsTreeProvider, interventionsTreeProvider);

        // Update status bar
        statusBarManager.updateStatus(true, 'Active');

        console.log('✅ RIA Cognitive Enhancement extension activated successfully');

    } catch (error) {
        console.error('❌ Failed to activate RIA extension:', error);
        vscode.window.showErrorMessage(`RIA Extension activation failed: ${error.message}`);
    }
}

function setupEventListeners(
    context: vscode.ExtensionContext,
    riaManager: RIAExtensionManager,
    statusBarManager: StatusBarManager,
    insightsProvider: InsightsTreeProvider,
    interventionsProvider: InterventionsTreeProvider
) {
    // Listen for RIA events
    riaManager.on('statusChanged', (status) => {
        statusBarManager.updateStatus(status.enabled, status.mode);
    });

    riaManager.on('interventionTriggered', (intervention) => {
        interventionsProvider.refresh();
        handleIntervention(intervention);
    });

    riaManager.on('insightGenerated', (insight) => {
        insightsProvider.refresh();
    });

    // Listen for VS Code events
    vscode.window.onDidChangeActiveTextEditor(() => {
        riaManager.onEditorChanged();
    });

    vscode.workspace.onDidChangeTextDocument((event) => {
        riaManager.onDocumentChanged(event);
    });

    vscode.window.onDidChangeTextEditorSelection((event) => {
        riaManager.onSelectionChanged(event);
    });

    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('ria')) {
            riaManager.updateConfiguration();
        }
    });
}

async function handleIntervention(intervention: any) {
    switch (intervention.type) {
        case 'generative_intervention':
            await handleGenerativeIntervention(intervention);
            break;
        case 'ui_opacity_damping':
            await handleOpacityDamping(intervention);
            break;
        case 'color_temperature_adjustment':
            await handleColorTemperatureAdjustment(intervention);
            break;
        case 'notification_suppression':
            await handleNotificationSuppression(intervention);
            break;
        default:
            console.log('Unknown intervention type:', intervention.type);
    }
}

async function handleGenerativeIntervention(intervention: any) {
    const { content } = intervention;
    
    // Show contextual help as an information message with actions
    const actions = ['Show Details', 'Copy Example', 'Dismiss'];
    const selection = await vscode.window.showInformationMessage(
        `💡 ${content.title}: ${content.description}`,
        ...actions
    );

    switch (selection) {
        case 'Show Details':
            showDetailedHelp(content);
            break;
        case 'Copy Example':
            if (content.examples && content.examples.length > 0) {
                await vscode.env.clipboard.writeText(content.examples[0]);
                vscode.window.showInformationMessage('Example copied to clipboard');
            }
            break;
    }
}

async function showDetailedHelp(content: any) {
    const panel = vscode.window.createWebviewPanel(
        'riaHelp',
        `RIA Help: ${content.title}`,
        vscode.ViewColumn.Beside,
        { enableScripts: true }
    );

    panel.webview.html = getHelpWebviewContent(content);
}

function getHelpWebviewContent(content: any): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${content.title}</title>
            <style>
                body { 
                    font-family: var(--vscode-font-family); 
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    padding: 20px;
                    line-height: 1.6;
                }
                .header { border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 15px; }
                .section { margin: 20px 0; }
                .example { 
                    background-color: var(--vscode-textCodeBlock-background);
                    border: 1px solid var(--vscode-panel-border);
                    padding: 10px;
                    border-radius: 4px;
                    font-family: var(--vscode-editor-font-family);
                    margin: 10px 0;
                }
                .tag { 
                    background-color: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 0.9em;
                    margin-right: 5px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🧠 ${content.title}</h1>
                <p>${content.description}</p>
                ${content.complexity ? `<span class="tag">${content.complexity}</span>` : ''}
            </div>
            
            ${content.examples && content.examples.length > 0 ? `
                <div class="section">
                    <h3>Examples:</h3>
                    ${content.examples.map(example => `<div class="example">${example}</div>`).join('')}
                </div>
            ` : ''}
            
            ${content.relatedConcepts && content.relatedConcepts.length > 0 ? `
                <div class="section">
                    <h3>Related Concepts:</h3>
                    <p>${content.relatedConcepts.map(concept => `<span class="tag">${concept}</span>`).join('')}</p>
                </div>
            ` : ''}
            
            ${content.shortcuts && content.shortcuts.length > 0 ? `
                <div class="section">
                    <h3>Shortcuts:</h3>
                    ${content.shortcuts.map(shortcut => `<div class="example">${shortcut}</div>`).join('')}
                </div>
            ` : ''}
        </body>
        </html>
    `;
}

async function handleOpacityDamping(intervention: any) {
    // Apply opacity damping to non-essential UI elements
    const config = vscode.workspace.getConfiguration('ria');
    if (config.get('ui.opacityDamping')) {
        // This would require VS Code API extensions to modify UI opacity
        // For now, we'll simulate with workspace-level changes
        console.log('Applied opacity damping:', intervention.value);
    }
}

async function handleColorTemperatureAdjustment(intervention: any) {
    // Adjust color temperature based on cognitive state
    const config = vscode.workspace.getConfiguration('ria');
    if (config.get('ui.colorTemperature')) {
        // This would require theme modifications
        console.log('Adjusted color temperature:', intervention.value);
    }
}

async function handleNotificationSuppression(intervention: any) {
    // Suppress non-critical notifications during high cognitive load
    console.log('Suppressed notifications for:', intervention.duration, 'ms');
}

export function deactivate() {
    console.log('🧠 RIA Cognitive Enhancement extension deactivating...');
}