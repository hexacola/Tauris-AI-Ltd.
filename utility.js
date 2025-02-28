/**
 * Utility functions for the application
 */

class DocUtils {
    /**
     * Create a simple HTML-based document that can be opened in Word
     * @param {string} text - The text content to include in the document
     * @param {string} title - The document title
     * @returns {Blob} - A blob containing the document
     */
    static createHtmlDoc(text, title = 'Document') {
        // Convert plain text to HTML paragraphs
        const paragraphs = text.split('\n\n').filter(p => p.trim());
        const htmlParagraphs = paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('\n');
        
        // Create a simple HTML document that Word can open
        const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { font-family: 'Calibri', sans-serif; line-height: 1.5; }
        p { margin-bottom: 10px; }
        h1 { font-size: 18pt; color: #333; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    ${htmlParagraphs}
</body>
</html>`;
        
        // Return as a blob with HTML mimetype
        return new Blob([html], { type: 'text/html' });
    }
    
    /**
     * Extract a title from the text content
     * @param {string} text - The content to extract title from
     * @returns {string} - A suitable title
     */
    static extractTitle(text) {
        const firstLine = text.trim().split('\n')[0];
        
        // Clean up the title and limit its length
        const cleanTitle = firstLine
            .replace(/[^\w\s-]/gi, '') // Remove non-word characters
            .trim()
            .substring(0, 50); // Limit length
            
        return cleanTitle || 'document';
    }
    
    /**
     * Copy text to clipboard with fallback for older browsers
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} - Success status
     */
    static copyToClipboard(text) {
        return new Promise((resolve, reject) => {
            // Try to use the Clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text)
                    .then(() => resolve(true))
                    .catch(err => {
                        console.warn('Clipboard API failed:', err);
                        // Fall back to execCommand
                        this.copyWithExecCommand(text) ? resolve(true) : reject(false);
                    });
            } else {
                // Fall back to execCommand
                this.copyWithExecCommand(text) ? resolve(true) : reject(false);
            }
        });
    }
    
    /**
     * Legacy method to copy text using execCommand
     * @param {string} text - Text to copy
     * @returns {boolean} - Success status
     */
    static copyWithExecCommand(text) {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed'; // Avoid scrolling to bottom
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            return successful;
        } catch (err) {
            console.error('execCommand error:', err);
            return false;
        }
    }
}

/**
 * Cleans markdown formatting from text
 * @param {string} text - Text containing markdown formatting
 * @returns {string} - Clean text without markdown
 */
function cleanMarkdownFormatting(text) {
    if (!text) return '';
    
    return text
        // Remove headers
        .replace(/^#+\s+(.*)$/gm, '$1')
        // Remove bold/italic markers
        .replace(/(\*\*|\*|__|_)(.*?)\1/g, '$2')
        // Remove horizontal rules
        .replace(/^\s*[-*_]{3,}\s*$/gm, '')
        // Remove blockquotes
        .replace(/^>\s+(.*)$/gm, '$1')
        // Remove code blocks
        .replace(/```[\s\S]*?```/g, '')
        // Remove inline code
        .replace(/`([^`]+)`/g, '$1')
        // Remove markdown links but keep text
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
        // Remove HTML tags
        .replace(/<\/?[^>]+(>|$)/g, '')
        // Fix multiple newlines
        .replace(/\n{3,}/g, '\n\n');
}

/**
 * Updates the boss's prompt to avoid generating markdown formatting
 * @param {string} prompt - The original prompt
 * @returns {string} - Modified prompt
 */
function addMarkdownAvoidanceInstructions(prompt) {
    const markdownAvoidanceText = `
SVARBU: Nenaudokite Markdown formatavimo savo atsakyme:
- NENAUDOKITE ženklelių # antraštėms 
- NENAUDOKITE žvaigždučių * ar pabraukimų _ teksto paryškinimui ar kursyvui
- NENAUDOKITE brūkšnelių --- horizontalioms linijoms
- NENAUDOKITE > citatoms
- NENAUDOKITE \`\`\` ar \` kodo blokams
- NENAUDOKITE [tekstas](nuoroda) nuorodoms
- Rašykite paprastą, neformatuotą tekstą

`;
    
    // Find a good spot to insert the instructions - preferably after any "SVARBU:" section
    if (prompt.includes('SVARBU:')) {
        return prompt.replace(/SVARBU:.*?(\n\n|\n$)/s, match => match + markdownAvoidanceText);
    }
    
    // Otherwise, add to beginning of prompt
    return markdownAvoidanceText + prompt;
}

// Make utilities available globally
window.cleanMarkdownFormatting = cleanMarkdownFormatting;
window.addMarkdownAvoidanceInstructions = addMarkdownAvoidanceInstructions;
window.DocUtils = DocUtils;
