import MasterFormDialog from '../components/MasterFormDialog';
import { validateIFSC, validateAccountNumber, validateName, isSpacesOnly } from '../../../utils/validation.helper';

const bankFields = [
  { 
    name: 'bankName', 
    label: 'Bank Name', 
    required: true,
    rules: {
      validate: {
        noSpaces: v => !isSpacesOnly(v) || 'Spaces-only inputs are not allowed.',
        validName: v => !v || validateName(v) || 'Only alphabets and spaces are allowed.'
      }
    }
  },
  { 
    name: 'accountNumber', 
    label: 'Account Number', 
    required: true,
    rules: {
      validate: {
        noSpaces: v => !isSpacesOnly(v) || 'Spaces-only inputs are not allowed.',
        validAccount: v => !v || validateAccountNumber(v) || 'Account Number must be between 9 and 18 digits.'
      }
    }
  },
  { 
    name: 'branch', 
    label: 'Branch', 
    required: true,
    rules: {
      validate: {
        noSpaces: v => !isSpacesOnly(v) || 'Spaces-only inputs are not allowed.',
        validName: v => !v || validateName(v) || 'Only alphabets and spaces are allowed.'
      }
    }
  },
  { 
    name: 'ifsc', 
    label: 'IFSC Code', 
    required: true,
    rules: {
      validate: {
        noSpaces: v => !isSpacesOnly(v) || 'Spaces-only inputs are not allowed.',
        validIfsc: v => !v || validateIFSC(v) || 'Invalid IFSC format (e.g. SBIN0001234).'
      }
    }
  },
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
