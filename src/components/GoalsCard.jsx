import React, { memo } from 'react';
import { Target, Check, TrendingDown, TrendingUp } from 'lucide-react';
import { GOAL_FIELDS, goalProgress, weeksToGoal } from '../utils/goals';
import { clampNumber, parseNumber } from '../utils/helpers';

/**
 * Vücut kompozisyonu hedefleri: kilo, yağ oranı, yağsız kütle ve FFMI.
 *
 * İlerleme yüzdesi en eski ölçümden hesaplanır — hedef sonradan konulduğu için
 * "hedefi koyduğum an" referans alınsa ilerleme hep %0 görünürdü.
 */
const GoalsCard = memo(({
  settings = {},
  setSettings,
  current = {},
  earliest = {},
  weeklyKg = 0,
}) => {
  // Sınırlama YAZARKEN değil odaktan çıkışta uygulanır. Her tuşta sınıra
  // çekmek girişi kullanılamaz hale getiriyordu: min 30 olan alana "78"
  // yazmaya çalışınca "7" anında 30'a çekiliyor, sonraki tuşla "308" olup
  // üst sınıra (300) çarpıyordu. MetricsView aynı kalıbı zaten kullanıyor.
  const setGoal = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  const clampOnBlur = (field) => (e) => {
    const raw = e.target.value;
    // Boş bırakmak hedefi kaldırmak demek; sıfıra çevirmek yanlış olurdu.
    if (raw === '') return setGoal(field.key, '');
    setGoal(field.key, clampNumber(raw, field.min, field.max));
  };

  const rows = GOAL_FIELDS.map(f => {
    const progress = goalProgress(earliest[f.key], current[f.key], settings[f.key]);
    return { ...f, progress, hasTarget: parseNumber(settings[f.key]) > 0 };
  });

  const weightRow = rows.find(r => r.key === 'goalWeight');
  const eta = weightRow?.hasTarget && weeklyKg !== 0
    ? weeksToGoal(current.goalWeight, settings.goalWeight, weeklyKg)
    : null;

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-800 bg-zinc-950/60">
        <h3 className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider flex items-center">
          <Target size={13} className="mr-2 text-emerald-400" /> Hedefler
        </h3>
        <span className="text-[10px] font-mono text-zinc-500">
          {rows.filter(r => r.hasTarget).length}/{rows.length} belirlendi
        </span>
      </div>

      <div className="p-4 space-y-3.5">
        {rows.map(row => {
          const p = row.progress;
          return (
            <div key={row.key} className="space-y-1.5">
              <div className="flex justify-between items-center gap-2">
                <span className="text-[11px] font-bold text-zinc-200 min-w-0 truncate">{row.label}</span>
                <span className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    inputMode="decimal"
                    step={row.step}
                    min={row.min}
                    max={row.max}
                    value={settings[row.key] ?? ''}
                    onChange={(e) => setGoal(row.key, e.target.value)}
                    onBlur={clampOnBlur(row)}
                    placeholder="—"
                    className="w-20 bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 text-center font-mono text-emerald-400 text-[11px] outline-none focus:border-emerald-500"
                  />
                  {row.unit && <span className="text-[10px] font-mono text-zinc-600 w-4">{row.unit}</span>}
                </span>
              </div>

              {row.hasTarget && p && (
                <>
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-zinc-500">
                      Şu an <strong className="text-zinc-300">{p.current}{row.unit}</strong>
                    </span>
                    {p.reached ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Check size={11} /> Hedefe ulaştın
                      </span>
                    ) : (
                      <span className="text-zinc-400 flex items-center gap-1">
                        {p.direction === 'down'
                          ? <TrendingDown size={11} className="text-cyan-400" />
                          : <TrendingUp size={11} className="text-cyan-400" />}
                        {p.remaining}{row.unit} kaldı
                      </span>
                    )}
                  </div>
                  {p.percent !== null && (
                    <div className="w-full bg-zinc-950 rounded-full h-1.5 border border-zinc-800">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${p.reached ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                        style={{ width: `${p.percent}%` }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        {eta && (
          <p className="text-[9px] font-mono text-zinc-600 leading-relaxed pt-1 border-t border-zinc-800">
            {eta.wrongDirection
              ? 'Mevcut kilo eğilimin hedefin ters yönünde — bu hızda hedefe yaklaşmıyorsun.'
              : `Mevcut hızda (haftada ${Math.abs(weeklyKg)} kg) hedef kiloya yaklaşık ${eta.weeks} haftada ulaşırsın.`}
          </p>
        )}

        {rows.every(r => !r.hasTarget) && (
          <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
            Bir hedef gir, ilerlemen buradan takip edilir. İlerleme yüzdesi en eski
            ölçümünden bugüne kat ettiğin yola göre hesaplanır.
          </p>
        )}
      </div>
    </div>
  );
});

GoalsCard.displayName = 'GoalsCard';

export default GoalsCard;
