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
            retryCondition = null
        } = options;
        
        let lastError;
        
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
                
                // Check custom retry condition if provided
                if (retryCondition && !retryCondition(error)) {
                    throw error; // Don't retry if condition not met
                }
                
                // Calculate delay with exponential backoff
                const sleepTime = delay * Math.pow(backoffFactor, attempt);
                
                // Call the retry callback if provided
                if (onRetry) {
                    onRetry(error, attempt + 1, sleepTime);
                }
                
                // Update status with Lithuanian message
                this.updateRetryStatus(attempt + 1, options.modelName);
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, sleepTime));
            }
        }
        
        // All retries failed
        throw new Error(`Nepavyko po ${maxRetries} bandymų: ${lastError.message}`);
    }
    
    /**
     * Display Lithuanian retry status
     * @param {number} retryNumber - Current retry count
     * @param {string} modelName - Name of the model being retried
     */
    static updateRetryStatus(retryNumber, modelName) {
        // Try to update through UI functions first
        if (typeof window.updateProgress === 'function') {
            window.updateProgress(30, `Bandymas #${retryNumber} su modeliu ${modelName || 'nežinomu'}...`);
        }
        
        // Also log to console
        console.log(`Bandymas #${retryNumber} su modeliu ${modelName || 'nežinomu'}...`);
        
        // Update status message element if exists
        const statusText = document.getElementById('modelStatusText');
        if (statusText) {
            statusText.textContent = `Bandymas #${retryNumber} su modeliu ${modelName || 'nežinomu'}...`;
            
            // Show fetching indicator
            const indicator = document.getElementById('fetchingIndicator');
            if (indicator) {
                indicator.classList.add('active');
            }
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
}

// Make available globally
window.RetryHandler = RetryHandler;

// Attach to window error event to provide Lithuanian messages
window.addEventListener('error', function(event) {
    console.error('Klaida:', RetryHandler.getLithuanianErrorMessage(event.error));
});
