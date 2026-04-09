import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  MenuItem,
  Paper,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import PageHeader from '../../components/erp/PageHeader';
import FilterBar from '../../components/erp/FilterBar';
import ExportButton from '../../components/erp/ExportButton';
import StatusBadge from '../../components/erp/StatusBadge';
import SummaryCard from '../../components/erp/SummaryCard';
import stockAuditLedgerExportColumns from '../../config/exportColumns/stockAuditLedger';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInventoryExport, fetchMovements } from './inventorySlice';
import { fetchMasters } from '../masters/mastersSlice';

const tabDefinitions = [
  { value: 0, label: 'Location Analytics' },
  { value: 1, label: 'Batch Breakdown' },
  { value: 2, label: 'Full Audited Ledger' },
];

const ledgerExportRows = (rows = []) =>
  rows.map((row) => ({
    date: row.date,
    source: row.source,
    movement_type: row.movementType,
    item_code: row.itemCode,
    item_name: row.itemName,
    size: row.size,
    qty: row.qty,
    balance_after: row.balanceAfter,
    warehouse: row.warehouse,
    batch_no: row.batchNo,
    reference_id: row.referenceId,
    done_by: row.doneBy,
  }));

function StockAuditView({ defaultTab = 0 }) {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  const initialItem = searchParams.get('item') || 'all';
  const initialWarehouse = searchParams.get('warehouse') || 'all';

  const [itemFilter, setItemFilter] = useState(initialItem);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState(initialWarehouse);
  const [movementTypeFilter, setMovementTypeFilter] = useState('all');
  const [sourceTypeFilter, setSourceTypeFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');

  const { export: exportRows = [], movements: rawLedgerRows = [], loading } = useSelector((state) => state.inventory);
  const itemsMaster = useSelector((state) => state.items?.records || []);
  const warehousesMaster = useSelector((state) => state.masters?.warehouses || []);
  const storesMaster = useSelector((state) => state.masters?.stores || []);

  useEffect(() => {
    dispatch(fetchInventoryExport());
    dispatch(fetchMovements());
    dispatch(fetchMasters('warehouses'));
    dispatch(fetchMasters('items'));
  }, [dispatch]);

  const locationRows = exportRows.map(r => ({
    id: `${r.locationName}-${r.sku}`,
    warehouse: r.locationType,
    location: r.locationName,
    itemCode: r.sku || r.barcode,
    itemName: r.productName,
    size: r.size,
    batch: r.batch || '-',
    balance: r.quantity,
    lastMovementDate: '-'
  }));

  const batchRows = []; // Production batches not yet linked here
  const ledgerRows = rawLedgerRows.map(r => ({
    id: r.id || r._id,
    date: r.date ? new Date(r.date).toLocaleDateString() : '-',
    source: r.reference || r.source || '-',
    movementType: r.type || 'IN',
    itemCode: r.sku || r.styleCode || '-',
    itemName: r.itemName || r.productName || '-',
    size: r.size || '-',
    qty: r.qty,
    balanceAfter: r.balanceAfter || '-',
    warehouse: r.warehouseId?.name || r.warehouse || '-',
    batchNo: '-',
    referenceId: r.id || r._id,
    doneBy: r.user || r.performedBy || '-'
  }));

  const itemOptions = useMemo(
    () => Array.from(new Set([
      ...itemsMaster.map(i => i.itemCode),
      ...ledgerRows.map(r => r.itemCode)
    ])).filter(Boolean).sort(),
    [itemsMaster, ledgerRows],
  );
  const warehouseOptions = useMemo(
    () => Array.from(new Set([
      ...warehousesMaster.map(w => w.name),
      ...storesMaster.map(s => s.name),
      ...ledgerRows.map(r => r.warehouse)
    ])).filter(Boolean).sort(),
    [warehousesMaster, storesMaster, ledgerRows],
  );
  const batchOptions = useMemo(
    () => Array.from(new Set(ledgerRows.map((row) => row.batchNo).filter(Boolean))),
    [ledgerRows],
  );

  const filteredLedgerRows = useMemo(
    () =>
      ledgerRows.filter((row) => {
        const matchesItem = itemFilter === 'all' ? true : (
            String(row.itemCode).toLowerCase().includes(itemFilter.toLowerCase()) ||
            itemFilter.toLowerCase().includes(String(row.itemCode).toLowerCase().replace(/-/g, ''))
        );
        const matchesDateFrom = dateFrom ? String(row.date).slice(0, 10) >= dateFrom : true;
        const matchesDateTo = dateTo ? String(row.date).slice(0, 10) <= dateTo : true;
        const matchesWarehouse = warehouseFilter === 'all' ? true : (
            row.warehouse === warehouseFilter || 
            String(row.warehouse).toLowerCase().includes(warehouseFilter.toLowerCase())
        );
        const matchesMovementType = movementTypeFilter === 'all' ? true : row.movementType === movementTypeFilter;
        const matchesSourceType = sourceTypeFilter === 'all' ? true : row.source === sourceTypeFilter;
        const matchesBatch = batchFilter === 'all' ? true : row.batchNo === batchFilter;
        return matchesItem && matchesDateFrom && matchesDateTo && matchesWarehouse && matchesMovementType && matchesSourceType && matchesBatch;
      }),
    [batchFilter, dateFrom, dateTo, itemFilter, ledgerRows, movementTypeFilter, sourceTypeFilter, warehouseFilter],
  );

  const filteredLocationRows = useMemo(
    () =>
      locationRows.filter((row) => {
        const matchesItem = itemFilter === 'all' ? true : (
            String(row.itemCode).toLowerCase().includes(itemFilter.toLowerCase()) ||
            itemFilter.toLowerCase().replace(/-/g, '').includes(String(row.itemCode).toLowerCase().replace(/-/g, '')) ||
            String(row.itemCode).toLowerCase().replace(/-/g, '').includes(itemFilter.toLowerCase().replace(/-/g, ''))
        );
        const matchesWarehouse = warehouseFilter === 'all' ? true : (
            row.warehouse === warehouseFilter || 
            row.location === warehouseFilter ||
            String(row.location).toLowerCase().includes(warehouseFilter.toLowerCase())
        );
        const matchesBatch = batchFilter === 'all' ? true : row.batch === batchFilter;
        return matchesItem && matchesWarehouse && matchesBatch;
      }),
    [batchFilter, itemFilter, locationRows, warehouseFilter],
  );
  

  const filteredBatchRows = useMemo(
    () =>
      batchRows.filter((row) => {
        const matchesItem = itemFilter === 'all' ? true : row.itemCode === itemFilter;
        const matchesBatch = batchFilter === 'all' ? true : row.batchNo === batchFilter;
        const matchesSource = sourceTypeFilter === 'all' ? true : row.referenceType === sourceTypeFilter;
        return matchesItem && matchesBatch && matchesSource;
      }),
    [batchFilter, batchRows, itemFilter, sourceTypeFilter],
  );

  const summary = useMemo(
    () => ({
      locations: filteredLocationRows.length,
      batches: filteredBatchRows.length,
      ledgerEvents: filteredLedgerRows.length,
      lastBalance: filteredLedgerRows[filteredLedgerRows.length - 1]?.balanceAfter ?? 0,
    }),
    [filteredBatchRows, filteredLedgerRows, filteredLocationRows],
  );

  return (
    <Box>
      <PageHeader
        title="Stock Audit View"
        subtitle="Inspect warehouse balance by location, batch, and ledger with ERP-style audit filters and export-ready stock traceability."
        breadcrumbs={[
          { label: 'Inventory' },
          { label: 'Stock Audit View', active: true },
        ]}
        actions={[
          <ExportButton
            key="export"
            rows={ledgerExportRows(filteredLedgerRows)}
            columns={stockAuditLedgerExportColumns}
            filename="stock-audit-ledger.xlsx"
            sheetName="Stock Audit Ledger"
          />,
        ]}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
        <SummaryCard label="Locations" value={summary.locations} helper="Warehouse/location analytics rows." />
        <SummaryCard label="Batches" value={summary.batches} helper="Visible batch breakdown records." tone="info" />
        <SummaryCard label="Ledger Events" value={summary.ledgerEvents} helper="Filtered inventory movement lines." tone="warning" />
        <SummaryCard label="Latest Balance" value={summary.lastBalance} helper="Balance after the most recent filtered movement." tone="success" />
      </Box>

      <FilterBar sx={{ mb: 2 }}>
        <TextField size="small" select label="Item" value={itemFilter} onChange={(event) => setItemFilter(event.target.value)} sx={{ minWidth: 170 }}>
          <MenuItem value="all">All Items</MenuItem>
          {itemOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <TextField size="small" type="date" label="From" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField size="small" type="date" label="To" value={dateTo} onChange={(event) => setDateTo(event.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField size="small" select label="Warehouse" value={warehouseFilter} onChange={(event) => setWarehouseFilter(event.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="all">All Warehouses</MenuItem>
          {warehouseOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <TextField size="small" select label="Movement Type" value={movementTypeFilter} onChange={(event) => setMovementTypeFilter(event.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="all">All Types</MenuItem>
          <MenuItem value="IN">IN</MenuItem>
          <MenuItem value="OUT">OUT</MenuItem>
        </TextField>
        <TextField size="small" select label="Source Type" value={sourceTypeFilter} onChange={(event) => setSourceTypeFilter(event.target.value)} sx={{ minWidth: 170 }}>
          <MenuItem value="all">All Sources</MenuItem>
          {Array.from(new Set(ledgerRows.map((row) => row.source).concat(batchRows.map((row) => row.referenceType)))).filter(Boolean).map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <TextField size="small" select label="Batch" value={batchFilter} onChange={(event) => setBatchFilter(event.target.value)} sx={{ minWidth: 170 }}>
          <MenuItem value="all">All Batches</MenuItem>
          {batchOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      </FilterBar>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} sx={{ px: 2, pt: 1, borderBottom: '1px solid #e2e8f0' }}>
          {tabDefinitions.map((tab) => (
            <Tab key={tab.value} value={tab.value} label={tab.label} />
          ))}
        </Tabs>

        <Box sx={{ p: 2 }}>
          {activeTab === 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Warehouse</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Item Code</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Batch</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Balance</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Last Movement Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLocationRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.warehouse}</TableCell>
                      <TableCell>{row.location}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{row.itemCode}</TableCell>
                      <TableCell>{row.itemName}</TableCell>
                      <TableCell>{row.size}</TableCell>
                      <TableCell>{row.batch}</TableCell>
                      <TableCell align="right">{row.balance}</TableCell>
                      <TableCell>{row.lastMovementDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}

          {activeTab === 1 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Batch No</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Origin</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Item Code</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">In Qty</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Out Qty</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Balance</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Reference Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Reference Number</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredBatchRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell sx={{ fontWeight: 700 }}>{row.batchNo}</TableCell>
                      <TableCell>{row.origin}</TableCell>
                      <TableCell>{row.itemCode}</TableCell>
                      <TableCell>{row.itemName}</TableCell>
                      <TableCell>{row.size}</TableCell>
                      <TableCell align="right">{row.inQty}</TableCell>
                      <TableCell align="right">{row.outQty}</TableCell>
                      <TableCell align="right">{row.balance}</TableCell>
                      <TableCell>
                        <StatusBadge value={row.referenceType} sx={{ minWidth: 110 }} />
                      </TableCell>
                      <TableCell>{row.referenceNumber}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}

          {activeTab === 2 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Item Code</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Qty</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Balance After</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Warehouse</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Reference ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Done By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLedgerRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.source}</TableCell>
                      <TableCell>
                        <StatusBadge value={row.movementType} sx={{ minWidth: 72 }} />
                      </TableCell>
                      <TableCell>{row.itemCode}</TableCell>
                      <TableCell>{row.itemName}</TableCell>
                      <TableCell>{row.size}</TableCell>
                      <TableCell align="right">{row.qty}</TableCell>
                      <TableCell align="right">{row.balanceAfter}</TableCell>
                      <TableCell>{row.warehouse}</TableCell>
                      <TableCell>{row.referenceId}</TableCell>
                      <TableCell>{row.doneBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}
        </Box>
      </Paper>
    </Box>
  );
}

export default StockAuditView;
