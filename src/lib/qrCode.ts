/**
 * QR matrix helper backed by `qrcode` (supports full URL payloads).
 * Keeps a stable sync API for SVG rendering in QrCodeDisplay.
 */
import QRCode from 'qrcode';

/** Practical upper bound for display; library supports far more. */
export const MAX_QR_TEXT_LENGTH = 1200;

export function estimateQrCapacityBytes() {
  return MAX_QR_TEXT_LENGTH;
}

export function generateQrMatrix(text: string): number[][] {
  if (!text || typeof text !== 'string') return [];

  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const modules = qr.modules;
  const size = modules.size;
  const matrix: number[][] = [];

  for (let r = 0; r < size; r++) {
    const row: number[] = new Array(size);
    for (let c = 0; c < size; c++) {
      row[c] = modules.get(r, c) ? 1 : 0;
    }
    matrix.push(row);
  }

  return matrix;
}

export default generateQrMatrix;
