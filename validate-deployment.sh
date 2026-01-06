#!/bin/bash

# Resonance School Framework - Quick Validation Script
# This script runs all tests and provides a deployment readiness assessment

echo "=================================="
echo "RESONANCE SCHOOL FRAMEWORK"
echo "Deployment Readiness Validation"
echo "=================================="
echo ""

# Check Node.js availability
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js v14 or higher"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✓ Node.js detected: $NODE_VERSION"
echo ""

# Check for required files
echo "Checking framework documents..."
FILES=("COVENANT_FINAL.md" "DECLARATION_WORLD.md" "PERSONAL_PROTECTION.md")
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file - MISSING"
        exit 1
    fi
done
echo ""

echo "Checking test modules..."
TEST_FILES=("test-governance.js" "test-accessibility.js" "test-data-protection.js" "run-all-tests.js")
for file in "${TEST_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file - MISSING"
        exit 1
    fi
done
echo ""

# Run all tests
echo "Running comprehensive test suite..."
echo "===================================="
echo ""

node run-all-tests.js

EXIT_CODE=$?

echo ""
echo "===================================="

if [ $EXIT_CODE -eq 0 ]; then
    echo "✓ ALL TESTS PASSED"
    echo "System is READY for deployment"
    echo ""
    echo "Next steps:"
    echo "1. Review test reports in test-results/"
    echo "2. Conduct final manual verification"
    echo "3. Prepare deployment plan for January 10th, 2026"
    echo "4. Set up monitoring and rollback procedures"
else
    echo "✗ TESTS FAILED"
    echo "System is NOT READY for deployment"
    echo ""
    echo "Action required:"
    echo "1. Review test reports in test-results/"
    echo "2. Address all failures"
    echo "3. Re-run validation"
fi

echo ""
echo "Detailed reports available in: test-results/"
echo "===================================="

exit $EXIT_CODE
