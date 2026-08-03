import React, { memo, useId, useMemo, useState } from 'react';
import { Check, Dumbbell, Plus, Target, Trash2, TrendingUp } from 'lucide-react';
import { goalEta, trendRate } from '../utils/goals';
import { clampNumber, estimate1RM, generateId, isWorkingSet, parseNumber } from '../utils/helpers';
import { formatDay } from '../utils/dates';

const StrengthGoalsCard = memo(({
  settings = {},
  setSettings,
  allExerciseNames = [],
  personalRecords,
  workouts = [],
}) => {
  const listId = useId();
  const [draft, setDraft] = useState({ exercise: '', weight: '', reps: 1 });
  const goals = useMemo(
    () => Array.isArray(settings.strengthGoals) ? settings.strengthGoals : [],
    [settings.strengthGoals],
  );
  const selectedRecord = personalRecords?.get?.(draft.exercise.trim()) || null;

  const goalRows = useMemo(() => goals.map(goal => {
    const targetWeight = parseNumber(goal.weight);
    const targetReps = Math.max(1, parseNumber(goal.reps) || 1);
    const targetE1rm = estimate1RM(targetWeight, targetReps, 0);
    const record = personalRecords?.get?.(goal.exercise) || null;
    const points = workouts.map(workout => {
      const values = (workout.exercises || [])
        .filter(exercise => exercise.name === goal.exercise)
        .flatMap(exercise => (exercise.sets || []).filter(isWorkingSet))
        .map(set => estimate1RM(set.weight, set.reps, set.rir))
        .filter(value => value > 0);
      return values.length ? { date: workout.date, value: Math.max(...values) } : null;
    }).filter(Boolean);
    const trend = trendRate(points, 90);
    const reached = record?.e1rm >= targetE1rm && targetE1rm > 0;
    const eta = !reached && trend
      ? goalEta(record?.e1rm, targetE1rm, trend.perWeek, { minRate: 0.05 })
      : reached ? { reached: true } : null;
    return { ...goal, targetWeight, targetReps, targetE1rm, record, trend, eta, reached };
  }), [goals, personalRecords, workouts]);

  const updateGoals = next => setSettings?.(prev => ({ ...prev, strengthGoals: next }));
  const updateGoal = (id, patch) => updateGoals(goals.map(goal => goal.id === id ? { ...goal, ...patch } : goal));
  const addGoal = () => {
    const exercise = draft.exercise.trim();
    const weight = parseNumber(draft.weight);
    if (!exercise || !(weight > 0)) return;
    const existing = goals.find(goal => goal.exercise === exercise);
    if (existing) updateGoal(existing.id, { weight, reps: Math.max(1, parseNumber(draft.reps) || 1) });
    else updateGoals([...goals, { id: generateId(), exercise, weight, reps: Math.max(1, parseNumber(draft.reps) || 1) }]);
    setDraft({ exercise: '', weight: '', reps: 1 });
  };

  return (
    <section className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-center">
        <h3 className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2"><Dumbbell size={13} className="text-cyan-400" /> Hareket Ağırlığı Hedefleri</h3>
        <span className="text-[9px] font-mono text-zinc-600">{goals.length} hedef</span>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">Örnek: Bench Press 150 kg × 1. Varış tarihi geçmiş e1RM eğilimin aynı hızda sürerse hesaplanır; garanti değildir.</p>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 space-y-2">
          <input list={listId} value={draft.exercise} onChange={event => setDraft(prev => ({ ...prev, exercise: event.target.value }))} placeholder="Hareket ara…" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-[11px] text-zinc-200 outline-none focus:border-cyan-500" />
          <datalist id={listId}>{allExerciseNames.map(name => <option key={name} value={name} />)}</datalist>
          {selectedRecord?.e1rm > 0 && (
            <div className="flex items-center gap-1.5 text-[8px] font-mono">
              <span className="text-zinc-600 mr-auto">Mevcut e1RM {selectedRecord.e1rm} kg</span>
              <button onClick={() => setDraft(prev => ({ ...prev, weight: Math.round((selectedRecord.e1rm + 2.5) * 2) / 2, reps: 1 }))} className="px-2 py-1 rounded border border-cyan-900/40 text-cyan-500">+2.5 kg</button>
              <button onClick={() => setDraft(prev => ({ ...prev, weight: Math.round(selectedRecord.e1rm * 1.05 * 2) / 2, reps: 1 }))} className="px-2 py-1 rounded border border-cyan-900/40 text-cyan-500">+%5</button>
            </div>
          )}
          <div className="grid grid-cols-[1fr_74px_auto] gap-2">
            <label><span className="text-[8px] font-mono text-zinc-600 block mb-1">Hedef kg</span><input type="number" inputMode="decimal" min="1" max="500" step="0.5" value={draft.weight} onChange={event => setDraft(prev => ({ ...prev, weight: event.target.value }))} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-2 text-[11px] font-mono text-cyan-400 outline-none focus:border-cyan-500" /></label>
            <label><span className="text-[8px] font-mono text-zinc-600 block mb-1">Tekrar</span><input type="number" inputMode="numeric" min="1" max="30" value={draft.reps} onChange={event => setDraft(prev => ({ ...prev, reps: event.target.value }))} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-2 text-[11px] font-mono text-cyan-400 outline-none focus:border-cyan-500" /></label>
            <button onClick={addGoal} disabled={!draft.exercise.trim() || !(parseNumber(draft.weight) > 0)} aria-label="Ağırlık hedefi ekle" className="self-end w-10 h-9 rounded-xl bg-cyan-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white flex items-center justify-center"><Plus size={15} /></button>
          </div>
        </div>

        {goalRows.map(row => {
          const current = row.record?.e1rm || 0;
          const percent = row.targetE1rm > 0 ? Math.min(100, Math.round(current / row.targetE1rm * 100)) : 0;
          return (
            <div key={row.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 space-y-2">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0"><strong className="text-[11px] text-zinc-200 block truncate">{row.exercise}</strong><span className="text-[9px] font-mono text-zinc-600">Mevcut e1RM {current > 0 ? `${current} kg` : 'veri yok'}</span></div>
                <button onClick={() => updateGoals(goals.filter(goal => goal.id !== row.id))} aria-label={`${row.exercise} hedefini sil`} className="p-1.5 text-zinc-600 active:text-red-400"><Trash2 size={13} /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label><span className="text-[8px] font-mono text-zinc-600 block mb-1">Hedef kg</span><input type="number" min="1" max="500" step="0.5" value={row.weight} onChange={event => updateGoal(row.id, { weight: event.target.value })} onBlur={event => updateGoal(row.id, { weight: clampNumber(event.target.value, 1, 500) })} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-center text-[11px] font-mono text-cyan-400 outline-none" /></label>
                <label><span className="text-[8px] font-mono text-zinc-600 block mb-1">Tekrar</span><input type="number" min="1" max="30" value={row.reps} onChange={event => updateGoal(row.id, { reps: event.target.value })} onBlur={event => updateGoal(row.id, { reps: clampNumber(event.target.value, 1, 30) })} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-center text-[11px] font-mono text-cyan-400 outline-none" /></label>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden"><div className={`h-full rounded-full ${row.reached ? 'bg-emerald-500' : 'bg-cyan-500'}`} style={{ width: `${percent}%` }} /></div>
              {row.reached ? (
                <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1"><Check size={10} /> Tahmini güç hedefi karşılandı</span>
              ) : row.eta ? (
                <p className="text-[9px] font-mono leading-relaxed">
                  {row.eta.wrongDirection ? <span className="text-amber-400">Son 90 günlük eğilim hedefin ters yönünde.</span>
                    : row.eta.stalled ? <span className="text-zinc-500">Güç eğilimi yatay; tarih hesaplanamıyor.</span>
                      : row.eta.tooFar ? <span className="text-zinc-500">Mevcut hızla hedef üç yıldan uzak.</span>
                        : <span className="text-cyan-400 flex items-center gap-1"><TrendingUp size={10} /> ~{row.eta.weeks} hafta · {formatDay(row.eta.date, 'medium', { year: true })}{row.trend?.confidence === 'low' ? ' · az veri' : ''}</span>}
                </p>
              ) : <span className="text-[9px] font-mono text-zinc-600">Varış tahmini için 90 günde en az 3 performans kaydı gerekir.</span>}
            </div>
          );
        })}

        {goals.length === 0 && <div className="py-3 text-center"><Target size={18} className="text-zinc-700 mx-auto mb-1" /><p className="text-[9px] font-mono text-zinc-600">Henüz hareket hedefi yok.</p></div>}
      </div>
    </section>
  );
});

StrengthGoalsCard.displayName = 'StrengthGoalsCard';
export default StrengthGoalsCard;
