import * as vscode from 'vscode';

export class VrlDiagnosticsProvider {
    private diagnosticCollection: vscode.DiagnosticCollection;

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('vrl');
    }

    public validateDocument(document: vscode.TextDocument): void {
        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i;

            // Skip empty lines and comments
            if (!line.trim() || line.trim().startsWith('#')) {
                continue;
            }

            // Check for syntax errors
            this.checkSyntaxErrors(line, lineNumber, diagnostics);
            
            // Check for semantic errors
            this.checkSemanticErrors(line, lineNumber, diagnostics);
            
            // Check for best practices
            this.checkBestPractices(line, lineNumber, diagnostics);
        }

        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    private checkSyntaxErrors(line: string, lineNumber: number, diagnostics: vscode.Diagnostic[]): void {
        const trimmedLine = line.trim();

        // Check for unmatched parentheses
        const openParens = (line.match(/\(/g) || []).length;
        const closeParens = (line.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(lineNumber, 0, lineNumber, line.length),
                'Unmatched parentheses',
                vscode.DiagnosticSeverity.Error
            );
            diagnostic.code = 'syntax-error';
            diagnostics.push(diagnostic);
        }

        // Check for unmatched braces
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) {
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(lineNumber, 0, lineNumber, line.length),
                'Unmatched braces',
                vscode.DiagnosticSeverity.Error
            );
            diagnostic.code = 'syntax-error';
            diagnostics.push(diagnostic);
        }

        // Check for unmatched brackets
        const openBrackets = (line.match(/\[/g) || []).length;
        const closeBrackets = (line.match(/\]/g) || []).length;
        if (openBrackets !== closeBrackets) {
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(lineNumber, 0, lineNumber, line.length),
                'Unmatched brackets',
                vscode.DiagnosticSeverity.Error
            );
            diagnostic.code = 'syntax-error';
            diagnostics.push(diagnostic);
        }

        // Check for invalid field paths
        const invalidFieldPath = /\.[^a-zA-Z_]/;
        if (invalidFieldPath.test(line)) {
            const match = line.match(invalidFieldPath);
            if (match) {
                const startPos = line.indexOf(match[0]);
                const diagnostic = new vscode.Diagnostic(
                    new vscode.Range(lineNumber, startPos, lineNumber, startPos + match[0].length),
                    'Invalid field path syntax',
                    vscode.DiagnosticSeverity.Error
                );
                diagnostic.code = 'invalid-field-path';
                diagnostics.push(diagnostic);
            }
        }
    }

    private checkSemanticErrors(line: string, lineNumber: number, diagnostics: vscode.Diagnostic[]): void {
        const fallibleFunctions = [
            'parse_json', 'parse_syslog', 'parse_regex', 'parse_key_value', 'parse_csv',
            'parse_timestamp', 'to_int', 'to_float', 'decode_base64', 'decode_percent'
        ];

        // Check for fallible functions without error handling
        for (const func of fallibleFunctions) {
            const funcPattern = new RegExp(`\\b${func}\\b`);
            if (funcPattern.test(line)) {
                const hasErrorHandling = line.includes('!') || line.includes('??');
                if (!hasErrorHandling) {
                    const startPos = line.indexOf(func);
                    const diagnostic = new vscode.Diagnostic(
                        new vscode.Range(lineNumber, startPos, lineNumber, startPos + func.length),
                        `Fallible function '${func}' requires error handling with '!' or '??'`,
                        vscode.DiagnosticSeverity.Error
                    );
                    diagnostic.code = 'missing-error-handling';
                    diagnostic.tags = [vscode.DiagnosticTag.Unnecessary];
                    diagnostics.push(diagnostic);
                }
            }
        }

        // Check for undefined functions
        const functionPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
        const knownFunctions = [
            'parse_json', 'parse_syslog', 'parse_regex', 'parse_key_value', 'parse_csv', 'parse_timestamp',
            'format_timestamp', 'to_string', 'to_int', 'to_float', 'to_bool', 'to_timestamp', 'to_unix_timestamp',
            'contains', 'starts_with', 'ends_with', 'match', 'replace', 'split', 'join', 'length',
            'upcase', 'downcase', 'strip_whitespace', 'strip_ansi_escape_codes',
            'encode_base64', 'decode_base64', 'encode_percent', 'decode_percent',
            'sha1', 'sha2', 'sha3', 'md5', 'hmac', 'uuid_v4', 'now', 'type',
            'is_string', 'is_int', 'is_float', 'is_bool', 'is_array', 'is_object', 'is_timestamp', 'is_null',
            'flatten', 'compact', 'sort', 'reverse', 'unique', 'merge', 'keys', 'values', 'has', 'get', 'set',
            'remove', 'push', 'pop', 'slice', 'chunks', 'map_keys', 'map_values', 'filter', 'find',
            'group_by', 'reduce', 'assert', 'exists', 'only_fields', 'log', 'del', 'abort'
        ];

        let match;
        while ((match = functionPattern.exec(line)) !== null) {
            const funcName = match[1];
            if (!knownFunctions.includes(funcName)) {
                const diagnostic = new vscode.Diagnostic(
                    new vscode.Range(lineNumber, match.index, lineNumber, match.index + funcName.length),
                    `Unknown function '${funcName}'`,
                    vscode.DiagnosticSeverity.Error
                );
                diagnostic.code = 'unknown-function';
                diagnostics.push(diagnostic);
            }
        }
    }

    private checkBestPractices(line: string, lineNumber: number, diagnostics: vscode.Diagnostic[]): void {
        // Warn about using del() on root fields
        if (line.includes('del(.)')) {
            const startPos = line.indexOf('del(.)');
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(lineNumber, startPos, lineNumber, startPos + 6),
                'Deleting the entire event (del(.)) will result in an empty event',
                vscode.DiagnosticSeverity.Warning
            );
            diagnostic.code = 'del-root-event';
            diagnostics.push(diagnostic);
        }

        // Suggest using null coalescing for better error handling
        const fallibleWithBang = /\b(parse_\w+|to_int|to_float|decode_\w+)!/;
        if (fallibleWithBang.test(line) && !line.includes('??')) {
            const match = line.match(fallibleWithBang);
            if (match) {
                const startPos = line.indexOf(match[0]);
                const diagnostic = new vscode.Diagnostic(
                    new vscode.Range(lineNumber, startPos, lineNumber, startPos + match[0].length),
                    'Consider using null coalescing (??) for more graceful error handling',
                    vscode.DiagnosticSeverity.Hint
                );
                diagnostic.code = 'suggest-null-coalescing';
                diagnostics.push(diagnostic);
            }
        }

        // Warn about potential performance issues with regex
        if (line.includes('parse_regex') && line.includes('.*')) {
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(lineNumber, 0, lineNumber, line.length),
                'Regex patterns with .* can be slow on large inputs',
                vscode.DiagnosticSeverity.Information
            );
            diagnostic.code = 'regex-performance';
            diagnostics.push(diagnostic);
        }

        // Suggest field validation
        const fieldAssignment = /\.\w+\s*=/;
        if (fieldAssignment.test(line) && !line.includes('is_')) {
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(lineNumber, 0, lineNumber, line.length),
                'Consider validating field types before assignment',
                vscode.DiagnosticSeverity.Hint
            );
            diagnostic.code = 'suggest-type-validation';
            diagnostics.push(diagnostic);
        }
    }

    public dispose(): void {
        this.diagnosticCollection.dispose();
    }
}