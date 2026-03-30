const groupService = require('./group.service');
const { sendSuccess, sendError, sendCreated, sendNotFound } = require('../../utils/response.handler');

class GroupController {
  create = async (req, res) => {
    try {
      const group = await groupService.createGroup(req.body);
      return sendCreated(res, { group }, 'Group created successfully');
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  };

  getTree = async (req, res) => {
    try {
      const tree = await groupService.getGroupTree();
      return sendSuccess(res, { tree }, 'Group tree fetched successfully');
    } catch (error) {
      return sendError(res, error.message);
    }
  };

  getAll = async (req, res) => {
    try {
      const groups = await groupService.getAllGroups();
      return sendSuccess(res, { groups }, 'Groups fetched successfully');
    } catch (error) {
      return sendError(res, error.message);
    }
  };

  getById = async (req, res) => {
    try {
      const group = await groupService.getGroupById(req.params.id);
      if (!group) return sendNotFound(res, 'Group not found');
      return sendSuccess(res, { group }, 'Group fetched successfully');
    } catch (error) {
      return sendError(res, error.message);
    }
  };

  update = async (req, res) => {
    try {
      const group = await groupService.updateGroup(req.params.id, req.body);
      if (!group) return sendNotFound(res, 'Group not found');
      return sendSuccess(res, { group }, 'Group updated successfully');
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  };

  delete = async (req, res) => {
    try {
      const group = await groupService.deleteGroup(req.params.id);
      if (!group) return sendNotFound(res, 'Group not found');
      return sendSuccess(res, {}, 'Group deleted successfully');
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  };
}

module.exports = new GroupController();
