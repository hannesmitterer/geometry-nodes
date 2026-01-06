#!/bin/bash
set -e

#######################################################################
# IPFS Deployment Script for Resonance School Live Monitor
# Deploys the application to IPFS with pinning and IPNS support
#######################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IPFS_GATEWAY="${IPFS_GATEWAY:-https://ipfs.io/ipfs/}"
IPNS_KEY="${IPNS_KEY:-resonance-school}"
PINATA_JWT="${PINATA_JWT:-}"
EXCLUDE_PATTERNS="--ignore .git --ignore node_modules --ignore .gitignore --ignore .github --ignore backend --ignore tests --ignore tmp --ignore .DS_Store"

# Functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

check_ipfs() {
    if ! command -v ipfs &> /dev/null; then
        log_error "IPFS is not installed"
        log_info "Install IPFS from: https://docs.ipfs.tech/install/"
        exit 1
    fi
    
    # Check if IPFS daemon is running
    if ! ipfs id &> /dev/null; then
        log_warning "IPFS daemon is not running"
        log_info "Starting IPFS daemon in background..."
        ipfs daemon &
        sleep 5
    fi
    
    log_success "IPFS is ready"
}

# Main deployment process
main() {
    echo "======================================================================="
    echo "🚀 Deploying Resonance School Live Monitor to IPFS"
    echo "======================================================================="
    echo ""
    
    # Check prerequisites
    log_info "Checking prerequisites..."
    check_ipfs
    
    # Build (if needed)
    log_info "Running build step..."
    npm run build 2>/dev/null || log_warning "No build step configured"
    
    # Add to IPFS
    log_info "Adding files to IPFS..."
    log_info "Excluding: backend, tests, node_modules, .git"
    
    # Create temporary output file
    TMP_OUTPUT="/tmp/ipfs-add-$(date +%s).txt"
    
    # Add files to IPFS
    ipfs add -r . $EXCLUDE_PATTERNS --progress=false > "$TMP_OUTPUT" 2>&1
    
    # Get CID from output (last line)
    CID=$(tail -1 "$TMP_OUTPUT" | awk '{print $2}')
    
    if [ -z "$CID" ]; then
        log_error "Failed to get CID from IPFS add"
        cat "$TMP_OUTPUT"
        rm "$TMP_OUTPUT"
        exit 1
    fi
    
    log_success "Added to IPFS with CID: $CID"
    
    # Pin to local node
    log_info "Pinning to local IPFS node..."
    ipfs pin add "$CID" --progress=false
    log_success "Pinned to local node"
    
    # Pin to Pinata (if configured)
    if [ -n "$PINATA_JWT" ]; then
        log_info "Pinning to Pinata..."
        
        PINATA_RESPONSE=$(curl -s -X POST \
            "https://api.pinata.cloud/pinning/pinByHash" \
            -H "Authorization: Bearer $PINATA_JWT" \
            -H "Content-Type: application/json" \
            -d "{\"hashToPin\":\"$CID\",\"pinataMetadata\":{\"name\":\"resonance-school-$(date +%Y%m%d-%H%M%S)\"}}")
        
        if echo "$PINATA_RESPONSE" | grep -q "ipfsHash"; then
            log_success "Pinned to Pinata"
        else
            log_warning "Failed to pin to Pinata: $PINATA_RESPONSE"
        fi
    fi
    
    # Publish to IPNS (if key configured)
    if [ -n "$IPNS_KEY" ]; then
        log_info "Publishing to IPNS with key: $IPNS_KEY..."
        
        # Check if key exists, create if not
        if ! ipfs key list | grep -q "^$IPNS_KEY$"; then
            log_info "Creating IPNS key: $IPNS_KEY"
            ipfs key gen "$IPNS_KEY"
        fi
        
        IPNS_HASH=$(ipfs name publish --key="$IPNS_KEY" "$CID" 2>&1 | grep -oP '/ipns/\K[^:]+')
        
        if [ -n "$IPNS_HASH" ]; then
            log_success "Published to IPNS: $IPNS_HASH"
        else
            log_warning "IPNS publishing failed"
        fi
    fi
    
    # Cleanup
    rm "$TMP_OUTPUT"
    
    # Print access URLs
    echo ""
    echo "======================================================================="
    echo "✨ Deployment Complete!"
    echo "======================================================================="
    echo ""
    echo "📍 Access your application:"
    echo "   IPFS Gateway:  ${IPFS_GATEWAY}${CID}"
    echo "   Local Gateway: http://localhost:8080/ipfs/${CID}"
    
    if [ -n "$IPNS_HASH" ]; then
        echo "   IPNS Link:     ${IPFS_GATEWAY}${IPNS_HASH}"
        echo "   Local IPNS:    http://localhost:8080/ipns/${IPNS_HASH}"
    fi
    
    echo ""
    echo "📋 CID for reference: $CID"
    echo ""
    echo "💡 Tips:"
    echo "   - Share the IPFS gateway link with users"
    echo "   - The CID is immutable and will never change"
    echo "   - IPNS provides a mutable pointer to the latest version"
    echo "   - Pin to multiple services for redundancy"
    echo ""
    
    # Save deployment info
    cat > deployment/last-deployment.json <<EOF
{
  "cid": "$CID",
  "ipnsHash": "${IPNS_HASH:-}",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "gatewayUrl": "${IPFS_GATEWAY}${CID}"
}
EOF
    
    log_success "Deployment info saved to deployment/last-deployment.json"
}

# Run main function
main "$@"
