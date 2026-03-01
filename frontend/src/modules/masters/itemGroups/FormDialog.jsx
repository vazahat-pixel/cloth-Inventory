import MasterFormDialog from '../components/MasterFormDialog';

const groupTypeOptions = [
  { value: 'Category', label: 'Category' },
  { value: 'Gender', label: 'Gender' },
  { value: 'Season', label: 'Season' },
  { value: 'Fabric', label: 'Fabric' },
  { value: 'Collection', label: 'Collection' },
];

const itemGroupFields = [
  { name: 'groupName', label: 'Group Name', required: true },
  {
    name: 'type',
    label: 'Type',
    type: 'select',
    required: true,
    defaultValue: 'Category',
    options: groupTypeOptions,
  },
  { name: 'parentGroup', label: 'Parent Group' },
  { name: 'description', label: 'Description', multiline: true, minRows: 2, required: true },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    defaultValue: 'Active',
    options: [
      { value: 'Active', label: 'Active' },
      { value: 'Inactive', label: 'Inactive' },
    ],
  },
];

function ItemGroupsFormDialog({ open, onClose, onSubmit, initialValues }) {
  const isEdit = Boolean(initialValues);

  return (
    <MasterFormDialog
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      initialValues={initialValues}
      fields={itemGroupFields}
      title={isEdit ? 'Edit Item Group' : 'Add Item Group'}
      submitLabel={isEdit ? 'Update Group' : 'Create Group'}
    />
  );
}

export default ItemGroupsFormDialog;
