import React, { memo, useState, useMemo } from 'react';
import { Search, Eye, EyeOff } from 'lucide-react';
import TrendChart from './TrendChart';
import { BODY_METRICS, MUSCLE_GROUPS, getVolumeLandmarks } from '../utils/constants';
import { estimate1RM, isWorkingSet, parseNumber, detectMuscleGroup, foldForSearch } from '../utils/helpers';
import { movingAverage } from '../utils/tdee';
import {
  buildNutritionSeries, averageOverDays, macroSplit, proteinPerKg, adherenceStats
} from '../utils/nutritionStats';

// Beslenme grafiğinde izlenebilecek alanlar.
const NUTRITION_METRICS = [
  { key: 'calories', label: 'Kalori', unit: ' kcal', color: '#22d3ee' },
  { key: 'protein', label: 'Protein', unit: ' g', color: '#34d399' },
  { key: 'carbs', label: 'Karbonhidrat', unit: ' g', color: '#fbbf24' },
  { key: 'fats', label: 'Yağ', unit: ' g', color: '#a78bfa' },
];

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
  exercisePerformCounts = new Map(),
  hidden1RMExercises = [],
  onToggleHidden1RM,
  nutritionHistory = [],
  settings = {},
  computedComp,
  adaptiveTDEE,
}) => {
  const [muscleKey, setMuscleKey] = useState('Göğüs');
  const [showAverage, setShowAverage] = useState(true);
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [nutritionMetric, setNutritionMetric] = useState('calories');

  const hidden1RMSet = useMemo(() => new Set(hidden1RMExercises), [hidden1RMExercises]);

  // Varsayılan liste yalnızca en az iki seansta yapılmış hareketler: 1RM
  // eğilimi tek ölçümle çizilemez, 183 hareketin tamamı listede sadece gürültü.
  // Arama yazıldığı anda kısıt kalkar, gizlenenler dahil her şey bulunabilir.
  const rmExercises = useMemo(() => {
    const q = foldForSearch(exerciseQuery).trim();
    if (q) return allExercisesNames.filter(n => foldForSearch(n).includes(q));
    return allExercisesNames.filter(n =>
      (exercisePerformCounts.get(n) || 0) >= 2 && !hidden1RMSet.has(n));
  }, [allExercisesNames, exerciseQuery, exercisePerformCounts, hidden1RMSet]);
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

  // --- BESLENME ---
  // Yalnızca kayıt girilmiş günler; boş günler ortalamayı yanlış düşürmesin.
  const nutritionSeries = useMemo(() => buildNutritionSeries(nutritionHistory), [nutritionHistory]);

  // Protein/kg için en son girilen kilo; computedComp kiloyu döndürmüyor.
  const latestWeight = useMemo(() => {
    const rec = [...(metricsHistory || [])]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .find(m => parseNumber(m.weight) > 0);
    return rec ? parseNumber(rec.weight) : 0;
  }, [metricsHistory]);

  const nutritionAnalysis = useMemo(() => {
    if (analysisType !== 'nutrition' || nutritionSeries.length === 0) return null;

    const metric = NUTRITION_METRICS.find(m => m.key === nutritionMetric) || NUTRITION_METRICS[0];
    const avg7 = averageOverDays(nutritionSeries, 7);
    const avg30 = averageOverDays(nutritionSeries, 30);

    // Kalori hedefi: gerçek TDEE varsa ondan, yoksa BMR tahmininden.
    const targetCalories = adaptiveTDEE?.tdee > 0
      ? Math.round(adaptiveTDEE.tdee)
      : Math.round(parseNumber(computedComp?.bmr) * 1.5) || 0;

    const ffm = parseNumber(computedComp?.ffm) || 0;
    const proteinMultiplier = settings.nutritionGoal === 'bulk'
      ? (settings.proteinPerFfmBulk || 2.2)
      : (settings.proteinPerFfmCut || 2.6);
    const targetProtein = ffm > 0 ? Math.round(ffm * proteinMultiplier) : 0;

    // Grafik son 30 kayıtla sınırlı: daha fazlası mobilde okunmaz hale geliyor.
    const recent = nutritionSeries.slice(-30);
    let chart = recent.map(d => ({
      val: Math.round(d[metric.key]),
      label: new Date(d.date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }),
    }));

    // Günlük değerler oynak; karar 7 günlük ortalamadan verilir.
    if (showAverage && recent.length >= 3) {
      const smoothed = movingAverage(
        recent.map(d => ({ date: d.date, value: d[metric.key] })), 7);
      if (smoothed.length >= 2) {
        chart = smoothed.map(p => ({
          val: Math.round(p.value),
          label: new Date(p.date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }),
        }));
      }
    }

    return {
      metric,
      chart,
      avg7,
      avg30,
      targetCalories,
      targetProtein,
      split: macroSplit(avg7 || avg30),
      proteinKg: proteinPerKg((avg7 || avg30)?.protein, latestWeight),
      adherence: adherenceStats(nutritionSeries, targetCalories, 30),
      // Tablo en yeni gün üstte olacak şekilde ters çevrilir.
      table: [...nutritionSeries].reverse().slice(0, 14),
    };
  }, [analysisType, nutritionSeries, nutritionMetric, showAverage, adaptiveTDEE, computedComp, settings, latestWeight]);

  return (
    <div className="p-4 space-y-4 pb-24 h-full overflow-y-auto hide-scrollbar bg-black">
      {/* Dört sekme tek satırda sığmıyor; etiketler kısaltıldı. */}
      <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
        {[
          { key: 'body', label: 'Vücut' },
          { key: '1rm', label: '1RM' },
          { key: 'muscle', label: 'Hacim' },
          { key: 'nutrition', label: 'Beslenme' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setAnalysisType(t.key)}
            className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-colors ${analysisType === t.key ? 'bg-cyan-600 text-white' : 'text-zinc-500'}`}
          >
            {t.label}
          </button>
        ))}
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
          <div className="bg-zinc-900 p-3 rounded-2xl border border-zinc-800 space-y-2.5">
            <div className="flex justify-between items-baseline">
              <label className="text-[10px] font-mono text-zinc-500 uppercase">Hareket Seçin</label>
              <span className="text-[9px] font-mono text-zinc-600">
                {exerciseQuery.trim() ? `${rmExercises.length} sonuç · tümü` : `${rmExercises.length} hareket · 2+ seans`}
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
              <input
                type="text"
                value={exerciseQuery}
                onChange={(e) => setExerciseQuery(e.target.value)}
                placeholder="Ara (tüm hareketlerde)..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-100 font-mono outline-none focus:border-cyan-600 transition-colors"
              />
            </div>

            <div className="max-h-52 overflow-y-auto hide-scrollbar -mx-1 px-1 space-y-1">
              {rmExercises.length === 0 ? (
                <p className="text-[10px] font-mono text-zinc-600 text-center py-4 leading-relaxed">
                  {exerciseQuery.trim()
                    ? 'Eşleşen hareket yok.'
                    : 'En az iki seansta yaptığın hareket yok. Grafik için aynı hareketi tekrar çalışman gerekiyor — aramayla tüm hareketlere ulaşabilirsin.'}
                </p>
              ) : rmExercises.map(name => {
                const hidden = hidden1RMSet.has(name);
                const count = exercisePerformCounts.get(name) || 0;
                return (
                  <div
                    key={name}
                    className={`flex items-center gap-1 rounded-xl border transition-colors ${
                      analysisExercise === name ? 'border-cyan-600 bg-cyan-950/20' : 'border-zinc-800 bg-zinc-950'
                    } ${hidden ? 'opacity-45' : ''}`}
                  >
                    <button
                      onClick={() => setAnalysisExercise(name)}
                      className="flex-1 min-w-0 text-left px-2.5 py-2 active:opacity-60"
                    >
                      <span className={`text-[11px] font-mono block truncate ${analysisExercise === name ? 'text-cyan-400 font-bold' : 'text-zinc-300'}`}>
                        {name}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-600">{count} seans</span>
                    </button>
                    <button
                      onClick={() => onToggleHidden1RM?.(name)}
                      title={hidden ? 'Listede göster' : 'Listeden gizle'}
                      aria-label={hidden ? 'Listede göster' : 'Listeden gizle'}
                      className="text-zinc-600 active:text-cyan-400 p-2 shrink-0"
                    >
                      {hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {analysisExercise ? (
            <TrendChart data={chartData} color="#34d399" unit="kg" />
          ) : (
            <div className="text-center py-12 text-zinc-600 text-xs font-mono">Grafiği görmek için bir hareket seçin</div>
          )}
        </div>
      )}

      {analysisType === 'nutrition' && (
        <div className="space-y-3">
          {!nutritionAnalysis ? (
            <div className="text-center py-12 text-zinc-600 text-xs font-mono leading-relaxed px-4">
              Henüz beslenme kaydı yok.
              <br />
              <span className="text-zinc-700">Beslenme sekmesinden bir gün girdiğinde analiz burada oluşur.</span>
            </div>
          ) : (
            <>
              {/* Ortalamalar */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '7 Günlük Ort.', data: nutritionAnalysis.avg7 },
                  { label: '30 Günlük Ort.', data: nutritionAnalysis.avg30 },
                ].map(box => (
                  <div key={box.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">{box.label}</span>
                    {box.data ? (
                      <>
                        <span className="text-lg font-mono font-bold text-cyan-400">{box.data.calories}</span>
                        <span className="text-[10px] font-mono text-zinc-500 ml-1">kcal</span>
                        <div className="text-[9px] font-mono text-zinc-500 mt-1.5 leading-relaxed">
                          P {box.data.protein}g · K {box.data.carbs}g · Y {box.data.fats}g
                        </div>
                        <div className="text-[9px] font-mono text-zinc-600 mt-0.5">{box.data.days} gün kayıtlı</div>
                      </>
                    ) : (
                      <span className="text-[10px] font-mono text-zinc-600">Veri yok</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Hedeflerle karşılaştırma */}
              {(nutritionAnalysis.targetCalories > 0 || nutritionAnalysis.targetProtein > 0) && nutritionAnalysis.avg7 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-2.5">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Hedefe Göre Durum</h4>
                  {[
                    {
                      label: 'Kalori', current: nutritionAnalysis.avg7.calories,
                      target: nutritionAnalysis.targetCalories, unit: 'kcal', bar: 'bg-cyan-500',
                    },
                    {
                      label: 'Protein', current: nutritionAnalysis.avg7.protein,
                      target: nutritionAnalysis.targetProtein, unit: 'g', bar: 'bg-emerald-500',
                    },
                  ].filter(r => r.target > 0).map(row => {
                    const pct = Math.round((row.current / row.target) * 100);
                    return (
                      <div key={row.label} className="space-y-1">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[11px] font-bold text-zinc-200">{row.label}</span>
                          <span className="text-[10px] font-mono text-zinc-400">
                            <strong className="text-zinc-100">{row.current}</strong>
                            <span className="text-zinc-600"> / {row.target} {row.unit} · %{pct}</span>
                          </span>
                        </div>
                        <div className="w-full bg-zinc-950 rounded-full h-1.5 border border-zinc-800">
                          <div className={`h-1.5 rounded-full transition-all duration-500 ${row.bar}`} style={{ width: `${Math.min(100, pct)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {nutritionAnalysis.proteinKg && (
                    <p className="text-[9px] font-mono text-zinc-600 leading-relaxed pt-0.5">
                      Protein alımı vücut ağırlığının kilosu başına{' '}
                      <strong className="text-emerald-400">{nutritionAnalysis.proteinKg} g</strong>.
                    </p>
                  )}
                </div>
              )}

              {/* Makro dağılımı */}
              {nutritionAnalysis.split && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Makro Dağılımı</h4>
                    <span className="text-[9px] font-mono text-zinc-600">kaloriye katkı</span>
                  </div>
                  {/* Tek çubukta üç renk: oranlar bir bakışta karşılaştırılabilir. */}
                  <div className="flex w-full h-2.5 rounded-full overflow-hidden border border-zinc-800 bg-zinc-950">
                    <div className="bg-emerald-500" style={{ width: `${nutritionAnalysis.split.protein}%` }} />
                    <div className="bg-amber-500" style={{ width: `${nutritionAnalysis.split.carbs}%` }} />
                    <div className="bg-purple-500" style={{ width: `${nutritionAnalysis.split.fats}%` }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-0.5">
                    {[
                      { label: 'Protein', value: nutritionAnalysis.split.protein, color: 'text-emerald-400' },
                      { label: 'Karb.', value: nutritionAnalysis.split.carbs, color: 'text-amber-400' },
                      { label: 'Yağ', value: nutritionAnalysis.split.fats, color: 'text-purple-400' },
                    ].map(m => (
                      <div key={m.label}>
                        <span className={`text-sm font-mono font-bold ${m.color}`}>%{m.value}</span>
                        <span className="text-[9px] font-mono text-zinc-500 block uppercase">{m.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hedef tutarlılığı */}
              {nutritionAnalysis.adherence && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5">
                  <div className="flex justify-between items-baseline mb-2">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Son 30 Gün Tutarlılık</h4>
                    <span className="text-[9px] font-mono text-zinc-600">hedefin ±%10&apos;u</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: 'Altında', value: nutritionAnalysis.adherence.under, color: 'text-blue-400' },
                      { label: 'Hedefte', value: nutritionAnalysis.adherence.onTarget, color: 'text-emerald-400' },
                      { label: 'Üstünde', value: nutritionAnalysis.adherence.over, color: 'text-orange-400' },
                    ].map(m => (
                      <div key={m.label} className="bg-zinc-950 border border-zinc-800 rounded-xl py-2">
                        <span className={`text-sm font-mono font-bold ${m.color}`}>{m.value}</span>
                        <span className="text-[9px] font-mono text-zinc-500 block uppercase">{m.label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] font-mono text-zinc-600 leading-relaxed mt-2">
                    {nutritionAnalysis.adherence.logged} kayıtlı günün{' '}
                    <strong className="text-emerald-400">%{nutritionAnalysis.adherence.onTargetPct}</strong>&apos;i
                    hedef aralığında.
                  </p>
                </div>
              )}

              {/* Grafik */}
              <div className="bg-zinc-900 p-3 rounded-2xl border border-zinc-800">
                <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1.5">Grafik</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {NUTRITION_METRICS.map(m => (
                    <button
                      key={m.key}
                      onClick={() => setNutritionMetric(m.key)}
                      className={`py-2 rounded-lg text-[9px] font-bold uppercase border transition-colors ${
                        nutritionMetric === m.key
                          ? 'border-cyan-600 text-cyan-400 bg-cyan-950/20'
                          : 'border-zinc-800 text-zinc-500'
                      }`}
                    >
                      {m.key === 'carbs' ? 'Karb.' : m.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowAverage(v => !v)}
                className={`w-full py-2.5 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-colors ${showAverage ? 'bg-cyan-900/25 border-cyan-600 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
              >
                {showAverage ? '7 Günlük Ortalama (açık)' : 'Ham Günlük Veri'}
              </button>

              <TrendChart
                data={nutritionAnalysis.chart}
                color={nutritionAnalysis.metric.color}
                unit={nutritionAnalysis.metric.unit}
              />

              {/* Günlük tablo */}
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                <div className="px-3 py-2.5 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline">
                  <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Günlük Tablo</h4>
                  <span className="text-[9px] font-mono text-zinc-600">son {nutritionAnalysis.table.length} kayıt</span>
                </div>
                {/* Tablo dar ekranda taşmasın diye kendi içinde yatay kayar. */}
                <div className="overflow-x-auto hide-scrollbar">
                  <table className="w-full text-[10px] font-mono">
                    <thead>
                      <tr className="text-zinc-500 uppercase">
                        <th className="text-left font-bold px-3 py-2">Tarih</th>
                        <th className="text-right font-bold px-2 py-2">Kcal</th>
                        <th className="text-right font-bold px-2 py-2">P</th>
                        <th className="text-right font-bold px-2 py-2">K</th>
                        <th className="text-right font-bold px-3 py-2">Y</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nutritionAnalysis.table.map(d => {
                        // Hedeften sapma yönü satır bazında renklendirilir.
                        const t = nutritionAnalysis.targetCalories;
                        const kcalColor = !(t > 0) ? 'text-zinc-200'
                          : d.calories < t * 0.9 ? 'text-blue-400'
                            : d.calories > t * 1.1 ? 'text-orange-400'
                              : 'text-emerald-400';
                        return (
                          <tr key={d.date} className="border-t border-zinc-800/70">
                            <td className="text-left px-3 py-2 text-zinc-400 whitespace-nowrap">
                              {new Date(d.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                            </td>
                            <td className={`text-right px-2 py-2 font-bold ${kcalColor}`}>{Math.round(d.calories)}</td>
                            <td className="text-right px-2 py-2 text-emerald-400/80">{Math.round(d.protein)}</td>
                            <td className="text-right px-2 py-2 text-amber-400/80">{Math.round(d.carbs)}</td>
                            <td className="text-right px-3 py-2 text-purple-400/80">{Math.round(d.fats)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {nutritionAnalysis.targetCalories > 0 && (
                  <p className="text-[9px] font-mono text-zinc-600 leading-relaxed px-3 py-2 border-t border-zinc-800">
                    Kalori rengi hedefe göre: mavi altında, yeşil hedefte, turuncu üstünde.
                    Hedef {nutritionAnalysis.targetCalories} kcal
                    {adaptiveTDEE?.tdee > 0 ? ' (gerçek TDEE)' : ' (BMR tahmini)'}.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
});

AnalyticsView.displayName = 'AnalyticsView';

export default AnalyticsView;
