import {
  EXERCISE_RULES, STORAGE_VERSION, STORAGE_VERSIONS, DEFAULT_SETTINGS,
  SET_TYPE_KEYS, SMALL_MUSCLE_GROUPS
} from './constants.js';
import { migrateCustomExercises, normalizeMuscleName } from './migrations.js';
import { migrateWeekPlans } from './planMigration.js';
import { parseNumber } from './number.js';
import { mergeWellnessDay } from './wellness.js';

/** Yazma daima en yeni sürüm anahtarına yapılır. */
export const storageKey = (name) => `po_${name}${STORAGE_VERSION}`;

export const generateId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

export const getLocalDateString = (date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

export const getMondayOfCurrentWeek = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// Katkı tablosundaki en yüksek ağırlıklı kas, hareketin birincil hedefidir.
const primaryFrom = (contributions) => {
  let best = null;
  let bestWeight = -1;
  for (const [muscle, weight] of Object.entries(contributions || {})) {
    if (weight > bestWeight) { best = muscle; bestWeight = weight; }
  }
  return best || 'Diğer';
};

/**
 * Hareket adından kas katkılarını çıkarır.
 * @returns {{ muscle: string, mechanics: string, contributions: Record<string, number> }}
 *   contributions: kas -> ağırlık (1 birincil, 0.5 belirgin yardımcı, 0.25 hafif)
 */
export const detectMuscleGroup = (name, customList = []) => {
  const customEx = customList.find(ex => (typeof ex === 'object' ? ex.name === name : ex === name));
  // Koruma hem contributions hem muscle'ı kabul eder: yalnızca contributions
  // taşıyan bir kayıt buradan düşerse kullanıcının açık eşlemesi yok sayılıp
  // regex tablosuna geri dönülürdü.
  if (customEx && typeof customEx === 'object' && (customEx.contributions || customEx.muscle)) {
    const raw = customEx.contributions || {
      ...(customEx.muscle ? { [customEx.muscle]: 1 } : {}),
      ...Object.fromEntries((customEx.secondary || []).map(m => [m, 0.5]))
    };
    // Göçten kaçmış bir kayıt bile geçersiz anahtar üretemesin.
    const contributions = {};
    for (const [rawMuscle, weight] of Object.entries(raw)) {
      const muscle = normalizeMuscleName(rawMuscle);
      if (muscle) contributions[muscle] = Math.max(contributions[muscle] || 0, weight);
    }
    return {
      muscle: primaryFrom(contributions),
      mechanics: customEx.mechanics || 'Diğer',
      contributions
    };
  }

  const lower = (name || '').toLowerCase();
  for (const [pattern, mechanics, contributions] of EXERCISE_RULES) {
    if (pattern.test(lower)) {
      return { muscle: primaryFrom(contributions), mechanics, contributions };
    }
  }
  return { muscle: 'Diğer', mechanics: 'Diğer', contributions: {} };
};

export const foldForSearch = (text) => String(text || '')
  .replace(/[İIı]/g, 'i')
  .toLowerCase();

// parseNumber en alt katmanda (number.js) duruyor; saf hesap modülleri onu
// uygulamanın geri kalanını içeri çekmeden kullanabilsin diye. Mevcut
// `from './helpers'` import'ları bozulmasın diye buradan yeniden dışa aktarılır.
export { parseNumber };

/**
 * Sayıyı verilen aralığa çeker.
 *
 * Boş girdi boş kalır: kullanıcı alanı silip yeniden yazarken her tuşta
 * alt sınıra zıplamamalı. Sınırlama yalnızca gerçek bir değer varken uygulanır.
 */
export const clampNumber = (val, min, max) => {
  if (val === '' || val === null || val === undefined) return '';
  const num = parseNumber(val);
  return Math.min(max, Math.max(min, num));
};

/**
 * Sayısal alanlar için ortak sınırlar.
 *
 * Amaç yazım hatasını yakalamak değil, absürt değerlerin hesaplara sızmasını
 * engellemek: negatif kilo/boy vücut kompozisyonunda negatif yağ ve kas kütlesi
 * üretiyordu ve ekranda geçerli bir sayı gibi görünüyordu.
 */
export const INPUT_LIMITS = {
  weight: { min: 0, max: 500 },
  reps: { min: 0, max: 100 },
  rir: { min: 0, max: 10 },
  macro: { min: 0, max: 1000 },
  calories: { min: 0, max: 20000 },
  bodyWeight: { min: 20, max: 400 },
  height: { min: 100, max: 250 },
  age: { min: 10, max: 100 },
  measurement: { min: 0, max: 300 },
  skinfold: { min: 0, max: 100 },
  minutes: { min: 0, max: 600 },
};

export const mergeMetrics = (data) => ({
  id: data?.id || generateId(),
  date: data?.date || getLocalDateString(),
  gender: data?.gender || 'male', age: data?.age || 25, height: data?.height || 175, weight: data?.weight || 75,
  method: data?.method || '3', bodyFat: data?.bodyFat || '',
  fatPreference: data?.fatPreference || 'manual',
  measurements: {
    neck: data?.measurements?.neck || '', shoulder: data?.measurements?.shoulder || '', chest: data?.measurements?.chest || '',
    arm: data?.measurements?.arm || '', waist: data?.measurements?.waist || '', hip: data?.measurements?.hip || '',
    thigh: data?.measurements?.thigh || '', calf: data?.measurements?.calf || '', wrist: data?.measurements?.wrist || ''
  },
  skinfolds: {
    chest: data?.skinfolds?.chest || '', abdomen: data?.skinfolds?.abdomen || '', thigh: data?.skinfolds?.thigh || '',
    triceps: data?.skinfolds?.triceps || '', suprailiac: data?.skinfolds?.suprailiac || '', axilla: data?.skinfolds?.axilla || '',
    subscapular: data?.skinfolds?.subscapular || ''
  }
});

export const mergeNutrition = (data) => ({
  id: data?.id || generateId(),
  date: data?.date || getLocalDateString(),
  dayType: data?.dayType || 'training',
  // 'daily' = günün toplam makroları tek seferde girilmiş (başka bir uygulamada
  // sayılmış olabilir). Eski kayıtlarda alan yok, öğün moduna düşerler.
  entryMode: data?.entryMode === 'daily' ? 'daily' : 'meals',
  activeCaloriesOut: data?.activeCaloriesOut || '', bmrAtTheTime: data?.bmrAtTheTime || 0,
  // Adım sayısı: NEAT 'steps' modunda günlük hareket buradan hesaplanır.
  steps: data?.steps || '',
  // Günlük su tüketimi beslenme kaydına aittir; geçmiş günler ayrı ayrı
  // düzenlenebilir. Eski kayıtlarda alan yoksa boş başlar.
  waterMl: data?.waterMl || '',
  caloriesIn: data?.caloriesIn || 0, protein: data?.protein || 0, carbs: data?.carbs || 0, fats: data?.fats || 0,
  meals: Array.isArray(data?.meals) && data.meals.length > 0 ? data.meals : [{ id: generateId(), name: '1. Öğün', calories: '', protein: '', carbs: '', fats: '' }]
});

/**
 * Tek bir seti güvenli şekle sokar.
 *
 * İçe aktarılan yedeklerde set nesnesi eksik alanlı ya da tümden bozuk
 * (string, null) gelebiliyor; hacim ve tonaj hesapları bu alanların varlığına
 * güveniyor.
 */
const mergeSet = (set) => ({
  id: set?.id || generateId(),
  weight: set?.weight ?? '',
  reps: set?.reps ?? '',
  rir: set?.rir ?? 2,
  tempo: set?.tempo || '',
  formRating: set?.formRating ?? 8,
  setType: SET_TYPE_KEYS.includes(set?.setType) ? set.setType : 'normal',
});

const mergeExercise = (ex) => ({
  // Ad, antrenman kayıtlarını hareket veritabanına bağlayan tek anahtar;
  // boş kalırsa kas eşlemesi hiç bulunamaz.
  name: typeof ex?.name === 'string' && ex.name.trim() ? ex.name : 'Bilinmeyen Hareket',
  id: ex?.id || generateId(),
  sets: Array.isArray(ex?.sets) ? ex.sets.map(mergeSet) : [],
  ...(ex?.supersetId ? { supersetId: ex.supersetId } : {}),
});

/**
 * İçe aktarılan antrenman kaydını normalleştirir.
 *
 * `mergeMetrics`/`mergeNutrition` ile aynı kalıp: yedek dosyası bozuk şekilli
 * geldiğinde (`workouts: [{}]` gibi) doğrudan state'e girip aşağıda
 * `ex.sets.filter` çağrılarını patlatmasın diye tüm alanlar garanti altına alınır.
 */
export const mergeWorkout = (data) => ({
  id: data?.id || generateId(),
  date: data?.date || getLocalDateString(),
  name: typeof data?.name === 'string' && data.name.trim() ? data.name : 'Serbest Antrenman',
  duration: Number(data?.duration) > 0 ? Number(data.duration) : 0,
  exercises: Array.isArray(data?.exercises) ? data.exercises.map(mergeExercise) : [],
  cardio: Array.isArray(data?.cardio)
    ? data.cardio
      .filter(c => c && typeof c.type === 'string')
      .map(c => ({ id: c.id || generateId(), type: c.type, minutes: Number(c.minutes) || 0 }))
    : [],
  // rating ACWR yük hesabına giriyor (App.jsx dashboardStats); düşerse geçmiş
  // yük eğrisi sessizce değişir, bu yüzden varsayılanı oradaki fallback ile aynı.
  rating: Number(data?.rating) > 0 ? Number(data.rating) : 3,
  notes: typeof data?.notes === 'string' ? data.notes : '',
  timer: { status: 'finished' },
  ...(data?.readiness ? { readiness: data.readiness } : {}),
});

/** Şablonun antrenmandan tek farkı tarih değil ad taşıması. */
export const mergeTemplate = (data) => ({
  id: data?.id || generateId(),
  name: typeof data?.name === 'string' && data.name.trim() ? data.name : 'Adsız Şablon',
  createdAt: data?.createdAt || new Date().toISOString(),
  exercises: Array.isArray(data?.exercises) ? data.exercises.map(mergeExercise) : [],
});

export const loadWithFallback = (keys, defaultVal, parser = (d) => d) => {
  for (let key of keys) {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      if (data !== null && data !== undefined) return parser(data);
    } catch { /* bozuk kayıt */ }
  }
  return defaultVal;
};

