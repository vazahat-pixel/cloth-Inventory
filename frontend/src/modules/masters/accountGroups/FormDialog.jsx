import MasterFormDialog from '../components/MasterFormDialog';

const groupTypeOptions = [
  { value: 'Area', label: 'Area' },
  { value: 'Week', label: 'Week' },
  { value: 'Custom', label: 'Custom' },
];

const accountGroupFields = [
  { name: 'name', label: 'Group Name', required: true },
  {
    name: 'groupType',
    label: 'Group Type',
    type: 'select',
    required: true,
    defaultValue: 'Area',
    options: groupTypeOptions,
  },
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

function AccountGroupsFormDialog({ open, onClose, onSubmit, initialValues }) {
  const isEdit = Boolean(initialValues);

  return (
    <MasterFormDialog
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      initialValues={initialValues}
      fields={accountGroupFields}
      title={isEdit ? 'Edit Account Group' : 'Add Account Group'}
      submitLabel={isEdit ? 'Update' : 'Create'}
    />
  );
}

export default AccountGroupsFormDialog;
