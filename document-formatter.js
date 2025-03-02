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
        
        // Create a container for the formatted document
        const container = document.createElement('div');
        container.className = 'formatted-document';
        
        // Clean any existing HTML and split into paragraphs
        const cleanText = this.cleanText(text);
        
        // Remove the ŠEFO PATVIRTINTA text from the document - we'll add it as a visual element
        const textWithoutStamp = cleanText.replace(/ŠEFO PATVIRTINTA|PATVIRTINTA/g, '');
        
        // Remove references to team contributions, acknowledgments at the end
        const cleanedText = this.removeTeamAcknowledgments(textWithoutStamp);
        
        // Process paragraphs with proper structure
        this.processDocumentContent(container, cleanedText);
        
        // Add the stamp and signature as visual elements at the end
        const signatureContainer = this.createSignatureBlock();
        container.appendChild(signatureContainer);
        
        return container;
    }
    
    /**
     * Process document content into structured HTML with headings and paragraphs
     * @param {HTMLElement} container - The container element
     * @param {string} text - Cleaned text content
     */
    static processDocumentContent(container, text) {
        const paragraphs = text.split('\n\n').filter(p => p.trim());
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
     * Create signature block with approval stamp positioned correctly
     * @returns {HTMLElement} - The signature container with stamp
     */
    static createSignatureBlock() {
        // Create signature container
        const signatureContainer = document.createElement('div');
        signatureContainer.className = 'document-signature-container';
        
        // Create stamp div
        const stampDiv = document.createElement('div');
        stampDiv.className = 'boss-approval-stamp';
        stampDiv.textContent = 'ŠEFO PATVIRTINTA';
        
        // Create signature elements
        const signatureBlock = document.createElement('div');
        signatureBlock.className = 'signature-block';
        
        const signatureLine = document.createElement('div');
        signatureLine.className = 'signature-line';
        
        const signatureName = document.createElement('div');
        signatureName.className = 'signature-name';
        signatureName.textContent = 'Tauris';
        
        const signatureTitle = document.createElement('div');
        signatureTitle.className = 'signature-title';
        signatureTitle.textContent = 'Vyr. AI Vadovas';
        
        const signatureDate = document.createElement('div');
        signatureDate.className = 'signature-date';
        signatureDate.textContent = '2025-02-28';
        
        // Add signature elements to the signature container
        signatureBlock.appendChild(signatureLine);
        signatureBlock.appendChild(signatureName);
        signatureBlock.appendChild(signatureTitle);
        signatureBlock.appendChild(signatureDate);
        
        // Add stamp and signature block to container
        signatureContainer.appendChild(stampDiv);
        signatureContainer.appendChild(signatureBlock);
        
        // Trigger the stamp animation after a delay
        setTimeout(() => {
            stampDiv.classList.add('stamp-visible');
        }, 500);
        
        return signatureContainer;
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
                margin-bottom: 80px; /* Space for signature */
                max-width: 800px;
                margin-left: auto;
                margin-right: auto;
            }
            
            .document-heading {
                font-weight: bold;
                margin-top: 1.5em;
                margin-bottom: 1em;
                font-size: 1.2em;
                color: var(--text-main);
            }
            
            .document-section p {
                margin-bottom: 1em;
                text-indent: 2em;
            }
            
            .document-section p:first-of-type {
                text-indent: 0;
            }
            
            /* New signature container layout */
            .document-signature-container {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-top: 60px;
                position: relative;
            }
            
            .boss-approval-stamp {
                flex: 0 0 220px;
                padding: 15px;
                width: 220px;
                text-align: center;
                color: #C1272D; /* Lithuanian flag red */
                font-weight: bold;
                font-size: 24px;
                letter-spacing: 1px;
                font-family: 'Arial Black', sans-serif;
                border: 5px solid #C1272D;
                border-radius: 10px;
                transform: rotate(-5deg) scale(0.8);
                opacity: 0;
                transition: opacity 0.5s, transform 0.7s;
                z-index: 5;
                margin-right: 20px;
            }
            
            .boss-approval-stamp.stamp-visible {
                opacity: 0.9;
                transform: rotate(0deg) scale(1);
            }
            
            .signature-block {
                flex: 0 0 200px;
                text-align: center;
                font-family: 'Times New Roman', serif;
                font-size: 16px;
                margin-top: 10px;
            }
            
            .signature-line {
                border-top: 1px solid #000;
                width: 200px;
                margin-bottom: 10px;
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
            
            .citation {
                color: #666;
                font-style: italic;
            }
            
            [data-theme="dark"] .formatted-document {
                color: #e0e0e0;
            }
            
            [data-theme="dark"] .citation {
                color: #aaa;
            }
            
            [data-theme="dark"] .boss-approval-stamp {
                color: #ff6b6b;
                border-color: #ff6b6b;
            }
            
            [data-theme="dark"] .signature-line {
                border-top-color: #ccc;
            }
            
            /* Additional style for citations in appropriate format */
            .document-section .citation-list {
                margin-top: 2em;
                border-top: 1px solid #ddd;
                padding-top: 1em;
            }
            
            .document-section .citation-item {
                padding-left: 2em;
                text-indent: -2em;
                margin-bottom: 0.8em;
            }
            
            [data-theme="dark"] .document-section .citation-list {
                border-top-color: #555;
            }
            
            /* Responsive adjustments */
            @media (max-width: 768px) {
                .document-signature-container {
                    flex-direction: column;
                    align-items: center;
                }
                
                .boss-approval-stamp {
                    margin-right: 0;
                    margin-bottom: 30px;
                }
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
    
    /**
     * Format the document manually (public API for direct calling)
     */
    static formatCurrentDocument() {
        const finalResultElement = document.getElementById('finalResult');
        if (finalResultElement && finalResultElement.textContent) {
            const cleanedText = this.removeTeamAcknowledgments(finalResultElement.textContent);
            const formattedDocument = this.formatFinalDocument(cleanedText);
            if (formattedDocument) {
                finalResultElement.innerHTML = '';
                finalResultElement.appendChild(formattedDocument);
                return true;
            }
        }
        return false;
    }
}

// Format document when approval happens
document.addEventListener('DOMContentLoaded', () => {
    DocumentFormatter.setupFormatOnApproval();
    
    // Add a debug button for testing the formatter (only in debug mode)
    if (location.search.includes('debug=true')) {
        const debugBtn = document.createElement('button');
        debugBtn.textContent = 'Format Document';
        debugBtn.className = 'lithuanian-button';
        debugBtn.style.marginTop = '10px';
        debugBtn.onclick = () => DocumentFormatter.formatCurrentDocument();
        
        const resultActions = document.querySelector('.result-actions');
        if (resultActions) {
            resultActions.appendChild(debugBtn);
        }
    }
});

// Make available globally
window.DocumentFormatter = DocumentFormatter;
