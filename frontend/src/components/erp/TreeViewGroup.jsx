import { Box, IconButton, Stack, Typography } from '@mui/material';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded';
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import StatusBadge from './StatusBadge';

function TreeNode({
  node,
  depth,
  expandedIds,
  onToggle,
  onEdit,
  onDelete,
  onAddChild,
  onSelect,
  selectedId,
}) {
  const isExpanded = expandedIds.includes(node.id);
  const hasChildren = Boolean(node.children?.length);

  return (
    <Box>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: 'center',
          py: 1,
          px: 1.5,
          pl: 1.5 + depth * 2,
          borderRadius: 1.5,
          bgcolor: selectedId === node.id ? '#eff6ff' : '#fff',
          border: selectedId === node.id ? '1px solid #bfdbfe' : '1px solid transparent',
          '&:hover': { bgcolor: '#f8fafc' },
        }}
        onClick={() => onSelect?.(node)}
      >
        <IconButton size="small" onClick={(event) => { event.stopPropagation(); onToggle(node.id); }}>
          {hasChildren ? (isExpanded ? <KeyboardArrowDownRoundedIcon fontSize="small" /> : <KeyboardArrowRightRoundedIcon fontSize="small" />) : <Box sx={{ width: 20 }} />}
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>{node.groupName || node.name}</Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            {node.groupType} • Level {node.level || 1}
          </Typography>
        </Box>
        <StatusBadge value={node.status} />
        <IconButton size="small" color="primary" onClick={(event) => { event.stopPropagation(); onAddChild?.(node); }}>
          <AddCircleOutlineOutlinedIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" color="primary" onClick={(event) => { event.stopPropagation(); onEdit?.(node); }}>
          <ModeEditOutlineOutlinedIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" color="error" onClick={(event) => { event.stopPropagation(); onDelete?.(node); }}>
          <DeleteOutlineOutlinedIcon fontSize="small" />
        </IconButton>
      </Stack>
      {hasChildren && isExpanded
        ? node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))
        : null}
    </Box>
  );
}

function TreeViewGroup(props) {
  const { nodes = [] } = props;
  return nodes.map((node) => <TreeNode key={node.id} node={node} depth={0} {...props} />);
}

export default TreeViewGroup;

