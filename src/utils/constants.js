export const FORM_RATINGS = Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: `${i + 1}/10` }));

export const FAT_METHOD_LABELS = { skinfold: 'Kaliper Bazlı', navy: 'Mezura Bazlı', average: 'Ortalama', manual: 'Manuel' };

export const DEFAULT_SETTINGS = {
  autoCopyLastSet: true, nutritionGoal: 'bulk', proteinPerFfmBulk: 2.2, proteinPerFfmCut: 2.6,
  lockScreenActivity: true, keepScreenAwake: true,
  autoRestTimer: true, restSeconds: 120, restAlert: true,
  repRangeMin: 6, repRangeMax: 10
};

export const DELETE_LABELS = {
  workout: 'Antrenman kaydı', metric: 'Ölçüm kaydı', nutrition: 'Beslenme kaydı',
  template: 'Antrenman şablonu', mealTemplate: 'Öğün şablonu', dayTemplate: 'Beslenme şablonu'
};

export const BACKUP_KEYS = ['workouts', 'templates', 'customExercises', 'metricsHistory', 'nutritionHistory', 'mealTemplates', 'dayTemplates', 'settings'];

export const DEFAULT_EXERCISES = [
  "Barbell Back Squat", "Barbell Front Squat", "Zercher Squat", "Hack Squat", "Bulgarian Split Squat", "Leg Press", "Walking Lunges",
  "Romanian Deadlift (RDL)", "Conventional Deadlift", "Sumo Deadlift", "Trap Bar Deadlift", "Good Morning",
  "Nordic Hamstring Curl", "Lying Leg Curl", "Seated Leg Curl", "Leg Extension", "Hip Thrust", "Standing Calf Raise", "Seated Calf Raise",
  "Barbell Bench Press", "Incline Barbell Bench Press", "Dumbbell Bench Press", "Incline Dumbbell Press", "Decline Bench Press",
  "Pec Deck Fly", "Cable Crossover", "Machine Chest Press", "Dips", "Push-ups",
  "Pull-up", "Chin-up", "Barbell Row", "Pendlay Row", "T-Bar Row", "Chest Supported Row", "Meadows Row", "Dumbbell Row",
  "Seated Cable Row", "Lat Pulldown", "Straight Arm Pulldown", "Machine Row",
  "Overhead Press (OHP)", "Dumbbell Shoulder Press", "Arnold Press", "Machine Shoulder Press", "Push Press",
  "Lateral Raise (Dumbbell)", "Lateral Raise (Cable)", "Machine Lateral Raise", "Face Pull", "Reverse Pec Deck", "Upright Row",
  "Barbell Shrug", "Dumbbell Shrug",
  "Barbell Bicep Curl", "Dumbbell Bicep Curl", "Hammer Curl", "Incline Dumbbell Curl", "Preacher Curl", "Cable Bicep Curl",
  "Tricep Pushdown", "Tricep Overhead Extension", "Skull Crusher", "Close Grip Bench Press", "Tricep Kickback",
  "Cable Crunch", "Hanging Leg Raise", "Ab Wheel Rollout", "Plank", "Russian Twist", "Farmer's Walk"
].sort();

export const MUSCLE_GROUPS = [
  'Göğüs', 'Sırt', 'Omuz', 'Ön Kol', 'Arka Kol',
  'Ön Bacak', 'Arka Bacak', 'Kalça', 'Kalf', 'Karın', 'Bel'
];

