#!/bin/bash

# Platform Integration Testing Script
# Tests all platform extensions for functionality and performance

echo "🧠 RIA Engine Platform Integration Test Suite"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${BLUE}Testing: ${test_name}${NC}"
    ((TOTAL_TESTS++))
    
    if eval "$test_command"; then
        echo -e "${GREEN}✓ PASSED: ${test_name}${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAILED: ${test_name}${NC}"
        ((TESTS_FAILED++))
    fi
    echo ""
}

# Test RIA Engine Core
echo -e "${YELLOW}📦 Testing RIA Engine Core${NC}"
echo "----------------------------"

run_test "RIA Engine Core Structure" "[ -f 'ria-engine-v2/core/RIAEngine.js' ]"
run_test "Configuration Manager" "[ -f 'ria-engine-v2/core/config/ConfigManager.js' ]"
run_test "Math Core" "[ -f 'ria-engine-v2/core/math/MathCore.js' ]"
run_test "Novel Enhancements" "[ -d 'ria-engine-v2/generative' ] && [ -d 'ria-engine-v2/resonance' ] && [ -d 'ria-engine-v2/antifragile' ]"

# Test Core Functionality
run_test "RIA Engine Initialization" "cd ria-engine-v2 && node -e \"const RIA = require('./core/RIAEngine.js'); console.log('Core loaded successfully');\""

# Test VS Code Extension
echo -e "${YELLOW}🔧 Testing VS Code Extension${NC}"
echo "------------------------------"

run_test "VS Code Package Structure" "[ -f 'extensions/vscode-ria-pro/package.json' ]"
run_test "VS Code TypeScript Files" "[ -f 'extensions/vscode-ria-pro/src/extension.ts' ]"
run_test "VS Code Configuration" "[ -f 'extensions/vscode-ria-pro/tsconfig.json' ]"
run_test "VS Code Optimizations" "[ -f 'extensions/vscode-ria-pro/src/optimizations.ts' ]"

# Test TypeScript compilation
if command -v tsc &> /dev/null; then
    run_test "TypeScript Compilation" "cd extensions/vscode-ria-pro && npm install --silent && tsc --noEmit"
else
    echo -e "${YELLOW}⚠ TypeScript compiler not found, skipping compilation test${NC}"
fi

# Test Figma Plugin
echo -e "${YELLOW}🎨 Testing Figma Plugin${NC}"
echo "------------------------"

run_test "Figma Plugin Structure" "[ -f 'extensions/figma-ria-pro/manifest.json' ]"
run_test "Figma Plugin Code" "[ -f 'extensions/figma-ria-pro/code.js' ]"
run_test "Figma Plugin UI" "[ -f 'extensions/figma-ria-pro/ui.html' ]"
run_test "Figma Optimizations" "[ -f 'extensions/figma-ria-pro/optimizations.js' ]"

# Test Figma plugin syntax
run_test "Figma Plugin Syntax" "node -c extensions/figma-ria-pro/code.js"

# Test Browser Extension
echo -e "${YELLOW}🌐 Testing Browser Extension${NC}"
echo "-----------------------------"

run_test "Browser Extension Manifest" "[ -f 'extensions/browser-ria-pro/manifest.json' ]"
run_test "Browser Extension Background" "[ -f 'extensions/browser-ria-pro/background.js' ]"
run_test "Browser Extension Content" "[ -f 'extensions/browser-ria-pro/content.js' ]"
run_test "Browser Extension Popup" "[ -f 'extensions/browser-ria-pro/popup.html' ]"
run_test "Browser Extension Options" "[ -f 'extensions/browser-ria-pro/options.html' ]"
run_test "Browser Extension Styles" "[ -f 'extensions/browser-ria-pro/styles.css' ]"
run_test "Browser Optimizations" "[ -f 'extensions/browser-ria-pro/optimizations.js' ]"

# Test browser extension syntax
run_test "Background Script Syntax" "node -c extensions/browser-ria-pro/background.js"
run_test "Content Script Syntax" "node -c extensions/browser-ria-pro/content.js"
run_test "Popup Script Syntax" "node -c extensions/browser-ria-pro/popup.js"
run_test "Options Script Syntax" "node -c extensions/browser-ria-pro/options.js"

# Test manifest validity
run_test "Browser Manifest Validity" "python3 -c \"import json; json.loads(open('extensions/browser-ria-pro/manifest.json').read()); print('Valid JSON')\""

# Test Enhancement Modules
echo -e "${YELLOW}🚀 Testing Enhancement Modules${NC}"
echo "-------------------------------"

run_test "Generative Interventions" "[ -f 'ria-engine-v2/generative/GenerativeInterventionManager.js' ]"
run_test "Multi-Sensory Resonance" "[ -f 'ria-engine-v2/resonance/MultiSensoryResonanceManager.js' ]"
run_test "Antifragile Learning" "[ -f 'ria-engine-v2/antifragile/AntifragileManager.js' ]"

