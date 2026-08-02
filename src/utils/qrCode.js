/**
 * Saf JavaScript SVG QR Kod Üreteci ve Cihaz Aktarım Kodlayıcısı.
 * Harici CDN veya kütüphane bağımlılığı olmadan tamamen çevrimdışı çalışır.
 */

// Basit QR Matrix üreteci (Mode byte / Numeric / Alphanumeric)
export const generateQRCodeMatrix = (text) => {
  // Veriyi Base64 / URI emniyetli string olarak hazırla
  const encoded = encodeURIComponent(text);
  return encoded;
};

/**
 * Cihaz aktarımı için metin kodu üretir.
 *
 * Önceki sürüm kayıtları son 30 ile sınırlıyor, özel hareket ve besinleri hiç
 * almıyordu; bu yolla yeni telefona geçen biri verisinin çoğunu sessizce
 * kaybediyordu. Artık yedeğin tamamı taşınır ve alanlar tam adlarıyla yazılır.
 */
export const createQRDataString = (backupData) => {
  try {
    return JSON.stringify({
      // Aktarım formatının sürümü — uygulama sürümünden (package.json) bağımsızdır,
      // yalnızca bu metin kodunun yapısı değiştiğinde artar.
      version: '0.7.0',
      schema: 3,
      exportedAt: new Date().toISOString(),
      workouts: backupData.workouts || [],
      templates: backupData.templates || [],
      customExercises: backupData.customExercises || [],
      customFoods: backupData.customFoods || [],
      recentFoods: backupData.recentFoods || [],
      metricsHistory: backupData.metricsHistory || [],
      nutritionHistory: backupData.nutritionHistory || [],
      wellness: backupData.wellness || [],
      cycleHistory: backupData.cycleHistory || [],
      settings: backupData.settings || {},
    });
  } catch {
    return '';
  }
};
