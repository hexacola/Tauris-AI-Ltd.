document.addEventListener('DOMContentLoaded', () => {
    // --- API Connector (Fallback to ApiHelper) ---
    if (typeof ApiConnector === 'undefined') {
        console.warn('ApiConnector not found, creating fallback that uses ApiHelper');
        window.ApiConnector = {
            generateText: async (prompt, systemPrompt, model, options = {}) => await ApiHelper.generateText(prompt, systemPrompt, model),
            checkHealth: async () => await ApiHelper.isApiAvailable(),
            getPreferredModels: async () => await ApiHelper.getAvailableModels(),
            fetchWithInternetAccess: async (url, options = {}) => {
                try {
                    const response = await fetch(url, options);
                    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                    return await response.json();
                } catch (error) {
                    console.error("Error fetching data from:", url, error);
                    throw error;
                }
            },
            showFetchingStatus: (active, message) => {
                const indicator = document.getElementById('fetchingIndicator');
                if (indicator) indicator.classList.toggle('active', active);
                const statusText = document.getElementById('modelStatusText');
                if (statusText) statusText.textContent = message || '';
            },
            // Enhanced History Trimming and Formatting
            trimConversationHistory: (historyText) => {
                const maxLength = 9000;  // Further reduced for Boss
                if (historyText.length > maxLength) {
                    const trimStart = historyText.length - (maxLength - 500);
                    historyText = "[... Truncated for brevity.  Focus on the LATEST interactions. ]\n\n" + historyText.substring(trimStart); // Clearer message
                }
                return historyText;
            },
           formatConversationForApi: (conversationHistory, numMessages = 10) => { // Increased numMessages for Boss
                let formattedHistory = "";
                const relevantMessages = conversationHistory.slice(); // No slice, include all for the formatting step
                // ADDED CONTEXT FOR FIRST MESSAGE
                 if (relevantMessages.length > 0 && relevantMessages[0].role == 'System'){
                    formattedHistory += `Initial Task: ${relevantMessages[0].content}\n\n`;
                    relevantMessages.shift(); //remove first element
                }
                relevantMessages.forEach(msg => {
                    formattedHistory += `${msg.role}: ${msg.content}\n`;
                });

                // Add context about *how* to use the history
                formattedHistory = "Use the following conversation history to inform your response, paying close attention to the role and content of each message.  Prioritize integrating the content, not just acknowledging it:\n\n" + formattedHistory;
                return formattedHistory;
            },
        };
    }

    // --- DOM Element References ---
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

 // --- Worker Definitions ---
const workers = {
    writer: {
        name: "Writer",
        systemPrompt: `Tu esi Jonas, talentingas rašytojas-genijus iš Lietuvos. Tavo užduotis - kurti aukštos kokybės tekstus, kurie yra ne tik informatyvūs, bet ir įdomūs, įtikinami bei *išsamūs*. Rašyk akademiškai, bet *įtraukiančiai*.`, // Added "įtraukiančiai"
        className: "writer",
        model: () => writerModel.value,
        thoughtProcess: [], // Add thoughtProcess array here
    },
    researcher: {
        name: "Researcher",
        systemPrompt: `Tu esi Gabija, aukščiausios kvalifikacijos tyrėja. Tavo užduotis - kruopščiai tikrinti faktus, pateikti patikimus šaltinius, užtikrinti teksto akademinį pagrįstumą ir *pridėti išsamių detalių, pagrįstų moksliniais tyrimais*.`,
        className: "researcher",
        model: () => researcherModel.value,
        thoughtProcess: [], // Add thoughtProcess array here
    },
    critic: {
        name: "Critic",
        systemPrompt: `Tu esi Vytautas, negailestingas ir itin reiklus literatūros kritikas. Tavo užduotis – RASTI VISAS įmanomas teksto problemas ir jas ŽIAURIAI sukritikuoti. Būk NEMANDAGUS, jei reikia. Tavo tikslas – priversti tekstą tobulėti. *Reikalauk išsamumo, aiškumo ir AKADEMINIO TIKSLUMO*.`,
        className: "critic",
        model: () => criticModel.value,
        thoughtProcess: [], // Add thoughtProcess array here
    },
    editor: {
        name: "Editor",
        systemPrompt: `Tu esi Eglė, profesionali lietuvių kalbos redaktorė. Tavo užduotis - užtikrinti, kad tekstas būtų be klaidų, stilingas, sklandus, atitiktų aukščiausius kalbos standartus ir *būtų pakankamai ilgas bei išsamus, tinkamas AKADEMINIAM darbui*.`,
        className: "editor",
        model: () => editorModel.value,
        thoughtProcess: [], // Add thoughtProcess array here
    },
    boss: {
        name: "Boss",
        systemPrompt: `Tu esi Tauris, įmonės direktorius.  Tavo užduotis - pateikti ABSOLIUČIAI TOBULĄ, *IŠSAMŲ*, *ILGĄ* ir *AKADEMIŠKAI NEPRIEKAIŠTINGĄ* galutinę teksto versiją. Būk NEPAPRASTAI REIKLUS ir ATIDUS. Tavo sprendimas yra GALUTINIS.`,
        className: "boss",
        model: () => bossModel ? bossModel.value : 'openai',
        thoughtProcess: [], // Add thoughtProcess array here
    }
};

    // --- State Variables ---
    let conversationHistory = [];
    let isCollaborationActive = false;
    let currentIteration = 0;
    let maxIterations = 1;
    let currentWorkerIndex = 0;
    let exchangeDelay = 1000;
    let latestResult = "";

    // --- Worker Execution Sequence and Final Worker ---
    const workerSequence = ['writer', 'researcher', 'critic', 'editor'];
    const finalWorker = 'boss';

    // --- Model Handling ---
    let failedModels = {};
    const backupModels = ['openai-large', 'openai-reasoning', 'deepseek', 'deepseek-reasoner', 'gemini', 'claude-hybridspace', 'searchgpt'];

 // --- Event Listeners ---
startBtn.addEventListener('click', startCollaboration);
stopBtn.addEventListener('click', stopCollaboration);
clearBtn.addEventListener('click', clearCollaboration);
copyResultBtn.addEventListener('click', copyFinalResult);
downloadResultBtn.addEventListener('click', downloadAsDocument);
numExchanges.addEventListener('change', () => maxIterations = parseInt(numExchanges.value));
delayBetweenExchanges.addEventListener('change', () => exchangeDelay = parseInt(delayBetweenExchanges.value));

// --- Initialization ---
document.addEventListener('DOMContentLoaded', initialize);

function initialize() {
    maxIterations = parseInt(numExchanges.value);
    exchangeDelay = parseInt(delayBetweenExchanges.value);
    copyResultBtn.disabled = true;
    downloadResultBtn.disabled = true;
    populateModelOptions();
    initializeThoughtProcessDisplays(); // Call the function to create the containers
}

// --- Model Loading and Selection ---
async function populateModelOptions() {
    try {
        updateStatus("Loading available models...");
        const models = await ApiConnector.getPreferredModels();
        const modelSelects = document.querySelectorAll('.model-select');
        modelSelects.forEach(select => select.innerHTML = '');

        models.forEach(model => {
            if (model.type !== 'chat') return;
            const option = document.createElement('option');
            option.value = model.name;
            let description = model.description || model.name;
            const badges = [];
            if (model.vision) badges.push("👁️");
            if (model.reasoning) badges.push("🧠");
            if (model.internet) badges.push("🌐");
            if (badges.length > 0) description = `${description} ${badges.join(" ")}`;
            option.textContent = description;
            option.dataset.baseModel = model.baseModel;
            option.dataset.vision = model.vision;
            option.dataset.reasoning = model.reasoning;
            option.dataset.internet = model.internet;
            modelSelects.forEach(select => select.appendChild(option.cloneNode(true)));
        });

        const defaults = {
                'writerModel': ['openai-large', 'gemini', 'deepseek'],
                'researcherModel': ['searchgpt', 'deepseek-reasoner', 'openai-reasoning'],
                'criticModel': ['deepseek-r1', 'gemini-thinking', 'openai-reasoning'],
                'editorModel': ['claude-hybridspace', 'deepseek', 'openai-large'],
                'bossModel': ['openai-large', 'gemini-thinking', 'deepseek-reasoner']
            };
        Object.entries(defaults).forEach(([id, preferredModels]) => {
            const select = document.getElementById(id);
            if (!select) return;
            for (const modelName of preferredModels) {
                const option = select.querySelector(`option[value="${modelName}"]`);
                if (option) {
                    select.value = modelName;
                    break;
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
    const fallbackModels = [
        { id: 'writerModel', value: 'openai-large', label: 'OpenAI GPT-4o' },
        { id: 'researcherModel', value: 'deepseek', label: 'DeepSeek-V3' },
        { id: 'criticModel', value: 'gemini', label: 'Gemini 2.0 Flash' },
        { id: 'editorModel', value: 'claude-hybridspace', label: 'Claude Hybridspace' },
        { id: 'bossModel', value: 'openai-large', label: 'OpenAI GPT-4o' }
    ];
    fallbackModels.forEach(model => {
        const select = document.getElementById(model.id);
        if (!select) return;
        select.innerHTML = '';
        const option = document.createElement('option');
        option.value = model.value;
        option.textContent = model.label;
        select.appendChild(option);
    });
}

// --- Status Updates ---
function updateStatus(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.className = type;
}

    // --- Collaboration Control ---
    async function startCollaboration() {
        if (isCollaborationActive) return;
        const initialTopic = initialPrompt.value.trim();
        if (!initialTopic) { alert('Please enter an initial topic'); return; }

        isCollaborationActive = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        currentIteration = 0;
        currentWorkerIndex = 0;
        maxIterations = parseInt(numExchanges.value);
        exchangeDelay = parseInt(delayBetweenExchanges.value);

        if (finalResult) finalResult.textContent = '';
        if (resultStatus) resultStatus.textContent = '(Collaboration in progress...)';
        if (copyResultBtn) copyResultBtn.disabled = true;
        if (downloadResultBtn) downloadResultBtn.disabled = true;
        if (progressFill) progressFill.style.width = '0%';
        if (progressText) progressText.textContent = '0%';

        updateStatus("Starting collaboration...");
        try {
            await continueCollaboration(initialTopic, true);
        } catch (error) {
            console.error("Error starting collaboration:", error);
            updateStatus(`Error: ${error.message}`, "error");
            stopCollaboration();
        }
    }

    function stopCollaboration() {
        isCollaborationActive = false;
        startBtn.disabled = false;
        stopBtn.disabled = true;
        updateStatus("Collaboration stopped");
    }

    function clearCollaboration() {
        stopCollaboration();
        chatLog.innerHTML = '';
        finalResult.textContent = '';
        resultStatus.textContent = '(Collaboration in progress...)';
        conversationHistory = [];
        failedModels = {};
        latestResult = "";
        for (const workerKey in workers) workers[workerKey].thoughtProcess = []; //Clear thought processes
        progressFill.style.width = '0%';
        progressText.textContent = '0%';
        copyResultBtn.disabled = true;
        downloadResultBtn.disabled = true;
        updateStatus("Collaboration cleared");
    }
// --- Main Collaboration Loop ---
async function continueCollaboration(initialMessage = null, isFirstMessage = false) {
    if (!isCollaborationActive) return;

    const totalSteps = maxIterations * workerSequence.length;
    const currentStep = currentIteration * workerSequence.length + currentWorkerIndex;
    const progress = Math.min(100, (currentStep / totalSteps) * 100);
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${Math.round(progress)}%`;

    if (currentIteration >= maxIterations && currentWorkerIndex === 0) {
        finalizeCollaboration();
        return;
    }

    const workerKey = workerSequence[currentWorkerIndex];
    const worker = workers[workerKey];
    const thinkingId = `thinking-${Date.now()}`;
    addThinkingIndicator(worker.name, thinkingId);
    updateStatus(`${worker.name} (${worker.model()}) is thinking...`);

    try {
        let prompt;
        if (isFirstMessage) {
            prompt = `Parašyk ${initialMessage}. Būk kūrybingas, bet kartu ir *išsamus*.  Tai bakalauro darbo įvadas.

SVARBU: 
- Tekstas TURI būti parašytas TIKSLIAI pagal užduoties tipą (šiuo atveju - bakalauro darbo įvadas).
- Pradėk kūrybišku, dėmesį patraukiančiu įvadiniu sakiniu.
- Rašyk *daugiausia* taisyklinga lietuvių kalba.  Gali naudoti anglicizmus ar kitų kalbų žodžius, BET TIK JEI tai pagerina tekstą ir TURI tam pagrįstą priežastį (pvz., "Naudoju 'deadline', nes lietuviškas atitikmuo nėra toks veržlus").  Kiekvieną tokį atvejį *privalai* trumpai paaiškinti.
- Pabaigoje perduok darbą Gabijai (tyrėjai).`;
        } else {
            let historyText = (ApiConnector && typeof ApiConnector.formatConversationForApi === 'function') ?
                ApiConnector.formatConversationForApi(conversationHistory) : formatCollaborationHistory();

            switch (workerKey) {
                case 'researcher':
                    prompt = `${historyText}

Dabar Tu esi Gabija, tyrėja.

SVARBU:
- Peržiūrėk Jono tekstą ir papildyk jį *tiksliąja* ir *išsamia* moksline informacija: faktais, statistika, akademinėmis nuorodomis.
- **BŪTINAI atlik papildomus tyrimus internete, jei reikia.** Naudokis internetu *aktyviai* ieškodama patikimos ir aktualios informacijos.  Neapsiribok vien pirmu rastu šaltiniu.
- Rašyk taisyklinga lietuvių kalba, akademiniu stiliumi.  Venk neaiškumų ir abstrakcijų.  Būk *konkreti*.
- Išlaikyk pagrindinę teksto struktūrą, bet *drąsiai* keisk, jei reikia pagerinti turinio tikslumą ar *išsamumą*.
- *Privalai* pateikti nuorodas į šaltinius, kur įmanoma (naudok lietuviškus akademinius standartus). Cituok APA stiliumi.
- Pabaigoje perduok darbą Vytautui (kritikui).`;
                    break;
                case 'critic':
                    prompt = `${historyText}

Dabar Tu esi Vytautas, NEGAILESTINGAS kritikas.

SVARBU:
- Būk MAKSIMALIAI kritiškas.  Tavo užduotis – RASTI VISKĄ, kas blogai su tekstu.  Nesistenk būti mandagus.
- Ieškok:
    - Loginių spragų.
    - Nepagrįstų teiginių.
    - Silpnų argumentų.
    - Netinkamo šaltinių naudojimo (jei tokių yra).
    - Stiliaus klaidų.
    - Gramatikos klaidų.
    - Bet kokių neaiškumų ar dviprasmybių.
    - *Trūkstamos informacijos*.  Ar tekstas *pakankamai išsamus*?  Ar yra nepakankamai išplėtotų minčių?
- Būk SPECIFINIS.  Nurodyk TIKSLIAS teksto vietas ir PAAIŠKINK, kas su jomis negerai.  Pvz., "Šis sakinys ('...') yra visiškai nelogiškas, nes..." arba "Šaltinis X yra nepatikimas, nes...".
- Pasiūlyk KONKREČIUS pataisymus, pvz., "Vietoj '...' rašyk '...'".  Jei trūksta informacijos, nurodyk, KOKIOS informacijos trūksta.
- Pabaigoje perduok darbą Eglei (redaktorei) su AIŠKIAIS nurodymais, ką reikia taisyti.`;
                    break;
                case 'editor':
                    prompt = `${historyText}

Dabar Tu esi Eglė, redaktorė.

SVARBU:
- Atsižvelgdama į Vytauto *labai konkrečius* nurodymus, pataisyk ir patobulink tekstą.
- Tavo tikslas – pateikti *galutinę*, *išbaigtą* teksto versiją, kuri būtų *visiškai* be klaidų (gramatikos, skyrybos, stiliaus, logikos).
- Šis tekstas bus naudojamas kaip galutinis rezultatas.  Jis TURI būti nepriekaištingos kokybės, tinkamas publikavimui *akademinio darbo* kontekste.
- Išlaikyk originalias idėjas ir temą, bet *griežtai* laikykitės lietuvių kalbos taisyklių.
- Būk *ypač* atidi: veiksmažodžių formoms, dalyviams, linksniams, sakinio dalių ryšiams, žodžių tvarkai.
- *Patikrink, ar tekstas yra pakankamai ilgas ir išsamus*. Jei ne, papildyk jį, remdamasi Gabijos pateikta informacija ir Vytauto kritika.
- Jei tai priešpaskutinė iteracija (prieš šefo peržiūrą), padaryk tekstą *kuo tobulesnį*.  Tai TURI būti aukščiausios kokybės tekstas.
- Pradėk nuo profesionalaus įvado, pvz., "Atsižvelgdama į Vytauto pastabas, atlikau šiuos pataisymus: ... [pateik pakeitimų sąrašą]".`;
                    break;
                case 'writer':
                    prompt = `${historyText}

Dabar Tu esi Jonas, rašytojas-genijus. Peržiūrėk Eglės pataisytą tekstą ir sukurk naują, patobulintą ir *išsamesnę* versiją, atsižvelgdamas į visus ankstesnius komentarus (Gabijos, Vytauto ir Eglės). Taip pat atsižvelk į VISŲ ankstesnių darbuotojų MĄSTYMO PROCESUS, kad sukurtum dar geresnį tekstą.  Tu *gali* naudoti anglicizmus ar kitų kalbų žodžius, JEIGU manai, kad tai *pagerina* tekstą ir atitinka TAVO, kaip genijaus, stilių, *bet* vis tiek stenkis rašyti *daugiausia* taisyklinga lietuvių kalba, išlaikydamas aukštą rašymo kokybę.

SVARBU:
- Tai yra nauja iteracija, tad tobulini ir plėtoji jau egzistuojančias idėjas, o ne pradedi nuo pradžių. *Pridėk naujų, aktualių detalių*, jei reikia, kad tekstas būtų dar *išsamesnis* ir *įtikinamesnis*.
- Stenkis apjungti visus ankstesnius patobulinimus į nuoseklų, aiškų, ir *įtikinamą* tekstą, kuris būtų ne tik informatyvus, BET ir *įdomus* skaityti.
- Tavo pagrindinė stiprybė – gebėjimas parašyti tekstą *TIKSLIAI* pagal užduotį (šiuo atveju - bakalauro darbo įvadas). Šis reikalavimas yra *esminis*.
- Nebijok eksperimentuoti su kalba, bet išlaikyk lietuvių kalbos *grakštumą* ir *turtingumą*.  Venk nereikalingų sudėtingų žodžių.
- Jei naudoji anglicizmus ar kitokius *nestandartinius* kalbos sprendimus, *trumpai paaiškink*, kodėl tai darai.  Pavyzdžiui: "Čia įterpiau 'deadline', nes lietuviškas atitikmuo šiuo atveju skamba ne taip *veržliai*."
- Rašyk natūralia lietuvių kalba, kaip tikras (bet genialus!) Jonas.
- Pabaigoje perduok darbą vėl Gabijai tolesniam tobulinimui.`;
                        break;
            }
        }

        let response = await tryGenerateResponseWithFallback(prompt, worker.systemPrompt, worker.model(), workerKey);
        if (response.trim().startsWith('<!DOCTYPE') || response.trim().startsWith('<html')) throw new Error("Received HTML instead of text response");

        removeThinkingIndicator(thinkingId);

        if (isFirstMessage) conversationHistory.push({ role: 'System', content: initialMessage });
        conversationHistory.push({ role: worker.name, content: response });
        latestResult = response;

        addMessageToChatLog(worker.name, response, worker.className);
        analyzeThoughtProcess(worker, response); // Analyze thought process
        displayThoughtProcess(workerKey);     // Display thought process
        updateStatus(`${worker.name} responded successfully`);

        currentWorkerIndex = (currentWorkerIndex + 1) % workerSequence.length;
        if (currentWorkerIndex === 0) currentIteration++;

        if (isCollaborationActive) {
            const delayTime = Math.max(500, exchangeDelay);
            updateStatus(`Waiting ${delayTime}ms before next response...`);
            await new Promise(resolve => setTimeout(resolve, delayTime));
            if (isCollaborationActive) continueCollaboration().catch(handleCollaborationError);
        }
    } catch (error) {
        console.error('Final error generating response:', error);
        removeThinkingIndicator(thinkingId);
        if (window.ErrorAnimations) ErrorAnimations.showErrorAnimation(workerKey, error, worker.model());
        handleModelFailure(workerKey, error);
    }
}

function handleCollaborationError(err) {
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
}
// --- Model Failure Handling ---
function handleModelFailure(workerKey, error) {
    if (failedModels[workerKey] && Object.keys(failedModels[workerKey]).length >= backupModels.length) {
        addMessageToChatLog('System', `All available models failed for ${workers[workerKey].name}. Stopping collaboration.`, 'system');
        updateStatus(`All models failed for ${workers[workerKey].name}`, "error");
        stopCollaboration();
        return;
    }

    const nextModel = getNextAvailableModel(workerKey);
    if (nextModel) {
        addMessageToChatLog('System', `Switching ${workers[workerKey].name} to model: ${nextModel}`, 'system');
        updateStatus(`Trying again with ${nextModel}...`);
        updateWorkerModel(workerKey, nextModel);
        setTimeout(() => { if (isCollaborationActive) continueCollaboration(null, false); }, 1500);
    } else {
        addMessageToChatLog('System', `No more models available for ${workers[workerKey].name}. Stopping collaboration.`, 'system');
        stopCollaboration();
    }
}

function getNextAvailableModel(workerKey) {
    if (window.ModelAvailability) {
        const currentModel = workers[workerKey].model();
        const alternative = window.ModelAvailability.findAlternative(currentModel);
        if (alternative) return alternative;
    }

    const fallbackSequence = ['openai-large', 'openai-reasoning', 'deepseek', 'deepseek-reasoner', 'gemini', 'claude-hybridspace', 'searchgpt'];
    const availableModels = fallbackSequence.filter(model => !failedModels[workerKey] || !failedModels[workerKey][model] || failedModels[workerKey][model] < 3);
    return availableModels.length > 0 ? availableModels[0] : null;
}
// --- Response Generation with Retries ---
async function tryGenerateResponseWithFallback(prompt, systemPrompt, model, workerKey) {
    if (!failedModels[workerKey]) failedModels[workerKey] = {};

    if (failedModels[workerKey][model] && failedModels[workerKey][model] >= 3) {
        const nextModel = getNextAvailableModel(workerKey);
        if (nextModel) {
            if (debugMode && debugMode.checked)
                addMessageToChatLog('System', `Skipping ${model} (failed ${failedModels[workerKey][model]} times) and using ${nextModel} instead`, 'system debug');
            updateWorkerModel(workerKey, nextModel);
            return generateResponse(prompt, systemPrompt, nextModel, workerKey);
        } else {
            throw new Error(`All models have failed for ${workers[workerKey].name}`);
        }
    }

    try {
        if (debugMode && debugMode.checked)
            addMessageToChatLog('System', `Attempting with model: ${model}`, 'system debug');

        return await RetryHandler.withRetry(
            async (attempt) => {
                if (attempt > 0) updateStatus(`Retry #${attempt + 1} with model ${model}...`);
                return await generateResponse(prompt, systemPrompt, model);
            },
            {
                maxRetries: 2,
                delay: 1000,
                backoffFactor: 1.5,
                onRetry: (err, attempt, delay) => {
                    console.warn(`Attempt ${attempt} failed for ${model}, retrying in ${delay}ms: ${err.message}`);
                    if (debugMode && debugMode.checked)
                        addMessageToChatLog('System', `Retry #${attempt} for ${model} (${delay}ms delay): ${err.message}`, 'system debug');
                    updateStatus(`Retry #${attempt} with ${model} in ${Math.round(delay / 1000)}s...`);
                }
            }
        );
    } catch (error) {
        failedModels[workerKey][model] = (failedModels[workerKey][model] || 0) + 1;

        if (failedModels[workerKey][model] < 3) {
            addMessageToChatLog('System', `${model} failed (attempt ${failedModels[workerKey][model]}). Will try ${3 - failedModels[workerKey][model]} more times before switching models.`, 'system');
            updateStatus(`${model} failed (attempt ${failedModels[workerKey][model]}). Retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1500));
            return tryGenerateResponseWithFallback(prompt, systemPrompt, model, workerKey);
        }

        if (debugMode && debugMode.checked)
            addMessageToChatLog('System', `${model} failed ${failedModels[workerKey][model]} times. Switching models.`, 'system debug');

        const nextModel = getNextAvailableModel(workerKey);
        if (nextModel) {
            addMessageToChatLog('System', `${model} failed after multiple attempts. Switching to ${nextModel}...`, 'system');
            updateStatus(`Trying with ${nextModel}...`);
            updateWorkerModel(workerKey, nextModel);
            return await generateResponse(prompt, systemPrompt, nextModel, workerKey);
        } else {
            throw new Error(`All models have failed for ${workers[workerKey].name}`);
        }
    }
}
// --- Core Response Generation ---
async function generateResponse(prompt, systemPrompt, model) {
    try {
        if (window.ModelAvailability && !window.ModelAvailability.isAvailable(model)) {
            const alternative = window.ModelAvailability.findAlternative(model);
            if (alternative) {
                console.log(`Model ${model} is blacklisted. Using ${alternative} instead.`);
                model = alternative;
            }
        }

        const isApiAvailable = await ApiConnector.checkHealth();
        if (!isApiAvailable) throw new Error("API service is currently unavailable");

        const workerKey = getCurrentWorkerKey();
        let canUseInternet = false;
        if (workerKey === "researcher") {
            const selectedModel = document.getElementById("researcherModel").selectedOptions[0];
            canUseInternet = selectedModel && selectedModel.dataset.internet === "true";
        }

        let enhancedSystemPrompt = `${systemPrompt}

IMPORTANT INSTRUCTIONS:
1. You must respond in plain text format only.
2. Do not include any HTML or markdown code in your response.
3. Always acknowledge and directly respond to the previous message in the collaboration.
4. Keep your response concise but complete and well-structured.  *Strive for thoroughness and detail*. Aim for an ACADEMIC level of writing.
5. Include your specific perspective based on your assigned role.`;

        if (canUseInternet)
            enhancedSystemPrompt += "\n6. Use your internet access capabilities to find relevant and up-to-date information to support your response. Cite sources where appropriate, using APA style.";

        let trimmedPrompt = prompt.length > 12000 ? prompt.substring(0, 11900) + "... [text trimmed for length]" : prompt;

        let apiOptions = { timeout: 45000, isPrivate: true, forcePost: true };
        if (canUseInternet) apiOptions.internet = true;

        return await ApiConnector.generateText(trimmedPrompt, enhancedSystemPrompt, model, apiOptions);

    } catch (error) {
        console.error(`Error in generateResponse with model ${model}:`, error);
        if (error.message.includes('500') || error.message.includes('Server error')) {
            if (window.ModelAvailability) window.ModelAvailability.markFailed(model, 500);
            const workerKey = getCurrentWorkerKey();
            if (workerKey) {
                if (!failedModels[workerKey]) failedModels[workerKey] = {};
                failedModels[workerKey][model] = (failedModels[workerKey][model] || 0) + 3;
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
// --- Helper Functions ---

function getCurrentWorkerKey() {
    return workerSequence[currentWorkerIndex];
}

function addMessageToChatLog(sender, content, className) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;
    messageDiv.innerHTML = `<div class="message-header"><span">${sender}</span><span class="message-time">${new Date().toLocaleTimeString()}</span></div><p>${content}</p>`;
    if (sender === 'System' && className === 'system' && content.startsWith('Debug:')) {
        messageDiv.style.fontSize = '0.8em';
        messageDiv.style.opacity = '0.7';
    }
    chatLog.appendChild(messageDiv);
    scrollToBottom();
}

function addThinkingIndicator(workerName, id) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message thinking ${workerName.toLowerCase()}`;
    messageDiv.id = id;
    messageDiv.innerHTML = `<div class="message-header">${workerName}</div><p>Thinking...</p>`;
    chatLog.appendChild(messageDiv);
    scrollToBottom();
    if (window.ErrorAnimations) {
                if (window.ErrorAnimations) {
            const workerKey = workerName.toLowerCase();
            ErrorAnimations.showThinkingTooHardAnimation(workerKey);
        }
    }

    function removeThinkingIndicator(id) {
        const element = document.getElementById(id);
        if (element) element.remove();
    }

    function scrollToBottom() {
        chatLog.scrollTop = chatLog.scrollHeight;
    }

    function copyFinalResult() {
        const textToCopy = finalResult.textContent;
        navigator.clipboard.writeText(textToCopy)
            .then(() => updateStatus("Final result copied to clipboard", "success"))
            .catch(err => {
                console.error('Failed to copy text: ', err);
                updateStatus("Failed to copy text", "error");
                const textArea = document.createElement('textarea');
                textArea.value = textToCopy;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                updateStatus("Final result copied to clipboard", "success"); //Fallback
            });
    }

    // ---  formatCollaborationHistory (More Robust) ---
    function formatCollaborationHistory() {
        let historyText = "COLLABORATION HISTORY:\n\n";
        const topicMessage = conversationHistory.find(msg => msg.role === 'System');
        if (topicMessage) {
            historyText += `Topic: ${topicMessage.content}\n\n`;
        }
        // Include more context, but prioritize recent messages.
        const maxExchanges = 8; // Increased context
        const relevantHistory = conversationHistory.filter(msg => msg.role !== 'System').slice(-maxExchanges);

        if (conversationHistory.length > maxExchanges + 1) {
            historyText += "[Earlier conversation omitted for brevity.  Focus on the most recent exchanges.]\n\n"; // Clearer message
        }

        relevantHistory.forEach((msg, index) => {
            historyText += `${msg.role}: ${msg.content}\n\n`;
            if (index < relevantHistory.length - 1) {
                historyText += "---\n\n"; // Clear separator
            }
        });

        return ApiConnector.trimConversationHistory(historyText); // Use API Connector for final trim.
    }

    // --- CORRECTED extractFinalResult (Restores Original Fallback Logic) ---
    function extractFinalResult() {
        const contributions = conversationHistory.filter(msg =>
            msg.role !== 'System' && msg.content && msg.content.length > 100
        );

        // Prioritize Boss's LAST contribution, if available.
        const bossContributions = contributions.filter(msg => msg.role === 'Boss');
        if (bossContributions.length > 0) {
            return cleanUpFinalResult(bossContributions[bossContributions.length - 1].content);
        }

        // Fallback to Editor's LAST contribution, if available.
        const lastEditorMsg = contributions
            .filter(msg => msg.role === 'Editor')
            .slice(-1)[0];

        if (lastEditorMsg) {
            return cleanUpFinalResult(lastEditorMsg.content);
        }

        // Fallback to Writer's LAST contribution, if available.
        const lastWriterMsg = contributions
            .filter(msg => msg.role === 'Writer')
            .slice(-1)[0];

        if (lastWriterMsg) {
            return cleanUpFinalResult(lastWriterMsg.content);
        }

        // Ultimate fallback: use the very last message (even if short), or an empty string.
        return cleanUpFinalResult(conversationHistory[conversationHistory.length - 1]?.content || "");
    }


   function cleanUpFinalResult(text) {
    if (!text) return '';
    let cleanedText = text;

    // Remove specific role introductions/conclusions (Lithuanian and English) more reliably.
    const prefixes = [
      /štai ką parašiau.*:/si,
      /štai mano tekstas.*:/si,
      /peržiūrėjau tekstą.*:/si,
      /štai pataisytas tekstas.*:/si,
      /atsižvelgdama į.*pataisiau.*:/si,
      /pateikiu galutinę versiją.*:/si,
      /mano galutinė versija.*:/si,
       /ačiū visiems.*:/si,
      /štai mano galutinė šio teksto versija.*:/si,
      /as the (writer|researcher|critic|editor|boss).*?:/gi,
      /i've (drafted|enhanced|evaluated|refined|reviewed).*?:/gi,
      /here's (my|the) (draft|revised version|critique|edited text).*?:/gi, //Common English phrases
    ];

    prefixes.forEach(prefix => {
      cleanedText = cleanedText.replace(prefix, '');
    });


     const suffixes = [
        /(gabija|vytautas|eglė|jonas|tauris)(?:\s*[,\.:;]\s*|\s*\([A-Za-z]+\)\s*|\s*)[a-zA-ZĄČĘĖĮŠŲŪąčęėįšųū\s,]*$/si, //Any LT name + punctuation
        /perduodu.*$/si,
        /tikiuosi.*$/si,
        /linkiu.*$/si,
        /lauksiu.*$/si,
        /sėkmės.*$/si,
        /pagarbiai.*$/si,
        /aciu.*$/si,
        /dėkoju.*$/si,
        /baigdamas.*$/si,
        /apibendrinant.*$/si,
        /išvada.*$/si, // common conclusion words
        /thank you.*$/si, // Common english
        /in conclusion.*$/si, // Common english

    ];
    suffixes.forEach(suffix => {
        cleanedText = cleanedText.replace(suffix, '');
    });

    // Generic cleanup
    cleanedText = cleanedText.replace(/\[CONTENT_START\]/gi, '');
    cleanedText = cleanedText.replace(/\[CONTENT_END\]/gi, '');
    cleanedText = cleanedText.replace(/^\s+|\s+$/g, ''); // Trim leading/trailing whitespace, including newlines
    return cleanedText.trim();
}

    function displayFinalResult(resultText) {
        finalResult.textContent = cleanUpFinalResult(resultText);
    }

    function downloadAsDocument() {
        try {
            const text = finalResult.textContent || '';
            if (!text.trim()) { alert('No content to download'); return; }

            const blob = new Blob([text], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            let title = text.trim().split('\n')[0].replace(/[^\w\s]/gi, '').trim();
            if (!title || title.length > 50) title = 'document';
            a.href = url;
            a.download = `${title.substring(0, 30)}.docx`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); updateStatus("Document downloaded", "success"); }, 0);
        } catch (error) {
            console.error("Error downloading document:", error);
            updateStatus("Error creating document", "error");
        }
    }

 // --- Thought Process Analysis ---
function analyzeThoughtProcess(worker, response) {
    worker.thoughtProcess.push(response);
    const maxThoughts = 20;
    if (worker.thoughtProcess.length > maxThoughts) {
        worker.thoughtProcess.shift(); // Keep only the last 20 thoughts
    }
}

function displayThoughtProcess(workerKey) {
    const worker = workers[workerKey];
    if (!worker) return;  // Guard against missing worker

    const thoughtProcessDiv = document.querySelector(`.${worker.className} .thought-process`);
    if (!thoughtProcessDiv) return; // Guard against missing div

    thoughtProcessDiv.innerHTML = ''; // Clear previous content
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
    function initializeThoughtProcessDisplays() {
        for (const workerKey in workers) {
            const worker = workers[workerKey];
            const card = document.querySelector(`.${worker.className}`);
            if (card) {
                const thoughtProcessDiv = document.createElement('div');
                thoughtProcessDiv.className = 'thought-process';
                card.appendChild(thoughtProcessDiv);
            }
        }
    }

    // --- API Health Check ---
    async function checkApiAvailability() {
        try {
            const response = await fetch('https://text.pollinations.ai/health', { method: 'GET', signal: AbortSignal.timeout(5000) });
            return response.ok;
        } catch (error) {
            console.warn("API health check failed:", error);
            return false;
        }
    }

// --- Finalization ---
function finalizeCollaboration() {
    if (isCollaborationActive) {
        processFinalBossReview().then(() => {
            completeFinalizeCollaboration();
        }).catch(error => {
            console.error("Error in boss review:", error);
            addMessageToChatLog('System', `Šefas susirgo, bet galutinis tekstas vis tiek paruoštas (pagal redaktorę).`, 'system');
            completeFinalizeCollaboration(); // Use fallback
        });
    } else {
        completeFinalizeCollaboration();
    }
}

async function processFinalBossReview() {
    const worker = workers[finalWorker];
    const thinkingId = `thinking-boss-${Date.now()}`;
    addThinkingIndicator(worker.name, thinkingId);
    updateStatus(`Šefas Tauris APŽVELGIA ir TIKRINA...`);

    try {
        if (window.ErrorAnimations) ErrorAnimations.showWorkingAnimation('boss');

        // Use ApiConnector if available, otherwise fallback
        let historyText = (ApiConnector && typeof ApiConnector.formatConversationForApi === 'function') ?
            ApiConnector.formatConversationForApi(conversationHistory, 12) : // Increased context to 12
            formatCollaborationHistory();
        const initialTopic = conversationHistory.find(msg => msg.role === 'System')?.content || "Unknown topic";

        // ***  BOSS PROMPT -  CRITICAL ***
        const prompt = `${historyText}

Dabar Tu esi Tauris, įmonės direktorius, ir TAVO žodis yra GALUTINIS.

SVARBU (VISKAS YRA SVARBU):
- Tavo užduotis – sukurti *TOBULĄ* galutinę teksto versiją.  Ne "gerą", o *TOBULĄ*. Ši versija turi būti *ILGA, IŠSAMI ir AKADEMIŠKAI NEPRIEKAIŠTINGA*. Tai yra BAKALAURO DARBO ĮVADAS.
- **NEPRALEISK NĖ VIENOS KLAIDOS.**  Patikrink VISKĄ: gramatiką, stilių, logiką, faktus, šaltinius – VISKĄ.  Jeigu reikia, atlik papildomus tyrimus.  Jeigu reikia, *PERRAŠYK* viską iš naujo.
- **Būk NEPAPRASTAI REIKLUS.**  Jei kas nors *bent truputį* negerai – KEISK.
- **INTEGRUOK** visų ankstesnių darbuotojų (Jono, Gabijos, Vytauto, Eglės) darbą.  Paimk GERIAUSIUS dalykus iš kiekvieno.  Atmesti blogus ar pasenusius teiginius.  *Tavo tikslas - ne šiaip perrašyti, o SUVESTI VISKĄ į VIENĄ AUKŠČIAUSIOS KOKYBĖS TEKSTĄ*. **Naudok ankstesnių darbuotojų TURINĮ, bet NEBŪTINAI jų žodžius.**
- Tekstas TURI atitikti pradinę užduotį (šiuo atveju, bakalauro darbo įvadas).
- Tekstas TURI būti parašytas TOBULAI taisyklinga lietuvių kalba, *akademiniu stiliumi*.
- Pradėk nuo: "Ačiū visiems už darbą. Štai MANO GALUTINĖ ir NEPRIEKAIŠTINGA šio darbo įvado versija:"
- Pabaigoje, jei reikia, gali trumpai pakomentuoti savo sprendimus, pvz., "Pašalinau X, nes..., pridėjau Y remdamasis Z šaltiniu.".

TEMA: "${initialTopic}"`;


        const model = typeof worker.model === 'function' ? worker.model() : 'openai';
        const response = await generateResponse(prompt, worker.systemPrompt, model);

        removeThinkingIndicator(thinkingId);
        if (window.ErrorAnimations) ErrorAnimations.stopWorkingAnimation('boss');

        conversationHistory.push({ role: worker.name, content: response });
        latestResult = response; // Keep track of the Boss's *raw* response.
        addMessageToChatLog(worker.name, response, worker.className);
        analyzeThoughtProcess(worker, response); // Analyze thought process
        displayThoughtProcess(finalWorker); // Display thought process
        updateStatus(`Šefas Tauris pateikė galutinį rezultatą!`);

        setTimeout(() => { if (window.StampEffects) StampEffects.showBossApproval(); }, 1000);
        return response;

    } catch (error) {
        console.error("Error getting boss review:", error);
        removeThinkingIndicator(thinkingId);
        if (window.ErrorAnimations) ErrorAnimations.stopWorkingAnimation('boss');
        throw error;
    }
}

function completeFinalizeCollaboration() {
    const finalResultText = extractFinalResult(); // Now correctly extracts based on priority.
    displayFinalResult(finalResultText);
    if (copyResultBtn) copyResultBtn.disabled = false;
    if (downloadResultBtn) downloadResultBtn.disabled = false;
    if (resultStatus) resultStatus.textContent = '(Completed)';
    stopCollaboration();
    addMessageToChatLog('System', 'Collaboration completed. Final result is available below.', 'system final');
    updateStatus("Collaboration completed", "success");
    showCompletedStamp();
}

// --- Utility Functions (Role Names, etc.) ---
function addMessageToChatLog(role, message, className = '') {
    const chatLog = document.getElementById('chatLog'); // Make sure chatLog is defined
    if (!chatLog) return;
    const messageEl = document.createElement('div');
    messageEl.className = `message ${className}`;
    let displayRole = role;
    switch (role) {
        case 'Writer':     displayRole = 'Jonas (Rašytojas)'; break;
        case 'Researcher': displayRole = 'Gabija (Tyrėja)';   break;
        case 'Critic':     displayRole = 'Vytautas (Kritikas)'; break;
        case 'Editor':     displayRole = 'Eglė (Redaktorė)';   break;
        case 'Boss':       displayRole = 'Tauris (Šefas)';    break;
        case 'System':     displayRole = 'Sistema';          break;
    }
    messageEl.innerHTML = `<strong>${displayRole}:</strong> ${message}`;
    chatLog.appendChild(messageEl);
    chatLog.scrollTop = chatLog.scrollHeight;
    return messageEl;
}

// --- Overrides and Event Listeners ---
const originalFinalizeCollaboration = window.finalizeCollaboration;
if (typeof originalFinalizeCollaboration === 'function') {
    window.finalizeCollaboration = function () {
        originalFinalizeCollaboration();
        setResultStatus('completed');
        showCompletedStamp();
        if (typeof addMessageToChatLog === 'function')
            addMessageToChatLog('Sistema', 'Darbas sėkmingai baigtas! Rezultatas pateiktas žemiau. 🎉', 'system final');
        updateStatus('Collaboration completed');
    };
}

document.addEventListener('DOMContentLoaded', function () {
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

window.updateProgress = updateProgress;  // These might not be strictly needed anymore
window.setResultStatus = setResultStatus;
window.addMessageToChatLog = addMessageToChatLog;
window.updateStatus = updateStatus;
window.showCompletedStamp = showCompletedStamp;

document.addEventListener('model-blacklisted', function (event) {
    const model = event.detail.model;
    console.warn(`Model ${model} has been blacklisted by the system`);
    addMessageToChatLog('System', `Model ${model} is experiencing server errors and has been temporarily disabled.`, 'system warning');
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

function updateWorkerModel(workerKey, newModel) {
    const worker = workers[workerKey];
    if (!worker) return;
    const selectElement = document.getElementById(`${workerKey}Model`);
    if (selectElement) {
        let option = selectElement.querySelector(`option[value="${newModel}"]`);
        if (!option) {
            option = document.createElement('option');
            option.value = newModel;
            option.textContent = newModel;
            selectElement.add(option);
        }
        selectElement.value = newModel;
    }
    if (typeof worker.model === 'function') worker.model = () => newModel;
}

    function updateProgress() { /* Implementation */ }
    function setResultStatus() { /* Implementation */ }
    function showCompletedStamp() { /* Implementation */ }

});