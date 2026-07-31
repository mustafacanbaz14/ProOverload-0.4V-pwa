// Saf hesap modülü — yalnızca bağımsız alt katmanlardan import eder.
import { parseNumber } from './number.js';

/* ------------------------------------------------------------------ *
 *  UYKU
 * ------------------------------------------------------------------ */

/** "23:45" → 1425. Geçersizse null. */
export const timeToMinutes = (value) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(value || '').trim());
  if (!m) return null;
  const h = Number(m[1]);
  const dk = Number(m[2]);
  if (h > 23 || dk > 59) return null;
  return h * 60 + dk;
};

export const minutesToLabel = (total) => {
  const n = Math.max(0, Math.round(parseNumber(total)));
  return `${Math.floor(n / 60)} sa ${String(n % 60).padStart(2, '0')} dk`;
};

/**
 * Yatakta geçen süre (dakika).
 *
 * Yatış saati uyanıştan büyükse gece yarısı geçilmiştir; 24 saat eklenerek
 * düzeltilir. 23:30 → 07:15 böylece 465 dk çıkar, negatif değil.
 */
export const timeInBedMinutes = (bedTime, wakeTime) => {
  const bed = timeToMinutes(bedTime);
  const wake = timeToMinutes(wakeTime);
  if (bed === null || wake === null) return 0;
  return (wake - bed + 1440) % 1440;
};

export const SLEEP_ZONES = [
  { key: 'excellent', label: 'Mükemmel', min: 85, text: 'text-emerald-400', bg: 'bg-emerald-950/25 border-emerald-900/50', bar: 'bg-emerald-500' },
  { key: 'good', label: 'İyi', min: 70, text: 'text-cyan-400', bg: 'bg-cyan-950/20 border-cyan-900/50', bar: 'bg-cyan-500' },
  { key: 'fair', label: 'Orta', min: 55, text: 'text-amber-400', bg: 'bg-amber-950/20 border-amber-900/50', bar: 'bg-amber-500' },
  { key: 'poor', label: 'Yetersiz', min: 0, text: 'text-red-400', bg: 'bg-red-950/25 border-red-900/50', bar: 'bg-red-500' },
];

export const sleepZoneOf = (score) =>
  SLEEP_ZONES.find(z => score >= z.min) || SLEEP_ZONES[SLEEP_ZONES.length - 1];

// İki nokta arasında doğrusal geçiş; eşiklerde puanın zıplamaması için.
const arayaSerp = (x, x0, x1, y0, y1) => {
  if (x1 === x0) return y0;
  const t = Math.min(1, Math.max(0, (x - x0) / (x1 - x0)));
  return y0 + (y1 - y0) * t;
};

/**
 * Uyku süresi puanı (40).
 *
 * 7-9 saat yetişkin için tam puan aralığı. Az uyku hem performansı hem
 * toparlanmayı doğrudan düşürdüğü için aşağı yönde ceza sert; fazla uyku
 * çoğunlukla borç kapatmanın işareti olduğundan daha yumuşak cezalandırılır.
 */
const sureP = (dk) => {
  if (dk >= 420 && dk <= 540) return 40;
  if (dk > 540) return arayaSerp(dk, 540, 720, 40, 22);
  if (dk >= 360) return arayaSerp(dk, 360, 420, 28, 40);
  if (dk >= 240) return arayaSerp(dk, 240, 360, 8, 28);
  return arayaSerp(dk, 0, 240, 0, 8);
};

/**
 * Uyku verimliliği puanı (20) = uyunan süre / yatakta geçen süre.
 *
 * Uykuya dalma süresi ve gece uyanık kalınan dakikalar yataktaki süreden
 * düşülür. %85 klinikte "normal" kabul edilen eşiktir.
 */
const verimP = (oran) => {
  if (oran >= 0.95) return 20;
  if (oran >= 0.85) return arayaSerp(oran, 0.85, 0.95, 15, 20);
  if (oran >= 0.75) return arayaSerp(oran, 0.75, 0.85, 8, 15);
  return arayaSerp(oran, 0.5, 0.75, 0, 8);
};

