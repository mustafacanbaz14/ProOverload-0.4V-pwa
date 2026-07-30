// Saf hesap modülü — yalnızca aynı katmandaki bağımsız modüllerden import eder.
import { parseNumber } from './number.js';

/**
 * Vücut kompozisyonu hedefleri ve kalori açığı/fazlası rehberliği.
 *
 * Tüm eşikler mevcut kütle, yağ oranı ve FFMI'dan türetilir — sabit "günde 500
 * kcal açık" tavsiyesi 60 kg'lık ve 110 kg'lık biri için aynı şeyi ifade etmez.
 */

const KCAL_PER_KG = 7700;

export const GOAL_FIELDS = [
  { key: 'goalWeight', label: 'Hedef Kilo', unit: 'kg', min: 30, max: 300, step: 0.1 },
  { key: 'goalBodyFat', label: 'Hedef Yağ Oranı', unit: '%', min: 3, max: 50, step: 0.1 },
  { key: 'goalFFM', label: 'Hedef Kas (Yağsız) Kütle', unit: 'kg', min: 25, max: 150, step: 0.1 },
  { key: 'goalFFMI', label: 'Hedef FFMI', unit: '', min: 15, max: 28, step: 0.1 },
];

/**
 * Hedef alanlarını birbirinden türetir.
 *
 * Dört değer boy sabitken matematiksel olarak bağlı:
 *   yağsız kütle = kilo × (1 − yağ%/100)
 *   FFMI         = yağsız kütle / boy²
 * Yani ikisini bilmek diğer ikisini belirler. Kullanıcı 90 kg ve FFMI 23
 * yazınca kas kütlesi ve yağ oranı kendiliğinden çıkar.
 *
 * Yalnızca BOŞ alanlar doldurulur — kullanıcının yazdığı değer her zaman
 * korunur. Üç veya dört alan birden girilip birbirini tutmuyorsa hesap
 * değiştirilmez, tutarsızlık ayrıca bildirilir.
 *
 * @returns { values, derived: {alan: true}, inconsistent: bool, needsHeight: bool }
 */
export const deriveGoalSet = (stored = {}, heightCm = 0) => {
  const h = parseNumber(heightCm) / 100;
  const entered = {};
  GOAL_FIELDS.forEach(f => {
    const v = parseNumber(stored[f.key]);
    if (v > 0) entered[f.key] = v;
  });

  const values = { ...entered };
  const derived = {};

  // Boy olmadan FFMI ilişkisi kurulamaz; kilo↔yağ↔kas üçlüsü yine de çalışır.
  const h2 = h > 0 ? h * h : 0;

  // Sabit noktaya kadar döndür: her tur bilinen ikiliden bir bilinmeyeni doldurur.
  // Zincirleme türetmeyi (kilo+FFMI → kas → yağ) bu şekilde tek mantıkla çözüyoruz.
  for (let pass = 0; pass < 4; pass += 1) {
    const before = Object.keys(values).length;
    // ffm bilerek okunmuyor: her adımda values.goalFFM'in GÜNCEL hâli gerekiyor
    // (aynı turda doldurulmuş olabilir), tur başındaki kopyası değil.
    const { goalWeight: w, goalBodyFat: bf, goalFFMI: ffmi } = values;

    if (values.goalFFM === undefined) {
      if (w > 0 && bf >= 0 && bf < 100) { values.goalFFM = w * (1 - bf / 100); derived.goalFFM = true; }
      else if (ffmi > 0 && h2 > 0) { values.goalFFM = ffmi * h2; derived.goalFFM = true; }
    }
    if (values.goalFFMI === undefined && values.goalFFM > 0 && h2 > 0) {
      values.goalFFMI = values.goalFFM / h2; derived.goalFFMI = true;
    }
    if (values.goalBodyFat === undefined && w > 0 && values.goalFFM > 0 && values.goalFFM <= w) {
      values.goalBodyFat = (1 - values.goalFFM / w) * 100; derived.goalBodyFat = true;
    }
    if (values.goalWeight === undefined && values.goalFFM > 0 && bf >= 0 && bf < 100) {
      values.goalWeight = values.goalFFM / (1 - bf / 100); derived.goalWeight = true;
    }

    if (Object.keys(values).length === before) break;
  }

  GOAL_FIELDS.forEach(f => {
    if (values[f.key] !== undefined) values[f.key] = Math.round(values[f.key] * 10) / 10;
  });

  // Tutarlılık: yağsız kütleye birden fazla yoldan ulaşılabiliyorsa hepsi aynı
  // sonucu vermeli. Kombinasyonları tek tek saymak yerine yolları hesaplayıp
  // karşılaştırıyoruz — kilo+yağ+FFMI gibi üçlüler de böylece kapsanıyor.
  const ffmPaths = [];
  if (entered.goalFFM > 0) ffmPaths.push(entered.goalFFM);
  if (entered.goalWeight > 0 && entered.goalBodyFat >= 0 && entered.goalBodyFat < 100) {
    ffmPaths.push(entered.goalWeight * (1 - entered.goalBodyFat / 100));
  }
  if (entered.goalFFMI > 0 && h2 > 0) ffmPaths.push(entered.goalFFMI * h2);

  // 0.6 kg yuvarlama payı: alanlar tek ondalık tutuyor.
  const inconsistent = ffmPaths.length >= 2
    && Math.max(...ffmPaths) - Math.min(...ffmPaths) > 0.6;

  return {
    values,
    derived,
    inconsistent,
    // FFMI yalnızca boy bilinirse türetilebilir.
    needsHeight: h2 === 0 && (entered.goalFFMI > 0 || Object.keys(entered).length > 0),
  };
};