// Kayıt sırasına güvenilemez: içe aktarılan yedekler, tarihi sonradan düzenlenen
// seanslar ve eski sürümlerden gelen veriler farklı sıralarda gelebiliyor.
// Bu yüzden görüntüleme ve "en son ne yaptım" sorgularında sıralama tek yerden türetilir.
export const sortByDateDesc = (list) =>
  (Array.isArray(list) ? [...list] : []).sort((a, b) => new Date(b?.date || 0) - new Date(a?.date || 0));

export const isWarmupSet = (set) => set?.setType === 'warmup';
export const isWorkingSet = (set) => !isWarmupSet(set);

export const getNextSetType = (currentType) => {
  const idx = SET_TYPE_KEYS.indexOf(currentType || 'normal');
  return SET_TYPE_KEYS[(idx + 1) % SET_TYPE_KEYS.length];
};

export const calcFatigueDropoff = (sets = []) => {
  if (!Array.isArray(sets)) return null;
  const working = sets.filter(s => !isWarmupSet(s) && parseNumber(s.reps) > 0 && parseNumber(s.weight) > 0);
  if (working.length < 2) return null;
  const first = working[0];
  const last = working[working.length - 1];
  const firstVol = parseNumber(first.weight) * parseNumber(first.reps);
  const lastVol = parseNumber(last.weight) * parseNumber(last.reps);
  if (firstVol <= 0) return null;
  const retention = Math.round((lastVol / firstVol) * 100);
  const dropoff = 100 - retention;
  return { retention, dropoff, firstSet: `${first.weight}kg×${first.reps}`, lastSet: `${last.weight}kg×${last.reps}` };
};

