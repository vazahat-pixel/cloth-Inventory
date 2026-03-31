import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { Box, MenuItem, Paper, TextField, Typography } from '@mui/material';
import PageHeader from '../../components/erp/PageHeader';
import FilterBar from '../../components/erp/FilterBar';
import SummaryCard from '../../components/erp/SummaryCard';
import TimelineView from '../../components/erp/TimelineView';
import { buildSizeLabelLookup, resolveSizeLabel } from '../../common/sizeDisplay';
import { fetchMasters } from '../masters/mastersSlice';
import itemsData from '../items/data';
import { stockAuditSeed } from '../erp/erpUiMocks';

const baseVariants = itemsData.flatMap((item) =>
  (item.variants || []).map((variant) => ({
    id: variant.id,
    itemCode: item.code,
    itemName: item.name,
    size: variant.size,
    color: variant.color,
  })),
);

const sourceToEventType = {
  PURCHASE_GRN: 'PURCHASE_GRN',
  TRANSFER_OUT: 'TRANSFER_OUT',
  TRANSFER_IN: 'TRANSFER_IN',
  SALE: 'SALE',
  RETURN: 'RETURN',
  ADJUSTMENT: 'ADJUSTMENT',
};

function ItemJourneyPage() {
  const dispatch = useDispatch();
  const sizes = useSelector((state) => state.masters.sizes || []);
  const [searchParams] = useSearchParams();
  const preselectedItem = searchParams.get('item') || 'all';
  const [itemFilter, setItemFilter] = useState(preselectedItem);
  const [variantFilter, setVariantFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const sizeLabelLookup = useMemo(() => buildSizeLabelLookup(sizes), [sizes]);

  useEffect(() => {
    dispatch(fetchMasters('sizes'));
  }, [dispatch]);

  const variants = useMemo(
    () =>
      baseVariants.map((variant) => ({
        ...variant,
        variantKey: `${variant.size} / ${variant.color}`,
        variantLabel: `${resolveSizeLabel(variant.size, sizeLabelLookup)} / ${variant.color}`,
      })),
    [sizeLabelLookup],
  );
  const journeyEvents = useMemo(
    () =>
      stockAuditSeed.fullLedger.map((row, index) => ({
        id: row.id || `journey-${index + 1}`,
        itemCode: row.itemCode,
        variantKey: row.size,
        variantLabel: resolveSizeLabel(row.size, sizeLabelLookup),
        dateTime: row.date,
        eventType: sourceToEventType[row.source] || row.source,
        quantity: row.qty,
        fromLocation: row.movementType === 'OUT' ? row.warehouse : 'Supplier / External',
        toLocation: row.movementType === 'IN' ? row.warehouse : 'Customer / External',
        referenceNumber: row.referenceId,
        doneBy: row.doneBy,
        notes: `${row.source} moved ${row.qty} unit(s) for ${row.itemCode}${row.size ? ` (${resolveSizeLabel(row.size, sizeLabelLookup)})` : ''}.`,
        status: row.movementType,
      })),
    [sizeLabelLookup],
  );

  const itemOptions = useMemo(() => Array.from(new Set(variants.map((variant) => variant.itemCode))), [variants]);
  const variantOptions = useMemo(
    () => variants.filter((variant) => itemFilter === 'all' || variant.itemCode === itemFilter),
    [itemFilter],
  );

  const filteredEvents = useMemo(
    () =>
      journeyEvents.filter((event) => {
        const matchesItem = itemFilter === 'all' ? true : event.itemCode === itemFilter;
        const matchesVariant = variantFilter === 'all' ? true : event.variantKey === variantFilter;
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
            <MenuItem key={option.id} value={option.variantKey}>
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
