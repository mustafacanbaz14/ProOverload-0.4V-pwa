import React, { memo } from 'react';
import { CalendarDays, ChevronRight, ShieldAlert } from 'lucide-react';
import { formatDay } from '../utils/dates';

const CycleSummaryCard = memo(({ summary, onOpen }) => {
  if (!summary) return null;
  const tone = summary.severity === 'high'
    ? 'border-red-900/50 bg-red-950/20 text-red-300'
    : summary.severity === 'moderate'
      ? 'border-amber-900/40 bg-amber-950/15 text-amber-300'
      : 'border-rose-900/40 bg-rose-950/15 text-rose-300';
  return (
    <button onClick={onOpen} className={`w-full rounded-2xl border p-3.5 text-left active:brightness-110 ${tone}`}>
      <div className="flex justify-between items-start gap-3">
        <span className="flex gap-2 min-w-0">
          {summary.warning ? <ShieldAlert size={15} className="shrink-0 mt-0.5" /> : <CalendarDays size={15} className="shrink-0 mt-0.5" />}
          <span className="min-w-0">
            <span className="text-[9px] font-mono uppercase tracking-widest opacity-80 block">Döngü & Performans</span>
            <strong className="text-[11px] text-zinc-100 block mt-0.5 truncate">
              {summary.hasData ? `${summary.phase.label} · ${summary.cycleDay}. gün` : 'İlk regl gününü kaydet'}
            </strong>
            <span className="text-[9px] font-mono text-zinc-400 block mt-1 leading-relaxed">
              {!summary.hasEntry
                ? 'Bugünkü ağrı, enerji ve belirtileri girerek kişisel tavsiye al.'
                : summary.severity === 'high'
                ? 'Bugünkü belirtiler yüksek; planı otomatik zorlamak yerine yükü azalt.'
                : summary.severity === 'moderate'
                  ? 'İlk seti kontrol seti yap; beklenenden zorsa hacmi azalt.'
                  : 'Belirti yükü düşük; yalnız faz nedeniyle programı değiştirme.'}
            </span>
            {summary.nextPeriod && <span className="text-[8px] font-mono text-zinc-600 block mt-1">Sonraki tahmin: {formatDay(summary.nextPeriod, 'medium')}</span>}
          </span>
        </span>
        <ChevronRight size={14} className="shrink-0 mt-1" />
      </div>
    </button>
  );
});

CycleSummaryCard.displayName = 'CycleSummaryCard';
export default CycleSummaryCard;
