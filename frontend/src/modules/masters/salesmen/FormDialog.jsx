import MasterFormDialog from '../components/MasterFormDialog';

const salesmenFields = [
  { name: 'name', label: 'Name', required: true },
  { name: 'code', label: 'Code', required: true },
  { name: 'phone', label: 'Phone', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  {
    name: 'commissionRate',
    label: 'Commission Rate (%)',
    type: 'number',
    required: true,
    defaultValue: 0,
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

function SalesmenFormDialog({ open, onClose, onSubmit, initialValues }) {
  const isEdit = Boolean(initialValues);

  return (
    <MasterFormDialog
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      initialValues={initialValues}
      fields={salesmenFields}
      title={isEdit ? 'Edit Salesman' : 'Add Salesman'}
      submitLabel={isEdit ? 'Update Salesman' : 'Create Salesman'}
    />
  );
}

export default SalesmenFormDialog;
