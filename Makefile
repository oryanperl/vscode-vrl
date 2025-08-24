# VRL VSCode Extension Makefile

# Variables
PACKAGE_NAME := vscode-vrl
EXTENSION_NAME := $(PACKAGE_NAME)-*.vsix
NODE_MODULES := node_modules
OUT_DIR := out
VSIX_FILE := $(wildcard *.vsix)

# Default target
.PHONY: all
all: build

# Install dependencies
.PHONY: deps
deps:
	@echo "Installing dependencies..."
	npm install

# Compile TypeScript
.PHONY: compile
compile: deps
	@echo "Compiling TypeScript..."
	npm run compile

# Build the extension
.PHONY: build
build: compile
	@echo "Building extension..."
	npm run package
	@echo "Extension built successfully!"

# Clean build artifacts
.PHONY: clean
clean:
	@echo "Cleaning build artifacts..."
	rm -rf $(OUT_DIR)
	rm -f *.vsix
	@echo "Clean completed!"

# Deep clean including dependencies
.PHONY: clean-all
clean-all: clean
	@echo "Cleaning dependencies..."
	rm -rf $(NODE_MODULES)
	rm -f package-lock.json
	@echo "Deep clean completed!"

# Run linting
.PHONY: lint
lint: deps
	@echo "Running linter..."
	npm run lint

# Run tests
.PHONY: test
test: compile
	@echo "Running tests..."
	npm run test

# Watch mode for development
.PHONY: watch
watch: deps
	@echo "Starting watch mode..."
	npm run watch

# Install the extension locally
.PHONY: install
install: build
	@echo "Installing extension to VSCode..."
	@if [ -z "$(wildcard *.vsix)" ]; then \
		echo "Error: No .vsix file found. Run 'make build' first."; \
		exit 1; \
	fi
	@VSIX_FILE=$$(ls -t *.vsix | head -n1); \
	echo "Installing $$VSIX_FILE..."; \
	code --install-extension "$$VSIX_FILE" --force
	@echo "Extension installed successfully!"
	@echo "Restart VSCode to activate the extension."

# Uninstall the extension
.PHONY: uninstall
uninstall:
	@echo "Uninstalling VRL extension from VSCode..."
	code --uninstall-extension vrl-extension.vscode-vrl
	@echo "Extension uninstalled!"


# Publish to VSCode marketplace (requires proper publisher setup)
.PHONY: publish
publish: build test lint
	@echo "Publishing extension to VSCode marketplace..."
	@echo "Note: This requires proper publisher credentials"
	npm run publish

# Development setup
.PHONY: dev-setup
dev-setup: deps
	@echo "Setting up development environment..."
	@echo "Installing VSCode extension development tools..."
	npm install -g @vscode/vsce yo generator-code
	@echo "Development environment ready!"
	@echo "Use 'make watch' to start development mode"
	@echo "Use F5 in VSCode to launch extension host"

# Package information
.PHONY: info
info:
	@echo "VRL VSCode Extension Build Information"
	@echo "====================================="
	@echo "Package: $(PACKAGE_NAME)"
	@echo "Node modules: $(if $(wildcard $(NODE_MODULES)),✓ Installed,✗ Not installed)"
	@echo "Compiled: $(if $(wildcard $(OUT_DIR)),✓ Yes,✗ No)"
	@echo "Extension built: $(if $(wildcard *.vsix),✓ Yes,✗ No)"
	@echo ""
	@echo "Available targets:"
	@echo "  make         - Build the extension"
	@echo "  make install - Build and install to VSCode"
	@echo "  make clean   - Clean build artifacts"
	@echo "  make test    - Run tests"
	@echo "  make lint    - Run linter"
	@echo "  make watch   - Start development watch mode"
	@echo "  make info    - Show this information"

# Help target
.PHONY: help
help: info