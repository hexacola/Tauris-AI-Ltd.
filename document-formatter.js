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
        
        // Remove references to team contributions, acknowledgments at the end
        const cleanedText = this.removeTeamAcknowledgments(textWithoutStamp);
        
        const paragraphs = cleanedText.split('\n\n').filter(p => p.trim());
        
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
        
        // Add the stamp as a visual element at the end (but not duplicate signature)
        this.addApprovalStamp(container);
        
        return container;
    }
    
    /**
     * Remove team acknowledgments and contributions from the final text
     * @param {string} text - The text to clean
     * @returns {string} - Cleaned text without acknowledgments
     */
    static removeTeamAcknowledgments(text) {
        // Remove common patterns of acknowledgments and team contributions
        let cleaned = text
            // Remove signature blocks that might be in the text
            .replace(/Tauris[\s\n]+Vyr\. AI Vadovas[\s\n]+2025-02-28/g, '')
            // Remove typical Lithuanian acknowledgment phrases
            .replace(/Ačiū\s+[A-Za-zĄČĘĖĮŠŲŪŽąčęėįšųūž]+\s+(už|ir).*/g, '')
            .replace(/Dėkoju\s+[A-Za-zĄČĘĖĮŠŲŪŽąčęėįšųūž]+\s+(už|ir).*/g, '')
            .replace(/Noriu padėkoti.*/gi, '')
            // Remove notes about team effort
            .replace(/Bendras\s+komandos\s+ind[ėe]lis.*/gi, '')
            .replace(/Komandos\s+pastangomis.*/gi, '')
            .replace(/Mūsų\s+komanda\s+atliko.*/gi, '')
            // Remove common ending patterns
            .replace(/Su\s+pagarba[,\s]+Tauris.*/gi, '')
            .replace(/Pagarbiai[,\s]+Tauris.*/gi, '')
            // Remove analysis sections that might appear at the end
            .replace(/Galutinė analizė ir komentarai:[\s\S]*$/i, '')
            .replace(/Sukurta aiški struktūra:[\s\S]*$/i, '')
            .replace(/\d+\.\s*Sukurta aiški struktūra[\s\S]*$/i, '')
            .replace(/\d+\.\s*Gabijos pateikti[\s\S]*$/i, '')
            .replace(/Puikus komandos darbas!.*$/i, '')
            // Clean up the result text - trim and remove extra newlines at the end
            .trim()
            .replace(/\n{3,}$/g, '\n\n');
            
        // Remove standard intro phrase that boss uses
        cleaned = cleaned
            .replace(/^.*?[Šš]tai galutinis [šs]io teksto variantas:?\s*/i, '')
            .trim();
            
        return cleaned;
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
        // Create stamp div only - don't add signature since it will be handled separately
        const stampDiv = document.createElement('div');
        stampDiv.className = 'boss-approval-stamp';
        stampDiv.textContent = 'ŠEFO PATVIRTINTA';
        
        // Add only the stamp to the container
        container.appendChild(stampDiv);
        
        // Trigger the stamp animation after a delay
        setTimeout(() => {
            stampDiv.classList.add('stamp-visible');
        }, 500);
        
        // Add signature block at right side of content
        this.addSignatureBlock(container);
    }
    
    /**
     * Add signature block positioned at right side
     * @param {HTMLElement} container - The document container
     */
    static addSignatureBlock(container) {
        // Create signature container
        const signatureContainer = document.createElement('div');
        signatureContainer.className = 'document-signature';
        
        // Create signature elements
        const signatureLine = document.createElement('div');
        signatureLine.className = 'signature-line';
        
        const signatureName = document.createElement('div');
        signatureName.className = 'signature-name';
        signatureName.textContent = 'Tauris';
        
        const signatureTitle = document.createElement('div');
        signatureTitle.className = 'signature-title';
        
        const signatureDate = document.createElement('div');
        signatureDate.className = 'signature-date';
        signatureDate.textContent = '2025-02-28';
        
        // Add signature elements to the signature container
        signatureContainer.appendChild(signatureLine);
        signatureContainer.appendChild(signatureName);
        signatureContainer.appendChild(signatureTitle);
        signatureContainer.appendChild(signatureDate);
        
        // Add the signature container
        container.appendChild(signatureContainer);
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
            
            .document-signature {
                margin-top: 30px;
                text-align: right;
                font-family: 'Times New Roman', serif;
                padding-right: 30px;
                font-size: 16px;
                position: absolute;
                right: 20px;
                bottom: 20px;
            }
            
            .signature-line {
                border-top: 1px solid #000;
                width: 200px;
                margin: 0 0 10px auto;
            }
            
            .signature-name {
                font-weight: bold;
            }
            
            .signature-title {
                font-style: italic;
            }
            
            .signature-date {
                margin-top: 5px;
            }
            
            [data-theme="dark"] .signature-line {
                border-top-color: #ccc;
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
                const cleanedText = this.removeTeamAcknowledgments(text); // Clean before formatting
                const formattedDocument = this.formatFinalDocument(cleanedText);
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
                        // Clean the text before formatting
                        const cleanedText = DocumentFormatter.removeTeamAcknowledgments(finalResultElement.textContent);
                        const formattedDocument = DocumentFormatter.formatFinalDocument(cleanedText);
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
