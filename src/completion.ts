import * as vscode from 'vscode';

export class VrlCompletionProvider implements vscode.CompletionItemProvider {
    
    private readonly functions = [
        // Parsing functions
        'parse_json', 'parse_syslog', 'parse_regex', 'parse_key_value', 'parse_csv', 'parse_timestamp',
        // Conversion functions
        'to_string', 'to_int', 'to_float', 'to_bool', 'to_timestamp', 'to_unix_timestamp',
        // String functions
        'contains', 'starts_with', 'ends_with', 'match', 'replace', 'split', 'join', 'length',
        'upcase', 'downcase', 'strip_whitespace', 'strip_ansi_escape_codes',
        // Encoding functions
        'encode_base64', 'decode_base64', 'encode_percent', 'decode_percent',
        // Hash functions
        'sha1', 'sha2', 'sha3', 'md5', 'hmac',
        // Utility functions
        'uuid_v4', 'now', 'type', 'assert', 'exists',
        // Type checking functions
        'is_string', 'is_int', 'is_float', 'is_bool', 'is_array', 'is_object', 'is_timestamp', 'is_null',
        // Array/Object functions
        'flatten', 'compact', 'sort', 'reverse', 'unique', 'merge', 'keys', 'values', 'has', 'get', 'set', 'remove',
        'push', 'pop', 'slice', 'chunks', 'map_keys', 'map_values', 'filter', 'find', 'group_by', 'reduce',
        // Field manipulation
        'only_fields', 'del',
        // Control flow
        'log', 'abort'
    ];

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
        const completionItems: vscode.CompletionItem[] = [];

        // Function completions
        for (const func of this.functions) {
            const item = new vscode.CompletionItem(func, vscode.CompletionItemKind.Function);
            item.detail = this.getFunctionDetail(func);
            item.documentation = this.getFunctionDocumentation(func);
            
            // Add snippet for functions with common parameters
            item.insertText = this.getFunctionSnippet(func);
            
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

        // Path completions (for field access)
        if (linePrefix.endsWith('.')) {
            const pathCompletions = this.getPathCompletions(document, position);
            completionItems.push(...pathCompletions);
        }

        return completionItems;
    }

    private getFunctionDetail(func: string): string {
        const details: { [key: string]: string } = {
            'parse_json': '(field: string) -> object',
            'parse_syslog': '(message: string) -> object',
            'parse_regex': '(field: string, pattern: regex) -> object',
            'to_string': '(value: any) -> string',
            'to_int': '(value: any) -> int',
            'contains': '(text: string, substring: string) -> bool',
            'upcase': '(text: string) -> string',
            'downcase': '(text: string) -> string',
            'length': '(value: string|array|object) -> int',
            'now': '() -> timestamp',
            'uuid_v4': '() -> string',
            'del': '(path: path) -> void',
            'log': '(message: string, level?: string) -> void'
        };
        return details[func] || `${func}(...) -> any`;
    }

    private getFunctionDocumentation(func: string): vscode.MarkdownString {
        const docs: { [key: string]: string } = {
            'parse_json': 'Parses a JSON string into an object. This function is fallible and requires error handling.',
            'parse_syslog': 'Parses a syslog message according to RFC 3164 and RFC 5424 standards.',
            'parse_regex': 'Parses a field using a regular expression pattern and returns captured groups.',
            'to_string': 'Converts a value to its string representation.',
            'contains': 'Checks if a string contains a substring.',
            'upcase': 'Converts a string to uppercase.',
            'downcase': 'Converts a string to lowercase.',
            'length': 'Returns the length of a string, array, or object.',
            'now': 'Returns the current timestamp.',
            'uuid_v4': 'Generates a random UUID v4.',
            'del': 'Deletes a field from the event.',
            'log': 'Logs a message at the specified level.'
        };
        
        const markdown = new vscode.MarkdownString();
        markdown.appendMarkdown(docs[func] || `VRL function: ${func}`);
        return markdown;
    }

    private getFunctionSnippet(func: string): vscode.SnippetString {
        const snippets: { [key: string]: string } = {
            'parse_json': 'parse_json!(.${1:field})',
            'parse_syslog': 'parse_syslog!(.${1:message})',
            'parse_regex': 'parse_regex!(.${1:field}, r\'${2:pattern}\')',
            'parse_key_value': 'parse_key_value!(.${1:field})',
            'parse_timestamp': 'parse_timestamp!(.${1:field}, "${2:%Y-%m-%d %H:%M:%S}")',
            'format_timestamp': 'format_timestamp!(.${1:timestamp}, "${2:%Y-%m-%d %H:%M:%S}")',
            'to_string': 'to_string(.${1:value})',
            'to_int': 'to_int(.${1:value})',
            'to_float': 'to_float(.${1:value})',
            'contains': 'contains(.${1:text}, "${2:substring}")',
            'starts_with': 'starts_with(.${1:text}, "${2:prefix}")',
            'ends_with': 'ends_with(.${1:text}, "${2:suffix}")',
            'replace': 'replace(.${1:text}, "${2:pattern}", "${3:replacement}")',
            'split': 'split(.${1:text}, "${2:delimiter}")',
            'join': 'join!(.${1:array}, "${2:separator}")',
            'upcase': 'upcase(.${1:text})',
            'downcase': 'downcase(.${1:text})',
            'strip_whitespace': 'strip_whitespace(.${1:text})',
            'encode_base64': 'encode_base64(.${1:value})',
            'decode_base64': 'decode_base64!(.${1:encoded})',
            'sha2': 'sha2(.${1:value})',
            'uuid_v4': 'uuid_v4()',
            'now': 'now()',
            'del': 'del(.${1:field})',
            'log': 'log("${1:message}", level: "${2:info}")',
            'if': 'if ${1:condition} {\n\t${2}\n}'
        };

        return new vscode.SnippetString(snippets[func] || `${func}($1)`);
    }

    private getPathCompletions(document: vscode.TextDocument, position: vscode.Position): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];
        
        // Common field names in observability data
        const commonFields = [
            'message', 'timestamp', 'level', 'host', 'source', 'service', 
            'kubernetes', 'docker', 'metadata', 'labels', 'tags',
            'user', 'method', 'path', 'status', 'duration', 'error',
            'pod_name', 'namespace', 'container_name', 'node_name'
        ];

        for (const field of commonFields) {
            const item = new vscode.CompletionItem(field, vscode.CompletionItemKind.Field);
            item.detail = `Event field: ${field}`;
            completions.push(item);
        }

        // Analyze the current document for field references
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
}