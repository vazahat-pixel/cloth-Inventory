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
 * 1. Create a new Document
 * Supports specifying entityName (Supplier/Customer) for easy visibility.
 */
const createDocument = async (docData, userId) => {
    return await withTransaction(async (session) => {
        const documentNumber = await generateDocumentNumber(docData.type, session);
        
        const document = new Document({
            ...docData,
            documentNumber,
            createdBy: userId,
            status: docData.status || DocumentStatus.DRAFT
        });

        await document.save({ session });
        return document;
    });
};

/**
 * 2. List Documents and ENHANCE ERP visibility with filters and search.
 * Filter by Type (PO, GRN, QC, SALE)
 * Filter by Status (PENDING, APPROVED)
 * Search by Number or Supplier/Customer
 */
const getAllDocuments = async (query) => {
    const { page = 1, limit = 10, type, status, search, branchId, warehouseId } = query;
    const filter = { isDeleted: false };

    // Advanced Filters
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (branchId) filter.branchId = branchId;
    if (warehouseId) filter.warehouseId = warehouseId;

    // Search globally across key identifiers
    if (search) {
        filter.$or = [
            { documentNumber: { $regex: search, $options: 'i' } },
            { entityName: { $regex: search, $options: 'i' } },
            { notes: { $regex: search, $options: 'i' } }
        ];
    }

    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
        Document.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('createdBy', 'name')
            .populate('approvedBy', 'name')
            .populate('branchId', 'name')
            .populate('warehouseId', 'name')
            .populate('items.productId', 'name sku barcode'),
        Document.countDocuments(filter)
    ]);

    return { 
        documents, 
        total, 
        page: parseInt(page), 
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
    };
};

/**
 * 3. Approve a Document
 */
const approveDocument = async (id, userId) => {
    return await withTransaction(async (session) => {
        const document = await Document.findById(id).session(session);
        if (!document) throw new Error('Document not found');
        if (document.status !== DocumentStatus.DRAFT && document.status !== 'PENDING') {
            throw new Error(`Only draft/pending documents can be approved (Current: ${document.status})`);
        }

        document.status = DocumentStatus.APPROVED;
        document.approvedBy = userId;
        await document.save({ session });
        
        return document;
    });
};

const rejectDocument = async (id, userId) => {
    return await withTransaction(async (session) => {
        const document = await Document.findById(id).session(session);
        if (!document) throw new Error('Document not found');

        document.status = 'REJECTED'; // Static string for flexibility
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
