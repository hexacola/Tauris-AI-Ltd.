/**
 * Document feedback and revision system
 * Allows boss to provide feedback on the final document and trigger revisions
 */
class FeedbackSystem {
    constructor() {
        this.isRevisionMode = false;
        this.revisionCount = 0;
        this.maxRevisions = 10;
        this.feedbackHistory = [];
        this.currentWorkerId = null;
        this.revisionInProgress = false;
        this.workerOrder = ['writer', 'researcher', 'critic', 'editor', 'boss'];
        this.currentWorkerIndex = 0;
        this.originalFinalText = '';
        
        // Common correction types for quick selection
        this.correctionTypes = [
            { id: 'broader', text: 'Padaryk tekstą platesnį', description: 'Papildyk tekstą daugiau detalių, pavyzdžių ir paaiškinimų' },
            { id: 'beginning', text: 'Pakeisk pradžią', description: 'Perrašyk įvadą, kad jis būtų įdomesnis ir labiau patrauktų dėmesį' },
            { id: 'ending', text: 'Pakeisk pabaigą', description: 'Suformuluok stipresnę išvadą, kuri apibendrintų pagrindinius punktus' },
            { id: 'facts', text: 'Daugiau faktų', description: 'Pridėk daugiau statistikos, tyrimų rezultatų ir patikimų duomenų' },
            { id: 'structure', text: 'Pagerink struktūrą', description: 'Pakeisk teksto organizavimą, kad jis būtų nuoseklesnis ir logiškesnis' },
            { id: 'language', text: 'Patobulinti kalbą', description: 'Pagerink sakinio struktūrą, žodyną ir stilių' },
            { id: 'tone', text: 'Pakeisti toną', description: 'Pritaikyti rašymo stilių kitai auditorijai (formalesnį/neformalesnį)' }
        ];
        
        // Define worker recommendation mappings
        this.workerRecommendations = {
            'broader': 'writer',
            'beginning': 'writer',
            'ending': 'writer',
            'facts': 'researcher',
            'structure': 'critic',
            'language': 'editor',
            'tone': 'editor'
        };
    }

    /**
     * Initialize the feedback system
     */
    init() {
        this.createFeedbackUI();
        this.attachEventListeners();
        console.log("Feedback system initialized");
    }

    /**
     * Create feedback UI elements
     */
    createFeedbackUI() {
        const resultActions = document.querySelector('.result-actions');
        if (!resultActions) return;

        // Create feedback form
        const feedbackForm = document.createElement('div');
        feedbackForm.className = 'feedback-form';
        
        // Create correction type buttons
        const correctionButtons = this.correctionTypes.map(type => 
            `<button class="correction-type-btn" data-correction="${type.id}" title="${type.description}">${type.text}</button>`
        ).join('');
        
        feedbackForm.innerHTML = `
            <h3>Šefo korekcijos</h3>
            <div class="correction-types">
                ${correctionButtons}
            </div>
            <textarea id="documentFeedback" placeholder="Įrašykite, kas netinka dokumente, ką reikia pataisyti..."></textarea>
            <div class="feedback-controls">
                <button id="sendFeedbackBtn" class="lithuanian-button">Siųsti pataisymus</button>
                <div class="worker-assignment">
                    <label for="assignWorkerSelect">Užduoti:</label>
                    <select id="assignWorkerSelect">
                        <option value="writer">Rašytojui (Jonui)</option>
                        <option value="researcher">Tyrėjai (Gabijai)</option>
                        <option value="critic">Kritikui (Vytautui)</option>
                        <option value="editor">Redaktorei (Eglei)</option>
                    </select>
                </div>
            </div>
            <div class="revision-status">
                <span id="revisionCount">Pataisymai: 0/${this.maxRevisions}</span>
                <span id="revisionStatus"></span>
            </div>
        `;

        // Add feedback form after result actions
        resultActions.parentNode.insertBefore(feedbackForm, resultActions.nextSibling);

        // Initially hide the feedback form
        feedbackForm.style.display = 'none';
        
        // Add CSS for correction type buttons
        this.addFeedbackStyles();
    }

    /**
     * Adds CSS styles for feedback system
     */
    addFeedbackStyles() {
        if (document.getElementById('feedback-system-styles')) return;
        
        const styleElement = document.createElement('style');
        styleElement.id = 'feedback-system-styles';
        styleElement.textContent = `
            .correction-types {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-bottom: 12px;
            }
            
            .correction-type-btn {
                background-color: #f0f0f0;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 6px 10px;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .correction-type-btn:hover {
                background-color: #e0e0e0;
                border-color: #ccc;
            }
            
            .correction-type-btn.selected {
                background-color: #FFDA00;
                border-color: #FFB700;
                font-weight: bold;
            }
            
            .worker-assignment {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            #assignWorkerSelect {
                padding: 8px;
                border-radius: 4px;
                border: 1px solid #ddd;
                background-color: white;
                min-width: 180px;
            }
            
            [data-theme="dark"] .correction-type-btn {
                background-color: #333;
                border-color: #555;
                color: #e0e0e0;
            }
            
            [data-theme="dark"] .correction-type-btn:hover {
                background-color: #444;
                border-color: #666;
            }
            
            [data-theme="dark"] .correction-type-btn.selected {
                background-color: #FFDA00;
                border-color: #FFB700;
                color: #333;
            }
            
            [data-theme="dark"] #assignWorkerSelect {
                background-color: #333;
                color: #e0e0e0;
                border-color: #555;
            }
            
            .worker-recommendation {
                margin-top: 10px;
                font-style: italic;
                font-size: 13px;
                color: #666;
            }
            
            [data-theme="dark"] .worker-recommendation {
                color: #aaa;
            }
        `;
        
        document.head.appendChild(styleElement);
    }

