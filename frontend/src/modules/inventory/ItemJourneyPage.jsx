import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Autocomplete, 
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Chip,
  Divider,
  Grid,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/material';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentsIcon from '@mui/icons-material/Payments';
import PostAddIcon from '@mui/icons-material/PostAdd';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import api from '../../services/api';

/**
 * ItemJourneyPage — The vertical trace of a garment's life cycle.
 * From PO creation to final payment settlement.
 */
const ItemJourneyPage = () => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [journeyData, setJourneyData] = useState(null);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingJourney, setLoadingJourney] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get('/items');
      setItems(res.data.data || []);
    } catch (err) {
      console.error('Fetch items failed:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleSelect = async (event, newValue) => {
    setSelectedItem(newValue);
    if (!newValue) {
      setJourneyData(null);
      return;
    }

    setLoadingJourney(true);
    try {
      const res = await api.get(`/inventory/trace/${newValue._id}`);
      setJourneyData(res.data.data);
    } catch (err) {
      console.error('Fetch journey failed:', err);
    } finally {
      setLoadingJourney(false);
    }
  };

  const getStepIcon = (type) => {
    switch (type) {
      case 'PO': return <PostAddIcon />;
      case 'GRN': return <Inventory2Icon />;
      case 'STOCK': return <LocalShippingIcon />;
      case 'SALE': return <ShoppingCartCheckoutIcon />;
      case 'PAYMENT': return <PaymentsIcon />;
      default: return <ReceiptIcon />;
    }
  };

  const getStepColor = (type) => {
    switch (type) {
      case 'PO': return 'primary';
      case 'GRN': return 'warning';
      case 'STOCK': return 'info';
      case 'SALE': return 'error';
      case 'PAYMENT': return 'success';
      default: return 'grey';
    }
  };

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', mb: 1 }}>
          Item Journey Timeline
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Visualizing the full life cycle of a unique garment item—from PO to Final Payment.
        </Typography>
      </Box>

      {/* Item Selection */}
      <Paper sx={{ p: 4, borderRadius: 4, mb: 4, bgcolor: '#f8fafc', border: '1px dashed #cbd5e1' }}>
        <Autocomplete
          fullWidth
          value={selectedItem}
          onChange={handleSelect}
          options={items}
          getOptionLabel={(option) => `${option.item_code} | ${option.item_name}`}
          loading={loadingItems}
          renderInput={(params) => (
            <TextField 
              {...params} 
              label="Search SKU or Item Name" 
              placeholder="e.g. CAS-SH001"
              sx={{ bgcolor: '#fff', borderRadius: 2 }}
              InputProps={{
                ...params.InputProps,
                startAdornment: <TimelineOutlinedIcon sx={{ mr: 1, color: '#94a3b8' }} />,
                endAdornment: (
                  <React.Fragment>
                    {loadingItems ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </React.Fragment>
                ),
              }}
            />
          )}
        />
      </Paper>

      {/* Timeline Rendering */}
      {loadingJourney ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress />
        </Box>
      ) : journeyData ? (
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
              <Typography variant="overline" sx={{ color: '#94a3b8', fontWeight: 800 }}>Core Details</Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, mb: 2 }}>{journeyData.item.item_name}</Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>Item Code</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>{journeyData.item.item_code}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>Brand / Category</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>{journeyData.item.brand || 'N/A'} - {journeyData.item.category || 'Garment'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>Active Since</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>{new Date(journeyData.item.createdAt).toLocaleDateString()}</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
              <Timeline position="alternate">
                {journeyData.timeline.length === 0 ? (
                  <Box sx={{ textAlign: 'center', p: 4 }}>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>No activity records found for this item yet.</Typography>
                  </Box>
                ) : (
                  journeyData.timeline.map((step, idx) => (
                    <TimelineItem key={idx}>
                      <TimelineOppositeContent
                        sx={{ m: 'auto 0' }}
                        align="right"
                        variant="caption"
                        color="#94a3b8"
                      >
                        {new Date(step.date).toLocaleString()}
                      </TimelineOppositeContent>
                      <TimelineSeparator>
                        <TimelineConnector sx={{ bgcolor: `${getStepColor(step.type)}.light`, opacity: 0.2 }} />
                        <TimelineDot color={getStepColor(step.type)} sx={{ boxShadow: 0 }}>
                          {getStepIcon(step.type)}
                        </TimelineDot>
                        <TimelineConnector />
                      </TimelineSeparator>
                      <TimelineContent sx={{ py: '12px', px: 2 }}>
                        <Typography variant="subtitle2" component="span" sx={{ fontWeight: 900 }}>
                          {step.id}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>{step.detail}</Typography>
                        <Chip label={step.status} size="small" variant="outlined" color={getStepColor(step.type)} sx={{ mt: 1, height: 20, fontSize: 9, fontWeight: 800 }} />
                      </TimelineContent>
                    </TimelineItem>
                  ))
                )}
              </Timeline>
            </Paper>
          </Grid>
        </Grid>
      ) : selectedItem ? (
        <Box sx={{ textAlign: 'center', p: 8 }}>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>Trace logic completed. Waiting for server aggregation.</Typography>
        </Box>
      ) : (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4, border: '1px dashed #cbd5e1', bgcolor: 'rgba(59, 130, 246, 0.02)' }}>
          <TimelineOutlinedIcon sx={{ fontSize: 64, color: '#e2e8f0', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#94a3b8' }}>Select an item above to visualize its full system journey.</Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ItemJourneyPage;
