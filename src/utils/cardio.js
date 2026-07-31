/**
 * Kardiyo aktiviteleri ve kalori tahmini.
 *
 * MET değerleri 2011 Compendium of Physical Activities'ten alındı. MET, o
 * aktivitenin dinlenme metabolizmasının kaç katı enerji harcattığını söyler:
 * 1 MET ≈ oturur haldeki tüketim.
 */

export const CARDIO_ACTIVITIES = [
  { key: 'walk', label: 'Yürüyüş', met: 3.5, group: 'Koşu & Yürüyüş', hint: 'Rahat tempo, ~5 km/s' },
  { key: 'walk_incline', label: 'Eğimli Yürüyüş', met: 6.0, group: 'Koşu & Yürüyüş', hint: 'Bantta %10-12 eğim, tutunmadan' },
  { key: 'zone2', label: 'Zone 2 Koşu', met: 7.0, group: 'Koşu & Yürüyüş', hint: 'Konuşabildiğin tempo, nabız maks. %60-70' },
  { key: 'run', label: 'Tempolu Koşu', met: 9.8, group: 'Koşu & Yürüyüş', hint: '~10 km/s sabit tempo' },
  { key: 'interval', label: 'İnterval Koşu', met: 11.5, group: 'Koşu & Yürüyüş', hint: 'Sprint + toparlanma dönüşümlü' },
  { key: 'hiit', label: 'HIIT', met: 9.0, group: 'Yüksek Şiddet', hint: 'Kısa maksimal setler, tam olmayan dinlenme' },
  { key: 'jump_rope', label: 'İp Atlama', met: 11.0, group: 'Yüksek Şiddet', hint: 'Orta tempo, sürekli' },
  { key: 'boxing', label: 'Boks / Kick Boks', met: 7.8, group: 'Yüksek Şiddet', hint: 'Torba veya partnerle' },
  { key: 'bike', label: 'Bisiklet', met: 7.5, group: 'Makine', hint: 'Orta şiddet, ~20 km/s' },
  { key: 'spinning', label: 'Spinning', met: 8.5, group: 'Makine', hint: 'Grup dersi temposu' },
  { key: 'rower', label: 'Kürek Ergo', met: 7.0, group: 'Makine', hint: 'Orta şiddet' },
  { key: 'stair', label: 'Merdiven / StairMaster', met: 9.0, group: 'Makine', hint: 'Sabit tempo' },
  { key: 'elliptical', label: 'Eliptik', met: 5.0, group: 'Makine', hint: 'Orta şiddet' },
  { key: 'swim', label: 'Yüzme', met: 8.3, group: 'Spor', hint: 'Serbest stil, orta tempo' },
  { key: 'basketball', label: 'Basketbol', met: 6.5, group: 'Spor', hint: 'Yarı saha maç temposu' },
  { key: 'football', label: 'Futbol', met: 7.0, group: 'Spor', hint: 'Amatör maç' },
  { key: 'tennis', label: 'Tenis', met: 7.3, group: 'Spor', hint: 'Tekler maç' },
  { key: 'volleyball', label: 'Voleybol', met: 4.0, group: 'Spor', hint: 'Salon, amatör' },
  { key: 'padel', label: 'Padel / Squash', met: 7.3, group: 'Spor', hint: 'Sürekli ralli' },
  { key: 'hike', label: 'Doğa Yürüyüşü', met: 6.0, group: 'Spor', hint: 'Engebeli arazi' },
  { key: 'basketball_half', label: 'Basketbol (Yarı Saha)', met: 4.5, group: 'Spor', hint: 'Şut atma, hafif tempo' },
  { key: 'pilates', label: 'Pilates', met: 3.0, group: 'Spor', hint: 'Mat çalışması' },
  { key: 'yoga', label: 'Yoga', met: 3.0, group: 'Spor', hint: 'Hatha/akış temposu' },
  { key: 'climbing', label: 'Tırmanış', met: 8.0, group: 'Spor', hint: 'Boulder / duvar' },
  { key: 'skiing', label: 'Kayak / Snowboard', met: 6.8, group: 'Spor', hint: 'Pist, orta tempo' },
  { key: 'dance', label: 'Dans', met: 5.5, group: 'Spor', hint: 'Sosyal dans temposu' },
  { key: 'stationary_bike', label: 'Sabit Bisiklet (Hafif)', met: 5.0, group: 'Makine', hint: 'Düşük direnç' },
  { key: 'treadmill_walk', label: 'Bantta Yürüyüş', met: 4.3, group: 'Makine', hint: 'Düz, 5-6 km/s' },
  { key: 'ski_erg', label: 'Ski Ergo', met: 7.0, group: 'Makine', hint: 'Orta şiddet' },
  { key: 'assault_bike', label: 'Assault Bike', met: 10.0, group: 'Yüksek Şiddet', hint: 'Kollu bisiklet, yüksek şiddet' },
  { key: 'burpee', label: 'Burpee / Vücut Ağırlığı', met: 8.0, group: 'Yüksek Şiddet', hint: 'Sürekli tempo' },
  { key: 'sled', label: 'Kızak İtme / Çekme', met: 9.5, group: 'Yüksek Şiddet', hint: 'Ağır kızak, aralıklı' },
  { key: 'housework', label: 'Ev İşi', met: 3.3, group: 'Günlük', hint: 'Temizlik, toparlama' },
  { key: 'gardening', label: 'Bahçe İşi', met: 3.8, group: 'Günlük', hint: 'Kazma, budama' },
  { key: 'shopping_walk', label: 'Alışveriş / Şehir Yürüyüşü', met: 3.5, group: 'Günlük', hint: 'Duraklamalı yürüyüş' },
  { key: 'stairs_daily', label: 'Merdiven Çıkma (Günlük)', met: 5.0, group: 'Günlük', hint: 'Bina merdiveni' },
  // Cinsel aktivite: Compendium'da 1.8-2.8 MET aralığında ölçülmüştür ve
  // ortalama süre kısadır. Popüler kaynaklardaki yüksek rakamlar ölçüme
  // dayanmıyor; burada bilerek gerçekçi değer kullanılıyor.
  { key: 'sex', label: 'Cinsel Aktivite', met: 2.8, group: 'Günlük', hint: 'Ölçümlere göre 1.8-2.8 MET; abartılı tahminlerden kaçınıldı' },
];

