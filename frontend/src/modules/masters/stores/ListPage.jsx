import { Typography } from '@mui/material';
import MasterListPage from '../components/MasterListPage';
import StatusChip from '../components/StatusChip';
import StoresFormDialog from './FormDialog';

const storesColumns = [
    {
        field: 'name',
        headerName: 'Store Name',
        minWidth: 180,
        render: (value) => <Typography sx={{ fontWeight: 700 }}>{value}</Typography>,
    },
    { field: 'storeCode', headerName: 'Code', minWidth: 120 },
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
    // { field: 'managerName', headerName: 'Manager Name', minWidth: 150 },
    // { field: 'managerPhone', headerName: 'Contact Number', minWidth: 140 },
    { field: 'email', headerName: 'Login Email', minWidth: 180 },
    { 
        field: 'transferDiscountPct', 
        headerName: 'Disc (%)', 
        minWidth: 100,
        render: (value) => <Typography sx={{ color: '#ec4899', fontWeight: 600 }}>{value || 0}%</Typography>
    },
    {
        field: 'isActive',
        headerName: 'Status',
        minWidth: 110,
        render: (value) => <StatusChip value={value ? 'Active' : 'Inactive'} />,
    },
];

function StoresListPage() {
    return (
        <MasterListPage
            entityKey="stores"
            title="Store (Branch) Master"
            singularLabel="Store"
            description="Manage your retail store locations and branches."
            primaryField="name"
            searchKeys={['name', 'storeCode', 'location.city']}
            columns={storesColumns}
            FormDialogComponent={StoresFormDialog}
            addButtonLabel="Add Store"
        />
    );
}

export default StoresListPage;
