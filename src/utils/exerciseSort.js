import { foldForSearch } from './helpers.js';

/** Seçili kas için 0–1 katkı ve izolasyon/bileşik sınıfı. */
export const exerciseMuscleRank = (name, muscle, getContributions) => {
  const contributions = getContributions(name) || {};
  const weight = Number(contributions[muscle]) || 0;
  const meaningfulTargets = Object.values(contributions).filter(value => Number(value) >= 0.5).length;
  return {
    weight,
    // Örn. lateral raise'deki 0.25 trapez katkısı hareketi bileşik yapmaz;
    // bench'teki iki ayrı >=0.5 katkı ise bileşik hareket işaretidir.
    isolation: weight === 1 && meaningfulTargets === 1,
  };
};

/** %100 izolasyon → %100 bileşik → %50 → %25 → alfabetik. */
export const sortExercisesForMuscle = (names, muscle, getContributions) => {
  if (!muscle || muscle === 'Tümü') return [...names];
  return [...names].sort((a, b) => {
    const ra = exerciseMuscleRank(a, muscle, getContributions);
    const rb = exerciseMuscleRank(b, muscle, getContributions);
    if (ra.weight !== rb.weight) return rb.weight - ra.weight;
    if (ra.weight === 1 && ra.isolation !== rb.isolation) return ra.isolation ? -1 : 1;
    return foldForSearch(a).localeCompare(foldForSearch(b), 'tr');
  });
};

export const exerciseRankLabel = ({ weight, isolation }) => {
  if (weight === 1) return `%100 · ${isolation ? 'İzolasyon' : 'Bileşik'}`;
  if (weight > 0) return `%${Math.round(weight * 100)} · İkincil katkı`;
  return 'Katkı yok';
};
