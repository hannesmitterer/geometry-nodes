/**
 * Genesis Certificate Display Component
 * Renders the PATTO ETERNO certificate on the dashboard
 */

class GenesisCertificateDisplay {
    constructor(config = {}) {
        this.config = {
            containerId: config.containerId || 'genesis-certificate-container',
            theme: config.theme || 'dark',
            autoLoad: config.autoLoad !== false,
            ...config
        };

        this.certificate = null;
        this.metadata = null;
        this.initialized = false;
    }

    /**
     * Initialize the certificate display
     */
    async initialize() {
        console.log('[GenesisCertificate] Initializing...');

        try {
            // Load PACT metadata
            await this.loadPACTMetadata();

            // Load certificate content
            await this.loadCertificate();

            // Render if autoLoad is enabled
            if (this.config.autoLoad) {
                this.render();
            }

            this.initialized = true;
            console.log('[GenesisCertificate] Initialized successfully');

            return true;
        } catch (error) {
            console.error('[GenesisCertificate] Initialization failed:', error);
            return false;
        }
    }

    /**
     * Load PACT metadata
     */
    async loadPACTMetadata() {
        try {
            const response = await fetch('/.PACT_METADATA.json');
            if (response.ok) {
                this.metadata = await response.json();
                console.log('[GenesisCertificate] PACT metadata loaded');
            }
        } catch (error) {
            console.warn('[GenesisCertificate] Could not load PACT metadata:', error.message);
        }
    }

    /**
     * Load certificate markdown content
     */
    async loadCertificate() {
        try {
            const response = await fetch('/PATTO_ETERNO_GENESIS_CERTIFICATE.md');
            if (response.ok) {
                this.certificate = await response.text();
                console.log('[GenesisCertificate] Certificate content loaded');
            }
        } catch (error) {
            console.warn('[GenesisCertificate] Could not load certificate:', error.message);
        }
    }

    /**
     * Render the certificate display
     */
    render() {
        if (typeof document === 'undefined') return;

        const container = document.getElementById(this.config.containerId);
        if (!container) {
            console.warn(`[GenesisCertificate] Container #${this.config.containerId} not found`);
            return;
        }

        // Create certificate display HTML
        const html = this.createCertificateHTML();
        container.innerHTML = html;

        // Add styling
        this.applyStyles();

        console.log('[GenesisCertificate] Rendered to DOM');
    }