/**
 * Bir hedef için ilerleme.
 *
 * Başlangıç noktası, hedefin belirlendiği andaki değer değil, elimizdeki EN ESKİ
 * ölçüm. Kullanıcı hedefi sonradan koyduğu için "ne kadar yol aldım" sorusunun
 * tek dürüst cevabı bu; yoksa hedef konduğu an ilerleme %0 görünürdü.
 */
export const goalProgress = (startValue, currentValue, targetValue) => {
  const start = parseNumber(startValue);
  const current = parseNumber(currentValue);
  const target = parseNumber(targetValue);
  if (!(target > 0) || !(current > 0)) return null;

  const remaining = Math.round((target - current) * 10) / 10;
  const direction = remaining > 0 ? 'up' : remaining < 0 ? 'down' : 'reached';

  // Toplam yol belirsizse (başlangıç yok ya da hedefe eşit) yüzde hesaplanamaz.
  const totalDistance = start > 0 ? Math.abs(target - start) : 0;
  const covered = start > 0 ? Math.abs(current - start) : 0;
  let percent = null;
  if (totalDistance > 0) {
    // Hedefi geçmek %100'ün üstünde görünmesin.
    percent = Math.max(0, Math.min(100, Math.round((covered / totalDistance) * 100)));
    // Ters yöne gidildiyse ilerleme yok demektir.
    const startedAbove = start > target;
    const goingRightWay = startedAbove ? current <= start : current >= start;
    if (!goingRightWay) percent = 0;
  }

  return {
    current: Math.round(current * 10) / 10,
    target: Math.round(target * 10) / 10,
    remaining: Math.abs(remaining),
    direction,
    percent,
    reached: direction === 'reached'
      || (start > target && current <= target)
      || (start > 0 && start < target && current >= target),
  };
};

/**
 * Kalori açığı/fazlası değerlendirmesi.
 *
 * Açığın güvenli üst sınırı yağ kütlesine bağlıdır: yağ deposu azaldıkça vücut
 * enerjiyi kastan karşılamaya başlar. Literatürde yaygın kural, haftalık kaybın
 * vücut ağırlığının %0.5-1'i arasında kalması ve yağ oranı düştükçe alt uca
 * yaklaşılması.
 *
 * @param intake      günlük ortalama alım (kcal)
 * @param maintenance korunum kalorisi (gerçek TDEE varsa o)
 * @param opts        { weightKg, bodyFatPct, ffmi }
 */
