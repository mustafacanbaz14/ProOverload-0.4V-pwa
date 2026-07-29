import React, { memo, useState } from 'react';
import TrendChart from './TrendChart';
import { BODY_METRICS, MUSCLE_GROUPS, getVolumeLandmarks } from '../utils/constants';
import { estimate1RM, isWorkingSet, parseNumber, detectMuscleGroup } from '../utils/helpers';
import { movingAverage } from '../utils/tdee';

const AnalyticsView = memo(({
  analysisType,
  setAnalysisType,
  bodyMetricKey,
  setBodyMetricKey,
  analysisExercise,
  setAnalysisExercise,
  metricsHistory,
  workouts,
  allExercisesNames,
  customExercises = [],
  experienceLevel = 'intermediate',
}) => {
  const [muscleKey, setMuscleKey] = useState('Göğüs');
  const [showAverage, setShowAverage] = useState(true);
  let chartData = [];
  let unit = '';

  if (analysisType === 'body') {
    const metricObj = BODY_METRICS.find(m => m.key === bodyMetricKey) || BODY_METRICS[0];
    unit = metricObj.unit;

    chartData = [...metricsHistory]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(m => {
        let val = 0;
        if (bodyMetricKey === 'weight') val = parseNumber(m.weight);
        else val = parseNumber(m.measurements?.[bodyMetricKey]);
        return { val, label: new Date(m.date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }) };
      })
      .filter(d => d.val > 0);

    // Günlük kilo su/tuz yüzünden 1-2 kg oynar; karar 7 günlük ortalamadan verilir.
    if (bodyMetricKey === 'weight' && showAverage) {
      const raw = [...metricsHistory]
        .map(m => ({ date: m.date, value: parseNumber(m.weight) }))
        .filter(p => p.value > 0);
      const smoothed = movingAverage(raw, 7);
      if (smoothed.length >= 2) {
        chartData = smoothed.map(p => ({
          val: p.value,
          label: new Date(p.date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })
        }));
      }
    }
  } else if (analysisType === '1rm' && analysisExercise) {
    unit = 'kg';
    const sortedWorkouts = [...workouts].sort((a, b) => new Date(a.date) - new Date(b.date));

    sortedWorkouts.forEach(w => {
      const ex = (w.exercises || []).find(e => e.name === analysisExercise);
      if (!ex) return;
      let max1RM = 0;
      (ex.sets || []).filter(isWorkingSet).forEach(s => {
        const e1rm = estimate1RM(s.weight, s.reps, s.rir);
        if (e1rm > max1RM) max1RM = e1rm;
      });
      if (max1RM > 0) {
        chartData.push({ val: max1RM, label: new Date(w.date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }) });
      }
    });
  }

  // Haftalık kas hacmi serisi: her haftanın pazartesisi bir nokta.
  let muscleWeeks = [];
  if (analysisType === 'muscle') {
    const byWeek = new Map();
    workouts.forEach(w => {
      const d = new Date(w.date);
      const day = d.getDay();
      const monday = new Date(d);
      monday.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
      monday.setHours(0, 0, 0, 0);
      const key = monday.toISOString().split('T')[0];

      let total = byWeek.get(key) || 0;
      (w.exercises || []).forEach(ex => {
        const { contributions } = detectMuscleGroup(ex.name, customExercises);
        const sets = (ex.sets || []).filter(isWorkingSet).length;
        const weight = (contributions || {})[muscleKey];
        if (sets > 0 && weight) total += sets * weight;
      });
      byWeek.set(key, total);
    });

    muscleWeeks = [...byWeek.entries()]
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .slice(-12)
      .map(([date, total]) => ({
        val: Math.round(total * 4) / 4,
        label: new Date(date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })
      }));
  }

  return (
    <div className="p-4 space-y-4 pb-24 h-full overflow-y-auto hide-scrollbar bg-black">
      <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
        <button
          onClick={() => setAnalysisType('body')}
          className={`flex-1 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors ${analysisType === 'body' ? 'bg-cyan-600 text-white' : 'text-zinc-500'}`}
        >
          Vücut Ölçüleri
        </button>
        <button
          onClick={() => setAnalysisType('1rm')}
          className={`flex-1 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors ${analysisType === '1rm' ? 'bg-cyan-600 text-white' : 'text-zinc-500'}`}
        >
          1RM Güç
        </button>
        <button
          onClick={() => setAnalysisType('muscle')}
          className={`flex-1 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors ${analysisType === 'muscle' ? 'bg-cyan-600 text-white' : 'text-zinc-500'}`}
        >
          Kas Hacmi
        </button>
      </div>

      {analysisType === 'body' && (
        <div className="space-y-3">
          <div className="bg-zinc-900 p-3 rounded-2xl border border-zinc-800">
            <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Takip Edilen Bölge</label>
            <select
              value={bodyMetricKey}
              onChange={(e) => setBodyMetricKey(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-cyan-400 font-mono outline-none"
            >
              {BODY_METRICS.map(m => (
                <option key={m.key} value={m.key}>{m.label} ({m.unit})</option>
              ))}
            </select>
          </div>

          {bodyMetricKey === 'weight' && (
            <button
              onClick={() => setShowAverage(v => !v)}
              className={`w-full py-2.5 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-colors ${showAverage ? 'bg-cyan-900/25 border-cyan-600 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
            >
              {showAverage ? '7 Günlük Ortalama (açık)' : 'Ham Günlük Veri'}
            </button>
          )}

          <TrendChart data={chartData} color="#22d3ee" unit={unit} />

          {bodyMetricKey === 'weight' && showAverage && (
            <p className="text-[10px] font-mono text-zinc-600 leading-relaxed px-1">
              Günlük kilo su, tuz ve sindirim yüzünden 1-2 kg oynar. Bulk/cut kararı
              ham veriden değil, bu ortalamanın eğiminden verilir.
            </p>
          )}
        </div>
      )}

      {analysisType === 'muscle' && (
        <div className="space-y-3">
          <div className="bg-zinc-900 p-3 rounded-2xl border border-zinc-800">
            <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Kas Grubu</label>
            <select
              value={muscleKey}
              onChange={(e) => setMuscleKey(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-cyan-400 font-mono outline-none"
            >
              {MUSCLE_GROUPS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <TrendChart data={muscleWeeks} color="#a78bfa" unit=" set" />

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 grid grid-cols-3 gap-2 text-center">
            {['mev', 'mav', 'mrv'].map(k => (
              <div key={k} className="bg-zinc-950 border border-zinc-800 rounded-xl py-2">
                <span className="text-[9px] font-mono text-zinc-500 uppercase block">{k}</span>
                <span className="text-sm font-mono font-bold text-zinc-200">
                  {getVolumeLandmarks(muscleKey, experienceLevel)[k]}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] font-mono text-zinc-600 leading-relaxed px-1">
            Her nokta bir haftanın toplam hacmi. Katkı ağırlıkları dahildir:
            birincil hedef 1, yardımcı 0.5, hafif 0.25 set sayılır.
          </p>
        </div>
      )}

      {analysisType === '1rm' && (
        <div className="space-y-3">
          <div className="bg-zinc-900 p-3 rounded-2xl border border-zinc-800">
            <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Hareket Seçin</label>
            <select
              value={analysisExercise}
              onChange={(e) => setAnalysisExercise(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-cyan-400 font-mono outline-none"
            >
              <option value="">Hareket Seçiniz...</option>
              {allExercisesNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {analysisExercise ? (
            <TrendChart data={chartData} color="#34d399" unit="kg" />
          ) : (
            <div className="text-center py-12 text-zinc-600 text-xs font-mono">Grafiği görmek için bir hareket seçin</div>
          )}
        </div>
      )}
    </div>
  );
});

AnalyticsView.displayName = 'AnalyticsView';

export default AnalyticsView;
