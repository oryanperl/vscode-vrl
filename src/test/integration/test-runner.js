// Test runner that mocks VSCode before loading any modules
const Module = require('module');
const originalRequire = Module.prototype.require;

// Mock VSCode API
const mockVscode = {
    DiagnosticSeverity: {
        Error: 0,
        Warning: 1,
        Information: 2,
        Hint: 3
    },
    
    Diagnostic: class {
        constructor(range, message, severity) {
            this.range = range;
            this.message = message;
            this.severity = severity;
        }
    },
    
    Range: class {
        constructor(start, end) {
            this.start = start;
            this.end = end;
        }
    },
    
    Position: class {
        constructor(line, character) {
            this.line = line;
            this.character = character;
        }
    },
    
    Location: class {
        constructor(uri, range) {
            this.uri = uri;
            this.range = range;
        }
    },
    
    DiagnosticRelatedInformation: class {
        constructor(location, message) {
            this.location = location;
            this.message = message;
        }
    },
    
    CodeAction: class {
        constructor(title, kind) {
            this.title = title;
            this.kind = kind;
        }
    },
    
    CodeActionKind: {
        QuickFix: 'quickfix'
    },
    
    WorkspaceEdit: class {
        replace(uri, range, text) {
            // Mock implementation
        }
    },
    
    Uri: {
        file: (path) => ({ path, scheme: 'file' })
    },
    
    languages: {
        _globalDiagnostics: new Map(),
        createDiagnosticCollection: (name) => ({
            set: function(uri, diagnostics) {
                const key = uri.path || uri.toString();
                mockVscode.languages._globalDiagnostics.set(key, diagnostics);
            },
            clear: function() {
                mockVscode.languages._globalDiagnostics.clear();
            },
            dispose: function() {}
        }),
        getDiagnostics: (uri) => {
            if (uri) {
                const key = uri.path || uri.toString();
                return mockVscode.languages._globalDiagnostics.get(key) || [];
            }
            return Array.from(mockVscode.languages._globalDiagnostics.entries());
        }
    }
};

// Set global vscode for test access
global.vscode = mockVscode;

// Intercept require calls
Module.prototype.require = function(id) {
    if (id === 'vscode') {
        return mockVscode;
    }
    return originalRequire.apply(this, arguments);
};

// Now run the tests
const Mocha = require('mocha');
const path = require('path');
const glob = require('glob');

const mocha = new Mocha({
    ui: 'tdd',
    color: true
});

// Add test files
const testFiles = glob.sync('./out/test/integration/*.integration.test.js');
testFiles.forEach(file => {
    mocha.addFile(path.resolve(file));
});

// Run tests
mocha.run(failures => {
    process.exit(failures ? 1 : 0);
});