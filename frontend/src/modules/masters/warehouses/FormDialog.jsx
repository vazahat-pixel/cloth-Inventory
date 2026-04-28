import MasterFormDialog from '../components/MasterFormDialog';

const warehouseFields = [
  { name: 'warehouseName', label: 'Warehouse Name', required: true },
  { name: 'code', label: 'Code', required: true },
  { name: 'city', label: 'City', required: true },
  { name: 'state', label: 'State', required: true },
  { name: 'location', label: 'Complete Address', required: true, multiline: true },
  { name: 'managerName', label: 'Manager Name', required: true },
  { name: 'contactNumber', label: 'Contact Number', required: true },
  { name: 'gstNumber', label: 'GST Number', required: false },
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

function WarehousesFormDialog({ open, onClose, onSubmit, initialValues }) {
  const isEdit = Boolean(initialValues);

  return (
    <MasterFormDialog
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      initialValues={initialValues}
      fields={warehouseFields}
      title={isEdit ? 'Edit Warehouse' : 'Add Warehouse'}
      submitLabel={isEdit ? 'Update Warehouse' : 'Create Warehouse'}
    />
  );
}

export default WarehousesFormDialog;
