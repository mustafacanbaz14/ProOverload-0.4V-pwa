/**
 * Sayı ayrıştırma — bağımlılığı olmayan en alt katman.
 *
 * Kendi başına duruyor çünkü saf hesap modülleri (tdee.js, nutritionStats.js)
 * bunu kullanmak için uygulamanın geri kalanını (constants, migrations, React)
 * içeri çekmek zorunda kalmasın. Böylece o modüller node ile doğrudan
 * çalıştırılıp test edilebilir kalıyor.
 */

/** Boş/geçersiz değerleri 0'a çevirir; ondalık ayırıcı olarak virgülü de kabul eder. */
export const parseNumber = (val) => {
  if (val === '' || val === null || val === undefined) return 0;
  const n = Number(String(val).replace(',', '.'));
  return Number.isNaN(n) ? 0 : n;
};
