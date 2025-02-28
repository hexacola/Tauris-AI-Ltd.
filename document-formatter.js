/**
 * Handles academic document formatting
 */
class DocumentFormatter {
    /**
     * Format the final academic document
     * @param {string} documentId - The ID of the element containing the document
     */
    static formatAcademicDocument(documentId = 'finalResult') {
        const documentElement = document.getElementById(documentId);
        if (!documentElement) return;
        
        // Get the text content
        const content = documentElement.textContent;
        if (!content) return;
        
        // Clear the current content
        documentElement.innerHTML = '';
        
        // Identify sections based on headings
        const sections = this.identifySections(content);
        
        // Create properly formatted document
        sections.forEach(section => {
            if (section.title) {
                const heading = document.createElement('h3');
                heading.textContent = section.title;
                heading.className = 'academic-heading';
                documentElement.appendChild(heading);
            }
            
            // Create paragraphs for the content
            const paragraphs = section.content.split('\n\n')
                .filter(p => p.trim().length > 0);
            
            paragraphs.forEach(paragraph => {
                const p = document.createElement('p');
                p.textContent = paragraph.trim();
                p.className = 'academic-paragraph';
                documentElement.appendChild(p);
            });
        });
        
        // Add academic styling if not already present
        this.addAcademicStyles();
    }
    
    /**
     * Identify document sections based on bold headings
     * @param {string} content - The document content
     * @returns {Array} - Array of section objects with title and content
     */
    static identifySections(content) {
        // Split by headings (assuming headings are wrapped in ** or are on their own line)
        const sectionPattern = /\*\*(.*?)\*\*|^([A-ZÕŠŽÜÄÖÕ][a-zõšžüäöõ]+(\s+[A-ZÕŠŽÜÄÖÕ][a-zõšžüäöõ]+)*)$/gm;
        
        const sections = [];
        let lastIndex = 0;
        let match;
        let sectionText = '';
        
        // Find section markers
        const matches = content.match(/\*\*([^*]+)\*\*/g) || [];
        
        if (matches.length > 0) {
            // Process content with headings
            matches.forEach((heading, index) => {
                const title = heading.replace(/\*/g, '').trim();
                const startIndex = content.indexOf(heading);
                const endIndex = index < matches.length - 1 ? 
                    content.indexOf(matches[index + 1]) : 
                    content.length;
                
                if (index === 0 && startIndex > 0) {
                    // Add content before first heading as intro section
                    sections.push({
                        title: '',
                        content: content.substring(0, startIndex).trim()
                    });
                }
                
                // Add this section
                const sectionContent = content.substring(
                    startIndex + heading.length,
                    endIndex
                ).trim();
                
                sections.push({
                    title: title,
                    content: sectionContent
                });
            });
        } else {
            // No headings found - try to identify by line breaks and paragraph structure
            const lines = content.split('\n');
            let currentTitle = '';
            let currentContent = '';
            
            lines.forEach(line => {
                const trimmedLine = line.trim();
                
                // Skip empty lines
                if (!trimmedLine) {
                    currentContent += '\n\n';
                    return;
                }
                
                // If line is short and followed by empty line, might be a heading
                if (trimmedLine.length < 50 && 
                    trimmedLine === trimmedLine.replace(/[a-z]/g, '').toUpperCase()) {
                    
                    // If we have content from previous section, add it
                    if (currentContent.trim()) {
                        sections.push({
                            title: currentTitle,
                            content: currentContent.trim()
                        });
                    }
                    
                    currentTitle = trimmedLine;
                    currentContent = '';
                } else {
                    // Regular content line
                    currentContent += trimmedLine + '\n';
                }
            });
            
            // Add final section
            if (currentContent.trim()) {
                sections.push({
                    title: currentTitle,
                    content: currentContent.trim()
                });
            }
            
            // If no sections were identified, treat whole content as one section
            if (sections.length === 0) {
                sections.push({
                    title: '',
                    content: content.trim()
                });
            }
        }
        
        return sections;
    }
    
    /**
     * Add academic styles to document
     */
    static addAcademicStyles() {
        if (document.getElementById('academic-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'academic-styles';
        style.textContent = `
            #finalResult {
                font-family: 'Times New Roman', serif;
                line-height: 1.6;
                text-align: justify;
                padding: 20px;
                position: relative;
            }
            
            .academic-heading {
                font-weight: bold;
                margin-top: 1.5em;
                margin-bottom: 1em;
                font-size: 1.2em;
            }
            
            .academic-paragraph {
                margin-bottom: 1em;
                text-indent: 1.5em;
            }
            
            .academic-paragraph:first-of-type {
                text-indent: 0;
            }
            
            .boss-approval-stamp {
                margin-top: 40px;
                margin-bottom: 20px;
            }
            
            [data-theme="dark"] #finalResult {
                color: #e0e0e0;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Format document when boss approves
     */
    static setupFormatOnApproval() {
        document.addEventListener('boss-completed-work', () => {
            setTimeout(() => {
                this.formatAcademicDocument();
            }, 1500);
        });
    }
}

// Format document when approval happens
document.addEventListener('DOMContentLoaded', () => {
    DocumentFormatter.setupFormatOnApproval();
});

// Make available globally
window.DocumentFormatter = DocumentFormatter;
