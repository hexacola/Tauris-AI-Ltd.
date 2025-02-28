/**
 * Boss phrases utility - provides funny Lithuanian boss phrases
 */
const BossPhrases = {
    // Lithuanian boss phrases
    phrases: [
        "Aš ne tam tave samdžiau!",
        "Ar mes apie tą patį kalbame?",
        "Iki rytojaus tai turi būti padaryta!",
        "Kur tavo iniciatyva?",
        "Mano kantrybė baigiasi...",
        "Na, ir koks tavo planas?",
        "O kodėl taip ilgai užtrunka?",
        "Parodyk man rezultatus!",
        "Susirinkimas! Dabar!",
        "Tai ką tu čia veiki?",
        "Tu čia dirbi ar šiaip sėdi?",
        "Vaje, vaje... ir vėl tas pats.",
        "Viskas. Turiu kitą skubų reikalą!",
        "Ką aš tau sakiau praeitą kartą?",
        "Darbas nelaukia!"
    ],
    
    // Get a random boss phrase
    getRandomPhrase() {
        const randomIndex = Math.floor(Math.random() * this.phrases.length);
        return this.phrases[randomIndex];
    },
    
    // Schedule random boss phrases
    scheduleBossPhrases(targetElement, interval = 10000, active = true) {
        if (!targetElement) {
            console.warn("No target element provided for boss phrases");
            return { stop: () => {} };
        }
        
        let isActive = active;
        let timeoutId;
        
        const updatePhrase = () => {
            if (!isActive) return;
            
            targetElement.textContent = this.getRandomPhrase();
            targetElement.classList.add('boss-phrase-active');
            
            // Remove active class after animation
            setTimeout(() => {
                targetElement.classList.remove('boss-phrase-active');
            }, 3000);
            
            // Schedule next update
            timeoutId = setTimeout(updatePhrase, interval);
        };
        
        // Start if active
        if (isActive) {
            updatePhrase();
        }
        
        // Return controls
        return {
            stop: () => {
                isActive = false;
                clearTimeout(timeoutId);
            },
            start: () => {
                if (!isActive) {
                    isActive = true;
                    updatePhrase();
                }
            },
            toggle: () => {
                isActive = !isActive;
                if (isActive) {
                    updatePhrase();
                } else {
                    clearTimeout(timeoutId);
                }
            }
        };
    }
};

// Make available globally
window.BossPhrases = BossPhrases;