/** Bölünme puanı (10): gece kaç kez uyanıldı. */
const kesintiP = (sayi) => [10, 8.5, 6.5, 4, 2][Math.min(4, Math.max(0, Math.round(sayi)))];

/**
 * Uyku düzeni puanı (15).
 *
 * Yatış saatinin kendi ortalamasından sapması. Süreden sonra en güçlü ikinci
 * etken düzenlilik: her gün farklı saatte yatmak toplam süre yeterli olsa bile
 * toparlanmayı bozar. Geçmiş yoksa ceza verilmez, nötr puan yazılır.
 */
const duzenP = (sapmaDk) => {
  if (sapmaDk === null) return { puan: 11, not: 'Düzen için en az 3 gece kaydı gerekiyor — şimdilik nötr sayıldı.' };
  if (sapmaDk <= 30) return { puan: 15, not: null };
  if (sapmaDk <= 60) return { puan: 11, not: null };
  if (sapmaDk <= 90) return { puan: 7, not: 'Yatış saatin kendi ortalamandan 1 saatten fazla kaydı.' };
  return { puan: 3, not: 'Yatış saatin çok değişken; sabit bir saat toparlanmayı belirgin iyileştirir.' };
};

/**
 * Yatış saatini gece yarısı etrafında sürekli bir eksene taşır.
 *
 * 23:50 (1430) ile 00:10 (10) aslında 20 dakika arayken çıplak sayı farkı 1420
 * çıkar. Öğleden sonrasındaki saatler negatife çekilerek bu kırılma kaldırılır:
 * 23:50 → -10, 00:10 → 10.
 */
const yatisEkseni = (dk) => (dk >= 720 ? dk - 1440 : dk);

/**
 * Bir gecenin 100 üzerinden uyku puanı.
 *
 * @param record  { bedTime, wakeTime, latency, awakenings, awakeMinutes, refreshed }
 * @param history önceki gece kayıtları (düzen puanı için)
 */
export const computeSleepScore = (record = {}, history = []) => {
  const inBed = timeInBedMinutes(record.bedTime, record.wakeTime);
  if (!inBed) return null;

  const latency = Math.max(0, parseNumber(record.latency));
  const awakeMin = Math.max(0, parseNumber(record.awakeMinutes));
  const awakenings = Math.max(0, parseNumber(record.awakenings));
  // Uyunan süre yataktaki süreyi aşamaz ve negatife düşemez.
  const uyunan = Math.max(0, Math.min(inBed, inBed - latency - awakeMin));
  const verim = inBed > 0 ? uyunan / inBed : 0;

  // Düzen: son 14 gecenin yatış saatlerinin ortalaması referans alınır.
  const gecmisYatis = (history || [])
    .map(h => timeToMinutes(h?.bedTime))
    .filter(v => v !== null)
    .slice(0, 14)
    .map(yatisEkseni);
  const buGece = timeToMinutes(record.bedTime);
  let sapma = null;
  if (gecmisYatis.length >= 3 && buGece !== null) {
    const ort = gecmisYatis.reduce((s, v) => s + v, 0) / gecmisYatis.length;
    sapma = Math.abs(yatisEkseni(buGece) - ort);
  }
  const duzen = duzenP(sapma);

  const parcalar = [
    { key: 'sure', label: 'Süre', max: 40, value: sureP(uyunan) },
    { key: 'verim', label: 'Verimlilik', max: 20, value: verimP(verim) },
    { key: 'kesinti', label: 'Bölünmezlik', max: 10, value: kesintiP(awakenings) },
    { key: 'dinclik', label: 'Uyanınca dinçlik', max: 15, value: arayaSerp(parseNumber(record.refreshed) || 5, 1, 10, 0, 15) },
    { key: 'duzen', label: 'Düzen', max: 15, value: duzen.puan },
  ].map(p => ({ ...p, value: Math.round(p.value * 10) / 10 }));

  const score = Math.round(parcalar.reduce((s, p) => s + p.value, 0));

  const notlar = [];
  if (duzen.not) notlar.push(duzen.not);
  if (uyunan < 360) notlar.push('6 saatin altındaki uyku maksimal güç ve teknik üzerinde ölçülebilir kayıp yaratır; bugün rekor denemesi uygun değil.');
  if (verim < 0.85 && inBed > 0) notlar.push(`Yatakta ${minutesToLabel(inBed)} geçirdin ama ${minutesToLabel(uyunan)} uyudun. Yatağa uykun gelince gitmek verimi yükseltir.`);
  if (uyunan > 600) notlar.push('10 saatin üstü uyku genellikle birikmiş uyku borcunun işareti; birkaç gün düzenli saatte yatmayı dene.');

  return {
    score,
    zone: sleepZoneOf(score),
    inBed,
    asleep: uyunan,
    efficiency: Math.round(verim * 100),
    parts: parcalar,
    notes: notlar,
    bedDeviation: sapma === null ? null : Math.round(sapma),
  };
};

