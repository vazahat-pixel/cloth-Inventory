const Formula = require('../models/formula.model');

/**
 * Formula Engine to auto-generate item names based on attributes and codes.
 */
class FormulaEngine {
  /**
   * Generates a name for an item based on its data and active formula.
   * @param {Object} itemData - The item being created/updated.
   * @param {String} formulaName - Name of the formula to use (e.g., 'primary').
   */
  async generateName(itemData, formulaName = 'primary') {
    const formulaDoc = await Formula.findOne({ name: formulaName, isActive: true });
    if (!formulaDoc) {
      // Fallback if no formula is defined
      return itemData.name || 'UNNAMED ITEM';
    }

    let name = formulaDoc.formula;
    
    // Mapping of placeholders to item data
    // Example formula: "{fabric} {design} {shade} - {itemCode}"
    const placeholders = {
      fabric: itemData.attributes?.fabric || '',
      design: itemData.attributes?.design || '',
      shade: itemData.shade || '',
      itemCode: itemData.itemCode || '',
      brand: itemData.brand || '',
      type: itemData.attributes?.type || '',
      season: itemData.session || ''
    };

    // Replace all placeholders in current formula
    for (const [key, value] of Object.entries(placeholders)) {
      const regex = new RegExp(`{${key}}`, 'gi');
      name = name.replace(regex, value);
    }

    // Clean up extra spaces
    return name.replace(/\s+/g, ' ').trim();
  }
}

module.exports = new FormulaEngine();
