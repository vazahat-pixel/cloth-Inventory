import { Typography } from '@mui/material';
import MasterListPage from '../components/MasterListPage';
import BanksFormDialog from './FormDialog';

const bankColumns = [
  {
    field: 'bankName',
    headerName: 'Bank Name',
    minWidth: 160,
    render: (value) => <Typography sx={{ fontWeight: 700 }}>{value}</Typography>,
  },
  { field: 'accountNumber', headerName: 'Account Number', minWidth: 160 },
  { field: 'branch', headerName: 'Branch', minWidth: 150 },
  { field: 'ifsc', headerName: 'IFSC', minWidth: 140 },
];

function BanksListPage() {
  return (
    <MasterListPage
      entityKey="banks"
      title="Bank Accounts"
      singularLabel="Bank Account"
      description="Manage bank accounts for payments and receipts."
      primaryField="bankName"
      searchKeys={['bankName', 'accountNumber', 'branch', 'ifsc']}
      columns={bankColumns}
      FormDialogComponent={BanksFormDialog}
      addButtonLabel="Add Bank Account"
    />
  );
}

export default BanksListPage;
