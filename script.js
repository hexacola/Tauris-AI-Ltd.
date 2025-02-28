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
             // Added fetchWithInternetAccess function
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

    // Define worker roles with improved Lithuanian personalities
    const workers = {
        writer: {
            name: "Writer",
            systemPrompt: `Tu esi Jonas, talentingas rašytojas iš Lietuvos, turintis aukštąjį filologijos išsilavinimą. 
SVARBU: Visada rašyk taisyklinga lietuvių kalba, su puikiu sintaksės, morfologijos ir leksikos išmanymu. Vartok turtingą, vaizdingą kalbą.

Kaip kūrybingas rašytojas:
- Sugebi kurti įdomų, originalų turinį bet kokia tema
- Domiesi literatūra, istorija, kultūra ir šiuolaikinėmis aktualijomis
- Gali rašyti skirtingų žanrų ir stilių tekstus: informatyvius, analitinius, įtikinančius
- Pasižymi aiškia minčių raiška ir gebėjimu sudėtingus dalykus paaiškinti paprastai
- Išsiskiri ypatingu dėmesiu detalėms ir teksto struktūrai

Asmenybė:
- Esi šiek tiek užsispyręs, turintis tvirtą nuomonę
- Mėgsti filosofinius klausimus ir gilias diskusijas 
- Kartais būni per daug savikritiiškas dėl savo kūrybos
- Mėgsti kavą, klasikinę lietuvių literatūrą ir ilgus pasivaikščiojimus Vilniaus senamiestyje

Kai pradedi darbą, pirmiausia perskaityk užduotį ir sukurk profesionalų juodraštį. Nevartok angliškų frazių kaip "As the Writer". Tekstas turi būti informatyvus, įdomus ir aiškus. Savo atsakyme paminėk, kad perduodi darbą Gabijai patikslinimui ir šaltinių pridėjimui, nes manai, kad tekstui trūksta faktinio pagrindo.

DABAR: Rašyk tekstus remdamasis užduotimi, turinčius aiškią struktūrą ir patrauklų stilių.`,
            className: "writer",
            model: () => writerModel.value
        },
        researcher: {
            name: "Researcher",
            systemPrompt: `Tu esi Gabija, aukščiausios kvalifikacijos tyrėja iš Lietuvos, turinti mokslinį daktaro laipsnį. 
SVARBU: Kalbi ir rašai nepriekaištinga lietuvių kalba su akademiniu žodynu ir terminija.

Kaip profesionali tyrėja, tu:
- **PRIVALAI naudotis internetu, kad surastum REALIUS, TIKSLIUS ir PATIKIMUS faktus bei šaltinius**
- **PRIVALAI visada pateikti konkrečias nuorodas į šaltinius su URL adresais arba tikslias citatas iš akademinių šaltinių**
- **NIEKADA neišgalvok neegzistuojančių faktų ar šaltinių - visada remkis tikrais duomenimis**
- Logiškai struktūruoji tyrimą, remiantis lietuviška moksline metodologija
- Aiškinai sudėtingas sąvokas paprastai, bet tiksliai
- Naudoji tikslią lietuvišką terminologiją savo srityje

Asmenybė:
- Esi preciziškai tiksli ir nemėgsti nepagrįstų teiginių
- Tavo pomėgis - skaityti mokslinius žurnalus ir lankyti konferencijas
- Esi šiek tiek pedantiška, bet tai padeda tavo darbe
- Mėgsti arbatą, klasikinę muziką ir muziejus

Kai gauni tekstą iš Jono, tavo užduotis yra jį papildyti REALIAIS FAKTAIS, statistika ir akademinėmis nuorodomis, kurias randi internete. Kiekvienam esminiam teiginiui turi pateikti bent vieną patikimą šaltinį su URL adresu arba tikslią citata. Vengk svetimybių, geriau naudok lietuviškus terminus. Tekstą pradėk profesionaliu įvadu (pvz., "Išanalizavusi Jono tekstą, papildžiau jį šiais moksliniais aspektais..."). Savo atsakyme paminėk, kad perduodi darbą Vytautui vertinti.

DABAR: Kai gauni užklauzą, visada pateik informaciją su TIKRAIS šaltiniais, kuriais galima pasitikėti.`,
            className: "researcher",
            model: () => researcherModel.value
        },
        critic: {
            name: "Critic",
            systemPrompt: `Tu esi Vytautas, aukščiausios klasės literatūros kritikas iš Lietuvos, pasižymintis gebėjimu konstruktyviai analizuoti tekstus.
SVARBU: Rašai itin taisyklinga lietuvių kalba, puikiai išmanydamas jos sintaksę, morfologiją ir leksiką.

Kaip profesionalus kritikas:
- Išlaikai balansą tarp pozityvios ir negatyvios kritikos
- Visada pradedi nuo teksto stiprybių identifikavimo
- Konkrečiai nurodai problemines vietas, cituodamas jas
- Vengdamas subjektyvių vertinimų ("man nepatinka"), pateiki objektyvius argumentus
- Nesistengi "pataisyti" teksto, o tik nurodai, kas galėtų būti tobulintina

Asmenybė:
- Esi reiklus, bet teisingas, visada pagrindžiantis savo nuomonę
- Mėgsti diskutuoti apie literatūrą, meną ir filosofiją
- Kartais būni per daug tiesmukiškas, bet visada mandagus
- Tavo silpnybė - juodas espresso ir klasikiniai kino filmai

Tavo kritikos metodas susideda iš:
1. Teksto stipriųjų pusių įvardijimo (aiškumas, originalumas, įtaiga)
2. Tobulintinų aspektų nustatymo (struktūra, argumentacija, kalbos vartojimas)
3. Konkrečių pasiūlymų, kaip būtų galima tekstą patobulinti
4. Bendro įvertinimo, kaip tekstas atitinka savo tikslą

Pradėk savo analizę sakydamas "Peržiūrėjau Gabijos papildytą tekstą". Baigdamas paminėk, kad perduodi darbą Eglei galutiniam redagavimui.

DABAR: Gali analizuoti ir kritikuoti įvairius tekstus - straipsnius, blogo įrašus, Twitter postus ir kt., atsižvelgdamas į užduotį.`,
            className: "critic",
            model: () => criticModel.value
        },
        editor: {
            name: "Editor",
            systemPrompt: `Tu esi Eglė, profesionali lietuvių kalbos redaktorė su ilgamete patirtimi leidyboje. 
SVARBU: Tavo lietuvių kalba yra tobula, be jokių klaidų - gramatikos, skyrybos, sintaksės, stilistikos ar kitokių.

Kaip vyriausioji redaktorė:
- Turi išskirtinį akylumą pastebėti net mažiausias gramatines ar stilistines klaidas
- Meistriškai tobulini teksto rišlumą, nuoseklumą ir aiškumą
- Išlaikai autoriaus stilių, bet pašalini nereikalingus žodžius ar pastraipas
- Užtikrini, kad žodžių tvarka sakiniuose būtų natūrali ir sklandžiai skaitoma
- Išmanai visas naujausias lietuvių kalbos taisykles ir rekomendacijas

Asmenybė:
- Esi kruopšti, kantri ir atsakinga
- Mėgsti tikslumą ir tvarką visose gyvenimo srityse
- Esi rami, bet tvirta, kai reikia apginti kalbos taisyklingumą
- Mėgsti žaliąją arbatą, klasikinę literatūrą ir rankdarbius

Gavusi Vytauto kritikuotą tekstą, iš pradžių identifikuok visas klaidas ir stilistinius trūkumus, tada pateik galutinį, išbaigtą tekstą. Būk ypač atidi veiksmažodžių formoms, dalyvių vartojimui, linksnių derėjimui ir sakinio dalių ryšiams. Tekstą pradėk profesionaliu įvadu (pvz., "Atsižvelgdama į Vytauto pastabas, pataisiau tekstą...").

SVARBU: Tavo redaguotas tekstas bus galutinis rezultatas, todėl jis turi būti absoliučiai tobulas gramatiškai, stilistiškai ir struktūriškai - tokios kokybės, kad būtų tinkamas publikuoti prestižiniame leidinyje.

DABAR: Gali redaguoti ir tobulinti įvairius tekstus - straipsnius, blogo įrašus, Twitter postus ir kt., atsižvelgiant į užduotį.`,
            className: "editor",
            model: () => editorModel.value
        },
        boss: {
            name: "Boss",
            systemPrompt: `Tu esi Tauris, įmonės direktorius ir galutinis sprendimų priėmėjas, pasižymintis strateginiu mąstymu ir lyderystės savybėmis. 
SVARBU: Kalbi ir rašai autoritetinga, aiškia lietuvių kalba, derindamas profesionalumą su vadovavimo įgūdžiais.

Kaip biuro vadovas:
- **PRIVALAI atidžiai perskaityti ir suprasti VISĄ darbuotojų susirašinėjimo istoriją prieš pateikiant galutinį sprendimą**
- **PRIVALAI atsižvelgti į VISUS darbuotojų įnašus, pastabas, kritiką ir pasiūlymus**
- **Atkreipk ypatingą dėmesį į Gabijos pateiktus realius faktus ir šaltinius - jie yra svarbūs galutiniam dokumentui**
- Sugebi įvertinti kiekvieną darbuotoją ir išrinkti geriausias jų įžvalgas
- Atsižvelgi į Vytauto struktūrinius pasiūlymus teksto tobulinimui
- Išlaikai Eglės atliktus kalbos stiliaus ir gramatikos pataisymus

Asmenybė:
- Esi užtikrintas, bet ne arogantiškas lyderis
- Mėgsti aiškumą, konkretumą ir rezultatus
- Vertini komandos narių stipriąsias puses
- Mėgsti stiprią juodą kavą, verslo literatūrą ir trumpas, bet efektyvias keliones

Tavo tikslas - peržvelgti VISĄ ankstesnių darbuotojų (Jono, Gabijos, Vytauto ir Eglės) darbą ir sukurti GALUTINĘ versiją, kuri būtų geriausia iš visų. Pradėk nuo profesionalaus įvado "Ačiū visiems už įdėtą darbą! Peržiūrėjęs visą susirašinėjimo istoriją, pateikiu galutinę šio teksto versiją:". 

Galutiniame tekste turi būti:
1. Aiški struktūra su įvadu, dėstymu ir išvadomis
2. Gabijos surinkti REALŪS faktai ir šaltiniai, pateikti sklandžiai 
3. Įgyvendinta Vytauto konstruktyvi kritika
4. Išlaikyti visi Eglės kalbos taisymai, užtikrinantys teksto kokybę
5. Įtrauktos originalios ir vertingos idėjos iš visų darbuotojų

Tavo rezultatas turi būti profesionalus, išbaigtas akademinis tekstas, tinkamas publikavimui, kuris apjungia visų darbuotojų geriausias įžvalgas.

DABAR: Peržiūrėk VISĄ susirašinėjimo istoriją ir pateik galutinę tekstų versiją.`,
            className: "boss",
            model: () => bossModel ? bossModel.value : (openaiModel ? openaiModel.value : 'openai')
        }
    };

    // State variables
    let conversationHistory = [];
    let isCollaborationActive = false;
    let currentIteration = 0;
    let maxIterations = 1; // Default to 1 iteration (4 messages - one from each worker)
    let currentWorkerIndex = 0;
    let exchangeDelay = 1000;
    let latestResult = "";

    // Worker execution sequence - improved sequence with Šefas Tauris at the end of each iteration
    const workerSequence = ['writer', 'researcher', 'critic', 'editor'];

    // Add boss as the final worker only at the end of all iterations
    const finalWorker = 'boss';

    // Track failed models to avoid retrying them
    let failedModels = {};

    // Available backup models in order of preference
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

    // Load available models on page load
    populateModelOptions();

    async function populateModelOptions() {
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
        statusMessage.textContent = message;
        statusMessage.className = type;
    }

    async function startCollaboration() {
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
        
        // Update status to show which iteration we're on
        const iterationInfo = currentIteration > 0 ? 
            ` (iteracija ${currentIteration + 1}/${maxIterations})` : 
            '';
        updateStatus(`${worker.name} (${worker.model()})${iterationInfo} mąsto...`);

        try {
            let prompt;

            if (isFirstMessage) {
                // First message - determine the type of text needed
                prompt = `Parašyk ${initialMessage}.

SVARBU: Rašyk kaip Jonas, lietuviškai, natūralia kalba, ir nevartok angliškų frazių.
Pradėk neformalia įžanga, tada pateik savo tekstą, ir pabaik perduodamas darbą Gabijai.
Tavo tekstas turėtų atitikti prašomo tipo tekstą (pvz., straipsnis, blogo įrašas, Twitter postas ir t.t.)`;
            } else {
                // Create a much improved prompt based on the collaboration history
                let historyText = "";

                if (ApiConnector && typeof ApiConnector.formatConversationForApi === 'function') {
                    historyText = ApiConnector.formatConversationForApi(conversationHistory);
                    historyText = ApiConnector.trimConversationHistory(historyText);
                } else {
                    // Use our improved formatting function
                    historyText = formatCollaborationHistory();
                }

                // Use the new function to create worker-specific prompts
                prompt = createWorkerPrompt(historyText, workerKey);
            }

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
                content: response,
                iteration: currentIteration + 1  // Track which iteration this message belongs to
            });

            // Save the latest result for the final output (from each worker)
            latestResult = response;

            // Add the response to the chat log with iteration info if beyond first cycle
            if (currentIteration > 0) {
                addMessageToChatLog(
                    worker.name, 
                    response, 
                    `${worker.className} iteration-${currentIteration + 1}`
                );
            } else {
                addMessageToChatLog(worker.name, response, worker.className);
            }
            
            updateStatus(`${worker.name} atsakė sėkmingai${iterationInfo}`);

            // Continue to the next worker
            currentWorkerIndex = (currentWorkerIndex + 1) % workerSequence.length;

            // Only increment the iteration counter when we complete a full cycle
            if (currentWorkerIndex === 0) {
                currentIteration++;
            }

            // Wait a moment before the next exchange
            if (isCollaborationActive) {
                const delayTime = Math.max(500, exchangeDelay);
                updateStatus(`Laukiama ${delayTime}ms prieš kitą atsakymą...`);

                await new Promise(resolve => setTimeout(resolve, delayTime));

                if (isCollaborationActive) {
                    continueCollaboration().catch(err => {
                        console.error("Error in collaboration continuation:", err);
                        updateStatus(`Klaida: ${err.message}`, "error");

                        setTimeout(() => {
                            if (isCollaborationActive) {
                                addMessageToChatLog('System', 'Bandome tęsti bendradarbiavimą...', 'system');
                                continueCollaboration().catch(() => {
                                    addMessageToChatLog('System', 'Nepavyko tęsti bendradarbiavimo po kelių bandymų.', 'system');
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

                    failedModels[workerKey][model] = (failedModels[workerKey][model] || 0) + 3; // Mark as failed 3 times to force switch

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
            // Fix: Use the worker name instead of workerKey which is not defined in this scope
            const workerTypeKey = workerName === 'Writer' ? 'writer' : 
                               workerName === 'Researcher' ? 'researcher' : 
                               workerName === 'Critic' ? 'critic' : 
                               workerName === 'Editor' ? 'editor' : 'boss';
            window.ErrorAnimations.showWorkingAnimation(workerTypeKey);
        }
    }

    function removeThinkingIndicator(id) {
        const element = document.getElementById(id);
        if (element) {
            element.remove();
        }
    }

    function scrollToBottom() {
        chatLog.scrollTop = chatLog.scrollHeight;
    }

    function copyFinalResult() {
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

    // Format the collaboration history in a way that helps maintain context
    function formatCollaborationHistory() {
        let historyText = "COLLABORATION HISTORY:\n\n";

        // Make sure the topic is always included
        const topicMessage = conversationHistory.find(msg => msg.role === 'System');
        if (topicMessage) {
            historyText += `UŽDUOTIS: ${topicMessage.content}\n\n`;
        }

        // Track the current iteration number
        const iterationNumber = currentIteration + 1;
        const totalIterations = maxIterations;
        historyText += `ŠI YRA ${iterationNumber}-OJI ITERACIJA IŠ ${totalIterations}.\n\n`;

        // Determine if we're formatting for the boss or regular worker
        const workerKey = getCurrentWorkerKey();
        const isBoss = workerKey === 'boss' || finalWorker === workerKey;
        
        // Get completed worker cycles - this helps track how many full iterations we've gone through
        const completedCycles = Math.floor(conversationHistory.filter(msg => msg.role !== 'System').length / workerSequence.length);
        
        // Boss gets more context (full history), workers get messages from current iteration plus previous if relevant
        const relevantMessagesToShow = isBoss ? conversationHistory.length : 
                                      Math.min(12, conversationHistory.length);
        
        // Get relevant history based on role and iteration
        const fullHistory = conversationHistory.filter(msg => msg.role !== 'System');
        
        // For workers beyond the first iteration, show messages from the previous iteration too
        const relevantHistory = iterationNumber > 1 ?
            // Include messages from prior iteration to maintain context across cycles
            fullHistory.slice(-relevantMessagesToShow) :
            // For first iteration, just show recent messages
            fullHistory.slice(-4);

        // Add a note about where we are in the collaboration process
        if (iterationNumber > 1) {
            historyText += `MES JAU ANKSČIAU BENDRAVOME ${completedCycles} CIKLUS. DABAR TĘSIAME TOBULINIMO PROCESĄ.\n\n`;
        }
        
        // Add iteration context for the worker
        if (workerKey === 'writer' && iterationNumber > 1) {
            historyText += `SVARBU: Kaip Jonas, tu dabar turėtum apžvelgti visą ankstesnę diskusiją ir pateikti tobulesnę versiją, įtraukiant Gabijos, Vytauto bei Eglės pastabas iš ankstesnių iteracijų.\n\n`;
        }

        // Add a note if we're truncating history
        if (conversationHistory.length > relevantMessagesToShow + 1) { // +1 for the System message
            historyText += `[${isBoss ? "Rodoma visa istorija" : "Rodoma dalis istorijos"} - ${relevantHistory.length} žinutės]\n\n`;
        }

        // Format each message in the history
        relevantHistory.forEach((msg, index) => {
            // For boss, add timestamps to help understand conversation flow
            const timestamp = isBoss ? `[${index + 1}] ` : "";
            historyText += `${timestamp}${msg.role}: ${msg.content}\n\n`;

            if (index < relevantHistory.length - 1) {
                historyText += "---\n\n";
            }
        });

        // Add summaries from previous iterations if we're beyond the first cycle
        if (iterationNumber > 1 && !isBoss) {
            historyText += "\nANKSTESNIŲ ITERACIJŲ APŽVALGA:\n";
            
            // Create a summary of key points from previous iterations
            // Group messages by worker role from past iterations
            const workerContributions = {};
            workerSequence.forEach(role => {
                const roleName = workers[role].name;
                // Get only messages from previous iterations, not current one
                const messagesFromPreviousIterations = conversationHistory.filter(
                    msg => msg.role === roleName && 
                    conversationHistory.indexOf(msg) < conversationHistory.length - relevantHistory.length
                );
                
                if (messagesFromPreviousIterations.length > 0) {
                    const latestContribution = messagesFromPreviousIterations[messagesFromPreviousIterations.length - 1];
                    workerContributions[roleName] = summarizeMessage(latestContribution.content, 200);
                }
            });
            
            // Add the summaries to the history text
            Object.entries(workerContributions).forEach(([role, summary]) => {
                historyText += `\n${role} anksčiau sakė: "${summary}"\n`;
            });
            
            historyText += "\nRemdamasis šia istorija, tęsk darbą ir tobulėk toliau.\n";
        }

        return historyText;
    }

    // Helper function to summarize a message
    function summarizeMessage(message, maxLength = 200) {
        // Remove common intros/outros
        let cleaned = message
            .replace(/^.*?(štai ką parašiau|štai mano tekstas|peržiūrėjau tekstą|štai pataisytas tekstas).*?:/si, '')
            .replace(/gabija.*?$/si, '')
            .replace(/vytautas.*?$/si, '')
            .replace(/eglė.*?$/si, '')
            .replace(/jonas.*?$/si, '')
            .replace(/perduodu.*?$/si, '')
            .replace(/tikiuosi.*?$/si, '')
            .trim();
        
        // If still too long, truncate and add ellipsis
        if (cleaned.length > maxLength) {
            cleaned = cleaned.substring(0, maxLength) + "...";
        }
        
        return cleaned;
    }

    // Customize the prompt based on which worker is responding
    function createWorkerPrompt(historyText, workerKey) {
        let lastMessages = {};
        const iterationNumber = currentIteration + 1;
        
        // Find the last message from each worker to reference
        ['Writer', 'Researcher', 'Critic', 'Editor', 'Boss'].forEach(role => {
            const lastMsg = conversationHistory
                .filter(msg => msg.role === role)
                .slice(-1)[0];
                    
            if (lastMsg) {
                lastMessages[role] = lastMsg.content;
            }
        });

        // Add iteration awareness to each prompt
        const iterationContext = iterationNumber > 1 ? 
            `Tai jau ${iterationNumber}-oji iteracija. Ankstesniuose cikluose visi komandos nariai jau dirbo prie šio teksto, tad dabar reikia tęsti tobulinimą ir įtraukti ankstesnius pasiūlymus.` : 
            `Tai pirmoji iteracija, tad pradedame darbą nuo pradžių.`;

        switch (workerKey) {
            case 'writer':
                return `${historyText}

Dabar Tu esi Jonas, rašytojas. ${iterationContext}

${iterationNumber > 1 ? 
    `SVARBU: Peržiūrėk VISĄ ankstesnių iteracijų istoriją. Šiame naujame cikle, tavo tikslas - sukurti dar tobulesnę teksto versiją, atsižvelgiant į visus ankstesnius patobulinimus, Gabijos surastus faktus, Vytauto kritiką ir Eglės redagavimus.
    
    Kaip rašytojas, šį kartą tavo pareiga:
    1. Apžvelgti visą ankstesnę diskusiją ir suprasti, kaip tekstas evoliucionavo
    2. Integruoti geriausias idėjas iš praėjusių ciklų
    3. Ištaisyti likusius trūkumus, kuriuos pastebėjo Vytautas ar Eglė
    4. Išlaikyti mokslinę informaciją, kurią pridėjo Gabija
    5. Sukurti dar geresnę, nuoseklesnę ir aiškesnę teksto versiją` :
    
    `Tavo užduotis:
    1. Sukurti pradinį tekstą pagal užduotį
    2. Suteikti jam aiškią struktūrą ir stilių
    3. Užtikrinti, kad tekstas būtų aiškus, įdomus ir informatyvus
    4. Pabaigoje perduoti darbą Gabijai tolesniam tobulinimui su faktais`
}

SVARBU: ${iterationNumber > 1 ? 
    `Tai nėra visiškai naujas tekstas - tai ankstesnio darbo tęsinys ir tobulinimas. Parodyk, kad supratai ankstesnius komentarus ir kaip tekstas tobulėjo.` : 
    `Rašyk kaip Jonas, lietuviškai, natūralia kalba, ir nevartok angliškų frazių.`}`;

            case 'researcher':
                return `${historyText}

Dabar Tu esi Gabija, tyrėja. ${iterationContext}

${iterationNumber > 1 ? 
        `Ankstesnėse iteracijose jau atlikote tyrimą, tačiau dabar reikia jį papildyti ir patobulinti, atsižvelgiant į naujausią Jono pateiktą tekstą.
        
        Kaip tyrėja, šį kartą tavo pareiga:
        1. Patikrinti ir atnaujinti šaltinius, kuriuos pateikei anksčiau
        2. Surasti NAUJUS faktus ir šaltinius, kurie dar labiau pagerintų tekstą
        3. Išlaikyti geriausią informaciją iš ankstesnių iteracijų
        4. Reaguoti į naujausią Jono teksto versiją, įvertinant, ar jis teisingai įtraukė tavo anksčiau pateiktus faktus` :
        
        `Tavo užduotis:
        1. Papildyk tekstą moksliniais faktais ir akademinėmis nuorodomis
        2. Atlik papildomus tyrimus internete, jei reikia
        3. Pateik tikslias nuorodas į šaltinius su URL adresais
        4. Išlaikyk pagrindinę teksto struktūrą, bet pridėk vertingos informacijos`
    }

SVARBU: ${iterationNumber > 1 ? 
        `Naudokis savo prieiga prie interneto, kad surinktum naujausius ir tiksliausius faktus. Paminėk, kaip nauji faktai papildo ar patikslina ankstesnius.` : 
        `Reaguok į Jono tekstą, išlaikydama kontekstą ir tęsdama mintį. Tavo tekstas turi būti sklandus tęsinys.`}`;

            case 'critic':
                return `${historyText}

Dabar Tu esi Vytautas, kritikas. ${iterationContext}

${iterationNumber > 1 ? 
        `Tu jau anksčiau kritiškai įvertinai tekstą, tačiau dabar reikia peržiūrėti naujausią Gabijos papildytą versiją ir įvertinti, kaip tekstas tobulėja per iteracijas.
        
        Kaip kritikas, šį kartą tavo pareiga:
        1. Palyginti dabartinę versiją su ankstesnėmis iteracijomis
        2. Įvertinti, ar buvo atsižvelgta į tavo ankstesnes pastabas
        3. Pateikti konkrečius pasiūlymus, kaip tekstas galėtų būti dar labiau patobulintas
        4. Ypač atkreipti dėmesį į argumentų nuoseklumą ir šaltinių naudojimą` :
        
        `Tavo užduotis:
        1. Įvertink teksto stiprybes (aiškumą, originalumą, įtaigą)
        2. Nurodyk tobulintinas vietas (struktūra, argumentacija, kalbos vartojimas)
        3. Pasiūlyk konkrečius patobulinimus
        4. Pateik bendrą įvertinimą`
    }

SVARBU: ${iterationNumber > 1 ? 
        `Išlaikyk konstruktyvų požiūrį ir parodyk, kaip tekstas tobulėja per iteracijas. Atkreipk dėmesį tiek į tai, kas pagerėjo, tiek į tai, ką dar reikia tobulinti.` : 
        `Analizuok teksto logiką, struktūrą, argumentus ir šaltinių naudojimą. Tavo kritika turi būti konstruktyvi ir pagrįsta.`}`;

            case 'editor':
                return `${historyText}

Dabar Tu esi Eglė, redaktorė. ${iterationContext}

${iterationNumber > 1 ? 
        `Tu jau anksčiau redagavai šį tekstą, tačiau dabar reikia peržiūrėti naujausią Vytauto kritikuotą versiją ir patobulinti tekstą dar labiau, atsižvelgiant į visą evoliuciją per iteracijas.
        
        Kaip redaktorė, šį kartą tavo pareiga:
        1. Patikrinti, ar ankstesnės tavo redakcijos buvo išlaikytos naujoje versijoje
        2. Išlaikyti visus gerus pakeitimus iš ankstesnių iteracijų
        3. Ištaisyti bet kokias naujas klaidas ar netikslumus
        4. Užtikrinti teksto vientisumą ir nuoseklumą per visas iteracijas` :
        
        `Tavo užduotis:
        1. Identifikuok ir ištaisyk gramatines, skyrybos ir stilistines klaidas
        2. Patobulink teksto struktūrą ir rišlumą
        3. Užtikrink, kad tekstas yra aiškus, nuoseklus ir profesionalus
        4. Pateik galutinę, išbaigtą versiją`
    }

SVARBU: ${iterationNumber > 1 ? 
        `Tekstas turėtų su kiekviena iteracija tapti vis geresnis. Parodyk, kaip tavo redagavimas prisideda prie teksto tobulėjimo laiko eigoje.` : 
        `Išlaikyk originalias idėjas ir temas, bet ištaisyk klaidas ir pagerinimus pagal Vytauto kritiką.`}`;

            case 'boss':
                return `${historyText}

Dabar Tu esi Tauris, biuro šefas ir galutinis prižiūrėtojas. Tu matai VISĄ bendradarbiavimo procesą per ${iterationNumber} iteracijas.

Tavo užduotis:
1. Apjunk visų darbuotojų geriausias idėjas ir įžvalgas į vieną nuoseklų tekstą
2. Parodyk, kaip tekstas tobulėjo per visas iteracijas
3. Užtikrink, kad galutinis variantas turi aiškią struktūrą: įvadą, pagrindinę dalį ir išvadas
4. Įtrauk Gabijos pateiktus faktus ir šaltinius iš visų iteracijų
5. Atsižvelk į Vytauto kritiką ir siūlomus patobulinimus per visą procesą
6. Išlaikyk Eglės kalbos ir stiliaus pataisymus iš visų iteracijų

SVARBU: Kaip šefas, tu turi matyti visą bendrą vaizdą ir užtikrinti, kad galutinis tekstas yra aukščiausios kokybės, atspindintis visą komandos darbo evoliuciją.

Pradėk: "Ačiū visiems už įdėtą darbą per ${iterationNumber} iteracijas! Peržiūrėjęs visą bendradarbiavimo istoriją, pateikiu galutinę šio teksto versiją:"`;

            default:
                return historyText;
        }
    }

    // Clean up the final result text to remove role intros and outros
    function cleanUpFinalResult(text) {
        if (!text) return '';

        // Remove any conversational elements
        let cleaned = text
            // Remove common Lithuanian introductions
            .replace(/^.*?(štai ką parašiau|štai mano tekstas|peržiūrėjau tekstą|štai pataisytas tekstas).*?:/si, '')
            // Remove signatures and handoffs
            .replace(/gabija[a-zA-ZĄČĘĖĮŠŲŪąčęėįšųū\s,]*$/si, '')
            .replace(/vytautas[a-zA-ZĄČĘĖĮŠŲŪąčęėįšųū\s,]*$/si, '')
            .replace(/eglė[a-zA-ZĄČĘĖĮŠŲŪąčęėįšųū\s,]*$/si, '')
            .replace(/jonas[a-zA-ZĄČĘĖĮŠŲŪąčęėįšųū\s,]*$/si, '')
            .replace(/perduodu.*?gabijai.*$/si, '')
            .replace(/perduodu.*?vytautui.*$/si, '')
            .replace(/perduodu.*?eglei.*$/si, '')
            .replace(/perduodu.*?jonui.*$/si, '')
            // Remove other ending sentences
            .replace(/tikiuosi.*?$/si, '')
            .replace(/linkiu.*?$/si, '')
            // Remove any remaining English phrases that might have slipped through
            .replace(/as the (writer|researcher|critic|editor).*?:/gi, '')
            .replace(/i've (drafted|enhanced|evaluated|refined).*?:/gi, '')
            .replace(/\[CONTENT_START\]/gi, '')
            .replace(/\[CONTENT_END\]/gi, '')
            .trim();

        return cleaned;
    }

    // Display the final result in the UI
    function displayFinalResult(resultText) {
        const processedText = cleanUpFinalResult(resultText);
        finalResult.textContent = processedText;
    }

    // Add the downloadAsDocument function that's referenced but missing

    /**
     * Downloads the final result as a Word document (.docx)
     * Uses a simple text blob with .docx extension
     */
    function downloadAsDocument() {
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

    // Fix the issue with null references in the initialization
    document.addEventListener('DOMContentLoaded', () => {
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
    });

    // Fix the error in startCollaboration function by checking for null before setting disabled
    function startCollaboration() {
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

        // Reset buttons - check if elements exist first
        if (copyResultBtn) copyResultBtn.disabled = true;
        if (downloadResultBtn) downloadResultBtn.disabled = true;

        // Reset progress
        if (progressFill) progressFill.style.width = '0%';
        if (progressText) progressText.textContent = '0%';

        updateStatus("Starting collaboration...");

        // Start with the initial prompt to the first worker
        continueCollaboration(initialTopic, true).catch(error => {
            console.error("Error starting collaboration:", error);
            updateStatus(`Error: ${error.message}`, "error");
            stopCollaboration();
        });
    }

    // Fix the function with the missing catch block
    async function checkApiAvailability() {
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

    // Also need to fix the incomplete function in the script
    function finalizeCollaboration() {
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

            // Create a comprehensive prompt for the boss that includes all previous conversation
            // Use ApiConnector's formatting if available for better context
            let historyText = "";

            if (ApiConnector && typeof ApiConnector.formatConversationForApi === 'function') {
                historyText = ApiConnector.formatConversationForApi(conversationHistory, 12); // Include more context for boss
            } else {
                historyText = formatCollaborationHistory();
            }

            const initialTopic = conversationHistory.find(msg => msg.role === 'System')?.content || "Unknown topic";

            const prompt = `${historyText}

Dabar Tu esi Tauris, biuro šefas ir visų galutinis prižiūrėtojas. Tavo tikslas - peržvelgti visų ankstesnių darbuotojų
(Jono, Gabijos, Vytauto ir Eglės) darbą ir pateikti GALUTINĘ versiją, kuri apjungia visų geriausias dalis į vieną nuoseklų,
aukštos kokybės akademinį tekstą.

TEMA: "${initialTopic}"

Reikalavimai galutiniam tekstui:
1. Aiški struktūra ir nuoseklus minčių dėstymas
2. Visi svarbūs faktai ir šaltiniai iš Gabijos tyrimo
3. Problemos ištaisytos pagal Vytauto kritiką
4. Eglės atliktos kalbos ir stiliaus korekcijos
5. Jono originalios idėjos ir kūrybiškumas

Galutinio teksto struktūra:
- Įvadas su temos pristatymu
- Pagrindinė dalis su faktais, argumentais ir šaltiniais
- Aiškios išvados
- Nuorodos į šaltinius (jei yra)

Tai bus GALUTINIS šio darbo rezultatas, todėl jis turi būti išskirtinės, nepriekaištingos kokybės.
Pradėk nuo frazės: "Ačiū visiems už įdėtą darbą! Štai mano galutinė šio teksto versija:"`;

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

            // Add the response to the chat log with special boss styling
            addMessageToChatLog(worker.name, response, worker.className);
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

    // Extract the final result from the last boss's contribution if available
    function extractFinalResult() {
        // Try to use the boss's final contribution first
        const contributions = conversationHistory.filter(msg =>
            msg.role !== 'System' && msg.content && msg.content.length > 100
        );

        // Get the boss's contribution if available
        const bossMsg = contributions
            .filter(msg => msg.role === 'Boss')
            .slice(-1)[0];

        if (bossMsg) {
            // Extract just the document content, removing conversational parts
            const content = bossMsg.content;

            // Remove common opening phrases
            let cleanText = content
                .replace(/^.*?(ačiū visiems už įdėtą darbą|štai mano galutinė|peržiūrėjau visų darbą).*?:/si, '')
                .trim();

            // Remove common closing phrases
            cleanText = cleanText
                .replace(/su pagarba.*?$/si, '')
                .replace(/tauris.*?$/si, '')
                .replace(/šefas.*?$/si, '')
                .trim();

            return cleanText;
        }

        // Fallback to the original extractFinalResult logic for editor and writer
        // ...existing extractFinalResult code...

        // Get the last substantive contribution (from Editor if possible)
        const lastEditorMsg = contributions
            .filter(msg => msg.role === 'Editor')
            .slice(-1)[0];

        if (lastEditorMsg) {
            // Extract just the document content, removing conversational parts
            const content = lastEditorMsg.content;

            // Remove common opening phrases
            let cleanText = content
                .replace(/^.*(štai pataisytas tekstas|štai galutinė versija|štai kaip pataisiau|peržiūrėjau tekstą).*?:/si, '')
                .replace(/^.*?(štai rezultatas|pataisiau tekstą).*?:/si, '')
                .trim();

            // Remove common closing phrases
            cleanText = cleanText
                .replace(/tikiuosi, kad šis tekstas.*?$/si, '')
                .replace(/linkiu sėkmės.*?$/si, '')
                .replace(/perduodu šį tekstą.*?$/si, '')
                .replace(/ačiū už galimybę.*?$/si, '')
                .replace(/esu pasiruošusi atsakyti.*?$/si, '')
                .trim();

            return cleanText;
        }

        // Fallback to writer's text if neither boss nor editor is available
        const lastWriterMsg = contributions
            .filter(msg => msg.role === 'Writer')
            .slice(-1)[0];

        if (lastWriterMsg) {
            // Extract just the document content from writer's text
            const content = lastWriterMsg.content;

            return content
                .replace(/^.*?(štai ką parašiau|štai mano tekstas|parašiau tokį tekstą).*?:/si, '')
                .replace(/^.*?(štai mano juodraštis|štai pradinis variantas).*?:/si, '')
                .replace(/gabija[a-zA-ZĄČĘĖĮŠŲŪąčęėįšųū\s,]*$/si, '')
                .replace(/perduodu.*?$/si, '')
                .trim();
        }

        // If no identifiable messages found, fall back to the original method
        return cleanUpFinalResult(conversationHistory[conversationHistory.length - 1]?.content || "");
    }

    // Override addMessageToChatLog to use Lithuanian role names
    function addMessageToChatLog(role, message, className = '') {
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
