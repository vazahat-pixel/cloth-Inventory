import { useMemo } from 'react';
import { exportRowsToWorkbook, mapRowsForExport } from '../utils/exportHelpers';

function useExportData({ rows = [], columns = [], filename = 'export.xlsx', sheetName = 'Sheet1' }) {
  const previewRows = useMemo(() => mapRowsForExport(rows, columns), [columns, rows]);

  const handleExport = () =>
    exportRowsToWorkbook({
      rows,
      columns,
      filename,
      sheetName,
    });

  return {
    previewRows,
    handleExport,
  };
}

export default useExportData;

