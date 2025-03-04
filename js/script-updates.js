// These are updates to apply to the existing script.js file

// Update the populateModelOptions function to ensure we only show chat models
async function populateModelOptions() {
    try {
        updateStatus("Loading available models...");
        const models = await ApiHelper.getAvailableModels();
        
        // Clear existing options
        const modelSelects = document.querySelectorAll('.model-select');
        modelSelects.forEach(select => {
            select.innerHTML = '';
        });
        
        // Add models to select elements - only include chat models
        models.forEach(model => {
            if (model.type === 'chat') {
                const option = document.createElement('option');
                option.value = model.name;
                
                // Create a descriptive label
                let description = model.description || model.name;
                if (model.baseModel) {
                    description += " (Base Model)";
                }
                option.textContent = description;
                
                modelSelects.forEach(select => {
                    select.appendChild(option.cloneNode(true));
                });
            }
        });
        
        // Set default models for each worker
        const modelDefaults = {
            'writerModel': 'openai',
            'researcherModel': 'mistral',
            'criticModel': 'llama',
            'editorModel': 'deepseek'
        };
        
        // Apply defaults if available
        for (const [elementId, defaultModel] of Object.entries(modelDefaults)) {
            const element = document.getElementById(elementId);
            if (element && models.some(m => m.name === defaultModel)) {
                element.value = defaultModel;
            }
        }
        
        updateStatus("Models loaded successfully", "success");
    } catch (error) {
        console.error("Error loading models:", error);
        updateStatus(`Error loading models: ${error.message}`, "error");
    }
}

// Update the generateResponse function to use our improved ApiHelper
async function generateResponse(prompt, systemPrompt, model) {
    try {
        // Check if model is valid
        const modelCheck = await ApiHelper.isModelAvailable(model);
        if (!modelCheck) {
            throw new Error(`Model '${model}' is not available for chat. Using fallback model.`);
        }
        
        // Enhanced system prompt with specific instructions to improve quality
        const enhancedSystemPrompt = `${systemPrompt}

IMPORTANT INSTRUCTIONS:
1. You must respond in plain text format only.
2. Do not include any HTML or markdown code in your response.
3. Always acknowledge and directly respond to the previous message in the collaboration.
4. Keep your response concise but complete and well-structured.
5. Include your specific perspective based on your assigned role.`;

        // Use the ApiHelper to generate text
        return await ApiHelper.generateText(prompt, enhancedSystemPrompt, model);
    } catch (error) {
        console.error(`Error in generateResponse with model ${model}:`, error);
        throw error;
    }
}

// Update the continueCollaboration function to add additional validation of responses
async function continueCollaboration(initialMessage = null, isFirstMessage = false) {
    // ...existing function code...
    
    try {
        // ...existing prompt building code...
        
        // Get the response
        let response = await tryGenerateResponseWithFallback(prompt, worker.systemPrompt, worker.model(), workerKey);
        
        // Validate the response - make sure it's not HTML or too short
        if (response.trim().startsWith('<!DOCTYPE') || response.trim().startsWith('<html')) {
            throw new Error("Received HTML instead of a proper response");
        }
        
        if (response.length < 20) {
            throw new Error("Response is too short or empty");
        }
        
        // Continue with the rest of the function...
    } catch (error) {
        // ...existing error handling code...
    }
}
