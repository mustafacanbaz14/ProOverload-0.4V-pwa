// Saf hesap modülü — yalnızca aynı katmandaki bağımsız modüllerden import eder.
import { parseNumber } from './number.js';

/**
 * Antrenman öncesi hazır oluşluk.
 *
 * Beş girdi 1-10 arasında toplanır. Uyku ve karbonhidrat yüklemesi YÜKSEK
 * olduğunda iyidir; stres, kas ağrısı ve eklem ağrısı DÜŞÜK olduğunda iyidir.
 * Bu yüzden ikinci grup ters çevrilerek toplanır.
 *
 * Eklem ağrısı ayrı bir girdi çünkü kas ağrısıyla aynı şey değil: DOMS birkaç
 * gün içinde geçer ve antrenmanı çoğunlukla engellemez, eklem ağrısı ise
 * yüklenmeye devam edilirse sakatlığa dönüşür. Bu yüzden aşağıda ayrıca
 * tek başına da kontrol edilir.
 */
export const READINESS_FIELDS = [
  { key: 'sleep', label: 'Uyku & Toparlanma', low: 'Berbat', high: 'Mükemmel', invert: false, accent: 'accent-cyan-500', color: 'text-cyan-400' },
  { key: 'stress', label: 'Psikolojik Stres', low: 'Sakin', high: 'Çok yüksek', invert: true, accent: 'accent-orange-500', color: 'text-orange-400' },
  { key: 'soreness', label: 'Kas Ağrısı (DOMS)', low: 'Yok', high: 'Şiddetli', invert: true, accent: 'accent-red-500', color: 'text-red-400' },
  { key: 'jointPain', label: 'Eklem Ağrısı', low: 'Yok', high: 'Şiddetli', invert: true, accent: 'accent-red-500', color: 'text-red-400' },
  { key: 'carbs', label: 'Antrenman Öncesi Karbonhidrat', low: 'Aç / boş', high: 'İyi yüklenmiş', invert: false, accent: 'accent-amber-500', color: 'text-amber-400' },
];

export const DEFAULT_READINESS = {
  sleep: 5, stress: 5, soreness: 5, jointPain: 1, carbs: 5,
};

/** Dört bölge: eşikler 100 üzerinden normalize edilmiş skora göre. */
export const READINESS_ZONES = [
  {
    key: 'peak', label: 'Zirve', min: 80,
    text: 'text-emerald-400', bg: 'bg-emerald-950/25 border-emerald-900/50', bar: 'bg-emerald-500',
    advice: 'Rekor denemesi için uygun gün. Ağır bileşik hareketlerde ağırlık artırabilir, RIR 0-1 aralığında çalışabilirsin.',
  },
  {
    key: 'good', label: 'Yeterli', min: 60,
    text: 'text-cyan-400', bg: 'bg-cyan-950/20 border-cyan-900/50', bar: 'bg-cyan-500',
    advice: 'Planlanan antrenmanı olduğu gibi uygula. Hedef tekrar aralığının üst sınırına ulaştığın hareketlerde ağırlığı artır.',
  },
  {
    key: 'moderate', label: 'Orta', min: 40,
    text: 'text-amber-400', bg: 'bg-amber-950/20 border-amber-900/50', bar: 'bg-amber-500',
    advice: 'Hacmi koru ama şiddeti düşür: RIR 2-3 ile çalış, ağırlık artırma. Tekniğin bozulduğu seti bitir, zorlama.',
  },
  {
    key: 'critical', label: 'Kritik', min: 0,
    text: 'text-red-400', bg: 'bg-red-950/25 border-red-900/50', bar: 'bg-red-500',
    advice: 'Bugün yüklenme günü değil. Set sayısını yarıya indir, ağırlığı %20-30 düşür ya da hafif kardiyo/esneme ile geçiştir.',
  },
];

