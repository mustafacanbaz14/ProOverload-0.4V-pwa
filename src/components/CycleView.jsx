import React, { memo, useMemo, useState } from 'react';
import {
  CalendarDays, ChevronRight, Dumbbell, HeartPulse, Info, Salad, ShieldAlert,
  Sparkles, Trash2,
} from 'lucide-react';
import {
  BLEEDING_LEVELS, CYCLE_SYMPTOMS, DEFAULT_CYCLE_CONFIG, buildCycleSummary,
  emptyCycleDay,
} from '../utils/cycle';
import { clampNumber, generateId, getLocalDateString } from '../utils/helpers';
import { formatDay } from '../utils/dates';

const inputClass = 'w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-[11px] font-mono text-zinc-200 outline-none focus:border-rose-500';

const Advice = ({ icon, title, text, tone }) => (
  <div className={`rounded-2xl border p-3 ${tone}`}>
    <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
      {icon}{title}
    </h4>
    <p className="text-[9px] font-mono text-zinc-400 leading-relaxed mt-1.5">{text}</p>
  </div>
);

const CycleView = memo(({
  records = [],
  settings = {},
  setSettings,
  onUpdateDay,
  onDeleteDay,
  embedded = false,
}) => {
  const [selectedDate, setSelectedDate] = useState(getLocalDateString);
  const config = useMemo(
    () => ({ ...DEFAULT_CYCLE_CONFIG, ...(settings.cycleConfig || {}) }),
    [settings.cycleConfig],
  );
  const summary = useMemo(
    () => buildCycleSummary(records, selectedDate, config),
    [records, selectedDate, config],
  );
  const entry = summary.entry;

  const update = (patch) => onUpdateDay?.(selectedDate, current => ({
    ...emptyCycleDay(selectedDate, generateId),
    ...current,
    ...patch,
    date: selectedDate,
  }));
  const setConfig = (patch) => setSettings?.(prev => ({
    ...prev,
    cycleConfig: { ...DEFAULT_CYCLE_CONFIG, ...(prev.cycleConfig || {}), ...patch },
  }));
  const toggleSymptom = (key) => update({
    symptoms: entry.symptoms.includes(key)
      ? entry.symptoms.filter(item => item !== key)
      : [...entry.symptoms, key],
  });

  const severityTone = summary.severity === 'high'
    ? 'text-red-300 border-red-900/50 bg-red-950/25'
    : summary.severity === 'moderate'
      ? 'text-amber-300 border-amber-900/50 bg-amber-950/20'
      : 'text-emerald-300 border-emerald-900/50 bg-emerald-950/20';

  return (
    <div className={`${embedded ? 'px-4 pt-2' : 'p-4'} space-y-4 pb-28 h-full overflow-y-auto hide-scrollbar bg-black`}>
      <section className="bg-gradient-to-br from-rose-950/45 via-zinc-900 to-zinc-900 border border-rose-900/40 rounded-3xl p-4 space-y-3">
        <div className="flex justify-between items-start gap-3">
          <div>
            <span className="text-[9px] font-mono text-rose-400 uppercase tracking-[0.18em]">Döngü & Performans</span>
            <h2 className="text-base font-black text-zinc-100 mt-0.5">
              {summary.hasData ? summary.phase.label : 'İlk regl gününü kaydet'}
            </h2>
            <p className="text-[9px] font-mono text-zinc-500 mt-1">
              {summary.cycleDay ? `Döngünün ${summary.cycleDay}. günü · ort. ${summary.cycleLength} gün` : 'Faz tahmini için kanamanın başladığı günü seç.'}
            </p>
          </div>
          <span className={`text-[9px] font-bold border rounded-lg px-2 py-1 shrink-0 ${severityTone}`}>
            {summary.severity === 'high' ? 'Belirti yüksek' : summary.severity === 'moderate' ? 'Belirti orta' : summary.hasEntry ? 'Belirti düşük' : 'Kayıt bekleniyor'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-2.5">
            <span className="text-[8px] font-mono text-zinc-600 uppercase block">Sonraki regl tahmini</span>
            <strong className="text-[11px] font-mono text-rose-300 block">
              {summary.nextPeriodStart ? `${formatDay(summary.nextPeriodStart, 'short')} – ${formatDay(summary.nextPeriodEnd, 'medium')}` : '—'}
            </strong>
            {summary.daysUntilNext > 0 && <span className="text-[8px] font-mono text-zinc-600">yaklaşık {summary.daysUntilNext} gün sonra</span>}
          </div>
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-2.5">
            <span className="text-[8px] font-mono text-zinc-600 uppercase block">Tahmin niteliği</span>
            <strong className="text-[11px] font-mono text-zinc-300">
              {summary.hormonalContraception ? 'Faz sınırlı' : summary.starts.length >= 3 ? 'Kişisel ortalama' : 'Takvim tahmini'}
            </strong>
          </div>
        </div>
        {summary.nextPeriodWindow && (
          <p className="text-[9px] font-mono text-rose-200/70">
            Başlangıç penceresi: {formatDay(summary.nextPeriodWindow.earliest, 'short')} – {formatDay(summary.nextPeriodWindow.latest, 'medium')}
          </p>
        )}
        <p className="text-[9px] font-mono text-zinc-500 leading-relaxed flex gap-1.5">
          <Info size={11} className="text-rose-400 shrink-0 mt-0.5" />
          Faz bilgisi tanı veya kesin performans tahmini değildir. Tavsiyeler takvim fazından çok o gün kaydettiğin ağrı, enerji ve belirtilere dayanır.
        </p>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-center">
          <h3 className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
            <CalendarDays size={13} className="text-rose-400" /> Günlük Kayıt
          </h3>
          {records.some(record => record.date === selectedDate) && (
            <button onClick={() => onDeleteDay?.(selectedDate)} aria-label="Bu döngü kaydını sil" className="p-1 text-zinc-600 active:text-red-400"><Trash2 size={13} /></button>
          )}
        </div>
        <div className="p-4 space-y-4">
          <div>
            <input type="date" max={getLocalDateString()} value={selectedDate} onChange={event => setSelectedDate(event.target.value)} className={inputClass} />
            <span className="text-[9px] font-mono text-rose-400 block mt-1.5">{formatDay(selectedDate, 'long')}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => update({ bleeding: 'medium', pain: entry.pain || 0 })}
              className="py-2.5 rounded-xl border border-rose-800 bg-rose-950/25 text-[10px] font-bold text-rose-300">
              Bugün regl başladı
            </button>
            <button onClick={() => update({ bleeding: 'none' })}
              className="py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-[10px] font-bold text-zinc-400">
              Bugün bitti
            </button>
          </div>

          <div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">Kanama</span>
            <div className="grid grid-cols-5 gap-1.5">
              {BLEEDING_LEVELS.map(level => (
                <button key={level.key} onClick={() => update({ bleeding: level.key })} className={`py-2 rounded-xl border text-[9px] font-bold ${entry.bleeding === level.key ? 'border-rose-600 bg-rose-950/30 text-rose-300' : 'border-zinc-800 bg-zinc-950 text-zinc-500'}`}>{level.label}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
              <span className="text-[9px] font-bold text-zinc-500 uppercase block">Ağrı · {entry.pain}/10</span>
              <input type="range" min="0" max="10" value={entry.pain} onChange={event => update({ pain: Number(event.target.value) })} className="w-full accent-rose-500 mt-2" />
            </label>
            <label className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
              <span className="text-[9px] font-bold text-zinc-500 uppercase block">Enerji · {entry.energy}/10</span>
              <input type="range" min="1" max="10" value={entry.energy} onChange={event => update({ energy: Number(event.target.value) })} className="w-full accent-emerald-500 mt-2" />
            </label>
          </div>

          <div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">Belirtiler</span>
            <div className="flex flex-wrap gap-1.5">
              {CYCLE_SYMPTOMS.map(symptom => (
                <button key={symptom.key} onClick={() => toggleSymptom(symptom.key)} className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-mono ${entry.symptoms.includes(symptom.key) ? 'border-rose-700 bg-rose-950/25 text-rose-300' : 'border-zinc-800 bg-zinc-950 text-zinc-500'}`}>{symptom.label}</button>
              ))}
            </div>
          </div>

          <input value={entry.note} onChange={event => update({ note: event.target.value })} maxLength={240} placeholder="Not: ilaç, antrenman hissi, olağandışı durum…" className={inputClass} />
          <p className="text-[8px] font-mono text-zinc-600">Değişiklikler otomatik olarak yalnızca bu cihazda kaydedilir.</p>
        </div>
      </section>

      <div className="space-y-2">
        <Advice icon={<Dumbbell size={12} className="text-cyan-400" />} title="Antrenman" text={summary.advice.training} tone="border-cyan-900/35 bg-cyan-950/15" />
        <Advice icon={<HeartPulse size={12} className="text-red-400" />} title="Kardiyo" text={summary.advice.cardio} tone="border-red-900/35 bg-red-950/15" />
        <Advice icon={<Salad size={12} className="text-emerald-400" />} title="Beslenme" text={summary.advice.nutrition} tone="border-emerald-900/35 bg-emerald-950/15" />
      </div>

      {summary.futurePeriods.length > 0 && (
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <h3 className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider mb-2">Önümüzdeki 3 Tahmin</h3>
          <div className="space-y-1.5">
            {summary.futurePeriods.map((period, index) => (
              <div key={period.start} className="flex justify-between text-[9px] font-mono bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2">
                <span className="text-zinc-600">{index + 1}. dönem</span>
                <strong className="text-rose-300">{formatDay(period.start, 'short')} – {formatDay(period.end, 'medium')}</strong>
              </div>
            ))}
          </div>
          <p className="text-[8px] font-mono text-zinc-600 mt-2">Tahmindir; gerçek başlangıcı kaydettikçe kişisel ortalama güncellenir.</p>
        </section>
      )}

      {summary.warning && (
        <div className="bg-red-950/25 border border-red-900/50 rounded-2xl p-3 flex gap-2">
          <ShieldAlert size={14} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-[9px] font-mono text-red-200 leading-relaxed">{summary.warning}</p>
        </div>
      )}

      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
        <h3 className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2"><Sparkles size={13} className="text-rose-400" /> Tahmin Ayarları</h3>
        <div className="grid grid-cols-2 gap-2">
          <label><span className="text-[8px] font-mono text-zinc-600 uppercase block mb-1">Döngü uzunluğu</span><input type="number" min="21" max="45" value={config.cycleLength} onChange={event => setConfig({ cycleLength: event.target.value })} onBlur={event => setConfig({ cycleLength: clampNumber(event.target.value, 21, 45) })} className={inputClass} /></label>
          <label><span className="text-[8px] font-mono text-zinc-600 uppercase block mb-1">Regl süresi</span><input type="number" min="2" max="10" value={config.periodLength} onChange={event => setConfig({ periodLength: event.target.value })} onBlur={event => setConfig({ periodLength: clampNumber(event.target.value, 2, 10) })} className={inputClass} /></label>
        </div>
        <button onClick={() => setConfig({ hormonalContraception: !config.hormonalContraception })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex justify-between items-center text-left">
          <span><strong className="text-[10px] text-zinc-300 block">Hormonal doğum kontrolü kullanıyorum</strong><span className="text-[8px] font-mono text-zinc-600">Faz tahmininin güvenini sınırlar; belirti takibi devam eder.</span></span>
          <span className={`w-10 h-6 rounded-full border relative ${config.hormonalContraception ? 'bg-rose-600 border-rose-500' : 'bg-zinc-950 border-zinc-700'}`}><span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${config.hormonalContraception ? 'left-5' : 'left-1'}`} /></span>
        </button>
      </section>

      {records.length > 0 && (
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/60"><h3 className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider">Son Kayıtlar</h3></div>
          <div className="divide-y divide-zinc-800">
            {[...records].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12).map(record => (
              <button key={record.id} onClick={() => setSelectedDate(record.date)} className="w-full px-4 py-3 flex justify-between items-center text-left active:bg-zinc-800">
                <span><strong className="text-[10px] text-zinc-200 block">{formatDay(record.date, 'medium')}</strong><span className="text-[8px] font-mono text-zinc-600">{BLEEDING_LEVELS.find(level => level.key === record.bleeding)?.label || 'Yok'} · ağrı {record.pain}/10 · enerji {record.energy}/10</span></span>
                <ChevronRight size={13} className="text-zinc-600" />
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
});

CycleView.displayName = 'CycleView';
export default CycleView;
