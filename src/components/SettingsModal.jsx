import React, { memo } from 'react';
import { X, Settings, Download, Upload, Smartphone, HeartPulse } from 'lucide-react';
import { exportAppleHealthXML, exportGoogleFitJSON } from '../utils/healthSync';

const SettingsModal = memo(({
  isOpen,
  onClose,
  settings,
  setSettings,
  handleExportData,
  handleImportFileSelect,
  setIsQRModalOpen,
  workouts,
  nutritionHistory,
}) => {
  if (!isOpen) return null;

  const handleExportAppleHealth = () => {
    const xml = exportAppleHealthXML(workouts, nutritionHistory);
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Apple_Health_Export.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportGoogleFit = () => {
    const json = exportGoogleFitJSON(workouts, nutritionHistory);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Google_Fit_Export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
          <div className="flex items-center space-x-2">
            <Settings size={18} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Ayarlar & Veritabanı</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 p-1">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto hide-scrollbar text-xs">
          {/* Antrenman Ayarları */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-1">Antrenman & Sayaç</h4>

            <label className="flex items-center justify-between p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 cursor-pointer">
              <span className="text-zinc-300 font-mono text-[10px]">Otomatik Dinlenme Sayacı</span>
              <input
                type="checkbox"
                checked={settings.autoRestTimer}
                onChange={(e) => setSettings(s => ({ ...s, autoRestTimer: e.target.checked }))}
                className="accent-cyan-500 w-4 h-4"
              />
            </label>

            <div className="flex items-center justify-between p-2.5 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-zinc-300 font-mono text-[10px]">Varsayılan Dinlenme (sn)</span>
              <input
                type="number"
                value={settings.restSeconds}
                onChange={(e) => setSettings(s => ({ ...s, restSeconds: Number(e.target.value) }))}
                className="w-16 bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-center font-mono text-cyan-400 text-xs outline-none"
              />
            </div>

            <label className="flex items-center justify-between p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 cursor-pointer">
              <span className="text-zinc-300 font-mono text-[10px]">iOS Kilit Ekranı Kartı</span>
              <input
                type="checkbox"
                checked={settings.lockScreenActivity}
                onChange={(e) => setSettings(s => ({ ...s, lockScreenActivity: e.target.checked }))}
                className="accent-cyan-500 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 cursor-pointer">
              <span className="text-zinc-300 font-mono text-[10px]">Ekranı Açık Tut (WakeLock)</span>
              <input
                type="checkbox"
                checked={settings.keepScreenAwake}
                onChange={(e) => setSettings(s => ({ ...s, keepScreenAwake: e.target.checked }))}
                className="accent-cyan-500 w-4 h-4"
              />
            </label>
          </div>

          {/* Sağlık Uygulamaları Dışa Aktarımı */}
          <div className="space-y-2 border-t border-zinc-800 pt-3">
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center">
              <HeartPulse size={12} className="mr-1 text-red-400" /> Sağlık Uygulamaları Entegrasyonu
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportAppleHealth}
                className="bg-zinc-950 border border-zinc-800 text-zinc-300 active:bg-zinc-800 font-bold py-2.5 px-2 rounded-xl flex items-center justify-center space-x-1 uppercase tracking-wider text-[8px] transition-colors"
              >
                <Download size={11} className="text-red-400" />
                <span>Apple Health XML</span>
              </button>

              <button
                onClick={handleExportGoogleFit}
                className="bg-zinc-950 border border-zinc-800 text-zinc-300 active:bg-zinc-800 font-bold py-2.5 px-2 rounded-xl flex items-center justify-center space-x-1 uppercase tracking-wider text-[8px] transition-colors"
              >
                <Download size={11} className="text-blue-400" />
                <span>Google Fit JSON</span>
              </button>
            </div>
          </div>

          {/* Veritabanı Yönetimi */}
          <div className="space-y-2 border-t border-zinc-800 pt-3">
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Veritabanı & Aktarım</h4>

            <button
              onClick={() => {
                onClose();
                setIsQRModalOpen(true);
              }}
              className="w-full bg-cyan-950/40 border border-cyan-900/50 text-cyan-400 active:bg-cyan-900/60 font-bold py-3 px-3 rounded-xl flex items-center justify-center space-x-2 uppercase tracking-wider text-[10px] transition-colors"
            >
              <Smartphone size={14} />
              <span>QR Kod ile Hızlı Cihaz Aktarımı</span>
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleExportData}
                className="bg-zinc-950 border border-zinc-800 text-zinc-300 active:bg-zinc-800 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 uppercase tracking-wider text-[9px] transition-colors"
              >
                <Download size={13} className="text-cyan-400" />
                <span>Yedek İndir</span>
              </button>

              <label className="bg-zinc-950 border border-zinc-800 text-zinc-300 active:bg-zinc-800 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 uppercase tracking-wider text-[9px] cursor-pointer transition-colors">
                <Upload size={13} className="text-emerald-400" />
                <span>Yedek Yükle</span>
                <input type="file" accept=".json" onChange={handleImportFileSelect} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

SettingsModal.displayName = 'SettingsModal';

export default SettingsModal;
