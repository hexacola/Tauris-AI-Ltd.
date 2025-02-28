/**
 * Animations and visual effects for the AI Workers application
 */
class ErrorAnimations {
    // Collection of funny error scenarios
    static errorScenarios = [
        // Lithuanian-specific scenarios (favored)
        {
            type: "cepelinai",
            title: "Cepelinų pertrauka!",
            message: "Dirbtinis intelektas užimtas cepelinų pietumis. Bandysime vėliau!",
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
            message: "Algoritmas užstrigo Baltijos gintare, kaip priešistorinis vabzdys.",
            cssClass: "error-amber",
            emoji: "⚱️🧩"
        },
        {
            type: "folklore",
            title: "Užkeikė Ragana!",
            message: "Serverį užkeikė lietuvių liaudies pasakų ragana. Burtai netrukus išsisklaidys.",
            cssClass: "error-folklore",
            emoji: "🧙‍♀️🌿"
        },
        {
            type: "stork",
            title: "Gandras ant stogo!",
            message: "Gandras nutūpė ant serverių pastato stogo. Tai geras ženklas, bet reikia palaukti.",
            cssClass: "error-stork",
            emoji: "🦢🏠"
        },
        // Standard errors in Lithuanian
        {
            type: "coffee",
            title: "Kava išsiliejo!",
            message: "Oi! Kažkas išpylė kavą ant serverio. Valome skudurais...",
            cssClass: "error-coffee",
            emoji: "☕️💻💦"
        },
        {
            type: "vacation",
            title: "AI atostogauja",
            message: "Šis modelis dabar mėgaujasi kokteiliais paplūdimyje. Pabandykite kitą!",
            cssClass: "error-vacation",
            emoji: "🏝️🍹🤖"
        },
        {
            type: "training",
            title: "Mokymosi diena",
            message: "Mūsų AI dabar sportuoja skaitmeninėje salėje. Greitai grįš protingesnis!",
            cssClass: "error-training",
            emoji: "🏋️‍♂️🧠"
        },
        {
            type: "cosmic",
            title: "Kosminis trikdis",
            message: "Kosminis spindulys ką tik pakeitė bitą mūsų serveryje. Tokia jau ta visata!",
            cssClass: "error-cosmic",
            emoji: "☄️🛰️"
        },
        {
            type: "paperJam",
            title: "Popierius užstrigo",
            message: "AI užstrigo cikle. Perkrauname jo skaitmeninį protą...",
            cssClass: "error-paper-jam",
            emoji: "📃⚙️"
        },
        {
            type: "catOnKeyboard",
            title: "Katinas ant klaviatūros",
            message: "Katinas perėjo per duomenų centro klaviatūrą. Klasikinis katino triukas!",
            cssClass: "error-cat",
            emoji: "🐱⌨️"
        },
        {
            type: "timeTravel",
            title: "Laiko kelionės klaida",
            message: "AI bandė nuspėti per toli į ateitį ir pasiklydo laike.",
            cssClass: "error-time",
            emoji: "⏱️🌀"
        },
        {
            type: "powerSurge",
            title: "Įtampos šuolis!",
            message: "Kažkas prijungė plaukų džiovintuvą prie serverio lizdo. Lemputės sumirksėjo.",
            cssClass: "error-power",
            emoji: "⚡💇‍♀️"
        },
        {
            type: "coldWinter",
            title: "Šalta žiema",
            message: "Mūsų serveriai šąla Lietuvos žiemoje. Šildome juos...",
            cssClass: "error-cold-winter",
            emoji: "❄️🧥"
        },
        {
            type: "midsummer",
            title: "Joninių šventė",
            message: "Mūsų AI švenčia Jonines. Grįš po laužo šokių!",
            cssClass: "error-midsummer",
            emoji: "🔥🌿"
        }
    ];

    /**
     * Shows an error animation on the worker card
     * @param {string} workerKey - The worker identifier (writer, researcher, critic, editor, boss)
     * @param {Error} error - The error that occurred
     * @param {string} model - The model that failed
     */
    static showErrorAnimation(workerKey, error, model) {
        const workerCard = document.querySelector(`.role-card.${workerKey}`);
        if (!workerCard) return;
        
        // Add error class for styling
        workerCard.classList.add('error');
        
        // Create error message
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.textContent = this.getErrorMessage(error);
        
        // Add model info
        const modelInfo = document.createElement('small');
        modelInfo.textContent = `Model: ${model}`;
        errorMsg.appendChild(modelInfo);
        
        // Remove any existing error messages
        const existingError = workerCard.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add the new error message
        workerCard.appendChild(errorMsg);
        
        // Shake animation
        workerCard.classList.add('shake');
        
        // Remove animations after they complete
        setTimeout(() => {
            workerCard.classList.remove('shake');
            
            // Keep the error state a bit longer before removing
            setTimeout(() => {
                workerCard.classList.remove('error');
                errorMsg.remove();
            }, 3000);
        }, 820); // Shake animation duration is 800ms
    }
    
