import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import MasterFormDialog from '../components/MasterFormDialog';

const baseSupplierFields = [
  { name: 'supplierName', label: 'Supplier Name', required: true },
  { name: 'supplierCode', label: 'Supplier Code', required: true },
  { name: 'gstNumber', label: 'GST Number', required: true },
  { name: 'phone', label: 'Phone', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'address', label: 'Address', multiline: true, minRows: 2, required: true },
  { name: 'bankDetails', label: 'Bank Details', required: true },
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
