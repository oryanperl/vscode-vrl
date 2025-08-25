import * as vscode from 'vscode';
import { VRL_FUNCTIONS, VrlFunction, FALLIBLE_FUNCTIONS, getFunctionByName } from './vrlFunctions';

export class VrlCompletionProvider implements vscode.CompletionItemProvider {
    
    private readonly functions = Object.keys(VRL_FUNCTIONS);

    private readonly keywords = [
        'if', 'else', 'and', 'or', 'not', 'true', 'false', 'null', 'del', 'log', 'abort'
    ];

    private readonly types = [
        'string', 'int', 'float', 'bool', 'array', 'object', 'timestamp', 'null'
    ];

    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
        
        const linePrefix = document.lineAt(position).text.substr(0, position.character);
        const currentWord = this.getCurrentWord(document, position);
        const completionItems: vscode.CompletionItem[] = [];

        // Function completions
        for (const funcName of this.functions) {
            const func = getFunctionByName(funcName);
            if (!func) {
                continue;
            }
            
            if (context.triggerCharacter === '!' && !func.fallible) {
                continue;
            }
            
            const item = new vscode.CompletionItem(funcName, vscode.CompletionItemKind.Function);
            item.detail = this.getFunctionDetail(func);
            item.documentation = this.getFunctionDocumentation(func);
            
            item.insertText = this.getFunctionSnippet(func);
            
            if (linePrefix.endsWith('!') && func.fallible) {
                item.sortText = '0' + funcName;
            } else {
                item.sortText = '1' + funcName;
            }
            
            if (func.fallible) {
                item.command = {
                    command: 'editor.action.triggerSuggest',
                    title: 'Suggest error handling'
                };
            }
            
            completionItems.push(item);
        }

        // Keyword completions
        for (const keyword of this.keywords) {
            const item = new vscode.CompletionItem(keyword, vscode.CompletionItemKind.Keyword);
            completionItems.push(item);
        }

        // Type completions
        for (const type of this.types) {
            const item = new vscode.CompletionItem(type, vscode.CompletionItemKind.TypeParameter);
            completionItems.push(item);
        }

        if (linePrefix.endsWith('.')) {
            const pathCompletions = this.getPathCompletions(document, position);
            completionItems.push(...pathCompletions);
        }
        
        if (this.isAfterFallibleFunction(linePrefix)) {
            completionItems.push(...this.getErrorHandlingCompletions());
        }

