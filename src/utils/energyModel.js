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
 * NEAT varsayılan olarak ARTIK hesaplanır: gerçek TDEE kilo trendinden ölçülen
 * tek güvenilir toplam, diğer bileşenler formülle tahmin ediliyor. Belirsizliği
 * uydurma bir katsayıya değil artığa yüklemek daha dürüst.
 *
 * Kritik incelik: ölçülen TDEE, o dönemin ORTALAMA egzersizini de içerir. Bu
 * yüzden artıktan ortalama günlük egzersiz düşülür (`avgDailyExercise`).
 * Düşülmezse NEAT antrenman kalorisini içine emer, dinlenme gününde bile şişkin
 * görünür ve günün egzersizi üstüne eklendiğinde aynı enerji iki kez sayılır.
 *
 * Kullanıcı isterse artık yerine aktivite seviyesi, adım sayısı ya da doğrudan
 * kcal girebilir (`neatMode`).
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

/** Günlük hareket (NEAT) için aktivite seviyesi seçenekleri — BMR'ın katı. */
export const ACTIVITY_LEVELS = [
  { key: 'sedentary', label: 'Masa Başı', factor: 0.15, hint: 'Gün boyu oturarak; az yürüyüş' },
  { key: 'light', label: 'Hafif', factor: 0.25, hint: 'Ofis + günlük yürüyüşler', default: true },
  { key: 'moderate', label: 'Hareketli', factor: 0.40, hint: 'Ayakta çalışma, sık yürüyüş' },
  { key: 'high', label: 'Fiziksel İş', factor: 0.60, hint: 'Bedensel iş, gün boyu ayakta' },
];

/**
 * Kardiyo kalorisinin kaç adıma denk geldiği.
 *
 * Adım sayacı koşu/yürüyüşü de sayar; kardiyo ayrıca kalem olarak eklendiğinde
 * aynı hareket iki kez sayılır. Bu fonksiyon kardiyonun "adım karşılığını"
 * verir, adım tabanlı NEAT'ten düşülür.
 */
export const stepsCoveredByCardio = (cardioKcal, weightKg) => {
  const k = parseNumber(cardioKcal);
  const w = parseNumber(weightKg);
  if (!(k > 0) || !(w > 0)) return 0;
  return Math.round(k / (0.0005 * w));
};

/** Adım başına yakım vücut ağırlığıyla ölçeklenir (~0.0005 kcal/adım/kg). */
export const caloriesFromSteps = (steps, weightKg) => {
  const s = parseNumber(steps);
  const w = parseNumber(weightKg);
  if (!(s > 0) || !(w > 0)) return 0;
  return Math.round(s * 0.0005 * w);
};

/**
 * Bir günün harcama dökümü.
 *
 * @param opts.maintenance      gerçek TDEE (kilo trendinden). Yoksa BMR'den tahmin.
 * @param opts.bmr              bazal metabolizma
 * @param opts.macros           o günün makroları (TEF için)
 * @param opts.lifting/cardio/manual  o günün egzersiz kalorileri
 * @param opts.avgDailyExercise TDEE penceresindeki ORTALAMA günlük egzersiz
 * @param opts.neatMode         'auto' | 'level' | 'steps' | 'manual'
 * @param opts.activityLevel    'level' modunda seviye anahtarı
 * @param opts.steps            'steps' modunda günlük adım
 * @param opts.neatManual       'manual' modunda doğrudan kcal
 * @param opts.weightKg         adım hesabı için
 */
