import { Typography } from '@mui/material';
import MasterListPage from '../components/MasterListPage';
import StatusChip from '../components/StatusChip';
import SalesmenFormDialog from './FormDialog';

const salesmenColumns = [
  {
    field: 'name',
    headerName: 'Name',
    minWidth: 160,
    render: (value) => <Typography sx={{ fontWeight: 700 }}>{value}</Typography>,
  },
  { field: 'code', headerName: 'Code', minWidth: 110 },
  { field: 'phone', headerName: 'Phone', minWidth: 130 },
  { field: 'email', headerName: 'Email', minWidth: 200 },
  {
    field: 'commissionRate',
    headerName: 'Commission (%)',
    minWidth: 130,
    align: 'right',
  },
  {
    field: 'status',
    headerName: 'Status',
    minWidth: 110,
    render: (value) => <StatusChip value={value} />,
  },
];

function SalesmenListPage() {
  return (
    <MasterListPage
      entityKey="salesmen"
      title="Salesmen"
      singularLabel="Salesman"
      description="Manage sales agents and their commission profiles."
      primaryField="name"
      searchKeys={['name', 'code', 'phone']}
      columns={salesmenColumns}
      FormDialogComponent={SalesmenFormDialog}
      addButtonLabel="Add Salesman"
    />
  );
}

export default SalesmenListPage;
