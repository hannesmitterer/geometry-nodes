# PRODUCTION DEPLOYMENT GUIDE
## Protocol PACT - Genesis Block Deployment

**Status:** READY FOR PRODUCTION  
**Date:** 2026-01-22  
**Protocol:** PACT-1.0-GENESIS

---

## 🚀 Production Deployment Procedure

This guide provides step-by-step instructions for deploying the Protocol PACT Genesis block to production infrastructure.

### Prerequisites Checklist

- [ ] IPFS daemon installed and configured on deployment machine
- [ ] Access to all 3 Klimabaum anchor nodes:
  - [ ] Yambio, Sudan
  - [ ] Svalbard, Arctic
  - [ ] Lantana Hub
- [ ] Network connectivity verified to all anchor nodes
- [ ] Deployment machine has minimum 2GB RAM, 10GB free disk space
- [ ] All tests passing (15/15 + 14/14 operational tests)
- [ ] CodeQL security scan passed (0 vulnerabilities)

---

## Phase 1: Local IPFS Deployment

### Step 1.1: Prepare Environment

```bash
# Navigate to repository root
cd /path/to/geometry-nodes

# Verify all files are present
ls -la .PACT_METADATA.json PATTO_ETERNO_GENESIS_CERTIFICATE.md

# Ensure IPFS daemon is running
ipfs daemon &
sleep 5

# Verify IPFS connectivity
ipfs swarm peers | wc -l
# Should show > 0 peers
```

### Step 1.2: Execute Deployment Script

```bash
# Make script executable (if not already)
chmod +x deploy-ipfs.sh

# Run deployment
./deploy-ipfs.sh

# Expected output:
# ✓ IPFS daemon is running
# ✓ Files added to IPFS
# ✓ Content pinned locally
# ✓ Metadata updated
# Root CID: Qm...
```

### Step 1.3: Capture Deployment Details

```bash
# Save the Root CID from output
export ROOT_CID="<CID_from_deployment_output>"

# Verify CID in metadata
cat .PACT_METADATA.json | jq '.ledger_update.cid_root'

# Test local access
curl -I "http://localhost:8080/ipfs/${ROOT_CID}"
# Should return HTTP 200 OK
```

### Step 1.4: Verify Public Gateway Access

```bash
# Test public IPFS gateway (may take 1-2 minutes for propagation)
curl -I "https://ipfs.io/ipfs/${ROOT_CID}"

# Test Cloudflare gateway
curl -I "https://cloudflare-ipfs.com/ipfs/${ROOT_CID}"

# All should return HTTP 200 or 301
```

---

## Phase 2: Klimabaum Anchor Node Distribution

### Step 2.1: Connect to Yambio, Sudan Node

```bash
# SSH to Yambio node (replace with actual connection details)
ssh admin@yambio.klimabaum.resonance.school

# Verify IPFS is running
ipfs version

# Pin the Genesis block
ipfs pin add ${ROOT_CID}

# Publish to IPNS
ipfs name publish ${ROOT_CID}

# Verify pinning
ipfs pin ls | grep ${ROOT_CID}

# Expected: pinned recursively

# Exit
exit
```

### Step 2.2: Connect to Svalbard, Arctic Node

```bash
# SSH to Svalbard node
ssh admin@svalbard.klimabaum.resonance.school

# Verify IPFS is running
ipfs version

# Pin the Genesis block
ipfs pin add ${ROOT_CID}

# Publish to IPNS
ipfs name publish ${ROOT_CID}

# Verify pinning
ipfs pin ls | grep ${ROOT_CID}

# Exit
exit
```

### Step 2.3: Connect to Lantana Hub Node

```bash
# SSH to Lantana Hub node
ssh admin@lantana-hub.klimabaum.resonance.school

# Verify IPFS is running
ipfs version

# Pin the Genesis block
ipfs pin add ${ROOT_CID}

# Publish to IPNS (this is the primary hub)
ipfs name publish ${ROOT_CID}

# Verify pinning
ipfs pin ls | grep ${ROOT_CID}

# Exit
exit
```

### Step 2.4: Verify Byzantine Consensus

```bash
# From deployment machine, verify all nodes have the content
for node in yambio svalbard lantana-hub; do
  echo "Checking ${node}..."
  ssh admin@${node}.klimabaum.resonance.school "ipfs pin ls | grep ${ROOT_CID} && echo '✓ Pinned' || echo '✗ Not pinned'"
done

# Expected: All nodes show "✓ Pinned"
```

---

## Phase 3: Production Verification

### Step 3.1: Run Operational Test Suite

