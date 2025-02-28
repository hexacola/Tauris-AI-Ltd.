/**
 * This script fixes various errors and issues that might occur in the main script
 */

// Fix the missing catch block issue
document.addEventListener('DOMContentLoaded', function() {
    // Check if there's an issue with checkApiAvailability function
    if (typeof checkApiAvailability === 'function') {
        // Make sure it has proper try-catch
        window.checkApiAvailability = async function() {
            try {
                const response = await fetch('https://text.pollinations.ai/health', {
                    method: 'GET',
                    signal: AbortSignal.timeout(5000)
                });
                return response.ok;
            } catch (error) {
                console.warn("API health check failed:", error);
                return false;
            }
        };
    }

    // Check if there's an incomplete finalizeCollaboration function
    if (typeof finalizeCollaboration === 'undefined') {
        window.finalizeCollaboration = function() {
            // Extract final result from the last editor's contribution
            const finalResultText = extractFinalResult();
            
            // Display the final result in the dedicated section
            displayFinalResult(finalResultText);
            
            // Enable the copy and download buttons
            const copyResultBtn = document.getElementById('copyResultBtn');
            if (copyResultBtn) copyResultBtn.disabled = false;
            
            const downloadResultBtn = document.getElementById('downloadResultBtn');
            if (downloadResultBtn) downloadResultBtn.disabled = false;
            
            const resultStatus = document.getElementById('resultStatus');
            if (resultStatus) resultStatus.textContent = '(Completed)';
            
            if (typeof stopCollaboration === 'function') {
                stopCollaboration();
            } else {
                // Basic fallback implementation
                isCollaborationActive = false;
                document.getElementById('startBtn').disabled = false;
                document.getElementById('stopBtn').disabled = true;
            }
            
            if (typeof addMessageToChatLog === 'function') {
                addMessageToChatLog('System', 'Collaboration completed. Final result is available below.', 'system final');
            }
            
            if (typeof updateStatus === 'function') {
                updateStatus("Collaboration completed", "success");
            }
        };
    }

    // Ensure event listeners are properly attached to buttons
    const copyResultBtn = document.getElementById('copyResultBtn');
    const downloadResultBtn = document.getElementById('downloadResultBtn');
    
    if (copyResultBtn && typeof window.copyFinalResult === 'function') {
        copyResultBtn.addEventListener('click', window.copyFinalResult);
    }
    
    if (downloadResultBtn && typeof window.downloadAsDocument === 'function') {
        downloadResultBtn.addEventListener('click', window.downloadAsDocument);
    }
});

// Check for and fix syntax errors in the script.js
window.addEventListener('error', function(e) {
    console.error('JavaScript error detected:', e.message);
    
    if (e.message.includes('Missing catch') || e.message.includes('finally after try')) {
        console.warn('Trying to fix try-catch error...');
        
        // Add script with fixed functions
        const script = document.createElement('script');
        script.innerHTML = `
            async function checkApiAvailability() {
                try {
                    const response = await fetch('https://text.pollinations.ai/health', {
                        method: 'GET',
                        signal: AbortSignal.timeout(5000)
                    });
                    return response.ok;
                } catch (error) {
                    console.warn("API health check fixed - API health check failed:", error);
                    return false;
                }
            }
            
            window.checkApiAvailability = checkApiAvailability;
        `;
        document.body.appendChild(script);
    }
});

/**
 * Helper function to safely parse JSON with fallback for text responses
 * @param {string} text - The text to parse as JSON
 * @param {boolean} allowTextFallback - Whether to return the raw text if JSON parsing fails
 * @returns {Object|string} - The parsed JSON or raw text
 */
function safeJsonParse(text, allowTextFallback = true) {
    if (!text || typeof text !== 'string') {
        return null;
    }
    
    try {
        return JSON.parse(text);
    } catch (error) {
        console.warn('JSON parse error:', error.message);
        
        // If allowed and the text looks like a valid AI response, return it as is
        if (allowTextFallback && 
           (text.includes("As the") || 
            text.trim().startsWith("I ") ||
            text.includes("Here's"))) {
            console.log("Returning text response instead of failed JSON");
            return { text: text };
        }
        
        throw error;
    }
}

// Add to window object
window.safeJsonParse = safeJsonParse;

