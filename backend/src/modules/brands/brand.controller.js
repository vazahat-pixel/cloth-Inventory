const Brand = require('../../models/brand.model');
const { getPagination, buildPaginationMeta } = require('../../utils/pagination.helper');

exports.getAllBrands = async (req, res) => {
    try {
        const { search, page, limit, isActive } = req.query;
        const filter = {};

        if (isActive === 'true') filter.isActive = true;
        else if (isActive === 'false') filter.isActive = false;

        if (search) {
            const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            filter.$or = [{ name: regex }, { shortName: regex }, { description: regex }];
        }

        const usePagination = page || limit;
        if (usePagination) {
            const { page: p, limit: l, skip } = getPagination(req.query);
            const [brands, total] = await Promise.all([
                Brand.find(filter).sort({ name: 1 }).skip(skip).limit(l),
                Brand.countDocuments(filter),
            ]);
            return res.status(200).json({
                success: true,
                brands,
                meta: buildPaginationMeta(total, p, l),
                total,
            });
        }

        const brands = await Brand.find(filter).sort({ name: 1 });
        res.status(200).json({ success: true, brands, total: brands.length });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createBrand = async (req, res) => {
    try {
        const shortName = String(req.body.shortName || req.body.code || '').trim().toUpperCase();
        if (shortName) {
            const existing = await Brand.findOne({ shortName });
            if (existing) {
                return res.status(400).json({ success: false, message: 'Brand code / short name already exists.' });
            }
        }
        const brand = await Brand.create(req.body);
        res.status(201).json({ success: true, brand });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Brand name or code already exists.' });
        }
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateBrand = async (req, res) => {
    try {
        const shortName = String(req.body.shortName || req.body.code || '').trim().toUpperCase();
        if (shortName) {
            const existing = await Brand.findOne({
                shortName,
                _id: { $ne: req.params.id },
            });
            if (existing) {
                return res.status(400).json({ success: false, message: 'Brand code / short name already exists.' });
            }
        }
        const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.status(200).json({ success: true, brand });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Brand name or code already exists.' });
        }
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteBrand = async (req, res) => {
    try {
        await Brand.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Brand deleted' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