export const dayEnergyBreakdown = ({
  maintenance = 0,
  bmr = 0,
  macros = {},
  lifting = 0,
  cardio = 0,
  recovery = 0,
  manual = 0,
  avgDailyExercise = 0,
  neatMode = 'auto',
  activityLevel = 'light',
  steps = 0,
  neatManual = 0,
  weightKg = 0,
  neatMultiplier = 1,
} = {}) => {
  const maint = parseNumber(maintenance);
  const base = parseNumber(bmr);
  const eatLifting = parseNumber(lifting);
  const eatCardio = parseNumber(cardio);
  const eatRecovery = parseNumber(recovery);
  const eatManual = parseNumber(manual);
  const tef = thermicEffect(macros);

  const epoc = Math.round(eatLifting * EPOC_LIFTING + eatCardio * EPOC_CARDIO);
  const eat = eatLifting + eatCardio + eatRecovery + eatManual;

  // NEAT (günlük hareket).
  //
  // ÖNEMLİ: Ölçülen TDEE, kilo trendinden geldiği için o dönemin ORTALAMA
  // egzersizini zaten içerir. Artığı hesaplarken bunu düşmezsek NEAT, ortalama
  // antrenman kalorisini de içine alır ve dinlenme gününde bile şişkin görünür;
  // ayrıca günün egzersizi üstüne eklenince aynı enerji iki kez sayılırdı.
  let neat = null;
  let neatSource = neatMode;

  if (neatMode === 'manual' && parseNumber(neatManual) > 0) {
    neat = Math.round(parseNumber(neatManual));
  } else if (neatMode === 'steps' && parseNumber(steps) > 0) {
    // Koşu/yürüyüş kardiyosu adım sayacına da yazılıyor; ikisini toplamak aynı
    // adımları iki kez saymak olur. Kardiyonun kapsadığı adım payı düşülür.
    const kardiyoAdim = stepsCoveredByCardio(eatCardio, weightKg);
    const netAdim = Math.max(0, parseNumber(steps) - kardiyoAdim);
    neat = caloriesFromSteps(netAdim, weightKg);
  } else if (neatMode === 'level' && base > 0) {
    const lvl = ACTIVITY_LEVELS.find(l => l.key === activityLevel) || ACTIVITY_LEVELS[1];
    neat = Math.round(base * lvl.factor);
  } else if (maint > 0 && base > 0) {
    neat = Math.max(0, Math.round(maint - base - tef.total - parseNumber(avgDailyExercise)));
    neatSource = 'auto';
  } else {
    neatSource = null;
  }

  // Kullanıcı çarpanı: kendi gözlemine göre hesabı ölçekleyebilir.
  const carpan = parseNumber(neatMultiplier) || 1;
  if (neat !== null && carpan !== 1) neat = Math.round(neat * carpan);

  // Gün toplamı bileşenlerden kurulur; korunum kalorisinin üstüne egzersiz
  // eklemek (eski yöntem) egzersizi iki kez sayıyordu.
  const total = neat !== null
    ? Math.round(base + neat + tef.total + eat + epoc)
    : Math.round(base + tef.total + eat + epoc);

  const parts = [
    { key: 'bmr', label: 'Bazal Metabolizma', value: base, color: 'bg-zinc-500', hint: 'Hiçbir şey yapmasan da yakılan' },
    { key: 'neat', label: 'Günlük Hareket', value: neat ?? 0, color: 'bg-cyan-500', hint: 'Yürüme, ayakta durma, iş' },
    { key: 'tef', label: 'Sindirim (Termik)', value: tef.total, color: 'bg-amber-500', hint: 'Besinleri işlemek için harcanan' },
    { key: 'lifting', label: 'Ağırlık Antrenmanı', value: eatLifting, color: 'bg-emerald-500', hint: 'Seans süresi × şiddet' },
    { key: 'cardio', label: 'Kardiyo', value: eatCardio, color: 'bg-red-500', hint: 'Aktiviteye göre MET değeri' },
    { key: 'recovery', label: 'Meditasyon & Esneme', value: eatRecovery, color: 'bg-violet-500', hint: 'Dinlenmenin üstündeki küçük hareket katkısı' },
    { key: 'manual', label: 'Elle Eklenen', value: eatManual, color: 'bg-purple-500', hint: 'Senin girdiğin ekstra' },
    { key: 'epoc', label: 'Toparlanma (EPOC)', value: epoc, color: 'bg-orange-500', hint: 'Antrenman sonrası yükselen metabolizma' },
  ].filter(p => p.value > 0);

  return {
    ready: total > 0,
    bmr: base,
    neat,
    neatSource,
    tef,
    lifting: eatLifting,
    cardio: eatCardio,
    recovery: eatRecovery,
    manual: eatManual,
    epoc,
    eat,
    total,
    parts,
    isRestDay: eat === 0,
    // Ölçülen TDEE ile karşılaştırma: bu gün ortalamanın altında mı üstünde mi.
    vsMaintenance: maint > 0 ? Math.round(total - maint) : null,
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
  neatOpts = {},        // dayEnergyBreakdown'a geçirilen NEAT ayarları
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
        recovery: w.mind,
        manual: n.activeCaloriesOut,
        // Gün bazlı adım girilmişse o günün kaydından okunur.
        steps: n.steps,
        ...neatOpts,
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

/**
 * TDEE penceresindeki ortalama günlük egzersiz kalorisi.
 *
 * Ölçülen TDEE bu enerjiyi zaten içerdiği için NEAT artığından düşülmesi
 * gerekir; yoksa antrenman kalorisi hem NEAT'in içinde hem ayrı kalem olarak
 * iki kez sayılır.
 */
export const averageDailyExercise = (dayCalories, days = 28) => {
  if (!dayCalories || days <= 0) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayMs = 24 * 60 * 60 * 1000;

  let toplam = 0;
  for (let i = 0; i < days; i += 1) {
    const d = new Date(today.getTime() - i * dayMs);
    const c = dayCalories(d.toISOString().split('T')[0]);
    toplam += parseNumber(c?.total);
  }
  return Math.round(toplam / days);
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

/**
 * Plan ile gerçekleşen enerji dengesinin karşılaştırması.
 *
 * "Teorik" tek başına havada kalıyor: programın haftada 2800 kcal yakacağını
 * bilmek, o programı uygulayıp uygulamadığını söylemiyor. Burada son 7 günün
 * gerçekleşen harcaması, aynı haftanın plandaki karşılığıyla gün gün yan yana
 * konuyor. Sapmanın işareti önemli — eksi taraf "planı uygulamadım", artı taraf
 * "plandan fazlasını yaptım" demek ve ikisi de haftalık hedefi kaydırıyor.
 *
 * @param planDays computeWeekPlan'ın günleri (kcal + cardioKcal taşır)
 * @param series   buildEnergySeries çıktısı (en yeni önce)
 */
export const planVsActual = (planDays = [], series = [], { maintenance = 0, days = 7 } = {}) => {
  const maint = parseNumber(maintenance);
  if (!(maint > 0) || planDays.length === 0) return null;

  // getDay() pazar=0 verirken plan pazartesi ile başlıyor.
  const HAFTA = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const planByKey = new Map(planDays.map(d => [d.key, d]));

  const son = series.slice(0, days);
  if (son.length === 0) return null;

  const satirlar = son.map(g => {
    const gunKey = HAFTA[new Date(`${g.date}T00:00:00`).getDay()];
    const p = planByKey.get(gunKey);
    const planEgzersiz = p ? parseNumber(p.kcal) + parseNumber(p.cardioKcal) : 0;
    const planEpoc = p ? Math.round(parseNumber(p.kcal) * EPOC_LIFTING + parseNumber(p.cardioKcal) * EPOC_CARDIO) : 0;
    const planToplam = Math.round(maint + planEgzersiz + planEpoc);

    // Gerçekleşen egzersiz: bazal ve sindirim dışındaki kısım.
    const b = g.breakdown || {};
    const gercekEgzersiz = parseNumber(b.eat) + parseNumber(b.epoc);

    return {
      date: g.date,
      dayKey: gunKey,
      planName: p?.template?.name || null,
      plannedExercise: Math.round(planEgzersiz + planEpoc),
      actualExercise: Math.round(gercekEgzersiz),
      plannedTotal: planToplam,
      actualTotal: Math.round(g.out),
      intake: g.intake,
      plannedBalance: Math.round(g.intake - planToplam),
      actualBalance: Math.round(g.balance),
      // Plan gününde hiç egzersiz yoksa "atlandı" demek doğru olmaz.
      skipped: planEgzersiz > 0 && gercekEgzersiz < planEgzersiz * 0.4,
      extra: planEgzersiz === 0 && gercekEgzersiz > 100,
    };
  });

  const topla = (f) => satirlar.reduce((s, r) => s + f(r), 0);
  const planToplam = topla(r => r.plannedTotal);
  const gercekToplam = topla(r => r.actualTotal);
  const alim = topla(r => r.intake);

  return {
    rows: satirlar,
    days: satirlar.length,
    plannedTotal: planToplam,
    actualTotal: gercekToplam,
    intake: alim,
    diff: gercekToplam - planToplam,
    plannedBalance: alim - planToplam,
    actualBalance: alim - gercekToplam,
    // Haftalık farkın kilo karşılığı: 7700 kcal ≈ 1 kg.
    diffKg: Math.round((gercekToplam - planToplam) / 7700 * 100) / 100,
    skippedDays: satirlar.filter(r => r.skipped).length,
    extraDays: satirlar.filter(r => r.extra).length,
  };
};

/**
 * NEAT yöntemlerinin karşılaştırması.
 *
 * Aktif yöntemin sonucu tek başına "doğru mu" sorusuna cevap vermiyor. Burada
 * her yöntem aynı verilerle hesaplanıp yan yana konuyor; kullanıcı kendi
 * gününe hangisinin uyduğunu görüp seçebiliyor. Uygulanamayan yöntem (veri
 * eksikse) neden hesaplanamadığını söylüyor.
 */
export const neatMethodComparison = ({
  maintenance = 0, bmr = 0, tefTotal = 0, avgDailyExercise = 0,
  activityLevel = 'light', steps = 0, neatManual = 0,
  cardioKcal = 0, weightKg = 0, multiplier = 1,
} = {}) => {
  const maint = parseNumber(maintenance);
  const base = parseNumber(bmr);
  const carpan = parseNumber(multiplier) || 1;
  const uygula = (v) => (v === null ? null : Math.round(v * carpan));

  const otoHam = (maint > 0 && base > 0)
    ? Math.max(0, Math.round(maint - base - parseNumber(tefTotal) - parseNumber(avgDailyExercise)))
    : null;

  const lvl = ACTIVITY_LEVELS.find(l => l.key === activityLevel) || ACTIVITY_LEVELS[1];
  const seviyeHam = base > 0 ? Math.round(base * lvl.factor) : null;

  const kardiyoAdim = stepsCoveredByCardio(cardioKcal, weightKg);
  const netAdim = Math.max(0, parseNumber(steps) - kardiyoAdim);
  const adimHam = parseNumber(steps) > 0 ? caloriesFromSteps(netAdim, weightKg) : null;

  const elleHam = parseNumber(neatManual) > 0 ? Math.round(parseNumber(neatManual)) : null;

  return [
    {
      key: 'auto', label: 'Otomatik (artık)', value: uygula(otoHam),
      formula: otoHam === null
        ? 'Gerçek harcama ve bazal metabolizma gerekiyor.'
        : `${maint} korunum − ${base} bazal − ${Math.round(parseNumber(tefTotal))} sindirim − ${Math.round(parseNumber(avgDailyExercise))} ort. egzersiz`,
      note: 'Ölçülen harcamadan diğer bileşenleri düşer. En kişiye özel yöntem; veri biriktikçe isabeti artar.',
    },
    {
      key: 'level', label: `Seviye (${lvl.label})`, value: uygula(seviyeHam),
      formula: seviyeHam === null ? 'Bazal metabolizma gerekiyor.' : `${base} bazal × ${lvl.factor}`,
      note: 'Meslek ve gün düzenine göre kaba tahmin. Veri azken en güvenli başlangıç.',
    },
    {
      key: 'steps', label: 'Adım sayısı', value: uygula(adimHam),
      formula: adimHam === null
        ? 'O güne adım sayısı girilmemiş.'
        : kardiyoAdim > 0
          ? `(${parseNumber(steps)} − ${kardiyoAdim} kardiyo payı) × 0.0005 × ${parseNumber(weightKg)} kg`
          : `${parseNumber(steps)} adım × 0.0005 × ${parseNumber(weightKg)} kg`,
      note: kardiyoAdim > 0
        ? 'Kardiyo olarak girdiğin koşu/yürüyüşün adım karşılığı düşülür, iki kez sayılmaz.'
        : 'Sayaç verisi varsa en somut yöntem. Ayakta durma gibi adımsız hareketi yakalamaz.',
    },
    {
      key: 'manual', label: 'Elle girilen', value: uygula(elleHam),
      formula: elleHam === null ? 'Ayarlardan sabit bir değer girilmemiş.' : `${elleHam} kcal (sabit)`,
      note: 'Kendi ölçümüne veya bir cihaza güveniyorsan doğrudan yaz.',
    },
  ];
};
