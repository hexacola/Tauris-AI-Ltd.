/**
 * This file contains phrases and templates used by the boss character
 */

const BossPhrases = {
    /**
     * Standard introduction for final document
     */
    finalIntro: "Štai galutinis šio teksto variantas:",
    
    /**
     * Regex patterns to remove from boss output
     */
    cleanupPatterns: [
        // Introduction patterns
        /^.*?(štai galutinis|ačiū visiems už įdėtą darbą|štai mano galutinė|peržiūrėjau visų darbą).*?:/si,
        
        // Conclusion/signature patterns
        /su pagarba.*?$/si,
        /tauris.*?$/si,
        /šefas.*?$/si,
        
        // Analysis section patterns
        /Galutinė analizė ir komentarai:[\s\S]*$/i,
        /Sukurta aiški struktūra:[\s\S]*$/i,
        /\d+\.\s*Sukurta aiški struktūra[\s\S]*$/i,
        /\d+\.\s*Gabijos pateikti[\s\S]*$/i,
        /Puikus komandos darbas!.*$/i,
        
        // Team acknowledgments
        /Ačiū\s+[A-Za-zĄČĘĖĮŠŲŪŽąčęėįšųūž]+\s+(už|ir).*/gi,
        /Dėkoju\s+[A-Za-zĄČĘĖĮŠŲŪŽąčęėįšųūž]+\s+(už|ir).*/gi,
        /Noriu padėkoti.*/gi,
        /Bendras\s+komandos\s+ind[ėe]lis.*/gi,
        /Komandos\s+pastangomis.*/gi,
        /Mūsų\s+komanda\s+atliko.*/gi
    ],
    
    /**
     * Clean boss output to keep only the final text
     * @param {string} text - The raw text from boss
     * @returns {string} - Cleaned text with only the final document
     */
    cleanOutput(text) {
        if (!text) return "";
        
        // Apply all cleanup patterns
        let cleaned = text;
        this.cleanupPatterns.forEach(pattern => {
            cleaned = cleaned.replace(pattern, '');
        });
        
        return cleaned.trim();
    },
    
    /**
     * Get prompt for boss
     * @param {string} initialTopic - The topic of the document
     * @returns {string} - Boss prompt instructions
     */
    getBossPrompt(initialTopic) {
        return `Tavo tikslas - peržvelgti visų ankstesnių darbuotojų (Jono, Gabijos, Vytauto ir Eglės) darbą ir pateikti GALUTINĘ versiją, kuri apjungia visų geriausias dalis į vieną nuoseklų, aukštos kokybės akademinį tekstą.

TEMA: "${initialTopic}"

Reikalavimai galutiniam tekstui:
1. Aiški struktūra ir nuoseklus minčių dėstymas
2. Visi svarbūs faktai ir šaltiniai iš Gabijos tyrimo
3. Problemos ištaisytos pagal Vytauto kritiką
4. Eglės atliktos kalbos ir stiliaus korekcijos
5. Jono originalios idėjos ir kūrybiškumas

LABAI SVARBU: Tavo atsakyme pateik TIK galutinį tekstą, nepridedant jokios analizės ar komentarų apie tekstą. NEPRIDĖK PUNKTŲ APIE TEKSTO KOKYBĘ. NEREIKIA RAŠYTI "Galutinė analizė ir komentarai:" AR PANAŠIŲ DALIŲ.

Pradėk nuo frazės: "${this.finalIntro}"`;
    }
};

// Make available globally
window.BossPhrases = BossPhrases;
