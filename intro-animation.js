/**
 * Humorous introduction animation with Boss Tauris
 * Fixed encoding issues and expanded explanation for newcomers
 */
class TaurisIntro {
    constructor() {
        // Force show intro by default
        this.hasSeenIntro = localStorage.getItem('taurisIntroSeen') === 'true';
        this.introElement = null;
        this.currentStep = 0;
        
        // Updated intro steps with better UTF-8 encoding and more detailed explanations
        this.introSteps = [
            {
                text: "Labas! Aš esu Tauris, šito biuro šefas! 👋",
                emotion: "happy"
            },
            {
                text: "Sveiki atvykę į mano virtualų AI biurą! Čia mes dirbame už cepelinų pietus ir alaus bokalą. 🥟🍺",
                emotion: "proud"
            },
            {
                text: "Mes sukursime jums puikius lietuviškus tekstus naudodami keturis dirbtinio intelekto modelius, kurie veikia kaip mano darbuotojai.",
                emotion: "explaining"
            },
            {
                text: "Štai kaip veikia mūsų sistema: jūs įvedate užduotį, o mūsų keturi AI darbuotojai paeiliui ją tobulina. Paprasta ir efektyvu!",
                emotion: "excited"
            },
            {
                text: "Pas mane dirba keturi profesionalai. Kaip tikrame lietuviškame biure! 🇱🇹",
                emotion: "explaining"
            },
            {
                text: "Jonas - mūsų rašytojas. Kūrybiškas, bet kartais per daug išgėręs kavos... ☕ Jis sukuria pradinį tekstą.",
                emotion: "wink"
            },
            {
                text: "Gabija - tyrėja su interneto prieiga. Ji gali patikrinti faktus geriau nei tavo uošvė Facebooke! 🔍 Ji papildo tekstą faktais ir šaltiniais.",
                emotion: "smart"
            },
            {
                text: "Vytautas - kritikas. Jis gali sukritikuoti bet ką - net ir mamos keptus cepelinus! 🧐 Jis konstruktyviai tobulina teksto struktūrą.",
                emotion: "serious"
            },
            {
                text: "Eglė - redaktorė. Ji taiso klaidas greičiau, nei Vilniuje keičiasi oro temperatūra! ✏️ Ji užtikrina teksto kalbos kokybę.",
                emotion: "proud"
            },
            {
                text: "O aš? Aš tiesiog prižiūriu, kad visi dirbtų, ir pasiimu visus kreditus! Kaip tikras šefas! 😎",
                emotion: "laughing"
            },
            {
                text: "NAUDOJIMOSI INSTRUKCIJA: Įrašyk užduotį (pvz., 'Parašyk straipsnį apie Lietuvos istoriją') langelyje ir paspausk 'Pradėti darbą'.",
                emotion: "explaining"
            },
            {
                text: "Matai šį 'Iteracijų skaičius' nustatymą? Tai reiškia kiek ciklų atliks mano komanda. Daugiau iteracijų = geresnis rezultatas, bet ilgiau užtruks.",
                emotion: "explaining"
            },
            {
                text: "'Pertraukos' nustatymas kontroliuoja, kiek milisekundžių darbuotojai lauks tarp atsakymų - ilgesnės pertraukos = mažiau apkrovos serveriui.",
                emotion: "smart"
            },
            {
                text: "Kiekvienas darbuotojas turi 'Smegenų' pasirinkimą - skirtingi AI modeliai su skirtingomis galimybėmis. Žiūrėkite simbolius: 🧠 = loginis mąstymas, 👁️ = vaizdų analizė, 🌐 = interneto prieiga.",
                emotion: "proud"
            },
            {
                text: "Jei modelis nustoja veikti, sistema automatiškai pabandys kitą modelį. Nebijokit eksperimentuoti - visada turiu atsarginį planą!",
                emotion: "wink"
            },
            {
                text: "Procesą matysit realiuoju laiku 'Biuro pokalbiai' skiltyje, o galutinis tekstas atsiras apačioje su antspaudu.",
                emotion: "explaining"
            },
            {
                text: "Beje, jei vyks krepšinio rungtynės, darbas gali užtrukti. Mano darbuotojai labai mėgsta krepšinį! 🏀",
                emotion: "wink"
            },
            {
                text: "Taigi, laikas pradėti! Duokite mano AI darbuotojams darbo! Pirmyn! 🚀",
                emotion: "excited"
            }
        ];
        
        // Define SVG emotion templates (unchanged)
        this.svgEmotions = {
            happy: {
                eyes: '<circle fill="#eee" cx="40" cy="35" r="3"/><circle fill="#eee" cx="60" cy="35" r="3"/>',
                mouth: '<path fill="none" stroke="#eee" stroke-width="2" d="M40,45c0,0,10,10,20,0"/>'
            },
            proud: {
                eyes: '<circle fill="#eee" cx="40" cy="35" r="3"/><circle fill="#eee" cx="60" cy="35" r="3"/>',
                mouth: '<path fill="none" stroke="#eee" stroke-width="2" d="M40,45c0,0,10,5,20,0"/>'
            },
            excited: {
                eyes: '<circle fill="#eee" cx="40" cy="33" r="4"/><circle fill="#eee" cx="60" cy="33" r="4"/>',
                mouth: '<path fill="none" stroke="#eee" stroke-width="3" d="M40,45c0,0,10,12,20,0"/>'
            },
            explaining: {
                eyes: '<circle fill="#eee" cx="40" cy="35" r="3"/><circle fill="#eee" cx="60" cy="35" r="3"/>',
                eyebrows: '<path fill="none" stroke="#eee" stroke-width="2" d="M38,28 l4,2"/><path fill="none" stroke="#eee" stroke-width="2" d="M62,28 l-4,2"/>',
                mouth: '<path fill="none" stroke="#eee" stroke-width="2" d="M40,45c0,0,10,3,20,0"/>'
            },
            wink: {
                eyes: '<circle fill="#eee" cx="40" cy="35" r="3"/><path fill="none" stroke="#eee" stroke-width="2" d="M58,35 l4,0"/>',
                mouth: '<path fill="none" stroke="#eee" stroke-width="2" d="M40,45c0,0,10,8,20,0"/>'
            },
            smart: {
                eyes: '<circle fill="#eee" cx="40" cy="35" r="3"/><circle fill="#eee" cx="60" cy="35" r="3"/>',
                eyebrows: '<path fill="none" stroke="#eee" stroke-width="2" d="M35,30 l10,-2"/><path fill="none" stroke="#eee" stroke-width="2" d="M65,30 l-10,-2"/>',
                glasses: '<rect fill="none" stroke="#eee" stroke-width="1" x="35" y="32" width="10" height="8" rx="2" ry="2"/><rect fill="none" stroke="#eee" stroke-width="1" x="55" y="32" width="10" height="8" rx="2" ry="2"/><path fill="none" stroke="#eee" stroke-width="1" d="M45,36 l10,0"/>',
                mouth: '<path fill="none" stroke="#eee" stroke-width="2" d="M40,47c0,0,10,0,20,0"/>'
            },
            serious: {
                eyes: '<circle fill="#eee" cx="40" cy="35" r="3"/><circle fill="#eee" cx="60" cy="35" r="3"/>',
                eyebrows: '<path fill="none" stroke="#eee" stroke-width="2" d="M35,30 l10,0"/><path fill="none" stroke="#eee" stroke-width="2" d="M55,30 l10,0"/>',
                mouth: '<path fill="none" stroke="#eee" stroke-width="2" d="M40,48 l20,0"/>'
            },
            laughing: {
                eyes: '<path fill="none" stroke="#eee" stroke-width="2" d="M38,35 l4,0"/><path fill="none" stroke="#eee" stroke-width="2" d="M58,35 l4,0"/>',
                mouth: '<path fill="none" stroke="#eee" stroke-width="3" d="M40,45c0,0,10,15,20,0"/>'
            }
        };

        // Add an animation controller to cancel ongoing animations
        this.currentTypingTimeout = null;
        this.isButtonLocked = false;
    }

