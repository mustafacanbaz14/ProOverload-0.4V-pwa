// Salonda yaygın bulunan plakalar (kg, tek plaka).
export const AVAILABLE_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

// Bar seçenekleri
export const BAR_OPTIONS = [
  { weight: 20, label: 'Olimpik (20 kg)' },
  { weight: 15, label: 'Kadın barı (15 kg)' },
  { weight: 10, label: 'Teknik bar (10 kg)' },
  { weight: 0, label: 'Bar yok / makine' },
];

/**
 * Hedef ağırlık için barın TEK tarafına takılacak plakaları hesaplar.
 * Açgözlü yaklaşım: en ağır plakadan başlar. Plakalar 1.25'in katları olduğu
 * için bu yöntem en az plaka sayısını verir.
 *
 * @returns {{ perSide: number[], achievable: number, remainder: number, exact: boolean }}
 */
export const calculatePlates = (targetWeight, barWeight = 20, plates = AVAILABLE_PLATES) => {
  const target = Number(targetWeight) || 0;
  const bar = Number(barWeight) || 0;

  if (target <= bar) {
    return { perSide: [], achievable: bar, remainder: 0, exact: target === bar };
  }

  let perSideRemaining = (target - bar) / 2;
  const perSide = [];

  for (const plate of [...plates].sort((a, b) => b - a)) {
    // Kayan nokta artığı yüzünden 0.001 toleransı gerekiyor.
    while (perSideRemaining >= plate - 0.001) {
      perSide.push(plate);
      perSideRemaining -= plate;
    }
  }

  const loaded = perSide.reduce((a, b) => a + b, 0);
  const achievable = bar + loaded * 2;
  const remainder = Math.round((target - achievable) * 100) / 100;

  return { perSide, achievable, remainder, exact: Math.abs(remainder) < 0.001 };
};

/** Aynı plakadan kaç tane takılacağını gruplar: [{ plate, count }] */
export const groupPlates = (perSide) => {
  const counts = new Map();
  perSide.forEach(p => counts.set(p, (counts.get(p) || 0) + 1));
  return [...counts.entries()]
    .map(([plate, count]) => ({ plate, count }))
    .sort((a, b) => b.plate - a.plate);
};

/** Bara takılabilecek en yakın ağırlığa yuvarlar (en küçük plaka çifti kadar adım). */
export const roundToLoadable = (weight, barWeight = 20, smallestPlate = 1.25) => {
  const step = smallestPlate * 2;
  const bar = Number(barWeight) || 0;
  const above = Number(weight) - bar;
  if (above <= 0) return bar;
  return bar + Math.round(above / step) * step;
};

/**
 * Çalışma ağırlığına göre ısınma piramidi üretir.
 *
 * Yaklaşım: yükü kademeli artırırken tekrar sayısını düşürmek, sinir sistemini
 * hazırlarken yorgunluk biriktirmemeyi hedefler. Hafif ağırlıklarda (bara yakın)
 * ara kademeler anlamsızlaştığı için elenir.
 */
export const generateWarmup = (workingWeight, barWeight = 20) => {
  const target = Number(workingWeight) || 0;
  const bar = Number(barWeight) || 0;
  if (target <= 0) return [];

  const steps = [];

  // Boş bar yalnızca anlamlıysa (hedef barın belirgin üstündeyse)
  if (bar > 0 && target > bar * 1.5) {
    steps.push({ weight: bar, reps: 10, label: 'Boş bar' });
  }

  [
    { pct: 0.4, reps: 8 },
    { pct: 0.6, reps: 5 },
    { pct: 0.8, reps: 3 },
    { pct: 0.9, reps: 1 },
  ].forEach(({ pct, reps }) => {
    const raw = target * pct;
    if (raw <= bar) return; // bara takılamayacak kadar hafif
    const weight = roundToLoadable(raw, bar);
    // Aynı ağırlık iki kez çıkmasın
    if (steps.some(s => s.weight === weight)) return;
    if (weight >= target) return;
    steps.push({ weight, reps, label: `%${Math.round(pct * 100)}` });
  });

  return steps;
};
