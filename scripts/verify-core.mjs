import assert from 'node:assert/strict';
import { computeReadiness } from '../src/utils/readiness.js';
import { dayEnergyBreakdown, theoreticalWeek, estimateMacrosForTef, groupByWeek, buildEnergySeries } from '../src/utils/energyModel.js';
import { calorieDashboard, deriveGoalSet } from '../src/utils/goals.js';
import { mergeWellnessDay, computeSleepScore } from '../src/utils/wellness.js';
import { migrateWeekPlans, removeTemplateFromPlans } from '../src/utils/planMigration.js';
import { suggestNextTarget, mergeWorkout, findMetricsForDate } from '../src/utils/helpers.js';
import { dailyTotals, nutritionDayScore } from '../src/utils/nutritionStats.js';
import { buildPlateauInsights, buildNutritionPerformanceInsight } from '../src/utils/insights.js';
import { resolvePlannedCardioMinutes, isActiveRecoveryCardioDay, isActiveRecoveryEntry, cardioEntryCalories, workoutCalories } from '../src/utils/cardio.js';
import { groupIntoWeeks, groupWeeksIntoMonths } from '../src/utils/dates.js';
import { deloadState } from '../src/utils/deload.js';
import { buildCycleSummary, mergeCycleDay } from '../src/utils/cycle.js';
import { analyzeTemplate } from '../src/utils/templateAssistant.js';
import { sortExercisesForMuscle } from '../src/utils/exerciseSort.js';

const tests = [];
const test = (name, run) => tests.push({ name, run });

test('kas filtresi yüzde 100 izolasyonu bileşik ve yardımcı hareketten önce sıralar', () => {
  const map = {
    Curl: { Biseps: 1, Önkol: 0.25 },
    Chinup: { Kanat: 1, Biseps: 0.5 },
    Row: { Biseps: 0.5, 'Orta Sırt': 1 },
  };
  const result = sortExercisesForMuscle(['Row', 'Chinup', 'Curl'], 'Biseps', name => map[name]);
  assert.deepEqual(result, ['Curl', 'Chinup', 'Row']);
});

test('döngü tahmini başlangıç, bitiş ve gelecek üç dönemi üretir', () => {
  const result = buildCycleSummary([
    { date: '2026-06-01', bleeding: 'medium' },
    { date: '2026-06-29', bleeding: 'medium' },
    { date: '2026-07-27', bleeding: 'medium' },
  ], '2026-08-03', { cycleLength: 28, periodLength: 5 });
  assert.equal(result.nextPeriodStart, '2026-08-24');
  assert.equal(result.nextPeriodEnd, '2026-08-28');
  assert.equal(result.futurePeriods.length, 3);
});

test('saat girmeden 100 üzerinden hızlı uyku puanı kullanılabilir', () => {
  const result = computeSleepScore({ quickScore: 75 });
  assert.equal(result.score, 75);
  assert.equal(result.quick, true);
});

test('kardiyo kaydındaki tarihsel kilo yeni kilodan etkilenmez', () => {
  const entry = { type: 'zone2', minutes: 30, effort: 'moderate', weightAtTime: 70 };
  assert.equal(cardioEntryCalories(entry, 100), cardioEntryCalories(entry, 70));
});

test('ağırlık antrenmanı kalorisi kayıt anındaki kiloyu kullanır', () => {
  const workout = { duration: 3600, weightAtTime: 70, exercises: [] };
  assert.deepEqual(workoutCalories(workout, 100), workoutCalories(workout, 70));
});

test('geçmiş gün için gelecekteki değil o tarihte bilinen son ölçüm seçilir', () => {
  const metric = findMetricsForDate([
    { date: '2026-07-01', weight: 70 },
    { date: '2026-08-01', weight: 80 },
  ], '2026-07-20', { weight: 90 });
  assert.equal(Number(metric.weight), 70);
});

test('enerji serisi kayıt anındaki anlık görüntüyü korur', () => {
  const snapshot = { total: 2400, isRestDay: true, parts: [] };
  const series = buildEnergySeries([{
    date: new Date().toISOString().slice(0, 10),
    meals: [{ calories: 2000, protein: 100, carbs: 200, fats: 60 }],
    energySnapshot: snapshot,
  }], { maintenance: 4000, bmr: 2500 });
  assert.equal(series[0].out, 2400);
});

test('yüksek eklem ağrısı Zirve tavsiyesini engeller', () => {
  const result = computeReadiness({ sleep: 10, stress: 1, soreness: 1, jointPain: 7, carbs: 10 });
  assert.equal(result.rawScore, 87);
  assert.equal(result.score, 59);
  assert.equal(result.zone.key, 'moderate');
  assert.ok(result.safetyReason);
});

