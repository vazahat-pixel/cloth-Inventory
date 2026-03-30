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

  const itemOptions = useMemo(() => Array.from(new Set(variants.map((variant) => variant.itemCode))), []);
  const variantOptions = useMemo(
    () => variants.filter((variant) => itemFilter === 'all' || variant.itemCode === itemFilter),
    [itemFilter],
  );

  const filteredEvents = useMemo(
    () =>
      journeyEvents.filter((event) => {
        const matchesItem = itemFilter === 'all' ? true : event.itemCode === itemFilter;
        const matchesVariant = variantFilter === 'all' ? true : event.variantLabel === variantFilter;
        const matchesDateFrom = dateFrom ? String(event.dateTime).slice(0, 10) >= dateFrom : true;
        const matchesDateTo = dateTo ? String(event.dateTime).slice(0, 10) <= dateTo : true;
        return matchesItem && matchesVariant && matchesDateFrom && matchesDateTo;
      }),
    [dateFrom, dateTo, itemFilter, variantFilter],
  );

  return (
    <Box>
      <PageHeader
        title="Item Journey Timeline"
        subtitle="Follow purchase receipt, transfer, sale, return, and adjustment events for a garment variant across locations and references."
        breadcrumbs={[
          { label: 'Inventory' },
          { label: 'Item Journey Timeline', active: true },
        ]}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 2 }}>
        <SummaryCard label="Journey Events" value={filteredEvents.length} helper="Visible timeline steps after filters." />
        <SummaryCard label="Latest Reference" value={filteredEvents[0]?.referenceNumber || '--'} helper="Most recent event in the filtered timeline." tone="info" />
        <SummaryCard label="Selected Item" value={itemFilter === 'all' ? 'All Items' : itemFilter} helper="Filter by style and variant when drilling into stock movement." tone="success" />
      </Box>

      <FilterBar sx={{ mb: 2 }}>
        <TextField size="small" select label="Item" value={itemFilter} onChange={(event) => setItemFilter(event.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="all">All Items</MenuItem>
          {itemOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <TextField size="small" select label="Variant" value={variantFilter} onChange={(event) => setVariantFilter(event.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="all">All Variants</MenuItem>
          {variantOptions.map((option) => (
            <MenuItem key={option.id} value={option.variantLabel}>
              {option.variantLabel}
            </MenuItem>
          ))}
        </TextField>
        <TextField size="small" type="date" label="From" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField size="small" type="date" label="To" value={dateTo} onChange={(event) => setDateTo(event.target.value)} InputLabelProps={{ shrink: true }} />
      </FilterBar>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3 }}>
        {filteredEvents.length ? (
          <TimelineView items={filteredEvents} />
        ) : (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
              No journey events found
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Try changing the selected item, variant, or date range.
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default ItemJourneyPage;
