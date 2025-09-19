/**
 * Configuration Manager for VS Code RIA Extension
 */

import * as vscode from 'vscode';

export class ConfigurationManager {
    private readonly configSection = 'ria';

    get(key: string): any {
        const config = vscode.workspace.getConfiguration(this.configSection);
        return config.get(key);
    }

    set(key: string, value: any): Promise<void> {
        const config = vscode.workspace.getConfiguration(this.configSection);
        return config.update(key, value, vscode.ConfigurationTarget.Global);
    }

    getAll(): any {
        const config = vscode.workspace.getConfiguration(this.configSection);
        return {
            enabled: config.get('enabled'),
            biometric: {
                enabled: config.get('biometric.enabled')
            },
            generative: {
                enabled: config.get('generative.enabled')
            },
            resonance: {
                audioEnabled: config.get('resonance.audioEnabled'),
                hapticEnabled: config.get('resonance.hapticEnabled')
            },
            antifragile: {
                enabled: config.get('antifragile.enabled')
            },
            ui: {
                opacityDamping: config.get('ui.opacityDamping'),
                colorTemperature: config.get('ui.colorTemperature')
            },
            notifications: {
                priority: config.get('notifications.priority')
            },
            privacy: {
                dataCollection: config.get('privacy.dataCollection')
            },
            sensitivity: config.get('sensitivity')
        };
    }
}