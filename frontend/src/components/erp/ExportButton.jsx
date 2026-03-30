import { Button } from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import useExportData from '../../hooks/useExportData';

function ExportButton({
  rows = [],
  columns = [],
  filename = 'export.xlsx',
  sheetName = 'Sheet1',
  label = 'Export Excel',
  variant = 'outlined',
  size = 'medium',
}) {
  const { handleExport } = useExportData({ rows, columns, filename, sheetName });

  return (
    <Button
      variant={variant}
      size={size}
      startIcon={<FileDownloadOutlinedIcon />}
      onClick={handleExport}
      disabled={!rows.length}
    >
      {label}
    </Button>
  );
}

export default ExportButton;

