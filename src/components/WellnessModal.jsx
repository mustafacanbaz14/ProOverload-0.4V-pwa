import React, { useState, useMemo, memo } from 'react';
import { X, Moon, Brain, Plus, Trash2, Flame, CalendarDays, TrendingUp, TrendingDown } from 'lucide-react';
import {
  MIND_KINDS, findMindKind, computeSleepScore, sleepTrend,
  mindSummary, mindStreak, minutesToLabel, timeInBedMinutes, mindCalories,
} from '../utils/wellness';
import { formatDay, weekdayName } from '../utils/dates';
import { generateId, clampNumber } from '../utils/helpers';

const PENCERELER = [
  { key: 1, label: 'Bugün' },
  { key: 7, label: 'Hafta' },
  { key: 30, label: 'Ay' },
];

const alanClass = 'bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 outline-none font-mono text-[12px] focus:border-cyan-500 transition-colors w-full';

/**
 * Uyku ve zihin/esneme takibi.
 *
 * İkisi de "antrenman dışı toparlanma" başlığı altında olduğu için tek ekranda
 * duruyor: uykusu bozuk bir gün ile esneme atlanan bir hafta aynı sorunun iki
 * yüzü ve kullanıcı ikisini birlikte görmeli.
 *
 * Kayıtlar gün bazlı: her tarih için tek bir kayıt, içinde o gecenin uykusu ve
 * o günün meditasyon/esneme oturumları.
 */