/** Son N gecenin ortalaması ve eğilimi. */
export const sleepTrend = (records = [], count = 14) => {
  const seri = (records || [])
    .filter(r => r?.sleep && timeInBedMinutes(r.sleep.bedTime, r.sleep.wakeTime) > 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, count)
    .reverse();

  if (seri.length === 0) return null;

  const puanlar = seri.map((r, i) => {
    // Her gece kendi öncesine göre puanlanır; düzen puanı geçmişe bakıyor.
    const oncekiler = seri.slice(0, i).map(x => x.sleep).reverse();
    const s = computeSleepScore(r.sleep, oncekiler);
    return { date: r.date, score: s?.score ?? 0, asleep: s?.asleep ?? 0 };
  });

  const ortPuan = Math.round(puanlar.reduce((s, p) => s + p.score, 0) / puanlar.length);
  const ortSure = Math.round(puanlar.reduce((s, p) => s + p.asleep, 0) / puanlar.length);
  const son3 = puanlar.slice(-3);
  const oncekiler = puanlar.slice(0, -3);
  const degisim = (son3.length === 3 && oncekiler.length > 0)
    ? Math.round(son3.reduce((s, p) => s + p.score, 0) / 3 - oncekiler.reduce((s, p) => s + p.score, 0) / oncekiler.length)
    : null;

  return {
    seri: puanlar,
    ortalama: ortPuan,
    ortalamaSure: ortSure,
    degisim,
    zone: sleepZoneOf(ortPuan),
    kayitSayisi: puanlar.length,
  };
};

/* ------------------------------------------------------------------ *
 *  MEDİTASYON & ESNEME
 * ------------------------------------------------------------------ */

/**
 * MET değerleri Compendium'dan; ikisi de düşük şiddetli olduğu için kalori
 * katkısı küçük ama sıfır değil. Esneme antrenman sonrası toparlanmanın,
 * meditasyon ise stres yönetiminin takip edilen kısmı.
 */
export const MIND_KINDS = [
  {
    key: 'meditation', label: 'Meditasyon', met: 1.3, color: 'text-purple-400',
    accent: 'border-purple-900/50 bg-purple-950/20',
    styles: ['Nefes', 'Farkındalık', 'Body Scan', 'Yoga Nidra', 'Rehberli', 'Diğer'],
  },
  {
    key: 'stretching', label: 'Esneme', met: 2.3, color: 'text-cyan-400',
    accent: 'border-cyan-900/50 bg-cyan-950/20',
    styles: ['Statik', 'Dinamik', 'Mobilite', 'Foam Roller', 'Yoga', 'Diğer'],
  },
];

export const findMindKind = (key) => MIND_KINDS.find(k => k.key === key) || MIND_KINDS[0];

/**
 * Belirli bir aralık için özet.
 *
 * @param records gün kayıtları (her biri { date, mind: [...] })
 * @param days    kaç günlük pencere (1 = bugün, 7 = hafta, 30 = ay)
 * @param endDate pencerenin son günü, "YYYY-MM-DD"
 */