export const calcTonnage = (exercises) => {
  if (!Array.isArray(exercises)) return 0;
  return exercises.reduce((acc, ex) => acc + (ex.sets || [])
    .filter(isWorkingSet)
    .reduce((sAcc, s) => sAcc + (parseNumber(s.weight) * parseNumber(s.reps)), 0), 0);
};

export const calcEffectiveSets = (workoutOrExercises) => {
  const exercises = workoutOrExercises?.exercises || workoutOrExercises;
  if (!Array.isArray(exercises)) return 0;
  return exercises.reduce((acc, ex) => acc + (ex.sets || [])
    .filter(s => isWorkingSet(s) && parseNumber(s.rir) <= 3 && parseNumber(s.reps) > 0).length, 0);
};

export const estimate1RM = (weight, reps, rir) => {
  const w = parseNumber(weight);
  const r = parseNumber(reps);
  const totalReps = r + parseNumber(rir);
  if (w <= 0 || r <= 0 || totalReps > 15) return 0;
  return Math.round(w * (1 + totalReps / 30));
};

export const buildPersonalRecords = (workouts, excludeWorkoutId = null) => {
  const records = new Map();
  for (const w of (workouts || [])) {
    if (w.id === excludeWorkoutId) continue;
    for (const ex of (w.exercises || [])) {
      for (const s of (ex.sets || [])) {
        if (isWarmupSet(s)) continue;
        const e1rm = estimate1RM(s.weight, s.reps, s.rir);
        if (e1rm <= 0) continue;
        const current = records.get(ex.name);
        if (!current || e1rm > current.e1rm) {
          records.set(ex.name, {
            e1rm,
            weight: parseNumber(s.weight),
            reps: parseNumber(s.reps),
            date: w.date
          });
        }
      }
    }
  }
  return records;
};

