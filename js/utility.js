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
        // Add type check to ensure text is a string
        if (typeof text !== 'string') {
            console.warn('Expected text to be a string but got:', typeof text);
            text = String(text || ''); // Convert to string or use empty string
        }

        // Now we can safely use trim()
        text = text.trim();
        
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

    /**
     * Download document as a file
     * @param {HTMLElement|string} content - The content to download
     * @param {string} filename - Optional filename
     */
    static downloadAsDocument(content, filename = null) {
        try {
            // Extract text content - convert to string if it's an HTMLElement
            let text;
            if (content instanceof HTMLElement) {
                text = content.innerText || content.textContent || '';
            } else {
                text = String(content || ''); // Ensure we have a string
            }

            // Now extract title from the string
            const title = this.extractTitle(text);
            
            // Extract title from content or use generic name
            const safeFilename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.html';
            
            // Create document blob
            const docBlob = this.createHtmlDoc(text, title);
            
            // Create download link
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(docBlob);
            downloadLink.download = safeFilename;
            
            // Add to document temporarily and trigger download
            document.body.appendChild(downloadLink);
            downloadLink.click();
            
            // Clean up
            setTimeout(() => {
                URL.revokeObjectURL(downloadLink.href);
                document.body.removeChild(downloadLink);
            }, 100);
            
            return true;
        } catch (err) {
            console.error('Error downloading document:', err);
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

/**
 * Download content as a document
 * @param {string} text - Text content to download
 * @param {string} filename - Filename (optional)
 */
function downloadAsDocument(text, filename = null) {
    if (!text) {
        console.error('No text provided for download');
        return;
    }

    try {
        // Extract title from content or use generic name
        const title = filename || DocUtils.extractTitle(text) || 'document';
        const safeFilename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.html';
        
        // Create document blob
        const docBlob = DocUtils.createHtmlDoc(text, title);
        
        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(docBlob);
        downloadLink.download = safeFilename;
        
        // Add to document temporarily and trigger download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        
        // Clean up
        setTimeout(() => {
            URL.revokeObjectURL(downloadLink.href);
            document.body.removeChild(downloadLink);
        }, 100);
        
        return true;
    } catch (err) {
        console.error('Error downloading document:', err);
        return false;
    }
}

/**
 * Sanitizes a string by escaping HTML special characters
 * to prevent XSS attacks
 * @param {string} text - The text to sanitize
 * @returns {string} - The sanitized text
 */
function sanitizeHTML(text) {
    if (!text) return '';
    
    // Handle non-string inputs
    if (typeof text !== 'string') {
        text = String(text);
    }
    
    // Replace HTML special characters with their entity equivalents
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Formats date and time in Lithuanian style
 * @param {Date} date - Date object to format
 * @returns {string} - Formatted date string
 */
function formatLithuanianDate(date = new Date()) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    
    // Try to use Lithuanian locale if available
    try {
        return date.toLocaleDateString('lt-LT', options);
    } catch (e) {
        // Fallback to default locale with Lithuanian-style format
        return date.toLocaleDateString(undefined, options);
    }
}

/**
 * Formats a number with Lithuanian thousand separators
 * @param {number} num - Number to format
 * @returns {string} - Formatted number
 */
function formatLithuanianNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/**
 * Creates a downloadable text file
 * @param {string} content - File content
 * @param {string} filename - Name of the file
 */
function downloadTextFile(content, filename = 'tauris-ai-rezultatas.txt') {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Capitalizes the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} - Capitalized string
 */
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncates text to a specific length and adds ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
function truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
}

// Make utilities available globally
window.cleanMarkdownFormatting = cleanMarkdownFormatting;
window.addMarkdownAvoidanceInstructions = addMarkdownAvoidanceInstructions;
window.downloadAsDocument = downloadAsDocument;
window.DocUtils = DocUtils;
window.sanitizeHTML = sanitizeHTML;
window.formatLithuanianDate = formatLithuanianDate;
window.formatLithuanianNumber = formatLithuanianNumber;
window.downloadTextFile = downloadTextFile;
window.capitalize = capitalize;
window.truncateText = truncateText;

// Set up download action
document.addEventListener('DOMContentLoaded', function() {
    const downloadBtn = document.getElementById('downloadResultBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            const finalResult = document.getElementById('finalResult');
            if (finalResult) {
                DocUtils.downloadAsDocument(finalResult);
            }
        });
    }
});

// Make available globally
window.DocUtils = DocUtils;
window.downloadAsDocument = DocUtils.downloadAsDocument.bind(DocUtils);
