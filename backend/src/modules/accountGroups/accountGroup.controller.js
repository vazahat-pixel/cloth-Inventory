const AccountGroup = require('../../models/accountGroup.model');

exports.getAllGroups = async (req, res) => {
    try {
        const groups = await AccountGroup.find({ isActive: true });
        res.status(200).json({ success: true, accountGroups: groups });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createGroup = async (req, res) => {
    try {
        const group = await AccountGroup.create(req.body);
        res.status(201).json({ success: true, accountGroup: group });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateGroup = async (req, res) => {
    try {
        const group = await AccountGroup.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ success: true, accountGroup: group });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteGroup = async (req, res) => {
    try {
        await AccountGroup.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Group deleted' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
