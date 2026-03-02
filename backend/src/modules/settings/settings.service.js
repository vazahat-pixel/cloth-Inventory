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
        legalName: '',
        gstin: '',
        pan: '',
        address: { line1: '', city: '', state: '', pincode: '' },
        phone: '',
        email: '',
        financialYearStart: '04-01'
    }),
    updateCompanyProfile: (data, userId) => updateSetting('company_profile', data, userId),
    getSetting,
    updateSetting,
    addToCollection,
    updateInCollection
};
