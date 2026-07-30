export const FORM_RATINGS = Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: `${i + 1}/10` }));

export const FAT_METHOD_LABELS = { skinfold: 'Kaliper Bazlı', navy: 'Mezura Bazlı', average: 'Ortalama', manual: 'Manuel' };

export const DEFAULT_SETTINGS = {
  autoCopyLastSet: true, nutritionGoal: 'bulk', proteinPerFfmBulk: 2.2, proteinPerFfmCut: 2.6,
  lockScreenActivity: true, keepScreenAwake: true,
  autoRestTimer: true, restSeconds: 120, restAlert: true,
  repRangeMin: 6, repRangeMax: 10,
  experienceLevel: 'intermediate',
  // Hareket seçiminde varsayılan olarak yalnızca daha önce yapılmış hareketler
  // listelenir; gerisi arama ile bulunur.
  pickerShowAll: false,
  // Kullanıcının kendi görünürlük listesi: hiddenExercises yapılmış olsa bile
  // listeden çıkarır, pinnedExercises hiç yapılmamış olsa bile listeye sokar.
  hiddenExercises: [],
  pinnedExercises: [],
  // 1RM analiz listesinin kendi gizleme listesi — antrenman seçimindekinden ayrı.
  hidden1RMExercises: [],
  // Haftalık program: gün anahtarı -> şablon kimliği (null = dinlenme günü).
  weekPlan: {},
  // Ana sayfadaki 16 satırlık kas hacmi listesi varsayılan olarak kapalı.
  showMuscleVolume: false,
  // Vücut kompozisyonu hedefleri. Boş string = hedef konulmamış; ölçüm kaydına
  // değil ayarlara yazılıyor çünkü hedef zaman içinde sabit bir niyet, o günün
  // ölçümü değil.
  goalWeight: '',
  goalBodyFat: '',
  goalFFM: '',
  goalFFMI: '',
  // Haftalık kayıp/alım hızı tercihi (goals.js CUT_RATES / BULK_RATES anahtarı).
  // Boş = döneme göre varsayılan ("Ölçülü") kullanılır.
  paceRate: '',
  // Günlük hareket (NEAT) hesabı: 'auto' artık yöntemi, 'level' aktivite
  // seviyesi çarpanı, 'steps' adım sayısı, 'manual' doğrudan kcal.
  neatMode: 'auto',
  activityLevel: 'light',
  neatManual: '',
  // BMI gösterimi: 'standard' klasik aralıklar, 'athletic' kas kütlesini
  // hesaba katan aralıklar.
  bmiMode: 'athletic',
  // Görünüm teması: 'dark' | 'light'
  theme: 'dark',
  // Yazı büyüklüğü çarpanı (kök font-size). 1 = varsayılan.
  fontScale: 1,
  // NEAT için kullanıcı çarpanı: otomatik/seviye hesabını ölçekler.
  neatMultiplier: 1
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
  "Lateral Raise (Dumbbell)", "Lateral Raise (Cable)", "Machine Lateral Raise", "Face Pull", "Reverse Pec Deck",
  "Rear Delt Fly (Dumbbell)", "Upright Row",
  "Barbell Shrug", "Dumbbell Shrug",
  "Barbell Bicep Curl", "Dumbbell Bicep Curl", "Hammer Curl", "Incline Dumbbell Curl", "Preacher Curl", "Cable Bicep Curl",
  "Tricep Pushdown", "Tricep Overhead Extension", "Skull Crusher", "Close Grip Bench Press", "Tricep Kickback",
  "Wrist Curl", "Reverse Wrist Curl", "Reverse Curl",
  "Cable Crunch", "Hanging Leg Raise", "Hanging Knee Raise", "Ab Wheel Rollout", "Plank", "Side Plank",
  "Russian Twist", "Decline Sit-up", "Cable Woodchopper", "Farmer's Walk",

  // --- v0.6 eklemeleri ---
  "Incline Dumbbell Fly", "Cable Fly (Low to High)", "Machine Fly", "Smith Machine Bench Press",
  "Diamond Push-ups",
  "Inverted Row", "Seated Row (Wide Grip)", "Single Arm Lat Pulldown", "Barbell Pullover", "Rack Pull",
  "Landmine Press", "Cable Rear Delt Fly", "Y-Raise",
  "EZ Bar Curl", "Zottman Curl", "Cable Hammer Curl", "Cable Overhead Tricep Extension",
  "Goblet Squat", "Belt Squat", "Smith Machine Squat", "Sissy Squat", "Single Leg Press",
  "Standing Leg Curl", "Glute Ham Raise", "Cable Pull Through",
  "Leg Press Calf Raise", "Smith Machine Calf Raise",
  "Behind the Back Wrist Curl",

  // --- v0.7 eklemeleri ---
  // Göğüs
  "Incline Cable Fly", "Decline Dumbbell Press", "Floor Press", "Guillotine Press",
  "Weighted Push-ups", "Deficit Push-ups", "Smith Machine Incline Press", "Machine Chest Dip",
  // Sırt
  "Seal Row", "Kroc Row", "Gorilla Row", "Single Arm Cable Row", "Chest Supported T-Bar Row",
  "Wide Grip Pull-up", "Neutral Grip Pull-up", "Weighted Pull-up", "Assisted Pull-up",
  "Reverse Grip Lat Pulldown", "Kneeling Cable Pullover", "Machine Pullover",
  // Omuz
  "Seated Dumbbell Shoulder Press", "Z Press", "Viking Press", "Behind the Neck Press",
  "Leaning Cable Lateral Raise", "Lu Lateral Raise", "Cable Front Raise", "Plate Front Raise",
  "Bent Over Lateral Raise", "Reverse Cable Fly",
  // Trapez
  "Trap Bar Shrug", "Cable Shrug", "Smith Machine Shrug",
  // Kol
  "Cable Preacher Curl", "Machine Preacher Curl", "Bayesian Cable Curl", "Drag Curl",
  "Barbell Curl 21s", "Concentration Curl", "Cross Body Hammer Curl",
  "Rope Pushdown", "V-Bar Pushdown", "JM Press", "Bench Dip",
  // Önkol
  "Wrist Roller", "Plate Pinch Hold", "Dead Hang", "Farmer's Hold",
  // Bacak
  "Reverse Lunge", "Curtsy Lunge", "Box Step-up", "Box Squat", "Pause Squat",
  "Pendulum Squat", "Standing Leg Extension", "Single Leg Romanian Deadlift",
  "Hip Abduction Machine", "Hip Adduction Machine",
  // Kalça
  "Single Leg Hip Thrust", "Machine Hip Thrust", "Frog Pump", "Cable Glute Kickback",
  // Baldır
  "Single Leg Calf Raise",
  // Karın & Bel
  "Machine Crunch", "Toes to Bar", "Dragon Flag", "Pallof Press", "Dead Bug",
  "Hollow Body Hold", "V-Ups", "Bicycle Crunch", "Weighted Plank",
  "Reverse Hyperextension", "Jefferson Curl", "Superman Hold", "Bird Dog",

  // --- v0.9 eklemeleri ---
  // Göğüs
  "Cable Fly (High to Low)", "Hex Press", "Plate Squeeze Press", "Wide Grip Bench Press",
  "Spoto Press", "Larsen Press", "Machine Incline Press", "Banded Push-ups",
  // Sırt
  "Rope Face Pull", "Chest Supported Dumbbell Row", "Barbell Shrug Behind Back",
  "Wide Grip Seated Row", "Close Grip Lat Pulldown", "Machine High Row",
  "Machine Low Row", "Renegade Row", "Dumbbell Pullover", "Archer Pull-up",
  "Scapular Pull-up", "Cable Lat Prayer",
  // Omuz
  "Machine Reverse Fly", "Cable Upright Row", "Dumbbell Upright Row",
  "Seated Lateral Raise", "Incline Lateral Raise", "Cuban Press", "Powell Raise",
  "Landmine Lateral Raise",
  // Kol
  "Incline Cable Curl", "Machine Bicep Curl", "Rope Hammer Curl", "Waiter Curl",
  "Overhead Cable Curl", "Reverse Grip Pushdown", "Single Arm Pushdown",
  "French Press", "Lying Dumbbell Extension", "Tate Press",
  // Önkol
  "Cable Wrist Curl", "Hammer Wrist Rotation", "Towel Hang",
  // Bacak
  "Front Foot Elevated Split Squat", "Heels Elevated Squat",
  "Cyclist Squat", "Barbell Step-up", "Lateral Lunge", "Deficit Reverse Lunge",
  "Seated Hip Abduction", "Copenhagen Adduction", "Banded Lateral Walk",
  "Single Leg Leg Extension", "Kneeling Leg Curl", "Slider Leg Curl",
  // Kalça
  "Barbell Glute Bridge", "Cable Hip Abduction", "Step Down",
  // Baldır
  "Donkey Calf Raise", "Hack Squat Calf Raise", "Seated Single Leg Calf Raise",
  // Karın & Bel
  "Cable Side Bend", "Suitcase Carry", "Hanging Oblique Raise", "Copenhagen Plank",
  "Ab Crunch Machine", "Stir the Pot", "Standing Cable Crunch", "L-Sit Hold",
  "Weighted Decline Sit-up", "Landmine Rotation"
].sort();

