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
        if (!text) {
            const container = document.createElement('div');
            container.className = 'formatted-document';
            const emptyMsg = document.createElement('p');
            emptyMsg.textContent = "Dokumentas dar nebaigtas. Prašome palaukti, kol darbuotojai baigs darbą.";
            emptyMsg.style.fontStyle = 'italic';
            container.appendChild(emptyMsg);
            return container;
        }
        
        // Create a container for the formatted document
        const container = document.createElement('div');
        container.className = 'formatted-document';
        
        // Clean any existing HTML and split into paragraphs
        const cleanText = this.cleanText(text);
        
        // Remove the ŠEFO PATVIRTINTA text from the document - we'll add it as a visual element
        const textWithoutStamp = cleanText.replace(/ŠEFO PATVIRTINTA|PATVIRTINTA/g, '');
        
        // Remove references to team contributions, acknowledgments at the end
        const cleanedText = this.removeTeamAcknowledgments(textWithoutStamp);
        
        // Extract the document title if available
        const topicTitle = this.extractTitle(cleanedText);
        
        // Split into paragraphs for processing
        const paragraphs = cleanedText.split('\n\n').filter(p => p.trim());
        
        // Skip the first paragraph if it's already identified as the title
        const startIndex = (topicTitle && paragraphs[0].includes(topicTitle)) ? 1 : 0;
        
        // Add document title at the top if one was found
        if (topicTitle) {
            const titleElement = document.createElement('h1');
            titleElement.className = 'document-title';
            titleElement.textContent = topicTitle;
            container.appendChild(titleElement);
        }
        
        // Process headings and paragraphs
        let currentSection = null;
        let previousHeading = null;
        
        // Create initial document section if we don't start with a heading
        if (!this.isHeading(paragraphs[startIndex])) {
            currentSection = document.createElement('div');
            currentSection.className = 'document-section';
            container.appendChild(currentSection);
        }
        
        // Process paragraphs
        for (let i = startIndex; i < paragraphs.length; i++) {
            const paragraph = paragraphs[i].trim();
            
            // Check if this is a heading
            if (this.isHeading(paragraph)) {
                // Skip if this is identical to the previous heading (avoid duplicates)
                if (previousHeading === paragraph) {
                    continue;
                }
                
                // Create a section heading
                const heading = document.createElement('h3');
                heading.className = 'document-heading';
                heading.textContent = paragraph; // Use textContent instead of innerHTML to avoid bold
                container.appendChild(heading);
                
                // Create a new section container
                currentSection = document.createElement('div');
                currentSection.className = 'document-section';
                container.appendChild(currentSection);
                
                // Track this heading to prevent duplicates
                previousHeading = paragraph;
            }
            // Check if paragraph might be a section title (special case for titles like "Katės – nepriklausomi, bet meilūs gyvūnai")
            else if (this.isPossibleSectionTitle(paragraph, paragraphs[i+1])) {
                // Skip if this is identical to the previous heading (avoid duplicates)
                if (previousHeading === paragraph) {
                    continue;
                }
                
                // Create a section heading
                const heading = document.createElement('h3');
                heading.className = 'document-heading';
                heading.textContent = paragraph; // Use textContent instead of innerHTML to avoid bold
                container.appendChild(heading);
                
                // Create a new section container
                currentSection = document.createElement('div');
                currentSection.className = 'document-section';
                container.appendChild(currentSection);
                
                // Track this heading to prevent duplicates
                previousHeading = paragraph;
            } 
            // Handle literatūra/references section specially
            else if (paragraph.toLowerCase().includes('literatūra') || 
                     paragraph.match(/^\d+\.\s+[A-Za-zĄČĘĖĮŠŲŪŽąčęėįšųūž]+.+\(\d{4}\)/)) {
                
                // Create a references section
                const referencesHeading = document.createElement('h3');
                referencesHeading.className = 'document-heading references-heading';
                referencesHeading.textContent = 'Literatūra'; // Use text instead of HTML
                container.appendChild(referencesHeading);
                
                // Create container for references
                const referencesSection = document.createElement('div');
                referencesSection.className = 'document-section citation-list';
                container.appendChild(referencesSection);
                
                // Process references
                this.processReferences(paragraph, referencesSection);
                
                // Update current section to references section
                currentSection = referencesSection;
            }
            // Regular paragraph
            else if (currentSection) {
                const p = document.createElement('p');
                
                // Apply special formatting
                p.innerHTML = this.applySpecialFormatting(paragraph);
                
                // Add to current section
                currentSection.appendChild(p);
            }
            else {
                // If we somehow don't have a current section, create one
                currentSection = document.createElement('div');
                currentSection.className = 'document-section';
                container.appendChild(currentSection);
                
                const p = document.createElement('p');
                p.innerHTML = this.applySpecialFormatting(paragraph);
                currentSection.appendChild(p);
            }
        }
        
        // Add the stamp as a visual element at the end
        this.addApprovalStamp(container);
        
        return container;
    }
    
    /**
     * Process references section
     * @param {string} paragraph - The references paragraph
     * @param {HTMLElement} referencesSection - The section to add references to
     */
    static processReferences(paragraph, referencesSection) {
        // Check if the paragraph contains numbered references
        if (paragraph.match(/^\d+\.\s+[A-Za-zĄČĘĖĮŠŲŪŽačęėįšųūž]+/)) {
            // Split by numbered references - improved regex for better detection
            const references = paragraph.split(/(?=\d+\.\s+[A-Za-zĄČĘĖĮŠŲŪŽąčęėįšųūž]+)/);
            
            references.forEach((ref, index) => {
                if (ref.trim()) {
                    const refItem = document.createElement('p');
                    refItem.className = 'citation-item';
                    
                    // Fix reference numbering if needed
                    let fixedRef = ref.trim();
                    // If reference doesn't start with a number but should be numbered
                    if (!fixedRef.match(/^\d+\./)) {
                        fixedRef = `${index + 1}. ${fixedRef}`;
                    }
                    
                    refItem.innerHTML = this.formatReference(fixedRef);
                    referencesSection.appendChild(refItem);
                }
            });
        } else {
            // Process references that might be separated by line breaks but not properly numbered
            const possibleRefs = paragraph.split(/\n|(?<=\)\.)/).filter(p => p.trim());
            
            possibleRefs.forEach((ref, index) => {
                if (ref.trim()) {
                    const refItem = document.createElement('p');
                    refItem.className = 'citation-item';
                    
                    // Add numbering if missing
                    let fixedRef = ref.trim();
                    if (!fixedRef.match(/^\d+\./)) {
                        fixedRef = `${index + 1}. ${fixedRef}`;
                    }
                    
                    refItem.innerHTML = this.formatReference(fixedRef);
                    referencesSection.appendChild(refItem);
                }
            });
        }
    }
    
    /**
     * Format a reference entry with proper styling
     * @param {string} reference - Reference text
     * @returns {string} - Formatted reference
     */
    static formatReference(reference) {
        // Fix author name and date formatting
        const formattedRef = reference
            // Format author names properly
            .replace(/(\d+\.\s+)([A-ZĄČĘĖĮŠŲŪŽa-ząčęėįšųūž\s]+?)(?=\s*\(|\s*–|\s*-|\s*,)/, '$1<span class="author">$2</span>')
            // Format journal names and book titles in italics
            .replace(/("|\bJournal of[\w\s]+|Animal Welfare|Feline Medicine and Surgery|Animal Cognition")/g, 
                     '<em>$1</em>')
            // Format volume, issue and page numbers
            .replace(/(\d+)(\()(\d+)(\))([,:])\s*(\d+)[-–](\d+)/, 
                     '$1<em>($3)</em>$5 $6–$7')
            // Fix missing periods at the end
            .replace(/([^.])$/, '$1.');
        
        return formattedRef;
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
        // If paragraph is very long, it's definitely not a heading
        if (paragraph.length > 150) return false;
        
        // Specifically identify common Lithuanian document section headings
        const lithuanianHeadings = [
            'ĮVADAS', 'Įvadas', 'įvadas',
            'IŠVADA', 'IŠVADOS', 'Išvada', 'Išvados', 'išvada', 'išvados',
            'KODĖL', 'Kodėl', 'kodėl',
            'KAIP', 'Kaip', 'kaip',
            'KĄ', 'Ką', 'ką',
            'APIE', 'Apie', 'apie',
            'METODAI', 'Metodai', 'metodai',
            'REZULTATAI', 'Rezultatai', 'rezultatai',
            'DISKUSIJA', 'Diskusija', 'diskusija',
            'LITERATŪRA', 'Literatūra', 'literatūra',
            'ŠALTINIAI', 'Šaltiniai', 'šaltiniai',
            'BIBLIOGRAFIJA', 'Bibliografija', 'bibliografija',
            'NUORODOS', 'Nuorodos', 'nuorodos'
        ];
        
        // Check for exact heading matches
        if (lithuanianHeadings.includes(paragraph)) {
            return true;
        }
        
        // Check for headings starting with common section markers
        for (const heading of lithuanianHeadings) {
            if (paragraph.startsWith(heading + ':') || paragraph.startsWith(heading + ' ')) {
                return true;
            }
        }
        
        // Headings are typically short and often end with question mark or colon
        if (paragraph.length < 60 && paragraph.endsWith(':')) {
            return true;
        }
        
        // Check for all-capitalized short text that might be a heading
        if (paragraph.length < 60 && paragraph === paragraph.toUpperCase() && paragraph.length > 3) {
            return true;
        }
        
        // Check for numbered headings
        if (paragraph.match(/^\d+\.\s+[A-ZĀČĘĖĮŠŲŪŽ]/)) {
            return true;
        }
        
        // Check for headings with ### markdown format
        if (paragraph.match(/^#{1,3}\s+.+$/)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Check if paragraph might be a section title based on special patterns
     * @param {string} paragraph - Current paragraph to check
     * @param {string} nextParagraph - Next paragraph for context
     * @returns {boolean} - Whether it's likely a section title
     */
    static isPossibleSectionTitle(paragraph, nextParagraph) {
        // If paragraph is too long, it's not a title
        if (paragraph.length > 80) return false;
        
        // Check for specific title patterns like "X – Y" format that are common in Lithuanian academic texts
        const dashTitlePattern = /^[A-ZĄČĘĖĮŠŲŪŽa-ząčęėįšųūž][\w\s]+[–\-][\w\s]+$/;
        
        if (dashTitlePattern.test(paragraph)) {
            // Additional check: if next paragraph is a proper paragraph (longer)
            // and this paragraph is short enough to be a title
            if (nextParagraph && nextParagraph.length > 100 && paragraph.length < 60) {
                return true;
            }
            
            // Check for patterns like "Murkimas – mažas stebuklas su didžiuliu poveikiu"
            if (/^[A-ZĹČĘĖĮŠŲŪŽA-ZĄČĘĖĮŠŲŪŽa-ząčęėįšųūž]+\s+[–\-]\s+[\w\s]+$/.test(paragraph)) {
                return true;
            }
        }
        
        // Check if paragraph stands alone and has capitalized first word
        // and has special keywords found in section titles
        const titleKeywords = [
            'gyvenim', 'nauda', 'svarba', 'poveik', 'savyb', 'privalum', 
            'trūkum', 'vystym', 'rūš', 'evoliuc', 'istorij', 'draug', 
            'gyvūn', 'terap', 'elges', 'prigim', 'katė', 'katės', 'augint'
        ];
        
        // If paragraph contains title keywords and is of reasonable length
        if (paragraph.length < 60 && 
            /^[A-ZĹČĘĖĮŠŲŪŽ]/.test(paragraph) && 
            titleKeywords.some(keyword => paragraph.toLowerCase().includes(keyword))) {
            
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
        // Remove markdown heading markers
        let formattedText = text.replace(/^#{1,3}\s+(.*)$/gm, '$1');
        
        // Make text between ** bold
        formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Make text between * italic
        formattedText = formattedText.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
        
        // Identify references and citations
        formattedText = formattedText.replace(/\(([\w\s\.,]+, \d{4}(?:, p\.\s*\d+)?)\)/g, 
                                              '<span class="citation">($1)</span>');
        
        return formattedText;
    }
    
    /**
     * Add the approval stamp to the document
     * @param {HTMLElement} container - The document container
     */
    static addApprovalStamp(container) {
        // Create signature container
        const signatureContainer = document.createElement('div');
        signatureContainer.className = 'document-signature-container';
        
        // Create stamp div
        const stampDiv = document.createElement('div');
        stampDiv.className = 'boss-approval-stamp';
        stampDiv.textContent = 'ŠEFO PATVIRTINTA';
        
        // Add the stamp to the signature container
        signatureContainer.appendChild(stampDiv);
        
        // Add signature block at right side of content
        const signatureBlock = document.createElement('div');
        signatureBlock.className = 'signature-block';
        
        const signatureLine = document.createElement('div');
        signatureLine.className = 'signature-line';
        
        const signatureName = document.createElement('div');
        signatureName.className = 'signature-name';
        signatureName.textContent = 'Tauris';
        
        const signatureTitle = document.createElement('div');
        signatureTitle.textContent = 'Vyr. AI Vadovas';
        
        const signatureDate = document.createElement('div');
        signatureDate.className = 'signature-date';
        signatureDate.textContent = '2025-02-28';
        
        // Add signature elements to the signature block
        signatureBlock.appendChild(signatureLine);
        signatureBlock.appendChild(signatureName);
        signatureBlock.appendChild(signatureTitle);
        signatureBlock.appendChild(signatureDate);
        
        // Add signature block to signature container
        signatureContainer.appendChild(signatureBlock);
        
        // Add the signature container to the main container
        container.appendChild(signatureContainer);
        
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
            @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman:wght@400;700&display=swap');
            
            .formatted-document {
                font-family: 'Times New Roman', TimesNewRoman, Times, serif;
                line-height: 1.5;
                text-align: justify;
                padding: 20px;
                position: relative;
                margin-bottom: 80px; /* Space for signature */
                max-width: 800px;
                margin-left: auto;
                margin-right: auto;
                font-size: 12pt;
            }
            
            /* Document title styling */
            .document-title {
                font-size: 16pt;
                font-weight: bold;
                text-align: center;
                margin-bottom: 2em;
                margin-top: 1em;
                text-transform: uppercase;
                color: var(--text-main);
                font-family: 'Times New Roman', TimesNewRoman, Times, serif !important;
                letter-spacing: 0.5px;
            }
            
            /* Apply proper margins according to requirements */
            @media print {
                .formatted-document {
                    margin-left: 3cm;
                    margin-right: 1cm;
                    margin-top: 2cm;
                    margin-bottom: 2cm;
                }
                
                .document-title {
                    margin-top: 3cm;
                }
            }
            
            /* Fix paragraph indentation to 1.27cm */
            .document-section p {
                margin-bottom: 0;
                text-indent: 1.27cm;
                margin-top: 0;
                padding-top: 0;
                padding-bottom: 0;
                font-family: 'Times New Roman', TimesNewRoman, Times, serif !important;
                font-weight: normal !important;
            }
            
            /* Make sure first paragraph after heading is also indented */
            .document-section p:first-child {
                text-indent: 1.27cm;
            }
            
            /* Fix paragraphs to have 1.5 spacing between them */
            .document-section p + p {
                margin-top: 0.5em;
            }
            
            /* Heading styles according to requirements */
            .document-heading {
                font-weight: bold;
                margin-top: 1.5em;
                margin-bottom: 1em; /* 6pt spacing after heading */
                font-size: 14pt;
                color: var(--text-main);
                text-align: center; 
                text-transform: uppercase;
                padding-top: 6pt; /* 6pt spacing before heading */
                padding-bottom: 6pt;
                page-break-before: auto; /* Changed from 'always' to avoid excessive page breaks */
                font-family: 'Times New Roman', TimesNewRoman, Times, serif !important;
            }
            
            /* Only force page breaks for major sections */
            .document-heading.major-section {
                page-break-before: always;
            }
            
            .document-heading:first-child {
                page-break-before: avoid;
            }
            
            /* References section heading */
            .references-heading {
                margin-top: 2em;
                border-top: none;
                padding-top: 6pt;
            }
            
            /* Literature reference formatting */
            .document-section .citation-list {
                margin-top: 2em;
                border-top: none;
            }
            
            /* Fix literature references formatting */
            .document-section .citation-item {
                padding-left: 2em;
                text-indent: -2em; /* Hanging indent */
                margin-bottom: 0;
                line-height: 1.5;
                padding-bottom: 6pt; /* 6pt spacing after reference */
                font-weight: normal !important;
                font-family: 'Times New Roman', TimesNewRoman, Times, serif !important;
            }
            
            .citation-item .author {
                font-weight: normal; /* Ensure author names are not bold */
            }
            
            /* Ensure all text in formatted document uses Times New Roman */
            .formatted-document * {
                font-family: 'Times New Roman', TimesNewRoman, Times, serif;
            }
            
            /* Regular text should not be bold */
            .document-section strong {
                font-weight: bold;
            }
            
            /* Page settings */
            @page {
                margin: 2cm 1cm 2cm 3cm;
                size: A4 portrait;
            }
            
            /* Signature container layout */
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
     * Extract the title from the text
     * @param {string} text - The document text
     * @returns {string|null} - The extracted title or null
     */
    static extractTitle(text) {
        // Split text into lines and paragraphs for analysis
        const firstLines = text.split('\n').slice(0, 10);
        const paragraphs = text.split('\n\n').slice(0, 3).map(p => p.trim());
        
        // First, check if there's a standalone title (not part of a paragraph)
        for (const line of firstLines) {
            const trimmedLine = line.trim();
            
            // Only consider lines that look like titles (no punctuation, appropriate length)
            if (trimmedLine && 
                trimmedLine.length > 5 && 
                trimmedLine.length < 100 && 
                !trimmedLine.endsWith('.') && 
                !trimmedLine.endsWith('?') && 
                !trimmedLine.endsWith('!') &&
                !trimmedLine.toLowerCase().includes('įvadas') &&
                !trimmedLine.toLowerCase().includes('literatūra') &&
                !trimmedLine.toLowerCase().includes('šaltiniai') &&
                !trimmedLine.toLowerCase().includes('išvados') &&
                /^[A-ZĀČĘĖĮŠŲŪŽ]/.test(trimmedLine)) { // Must start with a capital letter
                
                // Check for "Katės – nepriklausomumo..." type titles
                if (/ – | - /.test(trimmedLine)) {
                    return trimmedLine;
                }
                
                // Check if line is standalone (not part of paragraph)
                const isStandalone = !paragraphs.some(p => p.length > trimmedLine.length && p.includes(trimmedLine));
                
                if (isStandalone) {
                    return trimmedLine;
                }
            }
        }
        
        // Look in the first few paragraphs for potential titles
        for (const paragraph of paragraphs) {
            // If first paragraph is short and contains a dash, it might be a title
            if (paragraph.length < 100 && 
                /^[A-ZĀČĘĖĮŠŲŪŽ]/.test(paragraph) && 
                (/ – | - /.test(paragraph))) {
                
                return paragraph;
            }
        }
        
        // If nothing else works, use the first paragraph if it's short enough
        if (paragraphs[0] && paragraphs[0].length < 100) {
            return paragraphs[0];
        }
        
        return null;
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
                    const text = document.getElementById('finalResult').textContent;
                    const cleanedText = DocumentFormatter.removeTeamAcknowledgments(text);
                    const formattedDocument = DocumentFormatter.formatFinalDocument(cleanedText);
                    if (formattedDocument) {
                        const finalResultElement = document.getElementById('finalResult');
                        finalResultElement.innerHTML = '';
                        finalResultElement.appendChild(formattedDocument);
                    }
                }, 1500);
            };
        }
    }
}

// Initialize formatter when document loads
document.addEventListener('DOMContentLoaded', () => {
    DocumentFormatter.setupFormatOnApproval();
});

// Make globally available
window.DocumentFormatter = DocumentFormatter;