/**
 * API Connector that implements the exact Pollinations API specification
 */
class ApiConnector {
    /**
     * Generates text using the Pollinations API
     * @param {string} prompt - User prompt
     * @param {string} systemPrompt - System instructions
     * @param {string} model - Model name
     * @param {object} options - Additional options
     * @returns {Promise<string>} - Generated text
     */
    static async generateText(prompt, systemPrompt, model = 'openai', options = {}) {
        const {
            seed = Math.floor(Math.random() * 10000),
            jsonMode = false,
            timeout = 120000, // Increased timeout to 120 seconds for longer responses
            isPrivate = true,
            forcePost = false,
            maxTokens = 20000 // Default to 8192 tokens (about 6000 words) for longer responses
        } = options;
        
        // Check if model is known to fail with 500 errors
        if (window.ModelAvailability && !window.ModelAvailability.isAvailable(model)) {
            const alternative = window.ModelAvailability.findAlternative(model);
            if (alternative) {
                console.log(`Model ${model} is blacklisted. Using ${alternative} instead.`);
                return this.generateText(prompt, systemPrompt, alternative, options);
            } else {
                console.warn("All models seem to be failing! Trying with openai anyway.");
                model = 'openai'; 
            }
        }
        
        // Track generation time and update UI
        const startTime = Date.now();
        this.showFetchingStatus(true, `Requesting ${model} (extended response)...`);
        
        // Check if prompt is too long (> 8000 chars) - URLs have length limits
        const promptLength = prompt.length + systemPrompt.length;
        const usePostOnly = forcePost || promptLength > 20000; // Force POST for long prompts
        
        try {
            // Always use POST method for consistency with API docs
            console.log(`Generating with ${model} using POST method (max tokens: ${maxTokens})`);
            
            // Create proper message structure according to API documentation
            const postData = {
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                model: model,
                seed: seed,
                private: isPrivate,
                max_tokens: maxTokens // Add max_tokens parameter for longer responses
            };
            
            if (jsonMode) {
                postData.jsonMode = true;
            }
            
            // Create an AbortController to handle timeouts manually
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
                console.warn(`Request timeout after ${timeout/1000}s`);
            }, timeout);
            
