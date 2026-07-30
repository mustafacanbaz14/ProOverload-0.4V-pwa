import React, { memo } from 'react';
import { X, Settings, Download, Upload, Smartphone, HeartPulse, Database, Dumbbell, Beef } from 'lucide-react';
import { exportAppleHealthXML, exportGoogleFitJSON } from '../utils/healthSync';
import { EXPERIENCE_LEVELS } from '../utils/constants';
import { ratesForGoal } from '../utils/goals';

const Toggle = ({ label, hint, checked, onChange }) => (
  <label className="flex items-center justify-between gap-3 p-3 bg-zinc-950 rounded-xl border border-zinc-800 cursor-pointer">
    <span className="min-w-0">
      <span className="text-zinc-200 text-[11px] font-bold block">{label}</span>
      {hint && <span className="text-zinc-500 text-[10px] font-mono block mt-0.5 leading-snug">{hint}</span>}
    </span>
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); onChange(!checked); }}
      className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${checked ? 'bg-cyan-600' : 'bg-zinc-700'}`}
    >
      {/* Hata: `left` hiç yazılmadığı için nokta statik konumundan başlıyordu.
          Buton ortalı olduğundan bu ~22px'e denk geliyor, üstüne binen translate
          de noktayı rayın dışına taşırıyordu; kapalıyken de sola inmiyordu.
          Konum artık doğrudan `left` ile veriliyor:
          ray 44px − nokta 16px − 4px boşluk = kapalı 4px, açık 24px. */}
      <span
        style={{ left: checked ? 24 : 4 }}
        className="w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-200"
      />
    </button>
  </label>
);

const Group = ({ icon, title, children }) => (
  <div className="space-y-2.5">
    <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center border-b border-zinc-800 pb-1.5">
      <span className="mr-1.5 flex items-center">{icon}</span>{title}
    </h4>
    {children}
  </div>
);

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
  lastBackupDate,
}) => {
  if (!isOpen) return null;

  const set = (patch) => setSettings(s => ({ ...s, ...patch }));

  // Hız seçenekleri döneme bağlı; koruma döneminde hız kavramı yok.
  const paceOptions = ratesForGoal(settings.nutritionGoal);
  const activePace = paceOptions.find(r => r.key === settings.paceRate)
    || paceOptions.find(r => r.default)
    || null;

  const downloadBlob = (content, type, filename) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[88dvh]">

        <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 shrink-0">
          <h3 className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
            <Settings size={16} className="mr-2 text-cyan-400" /> Ayarlar
          </h3>
          <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1" aria-label="Kapat">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-5">

          {/* Veri yedekleme en üstte: veri yalnızca bu cihazda tutuluyor. */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center">
                <Database size={13} className="mr-1.5" /> Veri Yedekleme
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                {lastBackupDate ? `Son: ${lastBackupDate}` : 'Hiç alınmadı'}
              </span>
            </div>
            <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">
              Veriler yalnızca bu cihazda tutulur. Telefon değiştirmeden veya tarayıcıyı
              sıfırlamadan önce mutlaka indir.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportData}
                className="bg-zinc-900 border border-zinc-700 text-cyan-400 active:bg-zinc-800 font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 uppercase tracking-wider text-[11px] transition-colors"
              >
                <Download size={14} /> Yedek İndir
              </button>
              <label className="bg-zinc-900 border border-zinc-700 text-orange-400 active:bg-zinc-800 font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 uppercase tracking-wider text-[11px] cursor-pointer transition-colors">
                <Upload size={14} /> Yedek Yükle
                <input type="file" accept=".json,application/json" onChange={handleImportFileSelect} className="hidden" />
              </label>
            </div>
            <button
              onClick={() => { onClose(); setIsQRModalOpen(true); }}
              className="w-full bg-cyan-950/40 border border-cyan-900/50 text-cyan-400 active:bg-cyan-900/60 font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider text-[11px] transition-colors"
            >
              <Smartphone size={14} /> Metin ile Cihaz Aktarımı
            </button>
          </div>

          {/* --- ANTRENMAN --- */}
          <Group icon={<Dumbbell size={12} className="text-cyan-400" />} title="Antrenman">
            <Toggle
              label="Son Seti Kopyala"
              hint="Yeni set eklerken önceki setin değerlerini klonlar."
              checked={settings.autoCopyLastSet}
              onChange={(v) => set({ autoCopyLastSet: v })}
            />
            <Toggle
              label="Dinlenmeyi Otomatik Başlat"
              hint="Bir sete tekrar girdiğinde sayaç kendiliğinden başlar."
              checked={settings.autoRestTimer}
              onChange={(v) => set({ autoRestTimer: v })}
            />
            <Toggle
              label="Bitişte Sesli Uyarı"
              hint="Dinlenme bitince çift bip çalar."
              checked={settings.restAlert}
              onChange={(v) => set({ restAlert: v })}
            />

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-zinc-200 text-[11px] font-bold block mb-2">Varsayılan Dinlenme</span>
              <div className="grid grid-cols-4 gap-2">
                {[60, 90, 120, 180].map(sec => (
                  <button
                    key={sec}
                    onClick={() => set({ restSeconds: sec })}
                    className={`py-2 rounded-lg text-[11px] font-bold border transition-colors ${settings.restSeconds === sec ? 'bg-cyan-900/30 border-cyan-600 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-zinc-200 text-[11px] font-bold block">Hedef Tekrar Aralığı</span>
              <span className="text-zinc-500 text-[10px] font-mono block mt-0.5 mb-2 leading-snug">
                Üst sınıra ulaşınca ağırlık artar, alt sınıra dönülür.
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="number" inputMode="numeric" value={settings.repRangeMin}
                  onChange={(e) => set({ repRangeMin: Math.max(1, Number(e.target.value) || 1) })}
                  className="flex-1 min-w-0 bg-zinc-900 border border-zinc-800 rounded-lg py-2 text-center font-mono text-cyan-400 text-xs outline-none"
                />
                <span className="text-zinc-600">—</span>
                <input
                  type="number" inputMode="numeric" value={settings.repRangeMax}
                  onChange={(e) => set({ repRangeMax: Math.max(1, Number(e.target.value) || 1) })}
                  className="flex-1 min-w-0 bg-zinc-900 border border-zinc-800 rounded-lg py-2 text-center font-mono text-cyan-400 text-xs outline-none"
                />
              </div>
            </div>

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-zinc-200 text-[11px] font-bold block">Antrenman Deneyimi</span>
              <span className="text-zinc-500 text-[10px] font-mono block mt-0.5 mb-2 leading-snug">
                Haftalık hacim hedeflerini (MEV / MAV / MRV) ölçekler.
              </span>
              <div className="grid grid-cols-3 gap-2">
                {EXPERIENCE_LEVELS.map(l => (
                  <button
                    key={l.key}
                    onClick={() => set({ experienceLevel: l.key })}
                    className={`py-2 rounded-lg text-[10px] font-bold uppercase border transition-colors ${settings.experienceLevel === l.key ? 'bg-cyan-900/30 border-cyan-600 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <p className="text-[9px] font-mono text-zinc-600 mt-2 leading-relaxed">
                {(EXPERIENCE_LEVELS.find(l => l.key === settings.experienceLevel) || EXPERIENCE_LEVELS[1]).hint}
              </p>
              <p className="text-[9px] font-mono text-zinc-600 mt-1.5 leading-relaxed border-t border-zinc-900 pt-1.5">
                Emin değilsen <strong className="text-zinc-400">Orta</strong> seç: referans değerler bu
                seviyeye göre belirlendi ve çoğu kişi için en güvenli başlangıç.
                Seviye ne olursa olsun hedef, MEV ile MAV arasında kalıp haftadan haftaya
                hacmi yavaşça artırmak.
              </p>
            </div>
          </Group>

          {/* --- BESLENME --- */}
          <Group icon={<Beef size={12} className="text-orange-400" />} title="Beslenme Hedefleri">
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-zinc-200 text-[11px] font-bold block mb-2">Dönem Hedefi</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'bulk', label: 'Büyüme' },
                  { key: 'maintenance', label: 'Koruma' },
                  { key: 'cut', label: 'Yağ Yakım' },
                ].map(g => (
                  <button
                    key={g.key}
                    onClick={() => set({ nutritionGoal: g.key })}
                    className={`py-2 rounded-lg text-[10px] font-bold uppercase border transition-colors ${settings.nutritionGoal === g.key ? 'bg-orange-900/30 border-orange-600 text-orange-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Hız seçimi yalnızca kesme/büyüme dönemlerinde anlamlı. */}
            {paceOptions.length > 0 && (
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <span className="text-zinc-200 text-[11px] font-bold block">
                  Haftalık {settings.nutritionGoal === 'cut' ? 'Kayıp' : 'Alım'} Hızı
                </span>
                <span className="text-zinc-500 text-[10px] font-mono block mt-0.5 mb-2 leading-snug">
                  Vücut ağırlığının yüzdesi olarak. Mutlak kg yerine yüzde kullanılır;
                  haftada 0.5 kg 60 kiloda agresif, 110 kiloda yavaştır.
                </span>
                <div className={`grid gap-2 ${paceOptions.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
                  {paceOptions.map(r => {
                    const active = (settings.paceRate || activePace?.key) === r.key;
                    return (
                      <button
                        key={r.key}
                        onClick={() => set({ paceRate: r.key })}
                        className={`py-2 rounded-lg text-[10px] font-bold uppercase border transition-colors ${active ? 'bg-orange-900/30 border-orange-600 text-orange-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                      >
                        {r.label}
                        <span className="block text-[8px] font-mono normal-case tracking-normal opacity-70">
                          %{r.weeklyPct}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {activePace && (
                  <p className="text-[9px] font-mono text-zinc-600 mt-2 leading-relaxed">{activePace.hint}</p>
                )}
                <p className="text-[9px] font-mono text-zinc-600 mt-1.5 leading-relaxed border-t border-zinc-900 pt-1.5">
                  Seçtiğin hız, yağ oranına göre belirlenen güvenli sınırı aşamaz —
                  aşarsa otomatik kırpılır ve analiz ekranında bunu görürsün.
                </p>
              </div>
            )}

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-zinc-200 text-[11px] font-bold block">Protein Çarpanı</span>
              <span className="text-zinc-500 text-[10px] font-mono block mt-0.5 mb-2 leading-snug">
                Yağsız kütle (kg) başına gram. Kalori açığında ihtiyaç artar.
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'proteinPerFfmBulk', label: 'Büyüme' },
                  { key: 'proteinPerFfmCut', label: 'Yağ Yakım' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[10px] font-mono text-zinc-500 block mb-1">{f.label}</label>
                    <input
                      type="number" inputMode="decimal" step="0.1"
                      value={settings[f.key]}
                      onChange={(e) => set({ [f.key]: Number(e.target.value) || 0 })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 text-center font-mono text-orange-400 text-xs outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </Group>

          {/* --- CİHAZ --- */}
          <Group icon={<Smartphone size={12} className="text-emerald-400" />} title="Cihaz">
            <Toggle
              label="Kilit Ekranı Kartı"
              hint="Ekran kapalıyken süre, hareket ve dinlenme kilit ekranında görünür."
              checked={settings.lockScreenActivity}
              onChange={(v) => set({ lockScreenActivity: v })}
            />
            <Toggle
              label="Ekranı Açık Tut"
              hint="Seans boyunca ekranın kapanmasını engeller."
              checked={settings.keepScreenAwake}
              onChange={(v) => set({ keepScreenAwake: v })}
            />
          </Group>

          {/* --- SAĞLIK DIŞA AKTARIM --- */}
          <Group icon={<HeartPulse size={12} className="text-red-400" />} title="Sağlık Uygulamaları">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => downloadBlob(exportAppleHealthXML(workouts, nutritionHistory), 'application/xml', 'Apple_Health_Export.xml')}
                className="bg-zinc-950 border border-zinc-800 text-zinc-300 active:bg-zinc-800 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 uppercase tracking-wider text-[10px] transition-colors"
              >
                <Download size={12} className="text-red-400" /> Apple Health
              </button>
              <button
                onClick={() => downloadBlob(exportGoogleFitJSON(workouts, nutritionHistory), 'application/json', 'Google_Fit_Export.json')}
                className="bg-zinc-950 border border-zinc-800 text-zinc-300 active:bg-zinc-800 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 uppercase tracking-wider text-[10px] transition-colors"
              >
                <Download size={12} className="text-blue-400" /> Google Fit
              </button>
            </div>
          </Group>
        </div>

        <div className="p-3 border-t border-zinc-800 bg-zinc-950 shrink-0 pb-safe">
          <button
            onClick={onClose}
            className="w-full bg-zinc-100 active:bg-white text-zinc-900 font-bold py-3 rounded-xl uppercase text-[11px] tracking-wider transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
});

SettingsModal.displayName = 'SettingsModal';

export default SettingsModal;
