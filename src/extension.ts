import * as vscode from 'vscode';
import { VrlLanguageClient } from './languageClient';
import { VrlCommandProvider } from './commands';
import { VrlDiagnosticsProvider } from './diagnostics';
import { VrlCompletionProvider } from './completion';
import { VrlHoverProvider } from './hover';

let client: VrlLanguageClient;

export function activate(context: vscode.ExtensionContext) {
    console.log('VRL extension is being activated');

    client = new VrlLanguageClient(context);
    
    const commandProvider = new VrlCommandProvider();
    const diagnosticsProvider = new VrlDiagnosticsProvider();
    const completionProvider = new VrlCompletionProvider();
    const hoverProvider = new VrlHoverProvider();

    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            { scheme: 'file', language: 'vrl' },
            completionProvider,
            '.', '(', '!', ' ', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
        )
    );

    context.subscriptions.push(
        vscode.languages.registerHoverProvider(
            { scheme: 'file', language: 'vrl' },
            hoverProvider
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vrl.validateScript', () => {
            commandProvider.validateScript();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vrl.openPlayground', () => {
            commandProvider.openPlayground();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vrl.formatDocument', () => {
            commandProvider.formatDocument();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vrl.showVectorDocs', () => {
            commandProvider.showVectorDocs();
        })
    );

    client.start();

    vscode.workspace.textDocuments.forEach(document => {
        if (document.languageId === 'vrl') {
            diagnosticsProvider.validateDocument(document);
        }
    });

    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument((document) => {
            if (document.languageId === 'vrl') {
                diagnosticsProvider.validateDocument(document);
            }
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument((document) => {
            if (document.languageId === 'vrl') {
                diagnosticsProvider.validateDocument(document);
            }
        })
    );

    let timeout: NodeJS.Timeout | undefined;
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument((event) => {
            if (event.document.languageId === 'vrl') {
                if (timeout) {
                    clearTimeout(timeout);
                }
                timeout = setTimeout(() => {
                    diagnosticsProvider.validateDocument(event.document);
                }, 500);
            }
        })
    );

    vscode.window.showInformationMessage('VRL Language Support activated!');
}

export function deactivate(): Thenable<void> | undefined {
    console.log('VRL extension is being deactivated');
    if (!client) {
        return undefined;
    }
    return client.stop();
}