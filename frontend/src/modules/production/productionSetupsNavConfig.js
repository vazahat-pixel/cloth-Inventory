import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import PrecisionManufacturingOutlinedIcon from '@mui/icons-material/PrecisionManufacturingOutlined';
import LinkIcon from '@mui/icons-material/Link';
import GroupWorkOutlinedIcon from '@mui/icons-material/GroupWorkOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import GridViewIcon from '@mui/icons-material/GridView';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';

export const productionSetupsMatchPaths = ['/production/setups'];

export const productionSetupsNavItems = [
  { key: 'process-groups', label: 'Setup Process Groups/Processes', path: '/production/setups/process-groups', icon: AccountTreeOutlinedIcon },
  { key: 'bom-raw-material', label: 'Setup BOM Raw Material Types', path: '/production/setups/bom-raw-material', icon: CategoryOutlinedIcon },
  { key: 'bom-expenses', label: 'Setup BOM Expenses', path: '/production/setups/bom-expenses', icon: PaidOutlinedIcon },
  { key: 'rejection-reasons', label: 'Setup Production Rejection Reasons', path: '/production/setups/rejection-reasons', icon: ErrorOutlineIcon },
  { key: 'qc-parameters', label: 'Setup Q.C. Parameters for Production', path: '/production/setups/qc-parameters', icon: AssignmentTurnedInOutlinedIcon },
  { key: 'machines', label: 'Setup Machines', path: '/production/setups/machines', icon: PrecisionManufacturingOutlinedIcon },
  { key: 'process-item-linking', label: 'Process + Item Linking', path: '/production/setups/process-item-linking', icon: LinkIcon },
  { key: 'process-item-group-linking', label: 'Process + Item Group Linking', path: '/production/setups/process-item-group-linking', icon: GroupWorkOutlinedIcon },
  { key: 'discrete-production-linking', label: 'Process + Item Linking for Discrete Production', path: '/production/setups/discrete-production-linking', icon: LayersOutlinedIcon },
  { key: 'raw-material-specs-grid', label: 'Items + Process Raw Material Specs(Grid Mode)', path: '/production/setups/raw-material-specs-grid', icon: GridViewIcon },
  { key: 'sub-process-item-linking', label: 'Sub-Process + Item Linking', path: '/production/setups/sub-process-item-linking', icon: LinkIcon },
  { key: 'process-wise-rates', label: 'Setup Process Wise Item Rates', path: '/production/setups/process-wise-rates', icon: PaidOutlinedIcon },
];
