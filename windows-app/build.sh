#!/bin/bash

# Build script for Windows distribution
# This script prepares the application for Windows distribution

echo "🚀 Building RIA Trading Desktop for Windows..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Navigate to windows-app directory
cd "$(dirname "$0")"

echo "📦 Installing dependencies..."
npm install

# Check if electron-builder is installed
if ! npm list electron-builder &> /dev/null; then
    echo "📦 Installing electron-builder..."
    npm install --save-dev electron-builder
fi

echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf node_modules/.cache/

echo "🔧 Building application..."

# Build for Windows x64
echo "Building for Windows x64..."
npm run build:win64

# Build for Windows x32 (optional)
echo "Building for Windows x32..."
npm run build:win32

# Create portable version
echo "Creating portable version..."
npm run build -- --win portable

echo "✅ Build completed successfully!"
echo ""
echo "📁 Output files can be found in the 'dist' directory:"
echo "   - RIA-Trading-Desktop-Setup.exe (installer)"
echo "   - RIA-Trading-Desktop-Portable.exe (portable)"
echo ""
echo "🎉 Ready for distribution!"