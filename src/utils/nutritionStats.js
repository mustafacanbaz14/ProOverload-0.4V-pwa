import { parseNumber } from './helpers';

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
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
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