export const suggestNextTarget = (previousSets, { repRangeMin, repRangeMax }, muscle, context = {}) => {
  const working = (previousSets || []).filter(s => isWorkingSet(s) && parseNumber(s.reps) > 0);
  if (working.length === 0) return null;

  const maxWeight = Math.max(...working.map(s => parseNumber(s.weight)));
  const topSets = working.filter(s => parseNumber(s.weight) === maxWeight);
  const weight = maxWeight;
  const reps = Math.round(topSets.reduce((sum, s) => sum + parseNumber(s.reps), 0) / topSets.length);
  const rir = topSets.reduce((sum, s) => sum + parseNumber(s.rir), 0) / topSets.length;
  if (reps <= 0) return null;

  // Küçük kas gruplarında 2.5 kg'lık sıçrama çok büyük kalır.
  const increment = SMALL_MUSCLE_GROUPS.includes(muscle) ? 1.25 : 2.5;

  const readinessScore = parseNumber(context?.readiness?.score);
  const jointPain = parseNumber(context?.readiness?.jointPain);
  if (jointPain >= 9 || (readinessScore > 0 && readinessScore < 40)) {
    const lighter = Number((weight * 0.9).toFixed(2));
    return {
      weight: lighter,
      reps: Math.max(repRangeMin, reps),
      confidence: 'high',
      strategy: 'recovery',
      note: `Toparlanma düşük; bugün yükü yaklaşık %10 azalt (${lighter} kg)`,
    };
  }

  const history = Array.isArray(context?.history) ? context.history : [];
  const recentTopSets = history.slice(0, 2).map(session => {
    const valid = (session.sets || []).filter(s => isWorkingSet(s) && parseNumber(s.reps) > 0);
    if (!valid.length) return null;
    return valid.reduce((best, set) => estimate1RM(set.weight, set.reps, set.rir) > estimate1RM(best.weight, best.reps, best.rir) ? set : best);
  }).filter(Boolean);
  const repeatedSuccess = recentTopSets.length >= 2
    && recentTopSets.every(s => parseNumber(s.reps) >= repRangeMax && parseNumber(s.rir) >= 1);

  if ((reps >= repRangeMax && rir >= 1) || repeatedSuccess) {
    return {
      weight: Number((weight + increment).toFixed(2)),
      reps: repRangeMin,
      confidence: repeatedSuccess ? 'high' : 'medium',
      strategy: 'load',
      note: `${reps} tekrar ve RIR ${rir.toFixed(1)}; ağırlığı +${increment} kg artır`,
    };
  }
  if (rir === 0 && reps < repRangeMin) {
    const lighter = Number((weight * 0.975).toFixed(2));
    return { weight: lighter, reps: repRangeMin, confidence: 'high', strategy: 'reset', note: 'Hedef aralığın altında tükendin; yükü %2,5 azaltıp temiz tekrar yap' };
  }
  return {
    weight,
    reps: Math.min(repRangeMax, reps + 1),
    confidence: history.length >= 2 ? 'high' : 'medium',
    strategy: 'reps',
    note: `Aynı ağırlıkta ${Math.min(repRangeMax, reps + 1)} tekrar hedefle (son ort. RIR ${rir.toFixed(1)})`,
  };
};

