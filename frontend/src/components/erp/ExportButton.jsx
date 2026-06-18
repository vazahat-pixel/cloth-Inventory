import { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { exportRowsToWorkbook } from '../../utils/exportHelpers';

function ExportButton({
  rows = [],
  columns = [],
  filename = 'export.xlsx',
  sheetName = 'Sheet1',
  label = 'Export Excel',
  variant = 'outlined',
  size = 'medium',
  loadRows,
}) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    let exportRows = rows;
    if (loadRows) {
      setLoading(true);
      try {
        exportRows = await loadRows();
      } catch {
        return;
      } finally {
        setLoading(false);
      }
    }
    if (!exportRows?.length) return;
    exportRowsToWorkbook({ rows: exportRows, columns, filename, sheetName });
  };

  return (
    <Button
      variant={variant}
      size={size}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <FileDownloadOutlinedIcon />}
      onClick={handleExport}
      disabled={loading || (!rows.length && !loadRows)}
    >
      {loading ? 'Preparing…' : label}
    </Button>
  );
}

export default ExportButton;

