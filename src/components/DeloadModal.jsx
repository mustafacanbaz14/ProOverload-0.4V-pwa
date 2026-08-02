import React, { useState, memo } from 'react';
import { X, BatteryLow, Check, AlertTriangle, CalendarDays, Layers, Dumbbell } from 'lucide-react';
import { DELOAD_PRESETS, DEFAULT_DELOAD_DAYS, deloadState, deloadSets, deloadWeight } from '../utils/deload';
import { getLocalDateString } from '../utils/helpers';
import { formatDay } from '../utils/dates';

const GUN_SECENEKLERI = [4, 5, 7, 10];

/**
 * Deload planlayıcı.
 *
 * Uygulama zaten "hacmi düşür" diyordu; eksik olan bunu uygulamaktı. Burada
 * yaklaşım ve süre seçiliyor, gerisi otomatik: antrenman ekranındaki hedefler
 * ölçekleniyor ve süre dolunca deload kendiliğinden bitiyor.
 */
const DeloadModal = memo(({ isOpen, onClose, deload, onChange, suggestion }) => {
  const mevcut = deloadState(deload);
  const [preset, setPreset] = useState(deload?.preset || 'volume');
  const [days, setDays] = useState(deload?.days || DEFAULT_DELOAD_DAYS);

  if (!isOpen) return null;

  const secili = DELOAD_PRESETS.find(p => p.key === preset) || DELOAD_PRESETS[0];
  // Önizleme: 4 setlik 100 kg'lık bir hareket deload altında neye dönüşür.
  const onizleme = deloadState({ active: true, startDate: getLocalDateString(), days, preset });

  const baslat = () => {
    onChange({ active: true, startDate: getLocalDateString(), days, preset });
    onClose();
  };

  const bitir = () => {
    onChange({ active: false, startDate: '', days, preset });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[94] flex flex-col h-[100dvh] max-w-[420px] mx-auto">
      <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 shrink-0 pt-safe">
        <h3 className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
          <BatteryLow size={15} className="mr-2 text-amber-400" /> Deload
        </h3>
        <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1" aria-label="Kapat">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-3 pb-safe">

        {/* Devam eden deload */}
        {mevcut.active && (
          <div className="bg-amber-950/20 border border-amber-900/50 rounded-2xl p-4 space-y-2.5">
            <div className="flex justify-between items-baseline">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">Deload sürüyor</span>
              <span className="text-[10px] font-mono text-zinc-500">{mevcut.rangeLabel}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold text-amber-400">{mevcut.dayIndex}</span>
              <span className="text-[11px] font-mono text-zinc-500">/ {mevcut.totalDays}. gün · {mevcut.daysLeft} gün kaldı</span>
            </div>
            <div className="w-full bg-zinc-950 rounded-full h-1.5 border border-zinc-800 overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(mevcut.dayIndex / mevcut.totalDays) * 100}%` }} />
            </div>
            <p className="text-[10px] font-mono text-zinc-400 leading-relaxed">
              <strong className="text-zinc-200">{mevcut.preset.label}</strong> — {mevcut.preset.summary}.
              Antrenman ekranındaki hedefler buna göre geliyor.
            </p>
            <button
              onClick={bitir}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 active:bg-zinc-800 font-bold py-2.5 rounded-xl uppercase text-[10px] tracking-wider"
            >
              Erken bitir
            </button>
          </div>
        )}

        {/* Süresi dolmuş kayıt: hesaplarda zaten kapalı, kaydı temizlemek kalıyor */}
        {mevcut.expired && (
          <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-2xl p-3.5 space-y-2">
            <p className="text-[11px] font-mono text-emerald-200 leading-relaxed flex items-start gap-2">
              <Check size={14} className="shrink-0 mt-0.5" />
              <span>
                {mevcut.rangeLabel} deloadu tamamlandı; hedefler normale döndü.
                Sonraki haftada yükü deload öncesi seviyeden başlat, üstüne hemen ekleme.
              </span>
            </p>
            <button
              onClick={bitir}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-400 active:bg-zinc-800 font-bold py-2 rounded-xl uppercase text-[10px] tracking-wider"
            >
              Kaydı temizle
            </button>
          </div>
        )}

        {/* Neden öneriliyor */}
        {!mevcut.active && suggestion?.suggest && (
          <div className="bg-amber-950/20 border border-amber-900/40 rounded-2xl p-3.5 flex items-start gap-2.5">
            <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-amber-300 block mb-1">Deload öneriliyor</span>
              <ul className="space-y-0.5">
                {suggestion.reasons.map(r => (
                  <li key={r} className="text-[10px] font-mono text-amber-200/90 leading-relaxed">· {r}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {!mevcut.active && (
          <>
            {/* Yaklaşım */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">Yaklaşım</h4>
              {DELOAD_PRESETS.map(p => (
                <button
                  key={p.key}
                  onClick={() => setPreset(p.key)}
                  className={`w-full text-left rounded-2xl border p-3.5 transition-colors ${preset === p.key
                    ? 'border-amber-600 bg-amber-950/20'
                    : 'border-zinc-800 bg-zinc-900'}`}
                >
                  <div className="flex justify-between items-center gap-2 mb-1">
                    <span className={`text-[12px] font-bold ${preset === p.key ? 'text-amber-300' : 'text-zinc-200'}`}>
                      {p.label}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 shrink-0">{p.summary}</span>
                  </div>
                  <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">{p.detail}</p>
                </button>
              ))}
            </div>

            {/* Süre */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-2.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center">
                <CalendarDays size={12} className="mr-1.5 text-cyan-400" /> Süre
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {GUN_SECENEKLERI.map(g => (
                  <button
                    key={g}
                    onClick={() => setDays(g)}
                    className={`py-2 rounded-lg text-[11px] font-bold border transition-colors ${days === g
                      ? 'bg-cyan-900/30 border-cyan-600 text-cyan-400'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}
                  >
                    {g} gün
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">
                Bugün başlarsa {formatDay(getLocalDateString(), 'medium')} –
                {' '}{onizleme.rangeLabel.split('–').pop().trim()} arası sürer.
              </p>
            </div>

            {/* Somut önizleme: sayı görmeden karar vermek zor */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-2">
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Ne değişecek</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-center">
                  <Layers size={12} className="text-cyan-400 mx-auto mb-1" />
                  <span className="text-[11px] font-mono text-zinc-500 block">4 set →</span>
                  <span className="text-lg font-mono font-bold text-cyan-400">{deloadSets(4, onizleme)} set</span>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-center">
                  <Dumbbell size={12} className="text-emerald-400 mx-auto mb-1" />
                  <span className="text-[11px] font-mono text-zinc-500 block">100 kg →</span>
                  <span className="text-lg font-mono font-bold text-emerald-400">{deloadWeight(100, onizleme)} kg</span>
                </div>
              </div>
              <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
                Şablonların değişmiyor — yalnızca antrenman ekranındaki hedefler
                ölçekleniyor. Süre dolunca hedefler kendiliğinden normale döner.
              </p>
            </div>
          </>
        )}
      </div>

      {!mevcut.active && (
        <div className="p-3 border-t border-zinc-800 bg-zinc-950 shrink-0 pb-safe">
          <button
            onClick={baslat}
            className="w-full bg-amber-600 active:bg-amber-700 text-white font-bold py-3.5 rounded-xl uppercase text-[11px] tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            <BatteryLow size={15} /> {secili.label} · {days} gün başlat
          </button>
        </div>
      )}
    </div>
  );
});

DeloadModal.displayName = 'DeloadModal';

export default DeloadModal;
