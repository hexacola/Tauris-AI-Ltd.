/**
 * Lithuanian themed extras and easter eggs
 */

document.addEventListener('DOMContentLoaded', function() {
    // Add Lithuanian holiday celebration checks
    checkLithuanianHolidays();
    
    // Add random Lithuanian sayings to worker cards
    addLithuanianSayings();
    
    // Add cepelinai animation on successful completion
    setupCepelinaiReward();
    
    // Lithuanian weather effects
    setupWeatherEffects();
    
    // Setup lithuanian-themed error messages
    enhanceErrorMessages();
    
    // Add better writing workflow
    enhanceWritingWorkflow();
    
    // Lithuanian office conversations
    setupLithuanianConversations();
    
    // Start the random boss phrases
    setTimeout(() => {
        setupBossPhrases();
    }, 10000); // Start after 10 seconds
});

/**
 * Check if today is a Lithuanian holiday
 */
function checkLithuanianHolidays() {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1; // Jan is 0
    
    // Define Lithuanian holidays
    const holidays = [
        { day: 16, month: 2, name: "Lietuvos valstybės atkūrimo diena" },
        { day: 11, month: 3, name: "Lietuvos nepriklausomybės atkūrimo diena" },
        { day: 6, month: 7, name: "Valstybės diena (Karaliaus Mindaugo karūnavimo diena)" },
        { day: 15, month: 8, name: "Žolinė" },
        { day: 1, month: 11, name: "Visų Šventųjų diena" },
        { day: 24, month: 12, name: "Kūčios" },
        { day: 25, month: 12, name: "Kalėdos" }
    ];
    
    // Check if today is a holiday
    const holiday = holidays.find(h => h.day === day && h.month === month);
    
    if (holiday) {
        // Show holiday notification
        const notification = document.createElement('div');
        notification.className = 'lithuanian-holiday';
        notification.innerHTML = `
            <div class="holiday-icon">🎉</div>
            <div class="holiday-content">
                <strong>Šventė!</strong> Šiandien yra ${holiday.name}!
            </div>
            <button class="holiday-close">×</button>
        `;
        
        // Style the notification
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = 'var(--bg-card)';
        notification.style.borderLeft = '5px solid var(--lt-yellow)';
        notification.style.borderRadius = '4px';
        notification.style.padding = '10px 15px';
        notification.style.display = 'flex';
        notification.style.alignItems = 'center';
        notification.style.boxShadow = '0 2px 10px var(--shadow)';
        notification.style.zIndex = '1000';
        notification.style.maxWidth = '350px';
        
        document.body.appendChild(notification);
        
        // Add close button functionality
        const closeButton = notification.querySelector('.holiday-close');
        closeButton.style.marginLeft = '10px';
        closeButton.style.border = 'none';
        closeButton.style.background = 'none';
        closeButton.style.cursor = 'pointer';
        closeButton.style.fontSize = '20px';
        closeButton.style.color = 'var(--text-light)';
        
        closeButton.addEventListener('click', () => {
            notification.remove();
        });
        
        // Also automatically hide after 10 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.opacity = '0';
                notification.style.transition = 'opacity 1s ease';
                setTimeout(() => notification.remove(), 1000);
            }
        }, 10000);
        
        // Add celebration effect to the page
        if (typeof addMessageToChatLog === 'function') {
            addMessageToChatLog('Sistema', `Šiandien švenčiame ${holiday.name}! 🎉`, 'system holiday-message');
        }
    }
}

/**
 * Add random Lithuanian sayings to worker cards
 */