    /**
     * Initialize the introduction
     */
    init() {
        console.log("TaurisIntro init called. hasSeenIntro:", this.hasSeenIntro);
        // Only show intro if not already accepted
        if (!this.hasSeenIntro) {
            setTimeout(() => this.showIntro(), 1000);
        } else {
            console.log("Introduction already accepted. Skipping intro animation.");
        }
    }

    /**
     * Show the introduction overlay
     */
    showIntro() {
        // Create intro container with improved HTML structure for better encoding
        this.introElement = document.createElement('div');
        this.introElement.className = 'tauris-intro-container';
        
        // Set UTF-8 encoding explicitly
        this.setUtf8MetaTag();
        
        // Create structure with embedded SVG
        this.introElement.innerHTML = `
            <div class="tauris-intro-overlay"></div>
            <div class="tauris-intro-popup">
                <div class="tauris-avatar">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="tauris-face">
                        <circle fill="#333" cx="50" cy="40" r="25"/>
                        <circle fill="#555" cx="50" cy="30" r="18"/>
                        <path fill="#009930" d="M20,85c0-16.6,13.4-30,30-30s30,13.4,30,30H65c0-8.3-6.7-15-15-15s-15,6.7-15,15H20z"/>
                        <rect fill="#FFDA00" x="42" y="26" width="16" height="10" rx="2" ry="2"/>
                        <g id="facial-features">
                            <circle fill="#eee" cx="40" cy="35" r="3"/>
                            <circle fill="#eee" cx="60" cy="35" r="3"/>
                            <path fill="none" stroke="#eee" stroke-width="2" d="M40,45c0,0,10,8,20,0"/>
                        </g>
                    </svg>
                    <span class="tauris-tie">👇</span>
                </div>
                <div class="tauris-speech-bubble">
                    <p class="tauris-message"></p>
                </div>
                <div class="tauris-intro-buttons">
                    <button class="tauris-next-btn">Toliau</button>
                    <button class="tauris-skip-btn">Praleisti</button>
                </div>
                <div class="tauris-lithuania-flag"></div>
                <!-- Added step counter for users to see progress -->
                <div class="tauris-step-counter">1/${this.introSteps.length}</div>
            </div>
        `;
        
        // Add event listeners
        document.body.appendChild(this.introElement);
        this.introElement.querySelector('.tauris-next-btn').addEventListener('click', () => this.nextStep());
        this.introElement.querySelector('.tauris-skip-btn').addEventListener('click', () => this.closeIntro());
        
        // Add CSS with encoding fixes
        const style = document.createElement('style');
        style.textContent = this.getStyles();
        document.head.appendChild(style);
        
        // Start the first step with a short delay
        setTimeout(() => {
            this.introElement.classList.add('active');
            this.nextStep();
        }, 100);

        // Add floating Lithuanian elements
        this.addFloatingElements();
    }