    /**
     * Shows a "thinking too hard" animation
     * @param {string} workerKey - The worker identifier
     */
    static showThinkingTooHardAnimation(workerKey) {
        const workerCard = document.querySelector(`.role-card.${workerKey}`);
        if (!workerCard) return;
        
        // Add thinking class for animation
        workerCard.classList.add('thinking-hard');
        
        // Make sure we have the CSS for the animation
        this.ensureAnimationStylesExist();
        
        // Add thinking animation element
        if (!workerCard.querySelector('.thinking-too-hard-animation')) {
            const thinkingElement = document.createElement('div');
            thinkingElement.className = 'thinking-too-hard-animation';
            thinkingElement.innerHTML = `
                <div class="thinking-emoji">🤔</div>
                <div class="thinking-smoke"></div>
            `;
            workerCard.appendChild(thinkingElement);
        }
    }
    
    /**
     * Stop the thinking animation
     * @param {string} workerKey - The worker identifier
     */
    static stopThinkingAnimation(workerKey) {
        const workerCard = document.querySelector(`.role-card.${workerKey}`);
        if (!workerCard) return;
        
        // Remove thinking class
        workerCard.classList.remove('thinking-hard');
        
        // Remove thinking animation element
        const thinkingElement = workerCard.querySelector('.thinking-too-hard-animation');
        if (thinkingElement) {
            thinkingElement.remove();
        }
    }

    /**
     * Show working animation for boss
     * @param {string} workerKey - Should be 'boss'
     */
    static showWorkingAnimation(workerKey) {
        if (workerKey !== 'boss') return;

        const bossCard = document.querySelector('.role-card.boss');
        if (!bossCard) return;

        // Create boss animation if doesn't exist
        if (!bossCard.querySelector('.boss-working-animation')) {
            // Add special boss animation
            const bossAnimation = document.createElement('div');
            bossAnimation.className = 'boss-working-animation';
            bossAnimation.innerHTML = `
                <div class="boss-papers">📄</div>
                <div class="boss-stamp">✓</div>
                <div class="boss-working-text">Jūsų šefas dirba...</div>
            `;
            bossCard.appendChild(bossAnimation);

            // Add class to card
            bossCard.classList.add('boss-working');

            // Make sure the styles exist
            this.ensureBossAnimationStylesExist();
        }
    }

    /**
     * Stop working animation for boss
     * @param {string} workerKey - Should be 'boss'
     */
    static stopWorkingAnimation(workerKey) {
        if (workerKey !== 'boss') return;

        const bossCard = document.querySelector('.role-card.boss');
        if (!bossCard) return;

        // Remove boss animation
        const bossAnimation = bossCard.querySelector('.boss-working-animation');
        if (bossAnimation) {
            bossAnimation.remove();
        }

        // Remove class from card
        bossCard.classList.remove('boss-working');
    }
    
    /**
     * Returns a user-friendly error message
     * @param {Error} error - The error object
     * @returns {string} - User-friendly error message
     */
    static getErrorMessage(error) {
        const message = error.message || 'Unknown error';
        
        // Different messages based on error type
        if (message.includes('timeout') || message.includes('abort')) {
            return 'Took too long to respond!';
        } else if (message.includes('500')) {
            return 'Server error! Model may be overloaded.';
        } else if (message.includes('network') || message.includes('fetch')) {
            return 'Network error! Check connection.';
        } else if (message.includes('unavailable')) {
            return 'Model is currently unavailable!';
        } else {
            // Return a shortened version of the message
            return message.length > 50 ? message.substring(0, 47) + '...' : message;
        }
    }
    