function addLithuanianSayings() {
    const sayings = [
        "Neskubėk ir velnią aplenksi.",
        "Devyni amatai, dešimtas – badas.",
        "Kas nedirba, tas nevalgo.",
        "Vienas lauke – ne karys.",
        "Mokslo šaknys karčios, o vaisiai – saldūs.",
        "Nemesk kelio dėl takelio.",
        "Ką pasėsi, tą ir pjausi.",
        "Akys bijo, rankos daro.",
        "Genys margas, pasaulis dar margesnis.",
        "Be darbo nebus ir pyrago.",
        "Su kuo sutapsi, toks ir pats tapsi.",
        "Laikas gydo visas žaizdas.",
        "Ranka ranką plauna.",
        "Melo kojos trumpos."
    ];
    
    // Create tooltip elements for each worker card
    document.querySelectorAll('.role-card').forEach(card => {
        const tooltip = document.createElement('div');
        tooltip.className = 'lithuanian-saying';
        
        // Select a random saying
        const randomSaying = sayings[Math.floor(Math.random() * sayings.length)];
        tooltip.textContent = `"${randomSaying}"`;
        
        // Style the tooltip
        tooltip.style.position = 'absolute';
        tooltip.style.bottom = '-40px';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translateX(-50%)';
        tooltip.style.backgroundColor = 'var(--bg-card)';
        tooltip.style.padding = '8px 12px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.boxShadow = '0 2px 8px var(--shadow)';
        tooltip.style.fontSize = '12px';
        tooltip.style.fontStyle = 'italic';
        tooltip.style.whiteSpace = 'nowrap';
        tooltip.style.opacity = '0';
        tooltip.style.transition = 'opacity 0.3s';
        tooltip.style.zIndex = '100';
        
        card.appendChild(tooltip);
        
        // Show on hover
        card.addEventListener('mouseenter', () => {
            tooltip.style.opacity = '1';
        });
        
        card.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
        });
    });
}

/**
 * Add cepelinai reward animation when work is completed successfully
 */
