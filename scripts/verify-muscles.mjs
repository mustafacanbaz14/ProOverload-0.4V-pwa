/**
 * Kas taksonomisi doğrulama betiği. Bağımlılık gerektirmez.
 *   npm run verify
 *
 * Amaç: kural tablosu sırası veya kas adları bozulduğunda bunu sessizce
 * kullanıcıya taşımak yerine derleme öncesinde yakalamak.
 */
import {
  MUSCLE_GROUPS, MUSCLE_SECTIONS, SMALL_MUSCLE_GROUPS, EXERCISE_RULES,
  MUSCLE_VOLUME_LANDMARKS, DEFAULT_EXERCISES, LEGACY_MUSCLE_MAP
} from '../src/utils/constants.js';
import { migrateCustomExercises, normalizeMuscleName } from '../src/utils/migrations.js';

const errors = [];
const warnings = [];
const fail = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

const matchRule = (name) => {
  const lower = name.toLowerCase();
  for (let i = 0; i < EXERCISE_RULES.length; i++) {
    if (EXERCISE_RULES[i][0].test(lower)) return { index: i, rule: EXERCISE_RULES[i] };
  }
  return null;
};

const primaryOf = (contributions) => {
  let best = null, bestW = -1;
  for (const [m, w] of Object.entries(contributions || {})) {
    if (w > bestW) { best = m; bestW = w; }
  }
  return best;
};

