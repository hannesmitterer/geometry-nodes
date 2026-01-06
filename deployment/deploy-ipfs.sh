#!/bin/bash

###############################################################################
# IPFS Deployment Script for Resonance School Live Terminal
#
# This script automates the deployment of the application to IPFS
#
# Usage:
#   ./deploy-ipfs.sh [options]
#
# Options:
#   -p, --pin        Pin the content after adding
#   -u, --update     Update existing pin
#   -h, --help       Show this help message
#
# License: MIT
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
PIN_CONTENT=false
UPDATE_PIN=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--pin)
            PIN_CONTENT=true
            shift
            ;;
        -u|--update)
            UPDATE_PIN=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  -p, --pin        Pin the content after adding"
            echo "  -u, --update     Update existing pin"
            echo "  -h, --help       Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Print banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║     Resonance School Live Terminal - IPFS Deploy        ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if IPFS is installed
if ! command -v ipfs &> /dev/null; then
    echo -e "${RED}Error: IPFS is not installed${NC}"
    echo "Please install IPFS from: https://docs.ipfs.io/install/"
    exit 1
fi

# Check IPFS version
IPFS_VERSION=$(ipfs --version | cut -d' ' -f3)
echo -e "${GREEN}✓ IPFS version: $IPFS_VERSION${NC}"

# Check if IPFS daemon is running
if ! ipfs swarm peers &> /dev/null; then
    echo -e "${YELLOW}Warning: IPFS daemon might not be running${NC}"
    echo "Starting IPFS daemon in background..."
    ipfs daemon &
    DAEMON_PID=$!
    echo "Waiting for daemon to start..."
    sleep 5
fi

echo -e "${GREEN}✓ IPFS daemon is running${NC}"

# Clean build artifacts
echo -e "\n${BLUE}Cleaning build artifacts...${NC}"
rm -rf node_modules coverage .nyc_output *.log 2>/dev/null || true
echo -e "${GREEN}✓ Cleaned${NC}"

# Create .ipfsignore if it doesn't exist
if [ ! -f .ipfsignore ]; then
    echo -e "\n${BLUE}Creating .ipfsignore...${NC}"
    cat > .ipfsignore << EOF
# Dependencies
node_modules/
package-lock.json
yarn.lock

# Build outputs
dist/
build/
coverage/
.nyc_output/

# Logs
*.log
logs/

# Environment files
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Git
.git/
.gitignore

# Testing
coverage/

# Temporary
tmp/
temp/
*.tmp
EOF
    echo -e "${GREEN}✓ Created .ipfsignore${NC}"
fi

# Add to IPFS
echo -e "\n${BLUE}Adding to IPFS...${NC}"
echo "This may take a few moments..."

# Add with recursion, following .ipfsignore
IPFS_HASH=$(ipfs add -r -Q --ignore-rules-path=.ipfsignore .)

if [ -z "$IPFS_HASH" ]; then
    echo -e "${RED}Error: Failed to add to IPFS${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Added to IPFS${NC}"
echo -e "${GREEN}CID: $IPFS_HASH${NC}"

# Pin if requested
if [ "$PIN_CONTENT" = true ]; then
    echo -e "\n${BLUE}Pinning content...${NC}"
    ipfs pin add "$IPFS_HASH"
    echo -e "${GREEN}✓ Content pinned${NC}"
fi

# Update pin if requested
if [ "$UPDATE_PIN" = true ]; then
    echo -e "\n${BLUE}Updating pin...${NC}"
    # Get previous pin (you might want to store this in a file)
    if [ -f .ipfs-hash ]; then
        OLD_HASH=$(cat .ipfs-hash)
        ipfs pin rm "$OLD_HASH" 2>/dev/null || true
        echo -e "${YELLOW}Removed old pin: $OLD_HASH${NC}"
    fi
    ipfs pin add "$IPFS_HASH"
    echo -e "${GREEN}✓ Pin updated${NC}"
fi

# Save hash for future reference
echo "$IPFS_HASH" > .ipfs-hash
echo -e "${GREEN}✓ CID saved to .ipfs-hash${NC}"

# Display access URLs
echo -e "\n${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Deployment successful!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}CID:${NC} $IPFS_HASH"
echo ""
echo -e "${YELLOW}Access URLs:${NC}"
echo -e "  Local:     ${BLUE}http://localhost:8080/ipfs/$IPFS_HASH${NC}"
echo -e "  Gateway 1: ${BLUE}https://ipfs.io/ipfs/$IPFS_HASH${NC}"
echo -e "  Gateway 2: ${BLUE}https://gateway.ipfs.io/ipfs/$IPFS_HASH${NC}"
echo -e "  Gateway 3: ${BLUE}https://cloudflare-ipfs.com/ipfs/$IPFS_HASH${NC}"
echo ""
echo -e "${YELLOW}Quick commands:${NC}"
echo -e "  View status:   ${BLUE}ipfs pin ls --type=recursive | grep $IPFS_HASH${NC}"
echo -e "  Remove pin:    ${BLUE}ipfs pin rm $IPFS_HASH${NC}"
echo -e "  View stats:    ${BLUE}ipfs stats repo${NC}"
echo ""

# Optional: Announce to IPNS (commented out by default)
# echo -e "${BLUE}Publishing to IPNS...${NC}"
# IPNS_HASH=$(ipfs name publish "$IPFS_HASH" | cut -d' ' -f3 | tr -d ':')
# echo -e "${GREEN}✓ Published to IPNS${NC}"
# echo -e "${YELLOW}IPNS Name:${NC} $IPNS_HASH"
# echo -e "${YELLOW}IPNS URL:${NC} https://ipfs.io/ipns/$IPNS_HASH"

# Optional: Submit to public pinning services
echo -e "${YELLOW}Tip:${NC} Consider pinning to a pinning service for persistence:"
echo "  - Pinata:  https://pinata.cloud/"
echo "  - Infura:  https://infura.io/"
echo "  - Web3.Storage: https://web3.storage/"
echo ""

# Cleanup daemon if we started it
if [ ! -z "$DAEMON_PID" ]; then
    echo -e "${YELLOW}Stopping IPFS daemon...${NC}"
    kill $DAEMON_PID 2>/dev/null || true
fi

echo -e "${GREEN}Done!${NC}"
exit 0
