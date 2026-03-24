const Role = require('../../models/role.model');
const { sendSuccess, sendError } = require('../../utils/response.handler');

const getAllRoles = async (req, res, next) => {
    try {
        const roles = await Role.find();
        return sendSuccess(res, { roles }, 'Roles and permissions retrieved');
    } catch (error) {
        next(error);
    }
};

const updatePermissions = async (req, res, next) => {
    try {
        const { roleName, permissions } = req.body;
        
        let role = await Role.findOne({ name: roleName });
        if (role) {
            role.permissions = permissions;
            await role.save();
        } else {
            role = await Role.create({ name: roleName, permissions });
        }
        
        return sendSuccess(res, { role }, `Permissions updated for role ${roleName}`);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllRoles,
    updatePermissions
};
