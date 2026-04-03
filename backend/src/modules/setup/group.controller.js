const Group = require('../../models/group.model');
const { sendSuccess, sendError, sendCreated } = require('../../utils/response.handler');

class GroupController {
  create = async (req, res) => {
    try {
      // Map groupName from frontend to name in backend
      const data = {
        name: req.body.groupName || req.body.name,
        groupType: req.body.groupType,
        parentId: req.body.parentId || null,
        description: req.body.description,
        isActive: req.body.status !== 'Inactive'
      };

      const group = await Group.create(data);
      
      const mappedGroup = {
        id: group._id,
        groupName: group.name,
        groupType: group.groupType,
        parentId: group.parentId,
        level: group.level,
        description: group.description,
        status: group.isActive ? 'Active' : 'Inactive',
        createdAt: group.createdAt,
        updatedAt: group.updatedAt
      };

      return sendCreated(res, { group: mappedGroup }, 'Group created successfully');
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  };

  getAll = async (req, res) => {
    try {
      const groups = await Group.find().sort({ level: 1, name: 1 });
      
      // Transform for frontend compatibility (map name to groupName)
      const mappedGroups = groups.map(g => ({
        id: g._id,
        groupName: g.name,
        groupType: g.groupType,
        parentId: g.parentId,
        level: g.level,
        status: g.isActive ? 'Active' : 'Inactive',
        createdAt: g.createdAt,
        updatedAt: g.updatedAt
      }));

      return sendSuccess(res, { groups: mappedGroups }, 'Groups fetched successfully');
    } catch (error) {
      return sendError(res, error.message);
    }
  };

  update = async (req, res) => {
    try {
      const { id } = req.params;
      const updates = {
        name: req.body.groupName || req.body.name,
        groupType: req.body.groupType,
        parentId: req.body.parentId || null,
        description: req.body.description,
        isActive: req.body.status !== 'Inactive'
      };

      // Remove undefined fields
      Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

      const group = await Group.findByIdAndUpdate(id, updates, { new: true });
      if (!group) return sendError(res, 'Group not found', 404);

      const mappedGroup = {
        id: group._id,
        groupName: group.name,
        groupType: group.groupType,
        parentId: group.parentId,
        level: group.level,
        status: group.isActive ? 'Active' : 'Inactive'
      };

      return sendSuccess(res, { group: mappedGroup }, 'Group updated successfully');
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  };

  delete = async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if this group has children
      const childrenCount = await Group.countDocuments({ parentId: id });
      if (childrenCount > 0) {
        return sendError(res, 'Cannot delete group with subgroups', 400);
      }

      const group = await Group.findByIdAndDelete(id);
      if (!group) return sendError(res, 'Group not found', 404);

      return sendSuccess(res, {}, 'Group deleted successfully');
    } catch (error) {
      return sendError(res, error.message);
    }
  };
}

module.exports = new GroupController();
