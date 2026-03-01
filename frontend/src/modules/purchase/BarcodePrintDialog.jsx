import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Typography,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';

/**
 * Prints barcode labels for purchase lines.
 * Each line with quantity N generates N labels.
 */
function BarcodePrintDialog({ open, onClose, purchase, lines = [], warehouseMap = {} }) {
  const printRef = useRef(null);
  const [selectedLines, setSelectedLines] = useState([]);

  useEffect(() => {
    if (open && lines.length) {
      setSelectedLines(lines.map((l) => ({ ...l, selected: true })));
    }
  }, [open, lines]);

  const handleToggleLine = (index) => {
    setSelectedLines((prev) =>
      prev.map((p, i) => (i === index ? { ...p, selected: !p.selected } : p)),
    );
  };

  const labelItems = useMemo(() => {
    const result = [];
    selectedLines.forEach((line) => {
      if (!line.selected) return;
      const qty = Math.max(1, Number(line.quantity) || 0);
      const itemName = line.itemName || 'Unknown';
      const sku = line.sku || line.variantId || '';
      const size = line.size || '';
      const color = line.color || '';
      for (let i = 0; i < qty; i++) {
        result.push({
          sku,
          itemName,
          size,
          color,
          key: `${line.variantId || line.stockId || i}-${i}`,
        });
      }
    });
    return result;
  }, [selectedLines]);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Barcodes - ${purchase?.billNumber || 'Purchase'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0.5in; }
            .labels { display: flex; flex-wrap: wrap; gap: 8px; }
            .label {
              width: 2in; height: 1in; border: 1px solid #ccc;
              padding: 4px; font-size: 10px; display: flex;
              flex-direction: column; justify-content: center;
              page-break-inside: avoid;
            }
            .label-sku { font-family: monospace; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h3 style="margin-bottom:12px">${purchase?.billNumber || 'Purchase'} - Barcode Labels</h3>
          <div class="labels">
            ${labelItems
              .map(
                (item) => `
              <div class="label">
                <span class="label-sku">${escapeHtml(item.sku)}</span>
                <span>${escapeHtml(item.itemName)}</span>
                <span>${escapeHtml([item.size, item.color].filter(Boolean).join(' / '))}</span>
              </div>
            `,
              )
              .join('')}
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 250);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Print Barcode Labels</DialogTitle>
      <DialogContent dividers>
        {purchase && (
          <Typography variant="body2" sx={{ mb: 2, color: '#64748b' }}>
            Bill: {purchase.billNumber} · {purchase.billDate} · {warehouseMap[purchase.warehouseId] || purchase.warehouseId}
          </Typography>
        )}
        {lines.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No items to print.
          </Typography>
        ) : (
          <Stack spacing={1} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Select lines to include:
            </Typography>
            {selectedLines.map((line, i) => (
              <FormControlLabel
                key={line.variantId || i}
                control={
                  <Checkbox
                    checked={line.selected}
                    onChange={() => handleToggleLine(i)}
                    size="small"
                  />
                }
                label={`${line.itemName || 'Item'} (${line.size}/${line.color}) × ${line.quantity || 1} — ${line.sku || ''}`}
                sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
              />
            ))}
          </Stack>
        )}
        <Box ref={printRef} sx={{ display: 'none' }} aria-hidden="true">
          {/* Hidden content for print - actual print uses window.open template */}
        </Box>
        {labelItems.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            {labelItems.length} label(s) will be printed.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          disabled={labelItems.length === 0}
        >
          Print Labels
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export default BarcodePrintDialog;