// Beklenen birincil kaslar. Kural sırası değişip bir hareket başka kurala
// düşerse fark buradan görünür. Geçmişte üç kez sessizce bozulan yerler:
// leg curl -> biseps, incline dumbbell curl -> göğüs, close grip -> göğüs.
const EXPECTED_PRIMARY = {
  'Ab Wheel Rollout': 'Karın',
  'Arnold Press': 'Ön Omuz',
  'Barbell Back Squat': 'Quadriceps',
  'Barbell Bench Press': 'Göğüs',
  'Barbell Bicep Curl': 'Biseps',
  'Barbell Front Squat': 'Quadriceps',
  'Barbell Pullover': 'Kanat',
  'Barbell Row': 'Orta Sırt',
  'Barbell Shrug': 'Trapez',
  'Behind the Back Wrist Curl': 'Önkol',
  'Belt Squat': 'Quadriceps',
  'Bulgarian Split Squat': 'Quadriceps',
  'Cable Bicep Curl': 'Biseps',
  'Cable Crossover': 'Göğüs',
  'Cable Crunch': 'Karın',
  'Cable Fly (Low to High)': 'Göğüs',
  'Cable Hammer Curl': 'Biseps',
  'Cable Overhead Tricep Extension': 'Triseps',
  'Cable Pull Through': 'Kalça',
  'Cable Rear Delt Fly': 'Arka Omuz',
  'Cable Woodchopper': 'Karın',
  'Chest Supported Row': 'Orta Sırt',
  'Chin-up': 'Kanat',
  'Close Grip Bench Press': 'Triseps',
  'Conventional Deadlift': 'Bel',
  'Decline Bench Press': 'Göğüs',
  'Decline Sit-up': 'Karın',
  'Diamond Push-ups': 'Triseps',
  'Dips': 'Göğüs',
  'Dumbbell Bench Press': 'Göğüs',
  'Dumbbell Bicep Curl': 'Biseps',
  'Dumbbell Row': 'Orta Sırt',
  'Dumbbell Shoulder Press': 'Ön Omuz',
  'Dumbbell Shrug': 'Trapez',
  'EZ Bar Curl': 'Biseps',
  'Face Pull': 'Arka Omuz',
  "Farmer's Walk": 'Önkol',
  'Glute Ham Raise': 'Hamstring',
  'Goblet Squat': 'Quadriceps',
  'Good Morning': 'Hamstring',
  'Hack Squat': 'Quadriceps',
  'Hammer Curl': 'Biseps',
  'Hanging Knee Raise': 'Karın',
  'Hanging Leg Raise': 'Karın',
  'Hip Thrust': 'Kalça',
  'Incline Barbell Bench Press': 'Göğüs',
  'Incline Dumbbell Curl': 'Biseps',
  'Incline Dumbbell Fly': 'Göğüs',
  'Incline Dumbbell Press': 'Göğüs',
  'Inverted Row': 'Orta Sırt',
  'Landmine Press': 'Ön Omuz',
  'Lat Pulldown': 'Kanat',
  'Lateral Raise (Cable)': 'Yan Omuz',
  'Lateral Raise (Dumbbell)': 'Yan Omuz',
  'Leg Extension': 'Quadriceps',
  'Leg Press': 'Quadriceps',
  'Leg Press Calf Raise': 'Baldır',
  'Lying Leg Curl': 'Hamstring',
  'Machine Chest Press': 'Göğüs',
  'Machine Fly': 'Göğüs',
  'Machine Lateral Raise': 'Yan Omuz',
  'Machine Row': 'Orta Sırt',
  'Machine Shoulder Press': 'Ön Omuz',
  'Meadows Row': 'Orta Sırt',
  'Nordic Hamstring Curl': 'Hamstring',
  'Overhead Press (OHP)': 'Ön Omuz',
  'Pec Deck Fly': 'Göğüs',
  'Pendlay Row': 'Orta Sırt',
  'Plank': 'Karın',
  'Preacher Curl': 'Biseps',
  'Pull-up': 'Kanat',
  'Push Press': 'Ön Omuz',
  'Push-ups': 'Göğüs',
  'Rack Pull': 'Bel',
  'Rear Delt Fly (Dumbbell)': 'Arka Omuz',
  'Reverse Curl': 'Önkol',
  'Reverse Pec Deck': 'Arka Omuz',
  'Reverse Wrist Curl': 'Önkol',
  'Romanian Deadlift (RDL)': 'Hamstring',
  'Russian Twist': 'Karın',
  'Seated Cable Row': 'Orta Sırt',
  'Seated Calf Raise': 'Baldır',
  'Seated Leg Curl': 'Hamstring',
  'Seated Row (Wide Grip)': 'Orta Sırt',
  'Side Plank': 'Karın',
  'Single Arm Lat Pulldown': 'Kanat',
  'Single Leg Press': 'Quadriceps',
  'Sissy Squat': 'Quadriceps',
  'Skull Crusher': 'Triseps',
  'Smith Machine Bench Press': 'Göğüs',
  'Smith Machine Calf Raise': 'Baldır',
  'Smith Machine Squat': 'Quadriceps',
  'Standing Calf Raise': 'Baldır',
  'Standing Leg Curl': 'Hamstring',
  'Straight Arm Pulldown': 'Kanat',
  'Sumo Deadlift': 'Kalça',
  'T-Bar Row': 'Orta Sırt',
  'Trap Bar Deadlift': 'Quadriceps',
  'Tricep Kickback': 'Triseps',
  'Tricep Overhead Extension': 'Triseps',
  'Tricep Pushdown': 'Triseps',
  'Upright Row': 'Yan Omuz',
  'Walking Lunges': 'Quadriceps',
  'Wrist Curl': 'Önkol',
  'Y-Raise': 'Arka Omuz',
  'Zercher Squat': 'Quadriceps',
  'Zottman Curl': 'Biseps',
};

// 1 — MUSCLE_GROUPS bütünlüğü
if (MUSCLE_GROUPS.length !== 16) fail(`MUSCLE_GROUPS 16 üye olmalı, ${MUSCLE_GROUPS.length} var`);
if (new Set(MUSCLE_GROUPS).size !== MUSCLE_GROUPS.length) fail('MUSCLE_GROUPS tekrar eden üye içeriyor');
MUSCLE_GROUPS.forEach(m => {
  if (m !== m.trim()) fail(`Kas adında baş/son boşluk: "${m}"`);
});

// 2-4 — Kural tablosu
EXERCISE_RULES.forEach(([pattern, mechanics, contributions], i) => {
  const label = `Kural #${i} (${pattern})`;
  if (!['Push', 'Pull', 'Legs', 'Core'].includes(mechanics)) {
    fail(`${label}: geçersiz mekanik "${mechanics}"`);
  }
  const entries = Object.entries(contributions || {});
  if (entries.length === 0) fail(`${label}: katkı tablosu boş`);
  let hasPrimary = false;
  entries.forEach(([muscle, weight]) => {
    if (!MUSCLE_GROUPS.includes(muscle)) fail(`${label}: tanımsız kas "${muscle}"`);
    if (![1, 0.5, 0.25].includes(weight)) fail(`${label}: geçersiz ağırlık ${weight} (${muscle})`);
    if (weight === 1) hasPrimary = true;
  });
  if (!hasPrimary) fail(`${label}: ağırlığı 1 olan birincil kas yok`);
});