// Add extra error handling for promise rejection errors
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Check if it's a JSON parsing error
    if (event.reason && event.reason.message && 
        event.reason.message.includes('Unexpected token')) {
        console.warn('This appears to be a JSON parsing error. The server might be returning text instead of JSON.');
    }
});

/**
 * Better extraction of Writer content from responses
 * @param {string} text - Writer's response
 * @returns {string} - Cleaned content
 */
function extractWriterContent(text) {
    if (!text) return '';
    
    // Try multiple patterns in order of specificity
    
    // 1. Look for content markers
    const markerMatch = text.match(/\[CONTENT_START\]([\s\S]*?)\[CONTENT_END\]/i);
    if (markerMatch && markerMatch[1] && markerMatch[1].trim().length > 50) {
        return markerMatch[1].trim();
    }
    
    // 2. Look for specific "As the Writer" pattern with colon
    const writerMatch = text.match(/As the Writer,[\s\S]*?(draft|content|text):([\s\S]*?)(?:I (?:now|would like to|invite)|$)/i);
    if (writerMatch && writerMatch[2] && writerMatch[2].trim().length > 50) {
        return writerMatch[2].trim();
    }
    
    // 3. Look for "Here is" pattern
    const hereIsMatch = text.match(/Here is (?:my|the) draft:([\s\S]*?)(?:I invite|I now|$)/i);
    if (hereIsMatch && hereIsMatch[1] && hereIsMatch[1].trim().length > 50) {
        return hereIsMatch[1].trim();
    }
    
    // 4. Basic cleanup - remove common phrases
    let cleaned = text
        .replace(/As the Writer,.*?:/gi, '')
        .replace(/I've drafted.*?:/gi, '')
        .replace(/I invite the Researcher to.*?$/gi, '')
        .replace(/I (now|would like to) (hand|pass).*?$/gi, '')
        .trim();
    
    return cleaned;
}

// Check if document is loaded, then patch functions
window.addEventListener('DOMContentLoaded', function() {
    // Add Writer content extractor to window
    window.extractWriterContent = extractWriterContent;
    
    // If extractFinalResult function exists but has issues, patch it
    if (typeof window.extractFinalResult === 'function') {
        const originalExtract = window.extractFinalResult;
        window.extractFinalResult = function() {
            try {
                // Try original function first
                const result = originalExtract();
                
                // If original result contains handoff text at the end, clean it
                if (result && (
                    result.includes('I invite the Researcher') || 
                    result.includes('I now hand') ||
                    result.includes('I would like to pass'))) {
                    
                    console.log("Original extract has handoff text - cleaning");
                    
                    // Get writer's content from history
                    const history = window.conversationHistory || [];
                    let writerContent = null;
                    
                    // Find latest Writer message
                    for (let i = history.length - 1; i >= 0; i--) {
                        if (history[i] && history[i].role === 'Writer') {
                            writerContent = history[i].content;
                            break;
                        }
                    }
                    
                    if (writerContent) {
                        // Try our specialized extractor
                        const cleaned = extractWriterContent(writerContent);
                        if (cleaned && cleaned.length > 100) {
                            return cleaned;
                        }
                    }
                }
                
                return result;
            } catch (e) {
                console.error("Error in enhanced extractFinalResult:", e);
                // Fallback to very basic extraction
                const history = window.conversationHistory || [];
                if (history.length > 0) {
                    const lastMsg = history[history.length - 1];
                    return lastMsg.content.replace(/As the (Writer|Researcher|Critic|Editor),.*?:/gi, '').trim();
                }
                return "Error extracting final result.";
            }
        };
    }
});

// Fix syntax error - this function was missing proper declaration
function showBossReactionToError() {
    const bossElement = document.querySelector('.boss-container');
    if (!bossElement) return;
    
    bossElement.classList.add('angry');
    
    // Get boss speech bubble
    const bossSpeech = bossElement.querySelector('.boss-speech') || 
                      document.createElement('div');
    
    // Check if BossPhrases is available and use it properly
    if (window.BossPhrases && bossSpeech) {
        bossSpeech.textContent = window.BossPhrases.getRandomPhrase();
        bossSpeech.classList.add('active');
        
        setTimeout(() => {
            bossSpeech.classList.remove('active');
            bossElement.classList.remove('angry');
        }, 3000);
    }
}

// Make function available globally
window.showBossReactionToError = showBossReactionToError;
