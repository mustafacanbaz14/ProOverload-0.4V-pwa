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
];

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

export const cardioEntryCalories = (entry, weightKg) => {
  const act = findActivity(entry?.type);
  if (!act) return 0;
  return estimateCardioCalories(act.met, weightKg, entry.minutes);
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
