import MasterFormDialog from '../components/MasterFormDialog';

const brandFields = [
  { name: 'brandName', label: 'Brand Name', required: true },
  { name: 'shortName', label: 'Short Name', required: true },
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

function BrandsFormDialog({ open, onClose, onSubmit, initialValues }) {
  const isEdit = Boolean(initialValues);

  return (
    <MasterFormDialog
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      initialValues={initialValues}
      fields={brandFields}
      title={isEdit ? 'Edit Brand' : 'Add Brand'}
      submitLabel={isEdit ? 'Update Brand' : 'Create Brand'}
    />
  );
}

export default BrandsFormDialog;
