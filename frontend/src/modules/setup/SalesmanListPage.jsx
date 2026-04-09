import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Typography, Box, Paper, Chip } from '@mui/material';
import MasterListPage from '../masters/components/MasterListPage';
import StatusChip from '../masters/components/StatusChip';
import GroupsIcon from '@mui/icons-material/Groups';

function SalesmanListPage() {
  const stores = useSelector((state) => state.masters?.stores || []);
  const storeMap = useMemo(() => Object.fromEntries(stores.map((s) => [s.id, s.name])), [stores]);

  const columns = useMemo(
    () => [
      { field: 'name', headerName: 'Staff Name', minWidth: 200 },
      { field: 'code', headerName: 'Staff ID', minWidth: 120 },
      { field: 'mobile', headerName: 'Mobile Number', minWidth: 150 },
      {
        field: 'storeId',
        headerName: 'Shop / Store',
        minWidth: 180,
        render: (value) => {
          const name = (value && typeof value === 'object' ? value.name : storeMap[value]) || stores[0]?.name;
          return name ? (
            <Chip 
              icon={<GroupsIcon sx={{ fontSize: '1rem' }} />} 
              label={name} 
              size="small" 
              variant="outlined" 
              sx={{ borderColor: '#e2e8f0', bgcolor: '#f8fafc', fontWeight: 600 }}
            />
          ) : '—';
        },
      },
      { 
        field: 'commissionRate', 
        headerName: 'Incentive %', 
        minWidth: 100, 
        align: 'right',
        render: (val) => `${val || 0}%`
      },
      {
        field: 'status',
        headerName: 'Status',
        minWidth: 120,
        render: (value) => <StatusChip value={value || 'active'} />,
      },
    ],
    [storeMap, stores],
  );

  return (
    <Box sx={{ width: '100%' }}>
      <MasterListPage
        entityKey="salesmen"
        title="Store Staff Management"
        singularLabel="Staff Member"
        description="Add and manage the people who work in your retail shop across all your branches."
        primaryField="name"
        searchKeys={['name', 'code', 'mobile']}
        columns={columns}
        addButtonLabel="Add New Staff Member"
        apiRoot="/setup/salesmen"
        defaultValues={{ storeId: stores[0]?.id || '' }}
      />
    </Box>
  );
}

export default SalesmanListPage;
