// Saf hesap modülü — yalnızca aynı katmandaki bağımsız modüllerden import eder.
import { parseNumber } from './number.js';
import { dailyTotals } from './nutritionStats.js';

/**
 * Günlük enerji harcamasının bileşenlere ayrılması.
 *
 * Toplam harcama tek bir sayı olarak gösterildiğinde "neden bu kadar" sorusu
 * cevapsız kalıyor. Burada harcama kaynaklarına ayrılıyor:
 *
 *   BMR   — bazal metabolizma; yağsız kütleden gelir (Katch-McArdle)
 *   TEF   — besinlerin termik etkisi; sindirim için harcanan enerji
 *   EAT   — antrenman ve kardiyo
 *   EPOC  — antrenman sonrası yükselmiş metabolizma (toparlanma etkisi)
 *   NEAT  — geri kalan günlük hareketlilik (yürüme, ayakta durma, iş)
 *
 * NEAT bilerek ARTIK olarak hesaplanıyor: gerçek TDEE kilo trendinden ölçülen
 * tek güvenilir toplam, diğer bileşenler formülle tahmin ediliyor. Belirsizliği
 * uydurma bir NEAT katsayısına değil, artığa yüklemek daha dürüst.
 */

// Makro başına termik etki oranları (yaygın kabul gören aralıkların ortası).
export const TEF_RATES = { protein: 0.25, carbs: 0.08, fats: 0.02 };

// Direnç antrenmanı sonrası EPOC, seans harcamasının kabaca %7'si kadar.
// Kardiyoda bu oran daha düşük olduğu için ayrı katsayı kullanılıyor.
export const EPOC_LIFTING = 0.07;
export const EPOC_CARDIO = 0.03;

/** Katch-McArdle: yağsız kütleye dayanır, yağ oranı bilindiğinde en isabetlisi. */
export const bmrFromFFM = (ffmKg) => {
  const ffm = parseNumber(ffmKg);
  return ffm > 0 ? Math.round(370 + 21.6 * ffm) : 0;
};

/** Besinlerin sindirimi için harcanan enerji. */
export const thermicEffect = (macros = {}) => {
  const p = parseNumber(macros.protein) * 4 * TEF_RATES.protein;
  const c = parseNumber(macros.carbs) * 4 * TEF_RATES.carbs;
  const f = parseNumber(macros.fats) * 9 * TEF_RATES.fats;
  return {
    protein: Math.round(p),
    carbs: Math.round(c),
    fats: Math.round(f),
    total: Math.round(p + c + f),
  };
};

/**
 * Bir günün harcama dökümü.
 *
 * @param opts.maintenance  gerçek TDEE (kilo trendinden). Yoksa BMR'den tahmin.
 * @param opts.bmr          bazal metabolizma
 * @param opts.macros       o günün makroları (TEF için)
 * @param opts.lifting      ağırlık antrenmanı kalorisi
 * @param opts.cardio       kardiyo kalorisi
 * @param opts.manual       kullanıcının elle eklediği yakım
 */
export const dayEnergyBreakdown = ({
  maintenance = 0,
  bmr = 0,
  macros = {},
  lifting = 0,
  cardio = 0,
  manual = 0,
} = {}) => {
  const maint = parseNumber(maintenance);
  const base = parseNumber(bmr);
  const eatLifting = parseNumber(lifting);
  const eatCardio = parseNumber(cardio);
  const eatManual = parseNumber(manual);
  const tef = thermicEffect(macros);

  const epoc = Math.round(eatLifting * EPOC_LIFTING + eatCardio * EPOC_CARDIO);
  const eat = eatLifting + eatCardio + eatManual;

  // NEAT artık: korunum kalorisi bilinmiyorsa hesaplanamaz.
  // Korunum zaten ortalama bir günün TEF ve NEAT'ini içerir; egzersiz onun
  // üstüne biner. Bu yüzden NEAT = korunum − BMR − TEF olarak çıkarılır.
  const neat = maint > 0 ? Math.max(0, Math.round(maint - base - tef.total)) : null;

  const total = maint > 0
    ? Math.round(maint + eat + epoc)
    : Math.round(base + tef.total + eat + epoc);

  const parts = [
    { key: 'bmr', label: 'Bazal Metabolizma', value: base, color: 'bg-zinc-500', hint: 'Hiçbir şey yapmasan da yakılan' },
    { key: 'neat', label: 'Günlük Hareket', value: neat ?? 0, color: 'bg-cyan-500', hint: 'Yürüme, ayakta durma, iş' },
    { key: 'tef', label: 'Sindirim (Termik)', value: tef.total, color: 'bg-amber-500', hint: 'Besinleri işlemek için harcanan' },
    { key: 'lifting', label: 'Ağırlık Antrenmanı', value: eatLifting, color: 'bg-emerald-500', hint: 'Seans süresi × şiddet' },
    { key: 'cardio', label: 'Kardiyo', value: eatCardio, color: 'bg-red-500', hint: 'Aktiviteye göre MET değeri' },
    { key: 'manual', label: 'Elle Eklenen', value: eatManual, color: 'bg-purple-500', hint: 'Senin girdiğin ekstra' },
    { key: 'epoc', label: 'Toparlanma (EPOC)', value: epoc, color: 'bg-orange-500', hint: 'Antrenman sonrası yükselen metabolizma' },
  ].filter(p => p.value > 0);

  return {
    ready: total > 0,
    bmr: base,
    neat,
    tef,
    lifting: eatLifting,
    cardio: eatCardio,
    manual: eatManual,
    epoc,
    eat,
    total,
    parts,
    isRestDay: eat === 0,
  };
};

