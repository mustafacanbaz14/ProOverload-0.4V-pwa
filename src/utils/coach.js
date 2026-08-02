import { parseNumber } from './number.js';
import { MUSCLE_GROUPS, getVolumeLandmarks } from './constants.js';

/**
 * Günün koçu — sıralanmış eylem listesi.
 *
 * Ana ekrandaki koç kartı tek cümle söylüyordu ("planın hazır"), ama günün asıl
 * kararı çoğu zaman başka yerde: uykun kötüyse plan hazır olması bir şey ifade
 * etmiyor, ya da haftanın son günü gelmiş ve iki kas hâlâ MEV altında.
 *
 * Burası o sinyalleri tek yerde toplayıp önceliklendiriyor. Her madde tek bir
 * SOMUT eylem söylüyor; "daha iyi beslen" gibi genel öğütler yok, çünkü onlar
 * kullanıcının o an ne yapacağını değiştirmiyor.
 *
 * Öncelik ölçeği:
 *   1 — bugünü değiştirir (sakatlık/toparlanma riski, planın kendisi)
 *   2 — bu haftayı değiştirir (hacim açığı, plan sapması)
 *   3 — bilgi ve fırsat (rekor denemesi, veri eksiği)
 */

const TONES = {
  danger: { key: 'danger', text: 'text-red-400', chip: 'border-red-900/50 bg-red-950/25' },
  warn: { key: 'warn', text: 'text-amber-400', chip: 'border-amber-900/50 bg-amber-950/20' },
  info: { key: 'info', text: 'text-cyan-400', chip: 'border-cyan-900/50 bg-cyan-950/20' },
  good: { key: 'good', text: 'text-emerald-400', chip: 'border-emerald-900/50 bg-emerald-950/20' },
};

export const COACH_TONES = TONES;

/** Haftanın kaçıncı günündeyiz (pazartesi = 1, pazar = 7). */
const haftaninGunu = (d = new Date()) => (d.getDay() === 0 ? 7 : d.getDay());

/**
 * @param ctx.readiness        readinessTrend çıktısı
 * @param ctx.sleep            computeSleepScore çıktısı (bu gece)
 * @param ctx.lastReadiness    son antrenmanın hazır oluşluk formu (eklem ağrısı için)
 * @param ctx.planDay          computeWeekPlan'ın bugünkü günü
 * @param ctx.doneToday        bugün kaydedilmiş antrenman sayısı
 * @param ctx.conflict         analyzeDayConflicts çıktısı
 * @param ctx.macros           bugünün makroları
 * @param ctx.targetProtein    hedef protein (g)
 * @param ctx.calorieRemaining hedefe göre kalan kcal (negatif = aşıldı)
 * @param ctx.muscleVolume     bu haftaki gerçekleşen hacim
 * @param ctx.experienceLevel  MEV/MAV eşikleri için
 * @param ctx.acwr             { acwr, hasEnoughData, nearCeiling }
 * @param ctx.daysSinceMetric  son ölçümden bu yana geçen gün
 * @param ctx.plateaus         buildPlateauInsights çıktısı
 */
