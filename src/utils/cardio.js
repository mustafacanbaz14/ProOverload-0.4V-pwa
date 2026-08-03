/**
 * Kardiyo aktiviteleri ve kalori tahmini.
 *
 * MET değerleri 2011 Compendium of Physical Activities'ten alındı. MET, o
 * aktivitenin dinlenme metabolizmasının kaç katı enerji harcattığını söyler:
 * 1 MET ≈ oturur haldeki tüketim.
 */

export const CARDIO_ACTIVITIES = [
  { key: 'walk', label: 'Yürüyüş', met: 3.5, group: 'Koşu & Yürüyüş', hint: 'Rahat tempo, ~5 km/s', activeRecovery: true },
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
  { key: 'pilates', label: 'Pilates', met: 3.0, group: 'Spor', hint: 'Mat çalışması', activeRecovery: true },
  { key: 'yoga', label: 'Yoga', met: 3.0, group: 'Spor', hint: 'Hatha/akış temposu', activeRecovery: true },
  { key: 'climbing', label: 'Tırmanış', met: 8.0, group: 'Spor', hint: 'Boulder / duvar' },
  { key: 'skiing', label: 'Kayak / Snowboard', met: 6.8, group: 'Spor', hint: 'Pist, orta tempo' },
  { key: 'dance', label: 'Dans', met: 5.5, group: 'Spor', hint: 'Sosyal dans temposu' },
  { key: 'stationary_bike', label: 'Sabit Bisiklet (Hafif)', met: 5.0, group: 'Makine', hint: 'Düşük direnç', activeRecovery: true },
  { key: 'treadmill_walk', label: 'Bantta Yürüyüş', met: 4.3, group: 'Makine', hint: 'Düz, 5-6 km/s', activeRecovery: true },
  { key: 'ski_erg', label: 'Ski Ergo', met: 7.0, group: 'Makine', hint: 'Orta şiddet' },
  { key: 'assault_bike', label: 'Assault Bike', met: 10.0, group: 'Yüksek Şiddet', hint: 'Kollu bisiklet, yüksek şiddet' },
  { key: 'burpee', label: 'Burpee / Vücut Ağırlığı', met: 8.0, group: 'Yüksek Şiddet', hint: 'Sürekli tempo' },
  { key: 'sled', label: 'Kızak İtme / Çekme', met: 9.5, group: 'Yüksek Şiddet', hint: 'Ağır kızak, aralıklı' },
  { key: 'housework', label: 'Ev İşi', met: 3.3, group: 'Günlük', hint: 'Temizlik, toparlama' },
  { key: 'gardening', label: 'Bahçe İşi', met: 3.8, group: 'Günlük', hint: 'Kazma, budama' },
  { key: 'shopping_walk', label: 'Alışveriş / Şehir Yürüyüşü', met: 3.5, group: 'Günlük', hint: 'Duraklamalı yürüyüş', activeRecovery: true },
  { key: 'stairs_daily', label: 'Merdiven Çıkma (Günlük)', met: 5.0, group: 'Günlük', hint: 'Bina merdiveni' },
  // Cinsel aktivite: Compendium'da 1.8-2.8 MET aralığında ölçülmüştür ve
  // ortalama süre kısadır. Popüler kaynaklardaki yüksek rakamlar ölçüme
  // dayanmıyor; burada bilerek gerçekçi değer kullanılıyor.
  { key: 'sex', label: 'Cinsel Aktivite', met: 2.8, group: 'Günlük', hint: 'Ölçümlere göre 1.8-2.8 MET; abartılı tahminlerden kaçınıldı', activeRecovery: true },
];

