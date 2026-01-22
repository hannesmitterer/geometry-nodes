#!/bin/bash
# Production Deployment Verification Script
# Verifies all prerequisites and system readiness for production deployment

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   PRODUCTION DEPLOYMENT VERIFICATION                       ║"
echo "║   Protocol PACT - Genesis Block                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# Helper functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((CHECKS_WARNING++))
}

echo "═══════════════════════════════════════════════════════════"
echo "PHASE 1: ENVIRONMENT VERIFICATION"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    check_pass "Node.js installed: $NODE_VERSION"
else
    check_fail "Node.js not found"
fi

# Check IPFS
if command -v ipfs &> /dev/null; then
    IPFS_VERSION=$(ipfs version --number)
    check_pass "IPFS installed: $IPFS_VERSION"
else
    check_fail "IPFS not found - Install from https://docs.ipfs.tech/install/"
fi

# Check IPFS daemon
if ipfs swarm peers &> /dev/null; then
    PEER_COUNT=$(ipfs swarm peers | wc -l)
    check_pass "IPFS daemon running: $PEER_COUNT peers connected"
else
    check_fail "IPFS daemon not running - Start with: ipfs daemon &"
fi

# Check disk space
AVAILABLE_SPACE=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
if [ "$AVAILABLE_SPACE" -ge 10 ]; then
    check_pass "Disk space available: ${AVAILABLE_SPACE}GB"
else
    check_fail "Insufficient disk space: ${AVAILABLE_SPACE}GB (minimum 10GB required)"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "PHASE 2: REPOSITORY VERIFICATION"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check critical files
FILES=(
    ".PACT_METADATA.json"
    "PATTO_ETERNO_GENESIS_CERTIFICATE.md"
    "COVENANT_FINAL.md"
    "DECLARATION_WORLD.md"
    "PERSONAL_PROTECTION.md"
    "syntheia-governance.js"
    "kosymbiosis-monitor.js"
    "genesis-certificate-display.js"
    "operational-tests.js"
    "deploy-ipfs.sh"
    "index.html"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        check_pass "File exists: $file"
    else
        check_fail "File missing: $file"
    fi
done

# Verify .PACT_METADATA.json structure
if [ -f ".PACT_METADATA.json" ]; then
    if command -v jq &> /dev/null; then
        PROTOCOL=$(jq -r '.protocol_version' .PACT_METADATA.json 2>/dev/null)
        if [ "$PROTOCOL" = "PACT-1.0-GENESIS" ]; then
            check_pass "PACT metadata protocol version: $PROTOCOL"
        else
            check_fail "Invalid protocol version: $PROTOCOL"
        fi
        
        TXID=$(jq -r '.ledger_update.txid' .PACT_METADATA.json 2>/dev/null)
        if [ "$TXID" = "TX-OLF-999-RESONANCE-ALPHA" ]; then
            check_pass "Transaction ID verified: $TXID"
        else
            check_fail "Invalid TXID: $TXID"
        fi
    else
        check_warn "jq not installed - Cannot verify JSON structure"
    fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "PHASE 3: CODE QUALITY VERIFICATION"
echo "═══════════════════════════════════════════════════════════"
echo ""

# JavaScript syntax check
JS_FILES=(
    "syntheia-governance.js"
    "kosymbiosis-monitor.js"
    "genesis-certificate-display.js"
    "operational-tests.js"
    "api-service.js"
    "logger-service.js"
    "notification-service.js"
    "live-terminal.js"
)

JS_ERRORS=0
for jsfile in "${JS_FILES[@]}"; do
    if [ -f "$jsfile" ]; then
        if node --check "$jsfile" 2>/dev/null; then
            check_pass "JavaScript syntax valid: $jsfile"
        else
            check_fail "JavaScript syntax error: $jsfile"
            ((JS_ERRORS++))
        fi
    fi
done

# Run existing tests
if [ -f "test-modules.js" ]; then
    echo ""
    echo "Running existing test suite..."
    if node test-modules.js > /tmp/test-output.txt 2>&1; then
        TEST_RESULTS=$(grep "Tests passed:" /tmp/test-output.txt | tail -1)
        check_pass "Test suite: $TEST_RESULTS"
    else
        check_fail "Test suite failed"
        cat /tmp/test-output.txt
    fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "PHASE 4: SECURITY VERIFICATION"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check for common security issues
if grep -r "password\|secret\|api_key" --include="*.js" --include="*.json" . 2>/dev/null | grep -v node_modules | grep -v ".git" > /dev/null; then
    check_warn "Found potential secrets in code - Manual review recommended"
else
    check_pass "No obvious secrets found in code"
fi

# Check for TODO/FIXME that might indicate incomplete work
TODO_COUNT=$(grep -r "TODO\|FIXME" --include="*.js" --include="*.md" . 2>/dev/null | grep -v node_modules | grep -v ".git" | wc -l)
if [ "$TODO_COUNT" -gt 0 ]; then
    check_warn "Found $TODO_COUNT TODO/FIXME comments - Review before production"
else
    check_pass "No TODO/FIXME comments found"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "PHASE 5: DEPLOYMENT READINESS"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check deployment script
if [ -x "deploy-ipfs.sh" ]; then
    check_pass "Deployment script is executable"
else
    if [ -f "deploy-ipfs.sh" ]; then
        check_warn "Deployment script exists but not executable - Run: chmod +x deploy-ipfs.sh"
    else
        check_fail "Deployment script not found"
    fi
fi

# Check documentation
DOCS=(
    "DEPLOYMENT_READINESS.md"
    "POST_GENESIS_PHASE.md"
    "PACT_COMPLETION_SUMMARY.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        check_pass "Documentation exists: $doc"
    else
        check_warn "Documentation missing: $doc"
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "VERIFICATION SUMMARY"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}Passed:  $CHECKS_PASSED${NC}"
echo -e "${YELLOW}Warnings: $CHECKS_WARNING${NC}"
echo -e "${RED}Failed:   $CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    if [ $CHECKS_WARNING -eq 0 ]; then
        echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║   ✓ PRODUCTION DEPLOYMENT READY                        ║${NC}"
        echo -e "${GREEN}║   All checks passed successfully                       ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo "Next steps:"
        echo "  1. Review PRODUCTION_DEPLOYMENT_GUIDE.md"
        echo "  2. Execute: ./deploy-ipfs.sh"
        echo "  3. Follow Klimabaum node distribution procedures"
        echo "  4. Begin 24-hour monitoring"
        echo ""
        exit 0
    else
        echo -e "${YELLOW}╔════════════════════════════════════════════════════════╗${NC}"
        echo -e "${YELLOW}║   ⚠ PRODUCTION DEPLOYMENT READY WITH WARNINGS          ║${NC}"
        echo -e "${YELLOW}║   Review warnings before proceeding                    ║${NC}"
        echo -e "${YELLOW}╚════════════════════════════════════════════════════════╝${NC}"
        echo ""
        exit 0
    fi
else
    echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║   ✗ PRODUCTION DEPLOYMENT NOT READY                    ║${NC}"
    echo -e "${RED}║   Fix failed checks before proceeding                  ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    exit 1
fi
