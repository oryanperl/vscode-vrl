import * as vscode from 'vscode';

export class VrlHoverProvider implements vscode.HoverProvider {
    
    private readonly functionDocs: { [key: string]: { signature: string; description: string; example?: string } } = {
        'parse_json': {
            signature: 'parse_json!(field: string) -> object',
            description: 'Parses a JSON string into an object. This is a fallible function that requires error handling.',
            example: '. = parse_json!(.message)'
        },
        'parse_syslog': {
            signature: 'parse_syslog!(message: string) -> object',
            description: 'Parses a syslog message according to RFC 3164 and RFC 5424 standards.',
            example: '. = parse_syslog!(.message)'
        },
        'parse_regex': {
            signature: 'parse_regex!(field: string, pattern: regex) -> object',
            description: 'Parses a field using a regular expression pattern and returns captured groups.',
            example: '. = parse_regex!(.message, r\'(?P<ip>\\\\d+\\\\.\\\\d+\\\\.\\\\d+\\\\.\\\\d+)\')'
        },
        'parse_key_value': {
            signature: 'parse_key_value!(field: string) -> object',
            description: 'Parses key-value pairs from a string.',
            example: '. = parse_key_value!(.message)'
        },
        'parse_timestamp': {
            signature: 'parse_timestamp!(field: string, format: string) -> timestamp',
            description: 'Parses a timestamp string using the specified format.',
            example: '.timestamp = parse_timestamp!(.time, "%Y-%m-%d %H:%M:%S")'
        },

        'to_string': {
            signature: 'to_string(value: any) -> string',
            description: 'Converts any value to its string representation.',
            example: '.string_value = to_string(.numeric_field)'
        },
        'contains': {
            signature: 'contains(text: string, substring: string) -> bool',
            description: 'Checks if a string contains the specified substring.',
            example: 'if contains(.message, "error") { .level = "error" }'
        },
        'starts_with': {
            signature: 'starts_with(text: string, prefix: string) -> bool',
            description: 'Checks if a string starts with the specified prefix.',
            example: 'if starts_with(.message, "ERROR") { .level = "error" }'
        },
        'upcase': {
            signature: 'upcase(text: string) -> string',
            description: 'Converts a string to uppercase.',
            example: '.upper_message = upcase(.message)'
        },
        'downcase': {
            signature: 'downcase(text: string) -> string',
            description: 'Converts a string to lowercase.',
            example: '.lower_message = downcase(.message)'
        },
        'strip_whitespace': {
            signature: 'strip_whitespace(text: string) -> string',
            description: 'Removes leading and trailing whitespace from a string.',
            example: '.trimmed = strip_whitespace(.message)'
        },

        'is_string': {
            signature: 'is_string(value: any) -> bool',
            description: 'Checks if a value is a string.',
            example: 'if is_string(.field) { .type = "string" }'
        },
        'is_int': {
            signature: 'is_int(value: any) -> bool',
            description: 'Checks if a value is an integer.',
            example: 'if is_int(.field) { .type = "integer" }'
        },
        'is_bool': {
            signature: 'is_bool(value: any) -> bool',
            description: 'Checks if a value is a boolean.',
            example: 'if is_bool(.field) { .type = "boolean" }'
        },

        'now': {
            signature: 'now() -> timestamp',
            description: 'Returns the current timestamp.',
            example: '.processed_at = now()'
        },
        'uuid_v4': {
            signature: 'uuid_v4() -> string',
            description: 'Generates a random UUID version 4.',
            example: '.id = uuid_v4()'
        },
        'length': {
            signature: 'length(value: string|array|object) -> int',
            description: 'Returns the length of a string, array, or object.',
            example: '.message_length = length(.message)'
        },

        'del': {
            signature: 'del(path: path) -> void',
            description: 'Deletes a field from the event.',
            example: 'del(.sensitive_field)'
        },
        'log': {
            signature: 'log(message: string, level?: string) -> void',
            description: 'Logs a message at the specified level (default: "info").',
            example: 'log("Processing event", level: "debug")'
        }
    };

    private readonly keywordDocs: { [key: string]: string } = {
        'if': 'Conditional statement for executing code blocks based on conditions.',
        'else': 'Alternative branch for if statements.',
        'and': 'Logical AND operator.',
        'or': 'Logical OR operator.',
        'not': 'Logical NOT operator.',
        'true': 'Boolean true literal.',
        'false': 'Boolean false literal.',
        'null': 'Null literal representing absence of value.',
        'del': 'Deletes a field from the event.',
        'log': 'Logs a message for debugging purposes.',
        'abort': 'Aborts processing and drops the event.'
    };

    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
        
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return;
        }

        const word = document.getText(wordRange);
        
        if (this.functionDocs[word]) {
            const func = this.functionDocs[word];
            const contents = new vscode.MarkdownString();
            
            contents.appendCodeblock(func.signature, 'vrl');
            contents.appendMarkdown(func.description);
            
            if (func.example) {
                contents.appendMarkdown('\\n\\n**Example:**');
                contents.appendCodeblock(func.example, 'vrl');
            }

            return new vscode.Hover(contents, wordRange);
        }

        if (this.keywordDocs[word]) {
            const contents = new vscode.MarkdownString();
            contents.appendMarkdown(`**${word}** - ${this.keywordDocs[word]}`);
            return new vscode.Hover(contents, wordRange);
        }

        const line = document.lineAt(position.line).text;
        const fieldMatch = line.match(/\\.([a-zA-Z_][a-zA-Z0-9_]*(?:\\.[a-zA-Z_][a-zA-Z0-9_]*)*)/);
        
        if (fieldMatch && fieldMatch[1].includes(word)) {
            const contents = new vscode.MarkdownString();
            contents.appendMarkdown(`**Field Path:** \`.${fieldMatch[1]}\``);
            contents.appendMarkdown('\\n\\nAccesses a field in the event data structure.');
            return new vscode.Hover(contents, wordRange);
        }

        const operatorDocs: { [key: string]: string } = {
            '!': 'Error propagation operator - unwraps fallible function results',
            '??': 'Null coalescing operator - provides default value for null/error',
            '==': 'Equality comparison operator',
            '!=': 'Inequality comparison operator',
            '&&': 'Logical AND operator',
            '||': 'Logical OR operator'
        };

        if (operatorDocs[word]) {
            const contents = new vscode.MarkdownString();
            contents.appendMarkdown(`**Operator:** \`${word}\``);
            contents.appendMarkdown(`\\n\\n${operatorDocs[word]}`);
            return new vscode.Hover(contents, wordRange);
        }

        return undefined;
    }
}