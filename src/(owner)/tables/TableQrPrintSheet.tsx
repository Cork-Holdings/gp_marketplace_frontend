import type { Table } from '@/types/table';
import { TableQrPrintCard } from './TableQrPrintCard';

type TableQrPrintSheetProps = {
  storeName?: string;
  tables: Table[];
  mode?: 'single' | 'all';
};

export function TableQrPrintSheet({ storeName, tables, mode = 'all' }: TableQrPrintSheetProps) {
  const printable = tables.filter((t) => Boolean(t.qr_code?.public_token));
  if (!printable.length) return null;

  return (
    <div
      className={`qr-print-document ${mode === 'single' ? 'qr-print-document--single' : ''}`}
      aria-hidden
    >
      <header className="qr-print-header">
        <h1 className="qr-print-title">{storeName ?? 'Table ordering'}</h1>
        <p className="qr-print-subtitle">
          {mode === 'single' ? 'Place this code on the table for guests to scan.' : 'Print and place on each table.'}
        </p>
      </header>
      <div className="qr-print-grid">
        {printable.map((table) => (
          <TableQrPrintCard key={table.id} storeName={storeName} table={table} />
        ))}
      </div>
    </div>
  );
}

export default TableQrPrintSheet;
