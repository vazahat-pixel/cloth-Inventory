import {
  Box,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { NavLink, useLocation } from 'react-router-dom';
import useAppNavigate from '../../hooks/useAppNavigate';
import useRoleBasePath from '../../hooks/useRoleBasePath';
import { utilitiesNavItems } from './utilitiesNavConfig';

function UtilitiesSubnav() {
  const location = useLocation();
  const basePath = useRoleBasePath();
  const appNavigate = useAppNavigate();

  const localPath = location.pathname.startsWith(basePath)
    ? location.pathname.slice(basePath.length) || '/'
    : location.pathname;

  const matchesPath = (item) => {
    const candidatePaths = item?.matchPaths?.length
      ? item.matchPaths
      : item?.path
        ? [item.path]
        : [];

    return candidatePaths.some((candidate) => (
      candidate === '/'
        ? localPath === '/'
        : localPath === candidate || localPath.startsWith(`${candidate}/`)
    ));
  };

  return (
    <Box
      component="aside"
      sx={{
        width: { xs: 0, md: 220, lg: 236 },
        flexShrink: 0,
        minHeight: '100vh',
        borderRight: '1px solid #1f2937',
        background: 'linear-gradient(180deg, #111827 0%, #0f172a 100%)',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollbarWidth: 'thin',
        scrollbarColor: '#334155 #111827',
        '&::-webkit-scrollbar': { width: 6 },
        '&::-webkit-scrollbar-track': {
          backgroundColor: '#111827',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#334155',
          borderRadius: 999,
        },
        boxShadow: '12px 0 28px rgba(15, 23, 42, 0.16)',
      }}
    >
      <Box sx={{ px: 1.5, py: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="overline"
              sx={{
                display: 'block',
                color: '#60a5fa',
                fontWeight: 800,
                letterSpacing: 1,
                lineHeight: 1.2,
              }}
            >
              Utilities
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: '#e2e8f0', fontWeight: 700, lineHeight: 1.3 }}>
              Quick links
            </Typography>
          </Box>

          <Button
            size="small"
            startIcon={<ArrowBackRoundedIcon sx={{ fontSize: 16 }} />}
            onClick={() => appNavigate('/')}
            sx={{
              minWidth: 0,
              px: 1,
              py: 0.35,
              borderRadius: 999,
              color: '#cbd5e1',
              border: '1px solid rgba(148, 163, 184, 0.16)',
              textTransform: 'none',
              fontSize: 11,
              fontWeight: 700,
              lineHeight: 1,
              '&:hover': {
                borderColor: 'rgba(96, 165, 250, 0.32)',
                backgroundColor: 'rgba(30, 41, 59, 0.96)',
              },
            }}
          >
            Back
          </Button>
        </Box>
      </Box>

      <List disablePadding sx={{ px: 0.9, pb: 1.5 }}>
        {utilitiesNavItems.map((item) => {
          const Icon = item.icon;
          const isSelected = matchesPath(item);

          return (
            <ListItem key={item.key} disablePadding sx={{ mb: 0.75 }}>
              <ListItemButton
                component={NavLink}
                to={`${basePath}${item.path}`}
                selected={isSelected}
                sx={{
                  minHeight: 46,
                  px: 1,
                  py: 0.8,
                  borderRadius: 1.75,
                  alignItems: 'flex-start',
                  border: '1px solid rgba(148, 163, 184, 0.14)',
                  bgcolor: isSelected ? 'rgba(37, 99, 235, 0.2)' : 'rgba(15, 23, 42, 0.72)',
                  color: isSelected ? '#eff6ff' : '#cbd5e1',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(30, 41, 59, 0.98)',
                    borderColor: 'rgba(96, 165, 250, 0.26)',
                  },
                  '&.Mui-selected': {
                    bgcolor: 'rgba(37, 99, 235, 0.22)',
                    borderColor: 'rgba(96, 165, 250, 0.34)',
                    color: '#eff6ff',
                    boxShadow: '0 10px 22px rgba(37, 99, 235, 0.16)',
                  },
                  '&.Mui-selected:hover': {
                    bgcolor: 'rgba(37, 99, 235, 0.28)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mt: 0.1,
                    mr: 0.85,
                    color: isSelected ? '#93c5fd' : '#60a5fa',
                  }}
                >
                  <Icon sx={{ fontSize: 16 }} />
                </ListItemIcon>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <ListItemText
                    primary={item.label}
                    slotProps={{
                      primary: {
                        fontSize: 11.75,
                        fontWeight: 700,
                        lineHeight: 1.28,
                        sx: {
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                        },
                      },
                    }}
                  />
                </Box>
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}

export default UtilitiesSubnav;