            try {
                // Use POST method as documented in the API
                const response = await fetch('https://text.pollinations.ai/', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json, text/plain, */*'
                    },
                    body: JSON.stringify(postData),
                    signal: controller.signal
                });
                
                // Clear timeout since request completed
                clearTimeout(timeoutId);
                
                // If server returns 500 error, mark model as problematic
                if (response.status === 500) {
                    if (window.ModelAvailability) {
                        window.ModelAvailability.markFailed(model, 500);
                    }
                    throw new Error(`HTTP error: 500 (Server error) with model ${model}`);
                }
                
                if (!response.ok) {
                    throw new Error(`HTTP error: ${response.status}`);
                }
                
                const contentType = response.headers.get('content-type') || '';
                const duration = ((Date.now() - startTime) / 1000).toFixed(1);
                this.showFetchingStatus(false);
                
                // Handle response based on content type
                const responseText = await response.text();
                
                // Check if the response is empty
                if (!responseText.trim()) {
                    throw new Error("Empty response received from API");
                }
                
                if (contentType.includes('application/json')) {
                    try {
                        const data = JSON.parse(responseText);
                        
                        // Structure matches the API docs (choices[0].message.content)
                        if (data.choices && data.choices[0] && data.choices[0].message) {
                            console.log(`Generated text with ${model} in ${duration}s (${data.choices[0].message.content.length} chars)`);
                            return data.choices[0].message.content;
                        } else if (data.text) {
                            console.log(`Generated text with ${model} in ${duration}s (${data.text.length} chars)`);
                            return data.text;
                        } else {
                            throw new Error("Unexpected JSON response structure");
                        }
                    } catch (jsonParseError) {
                        console.warn(`Response claimed to be JSON but couldn't parse: ${jsonParseError.message}`);
                        // Fallback to text if it looks valid
                        if (responseText.includes("As the") || responseText.includes("I've") || responseText.length > 50) {
                            return responseText;
                        }
                        throw new Error(`Invalid JSON response: ${jsonParseError.message}`);
                    }
                } else {
                    // Plain text response
                    console.log(`Got text response from ${model} in ${duration}s (${responseText.length} chars)`);
                    return responseText;
                }
                
            } catch (postError) {
                // Clear timeout if it hasn't fired yet
                clearTimeout(timeoutId);
                
                // If we get a 500 error, mark model as problematic
                if (postError.message.includes('500')) {
                    if (window.ModelAvailability) {
                        window.ModelAvailability.markFailed(model, 500);
                        
                        // Try alternative model
                        const alternative = window.ModelAvailability.findAlternative(model);
                        if (alternative) {
                            console.log(`Model ${model} failed with 500. Trying ${alternative} instead.`);
                            return this.generateText(prompt, systemPrompt, alternative, options);
                        }
                    }
                }
                
                // If POST fails and error isn't network-related, try GET method as fallback
                if (!usePostOnly && !postError.name === 'AbortError' && 
                    !postError.message.includes('NetworkError') && 
                    !postError.message.includes('Failed to fetch')) {
                    
                    console.warn(`POST failed: ${postError.message}. Trying GET method as fallback...`);
                    this.showFetchingStatus(true, `POST failed, trying GET...`);
                    
                    // Use GET method as documented in the API
                    const encodedPrompt = encodeURIComponent(prompt);
                    const encodedSystem = encodeURIComponent(systemPrompt);
                    
                    // Check URL length for GET request
                    const estimatedUrlLength = `https://text.pollinations.ai/${encodedPrompt}?model=${model}&system=${encodedSystem}&seed=${seed}&private=${isPrivate}&max_tokens=${maxTokens}`.length;
                    
                    if (estimatedUrlLength > 8000) {
                        console.warn(`URL too long (${estimatedUrlLength} chars) for GET request. Truncating prompt.`);
                        const maxPromptLength = prompt.length - (estimatedUrlLength - 20000);
                        const truncatedPrompt = prompt.substring(0, maxPromptLength) + "... [truncated]";
                        return this.generateText(truncatedPrompt, systemPrompt, model, options);
                    }
                    
                    // Create GET request according to API documentation
                    const getController = new AbortController();
                    const getTimeoutId = setTimeout(() => {
                        getController.abort();
                    }, timeout);
                    
                    try {
                        const getResponse = await fetch(`https://text.pollinations.ai/${encodedPrompt}?model=${model}&system=${encodedSystem}&seed=${seed}&private=${isPrivate}&max_tokens=${maxTokens}`, {
                            method: 'GET',
                            headers: {
                                'Accept': 'application/json, text/plain, */*',
                                'Cache-Control': 'no-cache'
                            },
                            signal: getController.signal
                        });
                        
                        clearTimeout(getTimeoutId);
                        
                        if (getResponse.status === 500) {
                            if (window.ModelAvailability) {
                                window.ModelAvailability.markFailed(model, 500);
                                
                                const alternative = window.ModelAvailability.findAlternative(model);
                                if (alternative) {
                                    console.log(`Model ${model} failed with 500. Trying ${alternative} instead.`);
                                    return this.generateText(prompt, systemPrompt, alternative, options);
                                }
                            }
                            throw new Error(`GET request failed: 500 with model ${model}`);
                        }
                        
                        if (!getResponse.ok) {
                            throw new Error(`GET request failed: ${getResponse.status}`);
                        }
                        
                        // Process GET response
                        const responseText = await getResponse.text();
                        const contentType = getResponse.headers.get('content-type') || '';
                        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
                        this.showFetchingStatus(false);
                        
                        if (contentType.includes('application/json')) {
                            try {
                                const data = JSON.parse(responseText);
                                if (data.choices && data.choices[0] && data.choices[0].message) {
                                    console.log(`Generated text with ${model} in ${duration}s (${data.choices[0].message.content.length} chars)`);
                                    return data.choices[0].message.content;
                                } else if (data.text) {
                                    console.log(`Generated text with ${model} in ${duration}s (${data.text.length} chars)`);
                                    return data.text;
                                } else {
                                    return JSON.stringify(data);
                                }
                            } catch (jsonParseError) {
                                // Fallback to text if it looks valid
                                if (responseText.includes("As the") || responseText.includes("I've")) {
                                    return responseText;
                                }
                                throw jsonParseError;
                            }
                        } else {
                            // Plain text response
                            console.log(`Got text response from ${model} in ${duration}s (${responseText.length} chars)`);
                            return responseText;
                        }
                    } catch (getError) {
                        clearTimeout(getTimeoutId);
                        
                        if (getError.message.includes('500')) {
                            if (window.ModelAvailability) {
                                window.ModelAvailability.markFailed(model, 500);
                                
                                const alternative = window.ModelAvailability.findAlternative(model);
                                if (alternative && alternative !== model) {
                                    console.log(`Model ${model} failed with 500. Trying ${alternative} instead.`);
                                    return this.generateText(prompt, systemPrompt, alternative, options);
                                }
                            }
                        }
                        throw getError;
                    }
                } else {
                    // If we're already using POST only or the error is network-related, rethrow
                    throw postError;
                }
            }
        } catch (error) {
            this.showFetchingStatus(false);
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            
            let errorMsg = `Failed after ${duration}s: `;
            
            if (error.name === 'AbortError') {
                errorMsg += `Request timed out after ${timeout/1000} seconds`;
            } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                errorMsg += 'Network connection issue. Please check your internet connection.';
            } else if (error.message.includes('CORS')) {
                errorMsg += 'CORS policy error. Try refreshing or using a different model.';
            } else if (error.message.includes("Unexpected token")) {
                errorMsg += 'Invalid JSON response from API. The server might be returning a format we cannot process.';
            } else if (error.message.includes("500")) {
                errorMsg += `Server error with ${model}. The model might be temporarily unavailable.`;
                
                // For 500 errors, try to use a different model
                if (window.ModelAvailability) {
                    const alternative = window.ModelAvailability.findAlternative(model);
                    if (alternative && alternative !== model) {
                        console.log(`Finding alternative for ${model} due to 500 error. Using ${alternative}`);
                        // Return the alternative model's response
                        return this.generateText(prompt, systemPrompt, alternative, options);
                    }
                }
            } else {
                errorMsg += error.message;
            }
            
            console.error(`${errorMsg} (model: ${model})`);
            throw new Error(errorMsg);
        }
    }
    
    /**
     * Gets available models from the API
     * @returns {Promise<Array>} - List of available models
     */
    static async getModels() {
        try {
            const response = await fetch('https://text.pollinations.ai/models', {
                headers: { 'Cache-Control': 'no-cache' },
                signal: AbortSignal.timeout(5000)
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch models: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching models:', error);
            return this.getFallbackModels();
        }
    }
    
    /**
     * Gets only the preferred model families
     * @returns {Promise<Array>} - Filtered list of models
     */
    static async getPreferredModels() {
        const allModels = await this.getModels();
        return this.filterPreferredModels(allModels);
    }
    
    /**
     * Filters models to include only the specified allowed models
     */
    static filterPreferredModels(models) {
        // Use only these specific models with exact specifications
        const allowedModels = [
            'openai-large',     // GPT-4o
            'openai-reasoning', // o1-mini
            'searchgpt',        // SearchGPT with internet access
            'gemini',           // Gemini 2.0 Flash
            'gemini-thinking',  // Gemini 2.0 Flash Thinking
            'claude-hybridspace' // Claude Hybridspace
        ];
        
        // Filter to only include allowed models
        const filtered = models.filter(model => 
            allowedModels.includes(model.name)
        );
        
        // Sort by priority
        filtered.sort((a, b) => {
            // Priority order
            const modelOrder = {
                'openai-large': 1,
                'openai-reasoning': 2,
                'gemini': 3,
                'gemini-thinking': 4,
                'claude-hybridspace': 5,
                'searchgpt': 6
            };
            
            const aOrder = modelOrder[a.name] || 99;
            const bOrder = modelOrder[b.name] || 99;
            
            return aOrder - bOrder;
        });
        
        // Make sure all models are included even if API doesn't return them
        const existingModelNames = filtered.map(m => m.name);
        allowedModels.forEach(modelName => {
            if (!existingModelNames.includes(modelName)) {
                const modelData = this.getModelData(modelName);
                if (modelData) {
                    filtered.push(modelData);
                }
            }
        });
        
        return filtered;
    }
    
    /**
     * Get data for a specific model
     */
    static getModelData(modelName) {
        const modelData = {
            'openai-large': { 
                name: 'openai-large',
                type: 'chat',
                censored: true,
                description: 'OpenAI GPT-4o',
                baseModel: true,
                vision: true,
                maxTokens: 20000
            },
            'openai-reasoning': {
                name: 'openai-reasoning',
                type: 'chat',
                censored: true,
                description: 'OpenAI o1-mini',
                baseModel: true,
                reasoning: true,
                maxTokens: 20000
            },
            'searchgpt': {
                name: 'searchgpt',
                type: 'chat',
                censored: true,
                description: 'SearchGPT with realtime news and web search',
                baseModel: false,
                internet: true,
                maxTokens: 20000
            },
            'gemini': {
                name: 'gemini',
                type: 'chat',
                censored: true,
                description: 'Gemini 2.0 Flash',
                baseModel: true,
                provider: 'google',
                maxTokens: 20000
            },
            'gemini-thinking': {
                name: 'gemini-thinking',
                type: 'chat',
                censored: true,
                description: 'Gemini 2.0 Flash Thinking',
                baseModel: true,
                provider: 'google',
                maxTokens: 20000
            },
            'claude-hybridspace': {
                name: 'claude-hybridspace',
                type: 'chat',
                censored: true,
                description: 'Claude Hybridspace',
                baseModel: true,
                maxTokens: 20000
            }
        };
        
        return modelData[modelName];
    }
    
    /**
     * Returns fallback models in case API fails
     */
    static getFallbackModels() {
        return [
            // OpenAI models
            { 
                name: 'openai-large',
                type: 'chat',
                censored: true,
                description: 'OpenAI GPT-4o',
                baseModel: true,
                vision: true,
                maxTokens: 20000
            },
            { 
                name: 'openai-reasoning',
                type: 'chat',
                censored: true,
                description: 'OpenAI o1-mini',
                baseModel: true,
                reasoning: true,
                maxTokens: 20000
            },
            // Gemini models
            {
                name: 'gemini',
                type: 'chat',
                censored: true,
                description: 'Gemini 2.0 Flash',
                baseModel: true,
                provider: 'google',
                maxTokens: 20000
            },
            {
                name: 'gemini-thinking',
                type: 'chat',
                censored: true,
                description: 'Gemini 2.0 Flash Thinking',
                baseModel: true,
                provider: 'google',
                maxTokens: 20000
            },
            // Claude model
            {
                name: 'claude-hybridspace',
                type: 'chat',
                censored: true,
                description: 'Claude Hybridspace',
                baseModel: true,
                maxTokens: 20000
            },
            // SearchGPT
            {
                name: 'searchgpt',
                type: 'chat',
                censored: true,
                description: 'SearchGPT with realtime news and web search',
                baseModel: false,
                internet: true,
                maxTokens: 20000
            }
        ];
    }
    
    /**
     * Check API health
     */
    static async checkHealth() {
        // Naudojame paprastą cache, kad neretai neklaustume API (cache galiojimas 5 sekundes)
        if (!this._healthCache) {
            this._healthCache = { value: null, timestamp: 0 };
        }
        const now = Date.now();
        if (now - this._healthCache.timestamp < 5000) {
            return this._healthCache.value;
        }
        try {
            const response = await fetch('https://text.pollinations.ai/health', {
                signal: AbortSignal.timeout(3000)
            });
            const ok = response.ok;
            this._healthCache = { value: ok, timestamp: now };
            return ok;
        } catch (error) {
            this._healthCache = { value: false, timestamp: now };
            return false;
        }
    }
    
    /**
     * Updates the UI to show fetching status
     */
    static showFetchingStatus(active, message = '') {
        const indicator = document.getElementById('fetchingIndicator');
        const statusText = document.getElementById('modelStatusText');
        
        if (indicator) {
            indicator.classList.toggle('active', active);
        }
        
        if (statusText && message) {
            statusText.textContent = message;
        } else if (statusText) {
            statusText.textContent = active ? 'Fetching response...' : '';
        }
    }
    
    /**
     * Improves conversation history formatting to maintain context between workers
     * @param {Array} conversationHistory - The full conversation history array
     * @param {number} maxMessages - Maximum number of messages to include
     * @returns {string} - Formatted conversation history for API context
     */
    static formatConversationForApi(conversationHistory, maxMessages = 20) { // Increased from 10 to 20
        // Always include the initial topic/prompt if available
        let result = "";
        const initialTopic = conversationHistory.find(msg => msg.role === 'System');
        
        if (initialTopic) {
            result += `TOPIC: ${initialTopic.content}\n\n`;
        }
        
        // Get the last N messages (excluding system messages)
        const relevantMessages = conversationHistory
            .filter(msg => msg.role !== 'System')
            .slice(-maxMessages);
            
        // Format as proper conversation
        relevantMessages.forEach(msg => {
            result += `${msg.role}: ${msg.content}\n\n---\n\n`;
        });
        
        return result;
    }
    
    /**
     * Reduces conversation history to fit within API limits
     * @param {string} history - The full conversation history
     * @param {number} maxLength - Maximum allowed length
     * @returns {string} - Truncated history
     */
    static trimConversationHistory(history, maxLength = 100000) { // Increased from 12000 to 24000
        if (history.length <= maxLength) return history;
        
        // Split by the separator pattern
        const parts = history.split('---\n\n');
        
        // Always keep the first part (topic) and last two exchanges
        const firstPart = parts[0];
        const lastParts = parts.slice(-4); // Keep last 4 messages for better context
        
        // Create a shortened history
        return firstPart + '\n\n---\n\n[Earlier conversation omitted for brevity]\n\n---\n\n' + lastParts.join('---\n\n');
    }
}

// Make available globally
window.ApiConnector = ApiConnector;
