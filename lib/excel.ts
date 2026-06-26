// `xlsx` is ~1MB. Import it lazily inside the export helpers so it is only
// fetched when the user actually triggers an export, instead of being bundled
// into every page that can export.

export async function downloadExcel(
  rows: Record<string, unknown>[],
  filename: string,
  sheetName = "Sheet1"
): Promise<void> {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

export async function downloadExcelMultiSheet(
  sheets: { name: string; rows: Record<string, unknown>[] }[],
  filename: string
): Promise<void> {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.json_to_sheet(sheet.rows);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  }
  XLSX.writeFile(wb, filename);
}
