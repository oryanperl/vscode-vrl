import * as vscode from 'vscode';

export class VrlCommandProvider {
    
    public async validateScript(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'vrl') {
            vscode.window.showWarningMessage('Please open a VRL file to validate');
            return;
        }

        const document = editor.document;
        const text = document.getText();
        
        if (text.trim().length === 0) {
            vscode.window.showWarningMessage('Document is empty');
            return;
        }

        try {
            const errors = this.performBasicValidation(text);
            
            if (errors.length === 0) {
                vscode.window.showInformationMessage('✅ VRL script is valid!');
            } else {
                const errorMessage = `❌ Found ${errors.length} validation error(s):\n${errors.join('\n')}`;
                vscode.window.showErrorMessage(errorMessage);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Validation failed: ${error}`);
        }
    }

    public async openPlayground(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        const config = vscode.workspace.getConfiguration('vrl');
        const playgroundUrl = config.get<string>('playground.url', 'https://playground.vrl.dev/');
        
        if (editor && editor.document.languageId === 'vrl') {
            const selection = editor.selection;
            const text = selection.isEmpty 
                ? editor.document.getText() 
                : editor.document.getText(selection);
            
            if (text.trim()) {
                const encodedScript = encodeURIComponent(text);
                const fullUrl = `${playgroundUrl}?script=${encodedScript}`;
                vscode.env.openExternal(vscode.Uri.parse(fullUrl));
            } else {
                vscode.env.openExternal(vscode.Uri.parse(playgroundUrl));
            }
        } else {
            vscode.env.openExternal(vscode.Uri.parse(playgroundUrl));
        }
    }

    public async formatDocument(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'vrl') {
            vscode.window.showWarningMessage('Please open a VRL file to format');
            return;
        }

        const document = editor.document;
        const text = document.getText();
        
        try {
            const formattedText = this.formatVrlCode(text);
            
            if (formattedText !== text) {
                const edit = new vscode.WorkspaceEdit();
                const range = new vscode.Range(
                    document.positionAt(0),
                    document.positionAt(text.length)
                );
                edit.replace(document.uri, range, formattedText);
                
                await vscode.workspace.applyEdit(edit);
                vscode.window.showInformationMessage('Document formatted successfully');
            } else {
                vscode.window.showInformationMessage('Document is already formatted');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Formatting failed: ${error}`);
        }
    }

    public async showVectorDocs(): Promise<void> {
        const docsUrl = 'https://vector.dev/docs/reference/vrl/';
        vscode.env.openExternal(vscode.Uri.parse(docsUrl));
    }

    private performBasicValidation(text: string): string[] {
        const errors: string[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNumber = i + 1;

            if (!line || line.startsWith('#')) {
                continue;
            }

            const openParens = (line.match(/\(/g) || []).length;
            const closeParens = (line.match(/\)/g) || []).length;
            if (openParens !== closeParens) {
                errors.push(`Line ${lineNumber}: Unmatched parentheses`);
            }

            const openBraces = (line.match(/\{/g) || []).length;
            const closeBraces = (line.match(/\}/g) || []).length;
            if (openBraces !== closeBraces) {
                errors.push(`Line ${lineNumber}: Unmatched braces`);
            }

            const openBrackets = (line.match(/\[/g) || []).length;
            const closeBrackets = (line.match(/\]/g) || []).length;
            if (openBrackets !== closeBrackets) {
                errors.push(`Line ${lineNumber}: Unmatched brackets`);
            }

            if (line.includes('parse_') && !line.includes('!')) {
                if (!line.includes('??')) {
                    errors.push(`Line ${lineNumber}: Parse functions should use '!' or null coalescing '??'`);
                }
            }
        }

        return errors;
    }

    private formatVrlCode(text: string): string {
        const lines = text.split('\n');
        const formattedLines: string[] = [];
        let indentLevel = 0;
        const indentSize = 2;

        for (const line of lines) {
            const trimmed = line.trim();
            
            if (!trimmed) {
                formattedLines.push('');
                continue;
            }

            if (trimmed.startsWith('}')) {
                indentLevel = Math.max(0, indentLevel - 1);
            }

            const indent = ' '.repeat(indentLevel * indentSize);
            formattedLines.push(indent + trimmed);

            if (trimmed.endsWith('{') || trimmed.includes('if ') && !trimmed.endsWith('}')) {
                indentLevel++;
            }
        }

        return formattedLines.join('\n');
    }
}