/**
 * Hazır oluşluk skoru.
 * @returns { raw, score (0-100), zone, warnings }
 */
export const computeReadiness = (form = {}) => {
  const v = (k) => {
    const n = parseNumber(form[k] ?? DEFAULT_READINESS[k]);
    return Math.min(10, Math.max(1, n));
  };

  // Her alan 1-10; ters olanlar 11-x ile çevrilir. Toplam 5-50 arası.
  const raw = READINESS_FIELDS.reduce((sum, f) => sum + (f.invert ? 11 - v(f.key) : v(f.key)), 0);
  const score = Math.round(((raw - 5) / 45) * 100);
  const zone = READINESS_ZONES.find(z => score >= z.min) || READINESS_ZONES[READINESS_ZONES.length - 1];

  const warnings = [];
  // Eklem ağrısı skoru ortalamaya karışıp kaybolmamalı: tek başına yüksekse
  // diğer her şey iyi olsa bile uyarı verilir.
  if (v('jointPain') >= 7) {
    warnings.push({
      key: 'joint',
      text: 'Eklem ağrın yüksek. Ağrıyan eklemi zorlayan hareketleri bugün atla ya da makine/izolasyon varyantıyla değiştir; DOMS geçer, eklem sorunu ısrar edilirse kalıcılaşır.',
    });
  }
  if (v('carbs') <= 3) {
    warnings.push({
      key: 'carbs',
      text: 'Karbonhidrat deposu düşük. Uzun ve yüksek hacimli seansta performans son setlerde belirgin düşer; seansı kısalt ya da öncesinde hızlı sindirilen karbonhidrat al.',
    });
  }
  if (v('sleep') <= 3) {
    warnings.push({
      key: 'sleep',
      text: 'Uyku yetersiz. Sinir sistemi toparlanmadığı için maksimal yüklerde hem performans hem teknik düşer; bugün ağırlık rekoru deneme.',
    });
  }

  return { raw, score, zone, warnings };
};

/**
 * Hazır oluşluk trendi.
 *
 * Tek günün skoru gürültülü — kötü uyunan bir gece her şeyi düşürür. Eğilim
 * son kayıtların ortalamasından okunur.
 */
export const readinessTrend = (workouts = [], count = 10) => {
  const kayitlar = workouts
    .filter(w => w.readiness && parseNumber(w.readiness.score) >= 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, count);

  if (kayitlar.length === 0) return null;

  // Eski kayıtlarda skor 3-15 arası ham toplamdı; 0-100 ölçeğine taşınır.
  const normalize = (r) => {
    const s = parseNumber(r.score);
    if (r.jointPain !== undefined || s > 15) return s;
    return Math.round(((s - 3) / 12) * 100);
  };

  const seri = kayitlar.map(w => ({ date: w.date, score: normalize(w.readiness) })).reverse();
  const ortalama = Math.round(seri.reduce((s, p) => s + p.score, 0) / seri.length);

  // Son üç kayıt ile ondan öncekiler karşılaştırılır.
  const son3 = seri.slice(-3);
  const oncekiler = seri.slice(0, -3);
  const sonOrt = son3.length ? son3.reduce((s, p) => s + p.score, 0) / son3.length : null;
  const oncekiOrt = oncekiler.length ? oncekiler.reduce((s, p) => s + p.score, 0) / oncekiler.length : null;
  const degisim = (sonOrt !== null && oncekiOrt !== null) ? Math.round(sonOrt - oncekiOrt) : null;

  // Üst üste düşük skor, hacim yüksek olmasa bile toparlanamama işareti.
  const ustUsteDusuk = seri.slice(-3).length === 3 && seri.slice(-3).every(p => p.score < 45);

  return {
    seri, ortalama, degisim, kayitSayisi: seri.length,
    deloadOnerisi: ustUsteDusuk,
    zone: READINESS_ZONES.find(z => ortalama >= z.min) || READINESS_ZONES[3],
  };
};
