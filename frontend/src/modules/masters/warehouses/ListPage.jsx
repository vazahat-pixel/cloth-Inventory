import { Typography } from '@mui/material';
import MasterListPage from '../components/MasterListPage';
import StatusChip from '../components/StatusChip';
import WarehousesFormDialog from './FormDialog';

const warehousesColumns = [
  {
    field: 'warehouseName',
    headerName: 'Warehouse Name',
    minWidth: 180,
    render: (value) => <Typography sx={{ fontWeight: 700 }}>{value}</Typography>,
  },
  { field: 'code', headerName: 'Code', minWidth: 120 },
  {
    field: 'location',
    headerName: 'Location',
    minWidth: 210,
    render: (value) => {
      if (!value) return '—';
      if (typeof value === 'object') {
        return [value.address, value.city, value.state, value.pincode].filter(Boolean).join(', ') || '—';
      }
      return value;
    },
  },
  { field: 'managerName', headerName: 'Manager Name', minWidth: 150 },
  { field: 'contactNumber', headerName: 'Contact Number', minWidth: 140 },
  {
    field: 'status',
    headerName: 'Status',
    minWidth: 110,
    render: (value) => <StatusChip value={value} />,
  },
];

function WarehousesListPage() {
  return (
    <MasterListPage
      entityKey="warehouses"
      title="Warehouses"
      singularLabel="Warehouse"
      description="Configure warehouse and branch locations for future stock movement."
      primaryField="warehouseName"
      searchKeys={['warehouseName', 'code', 'location']}
      columns={warehousesColumns}
      FormDialogComponent={WarehousesFormDialog}
      addButtonLabel="Add Warehouse"
    />
  );
}

export default WarehousesListPage;
