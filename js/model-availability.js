/**
 * Tracks model availability and failures to provide fallbacks
 */
class ModelAvailability {
    // Store model status information
    static modelStatus = {};
    
    // Models to try in order when a model fails
    static fallbackOrder = [
        'openai-large',
        'openai-reasoning', 
        'claude-hybridspace',
        'gemini',
        'gemini-thinking'
    ];
    
    /**
     * Mark a model as failed with error code
     * @param {string} model - Model name
     * @param {number} errorCode - HTTP error code
     */
    static markFailed(model, errorCode) {
        if (!this.modelStatus[model]) {
            this.modelStatus[model] = {
                failures: 0,
                lastError: null,
                lastFailure: null,
                blacklisted: false
            };
        }
        
        const status = this.modelStatus[model];
        status.failures++;
        status.lastError = errorCode;
        status.lastFailure = Date.now();
        
        // If 3 or more failures in short time, blacklist the model temporarily
        if (status.failures >= 3) {
            status.blacklisted = true;
            console.warn(`Model ${model} blacklisted due to repeated failures`);
            
            // Auto-recover after 5 minutes
            setTimeout(() => {
                if (this.modelStatus[model]) {
                    this.modelStatus[model].blacklisted = false;
                    this.modelStatus[model].failures = 0;
                    console.log(`Model ${model} removed from blacklist`);
                }
            }, 5 * 60 * 1000);
        }
    }
    
    /**
     * Check if a model is available (not blacklisted)
     * @param {string} model - Model name
     * @returns {boolean} - Whether model is available
     */
    static isAvailable(model) {
        return !this.modelStatus[model]?.blacklisted;
    }
    
    /**
     * Find alternative model if primary is unavailable
     * @param {string} model - Current model
     * @returns {string|null} - Alternative model or null
     */
    static findAlternative(model) {
        // If model is available, no need for alternative
        if (this.isAvailable(model)) {
            return model;
        }
        
        // Find first available model from fallback order
        for (const fallbackModel of this.fallbackOrder) {
            if (fallbackModel !== model && this.isAvailable(fallbackModel)) {
                return fallbackModel;
            }
        }
        
        // If all models in fallback order are blacklisted, reset blacklist
        // and return the original model as last resort
        for (const modelName in this.modelStatus) {
            if (this.modelStatus[modelName].blacklisted) {
                console.log(`Emergency reset of blacklist for ${modelName}`);
                this.modelStatus[modelName].blacklisted = false;
                this.modelStatus[modelName].failures = 0;
            }
        }
        
        return model; // Return original as last resort
    }
    
    /**
     * Get health status of all tracked models
     * @returns {Object} - Model health information
     */
    static getHealthStatus() {
        const status = {};
        for (const model in this.modelStatus) {
            status[model] = {
                available: this.isAvailable(model),
                failures: this.modelStatus[model].failures,
                lastFailure: this.modelStatus[model].lastFailure
            };
        }
        return status;
    }
}

// Make globally available
window.ModelAvailability = ModelAvailability;