// 16 kas grubu. Ayrım hipertrofi hacim takibinin gerektirdiği çözünürlüğe göre:
//  - Deltoid üç başa ayrıldı. Bench+OHP yapan biri ön deltoidi doldurur ama yan
//    deltoide hiç dokunmaz; tek "Omuz" kovası bunu gizliyordu.
//  - Trapez sırttan ayrıldı: shrug/deadlift trapeze, row/pulldown kanata yüklenir.
//  - Sırt kanat (dikey çekiş) ve orta sırt (yatay çekiş) olarak ikiye bölündü.
export const MUSCLE_GROUPS = [
  'Göğüs', 'Kanat', 'Orta Sırt', 'Trapez',
  'Ön Omuz', 'Yan Omuz', 'Arka Omuz',
  'Biseps', 'Triseps', 'Önkol',
  'Quadriceps', 'Hamstring', 'Kalça', 'Baldır',
  'Karın', 'Bel'
];

// Görsel gruplama (ana ekrandaki hacim rehberi 16 satırı tek listede vermesin diye)
export const MUSCLE_SECTIONS = [
  { title: 'Üst Gövde — İtme', muscles: ['Göğüs', 'Ön Omuz', 'Yan Omuz', 'Triseps'] },
  { title: 'Üst Gövde — Çekme', muscles: ['Kanat', 'Orta Sırt', 'Trapez', 'Arka Omuz'] },
  { title: 'Kollar', muscles: ['Biseps', 'Önkol'] },
  { title: 'Alt Gövde', muscles: ['Quadriceps', 'Hamstring', 'Kalça', 'Baldır'] },
  { title: 'Gövde Merkezi', muscles: ['Karın', 'Bel'] },
];

