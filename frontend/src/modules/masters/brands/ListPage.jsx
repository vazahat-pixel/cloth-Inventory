import { Typography } from '@mui/material';
import MasterListPage from '../components/MasterListPage';
import StatusChip from '../components/StatusChip';
import BrandsFormDialog from './FormDialog';

const brandsColumns = [
  {
    field: 'brandName',
    headerName: 'Brand Name',
    minWidth: 180,
    render: (value) => <Typography sx={{ fontWeight: 700 }}>{value}</Typography>,
  },
  { field: 'shortName', headerName: 'Short Name', minWidth: 130 },
  { field: 'description', headerName: 'Description', minWidth: 250 },
  {
    field: 'status',
    headerName: 'Status',
    minWidth: 110,
    render: (value) => <StatusChip value={value} />,
  },
];

function BrandsListPage() {
  return (
    <MasterListPage
      entityKey="brands"
      title="Brands"
      singularLabel="Brand"
      description="Manage apparel brands and companies represented in catalog masters."
      primaryField="brandName"
      searchKeys={['brandName', 'shortName']}
      columns={brandsColumns}
      FormDialogComponent={BrandsFormDialog}
      addButtonLabel="Add Brand"
    />
  );
}

export default BrandsListPage;
