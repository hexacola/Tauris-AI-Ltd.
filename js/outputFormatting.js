/**
 * OutputFormatting - Utility for structured AI outputs and response formatting
 * Based on best practices from OpenAI guidelines for structured outputs
 */

const OutputFormatting = {
    /**
     * Creates a structured JSON schema for worker responses
     * @param {string} workerType - The type of worker (writer, researcher, critic, editor, boss)
     * @returns {Object} JSON schema definition for the worker's output
     */
    getOutputSchema: function(workerType) {
        // Base schema properties that all workers share
        const baseSchema = {
            type: "object",
            properties: {
                thinking: {
                    type: "array",
                    description: "Step-by-step reasoning process (not shown to users)",
                    items: {
                        type: "string"
                    }
                },
                content: {
                    type: "string",
                    description: "The main content produced by the worker"
                }
            },
            required: ["thinking", "content"]
        };

        // Add worker-specific schema properties
        switch(workerType) {
            case 'writer':
                return {
                    ...baseSchema,
                    properties: {
                        ...baseSchema.properties,
                        structure: {
                            type: "object",
                            description: "The structure of the written content",
                            properties: {
                                introduction: { type: "string", description: "Brief description of the introduction" },
                                mainPoints: { 
                                    type: "array", 
                                    description: "Main points of the content", 
                                    items: { type: "string" } 
                                },
                                conclusion: { type: "string", description: "Brief description of the conclusion" }
                            }
                        }
                    },
                    required: ["thinking", "content", "structure"]
                };
            
            case 'researcher':
                return {
                    ...baseSchema,
                    properties: {
                        ...baseSchema.properties,
                        sources: {
                            type: "array",
                            description: "Research sources used",
                            items: {
                                type: "object",
                                properties: {
                                    title: { type: "string" },
                                    url: { type: "string" },
                                    authors: { type: "string" },
                                    year: { type: "string" },
                                    relevance: { 
                                        type: "string", 
                                        description: "Brief explanation of source relevance" 
                                    }
                                },
                                required: ["title", "url"]
                            }
                        },
                        factChecks: {
                            type: "array",
                            description: "Key facts verified during research",
                            items: {
                                type: "object",
                                properties: {
                                    claim: { type: "string" },
                                    verification: { 
                                        type: "string", 
                                        enum: ["verified", "disputed", "unverified"] 
                                    },
                                    evidence: { type: "string" },
                                    sourceIndex: { 
                                        type: "number", 
                                        description: "Index of the source in sources array" 
                                    }
                                },
                                required: ["claim", "verification"]
                            }
                        }
                    },
                    required: ["thinking", "content", "sources"]
                };
                
            case 'critic':
                return {
                    ...baseSchema,
                    properties: {
                        ...baseSchema.properties,
                        evaluation: {
                            type: "object",
                            properties: {
                                strengths: {
                                    type: "array",
                                    items: { type: "string" }
                                },
                                weaknesses: {
                                    type: "array",
                                    items: { type: "string" }
                                },
                                suggestions: {
                                    type: "array",
                                    items: { type: "string" }
                                },
                                overallScore: {
                                    type: "number",
                                    description: "Quality score from 1-10"
                                }
                            },
                            required: ["strengths", "weaknesses", "suggestions"]
                        }
                    },
                    required: ["thinking", "content", "evaluation"]
                };
                
            case 'editor':
                return {
                    ...baseSchema,
                    properties: {
                        ...baseSchema.properties,
                        changes: {
                            type: "array",
                            description: "List of significant changes made",
                            items: {
                                type: "object",
                                properties: {
                                    type: { 
                                        type: "string", 
                                        enum: ["grammar", "style", "structure", "clarity", "other"] 
                                    },
                                    description: { type: "string" }
                                },
                                required: ["type", "description"]
                            }
                        }
                    },
                    required: ["thinking", "content", "changes"]
                };
                
            case 'boss':
                return {
                    ...baseSchema,
                    properties: {
                        ...baseSchema.properties,
                        finalDocument: {
                            type: "object",
                            properties: {
                                title: { type: "string" },
                                sections: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            heading: { type: "string" },
                                            content: { type: "string" }
                                        },
                                        required: ["content"]
                                    }
                                },
                                references: {
                                    type: "array",
                                    items: { type: "string" }
                                }
                            },
                            required: ["sections"]
                        }
                    },
                    required: ["thinking", "content", "finalDocument"]
                };
                
            default:
                return baseSchema;
        }
    },

    /**
     * Creates a prompt instruction for generating structured output
     * @param {string} workerType - The type of worker
     * @returns {string} Instructions for generating structured output
     */
    getStructuredOutputInstructions: function(workerType) {
        const schema = this.getOutputSchema(workerType);
        
        return `
INSTRUKCIJOS STRUKTŪRINIAM ATSAKYMUI:
1. Savo atsakymą PRIVALAI pateikti dvejose dalyse.
2. PIRMA: Atsakyk įprastai, lietuvių kalba, su pilnais sakiniais.
3. ANTRA: Po savo įprasto atsakymo, įterpk specialią sekciją - JSON objektą, kuris atitinka šią struktūrą:

\`\`\`json
${JSON.stringify(schema, null, 2)}
\`\`\`

JSON objektas PRIVALO būti tarp \`\`\`json ir \`\`\` žymų
`; // Added the missing closing backtick here
    }
};