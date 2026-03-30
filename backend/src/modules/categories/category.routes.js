const express = require('express');
const categoryController = require('./category.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

router.route('/')
    .get(categoryController.getAllCategories)
    .post(requireAdmin, categoryController.createCategory);

router.get('/tree', categoryController.getCategoryTree);

router.route('/:id')
    .patch(requireAdmin, categoryController.updateCategory)
    .delete(requireAdmin, categoryController.deleteCategory);

module.exports = router;
