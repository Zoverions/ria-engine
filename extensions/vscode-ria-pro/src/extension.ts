import * as vscode from 'vscode';
import { RIAExtension } from './riaExtension';

let riaExtension: RIAExtension | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('RIA Cognitive Enhancer is activating...');
    
    try {
        riaExtension = new RIAExtension(context);
        
        // Auto-start if enabled in settings
        const config = vscode.workspace.getConfiguration('ria');
        if (config.get('enabled')) {
            // Delay auto-start to allow VS Code to fully load
            setTimeout(() => {
                if (riaExtension) {
                    vscode.commands.executeCommand('ria.start');
                }
            }, 2000);
        }
        
        console.log('RIA Cognitive Enhancer activated successfully');
        
    } catch (error) {
        console.error('Failed to activate RIA extension:', error);
        vscode.window.showErrorMessage(`RIA activation failed: ${error}`);
    }
}

export function deactivate() {
    console.log('RIA Cognitive Enhancer is deactivating...');
    
    if (riaExtension) {
        riaExtension.dispose();
        riaExtension = undefined;
    }
    
    console.log('RIA Cognitive Enhancer deactivated');
}