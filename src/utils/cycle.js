import { dayKey, toLocalDate } from './dates.js';
import { parseNumber } from './number.js';

export const BLEEDING_LEVELS = [
  { key: 'none', label: 'Yok' },
  { key: 'spotting', label: 'Lekelenme' },
  { key: 'light', label: 'Hafif' },
  { key: 'medium', label: 'Orta' },
  { key: 'heavy', label: 'Yoğun' },
];

export const CYCLE_SYMPTOMS = [
  { key: 'cramp', label: 'Kramp' },
  { key: 'fatigue', label: 'Yorgunluk' },
  { key: 'headache', label: 'Baş ağrısı' },
  { key: 'bloating', label: 'Şişkinlik' },
  { key: 'breast', label: 'Göğüs hassasiyeti' },
  { key: 'mood', label: 'Duygu değişimi' },
  { key: 'sleep', label: 'Uyku bozukluğu' },
  { key: 'back', label: 'Bel ağrısı' },
];

export const DEFAULT_CYCLE_CONFIG = {
  cycleLength: 28,
  periodLength: 5,
  hormonalContraception: false,
};

export const emptyCycleDay = (date = dayKey(new Date()), idFactory = () => `cycle-${Date.now()}`) => ({
  id: idFactory(),
  date,
  bleeding: 'none',
  pain: 0,
  energy: 5,
  symptoms: [],
  note: '',
});

export const mergeCycleDay = (data, idFactory) => ({
  ...emptyCycleDay(data?.date || dayKey(new Date()), idFactory),
  id: data?.id || idFactory?.() || `cycle-${Date.now()}`,
  date: dayKey(data?.date) || dayKey(new Date()),
  bleeding: BLEEDING_LEVELS.some(level => level.key === data?.bleeding) ? data.bleeding : 'none',
  pain: Math.max(0, Math.min(10, parseNumber(data?.pain))),
  energy: Math.max(1, Math.min(10, parseNumber(data?.energy) || 5)),
  symptoms: Array.isArray(data?.symptoms)
    ? data.symptoms.filter(key => CYCLE_SYMPTOMS.some(symptom => symptom.key === key))
    : [],
  note: typeof data?.note === 'string' ? data.note.slice(0, 240) : '',
});

