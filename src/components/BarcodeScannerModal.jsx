import React, { useEffect, useRef, useState, memo } from 'react';
import { X, Barcode, Loader2, CameraOff } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { DecodeHintType, BarcodeFormat } from '@zxing/library';

// Sadece gıda ambalajlarındaki 1B formatlar taranır. Tüm formatları açık
// bırakmak hem yavaşlatıyor hem de yanlış okuma ihtimalini artırıyor.
const HINTS = new Map([
  [DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
  ]],
  [DecodeHintType.TRY_HARDER, true],
]);

/**
 * Kamera ile barkod tarayıcı.
 *
 * iOS Safari'de yerleşik `BarcodeDetector` yok, bu yüzden çözüm zxing ile
 * yapılıyor. Kamera akışı yalnızca pencere açıkken çalışır ve kapanışta
 * mutlaka durdurulur — aksi halde iOS'ta kamera ışığı açık kalır.
 */
const BarcodeScannerModal = memo(({ isOpen, onClose, onDetect }) => {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('starting'); // starting | scanning | error
  const [errorMsg, setErrorMsg] = useState('');

  // onDetect/onClose'u ref üzerinden okuruz; böylece üst bileşen her render
  // ettiğinde kamera yeniden başlatılmaz.
  const onDetectRef = useRef(onDetect);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onDetectRef.current = onDetect; }, [onDetect]);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    let controls = null;
    let cancelled = false;
    const reader = new BrowserMultiFormatReader(HINTS);

    const stop = () => {
      try { controls?.stop(); } catch { /* yoksay */ }
      controls = null;
    };

    (async () => {
      try {
        const c = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: 'environment' } } },
          videoRef.current,
          (result) => {
            if (!result || cancelled) return;
            const text = result.getText?.() || '';
            if (!/^\d{6,14}$/.test(text)) return; // gıda barkodu değil, taramaya devam
            cancelled = true;
            stop();
            onDetectRef.current?.(text);
          }
        );
        if (cancelled) { try { c.stop(); } catch { /* yoksay */ } return; }
        controls = c;
        setStatus('scanning');
      } catch (err) {
        if (cancelled) return;
        const name = err?.name || '';
        setErrorMsg(
          name === 'NotAllowedError'
            ? 'Kamera izni verilmedi. Safari > Ayarlar > Kamera bölümünden izin verip tekrar dene.'
            : name === 'NotFoundError'
              ? 'Bu cihazda kullanılabilir bir kamera bulunamadı.'
              : 'Kamera açılamadı. Barkodu elle yazabilirsin.'
        );
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      stop();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-[110] flex flex-col h-[100dvh] max-w-[420px] mx-auto">

      <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 shrink-0 pt-safe">
        <h3 className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
          <Barcode size={15} className="mr-2 text-orange-400" /> Barkod Tara
        </h3>
        <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1" aria-label="Kapat">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 relative bg-black overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
        />

        {status === 'scanning' && (
          <>
            {/* Hedef çerçevesi: barkodu buraya hizala */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[78%] h-28 border-2 border-orange-500/80 rounded-2xl shadow-[0_0_0_100vmax_rgba(0,0,0,0.45)]" />
            </div>
            <p className="absolute bottom-6 left-4 right-4 text-center text-[11px] font-mono text-zinc-300 bg-black/60 rounded-xl py-2 px-3">
              Barkodu çerçeveye hizala. Okunduğunda otomatik kapanır.
            </p>
          </>
        )}

        {status === 'starting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 gap-3">
            <Loader2 size={26} className="animate-spin text-orange-400" />
            <span className="text-[11px] font-mono">Kamera açılıyor...</span>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 gap-3">
            <CameraOff size={26} className="text-red-500" />
            <span className="text-[11px] font-mono text-zinc-300 leading-relaxed">{errorMsg}</span>
            <button
              onClick={onClose}
              className="mt-2 bg-zinc-800 active:bg-zinc-700 text-zinc-200 text-[11px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl"
            >
              Kapat
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

BarcodeScannerModal.displayName = 'BarcodeScannerModal';

export default BarcodeScannerModal;