export const energyBalanceAdvice = (intake, maintenance, {
  weightKg = 0,
  bodyFatPct = 0,
  ffmi = 0,
} = {}) => {
  const cal = parseNumber(intake);
  const tdee = parseNumber(maintenance);
  const weight = parseNumber(weightKg);
  if (!(cal > 0) || !(tdee > 0)) return null;

  const balance = Math.round(cal - tdee);
  const weeklyKg = Math.round((balance * 7 / KCAL_PER_KG) * 100) / 100;

  // Haftalık değişimin vücut ağırlığına oranı — mutlak kg tek başına anlamsız.
  const weeklyPct = weight > 0
    ? Math.round((Math.abs(weeklyKg) / weight) * 1000) / 10
    : null;

  const fat = parseNumber(bodyFatPct);
  // Yağ oranı düştükçe güvenli açık daralır. Yağ verisi yoksa orta değer alınır.
  const maxSafeLossPct = fat <= 0 ? 0.75
    : fat < 10 ? 0.5
      : fat < 15 ? 0.75
        : fat < 25 ? 1.0
          : 1.25;

  const maxSafeDeficit = weight > 0
    ? Math.round((maxSafeLossPct / 100) * weight * KCAL_PER_KG / 7)
    : 0;

  let state = 'maintenance';
  if (balance <= -100) state = 'deficit';
  else if (balance >= 100) state = 'surplus';

  const notes = [];
  let severity = 'ok';

  if (state === 'deficit') {
    const tooAggressive = maxSafeDeficit > 0 && Math.abs(balance) > maxSafeDeficit;
    if (tooAggressive) {
      severity = 'warn';
      notes.push(
        `Açık haftada vücut ağırlığının %${weeklyPct}'i kadar kayıp demek. `
        + `Yağ oranın %${fat > 0 ? fat : '?'} seviyesindeyken güvenli üst sınır `
        + `haftada %${maxSafeLossPct} — yani günde en fazla ${maxSafeDeficit} kcal açık. `
        + 'Daha hızlısında kaybın önemli bölümü kastan gelir.'
      );
    } else {
      notes.push(
        `Haftada ${Math.abs(weeklyKg)} kg kayıp bekleniyor`
        + (weeklyPct !== null ? ` (ağırlığının %${weeklyPct}'i)` : '')
        + '. Bu aralık kas korumak için uygun.'
      );
    }
    if (fat > 0 && fat < 10) {
      severity = severity === 'warn' ? 'warn' : 'info';
      notes.push('Yağ oranın zaten düşük; bu seviyede uzun açık performans ve hormonal dengeyi bozar.');
    }
  } else if (state === 'surplus') {
    // Fazlanın büyük kısmı yağa gider; ileri seviyede kas kazanç hızı düşer.
    const advanced = ffmi > 0 && parseNumber(ffmi) >= 22;
    const aggressive = weight > 0 && Math.abs(weeklyKg) / weight * 100 > 0.5;
    if (aggressive) {
      severity = 'info';
      notes.push(
        `Haftada ${Math.abs(weeklyKg)} kg alım hızlı`
        + (weeklyPct !== null ? ` (ağırlığının %${weeklyPct}'i)` : '')
        + '. Haftada %0.25-0.5 aralığı kas/yağ oranını daha iyi tutar.'
      );
    } else {
      notes.push(
        `Haftada ${Math.abs(weeklyKg)} kg alım bekleniyor. Bu hız kas kazanımı için makul.`
      );
    }
    if (advanced) {
      notes.push(`FFMI ${ffmi} — ileri seviyede kas kazanç hızı yavaşlar, fazlayı küçük tutmak yağ birikimini sınırlar.`);
    }
  } else {
    notes.push('Alım korunum seviyesinde; kilo büyük ölçüde sabit kalır.');
  }

  return {
    balance,
    state,
    weeklyKg,
    weeklyPct,
    maxSafeDeficit,
    maxSafeLossPct,
    severity,
    notes,
  };
};

/**
 * Haftalık kayıp hızı seçenekleri — vücut ağırlığının yüzdesi olarak.
 *
 * Mutlak kg yerine yüzde: haftada 0.5 kg, 60 kg'lık biri için agresif, 110
 * kg'lık biri için yavaştır. Seçilen hız yağ oranına göre belirlenen güvenli
 * sınırı aşamaz — `recommendedCalories` gerekirse kırpar.
 */