export const detectStandalone = () =>
  typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone ||
    (document.referrer && document.referrer.includes('android-app://'))
  );

// Sıfır/boş değerin anlamlı olmadığı alanlar: kayıtta 0 veya '' varsa
// varsayılana dönülür (0 sn dinlenme, 0 tekrar hedefi gibi bozuk durumları önler).
const TRUTHY_SETTINGS = [
  'nutritionGoal', 'proteinPerFfmBulk', 'proteinPerFfmCut',
  'restSeconds', 'repRangeMin', 'repRangeMax', 'experienceLevel',
];

// Dizi olması gereken alanlar; kayıt bozuksa varsayılana dönülür.
const ARRAY_SETTINGS = ['hiddenExercises', 'pinnedExercises', 'hidden1RMExercises', 'favoriteFoods'];

/**
 * Kaydedilmiş ayarları varsayılanların ÜSTÜNE serer.
 *
 * Eskiden her alan tek tek elle sayılıyordu; DEFAULT_SETTINGS'e sonradan eklenen
 * her ayar (deneyim seviyesi, görünürlük listeleri, haftalık program) her açılışta
 * sessizce düşüyordu. Artık yeni bir ayar eklemek için burada bir şey yapmak
 * gerekmiyor — yalnızca yukarıdaki iki listeye özel kural gerekiyorsa eklenir.
 */
export const mergeSettings = (saved = {}) => {
  const merged = { ...DEFAULT_SETTINGS, ...(saved && typeof saved === 'object' ? saved : {}) };
  TRUTHY_SETTINGS.forEach(k => { if (!merged[k]) merged[k] = DEFAULT_SETTINGS[k]; });
  ARRAY_SETTINGS.forEach(k => { if (!Array.isArray(merged[k])) merged[k] = []; });
  if (!merged.weekPlan || typeof merged.weekPlan !== 'object') merged.weekPlan = {};
  // Tek programdan çoklu program listesine göç. Idempotent: yeni biçim aynen
  // geçer, eski `weekPlan` nesnesi ilk programa dönüşür.
  const { plans, activeId } = migrateWeekPlans(merged);
  merged.weekPlans = plans;
  merged.activePlanId = activeId;
  return merged;
};

