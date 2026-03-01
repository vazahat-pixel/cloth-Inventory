import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import MasterFormDialog from '../components/MasterFormDialog';

const saleNatureOptions = [
  { value: 'Retail', label: 'Retail' },
  { value: 'Wholesale', label: 'Wholesale' },
  { value: 'Export', label: 'Export' },
];

const baseCustomerFields = [
  { name: 'customerName', label: 'Customer Name', required: true },
  { name: 'mobileNumber', label: 'Mobile Number', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'address', label: 'Address', multiline: true, minRows: 2, required: true },
  { name: 'gstNumber', label: 'GST Number' },
  { name: 'loyaltyPoints', label: 'Loyalty Points', type: 'number', required: true, defaultValue: 0 },
  { name: 'creditLimit', label: 'Credit Limit', type: 'number', required: true, defaultValue: 0 },
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
      options: [{ value: '', label: '— None —' }, ...groupOptions],
    };
    const saleNatureField = {
      name: 'saleNature',
      label: 'Sale Nature',
      type: 'select',
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