/**
 * Tempo / zorluk kademeleri.
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
  {
    key: 'fun', label: 'Eğlence', subLabel: 'Aktif toparlanma',
    fullLabel: 'Eğlence / Aktif Toparlanma',
    met: 0.72, fatigue: 0.5,
    hint: 'Rahat sohbet edebiliyorsun, sık duraklama var. Toparlanmayı hızlandırır, yorgunluk eklemez',
  },
  {
    key: 'easy', label: 'Hafif', subLabel: 'Düşük yük',
    fullLabel: 'Hafif',
    met: 0.88, fatigue: 0.75, hint: 'Konuşabiliyorsun ama nefes belirgin',
  },
  {
    key: 'moderate', label: 'Orta', subLabel: 'Standart',
    fullLabel: 'Orta',
    met: 1, fatigue: 1, hint: 'Tablodaki standart tempo',
  },
  {
    key: 'hard', label: 'Zorlu', subLabel: 'Yüksek yük',
    fullLabel: 'Zorlu',
    met: 1.15, fatigue: 1.35, hint: 'Cümle kuramıyorsun, tempo yüksek',
  },
  {
    key: 'match', label: 'Maç', subLabel: 'Yarışma',
    fullLabel: 'Maç Temposu',
    met: 1.3, fatigue: 1.8, hint: 'Yarışma şiddeti, sprintler ve yön değiştirmeler',
  },
  {
    key: 'custom', label: 'Özel', subLabel: 'Elle katsayı',
    fullLabel: 'Özel Tempo',
    met: 1, fatigue: 1, hint: 'Kendi tempo çarpanını elle belirle (0.1 - 3.0)',
  },
];

export const DEFAULT_EFFORT = 'moderate';

export const findEffort = (keyOrEntry, customMultiplier) => {
  const key = typeof keyOrEntry === 'object' ? keyOrEntry?.key || keyOrEntry?.effort : keyOrEntry;
  const mult = typeof keyOrEntry === 'object'
    ? (keyOrEntry?.customEffortMultiplier ?? keyOrEntry?.customMultiplier)
    : customMultiplier;

  if (key === 'custom') {
    const val = Number(mult);
    const numericMult = val > 0 ? Math.min(3.0, Math.max(0.1, val)) : 1.0;
    return {
      key: 'custom',
      label: 'Özel',
      subLabel: `x${numericMult}`,
      fullLabel: `Özel (x${numericMult})`,
      met: numericMult,
      fatigue: numericMult,
      hint: `Elle belirlenmiş ×${numericMult} tempo katsayısı`,
      isCustom: true,
      customMultiplier: numericMult,
    };
  }
  return CARDIO_EFFORTS.find(e => e.key === key) || CARDIO_EFFORTS.find(e => e.key === DEFAULT_EFFORT);
};

// Ağırlık antrenmanı: Compendium'da şiddetli çaba 5.0, orta çaba 3.5 MET.
// Süre tahmini setler arası dinlenmeyi de kapsadığı için orta değer alındı.
export const LIFTING_MET = 4.5;

export const CARDIO_GROUPS = [...new Set(CARDIO_ACTIVITIES.map(a => a.group))];

// Seçici iki farklı kavramı tek "kardiyo" listesinde gösteriyordu. Koşu ve
// kondisyon çalışmaları ayrı, spor/günlük hareketler ayrı başlıkta görünür;
// hesaplama modeli değişmez, hepsi MET tabanlı aktivite kaydıdır.
export const CARDIO_SECTIONS = [
  { key: 'cardio', label: 'Kardiyo & Kondisyon', groups: ['Koşu & Yürüyüş', 'Yüksek Şiddet', 'Makine'] },
  { key: 'activities', label: 'Spor & Aktiviteler', groups: ['Spor'] },
  { key: 'daily', label: 'Günlük Aktiviteler', groups: ['Günlük'] },
];

export const activitySectionOf = (activityKey) => {
  const group = CARDIO_ACTIVITIES.find(activity => activity.key === activityKey)?.group;
  return CARDIO_SECTIONS.find(section => section.groups.includes(group)) || CARDIO_SECTIONS[0];
};

export const findActivity = (key) => CARDIO_ACTIVITIES.find(a => a.key === key) || null;

/**
 * Dinlenmenin ÜSTÜNE harcanan kaloriyi verir.

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
export const cardioEntryCalories = (entry, weightKg, preferProvidedWeight = false) => {
  const act = findActivity(entry?.type);
  if (!act) return 0;
  const effort = findEffort(entry);
  const met = act.met * effort.met;
  const historicalWeight = preferProvidedWeight && Number(weightKg) > 0
    ? Number(weightKg)
    : Number(entry?.weightAtTime) > 0 ? Number(entry.weightAtTime) : weightKg;
  return estimateCardioCalories(met, historicalWeight, entry.minutes);
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
  const effort = findEffort(entry);
  return Math.round(act.met * dk * effort.fatigue / 10);
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
  if (entry.plannedEffort === entry.effort && entry.plannedCustomEffortMultiplier === entry.customEffortMultiplier) return null;

  const planlanan = findEffort(entry.plannedEffort, entry.plannedCustomEffortMultiplier);
  const gercek = findEffort(entry);
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

/**
 * Geçmiş kardiyo kayıtlarını tek listeye açar. En yeni kayıt önce gelir.
 * Haftalık plan, süre boş bırakıldığında aynı aktivitenin kişisel geçmişini
 * kullanır; böylece sabit ve herkese aynı 30 dk varsayımı yapılmaz.
 */
