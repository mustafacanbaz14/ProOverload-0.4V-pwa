import { findActivity, findEffort, DEFAULT_EFFORT } from './cardio';
import { timeToMinutes } from './wellness';

/**
 * Aynı gün çakışma asistanı.
 *
 * Eşzamanlı (concurrent) antrenmanda dayanıklılık çalışması, kuvvet/hipertrofi
 * uyarımını zayıflatabiliyor. Literatürden çıkan üç tutarlı bulgu var ve
 * buradaki tavsiyelerin tamamı bunlara dayanıyor:
 *
 *  1. Etki bölgeye özgü. Koşu bacakları etkiliyor, üst vücutla neredeyse hiç
 *     çakışmıyor. "Kardiyo kas yakar" genellemesi bu yüzden yanlış.
 *  2. Modalite fark yaratıyor. Koşunun eksantrik yükü kas hasarı bırakıyor;
 *     bisiklet ve eliptik aynı süre ve şiddette belirgin şekilde daha az
 *     karışıyor. Yüzme en az karışan seçenek.
 *  3. Araya zaman koymak işe yarıyor. Aynı seansta arka arkaya yapmak en kötüsü;
 *     6+ saat ayırmak ya da farklı güne almak etkiyi büyük ölçüde kaldırıyor.
 *
 * Sıralama sorusunda hedef belirleyici: kas ve kuvvet önceliğindeyse önce
 * ağırlık. Ağırlıktan önce yapılan uzun kardiyo, ağırlık seansındaki performansı
 * doğrudan düşürüyor.
 */

// Alt vücut kasları: koşu/bisiklet ile aynı kas grubunu paylaşan bölge.
const ALT_VUCUT = new Set(['Quadriceps', 'Hamstring', 'Kalça', 'Baldır']);

// Eksantrik yükü yüksek, kas hasarı bırakan aktiviteler.
const DARBELI = new Set([
  'run', 'zone2', 'interval', 'hiit', 'jump_rope', 'burpee', 'sled',
  'basketball', 'football', 'tennis', 'padel', 'hike', 'stairs_daily',
  'stair', 'walk_incline', 'skiing', 'basketball_half',
]);

// Eklem ve kas hasarı açısından en yumuşak seçenekler.
const DUSUK_ETKI = new Set(['bike', 'spinning', 'rower', 'elliptical', 'swim', 'ski_erg', 'stationary_bike', 'treadmill_walk']);