    /**
     * Attach event listeners for feedback functionality
     */
    attachEventListeners() {
        const sendFeedbackBtn = document.getElementById('sendFeedbackBtn');
        const assignWorkerSelect = document.getElementById('assignWorkerSelect');

        if (sendFeedbackBtn && assignWorkerSelect) {
            sendFeedbackBtn.addEventListener('click', () => this.processFeedback());
        }

        // Listen for document completion to show feedback form
        document.addEventListener('boss-completed-work', () => {
            setTimeout(() => {
                this.showFeedbackForm();
            }, 2000);
        });

        // Also show feedback form when stamp is applied
        if (window.StampEffects && window.StampEffects.showBossApproval) {
            const originalShowBossApproval = window.StampEffects.showBossApproval;
            window.StampEffects.showBossApproval = function() {
                originalShowBossApproval.apply(this, arguments);
                
                // After stamp is shown, show feedback form
                setTimeout(() => {
                    window.FeedbackSystem.showFeedbackForm();
                }, 2000);
            };
        }
        
        // Add click listeners for correction type buttons
        document.addEventListener('click', event => {
            if (event.target.classList.contains('correction-type-btn')) {
                this.handleCorrectionTypeClick(event.target);
            }
        });
    }

    /**
     * Handle correction type button clicks
     */
    handleCorrectionTypeClick(button) {
        // Toggle selection state
        button.classList.toggle('selected');
        
        // Get correction type details
        const correctionId = button.dataset.correction;
        const correctionType = this.correctionTypes.find(type => type.id === correctionId);
        
        if (!correctionType) return;
        
        // Get feedback textarea
        const feedbackTextarea = document.getElementById('documentFeedback');
        if (!feedbackTextarea) return;
        
        // Add or remove the correction text from feedback
        if (button.classList.contains('selected')) {
            // If textarea is empty, just set the text
            if (!feedbackTextarea.value.trim()) {
                feedbackTextarea.value = correctionType.text;
            } else {
                // Otherwise, add as a new line if not already included
                if (!feedbackTextarea.value.includes(correctionType.text)) {
                    feedbackTextarea.value = feedbackTextarea.value.trim() + '\n\n' + correctionType.text;
                }
            }
            
            // Recommend appropriate worker for this correction type
            this.recommendWorkerForCorrection(correctionId);
        } else {
            // Remove this correction text from feedback
            feedbackTextarea.value = feedbackTextarea.value
                .replace(new RegExp(`${correctionType.text}\\s*`), '')
                .trim();
        }
    }
    
    /**
     * Recommend appropriate worker based on correction type
     */
    recommendWorkerForCorrection(correctionId) {
        // Get worker select element
        const workerSelect = document.getElementById('assignWorkerSelect');
        if (!workerSelect) return;
        
        // Get recommended worker from mapping
        const recommendedWorker = this.workerRecommendations[correctionId] || 'writer';
        workerSelect.value = recommendedWorker;
        
        // Show recommendation if not already exists
        let recommendationElem = document.querySelector('.worker-recommendation');
        if (!recommendationElem) {
            recommendationElem = document.createElement('div');
            recommendationElem.className = 'worker-recommendation';
            const feedbackControls = document.querySelector('.feedback-controls');
            if (feedbackControls) {
                feedbackControls.appendChild(recommendationElem);
            }
        }
        
        // Get Lithuanian worker name
        const workerName = this.getLithuanianWorkerName(recommendedWorker);
        recommendationElem.textContent = `Rekomenduojama: ${workerName} geriausiai tinka šiam pakeitimui`;
    }

    /**
     * Show the feedback form when document is completed
     */
    showFeedbackForm() {
        const feedbackForm = document.querySelector('.feedback-form');
        const finalResult = document.getElementById('finalResult');
        
        if (feedbackForm && finalResult) {
            // Save original text for potential reset
            this.originalFinalText = finalResult.innerHTML;
            
            // Show feedback form with animation
            feedbackForm.style.display = 'block';
            feedbackForm.style.opacity = '0';
            feedbackForm.style.transform = 'translateY(20px)';
            
            // Add transition styles
            feedbackForm.style.transition = 'opacity 0.5s, transform 0.5s';
            
            // Force reflow
            feedbackForm.offsetHeight;
            
            // Apply animation
            feedbackForm.style.opacity = '1';
            feedbackForm.style.transform = 'translateY(0)';
        }
    }

