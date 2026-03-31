import MasterFormDialog from '../components/MasterFormDialog';

const seasonFields = [
  { name: 'seasonName', label: 'Season Name', required: true, size: 6 },
  { name: 'code', label: 'Season Code', required: true, size: 3 },
  { name: 'year', label: 'Year', type: 'number', required: true, size: 3 },
  { name: 'description', label: 'Description', multiline: true, minRows: 2, size: 12 },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    defaultValue: 'Active',
    size: 12,
    options: [
      { value: 'Active', label: 'Active' },
      { value: 'Inactive', label: 'Inactive' },
    ],
  },
];

function SeasonsFormDialog({ open, onClose, onSubmit, initialValues }) {
  const isEdit = Boolean(initialValues);

  const handleFormSubmit = (values) => {
    const payload = {
      ...values,
      name: values.seasonName,
      isActive: values.status === 'Active',
    };
    delete payload.seasonName;
    delete payload.status;

    onSubmit(payload);
  };

  return (
    <MasterFormDialog
      open={open}
      onClose={onClose}
      onSubmit={handleFormSubmit}
      initialValues={initialValues}
      fields={seasonFields}
      title={isEdit ? 'Edit Season' : 'Add Season'}
      submitLabel={isEdit ? 'Update Season' : 'Create Season'}
    />
  );
}

export default SeasonsFormDialog;
