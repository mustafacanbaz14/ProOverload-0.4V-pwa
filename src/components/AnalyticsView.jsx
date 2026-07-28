import React, { memo } from 'react';
import { LineChart, Trophy, Scale, Activity } from 'lucide-react';
import TrendChart from './TrendChart';
import { BODY_METRICS } from '../utils/constants';
import { estimate1RM, isWorkingSet, parseNumber } from '../utils/helpers';

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
}) => {
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
          1RM Güç İlerlemesi
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

          <TrendChart data={chartData} color="#22d3ee" unit={unit} />
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
