/**
 * Class to monitor model availability and handle failures
 */
class ModelAvailability {
    constructor() {
        this.failedModels = {};
        this.modelPreferences = {
            'openai-large': ['openai-reasoning', 'claude-hybridspace', 'gemini'],
            'openai-reasoning': ['openai-large', 'gemini-thinking', 'claude-hybridspace'],
            'gemini': ['gemini-thinking', 'openai-large', 'claude-hybridspace'],
            'gemini-thinking': ['gemini', 'openai-reasoning', 'claude-hybridspace'],
            'claude-hybridspace': ['openai-large', 'gemini', 'openai-reasoning'],
            'searchgpt': ['openai-reasoning', 'openai-large', 'gemini']
        };
        
        // Attempts before blacklisting
        this.failureThreshold = 3;
        
        // How long to blacklist a model (in milliseconds)
        this.blacklistDuration = 5 * 60 * 1000; // 5 minutes
        
        // Load previous state from local storage if available
        this.loadState();
    }
    
    /**
     * Check if a model is available (not blacklisted)
     */
    isAvailable(model) {
        if (!this.failedModels[model]) return true;
        
        // Check if the blacklist period has expired
        const now = Date.now();
        if (now - this.failedModels[model].timestamp > this.blacklistDuration) {
            // Model's blacklist period has expired, make it available again
            delete this.failedModels[model];
            this.saveState();
            return true;
        }
        
        return false;
    }
    
    /**
     * Mark a model as failed
     */
    markFailed(model, errorCode = null) {
        if (!this.failedModels[model]) {
            this.failedModels[model] = {
                count: 0,
                timestamp: Date.now(),
                errorCodes: []
            };
        }
        
        this.failedModels[model].count++;
        if (errorCode) {
            this.failedModels[model].errorCodes.push(errorCode);
        }
        
        // Update timestamp
        this.failedModels[model].timestamp = Date.now();
        
        // If failures exceed threshold, emit an event
        if (this.failedModels[model].count >= this.failureThreshold) {
            this.blacklistModel(model);
        }
        
        // Save state to local storage
        this.saveState();
    }
    
    /**
     * Blacklist a model and notify application
     */
    blacklistModel(model) {
        console.warn(`Model ${model} has been blacklisted after ${this.failedModels[model].count} failures`);
        
        // Dispatch event for the application to respond
        const event = new CustomEvent('model-blacklisted', {
            detail: {
                model: model,
                failures: this.failedModels[model].count,
                errorCodes: this.failedModels[model].errorCodes
            }
        });
        
        document.dispatchEvent(event);
    }
    
    /**
     * Find an alternative model when one is blacklisted
     */
    findAlternative(model) {
        // If model isn't blacklisted, use it
        if (this.isAvailable(model)) return model;
        
        // Get alternatives in preference order
        const alternatives = this.modelPreferences[model] || [];
        
        // Find first available alternative
        for (const alt of alternatives) {
            if (this.isAvailable(alt)) {
                return alt;
            }
        }
        
        // If no alternatives, use first model in our preference list that's available
        const allModels = Object.keys(this.modelPreferences);
        for (const potential of allModels) {
            if (this.isAvailable(potential)) {
                return potential;
            }
        }
        
        // If all else fails, return the original model
        // This forces the system to try it, even though it might fail
        console.warn(`No available alternative models found. Defaulting to original model ${model}`);
        return model;
    }
    
    /**
     * Save the current state to localStorage
     */
    saveState() {
        try {
            localStorage.setItem('modelAvailability', JSON.stringify({
                failedModels: this.failedModels,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('Failed to save model availability state to localStorage:', e);
        }
    }
    
    /**
     * Load state from localStorage
     */
    loadState() {
        try {
            const saved = localStorage.getItem('modelAvailability');
            if (saved) {
                const data = JSON.parse(saved);
                
                // Only use saved data if it's less than 30 minutes old
                if (data && data.timestamp && (Date.now() - data.timestamp) < 30 * 60 * 1000) {
                    this.failedModels = data.failedModels || {};
                } else {
                    // Clear expired data
                    localStorage.removeItem('modelAvailability');
                }
            }
        } catch (e) {
            console.warn('Failed to load model availability state:', e);
        }
    }
}

// Initialize and export
window.ModelAvailability = new ModelAvailability();
