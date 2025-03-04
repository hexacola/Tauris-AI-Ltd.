/**
 * Fallback API helper in case ApiConnector fails to load
 */
class ApiHelper {
    /**
     * Simple text generation - fallback if ApiConnector is missing
     * @param {string} prompt - User prompt
     * @param {string} systemPrompt - System instructions 
     * @param {string} model - Model name
     * @returns {Promise<string>} - Generated text
     */
    static async generateText(prompt, systemPrompt, model = 'openai', options = {}) {
        console.warn('Using ApiHelper fallback instead of ApiConnector - functionality may be limited');
        
        const maxTokens = options.maxTokens || 8192; // Match the increased token limit
        
        try {
            const encodedPrompt = encodeURIComponent(prompt);
            const encodedSystem = encodeURIComponent(systemPrompt);
            
            // Include max_tokens parameter in URL
            const url = `https://text.pollinations.ai/${encodedPrompt}?model=${model}&system=${encodedSystem}&max_tokens=${maxTokens}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'text/plain',
                    'Cache-Control': 'no-cache'
                },
                signal: AbortSignal.timeout(120000) // Increased to 120 seconds to match ApiConnector
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            
            return await response.text();
        } catch (error) {
            console.error(`Error in fallback ApiHelper:`, error);
            throw error;
        }
    }
    
    /**
     * Simpler API availability check
     * @returns {Promise<boolean>} - Whether API is reachable
     */
    static async isApiAvailable() {
        try {
            const response = await fetch('https://text.pollinations.ai/health', {
                method: 'HEAD',
                signal: AbortSignal.timeout(3000)
            });
            return response.ok;
        } catch {
            return false;
        }
    }
    
    /**
     * Check if a specific model is available
     * @param {string} model - Model name to check
     * @returns {Promise<boolean>} - Whether the model is available
     */
    static async isModelAvailable(model) {
        try {
            const models = await this.getAvailableModels();
            return models.some(m => m.name === model);
        } catch (error) {
            console.error(`Error checking model availability:`, error);
            return false;
        }
    }
    
    /**
     * Get available models
     * @returns {Promise<Array>} - List of models
     */
    static async getAvailableModels() {
        return [
            { name: 'openai-large', type: 'chat', description: 'OpenAI GPT-4o', vision: true },
            { name: 'openai-reasoning', type: 'chat', description: 'OpenAI o1-mini', reasoning: true },
            { name: 'gemini', type: 'chat', description: 'Gemini 2.0 Flash', provider: 'google' },
            { name: 'gemini-thinking', type: 'chat', description: 'Gemini 2.0 Flash Thinking', provider: 'google' },
            { name: 'claude-hybridspace', type: 'chat', description: 'Claude Hybridspace' },
            { name: 'searchgpt', type: 'chat', description: 'SearchGPT with realtime news and web search', internet: true }
        ];
    }
}

// Make globally
window.ApiHelper = ApiHelper;
