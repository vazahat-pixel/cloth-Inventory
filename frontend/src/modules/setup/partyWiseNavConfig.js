import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import StoreOutlinedIcon from '@mui/icons-material/StoreOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import LocalAtmOutlinedIcon from '@mui/icons-material/LocalAtmOutlined';
import SettingsApplicationsOutlinedIcon from '@mui/icons-material/SettingsApplicationsOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PriceCheckOutlinedIcon from '@mui/icons-material/PriceCheckOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import QrCodeOutlinedIcon from '@mui/icons-material/QrCodeOutlined';
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined';
import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined';

export const partyWiseMatchPaths = ['/setup/party-wise'];

export const partyWiseNavItems = [
  { key: 'supplier-companies', label: 'Supplier + Companies', path: '/setup/party-wise/supplier-companies', icon: BusinessOutlinedIcon },
  { key: 'supplier-items', label: 'Supplier + Items', path: '/setup/party-wise/supplier-items', icon: Inventory2OutlinedIcon },
  { key: 'branch-supplier-items', label: 'Branch + Supplier + Items', path: '/setup/party-wise/branch-supplier-items', icon: StoreOutlinedIcon },
  { key: 'supplier-defaults', label: 'Set Supplier Wise Default TD/CD/Tax', path: '/setup/party-wise/supplier-defaults', icon: ReceiptLongOutlinedIcon },
  { key: 'tax-regions-customers', label: 'Set Tax Regions + Customers', path: '/setup/party-wise/tax-regions-customers', icon: MapOutlinedIcon },
  { key: 'branch-tax-customers', label: 'Set Branch + Tax Region + Customers', path: '/setup/party-wise/branch-tax-customers', icon: MapOutlinedIcon },
  { key: 'party-taxes', label: 'Set Party Wise Taxes', path: '/setup/party-wise/party-taxes', icon: LocalAtmOutlinedIcon },
  { key: 'supplier-taxes', label: 'Set Supplier Wise Taxes', path: '/setup/party-wise/supplier-taxes', icon: LocalAtmOutlinedIcon },
  { key: 'party-defaults', label: 'Set Party Wise Defaults', path: '/setup/party-wise/party-defaults', icon: SettingsApplicationsOutlinedIcon },
  { key: 'party-agent-defaults', label: 'Set Party + Series/Agent Wise Defaults', path: '/setup/party-wise/party-agent-defaults', icon: SettingsApplicationsOutlinedIcon },
  { key: 'party-price-list', label: 'Set Party Wise Price List', path: '/setup/party-wise/party-price-list', icon: ListAltOutlinedIcon },
  { key: 'party-company-defaults', label: 'Party + Company Wise Defaults', path: '/setup/party-wise/party-company-defaults', icon: BusinessOutlinedIcon },
  { key: 'party-item-defaults', label: 'Party + Item Wise Defaults', path: '/setup/party-wise/party-item-defaults', icon: Inventory2OutlinedIcon },
  { key: 'branch-party-item-defaults', label: 'Branch + Party + Item Wise Defaults', path: '/setup/party-wise/branch-party-item-defaults', icon: StoreOutlinedIcon },
  { key: 'branch-supplier-group-defaults', label: 'Branch + Supplier + Item Group Wise Defaults', path: '/setup/party-wise/branch-supplier-group-defaults', icon: StoreOutlinedIcon },
  { key: 'party-billing-locks', label: 'Party Wise Billing Locks', path: '/setup/party-wise/party-billing-locks', icon: LockOutlinedIcon },
  { key: 'party-discount-locks', label: 'Party Wise Discount Locks', path: '/setup/party-wise/party-discount-locks', icon: LockOutlinedIcon },
  { key: 'multi-price-rates', label: 'Enter Multiple Price List Wise Item Rates', path: '/setup/party-wise/multi-price-rates', icon: PriceCheckOutlinedIcon },
  { key: 'party-item-descriptions', label: 'Party + Item Wise Descriptions', path: '/setup/party-wise/party-item-descriptions', icon: DescriptionOutlinedIcon },
  { key: 'party-item-codes', label: 'Party + Item Wise Item Codes', path: '/setup/party-wise/party-item-codes', icon: QrCodeOutlinedIcon },
  { key: 'po-markdowns', label: 'Setup Supplier + Company + Group/Item Wise Markdowns for PO', path: '/setup/party-wise/po-markdowns', icon: TrendingDownOutlinedIcon },
  { key: 'party-item-filter', label: 'Set Party Wise Item Group Filter for Sale', path: '/setup/party-wise/party-item-filter', icon: FilterAltOutlinedIcon },
  { key: 'calc-configs-purchase', label: 'Setup Calculation Configurations for Purchase', path: '/setup/party-wise/calc-configs-purchase', icon: CalculateOutlinedIcon },
  { key: 'allocate-parties-calc', label: 'Allocate Parties to Calculation Configuration', path: '/setup/party-wise/allocate-parties-calc', icon: AssignmentIndOutlinedIcon },
];