// Hareket -> kas katkı ağırlıkları.
//
// Bir set, çalıştırdığı her kasa aynı oranda uyaran vermez. Ağırlıklar
// hipertrofi hacim sayımında yaygın kullanılan kademeyi izler:
//   1     birincil hedef   — hareketin asıl çalıştırdığı, yorgunluğu belirleyen kas
//   0.5   belirgin yardımcı — büyüme uyaranı alacak kadar yüklenir
//   0.25  hafif katkı      — stabilizasyon veya kısmi yüklenme
//
// Örnek: Barbell Bench Press -> Göğüs 1, Arka Kol 0.5, Omuz 0.5.
// Incline varyantında ön deltoid payı arttığı için Omuz 0.5'te kalır ama
// Decline'da omuz katkısı düşer (0.25).
//
// Sıra kritiktir: ilk eşleşen kural kazanır, bu yüzden özel kalıplar üsttedir.
// (Örn. "Lying Leg Curl" genel /curl/ kuralına düşerse biseps sayılırdı.)
export const EXERCISE_RULES = [
  // --- KARIN & BEL ---
  [/ab wheel|rollout/, 'Core', { 'Karın': 1, 'Bel': 0.25 }],
  [/hanging (leg|knee) raise|toes to bar|captain'?s chair|sit-?up|crunch|dead bug|pallof|russian twist|plank|hollow/, 'Core', { 'Karın': 1 }],
  [/back extension|hyper-?extension|reverse hyper/, 'Core', { 'Bel': 1, 'Kalça': 0.5, 'Arka Bacak': 0.5 }],
  [/farmer|suitcase carry|carry/, 'Core', { 'Karın': 0.5, 'Bel': 0.5, 'Sırt': 0.5 }],

  // --- KALF ---
  [/calf raise|calf press|donkey calf/, 'Legs', { 'Kalf': 1 }],

  // --- KALÇA BASKIN ---
  [/hip thrust|glute bridge|glute kickback|glute/, 'Legs', { 'Kalça': 1, 'Arka Bacak': 0.25 }],

  // --- HAMSTRING BASKIN (genel /curl/ kuralından önce olmalı) ---
  [/nordic|leg curl|hamstring curl/, 'Legs', { 'Arka Bacak': 1 }],
  [/romanian deadlift|\brdl\b|stiff-?leg/, 'Legs', { 'Arka Bacak': 1, 'Kalça': 0.5, 'Bel': 0.5 }],
  [/good morning/, 'Legs', { 'Arka Bacak': 1, 'Bel': 0.5, 'Kalça': 0.25 }],

  // --- DEADLIFT VARYANTLARI ---
  // Sumo'da duruş dik olduğu için kalça/quad payı artar, bel payı azalır.
  [/sumo deadlift/, 'Legs', { 'Kalça': 1, 'Ön Bacak': 0.5, 'Arka Bacak': 0.5, 'Bel': 0.5, 'Sırt': 0.25 }],
  [/trap bar deadlift|hex bar/, 'Legs', { 'Ön Bacak': 1, 'Kalça': 0.5, 'Bel': 0.5, 'Sırt': 0.25 }],
  [/deadlift/, 'Legs', { 'Bel': 1, 'Kalça': 1, 'Arka Bacak': 0.5, 'Sırt': 0.5 }],

  // --- QUAD BASKIN ---
  [/leg extension/, 'Legs', { 'Ön Bacak': 1 }],
  [/hack squat|leg press/, 'Legs', { 'Ön Bacak': 1, 'Kalça': 0.5 }],
  [/front squat|zercher/, 'Legs', { 'Ön Bacak': 1, 'Kalça': 0.5, 'Bel': 0.5, 'Karın': 0.25 }],
  [/bulgarian|split squat|lunge|step-?up/, 'Legs', { 'Ön Bacak': 1, 'Kalça': 0.5 }],
  [/squat/, 'Legs', { 'Ön Bacak': 1, 'Kalça': 0.5, 'Bel': 0.25 }],

  // --- OMUZ İZOLASYON ---
  [/face pull|reverse pec|rear delt|reverse fly/, 'Pull', { 'Omuz': 1, 'Sırt': 0.5 }],
  [/lateral raise|side raise|front raise/, 'Push', { 'Omuz': 1 }],
  [/upright row/, 'Pull', { 'Omuz': 1, 'Sırt': 0.5 }],
  [/shrug/, 'Pull', { 'Sırt': 1 }],

  // --- OMUZ BİLEŞKE ---
  [/overhead press|\bohp\b|shoulder press|arnold press|military press|push press/, 'Push', { 'Omuz': 1, 'Arka Kol': 0.5, 'Göğüs': 0.25 }],

  // --- KOL ---
  // Close grip bench triceps baskındır; göğüs kuralından önce yakalanmalı.
  [/close grip bench/, 'Push', { 'Arka Kol': 1, 'Göğüs': 0.5, 'Omuz': 0.25 }],
  [/tricep|skull crusher|pushdown|kickback|overhead extension/, 'Push', { 'Arka Kol': 1 }],
  // Bacak curl'leri yukarıda yakalandığı için buradaki genel /curl/ güvenlidir.
  // Göğüs kurallarından önce gelmesi şart: aksi halde "Incline Dumbbell Curl"
  // eğik bas hareketi sanılıp göğüs sayılırdı.
  [/preacher|bicep|hammer|concentration|spider|curl/, 'Pull', { 'Ön Kol': 1 }],

  // --- SIRT ---
  [/straight arm pulldown|pullover/, 'Pull', { 'Sırt': 1 }],
  [/pull-?up|chin-?up|lat pulldown|pulldown/, 'Pull', { 'Sırt': 1, 'Ön Kol': 0.5, 'Omuz': 0.25 }],
  // Serbest ağırlıkla öne eğik çekişlerde bel izometrik olarak belirgin yüklenir.
  [/pendlay|barbell row|t-?bar row|meadows/, 'Pull', { 'Sırt': 1, 'Ön Kol': 0.5, 'Bel': 0.5, 'Omuz': 0.25 }],
  [/\brow\b/, 'Pull', { 'Sırt': 1, 'Ön Kol': 0.5, 'Omuz': 0.25 }],

  // --- GÖĞÜS ---
  [/pec deck|\bfly\b|crossover/, 'Push', { 'Göğüs': 1 }],
  [/\bdips?\b/, 'Push', { 'Göğüs': 1, 'Arka Kol': 0.5, 'Omuz': 0.25 }],
  // Decline'da omuz payı düşer, incline'da artar.
  [/decline.*(press|bench|fly)/, 'Push', { 'Göğüs': 1, 'Arka Kol': 0.5, 'Omuz': 0.25 }],
  [/incline.*(press|bench|fly)/, 'Push', { 'Göğüs': 1, 'Omuz': 0.5, 'Arka Kol': 0.5 }],
  [/bench press|chest press|push-?up/, 'Push', { 'Göğüs': 1, 'Arka Kol': 0.5, 'Omuz': 0.5 }],

  // --- GENEL YAKALAYICI (en sonda) ---
  [/press/, 'Push', { 'Göğüs': 1, 'Omuz': 0.5, 'Arka Kol': 0.5 }],
];

export const STORAGE_VERSIONS = ['_v16', '_v15', '_v14', '_v13'];

export const BODY_METRICS = [
  { key: 'weight', label: 'Vücut Ağırlığı', unit: 'kg' },
  { key: 'neck', label: 'Boyun', unit: 'cm' },
  { key: 'shoulder', label: 'Omuz', unit: 'cm' },
  { key: 'chest', label: 'Göğüs', unit: 'cm' },
  { key: 'arm', label: 'Kol', unit: 'cm' },
  { key: 'waist', label: 'Bel (Göbek)', unit: 'cm' },
  { key: 'hip', label: 'Kalça', unit: 'cm' },
  { key: 'thigh', label: 'Uyluk (Bacak)', unit: 'cm' },
  { key: 'calf', label: 'Kalf', unit: 'cm' },
  { key: 'wrist', label: 'El Bileği', unit: 'cm' }
];

export const SET_TYPES = {
  normal: { label: 'Normal Set', badge: 'N', bgClass: 'bg-zinc-950 border-zinc-800', textClass: 'text-cyan-400 bg-cyan-950/30' },
  warmup: { label: 'Isınma Seti', badge: 'W', bgClass: 'bg-zinc-950/50 border-orange-900/40', textClass: 'text-orange-400 bg-orange-950/30' },
  drop: { label: 'Drop Set', badge: 'D', bgClass: 'bg-purple-950/20 border-purple-900/50', textClass: 'text-purple-400 bg-purple-950/30' },
  failure: { label: 'Tükeniş (Failure)', badge: 'F', bgClass: 'bg-red-950/20 border-red-900/50', textClass: 'text-red-400 bg-red-950/30' },
  rest_pause: { label: 'Rest-Pause', badge: 'RP', bgClass: 'bg-emerald-950/20 border-emerald-900/50', textClass: 'text-emerald-400 bg-emerald-950/30' },
};

export const SET_TYPE_KEYS = ['normal', 'warmup', 'drop', 'failure', 'rest_pause'];

// Haftalık set hacmi referansları (kas grubu başına):
//   MEV  koruma için gereken en az hacim
//   MAV  gelişimin en verimli olduğu aralığın üst ucu
//   MRV  toparlanmanın bozulmaya başladığı tavan
export const MUSCLE_VOLUME_LANDMARKS = {
  'Göğüs': { mev: 8, mav: 16, mrv: 22 },
  'Sırt': { mev: 10, mav: 18, mrv: 25 },
  'Omuz': { mev: 8, mav: 16, mrv: 22 },
  'Ön Kol': { mev: 6, mav: 14, mrv: 20 },
  'Arka Kol': { mev: 6, mav: 14, mrv: 20 },
  'Ön Bacak': { mev: 8, mav: 16, mrv: 22 },
  'Arka Bacak': { mev: 6, mav: 12, mrv: 18 },
  'Kalça': { mev: 6, mav: 14, mrv: 20 },
  'Kalf': { mev: 6, mav: 14, mrv: 20 },
  'Karın': { mev: 4, mav: 10, mrv: 16 },
  'Bel': { mev: 4, mav: 8, mrv: 14 },
};
