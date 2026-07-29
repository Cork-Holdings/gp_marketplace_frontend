import { useMemo, useRef, type RefObject } from 'react';
import { generateQrMatrix, MAX_QR_TEXT_LENGTH } from '@/lib/qrCode';

export function downloadQrSvg(svgEl: SVGSVGElement | null, filename = 'qr-code.svg') {
  if (!svgEl) return;
  const blob = new Blob([svgEl.outerHTML], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type QrCodeDisplayProps = {
  text: string;
  moduleSize?: number;
  margin?: number;
  className?: string;
  ariaLabel?: string;
  svgRef?: RefObject<SVGSVGElement | null>;
};

export function QrCodeDisplay({
  text,
  moduleSize = 5,
  margin = 4,
  className = '',
  ariaLabel = 'QR code',
  svgRef,
}: QrCodeDisplayProps) {
  const localRef = useRef<SVGSVGElement | null>(null);
  const ref = svgRef ?? localRef;

  const { matrix, dim, overflow } = useMemo(() => {
    if (!text) return { matrix: null as number[][] | null, dim: 0, overflow: false };
    if (new TextEncoder().encode(text).length > MAX_QR_TEXT_LENGTH) {
      return { matrix: null, dim: 0, overflow: true };
    }
    try {
      const m = generateQrMatrix(text);
      if (!m.length) return { matrix: null, dim: 0, overflow: false };
      const n = m.length;
      const size = (n + margin * 2) * moduleSize;
      return { matrix: m, dim: size, overflow: false };
    } catch {
      return { matrix: null, dim: 0, overflow: true };
    }
  }, [text, moduleSize, margin]);

  if (overflow) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-cream-dark bg-cream/60 p-4 text-center ${className}`}>
        <p className="text-xs text-forest-muted">QR code too long to render. Use the link below instead.</p>
        <p className="max-w-full break-all font-mono text-[11px] text-forest">{text}</p>
      </div>
    );
  }

  if (!matrix) return null;

  const n = matrix.length;
  const rects = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (matrix[r][c] === 1) {
        rects.push(
          <rect
            key={`${r}-${c}`}
            x={(c + margin) * moduleSize}
            y={(r + margin) * moduleSize}
            width={moduleSize}
            height={moduleSize}
          />,
        );
      }
    }
  }

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${dim} ${dim}`}
      width={dim}
      height={dim}
      role="img"
      aria-label={ariaLabel}
      className={className}
    >
      <rect width="100%" height="100%" fill="#ffffff" />
      <g fill="#000000">{rects}</g>
    </svg>
  );
}
