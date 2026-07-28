import React, { useState, memo } from 'react';
import { X, Copy, Download, Upload, Check, Smartphone, Database } from 'lucide-react';
import { createQRDataString } from '../utils/qrCode';

const QRCodeModal = memo(({ isOpen, onClose, fullData, onImportData }) => {
  const [copied, setCopied] = useState(false);
  const [inputString, setInputString] = useState('');
  const [importStatus, setImportStatus] = useState(null);

  if (!isOpen) return null;

  const dataStr = fullData ? createQRDataString(fullData) : '';

  const handleCopy = () => {
    if (!dataStr) return;
    navigator.clipboard?.writeText(dataStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImportSubmit = () => {
    if (!inputString.trim()) return;
    try {
      const parsed = JSON.parse(inputString.trim());
      if (parsed && typeof parsed === 'object') {
        onImportData(parsed);
        setImportStatus('success');
        setTimeout(() => {
          setImportStatus(null);
          onClose();
        }, 1200);
      } else {
        setImportStatus('error');
      }
    } catch {
      setImportStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
          <div className="flex items-center space-x-2">
            <Smartphone size={18} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Hızlı Cihaz Aktarımı</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 p-1">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto hide-scrollbar text-xs">
          <div className="bg-cyan-950/20 border border-cyan-900/40 p-3 rounded-2xl">
            <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">Cihazlar Arası Aktarım</h4>
            <p className="text-[10px] text-zinc-400 leading-relaxed font-mono">
              Verilerinizi dosya indirmeden metin kodu şeklinde kopyalayıp yeni cihazınızda aşağıdaki alana yapıştırarak saniyeler içinde taşıyabilirsiniz.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">1. Bu Cihazın Aktarım Kodu</label>
            <div className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl font-mono text-[9px] text-zinc-400 break-all max-h-24 overflow-y-auto">
              {dataStr ? dataStr.substring(0, 160) + '...' : 'Veri hazırlanıyor...'}
            </div>
            <button
              onClick={handleCopy}
              className="w-full bg-cyan-950/40 border border-cyan-900/50 text-cyan-400 active:bg-cyan-900/60 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center space-x-2 uppercase tracking-wider text-[10px] transition-colors"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Kopyalandı!' : 'Aktarım Kodunu Kopyala'}</span>
            </button>
          </div>

          <div className="border-t border-zinc-800 pt-3 space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">2. Yeni Cihaza Veri Yapıştır & Yükle</label>
            <textarea
              rows="3"
              value={inputString}
              onChange={(e) => setInputString(e.target.value)}
              placeholder="Diğer cihazdan kopyaladığınız aktarım kodunu buraya yapıştırın..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 font-mono text-[9px] text-zinc-200 outline-none focus:border-cyan-600 transition-colors"
            />
            {importStatus === 'error' && (
              <p className="text-[9px] text-red-400 font-mono">Geçersiz kod biçimi. Lütfen tam kopyaladığınızdan emin olun.</p>
            )}
            {importStatus === 'success' && (
              <p className="text-[9px] text-emerald-400 font-mono">Veriler başarıyla aktarıldı!</p>
            )}
            <button
              onClick={handleImportSubmit}
              className="w-full bg-emerald-600 active:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center space-x-2 uppercase tracking-wider text-[10px] transition-colors"
            >
              <Upload size={14} />
              <span>Veriyi Aktar & Yükle</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

QRCodeModal.displayName = 'QRCodeModal';

export default QRCodeModal;