test('şiddetli eklem ağrısı Kritik seviyeyi aşamaz', () => {
  const result = computeReadiness({ sleep: 10, stress: 1, soreness: 1, jointPain: 10, carbs: 10 });
  assert.equal(result.score, 39);
  assert.equal(result.zone.key, 'critical');
});

test('adaptif TDEE içindeki ortalama egzersiz iki kez sayılmaz', () => {
  const result = dayEnergyBreakdown({
    maintenance: 3000,
    bmr: 1900,
    lifting: 300,
    // Ortalama egzersiz EPOC dahil 321; bugünkü 300 + 21 EPOC bunun yerini alır.
    avgDailyExercise: 321,
    neatMode: 'auto',
  });
  assert.equal(result.neat, 779);
  assert.equal(result.total, 3000);
});

test('besin girilmediyse termik etki tahmini olarak işaretlenir', () => {
  const estimated = estimateMacrosForTef([], 2500);
  const result = dayEnergyBreakdown({ maintenance: 2500, bmr: 1700, estimatedMacros: estimated });
  assert.equal(result.tefEstimated, true);
  assert.ok(result.tef.total > 0);
  assert.ok(result.parts.find(part => part.key === 'tef').label.includes('Tahmini'));
});

test('teorik rutin TDEE içindeki ortalama egzersizi ikinci kez saymaz ve kardiyoyu gün sayar', () => {
  const result = theoreticalWeek([
    { key: 'mon', label: 'Pazartesi', kcal: 0, cardioKcal: 300 },
    ...['tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(key => ({ key, label: key, kcal: 0, cardioKcal: 0 })),
  ], { maintenance: 3000, plannedCardioKcal: 300, avgDailyExercise: 309 });
  assert.equal(result.trainingDays, 1);
  assert.equal(result.restDays, 6);
  assert.equal(result.days[0].total, 3000);
  assert.equal(result.restDayKcal, 2691);
});

test('boş kardiyo süresi aynı aktivitenin arşiv ortalamasından çözülür', () => {
  const workouts = [
    { date: '2026-07-20', cardio: [{ type: 'zone2', minutes: 20, effort: 'easy' }] },
    { date: '2026-07-27', cardio: [{ type: 'zone2', minutes: 40, effort: 'moderate' }] },
  ];
  const result = resolvePlannedCardioMinutes({ activity: 'zone2', minutes: '' }, workouts, 80);
  assert.equal(result.minutes, 30);
  assert.equal(result.source, 'history');
});

test('elle girilen plan süresi arşiv ortalamasının önüne geçer', () => {
  const workouts = [{ date: '2026-07-20', cardio: [{ type: 'zone2', minutes: 20 }] }];
  const result = resolvePlannedCardioMinutes({ activity: 'zone2', minutes: 55 }, workouts, 80);
  assert.equal(result.minutes, 55);
  assert.equal(result.source, 'manual');
});

test('yalnız eğlence temposu kardiyo aktif off day sayılır ama kalorisi korunur', () => {
  assert.equal(isActiveRecoveryCardioDay(0, [{ type: 'zone2', minutes: 30, effort: 'fun' }]), true);
  assert.equal(isActiveRecoveryCardioDay(1, [{ type: 'zone2', minutes: 30, effort: 'fun' }]), false);
  assert.equal(isActiveRecoveryCardioDay(0, [
    { type: 'zone2', minutes: 30, effort: 'fun' },
    { type: 'zone2', minutes: 30, effort: 'moderate' },
  ]), false);
});

test('aktif off day enerji harcamasını korurken dinlenme olarak etiketlenir', () => {
  const result = dayEnergyBreakdown({ maintenance: 2400, bmr: 1700, cardio: 180, activeRecovery: true });
  assert.equal(result.cardio, 180);
  assert.equal(result.isRestDay, true);
  assert.equal(result.isActiveRest, true);
});

test('kalori panosu günlük toplamı enerji motorundan kullanır', () => {
  const result = calorieDashboard({
    intake: 2400,
    burnedAuto: 300,
    maintenance: 3000,
    targetIntake: 2500,
    totalOut: 3021,
  });
  assert.equal(result.totalOut, 3021);
  assert.equal(result.adjustedTarget, 2521);
  assert.equal(result.balance, -621);
  assert.equal(result.vsTarget, -121);
});

test('eski haftalık plan yeni biçime kayıpsız göçer', () => {
  const migrated = migrateWeekPlans({ weekPlan: { mon: 'push', fri: 'legs' } });
  assert.equal(migrated.plans.length, 1);
  assert.equal(migrated.plans[0].days.mon[0].templateId, 'push');
  assert.equal(migrated.plans[0].days.fri[0].templateId, 'legs');
});

test('şablon silinince bütün program slotlarından kalkar', () => {
  const plans = [{
    id: 'p1', name: 'Plan', days: {
      mon: [{ id: 'a', type: 'workout', templateId: 'gone' }, { id: 'b', type: 'cardio' }],
      tue: [{ id: 'c', type: 'workout', templateId: 'keep' }],
    },
  }];
  const cleaned = removeTemplateFromPlans(plans, 'gone');
  assert.deepEqual(cleaned[0].days.mon.map(s => s.id), ['b']);
  assert.deepEqual(cleaned[0].days.tue.map(s => s.id), ['c']);
});

test('toparlanma yedeği eksik alanlarla güvenli birleşir', () => {
  const day = mergeWellnessDay({ date: '2026-08-01', sleep: { bedTime: '23:30' }, mind: [{ minutes: 12 }] }, () => 'id');
  assert.equal(day.sleep.bedTime, '23:30');
  assert.equal(day.sleep.refreshed, 6);
  assert.equal(day.mind[0].minutes, 12);
});

test('bağlantılı hedefler kilo ve yağ oranından türetilir', () => {
  const result = deriveGoalSet({ goalWeight: 90, goalBodyFat: 15 }, 180);
  assert.equal(result.values.goalFFM, 76.5);
  assert.equal(result.values.goalFFMI, 23.6);
  assert.equal(result.inconsistent, false);
});

test('akıllı progresyon iki başarılı seanstan sonra yük artırır', () => {
  const sets = [{ weight: 100, reps: 10, rir: 2, setType: 'normal' }];
  const target = suggestNextTarget(sets, { repRangeMin: 6, repRangeMax: 10 }, 'Göğüs', {
    history: [{ sets }, { sets }],
    readiness: { score: 75, jointPain: 1 },
  });
  assert.equal(target.weight, 102.5);
  assert.equal(target.reps, 6);
  assert.equal(target.strategy, 'load');
  assert.equal(target.confidence, 'high');
});

test('düşük hazır oluşluk progresyon yerine toparlanma yükü verir', () => {
  const target = suggestNextTarget(
    [{ weight: 100, reps: 8, rir: 2, setType: 'normal' }],
    { repRangeMin: 6, repRangeMax: 10 },
    'Göğüs',
    { readiness: { score: 35, jointPain: 2 } },
  );
  assert.equal(target.weight, 90);
  assert.equal(target.strategy, 'recovery');
});

test('beslenme toplamı mikro değerleri ve öğünleri birlikte toplar', () => {
  const totals = dailyTotals({ meals: [
    { calories: 500, protein: 35, carbs: 55, fats: 15, fiber: 7, sodium: 0.4 },
    { calories: 300, protein: 20, carbs: 30, fats: 8, fiber: 4, sodium: 0.2 },
  ] });
  assert.equal(totals.calories, 800);
  assert.equal(totals.protein, 55);
  assert.equal(totals.fiber, 11);
  assert.ok(Math.abs(totals.sodium - 0.6) < 0.0001);
});

test('günlük beslenme uyumu hedef ve suya göre puanlanır', () => {
  const score = nutritionDayScore({
    totals: { calories: 2450, protein: 150, fiber: 25 },
    targetCalories: 2500,
    targetProtein: 150,
    waterMl: 2800,
    weightKg: 80,
  });
  assert.equal(score.score, 98);
  assert.equal(score.waterTarget, 2800);
  assert.deepEqual(score.next, []);
});

test('plato taraması tek kötü seansta alarm üretmez', () => {
  const workout = (date, weight) => ({ date, exercises: [{ name: 'Bench', sets: [{ weight, reps: 8, rir: 2 }] }] });
  const result = buildPlateauInsights([
    workout('2026-06-01', 100), workout('2026-06-08', 100),
    workout('2026-06-22', 100), workout('2026-06-29', 99),
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].name, 'Bench');
});

test('beslenme performans ilişkisi altı eşleşmeden önce kesin hüküm vermez', () => {
  const workoutsForInsight = Array.from({ length: 5 }, (_, index) => ({
    date: `2026-07-0${index + 1}`, readiness: { score: 60 + index },
  }));
  const nutritionForInsight = workoutsForInsight.map((workout, index) => ({
    date: workout.date, meals: [{ carbs: 200 + index * 10 }],
  }));
  const result = buildNutritionPerformanceInsight(workoutsForInsight, nutritionForInsight, 80);
  assert.equal(result.enough, false);
  assert.equal(result.samples, 5);
});

test('yedekten gelen kardiyo tempo, plan ve not alanlarını korur', () => {
  const workout = mergeWorkout({
    date: '2026-07-12',
    cardio: [{
      id: 'cardio-1', type: 'zone2', minutes: 42, effort: 'easy',
      plannedEffort: 'moderate', plannedMinutes: 35, note: 'Parkur', manualEntry: true,
    }],
  });
  assert.deepEqual(workout.cardio[0], {
    id: 'cardio-1', type: 'zone2', minutes: 42, effort: 'easy',
    plannedEffort: 'moderate', plannedMinutes: 35, note: 'Parkur', manualEntry: true,
  });
});

test('düşük-yük yürüyüş off dayi korur, eğimli yürüyüş ve HIIT korumaz', () => {
  assert.equal(isActiveRecoveryEntry({ type: 'walk', minutes: 45, effort: 'hard' }), true);
  assert.equal(isActiveRecoveryEntry({ type: 'walk_incline', minutes: 45, effort: 'moderate' }), false);
  assert.equal(isActiveRecoveryEntry({ type: 'hiit', minutes: 20, effort: 'fun' }), false);
  assert.equal(isActiveRecoveryEntry({ type: 'walk', minutes: 120, effort: 'easy' }), false);
  assert.equal(isActiveRecoveryCardioDay(0, [
    { type: 'walk', minutes: 30, effort: 'moderate' },
    { type: 'yoga', minutes: 20, effort: 'easy' },
  ]), true);
});

test('ilk kısmi hafta ilk kayıttan pazar gününe kadar etiketlenir', () => {
  const groups = groupIntoWeeks([
    { date: '2026-07-23' },
    { date: '2026-07-21' },
  ]);
  assert.equal(groups[0].partial, true);
  assert.ok(groups[0].label.includes('21'));
  assert.ok(groups[0].label.includes('26'));

  const rows = ['2026-07-21', '2026-07-23'].map(date => ({
    date, intake: 2000, out: 2400, balance: -400, isRestDay: true,
    breakdown: { lifting: 0, cardio: 0, tef: { total: 150 }, epoc: 0 },
  }));
  const energyWeeks = groupByWeek(rows);
  assert.ok(energyWeeks[0].rangeLabel.includes('21'));
  assert.ok(energyWeeks[0].rangeLabel.includes('26'));
});

test('arşiv haftaları başlangıç ayına tek kez yerleşir', () => {
  const weeks = groupIntoWeeks([
    { date: '2026-08-02' },
    { date: '2026-07-27' },
    { date: '2026-07-20' },
  ]);
  const months = groupWeeksIntoMonths(weeks);
  assert.equal(months.length, 1);
  assert.equal(months[0].key, '2026-07');
  assert.equal(months[0].weeks.length, 2);
  assert.equal(months[0].itemCount, 3);
});

test('döngü tavsiyesi takvim fazından değil günlük belirti yükünden değişir', () => {
  const empty = buildCycleSummary([], '2026-08-03');
  assert.equal(empty.severity, 'none');
  assert.equal(empty.hasEntry, false);
  const records = [
    mergeCycleDay({ date: '2026-07-28', bleeding: 'medium', pain: 2, energy: 7 }, () => 'a'),
    mergeCycleDay({ date: '2026-08-03', pain: 8, energy: 2, symptoms: ['fatigue'] }, () => 'b'),
  ];
  const summary = buildCycleSummary(records, '2026-08-03', { cycleLength: 28, periodLength: 5 });
  assert.equal(summary.hasData, true);
  assert.equal(summary.severity, 'high');
  assert.ok(summary.advice.training.includes('%20'));
});

test('şablon asistanı çekiş günündeki bölgesel boşluğu yakalar', () => {
  const result = analyzeTemplate([
    { name: 'Lat Pulldown', sets: Array.from({ length: 4 }, (_, index) => ({ id: index, setType: 'normal' })) },
    { name: 'Barbell Curl', sets: Array.from({ length: 3 }, (_, index) => ({ id: index, setType: 'normal' })) },
  ]);
  assert.equal(result.focusKey, 'pull');
  assert.ok(result.additions.some(item => item.muscle === 'Orta Sırt'));
});

test('deload süresi gün gün ilerler ve süresi dolunca hesaplarda kapanır', () => {
  const active = deloadState({ active: true, startDate: '2026-07-20', days: 7, preset: 'balanced' }, '2026-07-23');
  assert.equal(active.active, true);
  assert.equal(active.dayIndex, 4);
  assert.equal(active.loadScale, 0.9);
  const expired = deloadState({ active: true, startDate: '2026-07-20', days: 7, preset: 'balanced' }, '2026-07-27');
  assert.equal(expired.active, false);
  assert.equal(expired.expired, true);
});

for (const { name, run } of tests) {
  try {
    run();
  } catch (error) {
    console.error(`Başarısız: ${name}`);
    throw error;
  }
}

console.log(`Temel kontroller geçti — ${tests.length} test.`);
