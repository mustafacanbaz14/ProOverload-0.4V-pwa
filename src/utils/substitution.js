import { detectMuscleGroup, foldForSearch } from './helpers.js';

/**
 * Hareket ikamesi — "bunu yapamıyorum, yerine ne?"
 *
 * Koç eklem ağrısı için "hareketi makine varyantıyla değiştir" diyor ama neyle
 * değiştirileceğini söylemiyordu. Burası o boşluğu dolduruyor: bir hareketin kas
 * katkı profiline en yakın hareketleri sıralıyor.
 *
 * Benzerlik kosinüs benzerliği ile ölçülüyor. Basit "aynı birincil kas" filtresi
 * yetmiyor çünkü birincil kası göğüs olan iki hareket yardımcı kaslarda tamamen
 * ayrışabiliyor: bench press omuza ve tricepse belirgin yük bindirirken pec deck
 * neredeyse yalnızca göğsü çalıştırıyor. Omzu ağrıyan biri için aradaki fark
 * tam olarak aranan şey.
 */

/**
 * Ekipman sınıfı hareket adından çıkarılıyor.
 *
 * Ayrı bir veri alanı yok ve 253 hareketi elle etiketlemek, kullanıcının kendi
 * eklediği hareketleri yine kapsamazdı. Ad zaten ekipmanı neredeyse her zaman
 * söylüyor ("Machine Chest Press", "Cable Crossover"); bilinemeyen durumda
 * filtre uygulanmıyor, yanlış etiketlemektense boş bırakmak daha doğru.
 */
export const EQUIPMENT = [
  {
    key: 'machine', label: 'Makine', order: 1,
    pattern: /machine|leg press|hack squat|pec deck|smith|lever|pendulum|sled|hammer strength|selectorized/i,
    hint: 'Hareket yolu sabit; denge talebi daha düşük olabilir',
  },
  {
    key: 'cable', label: 'Kablo', order: 2,
    pattern: /cable|pulldown|pull-?down|pushdown|push-?down|crossover|rope |face pull|kickback/i,
    hint: 'Sürekli gerilim, açı serbest',
  },
  {
    key: 'dumbbell', label: 'Dambıl', order: 3,
    pattern: /dumbbell|db |goblet|arnold|kettlebell|\bkb\b/i,
    hint: 'Her kol bağımsız; bilek ve omuz açısı serbest',
  },
  {
    key: 'bodyweight', label: 'Vücut Ağırlığı', order: 4,
    pattern: /push-?up|pull-?up|chin-?up|\bdips?\b|plank|hanging|nordic|sit-?up|crunch|bodyweight|inverted row|pistol|lunge walk|burpee/i,
    hint: 'Ekipman gerekmez',
  },
  {
    key: 'barbell', label: 'Barbell', order: 5,
    pattern: /barbell|\bbb\b|deadlift|\bohp\b|overhead press|good morning|zercher|clean|snatch|jerk|landmine/i,
    hint: 'En yüksek yüklenme, en az serbestlik',
  },
];

export const detectEquipment = (name) => {
  const ad = String(name || '');
  // Sıra önemli: "Machine Chest Press" hem machine hem press içeriyor, önce
  // eşleşen kazanır ve makine daha belirleyici bir bilgi.
  return EQUIPMENT.find(e => e.pattern.test(ad)) || null;
};

