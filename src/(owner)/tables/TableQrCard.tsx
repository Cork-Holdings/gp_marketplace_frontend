import { useRef, useState } from 'react';
import { QrCodeDisplay, downloadQrSvg } from '@/components/storefront/QrCodeDisplay';
import { ownerApi } from '@/lib/api/services';
import type { Table } from '@/types/table';
import { useConfirm } from '@/hooks/useConfirm';
import { Button } from '@/components/ui/button';

function buildTableUrl(table: Table) {
  const token = table.qr_code?.public_token;
  if (!token) return null;
  return `${window.location.origin}/q/${token}`;
}

export function TableQrCard({
  store,
  table,
  onChanged,
  onPrint,
  compact = false,
}: {
  store: any;
  table: Table;
  onChanged?: () => void;
  onPrint?: (tableId: string) => void;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const { confirm, dialog } = useConfirm();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const url = buildTableUrl(table);
  const qrId = table.qr_code?.id;
  const storeId = store?.id ?? table.store_id;
  const label = table.label ?? `Table ${table.table_number}`;

  const handleCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleGenerate = async () => {
    if (!storeId || !table.id) return;
    setBusy(true);
    try {
      await ownerApi.createQRCode(storeId, { kind: 'table', table_id: table.id });
      onChanged?.();
    } finally {
      setBusy(false);
    }
  };

  const handleRegenerate = async () => {
    if (!storeId || !qrId) return;
    const ok = await confirm({
      title: 'Regenerate this QR code?',
      description: 'Old printed codes will stop working. Guests will need the new QR to order.',
      confirmLabel: 'Regenerate',
      tone: 'danger',
      requireText: 'REGENERATE',
    });
    if (!ok) return;
    setBusy(true);
    try {
      await ownerApi.regenerateQRCode(storeId, qrId);
      onChanged?.();
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    if (!storeId || !qrId) return;
    const ok = await confirm({
      title: 'Disable this QR code?',
      description: 'Guests will not be able to order from this table until you generate a new code.',
      confirmLabel: 'Disable QR',
      tone: 'danger',
    });
    if (!ok) return;
    setBusy(true);
    try {
      await ownerApi.disableQRCode(storeId, qrId);
      onChanged?.();
    } finally {
      setBusy(false);
    }
  };

  if (!url) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-cream-dark bg-white p-4 text-center">
        {dialog}
        <p className="text-sm font-semibold text-charcoal">{label}</p>
        <p className="text-xs text-forest-muted">No QR code yet. Generate one before printing.</p>
        <Button type="button" size="sm" disabled={busy} onClick={handleGenerate}>
          {busy ? 'Generating…' : 'Generate QR'}
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-xl border border-cream-dark bg-white p-4 text-center print:break-inside-avoid ${compact ? '' : ''}`}
    >
      {dialog}
      <p className="text-sm font-semibold text-charcoal">{label}</p>
      {table.qr_code && !table.qr_code.is_active && (
        <p className="text-xs font-medium text-red-600">Disabled</p>
      )}
      <QrCodeDisplay
        text={url}
        moduleSize={compact ? 3 : 4}
        ariaLabel={`Table QR for ${label}`}
        svgRef={svgRef}
      />
      <p className="max-w-[16rem] break-all font-mono text-[10px] leading-snug text-forest-muted print:hidden">{url}</p>
      <div className="flex flex-wrap justify-center gap-2 print:hidden">
        <Button type="button" size="sm" variant="secondary" onClick={() => onPrint?.(table.id)}>
          Print
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => downloadQrSvg(svgRef.current, `${label.replace(/\s+/g, '-').toLowerCase()}-qr.svg`)}
        >
          Download
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={handleCopy}>
          {copied ? 'Copied' : 'Copy link'}
        </Button>
        {qrId && (
          <>
            <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={handleRegenerate}>
              Regenerate
            </Button>
            <Button
              type="button"
              size="sm"
              variant="danger"
              disabled={busy || table.qr_code?.is_active === false}
              onClick={handleDisable}
            >
              Disable
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default TableQrCard;
