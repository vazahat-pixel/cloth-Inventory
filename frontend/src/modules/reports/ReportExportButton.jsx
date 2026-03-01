import { useState } from 'react';
import { Button } from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';

/**
 * Build CSV string from headers and rows.
 * @param {string[]} headers
 * @param {object[]} rows - each row is an object; keys should match header keys or use row[headerKey]
 * @param {string[]} [headerKeys] - optional order of keys for row values; defaults to headers
 */
export function buildCSV(headers, rows, headerKeys) {
  const keys = headerKeys && headerKeys.length ? headerKeys : headers;
  const escape = (v) => {
    const s = String(v ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const headerLine = headers.map(escape).join(',');
  const dataLines = rows.map((row) =>
    keys.map((k) => escape(row[k])).join(','),
  );
  return [headerLine, ...dataLines].join('\r\n');
}

/**
 * Copy table data to clipboard as CSV (Excel-pasteable).
 */
export function copyTableToClipboard(headers, rows, headerKeys) {
  const csv = buildCSV(headers, rows, headerKeys);
  return navigator.clipboard?.writeText(csv).then(() => true).catch(() => false);
}

/**
 * Trigger download of CSV file.
 */
export function downloadCSV(filename, headers, rows, headerKeys) {
  const csv = buildCSV(headers, rows, headerKeys);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'report.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function ReportExportButton({
  title = 'Export',
  headers = [],
  rows = [],
  headerKeys,
  filename = 'report.csv',
  onCopy,
  onDownload,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyTableToClipboard(headers, rows, headerKeys);
    if (ok) {
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    downloadCSV(filename, headers, rows, headerKeys);
    onDownload?.();
  };

  if (!headers.length || !rows.length) {
    return null;
  }

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        startIcon={<ContentCopyOutlinedIcon fontSize="small" />}
        onClick={handleCopy}
        sx={{ mr: 1 }}
      >
        {copied ? 'Copied!' : 'Copy to Excel'}
      </Button>
      <Button
        size="small"
        variant="outlined"
        startIcon={<FileDownloadOutlinedIcon fontSize="small" />}
        onClick={handleDownload}
      >
        Download CSV
      </Button>
    </>
  );
}

export default ReportExportButton;