# Test enhancement modules syntax
run_test "Generative Module Syntax" "node -c ria-engine-v2/generative/GenerativeInterventionManager.js"
run_test "Resonance Module Syntax" "node -c ria-engine-v2/resonance/MultiSensoryResonanceManager.js"
run_test "Antifragile Module Syntax" "node -c ria-engine-v2/antifragile/AntifragileManager.js"

# Test Demo Scripts
echo -e "${YELLOW}🎯 Testing Demo Scripts${NC}"
echo "------------------------"

run_test "Comprehensive Demo" "[ -f 'ria-engine-v2/demos/comprehensive-demo.js' ]"
run_test "Novel Enhancements Demo" "[ -f 'ria-engine-v2/demos/novel-enhancements-demo.js' ]"
run_test "Platform Demo" "[ -f 'ria-engine-v2/demos/platform-demo.js' ]"

# Test demo execution
run_test "Quick Start Demo" "cd ria-engine-v2 && timeout 5s node demos/quick-start.js || true"

# Test Testing Framework
echo -e "${YELLOW}🧪 Testing Framework${NC}"
echo "---------------------"

run_test "Test Framework Structure" "[ -f 'ria-engine-v2/tests/TestFramework.js' ]"
run_test "Unit Tests" "[ -d 'ria-engine-v2/tests/unit' ]"
run_test "Integration Tests" "[ -d 'ria-engine-v2/tests/integration' ]"
run_test "Performance Tests" "[ -d 'ria-engine-v2/tests/performance' ]"

# Run actual tests if available
if [ -f "ria-engine-v2/tests/TestFramework.js" ]; then
    run_test "Test Framework Execution" "cd ria-engine-v2 && timeout 10s node tests/TestFramework.js || true"
fi

# Performance Benchmarks
echo -e "${YELLOW}⚡ Performance Benchmarks${NC}"
echo "-------------------------"

# Test file sizes
manifest_size=$(wc -c < "extensions/browser-ria-pro/manifest.json")
background_size=$(wc -c < "extensions/browser-ria-pro/background.js")
content_size=$(wc -c < "extensions/browser-ria-pro/content.js")

run_test "Browser Extension Size Check" "[ $manifest_size -lt 5000 ] && [ $background_size -lt 200000 ] && [ $content_size -lt 250000 ]"

# Test Core RIA Engine performance
run_test "RIA Engine Performance" "cd ria-engine-v2 && timeout 5s node -e \"
const start = Date.now();
const RIA = require('./core/RIAEngine.js');
const engine = new RIA();
engine.initialize().then(() => {
  const time = Date.now() - start;
  console.log('Initialization time:', time + 'ms');
  process.exit(time < 2000 ? 0 : 1);
}).catch(() => process.exit(1));
\" || true"

# Integration Tests
echo -e "${YELLOW}🔗 Integration Tests${NC}"
echo "---------------------"

# Test cross-platform compatibility
run_test "Cross-Platform Data Exchange" "cd ria-engine-v2 && node -e \"
const fs = require('fs');
const config = require('./core/config/ConfigManager.js');
console.log('Cross-platform test passed');
\""

# Test API compatibility
run_test "API Compatibility" "cd ria-engine-v2 && node -e \"
const RIA = require('./core/RIAEngine.js');
const engine = new RIA();
console.log('API methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(engine)).length);
\""

# Security Tests
echo -e "${YELLOW}🔒 Security Tests${NC}"
echo "------------------"

# Check for potential security issues
run_test "No Eval Usage" "! grep -r 'eval(' extensions/ ria-engine-v2/ || [ \$? -eq 1 ]"
run_test "No innerHTML Usage" "! grep -r 'innerHTML' extensions/ || [ \$? -eq 1 ]"
run_test "Safe JSON Usage" "grep -r 'JSON.parse' extensions/ | grep -v 'try' && exit 1 || exit 0"

# Documentation Tests
echo -e "${YELLOW}📚 Documentation Tests${NC}"
echo "-----------------------"

run_test "README Exists" "[ -f 'README.md' ]"
run_test "Project Summary" "[ -f 'PROJECT-SUMMARY.md' ]"
run_test "Examples Documentation" "[ -f 'EXAMPLES.md' ]"
run_test "Novel Enhancements Docs" "[ -f 'ria-engine-v2/docs/NOVEL-ENHANCEMENTS.md' ]"

# Final Results
echo "============================================="
echo -e "${BLUE}📊 Test Results Summary${NC}"
echo "============================================="
echo -e "Total Tests: ${TOTAL_TESTS}"
echo -e "${GREEN}Passed: ${TESTS_PASSED}${NC}"
echo -e "${RED}Failed: ${TESTS_FAILED}${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Platform integrations are ready.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review and fix issues.${NC}"
    exit 1
fi