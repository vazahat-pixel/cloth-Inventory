import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import PercentOutlinedIcon from '@mui/icons-material/PercentOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';

export const configurationsMatchPaths = ['/setup/configurations'];

export const configurationsNavItems = [
  { key: 'purchase-voucher', label: 'Purchase Voucher Configuration', path: '/setup/configurations/purchase-voucher', icon: ReceiptLongOutlinedIcon },
  { key: 'qc-parameters', label: 'Setup Q.C. Parameters for Purchase', path: '/setup/configurations/qc-parameters', icon: FactCheckOutlinedIcon },
  { key: 'schemes', label: 'Setup Schemes', path: '/setup/configurations/schemes', icon: LocalOfferOutlinedIcon },
  { key: 'item-schemes', label: 'Setup Item Wise Schemes', path: '/setup/configurations/item-schemes', icon: CategoryOutlinedIcon },
  { key: 'item-group-schemes', label: 'Setup Item Group Wise Schemes', path: '/setup/configurations/item-group-schemes', icon: CategoryOutlinedIcon },
  { key: 'party-item-group-schemes', label: 'Setup Party + Item Group Wise Schemes', path: '/setup/configurations/party-item-group-schemes', icon: PeopleOutlinedIcon },
  { key: 'party-item-schemes', label: 'Setup Party + Item Wise Schemes', path: '/setup/configurations/party-item-schemes', icon: PeopleOutlinedIcon },
  { key: 'scheme-campaign', label: 'Setup Scheme Campaign', path: '/setup/configurations/scheme-campaign', icon: CampaignOutlinedIcon },
  { key: 'scheme-campaign-slab', label: 'Setup Scheme Campaign Slab Details', path: '/setup/configurations/scheme-campaign-slab', icon: LayersOutlinedIcon },
  { key: 'series-discount-slabs', label: 'Setup Series Wise Discount Slabs', path: '/setup/configurations/series-discount-slabs', icon: PercentOutlinedIcon },
  { key: 'cd-sale', label: "Setup C.D.'s for Sale", path: '/setup/configurations/cd-sale', icon: PercentOutlinedIcon },
  { key: 'sale-voucher', label: 'Sale Voucher Configuration', path: '/setup/configurations/sale-voucher', icon: ReceiptLongOutlinedIcon },
  { key: 'series-party-printing', label: 'Set Series + Party Wise Printing', path: '/setup/configurations/series-party-printing', icon: PrintOutlinedIcon },
  { key: 'series-outlet-printing', label: 'Set Series + Outlet Wise Printing', path: '/setup/configurations/series-outlet-printing', icon: PrintOutlinedIcon },
  { key: 'series-user-printing', label: 'Set Series + User Wise Printing', path: '/setup/configurations/series-user-printing', icon: PrintOutlinedIcon },
  { key: 'cashiers-pos', label: 'Setup Cashiers for POS', path: '/setup/configurations/cashiers-pos', icon: PointOfSaleOutlinedIcon },
  { key: 'manager-pos', label: 'Setup Manager for POS', path: '/setup/configurations/manager-pos', icon: PointOfSaleOutlinedIcon },
  { key: 'wallet-payment', label: 'Wallet Payment Configuration', path: '/setup/configurations/wallet-payment', icon: AccountBalanceWalletOutlinedIcon },
  { key: 'credit-note-schemes', label: 'Setup Credit Note for Schemes against Sales', path: '/setup/configurations/credit-note-schemes', icon: CreditCardOutlinedIcon },
  { key: 'complaints-mgmt', label: 'Complaints Management System Configuration', path: '/setup/configurations/complaints-mgmt', icon: ChatBubbleOutlineOutlinedIcon },
  { key: 'assembly-expenses', label: 'Setup Assembly Expenses', path: '/setup/configurations/assembly-expenses', icon: ConstructionOutlinedIcon },
];
