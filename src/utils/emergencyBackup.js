import { APP_VERSION, STORAGE_VERSIONS } from './constants.js';

const readWithFallback = (storage, name, fallback) => {
  for (const version of STORAGE_VERSIONS) {
    try {
      const raw = storage?.getItem?.(`po_${name}${version}`);
      if (raw !== null && raw !== undefined) return JSON.parse(raw);
    } catch {
      // Bozuk/yasaklı bir anahtar diğer sürüm yedeğinin denenmesini engellemez.
    }
  }
  return fallback;
};

/**
 * React henüz açılmadan çökerse bile standart içe aktarma biçiminde bir yedek
 * üretir. En yeni anahtar yoksa v16…v13 geri dönüşleri de denenir.
 */
export const buildEmergencyBackup = (storage, exportedAt = new Date().toISOString()) => ({
  schemaVersion: 3,
  version: APP_VERSION,
  exportedAt,
  emergencyRecovery: true,
  workouts: readWithFallback(storage, 'workouts', []),
  templates: readWithFallback(storage, 'templates', []),
  customExercises: readWithFallback(storage, 'custom_exercises', []),
  customFoods: readWithFallback(storage, 'custom_foods', []),
  recentFoods: readWithFallback(storage, 'recent_foods', []),
  metricsHistory: readWithFallback(storage, 'metrics', []),
  nutritionHistory: readWithFallback(storage, 'nutrition', []),
  wellness: readWithFallback(storage, 'wellness', []),
  cycleHistory: readWithFallback(storage, 'cycle', []),
  settings: readWithFallback(storage, 'settings', {}),
});
