// Uzantı açıkça yazılır: bu modül scripts/verify-muscles.mjs tarafından
// doğrudan node ile de yükleniyor, node ESM uzantısız yolu çözemiyor.
import { MUSCLE_GROUPS, LEGACY_MUSCLE_MAP } from './constants.js';

export const CUSTOM_EXERCISE_SCHEMA = 2;

/** Eski veya geçersiz bir kas adını yeni taksonomiye çevirir. null = hacme sayılmaz. */
export const normalizeMuscleName = (name) => {
  if (MUSCLE_GROUPS.includes(name)) return name;
  return Object.prototype.hasOwnProperty.call(LEGACY_MUSCLE_MAP, name)
    ? LEGACY_MUSCLE_MAP[name]
    : null;
};

/** Katkı tablosundaki en yüksek ağırlıklı kas, hareketin birincil hedefidir. */
export const primaryMuscleOf = (contributions) => {
  let best = null;
  let bestWeight = -1;
  for (const [muscle, weight] of Object.entries(contributions || {})) {
    if (weight > bestWeight) { best = muscle; bestWeight = weight; }
  }
  return best;
};

/**
 * Tek bir özel hareket kaydını yeni taksonomiye taşır.
 *
 * Tasarım kısıtları:
 *  - `name` ASLA değiştirilmez: antrenman kayıtlarıyla tek bağ o.
 *  - Fonksiyon hiçbir koşulda throw etmez. loadPersistedState render sırasında
 *    useState içinde koştuğu için buradan çıkan bir istisna kalıcı beyaz ekran olur.
 *  - Idempotenttir: LEGACY_MUSCLE_MAP'te değer olarak geçen her ad kendine
 *    map'lendiği için ikinci kez çalıştırmak kaydı değiştirmez.
 */
const migrateOne = (ex) => {
  // Düz string meşru bir eski şekildir (detectMuscleGroup bunu regex tablosuna
  // düşürür). null/undefined de olduğu gibi geçer.
  if (!ex || typeof ex !== 'object') return ex;
  if (ex.schema === CUSTOM_EXERCISE_SCHEMA) return ex;

  try {
    const source = ex.contributions || {
      ...(ex.muscle ? { [ex.muscle]: 1 } : {}),
      ...Object.fromEntries((ex.secondary || []).map(m => [m, 0.5]))
    };

    const contributions = {};
    for (const [rawMuscle, weight] of Object.entries(source)) {
      const muscle = normalizeMuscleName(rawMuscle);
      if (!muscle) continue; // 'Diğer' veya tanınmayan ad
      const w = Number(weight);
      if (!Number.isFinite(w) || w <= 0) continue;
      // Hem eski hem yeni ad aynı kayıtta varsa (ör. 'Sırt' + 'Kanat')
      // biri diğerini ezmesin.
      contributions[muscle] = Math.max(contributions[muscle] || 0, w);
    }

    const primary = primaryMuscleOf(contributions);
    return {
      ...ex,
      contributions,
      ...(primary ? { muscle: primary } : {}),
      schema: CUSTOM_EXERCISE_SCHEMA
    };
  } catch {
    return ex; // bozuk kayıt: dokunma, uygulamayı çökertme
  }
};

/** Özel hareket listesini yeni taksonomiye taşır. Dizi değilse boş dizi döner. */
export const migrateCustomExercises = (list) => {
  if (!Array.isArray(list)) return [];
  return list.map(migrateOne);
};
