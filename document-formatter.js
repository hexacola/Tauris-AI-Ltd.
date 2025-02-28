/**
 * Document formatter for styling final results
 */
class DocumentFormatter {
    /**
     * Format the final document with styling and structure
     * @param {string} text - The raw text content
     * @returns {HTMLElement} - A formatted DOM element
     */
    static formatFinalDocument(text) {
        if (!text) return null;
        
        // Create a container for the formatted content
        const container = document.createElement('div');
        container.className = 'formatted-document';
        
        // Clean any existing HTML and split into paragraphs
        const cleanText = this.cleanText(text);
        
        // Remove the ŠEFO PATVIRTINTA text from the document - we'll add it as a visual element
        const textWithoutStamp = cleanText.replace(/ŠEFO PATVIRTINTA|PATVIRTINTA/g, '');
        const paragraphs = textWithoutStamp.split('\n\n').filter(p => p.trim());
        
        // Process headings and paragraphs
        let currentSection = null;
        
        paragraphs.forEach(paragraph => {
            paragraph = paragraph.trim();
            
            // Check if this is a heading
            if (this.isHeading(paragraph)) {
                // Create a section heading
                const heading = document.createElement('h3');
                heading.className = 'document-heading';
                heading.innerHTML = `<strong>${paragraph}</strong>`;
                container.appendChild(heading);
                
                // Create a new section container
                currentSection = document.createElement('div');
                currentSection.className = 'document-section';
                container.appendChild(currentSection);
            } 
            // Regular paragraph
            else {
                const p = document.createElement('p');
                
                // Apply special formatting
                p.innerHTML = this.applySpecialFormatting(paragraph);
                
                // Add to appropriate container
                if (currentSection) {
                    currentSection.appendChild(p);
                } else {
                    container.appendChild(p);
                }
            }
        });
        
        // Add the stamp as a visual element at the end
        this.addApprovalStamp(container);
        
        return container;
    }
    
    /**
     * Check if a paragraph is likely a heading
     * @param {string} paragraph - The paragraph text
     * @returns {boolean} - Whether it's a heading
     */
    static isHeading(paragraph) {
        // Specifically identify common Lithuanian document section headings
        const lithuanianHeadings = [
            'Įvadas', 'Išvada', 'Išvados', 'Kodėl', 'Kaip', 'Ką', 'Apie',
            'Katės istorija ir kultūra', 'Katės paradoksas', 'Katė –', 'Kodėl katės ypatingos'
        ];
        
        // Check for exact heading matches (case-insensitive)
        for (const heading of lithuanianHeadings) {
            if (paragraph.toLowerCase().startsWith(heading.toLowerCase())) {
                return true;
            }
        }
        
        // Headings are typically short and often end with question mark or colon
        if (paragraph.length < 80 && 
            (paragraph.endsWith('?') || paragraph.endsWith(':'))) {
            return true;
        }
        
        // Check for common heading patterns
        if (paragraph.match(/^[\w\s\-–—]+$/i) && paragraph.length < 60) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Clean text by removing unwanted characters and HTML tags
     * @param {string} text - The raw text content
     * @returns {string} - Cleaned text
     */
    static cleanText(text) {
        // Remove HTML tags
        const div = document.createElement('div');
        div.innerHTML = text;
        return div.textContent || div.innerText || '';
    }
    
    /**
     * Apply special formatting to text
     * @param {string} text - The paragraph text
     * @returns {string} - Formatted text with HTML tags
     */
    static applySpecialFormatting(text) {
        // Make text between ** bold
        let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Identify references and citations
        formattedText = formattedText.replace(/\(([\w\s\.,]+, \d{4})\)/g, '<span class="citation">($1)</span>');
        
        return formattedText;
    }
    
    /**
     * Add the approval stamp to the document
     * @param {HTMLElement} container - The document container
     */
    static addApprovalStamp(container) {
        // Create the stamp container
        const stampDiv = document.createElement('div');
        stampDiv.className = 'boss-approval-stamp';
        stampDiv.textContent = 'ŠEFO PATVIRTINTA';
        
        // Add the stamp to the bottom of the document
        container.appendChild(stampDiv);
        
        // Trigger the stamp animation after a delay
        setTimeout(() => {
            stampDiv.classList.add('stamp-visible');
        }, 500);
    }
    
    /**
     * Add academic styles to document
     */
    static addAcademicStyles() {
        if (document.getElementById('academic-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'academic-styles';
        style.textContent = `
            .formatted-document {
                font-family: 'Times New Roman', serif;
                line-height: 1.6;
                text-align: justify;
                padding: 20px;
                position: relative;
            }
            
            .document-heading {
                font-weight: bold;
                margin-top: 1.5em;
                margin-bottom: 1em;
                font-size: 1.2em;
            }
            
            .document-section p {
                margin-bottom: 1em;
                text-indent: 1.5em;
            }
            
            .document-section p:first-of-type {
                text-indent: 0;
            }
            
            .boss-approval-stamp {
                margin-top: 40px;
                margin-bottom: 20px;
                padding: 15px;
                width: 200px;
                text-align: center;
                color: #ff3333;
                font-weight: bold;
                font-size: 24px;
                letter-spacing: 1px;
                font-family: 'Arial Black', sans-serif;
                border: 5px solid #ff3333;
                border-radius: 10px;
                transform: rotate(-5deg);
                opacity: 0;
                margin-left: auto;
                transition: opacity 0.5s, transform 0.5s;
            }
            
            .boss-approval-stamp.stamp-visible {
                opacity: 1;
                transform: rotate(0deg);
            }
            
            .citation {
                color: #666;
            }
            
            [data-theme="dark"] .formatted-document {
                color: #e0e0e0;
            }
            
            [data-theme="dark"] .citation {
                color: #aaa;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Format document when boss approves
     */
    static setupFormatOnApproval() {
        // Add our academic styles
        this.addAcademicStyles();
        
        // Listen for document completion
        document.addEventListener('boss-completed-work', () => {
            setTimeout(() => {
                const text = document.getElementById('finalResult').textContent;
                const formattedDocument = this.formatFinalDocument(text);
                if (formattedDocument) {
                    const finalResultElement = document.getElementById('finalResult');
                    finalResultElement.innerHTML = '';
                    finalResultElement.appendChild(formattedDocument);
                }
            }, 1500);
        });
        
        // Also format the document if the StampEffects.showBossApproval is called
        const originalShowBossApproval = window.StampEffects?.showBossApproval;
        if (window.StampEffects && originalShowBossApproval) {
            window.StampEffects.showBossApproval = function() {
                originalShowBossApproval.apply(this, arguments);
                
                // Format the document after the stamp is shown
                setTimeout(() => {
                    const finalResultElement = document.getElementById('finalResult');
                    if (finalResultElement && finalResultElement.textContent) {
                        const formattedDocument = DocumentFormatter.formatFinalDocument(finalResultElement.textContent);
                        if (formattedDocument) {
                            finalResultElement.innerHTML = '';
                            finalResultElement.appendChild(formattedDocument);
                        }
                    }
                }, 1000);
            };
        }
    }
}

// Format document when approval happens
document.addEventListener('DOMContentLoaded', () => {
    DocumentFormatter.setupFormatOnApproval();
});

// Make available globally
window.DocumentFormatter = DocumentFormatter;
