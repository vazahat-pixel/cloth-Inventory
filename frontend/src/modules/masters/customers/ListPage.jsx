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
      { 
        field: 'loyaltyPoints', 
        headerName: 'Loyalty Total', 
        minWidth: 125, 
        align: 'right', 
        render: (val) => <Typography sx={{ fontWeight: 800, color: '#059669' }}>{val || 0}</Typography> 
      },
      { field: 'email', headerName: 'Email', minWidth: 190 },
      {
        field: 'groupId',
        headerName: 'Group',
        minWidth: 120,
        render: (value) => (value && groupById[value] ? groupById[value].name : '—'),
      },
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
      title="Customers & Loyalty"
      singularLabel="Customer"
      description="Centralized retail CRM with integrated loyalty reward tracking and credit profiles."
      primaryField="customerName"
      searchKeys={['customerName', 'mobileNumber', 'email']}
      columns={customersColumns}
      FormDialogComponent={CustomersFormDialog}
      addButtonLabel="Add Customer"
    />
  );
}

export default CustomersListPage;