export const mindSummary = (records = [], days = 7, endDate = null) => {
  const son = endDate ? new Date(`${endDate}T00:00:00`) : new Date();
  son.setHours(0, 0, 0, 0);
  const ilk = new Date(son);
  ilk.setDate(ilk.getDate() - (days - 1));

  const icinde = (records || []).filter(r => {
    if (!r?.date) return false;
    const d = new Date(`${r.date}T00:00:00`);
    return d >= ilk && d <= son;
  });

  const toplam = {};
  MIND_KINDS.forEach(k => { toplam[k.key] = { minutes: 0, sessions: 0 }; });

  const gunler = new Set();
  icinde.forEach(r => {
    (r.mind || []).forEach(e => {
      const k = toplam[e.kind];
      if (!k) return;
      const dk = Math.max(0, parseNumber(e.minutes));
      if (dk <= 0) return;
      k.minutes += dk;
      k.sessions += 1;
      gunler.add(r.date);
    });
  });

  const toplamDk = Object.values(toplam).reduce((s, v) => s + v.minutes, 0);
  return {
    days,
    byKind: toplam,
    totalMinutes: toplamDk,
    totalSessions: Object.values(toplam).reduce((s, v) => s + v.sessions, 0),
    activeDays: gunler.size,
    dailyAverage: Math.round(toplamDk / days),
  };
};

/** Kesintisiz gün serisi — bugün boşsa dünden başlar (gün henüz bitmedi). */
export const mindStreak = (records = [], todayStr) => {
  const dolu = new Set(
    (records || [])
      .filter(r => (r.mind || []).some(e => parseNumber(e.minutes) > 0))
      .map(r => r.date));

  const gun = new Date(`${todayStr}T00:00:00`);
  if (!dolu.has(todayStr)) gun.setDate(gun.getDate() - 1);

  let seri = 0;
  for (let i = 0; i < 400; i += 1) {
    const anahtar = `${gun.getFullYear()}-${String(gun.getMonth() + 1).padStart(2, '0')}-${String(gun.getDate()).padStart(2, '0')}`;
    if (!dolu.has(anahtar)) break;
    seri += 1;
    gun.setDate(gun.getDate() - 1);
  }
  return seri;
};

/** Meditasyon/esnemenin kalori katkısı — dinlenmenin üstü, (MET − 1). */
export const mindCalories = (entries = [], weightKg = 0) => {
  const w = parseNumber(weightKg);
  if (!(w > 0)) return 0;
  return Math.round((entries || []).reduce((sum, e) => {
    const kind = findMindKind(e.kind);
    const dk = Math.max(0, parseNumber(e.minutes));
    return sum + (kind.met - 1) * 3.5 * w / 200 * dk;
  }, 0));
};

/** Belirli bir günün meditasyon/esneme kalorisi. */
export const dayMindCalories = (records = [], dateStr, weightKg = 0) => {
  const gun = (records || []).find(r => r.date === dateStr);
  return gun ? mindCalories(gun.mind || [], weightKg) : 0;
};

/** Boş bir gün kaydı. */
export const emptyWellnessDay = (date, id) => ({
  id,
  date,
  sleep: { bedTime: '', wakeTime: '', latency: '', awakenings: '', awakeMinutes: '', refreshed: 6, note: '' },
  mind: [],
});

/**
 * Yedekten veya eski localStorage kaydından gelen toparlanma gününü güvenli
 * şekle getirir. Eksik alanlar tamamlanır; geçersiz bir kayıt tüm ekranı
 * bozmak yerine boş gün biçimine düşer.
 */
export const mergeWellnessDay = (data = {}, idFactory = () => `wellness-${Date.now()}`) => {
  const base = emptyWellnessDay(
    typeof data?.date === 'string' ? data.date : '',
    data?.id || idFactory(),
  );
  const sleep = data?.sleep && typeof data.sleep === 'object' ? data.sleep : {};
  const mind = Array.isArray(data?.mind)
    ? data.mind
      .filter(entry => entry && typeof entry === 'object')
      .map(entry => ({
        id: entry.id || idFactory(),
        kind: typeof entry.kind === 'string' ? entry.kind : 'meditation',
        minutes: Math.max(0, parseNumber(entry.minutes)),
        note: typeof entry.note === 'string' ? entry.note : '',
      }))
    : [];

  return {
    ...base,
    ...data,
    id: data?.id || base.id,
    date: base.date,
    sleep: { ...base.sleep, ...sleep },
    mind,
  };
};
