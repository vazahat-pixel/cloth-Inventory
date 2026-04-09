import { Box } from '@mui/material';
import MasterListPage from '../masters/components/MasterListPage';
import PromotionTypeFormDialog from './PromotionTypeFormDialog';

const columns = [
  { field: 'name', headerName: 'Promotion Label', minWidth: 200 },
  { field: 'baseLogic', headerName: 'Calculation Logic', minWidth: 150 },
  { field: 'description', headerName: 'Description', minWidth: 250 },
];

function PromotionTypesMaster() {
  return (
    <Box sx={{ width: '100%' }}>
      <MasterListPage
        entityKey="promotionTypes"
        title="Offer Configuration Master"
        singularLabel="Offer Type"
        description="Define your own custom labels and calculation logic for various shop offers here. These will then appear in your Scheme Builder."
        primaryField="name"
        searchKeys={['name', 'baseLogic', 'description']}
        columns={columns}
        FormDialogComponent={PromotionTypeFormDialog}
        addButtonLabel="Add New Offer Type"
      />
    </Box>
  );
}

export default PromotionTypesMaster;