// Küçük kas grupları: progresyonda 2.5 kg yerine 1.25 kg adımla ilerler.
export const SMALL_MUSCLE_GROUPS = [
  'Biseps', 'Triseps', 'Önkol', 'Ön Omuz', 'Yan Omuz', 'Arka Omuz',
  'Baldır', 'Trapez', 'Orta Sırt'
];

// Eski kas adları -> yeni taksonomi. Yalnızca kullanıcının kaydettiği özel
// hareketler için kullanılır; antrenman kayıtları kas adı tutmaz.
//
// DİKKAT: Eski 'Ön Kol' BİSEPS demekti. Yeni taksonomideki 'Önkol' ise bilek
// bölgesi. Aradaki tek fark bir boşluk; yanlış eşleşme sessiz veri bozulmasıdır.
// scripts/verify-muscles.mjs bunu ayrıca kontrol eder.
//
// null = hacme sayılmaz (eski 'Diğer' zaten hiçbir zaman sayılmıyordu).
export const LEGACY_MUSCLE_MAP = {
  'Ön Kol': 'Biseps',
  'Arka Kol': 'Triseps',
  'Ön Bacak': 'Quadriceps',
  'Arka Bacak': 'Hamstring',
  'Kalf': 'Baldır',
  // Bölünen gruplar: eski kurallarda 'Sırt' birincil olduğu her hareket
  // (pulldown, row, pullover) lat baskındı; 'Omuz' ise özel harekette
  // çoğunlukla yan deltoid izolasyonu anlamına geliyordu.
  'Sırt': 'Kanat',
  'Omuz': 'Yan Omuz',
  // v16 formundaki, hacim sisteminde karşılığı olmayan seçenekler
  'Bacak': 'Quadriceps',
  'Kol': 'Biseps',
  'Merkez': 'Karın',
  'Diğer': null,
  // Değişmeyenler açıkça yazılır: tablonun idempotent olması buna dayanıyor.
  'Göğüs': 'Göğüs',
  'Kalça': 'Kalça',
  'Karın': 'Karın',
  'Bel': 'Bel',
};