const WellnessModal = memo(({
  isOpen, onClose,
  records = [],
  todayStr,
  weightKg = 0,
  onUpdateDay,
  initialTab = 'sleep',
}) => {
  const [tab, setTab] = useState(initialTab);
  const [date, setDate] = useState(todayStr);
  const [pencere, setPencere] = useState(7);

  const gun = useMemo(
    () => records.find(r => r.date === date) || null,
    [records, date]);

  // Düzen puanı için seçilen günden ÖNCEKİ geceler; sonrakiler hesaba girmez.
  const oncekiGeceler = useMemo(() => records
    .filter(r => r.date < date && r.sleep)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(r => r.sleep), [records, date]);

  const uyku = useMemo(() => gun?.sleep || {}, [gun]);
  const skor = useMemo(
    () => computeSleepScore(uyku, oncekiGeceler),
    [uyku, oncekiGeceler]);
  const trend = useMemo(() => sleepTrend(records, 14), [records]);
  const ozet = useMemo(() => mindSummary(records, pencere, todayStr), [records, pencere, todayStr]);
  const seri = useMemo(() => mindStreak(records, todayStr), [records, todayStr]);

  if (!isOpen) return null;

  const uykuGuncelle = (patch) => onUpdateDay(date, prev => ({ ...prev, sleep: { ...prev.sleep, ...patch } }));

  const zihinEkle = (kind) => onUpdateDay(date, prev => ({
    ...prev,
    mind: [...(prev.mind || []), { id: generateId(), kind, style: findMindKind(kind).styles[0], minutes: 10 }],
  }));
  const zihinGuncelle = (id, patch) => onUpdateDay(date, prev => ({
    ...prev,
    mind: (prev.mind || []).map(e => e.id === id ? { ...e, ...patch } : e),
  }));
  const zihinSil = (id) => onUpdateDay(date, prev => ({
    ...prev, mind: (prev.mind || []).filter(e => e.id !== id),
  }));

  const gunKayitlari = gun?.mind || [];
  const gunKcal = mindCalories(gunKayitlari, weightKg);

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[94] flex flex-col h-[100dvh] max-w-[420px] mx-auto">
      <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 shrink-0 pt-safe">
        <h3 className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
          <Moon size={15} className="mr-2 text-purple-400" /> Toparlanma
        </h3>
        <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1" aria-label="Kapat">
          <X size={20} />
        </button>
      </div>

      {/* Tarih + sekme */}
      <div className="p-3 space-y-2.5 border-b border-zinc-800 bg-zinc-950 shrink-0">
        <div className="flex items-center gap-2">
          <CalendarDays size={13} className="text-zinc-500 shrink-0" />
          <input
            type="date"
            value={date}
            max={todayStr}
            onChange={(e) => setDate(e.target.value || todayStr)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-1.5 text-zinc-300 font-mono text-[11px] outline-none flex-1"
          />
          <span className="text-[11px] font-mono font-bold text-cyan-500/80 shrink-0">{weekdayName(date)}</span>
        </div>

        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          {[{ k: 'sleep', l: 'Uyku' }, { k: 'mind', l: 'Meditasyon & Esneme' }].map(t => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`flex-1 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors ${tab === t.k ? 'bg-cyan-600 text-white' : 'text-zinc-500'}`}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-3 pb-safe">

        {tab === 'sleep' && (
          <>
            {/* Puan kartı */}
            {skor ? (
              <div className={`rounded-2xl border p-4 ${skor.zone.bg}`}>
                <div className="text-center mb-3">
                  <span className={`text-4xl font-mono font-bold ${skor.zone.text}`}>{skor.score}</span>
                  <span className="text-[11px] font-mono text-zinc-500 block mt-0.5">/ 100 · {skor.zone.label}</span>
                </div>
                <div className="flex justify-center gap-4 text-[10px] font-mono text-zinc-400 mb-3">
                  {skor.quick ? <span>Öznel hızlı değerlendirme</span> : <>
                    <span>Uyunan <strong className="text-zinc-100">{minutesToLabel(skor.asleep)}</strong></span>
                    <span>Yatakta <strong className="text-zinc-100">{minutesToLabel(skor.inBed)}</strong></span>
                    <span>Verim <strong className="text-zinc-100">%{skor.efficiency}</strong></span>
                  </>}
                </div>
                {/* Puanın nereden geldiği: tek sayı yerine dökümü de gösteriliyor. */}
                <div className="space-y-1.5">
                  {skor.parts.map(p => (
                    <div key={p.key} className="space-y-0.5">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-zinc-400">{p.label}</span>
                        <span className="text-zinc-300">{p.value} / {p.max}</span>
                      </div>
                      <div className="w-full bg-zinc-950 rounded-full h-1 border border-zinc-800 overflow-hidden">
                        <div className={`h-full rounded-full ${skor.zone.bar}`} style={{ width: `${(p.value / p.max) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                {skor.notes.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-zinc-800/60 space-y-1.5">
                    {skor.notes.map((n, i) => (
                      <p key={i} className="text-[10px] font-mono text-zinc-400 leading-relaxed">{n}</p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
                <Moon size={20} className="text-zinc-600 mx-auto mb-2" />
                <p className="text-[11px] font-mono text-zinc-500 leading-relaxed">
                  Yatış ve uyanış saatini gir; puan otomatik hesaplanacak.
                </p>
              </div>
            )}

            {/* Girdi */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-3">
              <div className="flex justify-between items-center gap-2">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Hızlı Puan</h4>
                <strong className="text-sm font-mono text-purple-300">{uyku.quickScore || '—'}/100</strong>
              </div>
              <input type="range" min={0} max={100} step={5} value={uyku.quickScore || 0}
                onChange={(e) => uykuGuncelle({ quickScore: Number(e.target.value) })}
                className="w-full accent-purple-500" aria-label="Genel uyku puanı" />
              <div className="grid grid-cols-5 gap-1.5">
                {[40, 55, 70, 85, 95].map(value => (
                  <button key={value} onClick={() => uykuGuncelle({ quickScore: value })}
                    className={`py-1.5 rounded-lg border text-[9px] font-mono ${Number(uyku.quickScore) === value ? 'border-purple-600 bg-purple-950/30 text-purple-300' : 'border-zinc-800 bg-zinc-950 text-zinc-600'}`}>
                    {value}
                  </button>
                ))}
              </div>
              <p className="text-[8px] font-mono text-zinc-600">Saatleri bilmiyorsan genel hissini gir. Ayrıntılı saatler doluysa onların hesabı önceliklidir.</p>
              <div className="border-t border-zinc-800 pt-3">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Ayrıntılı Uyku</h4>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 block">Yatış saati</span>
                  <input type="time" value={uyku.bedTime || ''} onChange={(e) => uykuGuncelle({ bedTime: e.target.value })} className={alanClass} />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 block">Uyanış saati</span>
                  <input type="time" value={uyku.wakeTime || ''} onChange={(e) => uykuGuncelle({ wakeTime: e.target.value })} className={alanClass} />
                </label>
              </div>

              {timeInBedMinutes(uyku.bedTime, uyku.wakeTime) > 0 && (
                <p className="text-[10px] font-mono text-zinc-500">
                  Yatakta geçen süre: <strong className="text-zinc-300">{minutesToLabel(timeInBedMinutes(uyku.bedTime, uyku.wakeTime))}</strong>
                </p>
              )}

              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'latency', label: 'Uykuya dalma', unit: 'dk', max: 240 },
                  { key: 'awakenings', label: 'Uyanma sayısı', unit: 'kez', max: 20 },
                  { key: 'awakeMinutes', label: 'Uyanık kalınan', unit: 'dk', max: 480 },
                ].map(f => (
                  <label key={f.key} className="space-y-1">
                    <span className="text-[9px] font-mono text-zinc-500 block leading-tight">{f.label} ({f.unit})</span>
                    <input
                      type="number" inputMode="numeric" min={0} max={f.max}
                      value={uyku[f.key] ?? ''}
                      onChange={(e) => uykuGuncelle({ [f.key]: e.target.value })}
                      // Sınırlama odaktan çıkışta: yazarken ara değerler tavana çarpıyor.
                      onBlur={(e) => uykuGuncelle({ [f.key]: e.target.value === '' ? '' : clampNumber(e.target.value, 0, f.max) })}
                      placeholder="0"
                      className={`${alanClass} text-center`}
                    />
                  </label>
                ))}
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-mono mb-1">
                  <span className="text-zinc-500">Uyanınca dinçlik</span>
                  <span className="text-cyan-400 font-bold">{uyku.refreshed ?? 6}/10</span>
                </div>
                <input
                  type="range" min={1} max={10} step={1}
                  value={uyku.refreshed ?? 6}
                  onChange={(e) => uykuGuncelle({ refreshed: Number(e.target.value) })}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>

            {/* Trend */}
            {trend && trend.kayitSayisi >= 2 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-2">
                <div className="flex justify-between items-baseline">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Uyku Trendi</h4>
                  <span className="text-[9px] font-mono text-zinc-600">son {trend.kayitSayisi} gece</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-mono font-bold ${trend.zone.text}`}>{trend.ortalama}</span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    ortalama · {minutesToLabel(trend.ortalamaSure)} uyku
                  </span>
                  {trend.degisim !== null && trend.degisim !== 0 && (
                    <span className={`text-[10px] font-mono font-bold flex items-center ml-auto ${trend.degisim > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {trend.degisim > 0 ? <TrendingUp size={11} className="mr-0.5" /> : <TrendingDown size={11} className="mr-0.5" />}
                      {trend.degisim > 0 ? '+' : ''}{trend.degisim}
                    </span>
                  )}
                </div>
                <div className="flex items-end gap-[3px] h-14">
                  {trend.seri.map(p => (
                    <div key={p.date} className="flex-1 bg-zinc-950 rounded-sm relative border border-zinc-800/60" title={`${formatDay(p.date)} · ${p.score}`}>
                      <div
                        className={`absolute bottom-0 left-0 right-0 rounded-sm ${p.score >= 70 ? 'bg-emerald-500' : p.score >= 55 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ height: `${Math.max(6, p.score)}%` }}
                      />
                    </div>
                  ))}
                </div>
                {trend.ortalamaSure < 400 && (
                  <p className="text-[10px] font-mono text-amber-300 leading-relaxed">
                    Ortalama uykun 6.5 saatin altında. Hacim artırmadan önce uykuyu
                    düzeltmek kas kazanımında daha büyük fark yaratır.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {tab === 'mind' && (
          <>
            {/* Dönem özeti */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="flex bg-zinc-950 border-b border-zinc-800">
                {PENCERELER.map(p => (
                  <button
                    key={p.key}
                    onClick={() => setPencere(p.key)}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${pencere === p.key ? 'text-cyan-400 bg-cyan-950/20' : 'text-zinc-500'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="p-3.5 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-lg font-mono font-bold text-zinc-100 block">{ozet.totalMinutes}</span>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">toplam dk</span>
                  </div>
                  <div>
                    <span className="text-lg font-mono font-bold text-zinc-100 block">{ozet.totalSessions}</span>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">oturum</span>
                  </div>
                  <div>
                    <span className="text-lg font-mono font-bold text-zinc-100 block">{ozet.activeDays}</span>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">aktif gün</span>
                  </div>
                </div>

                {MIND_KINDS.map(k => {
                  const v = ozet.byKind[k.key];
                  const pay = ozet.totalMinutes > 0 ? (v.minutes / ozet.totalMinutes) * 100 : 0;
                  return (
                    <div key={k.key} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className={`font-bold ${k.color}`}>{k.label}</span>
                        <span className="text-zinc-400">{v.minutes} dk · {v.sessions} oturum</span>
                      </div>
                      <div className="w-full bg-zinc-950 rounded-full h-1.5 border border-zinc-800 overflow-hidden">
                        <div className={`h-full rounded-full ${k.key === 'meditation' ? 'bg-purple-500' : 'bg-cyan-500'}`} style={{ width: `${pay}%` }} />
                      </div>
                    </div>
                  );
                })}

                <div className="flex justify-between items-center pt-2 border-t border-zinc-800 text-[10px] font-mono">
                  <span className="text-zinc-500">Kesintisiz seri</span>
                  <span className="text-emerald-400 font-bold">{seri} gün</span>
                </div>
              </div>
            </div>

            {/* O günün oturumları */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline px-1">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  {formatDay(date, 'medium')}
                </h4>
                {gunKcal > 0 && (
                  <span className="text-[10px] font-mono text-zinc-500 flex items-center">
                    <Flame size={10} className="mr-1 text-red-400" />{gunKcal} kcal
                  </span>
                )}
              </div>

              {gunKayitlari.length === 0 ? (
                <div className="text-center py-6 text-zinc-600 text-[11px] font-mono">
                  Bu güne kayıt eklenmedi.
                </div>
              ) : gunKayitlari.map(e => {
                const k = findMindKind(e.kind);
                return (
                  <div key={e.id} className={`rounded-xl border p-3 space-y-2 ${k.accent}`}>
                    <div className="flex justify-between items-center gap-2">
                      <span className={`text-[11px] font-bold ${k.color}`}>{k.label}</span>
                      <button onClick={() => zihinSil(e.id)} className="text-zinc-600 active:text-red-500 p-1 -m-1" aria-label="Sil">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={e.style || k.styles[0]}
                        onChange={(ev) => zihinGuncelle(e.id, { style: ev.target.value })}
                        className={alanClass}
                      >
                        {k.styles.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number" inputMode="numeric" min={1} max={300}
                          value={e.minutes ?? ''}
                          onChange={(ev) => zihinGuncelle(e.id, { minutes: ev.target.value })}
                          onBlur={(ev) => zihinGuncelle(e.id, { minutes: ev.target.value === '' ? '' : clampNumber(ev.target.value, 1, 300) })}
                          className={`${alanClass} text-center`}
                        />
                        <span className="text-[10px] font-mono text-zinc-500 shrink-0">dk</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="grid grid-cols-2 gap-2">
                {MIND_KINDS.map(k => (
                  <button
                    key={k.key}
                    onClick={() => zihinEkle(k.key)}
                    className={`py-3 rounded-xl border border-dashed font-bold text-[11px] uppercase tracking-wide flex items-center justify-center transition-colors active:bg-zinc-800 ${k.color} ${k.key === 'meditation' ? 'border-purple-900/50' : 'border-cyan-900/50'}`}
                  >
                    {k.key === 'meditation' ? <Brain size={14} className="mr-1.5" /> : <Plus size={14} className="mr-1.5" />}
                    {k.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[9px] font-mono text-zinc-600 leading-relaxed px-1">
              Kalori katkısı MET tabanlı ve düşük (meditasyon 1.3, esneme 2.3) —
              bunlar kalori yakmak için değil, stres ve hareket açıklığı için
              takip ediliyor. Kalori panosuna da bu değerler ekleniyor.
            </p>
          </>
        )}
      </div>
    </div>
  );
});

WellnessModal.displayName = 'WellnessModal';

export default WellnessModal;
