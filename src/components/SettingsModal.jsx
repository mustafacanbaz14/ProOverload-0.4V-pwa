import React, { memo } from 'react';
import { X, Settings, Download, Upload, Smartphone, HeartPulse, Database, Dumbbell, Beef, Sun, Moon, Footprints, Layers3 } from 'lucide-react';
import { exportAppleHealthXML, exportGoogleFitJSON } from '../utils/healthSync';
import { EXPERIENCE_LEVELS } from '../utils/constants';
import { ratesForGoal } from '../utils/goals';
import { ACTIVITY_LEVELS } from '../utils/energyModel';

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
  onOpenOnboarding,
  profileGender = 'male',
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

          {/* --- GÖRÜNÜM --- */}
          <Group icon={<Sun size={12} className="text-amber-400" />} title="Görünüm">
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-zinc-200 text-[11px] font-bold block mb-2">Tema</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'dark', label: 'Karanlık', icon: Moon },
                  { key: 'light', label: 'Aydınlık', icon: Sun },
                ].map(t => {
                  const Icon = t.icon;
                  const aktif = (settings.theme || 'dark') === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => set({ theme: t.key })}
                      className={`py-2.5 rounded-lg text-[10px] font-bold uppercase border transition-colors flex items-center justify-center gap-1.5 ${aktif ? 'bg-cyan-900/30 border-cyan-600 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                    >
                      <Icon size={12} /> {t.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[9px] font-mono text-zinc-600 mt-2 leading-relaxed">
                Seçtiğin tema kaydedilir ve uygulamayı her açtığında geçerli olur.
              </p>
            </div>

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-zinc-200 text-[11px] font-bold block mb-2">Yazı Boyutu</span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { v: 0.9, l: 'Küçük' },
                  { v: 1, l: 'Normal' },
                  { v: 1.15, l: 'Büyük' },
                  { v: 1.3, l: 'En Büyük' },
                ].map(o => (
                  <button
                    key={o.v}
                    onClick={() => set({ fontScale: o.v })}
                    className={`py-2 rounded-lg text-[10px] font-bold uppercase border transition-colors ${(settings.fontScale || 1) === o.v ? 'bg-cyan-900/30 border-cyan-600 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
              <p className="text-[9px] font-mono text-zinc-600 mt-2 leading-relaxed">
                Tüm uygulamadaki yazılar bu orana göre ölçeklenir.
              </p>
            </div>

            {profileGender === 'female' && (
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <span className="text-zinc-200 text-[11px] font-bold block mb-2">Vurgu Rengi</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    // Sabit hex kullanılır: rose tema seçiliyken global cyan değişkeni
                    // pembeye döner; sınıf kullanılsa iki önizleme noktası da pembe görünürdü.
                    { key: 'cyan', label: 'Turkuaz', color: '#06b6d4' },
                    { key: 'rose', label: 'Pembe', color: '#f43f5e' },
                  ].map(option => {
                    const active = (settings.accentTheme || 'cyan') === option.key;
                    return (
                      <button key={option.key} onClick={() => set({ accentTheme: option.key })}
                        className={`py-2.5 rounded-lg text-[10px] font-bold uppercase border flex items-center justify-center gap-2 ${active ? 'border-cyan-600 text-cyan-400 bg-cyan-950/25' : 'border-zinc-800 text-zinc-500 bg-zinc-900'}`}>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: option.color }} /> {option.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[9px] font-mono text-zinc-600 mt-2">İsteğe bağlıdır; sağlık ve uyarı renklerini değiştirmez.</p>
              </div>
            )}

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-zinc-200 text-[11px] font-bold flex items-center gap-1.5 mb-1">
                <Layers3 size={12} className="text-orange-400" /> Bilgi Yoğunluğu
              </span>
              <span className="text-zinc-500 text-[10px] font-mono block mb-2 leading-snug">
                Basit görünüm günlük kararları öne çıkarır; ayrıntılar kaldırılmaz, kapalı başlar.
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'simple', label: 'Basit', hint: 'Önerilen' },
                  { key: 'detailed', label: 'Detaylı', hint: 'Her şey açık' },
                ].map(mode => {
                  const active = (settings.interfaceMode || 'simple') === mode.key;
                  return (
                    <button
                      key={mode.key}
                      type="button"
                      onClick={() => set({ interfaceMode: mode.key })}
                      className={`py-2 rounded-lg border transition-colors ${active ? 'bg-orange-950/40 border-orange-600 text-orange-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                    >
                      <span className="text-[10px] font-bold uppercase block">{mode.label}</span>
                      <span className="text-[8px] font-mono opacity-70 block">{mode.hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => { onClose(); onOpenOnboarding?.(); }}
              className="w-full p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-left active:bg-zinc-900"
            >
              <span className="text-zinc-200 text-[11px] font-bold block">Uygulama Turunu Tekrar Göster</span>
              <span className="text-zinc-500 text-[9px] font-mono block mt-0.5">Ana bölümleri ve kullanım akışını yeniden anlatır.</span>
            </button>
          </Group>

          {/* --- VÜCUT & HESAPLAMA --- */}
          <Group icon={<Beef size={12} className="text-cyan-400" />} title="Vücut & Hesaplama">
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-zinc-200 text-[11px] font-bold block">BMI Değerlendirmesi</span>
              <span className="text-zinc-500 text-[10px] font-mono block mt-0.5 mb-2 leading-snug">
                Klasik BMI kası yağdan ayırt edemez; kaslı biri fazla kilolu çıkar.
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'standard', label: 'Klasik' },
                  { key: 'athletic', label: 'Sporcu' },
                ].map(m => (
                  <button
                    key={m.key}
                    onClick={() => set({ bmiMode: m.key })}
                    className={`py-2 rounded-lg text-[10px] font-bold uppercase border transition-colors ${(settings.bmiMode || 'athletic') === m.key ? 'bg-cyan-900/30 border-cyan-600 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <p className="text-[9px] font-mono text-zinc-600 mt-2 leading-relaxed">
                {(settings.bmiMode || 'athletic') === 'athletic'
                  ? 'Yağ oranın sağlıklı bandın içindeyse yüksek BMI kas olarak yorumlanır; FFMI arttıkça üst sınırlar yukarı kaydırılır.'
                  : 'Dünya Sağlık Örgütü aralıkları (18.5 / 25 / 30) olduğu gibi kullanılır.'}
              </p>
            </div>

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-zinc-200 text-[11px] font-bold block">Günlük Hareket (NEAT)</span>
              <span className="text-zinc-500 text-[10px] font-mono block mt-0.5 mb-2 leading-snug">
                Antrenman dışı hareketlilik. Otomatik yöntem gerçek harcamandan
                bazal, sindirim ve ortalama antrenman payını düşerek bulur.
              </span>
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {[
                  { key: 'auto', label: 'Oto' },
                  { key: 'level', label: 'Seviye' },
                  { key: 'steps', label: 'Adım' },
                  { key: 'manual', label: 'Elle' },
                ].map(m => (
                  <button
                    key={m.key}
                    onClick={() => set({ neatMode: m.key })}
                    className={`py-2 rounded-lg text-[9px] font-bold uppercase border transition-colors ${(settings.neatMode || 'auto') === m.key ? 'bg-cyan-900/30 border-cyan-600 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {settings.neatMode === 'level' && (
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    {ACTIVITY_LEVELS.map(l => (
                      <button
                        key={l.key}
                        onClick={() => set({ activityLevel: l.key })}
                        className={`py-2 rounded-lg text-[9px] font-bold uppercase border transition-colors ${(settings.activityLevel || 'light') === l.key ? 'bg-cyan-900/30 border-cyan-600 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
                    {(ACTIVITY_LEVELS.find(l => l.key === (settings.activityLevel || 'light')) || ACTIVITY_LEVELS[1]).hint}
                  </p>
                </div>
              )}

              {settings.neatMode === 'steps' && (
                <p className="text-[9px] font-mono text-zinc-600 leading-relaxed flex items-start gap-1.5">
                  <Footprints size={11} className="text-cyan-400 shrink-0 mt-0.5" />
                  Adım sayısını Beslenme sekmesinde gün gün girersin. Yakım vücut
                  ağırlığınla ölçeklenir (yaklaşık 0.0005 kcal/adım/kg).
                </p>
              )}

              {/* Çarpan otomatik ve seviye hesabını ölçekler; kullanıcı kendi
                  gözlemine göre "bana bu az/çok geliyor" diyebilsin. */}
              {(settings.neatMode === 'auto' || settings.neatMode === 'level' || !settings.neatMode) && (
                <div className="flex items-center justify-between gap-2 pt-2 mt-1 border-t border-zinc-900">
                  <span className="text-[10px] font-mono text-zinc-500">Çarpan</span>
                  <span className="flex items-center gap-1.5">
                    {[0.8, 0.9, 1, 1.1, 1.25].map(v => (
                      <button
                        key={v}
                        onClick={() => set({ neatMultiplier: v })}
                        className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-colors ${(settings.neatMultiplier || 1) === v ? 'bg-cyan-900/30 border-cyan-600 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                      >
                        {v}×
                      </button>
                    ))}
                  </span>
                </div>
              )}

              {settings.neatMode === 'manual' && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-zinc-500">Günlük sabit</span>
                  <span className="flex items-center gap-1.5">
                    <input
                      type="number" inputMode="numeric" min={0} max={3000}
                      value={settings.neatManual ?? ''}
                      onChange={(e) => set({ neatManual: e.target.value })}
                      onBlur={(e) => set({ neatManual: e.target.value === '' ? '' : Math.min(3000, Math.max(0, Number(e.target.value) || 0)) })}
                      placeholder="0"
                      className="w-20 bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 text-center font-mono text-cyan-400 text-[11px] outline-none focus:border-cyan-500"
                    />
                    <span className="text-[10px] font-mono text-zinc-600">kcal</span>
                  </span>
                </div>
              )}
            </div>
          </Group>

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