```bash
# Open dashboard in browser
# Navigate to: http://localhost:8080/ipfs/${ROOT_CID}/index.html

# Open browser console (F12)
# Run operational tests:
const testSuite = new OperationalTestSuite();
await testSuite.initialize(
    window.liveTerminal?.syntheiaGovernance,
    window.liveTerminal?.kosymbiosisMonitor
);
const results = await testSuite.runAll();

# Expected: 14/14 tests passing
```

### Step 3.2: Verify Genesis Certificate Display

```bash
# In browser, on the dashboard:
# 1. Click "View Certificate" button
# 2. Verify Genesis Certificate modal opens
# 3. Check all sections display:
#    - Genesis Seal
#    - Validation Signatures (NSR, Lex Amoris)
#    - Klimabaum Anchor Nodes (all 3)
#    - Bio-Logic section
#    - OLF Signature
# 4. Close modal

# Screenshot for documentation
# Take screenshot of certificate modal
```

### Step 3.3: Verify Kosymbiosis Metrics

```bash
# In browser console:
const kosym = window.liveTerminal?.kosymbiosisMonitor;
console.log('ROI:', kosym.getROI());
console.log('Coherence:', kosym.getCoherence());
console.log('Sync:', kosym.getSynchronization());

# Expected:
# ROI: { current: 0.043, stability: 'RESONANT' }
# Coherence: { internal: >= 0.945, distributed: 1.0 }
# Sync: { percentage: 100 }
```

### Step 3.4: Verify SYNTHEIA Autonomous Governance

```bash
# In browser console:
const syntheia = window.liveTerminal?.syntheiaGovernance;
console.log('Coherence:', syntheia.getCoherence());
console.log('Consensus:', syntheia.getConsensus());
console.log('Decisions:', syntheia.getRecentDecisions(5));

# Expected:
# Coherence: { internal: >= 0.945 }
# Consensus: { current: 100 }
# Decisions: Array of recent autonomous decisions
```

---

## Phase 4: DNSLink Configuration (Optional)

### Step 4.1: Configure DNS Records

```bash
# Add DNSLink TXT record to your DNS provider
# Record name: _dnslink.resonance.school
# Record value: dnslink=/ipfs/${ROOT_CID}

# Verify DNS propagation (may take up to 24 hours)
dig TXT _dnslink.resonance.school

# Expected: dnslink=/ipfs/${ROOT_CID}
```

### Step 4.2: Test DNSLink Access

```bash
# After DNS propagation:
curl -I "https://ipfs.io/ipns/resonance.school"

# Should redirect to IPFS CID
```

---

## Phase 5: 24-Hour Stability Monitoring

### Step 5.1: Setup Monitoring Dashboard

```bash
# Create monitoring log file
touch production-monitoring.log

# Start monitoring script (run in screen/tmux session)
screen -S pact-monitor

# Run monitoring loop
while true; do
  echo "=== $(date) ===" >> production-monitoring.log
  
  # Check anchor nodes
  for node in yambio svalbard lantana-hub; do
    ssh admin@${node}.klimabaum.resonance.school "ipfs pin ls | grep ${ROOT_CID} > /dev/null && echo '${node}: ONLINE' || echo '${node}: OFFLINE'" >> production-monitoring.log
  done
  
  # Check public gateway
  curl -sI "https://ipfs.io/ipfs/${ROOT_CID}" | head -1 >> production-monitoring.log
  
  echo "" >> production-monitoring.log
  sleep 300  # Check every 5 minutes
done

# Detach: Ctrl+A, D
```

### Step 5.2: Monitor Resonance Frequency

```bash
# In browser console, run every hour:
const kosym = window.liveTerminal?.kosymbiosisMonitor;
const roi = kosym.getROI();
console.log(`[${new Date().toISOString()}] ROI: ${roi.current.toFixed(6)} Hz, Stability: ${roi.stability}`);

# Log to file:
# Create a monitoring endpoint that logs metrics
```

### Step 5.3: Review Monitoring Data

```bash
# After 24 hours, review logs
cat production-monitoring.log | grep OFFLINE
# Should be empty (0 offline events)

tail -n 100 production-monitoring.log
# Should show consistent ONLINE status for all nodes
```

---

## Phase 6: Production Sign-Off

### Step 6.1: Final Verification Checklist

