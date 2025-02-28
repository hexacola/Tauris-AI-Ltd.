/**
 * Lietuviški "galvojimo" indikatoriai darbuotojams
 * Lithuanian thinking indicators for workers
 */

document.addEventListener('DOMContentLoaded', function() {
    // Override the thinking indicator function
    if (typeof window.addThinkingIndicator === 'function') {
        const originalAddThinking = window.addThinkingIndicator;
        
        window.addThinkingIndicator = function(workerName, id) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message thinking ${workerName === 'Writer' ? 'writer' : workerName === 'Researcher' ? 'researcher' : workerName === 'Critic' ? 'critic' : 'editor'}`;
            messageDiv.id = id;
            
            const header = document.createElement('div');
            header.className = 'message-header';
            
            // Translate worker names
            let lithuanianName;
            switch(workerName) {
                case 'Writer': lithuanianName = 'Jonas (Rašytojas)'; break;
                case 'Researcher': lithuanianName = 'Gabija (Tyrėja)'; break;
                case 'Critic': lithuanianName = 'Vytautas (Kritikas)'; break;
                case 'Editor': lithuanianName = 'Eglė (Redaktorė)'; break;
                default: lithuanianName = workerName;
            }
            
            header.textContent = lithuanianName;
            
            const contentP = document.createElement('p');
            
            // Set different thinking text based on worker role
            let lithuanianThinking = getRandomThinkingText(workerName.toLowerCase());
            contentP.textContent = lithuanianThinking;
            
            messageDiv.appendChild(header);
            messageDiv.appendChild(contentP);
            
            const chatLog = document.getElementById('chatLog');
            if (chatLog) {
                chatLog.appendChild(messageDiv);
                chatLog.scrollTop = chatLog.scrollHeight;
            }
            
            // Add thinking animation to the worker card
            if (window.ErrorAnimations) {
                const workerKey = workerName.toLowerCase();
                ErrorAnimations.showThinkingTooHardAnimation(workerKey);
            }
            
            // Start a timer to rotate thinking messages
            const thinkingInterval = setInterval(() => {
                if (document.body.contains(contentP)) {
                    contentP.textContent = getRandomThinkingText(workerName.toLowerCase());
                } else {
                    clearInterval(thinkingInterval);
                }
            }, 2500);
            
            return thinkingInterval; // Return the interval ID for cleanup
        };
    }

    // Also override any existing thinking indicators immediately
    setInterval(() => {
        document.querySelectorAll('.message.thinking p').forEach(el => {
            if (el.textContent === 'Thinking...' || el.textContent.includes('is thinking')) {
                // Get the parent's class to determine the worker
                const parentClasses = el.parentElement.className.split(' ');
                let workerType = '';
                
                if (parentClasses.includes('writer')) workerType = 'writer';
                else if (parentClasses.includes('researcher')) workerType = 'researcher';
                else if (parentClasses.includes('critic')) workerType = 'critic';
                else if (parentClasses.includes('editor')) workerType = 'editor';
                
                if (workerType) {
                    el.textContent = getRandomThinkingText(workerType);
                }
            }
        });
    }, 1000);
});

/**
 * Get random thinking text for a specific worker role
 */
function getRandomThinkingText(workerType) {
    const thinkingTexts = {
        writer: [
            "Kuria teksto struktūrą...",
            "Ieško tinkamų žodžių...",
            "Gurkšnoja kavą ir galvoja...",
            "Svarsto kaip pradėti įvadą...",
            "Žiūri pro langą įkvėpimo...",
            "Bando sugalvoti gerą metaforą...",
            "Kažką užsirašinėja popieriuje...",
            "Skaito senus užrašus...",
            "Braižo minčių žemėlapį...",
            "Mąsto apie būsimus skaitytojus..."
        ],
        researcher: [
            "Ieško mokslinių šaltinių...",
            "Tikrina statistiką...",
            "Analizuoja tyrimus...",
            "Skaito mokslinę literatūrą...",
            "Peržiūri citavimo vadovą...",
            "Naršo akademines duomenų bazes...",
            "Verifikuoja faktus...",
            "Užsirašo svarbius duomenis...",
            "Lyginą skirtingus šaltinius...",
            "Gilina žinias tema..."
        ],
        critic: [
            "Kritiškai vertina tekstą...",
            "Ieško loginių klaidų...",
            "Analizuoja argumentus...",
            "Tikrina teksto rišlumą...",
            "Kelia gilius klausimus...",
            "Suraukęs antakius skaito...",
            "Ieško kontrargumentų...",
            "Vertina tekstą akademiniu požiūriu...",
            "Žymi trūkstamas dalis...",
            "Skeptiškai žvelgia į teiginius..."
        ],
        editor: [
            "Taiso gramatikos klaidas...",
            "Tobulina sakinių struktūrą...",
            "Tikrina kablelius...",
            "Ieško tinkamesnių žodžių...",
            "Gerina teksto sklandumą...",
            "Tikrina formatavimą...",
            "Suvienodina stilių...",
            "Peržiūri nuorodas ir citatas...",
            "Taiso rašybos klaidas...",
            "Verčia pasyvią kalbą į aktyvią..."
        ]
    };
    
    const texts = thinkingTexts[workerType] || ["Galvoja..."];
    return texts[Math.floor(Math.random() * texts.length)];
}

/**
 * LietuviskasThinking - Script to handle how the Boss processes final content
 * and removes team acknowledgments
 */
class LietuviskasThinking {
    /**
     * Initialize processing
     */
    static init() {
        // Add event listener for boss's final submission
        this.addBossMessageListener();
    }
    
    /**
     * Add listener for boss messages to clean up content
     */
    static addBossMessageListener() {
        document.addEventListener('boss-preparing-message', (event) => {
            if (event.detail && event.detail.message) {
                // Clean up boss's message to remove team acknowledgments
                const cleanedMessage = this.cleanBossMessage(event.detail.message);
                event.detail.message = cleanedMessage;
            }
        });
    }
    
    /**
     * Clean boss message to remove team acknowledgments
     * @param {string} message - The boss's message
     * @returns {string} - Cleaned message
     */
    static cleanBossMessage(message) {
        // Remove common patterns of acknowledgments and team contributions
        let cleaned = message
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
            // Remove analysis and comments sections
            .replace(/Galutinė analizė ir komentarai:[\s\S]*$/i, '')
            .replace(/\d+\.\s*Sukurta aiški[\s\S]*$/i, '')
            .replace(/Puikus komandos darbas!.*$/i, '')
            // Clean up the result text
            .trim();
            
        // Remove intro phrases - they should be at the beginning
        cleaned = cleaned
            .replace(/^.*?[Šš]tai galutinis [šs]io teksto variantas:?\s*/i, '')
            .trim();
            
        return cleaned;
    }
}

// Initialize on document load
document.addEventListener('DOMContentLoaded', () => {
    LietuviskasThinking.init();
});
