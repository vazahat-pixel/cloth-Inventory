import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import GroupWorkOutlinedIcon from '@mui/icons-material/GroupWorkOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import LocalAtmOutlinedIcon from '@mui/icons-material/LocalAtmOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';

export const setupTaxesMatchPaths = ['/setup/taxes'];

export const setupTaxesNavItems = [
  {
    key: 'edit-regions',
    label: 'Edit Tax Regions',
    path: '/setup/taxes/edit-regions',
    icon: MapOutlinedIcon,
  },
  {
    key: 'tax-types-sale',
    label: 'Setup Tax Types (Sale)',
    path: '/setup/taxes/tax-types-sale',
    icon: ReceiptLongOutlinedIcon,
  },
  {
    key: 'tax-types-purchase',
    label: 'Setup Tax Types (Purchase)',
    path: '/setup/taxes/tax-types-purchase',
    icon: ShoppingBagOutlinedIcon,
  },
  {
    key: 'item-taxes-grid',
    label: 'Set Item Taxes - Grid Mode',
    path: '/setup/taxes/item-taxes-grid',
    icon: GridViewOutlinedIcon,
  },
  {
    key: 'company-taxes-grid',
    label: 'Set Company Taxes - Grid Mode',
    path: '/setup/taxes/company-taxes-grid',
    icon: BusinessOutlinedIcon,
  },
  {
    key: 'company-group-taxes',
    label: 'Set Company + Group Wise Taxes',
    path: '/setup/taxes/company-group-taxes',
    icon: GroupWorkOutlinedIcon,
  },
  {
    key: 'group-wise-taxes',
    label: 'Set Group Wise Taxes',
    path: '/setup/taxes/group-wise-taxes',
    icon: CategoryOutlinedIcon,
  },
  {
    key: 'lot-wise-taxes',
    label: 'Set Lot Wise Taxes for Sale',
    path: '/setup/taxes/lot-wise-taxes',
    icon: LocalAtmOutlinedIcon,
  },
  {
    key: 'rate-basis-sale',
    label: 'Link Tax Types(Rate Basis) - Sale',
    path: '/setup/taxes/rate-basis-sale',
    icon: LinkOutlinedIcon,
  },
  {
    key: 'rate-basis-purchase',
    label: 'Link Tax Types(Rate Basis) - Purchase',
    path: '/setup/taxes/rate-basis-purchase',
    icon: LinkOutlinedIcon,
  },
  {
    key: 'vat-groups',
    label: 'Setup VAT Groups',
    path: '/setup/taxes/vat-groups',
    icon: AccountTreeOutlinedIcon,
  },
];
