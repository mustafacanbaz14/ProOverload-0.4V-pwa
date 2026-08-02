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

/* ------------------------------------------------------------------ *
 *  HAFTA
 * ------------------------------------------------------------------ */

/** "YYYY-MM-DD" — yerel gün anahtarı. */
export const dayKey = (value) => {
  const d = toLocalDate(value);
  if (!gecerli(d)) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Bir tarihin ait olduğu haftanın pazartesi ve pazarı.
 *
 * Hafta pazartesi başlıyor (ISO): `getDay()` pazarı 0 verdiği için pazar bir
 * ÖNCEKİ haftanın son günü sayılmalı, yoksa pazar günleri tek başına yeni bir
 * hafta açıyor ve haftalık toplamlar ikiye bölünüyor.
 */
export const weekBounds = (value) => {
  const d = toLocalDate(value);
  if (!gecerli(d)) return null;
  const gun = d.getDay();
  const pazartesi = new Date(d);
  pazartesi.setHours(0, 0, 0, 0);
  pazartesi.setDate(d.getDate() - gun + (gun === 0 ? -6 : 1));
  const pazar = new Date(pazartesi);
  pazar.setDate(pazartesi.getDate() + 6);
  return { start: pazartesi, end: pazar, startKey: dayKey(pazartesi), endKey: dayKey(pazar) };
};

/**
 * İki tarih arası aralık etiketi: "21 – 26 Tem", ay değişiyorsa "28 Tem – 3 Ağu".
 *
 * Aynı ay içinde ay adı bir kez yazılıyor; "21 Tem – 26 Tem" gereksiz tekrar ve
 * dar satırlarda taşıyor.
 */
export const formatRange = (from, to, opts = {}) => {
  const { year = false } = opts;
  const a = toLocalDate(from);
  const b = toLocalDate(to);
  if (!gecerli(a)) return '';
  if (!gecerli(b)) return formatDay(a, 'short', { weekday: false, year });

  // Tek günlük aralıkta "16 – 16 Tem" yazmak saçma; tek tarih yeter.
  if (a.getTime() === b.getTime()) return formatDay(a, 'short', { weekday: false, year });

  const ayniAy = a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
  const bas = ayniAy
    ? String(a.getDate())
    : formatDay(a, 'short', { weekday: false, year: year && a.getFullYear() !== b.getFullYear() });
  const son = formatDay(b, 'short', { weekday: false, year });
  return `${bas} – ${son}`;
};

/**
 * Tarihe göre sıralı bir listeyi haftalara böler (en yeni hafta önce).
 *
 * Liste sıralamasını değiştirmez, yalnızca gruplar. "Kısmi hafta" burada az
 * kayıt olması demek DEĞİL — antrenman geçmişinde haftada üç kayıt olması
 * normaldir. Kısmi olan, haftanın veri sınırıyla kesilmiş olması:
 *   - en eski hafta pazartesiden sonra başlıyorsa (ilk kayıt haftanın ortasında)
 *   - içinde bulunulan hafta henüz pazara varmadıysa
 * Yalnızca bu iki durumda aralık etiketi kapsanan günleri gösterir.
 *
 * @param items  tarihe göre AZALAN sırada liste
 * @param getDate öğeden tarih çıkaran fonksiyon
 */
export const groupIntoWeeks = (items = [], getDate = (x) => x?.date) => {
  const gruplar = [];
  const indeks = new Map();

  items.forEach(item => {
    const tarih = dayKey(getDate(item));
    if (!tarih) return;
    const sinir = weekBounds(tarih);
    let grup = indeks.get(sinir.startKey);
    if (!grup) {
      grup = {
        key: sinir.startKey,
        weekStart: sinir.startKey,
        weekEnd: sinir.endKey,
        firstDate: tarih,
        lastDate: tarih,
        items: [],
      };
      indeks.set(sinir.startKey, grup);
      gruplar.push(grup);
    }
    if (tarih < grup.firstDate) grup.firstDate = tarih;
    if (tarih > grup.lastDate) grup.lastDate = tarih;
    grup.items.push(item);
  });

  const bugun = dayKey(new Date());
  const buHafta = weekBounds(bugun)?.startKey;

  return gruplar.map((g, i) => {
    // Devam eden hafta: pazara henüz varılmadı.
    const ongoing = g.weekStart === buHafta && bugun < g.weekEnd;
    // En eski hafta pazartesiden sonra başlıyorsa veri orada kesilmiş demektir.
    const clipped = i === gruplar.length - 1 && g.firstDate > g.weekStart;
    const kesik = ongoing || clipped;
    // Aralık kayıt bulunan son güne göre kesilmez. Örneğin ilk kayıt salıysa
    // “21–26 Tem” gösterilir; o hafta cuma kayıt olmaması haftayı cuma bitirmez.
    // Yalnız ilk veri günü ve henüz gelmemiş gelecek günler gerçek sınırdır.
    const gorunenBas = clipped ? g.firstDate : g.weekStart;
    const gorunenSon = ongoing ? bugun : g.weekEnd;
    return {
      ...g,
      ongoing,
      clipped,
      partial: kesik,
      label: formatRange(gorunenBas, gorunenSon),
      fullLabel: formatRange(g.weekStart, g.weekEnd),
      note: ongoing ? 'devam ediyor' : clipped ? 'kayıt bu gün başlıyor' : null,
    };
  });
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
