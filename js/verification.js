/**
 * Verifies that all components are loaded and working correctly
 * This helps catch issues with missing scripts or components
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Verification script running...');
    
    // Check if required DOM elements exist
    const requiredElements = [
        { id: 'initialPrompt', name: 'Initial prompt textarea' },
        { id: 'writerModel', name: 'Writer model select' },
        { id: 'researcherModel', name: 'Researcher model select' },
        { id: 'criticModel', name: 'Critic model select' },
        { id: 'editorModel', name: 'Editor model select' },
        { id: 'bossModel', name: 'Boss model select' },
        { id: 'startBtn', name: 'Start button' },
        { id: 'stopBtn', name: 'Stop button' },
        { id: 'clearBtn', name: 'Clear button' },
        { id: 'chatLog', name: 'Chat log div' },
        { id: 'finalResult', name: 'Final result div' },
        { id: 'statusMessage', name: 'Status message' }
    ];
    
    let missingElements = [];
    requiredElements.forEach(el => {
        if (!document.getElementById(el.id)) {
            console.error(`Missing required element: ${el.name} (id: ${el.id})`);
            missingElements.push(el.name);
        }
    });
    
    // Check if required scripts exist
    const requiredClasses = [
        { name: 'ApiConnector', errorMessage: 'API connector module not loaded' },
        { name: 'RetryHandler', errorMessage: 'Retry handler module not loaded' },
        { name: 'ErrorAnimations', errorMessage: 'Error animations module not loaded' },
        { name: 'ModelAvailability', errorMessage: 'Model availability module not loaded' },
        { name: 'StampEffects', errorMessage: 'Stamp effects module not loaded' }
    ];
    
    let missingScripts = [];
    requiredClasses.forEach(cls => {
        if (typeof window[cls.name] === 'undefined') {
            console.error(cls.errorMessage);
            missingScripts.push(cls.name);
        }
    });
    
    // Check for important role cards
    const requiredRoleCards = ['writer', 'researcher', 'critic', 'editor', 'boss'];
    let missingRoleCards = [];
    
    requiredRoleCards.forEach(role => {
        if (!document.querySelector(`.role-card.${role}`)) {
            console.error(`Missing role card for ${role}`);
            missingRoleCards.push(role);
        }
    });
    
    // Report any issues
    if (missingElements.length > 0 || missingScripts.length > 0 || missingRoleCards.length > 0) {
        console.error('Verification failed! Some components are missing:');
        if (missingElements.length > 0) {
            console.error('- Missing DOM elements: ' + missingElements.join(', '));
        }
        if (missingScripts.length > 0) {
            console.error('- Missing scripts: ' + missingScripts.join(', '));
        }
        if (missingRoleCards.length > 0) {
            console.error('- Missing role cards: ' + missingRoleCards.join(', '));
        }
        
        // Try to fix issues automatically if possible
        if (missingRoleCards.includes('boss') && document.querySelector('.worker-roles')) {
            console.warn('Attempting to add missing boss role card...');
            addMissingBossCard();
        }
        
        // Show warning to user
        if (document.getElementById('statusMessage')) {
            document.getElementById('statusMessage').textContent = 
                'Dėmesio! Kai kurie komponentai nebuvo tinkamai užkrauti. Atnaujinkite puslapį.';
            document.getElementById('statusMessage').style.color = '#ff3333';
        }
    } else {
        console.log('Verification successful! All components loaded correctly.');
    }
    
    // Fix function to add missing boss card if needed
    function addMissingBossCard() {
        try {
            const workerRoles = document.querySelector('.worker-roles');
            if (!workerRoles) return false;
            
            const bossCard = document.createElement('div');
            bossCard.className = 'role-card boss';
            bossCard.innerHTML = `
                <div class="worker-photo">
                    <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGZpbGw9IiMzMzMiIGN4PSI1MCIgY3k9IjQwIiByPSIyNSIvPjxjaXJjbGUgZmlsbD0iIzU1NSIgY3g9IjUwIiBjeT0iMzAiIHI9IjE4Ii8+PHBhdGggZmlsbD0iIzAwOTkzMCIgZD0iTTIwLDg1YzAtMTYuNiwxMy40LTMwLDMwLTMwczMwLDEzLjQsMzAsMzBINjVjMC04LjMtNi43LTE1LTE1LTE1cy0xNSw2LjctMTUsMTVIMjB6Ii8+PHJlY3QgZmlsbD0iI0ZGREEwMCIgeD0iNDIiIHk9IjI2IiB3aWR0aD0iMTYiIGhlaWdodD0iMTAiIHJ4PSIyIiByeT0iMiIvPjxjaXJjbGUgZmlsbD0iI2VlZSIgY3g9IjQwIiBjeT0iMzUiIHI9IjMiLz48Y2lyY2xlIGZpbGw9IiNlZWUiIGN4PSI2MCIgY3k9IjM1IiByPSIzIi8+PHBhdGggZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZWVlIiBzdHJva2Utd2lkdGg9IjIiIGQ9Ik00MCw0NWMwLDAsMTAsMTAsMjAsMCIvPjwvc3ZnPg==" alt="Boss" class="worker-img">
                    <div class="tie">👔</div>
                </div>
                <h3>Šefas Tauris</h3>
                <p>Mūsų biuro vadovas. Apžvelgia visą darbą ir pateikia galutinį rezultatą. Visada pabrėžia, kad jis pats sugalvojo visas geriausias idėjas.</p>
                <div class="model-selection">
                    <label for="bossModel">Smegenys:</label>
                    <select id="bossModel" class="model-select">
                        <option value="openai-large">OpenAI GPT-4o</option>
                        <option value="openai">OpenAI GPT-4o-mini</option>
                        <option value="llama">Llama 3</option>
                    </select>
                    <div class="worker-mood">Nuotaika: Pasitikintis 💼</div>
                </div>
            `;
            
            workerRoles.appendChild(bossCard);
            console.log('Successfully added missing boss card');
            return true;
        } catch (error) {
            console.error('Failed to add boss card:', error);
            return false;
        }
    }
});

/**
 * System verification and diagnostic tools
 * with Lithuanian-themed status messages
 */
