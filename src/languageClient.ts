import * as vscode from 'vscode';

export class VrlLanguageClient {
    constructor(private context: vscode.ExtensionContext) {}

    public start(): void {
        // Simple client-side extension, no language server needed
        console.log('[VRL] Language client started (client-side only)');
    }

    public stop(): Thenable<void> | undefined {
        console.log('[VRL] Language client stopped');
        return Promise.resolve();
    }

    public getClient(): undefined {
        return undefined;
    }
}
