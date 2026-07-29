import { useCallback, useEffect, useState } from 'react';

export type QrPrintMode = 'single' | 'all';

export function useQrPrint() {
  const [printMode, setPrintMode] = useState<QrPrintMode | null>(null);
  const [printTableId, setPrintTableId] = useState<string | null>(null);

  const clearPrint = useCallback(() => {
    setPrintMode(null);
    setPrintTableId(null);
    document.body.classList.remove('qr-printing', 'qr-print-single');
  }, []);

  const printOne = useCallback((tableId: string) => {
    setPrintMode('single');
    setPrintTableId(tableId);
    document.body.classList.add('qr-printing', 'qr-print-single');
  }, []);

  const printAll = useCallback(() => {
    setPrintMode('all');
    setPrintTableId(null);
    document.body.classList.add('qr-printing');
    document.body.classList.remove('qr-print-single');
  }, []);

  useEffect(() => {
    if (!printMode) return undefined;

    const frame = requestAnimationFrame(() => {
      window.print();
    });

    return () => cancelAnimationFrame(frame);
  }, [printMode, printTableId]);

  useEffect(() => {
    const onAfterPrint = () => clearPrint();
    window.addEventListener('afterprint', onAfterPrint);
    return () => {
      window.removeEventListener('afterprint', onAfterPrint);
      clearPrint();
    };
  }, [clearPrint]);

  return {
    printMode,
    printTableId,
    printOne,
    printAll,
    isPrinting: printMode !== null,
  };
}
