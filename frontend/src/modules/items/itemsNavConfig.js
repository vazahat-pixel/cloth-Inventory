import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';

export const itemsMatchPaths = ['/items'];

export const itemsNavItems = [
  {
    key: 'item-list',
    label: 'Item List',
    path: '/items',
    matchPaths: ['/items'],
    icon: Inventory2OutlinedIcon,
  },
  {
    key: 'add-item',
    label: 'Add Item',
    path: '/items/new',
    matchPaths: ['/items/new', '/items/', '/items'],
    icon: AddBoxOutlinedIcon,
  },
];
