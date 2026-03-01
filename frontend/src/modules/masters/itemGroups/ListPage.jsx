import { Typography } from '@mui/material';
import MasterListPage from '../components/MasterListPage';
import StatusChip from '../components/StatusChip';
import ItemGroupsFormDialog from './FormDialog';

const itemGroupsColumns = [
  {
    field: 'groupName',
    headerName: 'Group Name',
    minWidth: 170,
    render: (value) => <Typography sx={{ fontWeight: 700 }}>{value}</Typography>,
  },
  { field: 'type', headerName: 'Type', minWidth: 120 },
  { field: 'parentGroup', headerName: 'Parent Group', minWidth: 140 },
  { field: 'description', headerName: 'Description', minWidth: 240 },
  {
    field: 'status',
    headerName: 'Status',
    minWidth: 110,
    render: (value) => <StatusChip value={value} />,
  },
];

function ItemGroupsListPage() {
  return (
    <MasterListPage
      entityKey="itemGroups"
      title="Item Groups"
      singularLabel="Item Group"
      description="Define hierarchical product classification by category, season, gender, and fabric."
      primaryField="groupName"
      searchKeys={['groupName', 'type', 'parentGroup']}
      columns={itemGroupsColumns}
      FormDialogComponent={ItemGroupsFormDialog}
      addButtonLabel="Add Item Group"
    />
  );
}

export default ItemGroupsListPage;
