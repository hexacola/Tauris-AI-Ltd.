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
    static async generateText(prompt, systemPrompt, model = 'openai') {
        console.warn('Using ApiHelper fallback instead of ApiConnector - functionality may be limited');
        
        try {
            const response = await fetch('https://text.pollinations.ai/' + encodeURIComponent(prompt), {
                method: 'GET',
                headers: {
                    'Accept': 'text/plain',
                    'Cache-Control': 'no-cache'
                },
                signal: AbortSignal.timeout(30000)
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
     * Get available models
     * @returns {Promise<Array>} - List of models
     */
    static async getAvailableModels() {
        return [
            { name: 'openai', type: 'chat', description: 'OpenAI GPT-4o-mini' },
            { name: 'openai-large', type: 'chat', description: 'OpenAI GPT-4o' },
            { name: 'mistral', type: 'chat', description: 'Mistral Large' },
            { name: 'llama', type: 'chat', description: 'Llama 3' },
            { name: 'deepseek', type: 'chat', description: 'DeepSeek Coder' }
        ];
    }
}

// Make globally
window.ApiHelper = ApiHelper;
