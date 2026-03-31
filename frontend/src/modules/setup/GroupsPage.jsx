import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMasters, addMasterRecord, updateMasterRecord, deleteMasterRecord } from '../masters/mastersSlice';
import PageHeader from '../../components/erp/PageHeader';
import FilterBar from '../../components/erp/FilterBar';
import ExportButton from '../../components/erp/ExportButton';
import StatusBadge from '../../components/erp/StatusBadge';
import FormSection from '../../components/erp/FormSection';
import TreeViewGroup from '../../components/erp/TreeViewGroup';
import groupsExportColumns from '../../config/exportColumns/groups';
import { groupSeed } from '../erp/erpUiMocks';

const groupTypeOptions = [
  'Section',
  'Category',
  'Sub Category',
  'Style / Type',
];

const buildTree = (rows, parentId = null, level = 1) =>
  rows
    .filter((row) => (row.parentId || null) === parentId)
    .map((row) => ({
      ...row,
      level,
      children: buildTree(rows, row.id, level + 1),
    }));

const flattenTree = (nodes, parentNameMap = {}) =>
  nodes.flatMap((node) => [
    {
      ...node,
      parentName: parentNameMap[node.parentId] || '--',
    },
    ...flattenTree(
      node.children || [],
      {
        ...parentNameMap,
        [node.id]: node.groupName || node.name,
      },
    ),
  ]);

const toExportRows = (rows, parentById) =>
  rows.map((row) => ({
    group_name: row.groupName,
    group_type: row.groupType,
    parent_group: parentById[row.parentId] || '',
    hierarchy_level: row.level || 1,
    description: row.description || '',
    status: row.status,
    created_at: row.createdAt || '',
    updated_at: row.updatedAt || '',
  }));

const defaultFormValues = {
  id: '',
  groupName: '',
  groupType: '',
  parentId: '',
  description: '',
  status: 'Active',
};

