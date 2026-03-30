import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import LocalPrintshopOutlinedIcon from '@mui/icons-material/LocalPrintshopOutlined';
import QrCode2OutlinedIcon from '@mui/icons-material/QrCode2Outlined';
import SearchIcon from '@mui/icons-material/Search';
import ViewModuleOutlinedIcon from '@mui/icons-material/ViewModuleOutlined';
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined';
import PageHeader from '../../components/erp/PageHeader';
import FilterBar from '../../components/erp/FilterBar';
import ExportButton from '../../components/erp/ExportButton';
import StatusBadge from '../../components/erp/StatusBadge';
import SummaryCard from '../../components/erp/SummaryCard';
import barcodeExportColumns from '../../config/exportColumns/barcode';
import { barcodeSeed } from '../erp/erpUiMocks';
import itemsData from '../items/data';

const barcodeFormats = ['CODE128', 'EAN13', 'QR-LIKE'];

const variantOptions = itemsData.flatMap((item) =>
  (item.variants || []).map((variant) => ({
    id: variant.id,
    itemCode: item.code,
    itemName: item.name,
    size: variant.size,
    color: variant.color,
    sku: variant.sku,
    batchOptions: barcodeSeed
      .filter((row) => row.itemCode === item.code && row.size === variant.size)
      .map((row) => row.batchNo),
  })),
);

const toExportRows = (rows = []) =>
  rows.map((row) => ({
    barcode: row.barcode,
    item_code: row.itemCode,
    item_name: row.itemName,
    size: row.size,
    batch_no: row.batchNo,
    warehouse: row.warehouse,
    generated_on: row.generatedOn,
    print_status: row.printStatus,
  }));

