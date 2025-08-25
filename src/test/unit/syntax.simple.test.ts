import * as assert from 'assert';

suite('VRL Syntax Issues (TDD)', () => {
    
    // Simulate the current buggy checkSyntaxErrors logic
    function checkSyntaxErrorsLineByLine(line: string): string[] {
        const errors: string[] = [];
        
        // This is the current buggy logic - checks braces per line
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) {
            errors.push('Unmatched braces');
        }

        const openParens = (line.match(/\(/g) || []).length;
        const closeParens = (line.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
            errors.push('Unmatched parentheses');
        }

        return errors;
    }

    // Proposed fixed logic - checks braces across entire document
    function checkSyntaxErrorsDocumentLevel(text: string): string[] {
        const errors: string[] = [];
        
        let braceCount = 0;
        let parenCount = 0;
        let bracketCount = 0;
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            switch (char) {
                case '{': braceCount++; break;
                case '}': braceCount--; break;
                case '(': parenCount++; break;
                case ')': parenCount--; break;
                case '[': bracketCount++; break;
                case ']': bracketCount--; break;
            }
        }
        
        if (braceCount !== 0) {
            errors.push(`Unmatched braces (${braceCount > 0 ? 'missing closing' : 'extra closing'})`);
        }
        if (parenCount !== 0) {
            errors.push(`Unmatched parentheses (${parenCount > 0 ? 'missing closing' : 'extra closing'})`);
        }
        if (bracketCount !== 0) {
            errors.push(`Unmatched brackets (${bracketCount > 0 ? 'missing closing' : 'extra closing'})`);
        }
        
        return errors;
    }

    // Test to demonstrate current bug
    test('CURRENT BUG: Valid multi-line if block flagged as error', () => {
        const testContent = `if .name == "test.data.value" {
  .type = "processed"
}`;
        
        const lines = testContent.split('\n');
        let totalErrors = 0;
        
        // Test current line-by-line logic (buggy)
        console.log('Current line-by-line checking:');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.trim()) {
                const errors = checkSyntaxErrorsLineByLine(line);
                if (errors.length > 0) {
                    console.log(`  Line ${i + 1}: "${line.trim()}" -> ${errors.join(', ')}`);
                    totalErrors += errors.length;
                }
            }
        }
        
        // This should fail because current logic incorrectly finds errors
        assert.ok(totalErrors > 0, `Current bug: Found ${totalErrors} false errors in valid code`);
    });

    test('FIXED BEHAVIOR: Valid multi-line if block should have no errors', () => {
        const testContent = `if .name == "test.data.value" {
  .type = "processed"
}`;
        
        // Test proposed document-level logic (fixed)
        const errors = checkSyntaxErrorsDocumentLevel(testContent);
        
        console.log('Document-level checking:');
        console.log(`  Found ${errors.length} errors: ${errors.join(', ')}`);
        
        // This should pass - valid code should have no errors
        assert.strictEqual(errors.length, 0, 'Valid multi-line code should have no syntax errors');
    });

    test('Should still detect actual unmatched braces', () => {
        const testContent = `if .name == "test" {
  .result = "match"
  // Missing closing brace`;
        
        const errors = checkSyntaxErrorsDocumentLevel(testContent);
        
        console.log('Actual unmatched braces:');
        console.log(`  Found ${errors.length} errors: ${errors.join(', ')}`);
        
        // This should correctly find 1 error
        assert.strictEqual(errors.length, 1, 'Should detect actually unmatched braces');
        assert.ok(errors[0].includes('braces'), 'Error should mention unmatched braces');
    });

    // Test for VRL else/else if rule (currently not implemented)
    function checkVrlControlFlow(lines: string[]): string[] {
        const errors: string[] = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const prevLine = i > 0 ? lines[i - 1].trim() : '';
            
            // Check if line starts with 'else' or 'else if'
            if (line.startsWith('else ') || line.startsWith('else if ') || line === 'else') {
                console.log(`Found else line ${i + 1}: "${line}", prevLine: "${prevLine}"`);
                // If previous line ends with }, then else should have been on that line
                if (prevLine.endsWith('}')) {
                    errors.push(`Line ${i + 1}: 'else' or 'else if' must be on the same line as the closing '}'`);
                }
            }
        }
        
        return errors;
    }

    test('VRL RULE: Should detect else on wrong line', () => {
        const testContent = `if .name == "test" {
  .result = "match"
}
else {
  .result = "no match"
}`;
        
        const lines = testContent.split('\n');
        console.log('Lines in test:', lines.map((l, i) => `${i}: "${l.trim()}"`));
        const errors = checkVrlControlFlow(lines);
        
        console.log('VRL control flow checking:');
        console.log(`  Found ${errors.length} errors: ${errors.join(', ')}`);
        
        // This should find 1 error - else on wrong line
        assert.strictEqual(errors.length, 1, 'Should detect else on wrong line');
        assert.ok(errors[0].includes('same line'), 'Error should mention same line rule');
    });

    test('VRL RULE: Should NOT flag else on correct line', () => {
        const testContent = `if .name == "test" {
  .result = "match"
} else {
  .result = "no match"
}`;
        
        const lines = testContent.split('\n');
        const errors = checkVrlControlFlow(lines);
        
        console.log('VRL control flow (correct):');
        console.log(`  Found ${errors.length} errors: ${errors.join(', ')}`);
        
        // This should pass - else on same line is correct
        assert.strictEqual(errors.length, 0, 'Should not flag else on correct line');
    });
});