import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import MasterFormDialog from '../components/MasterFormDialog';

const saleNatureOptions = [
  { value: 'Retail', label: 'Retail' },
  { value: 'Wholesale', label: 'Wholesale' },
  { value: 'Export', label: 'Export' },
];

const baseCustomerFields = [
  { name: 'customerName', label: 'Customer Name', required: true, validate: (v) => v.trim().length > 0 || 'Name cannot be empty' },
  { name: 'mobileNumber', label: 'Mobile Number', required: true, pattern: { value: /^\d{10}$/, message: 'Phone must be exactly 10 digits' } },
  { name: 'alternatePhone', label: 'Alternate Phone', pattern: { value: /^(?:\d{10})?$/, message: 'Alternate Phone must be exactly 10 digits if provided' } },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'gstNumber', label: 'GST Number', pattern: { value: /^(?:[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})?$/, message: 'Invalid 15-char GSTIN format' } },
  { name: 'panNo', label: 'PAN No', pattern: { value: /^(?:[A-Z]{5}[0-9]{4}[A-Z]{1})?$/, message: 'Invalid 10-char PAN format' } },
  { name: 'city', label: 'City', required: true, pattern: { value: /^[A-Za-z\s]+$/, message: 'City can only contain alphabets and spaces' } },
  { name: 'state', label: 'State', required: true, pattern: { value: /^[A-Za-z\s]+$/, message: 'State can only contain alphabets and spaces' } },
  { name: 'pincode', label: 'Pincode', required: true, pattern: { value: /^\d{6}$/, message: 'Pincode must be exactly 6 digits' } },
  { name: 'address', label: 'Address', multiline: true, minRows: 2, required: true },
  { name: 'loyaltyPoints', label: 'Loyalty Points', type: 'number', required: true, defaultValue: 0, validate: (v) => Number(v) >= 0 || 'Loyalty points cannot be negative' },
  { name: 'creditLimit', label: 'Credit Limit', type: 'number', required: true, defaultValue: 0, validate: (v) => Number(v) >= 0 || 'Credit limit cannot be negative' },
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

function CustomersFormDialog({ open, onClose, onSubmit, initialValues }) {
  const accountGroups = useSelector((state) => state.masters?.accountGroups || []);
  const groupOptions = useMemo(
    () => accountGroups.map((g) => ({ value: g.id, label: `${g.name} (${g.groupType})` })),
    [accountGroups],
  );

  const customerFields = useMemo(() => {
    const groupField = {
      name: 'groupId',
      label: 'Group (Area / Week)',
      type: 'select',
      size: 12,
      options: [{ value: '', label: '— None —' }, ...groupOptions],
    };
    const saleNatureField = {
      name: 'saleNature',
      label: 'Sale Nature',
      type: 'select',
      size: 12,
      options: [{ value: '', label: '— None —' }, ...saleNatureOptions],
    };
    return [
      ...baseCustomerFields.slice(0, 5),
      groupField,
      saleNatureField,
      ...baseCustomerFields.slice(5),
    ];
  }, [groupOptions]);

  const isEdit = Boolean(initialValues);

  return (
    <MasterFormDialog
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      initialValues={initialValues}
      fields={customerFields}
      title={isEdit ? 'Edit Customer' : 'Add Customer'}
      submitLabel={isEdit ? 'Update Customer' : 'Create Customer'}
    />
  );
}

export default CustomersFormDialog;
