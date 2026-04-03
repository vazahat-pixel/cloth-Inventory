const itemService = require('./item.service');
const { sendSuccess, sendError, sendCreated, sendNotFound } = require('../../utils/response.handler');

class ItemController {
  // Syncing with AppRoutes field naming and logic ERP specs
  createItem = async (req, res) => {
    try {
      const item = await itemService.createItem(req.body);
      return sendCreated(res, { item }, 'Item created successfully');
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  };

  getAllItems = async (req, res) => {
    try {
      const items = await itemService.getAllItems(req.query);
      return sendSuccess(res, { items }, 'Items fetched successfully');
    } catch (error) {
      return sendError(res, error.message);
    }
  };

  getItemById = async (req, res) => {
    try {
      const item = await itemService.getItemById(req.params.id);
      if (!item) return sendNotFound(res, 'Item not found');
      return sendSuccess(res, { item }, 'Item fetched successfully');
    } catch (error) {
      return sendError(res, error.message);
    }
  };

  updateItem = async (req, res) => {
    try {
      const item = await itemService.updateItem(req.params.id, req.body);
      if (!item) return sendNotFound(res, 'Item not found');
      return sendSuccess(res, { item }, 'Item updated successfully');
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  };

  deleteItem = async (req, res) => {
    try {
      const result = await itemService.deleteItem(req.params.id);
      if (!result) return sendNotFound(res, 'Item not found');
      return sendSuccess(res, {}, 'Item deleted successfully');
    } catch (error) {
      return sendError(res, error.message);
    }
  };

  allocateItemGroups = async (req, res) => {
    try {
      const { groupIds } = req.body;
      if (!groupIds || !Array.isArray(groupIds)) {
        return sendError(res, 'groupIds array (JSON) is required', 400);
      }
      const item = await itemService.allocateGroup(req.params.id, groupIds);
      return sendSuccess(res, { item }, 'Groups allocated successfully');
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  };

  deallocateItemGroups = async (req, res) => {
    try {
      const { groupIds } = req.body;
      if (!groupIds || !Array.isArray(groupIds)) {
        return sendError(res, 'groupIds array (JSON) is required', 400);
      }
      const item = await itemService.deallocateGroup(req.params.id, groupIds);
      return sendSuccess(res, { item }, 'Groups de-allocated successfully');
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  };

  // Logic ERP Specific - Update standalone attributes
  updateItemAttributes = async (req, res) => {
     try {
       const item = await itemService.updateItem(req.params.id, { attributes: req.body });
       return sendSuccess(res, { item }, 'Attributes updated successfully');
     } catch(e) { return sendError(res, e.message); }
  }

  // Logic ERP Specific - Update standalone sizes matrix
  updateItemSizes = async (req, res) => {
    try {
      const item = await itemService.updateItem(req.params.id, { sizes: req.body });
      return sendSuccess(res, { item }, 'Size matrix updated successfully');
    } catch(e) { return sendError(res, e.message); }
 }

  scanItemByBarcode = async (req, res) => {
    try {
      const { barcode } = req.params;
      const result = await itemService.scanItemByBarcode(barcode);
      if (!result) return sendNotFound(res, 'Item not found for this barcode');
      return sendSuccess(res, result, 'Scanner lookup successful');
    } catch (error) {
      return sendError(res, error.message);
    }
  };
}

module.exports = new ItemController();
