import ViewSidebarOutlinedIcon from '@mui/icons-material/ViewSidebarOutlined';
import RuleFolderOutlinedIcon from '@mui/icons-material/RuleFolderOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import HistoryEduOutlinedIcon from '@mui/icons-material/HistoryEduOutlined';
import ApiOutlinedIcon from '@mui/icons-material/ApiOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import SummarizeOutlinedIcon from '@mui/icons-material/SummarizeOutlined';

export const userAccessMatchPaths = ['/user-access'];

export const userAccessNavItems = [
  {
    key: 'allow-disallow-menu-template',
    label: 'Allow And Disallow Menu Options To Template',
    path: '/user-access/allow-disallow-menu-template',
    icon: RuleFolderOutlinedIcon,
  },
  {
    key: 'allow-disallow-menu-options',
    label: 'Allow and Disallow Menus Options',
    path: '/user-access/allow-disallow-menu-options',
    icon: ViewSidebarOutlinedIcon,
  },
  {
    key: 'branch-wise-back-date-locking',
    label: 'Set Branch Wise Back Date Entry/Modification Locking',
    path: '/user-access/branch-wise-back-date-locking',
    icon: CalendarMonthOutlinedIcon,
  },
  {
    key: 'user-wise-back-date-locking',
    label: 'Set User Wise Back Date Entry/Modification Locking',
    path: '/user-access/user-wise-back-date-locking',
    icon: CalendarMonthOutlinedIcon,
  },
  {
    key: 'manage-user-accounts',
    label: 'Manage User Accounts',
    path: '/user-access/manage-user-accounts',
    icon: PersonOutlineOutlinedIcon,
  },
  {
    key: 'approval-system',
    label: 'Approval System',
    path: '/user-access/approval-system',
    icon: FactCheckOutlinedIcon,
  },
  {
    key: 'audit-system',
    label: 'Audit System',
    path: '/user-access/audit-system',
    icon: HistoryEduOutlinedIcon,
  },
  {
    key: 'setup-api-templates',
    label: 'Setup API Templates',
    path: '/user-access/setup-api-templates',
    icon: ApiOutlinedIcon,
  },
  {
    key: 'api-log-viewer',
    label: 'API Log Viewer',
    path: '/user-access/api-log-viewer',
    icon: ReceiptLongOutlinedIcon,
  },
  {
    key: 'user-access-reports',
    label: 'User Access Reports',
    path: '/user-access/user-access-reports',
    icon: SummarizeOutlinedIcon,
  },
];

export const userAccessPlaceholderContent = {
  'allow-disallow-menu-template': {
    title: 'Allow And Disallow Menu Options To Template',
    description: 'This frontend page is ready for template-based menu permission setup inside the new User Access side flow.',
    highlights: [
      'Prepare reusable permission templates for common admin, manager, or staff access patterns.',
      'Keep template-driven menu controls grouped under User Access instead of the settings area.',
      'Extend later with template cloning, role assignment, and permission preview screens.',
    ],
    actions: [
      { label: 'Open Roles', path: '/settings/roles', variant: 'contained' },
      { label: 'Open Manage User Accounts', path: '/user-access/manage-user-accounts', variant: 'outlined' },
    ],
  },
  'allow-disallow-menu-options': {
    title: 'Allow and Disallow Menus Options',
    description: 'A dedicated frontend section is now available for direct menu permission controls by user or role.',
    highlights: [
      'Prepare menu-level permission management from the User Access side panel.',
      'Keep access-rule editing separate from the main settings screens.',
      'Extend later with per-user grants, module toggles, and branch-aware restrictions.',
    ],
    actions: [
      { label: 'Open Roles', path: '/settings/roles', variant: 'contained' },
      { label: 'Open User Access Reports', path: '/user-access/user-access-reports', variant: 'outlined' },
    ],
  },
  'branch-wise-back-date-locking': {
    title: 'Set Branch Wise Back Date Entry/Modification Locking',
    description: 'This frontend page is ready for branch-specific controls around back-date entry and modification locking.',
    highlights: [
      'Prepare branch-level controls for historical entry and edit windows.',
      'Keep locking rules grouped under User Access for operational control.',
      'Extend later with branch selectors, effective dates, and approval overrides.',
    ],
    actions: [
      { label: 'Open Audit System', path: '/user-access/audit-system', variant: 'contained' },
      { label: 'Open Manage User Accounts', path: '/user-access/manage-user-accounts', variant: 'outlined' },
    ],
  },
  'user-wise-back-date-locking': {
    title: 'Set User Wise Back Date Entry/Modification Locking',
    description: 'A dedicated frontend section is now available for user-level back-date locking and modification access rules.',
    highlights: [
      'Prepare user-specific controls for editing earlier transactions.',
      'Keep operational locking rules in the User Access module.',
      'Extend later with employee selectors, effective periods, and exception logging.',
    ],
    actions: [
      { label: 'Open Manage User Accounts', path: '/user-access/manage-user-accounts', variant: 'contained' },
      { label: 'Open Audit System', path: '/user-access/audit-system', variant: 'outlined' },
    ],
  },
  'approval-system': {
    title: 'Approval System',
    description: 'This frontend page is ready for approval-chain setup, transaction checks, and escalation rules.',
    highlights: [
      'Prepare approval workflows for sensitive entries and protected actions.',
      'Keep approval routing grouped with user permissions and access rules.',
      'Extend later with level-based approvers, pending queues, and approval history.',
    ],
    actions: [
      { label: 'Open Manage User Accounts', path: '/user-access/manage-user-accounts', variant: 'contained' },
      { label: 'Open Audit System', path: '/user-access/audit-system', variant: 'outlined' },
    ],
  },
  'setup-api-templates': {
    title: 'Setup API Templates',
    description: 'The User Access flow now includes a frontend page for API templates, token-linked formats, and integration rule setup.',
    highlights: [
      'Prepare API request or integration templates from the User Access module.',
      'Keep API template controls alongside audit and access-related tooling.',
      'Extend later with endpoint profiles, payload mapping, and template testing tools.',
    ],
    actions: [
      { label: 'Open API Log Viewer', path: '/user-access/api-log-viewer', variant: 'contained' },
      { label: 'Open Print Templates', path: '/settings/print-templates', variant: 'outlined' },
    ],
  },
  'api-log-viewer': {
    title: 'API Log Viewer',
    description: 'This frontend page is ready for reviewing API activity, errors, and integration history from the User Access flow.',
    highlights: [
      'Prepare API request and response monitoring from one place.',
      'Keep integration log viewing close to access and audit tooling.',
      'Extend later with filters, retry tools, and error drill-down views.',
    ],
    actions: [
      { label: 'Open Audit System', path: '/user-access/audit-system', variant: 'contained' },
      { label: 'Open Setup API Templates', path: '/user-access/setup-api-templates', variant: 'outlined' },
    ],
  },
  'user-access-reports': {
    title: 'User Access Reports',
    description: 'A dedicated frontend section is now available for permission summaries, access reviews, and user-level control reports.',
    highlights: [
      'Prepare access reports that summarize permissions, locks, and user activity.',
      'Keep reporting tied to the User Access side panel rather than mixing it into general reports.',
      'Extend later with role matrices, lock summaries, and approval usage analytics.',
    ],
    actions: [
      { label: 'Open Manage User Accounts', path: '/user-access/manage-user-accounts', variant: 'contained' },
      { label: 'Open Audit System', path: '/user-access/audit-system', variant: 'outlined' },
    ],
  },
};