/**
 * Gün gün seri — tablo ve trend için.
 *
 * Her gün: alınan, harcanan (bileşenlere ayrılmış), denge.
 * Yalnızca beslenme kaydı olan günler döner; boş günü sıfır kalori saymak
 * haftalık toplamı olduğundan büyük gösterirdi.
 */
export const buildEnergySeries = (nutritionHistory = [], {
  maintenance = 0,
  bmr = 0,
  dayCalories,          // (dateStr) => { lifting, cardio, total }
  days = 30,
} = {}) => {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (days - 1));

  return [...nutritionHistory]
    .filter(n => new Date(n.date) >= cutoff)
    .map(n => {
      const macros = dailyTotals(n);
      const w = dayCalories ? dayCalories(n.date) : { lifting: 0, cardio: 0 };
      const b = dayEnergyBreakdown({
        maintenance,
        bmr,
        macros,
        lifting: w.lifting,
        cardio: w.cardio,
        manual: n.activeCaloriesOut,
      });
      return {
        date: n.date,
        intake: Math.round(macros.calories),
        macros,
        out: b.total,
        breakdown: b,
        balance: Math.round(macros.calories - b.total),
        isRestDay: b.isRestDay,
      };
    })
    .filter(d => d.intake > 0 || d.out > 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
};

/** Seriyi haftalara toplar (pazartesi başlangıçlı). */
export const groupByWeek = (series = []) => {
  const weeks = new Map();

  series.forEach(d => {
    const date = new Date(d.date);
    const day = date.getDay();
    const monday = new Date(date);
    monday.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
    monday.setHours(0, 0, 0, 0);
    const key = monday.toISOString().split('T')[0];

    const w = weeks.get(key) || {
      weekStart: key, days: 0, intake: 0, out: 0, balance: 0,
      lifting: 0, cardio: 0, tef: 0, epoc: 0, restDays: 0,
    };
    w.days += 1;
    w.intake += d.intake;
    w.out += d.out;
    w.balance += d.balance;
    w.lifting += d.breakdown.lifting;
    w.cardio += d.breakdown.cardio;
    w.tef += d.breakdown.tef.total;
    w.epoc += d.breakdown.epoc;
    if (d.isRestDay) w.restDays += 1;
    weeks.set(key, w);
  });

  return [...weeks.values()]
    .map(w => ({ ...w, kg: Math.round((w.balance / 7700) * 100) / 100 }))
    .sort((a, b) => new Date(b.weekStart) - new Date(a.weekStart));
};

/**
 * Haftalık programdan TEORİK harcama.
 *
 * Gerçekleşen değil, plan uygulanırsa ne olacağını söyler — kullanıcı haftayı
 * kurarken "bu program bana ne kadar yaktırır" sorusunu cevaplar.
 *
 * @param planDays computeWeekPlan çıktısındaki günler ({ template, kcal })
 */
export const theoreticalWeek = (planDays = [], {
  maintenance = 0,
  plannedCardioKcal = 0,
} = {}) => {
  const maint = parseNumber(maintenance);
  if (!(maint > 0)) return null;

  const trainingDays = planDays.filter(d => d.template).length;
  const liftingKcal = planDays.reduce((s, d) => s + parseNumber(d.kcal), 0);
  const epoc = Math.round(liftingKcal * EPOC_LIFTING + parseNumber(plannedCardioKcal) * EPOC_CARDIO);

  const base = maint * 7;
  const total = Math.round(base + liftingKcal + parseNumber(plannedCardioKcal) + epoc);

  return {
    trainingDays,
    restDays: 7 - trainingDays,
    liftingKcal: Math.round(liftingKcal),
    cardioKcal: Math.round(parseNumber(plannedCardioKcal)),
    epoc,
    baseKcal: Math.round(base),
    total,
    // Dinlenme günü harcaması antrenman gününden ne kadar düşük.
    restDayKcal: Math.round(maint),
    trainingDayKcal: trainingDays > 0
      ? Math.round(maint + (liftingKcal + parseNumber(plannedCardioKcal) + epoc) / trainingDays)
      : Math.round(maint),
  };
};
