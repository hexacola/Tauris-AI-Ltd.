document.addEventListener('DOMContentLoaded', () => {
    // Verify ApiConnector exists or create fallback to ApiHelper
    if (typeof ApiConnector === 'undefined') {
        console.warn('ApiConnector not found, creating fallback that uses ApiHelper');
        window.ApiConnector = {
            generateText: async function(prompt, systemPrompt, model, options = {}) {
                return await ApiHelper.generateText(prompt, systemPrompt, model);
            },
            checkHealth: async function() {
                return await ApiHelper.isApiAvailable();
            },
            getPreferredModels: async function() {
                return await ApiHelper.getAvailableModels();
            },
            fetchWithInternetAccess: async function(url, options = {}) {
                try {
                    const response = await fetch(url, options);
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return await response.json(); // Or response.text(), response.blob(), etc. based on expected data
                } catch (error) {
                    console.error("Error fetching data from:", url, error);
                    throw error; // Re-throw to handle it in the calling function
                }
            },
            showFetchingStatus: function(active, message) {
                const indicator = document.getElementById('fetchingIndicator');
                if (indicator) indicator.classList.toggle('active', active);

                const statusText = document.getElementById('modelStatusText');
                if (statusText) statusText.textContent = message || '';
            }
        };
    }

    // DOM elements
    const initialPrompt = document.getElementById('initialPrompt');
    const writerModel = document.getElementById('writerModel');
    const researcherModel = document.getElementById('researcherModel');
    const criticModel = document.getElementById('criticModel');
    const editorModel = document.getElementById('editorModel');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const clearBtn = document.getElementById('clearBtn');
    const chatLog = document.getElementById('chatLog');
    const finalResult = document.getElementById('finalResult');
    const resultStatus = document.getElementById('resultStatus');
    const copyResultBtn = document.getElementById('copyResultBtn');
    const downloadResultBtn = document.getElementById('downloadResultBtn');
    const numExchanges = document.getElementById('numExchanges');
    const delayBetweenExchanges = document.getElementById('delayBetweenExchanges');
    const statusMessage = document.getElementById('statusMessage');
    const debugMode = document.getElementById('debugMode');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    // Define worker roles with improved Lithuanian personalities and prompts
    const workers = {
        writer: {
            name: "Writer",
            systemPrompt: `Tu esi Jonas, talentingas rašytojas-genijus iš Lietuvos. Tavo užduotis - kurti aukštos kokybės tekstus, kurie yra ne tik informatyvūs, bet ir įdomūs bei įtikinami.`,
            className: "writer",
            model: () => writerModel.value,
            thoughtProcess: [], // Array to store the thought process
        },
        researcher: {
            name: "Researcher",
            systemPrompt: `Tu esi Gabija, aukščiausios kvalifikacijos tyrėja. Tavo užduotis - kruopščiai tikrinti faktus, pateikti patikimus šaltinius ir užtikrinti teksto akademinį pagrįstumą.`,
            className: "researcher",
            model: () => researcherModel.value,
            thoughtProcess: [],
        },
        critic: {
            name: "Critic",
            systemPrompt: `Tu esi Vytautas, aukščiausios klasės literatūros kritikas. Tavo užduotis - konstruktyviai analizuoti tekstus, nurodant stipriąsias ir tobulintinas vietas, bei siūlyti konkrečius patobulinimus.`,
            className: "critic",
            model: () => criticModel.value,
            thoughtProcess: [],
        },
        editor: {
            name: "Editor",
            systemPrompt: `Tu esi Eglė, profesionali lietuvių kalbos redaktorė. Tavo užduotis - užtikrinti, kad tekstas būtų be klaidų, stilingas, sklandus ir atitiktų aukščiausius kalbos standartus.`,
            className: "editor",
            model: () => editorModel.value,
            thoughtProcess: [],
        },
        boss: {
            name: "Boss",
            systemPrompt: `Tu esi Tauris, įmonės direktorius. Tavo užduotis - peržiūrėti visų darbuotojų darbą ir pateikti galutinę, aukščiausios kokybės teksto versiją.`,
            className: "boss",
            model: () => bossModel ? bossModel.value : (openaiModel ? openaiModel.value : 'openai'),
            thoughtProcess: [],
        }
    };

    // State variables
    let conversationHistory = [];
    let isCollaborationActive = false;
    let currentIteration = 0;
    let maxIterations = 1; // Default to 1 iteration
    let currentWorkerIndex = 0;
    let exchangeDelay = 1000;
    let latestResult = "";

    // Worker execution sequence
    const workerSequence = ['writer', 'researcher', 'critic', 'editor'];

    // Add boss as the final worker only at the end of all iterations
    const finalWorker = 'boss';

    // Track failed models
    let failedModels = {};

    // Available backup models
    const backupModels = [
        'openai-large',
        'openai-reasoning',
        'deepseek',
        'deepseek-reasoner',
        'gemini',
        'claude-hybridspace',
        'searchgpt'
    ];

    // Event listeners
    startBtn.addEventListener('click', startCollaboration);
    stopBtn.addEventListener('click', stopCollaboration);
    clearBtn.addEventListener('click', clearCollaboration);
    copyResultBtn.addEventListener('click', copyFinalResult);
    downloadResultBtn.addEventListener('click', downloadAsDocument);

    numExchanges.addEventListener('change', () => {
        maxIterations = parseInt(numExchanges.value);
    });
    delayBetweenExchanges.addEventListener('change', () => {
        exchangeDelay = parseInt(delayBetweenExchanges.value);
    });

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        // Set initial values
        maxIterations = parseInt(numExchanges.value);
        exchangeDelay = parseInt(delayBetweenExchanges.value);

        // Disable download and copy buttons initially
        copyResultBtn.disabled = true;
        downloadResultBtn.disabled = true;
    });

    // Load available models
    populateModelOptions();

    async function populateModelOptions() {
        // ... (same as before) ...
         try {
            updateStatus("Loading available models...");

            // Use our new ApiConnector to get preferred models
            const models = await ApiConnector.getPreferredModels();

            // Clear existing options
            const modelSelects = document.querySelectorAll('.model-select');
            modelSelects.forEach(select => select.innerHTML = '');

            // Process models for display
            models.forEach(model => {
                if (model.type === 'chat') {
                    const option = document.createElement('option');
                    option.value = model.name;

                    // Add visual indicators for capabilities
                    let description = model.description || model.name;
                    const badges = [];
                    if (model.vision) badges.push("👁️");
                    if (model.reasoning) badges.push("🧠");
                    // Add internet access badge
                    if (model.internet) badges.push("🌐");


                    if (badges.length > 0) {
                        description = `${description} ${badges.join(" ")}`;
                    }

                    option.textContent = description;
                    option.dataset.baseModel = model.baseModel;
                    option.dataset.vision = model.vision;
                    option.dataset.reasoning = model.reasoning;
                    //add internet dataset
                    option.dataset.internet = model.internet;


                    modelSelects.forEach(select => {
                        select.appendChild(option.cloneNode(true));
                    });
                }
            });

            // Set appropriate defaults based on available models
            const defaults = {
                'writerModel': ['openai-large', 'gemini', 'deepseek'],
                'researcherModel': ['searchgpt', 'deepseek-reasoner', 'openai-reasoning'],
                'criticModel': ['deepseek-r1', 'gemini-thinking', 'openai-reasoning'],
                'editorModel': ['claude-hybridspace', 'deepseek', 'openai-large'],
                'bossModel': ['openai-large', 'gemini-thinking', 'deepseek-reasoner']
            };

            // Apply defaults
            Object.entries(defaults).forEach(([id, preferredModels]) => {
                const select = document.getElementById(id);
                if (select) {
                    // Try each model in order until one is found
                    for (const modelName of preferredModels) {
                        const option = select.querySelector(`option[value="${modelName}"]`);
                        if (option) {
                            select.value = modelName;
                            break;
                        }
                    }
                }
            });

            updateStatus("Models loaded successfully", "success");
        } catch (error) {
            console.error("Error loading models:", error);
            updateStatus(`Error loading models: ${error.message}`, "error");
            setFallbackModels();
        }
    }

    function setFallbackModels() {
        // ... (same as before) ...
        const fallbackModels = [
            { id: 'writerModel', value: 'openai-large', label: 'OpenAI GPT-4o' },
            { id: 'researcherModel', value: 'deepseek', label: 'DeepSeek-V3' },
            { id: 'criticModel', value: 'gemini', label: 'Gemini 2.0 Flash' },
            { id: 'editorModel', value: 'claude-hybridspace', label: 'Claude Hybridspace' },
            { id: 'bossModel', value: 'openai-large', label: 'OpenAI GPT-4o' }
        ];

        fallbackModels.forEach(model => {
            const select = document.getElementById(model.id);
            if (select) {
                select.innerHTML = '';
                const option = document.createElement('option');
                option.value = model.value;
                option.textContent = model.label;
                select.appendChild(option);
            }
        });
    }

    function updateStatus(message, type = "") {
        // ... (same as before) ...
        statusMessage.textContent = message;
        statusMessage.className = type;
    }
    async function startCollaboration() {
         // ... (same as before) ...
        if (isCollaborationActive) return;

        const initialTopic = initialPrompt.value.trim();
        if (!initialTopic) {
            alert('Please enter an initial topic');
            return;
        }

        isCollaborationActive = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        currentIteration = 0;
        currentWorkerIndex = 0;
        maxIterations = parseInt(numExchanges.value);
        exchangeDelay = parseInt(delayBetweenExchanges.value);

        // Reset result area
        if (finalResult) finalResult.textContent = '';
        if (resultStatus) resultStatus.textContent = '(Collaboration in progress...)';

        // Reset buttons - only use the result section buttons
        if (copyResultBtn) copyResultBtn.disabled = true;
        if (downloadResultBtn) downloadResultBtn.disabled = true;

        // Reset progress
        if (progressFill) progressFill.style.width = '0%';
        if (progressText) progressText.textContent = '0%';

        updateStatus("Starting collaboration...");

        // Start with the initial prompt to the first worker
        try {
            await continueCollaboration(initialTopic, true);
        } catch (error) {
            console.error("Error starting collaboration:", error);
            updateStatus(`Error: ${error.message}`, "error");
            stopCollaboration();
        }
    }

    function stopCollaboration() {
        // ... (same as before) ...
        isCollaborationActive = false;
        startBtn.disabled = false;
        stopBtn.disabled = true;
        updateStatus("Collaboration stopped");
    }

    function clearCollaboration() {
         // ... (same as before, *BUT ADD THOUGHT PROCESS RESET*) ...
        stopCollaboration();
        chatLog.innerHTML = '';
        finalResult.textContent = '';
        resultStatus.textContent = '(Collaboration in progress...)';
        conversationHistory = [];
        failedModels = {};
        latestResult = "";

        // Reset thought processes
        for (const workerKey in workers) {
            workers[workerKey].thoughtProcess = [];
        }


        // Reset progress
        progressFill.style.width = '0%';
        progressText.textContent = '0%';

        // Reset buttons
        copyResultBtn.disabled = true;
        downloadResultBtn.disabled = true;

        updateStatus("Collaboration cleared");
    }
    
    //Modified continueCollaboration
    async function continueCollaboration(initialMessage = null, isFirstMessage = false) {
        if (!isCollaborationActive) return;

        // Update progress bar
        const totalSteps = maxIterations * workerSequence.length;
        const currentStep = currentIteration * workerSequence.length + currentWorkerIndex;
        const progress = Math.min(100, (currentStep / totalSteps) * 100);

        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${Math.round(progress)}%`;

        // Check if we've completed all iterations
        if (currentIteration >= maxIterations && currentWorkerIndex === 0) {
            finalizeCollaboration();
            return;
        }

        // Determine which worker is speaking
        const workerKey = workerSequence[currentWorkerIndex];
        const worker = workers[workerKey];

        // Add thinking indicator
        const thinkingId = `thinking-${Date.now()}`;
        addThinkingIndicator(worker.name, thinkingId);
        updateStatus(`${worker.name} (${worker.model()}) is thinking...`);

        try {
            let prompt;

            if (isFirstMessage) {
                // First message to Jonas (Writer) - Very specific instructions.
                prompt = `Parašyk ${initialMessage}.

SVARBU: 
- Tekstas TURI būti parašytas TIKSLIAI pagal užduoties tipą (straipsnis, blogo įrašas, Twitter žinutė, ir t.t.).
- Pradėk kūrybišku, dėmesį patraukiančiu įvadiniu sakiniu.
- Rašyk *daugiausia* taisyklinga lietuvių kalba.  Gali naudoti anglicizmus ar kitų kalbų žodžius, BET TIK JEI tai pagerina tekstą ir TURI tam pagrįstą priežastį (pvz., "Naudoju 'deadline', nes lietuviškas atitikmuo nėra toks veržlus").  Kiekvieną tokį atvejį *privalai* trumpai paaiškinti.
- Pabaigoje perduok darbą Gabijai (tyrėjai).`;
            } else {
                // Create prompts based on the collaboration history
                let historyText = "";

                if (ApiConnector && typeof ApiConnector.formatConversationForApi === 'function') {
                    historyText = ApiConnector.formatConversationForApi(conversationHistory);
                    historyText = ApiConnector.trimConversationHistory(historyText);
                } else {
                    // Fallback
                    historyText = formatCollaborationHistory();
                }

                // Customize prompts for each worker.  These are much more specific now.
                switch (workerKey) {
                    case 'researcher':
                        prompt = `${historyText}

Dabar Tu esi Gabija, tyrėja.

SVARBU:
- Peržiūrėk Jono tekstą ir papildyk jį *tiksliąja* moksline informacija: faktais, statistika, akademinėmis nuorodomis.
- **BŪTINAI atlik papildomus tyrimus internete, jei reikia.** Naudokis internetu *aktyviai* ieškodama patikimos ir aktualios informacijos.
- Rašyk taisyklinga lietuvių kalba, akademiniu stiliumi.  Venk neaiškumų ir abstrakcijų.
- Išlaikyk pagrindinę teksto struktūrą, bet *drąsiai* keisk, jei reikia pagerinti turinio tikslumą.
- *Privalai* pateikti nuorodas į šaltinius, kur įmanoma (naudok lietuviškus akademinius standartus).
- Pabaigoje perduok darbą Vytautui (kritikui).`;
                        break;
                    case 'critic':
                        prompt = `${historyText}

Dabar Tu esi Vytautas, kritikas.

SVARBU:
- Įvertink Gabijos patobulintą tekstą.  Būk *konstruktyviai* kritiškas.
- Pradėk nuo teksto *stiprybių*.  Kas *gerai* padaryta?
- Tada nurodyk *konkrečius* trūkumus ir tobulintinas vietas.  Cituok problemines teksto dalis.
- Pasiūlyk *labai konkrečius* patobulinimus, kuriuos Eglė (redaktorė) galėtų įgyvendinti.  Ne "pataisyk stilių", o "šį sakinį performuluok taip: ...".
- Analizuok: teksto logiką, struktūrą, argumentų pagrįstumą, šaltinių naudojimą, kalbos aiškumą.
- Rašyk taisyklinga lietuvių kalba.
- Pabaigoje perduok darbą Eglei.`;
                        break;
                    case 'editor':
                        prompt = `${historyText}

Dabar Tu esi Eglė, redaktorė.

SVARBU:
- Atsižvelgdama į Vytauto *labai konkrečius* nurodymus, pataisyk ir patobulink tekstą.
- Tavo tikslas – pateikti *galutinę*, *išbaigtą* teksto versiją, kuri būtų *visiškai* be klaidų (gramatikos, skyrybos, stiliaus, logikos).
- Šis tekstas bus naudojamas kaip galutinis rezultatas.  Jis TURI būti nepriekaištingos kokybės, tinkamas publikavimui.
- Išlaikyk originalias idėjas ir temą, bet *griežtai* laikykitės lietuvių kalbos taisyklių.
- Būk *ypač* atidi: veiksmažodžių formoms, dalyviams, linksniams, sakinio dalių ryšiams, žodžių tvarkai.
- Jei tai priešpaskutinė iteracija (prieš šefo peržiūrą), padaryk tekstą *kuo tobulesnį*.
- Pradėk nuo profesionalaus įvado, pvz., "Atsižvelgdama į Vytauto pastabas, atlikau šiuos pataisymus: ... [pateik pakeitimų sąrašą]".`;
                        break;
                    case 'writer':
                       prompt = `${historyText}

Dabar Tu esi Jonas, rašytojas-genijus. Peržiūrėk Eglės pataisytą tekstą ir sukurk naują, patobulintą versiją, atsižvelgdamas į visus ankstesnius komentarus (Gabijos, Vytauto ir Eglės).  Tu *gali* naudoti anglicizmus ar kitų kalbų žodžius, JEIGU manai, kad tai *pagerina* tekstą ir atitinka TAVO, kaip genijaus, stilių, *bet* vis tiek stenkis rašyti *daugiausia* taisyklinga lietuvių kalba, išlaikydamas aukštą rašymo kokybę.

SVARBU:
- Tai yra nauja iteracija, tad tobulini ir plėtoji jau egzistuojančias idėjas, o ne pradedi nuo pradžių.
- Stenkis apjungti visus ankstesnius patobulinimus į nuoseklų, aiškų, ir *įtikinamą* tekstą, kuris būtų ne tik informatyvus, BET ir *įdomus* skaityti.
- Tavo pagrindinė stiprybė – gebėjimas parašyti tekstą *TIKSLIAI* pagal užduotį (straipsnis, blogo įrašas, Twitter postas ir t.t.).  Šis reikalavimas yra *esminis*.
- Nebijok eksperimentuoti su kalba, bet išlaikyk lietuvių kalbos *grakštumą* ir *turtingumą*.
- Jei naudoji anglicizmus ar kitokius *nestandartinius* kalbos sprendimus, *trumpai paaiškink*, kodėl tai darai.  Pavyzdžiui: "Čia įterpiau 'deadline', nes lietuviškas atitikmuo šiuo atveju skamba ne taip *veržliai*."
- Rašyk natūralia lietuvių kalba, kaip tikras (bet genialus!) Jonas.
- Pabaigoje perduok darbą vėl Gabijai tolesniam tobulinimui.`;
                        break;
                }
            }

            // ... (rest of the continueCollaboration function, including error handling, remains largely the same) ...
             // Try to get a response with automatic model fallback
            let response = await tryGenerateResponseWithFallback(prompt, worker.systemPrompt, worker.model(), workerKey);

            // Validate response
            if (response.trim().startsWith('<!DOCTYPE') || response.trim().startsWith('<html')) {
                throw new Error("Received HTML instead of text response");
            }

            // Remove thinking indicator
            removeThinkingIndicator(thinkingId);

            // Update collaboration history
            if (isFirstMessage) {
                // If it's the first message, add the initial topic as a system message
                conversationHistory.push({
                    role: 'System',
                    content: initialMessage
                });
            }

            // Save the response to conversation history
            conversationHistory.push({
                role: worker.name,
                content: response
            });

            // Save the latest result for the final output (from each worker)
            latestResult = response;

            // Add the response to the chat log
            addMessageToChatLog(worker.name, response, worker.className);

            // ************* Thought Process Analysis *************
            analyzeThoughtProcess(worker, response);
            displayThoughtProcess(workerKey);
            // ************* End Thought Process Analysis *************

            updateStatus(`${worker.name} responded successfully`);

            // Continue to the next worker
            currentWorkerIndex = (currentWorkerIndex + 1) % workerSequence.length;

            // Only increment the iteration counter when we complete a full cycle
            if (currentWorkerIndex === 0) {
                currentIteration++;
            }

            // Wait a moment before the next exchange
            if (isCollaborationActive) {
                const delayTime = Math.max(500, exchangeDelay);
                updateStatus(`Waiting ${delayTime}ms before next response...`);

                await new Promise(resolve => setTimeout(resolve, delayTime));

                if (isCollaborationActive) {
                    continueCollaboration().catch(err => {
                        console.error("Error in collaboration continuation:", err);
                        updateStatus(`Error: ${err.message}`, "error");

                        setTimeout(() => {
                            if (isCollaborationActive) {
                                addMessageToChatLog('System', 'Attempting to continue collaboration...', 'system');
                                continueCollaboration().catch(() => {
                                    addMessageToChatLog('System', 'Failed to continue collaboration after multiple attempts.', 'system');
                                    stopCollaboration();
                                });
                            }
                        }, 2000);
                    });
                }
            }

        } catch (error) {
            console.error('Final error generating response:', error);
            removeThinkingIndicator(thinkingId);

            // Show a fun error animation
            if (window.ErrorAnimations) {
                ErrorAnimations.showErrorAnimation(workerKey, error, worker.model());
            }

            // Handle model failures
            if (failedModels[workerKey] && Object.keys(failedModels[workerKey]).length >= backupModels.length) {
                addMessageToChatLog('System', `All available models failed for ${worker.name}. Stopping collaboration.`, 'system');
                updateStatus(`All models failed for ${worker.name}`, "error");
                stopCollaboration();
            } else {
                // Try again with a different model
                const nextModel = getNextAvailableModel(workerKey);
                if (nextModel) {
                    addMessageToChatLog('System', `Switching ${worker.name} to model: ${nextModel}`, 'system');
                    updateStatus(`Trying again with ${nextModel}...`);

                    // Update the model in UI
                    updateWorkerModel(workerKey, nextModel);

                    // Try again with the new model
                    setTimeout(() => {
                        if (isCollaborationActive) {
                            continueCollaboration(null, false);
                        }
                    }, 1500);
                } else {
                    addMessageToChatLog('System', `No more models available for ${worker.name}. Stopping collaboration.`, 'system');
                    stopCollaboration();
                }
            }
        }
    }


    // Get next available model that hasn't failed yet
    function getNextAvailableModel(workerKey) {
         // ... (same as before) ...
        // First check with ModelAvailability
        if (window.ModelAvailability) {
            const currentModel = workers[workerKey].model();
            const alternative = window.ModelAvailability.findAlternative(currentModel);
            if (alternative) {
                return alternative;
            }
        }

        // Fallback to original logic
        // Define fallback sequence for the limited set of models
        const fallbackSequence = [
            'openai-large',
            'openai-reasoning',
            'deepseek',
            'deepseek-reasoner',
            'gemini',
            'claude-hybridspace',
            'searchgpt'
        ];

        // Check which models haven't failed too many times
        const availableModels = fallbackSequence.filter(model =>
            !failedModels[workerKey] ||
            !failedModels[workerKey][model] ||
            failedModels[workerKey][model] < 3
        );

        return availableModels.length > 0 ? availableModels[0] : null;
    }

    // Try generating response with enhanced retry logic - try 3 times before switching models
    async function tryGenerateResponseWithFallback(prompt, systemPrompt, model, workerKey) {
        // ... (same as before) ...
        // Track which models we've already tried
        if (!failedModels[workerKey]) {
            failedModels[workerKey] = {};
        }

        // If the current model has already failed 3 times, move to the next one
        if (failedModels[workerKey][model] && failedModels[workerKey][model] >= 3) {
            const nextModel = getNextAvailableModel(workerKey);
            if (nextModel) {
                if (debugMode && debugMode.checked) {
                    addMessageToChatLog('System', `Skipping ${model} (failed ${failedModels[workerKey][model]} times) and using ${nextModel} instead`, 'system debug');
                }
                updateWorkerModel(workerKey, nextModel);
                return generateResponse(prompt, systemPrompt, nextModel, workerKey);
            } else {
                throw new Error(`All models have failed for ${workers[workerKey].name}`);
            }
        }

        try {
            if (debugMode && debugMode.checked) {
                addMessageToChatLog('System', `Attempting with model: ${model}`, 'system debug');
            }

            // Try with retry logic built in
            const response = await RetryHandler.withRetry(
                // The operation to retry
                async (attempt) => {
                    if (attempt > 0) {
                        updateStatus(`Retry #${attempt + 1} with model ${model}...`);
                    }
                    return await generateResponse(prompt, systemPrompt, model);
                },
                // Retry options
                {
                    maxRetries: 2, // Total of 3 attempts (initial + 2 retries)
                    delay: 1000,
                    backoffFactor: 1.5,
                    onRetry: (err, attempt, delay) => {
                        console.warn(`Attempt ${attempt} failed for ${model}, retrying in ${delay}ms: ${err.message}`);
                        if (debugMode && debugMode.checked) {
                            addMessageToChatLog('System', `Retry #${attempt} for ${model} (${delay}ms delay): ${err.message}`, 'system debug');
                        }
                        updateStatus(`Retry #${attempt} with ${model} in ${Math.round(delay / 1000)}s...`);
                    }
                }
            );

            // Success - clear this model from failed models counts
            if (!failedModels[workerKey]) {
                failedModels[workerKey] = {};
            }
            failedModels[workerKey][model] = 0;
            return response;

        } catch (error) {
            // Increment fail count for this model
            failedModels[workerKey][model] = (failedModels[workerKey][model] || 0) + 1;

            // If we still haven't hit the retry limit, try again with the same model
            if (failedModels[workerKey][model] < 3) {
                addMessageToChatLog('System', `${model} failed (attempt ${failedModels[workerKey][model]}). Will try ${3 - failedModels[workerKey][model]} more times before switching models.`, 'system');
                updateStatus(`${model} failed (attempt ${failedModels[workerKey][model]}). Retrying...`);
                // Wait a moment before trying again
                await new Promise(resolve => setTimeout(resolve, 1500));
                return tryGenerateResponseWithFallback(prompt, systemPrompt, model, workerKey);
            }

            // If we've hit the retry limit, try a different model
            if (debugMode && debugMode.checked) {
                addMessageToChatLog('System', `${model} failed ${failedModels[workerKey][model]} times. Switching models.`, 'system debug');
            }

            const nextModel = getNextAvailableModel(workerKey);
            if (nextModel) {
                addMessageToChatLog('System', `${model} failed after multiple attempts. Switching to ${nextModel}...`, 'system');
                updateStatus(`Trying with ${nextModel}...`);

                // Use our new function here
                updateWorkerModel(workerKey, nextModel);

                return await generateResponse(prompt, systemPrompt, nextModel, workerKey);
            } else {
                throw new Error(`All models have failed for ${workers[workerKey].name}`);
            }
        }
    }

    // Add a function to check if the API is available
    async function checkApiAvailability() {
         // ... (same as before) ...
        try {
            const response = await fetch('https://text.pollinations.ai/health', {
                method: 'GET',
                signal: AbortSignal.timeout(5000) // 5-second timeout
            });
            return response.ok;
        } catch (error) {
            console.warn("API health check failed:", error);
            return false;
        }
    }

     // Modified generateResponse function
    async function generateResponse(prompt, systemPrompt, model) {
        try {
            // Check if model is available
            if (window.ModelAvailability && !window.ModelAvailability.isAvailable(model)) {
                const alternative = window.ModelAvailability.findAlternative(model);
                 if (alternative) {
                    console.log(`Model ${model} is blacklisted. Using ${alternative} instead.`);
                    model = alternative;
                }
            }

            // Check if API is reachable
            const isApiAvailable = await ApiConnector.checkHealth();
            if (!isApiAvailable) {
                throw new Error("API service is currently unavailable");
            }
            
            // Check if the model supports internet access (for Gabija, the researcher)
            const workerKey = getCurrentWorkerKey();
            let canUseInternet = false;
            if(workerKey === "researcher") {
                const selectedModel = document.getElementById("researcherModel").selectedOptions[0];
                canUseInternet = selectedModel && selectedModel.dataset.internet === "true";
            }


            // Enhance system prompt
            let enhancedSystemPrompt = `${systemPrompt}

IMPORTANT INSTRUCTIONS:
1. You must respond in plain text format only.
2. Do not include any HTML or markdown code in your response.
3. Always acknowledge and directly respond to the previous message in the collaboration.
4. Keep your response concise but complete and well-structured.
5. Include your specific perspective based on your assigned role.`;
            
            // Add internet access instruction if applicable
            if (canUseInternet) {
                enhancedSystemPrompt += "\n6.  Use your internet access capabilities to find relevant and up-to-date information to support your response. Cite sources where appropriate.";
            }


            // Trim prompt if it's too long
            let trimmedPrompt = prompt;
            if (prompt.length > 12000) {
                console.warn("Prompt exceeds recommended length, trimming to 12000 characters");
                trimmedPrompt = prompt.substring(0, 11900) + "... [text trimmed for length]";
            }

            // Use the ApiConnector to generate text
            let apiOptions = {
                timeout: 45000,
                isPrivate: true,
                forcePost: true,
            };
            // Pass internet access capability to ApiConnector
            if (canUseInternet) {
              apiOptions.internet = true;
            }

            return await ApiConnector.generateText(trimmedPrompt, enhancedSystemPrompt, model, apiOptions);

        } catch (error) {
            console.error(`Error in generateResponse with model ${model}:`, error);

            // Check if this is a 500 server error
            if (error.message.includes('500') || error.message.includes('Server error')) {
                // Mark model as failed in our tracking systems
                if (window.ModelAvailability) {
                    window.ModelAvailability.markFailed(model, 500);
                }

                // Add to our local tracking as well
                const workerKey = getCurrentWorkerKey();
                if (workerKey) {
                    if (!failedModels[workerKey]) {
                        failedModels[workerKey] = {};
                    }

                    failedModels[workerKey][model] = (failedModels[workerKey                    failedModels[workerKey][model] = (failedModels[workerKey][model] || 0) + 3; // Mark as failed 3 times to force switch

                    const nextModel = getNextAvailableModel(workerKey);
                    if (nextModel && nextModel !== model) {
                        console.log(`Model ${model} failed with 500. Trying ${nextModel} automatically.`);
                        updateWorkerModel(workerKey, nextModel);
                        return generateResponse(prompt, systemPrompt, nextModel);
                    }
                }
            }

            throw error;
        }
    }


    // Helper function to get current worker key
    function getCurrentWorkerKey() {
        return workerSequence[currentWorkerIndex];
    }

    function addMessageToChatLog(sender, content, className) {
        // ... (same as before) ...
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${className}`;

        const header = document.createElement('div');
        header.className = 'message-header';

        const senderSpan = document.createElement('span');
        senderSpan.textContent = sender;

        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = new Date().toLocaleTimeString();

        header.appendChild(senderSpan);
        header.appendChild(timeSpan);

        const contentP = document.createElement('p');
        contentP.textContent = content;

        if (sender === 'System' && className === 'system' && content.startsWith('Debug:')) {
            messageDiv.style.fontSize = '0.8em';
            messageDiv.style.opacity = '0.7';
        }

        messageDiv.appendChild(header);
        messageDiv.appendChild(contentP);

        chatLog.appendChild(messageDiv);
        scrollToBottom();
    }

    function addThinkingIndicator(workerName, id) {
         // ... (same as before) ...
        const messageDiv = document.createElement('div');
        messageDiv.className = `message thinking ${workerName === 'Writer' ? 'writer' : workerName === 'Researcher' ? 'researcher' : workerName === 'Critic' ? 'critic' : 'editor'}`;
        messageDiv.id = id;

        const header = document.createElement('div');
        header.className = 'message-header';
        header.textContent = workerName;

        const contentP = document.createElement('p');
        contentP.textContent = 'Thinking...';

        messageDiv.appendChild(header);
        messageDiv.appendChild(contentP);

        chatLog.appendChild(messageDiv);
        scrollToBottom();

        // Add thinking animation to the worker card
        if (window.ErrorAnimations) {
            const workerKey = workerName.toLowerCase();
            ErrorAnimations.showThinkingTooHardAnimation(workerKey);
        }
    }

    function removeThinkingIndicator(id) {
         // ... (same as before) ...
        const element = document.getElementById(id);
        if (element) {
            element.remove();
        }
    }

    function scrollToBottom() {
         // ... (same as before) ...
        chatLog.scrollTop = chatLog.scrollHeight;
    }

    function copyFinalResult() {
         // ... (same as before) ...
        const textToCopy = finalResult.textContent;

        navigator.clipboard.writeText(textToCopy).then(() => {
            updateStatus("Final result copied to clipboard", "success");
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            updateStatus("Failed to copy text", "error");

            // Fallback method for copying
            const textArea = document.createElement('textarea');
            textArea.value = textToCopy;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            updateStatus("Final result copied to clipboard", "success");
        });
    }

    // Format the collaboration history
    function formatCollaborationHistory() {
         // ... (same as before, but slightly simplified) ...
        let historyText = "COLLABORATION HISTORY:\n\n";

        // Make sure the topic is always included
        const topicMessage = conversationHistory.find(msg => msg.role === 'System');
        if (topicMessage) {
            historyText += `Topic: ${topicMessage.content}\n\n`;
        }

        // Get the last few exchanges (not too many to avoid overloading context)
        const maxExchanges = 4; // Only get the last 2 complete exchanges (4 messages)
        const relevantHistory = conversationHistory
            .filter(msg => msg.role !== 'System')
            .slice(-maxExchanges);

        // Add a note if we're truncating history
        if (conversationHistory.length > maxExchanges + 1) { // +1 for the System message
            historyText += "[Earlier conversation omitted for brevity]\n\n";
        }

        relevantHistory.forEach((msg, index) => {
            historyText += `${msg.role}: ${msg.content}\n\n`;

            if (index < relevantHistory.length - 1) {
                historyText += "---\n\n";
            }
        });

        // Apply additional trimming if needed
        return ApiConnector.trimConversationHistory(historyText);
    }

    // Extract the final result
    function extractFinalResult() {
        // ... (same logic as before, but uses the updated cleanUpFinalResult) ...
        // Try to use the editor's final contribution when possible
        const contributions = conversationHistory.filter(msg =>
            msg.role !== 'System' && msg.content && msg.content.length > 100
        );

        // Get the last substantive contribution (from Editor if possible)
        const lastEditorMsg = contributions
            .filter(msg => msg.role === 'Editor')
            .slice(-1)[0];

        if (lastEditorMsg) {
            // Extract just the document content, removing conversational parts
           return cleanUpFinalResult(lastEditorMsg.content);
        }

        // Fallback to writer's text if editor's isn't available
        const lastWriterMsg = contributions
            .filter(msg => msg.role === 'Writer')
            .slice(-1)[0];

        if (lastWriterMsg) {
            // Extract just the document content from writer's text
            return cleanUpFinalResult(lastWriterMsg.content);
        }

        // If no identifiable messages found, fall back to the original method
        return cleanUpFinalResult(conversationHistory[conversationHistory.length - 1]?.content || "");
    }

    // Clean up the final result text
    function cleanUpFinalResult(text) {
        if (!text) return '';

        // Remove any conversational elements, more robust handling of intros/outros.
        let cleaned = text
            .replace(/^.*?(štai ką parašiau|štai mano tekstas|peržiūrėjau tekstą|štai pataisytas tekstas|atsižvelgdama į.*pataisiau|pateikiu galutinę versiją|mano galutinė versija|ačiū visiems).*\s*:/si, '') // Remove intros
            .replace(/(gabija|vytautas|eglė|jonas|tauris|perduodu|tikiuosi|linkiu|su pagarba|šefas|redaktorė|tyrėja|rašytojas|kritikas)[a-zA-ZĄČĘĖĮŠŲŪąčęėįšųū\s,]*$/si, '') // Remove outros and names
            .replace(/as the (writer|researcher|critic|editor|boss).*?:/gi, '') // Remove English intros
            .replace(/i've (drafted|enhanced|evaluated|refined|reviewed).*?:/gi, '')  // Remove English intros
            .replace(/\[CONTENT_START\]/gi, '')
            .replace(/\[CONTENT_END\]/gi, '')
            .trim();

        return cleaned;
    }

    // Display the final result
    function displayFinalResult(resultText) {
        // ... (same as before) ...
        const processedText = cleanUpFinalResult(resultText);
        finalResult.textContent = processedText;
    }

    // Add the downloadAsDocument function

    /**
     * Downloads the final result as a Word document (.docx)
     */
    function downloadAsDocument() {
        // ... (same as before) ...
        try {
            const text = finalResult.textContent || '';

            if (!text.trim()) {
                alert('No content to download');
                return;
            }

            // Create blob with text content
            const blob = new Blob([text], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

            // Create download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');

            // Get title from first line or use default
            let title = text.trim().split('\n')[0].replace(/[^\w\s]/gi, '').trim();
            if (!title || title.length > 50) {
                title = 'document';
            }

            a.href = url;
            a.download = `${title.substring(0, 30)}.docx`;
            document.body.appendChild(a);

            // Trigger download and clean up
            a.click();
            setTimeout(function () {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                updateStatus("Document downloaded", "success");
            }, 0);

        } catch (error) {
            console.error("Error downloading document:", error);
            updateStatus("Error creating document", "error");
        }
    }

   // Thought Process Analysis Functions

    function analyzeThoughtProcess(worker, response) {
      //Basic analysis - just stores previous response as thought
        worker.thoughtProcess.push(response);

        // Limit the thought process history to a reasonable size
        const maxThoughts = 20;
        if(worker.thoughtProcess.length > maxThoughts) {
            worker.thoughtProcess.shift(); // Remove oldest thought
        }
    }


    function displayThoughtProcess(workerKey) {
        const worker = workers[workerKey];
        if (!worker) return;
                const thoughtProcessDiv = document.querySelector(`.${worker.className} .thought-process`);
        if (!thoughtProcessDiv) return;

        thoughtProcessDiv.innerHTML = ''; // Clear previous thoughts

        const title = document.createElement('h4');
        title.textContent = "Mąstymo Procesas:";
        thoughtProcessDiv.appendChild(title);

        const list = document.createElement('ul');
        worker.thoughtProcess.forEach(thought => {
            const listItem = document.createElement('li');
            listItem.textContent = thought;
            list.appendChild(listItem);
        });
        thoughtProcessDiv.appendChild(list);
    }

    // Fix initialization and event listener issues
    document.addEventListener('DOMContentLoaded', () => {
        // ... (rest of your DOMContentLoaded setup, including model population) ...

        // Make sure all button references exist before setting up event listeners
        const copyResultBtn = document.getElementById('copyResultBtn');
        const downloadResultBtn = document.getElementById('downloadResultBtn');

        if (copyResultBtn) {
            copyResultBtn.addEventListener('click', copyFinalResult);
            copyResultBtn.disabled = true;
        }

        if (downloadResultBtn) {
            downloadResultBtn.addEventListener('click', downloadAsDocument);
            downloadResultBtn.disabled = true;
        }

        // Set initial values
        const numExchanges = document.getElementById('numExchanges');
        const delayBetweenExchanges = document.getElementById('delayBetweenExchanges');

        if (numExchanges) {
            maxIterations = parseInt(numExchanges.value);
        }

        if (delayBetweenExchanges) {
            exchangeDelay = parseInt(delayBetweenExchanges.value);
        }

         // Initialize thought process display areas
        for (const workerKey in workers) {
            const worker = workers[workerKey];
            const card = document.querySelector(`.${worker.className}`);
            if (card) {
                const thoughtProcessDiv = document.createElement('div');
                thoughtProcessDiv.className = 'thought-process';
                card.appendChild(thoughtProcessDiv);
            }
        }
    });

    async function checkApiAvailability() {
          // ... (same as before) ...
        try {
            const response = await fetch('https://text.pollinations.ai/health', {
                method: 'GET',
                signal: AbortSignal.timeout(5000) // 5-second timeout
            });
            return response.ok;
        } catch (error) {
            console.warn("API health check failed:", error);
            return false;
        }
    }

    function finalizeCollaboration() {
        // ... (rest of the finalizeCollaboration function, including boss review) ...
         // Before completing, let's add the boss's final review
        if (isCollaborationActive) {
            processFinalBossReview().then(() => {
                completeFinalizeCollaboration();
            }).catch(error => {
                console.error("Error in boss review:", error);
                addMessageToChatLog('System', `Šefas susirgo, bet galutinis tekstas vis tiek paruoštas.`, 'system');
                completeFinalizeCollaboration();
            });
        } else {
            completeFinalizeCollaboration();
        }
    }

    async function processFinalBossReview() {
         // ... (same boss review logic as before, but using the updated prompt format) ...
        const worker = workers[finalWorker];

        // Add thinking indicator
        const thinkingId = `thinking-boss-${Date.now()}`;
        addThinkingIndicator(worker.name, thinkingId);
        updateStatus(`Šefas Tauris apžvelgia rezultatus...`);

        try {
            // Show boss animation
            if (window.ErrorAnimations) {
                ErrorAnimations.showWorkingAnimation('boss');
            }

            // Create a comprehensive prompt for the boss
            let historyText = "";

            if (ApiConnector && typeof ApiConnector.formatConversationForApi === 'function') {
                historyText = ApiConnector.formatConversationForApi(conversationHistory, 12); // Include more context
            } else {
                historyText = formatCollaborationHistory();
            }

            const initialTopic = conversationHistory.find(msg => msg.role === 'System')?.content || "Unknown topic";

            const prompt = `${historyText}

Dabar Tu esi Tauris, biuro šefas.

SVARBU:
- Peržvelk VISŲ darbuotojų (Jono, Gabijos, Vytauto, Eglės) darbą.
- Pateik GALUTINĘ teksto versiją.  Tai TURI būti aukščiausios kokybės, profesionalus, išbaigtas tekstas, tinkamas publikavimui.
- Apjunk visų darbuotojų geriausias dalis į vieną nuoseklų dokumentą.

TEMA: "${initialTopic}"

Reikalavimai:
1. Aiški struktūra (įvadas, dėstymas, išvados).
2. Visi SVARBŪS faktai ir šaltiniai iš Gabijos.
3. Ištaisytos problemos pagal Vytauto kritiką.
4. Eglės atlikti kalbos pataisymai.
5. Jono originalios idėjos ir kūrybiškumas (jei tinka).
6. Visiškai taisyklinga lietuvių kalba.
7. Tekstas turi atitikti pradinę užduotį (straipsnis, blogo įrašas, etc.).

Pradėk nuo: "Ačiū visiems už darbą! Štai mano galutinė šio teksto versija:"`;

            // Get a response from the boss
            const model = worker.model && typeof worker.model === 'function' ? worker.model() : 'openai';
            const response = await generateResponse(prompt, worker.systemPrompt, model);

            // Remove thinking indicator
            removeThinkingIndicator(thinkingId);

            // Stop boss animation
            if (window.ErrorAnimations) {
                ErrorAnimations.stopWorkingAnimation('boss');
            }

            // Add to conversation history
            conversationHistory.push({
                role: worker.name,
                content: response
            });

            // Save as the final result
            latestResult = response;

            // Add the response to the chat log
            addMessageToChatLog(worker.name, response, worker.className);

            analyzeThoughtProcess(worker, response);  // Analyze boss's thought process
            displayThoughtProcess(finalWorker);      // Display boss's thought process
            updateStatus(`Šefas Tauris pateikė galutinį rezultatą!`);

            // Add boss stamp animation to the result
            setTimeout(() => {
                if (window.StampEffects) {
                    StampEffects.showBossApproval();
                }
            }, 1000);

            return response;
        } catch (error) {
            console.error("Error getting boss review:", error);
            removeThinkingIndicator(thinkingId);

            // Stop boss animation
            if (window.ErrorAnimations) {
                ErrorAnimations.stopWorkingAnimation('boss');
            }

            throw error;
        }
    }

    function completeFinalizeCollaboration() {
        // ... (same finalization logic as before) ...
        // Extract final result from the last boss contribution or editor if boss failed
        const finalResultText = extractFinalResult();

        // Display the final result in the dedicated section
        displayFinalResult(finalResultText);

        // Enable only the result section buttons
        if (copyResultBtn) copyResultBtn.disabled = false;
        if (downloadResultBtn) downloadResultBtn.disabled = false;

        if (resultStatus) resultStatus.textContent = '(Completed)';

        stopCollaboration();
        addMessageToChatLog('System', 'Collaboration completed. Final result is available below.', 'system final');
        updateStatus("Collaboration completed", "success");

        // Show the stamp animation
        showCompletedStamp();

        return;
    }

   // Override addMessageToChatLog to use Lithuanian role names
    function addMessageToChatLog(role, message, className = '') {
         // ... (same Lithuanian role name translation as before) ...
        const chatLog = document.getElementById('chatLog');
        if (!chatLog) return;

        const messageEl = document.createElement('div');
        messageEl.className = `message ${className}`;

        // Translate role names to Lithuanian
        let displayRole = role;
        switch (role) {
            case 'Writer':
                displayRole = 'Jonas (Rašytojas)';
                break;
            case 'Researcher':
                displayRole = 'Gabija (Tyrėja)';
                break;
            case 'Critic':
                displayRole = 'Vytautas (Kritikas)';
                break;
            case 'Editor':
                displayRole = 'Eglė (Redaktorė)';
                break;
            case 'Boss':
                displayRole = 'Tauris (Šefas)';
                break;
            case 'System':
                displayRole = 'Sistema';
                break;
            // Keep original name for other roles
        }

        messageEl.innerHTML = `<strong>${displayRole}:</strong> ${message}`;
        chatLog.appendChild(messageEl);

        // Scroll to bottom
        chatLog.scrollTop = chatLog.scrollHeight;

        return messageEl;
    }

    // Fix the finalizeCollaboration function to properly show completion
    const originalFinalizeCollaboration = window.finalizeCollaboration;
    if (typeof originalFinalizeCollaboration === 'function') {
        window.finalizeCollaboration = function () {
            // Call original function
            originalFinalizeCollaboration();

            // Set status to completed and show the stamp
            setResultStatus('completed');
            showCompletedStamp();

            // Add Lithuanian completion message
            if (typeof addMessageToChatLog === 'function') {
                addMessageToChatLog('Sistema', 'Darbas sėkmingai baigtas! Rezultatas pateiktas žemiau. 🎉', 'system final');
            }

            // Update status message
            updateStatus('Collaboration completed');
        };
    }

    // Override worker titles with Lithuanian names
    document.addEventListener('DOMContentLoaded', function () {
        // ... (same Lithuanian name override as before) ...
        // Update worker role titles if not already in Lithuanian
        const workerTitles = {
            'writer': 'Rašytojas Jonas',
            'researcher': 'Tyrėja Gabija',
            'critic': 'Kritikas Vytautas',
            'editor': 'Redaktorė Eglė'
        };

        Object.entries(workerTitles).forEach(([role, name]) => {
            const titleElement = document.querySelector(`.role-card.${role} h3`);
            if (titleElement && !titleElement.textContent.includes('Jonas') &&
                !titleElement.textContent.includes('Gabija') &&
                !titleElement.textContent.includes('Vytautas') &&
                !titleElement.textContent.includes('Eglė')) {
                titleElement.textContent = name;
            }
        });
    });

    // Make sure our updates are available to the window object
    window.updateProgress = updateProgress;
    window.setResultStatus = setResultStatus;
    window.addMessageToChatLog = addMessageToChatLog;
    window.updateStatus = updateStatus;
    window.showCompletedStamp = showCompletedStamp;

    // Add model blacklist monitoring
    document.addEventListener('model-blacklisted', function (event) {
         // ... (same model blacklist handling as before) ...
        const model = event.detail.model;
        console.warn(`Model ${model} has been blacklisted by the system`);

        // Update UI to show the model is blacklisted
        addMessageToChatLog('System', `Model ${model} is experiencing server errors and has been temporarily disabled.`, 'system warning');

        // Check if any of our workers are using this model
        Object.entries(workers).forEach(([key, worker]) => {
            if (worker.model() === model) {
                const alternative = window.ModelAvailability.findAlternative(model);
                if (alternative) {
                    addMessageToChatLog('System', `Switching ${worker.name} from ${model} to ${alternative}`, 'system');
                    updateWorkerModel(key, alternative);
                }
            }
        });
    });
      // Utility function to update worker model selection in UI and worker object
    function updateWorkerModel(workerKey, newModel) {
        // ... (same model update logic as before) ...
        const worker = workers[workerKey];
        if (!worker) return;

        // Update UI select element
        const selectElement = document.getElementById(`${workerKey}Model`);

        if (selectElement) {
            // Check if newModel exists as an option, if not add it temporarily
            let option = selectElement.querySelector(`option[value="${newModel}"]`);
            if (!option) {
                option = document.createElement('option');
                option.value = newModel;
                option.textContent = newModel;
                selectElement.add(option);
            }
             selectElement.value = newModel;
        }

        //Update worker object (if model is a function)
        if(typeof worker.model === 'function'){
            worker.model = () => newModel;
        }
    }

    // Placeholder for functions that might be defined elsewhere
    function updateProgress() { /* Implementation */ }
    function setResultStatus() { /* Implementation */ }
    function showCompletedStamp() { /* Implementation */ }

});

         