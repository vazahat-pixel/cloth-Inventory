import MasterFormDialog from '../components/MasterFormDialog';

const sanitizeBrandName = (value) =>
  String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .slice(0, 80);

const sanitizeBrandCode = (value) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12);

const brandFields = [
  {
    name: 'brandName',
    label: 'Brand Name',
    required: true,
    maxLength: 80,
    validate: (v) => (/^[a-zA-Z0-9\s]+$/.test(String(v || '').trim()) && v.trim().length > 0) || 'Brand name must be alphanumeric.',
  },
  {
    name: 'shortName',
    label: 'Brand Code / Short Name',
    required: true,
    maxLength: 12,
    validate: (v) => (/^[A-Z0-9]+$/.test(sanitizeBrandCode(v)) && sanitizeBrandCode(v).length > 0) || 'Brand code must be alphanumeric without special characters.',
  },
  {
    name: 'description',
    label: 'Description',
    multiline: true,
    minRows: 2,
    required: true,
    maxLength: 300,
    validate: (v) => v.trim().length > 0 || 'Description is required.',
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

function BrandsFormDialog({ open, onClose, onSubmit, initialValues }) {
  const isEdit = Boolean(initialValues);

  const handleFormSubmit = (values) => {
    const payload = {
      ...values,
      brandName: sanitizeBrandName(values.brandName),
      shortName: sanitizeBrandCode(values.shortName),
      name: sanitizeBrandName(values.brandName),
      code: sanitizeBrandCode(values.shortName),
      isActive: values.status === 'Active',
    };
    delete payload.brandName;
    delete payload.status;

    onSubmit(payload);
  };

  const normalizedInitial = initialValues
    ? {
        ...initialValues,
        brandName: initialValues.brandName || initialValues.name || '',
        shortName: initialValues.shortName || initialValues.code || '',
        status: initialValues.status || (initialValues.isActive === false ? 'Inactive' : 'Active'),
      }
    : null;

  return (
    <MasterFormDialog
      open={open}
      onClose={onClose}
      onSubmit={handleFormSubmit}
      initialValues={normalizedInitial}
      fields={brandFields}
      title={isEdit ? 'Edit Brand' : 'Add Brand'}
      submitLabel={isEdit ? 'Update Brand' : 'Create Brand'}
    />
  );
}

export default BrandsFormDialog;
