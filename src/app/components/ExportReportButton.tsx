import { FileDown, Printer } from 'lucide-react';

interface ExportReportButtonProps {
  /** Optional: table data to export as CSV. If not provided, only print is offered. */
  data?: Record<string, unknown>[];
  /** Optional: column keys and labels for CSV export. Defaults to Object.keys(first row). */
  columns?: { key: string; label: string }[];
  /** Filename for CSV download (without extension). */
  filename?: string;
  /** Label for the button or dropdown. */
  label?: string;
  /** Compact style (icon only). */
  compact?: boolean;
  className?: string;
}

function escapeCsvCell(value: unknown): string {
  if (value == null) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function ExportReportButton({
  data,
  columns,
  filename = 'report',
  label = 'Report',
  compact = false,
  className = '',
}: ExportReportButtonProps) {
  const hasData = Array.isArray(data) && data.length > 0;

  const handleExportCsv = () => {
    if (!hasData) return;
    const cols = columns ?? Object.keys(data[0] as object).map((k) => ({ key: k, label: k }));
    const header = cols.map((c) => escapeCsvCell(c.label)).join(',');
    const rows = data.map((row) => cols.map((c) => escapeCsvCell((row as Record<string, unknown>)[c.key])).join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handlePrint = () => {
    window.print();
  };

  if (compact) {
    return (
      <div className={`relative group flex items-center ${className}`}>
        <button
          type="button"
          onClick={handlePrint}
          className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
          title="Print"
        >
          <Printer size={16} />
        </button>
        {hasData && (
          <button
            type="button"
            onClick={handleExportCsv}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white ml-1"
            title="Export CSV"
          >
            <FileDown size={16} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={handlePrint}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-r border-gray-200 dark:border-gray-600"
      >
        <Printer size={14} /> Print
      </button>
      {hasData && (
        <button
          type="button"
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <FileDown size={14} /> Export
        </button>
      )}
    </div>
  );
}