const SEVIYE = {
  high: { key: 'high', label: 'Yüksek', text: 'text-red-400', bg: 'bg-red-950/25 border-red-900/50' },
  medium: { key: 'medium', label: 'Orta', text: 'text-amber-400', bg: 'bg-amber-950/20 border-amber-900/50' },
  low: { key: 'low', label: 'Düşük', text: 'text-cyan-400', bg: 'bg-cyan-950/20 border-cyan-900/50' },
  none: { key: 'none', label: 'Sorun yok', text: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-900/50' },
};

/** Antrenmanın alt vücut ağırlığı: 0 = tamamen üst, 1 = tamamen alt. */
export const lowerBodyShare = (byMuscle = {}) => {
  let alt = 0;
  let toplam = 0;
  Object.entries(byMuscle).forEach(([kas, vol]) => {
    toplam += vol;
    if (ALT_VUCUT.has(kas)) alt += vol;
  });
  return toplam > 0 ? alt / toplam : 0;
};

/** İki slot arasındaki saat farkı; ikisinde de saat yoksa null. */
const saatFarki = (a, b) => {
  const ta = timeToMinutes(a?.time);
  const tb = timeToMinutes(b?.time);
  if (ta === null || tb === null) return null;
  return Math.abs(tb - ta) / 60;
};

/**
 * Bir günün çakışma analizi.
 *
 * @param day computeWeekPlan'ın ürettiği gün nesnesi ({ workouts, cardios, byMuscle })
 * @returns { level, items: [{ key, level, title, detail }], gapHours, order }
 */
export const analyzeDayConflicts = (day) => {
  const antrenmanlar = day?.workouts || [];
  const kardiyolar = (day?.cardios || []).filter(c => c.minutes > 0);

  if (antrenmanlar.length === 0 || kardiyolar.length === 0) {
    // Tek başına iki kardiyo da yorucu olabilir; yalnızca o durumda uyarı çıkar.
    if (kardiyolar.length >= 2) {
      const toplamDk = kardiyolar.reduce((s, c) => s + c.minutes, 0);
      if (toplamDk >= 90) {
        return {
          level: SEVIYE.low,
          items: [{
            key: 'multi-cardio',
            level: SEVIYE.low,
            title: 'Aynı gün iki kardiyo',
            detail: `Toplam ${toplamDk} dakika. Ağırlık antrenmanıyla çakışmıyor ama ertesi günün bacak seansı için toparlanmayı hesaba kat.`,
          }],
          gapHours: null,
        };
      }
    }
    return { level: SEVIYE.none, items: [], gapHours: null };
  }

  const altPay = lowerBodyShare(day.byMuscle);
  const altBacak = altPay >= 0.4;
  const items = [];

  // En yakın çift üzerinden saat farkı: en kötü senaryo belirleyici.
  let enYakin = null;
  antrenmanlar.forEach(w => kardiyolar.forEach(c => {
    const f = saatFarki(w, c);
    if (f !== null && (enYakin === null || f < enYakin.gap)) enYakin = { gap: f, workout: w, cardio: c };
  }));
  const gap = enYakin?.gap ?? null;

  const darbeli = kardiyolar.filter(c => DARBELI.has(c.activity?.key));
  const uzunKardiyo = kardiyolar.reduce((s, c) => s + c.minutes, 0);
  const sertKardiyo = kardiyolar.filter(c => {
    const e = findEffort(c.effort || DEFAULT_EFFORT);
    return e.fatigue >= 1.35;
  });

  let seviye = SEVIYE.low;

  if (altBacak && darbeli.length > 0) {
    const isim = darbeli.map(c => c.activity.label).join(', ');
    if (gap !== null && gap < 3) {
      seviye = SEVIYE.high;
      items.push({
        key: 'legs-impact-close',
        level: SEVIYE.high,
        title: 'Bacak + koşu, aralarında yeterli boşluk yok',
        detail: `${isim} ile bacak antrenmanın arasında ${gap.toFixed(1)} saat var. Aynı kas grubunu iki farklı şekilde yoruyorsun ve ikincisi tam performansta yapılamaz. En az 6 saat ayır ya da koşuyu üst vücut gününe taşı.`,
      });
    } else if (gap === null) {
      seviye = SEVIYE.medium;
      items.push({
        key: 'legs-impact',
        level: SEVIYE.medium,
        title: 'Aynı gün bacak + koşu',
        detail: `${isim} bacak antrenmanınla aynı günde. Slotlara saat girersen aradaki boşluğu hesaplayıp net tavsiye verebilirim; hedef en az 6 saat.`,
      });
    } else {
      seviye = gap >= 6 ? SEVIYE.low : SEVIYE.medium;
      items.push({
        key: 'legs-impact-gap',
        level: seviye,
        title: gap >= 6 ? 'Boşluk yeterli' : 'Boşluk sınırda',
        detail: `${isim} ile bacak antrenmanın arasında ${gap.toFixed(1)} saat var. ${gap >= 6 ? 'Bu aralık eşzamanlı antrenman etkisini büyük ölçüde kaldırıyor.' : '6 saate çıkarmak ikinci seansın kalitesini belirgin artırır.'}`,
      });
    }

    // Sıralama yalnızca ikisi birbirine yakınken sorun. Sabah kardiyo + akşam
    // ağırlık zaten önerilen düzen; araya yarım gün girdiğinde "önce hangisi"
    // sorusu anlamını yitiriyor, uyarı vermek gereksiz alarm olurdu.
    if (enYakin && gap !== null) {
      const kardiyoOnce = (timeToMinutes(enYakin.cardio.time) ?? Infinity) < (timeToMinutes(enYakin.workout.time) ?? Infinity);
      if (gap >= 6) {
        items.push({
          key: 'order',
          level: SEVIYE.none,
          title: 'Sıralama sorun değil',
          detail: `Aradaki ${gap.toFixed(1)} saat toparlanmaya yetiyor; ${kardiyoOnce ? 'sabah kardiyo + akşam ağırlık' : 'ağırlık + geç kardiyo'} düzeni sorun çıkarmaz.`,
        });
      } else {
        items.push({
          key: 'order',
          level: kardiyoOnce ? SEVIYE.medium : SEVIYE.none,
          title: kardiyoOnce ? 'Sıralamayı değiştir' : 'Sıralama doğru',
          detail: kardiyoOnce
            ? 'Kardiyo ağırlıktan hemen önce planlanmış. Kas ve kuvvet önceliğindeyken ağırlık önce gelmeli: yorgun bacakla yapılan set hem yükü hem tekniği düşürür.'
            : 'Ağırlık önce, kardiyo sonra — kas ve kuvvet hedefi için doğru sıra.',
        });
      }
    }
  } else if (altBacak && kardiyolar.some(c => DUSUK_ETKI.has(c.activity?.key))) {
    const isim = kardiyolar.filter(c => DUSUK_ETKI.has(c.activity?.key)).map(c => c.activity.label).join(', ');
    seviye = SEVIYE.low;
    items.push({
      key: 'legs-lowimpact',
      level: SEVIYE.low,
      title: 'Bacak + düşük etkili kardiyo',
      detail: `${isim} eksantrik yük bırakmadığı için bacak antrenmanıyla koşu kadar karışmaz. Yine de ağırlığı önce yapmak daha verimli.`,
    });
  } else {
    seviye = SEVIYE.none;
    items.push({
      key: 'upper-cardio',
      level: SEVIYE.none,
      title: 'Üst vücut + kardiyo',
      detail: 'Farklı kas grupları çalıştığı için kayda değer bir çakışma yok. Sıra serbest; tek dikkat edilecek şey toplam yorgunluk.',
    });
  }

  if (uzunKardiyo >= 60 && altBacak) {
    items.push({
      key: 'volume',
      level: SEVIYE.medium,
      title: 'Kardiyo süresi yüksek',
      detail: `Günün toplam kardiyosu ${uzunKardiyo} dakika. Eşzamanlı antrenmanda karışma süreyle birlikte artıyor; hipertrofi döneminde bacak günündeki kardiyoyu 30-40 dakikada tutmak daha güvenli.`,
    });
    if (seviye.key === 'low' || seviye.key === 'none') seviye = SEVIYE.medium;
  }

  if (sertKardiyo.length > 0 && altBacak) {
    items.push({
      key: 'effort',
      level: SEVIYE.medium,
      title: 'Tempo yüksek seçilmiş',
      detail: `${sertKardiyo.map(c => `${c.activity.label} (${findEffort(c.effort || DEFAULT_EFFORT).label})`).join(', ')}. Bu şiddet bacaklarda ağırlık antrenmanına yakın yorgunluk bırakır; bacak gününde orta tempoya çekmek toparlanmayı korur.`,
    });
    if (seviye.key === 'low' || seviye.key === 'none') seviye = SEVIYE.medium;
  }

  // Gün seviyesi, çıkan maddelerin en kötüsü.
  const sira = ['none', 'low', 'medium', 'high'];
  const enKotu = items.reduce((acc, i) =>
    sira.indexOf(i.level.key) > sira.indexOf(acc) ? i.level.key : acc, seviye.key);

  return { level: SEVIYE[enKotu], items, gapHours: gap };
};

/** Haftanın tamamı için çakışma özeti. */
export const weekConflicts = (days = []) => days
  .map(d => ({ day: d, analysis: analyzeDayConflicts(d) }))
  .filter(x => x.analysis.items.length > 0);

export const CONFLICT_LEVELS = SEVIYE;

/** Aktivitenin alt vücutla çakışma sınıfı — arayüzde rozet olarak gösteriliyor. */
export const activityImpact = (key) => {
  const act = findActivity(key);
  if (!act) return null;
  if (DARBELI.has(key)) return { key: 'impact', label: 'Darbeli', hint: 'Eksantrik yük bırakır, bacakla çakışır' };
  if (DUSUK_ETKI.has(key)) return { key: 'low', label: 'Düşük etkili', hint: 'Bacak antrenmanıyla az karışır' };
  return { key: 'other', label: 'Genel', hint: '' };
};