/** İki kas katkı vektörü arasındaki kosinüs benzerliği (0-1). */
export const contributionSimilarity = (a = {}, b = {}) => {
  const kaslar = new Set([...Object.keys(a), ...Object.keys(b)]);
  let nokta = 0;
  let normA = 0;
  let normB = 0;
  kaslar.forEach(k => {
    const x = a[k] || 0;
    const y = b[k] || 0;
    nokta += x * y;
    normA += x * x;
    normB += y * y;
  });
  if (normA === 0 || normB === 0) return 0;
  return nokta / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Bir hareket için ikame önerileri.
 *
 * @param name            değiştirilecek hareket
 * @param allNames        kütüphanedeki tüm hareket adları
 * @param opts.customExercises kullanıcının kendi eşlemeleri
 * @param opts.performed  daha önce yapılmış hareket adları (Set) — bilinen
 *                        hareket öneri olarak daha değerli
 * @param opts.equipment  yalnızca bu ekipman sınıfı
 * @param opts.limit      kaç öneri
 * @returns [{ name, similarity, equipment, sharedMuscles, isKnown, note }]
 */
export const suggestSubstitutes = (name, allNames = [], {
  customExercises = [],
  performed = new Set(),
  equipment = null,
  limit = 8,
} = {}) => {
  const kaynak = detectMuscleGroup(name, customExercises);
  const kaynakKatki = kaynak.contributions || {};
  if (Object.keys(kaynakKatki).length === 0) return [];

  const kaynakEkipman = detectEquipment(name);
  const kaynakAd = foldForSearch(name);

  return allNames
    .filter(other => foldForSearch(other) !== kaynakAd)
    .map(other => {
      const hedef = detectMuscleGroup(other, customExercises);
      const benzerlik = contributionSimilarity(kaynakKatki, hedef.contributions);
      const ekipman = detectEquipment(other);
      return {
        name: other,
        similarity: Math.round(benzerlik * 100) / 100,
        mechanics: hedef.mechanics,
        equipment: ekipman,
        primary: hedef.muscle,
        // Ortak kaslar: "neden bu öneri" sorusunun doğrudan cevabı.
        sharedMuscles: Object.keys(hedef.contributions || {})
          .filter(k => (kaynakKatki[k] || 0) > 0)
          .sort((a, b) => (hedef.contributions[b] || 0) - (hedef.contributions[a] || 0)),
        isKnown: performed.has(other),
      };
    })
    // 0.5 altı benzerlik farklı bir hareket demek; öneri listesini kirletir.
    .filter(x => x.similarity >= 0.5)
    .filter(x => !equipment || x.equipment?.key === equipment)
    .sort((a, b) => {
      // Önce benzerlik, eşitlikte daha önce yapılmış hareket öne alınır:
      // teknik bilinen bir harekete geçmek daha güvenli.
      if (b.similarity !== a.similarity) return b.similarity - a.similarity;
      if (a.isKnown !== b.isKnown) return a.isKnown ? -1 : 1;
      return (a.equipment?.order ?? 9) - (b.equipment?.order ?? 9);
    })
    // Ekipman sınıfı başına en fazla iki öneri. Kural tablosu bench press'in
    // bütün makine varyantlarına aynı katkı vektörünü verdiği için filtresiz
    // liste "dört farklı makine göğüs presi" oluyordu; çeşitlilik olmadan liste
    // bir seçim sunmuyor.
    .filter(cesitlilikSiniri(equipment ? 99 : 2))
    .slice(0, limit)
    .map(x => ({
      ...x,
      note: aciklama(x, kaynakEkipman),
    }));
};

/** Ekipman sınıfı başına en fazla `n` öneri geçiren filtre. */
const cesitlilikSiniri = (n) => {
  const sayac = new Map();
  return (oneri) => {
    const k = oneri.equipment?.key || 'other';
    const adet = (sayac.get(k) || 0) + 1;
    sayac.set(k, adet);
    return adet <= n;
  };
};

/**
 * Önerinin neden anlamlı olduğunu tek cümlede söyler.
 *
 * Önce ekipman farkına bakılıyor: kural tablosunda varyantların katkı vektörü
 * çoğunlukla birebir aynı, dolayısıyla benzerlik skoru ayırt edici değil —
 * kararı belirleyen şey ekipmanın getirdiği hareket serbestliği.
 */
const aciklama = (oneri, kaynakEkipman) => {
  const dahaKontrollu = oneri.equipment && kaynakEkipman
    && oneri.equipment.order < kaynakEkipman.order;
  if (dahaKontrollu) {
    return `${oneri.equipment.label}: ${oneri.equipment.hint}. Ağrısız olduğu garanti değildir.`;
  }
  if (oneri.similarity >= 0.95) {
    return oneri.equipment
      ? `${oneri.equipment.label}: ${oneri.equipment.hint}. Kas dağılımı aynı.`
      : 'Neredeyse aynı kas dağılımı — birebir yerine geçer.';
  }
  if (oneri.similarity >= 0.8) return `Aynı bölgeyi çalıştırır (${oneri.sharedMuscles.slice(0, 2).join(', ')}).`;
  return `Kısmi örtüşme: ${oneri.sharedMuscles.slice(0, 2).join(', ')}. Hacim tamamen yerine geçmez.`;
};

/**
 * Daha kontrollü ekipman adayları: kaynağa göre hareket yolu daha sınırlı olanlar.
 *
 * Kas katkısı benzerliği eklem stresini ölçmez. Makine ve kablo adayları yalnızca
 * hareket yolu/denge talebi daha öngörülebilir olabildiği için öne alınır; ağrısız
 * veya daha güvenli oldukları sonucu çıkarılamaz.
 */
export const jointFriendlySubstitutes = (name, allNames = [], opts = {}) => {
  const kaynakEkipman = detectEquipment(name);
  const hepsi = suggestSubstitutes(name, allNames, { ...opts, limit: 30 });
  return hepsi
    .filter(x => x.equipment && (!kaynakEkipman || x.equipment.order < kaynakEkipman.order))
    .slice(0, opts.limit || 5);
};