/**
 * Tempo / zorluk kademeleri.
 *
 * Compendium aynı aktiviteyi şiddete göre ayrı satırlarda listeliyor —
 * basketbol "şut atma" 4.5 iken "maç" 8.0 MET. Yani tek bir MET değeri o
 * aktiviteyi temsil etmiyor; nasıl yapıldığı kaloriyi neredeyse iki katına
 * çıkarabiliyor. Buradaki çarpanlar tablodaki genel değeri o aralığa yayıyor.
 *
 * `fatigue` ise kaloriyle aynı şey değil: eğlence temposunda uzun süre oynamak
 * çok kalori yakar ama toparlanmayı fazla zorlamaz; maç temposu kısa sürse bile
 * sinir sistemi ve bacak kaslarında belirgin yorgunluk bırakır. Bu yüzden
 * çakışma tavsiyesi kaloriye değil bu katsayıya bakıyor.
 */
export const CARDIO_EFFORTS = [
  { key: 'fun', label: 'Eğlence', met: 0.72, fatigue: 0.5, hint: 'Rahat sohbet edebiliyorsun, sık duraklama var' },
  { key: 'easy', label: 'Hafif', met: 0.88, fatigue: 0.75, hint: 'Konuşabiliyorsun ama nefes belirgin' },
  { key: 'moderate', label: 'Orta', met: 1, fatigue: 1, hint: 'Tablodaki standart tempo' },
  { key: 'hard', label: 'Zorlu', met: 1.15, fatigue: 1.35, hint: 'Cümle kuramıyorsun, tempo yüksek' },
  { key: 'match', label: 'Maç Temposu', met: 1.3, fatigue: 1.8, hint: 'Yarışma şiddeti, sprintler ve yön değiştirmeler' },
];

export const DEFAULT_EFFORT = 'moderate';

export const findEffort = (key) =>
  CARDIO_EFFORTS.find(e => e.key === key) || CARDIO_EFFORTS.find(e => e.key === DEFAULT_EFFORT);

// Ağırlık antrenmanı: Compendium'da şiddetli çaba 5.0, orta çaba 3.5 MET.
// Süre tahmini setler arası dinlenmeyi de kapsadığı için orta değer alındı.
export const LIFTING_MET = 4.5;

export const CARDIO_GROUPS = [...new Set(CARDIO_ACTIVITIES.map(a => a.group))];

export const findActivity = (key) => CARDIO_ACTIVITIES.find(a => a.key === key) || null;

/**
 * Dinlenmenin ÜSTÜNE harcanan kaloriyi verir.
 *
 * Brüt tüketim (MET × 3.5 × kg / 200) o sürede zaten yakacağın bazal kaloriyi
 * de içerir. TDEE'nin üzerine eklenecek sayı bu değil, aradaki fark olmalı;
 * yoksa dinlenme metabolizması iki kez sayılır. Bu yüzden (MET − 1) kullanılır.
 */
