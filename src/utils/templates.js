import { detectMuscleGroup, isWorkingSet, parseNumber } from './helpers.js';

// Bir çalışma setinin kaba süresi: kaldırma + hazırlık.
// 8-12 tekrarlık bir set ~30-45 sn sürer; ağırlık değiştirme ve yerleşme dahil 45 sn alınır.
const SECONDS_PER_SET = 45;
// Süperset içindeki ikinci hareket araya dinlenme koymadan yapılır; bu yüzden
// süperset çiftinin toplam dinlenmesi tek harekete denk sayılır.
const SUPERSET_REST_FACTOR = 0.5;

/**
 * Bir şablonun (veya antrenmanın) kas grubu başına toplam hacmini hesaplar.
 * Hacim kuralı ana ekrandakiyle aynıdır: çalışma seti sayısı × katkı ağırlığı.
 *
 * @returns {{ byMuscle: Record<string, number>, totalSets: number, exercises: number }}
 */
export const previewTemplateVolume = (exercises = [], customExercises = []) => {
  const byMuscle = {};
  // Kas -> o kasa katkı veren hareketler. Toplam sayı "neden bu kadar" sorusunu
  // cevaplamıyordu: 12 set göğüs görünüyor ama bunun 4'ü bench, 4'ü incline,
  // 4'ü dips katkısı olabilir ve hangi hareketi kısacağına ancak bu dökümle
  // karar verilebiliyor.
  const detailByMuscle = {};
  let totalSets = 0;

  (exercises || []).forEach(ex => {
    const sets = (ex.sets || []).filter(isWorkingSet).length;
    if (sets === 0) return;
    totalSets += sets;

    const { contributions } = detectMuscleGroup(ex.name, customExercises);
    Object.entries(contributions || {}).forEach(([muscle, weight]) => {
      const katki = sets * weight;
      byMuscle[muscle] = (byMuscle[muscle] || 0) + katki;
      const liste = detailByMuscle[muscle] || (detailByMuscle[muscle] = []);
      // Aynı hareket bir şablona iki kez konabiliyor; tek satırda toplanır.
      const mevcut = liste.find(item => item.name === ex.name);
      if (mevcut) {
        mevcut.sets += sets;
        mevcut.volume += katki;
      } else {
        liste.push({ name: ex.name, sets, weight, volume: katki });
      }
    });
  });

  // Yarım katkılar ondalık biriktirir; çeyrek sete yuvarlanır.
  Object.keys(byMuscle).forEach(m => {
    byMuscle[m] = Math.round(byMuscle[m] * 4) / 4;
    detailByMuscle[m] = detailByMuscle[m]
      .map(item => ({ ...item, volume: Math.round(item.volume * 4) / 4 }))
      .sort((a, b) => b.volume - a.volume);
  });

  return {
    byMuscle,
    detailByMuscle,
    totalSets,
    exercises: (exercises || []).filter(ex => (ex.sets || []).filter(isWorkingSet).length > 0).length,
  };
};

/**
 * Tahmini seans süresi (dakika).
 *
 * Süre = (set sayısı × set süresi) + (dinlenme sayısı × dinlenme süresi)
 * Son setten sonra dinlenme sayılmaz. Süperset çiftlerinde araya dinlenme
 * girmediği için o setlerin dinlenmesi yarıya indirilir.
 */
export const estimateDuration = (exercises = [], restSeconds = 120) => {
  const rest = Math.max(0, Number(restSeconds) || 0);
  let workSeconds = 0;
  let restSeconds_ = 0;

  (exercises || []).forEach(ex => {
    const sets = (ex.sets || []).filter(isWorkingSet).length;
    if (sets === 0) return;
    workSeconds += sets * SECONDS_PER_SET;
    // Hareket içindeki set aralarında dinlenilir (son setten sonra o hareket biter).
    const factor = ex.supersetId ? SUPERSET_REST_FACTOR : 1;
    restSeconds_ += Math.max(0, sets - 1) * rest * factor;
  });

  // Hareketler arası geçiş: her hareket sonrası bir dinlenme daha.
  const exerciseCount = (exercises || []).filter(ex => (ex.sets || []).filter(isWorkingSet).length > 0).length;
  restSeconds_ += Math.max(0, exerciseCount - 1) * rest;

  const total = workSeconds + restSeconds_;
  return Math.max(1, Math.round(total / 60));
};

/**
 * Şablon adı önerisi: en çok hacim alan iki kas grubundan üretilir.
 * Kullanıcı isterse elle değiştirir.
 */
export const suggestTemplateName = (exercises = [], customExercises = []) => {
  const { byMuscle } = previewTemplateVolume(exercises, customExercises);
  const top = Object.entries(byMuscle).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([m]) => m);
  if (top.length === 0) return 'Yeni Şablon';
  return top.join(' + ');
};

/** Şablonu başlatılabilir hareket listesine çevirir (kimlikler tazelenir). */
export const templateToExercises = (template, generateId) => {
  return (template?.exercises || []).map(ex => ({
    id: generateId(),
    name: ex.name,
    supersetId: ex.supersetId || null,
    sets: (ex.sets || []).map(s => ({
      id: generateId(),
      weight: s.weight || '',
      reps: s.reps || '',
      rir: s.rir ?? 2,
      tempo: s.tempo || '',
      formRating: s.formRating || 8,
      setType: s.setType || 'normal',
    })),
  }));
};

/** Antrenmanı şablona çevirir: ağırlıklar korunur, set yapısı sadeleşir. */
export const workoutToTemplate = (workout, name, generateId) => ({
  id: generateId(),
  name,
  createdAt: new Date().toISOString(),
  exercises: (workout?.exercises || []).map(ex => ({
    name: ex.name,
    supersetId: ex.supersetId || null,
    sets: (ex.sets || []).filter(isWorkingSet).map(s => ({
      weight: parseNumber(s.weight) ? String(s.weight) : '',
      reps: parseNumber(s.reps) ? String(s.reps) : '',
      rir: s.rir ?? 2,
      tempo: s.tempo || '',
      formRating: s.formRating || 8,
      setType: 'normal',
    })),
  })).filter(ex => ex.sets.length > 0),
});
