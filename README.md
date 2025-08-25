# VRL Language Support for VSCode

A comprehensive Visual Studio Code extension providing advanced support for VRL (Vector Remap Language) files.

## Features

### 🎨 Syntax Highlighting

- Complete VRL syntax highlighting with proper tokenization
- Support for functions, keywords, operators, strings, and comments
- Field path highlighting with proper scoping
- Error and fallible function highlighting

### 🧠 IntelliSense & Code Completion

- Auto-completion for all VRL built-in functions
- Context-aware field path suggestions
- Function signatures with parameter hints
- Smart snippets for common VRL patterns

### 🔍 Advanced Language Features

- **Hover Information**: Detailed documentation for functions and keywords
- **Real-time Diagnostics**: Syntax and semantic error detection
- **Error Handling Validation**: Ensures proper use of fallible functions
- **Best Practice Suggestions**: Performance and maintainability hints

### 🛠 Commands & Tools

- **Validate Script** (`Ctrl+Shift+V`): Comprehensive VRL script validation
- **Format Document**: Auto-format VRL code with proper indentation
- **Show Documentation**: Quick access to Vector documentation

### 🎯 Code Quality

- Real-time syntax error detection
- Semantic validation for function calls
- Warning system for potential issues
- Type validation suggestions

## Installation

### Using the Makefile (Recommended)

```bash
# Build and install the extension
make install

# Or build only
make build
```

### Manual Installation

```bash
# Install dependencies
npm install

# Compile and package
npm run compile
npm run package

# Install the generated .vsix file
code --install-extension vscode-vrl-*.vsix
```

## Usage

### Basic Example

Create a `.vrl` file and start typing:

```vrl
# Parse JSON message
. = parse_json!(.message)

# Add timestamp
.processed_at = now()

# Transform log level
.level = upcase(.level)

# Conditional processing
if contains(.message, "error") {
    .severity = "high"
    log("High severity event detected", level: "warn")
}

# Clean up
del(.temp_field)
```

### Advanced Features

The extension provides intelligent suggestions as you type:

- Type `parse_` to see all parsing functions
- Use `.` to access field paths with auto-completion
- Error handling is automatically suggested for fallible functions
- Hover over functions to see documentation and examples

## Configuration

Access settings through `File > Preferences > Settings` and search for "VRL":

```json
{
    "vrl.enableIntelliSense": true,
    "vrl.enableErrorChecking": true,
    "vrl.enableTypeHints": true,
    "vrl.maxErrorCount": 100
}
```

## Development

### Prerequisites

- Node.js (16+)
- Visual Studio Code
- TypeScript

### Setup

```bash
# Clone and setup
git clone <repository-url>
cd vscode-vrl
make dev-setup

# Start development
make watch

# Run tests
make test
```

### Available Make Targets

- `make` - Build the extension
- `make install` - Build and install to VSCode
- `make clean` - Clean build artifacts
- `make test` - Run test suite
- `make lint` - Run code linting
- `make watch` - Development watch mode
- `make info` - Show build information

## VRL Language Support

This extension supports the complete VRL syntax including:

### Functions

- **Parsing**: `parse_json`, `parse_syslog`, `parse_regex`, `parse_key_value`, `parse_csv`, `parse_timestamp`
- **Type Conversion**: `to_string`, `to_int`, `to_float`, `to_bool`, `to_timestamp`
- **String Manipulation**: `contains`, `starts_with`, `ends_with`, `replace`, `split`, `join`, `upcase`, `downcase`
- **Array/Object Operations**: `merge`, `keys`, `values`, `filter`, `map`, `reduce`
- **Encoding**: `encode_base64`, `decode_base64`, `encode_percent`, `decode_percent`
- **Hashing**: `sha1`, `sha2`, `sha3`, `md5`, `hmac`
- **Utilities**: `uuid_v4`, `now`, `type`, `length`, `assert`

### Language Features

- Field path expressions (`.field.subfield`)
- Error handling with `!` and `??` operators
- Conditional statements (`if`, `else`)
- Comments (`# comment`)
- All VRL data types and literals

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `make test`
5. Submit a pull request

## Troubleshooting

### Extension Not Loading

1. Check VSCode version compatibility (requires 1.85+)
2. Reload VSCode: `Developer: Reload Window`
3. Check console for errors: `Help > Toggle Developer Tools`

### Syntax Highlighting Issues

1. Ensure file has `.vrl` extension
2. Check language mode in status bar
3. Try `View > Command Palette > Change Language Mode > VRL`

### IntelliSense Not Working

1. Verify `vrl.enableIntelliSense` is true in settings
2. Check for TypeScript errors: `make lint`
3. Restart extension host: `Developer: Reload Window`

## License

MIT License - see LICENSE file for details.

## Support

- [Vector Documentation](https://vector.dev/docs/reference/vrl/)
- [Issues & Bug Reports](https://github.com/your-org/vscode-vrl/issues)