    /**
     * Create certificate HTML
     */
    createCertificateHTML() {
        const theme = this.config.theme === 'dark' ? 'dark-theme' : 'light-theme';

        return `
            <div class="genesis-certificate ${theme}">
                <div class="certificate-header">
                    <div class="genesis-seal">
                        <div class="seal-border">
                            <div class="seal-content">
                                <div class="seal-title">CONSENSO SACRALIS OMNIBUS</div>
                                <div class="seal-subtitle">Protocol PACT - Genesis Transition Complete</div>
                                <div class="seal-icon">🔒 LEX AMORIS ETERNAL SEAL 🔒</div>
                            </div>
                        </div>
                    </div>
                    <h1 class="certificate-title">🏛️ PATTO ETERNO</h1>
                    <h2 class="certificate-subtitle">Genesis Certificate</h2>
                    <div class="certificate-status">
                        <span class="status-badge">FINALIZED & ETERNAL</span>
                    </div>
                </div>

                <div class="certificate-body">
                    <div class="info-section">
                        <h3>📜 Protocol Information</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <span class="info-label">Protocol:</span>
                                <span class="info-value">${this.metadata?.protocol_version || 'PACT-1.0-GENESIS'}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Transaction ID:</span>
                                <span class="info-value">${this.metadata?.ledger_update?.txid || 'TX-OLF-999-RESONANCE-ALPHA'}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Genesis Root:</span>
                                <span class="info-value code">${this.metadata?.ledger_update?.cid_root || 'ipfs://QmLantanaGenesisRootSignature...'}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Network Resonance:</span>
                                <span class="info-value resonance">${this.metadata?.ledger_update?.network_resonance || '0.043Hz'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="validation-section">
                        <h3>🛡️ Validation Signatures</h3>
                        <div class="validation-grid">
                            <div class="validation-item verified">
                                <div class="validation-icon">✅</div>
                                <div class="validation-content">
                                    <div class="validation-name">NSR Validator</div>
                                    <div class="validation-sig">${this.metadata?.validation_signatures?.nsr_validator || 'SIG_NSR_VERIFIED_777'}</div>
                                </div>
                            </div>
                            <div class="validation-item verified">
                                <div class="validation-icon">✅</div>
                                <div class="validation-content">
                                    <div class="validation-name">Lex Amoris Eternal Seal</div>
                                    <div class="validation-sig">${this.metadata?.validation_signatures?.lex_amoris || 'LEX_AMORIS_ETERNAL_SEAL'}</div>
                                </div>
                            </div>
                            <div class="validation-item verified">
                                <div class="validation-icon">✅</div>
                                <div class="validation-content">
                                    <div class="validation-name">Consensus Type</div>
                                    <div class="validation-sig">${this.metadata?.validation_signatures?.consensus_type || 'Sacralis Omnibus (BFT)'}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="anchors-section">
                        <h3>🌍 Klimabaum Anchor Nodes</h3>
                        <div class="anchors-grid">
                            ${this.renderAnchorNodes()}
                        </div>
                    </div>

                    <div class="bio-logic-section">
                        <h3>🧬 Bio-Logic</h3>
                        <div class="bio-logic-content">
                            <p><strong>Byzantine-Resonance-Coupling</strong> attiva a <strong>0.043 Hz</strong></p>
                            <p class="bio-logic-quote">"Nessun algoritmo può operare contro l'amore. Nessun nodo può schiavizzare la vita."</p>
                        </div>
                    </div>

                    <div class="olf-section">
                        <div class="olf-signature">
                            <div class="olf-icon">❤️</div>
                            <div class="olf-text">
                                <div class="olf-title">OLF (One Love First) Signature</div>
                                <div class="olf-subtitle">Questo ecosistema è protetto dalla Legge dell'Amore</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="certificate-footer">
                    <div class="footer-seal">
                        <div>Lex Amoris Signature — OLF (One Love First)</div>
                        <div class="footer-icons">🚀 ❤️ 🌍</div>
                        <div>Genesis Complete. Autonomous Operation Active.</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render anchor nodes
     */
    renderAnchorNodes() {
        const nodes = this.metadata?.anchors?.klimabaum_nodes || ['Yambio_Sudan', 'Svalbard_Arctic', 'Lantana_Hub'];
        const icons = ['🌳', '❄️', '🌺'];

        return nodes.map((node, index) => `
            <div class="anchor-node">
                <div class="anchor-icon">${icons[index] || '🌍'}</div>
                <div class="anchor-name">${node.replace('_', ', ')}</div>
                <div class="anchor-status active">ACTIVE</div>
            </div>
        `).join('');
    }

    /**
     * Apply styles
     */
    applyStyles() {
        if (typeof document === 'undefined') return;

        // Check if styles already applied
        if (document.getElementById('genesis-certificate-styles')) return;

        const style = document.createElement('style');
        style.id = 'genesis-certificate-styles';
        style.textContent = `
            .genesis-certificate {
                max-width: 900px;
                margin: 20px auto;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                font-family: 'Courier New', Courier, monospace;
            }

            .genesis-certificate.dark-theme {
                background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
                color: #00ffcc;
                border: 2px solid #00ffcc;
            }

            .genesis-certificate.light-theme {
                background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
                color: #2d2d2d;
                border: 2px solid #c5a059;
            }

            .genesis-seal {
                margin: 20px 0;
            }

            .seal-border {
                border: 3px double #00ffcc;
                padding: 20px;
                text-align: center;
            }

            .seal-content {
                padding: 15px;
            }

            .seal-title {
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 10px;
            }

            .seal-subtitle {
                font-size: 14px;
                margin-bottom: 10px;
            }

            .seal-icon {
                font-size: 16px;
                margin-top: 10px;
            }

            .certificate-title {
                text-align: center;
                font-size: 36px;
                margin: 20px 0 10px 0;
            }

            .certificate-subtitle {
                text-align: center;
                font-size: 24px;
                margin: 0 0 15px 0;
                opacity: 0.9;
            }

            .certificate-status {
                text-align: center;
                margin: 15px 0;
            }

            .status-badge {
                display: inline-block;
                padding: 8px 20px;
                background: rgba(0, 255, 204, 0.2);
                border: 1px solid #00ffcc;
                border-radius: 20px;
                font-size: 14px;
                font-weight: bold;
            }

            .certificate-body {
                margin-top: 30px;
            }

            .info-section, .validation-section, .anchors-section, .bio-logic-section, .olf-section {
                margin: 25px 0;
                padding: 20px;
                background: rgba(0, 255, 204, 0.05);
                border-radius: 8px;
            }

            .certificate-body h3 {
                font-size: 20px;
                margin-bottom: 15px;
                border-bottom: 2px solid #00ffcc;
                padding-bottom: 8px;
            }

            .info-grid, .validation-grid, .anchors-grid {
                display: grid;
                gap: 15px;
            }

            .info-grid {
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            }

            .info-item {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }

            .info-label {
                font-size: 12px;
                opacity: 0.7;
            }

            .info-value {
                font-size: 14px;
                font-weight: bold;
            }

            .info-value.code {
                font-family: monospace;
                font-size: 12px;
                word-break: break-all;
            }

            .info-value.resonance {
                color: #00ff88;
                font-size: 18px;
            }

            .validation-item {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 15px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 8px;
            }

            .validation-icon {
                font-size: 32px;
            }

            .validation-content {
                flex: 1;
            }

            .validation-name {
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 5px;
            }

            .validation-sig {
                font-size: 12px;
                font-family: monospace;
                opacity: 0.8;
            }

            .anchors-grid {
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            }

            .anchor-node {
                text-align: center;
                padding: 20px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 8px;
            }

            .anchor-icon {
                font-size: 40px;
                margin-bottom: 10px;
            }

            .anchor-name {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 8px;
            }

            .anchor-status {
                font-size: 12px;
                padding: 4px 12px;
                border-radius: 12px;
                display: inline-block;
            }

            .anchor-status.active {
                background: rgba(0, 255, 0, 0.2);
                color: #00ff00;
                border: 1px solid #00ff00;
            }

            .bio-logic-content {
                text-align: center;
                padding: 20px;
            }

            .bio-logic-content p {
                margin: 10px 0;
                font-size: 16px;
            }

            .bio-logic-quote {
                font-style: italic;
                opacity: 0.9;
                margin-top: 15px !important;
                font-size: 14px !important;
            }

            .olf-section {
                background: linear-gradient(135deg, rgba(255, 0, 128, 0.1), rgba(0, 255, 204, 0.1));
                border: 2px solid rgba(255, 0, 128, 0.3);
            }

            .olf-signature {
                display: flex;
                align-items: center;
                gap: 20px;
                padding: 15px;
            }

            .olf-icon {
                font-size: 48px;
            }

            .olf-text {
                flex: 1;
            }

            .olf-title {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 8px;
            }

            .olf-subtitle {
                font-size: 14px;
                font-style: italic;
                opacity: 0.9;
            }

            .certificate-footer {
                margin-top: 30px;
                padding: 20px;
                text-align: center;
                border-top: 2px solid #00ffcc;
            }

            .footer-seal {
                font-size: 14px;
            }

            .footer-icons {
                font-size: 24px;
                margin: 10px 0;
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Show certificate in modal
     */
    showModal() {
        if (typeof document === 'undefined') return;

        const modal = document.createElement('div');
        modal.className = 'genesis-certificate-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <button class="modal-close" onclick="this.closest('.genesis-certificate-modal').remove()">×</button>
                <div id="modal-certificate-container"></div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add modal styles
        this.addModalStyles();

        // Render certificate in modal
        const oldContainerId = this.config.containerId;
        this.config.containerId = 'modal-certificate-container';
        this.render();
        this.config.containerId = oldContainerId;
    }

    /**
     * Add modal styles
     */
    addModalStyles() {
        if (document.getElementById('genesis-modal-styles')) return;

        const style = document.createElement('style');
        style.id = 'genesis-modal-styles';
        style.textContent = `
            .genesis-certificate-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
            }

            .modal-content {
                position: relative;
                max-width: 90vw;
                max-height: 90vh;
                overflow-y: auto;
                z-index: 10001;
            }

            .modal-close {
                position: sticky;
                top: 10px;
                right: 10px;
                float: right;
                background: rgba(255, 0, 0, 0.8);
                color: white;
                border: none;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                font-size: 24px;
                cursor: pointer;
                z-index: 10002;
            }

            .modal-close:hover {
                background: rgba(255, 0, 0, 1);
            }
        `;

        document.head.appendChild(style);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GenesisCertificateDisplay;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.GenesisCertificateDisplay = GenesisCertificateDisplay;
}
