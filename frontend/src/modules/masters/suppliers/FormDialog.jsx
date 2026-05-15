import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import MasterFormDialog from '../components/MasterFormDialog';

const baseSupplierFields = [
  { name: 'name', label: 'Supplier Name', required: true, validate: (v) => v.trim().length > 0 || 'Name cannot be empty' },
  { name: 'supplierCode', label: 'Supplier Code', required: true },
  { name: 'contactPerson', label: 'Contact Person', validate: (v) => !v || v.trim().length > 0 || 'Contact person cannot be empty' },
  { name: 'phone', label: 'Phone', required: true, pattern: { value: /^\d{10}$/, message: 'Phone must be exactly 10 digits' } },
  { name: 'alternatePhone', label: 'Alternate Phone', pattern: { value: /^(?:\d{10})?$/, message: 'Alternate Phone must be exactly 10 digits if provided' } },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'gstNumber', label: 'GST Number', required: true, pattern: { value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, message: 'Invalid 15-char GSTIN format' } },
  { name: 'panNo', label: 'PAN No', pattern: { value: /^(?:[A-Z]{5}[0-9]{4}[A-Z]{1})?$/, message: 'Invalid 10-char PAN format' } },
  { name: 'addressLine1', label: 'Address Line 1', required: true, validate: (v) => v.trim().length > 0 || 'Address cannot be empty' },
  { name: 'addressLine2', label: 'Address Line 2' },
  { name: 'city', label: 'City', required: true, pattern: { value: /^[A-Za-z\s]+$/, message: 'City can only contain alphabets and spaces' } },
  { name: 'state', label: 'State', required: true, pattern: { value: /^[A-Za-z\s]+$/, message: 'State can only contain alphabets and spaces' } },
  { name: 'pincode', label: 'Pincode', required: true, pattern: { value: /^\d{6}$/, message: 'Pincode must be exactly 6 digits' } },
  { name: 'bankDetails', label: 'Bank Details', multiline: true, minRows: 2, required: true },
  {
    name: 'supplierType',
    label: 'Supplier Type',
    type: 'select',
    required: true,
    defaultValue: 'Finished Goods',
    options: [
      { value: 'General', label: 'General' },
      { value: 'Fabric', label: 'Fabric' },
      { value: 'Trim', label: 'Trim' },
      { value: 'Finished Goods', label: 'Finished Goods' },
    ],
  },
  { name: 'openingBalance', label: 'Opening Balance', type: 'number', defaultValue: 0 },
  { name: 'creditDays', label: 'Credit Days', type: 'number', defaultValue: 0 },
  { name: 'notes', label: 'Notes', multiline: true, minRows: 2 },
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

function SuppliersFormDialog({ open, onClose, onSubmit, initialValues }) {
  const accountGroups = useSelector((state) => state.masters?.accountGroups || []);
  const groupOptions = useMemo(
    () => accountGroups.map((g) => ({ value: g.id, label: `${g.name} (${g.groupType})` })),
    [accountGroups],
  );

  const supplierFields = useMemo(() => {
    const groupField = {
      name: 'groupId',
      label: 'Group (Area / Week)',
      type: 'select',
      options: [{ value: '', label: '— None —' }, ...groupOptions],
    };
    return [...baseSupplierFields.slice(0, 6), groupField, ...baseSupplierFields.slice(6)];
  }, [groupOptions]);

  const isEdit = Boolean(initialValues);

  return (
    <MasterFormDialog
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      initialValues={initialValues}
      fields={supplierFields}
      title={isEdit ? 'Edit Supplier' : 'Add Supplier'}
      submitLabel={isEdit ? 'Update Supplier' : 'Create Supplier'}
    />
  );
}

export default SuppliersFormDialog;
