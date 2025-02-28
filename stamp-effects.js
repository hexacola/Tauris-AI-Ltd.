/**
 * Special effects for the boss approval stamp and other approval animations
 */
class StampEffects {
    /**
     * Show the boss approval stamp on the final result
     */
    static showBossApproval() {
        const resultContainer = document.querySelector('.final-result');
        if (!resultContainer) return;
        
        // Remove any existing boss approval stamps (to avoid duplication)
        const existingStamp = resultContainer.querySelector('.boss-approval-stamp');
        if (existingStamp) {
            existingStamp.remove();
        }
        
        // Remove any existing signature (to avoid duplication)
        const finalResult = document.getElementById('finalResult');
        const existingSignature = finalResult ? finalResult.querySelector('.boss-signature') : null;
        if (existingSignature) {
            existingSignature.remove();
        }
        
        // Create boss approval stamp and place it at the end of the document
        const bossStamp = document.createElement('div');
        bossStamp.className = 'boss-approval-stamp';
        bossStamp.textContent = 'ŠEFO PATVIRTINTA';
        
        // Add stamp to the end of finalResult, not the container
        if (finalResult) {
            // Make sure we append it to the end of the content
            finalResult.appendChild(bossStamp);
            
            // Add padding at the bottom of the content to make room for stamp
            finalResult.style.paddingBottom = '80px';
        } else {
            // Fallback to the container if finalResult doesn't exist
            resultContainer.appendChild(bossStamp);
        }
        
        // Apply animation
        bossStamp.classList.remove('boss-approval-animation');
        setTimeout(() => {
            bossStamp.classList.add('boss-approval-animation');
        }, 10);
        
        // Add signature effect to the final result
        this.addSignatureEffect();
        
        // Play stamp sound
        this.playStampSound();
        
        // Add approved stamp style if not already present
        if (!document.getElementById('boss-stamp-styles')) {
            const style = document.createElement('style');
            style.id = 'boss-stamp-styles';
            style.textContent = `
                .boss-approval-stamp {
                    position: relative;
                    display: block;
                    margin-top: 30px;
                    margin-left: auto;
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
                    transform: rotate(0deg);
                    opacity: 0;
                }
                
                .boss-approval-animation {
                    animation: stamp-appear 0.5s ease-out forwards;
                }
                
                @keyframes stamp-appear {
                    0% { transform: rotate(-30deg) scale(0.5); opacity: 0; }
                    50% { transform: rotate(10deg) scale(1.2); opacity: 0.6; }
                    75% { transform: rotate(-5deg) scale(1.1); opacity: 0.8; }
                    100% { transform: rotate(0deg) scale(1); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Remove the rubber stamp from header to avoid duplication
        const headerStamp = document.querySelector('.rubber-stamp');
        if (headerStamp) {
            headerStamp.style.display = 'none';
        }
    }
    
    /**
     * Clean markdown formatting from text before displaying it
     * @param {string} text - Text that might contain markdown formatting
     * @returns {string} - Clean text without markdown formatting
     */
    static cleanMarkdownFormatting(text) {
        if (!text) return '';
        
        return text
            // Remove headers (# Header)
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
            // Normalize multiple newlines
            .replace(/\n{3,}/g, '\n\n');
    }
    
    /**
     * Add a signature effect to the final result
     */
    static addSignatureEffect() {
        const finalResult = document.getElementById('finalResult');
        if (!finalResult) return;
        
        // Clean any markdown in the text first
        finalResult.textContent = this.cleanMarkdownFormatting(finalResult.textContent);
        
        // Remove any existing signature to avoid duplication
        const existingSignature = finalResult.querySelector('.boss-signature');
        if (existingSignature) {
            existingSignature.remove();
        }
        
        // Create a signature div
        const signature = document.createElement('div');
        signature.className = 'boss-signature';
        signature.innerHTML = `
            <div class="signature-line"></div>
            <div class="signature-name">Tauris</div>
            <div class="signature-title">Vyr. AI Vadovas</div>
            <div class="signature-date">2025-02-28</div>
        `;
        
        // Add signature to the end of the result if DocumentFormatter hasn't already added one
        if (!finalResult.querySelector('.document-signature')) {
            finalResult.appendChild(signature);
        }
        
        // Add CSS for signature if not already present
        if (!document.getElementById('signature-styles')) {
            const style = document.createElement('style');
            style.id = 'signature-styles';
            style.textContent = `
                .boss-signature {
                    margin-top: 30px;
                    text-align: right;
                    font-family: 'Parisienne', cursive, 'Segoe Script', 'Brush Script MT', cursive;
                }
                
                .signature-line {
                    border-top: 1px solid #888;
                    width: 200px;
                    margin-left: auto;
                    margin-bottom: 5px;
                }
                
                .signature-name {
                    font-size: 24px;
                    color: #333;
                }
                
                .signature-title {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 3px;
                }
                
                .signature-date {
                    font-size: 12px;
                    color: #666;
                    font-family: 'Segoe UI', sans-serif;
                }
                
                [data-theme="dark"] .signature-name {
                    color: #ccc;
                }
                
                [data-theme="dark"] .signature-title,
                [data-theme="dark"] .signature-date {
                    color: #999;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add Google Font for signature if not already loaded
        if (!document.getElementById('signature-font')) {
            const link = document.createElement('link');
            link.id = 'signature-font';
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Parisienne&display=swap';
            document.head.appendChild(link);
        }
    }
    
    /**
     * Play a stamp sound effect
     */
    static playStampSound() {
        // Create audio element if it doesn't exist
        if (!this.stampAudio) {
            // Fixed: Use a shorter, properly terminated base64 audio string
            this.stampAudio = new Audio("https://cdn.pixabay.com/audio/2022/03/24/audio_b2d18a43b8.mp3");
        }

        // Play the stamp sound
        this.stampAudio.currentTime = 0; // Reset to start
        this.stampAudio.play().catch(err => {
            console.warn("Could not play stamp sound:", err);
        });
    }
}

// Make available globally
window.StampEffects = StampEffects;