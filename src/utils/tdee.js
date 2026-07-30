// Saf hesap modülü — bilerek bağımsız tutuldu ki node ile doğrudan test edilebilsin.
// Yalnızca aynı katmandaki saf modüllerden import eder.
// Uzantılar açık yazılır: node bu modülü doğrudan çalıştırabilsin
// (Vite uzantısız import'u çözer, node çözmez).
import { parseNumber } from './number.js';
import { dailyTotals } from './nutritionStats.js';

// 1 kg vücut ağırlığı değişimi ≈ 7700 kcal. Bu katsayı saf yağ dokusu için
// geçerlidir; kısa dönemde su/glikojen dalgalanması sonucu bozar, bu yüzden
// en az 14 günlük pencere şart koşulur.
const KCAL_PER_KG = 7700;
const MIN_DAYS = 14;
const MIN_WEIGHT_POINTS = 6;
const MIN_INTAKE_DAYS = 10;

const dayNumber = (dateStr) => Math.floor(new Date(dateStr).getTime() / 86400000);

/**
 * Kilo serisine hareketli ortalama uygular.
 * Günlük kilo su, tuz ve sindirimle 1-2 kg oynar; karar bunun üzerinden verilemez.
 * Pencere sondan geriye bakar (trailing), böylece son nokta daima bugünü temsil eder.
 */
export const movingAverage = (points, windowDays = 7) => {
  if (!Array.isArray(points) || points.length === 0) return [];
  const sorted = [...points].sort((a, b) => new Date(a.date) - new Date(b.date));

  return sorted.map((point, i) => {
    const end = dayNumber(point.date);
    const start = end - windowDays + 1;
    let sum = 0;
    let count = 0;
    for (let j = i; j >= 0; j--) {
      const d = dayNumber(sorted[j].date);
      if (d < start) break;
      sum += sorted[j].value;
      count++;
    }
    return { date: point.date, value: count ? Math.round((sum / count) * 100) / 100 : point.value };
  });
};

/** En küçük kareler doğrusu: eğim (birim/gün) ve kesişim döner. */
const linearFit = (points) => {
  const n = points.length;
  if (n < 2) return null;
  const xs = points.map(p => dayNumber(p.date));
  const x0 = xs[0];
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) {
    const x = xs[i] - x0;
    const y = points[i].value;
    sx += x; sy += y; sxy += x * y; sxx += x * x;
  }
  const denom = n * sxx - sx * sx;
  if (denom === 0) return null;
  return { slope: (n * sxy - sx * sy) / denom };
};

/**
 * Gerçek (adaptif) TDEE tahmini.
 *
 * Formül BMR yalnızca bir tahmindir; kişinin gerçek harcaması aktivite, NEAT ve
 * metabolik uyumla değişir. Ölçülen kilo değişimi ile alınan kaloriyi birleştirmek
 * bu farkı doğrudan görünür kılar:
 *
 *   TDEE = ortalama günlük alım − (günlük kilo değişimi × 7700)
 *
 * Kilo düşüyorsa (negatif eğim) harcama alımdan yüksektir, TDEE yukarı çıkar.
 *
 * @returns {null | { tdee, avgIntake, weightChangePerDay, weightChangePerWeek,
 *                    days, confidence, note }}
 */
export const computeAdaptiveTDEE = (metricsHistory = [], nutritionHistory = []) => {
  const weightPoints = (metricsHistory || [])
    .map(m => ({ date: m.date, value: parseNumber(m.weight) }))
    .filter(p => p.date && p.value > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (weightPoints.length < MIN_WEIGHT_POINTS) {
    return { insufficient: true, reason: `En az ${MIN_WEIGHT_POINTS} kilo ölçümü gerekiyor (${weightPoints.length} var).` };
  }

  const firstDay = dayNumber(weightPoints[0].date);
  const lastDay = dayNumber(weightPoints[weightPoints.length - 1].date);
  const days = lastDay - firstDay + 1;

  if (days < MIN_DAYS) {
    return { insufficient: true, reason: `En az ${MIN_DAYS} günlük aralık gerekiyor (${days} gün var).` };
  }

  // Alım verisi yalnızca kilo penceresi içinden alınır.
  //
  // Kalori öğünlerden toplanır. Kayıttaki üst düzey `caloriesIn` alanı hiçbir
  // zaman doldurulmuyordu; buradan okununca her gün 0 çıkıyor ve hiçbir kayıt
  // filtreyi geçemediği için gerçek TDEE hep "yetersiz veri" diyordu.
  const intakes = (nutritionHistory || [])
    .map(n => ({ day: dayNumber(n.date), calories: dailyTotals(n).calories }))
    .filter(n => n.day >= firstDay && n.day <= lastDay && n.calories > 0)
    .map(n => n.calories);

  if (intakes.length < MIN_INTAKE_DAYS) {
    return { insufficient: true, reason: `Bu aralıkta en az ${MIN_INTAKE_DAYS} günlük beslenme kaydı gerekiyor (${intakes.length} var).` };
  }

  // Ham kilo yerine düzeltilmiş seri üzerinden eğim: tek bir şişkin gün
  // trendi bozmasın.
  const smoothed = movingAverage(weightPoints, 7);
  const fit = linearFit(smoothed);
  if (!fit) return { insufficient: true, reason: 'Kilo trendi hesaplanamadı.' };

  const weightChangePerDay = fit.slope;
  const avgIntake = intakes.reduce((a, b) => a + b, 0) / intakes.length;
  const tdee = Math.round(avgIntake - weightChangePerDay * KCAL_PER_KG);

  // Güven: pencere uzunluğu ve beslenme kaydının kapsama oranı.
  const coverage = intakes.length / days;
  let confidence = 'Düşük';
  if (days >= 28 && coverage >= 0.7) confidence = 'Yüksek';
  else if (days >= 21 && coverage >= 0.5) confidence = 'Orta';

  const weeklyChange = weightChangePerDay * 7;
  let note;
  if (Math.abs(weeklyChange) < 0.1) note = 'Kilon sabit — alımın harcamana yakın.';
  else if (weeklyChange > 0) note = `Haftada ${weeklyChange.toFixed(2)} kg alıyorsun.`;
  else note = `Haftada ${Math.abs(weeklyChange).toFixed(2)} kg veriyorsun.`;

  return {
    insufficient: false,
    tdee,
    avgIntake: Math.round(avgIntake),
    weightChangePerDay,
    weightChangePerWeek: Math.round(weeklyChange * 100) / 100,
    days,
    intakeDays: intakes.length,
    confidence,
    note,
  };
};