export const CUT_RATES = [
  { key: 'slow', label: 'Yavaş', weeklyPct: 0.25, hint: 'Kas korumada en güvenli. Yağ oranı zaten düşükse ideal.' },
  { key: 'moderate', label: 'Ölçülü', weeklyPct: 0.5, hint: 'Çoğu kişi için en iyi denge. Önerilen başlangıç.', default: true },
  { key: 'fast', label: 'Hızlı', weeklyPct: 0.75, hint: 'Yağ oranı yüksekken uygun. Protein ve ağırlık çalışması şart.' },
  { key: 'aggressive', label: 'Agresif', weeklyPct: 1.0, hint: 'Yalnızca yüksek yağ oranında ve kısa dönem. Kas kaybı riski artar.' },
];

/** Haftalık alım hızı seçenekleri — fazlanın yağa gitme oranı hızla artar. */
export const BULK_RATES = [
  { key: 'lean', label: 'Temiz', weeklyPct: 0.125, hint: 'Yağ kazanımı en az. İleri seviye için uygun.' },
  { key: 'moderate', label: 'Ölçülü', weeklyPct: 0.25, hint: 'Kas/yağ oranında en iyi denge. Önerilen başlangıç.', default: true },
  { key: 'fast', label: 'Hızlı', weeklyPct: 0.5, hint: 'Yeni başlayanda işe yarar; ileri seviyede çoğu yağ olur.' },
];

/** Seçilen döneme göre uygun hız listesi. */
export const ratesForGoal = (nutritionGoal) =>
  nutritionGoal === 'cut' ? CUT_RATES : nutritionGoal === 'bulk' ? BULK_RATES : [];

/**
 * Döneme göre önerilen günlük alım.
 *
 * Korunum kalorisini hedef aralığı olarak kullanmak, bilinçli açıkta olan biri
 * için yanıltıcı: her gün "hedefin altında" görünür. Kesmede önerilen alım
 * korunumun altında, büyümede üstünde olmalı.
 *
 * Oranlar vücut ağırlığına göre: kesmede haftada ~%0.6 kayıp (güvenli sınırı
 * aşmayacak şekilde), büyümede haftada ~%0.3 alım — yağ birikimini sınırlar.
 */
export const recommendedCalories = (maintenance, nutritionGoal, {
  weightKg = 0,
  bodyFatPct = 0,
  rate = null,
} = {}) => {
  const tdee = parseNumber(maintenance);
  const weight = parseNumber(weightKg);
  if (!(tdee > 0)) return null;

  if (nutritionGoal === 'maintenance' || !weight) {
    return { target: Math.round(tdee), offset: 0, label: 'Korunum', weeklyPct: 0 };
  }

  const perDay = (weeklyPct) => Math.round((weeklyPct / 100) * weight * KCAL_PER_KG / 7);
  const isCut = nutritionGoal === 'cut';
  const options = isCut ? CUT_RATES : BULK_RATES;
  const chosen = options.find(o => o.key === rate) || options.find(o => o.default) || options[1];

  if (isCut) {
    const advice = energyBalanceAdvice(tdee, tdee, { weightKg: weight, bodyFatPct });
    const desired = perDay(chosen.weeklyPct);
    // Güvenli sınırı aşmasın: yağ oranı düşükse seçilen hız da kırpılır.
    const capped = advice?.maxSafeDeficit > 0
      ? Math.min(desired, advice.maxSafeDeficit)
      : desired;
    return {
      target: Math.round(tdee - capped),
      offset: -capped,
      label: 'Yağ Yakım',
      rateKey: chosen.key,
      rateLabel: chosen.label,
      weeklyPct: chosen.weeklyPct,
      cappedBySafety: capped < desired,
      safeLimitPct: advice?.maxSafeLossPct ?? null,
    };
  }

  const surplus = perDay(chosen.weeklyPct);
  return {
    target: Math.round(tdee + surplus),
    offset: surplus,
    label: 'Büyüme',
    rateKey: chosen.key,
    rateLabel: chosen.label,
    weeklyPct: chosen.weeklyPct,
    cappedBySafety: false,
    safeLimitPct: null,
  };
};