function BarcodePrintingPage() {
  const [searchText, setSearchText] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState(variantOptions[0]?.id || '');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('Main Warehouse');
  const [quantityToPrint, setQuantityToPrint] = useState(12);
  const [barcodeFormat, setBarcodeFormat] = useState(barcodeFormats[0]);
  const [startingSerial, setStartingSerial] = useState(1);
  const [generatedRows, setGeneratedRows] = useState([]);
  const [viewMode, setViewMode] = useState('grid');

  const selectedVariant = useMemo(
    () => variantOptions.find((variant) => variant.id === selectedVariantId) || null,
    [selectedVariantId],
  );

  const batchOptions = useMemo(() => Array.from(new Set(selectedVariant?.batchOptions || ['DEFAULT'])), [selectedVariant]);

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return generatedRows.filter((row) => {
      if (!query) {
        return true;
      }
      return [row.barcode, row.itemCode, row.itemName, row.batchNo]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [generatedRows, searchText]);

  const generateRows = () => {
    if (!selectedVariant) {
      return;
    }

    const rows = Array.from({ length: Number(quantityToPrint || 0) }).map((_, index) => {
      const serial = Number(startingSerial || 1) + index;
      const barcode = `${selectedVariant.itemCode}-${selectedVariant.size}-${String(serial).padStart(4, '0')}`;
      const isDuplicate = barcodeSeed.some((row) => row.barcode === barcode);
      return {
        id: `generated-${serial}`,
        srNo: index + 1,
        barcode,
        itemCode: selectedVariant.itemCode,
        itemName: selectedVariant.itemName,
        size: selectedVariant.size,
        batchNo: selectedBatch || batchOptions[0] || 'DEFAULT',
        warehouse: selectedWarehouse,
        generatedOn: new Date().toLocaleString(),
        printStatus: isDuplicate ? 'Duplicate' : 'Queued',
        isDuplicate,
      };
    });
    setGeneratedRows(rows);
  };

  const handlePrint = () => {
    if (!filteredRows.length) {
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) {
      return;
    }

    const cards = filteredRows
      .map(
        (row) => `
          <div style="width:260px;border:1px solid #cbd5e1;border-radius:12px;padding:12px;margin:10px;display:inline-block;font-family:Arial,sans-serif;vertical-align:top;">
            <div style="font-size:12px;color:#64748b;margin-bottom:4px;">${row.itemCode} | ${row.size}</div>
            <div style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:8px;">${row.itemName}</div>
            <div style="font-family:monospace;font-size:24px;letter-spacing:2px;margin:10px 0;">||||||||||||||||</div>
            <div style="font-family:monospace;font-weight:700;font-size:14px;">${row.barcode}</div>
            <div style="font-size:12px;color:#475569;margin-top:8px;">Batch: ${row.batchNo}</div>
            <div style="font-size:12px;color:#475569;">Warehouse: ${row.warehouse}</div>
          </div>
        `,
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head><title>Barcode Labels</title></head>
        <body style="padding:20px;font-family:Arial,sans-serif;">${cards}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const exportRows = useMemo(() => toExportRows(filteredRows), [filteredRows]);
  const duplicateCount = filteredRows.filter((row) => row.isDuplicate).length;

  return (
    <Box>
      <PageHeader
        title="Barcode Print"
        subtitle="Generate batch-wise garment label previews with item, size, warehouse, serial, duplicate check, and print-ready frontend controls."
        breadcrumbs={[
          { label: 'Setup' },
          { label: 'Barcode Print', active: true },
        ]}
        actions={[
          <Button key="generate" variant="contained" startIcon={<QrCode2OutlinedIcon />} onClick={generateRows}>
            Generate
          </Button>,
          <Button key="print" variant="outlined" startIcon={<LocalPrintshopOutlinedIcon />} onClick={handlePrint} disabled={!filteredRows.length}>
            Print
          </Button>,
          <ExportButton key="export" rows={exportRows} columns={barcodeExportColumns} filename="barcode-preview.xlsx" sheetName="Barcode Preview" />,
        ]}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
        <SummaryCard label="Preview Rows" value={filteredRows.length} helper="Rows currently available for print/export preview." />
        <SummaryCard label="Unique Codes" value={filteredRows.length - duplicateCount} helper="Freshly generated unique barcode values." tone="success" />
        <SummaryCard label="Duplicate Alerts" value={duplicateCount} helper="Rows matching an existing barcode batch." tone="warning" />
        <SummaryCard label="Format" value={barcodeFormat} helper="Selected frontend barcode format template." tone="info" />
      </Box>

      <FilterBar sx={{ mb: 2 }}>
        <TextField
          size="small"
          select
          label="Item / Size"
          value={selectedVariantId}
          onChange={(event) => setSelectedVariantId(event.target.value)}
          sx={{ minWidth: 260 }}
        >
          {variantOptions.map((option) => (
            <MenuItem key={option.id} value={option.id}>
              {`${option.itemCode} | ${option.itemName} | ${option.size} | ${option.color}`}
            </MenuItem>
          ))}
        </TextField>
        <TextField size="small" select label="GRN Batch" value={selectedBatch} onChange={(event) => setSelectedBatch(event.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="">Auto Batch</MenuItem>
          {batchOptions.map((batch) => (
            <MenuItem key={batch} value={batch}>
              {batch}
            </MenuItem>
          ))}
        </TextField>
        <TextField size="small" label="Warehouse" value={selectedWarehouse} onChange={(event) => setSelectedWarehouse(event.target.value)} sx={{ minWidth: 180 }} />
        <TextField size="small" type="number" label="Quantity to Print" value={quantityToPrint} onChange={(event) => setQuantityToPrint(Math.max(1, Number(event.target.value)))} sx={{ minWidth: 150 }} />
        <TextField size="small" select label="Barcode Format" value={barcodeFormat} onChange={(event) => setBarcodeFormat(event.target.value)} sx={{ minWidth: 150 }}>
          {barcodeFormats.map((format) => (
            <MenuItem key={format} value={format}>
              {format}
            </MenuItem>
          ))}
        </TextField>
        <TextField size="small" type="number" label="Starting Serial" value={startingSerial} onChange={(event) => setStartingSerial(Math.max(1, Number(event.target.value)))} sx={{ minWidth: 140 }} />
      </FilterBar>

      <FilterBar sx={{ mb: 2 }}>
        <TextField
          size="small"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search barcode, item, or batch"
          sx={{ flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <ToggleButtonGroup size="small" value={viewMode} exclusive onChange={(_, value) => value && setViewMode(value)}>
          <ToggleButton value="grid">
            <ViewModuleOutlinedIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton value="list">
            <ViewListOutlinedIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
        <Button variant="outlined" startIcon={<FileDownloadOutlinedIcon />} onClick={() => setGeneratedRows([])} disabled={!generatedRows.length}>
          Clear Preview
        </Button>
      </FilterBar>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2, mb: 2, bgcolor: '#eff6ff' }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1d4ed8' }}>
          {filteredRows.length ? `${filteredRows.length - duplicateCount} unique codes generated` : 'Generate barcode rows to preview labels.'}
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          Duplicate detection is based on the existing frontend barcode register.
        </Typography>
      </Paper>

      {viewMode === 'grid' ? (
        <Grid container spacing={2}>
          {filteredRows.map((row) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={row.id}>
              <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Stack spacing={1.25}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                        Sr No {row.srNo}
                      </Typography>
                      <StatusBadge value={row.printStatus} sx={{ minWidth: 74 }} />
                    </Stack>
                    <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>{row.itemName}</Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      {row.itemCode} • Size {row.size} • Batch {row.batchNo}
                    </Typography>
                    <Paper elevation={0} sx={{ borderRadius: 2, bgcolor: '#f8fafc', p: 1.5, textAlign: 'center' }}>
                      <Typography sx={{ fontFamily: 'monospace', letterSpacing: 2, fontSize: 20 }}>||||||||||||||||</Typography>
                      <Typography sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{row.barcode}</Typography>
                    </Paper>
                    {row.isDuplicate ? <Chip size="small" color="error" variant="outlined" label="Duplicate Detected" /> : null}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {!filteredRows.length ? (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ border: '1px dashed #cbd5e1', borderRadius: 2, p: 6, textAlign: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
                  No barcode previews yet
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Choose an item and quantity, then generate a preview batch.
                </Typography>
              </Paper>
            </Grid>
          ) : null}
        </Grid>
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Sr No</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Barcode</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Item Code</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Batch No</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Print Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.srNo}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{row.barcode}</TableCell>
                    <TableCell>{row.itemCode}</TableCell>
                    <TableCell>{row.itemName}</TableCell>
                    <TableCell>{row.size}</TableCell>
                    <TableCell>{row.batchNo}</TableCell>
                    <TableCell>
                      <StatusBadge value={row.printStatus} />
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredRows.length ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ py: 5, textAlign: 'center', color: '#64748b' }}>
                      No barcode previews available.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}

export default BarcodePrintingPage;
