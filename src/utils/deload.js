import { parseNumber } from './number.js';
import { dayKey, toLocalDate, formatRange } from './dates.js';

/**
 * Deload (boşaltma) haftası yönetimi.
 *
 * Uygulama zaten "üst üste düşük hazır oluşluk, hacmi %30 düşür" diyordu ama
 * bunu uygulamak tamamen kullanıcıya kalıyordu: her hareket için set sayısını ve
 * ağırlığı elde hesaplamak gerekiyordu. Burası teşhisi uygulamaya bağlıyor —
 * deload açıkken hedefler kendiliğinden ölçekleniyor ve süre dolunca kendiliğinden
 * bitiyor.
 *
 * Üç yaklaşım var çünkü deloadun tek bir doğru biçimi yok:
 *
 *  - HACİM azaltma (set sayısını yarıya indir, ağırlığı koru): ağırlık aynı
 *    kaldığı için kuvvet uyarımı korunur, biriken yorgunluğun asıl kaynağı olan
 *    toplam iş düşer. Çoğu durumda ilk tercih.
 *  - ŞİDDET azaltma (setleri koru, ağırlığı düşür): eklem ve bağ dokusu
 *    şikâyeti öndeyse mantıklı, çünkü sorun toplam iş değil tepe yük.
 *  - DENGELİ: ikisini de orta düzeyde düşürür; hangi tarafın yorduğu belirsizse.
 */

export const DELOAD_PRESETS = [
  {
    key: 'volume', label: 'Hacim Azalt', setScale: 0.5, loadScale: 1,
    summary: 'Set sayısı yarıya, ağırlık aynı',
    detail: 'Ağırlık korunduğu için kuvvet uyarımı devam eder; düşen şey toplam iş. Biriken yorgunluk çoğunlukla hacimden geldiği için varsayılan seçenek.',
  },
  {
    key: 'intensity', label: 'Şiddet Azalt', setScale: 1, loadScale: 0.8,
    summary: 'Ağırlık %20 düşer, set aynı',
    detail: 'Eklem ve bağ dokusu şikâyeti öndeyse uygun: sorun toplam iş değil tepe yük. Hareket kalitesi üzerinde çalışmak için de iyi bir pencere.',
  },
  {
    key: 'balanced', label: 'Dengeli', setScale: 0.65, loadScale: 0.9,
    summary: 'Set %35, ağırlık %10 düşer',
    detail: 'Yorgunluğun hacimden mi şiddetten mi geldiği belirsizse ikisini de orta düzeyde geri çeker.',
  },
];

export const DEFAULT_DELOAD_DAYS = 7;

export const findPreset = (key) =>
  DELOAD_PRESETS.find(p => p.key === key) || DELOAD_PRESETS[0];

/** Boş/kapalı deload ayarı. */
export const emptyDeload = () => ({ active: false, startDate: '', days: DEFAULT_DELOAD_DAYS, preset: 'volume' });

/**
 * Deloadun bugünkü durumu.
 *
 * Süre dolduğunda ayar KENDİLİĞİNDEN yazılmıyor, burada "expired" olarak
 * hesaplanıyor ve hesaplarda kapalı sayılıyor. Sebebi: süre dolması bir kullanıcı
 * eylemi değil, zamanın geçmesi; render sırasında state yazmak React Compiler
 * kurallarına da aykırı. Kullanıcı ayarı kapattığında kayıt temizleniyor.
 *
 * @returns { active, expired, preset, dayIndex, totalDays, daysLeft, setScale, loadScale, rangeLabel }
 */
export const deloadState = (deload, today = dayKey(new Date())) => {
  const preset = findPreset(deload?.preset);
  const kapali = {
    active: false, expired: false, preset,
    dayIndex: 0, totalDays: 0, daysLeft: 0,
    setScale: 1, loadScale: 1, rangeLabel: '',
  };
  if (!deload?.active || !deload?.startDate) return kapali;

  const bas = toLocalDate(deload.startDate);
  const bugun = toLocalDate(today);
  if (!bas || !bugun) return kapali;

  const gunSayisi = Math.max(1, Math.round(parseNumber(deload.days) || DEFAULT_DELOAD_DAYS));
  const gecen = Math.floor((bugun - bas) / 86400000);
  const bitis = new Date(bas);
  bitis.setDate(bas.getDate() + gunSayisi - 1);

  // Başlangıç ileri bir tarihe kaydırılmışsa henüz başlamamıştır.
  if (gecen < 0) {
    return { ...kapali, preset, totalDays: gunSayisi, rangeLabel: formatRange(deload.startDate, dayKey(bitis)) };
  }
  if (gecen >= gunSayisi) {
    return { ...kapali, expired: true, preset, totalDays: gunSayisi, rangeLabel: formatRange(deload.startDate, dayKey(bitis)) };
  }

  return {
    active: true,
    expired: false,
    preset,
    dayIndex: gecen + 1,
    totalDays: gunSayisi,
    daysLeft: gunSayisi - gecen,
    setScale: preset.setScale,
    loadScale: preset.loadScale,
    rangeLabel: formatRange(deload.startDate, dayKey(bitis)),
  };
};

/**
 * Bir hareketin deload'a göre önerilen set sayısı.
 *
 * Aşağı yuvarlanmıyor, en az bir set kalıyor: "deload" hareketi tamamen
 * çıkarmak demek değil, o kasla teması korumak deloadun amacının parçası.
 */
export const deloadSets = (normalSets, state) => {
  const n = Math.round(parseNumber(normalSets));
  if (!state?.active || !(n > 0)) return n;
  return Math.max(1, Math.round(n * state.setScale));
};

/** Deload'a göre önerilen ağırlık; 0.5 kg'a yuvarlanır (plaka gerçekliği). */
export const deloadWeight = (normalWeight, state) => {
  const w = parseNumber(normalWeight);
  if (!state?.active || !(w > 0)) return w;
  return Math.round(w * state.loadScale * 2) / 2;
};

/**
 * Deload önerilmeli mi?
 *
 * Tek bir sinyale bakmıyor: hazır oluşluk üst üste düşükse ya da hacim tavanı
 * (MRV) aşılmışsa. İkisi farklı yollardan aynı sonuca çıkıyor — biri
 * toparlanamama, diğeri fazla yüklenme.
 */
export const shouldSuggestDeload = ({ readiness, isDeloadNeeded, acwr } = {}) => {
  const nedenler = [];
  if (readiness?.deloadOnerisi) {
    nedenler.push(`Son üç seansta hazır oluşluk ortalaması ${readiness.ortalama}/100`);
  }
  if (isDeloadNeeded) {
    nedenler.push('Bir veya daha fazla kas grubunda haftalık hacim toparlanma sınırının (MRV) üstünde');
  }
  const oran = parseNumber(acwr?.acwr);
  if (acwr?.hasEnoughData && oran > 1.5) {
    nedenler.push(`Yüklenme sıçraması yüksek (ACWR ${oran.toFixed(2)})`);
  }
  return { suggest: nedenler.length > 0, reasons: nedenler };
};
