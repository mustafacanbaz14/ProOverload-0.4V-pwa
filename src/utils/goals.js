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
} = {}) => {
  const tdee = parseNumber(maintenance);
  const weight = parseNumber(weightKg);
  if (!(tdee > 0)) return null;

  if (nutritionGoal === 'maintenance' || !weight) {
    return { target: Math.round(tdee), offset: 0, label: 'Korunum' };
  }

  const perDay = (weeklyPct) => Math.round((weeklyPct / 100) * weight * KCAL_PER_KG / 7);

  if (nutritionGoal === 'cut') {
    const advice = energyBalanceAdvice(tdee, tdee, { weightKg: weight, bodyFatPct });
    const desired = perDay(0.6);
    // Güvenli sınırı aşmasın: yağ oranı düşükse önerilen açık da daralır.
    const deficit = advice?.maxSafeDeficit > 0
      ? Math.min(desired, advice.maxSafeDeficit)
      : desired;
    return { target: Math.round(tdee - deficit), offset: -deficit, label: 'Yağ Yakım' };
  }

  const surplus = perDay(0.3);
  return { target: Math.round(tdee + surplus), offset: surplus, label: 'Büyüme' };
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