    /**
     * Set UTF-8 meta tag to ensure proper encoding and add proper font-face
     */
    setUtf8MetaTag() {
        // Ensure UTF-8 charset
        if (!document.querySelector('meta[charset="UTF-8"]')) {
            const metaCharset = document.createElement('meta');
            metaCharset.setAttribute('charset', 'UTF-8');
            document.head.prepend(metaCharset);
        }
        
        // Add Lithuanian-friendly fonts if not already present
        if (!document.getElementById('lithuanian-fonts')) {
            const fontStyles = document.createElement('style');
            fontStyles.id = 'lithuanian-fonts';
            fontStyles.textContent = `
                @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
                @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&display=swap');
                
                /* Improved Lithuanian character support */
                .tauris-message {
                    font-family: 'Roboto', 'Noto Sans', 'Segoe UI', 'Arial Unicode MS', sans-serif !important;
                    font-variation-settings: 'wght' 400;
                    text-rendering: optimizeLegibility;
                    -webkit-font-smoothing: antialiased;
                }
            `;
            document.head.appendChild(fontStyles);
        }
    }

    /**
     * Move to the next introduction step with improved encoding handling
     */
    nextStep() {
        // Prevent button spamming
        if (this.isButtonLocked) return;
        this.isButtonLocked = true;
        
        // Cancel any ongoing typing animations
        if (this.currentTypingTimeout) {
            clearTimeout(this.currentTypingTimeout);
            this.currentTypingTimeout = null;
        }
        
        if (this.currentStep >= this.introSteps.length) {
            this.closeIntro();
            return;
        }
        
        const step = this.introSteps[this.currentStep];
        const messageElem = this.introElement.querySelector('.tauris-message');
        
        // Update step counter
        const stepCounter = this.introElement.querySelector('.tauris-step-counter');
        if (stepCounter) {
            stepCounter.textContent = `${this.currentStep + 1}/${this.introSteps.length}`;
        }
        
        // Update facial expression
        this.updateFacialExpression(step.emotion);
        
        // Clear previous text completely before starting new animation
        messageElem.innerHTML = '';
        
        // Add a small delay before typing to ensure animation is stable
        setTimeout(() => {
            this.typeMessageWithEncodingFix(step.text, messageElem);
            
            // Update button text on last step
            if (this.currentStep === this.introSteps.length - 1) {
                this.introElement.querySelector('.tauris-next-btn').textContent = 'Pradėti!';
            }
            
            this.currentStep++;
            
            // Unlock button after a short delay to prevent spam clicking
            setTimeout(() => {
                this.isButtonLocked = false;
            }, 300);
        }, 50);
    }

