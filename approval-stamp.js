/**
 * Lithuanian approval stamp animations and effects
 */
class ApprovalStamp {
    /**
     * Initialize the approval stamp system
     */
    static init() {
        console.log('Inicializuojamas tvirtinimo antspaudas');
        
        // Make sure the stamp element exists
        this.ensureStampExists();
        
        // Attach result status observer
        this.observeResultStatus();
        
        // Add stamp styles
        this.addStampStyles();
    }
    
    /**
     * Ensure the rubber stamp element exists
     */
    static ensureStampExists() {
        const resultHeader = document.querySelector('.result-header');
        if (!resultHeader) return;
        
        let stamp = resultHeader.querySelector('.rubber-stamp');
        
        // Create stamp if it doesn't exist
        if (!stamp) {
            stamp = document.createElement('div');
            stamp.className = 'rubber-stamp';
            stamp.textContent = '✓ PATVIRTINTA';
            stamp.style.display = 'none'; // Hide initially
            resultHeader.appendChild(stamp);
        }
    }
    
    /**
     * Add the necessary styles for the stamp
     */
    static addStampStyles() {
        if (document.getElementById('approval-stamp-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'approval-stamp-styles';
        style.textContent = `
            .rubber-stamp {
                position: absolute;
                top: -10px;
                right: 10px;
                background-color: var(--lt-red);
                color: white;
                padding: 5px 15px;
                border-radius: 4px;
                transform: rotate(10deg);
                font-weight: bold;
                font-size: 14px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                z-index: 10;
                display: none;
            }
            
            .rubber-stamp.show {
                display: block;
                animation: stamp-appear 0.5s ease-out forwards;
            }
            
            @keyframes stamp-appear {
                0% { transform: scale(0) rotate(-45deg); opacity: 0; }
                50% { transform: scale(1.2) rotate(10deg); opacity: 0.9; }
                100% { transform: scale(1) rotate(10deg); opacity: 1; }
            }
            
            .rubber-stamp::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 2px,
                    rgba(255, 255, 255, 0.1) 2px,
                    rgba(255, 255, 255, 0.1) 4px
                );
                border-radius: 4px;
                pointer-events: none;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Setup observer for result status changes
     */
    static observeResultStatus() {
        const resultStatus = document.getElementById('resultStatus');
        if (!resultStatus) return;
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    const content = resultStatus.textContent || '';
                    
                    // Check for completion status in both English and Lithuanian
                    if (content.includes('Baigta') || 
                        content.includes('Completed') || 
                        content.includes('(Baigta)') || 
                        content.includes('(Completed)')) {
                        this.showStamp();
                    }
                }
            });
        });
        
        observer.observe(resultStatus, { 
            characterData: true,
            childList: true,
            subtree: true
        });
    }
    
    /**
     * Show the approval stamp with animation
     */
    static showStamp() {
        const stamp = document.querySelector('.rubber-stamp');
        if (!stamp) return;
        
        // Reset animation if already displayed
        stamp.style.animation = 'none';
        void stamp.offsetWidth; // Force reflow to reset animation
        
        // Show and animate the stamp
        stamp.style.display = 'block';
        stamp.classList.add('show');
        
        // Make sure the text is correct
        stamp.textContent = '✓ PATVIRTINTA';
        
        // Add sound effect if possible
        this.playStampSound();
        
        // Add confetti effect
        this.showCelebrationEffect();
    }
    
    /**
     * Play stamp sound
     */
    static playStampSound() {
        try {
            const audio = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAASAAAeMwAUFBQUJiYmJiYyMjIyMkREREREVlZWVlZoaGhoaHp6enp6jIyMjIyenp6enrCwsLC4uLi4uMrKysrK3Nzc3Nzu7u7u7v7+/v7+//////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAYAAAAAAAAAHjOXz+eEAAAAAAAAAAAAAAAAAAAA//sQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQZAYP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQZAgP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQZAoP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQZAwP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV');
            audio.volume = 0.2;
            audio.play().catch(e => console.log('Audio playback failed:', e));
        } catch (err) {
            console.log('Could not play stamp sound:', err);
        }
    }
    
    /**
     * Show celebration effect
     */
    static showCelebrationEffect() {
        // Add mini-confetti effect around the stamp
        const resultHeader = document.querySelector('.result-header');
        if (!resultHeader) return;
        
        // Create confetti container
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        confettiContainer.style.position = 'absolute';
        confettiContainer.style.top = '0';
        confettiContainer.style.right = '0';
        confettiContainer.style.width = '120px';
        confettiContainer.style.height = '60px';
        confettiContainer.style.overflow = 'hidden';
        confettiContainer.style.pointerEvents = 'none';
        resultHeader.appendChild(confettiContainer);
        
        // Create confetti pieces
        const lithuanianColors = [
            '#FFDA00', // Yellow
            '#009930', // Green  
            '#C1272D'  // Red
        ];
        
        for (let i = 0; i < 30; i++) {
            const confetti = document.createElement('div');
            const color = lithuanianColors[Math.floor(Math.random() * lithuanianColors.length)];
            
            confetti.style.position = 'absolute';
            confetti.style.width = Math.random() * 8 + 3 + 'px';
            confetti.style.height = Math.random() * 4 + 3 + 'px';
            confetti.style.backgroundColor = color;
            confetti.style.borderRadius = '2px';
            confetti.style.top = Math.random() * 30 + 'px';
            confetti.style.right = Math.random() * 100 + 10 + 'px';
            confetti.style.opacity = '0';
            confetti.style.animation = `confetti-fall ${Math.random() * 2 + 1}s ease-out forwards ${Math.random() * 0.5}s`;
            
            confettiContainer.appendChild(confetti);
        }
        
        // Add confetti animation style
        if (!document.getElementById('confetti-style')) {
            const style = document.createElement('style');
            style.id = 'confetti-style';
            style.textContent = `
                @keyframes confetti-fall {
                    0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(60px) rotate(360deg); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Clean up after 3 seconds
        setTimeout(() => {
            if (document.body.contains(confettiContainer)) {
                confettiContainer.remove();
            }
        }, 3000);
    }
}

// Initialize on document load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize after a small delay to ensure all elements are ready
    setTimeout(() => {
        ApprovalStamp.init();
    }, 500);
});

// Make available globally
window.ApprovalStamp = ApprovalStamp;