export const estimateCardioCalories = (met, weightKg, minutes) => {
  const w = Number(weightKg);
  const m = Number(minutes);
  if (!(w > 0) || !(m > 0) || !(met > 0)) return 0;
  return Math.round((met - 1) * 3.5 * w / 200 * m);
};

/**
 * Bir kardiyo girdisinin kalorisi.
 *
 * Girdide tempo varsa aktivitenin MET'i o kademeye göre ölçeklenir. Eski
 * kayıtlarda tempo alanı yok — o durumda çarpan 1 olan "orta" kullanılır, yani
 * geçmiş kayıtların kalorisi değişmez.
 */
export const cardioEntryCalories = (entry, weightKg) => {
  const act = findActivity(entry?.type);
  if (!act) return 0;
  const effort = entry?.effort ? findEffort(entry.effort) : null;
  const met = act.met * (effort ? effort.met : 1);
  return estimateCardioCalories(met, weightKg, entry.minutes);
};

/**
 * Yorgunluk yükü — kalori değil, toparlanma maliyeti.
 *
 * Birim keyfi ama tutarlı: MET × dakika × tempo katsayısı / 10. Amaç mutlak bir
 * fizyolojik değer vermek değil, aynı gündeki iki uğraşı karşılaştırılabilir
 * kılmak (çakışma tavsiyesi buna bakıyor).
 */
export const cardioFatigueLoad = (entry) => {
  const act = findActivity(entry?.type);
  if (!act) return 0;
  const dk = Number(entry?.minutes) || 0;
  if (dk <= 0) return 0;
  const effort = entry?.effort ? findEffort(entry.effort) : null;
  return Math.round(act.met * dk * (effort ? effort.fatigue : 1) / 10);
};

/**
 * Planlanan ile gerçekleşen tempo arasındaki fark.
 *
 * Plan "orta tempo 45 dk koşu" derken gerçekte maç temposunda oynandıysa hem
 * kalori hem yorgunluk plandan sapar; haftalık dengeyi bozan da çoğunlukla bu.
 */
export const effortDelta = (entry, weightKg) => {
  const act = findActivity(entry?.type);
  if (!act || !entry?.plannedEffort || !entry?.effort) return null;
  if (entry.plannedEffort === entry.effort) return null;

  const planlanan = findEffort(entry.plannedEffort);
  const gercek = findEffort(entry.effort);
  const dk = Number(entry.plannedMinutes ?? entry.minutes) || 0;

  const planKcal = estimateCardioCalories(act.met * planlanan.met, weightKg, dk);
  const gercekKcal = cardioEntryCalories(entry, weightKg);
  const planYorgunluk = Math.round(act.met * dk * planlanan.fatigue / 10);
  const gercekYorgunluk = cardioFatigueLoad(entry);

  return {
    planned: planlanan,
    actual: gercek,
    kcalDiff: gercekKcal - planKcal,
    fatigueDiff: gercekYorgunluk - planYorgunluk,
    harder: gercek.fatigue > planlanan.fatigue,
  };
};

export const totalCardioCalories = (entries = [], weightKg) =>
  entries.reduce((sum, e) => sum + cardioEntryCalories(e, weightKg), 0);

/** Ağırlık antrenmanının tahmini kalorisi (dinlenme üstü). */
export const estimateLiftingCalories = (minutes, weightKg) =>
  estimateCardioCalories(LIFTING_MET, weightKg, minutes);

/**
 * Bir antrenman kaydının toplam yakımı: ağırlık kısmı + kardiyo girişleri.
 *
 * Kardiyo süresi antrenman süresinin içindeyse çifte sayım olur; ama kardiyo
 * çoğunlukla seans sonrası ya da ayrı yapılıyor ve `duration` yalnızca ağırlık
 * bölümünü ölçüyor. Yine de ayrı ayrı döndürülüyor ki kullanıcı ikisini görüp
 * gerekirse elle düzeltebilsin.
 */
export const workoutCalories = (workout, weightKg) => {
  const lifting = estimateLiftingCalories(workout?.duration || 0, weightKg);
  const cardio = totalCardioCalories(workout?.cardio || [], weightKg);
  return { lifting, cardio, total: lifting + cardio };
};

/** Belirli bir günün tüm antrenman kayıtlarından toplam yakım. */
export const dayWorkoutCalories = (workouts = [], dateStr, weightKg) => {
  const same = workouts.filter(w => w.date === dateStr);
  return same.reduce((acc, w) => {
    const c = workoutCalories(w, weightKg);
    return { lifting: acc.lifting + c.lifting, cardio: acc.cardio + c.cardio, total: acc.total + c.total };
  }, { lifting: 0, cardio: 0, total: 0 });
};