    /**
     * Improved typing animation with better encoding support and cancellation
     */
    typeMessageWithEncodingFix(message, element, index = 0, wordBuffer = "") {
        if (index < message.length) {
            const char = message.charAt(index);
            
            // If the character is neither a space nor a newline, add to buffer.
            if (char !== " " && char !== "\n") {
                wordBuffer += char;
            } else {
                // Append the buffered word as a single span with nowrap.
                if (wordBuffer.length > 0) {
                    const span = document.createElement('span');
                    span.className = 'tauris-word';
                    span.style.whiteSpace = 'nowrap';
                    span.textContent = wordBuffer;
                    element.appendChild(span);
                    wordBuffer = "";
                }
                // Append the whitespace character (preserving newlines if needed)
                element.appendChild(document.createTextNode(char));
            }
            
            const typingSpeed = this.isEmoji(char) ? 40 : 15;
            this.currentTypingTimeout = setTimeout(() => {
                this.typeMessageWithEncodingFix(message, element, index + 1, wordBuffer);
            }, typingSpeed);
        } else {
            // End of message: flush any remaining buffered word.
            if (wordBuffer.length > 0) {
                const span = document.createElement('span');
                span.className = 'tauris-word';
                span.style.whiteSpace = 'nowrap';
                span.textContent = wordBuffer;
                element.appendChild(span);
            }
            this.currentTypingTimeout = null;
        }
    }

    /**
     * Check if character is an emoji
     */
    isEmoji(char) {
        const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
        return emojiRegex.test(char);
    }

    /**
     * Enhanced check for Lithuanian special characters
     */
    isLithuanianSpecial(char) {
        // Include all possible Lithuanian special characters
        return /[ąčęėįšųūžĄČĘĖĮŠŲŪŽ]/u.test(char);
    }

    /**
     * Update the facial expression by modifying SVG
     */
    updateFacialExpression(emotion) {
        const facialFeatures = this.introElement.querySelector('#facial-features');
        if (!facialFeatures || !this.svgEmotions[emotion]) return;
        
        // Combine features into HTML
        let featuresHtml = '';
        const template = this.svgEmotions[emotion];
        if (template.eyebrows) featuresHtml += template.eyebrows;
        if (template.glasses) featuresHtml += template.glasses;
        if (template.eyes) featuresHtml += template.eyes;
        if (template.mouth) featuresHtml += template.mouth;
        
        // Update SVG
        facialFeatures.innerHTML = featuresHtml;
        
        // Add animation
        const faceElement = this.introElement.querySelector('.tauris-face');
        if (faceElement) {
            faceElement.classList.remove('animate-expression');
            void faceElement.offsetWidth; // Trigger reflow
            faceElement.classList.add('animate-expression');
        }
    }

    // Other methods remain largely unchanged
    addFloatingElements() {
        const elements = ['🥟', '🏀', '🍺', '🌳', '🇱🇹', '🧡', '💻', '⚙️', '📚'];
        const container = this.introElement.querySelector('.tauris-intro-overlay');
        
        for (let i = 0; i < 15; i++) {
            const floater = document.createElement('div');
            floater.className = 'tauris-floater';
            floater.textContent = elements[Math.floor(Math.random() * elements.length)];
            
            // Random position and animation
            floater.style.left = `${Math.random() * 100}%`;
            floater.style.top = `${Math.random() * 100}%`;
            floater.style.animationDuration = `${5 + Math.random() * 10}s`;
            floater.style.animationDelay = `${Math.random() * 5}s`;
            floater.style.setProperty('--move-x', `${Math.random() * 200 - 100}px`);
            floater.style.setProperty('--move-y', `${Math.random() * -300 - 100}px`);
            
            container.appendChild(floater);
        }
    }

