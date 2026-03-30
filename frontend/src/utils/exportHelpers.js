import * as XLSX from 'xlsx';

const defaultFormatter = (value) => (value == null ? '' : value);

export const mapRowsForExport = (rows, columns) =>
  (rows || []).map((row) =>
    columns.reduce((accumulator, column, index) => {
      const formatter = column.formatter || defaultFormatter;
      accumulator[column.label] = formatter(row?.[column.key], row, index);
      return accumulator;
    }, {}),
  );

export function exportRowsToWorkbook({
  rows = [],
  columns = [],
  filename = 'export.xlsx',
  sheetName = 'Sheet1',
}) {
  if (!rows.length || !columns.length) {
    return false;
  }

  const worksheet = XLSX.utils.json_to_sheet(mapRowsForExport(rows, columns));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
  return true;
}

export const buildTemplateRows = (columns) => columns.map((column) => ({ key: column.key, label: column.label }));

