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

// Company details — edit these to match your company
const COMPANY = {
  name: 'Mfg. & Marketed By',
  fullName: 'Rebel Mass Export Pvt. Ltd',
  address: 'Plot No 418, Sector-53, Phase3',
  city: 'Kundli, Sonipat (Haryana)',
  customerCare: 'Customer Care:',
  email: 'Email: info.dapolo@gmail.com',
};

/**
 * Prints garment price tags for purchase lines.
 * Tag format mirrors the sample physical tag:
 *   – Barcode (Code39) at top
 *   – Article / Group / Type / Design / Size / Qty / Colour / MRP
 *   – Company info footer
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

  /** Expand each line by its quantity so we get one tag per unit */
  const labelItems = useMemo(() => {
    const result = [];
    selectedLines.forEach((line) => {
      if (!line.selected) return;
      const qty = Math.max(1, Number(line.quantity) || 0);
      // Generate a clean barcode value — prefer SKU, fallback to a short code never the raw ObjectId
      const rawSku = line.sku || '';
      // Skip if sku looks like a MongoDB ObjectId (24 hex chars)
      const isObjectId = /^[a-f0-9]{24}$/i.test(rawSku.trim());
      const cleanSku = isObjectId || !rawSku ? `ITEM-${result.length + 1}` : rawSku;
      for (let i = 0; i < qty; i++) {
        result.push({
          sku: cleanSku,
          itemName: line.itemName || '',
          group: line.category || line.group || '',
          type: line.type || 'REGULAR PLAIN',
          design: line.design || line.itemName || '',
          size: line.size || '',
          colour: line.color || line.colour || '',
          mrp: line.mrp || line.rate || '',
          quantity: qty,
          key: `${line.variantId || line.sku || i}-${i}`,
        });
      }
    });
    return result;
  }, [selectedLines]);

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;

    const tagHTML = labelItems
      .map((item) => {
        // Code 39 barcode: wrap value with * and render in Libre Barcode 39 font
        const barcodeValue = `*${escapeHtml(item.sku)}*`;
        const rows = [
          ['Article', item.sku],
          ['Group', item.group],
          ['Type', item.type],
          ['DESIGN', item.design],
          ['Size', item.size],
          ['Qty', item.quantity],
          ['Colour', item.colour],
        ];

        return `
          <div class="tag">
            <!-- BARCODE FULL WIDTH -->
            <div class="barcode-wrap">
              <div class="barcode">${escapeHtml(barcodeValue)}</div>
              <div class="sku-text">${escapeHtml(item.sku)}</div>
            </div>

            <!-- FIELD ROWS -->
            <table class="fields">
              ${rows
            .map(([label, value]) => `
                  <tr>
                    <td class="label">${escapeHtml(label)} :</td>
                    <td class="value">${escapeHtml(String(value || ''))}</td>
                  </tr>`)
            .join('')}
            </table>

            <!-- MRP -->
            <div class="mrp-row">
              <span class="mrp-label">MRP :</span>
              <span class="mrp-value">&#8377;${escapeHtml(String(item.mrp || ''))}</span>
            </div>
            <div class="mrp-tax">(Incl of all taxes)</div>

            <!-- COMPANY FOOTER -->
            <div class="footer">
              <div>${escapeHtml(COMPANY.name)}</div>
              <div class="co-name">${escapeHtml(COMPANY.fullName)}</div>
              <div>${escapeHtml(COMPANY.address)}</div>
              <div>${escapeHtml(COMPANY.city)}</div>
              <div>${escapeHtml(COMPANY.customerCare)}</div>
              <div>${escapeHtml(COMPANY.email)}</div>
            </div>
          </div>`;
      })
      .join('');

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Garment Tags — ${escapeHtml(purchase?.billNumber || 'Print')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link
    href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39+Text&family=Arial&display=swap"
    rel="stylesheet"
  />
  <style>
    @page { margin: 0.2in; }

    * { box-sizing: border-box; }

    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: #fff;
    }

    .tags-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      justify-content: flex-start;
    }

    /* ── SINGLE TAG ── */
    .tag {
      width: 2.5in;
      border: 1px solid #444;
      padding: 5px 7px 5px;
      page-break-inside: avoid;
      font-size: 8pt;
      line-height: 1.25;
      background: #fff;
      overflow: hidden;
    }

    /* Barcode — FULL WIDTH, never cut off */
    .barcode-wrap {
      text-align: center;
      width: 100%;
      overflow: hidden;
      margin-bottom: 2px;
    }
    .barcode {
      font-family: 'Libre Barcode 39 Text', monospace;
      font-size: 36pt;
      line-height: 1;
      letter-spacing: -2px;
      display: block;
      width: 100%;
      white-space: nowrap;
      transform: scaleX(0.85);
      transform-origin: left center;
    }
    .sku-text {
      font-size: 7pt;
      font-weight: bold;
      letter-spacing: 0.5px;
      text-align: center;
      margin-top: -2px;
      word-break: break-all;
    }

    /* Field table */
    .fields {
      width: 100%;
      border-collapse: collapse;
      margin: 2px 0;
    }
    .fields td {
      padding: 0.3px 1px;
      vertical-align: top;
    }
    .label {
      font-weight: bold;
      white-space: nowrap;
      width: 48px;
      font-size: 8pt;
    }
    .value {
      font-size: 8pt;
      padding-left: 3px;
      font-weight: normal;
    }

    /* MRP */
    .mrp-row {
      margin-top: 2px;
      font-size: 9pt;
      font-weight: bold;
    }
    .mrp-label { margin-right: 3px; }
    .mrp-value { font-size: 13pt; }
    .mrp-tax {
      font-size: 6.5pt;
      color: #333;
      margin-top: -1px;
    }

    /* Footer */
    .footer {
      border-top: 1px dashed #888;
      margin-top: 3px;
      padding-top: 2px;
      font-size: 6.5pt;
      line-height: 1.25;
    }
    .co-name { font-weight: bold; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="tags-grid">
    ${tagHTML}
  </div>
  <script>window.onload = function () { window.print(); };<\/script>
</body>
</html>`);
    win.document.close();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Print Garment Tags</DialogTitle>
      <DialogContent dividers>
        {purchase && (
          <Typography variant="body2" sx={{ mb: 2, color: '#64748b' }}>
            Bill: {purchase.billNumber} · {purchase.billDate}
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
                key={line.variantId || line.sku || i}
                control={
                  <Checkbox
                    checked={line.selected}
                    onChange={() => handleToggleLine(i)}
                    size="small"
                  />
                }
                label={`${line.itemName || 'Item'} · ${line.size || '-'} / ${line.color || '-'} × ${line.quantity || 1} — ${line.sku || ''}`}
                sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
              />
            ))}
          </Stack>
        )}

        {labelItems.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            {labelItems.length} tag(s) will be printed.
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
          Print Tags
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default BarcodePrintDialog;