    closeIntro() {
        // Cancel any ongoing animations
        if (this.currentTypingTimeout) {
            clearTimeout(this.currentTypingTimeout);
            this.currentTypingTimeout = null;
        }
        
        localStorage.setItem('taurisIntroSeen', 'true');
        this.introElement.classList.remove('active');
        this.introElement.classList.add('closing');
        setTimeout(() => {
            if (this.introElement.parentNode) {
                document.body.removeChild(this.introElement);
            }
        }, 1000);
    }

    static resetIntro() {
        localStorage.removeItem('taurisIntroSeen');
        console.log('Tauris introduction reset. Refresh the page to see it again.');
        window.location.reload();
    }

    /**
     * CSS styles with improved character support
     */
    getStyles() {
        return `
        @charset "UTF-8";
        
        /* Basic container styles */
        .tauris-intro-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.5s ease;
            font-family: 'Roboto', 'Noto Sans', 'Segoe UI', 'Arial Unicode MS', sans-serif;
            text-rendering: optimizeLegibility;
        }
        
        /* Active and closing states */
        .tauris-intro-container.active {
            opacity: 1;
            pointer-events: all;
        }
        
        .tauris-intro-container.closing {
            opacity: 0;
            pointer-events: none;
        }
        
        /* Style improvements */
        .tauris-intro-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            z-index: -1;
        }
        
        .tauris-intro-popup {
            background: linear-gradient(145deg, #ffffff, #f0f0f0);
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            padding: 30px;
            max-width: 700px; /* Increased width */
            width: 90%;
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            overflow: hidden;
        }
        
        /* Added step counter */
        .tauris-step-counter {
            position: absolute;
            bottom: 15px;
            right: 15px;
            font-size: 14px;
            color: #666;
            font-weight: bold;
            background: rgba(255, 218, 0, 0.2);
            padding: 2px 8px;
            border-radius: 10px;
        }
        
        /* Lithuanian flag */
        .tauris-lithuania-flag {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 10px;
            background: linear-gradient(to right, 
                #FFDA00 33%, 
                #009930 33%, 
                #009930 66%, 
                #C1272D 66%
            );
        }
        
        /* Avatar styling */
        .tauris-avatar {
            width: 120px;
            height: 120px;
            position: relative;
            margin-bottom: 20px;
        }
        
        .tauris-face {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            position: relative;
            overflow: hidden;
        }
        
        /* Animation for expression changes */
        .animate-expression {
            animation: expression-pop 0.3s ease-out;
        }
        
        @keyframes expression-pop {
            0% { transform: scale(0.95); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        /* Enhanced tie positioning */
        .tauris-tie {
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 24px;
            z-index: 3;
            text-align: center;
            width: 30px;
            height: 30px;
            line-height: 30px;
        }
        
        /* Speech bubble with encoding-safe styling */
        .tauris-speech-bubble {
            background-color: white;
            border-radius: 15px;
            padding: 20px; /* Increased padding */
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
            width: 100%;
            min-height: 120px; /* Increased height */
            position: relative;
        }
        
        .tauris-speech-bubble::before {
            content: '';
            position: absolute;
            top: -15px;
            left: 50%;
            transform: translateX(-50%);
            border-left: 15px solid transparent;
            border-right: 15px solid transparent;
            border-bottom: 15px solid white;
        }
        
        /* Better text styling for Lithuanian characters */
        .tauris-message {
            font-size: 18px;
            line-height: 1.6;
            margin: 0;
            min-height: 1.5em;
            unicode-bidi: embed;
            word-wrap: break-word;
            white-space: pre-wrap;
            letter-spacing: 0.01em; /* Slightly improve readability */
        }
        
        /* Special styling for Lithuanian characters and emojis */
        .tauris-special-char {
            display: inline-block;
            font-family: 'Roboto', 'Noto Sans', 'Segoe UI', 'Arial Unicode MS', sans-serif;
            font-weight: 500; /* Make special characters slightly bolder */
            vertical-align: middle;
            position: relative;
            margin: 0 0.01em;
        }
        
        /* Emoji-specific styling */
        .tauris-special-char:has(img.emoji) {
            display: inline-block;
            vertical-align: middle;
            height: 1.2em;
            margin: 0 0.05em;
        }
        
        /* Fix rendering on various browsers */
        @supports (-moz-appearance:none) {
            .tauris-special-char { 
                /* Firefox-specific fixes */
                font-family: 'Questrial', 'Arial Unicode MS', sans-serif;
            }
        }
        
        /* Button styling */
        .tauris-intro-buttons {
            display: flex;
            gap: 15px; /* Increased gap */
            margin-top: 10px;
        }
        
        .tauris-next-btn, .tauris-skip-btn {
            padding: 10px 25px; /* Wider buttons */
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            transition: all 0.2s ease;
            font-family: inherit;
        }
        
        .tauris-next-btn {
            background-color: #FFDA00;
            color: #333333;
        }
        
        .tauris-next-btn:hover {
            background-color: #FFB700;
            transform: translateY(-2px);
        }
        
        .tauris-skip-btn {
            background-color: #f0f0f0;
            color: #666666;
        }
        
        .tauris-skip-btn:hover {
            background-color: #e0e0e0;
            transform: translateY(-2px);
        }
        
        /* Floating elements with improved animation */
        .tauris-floater {
            position: absolute;
            font-size: 24px;
            opacity: 0.5;
            animation: tauris-float 15s linear infinite;
            --move-x: 100px;
            --move-y: -200px;
            font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
        }
        
        @keyframes tauris-float {
            0% {
                transform: translate(0, 0) rotate(0deg);
                opacity: 0;
            }
            10% {
                opacity: 0.7;
            }
            90% {
                opacity: 0.7;
            }
            100% {
                transform: translate(var(--move-x), var(--move-y)) rotate(360deg);
                opacity: 0;
            }
        }
        
        /* Dark theme adjustments */
        [data-theme="dark"] .tauris-intro-popup {
            background: linear-gradient(145deg, #2d2d2d, #1a1a1a);
            color: #e0e0e0;
        }
        
        [data-theme="dark"] .tauris-speech-bubble {
            background-color: #333333;
            color: #e0e0e0;
        }
        
        [data-theme="dark"] .tauris-speech-bubble::before {
            border-bottom-color: #333333;
        }
        
        [data-theme="dark"] .tauris-step-counter {
            color: #aaa;
            background: rgba(255, 218, 0, 0.15);
        }
        
        [data-theme="dark"] .tauris-skip-btn {
            background-color: #444444;
            color: #cccccc;
        }
        
        [data-theme="dark"] .tauris-skip-btn:hover {
            background-color: #555555;
        }
        
        /* Responsive design */
        @media (max-width: 600px) {
            .tauris-intro-popup {
                padding: 20px;
                max-width: 90%;
            }
            
            .tauris-avatar {
                width: 80px;
                height: 80px;
            }
            
            .tauris-message {
                font-size: 16px;
            }
            
            .tauris-next-btn, .tauris-skip-btn {
                padding: 8px 16px;
                font-size: 14px;
            }
        }
        `;
    }
}

