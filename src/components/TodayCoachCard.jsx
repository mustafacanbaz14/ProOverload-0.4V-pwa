import React, { memo, useState } from 'react';
import { CalendarCheck, Moon, BrainCircuit, Flame, Dumbbell, HeartPulse, ChevronRight, ChevronDown } from 'lucide-react';

const Metric = ({ icon, label, value, tone = 'text-zinc-200' }) => (
  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 min-w-0">
    <span className="flex items-center text-[9px] font-mono text-zinc-600 uppercase tracking-wider mb-1">
      {icon}{label}
    </span>
    <span className={`text-[11px] font-mono font-bold block truncate ${tone}`}>{value}</span>
  </div>
);

const TodayCoachCard = memo(({ data, actions = [], onAction, onStart, onOpenEnergy, onOpenWellness, onOpenCardio }) => {
  const [showAll, setShowAll] = useState(false);
  if (!data) return null;
  const planned = Boolean(data.workoutTemplate);
  return (
    <section className="bg-gradient-to-br from-cyan-950/45 via-zinc-900 to-zinc-900 rounded-3xl border border-cyan-900/40 overflow-hidden shadow-lg shadow-cyan-950/10">
      <div className="px-4 py-3 border-b border-zinc-800/80 flex justify-between items-center gap-3">
        <div className="min-w-0">
          <span className="text-[9px] font-mono text-cyan-500 uppercase tracking-[0.18em]">Bugünün Koçu</span>
          <h2 className="text-sm font-bold text-zinc-100 truncate">{data.dateLabel}</h2>
        </div>
        <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded-lg border ${data.tone}`}>
          {data.status}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <p className="text-[12px] font-bold text-zinc-100 leading-snug">{data.headline}</p>
          <p className="text-[10px] font-mono text-zinc-500 leading-relaxed mt-1">{data.detail}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Metric icon={<Moon size={10} className="mr-1 text-indigo-400" />} label="Uyku" value={data.sleepLabel} tone={data.sleepTone} />
          <Metric icon={<BrainCircuit size={10} className="mr-1 text-amber-400" />} label="Hazır Oluş" value={data.readinessLabel} tone={data.readinessTone} />
          <Metric icon={<Flame size={10} className="mr-1 text-red-400" />} label="Kalori" value={data.calorieLabel} tone={data.calorieTone} />
        </div>

        <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-zinc-300 flex items-center min-w-0">
              {planned ? <Dumbbell size={12} className="mr-1.5 text-cyan-400 shrink-0" /> : <CalendarCheck size={12} className="mr-1.5 text-zinc-500 shrink-0" />}
              <span className="truncate">{data.planLabel}</span>
            </span>
            {data.planTime && <span className="text-[9px] font-mono text-cyan-500 shrink-0">{data.planTime}</span>}
          </div>
          {data.cardioLabel && (
            <p className="text-[9px] font-mono text-zinc-500 flex items-center">
              <HeartPulse size={10} className="mr-1.5 text-red-400" /> {data.cardioLabel}
            </p>
          )}
          {data.planCalories > 0 && (
            <p className="text-[9px] font-mono text-zinc-600 flex items-center">
              <Flame size={10} className="mr-1.5 text-orange-400" /> Planlanan ek harcama ~{data.planCalories} kcal
            </p>
          )}
        </div>

        {/* Sıralanmış eylem listesi. Kart tek cümleyle "planın hazır" diyordu
            ama günün asıl kararı çoğu zaman başka yerde oluyor: uyku kötüyse
            planın hazır olması bir şey ifade etmiyor. İlk iki madde açık,
            gerisi istenirse açılıyor — kart ikinci bir ekrana dönüşmesin. */}
        {actions.length > 0 && (
          <div className="space-y-1.5">
            {(showAll ? actions : actions.slice(0, 2)).map(item => (
              <div key={item.key} className={`rounded-xl border p-2.5 ${item.tone.chip}`}>
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-[10px] font-bold leading-snug ${item.tone.text}`}>{item.title}</span>
                  {item.action && onAction && (
                    <button
                      onClick={() => onAction(item.action)}
                      className="text-[9px] font-bold text-zinc-400 active:text-zinc-100 shrink-0 flex items-center"
                    >
                      Aç <ChevronRight size={10} />
                    </button>
                  )}
                </div>
                <p className="text-[9px] font-mono text-zinc-400 leading-relaxed mt-1">{item.detail}</p>
              </div>
            ))}
            {actions.length > 2 && (
              <button
                onClick={() => setShowAll(v => !v)}
                className="w-full text-[9px] font-mono text-zinc-500 active:text-zinc-300 py-1 flex items-center justify-center gap-1"
              >
                {showAll ? 'Daha az göster' : `${actions.length - 2} madde daha`}
                <ChevronDown size={10} className={`transition-transform ${showAll ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-[1fr_auto_auto] gap-2">
          <button
            onClick={() => data.cardioLabel && !planned
              ? onOpenCardio?.()
              : onStart?.(data.workoutTemplate || null)}
            className="bg-cyan-600 active:bg-cyan-700 text-white rounded-xl px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center"
          >
            {planned ? 'Planlananı Başlat' : data.cardioLabel ? 'Kardiyoyu Aç' : 'Serbest Başlat'} <ChevronRight size={12} className="ml-1" />
          </button>
          <button onClick={onOpenEnergy} aria-label="Enerji detayını aç" className="bg-zinc-950 border border-zinc-800 text-red-400 rounded-xl p-2.5"><Flame size={15} /></button>
          <button onClick={onOpenWellness} aria-label="Uyku ve toparlanmayı aç" className="bg-zinc-950 border border-zinc-800 text-indigo-400 rounded-xl p-2.5"><Moon size={15} /></button>
        </div>
      </div>
    </section>
  );
});

TodayCoachCard.displayName = 'TodayCoachCard';

export default TodayCoachCard;
