import { QrCodeDisplay } from '@/components/storefront/QrCodeDisplay';
import type { Table } from '@/types/table';

function buildTableUrl(table: Table) {
  const token = table.qr_code?.public_token;
  if (!token) return null;
  return `${window.location.origin}/q/${token}`;
}

type TableQrPrintCardProps = {
  storeName?: string;
  table: Table;
};

export function TableQrPrintCard({ storeName, table }: TableQrPrintCardProps) {
  const url = buildTableUrl(table);
  if (!url) return null;

  const label = table.label ?? `Table ${table.table_number}`;
  const inactive = table.qr_code?.is_active === false;

  return (
    <article className="qr-print-card" data-table-id={table.id}>
      <div className="qr-print-card-inner">
        {storeName ? <p className="qr-print-store">{storeName}</p> : null}
        <h2 className="qr-print-table">{label}</h2>
        {inactive ? <p className="qr-print-disabled">Disabled — replace before use</p> : null}
        <div className="qr-print-code">
          <QrCodeDisplay text={url} moduleSize={6} margin={4} ariaLabel={`Table QR for ${label}`} />
        </div>
        <p className="qr-print-cta">Scan to order</p>
        <p className="qr-print-hint">Open your phone camera and point it at the code</p>
        <p className="qr-print-brand">Powered by Geepay</p>
      </div>
    </article>
  );
}

export default TableQrPrintCard;