    /**
     * Process the submitted feedback and initiate revision
     */
    processFeedback() {
        const feedbackText = document.getElementById('documentFeedback').value.trim();
        const assignedWorker = document.getElementById('assignWorkerSelect').value;
        
        if (!feedbackText) {
            alert('Įveskite komentarą apie pataisymus!');
            return;
        }
        
        if (this.revisionCount >= this.maxRevisions) {
            alert(`Pasiektas maksimalus pataisymų skaičius (${this.maxRevisions})!`);
            return;
        }
        
        if (this.revisionInProgress) {
            alert('Pataisymas jau vyksta, palaukite...');
            return;
        }
        
        // Increase revision count
        this.revisionCount++;
        
        // Save feedback to history with clear indication of direct worker assignment
        this.feedbackHistory.push({
            feedback: feedbackText,
            worker: assignedWorker,
            directAssignment: true, // Flag to indicate this was directly assigned
            timestamp: new Date()
        });
        
        // Reset correction type button selections
        document.querySelectorAll('.correction-type-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Update UI
        document.getElementById('revisionCount').textContent = `Pataisymai: ${this.revisionCount}/${this.maxRevisions}`;
        document.getElementById('revisionStatus').textContent = 'Vyksta...';
        document.getElementById('revisionStatus').style.color = '#FFB700';
        
        // Remove any worker recommendation
        const recommendationElem = document.querySelector('.worker-recommendation');
        if (recommendationElem) recommendationElem.remove();
        
        // Start revision process with ONLY the selected worker
        this.startRevisionProcess(assignedWorker, feedbackText);
    }

    /**
     * Start the document revision process
     */
    startRevisionProcess(assignedWorker, feedbackText) {
        this.isRevisionMode = true;
        this.revisionInProgress = true;
        this.currentWorkerId = assignedWorker;
        
        // Get current document content
        const finalResult = document.getElementById('finalResult');
        const currentContent = finalResult ? finalResult.innerText : '';
        
        // Add message to chat log with clearer indication of who's working on corrections
        if (typeof addMessageToChatLog === 'function') {
            const workerName = this.getLithuanianWorkerName(assignedWorker);
            addMessageToChatLog('System', `Šefas paprašė ${workerName} pataisyti dokumentą (${this.revisionCount}/${this.maxRevisions} koregacija). Po to tik šefas peržiūrės rezultatą.`, 'system');
            addMessageToChatLog('Šefas', feedbackText, 'boss');
        }
        
        // Clear feedback input
        document.getElementById('documentFeedback').value = '';
        
        // Disable feedback controls during revision
        document.getElementById('sendFeedbackBtn').disabled = true;
        document.getElementById('assignWorkerSelect').disabled = true;
        
        // Start revision with the selected worker only
        this.sendToWorker(assignedWorker, currentContent, feedbackText);
    }

    /**
     * Send document to specific worker for revision
     */
    async sendToWorker(workerId, content, feedback) {
        // Update UI to show which worker is processing
        this.updateWorkerStatus(workerId, true);
        
        // Get the Lithuanian name for this worker
        const workerName = this.getLithuanianWorkerName(workerId);
        
        // Add thinking indicator
        if (typeof addThinkingIndicator === 'function') {
            addThinkingIndicator(workerName, `thinking-${workerId}`);
        } else if (typeof window.addMessageToChatLog === 'function') {
            window.addMessageToChatLog(workerName, `Mąsto apie dokumento pataisymus...`, `${workerId} thinking`);
        }
        
        try {
            // Get model for this worker
            const modelSelect = document.getElementById(`${workerId}Model`);
            const model = modelSelect ? modelSelect.value : 'openai-large';
            
            // Create appropriate system prompt for this worker
            const systemPrompt = this.createWorkerSystemPrompt(workerId, feedback);
            
            // Create user prompt with document content
            const userPrompt = this.createWorkerPrompt(workerId, content, feedback);
            
            // Generate response from API
            const response = await ApiConnector.generateText(userPrompt, systemPrompt, model);
            
            // Remove thinking indicator
            document.getElementById(`thinking-${workerId}`)?.remove();
            
            // Add worker's response to chat
            if (typeof addMessageToChatLog === 'function') {
                addMessageToChatLog(workerName, response, workerId);
            }
            
            // If we reach the end of our defined chain or if this is the boss, finalize the document
            if (workerId === 'boss') {
                this.handleBossResponse(response);
                return;
            }
            
            // Move to next worker in sequence
            this.moveToNextWorker(response);
            
        } catch (error) {
            console.error(`Error during revision with ${workerId}:`, error);
            
            // Remove thinking indicator
            document.getElementById(`thinking-${workerId}`)?.remove();
            
            // Show error message
            if (typeof addMessageToChatLog === 'function') {
                addMessageToChatLog('System', `Klaida siunčiant dokumentą darbuotojui ${workerName}: ${error.message}`, 'system error-message');
            }
            
            // Handle error by continuing the process
            // If we get an error with one worker, try the next one
            this.moveToNextWorker(content);
        }
        
        // Update UI to show worker is done
        this.updateWorkerStatus(workerId, false);
    }

    /**
     * Create system prompt for specific worker with enhanced instructions
     */
    createWorkerSystemPrompt(workerId, feedback) {
        // Get detailed instructions based on correction type
        const detailedInstructions = this.getDetailedInstructions(feedback);
        
        // Get base prompt styles from script.js worker prompts for consistency
        const basePrompts = this.getScriptBasePrompts(workerId);
        
        const basePrompt = `Tu esi profesionalus teksto kūrėjas, dirbantis Tauris AI Ltd biure. 
Šefas pateikė šį atsiliepimą apie dokumentą: "${feedback}"
${detailedInstructions}Tavo užduotis - peržiūrėti dokumentą ir atlikti TIKSLIAI ir IŠSAMIAI tuos pakeitimus, kurių paprašė šefas.
Pakeitimai turi būti RYŠKŪS ir AIŠKIAI PASTEBIMI. Nedaryk smulkių, nepastebimų korekcijų. Jei prašoma praplėsti - ŽYMIAI išplėsk turinį.`;

        switch(workerId) {
            case 'writer':
                return `${basePrompt}
${basePrompts.writer || ''}
Tu esi Jonas, rašytojas. Tavo stiprybė - kūrybiškumas ir teksto sklandumas.
Peržiūrėk dokumentą ir RADIKALIAI patobulink jo struktūrą, turinį ir kalbos gyvumą pagal šefo pastabas.
Jei šefas prašo praplėsti tekstą, pridėk BENT DVIGUBAI daugiau detalių, pavyzdžių ir paaiškinimų.
Jei šefas prašo pakeisti pradžią ar pabaigą, VISIŠKAI perrašyk tą dalį su naujomis idėjomis.
Pateik pilną pataisytą dokumento versiją. Nepridėk jokių paaiškinimų, komentarų ar savo vardo/parašo.`;
                
            case 'researcher':
                return `${basePrompt}
${basePrompts.researcher || ''}
Tu esi Gabija, tyrėja. Tavo stiprybė - faktų tikslumas ir informacijos pagrįstumas.
Peržiūrėk dokumentą ir ŽENKLIAI papildyk jį naujais faktais, statistika, ir šaltiniais pagal šefo pastabas.
Jei šefas prašo daugiau faktų, pridėk BENT 3-5 naujus faktus, statistiką, citatas iš tyrimų ar ekspertų.
Įtrauktų faktų tikslumas yra kritiškai svarbus - naudok tik patikimą informaciją.
Pateik pilną pataisytą dokumento versiją. Nepridėk jokių paaiškinimų, komentarų ar savo vardo/parašo.`;
                
            case 'critic':
                return `${basePrompt}
${basePrompts.critic || ''}
Tu esi Vytautas, kritikas. Tavo stiprybė - kritinis mąstymas ir logikos tikrinimas.
Peržiūrėk dokumentą ir IŠ ESMĖS patobulinti jo logiką, argumentus ir struktūrą pagal šefo pastabas.
Jei šefas prašo pagerinti struktūrą, VISIŠKAI perrašyk teksto organizavimą į aiškesnę, nuoseklesnę ir logiškesnę formą.
Pakeisk silpnus argumentus stipresniais, išdėstyk mintis aiškesne seka.
Pateik pilną pataisytą dokumento versiją. Nepridėk jokių paaiškinimų, komentarų ar savo vardo/parašo.`;
                
            case 'editor':
                return `${basePrompt}
${basePrompts.editor || ''}
Tu esi Eglė, redaktorė. Tavo stiprybė - kalbos taisyklingumas ir teksto sklandumas.
Peržiūrėk dokumentą ir KRUOPŠČIAI pataisyk gramatikos, stiliaus ir formatavimo klaidas pagal šefo pastabas.
Jei šefas prašo pakeisti toną, VISIŠKAI pritaikyk rašymo stilių nurodytai auditorijai (formalesnį/neformalesnį).
Jei prašoma patobulinti kalbą - pakeisk BENT 50% sakinių, kad būtų sklandesni, aiškesni ir įtaigesni.
Pateik pilną pataisytą dokumento versiją. Nepridėk jokių paaiškinimų, komentarų ar savo vardo/parašo.`;
                
            case 'boss':
                return `${basePrompt}
${basePrompts.boss || ''}
Tu esi šefas. Tavo užduotis - peržiūrėti atliktus pakeitimus ir sukurti galutinį dokumentą.
Įvertink, ar visi nurodymai buvo tinkamai išspręsti, ypač atkreipk dėmesį į konkrečius nurodymus:
${detailedInstructions}
SVARBU: Pateik TIK galutinį dokumento tekstą be jokių įžanginių ar baigiamųjų komentarų.
NIEKADA nepridėk parašo, datos ar vardo dokumento pabaigoje. NIEKADA nerašyk "Tauris", "Vyr. AI Vadovas" ar datos.
Dokumentas turi baigtis paskutiniu turinio sakiniu, be jokių papildomų elementų.`;
                
            default:
                return basePrompt;
        }
    }

    /**
     * Create user prompt with document content - enhanced to ensure substantial changes
     */
    createWorkerPrompt(workerId, content, feedback) {
        // Base info about document and feedback
        const correctionType = this.identifyCorrectionType(feedback);
        
        let prompt = `DOKUMENTAS KURĮ REIKIA PATAISYTI:
${content}

ŠEFO KOREGACIJOS KOMENTARAI:
${feedback}

`;

        // Shared instruction for all workers to ensure substantial changes
        const sharedInstruction = `
SVARBU: Tavo pakeitimai turi būti ESMINIAI ir LENGVAI PASTEBIMI, ne subtilūs. 
Atlik ŽYMIAI didesnius pakeitimus nei prašoma, kad rezultatas būtų tikrai pastebimas.
Niekada nedėk savo vardo ar parašo dokumento pabaigoje.
`;

        // Add specific instructions for each worker type
        switch(workerId) {
            case 'writer':
                prompt += `Kaip rašytojas (Jonas), atlik RYŠKIUS pakeitimus pagal šefo pastabas.${sharedInstruction}
${this.getSpecificCorrectionPrompt('writer', correctionType)}
Pateik visiškai pataisytą dokumento tekstą be papildomų komentarų ar paaiškinimų.`;
                break;
                
            case 'researcher':
                prompt += `Kaip tyrėja (Gabija), atlik ESMINIUS faktų papildymus pagal šefo pastabas.${sharedInstruction}
${this.getSpecificCorrectionPrompt('researcher', correctionType)}
Pateik visiškai pataisytą dokumento tekstą be papildomų komentarų ar paaiškinimų.`;
                break;
                
            case 'critic':
                prompt += `Kaip kritikas (Vytautas), atlik FUNDAMENTALIUS struktūros pagerinimus pagal šefo pastabas.${sharedInstruction}
${this.getSpecificCorrectionPrompt('critic', correctionType)}
Pateik visiškai pataisytą dokumento tekstą be papildomų komentarų ar paaiškinimų.`;
                break;
                
            case 'editor':
                prompt += `Kaip redaktorė (Eglė), atlik VISAPUSIŠKĄ kalbos tobulinimą pagal šefo pastabas.${sharedInstruction}
${this.getSpecificCorrectionPrompt('editor', correctionType)}
Pateik visiškai pataisytą dokumento tekstą be papildomų komentarų ar paaiškinimų.`;
                break;
                
            case 'boss':
                prompt += `Kaip šefas, apžvelk visus atliktus pataisymus.${sharedInstruction}
Įsitikink, kad visi nurodyti pakeitimai buvo PILNAI įgyvendinti.
Pateik galutinį, patikslintą dokumento tekstą be JOKIŲ komentarų, parašų ar vardų.
Dokumento pabaigoje NEGALI būti jokios informacijos apie autorių ar parašo.`;
                break;
        }
        
        return prompt;
    }

    /**
     * Move to next worker in the chain after an edit is made
     */
    moveToNextWorker(currentContent) {
        // In revision mode, we only want the assigned worker and then the boss
        // Skip all intermediate workers
        
        // If the current worker is not the boss, go directly to boss
        if (this.currentWorkerId !== 'boss') {
            this.currentWorkerId = 'boss';
            this.currentWorkerIndex = this.workerOrder.indexOf('boss');
            
            // Get the last feedback
            const lastFeedback = this.feedbackHistory[this.feedbackHistory.length - 1].feedback;
            
            // Send to boss with small delay
            setTimeout(() => {
                this.sendToWorker('boss', currentContent, lastFeedback);
            }, 1000);
        } else {
            // If we're already at the boss, we're done
            console.log('Revision complete - boss has reviewed the document');
        }
    }

    /**
     * Handle boss's final response
     */
    handleBossResponse(response) {
        // Clean any signatures or unwanted text from the response
        const cleanedResponse = this.removeSignaturesAndComments(response);
        
        // Update final result with boss's cleaned response
        const finalResult = document.getElementById('finalResult');
        if (finalResult) {
            finalResult.innerHTML = cleanedResponse;
            
            // Apply stamp and signature
            if (window.StampEffects && typeof window.StampEffects.showBossApproval === 'function') {
                setTimeout(() => {
                    window.StampEffects.showBossApproval();
                }, 1000);
            }
        }
        
        // Update revision status
        document.getElementById('revisionStatus').textContent = 'Baigta';
        document.getElementById('revisionStatus').style.color = '#009930';
        
        // Re-enable feedback controls if not reached max revisions
        if (this.revisionCount < this.maxRevisions) {
            document.getElementById('sendFeedbackBtn').disabled = false;
            document.getElementById('assignWorkerSelect').disabled = false;
        } else {
            document.getElementById('revisionStatus').textContent = 'Pasiektas maksimalus pataisymų skaičius';
        }
        
        // Mark revision as complete
        this.revisionInProgress = false;
        
        // Add completion message to chat
        if (typeof addMessageToChatLog === 'function') {
            addMessageToChatLog('System', `Dokumento pataisymas #${this.revisionCount} baigtas! Galutinis rezultatas atnaujintas.`, 'system final');
        }
    }

    /**
     * Update worker card UI to show active status
     */
    updateWorkerStatus(workerId, isActive) {
        const workerCard = document.querySelector(`.role-card.${workerId}`);
        if (!workerCard) return;
        
        if (isActive) {
            workerCard.classList.add('revising');
            
            // Add revising indicator if not exists
            if (!workerCard.querySelector('.revising-indicator')) {
                const revisingDiv = document.createElement('div');
                revisingDiv.className = 'revising-indicator';
                revisingDiv.innerHTML = `<span class="revising-text">Taiso dokumentą...</span>`;
                workerCard.appendChild(revisingDiv);
            }
        } else {
            workerCard.classList.remove('revising');
            
            // Remove revising indicator
            const revisingIndicator = workerCard.querySelector('.revising-indicator');
            if (revisingIndicator) {
                revisingIndicator.remove();
            }
        }
    }

    /**
     * Get Lithuanian name for worker
     */
    getLithuanianWorkerName(workerId) {
        const lithuanianNames = {
            'writer': 'Jonas',
            'researcher': 'Gabija', 
            'critic': 'Vytautas',
            'editor': 'Eglė',
            'boss': 'Tauris'
        };
        return lithuanianNames[workerId] || workerId;
    }

    /**
     * Get custom detailed instructions based on correction type to ensure changes are properly made
     */
    getDetailedInstructions(feedback) {
        let specialInstructions = '';
        const correctionType = this.identifyCorrectionType(feedback);
        
        // Add specific detailed instructions based on correction type
        switch (correctionType) {
            case 'broader':
                specialInstructions += "SVARBU: Dokumentas turi būti ŽENKLIAI praplėstas. Pridėk DAUG naujų detalių, pavyzdžių ir paaiškinimų. Teksto apimtis turi padidėti mažiausiai 50%.\n\n";
                break;
            case 'beginning':
                specialInstructions += "SVARBU: VISIŠKAI pakeisk dokumento pradžią. Įžanga turi būti visai kitokia, daug patrauklesnė ir įdomesnė, su visiškai nauju požiūriu.\n\n";
                break;
            case 'ending':
                specialInstructions += "SVARBU: VISIŠKAI perrašyk dokumento pabaigą. Išvados turi būti visiškai naujos, stipresnės, įsimintinos ir su aiškia žinute.\n\n";
                break;
            case 'facts':
                specialInstructions += "SVARBU: Tekstas PRIVALO turėti ŽYMIAI daugiau faktų. Pridėk mažiausiai 5-7 naujus faktus, statistiką, duomenis. Kiekvienas faktas turi būti konkretus ir informatyvus.\n\n";
                break;
            case 'structure':
                specialInstructions += "SVARBU: VISIŠKAI pakeisk teksto struktūrą. Organizuok turinį visai kitokiu principu, sukurk aiškesnę hierarchiją ir logiškesnį minčių dėstymą.\n\n";
                break;
            case 'language':
                specialInstructions += "SVARBU: RADIKALIAI patobulinti kalbą. Pakeisk bent 70% sakinių struktūrą, žodyną ir stilių. Kalba turi būti žymiai sklandesnė ir profesionalesnė.\n\n";
                break;
            case 'tone':
                specialInstructions += "SVARBU: VISIŠKAI pakeisk teksto toną. Pritaikyk stilių reikiamai auditorijai - jei reikia formalesnio, padaryk jį akademinį; jei neformalesnio - padaryk jį draugiškesnį ir paprastesnį.\n\n";
                break;
        }
        
        // Add emphasis on making substantial changes that are clearly visible
        specialInstructions += "SVARBU: Pakeitimai turi būti AIŠKIAI MATOMI ir ESMINIAI. Nedaryti subtilių ar minimalių pataisymų.\n\n";
        
        // Add instruction to never include signature
        specialInstructions += "SVARBU: Dokumento pabaigoje NIEKADA nepridėk jokio parašo, vardo ar datos.\n\n";
        
        return specialInstructions;
    }

    /**
     * Extract base prompts from script.js to maintain consistency with main system
     * This helps integrate the feedback system with the original script logic
     */
    getScriptBasePrompts(workerId) {
        // These are simplified versions of the prompts from script.js
        const basePrompts = {
            'writer': 'Mūsų kūrybinis genijus. Ekspertas glaustų tekstų rašyme, niekada nenuklysta nuo temos ir visada rašo aiškiai.',
            'researcher': 'Mūsų faktų tikrintoja. Naudoja tik patikimus šaltinius ir pateikia informaciją struktūruotai.',
            'critic': 'Mūsų kokybės tikrintojas. Jo akys pastebi kiekvieną klaidą ir teksto silpnybę. Negailestingas, bet naudingas.',
            'editor': 'Mūsų tobulintoja. Su raudonu pieštuku pataiso ne tik klaidas, bet ir teksto sruktūrą. Ištraukia esmę ir padaro tekstą sklandesnį.',
            'boss': 'Mūsų strategas ir lyderis. Meistriškai apjungia visų darbuotojų indėlį į vieną nuoseklų rezultatą.'
        };
        
        return basePrompts[workerId] || '';
    }

    /**
     * Identify correction type from feedback text
     */
    identifyCorrectionType(feedback) {
        // Check for specific correction types in the feedback
        for (const corrType of this.correctionTypes) {
            if (feedback.toLowerCase().includes(corrType.text.toLowerCase())) {
                return corrType.id;
            }
        }
        
        // If no specific type found, analyze text for keywords
        if (feedback.match(/pla(č|t)iau|daugiau|papild|išpl[eė]|pridėk|pridėt|dėti|prid[eė]|prapl[eė]|pridet/i)) {
            return 'broader';
        } else if (feedback.match(/prad(ž|z)i|įvad|pirm/i) && feedback.match(/pakeit|perra(š|s)|kitaip|nauj/i)) {
            return 'beginning';
        } else if (feedback.match(/pab(a|e)ig|išvad|gal|pabaigoj/i) && feedback.match(/pakeit|perra(š|s)|kitaip|nauj/i)) {
            return 'ending';
        } else if (feedback.match(/fakt|duo(m|n)|statistik|skai(č|t)|tyrim/i)) {
            return 'facts';
        } else if (feedback.match(/strukt[uū]r|orga(n|m)i|išdėst|tvar(k|t)|sekos|eiliškum/i)) {
            return 'structure';
        } else if (feedback.match(/kalb|žod|saki(n|m)|gram|ra(š|s)y/i)) {
            return 'language';
        } else if (feedback.match(/ton|stil|formal|akadem|oficialumu|žargon|kasdienišk/i)) {
            return 'tone';
        }
        
        // Default case
        return 'default';
    }

    /**
     * Enhanced function to remove signatures and unwanted comments
     */
    removeSignaturesAndComments(text) {
        if (!text) return '';
        
        // Remove various signature formats
        let cleaned = text
            // Remove signature blocks with name, title, date
            .replace(/\n*\s*Tauris\s*\n+\s*Vyr\.\s*AI\s*Vadovas\s*\n+\s*202[0-9][-.\/][0-9]{1,2}[-.\/][0-9]{1,2}\s*$/gi, '')
            .replace(/\n*\s*Tauris,?\s*\n+\s*Vyr\.\s*AI\s*Vadovas\s*$/gi, '')
            .replace(/\n*\s*Tauris,?\s*\n+\s*202[0-9][-.\/][0-9]{1,2}[-.\/][0-9]{1,2}\s*$/gi, '')
            .replace(/\n*\s*Tauris\s*$/gi, '')
            
            // Remove standard signature formats
            .replace(/\n*\s*Su\s+pagarba,?\s*\n+\s*Tauris\s*$/gi, '')
            .replace(/\n*\s*Pagarbiai,?\s*\n+\s*Tauris\s*$/gi, '')
            
            // Remove all common variations of name-date signatures
            .replace(/\n*\s*(Vyr\.|Vadovas|Direktorius|Šefas)[\s,]*Tauris\s*$/gi, '')
            .replace(/\n*\s*202[0-9]-\d{2}-\d{2}\s*$/g, '')
            
            // Remove any lines with only a name or signature-like content at the end
            .replace(/\n+\s*Tauris\s*$/gi, '')
            .replace(/\n+\s*Vyr\.\s*AI\s*Vadovas\s*$/gi, '')
            
            // Remove any lingering date stamps at the end
            .replace(/\n+\s*\d{4}[-.\/]\d{1,2}[-.\/]\d{1,2}\s*$/g, '')
            
            // Clean up any excessive blank lines at the end
            .replace(/\n{2,}$/g, '\n')
            .trim();
        
        // Remove comments about changes made
        cleaned = cleaned
            .replace(/\n*\s*Atliktų pakeitimų santrauka:[\s\S]*$/gi, '')
            .replace(/\n*\s*Pakeitimai:[\s\S]*$/gi, '')
            .replace(/\n*\s*Pastaba:[\s\S]*$/gi, '')
            .trim();
        
        return cleaned;
    }

    /**
     * Get more specific prompts for each correction type and worker
     */
    getSpecificCorrectionPrompt(workerId, correctionType) {
        const specificPrompts = {
            'broader': {
                'writer': 'DVIGUBAI padidink teksto apimtį. Pridėk daug naujų pavyzdžių, metaforų, palyginimų. Kiekvienam esminiam punktui pridėk po 2-3 papildomus sakinius su detalėmis.',
                'researcher': 'Pridėk MAŽIAUSIAI 5 naujus faktus, statistiką ar tyrimus. Kiekvienas teiginį paremk konkrečiais duomenimis. Būtinai įtrauk metų skaičius ar kiekybinius duomenis.',
                'critic': 'Papildyk tekstą naujais argumentais, pridėk kontrastingų perspektyvų, išplėsk kiekvieną argumentą su priežastimis ir pasekmėmis.',
                'editor': 'Išplėsk sakinius, pridėdama paaiškinamųjų elementų. Naudok daugiau epitetų, palyginimų ir vaizdingų frazių.'
            },
            'beginning': {
                'writer': 'VISIŠKAI perrašyk įvadą. Jis turi būti bent dvigubai ilgesnis, su aiškia teze ir intriguojančia įžanga, kuri iškart patrauktų dėmesį.',
                'researcher': 'Pradėk dokumentą su ryškiais faktais ar statistika. Įvade turi būti mažiausiai 3 konkretūs duomenys ar skaičiai, paremti patikimais šaltiniais.',
                'critic': 'Pakeisk pradžios struktūrą - pradėk su stipriu teiginiu, tada provokatyviu klausimu ir tada pagrindinės idėjos pristatymu.',
                'editor': 'Pakeisk pradžios toną į labiau įtraukiantį. Naudok trumpesnius, energingus sakinius įvade. Pridėk retorinį klausimą pirmame sakinyje.'
            },
            'ending': {
                'writer': 'VISIŠKAI perrašyk išvadą. Ji turi skambėti įsimintinai, su aiškia kulminacija ir kvietimu veikti ar tolesniam apmąstymui.',
                'researcher': 'Užbaik su konkrečiomis išvadomis, paremtomis faktais. Pridėk mažiausiai 3 apibendrinančius faktus ar statistiką paskutiniame paragrafe.',
                'critic': 'Pakeisk pabaigos struktūrą - pateik stiprią išvadą, tada būsimų perspektyvų apžvalgą ir užbaik su esminiu apibendrinimu.',
                'editor': 'Užbaik su stipriu, įsimintinu sakiniu. Paskutinis paragrafas turi būti labai sklandus, be jokių nereikalingų žodžių.'
            },
            'facts': {
                'writer': 'Įpink faktus į pasakojimą natūraliai. Kiekvienam faktui pridėk kontekstą ir paaiškinimą, kaip jis siejasi su tema.',
                'researcher': 'PRIDĖK MAŽIAUSIAI 7 NAUJUS FAKTUS. Kiekvienas faktas turi būti konkretus, su skaičiais ir šaltiniais. Išdėstyk faktus logine tvarka.',
                'critic': 'Perrašyk tekstą, kad faktai būtų geriau integruoti į argumentų struktūrą. Kiekvienas faktas turi paremti konkretų teiginį.',
                'editor': 'Užtikrink, kad faktai būtų pateikti aiškiai ir tiksliai. Naudok trumpus, tikslius sakinius faktams pristatyti.'
            },
            'structure': {
                'writer': 'Sukurk aiškesnę struktūrą su įvadu, keliais aiškiai išskirtais pagrindiniais punktais ir išvada. Kiekvienas paragrafas turi turėti vieną pagrindinę mintį.',
                'researcher': 'Organizuok faktus į logines kategorijas. Pridėk potemių pavadinimus ar numeruotus sąrašus, kur tinkama.',
                'critic': 'VISIŠKAI PERORGANIZUOK DOKUMENTO STRUKTŪRĄ. Sukurk aiškią hierarchiją argumentams, su silpnesniais argumentais iš pradžių ir stipriausiais pabaigoje.',
                'editor': 'Pridėk aiškius perėjimus tarp paragrafų. Užtikrink, kad kiekvienas paragrafas turėtų aiškų temos sakinį ir būtų logiškai susietas su kitais.'
            },
            'language': {
                'writer': 'Naudok vaizdingesnę kalbą. Pakeisk bent 70% banalių frazių originaliomis metaforomis ir palyginimais.',
                'researcher': 'Užtikrink, kad terminai būtų naudojami tiksliai ir nuosekliai. Pridėk trumpus paaiškinimus sudėtingiems terminams.',
                'critic': 'Naudok stipresnius, įtaigesnius argumentus. Pakeisk visus silpnus žodžius ("galbūt", "gali būti") tvirtesniais teiginiais.',
                'editor': 'PAKEISK BENT 70% SAKINIŲ STRUKTŪRŲ. Varijuok sakinių ilgį, naudok įvairesnius jungtukus ir geresnę skyrybą. Pašalink visus pasikartojimus.'
            },
            'tone': {
                'writer': 'Visiškai pakeisk teksto toną pagal reikalavimą (formalesnį ar neformalesnį). Jei prašoma formalesnio - naudok profesionalesnį žodyną, ilgesnius sakinius, venk pirmo asmens.',
                'researcher': 'Pritaikyk faktų pateikimo būdą pagal reikalaujamą toną. Formalesniam - daugiau akademinių šaltinių, neformalesniam - daugiau pavyzdžių iš kasdienio gyvenimo.',
                'critic': 'Pakeisk argumentavimo stilių pagal reikalaujamą toną. Formalesniam - daugiau loginio pagrindimo, neformalesniam - daugiau asmeninių patirčių.',
                'editor': 'VISIŠKAI PAKEISK KALBOS STILIŲ. Pakeisk VISĄ žodyną ir sakinių struktūras, kad atspindėtų reikalaujamą toną.'
            },
            'default': {
                'writer': 'Perrašyk tekstą, kad jis būtų sklandesnis ir įdomesnis. Pridėk daugiau detalių ir pavyzdžių.',
                'researcher': 'Papildyk tekstą naujais faktais ir informacija. Patikrink esamų teiginių tikslumą.',
                'critic': 'Pagerink teksto logiką ir argumentų struktūrą. Užtikrink, kad kiekvienas teiginys būtų pagrįstas.',
                'editor': 'Pataisyk gramatikos, stiliaus ir formatavimo klaidas. Pagerink bendrą teksto sklandumą.'
            }
        };
        
        // Return specific prompt or default if not found
        return (specificPrompts[correctionType] && specificPrompts[correctionType][workerId]) || 
               specificPrompts['default'][workerId];
    }
}

// Initialize and make globally available
document.addEventListener('DOMContentLoaded', () => {
    window.FeedbackSystem = new FeedbackSystem();
    window.FeedbackSystem.init();
});
