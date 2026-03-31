import { Box, Card, Typography, Avatar, AvatarGroup, Chip, Stack } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';

const getPriorityColor = (priority) => {
  switch (priority.toLowerCase()) {
    case 'urgent': return { main: '#ef4444', bg: '#fee2e2' };
    case 'moderate': return { main: '#f59e0b', bg: '#fef3c7' };
    case 'low': return { main: '#10b981', bg: '#d1fae5' };
    case 'on boarding': return { main: '#3b82f6', bg: '#dbeafe' };
    default: return { main: '#64748b', bg: '#f1f5f9' };
  }
};

const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'in progress': return { text: '#3b82f6', bg: '#eff6ff' };
    case 'in correction': return { text: '#f59e0b', bg: '#fffbeb' };
    case 'under review': return { text: '#8b5cf6', bg: '#f5f3ff' };
    case 'pending': return { text: '#64748b', bg: '#f8fafc' };
    default: return { text: '#1e293b', bg: '#f1f5f9' };
  }
};

function TaskCard({ priority, title, description, avatars, status, stats, date }) {
  const pColor = getPriorityColor(priority);
  const sColor = getStatusColor(status);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: '24px',
        border: '1px solid #f1f5f9',
        overflow: 'hidden',
        background: '#fff',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.08)',
        }
      }}
    >
      <Box sx={{ bgcolor: pColor.main, py: 0.5, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: '#fff', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 10 }}>
          {priority}
        </Typography>
      </Box>

      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b', mb: 1, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 3, lineHeight: 1.6, fontSize: '0.9rem', fontWeight: 500 }}>
          {description}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: 13, border: '2px solid #fff' } }}>
            {avatars?.map((a, i) => (
              <Avatar key={i} src={a.src}>{a.initial}</Avatar>
            ))}
          </AvatarGroup>

          <Chip
            label={status}
            sx={{
              bgcolor: sColor.bg,
              color: sColor.text,
              fontWeight: 800,
              fontSize: 11,
              borderRadius: '10px',
              px: 0.5,
              height: 28,
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 2, borderTop: '1.5px solid #f8fafc' }}>
          <Stack direction="row" spacing={2} sx={{ color: '#94a3b8' }}>
             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>{stats?.comments || 0}</Typography>
             </Box>
             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <InsertDriveFileOutlinedIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>{stats?.files || 0}</Typography>
             </Box>
             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccessTimeIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>{stats?.total || 0}</Typography>
             </Box>
          </Stack>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>
            {date}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}

export default TaskCard;
