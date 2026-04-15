const Settings = require('../../models/settings.model');

/**
 * Generic Get Setting
 */
const getSetting = async (key, defaultValue = {}) => {
    const settings = await Settings.findOne({ key });
    return settings ? settings.value : defaultValue;
};

/**
 * Generic Update Setting
 */
const updateSetting = async (key, value, userId) => {
    let settings = await Settings.findOne({ key });
    if (!settings) {
        settings = new Settings({ key, value, updatedBy: userId });
    } else {
        settings.value = value;
        settings.updatedBy = userId;
        settings.markModified('value');
    }
    await settings.save();
    return settings.value;
};

/**
 * Collection-based updates (for arrays like roles, number series)
 */
const addToCollection = async (key, item, userId) => {
    let settings = await Settings.findOne({ key });
    if (!settings) {
        settings = new Settings({ key, value: [{ id: Date.now().toString(), ...item }], updatedBy: userId });
    } else {
        settings.value.unshift({ id: Date.now().toString(), ...item });
        settings.updatedBy = userId;
        settings.markModified('value');
    }
    await settings.save();
    return settings.value[0];
};

const updateInCollection = async (key, itemId, updates, userId) => {
    let settings = await Settings.findOne({ key });
    if (!settings) throw new Error('Setting not found');

    const index = settings.value.findIndex(i => i.id === itemId);
    if (index === -1) throw new Error('Item not found in collection');

    settings.value[index] = { ...settings.value[index], ...updates };
    settings.updatedBy = userId;
    settings.markModified('value');
    await settings.save();
    return settings.value[index];
};

module.exports = {
    getCompanyProfile: () => getSetting('company_profile', {
        businessName: '',
        legalName: 'REBEL MASS EXPORT PVT LTD',
        gstin: '06AAJCR6675A1ZB',
        pan: '',
        logo: '',
        address: { address: 'PLOT NO 418 PHASE 3 SECTOR - 53 HSIIDC KUNDLI', city: 'SONIPAT', state: 'HARYANA', pincode: '131028' },
        phone: '9999999999',
        email: 'warehouse@example.com',
        financialYearStart: '04-01'
    }),
    updateCompanyProfile: (data, userId) => updateSetting('company_profile', data, userId),
    getInvoicingConfig: () => getSetting('invoicing_config', {
        invoicePrefix: 'REB/',
        dcPrefix: 'DC/',
        purchasePrefix: 'PUR/',
        termsAndConditions: '1. We declare that this invoice shows the actual price of the goods described.\n2. All disputes subject to SONIPAT (HARYANA) jurisdiction only.\n3. Goods once sold will be exchanged within 7 days only if in original condition.',
        declaration: 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
        bankDetails: {
            bankName: '',
            accountNo: '',
            ifsc: '',
            branch: ''
        }
    }),
    updateInvoicingConfig: (data, userId) => updateSetting('invoicing_config', data, userId),
    getSetting,
    updateSetting,
    addToCollection,
    updateInCollection
};
