const Category = require('../../models/category.model');

const normalizeId = (value) => {
    if (!value) {
        return null;
    }

    if (typeof value === 'object') {
        return value._id ? String(value._id) : value.id ? String(value.id) : null;
    }

    return String(value);
};

const isAncestor = async (candidateId, targetId) => {
    let currentId = normalizeId(candidateId);

    while (currentId) {
        if (currentId === String(targetId)) {
            return true;
        }

        const current = await Category.findOne({ _id: currentId, isDeleted: false }).select('parentId').lean();
        currentId = current ? normalizeId(current.parentId) : null;
    }

    return false;
};

const buildCategoryTree = (categories) => {
    const nodes = new Map();
    const roots = [];

    categories.forEach((category) => {
        nodes.set(String(category._id), {
            ...category,
            id: String(category._id),
            parentId: category.parentId ? String(category.parentId) : null,
            children: [],
        });
    });

    categories.forEach((category) => {
        const node = nodes.get(String(category._id));
        const parentId = normalizeId(category.parentId);
        if (parentId && nodes.has(parentId) && parentId !== String(category._id)) {
            nodes.get(parentId).children.push(node);
        } else {
            roots.push(node);
        }
    });

    const sortNodes = (list) => {
        list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
        list.forEach((node) => {
            if (Array.isArray(node.children) && node.children.length) {
                sortNodes(node.children);
            }
        });
    };

    sortNodes(roots);
    return roots;
};

/**
 * Get all categories
 */
const getAllCategories = async (query = {}) => {
    const categories = await Category.find({ isDeleted: false, ...query }).sort({ name: 1 });
    return categories;
};

const getCategoryTree = async () => {
    const categories = await Category.find({ isDeleted: false }).sort({ name: 1 }).lean();
    return buildCategoryTree(categories);
};

/**
 * Get category by ID
 */
const getCategoryById = async (id) => {
    const category = await Category.findById(id);
    if (!category || category.isDeleted) {
        throw new Error('Category not found');
    }
    return category;
};

/**
 * Create a new category
 */
const createCategory = async (categoryData, userId) => {
    const categoryExists = await Category.findOne({ name: categoryData.name, isDeleted: false });
    if (categoryExists) {
        throw new Error('Category already exists');
    }

    if (categoryData.parentId) {
        const parent = await Category.findOne({ _id: categoryData.parentId, isDeleted: false });
        if (!parent) {
            throw new Error('Parent group not found');
        }
    }

    const category = await Category.create({
        ...categoryData,
        createdBy: userId
    });

    return category;
};

/**
 * Update a category
 */
const updateCategory = async (id, updateData) => {
    if (updateData.parentId) {
        if (String(updateData.parentId) === String(id)) {
            throw new Error('A group cannot be its own parent');
        }

        const parent = await Category.findOne({ _id: updateData.parentId, isDeleted: false });
        if (!parent) {
            throw new Error('Parent group not found');
        }

        if (await isAncestor(updateData.parentId, id)) {
            throw new Error('Circular parent hierarchy is not allowed');
        }
    }

    const category = await Category.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
    );
    if (!category) {
        throw new Error('Category not found');
    }
    return category;
};

/**
 * Delete a category
 */
const deleteCategory = async (id) => {
    const category = await Category.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!category) {
        throw new Error('Category not found');
    }
    return category;
};

module.exports = {
    getAllCategories,
    getCategoryTree,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
