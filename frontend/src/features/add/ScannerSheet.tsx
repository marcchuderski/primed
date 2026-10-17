import type { DecodeHintType as HintType } from '@zxing/library';
import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import { Button } from '../../components/Button/Button.tsx';
import { Sheet } from '../../components/Sheet/Sheet.tsx';
import { isValidBarcode } from '../../domain/barcode.ts';
import styles from './ScannerSheet.module.css';

/**
 * Barcode scan (3.5) with the rear camera via ZXing (iOS has no BarcodeDetector, D-069).
 * ZXing is loaded lazily; a manual input is always available (no camera, denied permission, accessibility).
 */
export function ScannerSheet({
  open,
  onDetected,
  onClose,
}: {
  open: boolean;
  onDetected: (ean: string) => void;
  onClose: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'starting' | 'scanning' | 'unavailable'>('starting');
  const [manual, setManual] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const element = video.current;
    if (!open || element === null) {
      return;
    }
    let stop: (() => void) | null = null;
    let cancelled = false;

    async function start(target: HTMLVideoElement) {
      if (!('mediaDevices' in navigator) || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        setStatus('unavailable');
        return;
      }
      try {
        const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
          import('@zxing/browser'),
          import('@zxing/library'),
        ]);
        const hints = new Map<HintType, unknown>([
          [
            DecodeHintType.POSSIBLE_FORMATS,
            [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E],
          ],
        ]);
        const reader = new BrowserMultiFormatReader(hints);
        let done = false;
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: 'environment' } }, audio: false },
          target,
          (result) => {
            const text = result?.getText();
            if (!done && text !== undefined && isValidBarcode(text)) {
              done = true;
              stop?.();
              onDetected(text);
            }
          },
        );
        stop = () => {
          controls.stop();
        };
        if (cancelled) {
          controls.stop();
          return;
        }
        setStatus('scanning');
      } catch {
        if (!cancelled) {
          setStatus('unavailable');
        }
      }
    }

    void start(element);
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [open, onDetected]);

  function submitManual(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = manual.trim();
    if (!isValidBarcode(code)) {
      setError('Dieser Barcode ist ungültig. Bitte prüfe die Ziffern.');
      return;
    }
    onDetected(code);
  }

  return (
    <Sheet open={open} title="Barcode scannen" onClose={onClose} tone="bg">
      <div className={styles['viewport']}>
        <video ref={video} className={styles['video']} muted playsInline aria-label="Kamerabild" />
        <span className={styles['frame']} aria-hidden="true" />
      </div>
      <p className={styles['status']} role="status">
        {status === 'starting' && 'Kamera wird gestartet …'}
        {status === 'scanning' && 'Halte den Barcode in den Rahmen.'}
        {status === 'unavailable' && 'Die Kamera ist nicht verfügbar. Du kannst den Barcode auch eintippen.'}
      </p>
      <form className={styles['manual']} onSubmit={submitManual} noValidate>
        <input
          inputMode="numeric"
          autoComplete="off"
          aria-label="Barcode eintippen"
          placeholder="Barcode eintippen"
          maxLength={14}
          value={manual}
          onChange={(e) => {
            setManual(e.target.value.replace(/\D/g, ''));
            setError(null);
          }}
        />
        <Button type="submit" variant="tonal" disabled={manual.length < 8}>
          Suchen
        </Button>
      </form>
      {error !== null && (
        <p className={styles['error']} role="alert">
          {error}
        </p>
      )}
    </Sheet>
  );
}
