import React from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  Paper, 
  Stack, 
  Typography, 
  Breadcrumbs,
  Link,
  Divider,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';

const ErpSubPagePlaceholder = ({ config, backPath, backLabel = 'Dashboard' }) => {
  const navigate = useNavigate();
  
  if (!config) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <ConstructionOutlinedIcon sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Module Under Development</Typography>
        <Typography sx={{ mb: 4, color: '#64748b' }}>The requested ERP tool is currently being implemented.</Typography>
        <Button variant="contained" onClick={() => navigate(backPath || -1)}>Go Back</Button>
      </Box>
    );
  }

  const { title, description, highlights = [], actions = [] } = config;
  const isExport = title.toLowerCase().includes('export') || title.toLowerCase().includes('report');

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={2} sx={{ mb: 4, alignItems: 'center' }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(backPath || -1)}
          sx={{ borderRadius: 2 }}
        >
          Back
        </Button>
        <Box>
           <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
            {title}
          </Typography>
          <Breadcrumbs sx={{ mt: 0.5 }}>
            <Link underline="hover" color="inherit" sx={{ fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }} onClick={() => navigate(backPath || -1)}>{backLabel}</Link>
            <Typography color="primary" sx={{ fontSize: '0.875rem', fontWeight: 700 }}>{title}</Typography>
          </Breadcrumbs>
        </Box>
      </Stack>

      <Grid container spacing={4}>
        <Grid item xs={12} lg={7}>
          <Card sx={{ borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 3, 
                  bgcolor: isExport ? '#eff6ff' : '#f0fdf4',
                  color: isExport ? '#2563eb' : '#16a34a'
                }}>
                  {isExport ? <FileDownloadOutlinedIcon sx={{ fontSize: 32 }} /> : <FileUploadOutlinedIcon sx={{ fontSize: 32 }} />}
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Operation Details</Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>Unified ERP Utility Component</Typography>
                </Box>
              </Stack>
              
              <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.7, mb: 4 }}>
                {description}
              </Typography>
              
              <Divider sx={{ mb: 4 }} />
              
              {highlights.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.1em' }}>
                    Key Highlights & Rules
                  </Typography>
                  <Stack spacing={2} sx={{ mb: 4 }}>
                    {highlights.map((h, i) => (
                      <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start">
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#3b82f6', mt: 1.2 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>{h}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </>
              )}

              <Alert severity="info" sx={{ borderRadius: 3, mb: 4 }}>
                This tool is currently in <b>Beta</b>. Features are being enabled gradually to ensure data integrity.
              </Alert>
              
              {actions.length > 0 ? (
                <Stack direction="row" spacing={2}>
                  {actions.map((act, i) => (
                    <Button 
                      key={i}
                      variant={act.variant || 'contained'} 
                      size="large" 
                      onClick={() => {
                        if (act.handler && onAction) {
                          onAction(act.handler);
                        } else if (act.path) {
                          navigate(act.path);
                        }
                      }}
                      sx={{ py: 1.5, px: 4, borderRadius: 3, fontWeight: 800, textTransform: 'none' }}
                    >
                      {act.label}
                    </Button>
                  ))}
                </Stack>
              ) : (
                <Button 
                  fullWidth 
                  variant="contained" 
                  size="large" 
                  onClick={() => onAction && onAction('default')}
                  sx={{ py: 2, borderRadius: 3, fontWeight: 800, boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)' }}
                >
                  Enable {title} Tool
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 4, borderRadius: 4, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Implementation Scope</Typography>
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>1. UI Scaffolding</Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>Page navigation and layout are now fully reactive.</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>2. Data Integration</Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>Backend API hooks for these specific operations are under test.</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>3. Validation Engine</Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>Custom business logic for cross-referenced fields is being added.</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ErpSubPagePlaceholder;