function setupCepelinaiReward() {
    // Observer for changes to the resultStatus element
    const resultStatus = document.getElementById('resultStatus');
    
    if (resultStatus) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'characterData' || mutation.type === 'childList') {
                    // Check if status changed to Completed
                    if (resultStatus.textContent.includes('Completed') || 
                        resultStatus.textContent.includes('Baigta')) {
                        celebrateWithCepelinai();
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
}

/**
 * Celebrate successful completion with cepelinai animation
 */
function celebrateWithCepelinai() {
    console.log("Celebrating with cepelinai!");
    
    // Create flying cepelinai
    for (let i = 0; i < 15; i++) {
        const cepelinas = document.createElement('div');
        cepelinas.className = 'flying-cepelinas';
        cepelinas.textContent = '🥟';
        
        // Random position and animation
        const startPos = Math.random() * 100;
        const size = 24 + Math.random() * 20;
        const speed = 5 + Math.random() * 10;
        const delay = Math.random() * 3;
        
        cepelinas.style.position = 'fixed';
        cepelinas.style.left = `${startPos}vw`;
        cepelinas.style.top = '100vh';
        cepelinas.style.fontSize = `${size}px`;
        cepelinas.style.zIndex = '1000';
        cepelinas.style.opacity = '0';
        cepelinas.style.animation = `fly-cepelinas ${speed}s ease-in ${delay}s forwards`;
        
        document.body.appendChild(cepelinas);
        
        // Clean up after animation
        setTimeout(() => {
            if (document.body.contains(cepelinas)) {
                document.body.removeChild(cepelinas);
            }
        }, (speed + delay) * 1000);
    }
    
    // Add a celebratory message
    if (typeof addMessageToChatLog === 'function') {
        addMessageToChatLog('Šefas', 'Puikus darbas! Visi gauna cepelinų! 🥟🎉', 'system celebration');
    }
    
    // Add celebration style
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fly-cepelinas {
            0% { transform: translateY(0); opacity: 0; }
            10% { opacity: 1; }
            80% { opacity: 1; }
            100% { transform: translateY(-120vh) rotate(360deg); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Add random Lithuanian weather effects
 */
function setupWeatherEffects() {
    // Random chance to show weather effect
    if (Math.random() < 0.3) { // 30% chance
        const effects = ['rain', 'snow', 'fog'];
        const randomEffect = effects[Math.floor(Math.random() * effects.length)];
        
        // Create weather container
        const weatherContainer = document.createElement('div');
        weatherContainer.className = 'lithuanian-weather';
        weatherContainer.style.position = 'fixed';
        weatherContainer.style.top = '0';
        weatherContainer.style.left = '0';
        weatherContainer.style.width = '100%';
        weatherContainer.style.height = '100%';
        weatherContainer.style.pointerEvents = 'none';
        weatherContainer.style.zIndex = '999';
        weatherContainer.style.overflow = 'hidden';
        
        document.body.appendChild(weatherContainer);
        
        // Setup specific effect
        switch (randomEffect) {
            case 'rain':
                createRainEffect(weatherContainer);
                break;
            case 'snow':
                createSnowEffect(weatherContainer);
                break;
            case 'fog':
                createFogEffect(weatherContainer);
                break;
        }
        
        // Add weather info to chat
        if (typeof addMessageToChatLog === 'function') {
            const weatherMessages = {
                'rain': 'Pro langą matosi, kad lauke lyja. Tipiškas lietuviškas oras! 🌧️',
                'snow': 'Už lango sninga. Laikas traukti šiltus megztinius! ❄️',
                'fog': 'Rūkas gaubia visą miestą. Tikras lietuviškas rytas! 🌫️'
            };
            
            setTimeout(() => {
                addMessageToChatLog('Apsaugininkas', weatherMessages[randomEffect], 'system weather-message');
            }, 3000);
        }
    }
}

/**
 * Create rain effect
 */
function createRainEffect(container) {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes rainfall {
            0% { transform: translateY(-100vh); }
            100% { transform: translateY(100vh); }
        }
    `;
    document.head.appendChild(style);
    
    // Create raindrops
    for (let i = 0; i < 100; i++) {
        const drop = document.createElement('div');
        drop.className = 'raindrop';
        
        const size = 1 + Math.random() * 2;
        const posX = Math.random() * 100;
        const duration = 0.5 + Math.random() * 0.7;
        const delay = Math.random() * 5;
        
        drop.style.position = 'absolute';
        drop.style.width = `${size}px`;
        drop.style.height = `${size * 10}px`;
        drop.style.backgroundColor = 'rgba(174, 194, 224, 0.6)';
        drop.style.borderRadius = '5px';
        drop.style.left = `${posX}%`;
        drop.style.top = `-${size * 10}px`;
        drop.style.animation = `rainfall ${duration}s linear ${delay}s infinite`;
        
        container.appendChild(drop);
    }
}

/**
 * Create snow effect
 */
function createSnowEffect(container) {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes snowfall {
            0% { transform: translateY(-10px) rotate(0deg); }
            100% { transform: translateY(100vh) rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    // Create snowflakes
    for (let i = 0; i < 50; i++) {
        const flake = document.createElement('div');
        flake.className = 'snowflake';
        flake.textContent = '❄';
        
        const size = 10 + Math.random() * 20;
        const posX = Math.random() * 100;
        const duration = 10 + Math.random() * 20;
        const delay = Math.random() * 10;
        
        flake.style.position = 'absolute';
        flake.style.fontSize = `${size}px`;
        flake.style.color = 'rgba(255, 255, 255, 0.7)';
        flake.style.left = `${posX}%`;
        flake.style.top = `-${size}px`;
        flake.style.animation = `snowfall ${duration}s linear ${delay}s infinite`;
        
        container.appendChild(flake);
    }
}

/**
 * Create fog effect
 */
function createFogEffect(container) {
    const fog = document.createElement('div');
    fog.className = 'fog';
    
    fog.style.position = 'absolute';
    fog.style.top = '0';
    fog.style.left = '0';
    fog.style.width = '100%';
    fog.style.height = '100%';
    fog.style.background = 'linear-gradient(rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05), transparent)';
    fog.style.opacity = '0';
    fog.style.animation = 'fog-appear 5s forwards';
    
    container.appendChild(fog);
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fog-appear {
            0% { opacity: 0; }
            100% { opacity: 0.5; }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Enhance error messages with Lithuanian themes
 */
function enhanceErrorMessages() {
    if (window.ErrorAnimations) {
        // Add Lithuanian-themed error scenarios
        const lithuanianErrors = [
            {
                type: "cepelinai",
                title: "Cepelinų pertrauka!",
                message: "AI užsiėmęs valgo cepelinų pietus. Bandysime vėliau.",
                cssClass: "error-cepelinai",
                emoji: "🥟🍽️"
            },
            {
                type: "basketball",
                title: "Krepšinio rungtynės!",
                message: "Visi darbuotojai išėjo žiūrėti Lietuvos krepšinio rinktinės. Palaukit iki pertraukos.",
                cssClass: "error-basketball",
                emoji: "🏀🇱🇹"
            },
            {
                type: "amber",
                title: "Įstrigo gintare!",
                message: "AI užstrigo Baltijos gintare, kaip priešistorinis vabzdys.",
                cssClass: "error-amber",
                emoji: "⚱️🧩"
            }
        ];
        
        // Add to existing error scenarios
        if (Array.isArray(window.ErrorAnimations.errorScenarios)) {
            window.ErrorAnimations.errorScenarios = [
                ...window.ErrorAnimations.errorScenarios,
                ...lithuanianErrors
            ];
        }
        
        // Override getRandomScenario to include Lithuanian-themed errors more often
        const originalGetRandomScenario = window.ErrorAnimations.getRandomScenario;
        window.ErrorAnimations.getRandomScenario = function(types = null) {
            // 50% chance to use Lithuanian error when available
            if (!types && Math.random() < 0.5) {
                return lithuanianErrors[Math.floor(Math.random() * lithuanianErrors.length)];
            }
            
            // Otherwise use original function
            return originalGetRandomScenario.call(this, types);
        };
    }
}

/**
 * Enhance writing workflow to follow professional writing tips
 */
function enhanceWritingWorkflow() {
    // Ensure writing follows best practices
    modifyWritingRolesAndOutputs();
    enhanceWritingQuality();
}

/**
 * Modify worker roles to be more Lithuanian-centric
 */
function modifyWritingRolesAndOutputs() {
    // Update mood displays with Lithuanian expressions
    updateWorkerMoods();
    
    // Add writing style guidance to role descriptions
    const writerDescEl = document.querySelector('.role-card.writer p');
    const researcherDescEl = document.querySelector('.role-card.researcher p');
    const criticDescEl = document.querySelector('.role-card.critic p');
    const editorDescEl = document.querySelector('.role-card.editor p');
    
    if (writerDescEl) {
        writerDescEl.innerHTML = 'Mūsų kūrybinis genijus. Ekspertas glaustų tekstų rašyme, <em>niekada</em> nenuklysta nuo temos ir visada rašo aiškiai.';
    }
    
    if (researcherDescEl) {
        researcherDescEl.innerHTML = 'Mūsų faktų tikrintoja. Naudoja tik patikimus šaltinius ir pateikia informaciją struktūruotai. Kartais įstringa lietuviškos Vikipedijos labirintuose.';
    }
    
    if (criticDescEl) {
        criticDescEl.innerHTML = 'Mūsų kokybės tikrintojas. Jo akys pastebi kiekvieną klaidą ir teksto silpnybę. Negailestingas, bet naudingas.';
    }
    
    if (editorDescEl) {
        editorDescEl.innerHTML = 'Mūsų tobulintoja. Su raudonu pieštuku pataiso ne tik klaidas, bet ir teksto sruktūrą. Ištraukia esmę ir padaro tekstą sklandesnį.';
    }
}

/**
 * Update worker moods with Lithuanian expressions
 */
function updateWorkerMoods() {
    const writerMood = document.querySelector('.role-card.writer .worker-mood');
    const researcherMood = document.querySelector('.role-card.researcher .worker-mood');
    const criticMood = document.querySelector('.role-card.critic .worker-mood');
    const editorMood = document.querySelector('.role-card.editor .worker-mood');
    
    if (writerMood) {
        const moods = ["Įkvėptas ☀️", "Susimąstęs 💭", "Ant bangos 🌊", "Filosofiškas 🧠"];
        writerMood.textContent = `Nuotaika: ${moods[Math.floor(Math.random() * moods.length)]}`;
    }
    
    if (researcherMood) {
        const moods = ["Smalsus 🔍", "Užsispyręs 🔬", "Susitelkęs 📚", "Ieškantis 🌐"];
        researcherMood.textContent = `Nuotaika: ${moods[Math.floor(Math.random() * moods.length)]}`;
    }
    
    if (criticMood) {
        const moods = ["Skeptiškas 🤨", "Budrus 👀", "Kritiškas 📝", "Įtarus 🧐"];
        criticMood.textContent = `Nuotaika: ${moods[Math.floor(Math.random() * moods.length)]}`;
    }
    
    if (editorMood) {
        const moods = ["Pedantiška ✓", "Kruopšti 📏", "Tobulėjanti 📈", "Atidi 🔎"];
        editorMood.textContent = `Nuotaika: ${moods[Math.floor(Math.random() * moods.length)]}`;
    }
}

/**
 * Enhance writing quality by adding Lithuanian expressions
 */
function enhanceWritingQuality() {
    // Prepare to intercept final text and enhance it with Lithuanian flavor
    const originalFinalizeCollaboration = window.finalizeCollaboration;
    
    if (typeof originalFinalizeCollaboration === 'function') {
        window.finalizeCollaboration = function() {
            // Call original function
            originalFinalizeCollaboration();
            
            // Now enhance the final text
            setTimeout(() => {
                const finalResultEl = document.getElementById('finalResult');
                if (finalResultEl && finalResultEl.textContent) {
                    // Apply Lithuanian writing enhancements
                    applyLithuanianEnhancements(finalResultEl);
                }
            }, 500);
        };
    }
}

/**
 * Apply Lithuanian enhancements to the text
 */
function applyLithuanianEnhancements(textElement) {
    if (!textElement || !textElement.textContent) return;
    
    let text = textElement.textContent;
    
    // Use more Lithuanian transitional phrases
    const transitions = {
        'However': 'Tačiau',
        'Furthermore': 'Be to',
        'For example': 'Pavyzdžiui',
        'Moreover': 'Be to',
        'Besides': 'Be to',
        'Another': 'Kitas',
        'Likewise': 'Taip pat',
        'Next': 'Toliau',
        'In fact': 'Iš tiesų',
        'As a result': 'Dėl to'
    };
    
    // Replace English transitions with Lithuanian ones
    Object.keys(transitions).forEach(eng => {
        const regex = new RegExp(`\\b${eng}\\b`, 'gi');
        text = text.replace(regex, transitions[eng]);
    });
    
    // Keep paragraphs short (professional writing tip)
    text = ensureShortParagraphs(text);
    
    // Update the text
    textElement.textContent = text;
    
    // Add note about Lithuanian optimization
    const enhancementNote = document.createElement('div');
    enhancementNote.className = 'enhancement-note';
    enhancementNote.innerHTML = '<small><em>Šis tekstas buvo optimizuotas pagal geriausias lietuviškos komunikacijos praktikas.</em></small>';
    enhancementNote.style.marginTop = '15px';
    enhancementNote.style.color = 'var(--text-light)';
    enhancementNote.style.fontStyle = 'italic';
    enhancementNote.style.fontSize = '12px';
    
    if (!textElement.parentNode.querySelector('.enhancement-note')) {
        textElement.parentNode.appendChild(enhancementNote);
    }
}

/**
 * Ensure paragraphs are not too long (following professional writing tips)
 */
function ensureShortParagraphs(text) {
    const paragraphs = text.split('\n\n');
    const maxSentencesPerParagraph = 3;
    
    const processedParagraphs = paragraphs.map(paragraph => {
        // Skip short paragraphs and headings
        if (paragraph.length < 100 || paragraph.startsWith('#')) return paragraph;
        
        const sentences = paragraph.split(/(?<=[.!?])\s+/);
        if (sentences.length <= maxSentencesPerParagraph) return paragraph;
        
        // Split into multiple paragraphs with max 3 sentences each
        const newParagraphs = [];
        for (let i = 0; i < sentences.length; i += maxSentencesPerParagraph) {
            const chunk = sentences.slice(i, i + maxSentencesPerParagraph).join(' ');
            if (chunk.trim()) newParagraphs.push(chunk);
        }
        
        return newParagraphs.join('\n\n');
    });
    
    return processedParagraphs.join('\n\n');
}

/**
 * Set up Lithuanian office conversations
 */
function setupLithuanianConversations() {
    // Lithuanian office phrases for chat system
    const lithuanianPhrases = [
        {
            speaker: 'Jonas',
            message: 'Ar kas nors matė mano kavos puodelį? Negaliu gerai rašyti be kavos!',
            type: 'casual'
        },
        {
            speaker: 'Gabija',
            message: 'Ar žinote, kad Lietuvoje yra 2800 ežerų? Ką tik perskaičiau!',
            type: 'fact'
        },
        {
            speaker: 'Vytautas',
            message: 'Šiame tekste yra devynios klaidos. Manau, tai naujas rekordas...',
            type: 'critical'
        },
        {
            speaker: 'Eglė',
            message: 'Kableliai nėra dekoracija, Jonas! Jie turi savo vietą sakinyje!',
            type: 'correction'
        },
        {
            speaker: 'Jonas',
            message: 'Neįsivaizduoju, kaip pradėti šį tekstą. Gal kas nors turi idėjų?',
            type: 'casual'
        },
        {
            speaker: 'Gabija',
            message: 'Naujausios statistikos duomenimis, šis tekstas pasieks 78% skaitytojų!',
            type: 'fact'
        },
        {
            speaker: 'Vytautas',
            message: 'Kodėl reikia tiek daug žodžių pasakyti tokiai paprastai minčiai?',
            type: 'critical'
        }
    ];
    
    // Randomly add office conversations to chat
    if (typeof window.addMessageToChatLog === 'function') {
        // First random message after 10 seconds
        setTimeout(() => {
            const randomPhrase = lithuanianPhrases[Math.floor(Math.random() * lithuanianPhrases.length)];
            window.addMessageToChatLog(randomPhrase.speaker, randomPhrase.message, `worker ${getLithuanianWorkerRole(randomPhrase.speaker)}`);
        }, 10000);
        
        // Then every 30-60 seconds if page is still open
        setInterval(() => {
            if (Math.random() < 0.3) { // 30% chance each interval
                const randomPhrase = lithuanianPhrases[Math.floor(Math.random() * lithuanianPhrases.length)];
                window.addMessageToChatLog(randomPhrase.speaker, randomPhrase.message, `worker ${getLithuanianWorkerRole(randomPhrase.speaker)}`);
            }
        }, 30000 + Math.random() * 30000);
    }
}

/**
 * Get CSS class for worker based on name
 */
function getLithuanianWorkerRole(name) {
    switch(name) {
        case 'Jonas': return 'writer';
        case 'Gabija': return 'researcher';
        case 'Vytautas': return 'critic';
        case 'Eglė': return 'editor';
        default: return '';
    }
}

// Make the addMessageToChatLog function available if it doesn't exist yet
if (typeof window.addMessageToChatLog !== 'function' && typeof addMessageToChatLog === 'function') {
    window.addMessageToChatLog = addMessageToChatLog;
}

/**
 * Additional Lithuanian themed features and animations
 */
document.addEventListener('DOMContentLoaded', function() {
    // Lithuanian phrases for the boss
    const bossPhrases = [
        "Aš vadovauju šitam biurui!",
        "Turiu daug svarbių reikalų. Greitai atlikit darbą!",
        "Kodėl jūs dar neskaitot mano minčių?",
        "Kur mano kava? AI niekad nereikia kavos...",
        "Mano cepelinų receptas yra geriausias Lietuvoje!",
        "Kam reikia atostogų, kai gali dirbti man?",
        "Aš šitas problemas išspręsčiau greičiau..."
    ];
    
    // Random boss phrases in the bubble occasionally
    function showRandomBossPhrase() {
        const bossCard = document.querySelector('.role-card.boss');
        if (!bossCard) return;
        
        // Create bubble if it doesn't exist
        let bossBubble = bossCard.querySelector('.boss-bubble');
        if (!bossBubble) {
            bossBubble = document.createElement('div');
            bossBubble.className = 'boss-bubble';
            bossCard.appendChild(bossBubble);
            
            // Add CSS if needed
            addBossBubbleStyles();
        }
        
        // Show random phrase
        const randomPhrase = bossPhrases[Math.floor(Math.random() * bossPhrases.length)];
        bossBubble.textContent = randomPhrase;
        bossBubble.classList.add('show');
        
        // Hide after some time
        setTimeout(() => {
            bossBubble.classList.remove('show');
        }, 5000);
    }
    
    // Add CSS for boss bubble
    function addBossBubbleStyles() {
        if (document.getElementById('boss-bubble-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'boss-bubble-styles';
        style.textContent = `
            .boss-bubble {
                position: absolute;
                top: -50px;
                left: 20px;
                background-color: white;
                padding: 8px 12px;
                border-radius: 15px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                font-size: 12px;
                opacity: 0;
                transform: translateY(10px);
                transition: opacity 0.3s, transform 0.3s;
                pointer-events: none;
                max-width: 200px;
                z-index: 10;
            }
            
            .boss-bubble::after {
                content: "";
                position: absolute;
                bottom: -10px;
                left: 20px;
                border-width: 10px 10px 0;
                border-style: solid;
                border-color: white transparent transparent;
            }
            
            .boss-bubble.show {
                opacity: 1;
                transform: translateY(0);
            }
            
            [data-theme="dark"] .boss-bubble {
                background-color: #2a2a2a;
                color: #e0e0e0;
            }
            
            [data-theme="dark"] .boss-bubble::after {
                border-color: #2a2a2a transparent transparent;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // Show boss phrases randomly every 1-5 minutes
    function scheduleBossPhrases() {
        const randomDelay = (Math.random() * 4 + 1) * 60 * 1000; // 1-5 minutes
        setTimeout(() => {
            showRandomBossPhrase();
            scheduleBossPhrases(); // Schedule next phrase
        }, randomDelay);
    }
    
    // Show cepelinai when work completes
    function showCepelinaiCelebration() {
        // Create 5 flying cepelinai
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const cepelinas = document.createElement('div');
                cepelinas.className = 'flying-cepelinas';
                cepelinas.innerHTML = '🥟';
                cepelinas.style.left = `${Math.random() * 90 + 5}%`;
                cepelinas.style.bottom = '0';
                document.body.appendChild(cepelinas);
                
                // Set animation
                cepelinas.style.animation = `fly-cepelinas ${Math.random() * 3 + 4}s ease-out forwards`;
                
                // Remove after animation
                setTimeout(() => {
                    cepelinas.remove();
                }, 7000);
            }, i * 800);
        }
    }
    
    // When boss finishes work, show cepelinai
    document.addEventListener('boss-completed-work', function() {
        showCepelinaiCelebration();
    });
    
    // Start the random boss phrases
    setTimeout(() => {
        scheduleBossPhrases();
    }, 10000); // Start after 10 seconds
    
    // Patch functions to include Lithuanian flair
    if (typeof window.updateStatus === 'function') {
        const originalUpdateStatus = window.updateStatus;
        window.updateStatus = function(message, type = '') {
            // Translate common English messages to Lithuanian
            switch (message) {
                case 'Starting collaboration...':
                    message = 'Pradedamas bendradarbiavimas...';
                    break;
                case 'Collaboration stopped':
                    message = 'Bendradarbiavimas sustabdytas';
                    break;
                case 'Collaboration completed':
                    message = 'Bendradarbiavimas baigtas! 🎉';
                    break;
                case 'Document downloaded':
                    message = 'Dokumentas atsisiųstas sėkmingai';
                    break;
                case 'Final result copied to clipboard':
                    message = 'Galutinis rezultatas nukopijuotas į iškarpinę';
                    break;
            }
            
            // Call original function with translated message
            return originalUpdateStatus(message, type);
        };
    }
    
    // Handle boss approval event
    document.addEventListener('DOMContentLoaded', function() {
        // Create a custom event we'll dispatch when boss approves
        const bossApprovalEvent = new CustomEvent('boss-completed-work');
        
        // Patch the StampEffects.showBossApproval to fire event
        if (window.StampEffects && window.StampEffects.showBossApproval) {
            const originalShowBossApproval = window.StampEffects.showBossApproval;
            
            window.StampEffects.showBossApproval = function() {
                // Call original function
                originalShowBossApproval.apply(this, arguments);
                
                // Fire our event
                setTimeout(() => {
                    document.dispatchEvent(bossApprovalEvent);
                    
                    // Add completion message
                    if (typeof window.addMessageToChatLog === 'function') {
                        window.addMessageToChatLog('System', 'Šefas patvirtino rezultatą. Cepelinai visiems! 🥟', 'system celebration');
                    }
                }, 1000);
            };
        }
    });
});

/**
 * Setup boss phrases
 */
function setupBossPhrases() {
    const bossElement = document.querySelector('.boss-speech');
    
    // Check if BossPhrases is available and use it properly
    if (window.BossPhrases && bossElement) {
        window.BossPhrases.scheduleBossPhrases(bossElement, 15000, false);
    }
}

// Setup boss phrases
function setupBossPhrases() {
    const bossElement = document.querySelector('.boss-speech');
    
    // Check if BossPhrases is available and use it properly
    if (window.BossPhrases && bossElement) {
        window.BossPhrases.scheduleBossPhrases(bossElement, 15000, false);
    }
}

// Remove DeepSeek models from model selects - improved version
function removeDeepSeekModels() {
    console.log('Removing DeepSeek models from select elements');
    const modelSelects = document.querySelectorAll('.model-select');
    
    modelSelects.forEach(select => {
        // Convert to array to avoid live collection issues during removal
        Array.from(select.options).forEach(option => {
            // Check if the option value or text contains "deepseek" (case insensitive)
            if (option.value.toLowerCase().includes('deepseek') || 
                option.textContent.toLowerCase().includes('deepseek')) {
                console.log('Removing DeepSeek model:', option.value);
                select.removeChild(option);
            }
        });
    });
}

// Lithuanian language enhancements for the UI

document.addEventListener('DOMContentLoaded', () => {
    // Lithuanian worker greetings
    const lithuanianGreetings = {
        'Jonas': ['Labas rytas!', 'Sveiki!', 'Ką rašome šiandien?', 'Esu pasiruošęs kurti!'],
        'Gabija': ['Faktai yra svarbiausi!', 'Tirsiu šią temą išsamiai', 'Ieškau patikimų šaltinių'],
        'Vytautas': ['Perskaitysiu kritiškai', 'Konstruktyvi kritika - raktas į tobulėjimą', 'Įvertinsiu objektyviai'],
        'Eglė': ['Kalbos taisyklingumas - svarbiausia!', 'Ištaisysiu visas klaidas', 'Tobulinsiu tekstą'],
        'Tauris': ['Vadovauju procesui', 'Priimsiu galutinius sprendimus', 'Biuras dirba efektyviai']
    };

    // Function to translate English worker names to Lithuanian
    function translateWorkerNames() {
        // Check for untranslated worker names in all status messages
        document.querySelectorAll('.message-header, .notice-content, .worker-working').forEach(element => {
            const text = element.textContent;
            
            // Replace English role names with Lithuanian
            if (text.includes('Writer')) element.textContent = text.replace('Writer', 'Jonas');
            if (text.includes('Researcher')) element.textContent = text.replace('Researcher', 'Gabija');
            if (text.includes('Critic')) element.textContent = text.replace('Critic', 'Vytautas');
            if (text.includes('Editor')) element.textContent = text.replace('Editor', 'Eglė');
            if (text.includes('Boss')) element.textContent = text.replace('Boss', 'Tauris');
            
            // Also check for status messages that might use these names
            if (text.includes(' writer ')) element.textContent = text.replace(' writer ', ' Jonas ');
            if (text.includes(' researcher ')) element.textContent = text.replace(' researcher ', ' Gabija ');
            if (text.includes(' critic ')) element.textContent = text.replace(' critic ', ' Vytautas ');
            if (text.includes(' editor ')) element.textContent = text.replace(' editor ', ' Eglė ');
            if (text.includes(' boss ')) element.textContent = text.replace(' boss ', ' Tauris ');
        });
    }

    // Show random worker mood changes
    function updateRandomWorkerMood() {
        // Get all worker mood elements
        const workerMoods = document.querySelectorAll('.worker-mood');
        
        // Pick a random mood element
        const randomMoodEl = workerMoods[Math.floor(Math.random() * workerMoods.length)];
        
        if (randomMoodEl) {
            // Get worker type from parent card
            const workerCard = randomMoodEl.closest('.role-card');
            if (!workerCard) return;
            
            // List of possible Lithuanian moods with emojis
            const moods = [
                'Puiki 😊', 'Įkvėpta 🚀', 'Susikaupusi 🧠', 'Kūrybiška ✨', 'Pavargusi 😴', 
                'Entuziastinga 🔥', 'Pedantiška ✓', 'Smalsus 🔍', 'Filosofiška 🤔', 'Kritiška 🧐'
            ];
            
            // Pick a random mood
            const randomMood = moods[Math.floor(Math.random() * moods.length)];
            
            // Update the mood text
            randomMoodEl.textContent = `Nuotaika: ${randomMood}`;
            
            // Add mood change animation
            randomMoodEl.classList.add('mood-change');
            setTimeout(() => {
                randomMoodEl.classList.remove('mood-change');
            }, 1000);
        }
        
        // Schedule next mood update
        setTimeout(updateRandomWorkerMood, 60000 + Math.random() * 120000); // Random time between 1-3 minutes
    }

    // Add Lithuanian holidays to the office notice
    function addLithuanianHoliday() {
        const holidays = [
            { date: '02-16', name: 'Lietuvos valstybės atkūrimo diena' },
            { date: '03-11', name: 'Lietuvos nepriklausomybės atkūrimo diena' },
            { date: '07-06', name: 'Karaliaus Mindaugo karūnavimo diena' },
            { date: '01-01', name: 'Naujieji metai' },
            { date: '05-01', name: 'Tarptautinė darbo diena' },
            { date: '08-15', name: 'Žolinė' },
            { date: '11-01', name: 'Visų Šventųjų diena' },
            { date: '12-24', name: 'Kūčios' },
            { date: '12-25', name: 'Kalėdos' }
        ];
        
        // Get today's date in MM-DD format
        const today = new Date();
        const todayFormatted = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        
        // Check if today is a holiday
        const holiday = holidays.find(h => h.date === todayFormatted);
        
        if (holiday) {
            const statusMessage = document.getElementById('statusMessage');
            if (statusMessage) {
                statusMessage.innerHTML = `<span style="color: #ffda00;">🎉 Šiandien ${holiday.name}! 🎉</span>`;
            }
        }
    }

    // Run our Lithuanian enhancements
    translateWorkerNames();
    updateRandomWorkerMood();
    addLithuanianHoliday();
    
    // Setup a periodic check for untranslated names (runs every 5 seconds)
    setInterval(translateWorkerNames, 5000);
});
