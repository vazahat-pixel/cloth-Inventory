const productionService = require('./production.service.js');

/**
 * Record a Material Outward (Job Work Issue)
 */
const createOutward = async (req, res) => {
    try {
        const outward = await productionService.createOutward(req.body, req.user._id);
        res.status(201).json({
            success: true,
            message: 'Material outward recorded successfully',
            data: outward
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * List all Material Outwards
 */
const getAllOutwards = async (req, res) => {
    try {
        const outwards = await productionService.getAllOutwards(req.query);
        res.status(200).json({
            success: true,
            data: outwards
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get single Outward detail
 */
const getOutwardById = async (req, res) => {
    try {
        const outward = await productionService.getOutwardById(req.params.id);
        if (!outward) throw new Error('Outward record not found');
        res.status(200).json({
            success: true,
            data: outward
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createOutward,
    getAllOutwards,
    getOutwardById
};
