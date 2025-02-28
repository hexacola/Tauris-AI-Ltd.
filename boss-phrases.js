/**
 * Lithuanian boss phrases for office simulation
 */
class BossPhrases {
    /**
     * Collection of phrases the boss might say
     */
    static phrases = [
        "Kada bus pabaigta užduotis?",
        "Man reikia rezultatų dabar!",
        "Ar galite dirbti greičiau?",
        "Klientas laukia!",
        "Ar reikia padėti?",
        "Kas vyksta su projektu?",
        "Žinote, kad turime terminą!",
        "Man reikia to ant stalo iki rytojaus",
        "Kodėl taip ilgai?",
        "Šita užduotis turėjo būti baigta vakar",
        "Ar turite progreso?",
        "Ar galime spartinti procesą?",
        "Parodykit man, ką turite",
        "Ar manote, kad baigsite laiku?",
        "Kolegos jau laukia jūsų darbo",
        "Kaip einasi su užduotimi?"
    ];
    
    /**
     * Phrases specifically for when the boss is happy
     */
    static happyPhrases = [
        "Puikus darbas!",
        "Esu įspūdingas!",
        "Komanda dirba puikiai",
        "Šiandien visi gaus cepelinų!",
        "Labai geras progresas!",
        "Klientas bus patenkintas",
        "Viskas vyksta pagal planą",
        "Tęskite puikų darbą"
    ];
    
    /**
     * Phrases when the boss is impatient
     */
    static impatientPhrases = [
        "Ar jūs dar dirbate?!",
        "Modeliai trinka? Man nesvarbu, noriu rezultatų!",
        "Mano penkiametis sūnus dirba greičiau!",
        "Pažadėjau klientui rezultatus rytoj!",
        "Kas per ilgas laukimas?!",
        "Gal reikia pakeisti AI modelius?!",
        "Neturime visą dieną!",
        "Ar turiu kviesti IT?!"
    ];
    
    /**
     * Displays random boss phrase in specified element
     * @param {HTMLElement} element - Element to display phrase in
     * @param {string} mood - Boss mood (normal, happy, impatient)
     */
    static showRandomPhrase(element, mood = 'normal') {
        if (!element) return;
        
        let phraseList;
        switch(mood) {
            case 'happy': 
                phraseList = this.happyPhrases;
                break;
            case 'impatient':
                phraseList = this.impatientPhrases;
                break;
            case 'normal':
            default:
                phraseList = this.phrases;
                break;
        }
        
        const randomIndex = Math.floor(Math.random() * phraseList.length);
        const phrase = phraseList[randomIndex];
        
        // Check if element is a DOM node or a CSS selector
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        
        if (element) {
            // Store original text to restore later
            const originalText = element.dataset.originalText || element.textContent;
            if (!element.dataset.originalText) {
                element.dataset.originalText = originalText;
            }
            
            element.textContent = phrase;
            element.classList.add('boss-speaking');
            
            // Restore original text after delay
            setTimeout(() => {
                element.textContent = originalText;
                element.classList.remove('boss-speaking');
            }, 3000);
        }
    }
    
    /**
     * Schedule periodic boss phrases for impatience
     * @param {HTMLElement} element - Element to display phrases in
     * @param {number} interval - Time between phrases in ms
     * @param {number} duration - Total duration to show phrases in ms
     */
    static scheduleBossPhrases(element, interval = 5000, duration = 30000) {
        if (!element) return;
        
        // Store original text
        const originalText = element.textContent;
        
        let count = 0;
        const maxCount = Math.floor(duration / interval);
        
        // Show first phrase immediately
        this.showRandomPhrase(element, 'impatient');
        
        // Set up interval to show more phrases
        const intervalId = setInterval(() => {
            count++;
            if (count >= maxCount) {
                clearInterval(intervalId);
                // Restore original after last phrase
                setTimeout(() => {
                    element.textContent = originalText;
                    element.classList.remove('boss-speaking');
                }, 3000);
                return;
            }
            
            this.showRandomPhrase(element, 'impatient');
        }, interval);
        
        // Store interval ID in element for potential early clearing
        element.dataset.bossIntervalId = intervalId;
        
        return intervalId;
    }
    
    /**
     * Stop scheduled boss phrases
     * @param {HTMLElement} element - Element with scheduled phrases
     */
    static stopScheduledPhrases(element) {
        if (!element) return;
        
        const intervalId = element.dataset.bossIntervalId;
        if (intervalId) {
            clearInterval(parseInt(intervalId));
            delete element.dataset.bossIntervalId;
            
            // Restore original text if it exists
            if (element.dataset.originalText) {
                element.textContent = element.dataset.originalText;
                element.classList.remove('boss-speaking');
            }
        }
    }
    
    /**
     * Show a celebration phrase when work is completed
     * @param {HTMLElement} element - Element to show phrase in
     */
    static celebrateCompletion(element) {
        if (!element) return;
        
        const celebrationPhrases = [
            "Puikus darbas! Visiems cepelinai šiandien!",
            "Štai kodėl esame geriausia AI komanda Lietuvoje!",
            "Klientas bus sužavėtas! Premijos visiems!",
            "Rezultatas tiesiog tobulas! Didžiuojuosi komanda!",
            "Štai ką reiškia dirbti su geriausiais AI specialistais!"
        ];
        
        const randomIndex = Math.floor(Math.random() * celebrationPhrases.length);
        const phrase = celebrationPhrases[randomIndex];
        
        element.textContent = phrase;
        element.classList.add('boss-celebrating');
        
        // Add celebration animation
        const confettiElement = document.createElement('div');
        confettiElement.className = 'boss-confetti';
        element.appendChild(confettiElement);
        
        // Remove confetti after animation
        setTimeout(() => {
            confettiElement.remove();
            element.classList.remove('boss-celebrating');
        }, 5000);
        
        // Make confetti effect
        this.createConfetti(8);
    }
    
    /**
     * Create confetti elements for celebration
     * @param {number} count - Number of confetti pieces
     */
    static createConfetti(count = 50) {
        const colors = ['#ffda00', '#009930', '#c1272d', '#3498db', '#9b59b6'];
        const container = document.body;
        
        for (let i = 0; i < count; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = `${Math.random() * 100}vw`;
            confetti.style.animationDuration = `${Math.random() * 3 + 2}s`;
            confetti.style.animationDelay = `${Math.random() * 2}s`;
            container.appendChild(confetti);
        }
    }
}

// Make available globally
window.BossPhrases = BossPhrases;
