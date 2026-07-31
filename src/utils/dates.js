/**
 * Tarih biçimleme — tek kaynak.
 *
 * Uygulamada tarihler her yerde `toLocaleDateString('tr-TR', ...)` ile ayrı ayrı
 * biçimleniyordu; hem biçimler tutmuyordu hem de haftanın günü hiçbir yerde
 * görünmüyordu. Antrenman takibinde "22 Tem" tek başına anlamsız: o günün
 * Pazartesi mi Cumartesi mi olduğu programın neresinde durduğunu söyleyen asıl
 * bilgi. Bu yüzden tüm tarih gösterimleri buradan geçiyor.
 *
 * Bağımlılığı yok; saf hesap modülleri de kullanabilir.
 */

export const WEEKDAY_LONG = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
export const WEEKDAY_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const MONTH_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const MONTH_LONG = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

/**
 * "YYYY-MM-DD" dizgisini YEREL güne çevirir.
 *
 * `new Date('2026-07-31')` UTC gece yarısı olarak ayrıştırılır; UTC'nin
 * gerisindeki saat dilimlerinde bu bir önceki güne düşer ve gün adı yanlış
 * çıkar. Kayıtlar `getLocalDateString` ile yerel olarak yazıldığı için okuma da
 * yerel yapılmalı.
 */
export const toLocalDate = (value) => {
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const gecerli = (d) => d instanceof Date && !Number.isNaN(d.getTime());

/** Haftanın günü. */
export const weekdayName = (value, short = false) => {
  const d = toLocalDate(value);
  if (!gecerli(d)) return '';
  return (short ? WEEKDAY_SHORT : WEEKDAY_LONG)[d.getDay()];
};

/**
 * Tarih + gün adı.
 *
 * @param style 'short'  → "31 Tem Cum"      (liste satırları, grafik etiketleri)
 *              'medium' → "31 Temmuz Cuma"  (kart başlıkları)
 *              'long'   → "31 Temmuz 2026 Cuma"
 *              'numeric'→ "31.07.2026 Cuma" (açılır listeler)
 * @param opts.weekday   false ise gün adı eklenmez
 * @param opts.year      'short'/'medium' için yılı da yazdırır
 */
export const formatDay = (value, style = 'short', opts = {}) => {
  const { weekday = true, year = false } = opts;
  const d = toLocalDate(value);
  if (!gecerli(d)) return '';

  const gun = d.getDate();
  const ay = d.getMonth();
  const yil = d.getFullYear();
  const gunAdi = WEEKDAY_LONG[d.getDay()];
  const gunKisa = WEEKDAY_SHORT[d.getDay()];

  let govde;
  if (style === 'numeric') {
    govde = `${String(gun).padStart(2, '0')}.${String(ay + 1).padStart(2, '0')}.${yil}`;
  } else if (style === 'long') {
    govde = `${gun} ${MONTH_LONG[ay]} ${yil}`;
  } else if (style === 'medium') {
    govde = `${gun} ${MONTH_LONG[ay]}${year ? ` ${yil}` : ''}`;
  } else {
    govde = `${gun} ${MONTH_SHORT[ay]}${year ? ` ${yil}` : ''}`;
  }

  if (!weekday) return govde;
  // Kısa biçimde gün adı da kısalır, yoksa satır taşar.
  return `${govde} ${style === 'short' ? gunKisa : gunAdi}`;
};

/** Bugün/dün gibi göreli ifade; değilse tarih + gün adı. */
export const formatDayRelative = (value, style = 'medium') => {
  const d = toLocalDate(value);
  if (!gecerli(d)) return '';
  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);
  const hedef = new Date(d);
  hedef.setHours(0, 0, 0, 0);
  const fark = Math.round((hedef - bugun) / 86400000);
  if (fark === 0) return `Bugün · ${WEEKDAY_LONG[d.getDay()]}`;
  if (fark === -1) return `Dün · ${WEEKDAY_LONG[d.getDay()]}`;
  if (fark === 1) return `Yarın · ${WEEKDAY_LONG[d.getDay()]}`;
  return formatDay(value, style);
};
