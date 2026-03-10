const billingCounterService = require('./billingCounter.service');

exports.createCounter = async (req, res) => {
    try {
        const counter = await billingCounterService.createCounter(req.body);
        res.status(201).json({ success: true, data: counter });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.getAllCounters = async (req, res) => {
    try {
        const counters = await billingCounterService.getAllCounters(req.query);
        res.status(200).json({ success: true, count: counters.length, data: counters });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getCounterById = async (req, res) => {
    try {
        const counter = await billingCounterService.getCounterById(req.params.id);
        if (!counter) return res.status(404).json({ success: false, message: 'Counter not found' });
        res.status(200).json({ success: true, data: counter });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateCounter = async (req, res) => {
    try {
        const counter = await billingCounterService.updateCounter(req.params.id, req.body);
        if (!counter) return res.status(404).json({ success: false, message: 'Counter not found' });
        res.status(200).json({ success: true, data: counter });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.deleteCounter = async (req, res) => {
    try {
        await billingCounterService.deleteCounter(req.params.id);
        res.status(204).json({ success: true, data: null });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
