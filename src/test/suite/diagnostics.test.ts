import * as assert from 'assert';
import * as vscode from 'vscode';
import { VrlDiagnosticsProvider } from '../../diagnostics';

suite('VRL Diagnostics Test Suite', () => {
    let diagnosticsProvider: VrlDiagnosticsProvider;

    setup(() => {
        diagnosticsProvider = new VrlDiagnosticsProvider();
    });

    teardown(() => {
        diagnosticsProvider.dispose();
    });

    test('Should detect fallible functions without error handling', async () => {
        // Create a test document with fallible functions used incorrectly
        const testContent = `# Test file with invalid fallible function usage
.result = parse_cef(.input)
.data = parse_json(.content)
.timestamp = parse_timestamp(.date, "%Y-%m-%d")
.number = to_int(.value)

# These should be valid (no errors expected)
.good_result = parse_cef!(.input)
.safe_data = parse_json(.content) ?? {}
.parsed_time = parse_timestamp(.date, "%Y-%m-%d") ?? now()
result, err = to_int(.value)
`;

        // Create a temporary document
        const doc = await vscode.workspace.openTextDocument({
            content: testContent,
            language: 'vrl'
        });

        // Clear diagnostics for this specific document
        const diagnosticsCollection = vscode.languages.createDiagnosticCollection('test-vrl');
        diagnosticsCollection.clear();
        
        // Use our own diagnostics collection to avoid conflicts
        (diagnosticsProvider as any).diagnosticCollection = diagnosticsCollection;
        
        // Validate the document
        diagnosticsProvider.validateDocument(doc);

        // Wait a bit for diagnostics to be processed
        await new Promise(resolve => setTimeout(resolve, 200));

        // Get diagnostics from our test collection
        const allDiagnostics = diagnosticsCollection.get(doc.uri) || [];
        
        // Filter for only ERROR severity diagnostics about fallible functions
        const errorDiagnostics = allDiagnostics.filter(diag => 
            diag.severity === vscode.DiagnosticSeverity.Error && 
            diag.message.includes('error handling')
        );

        console.log(`Found ${allDiagnostics.length} total diagnostics, ${errorDiagnostics.length} error diagnostics:`);
        errorDiagnostics.forEach((diag, index) => {
            console.log(`  ${index + 1}. Line ${diag.range.start.line}: ${diag.message}`);
        });

        // We expect exactly 4 errors for the 4 fallible functions used incorrectly
        assert.strictEqual(errorDiagnostics.length, 4, 
            `Expected 4 error diagnostics for fallible functions without error handling, got ${errorDiagnostics.length}`);

        // Check that each error is about missing error handling
        const expectedErrors = ['parse_cef', 'parse_json', 'parse_timestamp', 'to_int'];
        
        expectedErrors.forEach((funcName, index) => {
            const diagnostic = errorDiagnostics[index];
            assert.ok(diagnostic.message.includes(funcName), 
                `Expected error for ${funcName}, got: ${diagnostic.message}`);
            assert.ok(diagnostic.message.includes('error handling'), 
                `Expected error message to mention error handling, got: ${diagnostic.message}`);
            assert.strictEqual(diagnostic.severity, vscode.DiagnosticSeverity.Error,
                `Expected error severity, got ${diagnostic.severity}`);
        });

        // Clean up
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });

    test('Should not flag fallible functions with proper error handling', async () => {
        const testContent = `# Test file with valid fallible function usage
.good_result = parse_cef!(.input)
.safe_data = parse_json(.content) ?? {}
.parsed_time = parse_timestamp(.date, "%Y-%m-%d") ?? now()
result, err = to_int(.value)
`;

        const doc = await vscode.workspace.openTextDocument({
            content: testContent,
            language: 'vrl'
        });

        // Use our own diagnostics collection to avoid conflicts
        const diagnosticsCollection = vscode.languages.createDiagnosticCollection('test-vrl-2');
        diagnosticsCollection.clear();
        (diagnosticsProvider as any).diagnosticCollection = diagnosticsCollection;

        diagnosticsProvider.validateDocument(doc);
        await new Promise(resolve => setTimeout(resolve, 200));

        const allDiagnostics = diagnosticsCollection.get(doc.uri) || [];
        
        // Filter for only ERROR severity diagnostics about fallible functions
        const errorDiagnostics = allDiagnostics.filter(diag => 
            diag.severity === vscode.DiagnosticSeverity.Error && 
            diag.message.includes('error handling')
        );

        console.log(`Found ${allDiagnostics.length} total diagnostics, ${errorDiagnostics.length} error diagnostics for valid usage:`);
        errorDiagnostics.forEach((diag, index) => {
            console.log(`  ${index + 1}. Line ${diag.range.start.line}: ${diag.message}`);
        });

        // Should have no errors for properly handled fallible functions
        assert.strictEqual(errorDiagnostics.length, 0, 
            `Expected no error diagnostics for properly handled fallible functions, got ${errorDiagnostics.length}`);

        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });

    test('Should detect unknown functions', async () => {
        const testContent = `# Test file with unknown function
.result = unknown_function(.data)
.other = invalid_func(.input)
`;

        const doc = await vscode.workspace.openTextDocument({
            content: testContent,
            language: 'vrl'
        });

        // Clear any existing diagnostics first
        vscode.languages.getDiagnostics().forEach(([uri, _]) => {
            vscode.languages.getDiagnostics(uri).splice(0);
        });

        diagnosticsProvider.validateDocument(doc);
        await new Promise(resolve => setTimeout(resolve, 200));

        const allDiagnostics = vscode.languages.getDiagnostics(doc.uri);
        
        // Filter for only ERROR severity diagnostics about unknown functions
        const unknownFuncDiagnostics = allDiagnostics.filter(diag => 
            diag.severity === vscode.DiagnosticSeverity.Error && 
            diag.message.includes('Unknown function')
        );

        console.log(`Found ${allDiagnostics.length} total diagnostics, ${unknownFuncDiagnostics.length} unknown function diagnostics:`);
        unknownFuncDiagnostics.forEach((diag, index) => {
            console.log(`  ${index + 1}. Line ${diag.range.start.line}: ${diag.message}`);
        });

        // Should detect 2 unknown functions
        assert.strictEqual(unknownFuncDiagnostics.length, 2, 
            `Expected 2 diagnostics for unknown functions, got ${unknownFuncDiagnostics.length}`);

        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });
});