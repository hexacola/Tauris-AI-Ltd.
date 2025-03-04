/**
 * Simple CORS proxy service to help handle cross-origin request issues
 */
class CorsProxy {
    /**
     * Available proxy services
     */
    static PROXIES = [
        {
            name: 'corsproxy.io',
            url: 'https://corsproxy.io/?',
            active: true
        },
        {
            name: 'cors-anywhere (herokuapp)',
            url: 'https://cors-anywhere.herokuapp.com/',
            active: false // Requires enabling at their website
        },
        {
            name: 'allorigins',
            url: 'https://api.allorigins.win/raw?url=',
            active: true
        }
    ];
    
    /**
     * Get active proxy URL
     * @returns {string|null} - Active proxy URL or null
     */
    static getActiveProxy() {
        const active = this.PROXIES.filter(p => p.active);
        if (active.length === 0) {
            console.warn("No active CORS proxies available");
            return null;
        }
        return active[Math.floor(Math.random() * active.length)].url;
    }
    
    /**
     * Fetch data through the CORS proxy
     * @param {string} url - The URL to fetch
     * @param {Object} options - Fetch options
     * @returns {Promise} - Fetch promise
     */
    static async fetch(url, options = {}) {
        try {
            const proxyUrl = this.getActiveProxy();
            
            if (!proxyUrl) {
                throw new Error("No active CORS proxy available");
            }
            
            const fullProxyUrl = proxyUrl + encodeURIComponent(url);
            console.log(`Using CORS proxy for: ${url}`);
            
            // Add CORS headers to request options
            const modifiedOptions = {
                ...options,
                headers: {
                    ...options.headers,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            };
            
            return await fetch(fullProxyUrl, modifiedOptions);
        } catch (error) {
            console.error("Error using CORS proxy:", error);
            throw error;
        }
    }
    
    /**
     * Directly fetch a URL without proxy (for comparison)
     */
    static async directFetch(url, options = {}) {
        return await fetch(url, options);
    }
    
    /**
     * Check if the proxy service is available
     * @returns {Promise<boolean>} - Whether the proxy is working
     */
    static async isProxyAvailable() {
        try {
            const response = await fetch(this.getActiveProxy() + encodeURIComponent('https://example.com'), 
                { method: 'HEAD', signal: AbortSignal.timeout(3000) });
            return response.ok;
        } catch (error) {
            console.warn("CORS proxy unavailable:", error);
            return false;
        }
    }
    
    /**
     * Get a compatible fetch function (proxy or direct)
     * @param {string} url - The URL to check
     * @returns {Function} - Appropriate fetch function
     */
    static async getFetchFunction(url) {
        const sameOrigin = new URL(url, window.location.href).origin === window.location.origin;
        
        if (sameOrigin) {
            return this.directFetch;
        }
        
        // Check if proxy is needed and available
        try {
            await this.directFetch(url, { 
                method: 'HEAD', 
                signal: AbortSignal.timeout(2000)
            });
            // If direct fetch works, return direct fetch
            return this.directFetch;
        } catch (error) {
            // If CORS issue, check if proxy is available
            if (error.message.includes('CORS') || error.name === 'TypeError') {
                if (await this.isProxyAvailable()) {
                    return this.fetch;
                }
            }
            // Default to direct fetch but warn about potential issues
            console.warn("CORS proxy unavailable, using direct fetch");
            return this.directFetch;
        }
    }
    
    /**
     * Add Lithuanian flavor to error messages
     * @param {Error} error - The error object
     * @returns {string} - Lithuanianized error message
     */
    static getLithuanianErrorMessage(error) {
        const baseMessage = error.message || "Unknown error";
        
        // Add Lithuanian flavor to the error message
        const lithuanianPhrases = [
            "Vaje! ",
            "Oi oi oi! ",
            "Po šimts kalakutų! ",
            "Kad jį kur! ",
            "Velniai rautų! "
        ];
        
        const randomPhrase = lithuanianPhrases[Math.floor(Math.random() * lithuanianPhrases.length)];
        return randomPhrase + baseMessage;
    }
}

// Make globally available
window.CorsProxy = CorsProxy;

/**
 * Simple CORS proxy handler for local development
 * This is only for development purposes and handles CORS issues when testing locally
 */

// Check if we're running in local development mode
const isLocalDevelopment = window.location.hostname === '127.0.0.1' || 
                          window.location.hostname === 'localhost';

if (isLocalDevelopment) {
    console.log("Local development environment detected - enabling CORS proxy");
    
    // Override fetch to handle CORS for pollinations API
    const originalFetch = window.fetch;
    window.fetch = async function(url, options = {}) {
        // Only intercept pollinations API calls
        if (typeof url === 'string' && url.includes('pollinations.ai')) {
            try {
                const result = await originalFetch(url, options);
                return result;
            } catch (e) {
                // If CORS error occurs, try through cors-anywhere proxy
                if (e.message.includes('CORS') || e.message.includes('Failed to fetch')) {
                    console.log("Using CORS proxy as fallback for:", url);
                    
                    // Use one of several public CORS proxies
                    const corsProxies = [
                        'https://cors-anywhere.herokuapp.com/',
                        'https://api.allorigins.win/raw?url='
                    ];
                    
                    // Try each proxy in sequence
                    for (const proxy of corsProxies) {
                        try {
                            // When using the proxy, we need to use the original URL with the proxy prefix
                            const proxiedUrl = proxy + encodeURIComponent(url);
                            const newOptions = {...options};
                            
                            // Some proxies require setting the Origin header
                            if (!newOptions.headers) newOptions.headers = {};
                            newOptions.headers['X-Requested-With'] = 'XMLHttpRequest';
                            
                            const result = await originalFetch(proxiedUrl, newOptions);
                            return result;
                        } catch (proxyError) {
                            console.warn(`Proxy ${proxy} failed:`, proxyError);
                            // Continue to next proxy
                        }
                    }
                }
                
                // If all proxies fail, throw the original error
                throw e;
            }
        }
        
        // For non-pollinations URLs, use the original fetch
        return originalFetch(url, options);
    };
}