export const loadPersistedState = () => {
  const keys = (name) => STORAGE_VERSIONS.map(v => `po_${name}${v}`);
  const todayStr = getLocalDateString();

  const metricsRaw = loadWithFallback(keys('metrics'), []);
  const metricsHistory = Array.isArray(metricsRaw) ? metricsRaw.map(mergeMetrics) : [];
  let currentMetricsForm = mergeMetrics({});
  if (metricsHistory.length > 0) {
    const todayData = metricsHistory.find(m => m.date === todayStr);
    // Bugüne kayıt yoksa en son ölçüm şablon alınır; böylece ölçüm sayfası boş
    // açılmaz ve yalnızca değişen değerler güncellenir. Kayıt sırasına
    // güvenilmediği için tarihe göre sıralanır.
    const latest = sortByDateDesc(metricsHistory)[0];
    currentMetricsForm = todayData
      ? mergeMetrics(todayData)
      : mergeMetrics({ ...latest, id: generateId(), date: todayStr });
  }

  const nutritionRaw = loadWithFallback(keys('nutrition'), []);
  const nutritionHistory = Array.isArray(nutritionRaw) ? nutritionRaw.map(mergeNutrition) : [];
  const todayNutrition = nutritionHistory.find(n => n.date === todayStr);

  const savedSettings = loadWithFallback(keys('settings'), {}) || {};

  return {
    workouts: loadWithFallback(keys('workouts'), []),
    templates: loadWithFallback(keys('templates'), []),
    customExercises: migrateCustomExercises(loadWithFallback(keys('custom_exercises'), [])),
    customFoods: loadWithFallback(keys('custom_foods'), []),
    recentFoods: loadWithFallback(keys('recent_foods'), []),
    mealTemplates: loadWithFallback(keys('meal_templates'), []),
    dayTemplates: loadWithFallback(keys('day_templates'), []),
    activeWorkout: loadWithFallback(keys('active_workout'), null),
    wellness: (() => {
      const raw = loadWithFallback(keys('wellness'), []);
      return Array.isArray(raw)
        ? raw.map(day => mergeWellnessDay(day, generateId)).filter(day => day.date)
        : [];
    })(),
    metricsHistory,
    currentMetricsForm,
    nutritionHistory,
    currentNutritionForm: todayNutrition ? mergeNutrition(todayNutrition) : mergeNutrition({ date: todayStr }),
    settings: mergeSettings(savedSettings),
    lastBackupDate: typeof localStorage !== 'undefined' ? localStorage.getItem('po_last_backup') : null
  };
};

