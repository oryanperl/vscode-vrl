#!/bin/bash

# reload.sh - Rebuild extension, install it, and refresh Cursor
# Usage: ./reload.sh

set -e  # Exit on any error

echo "🔄 Reloading VRL Extension..."
echo "=================================="

# Step 1: Clean and rebuild
echo "🧹 Cleaning previous build..."
make clean

echo "🔨 Building extension..."
make build

# Step 2: Uninstall old version and install new one
echo "📦 Reinstalling extension..."
make reinstall

# Step 3: Close Cursor (if running)
echo "🔄 Refreshing Cursor..."
if pgrep -x "Cursor" > /dev/null; then
    echo "   Closing Cursor..."
    osascript -e 'quit app "Cursor"'
    
    # Wait a moment for Cursor to fully close
    sleep 2
    
    # Check if Cursor actually closed
    while pgrep -x "Cursor" > /dev/null; do
        echo "   Waiting for Cursor to close..."
        sleep 1
    done
else
    echo "   Cursor not running"
fi

# Step 4: Open Cursor
echo "   Opening Cursor..."
open -a "Cursor"

# Wait for Cursor to start
sleep 3

echo ""
echo "✅ Extension reloaded successfully!"
echo "   The VRL extension should now be updated in Cursor"
echo "   Try opening a .vrl file to test the new functionality"
echo ""