class Verification {
    /**
     * Check system health
     * @returns {Promise<Object>} - System health status
     */
    static async checkSystemHealth() {
        const results = {
            api: false,
            models: false,
            browser: this.checkBrowserCompatibility(),
            localStorage: this.checkLocalStorage(),
            timestamp: new Date().toISOString()
        };
        
        try {
            // Check API availability
            if (window.ApiConnector) {
                results.api = await ApiConnector.checkHealth();
            } else {
                results.api = await fetch('https://text.pollinations.ai/health', {
                    signal: AbortSignal.timeout(3000)
                }).then(r => r.ok).catch(() => false);
            }
        } catch (error) {
            console.error("API health check error:", error);
            results.api = false;
        }
        
        try {
            // Check if models are available
            if (window.ApiHelper) {
                const models = await ApiHelper.getAvailableModels();
                results.models = models && models.length > 0;
                results.modelCount = models ? models.length : 0;
            }
        } catch (error) {
            console.error("Model check error:", error);
            results.models = false;
        }
        
        return results;
    }
    
    /**
     * Check browser compatibility
     * @returns {Object} - Browser compatibility info
     */
    static checkBrowserCompatibility() {
        return {
            fetch: typeof fetch !== 'undefined',
            promise: typeof Promise !== 'undefined',
            localStorage: typeof localStorage !== 'undefined',
            abortController: typeof AbortController !== 'undefined',
            userAgent: navigator.userAgent
        };
    }
    
