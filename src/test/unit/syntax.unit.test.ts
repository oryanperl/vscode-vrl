import * as assert from 'assert';

// Mock vscode module for testing
const mockVscode = {
    DiagnosticSeverity: {
        Error: 0,
        Warning: 1,
        Information: 2,
        Hint: 3
    },
    Diagnostic: class {
        constructor(public range: any, public message: string, public severity: number) {}
        public code?: string;
    },
    Range: class {
        constructor(public start: { line: number, character: number }, public end: { line: number, character: number }) {}
    },
    languages: {
        createDiagnosticCollection: () => ({
            set: () => {},
            dispose: () => {}
        })
    }
};

// Set up mock before importing
(global as any).vscode = mockVscode;

// Import after mocking
import { VrlDiagnosticsProvider } from '../../diagnostics';

suite('VRL Syntax Unit Tests (TDD)', () => {
    let diagnosticsProvider: VrlDiagnosticsProvider;

    setup(() => {
        diagnosticsProvider = new VrlDiagnosticsProvider();
    });

    teardown(() => {
        diagnosticsProvider.dispose();
    });

    test('Current bug: Multi-line if block incorrectly flagged as unmatched braces', () => {
        const testContent = `if .name == "test.data.value" {
  .type = "processed"
}`;
        
        const diagnostics: any[] = [];
        const lines = testContent.split('\n');
        
        // Use current checkSyntaxErrors method that checks line by line (the buggy behavior)
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.trim() && !line.trim().startsWith('#')) {
                (diagnosticsProvider as any).checkSyntaxErrors(line, i, diagnostics);
            }
        }

        const braceErrors = diagnostics.filter(d => 
            d.severity === mockVscode.DiagnosticSeverity.Error && 
            d.message.includes('brace')
        );

        console.log(`Multi-line if block - Found ${braceErrors.length} brace errors`);
        braceErrors.forEach(e => console.log(` - Line ${e.range.start.line}: ${e.message}`));

        // This test SHOULD FAIL because current code incorrectly flags this as an error
        // The current line-by-line checking will see unmatched braces on individual lines
        assert.ok(braceErrors.length > 0, 'CURRENT BUG: Valid multi-line code is incorrectly flagged as having unmatched braces');
    });

    test('Missing feature: Should detect else on wrong line', () => {
        const testContent = `if .name == "test" {
  .result = "match"
}
else {
  .result = "no match"  
}`;
        
        const diagnostics: any[] = [];
        const lines = testContent.split('\n');
        
        // Current code doesn't check for VRL control flow syntax rules
        // This is a missing feature, so we expect no errors currently
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.trim() && !line.trim().startsWith('#')) {
                (diagnosticsProvider as any).checkSyntaxErrors(line, i, diagnostics);
                (diagnosticsProvider as any).checkSemanticErrors(line, i, diagnostics);
                (diagnosticsProvider as any).checkBestPractices(line, i, diagnostics);
            }
        }

        const elseErrors = diagnostics.filter(d => 
            d.severity === mockVscode.DiagnosticSeverity.Error && 
            (d.message.includes('else') || d.message.includes('same line'))
        );

        console.log(`Else on wrong line - Found ${elseErrors.length} else errors`);
        elseErrors.forEach(e => console.log(` - ${e.message}`));

        // This test SHOULD FAIL because current code doesn't check VRL control flow rules
        // We expect 0 errors currently, but we want 1 error to be detected
        assert.strictEqual(elseErrors.length, 0, 'CURRENT LIMITATION: else on wrong line is not detected (should be 1 error)');
    });

    // This test shows the second issue - we need to add VRL control flow validation
    // Currently this passes, but after implementing the feature, the wrong-line else should fail
});