function GroupsPage({ compact = false }) {
  const dispatch = useDispatch();
  const groupsFromRedux = useSelector((state) => state.masters.itemGroups);
  const { loading } = useSelector((state) => state.masters);

  const groups = useMemo(() => {
    return groupsFromRedux?.length ? groupsFromRedux : groupSeed;
  }, [groupsFromRedux]);

  const [tab, setTab] = useState('tree');
  const [searchText, setSearchText] = useState('');
  const [groupTypeFilter, setGroupTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedIds, setExpandedIds] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formValues, setFormValues] = useState(defaultFormValues);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    dispatch(fetchMasters('itemGroups'));
  }, [dispatch]);

  // Sync expanded IDs when first loaded
  useEffect(() => {
    if (groups.length && !expandedIds.length) {
      setExpandedIds(groups.map(g => g.id || g._id));
    }
  }, [groups]);

  const groupTree = useMemo(() => buildTree(groups), [groups]);
  const groupRows = useMemo(() => flattenTree(groupTree), [groupTree]);
  const parentById = useMemo(
    () => groups.reduce((accumulator, group) => ({ ...accumulator, [group.id]: group.groupName }), {}),
    [groups],
  );

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return groupRows.filter((row) => {
      const matchesSearch = query
        ? [row.groupName, row.groupType, row.description, row.parentName]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query))
        : true;
      const matchesType = groupTypeFilter === 'all' ? true : row.groupType === groupTypeFilter;
      const matchesStatus = statusFilter === 'all' ? true : row.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [groupRows, groupTypeFilter, searchText, statusFilter]);

  const filteredTree = useMemo(() => {
    const allowedIds = new Set(filteredRows.map((row) => row.id));

    const includeParents = (nodes) =>
      nodes
        .map((node) => {
          const children = includeParents(node.children || []);
          if (allowedIds.has(node.id) || children.length) {
            return { ...node, children };
          }
          return null;
        })
        .filter(Boolean);

    return includeParents(groupTree);
  }, [filteredRows, groupTree]);

  const exportRows = useMemo(() => toExportRows(filteredRows, parentById), [filteredRows, parentById]);

  const handleToggleExpand = (id) => {
    setExpandedIds((previous) => (
      previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id]
    ));
  };

  const openDialog = (group = null, parent = null) => {
    setFormErrors({});
    if (group) {
      setFormValues({
        id: group.id,
        groupName: group.groupName,
        groupType: group.groupType,
        parentId: group.parentId || '',
        description: group.description || '',
        status: group.status || 'Active',
      });
    } else {
      setFormValues({
        ...defaultFormValues,
        parentId: parent?.id || '',
      });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setFormValues(defaultFormValues);
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formValues.groupName.trim()) {
      nextErrors.groupName = 'Group name is required.';
    }
    if (!formValues.groupType) {
      nextErrors.groupType = 'Group type is required.';
    }
    setFormErrors(nextErrors);
    return !Object.keys(nextErrors).length;
  };

  const saveGroup = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (formValues.id) {
        await dispatch(updateMasterRecord({
          entityKey: 'itemGroups',
          id: formValues.id,
          updates: {
            groupName: formValues.groupName.trim(),
            groupType: formValues.groupType,
            parentId: formValues.parentId || null,
            description: formValues.description.trim(),
            status: formValues.status,
          }
        })).unwrap();
      } else {
        await dispatch(addMasterRecord({
          entityKey: 'itemGroups',
          record: {
            groupName: formValues.groupName.trim(),
            groupType: formValues.groupType,
            parentId: formValues.parentId || null,
            description: formValues.description.trim(),
            status: formValues.status,
          }
        })).unwrap();
      }
      closeDialog();
    } catch (error) {
      console.error('Failed to save group:', error);
      alert(error || 'Failed to save group');
    }
  };

  const deleteGroup = async (group) => {
    if (!window.confirm(`Delete group "${group.groupName}"? This will fail if items are linked.`)) {
      return;
    }

    try {
      await dispatch(deleteMasterRecord({
        entityKey: 'itemGroups',
        id: group.id
      })).unwrap();
      if (selectedGroup?.id === group.id) {
        setSelectedGroup(null);
      }
    } catch (error) {
      console.error('Failed to delete group:', error);
      alert(error || 'Failed to delete group');
    }
  };

  return (
    <Box sx={{ p: compact ? 0 : 0 }}>
      {!compact ? (
        <PageHeader
          title="Group Master"
          subtitle="Manage garment hierarchy, parent-child allocation, and export-ready group structures for item mapping."
          breadcrumbs={[
            { label: 'Setup' },
            { label: 'Groups', active: true },
          ]}
          actions={[
            <ExportButton
              key="export"
              rows={exportRows}
              columns={groupsExportColumns}
              filename="groups-master.xlsx"
              sheetName="Groups"
            />,
            <Button key="add" variant="contained" startIcon={<AddCircleOutlineOutlinedIcon />} onClick={() => openDialog()}>
              Add Group
            </Button>,
          ]}
        />
      ) : null}

      <FilterBar sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search group, type, description, or parent"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          sx={{ flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          size="small"
          select
          label="Group Type"
          value={groupTypeFilter}
          onChange={(event) => setGroupTypeFilter(event.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="all">All Types</MenuItem>
          {groupTypeOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          select
          label="Status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="all">All Statuses</MenuItem>
          <MenuItem value="Active">Active</MenuItem>
          <MenuItem value="Inactive">Inactive</MenuItem>
        </TextField>
      </FilterBar>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Tabs
          value={tab}
          onChange={(_, nextValue) => setTab(nextValue)}
          sx={{ px: 2.5, pt: 1, borderBottom: '1px solid #e2e8f0' }}
        >
          <Tab value="tree" label="Hierarchy View" />
          <Tab value="table" label="List View" />
        </Tabs>

        {tab === 'tree' ? (
          <Grid container>
            <Grid size={{ xs: 12, md: 7 }} sx={{ borderRight: { md: '1px solid #e2e8f0' }, p: 2 }}>
              {loading ? (
                <Typography variant="body2" sx={{ color: '#64748b', p: 2 }}>
                  Loading groups...
                </Typography>
              ) : filteredTree.length ? (
                <TreeViewGroup
                  nodes={filteredTree}
                  expandedIds={expandedIds}
                  onToggle={handleToggleExpand}
                  onEdit={openDialog}
                  onDelete={deleteGroup}
                  onAddChild={(group) => openDialog(null, group)}
                  onSelect={setSelectedGroup}
                  selectedId={selectedGroup?.id}
                />
              ) : (
                <Typography variant="body2" sx={{ color: '#64748b', p: 2 }}>
                  No group nodes match the current filters.
                </Typography>
              )}
            </Grid>

            <Grid size={{ xs: 12, md: 5 }} sx={{ p: 2 }}>
              <FormSection
                title={selectedGroup ? 'Selected Group' : 'Hierarchy Tips'}
                subtitle={selectedGroup ? 'Use this summary to review hierarchy details before editing.' : 'Expand parent nodes and create subgroups directly from the hierarchy.'}
              >
                {selectedGroup ? (
                  <Stack spacing={1.25}>
                    <Typography variant="body2"><strong>Group Name:</strong> {selectedGroup.groupName}</Typography>
                    <Typography variant="body2"><strong>Group Type:</strong> {selectedGroup.groupType}</Typography>
                    <Typography variant="body2"><strong>Parent Group:</strong> {parentById[selectedGroup.parentId] || 'Root'}</Typography>
                    <Typography variant="body2"><strong>Level:</strong> {selectedGroup.level}</Typography>
                    <Typography variant="body2"><strong>Status:</strong> {selectedGroup.status}</Typography>
                    <Typography variant="body2"><strong>Description:</strong> {selectedGroup.description || '--'}</Typography>
                    <Typography variant="body2"><strong>Created:</strong> {selectedGroup.createdAt || '--'}</Typography>
                    <Typography variant="body2"><strong>Updated:</strong> {selectedGroup.updatedAt || '--'}</Typography>
                    <Stack direction="row" spacing={1.25} sx={{ pt: 1 }}>
                      <Button variant="contained" onClick={() => openDialog(selectedGroup)}>
                        Edit
                      </Button>
                      <Button variant="outlined" onClick={() => openDialog(null, selectedGroup)}>
                        Add Child
                      </Button>
                    </Stack>
                  </Stack>
                ) : (
                  <Stack spacing={1}>
                    <Typography variant="body2" sx={{ color: '#475569' }}>
                      Group Type and Parent Group are required to keep item allocation clean for style, fabric, and product-type mapping.
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#475569' }}>
                      Example hierarchy: T-Shirt → Cotton → Oversized.
                    </Typography>
                  </Stack>
                )}
              </FormSection>
            </Grid>
          </Grid>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Group Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Group Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Parent</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Level</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Created Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Updated Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>{row.groupName}</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>{row.description || 'No description'}</Typography>
                    </TableCell>
                    <TableCell>{row.groupType}</TableCell>
                    <TableCell>{row.parentName}</TableCell>
                    <TableCell>{row.level}</TableCell>
                    <TableCell><StatusBadge value={row.status} /></TableCell>
                    <TableCell>{row.createdAt || '--'}</TableCell>
                    <TableCell>{row.updatedAt || '--'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="primary" onClick={() => openDialog(row)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => deleteGroup(row)}>
                        <DeleteOutlineOutlinedIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredRows.length ? (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ py: 5, textAlign: 'center', color: '#64748b' }}>
                      No groups found for the selected filters.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{formValues.id ? 'Edit Group' : 'Add Group'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Group Name *"
                value={formValues.groupName}
                onChange={(event) => setFormValues((previous) => ({ ...previous, groupName: event.target.value }))}
                error={Boolean(formErrors.groupName)}
                helperText={formErrors.groupName || ' '}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                select
                label="Group Type *"
                value={formValues.groupType}
                onChange={(event) => setFormValues((previous) => ({ ...previous, groupType: event.target.value }))}
                error={Boolean(formErrors.groupType)}
                helperText={formErrors.groupType || ' '}
              >
                {groupTypeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                select
                label="Parent Group"
                value={formValues.parentId}
                onChange={(event) => setFormValues((previous) => ({ ...previous, parentId: event.target.value }))}
              >
                <MenuItem value="">Root</MenuItem>
                {groups
                  .filter((group) => group.id !== formValues.id)
                  .map((group) => (
                    <MenuItem key={group.id} value={group.id}>
                      {group.groupName}
                    </MenuItem>
                  ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                select
                label="Status"
                value={formValues.status}
                onChange={(event) => setFormValues((previous) => ({ ...previous, status: event.target.value }))}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </TextField>
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                label="Description"
                multiline
                minRows={3}
                value={formValues.description}
                onChange={(event) => setFormValues((previous) => ({ ...previous, description: event.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={saveGroup}>
            {formValues.id ? 'Update Group' : 'Create Group'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default GroupsPage;
