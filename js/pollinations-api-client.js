/**
 * Client for interacting with the Pollinations API
 */
class PollinationsApiClient {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || 'https://text.pollinations.ai';
        this.defaultModel = options.defaultModel || 'openai';
        this.maxRetries = options.maxRetries || 3;
        this.timeout = options.timeout || 30000; // 30s timeout
        this.useJson = options.useJson !== false; // Default to true
    }
    
    /**
     * Generate text using GET method
     * @param {string} prompt - Text prompt
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} - Generated text response
     */
    async generateWithGet(prompt, options = {}) {
        const {
            model = this.defaultModel,
            system = 'You are a helpful assistant.',
            seed = undefined,
            isPrivate = true,
            json = this.useJson
        } = options;
        
        // URL encode parameters
        const encodedPrompt = encodeURIComponent(prompt);
        const encodedSystem = encodeURIComponent(system);
        
        // Build URL with query parameters
        let url = `${this.baseUrl}/${encodedPrompt}?model=${model}`;
        
        if (seed !== undefined) url += `&seed=${seed}`;
        if (json) url += '&json=true';
        if (system) url += `&system=${encodedSystem}`;
        if (isPrivate) url += '&private=true';
        
        // Use RetryHandler for the fetch operation
        return RetryHandler.withRetry(
            async () => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeout);
                
                try {
                    const response = await fetch(url, {
                        method: 'GET',
                        signal: controller.signal
                    });
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`Pollinations API error (${response.status}): ${errorText}`);
                    }
                    
                    // Parse response based on expected format
                    const result = json ? await response.json() : await response.text();
                    return RetryHandler.formatApiResponse(result, model);
                } finally {
                    clearTimeout(timeoutId);
                }
            },
            {
                maxRetries: this.maxRetries,
                modelName: model,
                isPollinationsAPI: true,
                onRetry: (error, attempt) => {
                    console.warn(`Retry attempt ${attempt} for Pollinations API (${model}):`, error.message);
                }
            }
        );
    }
    
    /**
     * Generate text using POST method
     * @param {Array} messages - Message array
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} - Generated text response
     */
    async generateWithPost(messages, options = {}) {
        const {
            model = this.defaultModel,
            seed = undefined,
            jsonMode = this.useJson,
            isPrivate = true,
            tools = undefined,
            tool_choice = undefined
        } = options;
        
        // Prepare request payload
        const payload = {
            messages,
            model,
            private: isPrivate
        };
        
        // Add optional parameters if provided
        if (seed !== undefined) payload.seed = seed;
        if (jsonMode) payload.jsonMode = true;
        if (tools && tools.length > 0) payload.tools = tools;
        if (tool_choice) payload.tool_choice = tool_choice;
        
        // Use RetryHandler for the fetch operation
        return RetryHandler.withRetry(
            async () => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeout);
                
                try {
                    const response = await fetch(this.baseUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload),
                        signal: controller.signal
                    });
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`Pollinations API error (${response.status}): ${errorText}`);
                    }
                    
                    // Parse response based on expected format
                    const result = await response.json();
                    return RetryHandler.formatApiResponse(result, model);
                } finally {
                    clearTimeout(timeoutId);
                }
            },
            {
                maxRetries: this.maxRetries,
                modelName: model,
                isPollinationsAPI: true,
                onRetry: (error, attempt) => {
                    console.warn(`Retry attempt ${attempt} for Pollinations API POST (${model}):`, error.message);
                }
            }
        );
    }
    
    /**
     * Generate text with vision capabilities
     * @param {Array} messages - Messages with image content
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} - Generated text response
     */
    async generateWithVision(messages, options = {}) {
        // Default to vision-capable model if none specified
        const visionOptions = {
            ...options,
            model: options.model || 'openai'
        };
        
        // Check if model supports vision
        if (!this.supportsVision(visionOptions.model)) {
            throw new Error(`Model ${visionOptions.model} does not support vision capabilities`);
        }
        
        // Use the POST method for vision requests
        return this.generateWithPost(messages, visionOptions);
    }
    
    /**
     * Check if a model supports vision capabilities
     * @param {string} model - Model name to check
     * @returns {boolean} - Whether model supports vision
     */
    supportsVision(model) {
        const visionModels = ['openai', 'openai-large', 'claude-hybridspace'];
        return visionModels.includes(model);
    }
    
    /**
     * Generate text with function calling capabilities
     * @param {Array} messages - Messages
     * @param {Array} tools - Function definitions
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} - Generated text response
     */
    async generateWithFunctions(messages, tools, options = {}) {
        // Use the POST method with tools parameter
        return this.generateWithPost(messages, {
            ...options,
            tools,
            tool_choice: options.tool_choice || 'auto'
        });
    }
}

// Make available globally
window.PollinationsApiClient = PollinationsApiClient;
