import { MUSCLE_GROUPS, getVolumeLandmarks } from './constants';
import { previewTemplateVolume, estimateDuration } from './templates';
import { estimateLiftingCalories } from './cardio';

export const WEEKDAYS = [
  { key: 'mon', label: 'Pazartesi', short: 'Pzt' },
  { key: 'tue', label: 'Salı', short: 'Sal' },
  { key: 'wed', label: 'Çarşamba', short: 'Çar' },
  { key: 'thu', label: 'Perşembe', short: 'Per' },
  { key: 'fri', label: 'Cuma', short: 'Cum' },
  { key: 'sat', label: 'Cumartesi', short: 'Cmt' },
  { key: 'sun', label: 'Pazar', short: 'Paz' },
];

/**
 * Haftalık planın teorik hacmini çıkarır.
 *
 * "Teorik" çünkü şablonlarda RIR yok: her set etkili sayılır. Gerçek hafta bunun
 * altında kalır, o yüzden buradaki sayı bir üst sınırdır ve plan kurarken
 * "en iyi ihtimalle şu kadar" diye okunmalıdır.
 *
 * @param plan  { mon: templateId|null, ... }
 * @param templates şablon listesi
 */
export const computeWeekPlan = (plan = {}, templates = [], {
  customExercises = [],
  restSeconds = 120,
  experienceLevel = 'intermediate',
  weightKg = 0,
} = {}) => {
  const byId = new Map(templates.map(t => [t.id, t]));

  const days = WEEKDAYS.map(d => {
    const template = byId.get(plan[d.key]) || null;
    if (!template) return { ...d, template: null, sets: 0, minutes: 0, kcal: 0 };
    const { totalSets } = previewTemplateVolume(template.exercises, customExercises);
    const minutes = totalSets > 0 ? estimateDuration(template.exercises, restSeconds) : 0;
    return {
      ...d,
      template,
      sets: totalSets,
      minutes,
      kcal: estimateLiftingCalories(minutes, weightKg),
    };
  });

  // Hacimler gün gün toplanır.
  const muscleVolume = {};
  days.forEach(d => {
    if (!d.template) return;
    const { byMuscle } = previewTemplateVolume(d.template.exercises, customExercises);
    Object.entries(byMuscle).forEach(([muscle, vol]) => {
      muscleVolume[muscle] = Math.round(((muscleVolume[muscle] || 0) + vol) * 4) / 4;
    });
  });

  // Her kas için durum. Sıra MUSCLE_GROUPS'tan gelir ki liste hep aynı düzende olsun.
  const statuses = MUSCLE_GROUPS.map(muscle => {
    const volume = muscleVolume[muscle] || 0;
    const { mev, mav, mrv } = getVolumeLandmarks(muscle, experienceLevel);
    let status = 'none';
    if (volume === 0) status = 'none';
    else if (volume < mev) status = 'under';
    else if (volume <= mav) status = 'optimal';
    else if (volume <= mrv) status = 'high';
    else status = 'over';
    return { muscle, volume, mev, mav, mrv, status };
  });

  const trainingDays = days.filter(d => d.template).length;

  return {
    days,
    muscleVolume,
    statuses,
    trainingDays,
    offDays: 7 - trainingDays,
    totalSets: days.reduce((s, d) => s + d.sets, 0),
    totalMinutes: days.reduce((s, d) => s + d.minutes, 0),
    totalKcal: days.reduce((s, d) => s + d.kcal, 0),
    untrained: statuses.filter(s => s.status === 'none').map(s => s.muscle),
    under: statuses.filter(s => s.status === 'under').map(s => s.muscle),
    optimal: statuses.filter(s => s.status === 'optimal').map(s => s.muscle),
    over: statuses.filter(s => s.status === 'over').map(s => s.muscle),
  };
};

/** Tek bir şablonun haftalık hedefe göre durumunu çıkarır. */
export const templateMuscleStatuses = (template, {
  customExercises = [],
  experienceLevel = 'intermediate',
} = {}) => {
  const { byMuscle } = previewTemplateVolume(template?.exercises || [], customExercises);
  return Object.entries(byMuscle)
    .map(([muscle, volume]) => {
      const { mev, mav, mrv } = getVolumeLandmarks(muscle, experienceLevel);
      return { muscle, volume, mev, mav, mrv, weeklyShare: Math.round((volume / mav) * 100) };
    })
    .sort((a, b) => b.volume - a.volume);
};

export const STATUS_LABEL = {
  none: 'Hiç çalışılmıyor',
  under: 'MEV altında',
  optimal: 'Verimli aralık',
  high: 'Yüksek',
  over: 'Tavanın üstünde',
};

export const STATUS_COLOR = {
  none: 'text-zinc-500 border-zinc-800 bg-zinc-950',
  under: 'text-cyan-400 border-cyan-900/50 bg-cyan-950/25',
  optimal: 'text-emerald-400 border-emerald-900/50 bg-emerald-950/25',
  high: 'text-amber-400 border-amber-900/50 bg-amber-950/25',
  over: 'text-orange-400 border-orange-900/50 bg-orange-950/25',
};
