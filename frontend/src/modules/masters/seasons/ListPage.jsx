import { Typography } from '@mui/material';
import MasterListPage from '../components/MasterListPage';
import StatusChip from '../components/StatusChip';
import SeasonsFormDialog from './FormDialog';

const seasonsColumns = [
  {
    field: 'seasonName',
    headerName: 'Season Name',
    minWidth: 180,
    render: (value) => <Typography sx={{ fontWeight: 700 }}>{value}</Typography>,
  },
  { field: 'code', headerName: 'Code', minWidth: 100 },
  { field: 'year', headerName: 'Year', minWidth: 100 },
  { field: 'description', headerName: 'Description', minWidth: 250 },
  {
    field: 'status',
    headerName: 'Status',
    minWidth: 110,
    render: (value) => <StatusChip value={value} />,
  },
];

function SeasonsListPage() {
  return (
    <MasterListPage
      entityKey="seasons"
      title="Season Master"
      singularLabel="Season"
      description="Manage garment seasons (e.g., Summer 2024, Festive 2025)."
      primaryField="seasonName"
      searchKeys={['seasonName', 'code', 'description']}
      columns={seasonsColumns}
      FormDialogComponent={SeasonsFormDialog}
      addButtonLabel="Add Season"
    />
  );
}

export default SeasonsListPage;
