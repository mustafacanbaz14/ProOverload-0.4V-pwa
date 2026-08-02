import { MUSCLE_GROUPS, getVolumeLandmarks, volumeStatusOf, VOLUME_STATUS } from './constants';
import { previewTemplateVolume, estimateDuration } from './templates';
import {
  estimateLiftingCalories, findActivity, findEffort,
  estimateCardioCalories, cardioFatigueLoad, resolvePlannedCardioMinutes,
  isActiveRecoveryCardioDay, DEFAULT_EFFORT,
} from './cardio';
import { parseNumber } from './number';
import { normalizeDays } from './planMigration';

export { normalizeDays };

export const WEEKDAYS = [
  { key: 'mon', label: 'Pazartesi', short: 'Pzt' },
  { key: 'tue', label: 'Salı', short: 'Sal' },
  { key: 'wed', label: 'Çarşamba', short: 'Çar' },
  { key: 'thu', label: 'Perşembe', short: 'Per' },
  { key: 'fri', label: 'Cuma', short: 'Cum' },
  { key: 'sat', label: 'Cumartesi', short: 'Cmt' },
  { key: 'sun', label: 'Pazar', short: 'Paz' },
];

// Göç ve gün normalleştirme ayrı bir yaprak modülde (döngüsel import olmasın);
// buradan yeniden dışa aktarılıyor ki çağıranlar tek yerden alsın.
export { migrateWeekPlans, emptyPlan, findPlan } from './planMigration';

/* ------------------------------------------------------------------ *
 *  HESAP
 * ------------------------------------------------------------------ */

/** Slotları saate göre sıralar; saati girilmemiş olanlar sona gider. */
const saateGore = (slots = []) => [...slots].sort((a, b) =>
  (a.time || '99:99').localeCompare(b.time || '99:99'));

/**
 * Haftalık planın teorik hacmi, süresi, kalorisi ve yorgunluğu.
 *
 * "Teorik" çünkü şablonlarda RIR yok: her set etkili sayılır. Gerçek hafta
 * bunun altında kalır, yani buradaki sayı bir üst sınırdır.
 *
 * @param plan { days: { mon: [slot, ...], ... } } — eski `{mon: id}` biçimi de kabul edilir
 */
