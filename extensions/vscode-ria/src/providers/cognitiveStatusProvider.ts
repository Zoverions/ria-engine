/**
 * Cognitive Status Webview Provider
 */

import * as vscode from 'vscode';
import { RIAExtensionManager } from '../riaExtensionManager';

export class CognitiveStatusProvider implements vscode.WebviewViewProvider {
    constructor(
        private readonly extensionUri: vscode.Uri,
        private riaManager: RIAExtensionManager
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken
    ) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };

        webviewView.webview.html = this.getWebviewContent();

        // Update webview when status changes
        this.riaManager.on('statusChanged', () => {
            webviewView.webview.postMessage({
                type: 'statusUpdate',
                data: this.riaManager.getStatus()
            });
        });
    }

    private getWebviewContent(): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                        padding: 20px;
                        margin: 0;
                    }
                    .status-card {
                        background-color: var(--vscode-panel-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 6px;
                        padding: 16px;
                        margin: 10px 0;
                    }
                    .metric {
                        display: flex;
                        justify-content: space-between;
                        margin: 8px 0;
                    }
                    .metric-label {
                        font-weight: 600;
                    }
                    .fi-gauge {
                        width: 100%;
                        height: 20px;
                        background-color: var(--vscode-progressBar-background);
                        border-radius: 10px;
                        overflow: hidden;
                        margin: 10px 0;
                    }
                    .fi-fill {
                        height: 100%;
                        background: linear-gradient(90deg, #00ff00, #ffff00, #ff0000);
                        transition: width 0.3s ease;
                        width: 30%;
                    }
                    .enhancement-status {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 10px;
                        margin: 15px 0;
                    }
                    .enhancement {
                        background-color: var(--vscode-input-background);
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 4px;
                        padding: 8px;
                        text-align: center;
                        font-size: 0.9em;
                    }
                    .active {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                    }
                </style>
            </head>
            <body>
                <div class="status-card">
                    <h3>🧠 Cognitive Status</h3>
                    <div class="metric">
                        <span class="metric-label">Fracture Index:</span>
                        <span id="fi-value">0.30</span>
                    </div>
                    <div class="fi-gauge">
                        <div class="fi-fill" id="fi-gauge"></div>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Mode:</span>
                        <span id="mode-value">Optimal</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Interventions:</span>
                        <span id="interventions-value">0</span>
                    </div>
                </div>

                <div class="status-card">
                    <h3>🚀 Enhancement Systems</h3>
                    <div class="enhancement-status">
                        <div class="enhancement active" id="generative-status">
                            🧠 Generative<br>Active
                        </div>
                        <div class="enhancement active" id="resonance-status">
                            🎵 Resonance<br>Active
                        </div>
                        <div class="enhancement active" id="antifragile-status">
                            🧬 Antifragile<br>Active
                        </div>
                        <div class="enhancement" id="biometric-status">
                            📊 Biometric<br>Inactive
                        </div>
                    </div>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    
                    window.addEventListener('message', event => {
                        const message = event.data;
                        if (message.type === 'statusUpdate') {
                            updateStatus(message.data);
                        }
                    });

                    function updateStatus(status) {
                        document.getElementById('fi-value').textContent = status.fi.toFixed(2);
                        document.getElementById('mode-value').textContent = status.mode;
                        document.getElementById('interventions-value').textContent = status.interventions;
                        
                        const gauge = document.getElementById('fi-gauge');
                        gauge.style.width = (status.fi * 100) + '%';
                    }
                </script>
            </body>
            </html>
        `;
    }
}