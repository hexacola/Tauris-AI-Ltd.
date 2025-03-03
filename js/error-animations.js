/**
 * Animations and visual effects for the AI Workers application
 */
window.ErrorAnimations = (function() {
    // Lithuanian worker name mapping
    const lithuanianNames = {
        'writer': 'Jonas',
        'researcher': 'Gabija',
        'critic': 'Vytautas',
        'editor': 'Eglė',
        'boss': 'Tauris'
    };
    
    // Get Lithuanian name or use original if not found
    function getLithuanianName(roleName) {
        return lithuanianNames[roleName] || roleName;
    }

    // Show error animation for a worker
    function showErrorAnimation(workerKey, error, model) {
        const workerCard = document.querySelector(`.role-card.${workerKey}`);
        if (!workerCard) return;
        
        // Get Lithuanian name for the worker
        const lithuanianName = getLithuanianName(workerKey);
        
        // Add error class to the worker card
        workerCard.classList.add('error');
        
        // Create error message with Lithuanian name
        const errorMessageDiv = document.createElement('div');
        errorMessageDiv.className = 'worker-error';
        errorMessageDiv.textContent = `${lithuanianName} turi problemų! 😵`;
        
        // Create error detail with model info
        const errorDetailDiv = document.createElement('div');
        errorDetailDiv.className = 'error-detail';
        errorDetailDiv.textContent = `${model}: ${error.message}`;
        
        // Add error elements to worker card
        workerCard.appendChild(errorMessageDiv);
        workerCard.appendChild(errorDetailDiv);
        
        // Remove error animation after a few seconds
        setTimeout(() => {
            workerCard.classList.remove('error');
            if (errorMessageDiv.parentNode === workerCard) {
                workerCard.removeChild(errorMessageDiv);
            }
            if (errorDetailDiv.parentNode === workerCard) {
                workerCard.removeChild(errorDetailDiv);
            }
        }, 5000);
    }
    
    // Show working animation
    function showWorkingAnimation(workerKey) {
        const workerCard = document.querySelector(`.role-card.${workerKey}`);
        if (!workerCard) return;
        
        // Get Lithuanian name
        const lithuanianName = getLithuanianName(workerKey);
        
        // Add working class
        workerCard.classList.add('working');
        
        // Add working indicator
        const workingDiv = document.createElement('div');
        workingDiv.className = 'worker-working';
        workingDiv.innerHTML = `${lithuanianName} dirba... <span class="working-dots">...</span>`;
        
        // Add random Lithuanian phrases for more authenticity
        const lithuanianPhrases = [
            'Mąsto...',
            'Kala tekstą...',
            'Tiria šaltinius...',
            'Ieško įkvėpimo...',
            'Geria kavą...',
            'Analizuoja...',
            'Rašo...',
            'Tobulina...'
        ];
        
        // Set a random phrase based on worker type
        const randomPhrase = lithuanianPhrases[Math.floor(Math.random() * lithuanianPhrases.length)];
        workingDiv.innerHTML = `${lithuanianName} ${randomPhrase} <span class="working-dots">...</span>`;
        
        // Check for existing working indicator and replace if found
        const existingWorkingDiv = workerCard.querySelector('.worker-working');
        if (existingWorkingDiv) {
            workerCard.removeChild(existingWorkingDiv);
        }
        
        workerCard.appendChild(workingDiv);
    }
    
    // Stop working animation
    function stopWorkingAnimation(workerKey) {
        const workerCard = document.querySelector(`.role-card.${workerKey}`);
        if (!workerCard) return;
        
        workerCard.classList.remove('working');
        
        const workingDiv = workerCard.querySelector('.worker-working');
        if (workingDiv) {
            workerCard.removeChild(workingDiv);
        }
    }
    
    return {
        showErrorAnimation,
        showWorkingAnimation,
        stopWorkingAnimation,
        getLithuanianName
    };
})();
