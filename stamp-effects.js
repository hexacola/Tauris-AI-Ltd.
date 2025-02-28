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
        
        // Create boss approval stamp if it doesn't exist
        let bossStamp = resultContainer.querySelector('.boss-approval-stamp');
        if (!bossStamp) {
            bossStamp = document.createElement('div');
            bossStamp.className = 'boss-approval-stamp';
            bossStamp.textContent = 'ŠEFO PATVIRTINTA';
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
    }
    
    /**
     * Add a signature effect to the final result
     */
    static addSignatureEffect() {
        const finalResult = document.getElementById('finalResult');
        if (!finalResult) return;
        
        // Create a signature div
        const signature = document.createElement('div');
        signature.className = 'boss-signature';
        signature.innerHTML = `
            <div class="signature-line"></div>
            <div class="signature-name">Tauris</div>
            <div class="signature-title">Vyr. AI Vadovas</div>
            <div class="signature-date">${new Date().toLocaleDateString('lt-LT')}</div>
        `;
        
        // Add signature to the end of the result
        finalResult.appendChild(signature);
        
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