const addDays = (value, days) => {
  const date = toLocalDate(value);
  if (!date) return null;
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const diffDays = (from, to) => {
  const a = toLocalDate(from);
  const b = toLocalDate(to);
  if (!a || !b) return null;
  a.setHours(12, 0, 0, 0);
  b.setHours(12, 0, 0, 0);
  return Math.round((b - a) / 86400000);
};

/** Kanamanın başladığı günleri kronolojik çıkarır. */
export const cycleStarts = (records = []) => {
  const bleedingDays = new Set(
    records
      .filter(record => record?.bleeding && record.bleeding !== 'none')
      .map(record => dayKey(record.date))
      .filter(Boolean),
  );
  return [...bleedingDays]
    .filter(date => !bleedingDays.has(dayKey(addDays(date, -1))))
    .sort();
};

export const estimatedCycleLength = (records = [], fallback = 28) => {
  const starts = cycleStarts(records);
  const intervals = starts.slice(1)
    .map((date, index) => diffDays(starts[index], date))
    .filter(days => days >= 15 && days <= 60);
  if (!intervals.length) return Math.max(21, Math.min(45, parseNumber(fallback) || 28));
  return Math.round(intervals.reduce((sum, days) => sum + days, 0) / intervals.length);
};

const phaseFor = (cycleDay, cycleLength, periodLength) => {
  if (!(cycleDay > 0)) return { key: 'unknown', label: 'Veri bekleniyor' };
  const ovulationDay = Math.max(periodLength + 2, cycleLength - 14);
  if (cycleDay <= periodLength) return { key: 'menstrual', label: 'Regl dönemi' };
  if (cycleDay < ovulationDay - 1) return { key: 'follicular', label: 'Foliküler dönem' };
  if (cycleDay <= ovulationDay + 1) return { key: 'ovulation', label: 'Tahmini ovülasyon penceresi' };
  return { key: 'luteal', label: 'Luteal dönem' };
};

const symptomSeverity = (entry) => {
  const pain = parseNumber(entry?.pain);
  const energy = parseNumber(entry?.energy) || 5;
  const symptomCount = entry?.symptoms?.length || 0;
  if (entry?.bleeding === 'heavy' || pain >= 7 || energy <= 3) return 'high';
  if (pain >= 4 || energy <= 5 || symptomCount >= 2) return 'moderate';
  return 'low';
};

const adviceFor = (severity, entry) => {
  if (severity === 'high') return {
    training: 'Bugün faza göre değil belirtiye göre ayarla: set sayısını yaklaşık %20–30 azalt, RIR 3–4 bırak ve rekor deneme. Ağrı hareketle artıyorsa o hareketi bırak.',
    cardio: 'Dinlen veya tolere edebildiğin 15–30 dk rahat yürüyüş/bisiklet seç. Baş dönmesi, olağandışı nefes darlığı veya artan ağrı varsa egzersizi kes.',
    nutrition: 'Kalori hedefini otomatik düşürme. Sıvı, düzenli öğün ve demir içeren besinleri önceliklendir; uygulama verisine bakarak kendi kendine demir takviyesi başlama.',
  };
  if (severity === 'moderate') return {
    training: 'Planı tamamen değiştirmek yerine ilk çalışma setini kontrol seti yap. Beklenenden zor gelirse yükü %5–10 veya set sayısını %10–20 azalt; RIR 2–3 bırak.',
    cardio: 'Konuşma temposunda kardiyo veya düşük darbeli seçenek uygundur. Tempo normalden ağır geliyorsa süreyi kısalt.',
    nutrition: 'Günlük protein ve toplam kaloriyi koru. Şişkinlik tek başına yağ artışı değildir; kısa süreli tartı değişimini hedef değişikliği sayma.',
  };
  return {
    training: 'Belirti yükün düşük. Yalnız döngü fazı nedeniyle programı azaltma; planı hazır oluşluk, RIR ve gerçek performansına göre uygula.',
    cardio: 'Planlanan kardiyoyu normal şekilde yapabilirsin. Nabız ve algılanan zorluk olağandışıysa o güne özel tempo düşür.',
    nutrition: entry?.bleeding !== 'none'
      ? 'Toplam kalori ve proteini koru; kanama günlerinde sıvı ve demir içeren besinleri ihmal etme.'
      : 'Faz tahminine bakarak kalori veya makroları otomatik değiştirme; gerçek açlık, performans ve haftalık hedef belirleyicidir.',
  };
};

/**
 * Seçilen gün için döngü özeti. Faz yalnızca takvim tahminidir; antrenman
 * reçetesi belirtilerden üretilir.
 */
export const buildCycleSummary = (records = [], date = dayKey(new Date()), config = {}) => {
  const mergedConfig = { ...DEFAULT_CYCLE_CONFIG, ...(config || {}) };
  const selectedDate = dayKey(date) || dayKey(new Date());
  const entries = records.map(record => mergeCycleDay(record)).sort((a, b) => a.date.localeCompare(b.date));
  const savedEntry = entries.find(record => record.date === selectedDate) || null;
  const entry = savedEntry || emptyCycleDay(selectedDate, () => 'preview');
  const starts = cycleStarts(entries);
  const lastStart = [...starts].reverse().find(start => start <= selectedDate) || null;
  const cycleLength = estimatedCycleLength(entries, mergedConfig.cycleLength);
  const periodLength = Math.max(2, Math.min(10, parseNumber(mergedConfig.periodLength) || 5));
  const daysSinceStart = lastStart ? diffDays(lastStart, selectedDate) : null;
  // Kayıtlı son başlangıçtan birden fazla döngü geçmişse gösterilen gün sayısı
  // 40, 70 diye büyümez; tahmini döngü içinde 1…N aralığına sarılır.
  const cycleDay = daysSinceStart !== null
    ? ((Math.max(0, daysSinceStart) % cycleLength) + 1)
    : null;
  const phase = phaseFor(cycleDay, cycleLength, periodLength);
  const severity = savedEntry ? symptomSeverity(entry) : 'none';
  const completedCycles = daysSinceStart !== null ? Math.floor(Math.max(0, daysSinceStart) / cycleLength) : 0;
  const nextPeriodStart = lastStart
    ? dayKey(addDays(lastStart, (completedCycles + 1) * cycleLength))
    : null;
  const nextPeriodEnd = nextPeriodStart ? dayKey(addDays(nextPeriodStart, periodLength - 1)) : null;
  const currentPeriodEnd = lastStart && cycleDay <= periodLength
    ? dayKey(addDays(lastStart, completedCycles * cycleLength + periodLength - 1))
    : null;
  const intervals = starts.slice(1)
    .map((start, index) => diffDays(starts[index], start))
    .filter(days => days >= 15 && days <= 60);
  const meanDeviation = intervals.length >= 2
    ? Math.round(intervals.reduce((sum, value) => sum + Math.abs(value - cycleLength), 0) / intervals.length)
    : 2;
  const uncertaintyDays = Math.max(1, Math.min(7, meanDeviation || 1));
  const nextPeriodWindow = nextPeriodStart ? {
    earliest: dayKey(addDays(nextPeriodStart, -uncertaintyDays)),
    latest: dayKey(addDays(nextPeriodStart, uncertaintyDays)),
  } : null;
  const futurePeriods = nextPeriodStart
    ? Array.from({ length: 3 }, (_, index) => {
      const start = dayKey(addDays(nextPeriodStart, index * cycleLength));
      return { start, end: dayKey(addDays(start, periodLength - 1)), estimated: true };
    })
    : [];
  const irregular = intervals.some(days => days < 21 || days > 45);
  const longGap = daysSinceStart !== null && daysSinceStart > 45;
  const warning = entry.bleeding === 'heavy' || parseNumber(entry.pain) >= 8
    ? 'Yoğun kanama veya şiddetli ağrı tekrarlıyorsa sağlık uzmanıyla görüş. Saatte bir–iki ped/tampon değiştirme, baş dönmesi veya bayılma acil değerlendirme gerektirebilir.'
    : irregular || longGap
      ? 'Döngü aralıkların 21–45 gün dışında görünüyor veya beklenen kayıt gecikti. Bu durum tekrarlıyorsa sağlık uzmanıyla görüş.'
      : null;

  return {
    date: selectedDate,
    entry,
    starts,
    lastStart,
    cycleDay,
    cycleLength,
    periodLength,
    // nextPeriod eski bileşenler/yedeklerle uyumlu takma addır.
    nextPeriod: nextPeriodStart,
    nextPeriodStart,
    nextPeriodEnd,
    currentPeriodEnd,
    nextPeriodWindow,
    futurePeriods,
    daysUntilNext: nextPeriodStart ? diffDays(selectedDate, nextPeriodStart) : null,
    uncertaintyDays,
    phase,
    severity,
    advice: adviceFor(severity, entry),
    warning,
    hasEntry: Boolean(savedEntry),
    hasData: Boolean(lastStart),
    estimated: true,
    hormonalContraception: Boolean(mergedConfig.hormonalContraception),
  };
};
