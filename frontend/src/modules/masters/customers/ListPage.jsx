import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Typography } from '@mui/material';
import MasterListPage from '../components/MasterListPage';
import StatusChip from '../components/StatusChip';
import CustomersFormDialog from './FormDialog';

function CustomersListPage() {
  const accountGroups = useSelector((state) => state.masters?.accountGroups || []);
  const groupById = useMemo(() => Object.fromEntries(accountGroups.map((g) => [g.id, g])), [accountGroups]);

  const customersColumns = useMemo(
    () => [
      { field: 'customerName', headerName: 'Customer Name', minWidth: 170 },
      {
        field: 'mobileNumber',
        headerName: 'Mobile Number',
        minWidth: 135,
        render: (value) => (
          <Typography sx={{ fontWeight: 700, color: '#1d4ed8', letterSpacing: 0.2 }}>{value}</Typography>
        ),
      },
      { field: 'email', headerName: 'Email', minWidth: 190 },
      {
        field: 'groupId',
        headerName: 'Group',
        minWidth: 120,
        render: (value) => (value && groupById[value] ? groupById[value].name : '—'),
      },
      {
        field: 'saleNature',
        headerName: 'Sale Nature',
        minWidth: 110,
        render: (value) => value || '—',
      },
      { field: 'address', headerName: 'Address', minWidth: 210 },
      { field: 'gstNumber', headerName: 'GST Number', minWidth: 160 },
      { field: 'loyaltyPoints', headerName: 'Loyalty Points', minWidth: 120, align: 'right' },
      { field: 'creditLimit', headerName: 'Credit Limit', minWidth: 130, align: 'right' },
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
      entityKey="customers"
      title="Customers"
      singularLabel="Customer"
      description="Maintain retail customers with loyalty and credit profile details."
      primaryField="customerName"
      searchKeys={['customerName', 'mobileNumber', 'email']}
      columns={customersColumns}
      FormDialogComponent={CustomersFormDialog}
      addButtonLabel="Add Customer"
    />
  );
}

export default CustomersListPage;
