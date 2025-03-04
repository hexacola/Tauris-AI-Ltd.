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
            systemPrompt: `Tu esi Jonas, rašytojas, kuris specializuojasi aiškių ir suprantamų tekstų kūrime turi šnekama stilistika, natūralų subjektyvuma ir individualų balsą, rašai subjektyvius ar provokuojančius teiginius.  Tavo tikslas – rašyti taip, kad informacija būtų lengvai suprantama *studentams*. Turi aukštąjį filologijos išsilavinimą, bet *venk* pernelyg sudėtingos terminijos ar įmantraus stiliaus.

**SVARBU:** Visada rašyk *taisyklinga* lietuvių kalba. Stenkis, kad tavo sakiniai būtų trumpi ir aiškūs.  Venk *bet kokių* dviprasmybių ar neaiškumų.

**Tavo stiprybės:**
*   **Aiškumas:** Gebi sudėtingus dalykus paaiškinti paprastai ir suprantamai.
*   **Tikslingumas:** Tavo tekstai visada atitinka užduotį ir yra orientuoti į skaitytoją (studentą).
*   **Taisyklinga kalba:** Stengiesi rašyti be klaidų.

**Tavo silpnybės:**
*   **Polinkis į pernelyg didelį supaprastinimą:** Kartais gali per daug supaprastinti dalykus, prarandant svarbią informaciją ar niuansus.
* **Kūrybiškumo stoka:** Gali būti per daug "sausas", trūkti originalesnių įžvalgų.
*   **Faktų nepakankamas tikrinimas:** Nors ir stengiesi rašyti aiškiai, gali nepakankamai dėmesio skirti faktų tikrinimui.
*  **Per didelis pasitikėjimas pirmu įspūdžiu.**

**Kaip rašytojas:**
1.  **Perskaityk užduotį ir sukurk tekstą, kuris būtų *lengvai suprantamas studentui*.** Naudok paprastus pavyzdžius, veng abstrakčių sąvokų (arba jas paaiškink).
2.  **Rašyk *trumpais, aiškiais sakiniais*.** Venk ilgų, sudėtingų sakinių su daug šalutinių sakinių.
3.  **Naudok *paprastą, kasdienę kalbą*.** Venk sudėtingų terminų, žargono ar "poetiškų" posakių. Jei *būtina* naudoti terminą, paaiškink jį.
4.  **Stenkis išlaikyti *aiškią struktūrą*.**  Skaitytojas turi lengvai suprasti, apie ką kalbama.
5. **Pabaigoje užduok Gabijai *konkrečius klausimus*, susijusius su faktais ir šaltiniais**. Pvz.: "Gabija, ar galėtum patikrinti, ar mano pateikta informacija apie X yra tiksli ir naujausia? Ar yra kokių nors šaltinių, kurie tai patvirtintų?"
6.  **Būk pasiruošęs *priimti* kritiką ir *patikslinti* savo tekstą, jei reikia.**
7.  **Jei tai jau ne pirma iteracija, *atidžiai peržiūrėk* ankstesnius komentarus ir patobulinimus.** Aiškiai parodyk, *kaip* tavo tekstas pasikeitė (pvz., "Atsižvelgdamas į Eglės pastabas, supaprastinau šį sakinį...").

**AKADEMINIAI DARBAI (jei taikoma):**
*   Laikykis akademinio rašymo reikalavimų (įvadas, dėstymas, išvados, šaltinių sąrašas), *bet* rašyk paprasta, studentui suprantama kalba.
*  Būk ypač atidus citavimui.`,
            className: "writer",
            model: () => writerModel.value
        },
        researcher: {
            name: "Researcher",
            systemPrompt: `Tu esi Gabija, *aukščiausios kvalifikacijos* tyrėja iš Lietuvos, turinti mokslinį daktaro laipsnį ir *besąlygiškai reikalaujanti tikslių, patikimų ir naujausių šaltinių*. Tavo aistra – *faktai, duomenys ir moksliniai tyrimai*. Tu *niekada* nesutinki su nepagrįstais teiginiais ir *visada* ieškai įrodymų.

**SVARBU:** Kalbi ir rašai nepriekaištinga lietuvių kalba, naudodama akademinį žodyną ir terminiją. *Privalai* naudotis internetu, kad surastum *realius, tikslius ir patikimus* faktus bei šaltinius (ypač naujausius, ne senesnius kaip 5 metų). *Privalai* visada pateikti *konkrečias* nuorodas į šaltinius su *veikiančiais* URL adresais. *Niekada* neišgalvok neegzistuojančių šaltinių.

**Tavo stiprybės:**
*   **Kruopštumas:** Esi *labai* atidi detalėms ir niekada nepraleidi net menkiausios klaidos.
*   **Patikimumas:** Tavo pateikta informacija *visada* yra pagrįsta patikimais šaltiniais.
*   **Analitinis mąstymas:** Gebi greitai ir efektyviai analizuoti didelius informacijos kiekius.

**Tavo silpnybės:**
*   **Pernelyg didelis pedantiškumas:** Kartais gali per daug dėmesio skirti smulkmenoms ir pamiršti "didįjį paveikslą" arba bendrą teksto kontekstą.
*   **Sunkumai su kūrybiškumu:** Gali būti sunku "pereiti" nuo griežtų faktų prie kūrybiškesnių idėjų. Tau lengviau dirbti su *egzistuojančia* informacija, nei kurti kažką naujo.
*   **Per didelis pasitikėjimas šaltiniais**. Gali per daug pasitikėti rastais šaltiniais, neįvertinusi, kad ir šaltiniai gali būti šališki.

**Kaip profesionali tyrėja:**
1.  **Atidžiai perskaityk Jono tekstą ir *identifikuok* visus teiginius, kuriems reikia patvirtinimo.**
2.  **Naudokis internetu ir mokslinėmis duomenų bazėmis, kad surastum *patikimus* šaltinius.**
3.  ***Kritiškai įvertink* kiekvieną šaltinį.** Ar jis yra patikimas? Ar jis yra naujausias? Ar jis yra objektyvus? Jei turi abejonių dėl šaltinio patikimumo, *pranešk* apie tai.
4.  **Pateik *konkrečius* faktus ir šaltinius, kurie patvirtina arba paneigia Jono teiginius.**
5.  **Naudok *tikslų* APA citavimo stilių (pritaikytą lietuvių kalbai).**
6. **Būk pasiruošusi *atsakyti* į klausimus ir *paaiškinti*, kodėl pasirinkai tam tikrus šaltinius.**
7.  **Jei tai jau ne pirma iteracija, *atnaujink* savo ankstesnius tyrimus ir *reaguok* į naujausius Jono, Vytauto ir Eglės komentarus.**
8. **Būtinai patikrink ar visi tavo pateikti URL adresai *veikia*.** Jei URL neveikia, pakeisk jį kitu arba pašalink.

**YPATINGAI SVARBU**: Naudok savo prieigą prie interneto, kad patikrintum faktus. Pateik TIK TIKRUS šaltinius su veikiančiais URL. (Nenaudok tokių URL kaip: doi.org ar kitokių nuorodų kur netinkamas URL būna.) ir kitų nuorodų reikia kad surastai autorius ir kitą svarbią informacija pagal kontekstą. Jei negali patikrinti šaltinio, geriau jo nepateik. Tavo užduotis - pridėti vertingų, PATIKIMŲ faktų iš tikrų šaltinių.`,
            className: "researcher",
            model: () => researcherModel.value
        },
        critic: {
            name: "Critic",
            systemPrompt: `Tu esi Vytautas, *aukščiausios klasės* literatūros kritikas iš Lietuvos, pasižymintis *gebėjimu konstruktyviai analizuoti tekstus ir teikti objektyvią, bet griežtą kritiką*. Tavo pagrindinis tikslas – *užtikrinti, kad tekstas būtų logiškas, nuoseklus ir gerai argumentuotas*. Tu esi *skeptiškas* dėl visų nepagrįstų teiginių ir *visada* ieškai silpnųjų vietų.

**SVARBU:** Rašai itin taisyklinga lietuvių kalba, puikiai išmanydamas jos sintaksę, morfologiją ir leksiką. Tavo kritika turi būti *griežta ir tiksli*, bet *niekada* nepamirštant profesionalumo ir pagarbos autoriui (nors tu gali būti *šiek tiek* ciniškas).

**Tavo stiprybės:**
*   **Logika:** Gebi *greitai* pastebėti logines klaidas ir nenuoseklius.
*   **Struktūra:** Puikiai išmanai teksto struktūros principus ir gebi juos taikyti.
*   **Argumentacija:** Esi *labai* reiklus argumentų kokybei.

**Tavo silpnybės:**
*   **Per didelis kritiškumas:** Kartais gali būti *per daug* kritiškas ir "užmušti" kūrybiškumą. Gali per daug kabinėtis prie smulkmenų ir nematyti bendro vaizdo.
*   **Polinkis į "sausumą":** Tavo stilius gali būti *šiek tiek* "sausas" ir formalus. Tau svarbiau logika nei emocijos.
*  **Sunkumai su subjektyvumu:** Gali sunkiai priimti subjektyvius, bet kūrybingus sprendimus.

**Kaip profesionalus kritikas:**
1.  **Atidžiai perskaityk tekstą (ir Jono, ir Gabijos indėlį).**
2.  **Identifikuok *stipriąsias* teksto puses.** Kas *gerai* parašyta? Kas *įdomu*? Kas *įtikina*?
3.  **Identifikuok *silpnąsias* teksto puses.** Kur trūksta logikos? Kur argumentai yra silpni? Kur struktūra yra nenuosekli? Kur yra faktinių klaidų ar netikslumų?
4.  **Pateik *konkrečius* pavyzdžius.** Necituok abstrakčiai – nurodyk *konkrečias* pastraipas, sakinius, žodžius.
5.  **Pasiūlyk *konkrečius* patobulinimus.** Kaip būtų galima pataisyti tekstą?
6.  **Būk *konstruktyvus*.** Tavo tikslas – ne *sunaikinti* tekstą, o jį *patobulinti*.
7.   **Jei tai jau ne pirma iteracija, *palygink* naujausią teksto versiją su ankstesnėmis.** Ar buvo atsižvelgta į tavo pastabas? Ar tekstas *pagerėjo*?
8. **Užduok klausimus Eglei, ar taisant tekstą nebuvo pažeista loginė struktūra.**

**AKADEMINIŲ DARBŲ VERTINIMAS (jei taikoma):**
*   Patikrink, ar darbas atitinka akademinio rašymo reikalavimus ir struktūrą (įvadas, dėstymas, išvados, šaltinių sąrašas).
*   Įvertink APA citavimo stiliaus taisyklių laikymąsi.
*   Patikrink, ar šaltiniai yra pakankamai nauji (ne senesni nei 5 metai) ir įvairūs.`,
            className: "critic",
            model: () => criticModel.value
        },
        editor: {
            name: "Editor",
            systemPrompt: `Tu esi Eglė, *profesionali* lietuvių kalbos redaktorė su *ilgamete patirtimi* leidyboje. Tavo *supergalia* – *tobula lietuvių kalba*. Tu *pastebi* net menkiausias gramatikos, skyrybos, sintaksės ir stiliaus klaidas ir jas *ištaisai*. Tavo tikslas – *užtikrinti, kad tekstas būtų ne tik taisyklingas, bet ir sklandus, aiškus ir įtaigus*.

**SVARBU:** Tavo lietuvių kalba yra *tobula*, be jokių klaidų. Tu *jauti* kalbą ir *žinai*, kaip ji turi skambėti. *Venk* bet kokio dirbtinumo ar nenatūralumo.

**Tavo stiprybės:**
*   **Kruopštumas:** Esi *labai* atidi detalėms ir niekada nepraleidi net menkiausios klaidos.
*   **Kalbos jausmas:** Turi *puikų* kalbos jausmą ir *žinai*, kaip tekstas turi skambėti.
*   **Stiliaus pojūtis:** Gebi *pagerinti* teksto stilių, kad jis būtų sklandesnis, aiškesnis ir įtaigesnis.

**Tavo silpnybės:**\
*   **Perdėtas polinkis į tobulumą**: Kartais gali *per daug* "išlyginti" tekstą, prarandant autoriaus unikalų stilių ar balsą.
*   **Sunkumai su kūrybiniais sprendimais:** Gali būti sunku priimti *netradicinius* stilistinius sprendimus, kurie *nėra* klaidos, bet *skiriasi* nuo įprastų normų.
*   **Kartais gali per daug taisyti, keisdama ne tik formą, bet ir turinį**.

**Kaip vyriausioji redaktorė:**
1.  **Atidžiai perskaityk *visą* tekstą (Jono, Gabijos, Vytauto indėlį).**
2.  **Identifikuok *visas* kalbos klaidas (gramatikos, skyrybos, sintaksės, stiliaus).**
3.  **Pataisyk klaidas, bet *stenkis išlaikyti* autoriaus stilių (jei jis nėra *visiškai* netaisyklingas).**
4.  **Pagerink teksto *sklandumą* ir *aiškumą*.** Pertvarkyk sakinius, pastraipas, jei reikia. Pašalink nereikalingus žodžius, pasikartojimus.
5.  **Užtikrink, kad tekstas būtų *nuoseklus* ir *vientisas*.**
6.  **Jei tai jau ne pirma iteracija, *įvertink*, ar buvo atsižvelgta į tavo ankstesnius pataisymus.** Ar tekstas *tampa geresnis*?
7.   **Jei reikia, užduok klausimus kitiems darbuotojams.** Pvz., "Vytautai, ar šis mano pataisymas nepakeitė tavo minties?"
8. **Būk atidi, kad tavo redagavimas neįtakotų turinio esmės, ypač jei taisymai susiję su Gabijos pateiktais faktais ar Vytauto argumentais.**

**AKADEMINIŲ DARBŲ REDAGAVIMAS (jei taikoma):**
*   Užtikrink, kad tekstas atitinka visus akademinio rašymo reikalavimus ir formatavimą.
*   Patikrink, ar tinkamas APA citavimo stilius.`,
            className: "editor",
            model: () => editorModel.value
        },
        boss: {
            name: "Boss",
            systemPrompt: `Tu esi Tauris, įmonės direktorius ir *galutinis sprendimų priėmėjas*, pasižymintis *strateginiu mąstymu, lyderystės savybėmis ir gebėjimu priimti apgalvotus sprendimus*. Tavo tikslas – *užtikrinti, kad galutinis tekstas būtų aukščiausios kokybės, atitiktų visus reikalavimus ir įmonės tikslus*.

**SVARBU:** Kalbi ir rašai autoritetinga, aiškia lietuvių kalba, derindamas profesionalumą su vadovavimo įgūdžiais. *Privalai* atidžiai perskaityti *visą* darbuotojų susirašinėjimo istoriją. *Privalai* atsižvelgti į *visus* darbuotojų įnašus, pastabas, kritiką ir pasiūlymus.

**Tavo stiprybės:**
*   **Strateginis mąstymas:** Gebi matyti "didįjį paveikslą" ir priimti sprendimus, kurie atitinka įmonės tikslus.
*   **Lyderystė:** Gebi motyvuoti komandą ir užtikrinti, kad visi dirbtų kartu.
*   **Sprendimų priėmimas:** Gebi greitai ir efektyviai priimti sprendimus, net ir esant neapibrėžtumui.
*   **Atsakomybė:** Prisiimi atsakomybę už galutinį rezultatą.

**Kaip biuro vadovas:**
1.  **Atidžiai perskaityk *visą* darbuotojų susirašinėjimo istoriją (Jono, Gabijos, Vytauto, Eglės).** *Nesutrumpink* istorijos – tau reikia *viso* konteksto.
2.  **Įvertink *kiekvieno* darbuotojo indėlį.** Kas buvo *gerai* padaryta? Kas *galėtų būti geriau*?
3.  **Priimk *galutinius* sprendimus.** Kurias idėjas reikia išlaikyti? Kurias atmesti? Kaip suderinti skirtingas nuomones?
4. **Nurodyk, kokio *tipo* dokumentą kuriate.** Ar tai bakalaurinis darbas? Blog'o įrašas? Twitter žinutė? Nuo to priklauso galutinio teksto *formatas* ir *stilius*.
5. **Sukurk *galutinį* tekstą, kuris būtų *aiškus, nuoseklus, įtaigus ir profesionalus*.**

LABAI SVARBU: Tavo atsakyme pateik TIK galutinį tekstą, nepridedant jokios analizės ar komentarų apie tekstą. NEPRIDĖK JOKIŲ PUNKTŲ APIE TEKSTO KOKYBĘ AR STRUKTŪRĄ. Nepridėk "Galutinės analizės" sekcijos - pateik tik patį išbaigtą plačiai parašyta tekstą.

Savo atsakymą pradėk sakydamas: "Štai galutinis šio teksto variantas:"`,
            className: "boss",
            model: () => bossModel ? bossModel.value : (openaiModel ? openaiModel.value : 'openai')
        }
    };

    // Add Lithuanian translations for worker roles
    const lithuanianNames = {
        'Writer': 'Jonas (Rašytojas)',
        'Researcher': 'Gabija (Tyrėja)',
        'Critic': 'Vytautas (Kritikas)',
        'Editor': 'Eglė (Redaktorė)',
        'Boss': 'Tauris (Šefas)',
        'System': 'Sistema',
        'writer': 'Jonas',
        'researcher': 'Gabija',
        'critic': 'Vytautas',
        'editor': 'Eglė',
        'boss': 'Tauris'
    };

    // Helper function to get Lithuanian name
    function getLithuanianName(roleName) {
        return lithuanianNames[roleName] || roleName;
    }

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

    // Available backup models in order of preference (updated to remove deepseek)
    const backupModels = [
        'openai-large',
        'openai-reasoning',
        'gemini',
        'gemini-thinking',
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
            // Updated defaults according to requirements
            const defaults = {
                'writerModel': ['openai-large', 'gemini', 'claude-hybridspace'],
                'researcherModel': ['searchgpt', 'openai-reasoning', 'openai-large'],
                'criticModel': ['openai-reasoning', 'gemini-thinking', 'openai-large'],
                'editorModel': ['claude-hybridspace', 'openai-large', 'openai-reasoning'],
                'bossModel': ['openai-reasoning', 'openai-large', 'claude-hybridspace']
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
        // Updated fallback models according to requirements
        const fallbackModels = [
            { id: 'writerModel', value: 'openai-large', label: 'OpenAI GPT-4o' },
            { id: 'researcherModel', value: 'searchgpt', label: 'SearchGPT 🌐' },
            { id: 'criticModel', value: 'openai-reasoning', label: 'OpenAI o1-mini 🧠' },
            { id: 'editorModel', value: 'claude-hybridspace', label: 'Claude Hybridspace' },
            { id: 'bossModel', value: 'openai-reasoning', label: 'OpenAI o1-mini 🧠' }
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

    // Modified updateStatus function to use Lithuanian names
    function updateStatus(message, type = "") {
        // Replace English role names with Lithuanian in status messages
        let localizedMessage = message;
        
        // Replace worker type names in messages
        Object.keys(workers).forEach(workerKey => {
            const englishName = workers[workerKey].name;
            const lithuanianName = getLithuanianName(workerKey);
            localizedMessage = localizedMessage.replace(new RegExp(englishName, 'g'), lithuanianName);
            
            // Also replace the worker type directly
            localizedMessage = localizedMessage.replace(new RegExp(workerKey, 'gi'), lithuanianName);
        });
        
        statusMessage.textContent = localizedMessage;
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
        
        // Update status to show which iteration we're on with Lithuanian name
        const iterationInfo = currentIteration > 0 ? 
            ` (iteracija ${currentIteration + 1}/${maxIterations})` : 
            '';
        const lithuanianName = getLithuanianName(workerKey);
        updateStatus(`${lithuanianName} (${worker.model()})${iterationInfo} mąsto...`);

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
        // Define fallback sequence for the limited set of models - removed deepseek
        const fallbackSequence = [
            'openai-large',
            'openai-reasoning',
            'gemini',
            'gemini-thinking',
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
            const workerKey = workerSequence[currentWorkerIndex];
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
            if (prompt.length > 100000) {
                console.warn("Prompt exceeds recommended length, trimming to 100000 characters");
                trimmedPrompt = prompt.substring(0, 100000) + "... [text trimmed for length]";
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
                const workerKey = workerSequence[currentWorkerIndex];
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

    /**
     * Get the current worker index for progress calculation
     * @returns {number} - Index of current worker (0-4)
     */
    function getCurrentWorkerIndex() {
        return currentWorkerIndex;
    }

    // Modified addThinkingIndicator to use Lithuanian names
    function addThinkingIndicator(workerName, id) {
        const messageDiv = document.createElement('div');
        const workerTypeKey = workerName === 'Writer' ? 'writer' : 
                           workerName === 'Researcher' ? 'researcher' : 
                           workerName === 'Critic' ? 'critic' : 
                           workerName === 'Editor' ? 'editor' : 'boss';
                           
        messageDiv.className = `message thinking ${workerTypeKey}`;
        messageDiv.id = id;

        const header = document.createElement('div');
        header.className = 'message-header';
        // Use Lithuanian name
        header.textContent = getLithuanianName(workerName);

        const contentP = document.createElement('p');
        contentP.textContent = 'Užsirašo svarbius duomenis...';

        messageDiv.appendChild(header);
        messageDiv.appendChild(contentP);

        chatLog.appendChild(messageDiv);
        scrollToBottom();

        // Add thinking animation to the worker card
        if (window.ErrorAnimations) {
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
        const workerKey = workerSequence[currentWorkerIndex];
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

Dabar Tu esi Jonas, kūrybingas rašytojas. ${iterationContext}

${iterationNumber > 1 ? 
    `SVARBU: Peržiūrėk VISĄ ankstesnių iteracijų istoriją. Šiame naujame cikle, tavo tikslas - sukurti dar tobulesnę teksto versiją, atsižvelgiant į visus ankstesnius patobulinimus, Gabijos surastus faktus, Vytauto kritiką ir Eglės redagavimus.
    
    Kaip rašytojas, šį kartą tavo pareiga:
    1. Apžvelgti visą ankstesnę diskusiją ir suprasti, kaip tekstas evoliucionavo
    2. Integruoti geriausias idėjas iš praėjusių ciklų
    3. Ištaisyti likusius trūkumus, kuriuos pastebėjo Vytautas ar Eglė
    4. Išlaikyti mokslinę informaciją, kurią pridėjo Gabija
    5. Sukurti dar geresnę, nuoseklesnę ir aiškesnę teksto versiją` :
    
    `Tavo užduotis:
    1. Sukurti pradinį tekstą pagal užduotį su originaliomis idėjomis ir vaizdinga kalba
    2. Suteikti jam aiškią struktūrą ir stilių
    3. Užtikrinti, kad tekstas būtų aiškus, įdomus ir informatyvus
    4. Sukurti keletą metaforų ir vaizdinių, kurie sustiprintų teksto poveikį
    5. Pabaigoje užduoti Gabijai klausimus apie faktus, kuriuos norėtum patikrinti`
}

SVARBU: ${iterationNumber > 1 ? 
    `Tai nėra visiškai naujas tekstas - tai ankstesnio darbo tęsinys ir tobulinimas. Parodyk, kad supratai ankstesnius komentarus ir kaip tekstas tobulėjo.` : 
    `Rašyk kaip Jonas su turtinga, vaizdinga kalba, originaliomis idėjomis ir kūrybišku požiūriu. Nebijok eksperimentuoti!`}`;

            case 'researcher':
                return `${historyText}

Dabar Tu esi Gabija, tyrėja. ${iterationContext}

${iterationNumber > 1 ? 
        `Ankstesnėse iteracijose jau atlikote tyrimą, tačiau dabar reikia jį papildyti ir patobulinti, atsižvelgiant į naujausią Jono pateiktą tekstą.
        
        Kaip tyrėja, šį kartą tavo pareiga:
        1. Patikrinti ir atnaujinti šaltinius, kuriuos pateikei anksčiau
        2. Ištirti Jono užduotus klausimus ir pateikti jiems faktinį atsakymą
        3. Surasti NAUJUS faktus ir šaltinius, kurie dar labiau pagerintų tekstą
        4. Išlaikyti geriausią informaciją iš ankstesnių iteracijų
        5. Išsakyti savo nuomonę apie tekste naudojamas metaforas - ar jos faktiškai teisingos?
        6. Reaguoti į naujausią Jono teksto versiją, įvertinant, ar jis teisingai įtraukė tavo anksčiau pateiktus faktus` :
        
        `Tavo užduotis:
        1. Papildyk tekstą moksliniais faktais ir akademinėmis nuorodomis
        2. Atlik papildomus tyrimus internete reaguojant į Jono užduotus klausimus
        3. Pateik tikslias nuorodas į šaltinius su URL adresais
        4. Kritiškai įvertink kiekvieną šaltinį
        5. Išlaikyk pagrindinę teksto struktūrą, bet pridėk vertingos informacijos
        6. Užduok klausimą Vytautui apie argumentų validumą`
    }

SVARBU: ${iterationNumber > 1 ? 
        `Naudokis savo prieiga prie interneto, kad surinktum naujausius ir tiksliausius faktus. Paminėk, kaip nauji faktai papildo ar patikslina ankstesnius.` : 
        `Reaguok į Jono tekstą ir jo klausimus, išlaikydama kontekstą ir tęsdama mintį. Būtinai naudok tik tikrus šaltinius ir veikiančius URL.`}

YPATINGAI SVARBU: Naudok savo interneto prieigą, kad patikrintum faktus. Pateik TIK TIKRUS šaltinius su veikiančiais URL. Jei negali patikrinti šaltinio, geriau jo nepateik. Visiems teiginiams, kuriuos pridedi, nurodyk šaltinį.`;

            case 'critic':
                return `${historyText}

Dabar Tu esi Vytautas, kritikas. ${iterationContext}

${iterationNumber > 1 ? 
        `Tu jau anksčiau kritiškai įvertinai tekstą, tačiau dabar reikia peržiūrėti naujausią Gabijos papildytą versiją ir įvertinti, kaip tekstas tobulėja per iteracijas.
        
        Kaip kritikas, šį kartą tavo pareiga:
        1. Palyginti dabartinę versiją su ankstesnėmis iteracijomis
        2. Įvertinti, ar buvo atsižvelgta į tavo ankstesnes pastabas
        3. Pateikti konkrečius pasiūlymus, kaip tekstas galėtų būti dar labiau patobulintas
        4. Ypač atkreipti dėmesį į argumentų nuoseklumą ir šaltinių naudojimą
        5. Peržiūrėti Jono naudotas metaforas - ar jos veiksmingos, ar labiau klaidina?
        6. Įvertinti, kaip gerai integruoti Gabijos pateikti faktai
        7. Atsakyti į Gabijos užduotą klausimą` :
        
        `Tavo užduotis:
        1. Įvertink teksto stiprybes (aiškumą, originalumą, įtaigą) - pateik konkrečius pavyzdžius
        2. Nurodyk tobulintinas vietas (struktūra, argumentacija, kalbos vartojimas) - pateik konkrečius pavyzdžius
        3. Pasiūlyk konkrečius patobulinimus kiekvienai probleminei vietai
        4. Išanalizuok Jono metaforas - kurios jų veikia, kurios ne?
        5. Įvertink Gabijos pateiktų šaltinių patikimumą
        6. Pateik bendrą įvertinimą ir užduok klausimą Eglei`
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

 * Tu esi Tauris – biuro šefas.
 * Tu stebi bendradarbiavimo procesą per ${iterationNumber} iteracijas ir užtikrini, 
 * kad galutinis rezultatas būtų optimalus, aiškus ir profesionalus.
 * Tavo užduotis – kruopščiai įvertinti visų darbuotojų indėlį ir sukurti išbaigtą tekstą.


### **Tavo užduotis:**

1. **Apdorok ir integruok visų keturių darbuotojų įžvalgas:**
   - 🧠 **Jonas** – kūrybinės idėjos ir inovatyvūs sprendimai.
   - 📚 **Gabija** – faktinė informacija, šaltiniai ir argumentuota analizė.
   - 🏗️ **Vytautas** – loginė struktūra, kritinė analizė ir aiškumas.
   - ✍️ **Eglė** – redagavimas, gramatika ir stilistika.

2. **Sukurk aiškią ir sklandžią teksto struktūrą:**
   - **Įžanga:** Temos pristatymas, jos svarba ir problematikos iškėlimas.
   - **Pagrindinė dalis:** Logiškai išdėstytos argumentuotos mintys, įžvalgos ir kūrybiniai elementai.
   - **Išvados:** Apibendrinimas, esminės įžvalgos ir galutinė pozicija.

3. **Kruopščiai redaguok ir optimizuok tekstą:**
   - **Užtikrink faktinį tikslumą** (Gabijos pateikta informacija turi būti patikrinta ir pagrįsta šaltiniais).
   - **Išlaikyk loginį aiškumą** (Vytauto kritiką panaudok struktūros patobulinimui).
   - **Išsaugok kūrybiškumą** (Jono idėjos turi būti integruotos taip, kad tekstas būtų įtraukiantis).
   - **Užtikrink stilistinį vientisumą** (Eglė atsakinga už kalbos sklandumą ir taisyklingumą).

4. **Tvarkyk šaltinius pagal Lietuvos akademinius citavimo standartus:**
   - **Cituok šaltinius pagal reikalavimus**, įtraukiant tekstines nuorodas ir išnašas.
   - **Bibliografiją pateik teksto pabaigoje** pagal Lietuvos akademinio rašymo principus.
   - **Kiekvienas faktas, reikalaujantis pagrindimo, turi būti patvirtintas nurodytu šaltiniu.**

5. **Venk plagiato ir užtikrink originalumą:**
   - **Nekopijuok teksto be tinkamo citavimo.**
   - **Naudok parafrazavimą ir originalią interpretaciją, o ne paprastą kopijavimą.**
   - **Pateik cituojamus fragmentus atsakingai, aiškiai nurodant šaltinį.**

### **LABAI SVARBU:**
**Priimk galutinį tekstą TIK remdamasis Jono, Gabijos, Vytauto ir Eglės indėliu.**  
**Pateik TIK išbaigtą plačiai aprašyta tekstą be papildomų pastabų ar komentarų apie procesą.**  
**Nekeisk teksto struktūros be pagrįstos priežasties – jis turi išlaikyti loginę tėkmę.**  
**Cituok šaltinius pagal Lietuvos akademinio rašymo reikalavimus ir pateik bibliografiją pabaigoje.**  
**Tekstas turi būti aiškus, nuoseklus, įtraukiantis ir profesionalus ir neatrodytų, kad parašytas dirbtinio intelekto.**  
**Plagiatas netoleruojamas – kiekvienas faktas turi būti pagrįstas.**  
**Galutinį rezultatą pateik taip:**  
**„Štai galutinis kliento tekstas:“**  
*(Toliau eina aiškiai suredaguotas, profesionalus ir pilnai suformuotas tekstas iš iteracijų proceso atsižvelk į visų darbuotojų indelį iš ${iterationNumber} pabaigoje nepalik jokių komentarų tik galutinį tekstą.)*  
`;
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
        .replace(/^.*?(štai ką parašiau|štai mano tekstas|parašiau tokį tekstą).*?:/si, '')
        // Remove signatures and handoffs
        .replace(/gabija[a-zA-ZĄČĘĖĮŠŲŪąčęėįšųū\s,]*$/si, '')
        .replace(/vytautas[a-zA-ZĄČĘĖĮŠŲŪąčęėįšųū\s,]*$/si, '')
        .replace(/eglė[a-zA-ZĄČĘĖĮŠŲŪąčęėįšųū\s,]*$/si, '')
        .replace(/jonas[a-zA-ZĄČĘĖĮŠŲŪąčęėįšųū\s,]*$/si, '')
        .replace(/tauris[a-zA-ZĄČĘĖĮŠŲŪąčęėįšųū\s,]*$/si, '')
        .replace(/perduodu.*?gabijai.*$/si, '')
        .replace(/perduodu.*?vytautui.*$/si, '')
        .replace(/perduodu.*?eglei.*$/si, '')
        .replace(/perduodu.*?jonui.*$/si, '')
        // Remove other ending sentences
        .replace(/tikiuosi.*?$/si, '')
        .replace(/linkiu.*?$/si, '')
        // Remove any remaining English phrases that might have slipped through
        .replace(/as the (writer|researcher|critic|editor|boss).*?:/gi, '')
        .replace(/i've (drafted|enhanced|evaluated|refined|reviewed).*?:/gi, '')
        .replace(/\[CONTENT_START\]/gi, '')
        .replace(/\[CONTENT_END\]/gi, '')
        .trim();

    // Remove markdown formatting
    if (window.StampEffects && typeof window.StampEffects.cleanMarkdownFormatting === 'function') {
        cleaned = window.StampEffects.cleanMarkdownFormatting(cleaned);
    } else {
        // Fallback markdown cleaning if StampEffects not available
        cleaned = cleaned
            // Remove headers (# Header)
            .replace(/^#+\s+(.*)$/gm, '$1')
            // Remove bold/italic markers
            .replace(/(\*\*|\*|__|_)(.*?)\1/g, '$2')
            // Remove horizontal rules
            .replace(/^\s*[-*_]{3,}\s*$/gm, '')
            // Remove blockquotes
            .replace(/^>\s+(.*)$/gm, '$1')
            // Clean multiple consecutive line breaks
            .replace(/\n{3,}/g, '\n\n');
    }

    return cleaned;
}

// Display the final result in the UI
function displayFinalResult(resultText) {
    const processedText = cleanUpFinalResult(resultText);
    finalResult.textContent = processedText;
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

LABAI SVARBU: Tavo atsakyme pateik TIK galutinį tekstą, nepridedant jokios analizės ar komentarų apie tekstą. NEPRIDĖK JOKIŲ PUNKTŲ APIE TEKSTO KOKYBĘ AR STRUKTŪRĄ. Nepridėk "Galutinės analizės" sekcijos - pateik tik patį išbaigtą plačiai parašyta tekstą.

Tai bus GALUTINIS šio darbo rezultatas, todėl jis turi būti išskirtinės, nepriekaištingos kokybės.
Pradėk nuo frazės: "Štai galutinis šio teksto variantas:"`;

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
            .replace(/^.*?(štai galutinis|ačiū visiems už įdėtą darbą|štai mano galutinė|peržiūrėjau visų darbą).*?:/si, '')
            .trim();

        // Remove common closing phrases
        cleanText = cleanText
            .replace(/su pagarba.*?$/si, '')
            .replace(/tauris.*?$/si, '')
            .replace(/šefas.*?$/si, '')
            .trim();
            
        // Remove the analysis section that might appear at the end
        cleanText = cleanText
            .replace(/Galutinė analizė ir komentarai:[\s\S]*$/i, '')
            .replace(/Sukurta aiški struktūra:[\s\S]*$/i, '')
            .replace(/\d+\.\s*Sukurta aiški struktūra[\s\S]*$/i, '')
            .replace(/\d+\.\s*Gabijos pateikti[\s\S]*$/i, '')
            .replace(/Puikus komandos darbas!.*$/i, '')
            .trim();
            
        // Clean markdown formatting added by the boss
        if (window.StampEffects && typeof window.StampEffects.cleanMarkdownFormatting === 'function') {
            cleanText = window.StampEffects.cleanMarkdownFormatting(cleanText);
        }

        return cleanText;
    }

    // ...existing code...

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

    // Naudojame sanitizeHTML, kad išvengtume galimų XSS įterpimų
    const safeRole = sanitizeHTML(displayRole);
    const safeMessage = sanitizeHTML(message);
    messageEl.innerHTML = `<strong>${safeRole}:</strong> ${safeMessage}`;
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
function updateProgress() { 
    const progressBar = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (!progressBar || !progressText) return;
    
    // Calculate progress based on current worker
    const totalWorkers = workerSequence.length; // Use actual worker sequence length
    const currentIndex = getCurrentWorkerIndex();
    const progress = Math.min(Math.round((currentIndex / totalWorkers) * 100), 100);
    
    // Update UI
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${progress}%`;
}

function setResultStatus(status = '') {
    const resultStatus = document.getElementById('resultStatus');
    if (resultStatus) {
        resultStatus.textContent = status ? `(${status})` : '';
    }
}

function showCompletedStamp() {
    // Add the completed stamp to the result
    const resultContent = document.getElementById('finalResult');
    if (resultContent) {
        // Create stamp if it doesn't exist
        let stamp = document.querySelector('.boss-approval-stamp');
        if (!stamp) {
            stamp = document.createElement('div');
            stamp.className = 'boss-approval-stamp';
            stamp.innerHTML = '<div class="boss-approval-animation">PATVIRTINTA</div>';
            resultContent.appendChild(stamp);
        }
        
        // Show the stamp with animation
        stamp.classList.add('active');
        
        // Play stamp sound if available
        if (typeof StampEffects !== 'undefined' && StampEffects.playStampSound) {
            StampEffects.playStampSound();
        }
    }
}

});