    /**
     * Make sure animation styles exist in the document
     */
    static ensureAnimationStylesExist() {
        if (document.getElementById('animation-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'animation-styles';
        style.innerHTML = `
            @keyframes shake {
                0% { transform: translateX(0); }
                10% { transform: translateX(-5px) rotate(-2deg); }
                20% { transform: translateX(5px) rotate(2deg); }
                30% { transform: translateX(-5px) rotate(-2deg); }
                40% { transform: translateX(5px) rotate(2deg); }
                50% { transform: translateX(-5px) rotate(-2deg); }
                60% { transform: translateX(5px) rotate(2deg); }
                70% { transform: translateX(-5px) rotate(-2deg); }
                80% { transform: translateX(5px) rotate(2deg); }
                90% { transform: translateX(-5px) rotate(-2deg); }
                100% { transform: translateX(0); }
            }
            
            .shake {
                animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both;
                transform-origin: center;
            }
            
            .role-card.error {
                background-color: rgba(255, 0, 0, 0.1);
                border-color: rgb(200, 0, 0);
            }
            
            .role-card .error-message {
                color: #d32f2f;
                padding: 5px;
                margin-top: 10px;
                font-size: 13px;
                text-align: center;
                background-color: rgba(211, 47, 47, 0.1);
                border-radius: 3px;
            }
            
            .role-card .error-message small {
                display: block;
                font-size: 11px;
                opacity: 0.8;
                margin-top: 3px;
            }
            
            @keyframes thinking-pulse {
                0% { transform: scale(1); box-shadow: 0 0 0 rgba(66, 133, 244, 0); }
                50% { transform: scale(1.03); box-shadow: 0 0 8px rgba(66, 133, 244, 0.5); }
                100% { transform: scale(1); box-shadow: 0 0 0 rgba(66, 133, 244, 0); }
            }
            
            .role-card.thinking-hard {
                animation: thinking-pulse 1.5s ease-in-out infinite;
            }

            .thinking-too-hard-animation {
                position: absolute;
                top: 0;
                right: 0;
                z-index: 5;
                animation: thinking-bob 2s infinite ease-in-out;
            }

            .thinking-emoji {
                font-size: 1.5rem;
                padding: 5px;
            }

            .thinking-smoke {
                position: absolute;
                top: -10px;
                right: 10px;
                width: 8px;
                height: 10px;
                background-color: rgba(200, 200, 200, 0.7);
                border-radius: 10px;
                animation: smoke-rise 3s infinite;
            }

            @keyframes thinking-bob {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
            }

            @keyframes smoke-rise {
                0% { transform: scale(1) translateY(0); opacity: 0.7; }
                100% { transform: scale(2) translateY(-20px); opacity: 0; }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Add boss-specific animation styles
     */
    static ensureBossAnimationStylesExist() {
        if (document.getElementById('boss-animation-styles')) return;

        const style = document.createElement('style');
        style.id = 'boss-animation-styles';
        style.innerHTML = `
            .role-card.boss.boss-working {
                overflow: hidden;
                position: relative;
            }

            .boss-working-animation {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.95));
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 10;
            }

            [data-theme="dark"] .boss-working-animation {
                background: linear-gradient(rgba(42,42,42,0.9), rgba(42,42,42,0.95));
            }

            .boss-papers {
                font-size: 36px;
                margin-bottom: 15px;
                animation: boss-paper-shuffle 2s infinite;
            }

            @keyframes boss-paper-shuffle {
                0%, 100% { transform: translateX(-8px) rotate(-5deg); }
                50% { transform: translateX(8px) rotate(5deg); }
            }

            .boss-stamp {
                font-size: 24px;
                margin-bottom: 15px;
                padding: 5px 10px;
                background-color: #9E9E9E;
                color: white;
                border-radius: 50%;
                animation: boss-stamp-work 1.5s infinite;
            }

            @keyframes boss-stamp-work {
                0%, 100% { transform: translateY(0px); opacity: 1; }
                50% { transform: translateY(-15px); opacity: 0.7; }
            }

            .boss-working-text {
                font-size: 14px;
                font-weight: bold;
                color: #9E9E9E;
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Get a random error scenario from the collection
     * @param {Array} types - Optional filter for specific scenario types
     * @returns {Object} - The selected scenario
     */
    static getRandomScenario(types = null) {
        let filteredScenarios = this.errorScenarios;
        
        if (types && Array.isArray(types) && types.length > 0) {
            filteredScenarios = this.errorScenarios.filter(s => types.includes(s.type));
        }
        
        const randomIndex = Math.floor(Math.random() * filteredScenarios.length);
        return filteredScenarios[randomIndex];
    }
    
    /**
     * Get Lithuanian worker name from role key
     */
    static getWorkerLithuanianName(roleKey) {
        switch(roleKey) {
            case 'writer': return 'Rašytojui Jonui';
            case 'researcher': return 'Tyrėjai Gabijai';
            case 'critic': return 'Kritikui Vytautui';
            case 'editor': return 'Redaktorei Eglei';
            default: return roleKey;
        }
    }
}

// Make available globally
window.ErrorAnimations = ErrorAnimations;
