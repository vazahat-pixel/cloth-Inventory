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
  fullName: '',
  address: '',
  city: '',
  customerCare: 'Customer Care:',
  email: '',
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
  const [type, setType] = useState('REGULAR');
  const [design, setDesign] = useState('');
  const [qtyInfo, setQtyInfo] = useState('1N');
  const [mfgLine1, setMfgLine1] = useState('');
  const [mfgLine2, setMfgLine2] = useState('');
  const [mfgLine3, setMfgLine3] = useState('');
  const [email, setEmail] = useState('');

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

        return `
          <div class="tag">
            <!-- BARCODE FULL WIDTH -->
            <div class="barcode-wrap">
              <div class="barcode">${escapeHtml(barcodeValue)}</div>
              <div class="sku-text">${escapeHtml(item.sku)}</div>
            </div>

            <!-- FIELD ROWS -->
            <div class="field-item"><span class="label">Article :</span> <span class="value">${escapeHtml(item.sku)}</span></div>
            <div class="field-item">
              <span class="label">Group :</span> <span class="value">${escapeHtml(item.group)}</span>
              <span style="float: right; font-size: 7pt; font-weight: normal; margin-top: 1px;">0015</span>
            </div>
            <div class="field-item"><span class="label">Type :</span> <span class="value">${escapeHtml(item.type)}</span></div>
            <div class="field-item"><span class="label">DESIGN :</span> <span class="value">${escapeHtml(item.design)}</span></div>
            
            <div class="field-item" style="margin-top: 2px;"><span class="label">Size :</span> <span class="value" style="font-weight: bold; font-size: 10pt;">${escapeHtml(item.size)}</span></div>
            <div class="field-item"><span class="label">Qty :</span> <span class="value">1N ${escapeHtml(item.qtyNote || 'CASUAL')}</span></div>
            <div class="field-item"><span class="label">Colour :</span> <span class="value">${escapeHtml(item.colour)}</span></div>

            <!-- MRP -->
            <div class="mrp-box">
              <div class="mrp-row">
                <span class="mrp-label">MRP :</span>
                <span class="mrp-value">${escapeHtml(item.mrp || '0')}</span>
              </div>
              <div class="mrp-tax">(Incl of all taxes)</div>
            </div>

            <!-- COMPANY FOOTER -->
            <div class="footer">
              <div style="font-weight: bold; font-size: 7pt; margin-bottom: 2px;">MFG:</div>
              <div style="font-weight: bold;">${escapeHtml(COMPANY.name)}</div>
              <div class="co-name">${escapeHtml(COMPANY.fullName)}</div>
              <div>${escapeHtml(COMPANY.address)}</div>
              <div>${escapeHtml(COMPANY.city)}</div>
              <div style="margin-top: 2px;">${escapeHtml(COMPANY.customerCare)}</div>
              <div>${escapeHtml(COMPANY.email)}</div>
            </div>
            
            <!-- BOTTOM STRIPE -->
            <div class="bottom-stripe"></div>
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
    href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39+Text&family=Inter:wght@400;700&display=swap"
    rel="stylesheet"
  />
  <style>
    @page { margin: 0; }
    * { box-sizing: border-box; }

    body {
      font-family: 'Inter', Arial, sans-serif;
      margin: 0;
      padding: 10px;
      background: #fdfdfd;
      -webkit-print-color-adjust: exact;
    }

    .tags-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    /* ── SINGLE TAG ── */
    .tag {
      width: 2.25in;
      background: #fff;
      border: 1px solid #e0e0e0;
      padding: 8px 10px;
      page-break-inside: avoid;
      position: relative;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    /* Barcode */
    .barcode-wrap {
      text-align: center;
      margin-bottom: 15px;
    }
    .barcode {
      font-family: 'Libre Barcode 39 Text', cursive;
      font-size: 38pt;
      line-height: 1;
      display: block;
      margin-bottom: -5px;
    }
    .sku-text {
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 1px;
    }

    /* Field Items */
    .field-item {
      font-size: 8.5pt;
      line-height: 1.5;
      margin-bottom: 1px;
      text-transform: uppercase;
      clear: both;
    }
    .label {
      font-weight: 700;
      color: #000;
      display: inline-block;
      min-width: 65px;
    }
    .value {
      font-weight: 400;
      color: #000;
    }

    /* MRP Section */
    .mrp-box {
      margin: 12px 0;
      text-align: center;
    }
    .mrp-row {
      display: flex;
      justify-content: center;
      align-items: baseline;
    }
    .mrp-label {
      font-size: 10pt;
      font-weight: 700;
      margin-right: 5px;
    }
    .mrp-value {
      font-size: 16pt;
      font-weight: 800;
    }
    .mrp-tax {
      font-size: 7pt;
      color: #444;
      margin-top: -2px;
    }

    /* Footer */
    .footer {
      border-top: 1px solid #eee;
      padding-top: 8px;
      font-size: 7pt;
      line-height: 1.3;
      color: #333;
      margin-top: 5px;
    }
    .footer div { margin-bottom: 1px; }
    .footer .co-name {
      font-weight: 700;
      color: #000;
      font-size: 7.5pt;
    }

    .bottom-stripe {
      height: 4px;
      background: linear-gradient(to right, #ccc 0%, #eee 50%, #ccc 100%);
      margin: 8px -10px -8px;
      border-top: 1px solid #ddd;
    }

    @media print {
      body { padding: 0; background: none; }
      .tag { border: 1px solid #000; margin: 0; box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="tags-grid">
    ${tagHTML}
  </div>
  <script>
    window.onload = function() {
      setTimeout(() => {
        window.print();
        window.close();
      }, 500);
    };
  <\/script>
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
