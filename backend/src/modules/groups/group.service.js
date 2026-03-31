const Group = require('../../models/group.model');
const Item = require('../../models/item.model');

const normalizeString = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
};

const normalizeParentId = (value) => {
  if (!value) {
    return null;
  }
  if (typeof value === 'object') {
    return value._id ? String(value._id) : value.id ? String(value.id) : null;
  }
  return String(value);
};

const normalizeType = (value) => {
  const resolved = normalizeString(value || 'Section');
  const allowed = ['Section', 'Category', 'Sub Category', 'Style / Type'];

  if (allowed.includes(resolved)) {
    return resolved;
  }

  const exact = allowed.find((entry) => entry.toLowerCase() === resolved.toLowerCase());
  if (exact) {
    return exact;
  }

  throw new Error(`Invalid group type: ${value}`);
};

const buildTree = (groups, parentId = null) => {
  const children = groups
    .filter((group) => normalizeParentId(group.parentId) === normalizeParentId(parentId))
    .sort((a, b) => normalizeString(a.name).localeCompare(normalizeString(b.name)));

  return children.map((child) => ({
    ...child,
    id: String(child._id),
    parentId: normalizeParentId(child.parentId),
    children: buildTree(groups, child._id),
  }));
};

const hasAncestor = async (candidateParentId, targetId) => {
  let currentId = normalizeParentId(candidateParentId);

  while (currentId) {
    if (String(currentId) === String(targetId)) {
      return true;
    }

    const current = await Group.findById(currentId).select('parentId').lean();
    currentId = current ? normalizeParentId(current.parentId) : null;
  }

  return false;
};

class GroupService {
  async createGroup(data) {
    const name = normalizeString(data.name);
    if (!name) {
      throw new Error('Group name is required');
    }

    const parentId = normalizeParentId(data.parentId);
    const groupType = normalizeType(data.groupType || data.type);
    const isActive = data.isActive !== undefined
      ? Boolean(data.isActive)
      : data.status !== undefined
        ? String(data.status).toLowerCase() !== 'inactive'
        : true;

    const duplicate = await Group.findOne({
      name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      parentId: parentId || null,
      groupType,
    }).lean();

    if (duplicate) {
      throw new Error('Group already exists at this level');
    }

    if (parentId) {
      const parent = await Group.findById(parentId).select('_id').lean();
      if (!parent) {
        throw new Error('Parent group not found');
      }
    }

    const group = new Group({
      ...data,
      name,
      parentId,
      groupType,
      isActive,
    });

    return group.save();
  }

  async getAllGroups() {
    return Group.find().populate('parentId', 'name groupType level').sort({ name: 1 });
  }

  async getGroupTree() {
    const groups = await Group.find().lean();
    return buildTree(groups);
  }

  async getGroupById(id) {
    return Group.findById(id).populate('parentId', 'name groupType level');
  }

  async updateGroup(id, data) {
    const group = await Group.findById(id);
    if (!group) {
      return null;
    }

    const nextName = data.name !== undefined ? normalizeString(data.name) : group.name;
    const nextGroupType = normalizeType(data.groupType || data.type || group.groupType);
    const nextParentId = normalizeParentId(data.parentId !== undefined ? data.parentId : group.parentId);

    if (!nextName) {
      throw new Error('Group name is required');
    }

    const duplicate = await Group.findOne({
      _id: { $ne: id },
      name: new RegExp(`^${nextName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      parentId: nextParentId || null,
      groupType: nextGroupType,
    }).lean();

    if (duplicate) {
      throw new Error('Group already exists at this level');
    }

    if (data.name !== undefined) {
      group.name = nextName;
    }

    if (data.groupType !== undefined || data.type !== undefined) {
      group.groupType = nextGroupType;
    }

    if (data.parentId !== undefined) {
      const parentId = nextParentId;
      if (parentId) {
        if (String(parentId) === String(id)) {
          throw new Error('A group cannot be its own parent');
        }

        const parent = await Group.findById(parentId).select('_id').lean();
        if (!parent) {
          throw new Error('Parent group not found');
        }

        if (await hasAncestor(parentId, id)) {
          throw new Error('Circular parent hierarchy is not allowed');
        }
      }

      group.parentId = parentId;
    }

    if (data.isActive !== undefined || data.status !== undefined) {
      group.isActive = data.isActive !== undefined
        ? Boolean(data.isActive)
        : String(data.status).toLowerCase() !== 'inactive';
    }

    return group.save();
  }

  async deleteGroup(id) {
    const children = await Group.countDocuments({ parentId: id });
    if (children > 0) {
      throw new Error('Cannot delete group with sub-groups');
    }

    const linkedItem = await Item.exists({ groupIds: id });
    if (linkedItem) {
      throw new Error('Cannot delete group that is assigned to items');
    }

    return Group.findByIdAndDelete(id);
  }
}

module.exports = new GroupService();