/**
 * Kalori panosu — "bugün nerede duruyorum" sorusunun tek yerden cevabı.
 *
 * Ayrı ayrı yerlere dağılmış sayıları (alınan, yakılan, korunum, hedef, açık)
 * tek bir tutarlı tabloda toplar ve günlük/haftalık iki ölçekte gösterir.
 *
 * @param opts.intake       bugün alınan kalori
 * @param opts.burnedAuto   antrenman + kardiyodan otomatik yakım
 * @param opts.burnedManual kullanıcının elle eklediği yakım
 * @param opts.maintenance  korunum kalorisi (gerçek TDEE varsa o)
 * @param opts.targetIntake döneme göre önerilen alım
 * @param opts.weekIntakes  son 7 günün alım dizisi (haftalık gerçekleşen için)
 * @param opts.weekBurned   son 7 günün toplam yakımı
 */
export const calorieDashboard = ({
  intake = 0,
  burnedAuto = 0,
  burnedManual = 0,
  maintenance = 0,
  targetIntake = 0,
  weekIntakes = [],
  weekBurned = 0,
} = {}) => {
  const inKcal = parseNumber(intake);
  const burned = parseNumber(burnedAuto) + parseNumber(burnedManual);
  const maint = parseNumber(maintenance);
  const target = parseNumber(targetIntake) || maint;

  if (!(maint > 0)) return { ready: false };

  // Günün dengesi: alınan − (korunum + egzersizle yakılan).
  // Korunum zaten dinlenme + günlük yaşamı kapsıyor; egzersiz onun üstüne biner.
  const totalOut = maint + burned;
  const balance = Math.round(inKcal - totalOut);

  // Hedeflenen denge: önerilen alım korunumun neresinde duruyor.
  const targetBalance = Math.round(target + burned - totalOut);

  // Hedefe göre bugün ne kadar sapıldı. Pozitif = hedeften fazla yenmiş.
  const vsTarget = Math.round(inKcal - (target + burned));

  // Haftalık gerçekleşen: yalnızca kayıt girilmiş günler sayılır, boş günü
  // sıfır kalori kabul etmek haftalık açığı olduğundan büyük gösterirdi.
  const loggedDays = weekIntakes.filter(v => parseNumber(v) > 0);
  const weekIntakeTotal = loggedDays.reduce((s, v) => s + parseNumber(v), 0);
  const weekOut = loggedDays.length * maint + parseNumber(weekBurned);
  const weekBalance = loggedDays.length > 0
    ? Math.round(weekIntakeTotal - weekOut)
    : null;

  return {
    ready: true,
    intake: Math.round(inKcal),
    burned: Math.round(burned),
    burnedAuto: Math.round(parseNumber(burnedAuto)),
    burnedManual: Math.round(parseNumber(burnedManual)),
    maintenance: Math.round(maint),
    totalOut: Math.round(totalOut),
    target: Math.round(target),
    targetBalance,
    balance,
    vsTarget,
    // Günlük dengenin haftalık karşılığı — "bu tempo sürerse" okuması.
    projectedWeeklyKg: Math.round((balance * 7 / KCAL_PER_KG) * 100) / 100,
    week: weekBalance === null ? null : {
      days: loggedDays.length,
      intake: Math.round(weekIntakeTotal),
      out: Math.round(weekOut),
      balance: weekBalance,
      kg: Math.round((weekBalance / KCAL_PER_KG) * 100) / 100,
    },
  };
};

/**
 * Hedefe ulaşmak için gereken süre tahmini.
 * Mevcut açık/fazla bu hızda sürerse kaç hafta gerekir.
 */
export const weeksToGoal = (currentWeight, goalWeight, weeklyKg) => {
  const cur = parseNumber(currentWeight);
  const goal = parseNumber(goalWeight);
  const rate = parseNumber(weeklyKg);
  if (!(cur > 0) || !(goal > 0) || rate === 0) return null;

  const delta = goal - cur;
  // Hız hedefin ters yönündeyse süre hesaplanamaz.
  if (Math.sign(delta) !== Math.sign(rate)) return { wrongDirection: true };

  const weeks = Math.abs(delta / rate);
  if (!Number.isFinite(weeks) || weeks > 260) return null; // 5 yıldan uzunu anlamsız
  return { weeks: Math.round(weeks) };
};