        return completionItems;
    }

    private getFunctionDetail(func: VrlFunction): string {
        const params = func.parameters.map(p => 
            `${p.name}: ${p.type}${p.optional ? '?' : ''}`
        ).join(', ');
        const fallibleIndicator = func.fallible ? ' [FALLIBLE]' : '';
        return `(${params}) -> ${func.returnType}${fallibleIndicator}`;
    }

    private getFunctionDocumentation(func: VrlFunction): vscode.MarkdownString {
        const markdown = new vscode.MarkdownString();
        
        markdown.appendMarkdown(`**${func.name}** - ${func.description}`);
        
        markdown.appendMarkdown(`\n\n**Category:** ${func.category}`);
        
        if (func.fallible) {
            markdown.appendMarkdown('\n\n⚠️ **Fallible function** - Requires error handling with `!` (abort on error) or `??` (null coalescing)');
            markdown.appendMarkdown('\n\nUsage patterns:');
            markdown.appendMarkdown(`\n- \`${func.name}!(...args)\` - Abort on error`);
            markdown.appendMarkdown(`\n- \`${func.name}(...args) ?? default\` - Use default on error`);
            markdown.appendMarkdown(`\n- \`result, err = ${func.name}(...args)\` - Handle error explicitly`);
        }
        
        if (func.parameters.length > 0) {
            markdown.appendMarkdown('\n\n**Parameters:**');
            for (const param of func.parameters) {
                const optional = param.optional ? ' (optional)' : '';
                markdown.appendMarkdown(`\n- \`${param.name}: ${param.type}\`${optional}`);
            }
        }
        
        markdown.appendMarkdown(`\n\n**Returns:** \`${func.returnType}\``);
        
        if (func.example) {
            markdown.appendMarkdown(`\n\n**Example:**\n\`\`\`vrl\n${func.example}\n\`\`\``);
        }
        
        return markdown;
    }

    private getFunctionSnippet(func: VrlFunction): vscode.SnippetString {
        let snippet = func.name;
        
        if (func.fallible) {
            snippet += '!';
        }
        
        snippet += '(';
        
        if (func.parameters.length > 0) {
            const paramSnippets = func.parameters.map((param, index) => {
                const placeholder = index + 1;
                if (param.type.includes('string') && !param.name.includes('pattern') && !param.name.includes('regex')) {
                    if (param.name.startsWith('path') || param.name === 'field') {
                        return `.\${${placeholder}:${param.name}}`;
                    } else {
                        return `"\${${placeholder}:${param.name}}"`;
                    }
                } else if (param.type.includes('regex')) {
                    return `r"\${${placeholder}:${param.name}}"`;
                } else if (param.type.includes('path')) {
                    return `.\${${placeholder}:${param.name}}`;
                } else {
                    return `\${${placeholder}:${param.name}}`;
                }
            });
            snippet += paramSnippets.join(', ');
        }
        
        snippet += ')';
        
        return new vscode.SnippetString(snippet);
    }

    private getPathCompletions(document: vscode.TextDocument, position: vscode.Position): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];
        
        const commonFields = [
            'message', 'timestamp', 'level', 'source', 'type', 'status', 
            'data', 'config', 'info', 'content', 'value',
            'id', 'name', 'field', 'count', 'size', 'text'
        ];

        for (const field of commonFields) {
            const item = new vscode.CompletionItem(field, vscode.CompletionItemKind.Field);
            item.detail = `Event field: ${field}`;
            completions.push(item);
        }

        const text = document.getText();
        const fieldPattern = /\\.([a-zA-Z_][a-zA-Z0-9_]*)/g;
        const foundFields = new Set<string>();
        let match;

        while ((match = fieldPattern.exec(text)) !== null) {
            const fieldName = match[1];
            if (!commonFields.includes(fieldName)) {
                foundFields.add(fieldName);
            }
        }

        for (const field of foundFields) {
            const item = new vscode.CompletionItem(field, vscode.CompletionItemKind.Field);
            item.detail = `Referenced field: ${field}`;
            completions.push(item);
        }

        return completions;
    }
    
    private getCurrentWord(document: vscode.TextDocument, position: vscode.Position): string {
        const range = document.getWordRangeAtPosition(position);
        return range ? document.getText(range) : '';
    }
    
    private isAfterFallibleFunction(linePrefix: string): boolean {
        const fallibleFunctionPattern = new RegExp(`\\b(${FALLIBLE_FUNCTIONS.join('|')})\\s*\\(`); 
        return fallibleFunctionPattern.test(linePrefix) && !linePrefix.includes('!') && !linePrefix.includes('??');
    }
    
    private getErrorHandlingCompletions(): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];
        
        const errorPropItem = new vscode.CompletionItem('!', vscode.CompletionItemKind.Operator);
        errorPropItem.detail = 'Error propagation operator';
        errorPropItem.documentation = new vscode.MarkdownString(
            'Use `!` after fallible functions to abort the script on error.\n\n' +
            'Example: `parse_json!(.message)`'
        );
        errorPropItem.insertText = '!';
        completions.push(errorPropItem);
        
        const nullCoalesceItem = new vscode.CompletionItem('??', vscode.CompletionItemKind.Operator);
        nullCoalesceItem.detail = 'Null coalescing operator';
        nullCoalesceItem.documentation = new vscode.MarkdownString(
            'Use `??` to provide a default value when fallible functions fail.\n\n' +
            'Example: `parse_json(.message) ?? {"error": true}`'
        );
        nullCoalesceItem.insertText = ' ?? ${1:default_value}';
        completions.push(nullCoalesceItem);
        
        return completions;
    }
}