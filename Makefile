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

# Run unit tests (no VSCode UI)
.PHONY: test-unit
test-unit: compile
	@echo "Running unit tests (headless)..."
	npm run test:unit

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
	@code --uninstall-extension vrl-extension.vscode-vrl 2>/dev/null || echo "Extension not found or already uninstalled"
	@echo "Extension uninstalled!"

# Reinstall the extension (uninstall, rebuild, and install)
.PHONY: reinstall
reinstall: uninstall build install
	@echo "Extension reinstalled successfully!"
	@echo "Restart VSCode to activate the updated extension."


# Publish to VSCode marketplace (requires proper publisher setup)
.PHONY: publish
publish: clean build
	@echo "Publishing extension to VSCode marketplace..."
	@if [ ! -f .secrets ]; then \
		echo "Error: .secrets file not found. Please create it with your VS Code marketplace credentials."; \
		exit 1; \
	fi
	@echo "Loading secrets and publishing..."
	@echo "Publishing package with PAT..."
	@source .secrets && npx vsce publish --pat $$VSCE_PAT
	@echo "Extension published successfully!"

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
	@echo "  make           - Build the extension"
	@echo "  make install   - Build and install to VSCode"
	@echo "  make uninstall - Remove extension from VSCode"
	@echo "  make reinstall - Uninstall, rebuild, and reinstall"
	@echo "  make clean     - Clean build artifacts"
	@echo "  make test      - Run integration tests (opens VSCode)"
	@echo "  make test-unit - Run unit tests (headless, no UI)"
	@echo "  make lint      - Run linter"
	@echo "  make watch     - Start development watch mode"
	@echo "  make info      - Show this information"

# Help target
.PHONY: help
help: info
