import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
  Chip,
  CircularProgress,
  Stack,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import api from '../../services/api';

function PricingDrawer({ open, onClose, cartData, onApplyScheme }) {
  const [loading, setLoading] = useState(false);
  const [offers, setOffers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && cartData.items.length > 0) {
      fetchEligibleOffers();
    }
  }, [open, cartData]);

  const fetchEligibleOffers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/pricing/evaluate', {
        items: cartData.items.map(i => ({
            productId: i.variantId || i._id,
            quantity: i.quantity,
            price: i.rate,
            brand: i.brandId || i.brand?._id,
            category: i.categoryId || i.category?._id
        })),
        totalAmount: cartData.subTotal,
        storeId: cartData.storeId
      });
      setOffers(res.data.data.eligibleSchemes || []);
    } catch (e) {
        setError('Error calculating offers');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 360, p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Available Offers</Typography>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Stack>
        <Divider sx={{ mb: 2 }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress size={24} color="inherit" />
          </Box>
        ) : error ? (
            <Alert severity="error">{error}</Alert>
        ) : offers.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            No eligible offers for this cart yet.
          </Typography>
        ) : (
          <List>
            {offers.map((offer) => (
              <ListItem
                key={offer._id}
                sx={{
                  border: '1px dashed #cbd5e1',
                  borderRadius: 2,
                  mb: 2,
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  '&:hover': { bgcolor: '#f8fafc' }
                }}
              >
                <ListItemText
                  primary={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <LocalOfferIcon fontSize="small" color="primary" />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {offer.name}
                      </Typography>
                    </Stack>
                  }
                  secondary={offer.description}
                />
                <Box sx={{ mt: 1, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip label={`- ₹${offer.discount.toFixed(2)}`} color="success" size="small" sx={{ fontWeight: 800 }} />
                    <Button 
                        variant="contained" 
                        size="small" 
                        sx={{ bgcolor: '#0f172a', borderRadius: 2 }}
                        onClick={() => {
                            onApplyScheme(offer);
                            onClose();
                        }}
                    >
                        Apply
                    </Button>
                </Box>
              </ListItem>
            ))}
          </List>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            * Offers are calculated automatically based on items and current bill value.
        </Typography>
      </Box>
    </Drawer>
  );
}

export default PricingDrawer;
