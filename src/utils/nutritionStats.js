// Doğrudan en alt katmandan alınır: bu modül saf hesap kalsın ki tdee.js gibi
// bağımsız modüller de kullanabilsin (helpers üzerinden gitmek constants,
// migrations ve React tarafını içeri çekerdi).
// Uzantı açık: node bu modülü doğrudan çalıştırabilsin.
import { parseNumber } from './number.js';

/**
 * Beslenme istatistikleri.
 *
 * Günlük toplamlar tek bir yerden hesaplanır: hem beslenme sekmesi hem analiz
 * sekmesi buradan okur. Aynı matematiği iki yerde tutmak, birini düzeltip
 * diğerini unutunca sessizce farklı sayılar göstermek demek olurdu.
 */

/** Bir günün öğünlerinden toplam makroları çıkarır. */
export const dailyTotals = (record) => {
  const meals = Array.isArray(record?.meals) ? record.meals : [];
  return meals.reduce((acc, m) => ({
    calories: acc.calories + parseNumber(m.calories),
    protein: acc.protein + parseNumber(m.protein),
    carbs: acc.carbs + parseNumber(m.carbs),
    fats: acc.fats + parseNumber(m.fats),
    fiber: acc.fiber + parseNumber(m.fiber),
    sugars: acc.sugars + parseNumber(m.sugars),
    sodium: acc.sodium + parseNumber(m.sodium),
  }), { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugars: 0, sodium: 0 });
};

/** Makrolardan kalori: protein/karbonhidrat 4, yağ 9 kcal/g. */
export const caloriesFromMacros = (protein, carbs, fats) =>
  Math.round(parseNumber(protein) * 4 + parseNumber(carbs) * 4 + parseNumber(fats) * 9);

/**
 * Tarihe göre artan sıralı günlük seri. Yalnızca gerçekten kayıt girilmiş
 * günler döner — boş günleri 0 kalori saymak ortalamaları yanlış düşürürdü.
 */
export const buildNutritionSeries = (nutritionHistory = []) =>
  [...nutritionHistory]
    .map(rec => ({ date: rec.date, ...dailyTotals(rec) }))
    .filter(d => d.calories > 0 || d.protein > 0 || d.carbs > 0 || d.fats > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

/** Serinin son `days` günündeki kayıtların ortalaması. */
export const averageOverDays = (series = [], days = 7) => {
  if (series.length === 0) return null;
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (days - 1));

  const window = series.filter(d => new Date(d.date) >= cutoff);
  if (window.length === 0) return null;

  const sum = window.reduce((acc, d) => ({
    calories: acc.calories + d.calories,
    protein: acc.protein + d.protein,
    carbs: acc.carbs + d.carbs,
    fats: acc.fats + d.fats,
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  return {
    days: window.length,
    calories: Math.round(sum.calories / window.length),
    protein: Math.round(sum.protein / window.length),
    carbs: Math.round(sum.carbs / window.length),
    fats: Math.round(sum.fats / window.length),
  };
};

/**
 * Makroların kaloriye katkı yüzdesi.
 *
 * Girilen kalori değeri değil, makrolardan türetilen kalori taban alınır:
 * kullanıcı kaloriyi elle farklı girdiyse yüzdelerin toplamı 100 olmazdı.
 */
export const macroSplit = (totals) => {
  if (!totals) return null;
  const pKcal = parseNumber(totals.protein) * 4;
  const cKcal = parseNumber(totals.carbs) * 4;
  const fKcal = parseNumber(totals.fats) * 9;
  const base = pKcal + cKcal + fKcal;
  if (base <= 0) return null;
  return {
    protein: Math.round((pKcal / base) * 100),
    carbs: Math.round((cKcal / base) * 100),
    fats: Math.round((fKcal / base) * 100),
  };
};

/** Kilo başına protein — hedefle karşılaştırmak için. */
export const proteinPerKg = (protein, weightKg) => {
  const w = parseNumber(weightKg);
  if (w <= 0) return null;
  return Math.round((parseNumber(protein) / w) * 100) / 100;
};

/**
 * Seride kaç günün hedef kalori aralığında kaldığını sayar.
 * Aralık, hedefin ±%10'u kabul edilir (günlük dalgalanma normal).
 */
export const adherenceStats = (series = [], targetCalories = 0, days = 30) => {
  if (!(targetCalories > 0) || series.length === 0) return null;
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (days - 1));

  const window = series.filter(d => new Date(d.date) >= cutoff);
  if (window.length === 0) return null;

  const low = targetCalories * 0.9;
  const high = targetCalories * 1.1;
  let under = 0;
  let onTarget = 0;
  let over = 0;
  window.forEach(d => {
    if (d.calories < low) under += 1;
    else if (d.calories > high) over += 1;
    else onTarget += 1;
  });

  return {
    logged: window.length,
    under,
    onTarget,
    over,
    onTargetPct: Math.round((onTarget / window.length) * 100),
  };
};

/**
 * Günlük kayıt uyumu. Bu bir "besin sağlıklı mı?" puanı değildir; yalnızca
 * kullanıcının kendi kalori/protein/su hedeflerine ne kadar yaklaştığını söyler.
 * Lif verisi yoksa kullanıcı cezalandırılmaz ve puan kalan üç başlığa dağıtılır.
 */
export const nutritionDayScore = ({
  totals,
  targetCalories = 0,
  targetProtein = 0,
  waterMl = 0,
  weightKg = 0,
} = {}) => {
  if (!totals || parseNumber(totals.calories) <= 0) return null;

  const closeness = (value, target, tolerance) => {
    if (!(target > 0)) return null;
    const difference = Math.abs(parseNumber(value) - target) / target;
    return Math.max(0, Math.min(1, 1 - difference / tolerance));
  };

  const calorie = closeness(totals.calories, parseNumber(targetCalories), 0.35);
  const proteinTarget = parseNumber(targetProtein);
  const protein = proteinTarget > 0
    ? Math.max(0, Math.min(1, parseNumber(totals.protein) / proteinTarget))
    : null;
  const waterTarget = parseNumber(weightKg) > 0 ? Math.round(parseNumber(weightKg) * 35) : 2500;
  const water = Math.max(0, Math.min(1, parseNumber(waterMl) / waterTarget));
  const fiberKnown = parseNumber(totals.fiber) > 0;
  const fiber = fiberKnown ? Math.max(0, Math.min(1, parseNumber(totals.fiber) / 25)) : null;

  const pieces = [
    { value: calorie, weight: 35 },
    { value: protein, weight: 35 },
    { value: water, weight: 15 },
    { value: fiber, weight: 15 },
  ].filter(piece => piece.value !== null);
  const totalWeight = pieces.reduce((sum, piece) => sum + piece.weight, 0);
  const score = totalWeight > 0
    ? Math.round(pieces.reduce((sum, piece) => sum + piece.value * piece.weight, 0) / totalWeight * 100)
    : 0;

  const label = score >= 85 ? 'Çok iyi' : score >= 65 ? 'İyi' : score >= 45 ? 'Geliştirilebilir' : 'Eksik';
  const next = [];
  if (calorie !== null && calorie < 0.65) next.push('kalori hedefi');
  if (protein !== null && protein < 0.8) next.push('protein');
  if (water < 0.8) next.push('su');
  if (fiberKnown && fiber < 0.75) next.push('lif');

  return {
    score,
    label,
    next: next.slice(0, 2),
    waterTarget,
    fiberKnown,
  };
};
