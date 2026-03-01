import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Typography } from '@mui/material';
import MasterListPage from '../components/MasterListPage';
import StatusChip from '../components/StatusChip';
import SuppliersFormDialog from './FormDialog';

function SuppliersListPage() {
  const accountGroups = useSelector((state) => state.masters?.accountGroups || []);
  const groupById = useMemo(() => Object.fromEntries(accountGroups.map((g) => [g.id, g])), [accountGroups]);

  const supplierColumns = useMemo(
    () => [
      {
        field: 'supplierName',
        headerName: 'Supplier Name',
        minWidth: 180,
        render: (value) => <Typography sx={{ fontWeight: 700 }}>{value}</Typography>,
      },
      { field: 'supplierCode', headerName: 'Supplier Code', minWidth: 135 },
      {
        field: 'groupId',
        headerName: 'Group',
        minWidth: 120,
        render: (value) => (value && groupById[value] ? groupById[value].name : '—'),
      },
      { field: 'gstNumber', headerName: 'GST Number', minWidth: 165 },
      { field: 'phone', headerName: 'Phone', minWidth: 125 },
      { field: 'email', headerName: 'Email', minWidth: 190 },
      { field: 'address', headerName: 'Address', minWidth: 220 },
      { field: 'bankDetails', headerName: 'Bank Details', minWidth: 190 },
      {
        field: 'status',
        headerName: 'Status',
        minWidth: 110,
        render: (value) => <StatusChip value={value} />,
      },
    ],
    [groupById],
  );

  return (
    <MasterListPage
      entityKey="suppliers"
      title="Suppliers"
      singularLabel="Supplier"
      description="Manage vendors used for procurement and sourcing operations."
      primaryField="supplierName"
      searchKeys={['supplierName', 'supplierCode', 'phone']}
      columns={supplierColumns}
      FormDialogComponent={SuppliersFormDialog}
      addButtonLabel="Add Supplier"
    />
  );
}

export default SuppliersListPage;
