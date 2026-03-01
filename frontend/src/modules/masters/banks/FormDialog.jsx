import MasterFormDialog from '../components/MasterFormDialog';

const bankFields = [
  { name: 'bankName', label: 'Bank Name', required: true },
  { name: 'accountNumber', label: 'Account Number', required: true },
  { name: 'branch', label: 'Branch', required: true },
  { name: 'ifsc', label: 'IFSC Code', required: true },
];

function BanksFormDialog({ open, onClose, onSubmit, initialValues }) {
  const isEdit = Boolean(initialValues);

  return (
    <MasterFormDialog
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      initialValues={initialValues}
      fields={bankFields}
      title={isEdit ? 'Edit Bank Account' : 'Add Bank Account'}
      submitLabel={isEdit ? 'Update' : 'Create'}
    />
  );
}

export default BanksFormDialog;