export const computeComposition = (metrics) => {
  const age = parseNumber(metrics.age);
  const heightCm = parseNumber(metrics.height);
  const weightKg = parseNumber(metrics.weight);
  const gender = metrics.gender;
  const method = metrics.method;

  const { neck, waist, hip, wrist } = metrics.measurements || {};
  const sf = metrics.skinfolds || {};

  const nNeck = parseNumber(neck); const nWaist = parseNumber(waist); const nHip = parseNumber(hip); const nWrist = parseNumber(wrist);

  let sumSkinfolds = 0; let isValidSkinfold = false;

  if (method === '7') {
    const vals = [sf.chest, sf.axilla, sf.triceps, sf.subscapular, sf.abdomen, sf.suprailiac, sf.thigh].map(parseNumber);
    if (vals.every(v => v > 0)) { sumSkinfolds = vals.reduce((a, b) => a + b, 0); isValidSkinfold = true; }
  } else {
    if (gender === 'male') {
      const vals = [sf.chest, sf.abdomen, sf.thigh].map(parseNumber);
      if (vals.every(v => v > 0)) { sumSkinfolds = vals.reduce((a, b) => a + b, 0); isValidSkinfold = true; }
    } else {
      const vals = [sf.triceps, sf.suprailiac, sf.thigh].map(parseNumber);
      if (vals.every(v => v > 0)) { sumSkinfolds = vals.reduce((a, b) => a + b, 0); isValidSkinfold = true; }
    }
  }

  let density = 0;
  if (isValidSkinfold && age > 0) {
    if (method === '7') {
      density = gender === 'male'
        ? 1.112 - (0.00043499 * sumSkinfolds) + (0.00000055 * Math.pow(sumSkinfolds, 2)) - (0.00028826 * age)
        : 1.097 - (0.00046971 * sumSkinfolds) + (0.00000056 * Math.pow(sumSkinfolds, 2)) - (0.00012828 * age);
    } else {
      density = gender === 'male'
        ? 1.10938 - (0.0008267 * sumSkinfolds) + (0.0000016 * Math.pow(sumSkinfolds, 2)) - (0.0002574 * age)
        : 1.0994921 - (0.0009929 * sumSkinfolds) + (0.0000023 * Math.pow(sumSkinfolds, 2)) - (0.0001392 * age);
    }
  }

  let siriBF = 0;
  if (density > 0) { siriBF = Math.max(3.0, Math.min((4.95 / density - 4.50) * 100, 60.0)); }

  let navyBF = 0;
  if (heightCm > 0 && nWaist > 0 && nNeck > 0) {
    if (gender === 'male' && nWaist > nNeck) {
      const denom = 1.0324 - 0.19077 * Math.log10(nWaist - nNeck) + 0.15456 * Math.log10(heightCm);
      if (denom !== 0) navyBF = Math.max(3.0, Math.min(495 / denom - 450, 60.0));
    } else if (gender === 'female' && (nWaist + nHip > nNeck)) {
      const denom = 1.29579 - 0.35004 * Math.log10(nWaist + nHip - nNeck) + 0.22100 * Math.log10(heightCm);
      if (denom !== 0) navyBF = Math.max(3.0, Math.min(495 / denom - 450, 60.0));
    }
  }

  let averageBF = 0;
  if (siriBF > 0 && navyBF > 0) averageBF = (siriBF + navyBF) / 2;

  let activeBF = parseNumber(metrics.bodyFat) || 15.0;
  const pref = metrics.fatPreference;
  if (pref === 'skinfold' && siriBF > 0) activeBF = siriBF;
  else if (pref === 'navy' && navyBF > 0) activeBF = navyBF;
  else if (pref === 'average' && averageBF > 0) activeBF = averageBF;
  else if (pref === 'manual' && parseNumber(metrics.bodyFat) > 0) activeBF = parseNumber(metrics.bodyFat);
  else activeBF = siriBF > 0 ? siriBF : (navyBF > 0 ? navyBF : (parseNumber(metrics.bodyFat) || 15.0));

  const fatMass = weightKg * (activeBF / 100);
  const leanMass = weightKg - fatMass;
  const heightM = heightCm / 100;
  const ffmi = heightM > 0 ? leanMass / Math.pow(heightM, 2) : 0;
  const bmr = leanMass > 0 ? Math.round(370 + (21.6 * leanMass)) : 0;

  let whtr = 0; if (heightCm > 0) whtr = nWaist / heightCm;
  let frameSize = "-";
  if (heightCm > 0 && nWrist > 0) {
    const rValue = heightCm / nWrist;
    if (gender === 'male') frameSize = (rValue > 10.4) ? "İnce" : (rValue < 9.6) ? "Kalın" : "Orta";
    else frameSize = (rValue > 11.0) ? "İnce" : (rValue < 10.1) ? "Kalın" : "Orta";
  }

  let maxPotentialFFMI = 0;
  if (gender === 'male') {
    if (frameSize === 'İnce') maxPotentialFFMI = 24.0;
    else if (frameSize === 'Orta') maxPotentialFFMI = 25.5;
    else if (frameSize === 'Kalın') maxPotentialFFMI = 27.0;
  } else {
    if (frameSize === 'İnce') maxPotentialFFMI = 20.0;
    else if (frameSize === 'Orta') maxPotentialFFMI = 21.5;
    else if (frameSize === 'Kalın') maxPotentialFFMI = 23.0;
  }

  const potentialAchieved = maxPotentialFFMI > 0 && ffmi > 0 ? Math.min((ffmi / maxPotentialFFMI) * 100, 100) : 0;

  let maxNaturalWeight = 0;
  if (heightM > 0 && activeBF < 100 && maxPotentialFFMI > 0) {
    const maxFFM = maxPotentialFFMI * Math.pow(heightM, 2);
    maxNaturalWeight = maxFFM / (1 - (activeBF / 100));
  }

  let trainingAdvice = "";
  let nutritionAdvice = "";

  if (potentialAchieved === 0) {
    trainingAdvice = "Yeterli veri yok.";
    nutritionAdvice = "Yeterli veri yok.";
  } else if (potentialAchieved < 80) {
    trainingAdvice = "Doğal sınırın oldukça altındasınız (Acemi/Orta). Ana bileşke egzersizlerde lineer progresyon (sürekli ağırlık/tekrar artışı) yapabilirsiniz. Antrenman hacmi tolere edilebilir seviyededir.";
    nutritionAdvice = "Kas inşası için kalori fazlası (surplus) elzemdir. Günlük +300-500 kcal ekleyerek büyümeyi hızlandırabilirsiniz, yağlanma riski görece daha düşüktür.";
  } else if (potentialAchieved < 92) {
    trainingAdvice = "Genetik sınırlarınıza yaklaşıyorsunuz (İleri Seviye). Gelişim ivmesi düşmüştür. Sürekli ağırlık artırmak yerine hacim/yoğunluk periyotlaması (periodization) ve deload stratejileri uygulanmalıdır.";
    nutritionAdvice = "Agresif kalori fazlası artık çoğunlukla yağ olarak depolanır. Yavaş ve temiz büyüme (lean bulk) için kalori fazlası +150-250 kcal ile sınırlandırılmalıdır.";
  } else {
    trainingAdvice = "Doğal hipertrofi limitlerinizdesiniz (Elit Seviye). Kas eklemek mekanik olarak çok zordur. Zayıf kas gruplarına spesifik izolasyon ve çok yüksek teknik uzmanlık gerekir.";
    nutritionAdvice = "Fazla kalori alımı direkt yağlanmaya yol açar. Vücut kompozisyonunu koruma (maintenance) veya çok küçük kalori dalgalanmaları (recomp) ile form korunmalıdır.";
  }

  return {
    siriBF: siriBF > 0 ? siriBF.toFixed(1) : "-",
    navyBF: navyBF > 0 ? navyBF.toFixed(1) : "-",
    averageBF: averageBF > 0 ? averageBF.toFixed(1) : "-",
    activeBF: Number(activeBF).toFixed(1),
    ffm: leanMass.toFixed(1), fm: fatMass.toFixed(1), ffmi: ffmi.toFixed(1), bmr,
    whtr: whtr > 0 ? whtr.toFixed(2) : "-", frameSize, maxNaturalWeight: maxNaturalWeight > 0 ? maxNaturalWeight.toFixed(1) : "-",
    maxPotentialFFMI: maxPotentialFFMI > 0 ? maxPotentialFFMI.toFixed(1) : "-",
    potentialAchieved: potentialAchieved.toFixed(1),
    trainingAdvice, nutritionAdvice
  };
};

export const findMetricsForDate = (history, dateStr, fallback) => {
  if (!Array.isArray(history) || history.length === 0 || !dateStr) return fallback;
  const sorted = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
  const match = sorted.find(m => m.date <= dateStr);
  return match ? mergeMetrics(match) : mergeMetrics(sorted[sorted.length - 1]);
};