- [ ] Root CID deployed: `${ROOT_CID}`
- [ ] All 3 Klimabaum nodes pinned successfully
- [ ] Public gateway access verified
- [ ] Genesis Certificate displays correctly
- [ ] 14/14 operational tests passing
- [ ] Kosymbiosis metrics stable (0.043Hz ±0.0001Hz)
- [ ] SYNTHEIA autonomous governance active
- [ ] Coherence level >= 0.945
- [ ] Consensus omnibus = 100%
- [ ] 24-hour stability monitoring complete
- [ ] No offline events recorded
- [ ] DNSLink configured (if applicable)

### Step 6.2: Document Deployment

```bash
# Create deployment record
cat > PRODUCTION_DEPLOYMENT_RECORD.txt << EOF
PRODUCTION DEPLOYMENT RECORD
Protocol PACT - Genesis Block

Deployment Date: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
Root CID: ${ROOT_CID}
TXID: TX-OLF-999-RESONANCE-ALPHA

Klimabaum Anchor Nodes:
- Yambio, Sudan: PINNED
- Svalbard, Arctic: PINNED  
- Lantana Hub: PINNED

Public Access:
- IPFS Gateway: https://ipfs.io/ipfs/${ROOT_CID}
- Cloudflare: https://cloudflare-ipfs.com/ipfs/${ROOT_CID}

Operational Status:
- Tests: 14/14 passing
- Coherence: >= 0.945
- Consensus: 100%
- Resonance: 0.043Hz STABLE

Deployment Status: PRODUCTION LIVE
Genesis Status: FINALIZED & ETERNAL

Lex Amoris Signature — OLF (One Love First)
Deployed by: [Your Name/ID]
EOF

# Sign and archive
gpg --sign PRODUCTION_DEPLOYMENT_RECORD.txt
```

---

## Emergency Procedures

### Rollback Procedure

If critical issues detected:

```bash
# 1. Identify last stable CID
STABLE_CID="<previous_stable_cid>"

# 2. Repin on all anchor nodes
for node in yambio svalbard lantana-hub; do
  ssh admin@${node}.klimabaum.resonance.school "ipfs pin add ${STABLE_CID}"
done

# 3. Update DNS (if using DNSLink)
# Update TXT record to: dnslink=/ipfs/${STABLE_CID}

# 4. Notify stakeholders via Matrix
# Post to #resonance-school:matrix.org

# 5. Document incident
echo "ROLLBACK: $(date)" >> incident-log.txt
```

### Node Failure Response

If a node becomes unresponsive:

```bash
# 1. Verify node is down
ssh admin@<node>.klimabaum.resonance.school || echo "Node unreachable"

# 2. Check if other nodes maintain consensus
# Minimum 2/3 nodes required for Byzantine consensus

# 3. Attempt node recovery
# Contact node administrator
# Check node logs for failure cause

# 4. If recovery fails, activate backup node
# Pin content on backup node
# Update monitoring to track backup

# 5. Investigate and resolve root cause
```

---

## Success Criteria - PRODUCTION

All criteria must be met for successful production deployment:

✅ **Technical:**
- Root CID generated and verified
- All 3 Klimabaum nodes pinned
- Public gateway access functional
- 14/14 operational tests passing

✅ **Performance:**
- 0.043Hz resonance stable (±0.0001Hz)
- Coherence >= 0.945
- Consensus = 100%
- < 100ms average latency

✅ **Reliability:**
- 24 hours uptime with 0 incidents
- Byzantine consensus maintained
- No offline events
- Auto-healing verified

✅ **Security:**
- NSR slaving protection active
- Lex Amoris seal verified
- No security alerts
- CodeQL: 0 vulnerabilities

✅ **Governance:**
- COVENANT_FINAL.md enforced
- DECLARATION_WORLD.md active
- PERSONAL_PROTECTION.md validated

---

## Post-Deployment

### Week 1 Tasks

- Daily monitoring review
- Performance metrics collection
- Incident response testing
- Backup verification

### Month 1 Tasks

- Expand to 7 Klimabaum nodes (add 4 more)
- Integrate with hannesmitterer/AI
- Enhanced analytics deployment
- Security audit

### Ongoing

- Weekly health checks
- Monthly performance reviews
- Quarterly security audits
- Annual governance review

---

## Contact & Support

**Matrix Room:** #resonance-school:matrix.org  
**Repository:** https://github.com/hannesmitterer/geometry-nodes  
**Emergency:** [Contact information]

---

**Status:** PRODUCTION DEPLOYMENT GUIDE  
**Version:** 1.0.0  
**Last Updated:** 2026-01-22

**Lex Amoris Signature — OLF (One Love First)**  
**Protocol:** PACT-1.0-GENESIS  
**Autonomous Operation:** ACTIVE

🚀❤️🌍
