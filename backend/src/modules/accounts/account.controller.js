const Account = require('../../models/account.model');

exports.getAllAccounts = async (req, res) => {
    try {
        const accounts = await Account.find({ isActive: true }).populate('groupId');
        res.status(200).json({ success: true, accounts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createAccount = async (req, res) => {
    try {
        const account = await Account.create(req.body);
        res.status(201).json({ success: true, account });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
