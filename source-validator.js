// Source validation utility for the researcher role

/**
 * Basic validation of URLs in researcher responses
 * @param {string} text - The researcher's response text
 * @returns {object} - Validation results
 */
function validateResearcherSources(text) {
    const result = {
        valid: true,
        issues: [],
        urlCount: 0
    };
    
    // Check if there are any URLs at all
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex) || [];
    result.urlCount = matches.length;
    
    if (matches.length === 0) {
        result.valid = false;
        result.issues.push("No URLs found in the text");
    }
    
    // Check for placeholder domains
    const placeholderDomains = [
        "example.com",
        "example.org",
        "sample",
        "domain.com",
        "website.com",
        "placeholder"
    ];
    
    matches.forEach(url => {
        if (placeholderDomains.some(domain => url.includes(domain))) {
            result.valid = false;
            result.issues.push(`Found placeholder URL: ${url}`);
        }
    });
    
    // Check for academic citation format without actual URLs
    if (text.includes("Journal of") && matches.length < 2) {
        result.issues.push("Academic citations found but too few URLs - might be using fictional sources");
    }
    
    return result;
}

window.SourceValidator = {
    validateResearcherSources
};
