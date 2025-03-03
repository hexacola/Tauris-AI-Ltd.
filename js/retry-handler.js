/**
 * Handles API retries with Lithuanian error messages
 */
class RetryHandler {
    /**
     * Execute a function with retry logic
     * @param {Function} fn - Function to execute
     * @param {Object} options - Retry options
     * @returns {Promise} - Promise resolving to the function result
     */
    static async withRetry(fn, options = {}) {
        const {
            maxRetries = 3, 
            delay = 1000,
            backoffFactor = 1.5,
            onRetry = null,
            retryCondition = null,
            modelName = null,
            isPollinationsAPI = false
        } = options;
        
        let lastError;
        let currentDelay = delay;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                // First attempt or retry
                const result = await fn(attempt);
                return result;
            } catch (error) {
                // Save the error
                lastError = error;
                
                // Check if we've reached max retries
                if (attempt >= maxRetries) {
                    break;
                }
                
                // Custom retry logic for Pollinations API
                if (isPollinationsAPI && !this.shouldRetryPollinationsError(error)) {
                    throw error; // Don't retry if it's a permanent error
                }
                
                // Check custom retry condition if provided
                if (retryCondition && !retryCondition(error)) {
                    throw error; // Don't retry if condition not met
                }
                
                // Calculate delay with exponential backoff
                currentDelay = delay * Math.pow(backoffFactor, attempt);
                
                // Add jitter for Pollinations API to prevent thundering herd
                if (isPollinationsAPI) {
                    currentDelay += Math.random() * 500;
                }
                
                // Call the retry callback if provided
                if (onRetry) {
                    onRetry(error, attempt + 1, currentDelay);
                }
                
                // Update status with Lithuanian message
                this.updateRetryStatus(attempt + 1, modelName);
                
                // Show impatient boss animation after certain retries
                if (attempt > 1) {
                    this.showImpatientBoss();
                }
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, currentDelay));
            }
        }
        
        // All retries failed
        const errorMessage = isPollinationsAPI 
            ? this.getPollinationsErrorMessage(lastError, options.modelName)
            : `Nepavyko po ${maxRetries} bandymų: ${lastError.message}`;
            
        throw new Error(errorMessage);
    }
    
    /**
     * Determine if we should retry for Pollinations API errors
     * @param {Error} error - The error to check
     * @returns {boolean} - Whether to retry
     */
    static shouldRetryPollinationsError(error) {
        // Always retry on network or timeout errors
        if (!error.response) return true;
        
        // Retry on server errors (500s)
        if (error.response && error.response.status >= 500) return true;
        
        // Retry on rate limits (429)
        if (error.response && error.response.status === 429) return true;
        
        // Don't retry on client errors (400s) except 429
        if (error.response && error.response.status >= 400 && error.response.status < 500) return false;
        
        // Default to retry
        return true;
    }
    
    /**
     * Get specific error messages for Pollinations API
     * @param {Error} error - The error object
     * @param {string} modelName - Name of the model
     * @returns {string} - Formatted error message
     */
    static getPollinationsErrorMessage(error, modelName) {
        const modelMsg = modelName ? `su modeliu ${modelName}` : '';
        
        if (!error.response) {
            return `Tinklo klaida ${modelMsg}: Patikrinkite interneto ryšį`;
        }
        
        switch (error.response.status) {
            case 400:
                return `Bloga užklausa ${modelMsg}: ${error.message}`;
            case 401:
                return `Autentifikacijos klaida ${modelMsg}`;
            case 404:
                return `Modelis ${modelName} nerastas`;
            case 429:
                return `Per daug užklausų ${modelMsg}. Palaukite kelias minutes.`;
            case 500:
            case 502:
            case 503:
            case 504:
                return `Serverio klaida ${modelMsg} (${error.response.status}). Bandome dar kartą...`;
            default:
                return `Klaida ${modelMsg}: ${error.message}`;
        }
    }
    
    /**
     * Display Lithuanian retry status
     * @param {number} retryNumber - Current retry count
     * @param {string} modelName - Name of the model being retried
     */
    static updateRetryStatus(retryNumber, modelName) {
        // Set model display name based on the model type
        let displayModelName = modelName || 'nežinomas';
        
        // Get fancy model name for display
        const fancyModelName = this.getModelDisplayName(displayModelName);
        
        const statusMessage = `Bandymas #${retryNumber} su modeliu ${fancyModelName}...`;
        
        // Try to update through UI functions first
        if (typeof window.updateProgress === 'function') {
            window.updateProgress(30, statusMessage);
        }
        
        // Also log to console
        console.log(statusMessage);
        
        // Update status message element if exists
        const statusText = document.getElementById('modelStatusText');
        if (statusText) {
            statusText.textContent = statusMessage;
            
            // Show fetching indicator
            const indicator = document.getElementById('fetchingIndicator');
            if (indicator) {
                indicator.classList.add('active');
            }
        }
    }
    
    /**
     * Get friendly display name for models
     * @param {string} modelName - Raw model name
     * @returns {string} - User-friendly model name
     */
    static getModelDisplayName(modelName) {
        const modelMap = {
            'openai': 'GPT-4o-mini',
            'openai-large': 'GPT-4o',
            'openai-reasoning': 'o1-mini',
            'deepseek': 'DeepSeek-V3',
            'claude-hybridspace': 'Claude Hybridspace',
            'gemini': 'Gemini 2.0',
            'deepseek-r1': 'DeepSeek-R1',
            'deepseek-reasoner': 'DeepSeek Reasoner'
        };
        
        return modelMap[modelName] || modelName;
    }
    
    /**
     * Shows the boss being impatient during retries
     */
    static showImpatientBoss() {
        const bossElement = document.querySelector('.boss-container .boss-status');
        
        // Check if BossPhrases is available and use it
        if (window.BossPhrases && bossElement) {
            window.BossPhrases.scheduleBossPhrases(bossElement, 5000);
        }
        
        // Add impatient animation to boss
        const bossCard = document.querySelector('.boss-container');
        if (bossCard) {
            bossCard.classList.add('impatient');
            setTimeout(() => {
                bossCard.classList.remove('impatient');
            }, 3000);
        }
    }
    
    /**
     * Get Lithuanian error message for common API errors
     * @param {Error} error - The original error
     * @returns {string} - Lithuanianized error message
     */
    static getLithuanianErrorMessage(error) {
        if (!error) return 'Nežinoma klaida';
        
        const message = error.message || error.toString();
        
        // Map common error messages to Lithuanian
        if (message.includes('Failed to fetch')) {
            return 'Nepavyko prisijungti prie serverio. Patikrinkite interneto ryšį.';
        } 
        else if (message.includes('timeout') || message.includes('Timed out')) {
            return 'Užklausa užtruko per ilgai. Serveris neatsakė laiku.';
        }
        else if (message.includes('NetworkError')) {
            return 'Tinklo klaida. Patikrinkite interneto ryšį.';
        }
        else if (message.includes('500')) {
            return 'Serverio klaida (500). Bandome dar kartą...';
        }
        else if (message.includes('429')) {
            return 'Per daug užklausų. Palaukite kelias minutes.';
        }
        else if (message.includes('CORS')) {
            return 'CORS klaida. Bandome apeiti per proxy...';
        }
        
        // Pollinations API specific errors
        if (message.includes('pollinations')) {
            if (message.includes('unavailable')) {
                return 'Pollinations API modelis šiuo metu nepasiekiamas. Bandome kitą modelį...';
            }
            if (message.includes('invalid model')) {
                return 'Nurodytas neteisingas Pollinations API modelis.';
            }
        }
        
        // Lithuanian-themed error prefixes
        const prefixes = [
            'Oi, klaida! ',
            'Kad jį kur, ',
            'Po šimts pypkių! ',
            'Vaje! '
        ];
        
        // Prepend a random Lithuanian prefix
        return prefixes[Math.floor(Math.random() * prefixes.length)] + message;
    }
    
    /**
     * Format API response based on model type
     * @param {Object} response - API response
     * @param {string} modelName - Model name
     * @returns {Object} - Formatted response
     */
    static formatApiResponse(response, modelName) {
        // If response is already in expected format, return it
        if (response.choices && response.choices[0].message) {
            return response;
        }
        
        // Handle different response formats from Pollinations API
        if (modelName && modelName.startsWith('openai')) {
            // OpenAI format is likely already correct
            return response;
        } 
        else if (modelName === 'gemini' || modelName === 'gemini-thinking') {
            // Format Gemini response to match OpenAI structure
            return {
                choices: [{
                    message: {
                        role: 'assistant',
                        content: response.text || response.content || response
                    }
                }]
            };
        }
        else if (modelName && modelName.includes('deepseek')) {
            // Format DeepSeek response
            if (typeof response === 'string') {
                return {
                    choices: [{
                        message: {
                            role: 'assistant',
                            content: response
                        }
                    }]
                };
            }
        }
        
        // Generic handler for string responses
        if (typeof response === 'string') {
            return {
                choices: [{
                    message: {
                        role: 'assistant',
                        content: response
                    }
                }]
            };
        }
        
        // Return original if we can't determine format
        return response;
    }
}

// Make available globally
window.RetryHandler = RetryHandler;

// Attach to window error event to provide Lithuanian messages
window.addEventListener('error', function(event) {
    console.error('Klaida:', RetryHandler.getLithuanianErrorMessage(event.error));
});
