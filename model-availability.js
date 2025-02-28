/**
 * Tracks model availability and handles fallbacks when models fail
 */
class ModelAvailability {
    constructor() {
        this.modelStatus = {};
        this.failedModels = {};
        this.blacklistedModels = [];
        this.lastCheckTime = {};
        // After 10 minutes, try blacklisted models again
        this.retryInterval = 10 * 60 * 1000;
    }

    /**
     * Mark a model as failed
     * @param {string} model - The model name
     * @param {number} statusCode - HTTP status code of the failure
     */
    markFailed(model, statusCode) {
        if (!this.failedModels[model]) {
            this.failedModels[model] = {
                count: 0,
                firstFail: Date.now(),
                lastFail: Date.now(),
                statusCodes: {}
            };
        }

        const modelStats = this.failedModels[model];
        modelStats.count++;
        modelStats.lastFail = Date.now();
        
        // Track status codes to identify patterns
        if (!modelStats.statusCodes[statusCode]) {
            modelStats.statusCodes[statusCode] = 0;
        }
        modelStats.statusCodes[statusCode]++;
        
        // Check if we should blacklist this model (3+ failures with 500 status)
        if (statusCode === 500 && modelStats.statusCodes[500] >= 3) {
            this.blacklistModel(model);
        }
        
        console.warn(`Model ${model} failed ${modelStats.count} times, status: ${statusCode}`);
    }

    /**
     * Blacklist a model that consistently fails
     * @param {string} model - The model name
     */
    blacklistModel(model) {
        if (!this.blacklistedModels.includes(model)) {
            this.blacklistedModels.push(model);
            this.modelStatus[model] = 'blacklisted';
            console.warn(`Model ${model} has been blacklisted due to repeated failures`);
            
            // Fire event for UI to update
            const event = new CustomEvent('model-blacklisted', {
                detail: { model: model }
            });
            document.dispatchEvent(event);
        }
    }

    /**
     * Check if a model is available
     * @param {string} model - The model name
     * @returns {boolean} - Whether model is available
     */
    isAvailable(model) {
        // If the model is blacklisted, check if we should retry
        if (this.blacklistedModels.includes(model)) {
            const lastFail = this.failedModels[model]?.lastFail || 0;
            const timeSinceFail = Date.now() - lastFail;
            
            // After retry interval, give it another chance
            if (timeSinceFail > this.retryInterval) {
                console.log(`Model ${model} was blacklisted, but we'll try it again`);
                this.blacklistedModels = this.blacklistedModels.filter(m => m !== model);
                return true;
            }
            
            return false;
        }
        
        return true;
    }

    /**
     * Find alternative model from same family
     * @param {string} originalModel - The failing model
     * @returns {string|null} - Alternative model or null
     */
    findAlternative(originalModel) {
        // Map of model families
        const modelFamilies = {
            'deepseek': ['deepseek-coder', 'deepseek-r1', 'deepseek-reasoner'],
            'gemini': ['gemini-thinking'],
            'openai': ['openai-large', 'openai-reasoning'], 
            'llama': ['llamalight'],
            'mistral': ['mistral-nemo'],
        };
        
        // Find the family of the original model
        let family = null;
        Object.entries(modelFamilies).forEach(([familyName, models]) => {
            if (originalModel === familyName || originalModel.startsWith(familyName + '-') || 
                models.includes(originalModel)) {
                family = familyName;
            }
        });
        
        if (!family) return null;
        
        // Get all models from this family (including the base model)
        const familyModels = [family, ...(modelFamilies[family] || [])];
        
        // Find first available alternative
        for (const alternative of familyModels) {
            if (alternative !== originalModel && this.isAvailable(alternative)) {
                return alternative;
            }
        }
        
        // If all models in this family failed, try other families
        const orderedFamilies = ['openai', 'mistral', 'llama', 'gemini'];
        for (const alterFamily of orderedFamilies) {
            if (alterFamily === family) continue; // Skip original family
            
            const altModels = [alterFamily, ...(modelFamilies[alterFamily] || [])];
            for (const alternative of altModels) {
                if (this.isAvailable(alternative)) {
                    return alternative;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Reset a model's failure count
     * @param {string} model - The model name
     */
    resetModel(model) {
        if (this.failedModels[model]) {
            delete this.failedModels[model];
        }
        
        this.blacklistedModels = this.blacklistedModels.filter(m => m !== model);
        this.modelStatus[model] = 'active';
        
        // Fire reset event
        const event = new CustomEvent('model-reset', {
            detail: { model: model }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Get model status info
     * @returns {Object} - Status information for all models
     */
    getStatus() {
        return {
            blacklisted: this.blacklistedModels,
            failures: this.failedModels,
            status: this.modelStatus
        };
    }
}

// Create global instance
window.ModelAvailability = new ModelAvailability();
