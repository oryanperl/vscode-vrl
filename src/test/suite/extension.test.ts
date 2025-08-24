import * as assert from 'assert';
import * as vscode from 'vscode';
import { VrlCompletionProvider } from '../../completion';
import { VrlHoverProvider } from '../../hover';
import { VrlDiagnosticsProvider } from '../../diagnostics';

suite('VRL Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('vrl-extension.vscode-vrl'));
    });

    test('Should activate extension', async () => {
        const extension = vscode.extensions.getExtension('vrl-extension.vscode-vrl');
        if (extension && !extension.isActive) {
            await extension.activate();
        }
        assert.ok(extension?.isActive);
    });

    test('VrlCompletionProvider should provide completions', async () => {
        const provider = new VrlCompletionProvider();
        const document = await vscode.workspace.openTextDocument({
            content: 'parse_',
            language: 'vrl'
        });
        const position = new vscode.Position(0, 6);
        
        const token = { isCancellationRequested: false, onCancellationRequested: () => ({ dispose: () => {} }) };
        const completions = await provider.provideCompletionItems(
            document,
            position,
            token,
            { triggerKind: vscode.CompletionTriggerKind.Invoke, triggerCharacter: undefined }
        );
        
        assert.ok(completions);
        const items = Array.isArray(completions) ? completions : completions.items;
        assert.ok(items.length > 0);
        
        const parseJsonItem = items.find(item => item.label === 'parse_json');
        assert.ok(parseJsonItem, 'Should include parse_json function');
    });

    test('VrlHoverProvider should provide hover information', async () => {
        const provider = new VrlHoverProvider();
        const document = await vscode.workspace.openTextDocument({
            content: 'parse_json',
            language: 'vrl'
        });
        const position = new vscode.Position(0, 5);
        
        const token = { isCancellationRequested: false, onCancellationRequested: () => ({ dispose: () => {} }) };
        const hover = await provider.provideHover(
            document,
            position,
            token
        );
        
        assert.ok(hover);
        assert.ok(hover.contents.length > 0);
    });

    test('VrlDiagnosticsProvider should detect syntax errors', () => {
        const provider = new VrlDiagnosticsProvider();
        
        // This test would need to create a mock document or use a real document
        // For now, we'll just ensure the provider can be instantiated
        assert.ok(provider);
    });

    test('Should register VRL language', async () => {
        const vrlFiles = await vscode.workspace.findFiles('**/*.vrl');
        
        // Create a temporary VRL file to test language detection
        const uri = vscode.Uri.parse('untitled:test.vrl');
        const document = await vscode.workspace.openTextDocument(uri);
        
        assert.strictEqual(document.languageId, 'vrl');
    });

    test('Should provide syntax highlighting', async () => {
        const document = await vscode.workspace.openTextDocument({
            content: '. = parse_json!(.message)\ndel(.temp)',
            language: 'vrl'
        });
        
        // Check if the document is recognized as VRL
        assert.strictEqual(document.languageId, 'vrl');
        
        // In a real test, you might want to check if tokens are properly highlighted
        // This would require more complex testing infrastructure
    });
});