const Document = require('../../models/document.model');
const { DocumentStatus } = require('../../core/enums');
const { withTransaction } = require('../../services/transaction.service');
const { getNextSequence } = require('../../services/sequence.service');

/**
 * Generate unique Document Number (DOC-YYYY-XXXXX)
 */
const generateDocumentNumber = async (type, session = null) => {
    const year = new Date().getFullYear();
    const prefix = `${type}-${year}-`;
    const counterName = `DOC_${type}_${year}`;

    const seq = await getNextSequence(counterName, session);
    return `${prefix}${seq.toString().padStart(5, '0')}`;
};

/**
 * Create a new Document
 */
const createDocument = async (docData, userId) => {
    return await withTransaction(async (session) => {
        const documentNumber = await generateDocumentNumber(docData.type, session);
        
        const document = new Document({
            ...docData,
            documentNumber,
            createdBy: userId,
            status: DocumentStatus.DRAFT
        });

        await document.save({ session });
        return document;
    });
};

/**
 * List Documents with filters and pagination
 */
const getAllDocuments = async (query) => {
    const { page = 1, limit = 10, type, status, branchId, warehouseId } = query;
    const filter = { isDeleted: false };

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (branchId) filter.branchId = branchId;
    if (warehouseId) filter.warehouseId = warehouseId;

    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
        Document.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('createdBy', 'name email')
            .populate('approvedBy', 'name email')
            .populate('branchId', 'name')
            .populate('warehouseId', 'name')
            .populate('items.productId', 'name sku barcode'),
        Document.countDocuments(filter)
    ]);

    return { documents, total, page: parseInt(page), limit: parseInt(limit) };
};

/**
 * Approve a Document
 */
const approveDocument = async (id, userId) => {
    return await withTransaction(async (session) => {
        const document = await Document.findById(id).session(session);
        if (!document) throw new Error('Document not found');
        if (document.status !== DocumentStatus.DRAFT) throw new Error(`Only draft documents can be approved (Current: ${document.status})`);

        document.status = DocumentStatus.APPROVED;
        document.approvedBy = userId;
        await document.save({ session });

        // Logic for downstream actions (like updating inventory) could be added here
        
        return document;
    });
};

/**
 * Reject a Document
 */
const rejectDocument = async (id, userId) => {
    return await withTransaction(async (session) => {
        const document = await Document.findById(id).session(session);
        if (!document) throw new Error('Document not found');
        if (document.status !== DocumentStatus.DRAFT) throw new Error(`Only draft documents can be rejected (Current: ${document.status})`);

        document.status = DocumentStatus.REJECTED;
        document.approvedBy = userId;
        await document.save({ session });

        return document;
    });
};

module.exports = {
    createDocument,
    getAllDocuments,
    approveDocument,
    rejectDocument
};
