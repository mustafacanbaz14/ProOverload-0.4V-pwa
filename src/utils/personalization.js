import { MUSCLE_GROUPS, getVolumeLandmarks } from './constants.js';
import { detectMuscleGroup, estimate1RM, isWorkingSet, parseNumber } from './helpers.js';
import { toLocalDate } from './dates.js';

const mondayKey = (value) => {
  const d = toLocalDate(value);
  if (!d) return '';
  const copy = new Date(d);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - day + (day === 0 ? -6 : 1));
  return `${copy.getFullYear()}-${String(copy.getMonth() + 1).padStart(2, '0')}-${String(copy.getDate()).padStart(2, '0')}`;
};

const completedWeekKeys = (count = 4) => {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() - (i + 1) * 7);
    return mondayKey(d);
  }).reverse();
};

/**
 * Son dört TAM haftayı kullanarak kasa özel, kişisel hacim aralığı üretir.
 * Evrensel MEV/MRV yerine geçmez; kullanıcının gerçekten tolere ettiği hacmi,
 * hazır oluşluğu ve performans yönünü bir araya getiren ikinci bir rehberdir.
 */
export const buildPersonalVolumeGuidance = (
  workouts = [],
  customExercises = [],
  experienceLevel = 'intermediate',
) => {
  const weeks = completedWeekKeys(4);
  const volume = Object.fromEntries(MUSCLE_GROUPS.map(m => [m, Object.fromEntries(weeks.map(w => [w, 0]))]));
  const strength = Object.fromEntries(MUSCLE_GROUPS.map(m => [m, []]));

  const readinessScores = [];
  (workouts || []).forEach(workout => {
    const wk = mondayKey(workout.date);
    if (!weeks.includes(wk)) return;
    const readiness = parseNumber(workout.readiness?.score);
    if (readiness > 0) readinessScores.push(readiness);

    (workout.exercises || []).forEach(exercise => {
      const detected = detectMuscleGroup(exercise.name, customExercises);
      const working = (exercise.sets || []).filter(isWorkingSet);
      Object.entries(detected.contributions || {}).forEach(([muscle, coefficient]) => {
        if (volume[muscle]) volume[muscle][wk] += working.length * coefficient;
      });
      const best = working.reduce((max, set) => Math.max(max, estimate1RM(set.weight, set.reps, set.rir)), 0);
      if (best > 0 && strength[detected.muscle]) strength[detected.muscle].push({ date: workout.date, value: best });
    });
  });

  const readinessAvg = readinessScores.length
    ? readinessScores.reduce((sum, score) => sum + score, 0) / readinessScores.length
    : null;

  return Object.fromEntries(MUSCLE_GROUPS.map(muscle => {
    const values = weeks.map(week => Math.round((volume[muscle][week] || 0) * 4) / 4);
    const activeWeeks = values.filter(value => value > 0);
    if (activeWeeks.length < 2) return [muscle, null];

    const average = activeWeeks.reduce((sum, value) => sum + value, 0) / activeWeeks.length;
    const history = strength[muscle].sort((a, b) => new Date(a.date) - new Date(b.date));
    const first = history[0]?.value || 0;
    const last = history[history.length - 1]?.value || 0;
    const strengthChange = first > 0 && history.length >= 2 ? ((last - first) / first) * 100 : null;

    let factor = 1;
    let reason = 'Son haftalarda bu hacmi tolere edip performansı korudun.';
    if (readinessAvg !== null && readinessAvg < 50) {
      factor = 0.85;
      reason = 'Hazır oluşluk ortalaman düşük; kişisel aralık toparlanma için azaltıldı.';
    } else if (strengthChange !== null && strengthChange < -1) {
      factor = 0.9;
      reason = 'Tahmini güç eğilimi geriliyor; önce daha düşük hacimde toparlan.';
    } else if (strengthChange !== null && strengthChange < 0.5 && (readinessAvg ?? 65) >= 65) {
      factor = 1.08;
      reason = 'Toparlanman yeterli fakat performans yatay; küçük bir hacim artışı denenebilir.';
    } else if (strengthChange !== null && strengthChange >= 1) {
      reason = 'Performans yükseliyor; çalışan hacmi şimdilik korumak en mantıklısı.';
    }

    const base = getVolumeLandmarks(muscle, experienceLevel);
    const center = Math.max(base.mev, Math.min(base.mrv, average * factor));
    const low = Math.max(base.mev, Math.round(center - 1));
    const high = Math.max(low, Math.min(base.mrv, Math.round(center + 1)));

    return [muscle, {
      low,
      high,
      average: Math.round(average * 10) / 10,
      readinessAvg: readinessAvg === null ? null : Math.round(readinessAvg),
      strengthChange: strengthChange === null ? null : Math.round(strengthChange * 10) / 10,
      confidence: activeWeeks.length === 4 && readinessScores.length >= 4 ? 'high' : 'medium',
      reason,
    }];
  }));
};
