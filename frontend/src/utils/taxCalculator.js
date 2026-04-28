/**
 * Calculate GST based on taxable value and tax rules.
 * @param {number} taxableValue - The value before tax.
 * @param {string} hsnCode - The HSN code of the item.
 * @param {string} category - The category of the item.
 * @param {Array} taxRules - List of tax rules from the database.
 * @returns {Object} - { rate, ruleName, type, message }
 */
export const calculateGST = (taxableValue, hsnCode, category, taxRules = []) => {
    if (!taxRules || taxRules.length === 0) {
        // Fallback if rules are not loaded
        return {
            rate: taxableValue > 2499 ? 18 : 5,
            ruleName: 'Hardcoded Fallback',
            type: 'FALLBACK',
            message: `${taxableValue > 2499 ? 18 : 5}% GST Applied (Default Slab)`
        };
    }

    // 1. Check for FLAT rules (highest priority)
    // We check HSN first, then Category
    const flatRule = taxRules.find(r => 
        r.type === 'FLAT' && 
        ((r.hsnCode && String(r.hsnCode) === String(hsnCode)) || (r.category && String(r.category).toLowerCase() === String(category).toLowerCase()))
    );
    
    if (flatRule) {
        return {
            rate: flatRule.gst,
            ruleName: flatRule.name,
            type: 'FLAT',
            message: `${flatRule.gst}% GST Applied (Flat Rate: ${flatRule.name})`
        };
    }
    
    // 2. Check for SLAB rules
    // Slabs are usually based on the unit price.
    const slabRule = taxRules.find(r => 
        r.type === 'SLAB' && 
        taxableValue >= r.min && 
        (r.max === null || taxableValue <= r.max)
    );
    
    if (slabRule) {
        return {
            rate: slabRule.gst,
            ruleName: slabRule.name,
            type: 'SLAB',
            message: `${slabRule.gst}% GST Applied (${slabRule.name})`
        };
    }
    
    // Default fallback if no rule matches
    const fallbackRate = taxableValue > 2499 ? 18 : 5;
    return {
        rate: fallbackRate,
        ruleName: 'Default',
        type: 'FALLBACK',
        message: `${fallbackRate}% GST Applied (Default)`
    };
};
