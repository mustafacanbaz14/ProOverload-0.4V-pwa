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

export const EXERCISE_RULES = [
  // Karın & Bel
  [/crunch|plank|russian twist|ab wheel|rollout|hanging leg raise|hanging knee|toes to bar|sit-?up|dead bug|pallof/, 'Karın', 'Core', []],
  [/farmer|back extension|hyper-?extension|good morning/, 'Bel', 'Core', ['Karın']],

  // Ön Kol & Arka Kol
  [/bicep|curl|preacher|hammer/, 'Ön Kol', 'Pull', []],
  [/tricep|skull crusher|pushdown|kickback|close grip bench/, 'Arka Kol', 'Push', []],

  // Omuz
  [/face pull|reverse pec|rear delt/, 'Omuz', 'Pull', []],
  [/lateral raise|front raise/, 'Omuz', 'Push', []],
  [/overhead press|\bohp\b|shoulder press|arnold press|push press|military press/, 'Omuz', 'Push', ['Arka Kol']],

  // Bacak & Kalça
  [/squat|leg press|hack squat|lunge/, 'Ön Bacak', 'Legs', ['Kalça']],
  [/leg extension/, 'Ön Bacak', 'Legs', []],
  [/leg curl|nordic/, 'Arka Bacak', 'Legs', []],
  [/rdl|romanian deadlift|stiff-?leg|deadlift/, 'Arka Bacak', 'Legs', ['Kalça', 'Bel']],
  [/hip thrust|glute/, 'Kalça', 'Legs', ['Arka Bacak']],
  [/calf raise/, 'Ön Bacak', 'Legs', []],

  // Sırt
  [/shrug/, 'Sırt', 'Pull', []],
  [/pull-?up|chin-?up|pulldown/, 'Sırt', 'Pull', ['Ön Kol']],
  [/row|pendlay|t-bar/, 'Sırt', 'Pull', ['Ön Kol', 'Bel']],

  // Göğüs
  [/bench press|chest press|\bfly\b|pec deck|crossover|dips|push-?up/, 'Göğüs', 'Push', ['Arka Kol', 'Omuz']],
  [/press/, 'Göğüs', 'Push', ['Omuz']],
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

export const MUSCLE_VOLUME_LANDMARKS = {
  'Göğüs': { mev: 8, mav: 16, mrv: 22 },
  'Sırt': { mev: 10, mav: 18, mrv: 25 },
  'Omuz': { mev: 8, mav: 16, mrv: 22 },
  'Ön Kol': { mev: 6, mav: 14, mrv: 20 },
  'Arka Kol': { mev: 6, mav: 14, mrv: 20 },
  'Ön Bacak': { mev: 8, mav: 16, mrv: 22 },
  'Arka Bacak': { mev: 6, mav: 12, mrv: 18 },
  'Kalça': { mev: 6, mav: 14, mrv: 20 },
  'Karın': { mev: 4, mav: 10, mrv: 16 },
  'Bel': { mev: 4, mav: 8, mrv: 14 },
};
