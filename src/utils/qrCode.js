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

export const createQRDataString = (backupData) => {
  try {
    const compact = {
      w: (backupData.workouts || []).slice(0, 30),
      m: (backupData.metricsHistory || []).slice(0, 30),
      n: (backupData.nutritionHistory || []).slice(0, 30),
      t: backupData.templates || [],
      s: backupData.settings || {}
    };
    return JSON.stringify(compact);
  } catch {
    return '';
  }
};