export const buildCoachActions = (ctx = {}) => {
  const {
    readiness, sleep, lastReadiness, planDay, doneToday = 0, conflict,
    macros = {}, targetProtein = 0, calorieRemaining = null,
    muscleVolume = {}, experienceLevel = 'intermediate',
    acwr, daysSinceMetric = null, plateaus = [],
    deload = null, deloadSuggestion = null, gender = 'male', cycle = null,
  } = ctx;

  const items = [];
  const ekle = (item) => items.push(item);

  /* --- 1. öncelik: bugünü değiştirenler --- */

  // Eklem ağrısı en son seansta yüksekse, hacim/uyku iyi olsa bile önce bu.
  const eklem = parseNumber(lastReadiness?.jointPain);
  if (eklem >= 7) {
    ekle({
      key: 'joint', priority: 1, tone: TONES.danger, action: 'workout',
      title: 'Eklem ağrısı yüksek kaydedilmiş',
      detail: 'Son seansta eklem ağrın 7+. Eklem ağrısı kas ağrısıyla aynı sinyal değildir. Bugün ağrısız hareket aralığı ve daha kolay kontrol edilen bir varyant seç; ağrı sürüyorsa yükü zorlamadan değerlendirme al.',
    });
  }

  // Deload sürüyorsa uyarı değil durum bildirimi: kullanıcı zaten önlemi almış.
  if (deload?.active) {
    ekle({
      key: 'deload-running', priority: 1, tone: TONES.info, action: 'deload',
      title: `Deload ${deload.dayIndex}/${deload.totalDays}. gün`,
      detail: `${deload.preset.label} — ${deload.preset.summary}. Antrenman ekranındaki hedefler ölçekleniyor; ${deload.daysLeft} gün sonra kendiliğinden normale döner.`,
    });
  } else if (deloadSuggestion?.suggest) {
    ekle({
      key: 'deload', priority: 1, tone: TONES.warn, action: 'deload',
      title: 'Deload zamanı geldi',
      detail: `${deloadSuggestion.reasons.join('. ')}. Deload ekranından yaklaşımı ve süreyi seçersen hedefler kendiliğinden ölçeklenir.`,
    });
  } else if (readiness?.deloadOnerisi) {
    ekle({
      key: 'readiness-low', priority: 1, tone: TONES.warn, action: 'workout',
      title: 'Üst üste düşük hazır oluşluk',
      detail: `Son üç seansın ortalaması ${readiness.ortalama}/100. Hacim tavanı aşılmasa bile toparlanamıyorsun — bu hafta set sayısını %30 düşür, ağırlığı koru.`,
    });
  }

  if (sleep && sleep.score < 55) {
    ekle({
      key: 'sleep', priority: 1, tone: TONES.warn, action: 'wellness',
      title: `Uyku puanı ${sleep.score}/100`,
      detail: sleep.asleep < 360
        ? 'Altı saatin altındaki uykuda maksimal güç ve teknik ölçülebilir şekilde düşer. Bugün rekor deneme; hedef tekrar aralığının alt sınırında çalış.'
        : 'Uyku kalitesi düşük. Şiddeti koru ama set sayısını azalt, son sette zorlamayı bırak.',
    });
  }

  // Döngü fazı tek başına performans düşüşü varsayımı değildir. Yalnızca o gün
  // kaydedilen ağrı/enerji/belirti yükü yüksekse planı değiştiren sinyal üretir.
  if (gender === 'female' && cycle?.severity === 'high') {
    ekle({
      key: 'cycle', priority: 1, tone: TONES.warn, action: 'cycle',
      title: 'Döngü belirtileri bugün yüksek',
      detail: cycle.advice.training,
    });
  } else if (gender === 'female' && cycle?.severity === 'moderate') {
    ekle({
      key: 'cycle', priority: 2, tone: TONES.info, action: 'cycle',
      title: 'Bugünkü belirtilere göre kontrol seti yap',
      detail: cycle.advice.training,
    });
  }

  // Aynı gün bacak + koşu gibi çakışmalar.
  if (conflict && (conflict.level.key === 'high' || conflict.level.key === 'medium')) {
    const ilk = conflict.items[0];
    ekle({
      key: 'conflict', priority: 1,
      tone: conflict.level.key === 'high' ? TONES.danger : TONES.warn,
      action: 'plan',
      title: ilk.title,
      detail: ilk.detail,
    });
  }

  // Planlanan antrenman henüz yapılmadıysa ve gün ilerlediyse hatırlat.
  if (planDay?.workouts?.length > 0 && doneToday === 0) {
    const ilk = planDay.workouts[0];
    ekle({
      key: 'plan', priority: 1, tone: TONES.info, action: 'workout',
      title: `${ilk.template.name} bugün planlı`,
      detail: `${planDay.sets} teorik set · ~${planDay.minutes} dk${ilk.time ? ` · ${ilk.time}` : ''}. Şablonla başlatınca geçen seansın ağırlıkları ve hedefleri hazır gelir.`,
    });
  }

  /* --- 2. öncelik: haftayı değiştirenler --- */

  // Hafta ilerledikçe MEV altındaki kaslar için uyarı sertleşir: pazartesi
  // "eksik" demek anlamsız, perşembeden sonra gerçekten sorun.
  const gun = haftaninGunu();
  // Hafta hiç başlamadıysa "16 kas eksik" demek bilgi değil gürültü; o durum
  // ayrı ve tek bir maddeyle söyleniyor.
  const haftaBasladi = MUSCLE_GROUPS.some(m => parseNumber(muscleVolume[m]) > 0);
  if (gun >= 4 && !haftaBasladi) {
    ekle({
      key: 'no-week', priority: 2, tone: TONES.warn, action: 'workout',
      title: 'Bu hafta henüz antrenman yok',
      detail: `Haftanın ${gun}. günündesin ve kayıtlı set yok. Kalan günlerde tam programı sığdırmak yerine en çok geride kalan iki bölgeye kısa birer seans koymak daha gerçekçi.`,
    });
  } else if (gun >= 4) {
    const eksik = MUSCLE_GROUPS.filter(m => {
      const vol = parseNumber(muscleVolume[m]);
      return vol > 0 && vol < getVolumeLandmarks(m, experienceLevel).mev;
    });
    const hic = MUSCLE_GROUPS.filter(m => !(parseNumber(muscleVolume[m]) > 0));
    if (eksik.length > 0 || hic.length > 0) {
      const liste = [...eksik, ...hic].slice(0, 3);
      const kalan = (eksik.length + hic.length) - liste.length;
      ekle({
        key: 'volume', priority: 2, tone: TONES.warn, action: 'plan',
        title: `${liste.join(', ')}${kalan > 0 ? ` +${kalan}` : ''} koruma eşiğinin altında`,
        detail: `Haftanın ${gun}. günündesin. Bu kaslar MEV'in altında kalırsa hafta büyüme değil koruma haftası olur; kalan günlere 2-3 set eklemek yeterli.`,
      });
    }
  }

  const acwrDeger = parseNumber(acwr?.acwr);
  if (acwr?.hasEnoughData && acwr?.nearCeiling && acwrDeger > 1.5) {
    ekle({
      key: 'acwr', priority: 2, tone: TONES.warn, action: 'plan',
      title: `Yüklenme sıçraması (ACWR ${acwrDeger.toFixed(2)})`,
      detail: 'Son haftanın hacmi kronik ortalamanın belirgin üstünde. Sıçrama sakatlık riskini artırıyor; gelecek haftayı aynı seviyede tut, üstüne ekleme.',
    });
  }

  const protein = parseNumber(macros.protein);
  if (targetProtein > 0 && protein > 0 && protein < targetProtein * 0.75) {
    ekle({
      key: 'protein', priority: 2, tone: TONES.info, action: 'nutrition',
      title: `Protein ${Math.round(protein)}/${targetProtein} g`,
      detail: `${Math.round(targetProtein - protein)} g eksik. Kas koruma ve onarımı için asıl belirleyici günlük toplam; akşam öğününe tek porsiyon eklemek farkı çoğunlukla kapatıyor.`,
    });
  }

  if (calorieRemaining !== null && calorieRemaining < -300) {
    ekle({
      key: 'calories', priority: 2, tone: TONES.warn, action: 'nutrition',
      title: `Hedefin ${Math.abs(Math.round(calorieRemaining))} kcal üstündesin`,
      detail: 'Tek gün haftalık dengeyi bozmaz. Yarın telafi etmeye çalışmak yerine hedefe dön; sert telafi çoğunlukla ertesi güne de taşıyor.',
    });
  }

  /* --- 3. öncelik: fırsat ve veri --- */

  // Zirve hazır oluşluk + planlı antrenman = rekor denemesi için uygun gün.
  if (readiness?.ortalama >= 80 && planDay?.workouts?.length > 0 && !readiness.deloadOnerisi) {
    ekle({
      key: 'pr', priority: 3, tone: TONES.good, action: 'workout',
      title: 'Rekor denemesi için uygun gün',
      detail: `Hazır oluşluk ortalaman ${readiness.ortalama}/100. İlk bileşik hareketde ağırlığı artırıp RIR 0-1 aralığında bir set deneyebilirsin.`,
    });
  }

  const durgun = plateaus.filter(p => p.state === 'decline').slice(0, 1);
  if (durgun.length > 0) {
    ekle({
      key: 'plateau', priority: 3, tone: TONES.warn, action: 'analysis',
      title: `${durgun[0].name} gerilemede`,
      detail: durgun[0].advice,
    });
  }

  if (daysSinceMetric !== null && daysSinceMetric >= 10) {
    ekle({
      key: 'metric', priority: 3, tone: TONES.info, action: 'metrics',
      title: `${daysSinceMetric} gündür ölçüm yok`,
      detail: 'Gerçek günlük harcama (adaptif TDEE) kilo eğiliminden hesaplanıyor; ölçüm girilmezse kalori hedefleri formül tahmininde kalıyor.',
    });
  }

  // Hiçbir uyarı yoksa sessiz kalmak yerine durumu onaylıyoruz: kullanıcı
  // "her şey yolunda mı yoksa kart mı bozuk" diye düşünmesin.
  if (items.length === 0) {
    ekle({
      key: 'clear', priority: 3, tone: TONES.good, action: null,
      title: 'Acil bir şey yok',
      detail: 'Toparlanma, hacim ve beslenme tarafında bugün müdahale gerektiren bir sinyal görünmüyor. Planı uygula, ölçümleri düzenli gir.',
    });
  }

  return items.sort((a, b) => a.priority - b.priority);
};