export const computeWeekPlan = (plan = {}, templates = [], {
  customExercises = [],
  restSeconds = 120,
  experienceLevel = 'intermediate',
  weightKg = 0,
  workouts: historyWorkouts = [],
} = {}) => {
  const byId = new Map(templates.map(t => [t.id, t]));
  // Kas -> haftanın tamamındaki katkı satırları (hangi gün, hangi şablon,
  // hangi hareket, kaç set). Gün döngüsünün dışında duruyor çünkü aynı kas
  // birden fazla günden besleniyor.
  const muscleDetail = {};
  const days = normalizeDays(plan?.days || plan);

  const gunler = WEEKDAYS.map(d => {
    const slots = saateGore(days[d.key]);

    let sets = 0;
    let minutes = 0;
    let kcal = 0;
    let cardioKcal = 0;
    let cardioMinutes = 0;
    let fatigue = 0;
    const byMuscle = {};
    const workouts = [];
    const cardios = [];

    slots.forEach(slot => {
      if (slot.type === 'cardio') {
        const act = findActivity(slot.activity);
        if (!act) return;
        const resolved = resolvePlannedCardioMinutes(slot, historyWorkouts, weightKg);
        const dk = Math.max(0, parseNumber(resolved.minutes));
        if (dk <= 0) return;
        const effort = findEffort(slot.effort || DEFAULT_EFFORT);
        const k = estimateCardioCalories(act.met * effort.met, weightKg, dk);
        cardioKcal += k;
        cardioMinutes += dk;
        minutes += dk;
        fatigue += cardioFatigueLoad({ type: slot.activity, minutes: dk, effort: effort.key });
        cardios.push({
          ...slot,
          activity: act,
          effortInfo: effort,
          minutes: dk,
          minuteSource: resolved.source,
          historyStats: resolved.stats,
          kcal: k,
        });
        return;
      }

      const template = byId.get(slot.templateId);
      if (!template) return;
      const { totalSets, byMuscle: m, detailByMuscle } = previewTemplateVolume(template.exercises, customExercises);
      const tahmin = totalSets > 0 ? estimateDuration(template.exercises, restSeconds) : 0;
      // Slotta süre elle verilmişse (saatli plan) o kullanılır.
      const sure = parseNumber(slot.minutes) > 0 ? parseNumber(slot.minutes) : tahmin;
      sets += totalSets;
      minutes += sure;
      kcal += estimateLiftingCalories(sure, weightKg);
      // Ağırlık antrenmanının yorgunluğu set sayısıyla ölçeklenir: seans uzasa
      // bile dinlenmeyle geçen dakikalar toparlanmayı zorlamıyor.
      fatigue += Math.round(totalSets * 1.5);
      Object.entries(m).forEach(([kas, vol]) => { byMuscle[kas] = (byMuscle[kas] || 0) + vol; });
      // Hangi hareketin hangi kasa kaç set yazdığı gün ve şablon adıyla birlikte
      // biriktiriliyor; haftalık dökümde satır satır açılabilsin diye.
      Object.entries(detailByMuscle).forEach(([kas, liste]) => {
        const hedef = muscleDetail[kas] || (muscleDetail[kas] = []);
        liste.forEach(item => hedef.push({
          ...item, day: d.key, dayLabel: d.label, templateName: template.name,
        }));
      });
      workouts.push({ ...slot, template, sets: totalSets, minutes: sure });
    });

    // Yalnızca eğlence temposundaki kardiyo, kalori harcatsa da toparlanma
    // takviminde "aktif dinlenme" sayılır. Ağırlık veya daha sert kardiyo varsa
    // gün normal antrenman günüdür.
    const isActiveRest = isActiveRecoveryCardioDay(workouts.length, cardios);
    const isOffDay = slots.length === 0 || isActiveRest;

    return {
      ...d,
      slots,
      workouts,
      cardios,
      // Geriye dönük uyum: eskiden gün tek şablon taşıyordu.
      template: workouts[0]?.template || null,
      sets,
      minutes,
      kcal,
      cardioKcal,
      cardioMinutes,
      fatigue,
      byMuscle,
      totalKcal: kcal + cardioKcal,
      isActiveRest,
      isOffDay,
    };
  });

  // Hacimler gün gün toplanır.
  const muscleVolume = {};
  gunler.forEach(d => {
    Object.entries(d.byMuscle).forEach(([muscle, vol]) => {
      muscleVolume[muscle] = Math.round(((muscleVolume[muscle] || 0) + vol) * 4) / 4;
    });
  });

  // Her kas için durum. Sıra MUSCLE_GROUPS'tan gelir ki liste hep aynı düzende olsun.
  const statuses = MUSCLE_GROUPS.map(muscle => {
    const volume = muscleVolume[muscle] || 0;
    const { mev, mav, mrv } = getVolumeLandmarks(muscle, experienceLevel);
    return {
      muscle, volume, mev, mav, mrv,
      status: volumeStatusOf(volume, muscle, experienceLevel),
      // En çok katkı veren hareket üstte: hacim kısılacaksa ya da eklenecekse
      // ilk bakılacak yer orası.
      sources: (muscleDetail[muscle] || []).slice().sort((a, b) => b.volume - a.volume),
    };
  });

  const trainingDays = gunler.filter(d => !d.isOffDay).length;
  const activeRecoveryDays = gunler.filter(d => d.isActiveRest).length;

  return {
    days: gunler,
    muscleVolume,
    statuses,
    trainingDays,
    offDays: 7 - trainingDays,
    activeRecoveryDays,
    totalSets: gunler.reduce((s, d) => s + d.sets, 0),
    totalMinutes: gunler.reduce((s, d) => s + d.minutes, 0),
    totalKcal: gunler.reduce((s, d) => s + d.kcal, 0),
    totalCardioKcal: gunler.reduce((s, d) => s + d.cardioKcal, 0),
    totalFatigue: gunler.reduce((s, d) => s + d.fatigue, 0),
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