export const cardioHistoryEntries = (workouts = [], activityKey = null) =>
  (Array.isArray(workouts) ? workouts : [])
    .flatMap(workout => (workout?.cardio || []).map(entry => ({
      ...entry,
      weightAtTime: Number(entry.weightAtTime) > 0 ? entry.weightAtTime : workout.weightAtTime,
      date: workout.date,
      workoutId: workout.id,
    })))
    .filter(entry => !activityKey || entry.type === activityKey)
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

/** Son kayıtlardan aktiviteye özel, uç değerlere karşı sınırlı kişisel özet. */
export const cardioHistoryStats = (workouts = [], activityKey, weightKg, limit = 8) => {
  const all = cardioHistoryEntries(workouts, activityKey)
    .filter(entry => Number(entry.minutes) > 0);
  const entries = all.slice(0, Math.max(1, limit));
  if (entries.length === 0) return {
    activityKey, count: 0, totalCount: 0, avgMinutes: 0, avgCalories: 0,
    avgFatigue: 0, usualEffort: DEFAULT_EFFORT, trendMinutes: 0,
  };

  const average = values => Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  const effortCounts = entries.reduce((map, entry) => {
    const key = entry.effort || DEFAULT_EFFORT;
    map.set(key, (map.get(key) || 0) + 1);
    return map;
  }, new Map());
  const usualEffort = [...effortCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || DEFAULT_EFFORT;
  const half = Math.max(1, Math.ceil(entries.length / 2));
  const recent = entries.slice(0, half);
  const older = entries.slice(half);
  const recentAvg = average(recent.map(entry => Number(entry.minutes)));
  const olderAvg = older.length ? average(older.map(entry => Number(entry.minutes))) : recentAvg;

  return {
    activityKey,
    count: entries.length,
    totalCount: all.length,
    avgMinutes: average(entries.map(entry => Number(entry.minutes))),
    avgCalories: weightKg > 0 ? average(entries.map(entry => cardioEntryCalories(entry, weightKg))) : 0,
    avgFatigue: average(entries.map(cardioFatigueLoad)),
    usualEffort,
    trendMinutes: recentAvg - olderAvg,
  };
};

/**
 * Plan süresi önceliği: elle girilen > aynı aktivitenin son 8 kayıt ortalaması
 * > güvenli başlangıç varsayımı. Kaynak ayrıca arayüzde açıkça gösterilir.
 */
export const resolvePlannedCardioMinutes = (slot, workouts = [], weightKg = 0, fallback = 30) => {
  const manual = Number(slot?.minutes);
  if (manual > 0) return { minutes: manual, source: 'manual', stats: cardioHistoryStats(workouts, slot?.activity, weightKg) };
  const stats = cardioHistoryStats(workouts, slot?.activity, weightKg);
  if (stats.avgMinutes > 0) return { minutes: stats.avgMinutes, source: 'history', stats };
  return { minutes: fallback, source: 'default', stats };
};

/**
 * Tek girdinin off day'i bozmayacak kadar düşük yükte olup olmadığı.
 *
 * Rahat yürüyüş/yoga/hafif bisiklet gibi açıkça düşük-yük aktiviteleri tempo
 * düğmesinden bağımsızdır. Diğer aktivitelerde yalnızca “Eğlence / Aktif
 * Toparlanma” veya “Özel” tempo seçimi ile MET <= 5.2 olan durumlar geçerlidir.
 * 90 dakika sınırı da çok uzun bir aktivitenin sessizce off day sayılmasını engeller.
 */
export const isActiveRecoveryEntry = (entry = {}) => {
  const activityKey = entry.type
    || (typeof entry.activity === 'string' ? entry.activity : entry.activity?.key);
  const activity = findActivity(activityKey);
  const minutes = Number(entry.minutes) || 0;
  if (!activity || minutes <= 0 || minutes > 90) return false;
  if (activity.activeRecovery) return true;
  const effort = findEffort(entry);
  return (effort.key === 'fun' || effort.key === 'custom') && activity.met * effort.met <= 5.2;
};

/** Yalnız aktif-toparlanma girdileri bulunan günü aktif dinlenme sınıflar. */
export const isActiveRecoveryCardioDay = (strengthSessionCount = 0, entries = []) =>
  Number(strengthSessionCount) === 0
  && entries.length > 0
  && entries.every(isActiveRecoveryEntry);

/** Arşiv kartında tek kaydı aynı aktivitenin kişisel ortalamasıyla kıyaslar. */
export const evaluateCardioEntry = (entry, workouts = [], weightKg = 0, preferProvidedWeight = false) => {
  const stats = cardioHistoryStats(workouts, entry?.type, weightKg);
  const minutes = Number(entry?.minutes) || 0;
  const calories = cardioEntryCalories(entry, weightKg, preferProvidedWeight);
  const minuteDiff = stats.avgMinutes ? minutes - stats.avgMinutes : 0;
  const calorieDiff = stats.avgCalories ? calories - stats.avgCalories : 0;
  const fatigue = cardioFatigueLoad(entry);
  const loadDiff = stats.avgFatigue ? fatigue - stats.avgFatigue : 0;
  const tone = Math.abs(loadDiff) <= 2 ? 'usual' : loadDiff > 0 ? 'harder' : 'lighter';
  return { stats, minutes, calories, fatigue, minuteDiff, calorieDiff, loadDiff, tone };
};

/** Kardiyo arşivinin üst özetinde kullanılacak toplamlar ve en sık aktiviteler. */
export const cardioArchiveSummary = (workouts = [], weightKg = 0, weightForDate = null) => {
  const entries = cardioHistoryEntries(workouts);
  const totalMinutes = entries.reduce((sum, entry) => sum + (Number(entry.minutes) || 0), 0);
  const totalCalories = entries.reduce((sum, entry) => sum + cardioEntryCalories(
    entry,
    typeof weightForDate === 'function' ? weightForDate(entry.date) : weightKg,
    typeof weightForDate === 'function',
  ), 0);
  const groups = new Map();
  entries.forEach(entry => {
    const current = groups.get(entry.type) || { type: entry.type, count: 0, minutes: 0 };
    current.count += 1;
    current.minutes += Number(entry.minutes) || 0;
    groups.set(entry.type, current);
  });
  return {
    count: entries.length,
    totalMinutes,
    totalCalories,
    avgMinutes: entries.length ? Math.round(totalMinutes / entries.length) : 0,
    activities: [...groups.values()].sort((a, b) => b.count - a.count || b.minutes - a.minutes).slice(0, 3),
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
export const workoutCalories = (workout, weightKg, preferProvidedWeight = false) => {
  const historicalWeight = preferProvidedWeight && Number(weightKg) > 0
    ? Number(weightKg)
    : Number(workout?.weightAtTime) > 0 ? Number(workout.weightAtTime) : weightKg;
  const lifting = estimateLiftingCalories(workout?.duration || 0, historicalWeight);
  const cardio = (workout?.cardio || []).reduce(
    (sum, entry) => sum + cardioEntryCalories(entry, historicalWeight, preferProvidedWeight), 0,
  );
  return { lifting, cardio, total: lifting + cardio };
};

/** Belirli bir günün tüm antrenman kayıtlarından toplam yakım. */
export const dayWorkoutCalories = (workouts = [], dateStr, weightKg) => {
  const same = workouts.filter(w => w.date === dateStr);
  const totals = same.reduce((acc, w) => {
    // App bu tarihe ait ölçüm aralığından çözdüğü kiloyu verir; kayıt içindeki
    // eski snapshot daha yeni/düzeltilmiş tarihsel ölçümü ezmemelidir.
    const c = workoutCalories(w, weightKg, Number(weightKg) > 0);
    return { lifting: acc.lifting + c.lifting, cardio: acc.cardio + c.cardio, total: acc.total + c.total };
  }, { lifting: 0, cardio: 0, total: 0 });
  const strengthSessionCount = same.filter(workout => (workout.exercises || []).length > 0).length;
  const cardioEntries = same.flatMap(workout => workout.cardio || []);
  return {
    ...totals,
    activeRecovery: isActiveRecoveryCardioDay(strengthSessionCount, cardioEntries),
  };
};
