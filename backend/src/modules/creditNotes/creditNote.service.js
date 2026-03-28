const CreditNote = require('../../models/creditNote.model');

const generateCreditNoteNumber = async () => {
    const count = await CreditNote.countDocuments();
    return `CN-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
};

const getAllCreditNotes = async (query = {}) => {
    const { customerId, status, page = 1, limit = 50 } = query;
    const filter = {};
    if (customerId) filter.customerId = customerId;
    if (status) filter.status = status;
    const skip = (page - 1) * limit;
    const [creditNotes, total] = await Promise.all([
        CreditNote.find(filter)
            .populate('customerId', 'name phone')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        CreditNote.countDocuments(filter)
    ]);
    return { creditNotes, total, page: parseInt(page), limit: parseInt(limit) };
};

const createCreditNote = async (data, userId) => {
    const creditNoteNumber = await generateCreditNoteNumber();
    const creditNote = await CreditNote.create({
        ...data,
        creditNoteNumber,
        remainingAmount: data.remainingAmount ?? data.totalAmount,
        createdBy: userId
    });
    return creditNote.populate('customerId', 'name phone');
};

const updateCreditNote = async (id, updates) => {
    const creditNote = await CreditNote.findByIdAndUpdate(id, { $set: updates }, { new: true })
        .populate('customerId', 'name phone');
    if (!creditNote) throw new Error('Credit note not found');
    return creditNote;
};

module.exports = {
    getAllCreditNotes,
    createCreditNote,
    updateCreditNote
};