// 5 — Hacim referansları
const landmarkKeys = Object.keys(MUSCLE_VOLUME_LANDMARKS);
MUSCLE_GROUPS.forEach(m => {
  if (!landmarkKeys.includes(m)) fail(`"${m}" için MUSCLE_VOLUME_LANDMARKS girişi yok`);
});
landmarkKeys.forEach(m => {
  if (!MUSCLE_GROUPS.includes(m)) fail(`MUSCLE_VOLUME_LANDMARKS fazla giriş: "${m}"`);
  const { mev, mav, mrv } = MUSCLE_VOLUME_LANDMARKS[m];
  if (!(mev < mav && mav < mrv)) fail(`"${m}": mev<mav<mrv değil (${mev}/${mav}/${mrv})`);
});

// MUSCLE_SECTIONS ve SMALL_MUSCLE_GROUPS tutarlılığı
const sectioned = MUSCLE_SECTIONS.flatMap(s => s.muscles);
MUSCLE_GROUPS.forEach(m => {
  if (!sectioned.includes(m)) fail(`"${m}" hiçbir MUSCLE_SECTIONS bölümünde yok`);
});
sectioned.forEach(m => {
  if (!MUSCLE_GROUPS.includes(m)) fail(`MUSCLE_SECTIONS tanımsız kas: "${m}"`);
});
SMALL_MUSCLE_GROUPS.forEach(m => {
  if (!MUSCLE_GROUPS.includes(m)) fail(`SMALL_MUSCLE_GROUPS tanımsız kas: "${m}"`);
});

// 6-7 — Hareketler
const coveredPrimaries = new Set();
DEFAULT_EXERCISES.forEach(name => {
  const hit = matchRule(name);
  if (!hit) { fail(`"${name}" hiçbir kurala eşleşmiyor`); return; }
  const contributions = hit.rule[2];
  const primary = primaryOf(contributions);
  coveredPrimaries.add(primary);

  const expected = EXPECTED_PRIMARY[name];
  if (!expected) {
    warn(`"${name}" EXPECTED_PRIMARY listesinde yok — altın anahtara ekle`);
  } else if (expected !== primary) {
    fail(`"${name}": beklenen birincil "${expected}", bulunan "${primary}" (kural #${hit.index})`);
  }
});
Object.keys(EXPECTED_PRIMARY).forEach(name => {
  if (!DEFAULT_EXERCISES.includes(name)) {
    warn(`EXPECTED_PRIMARY'de olup DEFAULT_EXERCISES'te olmayan hareket: "${name}"`);
  }
});

// 8 — Kapsama (uyarı)
MUSCLE_GROUPS.forEach(m => {
  if (!coveredPrimaries.has(m)) warn(`"${m}" hiçbir varsayılan hareketin birincil kası değil`);
});

// 9 — Göç tablosu
Object.entries(LEGACY_MUSCLE_MAP).forEach(([from, to]) => {
  if (to !== null && !MUSCLE_GROUPS.includes(to)) {
    fail(`LEGACY_MUSCLE_MAP: "${from}" -> "${to}" geçerli bir kas grubu değil`);
  }
  // Idempotentlik: hedef aynı zamanda bir anahtarsa kendine map'lenmeli
  if (to !== null && Object.prototype.hasOwnProperty.call(LEGACY_MUSCLE_MAP, to)) {
    if (LEGACY_MUSCLE_MAP[to] !== to) {
      fail(`LEGACY_MUSCLE_MAP idempotent değil: "${from}" -> "${to}" -> "${LEGACY_MUSCLE_MAP[to]}"`);
    }
  }
});
if (LEGACY_MUSCLE_MAP['Ön Kol'] !== 'Biseps') {
  fail(`KRİTİK: 'Ön Kol' (eski = biseps) -> "${LEGACY_MUSCLE_MAP['Ön Kol']}" olmalıydı 'Biseps'. 'Önkol' bilek bölgesidir, veri bozulur.`);
}
MUSCLE_GROUPS.forEach(m => {
  if (Object.prototype.hasOwnProperty.call(LEGACY_MUSCLE_MAP, m) && LEGACY_MUSCLE_MAP[m] !== m) {
    fail(`LEGACY_MUSCLE_MAP geçerli kas "${m}" adını "${LEGACY_MUSCLE_MAP[m]}" olarak değiştiriyor`);
  }
});

