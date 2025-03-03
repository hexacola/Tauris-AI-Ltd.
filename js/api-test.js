/**
 * This file can be used to test the API directly from the browser console
 * Open your browser console and run the functions here to test
 */

// Function to test API response for a specific model
async function testModel(model) {
    console.log(`Testing model: ${model}`);
    
    try {
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: 'You are a helpful research assistant. Provide a brief response.' },
                    { role: 'user', content: 'What are the three main types of machine learning?' }
                ],
                model: model,
                private: true
            })
        });
        
        if (!response.ok) {
            console.error(`API error: ${response.status}`);
            return;
        }
        
        const contentType = response.headers.get('content-type');
        console.log(`Content type: ${contentType}`);
        
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            console.log(`Response for model ${model}:`, data);
            if (data.choices && data.choices[0] && data.choices[0].message) {
                console.log('Extracted text:', data.choices[0].message.content);
            }
        } else {
            const text = await response.text();
            console.log(`Raw text response for ${model}:`, text);
        }
    } catch (error) {
        console.error(`Test failed for model ${model}:`, error);
    }
}

// Function to test all models
async function testAllModels() {
    try {
        const response = await fetch('https://text.pollinations.ai/models');
        const models = await response.json();
        
        console.log('Available models:', models);
        
        // Test only chat models
        const chatModels = models.filter(m => m.type === 'chat');
        console.log(`Testing ${chatModels.length} chat models...`);
        
        for (const model of chatModels) {
            await testModel(model.name);
            // Wait a bit between requests
            await new Promise(r => setTimeout(r, 1000));
        }
    } catch (error) {
        console.error('Error fetching or testing models:', error);
    }
}

// Function to test API using the documented format
async function testApiDocumentation() {
    console.log("Testing API using documentation formats...");
    
    // Test POST method
    try {
        console.log("Testing POST method...");
        const postResponse = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: 'What is artificial intelligence?' }
                ],
                model: 'mistral',
                seed: 42,
                private: true
            })
        });
        
        if (postResponse.ok) {
            const data = await postResponse.json();
            console.log("POST successful:", data);
        } else {
            console.error("POST failed with status:", postResponse.status);
        }
    } catch (error) {
        console.error("POST test error:", error);
    }
    
    // Test GET method
    try {
        console.log("Testing GET method...");
        const encodedPrompt = encodeURIComponent("What is artificial intelligence?");
        const encodedSystem = encodeURIComponent("You are a helpful assistant.");
        const url = `https://text.pollinations.ai/${encodedPrompt}?model=mistral&system=${encodedSystem}&seed=42&private=true`;
        
        const getResponse = await fetch(url);
        if (getResponse.ok) {
            const text = await getResponse.text();
            console.log("GET successful:", text);
        } else {
            console.error("GET failed with status:", getResponse.status);
        }
    } catch (error) {
        console.error("GET test error:", error);
    }
}

// Add function to test long response generation
async function testLongResponseGeneration(model = 'openai-large') {
    console.log(`Testing long response generation with model: ${model}`);
    
    try {
        const startTime = Date.now();
        console.log(`Starting request at ${new Date().toLocaleTimeString()}`);
        
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { 
                        role: 'system', 
                        content: 'You are a detailed academic writer. Provide comprehensive, in-depth responses with multiple sections.' 
                    },
                    { 
                        role: 'user', 
                        content: 'Write a detailed analysis of climate change impacts, including scientific evidence, policy implications, and recommended solutions. Include plenty of detail in each section.' 
                    }
                ],
                model: model,
                private: true,
                max_tokens: 8192  // Request maximum token length
            })
        });
        
        const duration = (Date.now() - startTime) / 1000;
        console.log(`Request completed in ${duration.toFixed(1)} seconds`);
        
        if (!response.ok) {
            console.error(`API error: ${response.status}`);
            return;
        }
        
        const contentType = response.headers.get('content-type');
        console.log(`Content type: ${contentType}`);
        
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                const text = data.choices[0].message.content;
                console.log(`Response length: ${text.length} characters`);
                console.log(`Response first 100 chars: ${text.substring(0, 100)}...`);
                console.log(`Response last 100 chars: ...${text.substring(text.length - 100)}`);
                
                // Check if response appears to be truncated
                const lastPunctuation = text.search(/[.!?][\s]*$/);
                console.log(`Response properly terminated: ${lastPunctuation > text.length - 20}`);
            }
        } else {
            const text = await response.text();
            console.log(`Response length: ${text.length} characters`);
        }
    } catch (error) {
        console.error(`Test failed for long response with model ${model}:`, error);
    }
}

// Add to window for easy console access
window.testModel = testModel;
window.testAllModels = testAllModels;
window.testApiDocumentation = testApiDocumentation;
window.testLongResponseGeneration = testLongResponseGeneration; // Add the new test function