// Initialize on page load with proper encoding setup
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded - Initializing TaurisIntro with improved Lithuanian character support");
    
    // Set proper document language and charset
    document.documentElement.setAttribute('lang', 'lt');
    
    // Force character encoding to UTF-8
    const metaCharset = document.createElement('meta');
    metaCharset.setAttribute('charset', 'UTF-8');
    document.head.prepend(metaCharset);
    
    // Initialize intro
    const taurisIntro = new TaurisIntro();
    taurisIntro.init();
    
    // Add to window for debugging
    window.taurisIntro = taurisIntro;
    window.resetTaurisIntro = TaurisIntro.resetIntro;
    
    // Add a visible button to restart intro
    const testButton = document.createElement('button');
    testButton.style.position = 'fixed';
    testButton.style.bottom = '10px';
    testButton.style.right = '10px';
    testButton.style.zIndex = '9999';
    testButton.style.padding = '5px 10px';
    testButton.style.backgroundColor = '#FFDA00';
    testButton.style.border = 'none';
    testButton.style.borderRadius = '5px';
    testButton.style.cursor = 'pointer';
    testButton.textContent = 'KAIP NAUDOTIS?';
    testButton.style.fontFamily = "'Roboto', 'Noto Sans', sans-serif";
    testButton.onclick = () => {
        TaurisIntro.resetIntro();
    };
    document.body.appendChild(testButton);
});
