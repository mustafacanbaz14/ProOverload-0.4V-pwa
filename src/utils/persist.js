/**
 * localStorage yazımı için güvenli sarmalayıcı.
 *
 * Uygulamanın tüm verisi tarayıcı belleğinde tutuluyor; yazma başarısız olursa
 * kullanıcı antrenmanını kaydettiğini sanıp veriyi kaybediyor. Eskiden sekiz
 * ayrı yerde `catch { }` ile sessizce yutuluyordu — artık tek yerden geçiyor ve
 * kullanıcıya haber veriliyor.
 *
 * Başarısızlığın iki gerçek sebebi var:
 *  - Kota dolması (QuotaExceededError) — uzun geçmişi olan cihazlarda olabilir
 *  - Depolamanın hiç erişilebilir olmaması (Safari gizli sekme, katı gizlilik
 *    ayarları) — bu durumda `localStorage`'a erişmek bile hata atar
 */

/** Kota hatası mı, yoksa depolama tümden kapalı mı? Mesaj buna göre değişir. */
const isQuotaError = (err) =>
  err instanceof DOMException &&
  (err.name === 'QuotaExceededError' ||
    err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    err.code === 22 ||
    err.code === 1014);

export const PERSIST_ERROR_MESSAGES = {
  quota: 'Depolama alanı dolu — kayıt yapılamadı. Ayarlar\'dan yedek alıp eski kayıtları silmeyi dene.',
  blocked: 'Tarayıcı depolamaya izin vermiyor — değişiklikler kaydedilmiyor. Gizli sekmedeysen normal sekmede aç.',
};

/**
 * Değeri JSON olarak yazar. Başarılıysa true, değilse false döner ve
 * `onError(mesaj, hata)` çağrılır.
 *
 * Hata fırlatmaz: çağıranların hepsi useEffect içinde çalışıyor, bir istisna
 * render döngüsünü bozar.
 */
export const safeSetItem = (key, value, onError) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    const message = isQuotaError(err)
      ? PERSIST_ERROR_MESSAGES.quota
      : PERSIST_ERROR_MESSAGES.blocked;
    try { onError?.(message, err); } catch { /* bildirim de patlarsa sessiz geç */ }
    return false;
  }
};

/**
 * Düz metin yazar (JSON sarmalaması yapmadan).
 *
 * `po_last_backup` tarihi ham string olarak okunuyor (helpers.js
 * `loadPersistedState`), JSON'a çevirmek tırnaklı bir değer üretir ve tarih
 * ayrıştırması bozulurdu.
 */
export const safeSetRawItem = (key, value, onError) => {
  try {
    localStorage.setItem(key, String(value));
    return true;
  } catch (err) {
    const message = isQuotaError(err)
      ? PERSIST_ERROR_MESSAGES.quota
      : PERSIST_ERROR_MESSAGES.blocked;
    try { onError?.(message, err); } catch { /* bildirim de patlarsa sessiz geç */ }
    return false;
  }
};

/**
 * Aynı anda birden fazla kayıt başarısız olduğunda tek uyarı göstermek için
 * kısıtlayıcı üretir. Sekiz effect aynı kota hatasına takılırsa kullanıcı sekiz
 * toast görmemeli.
 *
 * `windowMs` içinde ilk hatayı geçirir, kalanını yutar.
 */
export const createErrorThrottle = (notify, windowMs = 5000) => {
  let lastShownAt = 0;
  return (message, err) => {
    const now = Date.now();
    if (now - lastShownAt < windowMs) return;
    lastShownAt = now;
    notify(message, err);
  };
};