// Hareket -> kas katkı ağırlıkları.
//
// Bir set, çalıştırdığı her kasa aynı oranda uyaran vermez. Ağırlıklar
// hipertrofi hacim sayımında yaygın kullanılan kademeyi izler:
//   1     birincil hedef    — hareketin asıl çalıştırdığı, yorgunluğu belirleyen kas
//   0.5   belirgin yardımcı — büyüme uyaranı alacak kadar yüklenir
//   0.25  hafif katkı       — stabilizasyon veya kısmi yüklenme
//
// Örnek: Barbell Bench Press -> Göğüs 1, Triseps 0.5, Ön Omuz 0.5.
// Incline'da ön deltoid payı korunur; Decline'da omuz açısı azaldığı için 0.25'e düşer.
//
// Sıra kritiktir: ilk eşleşen kural kazanır, bu yüzden özel kalıplar üsttedir.
// Korunması gereken üç tuzak:
//   - "leg curl" genel /curl/ kuralından ÖNCE olmalı (yoksa biseps sayılır)
//   - "close grip bench" göğüs kurallarından ÖNCE olmalı (triseps baskın)
//   - genel /curl/ "incline" kuralından ÖNCE olmalı ("Incline Dumbbell Curl")
export const EXERCISE_RULES = [
  // Copenhagen adduktor hareketidir; adında "plank" geçtiği için aşağıdaki
  // genel /plank/ kuralından ÖNCE yakalanmak zorunda.
  [/copenhagen/, 'Legs', { 'Kalça': 1, 'Karın': 0.5 }],

  // --- KARIN & BEL ---
  [/ab wheel|rollout/, 'Core', { 'Karın': 1, 'Bel': 0.25 }],
  [/woodchop|cable twist/, 'Core', { 'Karın': 1 }],
  [/hanging (leg|knee|oblique) raise|toes to bar|captain'?s chair|sit-?up|crunch|dead bug|pallof|russian twist|plank|hollow|side bend|l-?sit|stir the pot|landmine (rotation|twist)/, 'Core', { 'Karın': 1 }],
  [/back extension|hyper-?extension|reverse hyper/, 'Core', { 'Bel': 1, 'Kalça': 0.5, 'Hamstring': 0.5 }],
  // "Jefferson Curl" adında curl geçer ama omurga hareketidir; biseps kuralından
  // çok önce yakalanmak zorunda.
  [/jefferson curl/, 'Core', { 'Bel': 1, 'Hamstring': 0.5 }],
  [/superman|bird dog/, 'Core', { 'Bel': 1, 'Kalça': 0.25 }],
  [/dragon flag|\bv-?ups?\b|windshield wiper/, 'Core', { 'Karın': 1 }],
  // Farmer's walk öncelikle kavrama çalışmasıdır; trapez yükü taşır.
  [/farmer|suitcase carry|carry/, 'Core', { 'Önkol': 1, 'Trapez': 0.5, 'Karın': 0.5, 'Bel': 0.25 }],

  // --- BALDIR ---
  [/calf raise|calf press|donkey calf/, 'Legs', { 'Baldır': 1 }],

  // --- KALÇA BASKIN ---
  // Glute Ham Raise adında 'glute' geçse de hamstring baskın bir harekettir;
  // genel glute kuralından önce yakalanmalı.
  [/glute ham raise|\bghr\b/, 'Legs', { 'Hamstring': 1, 'Kalça': 0.5 }],
  [/pull through/, 'Legs', { 'Kalça': 1, 'Hamstring': 0.5 }],
  // Abduksiyon gluteus medius/minimus, adduksiyon adduktor magnus çalıştırır.
  // Ayrı bir adduktor grubu yok; ikisi de kalça bütçesine yazılır.
  [/hip abduction|abductor machine|hip adduction|adductor machine|clamshell|banded (lateral|side) walk|monster walk/, 'Legs', { 'Kalça': 1 }],
  [/hip thrust|glute bridge|glute kickback|frog pump|glute/, 'Legs', { 'Kalça': 1, 'Hamstring': 0.25 }],

  // --- HAMSTRING BASKIN (genel /curl/ kuralından önce olmalı) ---
  [/nordic|leg curl|hamstring curl/, 'Legs', { 'Hamstring': 1 }],
  [/romanian deadlift|\brdl\b|stiff-?leg/, 'Legs', { 'Hamstring': 1, 'Kalça': 0.5, 'Bel': 0.5, 'Önkol': 0.25 }],
  [/good morning/, 'Legs', { 'Hamstring': 1, 'Bel': 0.5, 'Kalça': 0.25 }],

  // --- DEADLIFT VARYANTLARI ---
  // Sumo'da duruş dik olduğu için kalça/quad payı artar, bel payı azalır.
  [/sumo deadlift/, 'Legs', { 'Kalça': 1, 'Quadriceps': 0.5, 'Hamstring': 0.5, 'Bel': 0.5, 'Trapez': 0.25, 'Önkol': 0.5 }],
  [/trap bar deadlift|hex bar/, 'Legs', { 'Quadriceps': 1, 'Kalça': 0.5, 'Bel': 0.5, 'Trapez': 0.5, 'Önkol': 0.5 }],
  [/rack pull/, 'Legs', { 'Bel': 1, 'Trapez': 0.5, 'Kanat': 0.5, 'Kalça': 0.5, 'Önkol': 0.5 }],
  [/deadlift/, 'Legs', { 'Bel': 1, 'Kalça': 1, 'Hamstring': 0.5, 'Trapez': 0.5, 'Önkol': 0.5, 'Kanat': 0.25 }],

  // --- QUAD BASKIN ---
  [/leg extension/, 'Legs', { 'Quadriceps': 1 }],
  [/hack squat|leg press/, 'Legs', { 'Quadriceps': 1, 'Kalça': 0.5 }],
  [/front squat|zercher/, 'Legs', { 'Quadriceps': 1, 'Kalça': 0.5, 'Bel': 0.5, 'Karın': 0.25 }],
  [/bulgarian|split squat|lunge|step-?up|step[- ]down/, 'Legs', { 'Quadriceps': 1, 'Kalça': 0.5, 'Hamstring': 0.25 }],
  [/squat/, 'Legs', { 'Quadriceps': 1, 'Kalça': 0.5, 'Hamstring': 0.25, 'Bel': 0.25 }],

  // --- OMUZ İZOLASYON (üç baş ayrı) ---
  [/face pull/, 'Pull', { 'Arka Omuz': 1, 'Trapez': 0.5, 'Orta Sırt': 0.25 }],
  // "Reverse Cable Fly" gibi araya kelime giren adlar da yakalanmalı.
  // "Bent Over Lateral Raise" arka deltoiddir; yan omuz kuralından önce gelmeli.
  [/reverse pec|rear delt|reverse \w* ?fly|bent[- ]over (lateral|dumbbell) raise|powell raise/, 'Pull', { 'Arka Omuz': 1, 'Orta Sırt': 0.25 }],
  [/y-?raise/, 'Pull', { 'Arka Omuz': 1, 'Trapez': 0.5 }],
  [/lateral raise|side raise/, 'Push', { 'Yan Omuz': 1 }],
  [/front raise/, 'Push', { 'Ön Omuz': 1 }],
  [/upright row/, 'Pull', { 'Yan Omuz': 1, 'Trapez': 0.5, 'Biseps': 0.25 }],
  [/shrug/, 'Pull', { 'Trapez': 1 }],

  // --- OMUZ BİLEŞKE ---
  // Dikey baslarda yük ön deltoiddedir; yan baş yalnızca kısmi katkı alır.
  [/landmine press/, 'Push', { 'Ön Omuz': 1, 'Göğüs': 0.5, 'Triseps': 0.5 }],
  // Cuban press dış rotasyon + bas birleşimi; rotator manşet ve arka baş
  // baskın. Genel /press/ yakalayıcısına düşerse göğüs sanılırdı.
  [/cuban press/, 'Push', { 'Arka Omuz': 1, 'Yan Omuz': 0.5, 'Ön Omuz': 0.5, 'Trapez': 0.25 }],
  // Ense arkası baste omuz dış rotasyonda olduğu için yan baş payı belirgin artar.
  [/behind the neck press|bradford press/, 'Push', { 'Ön Omuz': 1, 'Yan Omuz': 0.5, 'Triseps': 0.5, 'Trapez': 0.25 }],
  [/overhead press|\bohp\b|shoulder press|arnold press|military press|push press|\bz press\b|viking press/, 'Push', { 'Ön Omuz': 1, 'Triseps': 0.5, 'Yan Omuz': 0.25, 'Trapez': 0.25 }],

  // --- KOL ---
  // Close grip bench triceps baskındır; göğüs kuralından önce yakalanmalı.
  [/close grip bench/, 'Push', { 'Triseps': 1, 'Göğüs': 0.5, 'Ön Omuz': 0.25 }],
  [/diamond push/, 'Push', { 'Triseps': 1, 'Göğüs': 0.5 }],
  // "Bench Dip" genel /dips?/ kuralından, "JM Press" genel /press/ kuralından
  // önce yakalanmalı — ikisi de triseps hareketidir.
  [/bench dip|jm press/, 'Push', { 'Triseps': 1, 'Göğüs': 0.25 }],
  // "Lying Leg Curl" yukarıda yakalandığı için buradaki lying...extension güvenli.
  [/tricep|skull crusher|pushdown|kickback|overhead extension|lying \w+ extension|french press|tate press/, 'Push', { 'Triseps': 1 }],
  // Önkol izolasyonu genel /curl/ kuralından önce yakalanmalı.
  // Dikkat: burada çıplak /grip/ KULLANILAMAZ — "Seated Row (Wide Grip)",
  // "Neutral Grip Pulldown" gibi hareketleri önkol sanardı.
  [/wrist curl|reverse wrist|wrist roller|grip trainer|plate pinch|(dead|towel) hang|barbell hold|wrist rotation/, 'Pull', { 'Önkol': 1 }],
  [/reverse curl/, 'Pull', { 'Önkol': 1, 'Biseps': 0.5 }],
  [/hammer/, 'Pull', { 'Biseps': 1, 'Önkol': 0.5 }],
  // Bacak curl'leri yukarıda yakalandığı için buradaki genel /curl/ güvenlidir.
  // Göğüs kurallarından önce gelmesi şart: aksi halde "Incline Dumbbell Curl"
  // eğik bas hareketi sanılıp göğüs sayılırdı.
  [/preacher|bicep|concentration|spider|curl/, 'Pull', { 'Biseps': 1, 'Önkol': 0.25 }],

  // --- SIRT ---
  // Dikey çekiş kanat baskın, yatay çekiş orta sırt baskın.
  [/straight arm pulldown|pullover|lat prayer/, 'Pull', { 'Kanat': 1 }],
  [/pull-?up|chin-?up|lat pulldown|pulldown/, 'Pull', { 'Kanat': 1, 'Biseps': 0.5, 'Orta Sırt': 0.25, 'Önkol': 0.25 }],
  // Serbest ağırlıkla öne eğik çekişlerde bel izometrik olarak belirgin yüklenir.
  [/pendlay|barbell row|t-?bar row|meadows/, 'Pull', { 'Orta Sırt': 1, 'Kanat': 0.5, 'Biseps': 0.5, 'Bel': 0.5, 'Arka Omuz': 0.25, 'Önkol': 0.25 }],
  [/\brow\b/, 'Pull', { 'Orta Sırt': 1, 'Kanat': 0.5, 'Biseps': 0.5, 'Arka Omuz': 0.25, 'Önkol': 0.25 }],

  // --- GÖĞÜS ---
  [/pec deck|\bfly\b|crossover/, 'Push', { 'Göğüs': 1 }],
  [/\bdips?\b/, 'Push', { 'Göğüs': 1, 'Triseps': 0.5, 'Ön Omuz': 0.25 }],
  [/decline.*(press|bench|fly)/, 'Push', { 'Göğüs': 1, 'Triseps': 0.5, 'Ön Omuz': 0.25 }],
  [/incline.*(press|bench|fly)/, 'Push', { 'Göğüs': 1, 'Ön Omuz': 0.5, 'Triseps': 0.5 }],
  // Floor press'te hareket açıklığı kısıtlı, yük triseps üzerine kayar.
  [/floor press/, 'Push', { 'Göğüs': 1, 'Triseps': 0.5, 'Ön Omuz': 0.25 }],
  [/bench press|chest press|push-?up/, 'Push', { 'Göğüs': 1, 'Triseps': 0.5, 'Ön Omuz': 0.5 }],

  // --- GENEL YAKALAYICI (en sonda) ---
  [/press/, 'Push', { 'Göğüs': 1, 'Ön Omuz': 0.5, 'Triseps': 0.5 }],
];

// Yazma daima en yeni sürüme yapılır; okuma eskiye doğru geriye düşer.
// _v16 anahtarları taksonomi göçünden sonra da SİLİNMEZ — geri dönüş yedeğidir.
export const STORAGE_VERSION = '_v17';
export const STORAGE_VERSIONS = ['_v17', '_v16', '_v15', '_v14', '_v13'];

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
// Eski tek 'Sırt' bütçesi (10/18/25) Kanat/Orta Sırt/Trapez'e, 'Omuz' (8/16/22)
// üç deltoid başına bölündü. Bölmeden sonra eski değerler bırakılsaydı herkesin
// panosu bir gecede "kronik düşük hacim" görünürdü.
//
// Ön deltoid ve kalça her basış/çömeliş hareketinden bol dolaylı hacim aldığı
// için MEV'leri düşük; yan ve arka deltoid yüksek hacme iyi yanıt verdiği için
// MRV'leri yüksek.
// Haftalık set hacmi referansları — ORTA SEVİYE temel alınmıştır.
//
//   MEV  (Minimum Effective Volume)  büyümenin başladığı en az hacim
//   MAV  (Maximum Adaptive Volume)   gelişimin en verimli olduğu aralığın üstü
//   MRV  (Maximum Recoverable Volume) toparlanmanın bozulduğu tavan
//
// Değerler hipertrofi literatüründe yaygın kullanılan aralıklara dayanır.
// Dikkat çeken üç nokta:
//  - Ön deltoid ve kalça her basış/çömeliş hareketinden bol dolaylı hacim alır;
//    MEV'leri bu yüzden çok düşüktür, doğrudan çalışmaya çoğu kişide gerek kalmaz.
//  - Yan ve arka deltoid küçük, hızlı toparlanan kaslardır; MRV'leri yüksektir.
//  - Bel (erektörler) her bileşke hareketten yorulur ve yavaş toparlanır;
//    doğrudan hacmi düşük tutmak gerekir.
export const MUSCLE_VOLUME_LANDMARKS = {
  'Göğüs': { mev: 8, mav: 16, mrv: 22 },
  'Kanat': { mev: 10, mav: 18, mrv: 25 },
  'Orta Sırt': { mev: 8, mav: 16, mrv: 22 },
  'Trapez': { mev: 4, mav: 14, mrv: 26 },
  'Ön Omuz': { mev: 2, mav: 10, mrv: 14 },
  'Yan Omuz': { mev: 8, mav: 18, mrv: 26 },
  'Arka Omuz': { mev: 6, mav: 16, mrv: 26 },
  'Biseps': { mev: 8, mav: 16, mrv: 24 },
  'Triseps': { mev: 6, mav: 12, mrv: 18 },
  'Önkol': { mev: 2, mav: 10, mrv: 18 },
  'Quadriceps': { mev: 8, mav: 14, mrv: 20 },
  'Hamstring': { mev: 4, mav: 12, mrv: 18 },
  'Kalça': { mev: 2, mav: 10, mrv: 16 },
  'Baldır': { mev: 8, mav: 14, mrv: 20 },
  'Karın': { mev: 4, mav: 16, mrv: 24 },
  'Bel': { mev: 4, mav: 8, mrv: 10 },
};

// Deneyim seviyesine göre hacim ölçeklemesi.
//
// Acemi bir lifter az hacimle büyür ama iş kapasitesi düşüktür; ileri seviyede
// uyaran eşiği yükselirken toparlanma kapasitesi de artar. Çarpanlar temel
// (orta seviye) tabloya uygulanır.
export const EXPERIENCE_LEVELS = [
  {
    key: 'beginner',
    label: 'Yeni Başlayan',
    hint: '0-1 yıl · Az hacimle hızlı gelişim, iş kapasitesi düşük',
    mev: 0.7, mav: 0.7, mrv: 0.7,
  },
  {
    key: 'intermediate',
    label: 'Orta',
    hint: '1-3 yıl · Referans değerler bu seviyeye göre belirlendi',
    mev: 1, mav: 1, mrv: 1,
  },
  {
    key: 'advanced',
    label: 'İleri',
    hint: '3+ yıl · Uyaran eşiği ve toparlanma kapasitesi yüksek',
    mev: 1.2, mav: 1.2, mrv: 1.25,
  },
];

/**
 * Seçili deneyim seviyesine göre ölçeklenmiş hacim referansları.
 * Tam sayıya yuvarlanır; MEV<MAV<MRV sırası her koşulda korunur.
 */
export const getVolumeLandmarks = (muscle, level = 'intermediate') => {
  const base = MUSCLE_VOLUME_LANDMARKS[muscle];
  if (!base) return { mev: 6, mav: 16, mrv: 22 };

  const scale = EXPERIENCE_LEVELS.find(l => l.key === level) || EXPERIENCE_LEVELS[1];
  const mev = Math.max(1, Math.round(base.mev * scale.mev));
  const mav = Math.max(mev + 1, Math.round(base.mav * scale.mav));
  const mrv = Math.max(mav + 1, Math.round(base.mrv * scale.mrv));
  return { mev, mav, mrv };
};

/**
 * Haftalık hacmin hangi durumda olduğunu söyler.
 *
 * Tek kaynak: ana sayfa listesi, ısı haritası, kas detayı ve haftalık program
 * daha önce aynı dört durumu farklı renklerle gösteriyordu (biri MEV altını
 * cyan, diğeri amber; biri "Yüksek"i cyan, diğeri amber yapıyordu).
 */
export const volumeStatusOf = (volume, muscle, level = 'intermediate') => {
  const { mev, mav, mrv } = getVolumeLandmarks(muscle, level);
  if (!volume) return 'none';
  if (volume < mev) return 'under';
  if (volume <= mav) return 'optimal';
  if (volume <= mrv) return 'high';
  return 'over';
};

/**
 * Durum renkleri. Merdiven tek yönlü okunur:
 * gri(pasif) → amber(eksik) → yeşil(verimli) → turuncu(tavana yakın) → kırmızı(aşım).
 *
 * Cyan bilinçli olarak yok: uygulamanın her yerinde "birincil aksiyon" rengi,
 * durum göstergesinde kullanılınca uyarılar "iyi" gibi okunuyordu.
 */
/**
 * Akut:kronik yük oranının (ACWR) risk sınıfı.
 *
 * `hasEnoughData` yanlışken sınıflandırma yapılmaz: kronik yük geçmişi
 * oluşmadan hesaplanan oran anlamsızdır ve yeni kullanıcıyı boşuna korkutur.
 *
 * 1.3'ten sonra doğrudan kırmızıya geçmek yerine 1.3-1.5 arası ayrı bir
 * "dikkat" bandı var; literatürde de bu aralık yüksek risk değil, izlenmesi
 * gereken bölge olarak geçiyor.
 */
/**
 * ACWR durumu.
 *
 * ACWR GÖRELİ bir ölçüdür: kendi son 28 gününle kıyaslar. Ara verip sonra
 * normal bir haftaya dönen biri, mutlak yükü hâlâ çok düşük olsa bile yüksek
 * oran görür. Bu yüzden yalnızca orana bakıp "Riskli" demek yanıltıcıydı —
 * kullanıcı hiçbir kasta verimli tavanı (MAV) geçmemişken alarm alıyordu.
 *
 * Çözüm: yüksek oran ancak MUTLAK yük de anlamlı seviyedeyse risk sayılır.
 * `nearCeiling`, en az bir kasın MAV'ına ulaşıp ulaşmadığını söyler. Ulaşmamışsa
 * hızlı artış "Yükseliyor" olarak bilgi amaçlı gösterilir; düşük bir tabandan
 * hacmi artırmak zaten olması gereken şeydir, uyarı konusu değildir.
 */
export const acwrStatusOf = (acwr, hasEnoughData, nearCeiling = true) => {
  if (!hasEnoughData) return 'insufficient';
  const value = Number(acwr);
  if (!Number.isFinite(value) || value <= 0) return 'insufficient';
  if (value < 0.8) return 'low';
  if (value <= 1.3) return 'optimal';
  // Oran yükselmiş: mutlak yük tavana yaklaşmadıysa bu bir risk değil, rampa.
  if (!nearCeiling) return 'ramping';
  if (value <= 1.5) return 'caution';
  return 'high';
};

export const ACWR_STATUS = {
  insufficient: { label: 'Yeterli Veri Yok', text: 'text-zinc-500' },
  low: { label: 'Yetersiz', text: 'text-blue-400' },
  optimal: { label: 'İdeal', text: 'text-emerald-500' },
  ramping: { label: 'Yükseliyor', text: 'text-cyan-400' },
  caution: { label: 'Dikkat', text: 'text-amber-400' },
  high: { label: 'Riskli', text: 'text-red-500' },
};

/** Durumun kısa açıklaması — kartın altında tek satır olarak gösterilir. */
export const ACWR_HINT = {
  insufficient: 'İlk kayıttan 21 gün geçince hesaplanır.',
  low: 'Yük son haftalarda düşmüş. Hacmi kademeli artırabilirsin.',
  optimal: 'Yük artışı toparlanma kapasitenle uyumlu.',
  ramping: 'Hacim hızlı artıyor ama mutlak yük hâlâ tavanın altında.',
  caution: 'Artış hızlı ve bazı kaslar verimli tavanda. Bu hafta sabit kal.',
  high: 'Artış hızlı ve hacim tavanda. Set sayısını düşürmeyi düşün.',
};

/** ACWR'ın anlamlı sayılması için ilk kayıttan bu yana geçmesi gereken gün. */
export const ACWR_MIN_DAYS = 21;

export const VOLUME_STATUS = {
  none: { label: 'Çalışılmadı', chip: 'text-zinc-500 border-zinc-800 bg-zinc-950', bar: 'bg-zinc-700', text: 'text-zinc-500', hex: '#27272a' },
  under: { label: 'Koruma altı', chip: 'text-amber-400 border-amber-900/40 bg-amber-950/40', bar: 'bg-amber-500', text: 'text-amber-400', hex: '#fbbf24' },
  optimal: { label: 'Verimli', chip: 'text-emerald-400 border-emerald-900/40 bg-emerald-950/40', bar: 'bg-emerald-500', text: 'text-emerald-400', hex: '#34d399' },
  high: { label: 'Yüksek', chip: 'text-orange-400 border-orange-900/40 bg-orange-950/40', bar: 'bg-orange-500', text: 'text-orange-400', hex: '#f97316' },
  over: { label: 'Tavan üstü', chip: 'text-red-400 border-red-900/40 bg-red-950/40', bar: 'bg-red-500', text: 'text-red-400', hex: '#ef4444' },
};
