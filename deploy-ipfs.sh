#!/bin/bash
# IPFS Deployment Script for Protocol PACT Genesis
# This script handles deployment and pinning across Klimabaum anchor nodes

set -e

echo "🚀 IPFS Deployment - Protocol PACT Genesis"
echo "==========================================="

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
METADATA_FILE=".PACT_METADATA.json"
IPFS_GATEWAY="https://ipfs.io/ipfs/"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if IPFS is installed
if ! command -v ipfs &> /dev/null; then
    echo -e "${RED}❌ IPFS not found. Please install IPFS first.${NC}"
    echo "Visit: https://docs.ipfs.tech/install/"
    exit 1
fi

# Check if IPFS daemon is running
if ! ipfs swarm peers &> /dev/null; then
    echo -e "${YELLOW}⚠️  IPFS daemon not running. Starting...${NC}"
    ipfs daemon &
    DAEMON_PID=$!
    sleep 5
fi

echo -e "${GREEN}✓ IPFS daemon is running${NC}"

# Add files to IPFS (excluding unnecessary files)
echo ""
echo "📦 Adding files to IPFS..."
CID=$(ipfs add -r \
    --ignore .git \
    --ignore node_modules \
    --ignore .gitignore \
    --ignore deploy-ipfs.sh \
    --quiet \
    "$PROJECT_DIR" | tail -1)

echo -e "${GREEN}✓ Files added to IPFS${NC}"
echo "📍 Root CID: $CID"

# Pin the content
echo ""
echo "📌 Pinning content locally..."
ipfs pin add "$CID"
echo -e "${GREEN}✓ Content pinned locally${NC}"

# Update PACT metadata with actual CID
echo ""
echo "📝 Updating .PACT_METADATA.json with actual CID..."
TEMP_FILE=$(mktemp)
jq --arg cid "ipfs://$CID" '.ledger_update.cid_root = $cid' "$PROJECT_DIR/$METADATA_FILE" > "$TEMP_FILE"
mv "$TEMP_FILE" "$PROJECT_DIR/$METADATA_FILE"
echo -e "${GREEN}✓ Metadata updated${NC}"

# Display access URLs
echo ""
echo "🌐 Access URLs:"
echo "================================================"
echo "Local Gateway:    http://localhost:8080/ipfs/$CID"
echo "Public Gateway:   ${IPFS_GATEWAY}${CID}"
echo "Cloudflare:       https://cloudflare-ipfs.com/ipfs/$CID"
echo "Pinata:           https://gateway.pinata.cloud/ipfs/$CID"
echo "================================================"

# Instructions for Klimabaum nodes
echo ""
echo "🌍 Klimabaum Anchor Node Instructions:"
echo "================================================"
echo "To pin on remote nodes, run on each node:"
echo ""
echo "  ipfs pin add $CID"
echo ""
echo "Nodes:"
echo "  1. Yambio_Sudan"
echo "  2. Svalbard_Arctic"
echo "  3. Lantana_Hub"
echo "================================================"

# Test accessibility
echo ""
echo "🧪 Testing accessibility..."
if curl -Is "${IPFS_GATEWAY}${CID}" | head -1 | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✓ Content accessible via public gateway${NC}"
else
    echo -e "${YELLOW}⚠️  Content not yet propagated to public gateway (may take a few minutes)${NC}"
fi

# Generate deployment report
REPORT_FILE="$PROJECT_DIR/IPFS_DEPLOYMENT_REPORT.txt"
cat > "$REPORT_FILE" << EOF
IPFS Deployment Report - Protocol PACT Genesis
===============================================

Deployment Date: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
Root CID: $CID

Access URLs:
- Local: http://localhost:8080/ipfs/$CID
- Public: ${IPFS_GATEWAY}${CID}
- Cloudflare: https://cloudflare-ipfs.com/ipfs/$CID

Status: DEPLOYED

Next Steps:
1. Pin CID on Klimabaum anchor nodes (Yambio, Svalbard, Lantana Hub)
2. Configure DNSLink for human-readable access
3. Verify Byzantine consensus across all nodes
4. Update monitoring dashboard with CID

Klimabaum Node Pinning Command:
  ipfs pin add $CID

Genesis Seal: LEX AMORIS ETERNAL SEAL
OLF Signature: One Love First
===============================================
EOF

echo ""
echo -e "${GREEN}✓ Deployment report saved to: $REPORT_FILE${NC}"
echo ""
echo "🎉 Genesis deployment complete!"
echo "   Protocol: PACT-1.0-GENESIS"
echo "   Status: FINALIZED & ETERNAL"
echo ""
echo "Lex Amoris Signature — OLF (One Love First) 🚀❤️🌍"