    /**
     * Check localStorage access
     * @returns {boolean} - If localStorage is working
     */
    static checkLocalStorage() {
        try {
            localStorage.setItem('__test', '1');
            localStorage.removeItem('__test');
            return true;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Get diagnostic info for the model
     * @returns {Promise<string>} - Diagnostic information
     */
    static async getDiagnostics() {
        const health = await this.checkSystemHealth();
        
        let status;
        let lithuanianStatus;
        
        if (health.api && health.models) {
            status = "All systems operational";
            lithuanianStatus = "Visos sistemos veikia puikiai! 🟢";
        } else if (health.api) {
            status = "API available but models may be limited";
            lithuanianStatus = "API veikia, bet modeliai gali būti riboti. 🟡";
        } else {
            status = "System experiencing issues";
            lithuanianStatus = "Sistema susiduria su problemomis. 🔴";
        }
        
        const diagnosticReport = `
SYSTEM DIAGNOSTICS:
------------------
Status: ${status}
API Available: ${health.api ? "Yes" : "No"}
Models Available: ${health.models ? `Yes (${health.modelCount})` : "No"}
Browser Compatibility: ${Object.values(health.browser).filter(v => v === true).length}/4
Local Storage: ${health.localStorage ? "Working" : "Not Available"}
Timestamp: ${health.timestamp}

LITHUANIAN STATUS:
------------------
${lithuanianStatus}
Patikrinimo laikas: ${new Intl.DateTimeFormat('lt-LT', {
    dateStyle: 'medium',
    timeStyle: 'medium'
}).format(new Date())}
`;

        return diagnosticReport;
    }
    
    /**
     * Show diagnostic toast message
     */
    static async showDiagnosticToast() {
        const health = await this.checkSystemHealth();
        
        let message;
        let toastClass;
        
        if (health.api && health.models) {
            message = "Sistemos veikia puikiai! 👍";
            toastClass = "success";
        } else if (health.api) {
            message = "Dėmesio: Kai kurie modeliai gali neveikti. ⚠️";
            toastClass = "warning";
        } else {
            message = "Dėmesio: Sistema susiduria su problemomis. 🚫";
            toastClass = "error";
        }
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `diagnostic-toast ${toastClass}`;
        toast.innerHTML = `
            <div class="toast-content">
                <strong>Sistemos būsena:</strong>
                <p>${message}</p>
            </div>
            <button class="toast-close">×</button>
        `;
        
        // Style the toast
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.left = '20px';
        toast.style.padding = '10px 15px';
        toast.style.backgroundColor = 'var(--bg-card)';
        toast.style.borderRadius = '4px';
        toast.style.boxShadow = '0 2px 10px var(--shadow)';
        toast.style.zIndex = '1000';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.maxWidth = '300px';
        toast.style.animation = 'toast-slide-in 0.5s ease-out';
        
        if (toastClass === 'success') {
            toast.style.borderLeft = '5px solid var(--lt-green)';
        } else if (toastClass === 'warning') {
            toast.style.borderLeft = '5px solid var(--lt-yellow)';
        } else {
            toast.style.borderLeft = '5px solid var(--lt-red)';
        }
        
        // Add close button functionality
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.style.background = 'none';
        closeBtn.style.border = 'none';
        closeBtn.style.marginLeft = '10px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontSize = '20px';
        
        closeBtn.addEventListener('click', () => {
            toast.remove();
        });
        
        // Add toast style
        const style = document.createElement('style');
        style.textContent = `
            @keyframes toast-slide-in {
                from { transform: translateY(100px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        // Add to document
        document.body.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.style.animation = 'fade-out 1s forwards';
                setTimeout(() => toast.remove(), 1000);
            }
        }, 5000);
    }
}

// Initialize verification
document.addEventListener('DOMContentLoaded', () => {
    // Wait for any API/model initialization to complete
    setTimeout(() => {
        Verification.showDiagnosticToast();
    }, 3000);
});

// Make available globally
window.Verification = Verification;
