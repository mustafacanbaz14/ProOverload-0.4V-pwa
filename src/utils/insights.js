import { parseNumber } from './number.js';
import { dailyTotals } from './nutritionStats.js';

const e1rm = (set) => {
  const weight = parseNumber(set?.weight);
  const reps = Math.min(15, parseNumber(set?.reps) + parseNumber(set?.rir));
  return weight > 0 && reps > 0 ? weight * (1 + reps / 30) : 0;
};

const workingSets = (sets = []) => sets.filter(set => set?.setType !== 'warmup');

// Aynı hareketin ilk iki ve son iki seansındaki en iyi tahmini 1RM'leri karşılaştırır.
// Tek kötü gün alarm üretmesin diye en az dört seans ve 21 günlük zaman aralığı gerekir.
export const buildPlateauInsights = (workouts = []) => {
  const exercises = new Map();
  [...workouts]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach(workout => (workout.exercises || []).forEach(exercise => {
      const best = Math.max(0, ...workingSets(exercise.sets).map(e1rm));
      if (!best) return;
      const series = exercises.get(exercise.name) || [];
      series.push({ date: workout.date, value: best });
      exercises.set(exercise.name, series);
    }));

  return [...exercises.entries()].flatMap(([name, series]) => {
    if (series.length < 4) return [];
    const span = (new Date(series.at(-1).date) - new Date(series[0].date)) / 86400000;
    if (span < 21) return [];
    const first = (series[0].value + series[1].value) / 2;
    const last = (series.at(-1).value + series.at(-2).value) / 2;
    const change = first > 0 ? ((last - first) / first) * 100 : 0;
    if (change > 1.5) return [];
    return [{
      name,
      sessions: series.length,
      change: Math.round(change * 10) / 10,
      state: change < -1 ? 'decline' : 'plateau',
      advice: change < -1
        ? 'Yük düşüyor: toparlanma, teknik ve egzersiz sırasını kontrol et.'
        : '3+ haftadır yatay: tekrar, yük veya set sayısından yalnızca birini artır.',
    }];
  }).sort((a, b) => a.change - b.change).slice(0, 6);
};

const correlation = (pairs) => {
  const n = pairs.length;
  if (n < 2) return 0;
  const mx = pairs.reduce((sum, p) => sum + p.x, 0) / n;
  const my = pairs.reduce((sum, p) => sum + p.y, 0) / n;
  const numerator = pairs.reduce((sum, p) => sum + (p.x - mx) * (p.y - my), 0);
  const dx = Math.sqrt(pairs.reduce((sum, p) => sum + (p.x - mx) ** 2, 0));
  const dy = Math.sqrt(pairs.reduce((sum, p) => sum + (p.y - my) ** 2, 0));
  return dx && dy ? numerator / (dx * dy) : 0;
};

// Karbonhidrat ile hazır oluşluk ilişkisi gözlemseldir; nedensellik iddiası taşımaz.
export const buildNutritionPerformanceInsight = (workouts = [], nutrition = [], weightKg = 0) => {
  const byDate = new Map(nutrition.map(day => [day.date, dailyTotals(day)]));
  const pairs = workouts.flatMap(workout => {
    const food = byDate.get(workout.date);
    const score = parseNumber(workout.readiness?.score);
    if (!food || score <= 0 || parseNumber(food.carbs) <= 0) return [];
    const carbs = weightKg > 0 ? parseNumber(food.carbs) / weightKg : parseNumber(food.carbs);
    return [{ x: carbs, y: score }];
  });

  if (pairs.length < 6) return {
    enough: false,
    samples: pairs.length,
    message: `Kişisel ilişki için ${Math.max(0, 6 - pairs.length)} eşleşen antrenman günü daha gerekli.`,
  };

  const r = Math.round(correlation(pairs) * 100) / 100;
  const strength = Math.abs(r) >= 0.5 ? 'belirgin' : Math.abs(r) >= 0.25 ? 'zayıf' : 'net değil';
  return {
    enough: true,
    samples: pairs.length,
    correlation: r,
    label: r >= 0.25 ? 'Karbonhidrat arttıkça hazır oluşluk yükseliyor' : r <= -0.25
      ? 'Yüksek karbonhidratlı günlerde hazır oluşluk daha düşük' : 'Net bir ilişki görünmüyor',
    message: `İlişki ${strength} (r=${r}). Bu kişisel gözlemdir; uyku ve antrenman yükü de sonucu etkiler.`,
  };
};
