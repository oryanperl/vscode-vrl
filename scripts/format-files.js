#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files to format
const extensions = ['.ts', '.js', '.json', '.md', '.yml', '.yaml'];
const ignorePatterns = [
    'node_modules',
    'out',
    'dist',
    '.git',
    '*.vsix',
    '*.log',
    'coverage',
    '.vscode-test',
];

function shouldIgnore(filePath) {
    return ignorePatterns.some((pattern) => {
        if (pattern.includes('*')) {
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            return regex.test(filePath);
        }
        return filePath.includes(pattern);
    });
}

function processFile(filePath) {
    if (shouldIgnore(filePath)) return;

    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Remove trailing whitespace
        const lines = content.split('\n');
        const trimmedLines = lines.map((line) => line.trimEnd());

        if (trimmedLines.some((line, i) => line !== lines[i])) {
            modified = true;
        }

        // Ensure exactly one newline at the end
        let newContent = trimmedLines.join('\n');
        if (!newContent.endsWith('\n')) {
            newContent += '\n';
            modified = true;
        } else {
            // Remove multiple trailing newlines
            newContent = newContent.replace(/\n+$/, '\n');
            if (newContent !== trimmedLines.join('\n') + '\n') {
                modified = true;
            }
        }

        if (modified) {
            fs.writeFileSync(filePath, newContent);
            console.log(`Fixed: ${filePath}`);
        }
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);

        if (shouldIgnore(filePath)) continue;

        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            walkDir(filePath);
        } else {
            const ext = path.extname(filePath);
            if (extensions.includes(ext)) {
                processFile(filePath);
            }
        }
    }
}

// Process all files in current directory
walkDir('.');

console.log('File formatting complete!');