// 10 — Göç idempotentliği ve dayanıklılığı
const fixture = [
  { name: 'Eski Biseps', muscle: 'Ön Kol', mechanics: 'Pull' },
  { name: 'Eski Sırt', muscle: 'Sırt', mechanics: 'Pull' },
  { name: 'Gecersiz Bacak', muscle: 'Bacak', mechanics: 'Legs' },
  { name: 'Gecersiz Kol', muscle: 'Kol', mechanics: 'Pull' },
  { name: 'Gecersiz Merkez', muscle: 'Merkez', mechanics: 'Core' },
  { name: 'Gecersiz Diger', muscle: 'Diğer', mechanics: 'Diğer' },
  { name: 'Ikincilli', muscle: 'Göğüs', secondary: ['Arka Kol', 'Omuz'], mechanics: 'Push' },
  { name: 'Cakisan', contributions: { 'Sırt': 1, 'Kanat': 0.5 } },
  { name: 'Zaten Yeni', contributions: { 'Yan Omuz': 1 }, muscle: 'Yan Omuz', schema: 2 },
  'düz string',
  null,
  {},
];
const once = migrateCustomExercises(fixture);
const twice = migrateCustomExercises(once);
if (JSON.stringify(once) !== JSON.stringify(twice)) {
  fail('migrateCustomExercises idempotent değil (ikinci çalıştırma sonucu değiştirdi)');
}
if (!Array.isArray(migrateCustomExercises(null))) fail('migrateCustomExercises(null) dizi döndürmeli');
if (migrateCustomExercises(fixture)[9] !== 'düz string') fail('Düz string kayıt değiştirilmemeli');

const eskiBiseps = once.find(e => e && e.name === 'Eski Biseps');
if (!eskiBiseps || eskiBiseps.muscle !== 'Biseps') {
  fail(`Göç: 'Ön Kol' -> Biseps bekleniyordu, bulunan: ${eskiBiseps && eskiBiseps.muscle}`);
}
const cakisan = once.find(e => e && e.name === 'Cakisan');
if (!cakisan || cakisan.contributions['Kanat'] !== 1) {
  fail(`Göç: çakışan Sırt/Kanat kaydında yüksek ağırlık korunmalı, bulunan: ${JSON.stringify(cakisan && cakisan.contributions)}`);
}
const diger = once.find(e => e && e.name === 'Gecersiz Diger');
if (!diger || Object.keys(diger.contributions).length !== 0) {
  fail(`Göç: 'Diğer' hiçbir kasa yazılmamalı, bulunan: ${JSON.stringify(diger && diger.contributions)}`);
}
// Tüm kayıtlar isimlerini korumalı — antrenmanlarla tek bağ o
fixture.forEach((orig, i) => {
  if (orig && typeof orig === 'object' && orig.name && once[i].name !== orig.name) {
    fail(`Göç hareket adını değiştirdi: "${orig.name}" -> "${once[i].name}"`);
  }
});
// normalizeMuscleName sağlaması
if (normalizeMuscleName('Ön Kol') !== 'Biseps') fail("normalizeMuscleName('Ön Kol') 'Biseps' olmalı");
if (normalizeMuscleName('Önkol') !== 'Önkol') fail("normalizeMuscleName('Önkol') 'Önkol' olmalı");
if (normalizeMuscleName('bilinmeyen') !== null) fail('normalizeMuscleName tanınmayan ad için null dönmeli');

// --- Rapor ---
warnings.forEach(w => console.log(`UYARI  ${w}`));
if (errors.length) {
  errors.forEach(e => console.error(`HATA   ${e}`));
  console.error(`\n${errors.length} hata bulundu.`);
  process.exitCode = 1;
} else {
  console.log(`\nTüm kontroller geçti — ${MUSCLE_GROUPS.length} kas grubu, ${EXERCISE_RULES.length} kural, ${DEFAULT_EXERCISES.length} hareket.`);
}
