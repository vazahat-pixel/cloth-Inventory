import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Divider,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SettingsIcon from '@mui/icons-material/Settings';
import RefreshIcon from '@mui/icons-material/Refresh';
import CopyAllIcon from '@mui/icons-material/CopyAll';
import CloseIcon from '@mui/icons-material/Close';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread';
import BlockIcon from '@mui/icons-material/Block';
import DeleteIcon from '@mui/icons-material/Delete';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import SendIcon from '@mui/icons-material/Send';
import PrintIcon from '@mui/icons-material/Print';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import BuildIcon from '@mui/icons-material/Build';
import FolderIcon from '@mui/icons-material/Folder';
import InboxIcon from '@mui/icons-material/Inbox';
import RuleIcon from '@mui/icons-material/Rule';
import HistoryIcon from '@mui/icons-material/History';
import GridOnIcon from '@mui/icons-material/GridOn';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import HtmlIcon from '@mui/icons-material/Html';
import SearchIcon from '@mui/icons-material/Search';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import useAppNavigate from '../../hooks/useAppNavigate';
import { userAccessPlaceholderContent } from './userAccessNavConfig';

function UserAccessPlaceholderPage({ pageKey }) {
  const navigate = useAppNavigate();
  const params = useParams();
  
  const isReport = pageKey?.startsWith('reports/') || pageKey === 'user-access-reports' || params['*']?.startsWith('reports/');
  const reportKey = pageKey?.split('reports/')[1] || params['*']?.split('reports/')[1] || 'default';
  
  const section = userAccessPlaceholderContent[pageKey] || (isReport ? { title: 'Report' } : null);

  if (!section) {
    return null;
  }

  const isMenuAccessPage = pageKey === 'allow-disallow-menu-options' || pageKey === 'allow-disallow-menu-template';
  const isBranchLockingPage = pageKey === 'branch-wise-back-date-locking' || pageKey === 'user-wise-back-date-locking';
  const isMailboxPage = pageKey === 'approval-system' || pageKey === 'audit-system';
  const isApiTemplate = pageKey === 'setup-api-templates';
  const isApiLogViewer = pageKey === 'api-log-viewer';

  const companies = [
    'BHOPAL', 'BHUCHO MANDI', 'FARIDABAD', 'FAZILKA', 'G T B NAGAR', 
    'HANUMANGARH', 'HO/WAREHOUSE', 'KAROL BAGH', 'MUKTSAR', 
    'PACIFIC MALL', 'PITAMPURA', 'RATLAM', 'REWA', 'SAHIBABAD', 
    'SAROJINI NAGAR', 'SHAJAHANPUR', 'SONIPAT', 'TANK ROAD', 'UJJAIN'
  ];

  const userList = [
    'Admin', 'ADMINISTRATOR', 'BHOPAL', 'BHUCHO MANDI', 'FARIDABAD', 
    'FAZILKA', 'GTB STORE', 'HANUMANGARH', 'HAPUR', 'KAROL BAGH', 
    'MUKTSAR', 'Neeraj', 'PACIFIC MALL', 'PITAMPURA', 'RATLAM', 
    'REWA', 'SAROJNI', 'Sarvjeet', 'SHAJAHAPUR'
  ];

  const currentList = pageKey.includes('user') ? userList : companies;

  const menuItems = [
    { id: '1', label: 'Setup', children: [] },
    { id: '2', label: 'Accounts', children: [] },
    { id: '3', label: 'Purchase', children: [] },
    { id: '4', label: 'Order Processing', children: [] },
    { id: '5', label: 'Inventory', children: [] },
    { id: '6', label: 'Billing', children: [] },
    { id: '7', label: 'Production', children: [] },
    { id: '8', label: 'Payroll Setups', children: [] },
    { id: '9', label: 'Payroll Entry', children: [] },
    { id: '10', label: 'Payroll Reports', children: [] },
    { id: '11', label: 'Reports/Queries', children: [] },
    { id: '12', label: 'Business Insights', children: [] },
    { id: '13', label: 'Utilities', children: [] },
    { id: '14', label: 'User Access', children: [
      { id: '14-1', label: 'Allow And Disallow Menu Options To Template' },
      { id: '14-2', label: 'Allow and Disallow Menus Options' },
    ]},
    { id: '15', label: 'Export/Import Masters/Txns From Excel' },
    { id: '16', label: 'Export/Import Masters/Txns From Text' },
    { id: '17', label: 'Windows' },
  ];

  const renderGridToolbar = () => (
    <Box sx={{ p: 0.5, bgcolor: '#f1f5f9', borderBottom: '1px solid #cbd5e1', display: 'flex', gap: 1, alignItems: 'center' }}>
        <Stack direction="row" spacing={0.25} sx={{ borderRight: '1px solid #cbd5e1', pr: 1 }}>
            <IconButton size="small" sx={{ p: 0.25, borderRadius: 0.5 }}><GridOnIcon sx={{ fontSize: 16, color: '#475569' }} /></IconButton>
            <IconButton size="small" sx={{ p: 0.25, borderRadius: 0.5 }}><CheckIcon sx={{ fontSize: 16, color: '#22c55e' }} /></IconButton>
            <IconButton size="small" sx={{ p: 0.25, borderRadius: 0.5 }}><ClearIcon sx={{ fontSize: 16, color: '#ef4444' }} /></IconButton>
        </Stack>
        <Stack direction="row" spacing={0.25} sx={{ borderRight: '1px solid #cbd5e1', pr: 1 }}>
            <IconButton size="small" sx={{ p: 0.25, borderRadius: 0.5 }}><FileDownloadIcon sx={{ fontSize: 16, color: '#16a34a' }} /></IconButton>
            <IconButton size="small" sx={{ p: 0.25, borderRadius: 0.5 }}><HtmlIcon sx={{ fontSize: 16, color: '#db2777' }} /></IconButton>
            <IconButton size="small" sx={{ p: 0.25, borderRadius: 0.5 }}><PictureAsPdfIcon sx={{ fontSize: 16, color: '#dc2626' }} /></IconButton>
            <IconButton size="small" sx={{ p: 0.25, borderRadius: 0.5 }}><PrintIcon sx={{ fontSize: 16, color: '#475569' }} /></IconButton>
        </Stack>
        <Stack direction="row" spacing={0.25}>
            <IconButton size="small" sx={{ p: 0.25, borderRadius: 0.5 }}><SearchIcon sx={{ fontSize: 16, color: '#475569' }} /></IconButton>
            <IconButton size="small" sx={{ p: 0.25, borderRadius: 0.5 }}><ViewColumnIcon sx={{ fontSize: 16, color: '#475569' }} /></IconButton>
        </Stack>
    </Box>
  );

  const renderTree = (nodes) => (
    <TreeItem 
        key={nodes.id} 
        itemId={nodes.id} 
        label={
            <Box sx={{ display: 'flex', alignItems: 'center', p: 0.5, pr: 0 }}>
                <Checkbox size="small" sx={{ mr: 1, p: 0 }} onClick={(e) => e.stopPropagation()} />
                <Typography variant="body2" sx={{ fontWeight: 'inherit', flexGrow: 1 }}>
                    {nodes.label}
                </Typography>
            </Box>
        }
    >
      {Array.isArray(nodes.children)
        ? nodes.children.map((node) => renderTree(node))
        : null}
    </TreeItem>
  );

  if (isReport) {
    const reportTitleMap = {
      'user-log-book': 'USER LOG BOOK',
      'audit-trail-report': 'AUDIT TRAIL REPORT',
      'masters-modification-log': 'MASTERS MODIFICATION LOG',
      'document-modification-log': 'DOCUMENT MODIFICATION LOG',
      'accounts-doc-mod-log': 'ACCOUNTS DOCUMENT MODIFICATION LOG',
      'purchase-return-mod-log': 'PURCHASE RETURN MODIFICATION LOG',
      'logic-admin-mod-log': 'LOGIC ADMIN MODIFICATION LOG',
      'user-menu-rights-report': 'USER WISE MENU RIGHTS REPORT',
      'user-menu-rights-mod-log': 'USER WISE MENU RIGHTS MODIFICATION LOG',
      'user-utilization-report': 'USER WISE UTILIZATION REPORT',
      'approval-report': 'APPROVAL REPORT',
      'party-item-defaults-log': 'PARTY + ITEM GROUP DEFAULTS FOR PL ELEMENTS LOG',
      'sale-docs-entry-grid-log': 'SALE DOCUMENTS - DATA ENTRY GRID LOG',
      'user-access-rights-report': 'USER ACCESS RIGHTS REPORT',
      'branch-access-rights-report': 'BRANCH ACCESS RIGHTS REPORT',
      'config-modification-log': 'CONFIGURATION MODIFICATION LOG',
    };

    const reportTitle = reportTitleMap[reportKey] || (params['*'] ? params['*'].toUpperCase().replace(/-/g, ' ') : section.title);

    return (
        <Box sx={{ p: 0, bgcolor: '#f1f5f9', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Report Header */}
            <Box sx={{ p: 1, borderBottom: '1px solid #cbd5e1', bgcolor: 'white', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', minWidth: 100 }}>Configuration</Typography>
                <Divider orientation="vertical" flexItem />
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#0ea5e9' }}>{reportTitle}</Typography>
            </Box>

            {/* Filter Bar */}
            <Box sx={{ p: 1, bgcolor: '#e2e8f0', borderBottom: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>From</Typography>
                <TextField size="small" type="date" defaultValue="2026-03-26" sx={{ bgcolor: 'white', '& .MuiInputBase-input': { p: '6px 10px', fontSize: 13 } }} />
                
                <Typography variant="caption" sx={{ fontWeight: 700 }}>To</Typography>
                <TextField size="small" type="date" defaultValue="2026-03-26" sx={{ bgcolor: 'white', '& .MuiInputBase-input': { p: '6px 10px', fontSize: 13 } }} />

                <Button variant="contained" size="small" sx={{ bgcolor: '#0ea5e9', textTransform: 'none', fontWeight: 700 }}>Extra Options</Button>

                <Box sx={{ mx: 1 }} />
                
                <FormControlLabel 
                    control={<Checkbox size="small" defaultChecked />} 
                    label={<Typography variant="caption" sx={{ fontWeight: 700 }}>Enable Paging</Typography>} 
                    sx={{ m: 0 }}
                />

                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                
                <Typography variant="caption" sx={{ fontWeight: 700 }}>Page Size</Typography>
                <TextField size="small" defaultValue="100" sx={{ width: 80, bgcolor: 'white', '& .MuiInputBase-input': { p: '6px 10px', fontSize: 13 } }} />
            </Box>

            {/* Main Listing Area */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', bgcolor: 'white' }}>
                {renderGridToolbar()}
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontSize: 11, fontWeight: 900, bgcolor: '#f8fafc' }}>DATE</TableCell>
                            <TableCell sx={{ fontSize: 11, fontWeight: 900, bgcolor: '#f8fafc' }}>TIME</TableCell>
                            <TableCell sx={{ fontSize: 11, fontWeight: 900, bgcolor: '#f8fafc' }}>USER</TableCell>
                            <TableCell sx={{ fontSize: 11, fontWeight: 900, bgcolor: '#f8fafc' }}>ACTION</TableCell>
                            <TableCell sx={{ fontSize: 11, fontWeight: 900, bgcolor: '#f8fafc' }}>DESCRIPTION</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow hover>
                           <TableCell sx={{ fontSize: 12 }}>26/03/2026</TableCell>
                           <TableCell sx={{ fontSize: 12 }}>13:22:21</TableCell>
                           <TableCell sx={{ fontSize: 12, fontWeight: 700 }}>ADMINISTRATOR</TableCell>
                           <TableCell sx={{ fontSize: 12 }}>LOGIN</TableCell>
                           <TableCell sx={{ fontSize: 12 }}>Logged into HO Panel from B1WEB</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </Box>

            {/* Bottom Status Bar */}
            <Box sx={{ p: 0.5, bgcolor: '#f8fafc', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" size="small" color="error" sx={{ fontWeight: 700 }} onClick={() => navigate(-1)}>Close</Button>
            </Box>
        </Box>
    );
  }

  if (isApiLogViewer) {
    const logCols = [
        'SNO.', 'REQUEST CODE', 'DOC CODE', 'DOC TYPE', 
        'REQUEST DATE', 'API STATUS', 'API REMARKS', 'API TEMPLATE ID'
    ];
    
    return (
        <Box sx={{ p: 0, bgcolor: '#f1f5f9', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Top Filters Panel */}
            <Box sx={{ p: 2, bgcolor: 'white', borderBottom: '1px solid #cbd5e1' }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                        <Grid container spacing={1.5}>
                            <Grid item xs={6} sm={4}>
                                <TextField label="Date From" fullWidth size="small" type="date" defaultValue="2026-03-26" InputLabelProps={{ shrink: true }} />
                            </Grid>
                            <Grid item xs={6} sm={4}>
                                <TextField label="Date To" fullWidth size="small" type="date" defaultValue="2026-03-26" InputLabelProps={{ shrink: true }} />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField select label="Default" fullWidth size="small" defaultValue="def">
                                    <MenuItem value="def">Default</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField select label="Doc Type Filter" fullWidth size="small" defaultValue="none">
                                    <MenuItem value="none">NONE</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField select label="API Template" fullWidth size="small" defaultValue="choose">
                                    <MenuItem value="choose">Please Choose:</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={8} sm={9}>
                                <TextField label="Filter Value" fullWidth size="small" />
                            </Grid>
                            <Grid item xs={4} sm={3}>
                                <FormControlLabel control={<Checkbox size="small" />} label={<Typography sx={{ fontSize: 11, fontWeight: 700 }}>Filter Response</Typography>} />
                            </Grid>
                            <Grid item xs={8} sm={9}>
                                <TextField select label="API Status" fullWidth size="small" defaultValue="all">
                                    <MenuItem value="all">All</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={4} sm={3}>
                                <Button variant="contained" fullWidth size="small" sx={{ bgcolor: '#0ea5e9', fontWeight: 700 }}>Refresh</Button>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Box>

            {/* Main Content Area */}
            <Grid container sx={{ flexGrow: 1, overflow: 'hidden' }}>
                {/* Main Log Table */}
                <Grid item xs={12} md={8.5} sx={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid #cbd5e1' }}>
                    {renderGridToolbar()}
                    <Box sx={{ flexGrow: 1, overflow: 'auto', bgcolor: 'white' }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                                    {logCols.map(c => (
                                        <TableCell key={c} sx={{ fontSize: 10, fontWeight: 900, color: '#475569', borderRight: '1px solid #e2e8f0', p: 1 }}>
                                            {c}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {[1, 2, 3].map(i => (
                                    <TableRow key={i} hover>
                                        <TableCell sx={{ fontSize: 11, borderRight: '1px solid #f1f5f9' }}>{i}</TableCell>
                                        <TableCell sx={{ fontSize: 11, borderRight: '1px solid #f1f5f9' }} />
                                        <TableCell sx={{ fontSize: 11, borderRight: '1px solid #f1f5f9' }} />
                                        <TableCell sx={{ fontSize: 11, borderRight: '1px solid #f1f5f9' }} />
                                        <TableCell sx={{ fontSize: 11, borderRight: '1px solid #f1f5f9' }} />
                                        <TableCell sx={{ fontSize: 11, borderRight: '1px solid #f1f5f9' }} />
                                        <TableCell sx={{ fontSize: 11, borderRight: '1px solid #f1f5f9' }} />
                                        <TableCell sx={{ fontSize: 11, borderRight: '1px solid #f1f5f9' }} />
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>
                </Grid>

                {/* Right Inspection Panels */}
                <Grid item xs={12} md={3.5} sx={{ display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
                    <Box sx={{ flexGrow: 1, borderBottom: '2px solid #cbd5e1', p: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8' }}>API REQUEST PAYLOAD</Typography>
                    </Box>
                    <Box sx={{ flexGrow: 1, p: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8' }}>API RESPONSE LOG</Typography>
                    </Box>
                </Grid>
            </Grid>

            {/* Footer */}
            <Box sx={{ p: 1, bgcolor: '#f8fafc', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" size="small" sx={{ bgcolor: '#0f172a', fontWeight: 700 }} onClick={() => navigate(-1)}>Close</Button>
            </Box>
        </Box>
    );
  }

  if (isApiTemplate) {
    const apiCols = [
        'SNO.', 'TEMPLATE NAME', 'TEMPLATE DESCRIPTION', 'API USER NAME', 
        'API PASSWORD', 'LOGIC USER NAME', 'INACTIVE', 'TEMPLATE ID', 'LICENCE STATUS'
    ];
    
    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#f1f5f9', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
            <Stack spacing={0.5} sx={{ mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: -0.5 }}>
                    {section.title}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Configure external service integration templates and authentication credentials.
                </Typography>
            </Stack>

            <Paper sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                {renderGridToolbar()}
                
                <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                                {apiCols.map(c => (
                                    <TableCell key={c} sx={{ fontSize: 10, fontWeight: 900, color: '#475569', borderRight: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                                        {c}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell sx={{ fontSize: 12, borderRight: '1px solid #e2e8f0' }}>1</TableCell>
                                <TableCell sx={{ borderRight: '1px solid #e2e8f0', p: 0 }}>
                                    <TextField fullWidth size="small" variant="standard" InputProps={{ disableUnderline: true }} sx={{ px: 1, height: 32, bgcolor: '#fdffda' }} />
                                </TableCell>
                                <TableCell sx={{ borderRight: '1px solid #e2e8f0' }} />
                                <TableCell sx={{ borderRight: '1px solid #e2e8f0' }} />
                                <TableCell sx={{ borderRight: '1px solid #e2e8f0' }} />
                                <TableCell sx={{ borderRight: '1px solid #e2e8f0' }} />
                                <TableCell sx={{ borderRight: '1px solid #e2e8f0', fontSize: 12 }}>No</TableCell>
                                <TableCell sx={{ borderRight: '1px solid #e2e8f0' }} />
                                <TableCell sx={{ borderRight: '1px solid #e2e8f0' }} />
                            </TableRow>
                        </TableBody>
                    </Table>
                </Box>

                {/* Bottom Config Bar */}
                <Box sx={{ mt: 'auto', borderTop: '4px solid #cbd5e1' }}>
                    <Grid container>
                        <Grid item xs={1.5}>
                            <Box sx={{ p: 1, textAlign: 'center', bgcolor: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                                <Typography variant="caption" sx={{ fontWeight: 700 }}>API Template</Typography>
                            </Box>
                            <Box sx={{ p: 1.5, textAlign: 'center', bgcolor: '#0ea5e9', color: 'white' }}>
                                <Typography variant="caption" sx={{ fontWeight: 800 }}>API Settings</Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={9}>
                            <Box sx={{ p: 1, borderLeft: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700 }}>Please Choose:</Typography>
                                <TextField select size="small" sx={{ width: 400, bgcolor: 'white' }} defaultValue="choice">
                                    <MenuItem value="choice">Please Choose:</MenuItem>
                                </TextField>
                                <Box sx={{ flexGrow: 1 }} />
                                <Button variant="contained" size="small" sx={{ px: 6, fontWeight: 700, bgcolor: '#0ea5e9' }}>Save</Button>
                            </Box>
                        </Grid>
                        <Grid item xs={1.5} sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', p: 1, borderBottom: '1px solid #cbd5e1' }}>
                            <Button variant="contained" size="small" color="error" fullWidth sx={{ fontWeight: 700 }} onClick={() => navigate(-1)}>Close</Button>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </Box>
    );
  }

  if (isMailboxPage) {
    const isAudit = pageKey === 'audit-system';
    const mainTitle = isAudit ? 'PENDING FOR AUDIT' : 'INBOX';
    const folders = isAudit ? [
        { id: 'pending', label: 'PENDING FOR AUDIT' },
        { id: 'audited', label: 'AUDITED' },
        { id: 'rejected', label: 'REJECTED ITEMS' },
    ] : [
        { id: 'approved', label: 'APPROVED ITEMS' },
        { id: 'deleted', label: 'DELETED ITEMS' },
        { id: 'inbox', label: 'INBOX' },
        { id: 'rejected', label: 'REJECTED ITEMS' },
    ];
    
    const toolbarActions = [
        { icon: <BuildIcon />, label: 'Configuration' },
        { icon: <MarkEmailReadIcon />, label: 'Mark As Read' },
        { icon: <MarkEmailUnreadIcon />, label: 'Mark As Unread' },
        { icon: <BlockIcon />, label: 'Mark As Rejected' },
        { icon: <DeleteIcon />, label: 'Delete' },
        { icon: <CreateNewFolderIcon />, label: 'Move To Folder' },
        { icon: <CheckCircleOutlineIcon />, label: 'Approve Event' },
        { icon: <OpenInNewIcon />, label: 'Open in New Window' },
        { icon: <ZoomInIcon />, label: 'Zoom To Voucher' },
        { icon: <SendIcon />, label: 'Send Msg' },
        { icon: <PrintIcon />, label: 'Print Preview' },
        { icon: <SettingsIcon />, label: 'Settings' },
        { icon: <ExitToAppIcon />, label: 'Exit' },
    ];

    return (
        <Box sx={{ p: 0, bgcolor: '#f1f5f9', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Main Ribbon Toolbar */}
            <Box sx={{ p: 1, borderBottom: '1px solid #cbd5e1', bgcolor: 'white', display: 'flex', gap: 0.5, overflowX: 'auto' }}>
                {toolbarActions.map((action, i) => (
                    <Button 
                        key={i} 
                        size="small" 
                        variant="text" 
                        sx={{ 
                            flexDirection: 'column', 
                            minWidth: 80, 
                            color: '#475569',
                            '& .MuiButton-startIcon': { m: 0, mb: 0.5 },
                            textTransform: 'none',
                            fontSize: 10,
                            fontWeight: 700
                        }}
                    >
                        <Box sx={{ color: '#0ea5e9', mb: 0.5 }}>{action.icon}</Box>
                        {action.label}
                    </Button>
                ))}
            </Box>

            {/* Main Workspace */}
            <Grid container sx={{ flexGrow: 1, overflow: 'hidden' }}>
                {/* Folders Sidebar */}
                <Grid item xs={12} md={2.5} sx={{ borderRight: '1px solid #cbd5e1', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ p: 1.5, borderBottom: '1px solid #cbd5e1', display: 'flex', gap: 1 }}>
                        <Button variant="contained" size="small" sx={{ fontSize: 11, textTransform: 'none', bgcolor: '#0f172a' }}>New Folder</Button>
                        <Button variant="outlined" size="small" sx={{ fontSize: 11, textTransform: 'none' }}>Delete Folder</Button>
                    </Box>
                    <Box sx={{ p: 1, overflowY: 'auto', flexGrow: 1 }}>
                        <SimpleTreeView defaultExpandedItems={['root']}>
                            <TreeItem itemId="root" label="ADMINISTRATOR [Personal Folders]">
                                {folders.map(f => (
                                   <TreeItem 
                                     key={f.id} 
                                     itemId={f.id} 
                                     label={f.label} 
                                     sx={f.label === mainTitle ? { '& .MuiTreeItem-label': { fontWeight: 800, color: '#0ea5e9' } } : {}}
                                   />
                                ))}
                            </TreeItem>
                        </SimpleTreeView>
                    </Box>
                </Grid>

                {/* Listing and Details Split View */}
                <Grid item xs={12} md={9.5} sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {/* Filter Bar */}
                    <Box sx={{ p: 1, borderBottom: '1px solid #cbd5e1', bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <TextField select size="small" defaultValue="All" sx={{ width: 120, bgcolor: 'white' }}>
                            <MenuItem value="All">All Items</MenuItem>
                        </TextField>
                        <Typography variant="caption" sx={{ fontWeight: 900, color: '#475569' }}>{mainTitle}</Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        <FormControlLabel control={<Checkbox size="small" />} label={<Typography sx={{ fontSize: 12 }}>Selections</Typography>} />
                        <FormControlLabel control={<Checkbox size="small" />} label={<Typography sx={{ fontSize: 12 }}>Created By</Typography>} />
                        <Button size="small" variant="contained" startIcon={<RefreshIcon />} sx={{ bgcolor: '#0ea5e9' }}>Refresh</Button>
                    </Box>

                    {/* Inbox Grid */}
                    <Box sx={{ flexGrow: 1, bgcolor: 'white', overflow: 'auto', p: 0, display: 'flex', flexDirection: 'column' }}>
                        {renderGridToolbar()}
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox"><Checkbox size="small" /></TableCell>
                                    <TableCell sx={{ fontSize: 11, fontWeight: 900, bgcolor: '#f8fafc' }}>DATE</TableCell>
                                    <TableCell sx={{ fontSize: 11, fontWeight: 900, bgcolor: '#f8fafc' }}>FROM</TableCell>
                                    <TableCell sx={{ fontSize: 11, fontWeight: 900, bgcolor: '#f8fafc' }}>SUBJECT</TableCell>
                                    <TableCell sx={{ fontSize: 11, fontWeight: 900, bgcolor: '#f8fafc' }}>TYPE</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow hover>
                                    <TableCell padding="checkbox"><Checkbox size="small" /></TableCell>
                                    <TableCell sx={{ fontSize: 12 }}>26/03/2026</TableCell>
                                    <TableCell sx={{ fontSize: 12, fontWeight: 700 }}>{isAudit ? 'Acct Dept' : 'System'}</TableCell>
                                    <TableCell sx={{ fontSize: 12 }}>{isAudit ? 'Audit Pending for Sales Invoice: SINV/202' : 'Purchase Voucher Approval Required: PV/001'}</TableCell>
                                    <TableCell sx={{ fontSize: 12 }}>{isAudit ? 'AUDIT' : 'VOUCHER'}</TableCell>
                                </TableRow>
                                <TableRow hover>
                                    <TableCell padding="checkbox"><Checkbox size="small" /></TableCell>
                                    <TableCell sx={{ fontSize: 12 }}>26/03/2026</TableCell>
                                    <TableCell sx={{ fontSize: 12, fontWeight: 700 }}>Sales Team</TableCell>
                                    <TableCell sx={{ fontSize: 12 }}>Discount Limit Exceeded: INV/0042</TableCell>
                                    <TableCell sx={{ fontSize: 12 }}>VOUCHER</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </Box>

                    {/* Footer Details Panel */}
                    <Box sx={{ height: 250, borderTop: '4px solid #cbd5e1', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ p: 1, borderBottom: '1px solid #cbd5e1', display: 'flex', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ fontWeight: 900, color: '#475569' }}>Item Details</Typography>
                        </Box>
                        {renderGridToolbar()}
                        <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto', bgcolor: '#fff' }}>
                            <Typography variant="body2" sx={{ color: '#64748b', fontStyle: 'italic' }}>Select an item to view details...</Typography>
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
  }

  if (isBranchLockingPage) {
    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#f1f5f9', minHeight: '100%' }}>
            <Stack spacing={0.5} sx={{ mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: -0.5 }}>
                    {section.title}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Configure back-date entry and modification locking periods for branches.
                </Typography>
            </Stack>

            <Paper sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                {/* Custom Toolbar */}
                <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #e2e8f0', bgcolor: '#f8fafc', display: 'flex', gap: 1 }}>
                   <Button size="small" variant="text" sx={{ minWidth: 0, p: 0.5 }}><SettingsIcon fontSize="small" /></Button>
                   <Button size="small" variant="text" sx={{ minWidth: 0, p: 0.5 }}><RefreshIcon fontSize="small" /></Button>
                   <Box sx={{ flexGrow: 1 }} />
                   <Button variant="outlined" size="small" sx={{ fontWeight: 700 }}>{pageKey.includes('user') ? 'User Selection' : 'Branch Selection'}</Button>
                </Box>

                <Box sx={{ p: 0, overflowY: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
                   <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                       <thead>
                           <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                               <th style={{ textAlign: 'left', padding: '12px 16px', color: '#475569', width: 60 }}>SNO.</th>
                               <th style={{ textAlign: 'left', padding: '12px 16px', color: '#475569' }}>{pageKey.includes('user') ? 'USER NAME' : 'BRANCH NAME'}</th>
                               <th style={{ textAlign: 'left', padding: '12px 16px', color: '#475569' }}>SETTINGS</th>
                           </tr>
                       </thead>
                       <tbody>
                           {currentList.map((item, index) => (
                               <tr key={item} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                   <td style={{ padding: '10px 16px', color: '#64748b' }}>{index + 1}</td>
                                   <td style={{ padding: '10px 16px', fontWeight: 700, color: '#1e293b' }}>{item}</td>
                                   <td style={{ padding: '10px 16px' }}>
                                       <Box sx={{ px: 1, py: 0.2, bgcolor: '#fee2e2', color: '#ef4444', borderRadius: 1, display: 'inline-block', fontSize: 11, fontWeight: 800 }}>
                                           NOT DEFINED
                                       </Box>
                                   </td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
                </Box>

                <Box sx={{ p: 1.5, borderTop: '1px solid #e2e8f0', bgcolor: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button size="small" variant="contained" sx={{ bgcolor: '#0f172a' }} onClick={() => navigate(-1)}>Close</Button>
                </Box>
            </Paper>
        </Box>
    );
  }

  if (!isMenuAccessPage) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#f1f5f9', minHeight: '100%' }}>
        <Stack spacing={0.5} sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: -0.5 }}>
            {section.title}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 780 }}>
            {section.description}
          </Typography>
        </Stack>

        <Paper
          elevation={0}
          sx={{
            maxWidth: 860,
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: 3,
            border: '1px solid #dbe4f0',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)',
            boxShadow: '0 20px 45px rgba(148, 163, 184, 0.12)',
          }}
        >
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
              Frontend Section Ready
            </Typography>

            {section.highlights?.map((highlight) => (
              <Box
                key={highlight}
                sx={{
                  px: 1.5,
                  py: 1.2,
                  borderRadius: 2,
                  border: '1px solid #e2e8f0',
                  bgcolor: '#ffffff',
                }}
              >
                <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7 }}>
                  {highlight}
                </Typography>
              </Box>
            ))}

            {section.actions?.length ? (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 0.5 }}>
                {section.actions.map((action) => (
                  <Button
                    key={action.label}
                    variant={action.variant || 'contained'}
                    onClick={() => navigate(action.path)}
                  >
                    {action.label}
                  </Button>
                ))}
              </Stack>
            ) : null}
          </Stack>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#f1f5f9', minHeight: '100%' }}>
      {/* (Interactive TreeView UI remains here) */}
      <Stack spacing={0.5} sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: -0.5 }}>
          {section.title}
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          Assign and manage module-level permissions and menu visibility.
        </Typography>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 160px)'
        }}
      >
        {/* Toolbar */}
        <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', bgcolor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={3} alignItems="center">
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569' }}>Select User Name</Typography>
                    <TextField 
                        select 
                        size="small" 
                        defaultValue="Admin"
                        sx={{ minWidth: 200, bgcolor: 'white' }}
                    >
                        <MenuItem value="Admin">Admin</MenuItem>
                        <MenuItem value="Manager">Manager</MenuItem>
                        <MenuItem value="Staff">Staff</MenuItem>
                    </TextField>
                </Stack>
            </Stack>
            <Button variant="contained" size="small" startIcon={<CopyAllIcon />} sx={{ bgcolor: '#0ea5e9', '&:hover': { bgcolor: '#0284c7' } }}>
                Copy
            </Button>
        </Box>

        {/* Content */}
        <Grid container sx={{ flexGrow: 1, overflow: 'hidden' }}>
            {/* Tree Section */}
            <Grid item xs={12} md={8} sx={{ borderRight: '1px solid #e2e8f0', overflowY: 'auto', p: 2 }}>
                <SimpleTreeView
                    aria-label="menu system"
                    slots={{
                      collapseIcon: ExpandMoreIcon,
                      expandIcon: ChevronRightIcon,
                    }}
                    defaultExpandedItems={['14']}
                    sx={{ flexGrow: 1, overflowY: 'auto' }}
                >
                    {menuItems.map((item) => renderTree(item))}
                </SimpleTreeView>
            </Grid>

            {/* Permissions Sidebar Section */}
            <Grid item xs={12} md={4} sx={{ bgcolor: '#f8fafc', overflowY: 'auto' }}>
                <Box sx={{ p: 2 }}>
                    <Box sx={{ mb: 3 }}>
                        <Typography 
                            variant="overline" 
                            sx={{ 
                                display: 'block', 
                                bgcolor: '#0f172a', 
                                color: 'white', 
                                px: 1.5, 
                                py: 0.5, 
                                fontWeight: 800,
                                borderRadius: '4px 4px 0 0'
                            }}
                        >
                            Enable
                        </Typography>
                        <Box sx={{ bgcolor: 'white', p: 1.5, border: '1px solid #e2e8f0', borderTop: 0, borderRadius: '0 0 4px 4px' }}>
                            <Stack spacing={1}>
                                <FormControlLabel control={<Checkbox size="small" />} label={<Typography fontSize={13}>Allow Modify</Typography>} />
                                <FormControlLabel control={<Checkbox size="small" />} label={<Typography fontSize={13}>Allow Configuration Modification</Typography>} />
                                <FormControlLabel control={<Checkbox size="small" />} label={<Typography fontSize={13}>Allow Deletion</Typography>} />
                                <FormControlLabel control={<Checkbox size="small" />} label={<Typography fontSize={13}>Allow Sp. Options</Typography>} />
                                <FormControlLabel control={<Checkbox size="small" />} label={<Typography fontSize={13}>Allow Column Attributes Modification</Typography>} />
                            </Stack>
                        </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                        <Typography 
                            variant="overline" 
                            sx={{ 
                                display: 'block', 
                                bgcolor: '#0f172a', 
                                color: 'white', 
                                px: 1.5, 
                                py: 0.5, 
                                fontWeight: 800,
                                borderRadius: '4px 4px 0 0'
                            }}
                        >
                            Modify Date Range
                        </Typography>
                        <Box sx={{ bgcolor: 'white', p: 1.5, border: '1px solid #e2e8f0', borderTop: 0, borderRadius: '0 0 4px 4px' }}>
                            <Stack spacing={1}>
                                <FormControlLabel control={<Checkbox size="small" />} label={<Typography fontSize={13}>Allow Printing</Typography>} />
                                <FormControlLabel control={<Checkbox size="small" />} label={<Typography fontSize={13}>Allow Cancellation</Typography>} />
                                <FormControlLabel control={<Checkbox size="small" />} label={<Typography fontSize={13}>Implement User/Branch Filters</Typography>} />
                                <FormControlLabel control={<Checkbox size="small" />} label={<Typography fontSize={13}>Allow Re-Printing</Typography>} />
                            </Stack>
                        </Box>
                    </Box>
                </Box>
            </Grid>
        </Grid>

        {/* Footer */}
        <Box sx={{ p: 1.5, borderTop: '1px solid #e2e8f0', bgcolor: '#f8fafc', display: 'flex', justifyContent: 'flex-start', gap: 1 }}>
            <Button size="small" variant="contained" startIcon={<RefreshIcon />} sx={{ bgcolor: '#0f172a' }}>Refresh</Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button size="small" variant="outlined" startIcon={<CloseIcon />} color="error" onClick={() => navigate(-1)}>Close</Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default UserAccessPlaceholderPage;
