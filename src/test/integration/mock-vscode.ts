// Mock VSCode API for headless testing

// First, intercept require calls to 'vscode'
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function (id: string) {
    if (id === 'vscode') {
        return mockVscode;
    }
    return originalRequire.apply(this, arguments);
};

export const mockVscode = {
    DiagnosticSeverity: {
        Error: 0,
        Warning: 1,
        Information: 2,
        Hint: 3,
    },

    Diagnostic: class {
        constructor(
            public range: any,
            public message: string,
            public severity: number
        ) {}
        public code?: string;
        public relatedInformation?: any[];
    },

    Range: class {
        constructor(
            public start: { line: number; character: number },
            public end: { line: number; character: number }
        ) {}
    },

    Position: class {
        constructor(
            public line: number,
            public character: number
        ) {}
    },

    Location: class {
        constructor(
            public uri: any,
            public range: any
        ) {}
    },

    DiagnosticRelatedInformation: class {
        constructor(
            public location: any,
            public message: string
        ) {}
    },

    CodeAction: class {
        constructor(
            public title: string,
            public kind: any
        ) {}
        public edit?: any;
    },

    CodeActionKind: {
        QuickFix: 'quickfix',
    },

    WorkspaceEdit: class {
        replace(uri: any, range: any, text: string) {}
    },

    Uri: {
        file: (path: string) => ({ path, scheme: 'file' }),
    },

    languages: {
        createDiagnosticCollection: (name: string) => ({
            set: (uri: any, diagnostics: any[]) => {
                // Store diagnostics in a map for retrieval
                if (!mockVscode._diagnostics) {mockVscode._diagnostics = new Map();}
                mockVscode._diagnostics.set(uri.path || uri.toString(), diagnostics);
            },
            get: (uri: any) => {
                if (!mockVscode._diagnostics) {return [];}
                return mockVscode._diagnostics.get(uri.path || uri.toString()) || [];
            },
            clear: () => {
                if (mockVscode._diagnostics) {mockVscode._diagnostics.clear();}
            },
            dispose: () => {},
        }),
        getDiagnostics: (uri?: any) => {
            if (!mockVscode._diagnostics) {return [];}
            if (uri) {
                return mockVscode._diagnostics.get(uri.path || uri.toString()) || [];
            }
            return Array.from(mockVscode._diagnostics.entries());
        },
    },

    workspace: {
        openTextDocument: async (options: any) => {
            return {
                uri: { path: options.content ? 'untitled:test.vrl' : options.uri },
                languageId: 'vrl',
                getText: () => options.content || '',
                lineAt: (line: number) => ({
                    text: options.content?.split('\n')[line] || '',
                }),
                fileName: 'test.vrl',
            };
        },
    },

    // Internal storage for diagnostics
    _diagnostics: new Map(),
};

// Set up global mock
(global as any).vscode = mockVscode;
