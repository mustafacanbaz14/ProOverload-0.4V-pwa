import { MUSCLE_GROUPS, getVolumeLandmarks, volumeStatusOf, VOLUME_STATUS } from './constants';
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
    return { muscle, volume, mev, mav, mrv, status: volumeStatusOf(volume, muscle, experienceLevel) };
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

// Etiketler ve renkler VOLUME_STATUS'tan gelir; haftalık planda "hiç
// çalışılmıyor" ifadesi daha net olduğu için yalnızca o metin özelleştirilir.
export const STATUS_LABEL = Object.fromEntries(
  Object.entries(VOLUME_STATUS).map(([key, v]) => [key, key === 'none' ? 'Hiç çalışılmıyor' : v.label]));

export const STATUS_COLOR = Object.fromEntries(
  Object.entries(VOLUME_STATUS).map(([key, v]) => [key, v.chip]));
