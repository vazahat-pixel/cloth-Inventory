import { Typography } from '@mui/material';
import MasterListPage from '../components/MasterListPage';
import StatusChip from '../components/StatusChip';
import AccountGroupsFormDialog from './FormDialog';

const accountGroupsColumns = [
  {
    field: 'name',
    headerName: 'Group Name',
    minWidth: 180,
    render: (value) => <Typography sx={{ fontWeight: 700 }}>{value}</Typography>,
  },
  { field: 'groupType', headerName: 'Type', minWidth: 120 },
  {
    field: 'status',
    headerName: 'Status',
    minWidth: 110,
    render: (value) => <StatusChip value={value} />,
  },
];

function AccountGroupsListPage() {
  return (
    <MasterListPage
      entityKey="accountGroups"
      title="Account Groups"
      singularLabel="Account Group"
      description="Arrange customers and suppliers by Area, Week, or custom criteria for reporting and filtering."
      primaryField="name"
      searchKeys={['name', 'groupType']}
      columns={accountGroupsColumns}
      FormDialogComponent={AccountGroupsFormDialog}
      addButtonLabel="Add Account Group"
    />
  );
}

export default AccountGroupsListPage;
