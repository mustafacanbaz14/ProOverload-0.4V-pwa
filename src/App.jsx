import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Save, Activity, TrendingUp, X, ChevronRight, Search, User, Scale, Ruler, Trash2, AlertCircle, Target, Zap, Database, Flame, Beef, Droplets, Wheat, Copy, History, Settings, Star, Pencil, BookmarkPlus, Timer, Download, Upload, LineChart, BrainCircuit, Info, Play, Pause, BarChart } from 'lucide-react';

// --- BİLİMSEL SABİTLER VE YARDIMCI FONKSİYONLAR ---
const FORM_RATINGS = Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: `${i + 1}/10` }));

const DEFAULT_EXERCISES = [
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

const generateId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

const getLocalDateString = (date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

const getMondayOfCurrentWeek = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const detectMuscleGroup = (name, customList = []) => {
  const customEx = customList.find(ex => (typeof ex === 'object' ? ex.name === name : ex === name));
  if (customEx && typeof customEx === 'object' && customEx.muscle) {
    return { muscle: customEx.muscle, mechanics: customEx.mechanics || 'Diğer' };
  }

  const lower = name.toLowerCase();
  let muscle = 'Diğer';
  let mechanics = 'Diğer';

  if (/bench|press|push|dips|fly|crossover|extension|kickback/.test(lower)) mechanics = 'Push';
  if (/pull|row|chin|curl|shrug/.test(lower)) mechanics = 'Pull';
  if (/squat|leg|deadlift|thrust|calf|lunge|morning/.test(lower)) mechanics = 'Legs';
  if (/crunch|core|plank|twist|raise/.test(lower) && !lower.includes('lateral') && !lower.includes('calf')) mechanics = 'Core';

  if (/bench|fly|pec|crossover|dips|push-up/.test(lower)) muscle = 'Göğüs';
  else if (/pull-up|chin-up|row|lat |pulldown|shrug/.test(lower)) muscle = 'Sırt';
  else if (/squat|leg|deadlift|thrust|calf|lunge|morning/.test(lower)) muscle = 'Bacak';
  else if (/overhead|shoulder|lateral|face pull|press|upright/.test(lower) && !lower.includes('bench') && !lower.includes('leg')) muscle = 'Omuz';
  else if (/curl|tricep|crusher|pushdown|extension|kickback/.test(lower) && !lower.includes('leg')) muscle = 'Kol';
  else if (/crunch|ab |core|raise|plank|twist|farmer/.test(lower) && !lower.includes('calf') && !lower.includes('lateral')) muscle = 'Merkez';

  return { muscle, mechanics };
};

const parseNumber = (val) => {
  if (val === '' || val === null || val === undefined) return 0;
  const normalized = String(val).replace(',', '.');
  const num = Number(normalized);
  return isNaN(num) ? 0 : num;
};

const mergeMetrics = (data) => ({
  id: data?.id || generateId(),
  date: data?.date || getLocalDateString(),
  gender: data?.gender || 'male', age: data?.age || 25, height: data?.height || 175, weight: data?.weight || 75,
  method: data?.method || '3', bodyFat: data?.bodyFat || '',
  fatPreference: data?.fatPreference || 'manual',
  measurements: {
    neck: data?.measurements?.neck || '', shoulder: data?.measurements?.shoulder || '', chest: data?.measurements?.chest || '',
    arm: data?.measurements?.arm || '', waist: data?.measurements?.waist || '', hip: data?.measurements?.hip || '',
    thigh: data?.measurements?.thigh || '', calf: data?.measurements?.calf || '', wrist: data?.measurements?.wrist || ''
  },
  skinfolds: {
    chest: data?.skinfolds?.chest || '', abdomen: data?.skinfolds?.abdomen || '', thigh: data?.skinfolds?.thigh || '',
    triceps: data?.skinfolds?.triceps || '', suprailiac: data?.skinfolds?.suprailiac || '', axilla: data?.skinfolds?.axilla || '',
    subscapular: data?.skinfolds?.subscapular || ''
  }
});

const mergeNutrition = (data) => ({
  id: data?.id || generateId(),
  date: data?.date || getLocalDateString(),
  dayType: data?.dayType || 'training',
  activeCaloriesOut: data?.activeCaloriesOut || '', bmrAtTheTime: data?.bmrAtTheTime || 0,
  caloriesIn: data?.caloriesIn || 0, protein: data?.protein || 0, carbs: data?.carbs || 0, fats: data?.fats || 0,
  meals: Array.isArray(data?.meals) && data.meals.length > 0 ? data.meals : [{ id: generateId(), name: '1. Öğün', calories: '', protein: '', carbs: '', fats: '' }]
});

const loadWithFallback = (keys, defaultVal, parser = (d) => d) => {
  for (let key of keys) {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      if (data !== null && data !== undefined) return parser(data);
    } catch (e) { }
  }
  return defaultVal;
};

const calcTonnage = (exercises) => {
  if (!Array.isArray(exercises)) return 0;
  return exercises.reduce((acc, ex) => acc + (ex.sets || []).reduce((sAcc, s) => sAcc + (parseNumber(s.weight) * parseNumber(s.reps)), 0), 0);
};

// Bağımsız Canlı Süre Bileşeni
const WorkoutTimer = ({ timer, isEditing, initialDuration }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (isEditing || !timer) return;

    const calcElapsed = () => {
      let total = timer.accumulatedSeconds || 0;
      if (timer.status === 'running' && timer.startTime) {
        total += Math.floor((Date.now() - timer.startTime) / 1000);
      }
      return total;
    };

    setElapsed(calcElapsed());

    if (timer.status === 'running') {
      const interval = setInterval(() => {
        setElapsed(calcElapsed());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer, isEditing]);

  if (isEditing) return <span className="font-mono">{initialDuration || 0} dk (Geçmiş)</span>;

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
  const s = (elapsed % 60).toString().padStart(2, '0');
  return <span className={`font-mono font-bold ${timer?.status === 'running' ? 'text-emerald-400' : 'text-zinc-500'}`}>{h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`}</span>;
};

export default function App() {
  // --- STATE YÖNETİMİ ---
  const [workouts, setWorkouts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [activeWorkout, setActiveWorkout] = useState(null);

  const [preWorkoutModal, setPreWorkoutModal] = useState(null);
  const [isEndWorkoutModalOpen, setIsEndWorkoutModalOpen] = useState(false);
  const [readinessForm, setReadinessForm] = useState({ sleep: 3, stress: 3, soreness: 3 });

  const [view, setView] = useState('home');
  const [historyTab, setHistoryTab] = useState('workouts');
  const [profileTab, setProfileTab] = useState('metrics');
  const [analysisType, setAnalysisType] = useState('1rm'); // '1rm' or 'volume'

  const [customExercises, setCustomExercises] = useState([]);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');

  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newCustomExercise, setNewCustomExercise] = useState('');
  const [newExMuscle, setNewExMuscle] = useState('Göğüs');
  const [newExMechanics, setNewExMechanics] = useState('Push');

  const [settings, setSettings] = useState({ autoCopyLastSet: true, nutritionGoal: 'bulk', proteinPerFfmBulk: 2.2, proteinPerFfmCut: 2.6 });

  const [metricsHistory, setMetricsHistory] = useState([]);
  const [currentMetricsForm, setCurrentMetricsForm] = useState(() => mergeMetrics({}));

  const [nutritionHistory, setNutritionHistory] = useState([]);
  const [mealTemplates, setMealTemplates] = useState([]);
  const [dayTemplates, setDayTemplates] = useState([]);
  const [currentNutritionForm, setCurrentNutritionForm] = useState(() => mergeNutrition({}));

  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: null, id: null });
  const [restTimer, setRestTimer] = useState(0);
  const [analysisExercise, setAnalysisExercise] = useState('');

  const [lastBackupDate, setLastBackupDate] = useState(null);
  const [isStoragePersisted, setIsStoragePersisted] = useState(false);
  const [isMeasurementGuideOpen, setIsMeasurementGuideOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const fileInputRef = useRef(null);
  const activeWorkoutRef = useRef(activeWorkout);
  const currentMetricsFormRef = useRef(currentMetricsForm);

  // Optimizasyon: State referanslarını interval için senkronize et
  useEffect(() => {
    activeWorkoutRef.current = activeWorkout;
    currentMetricsFormRef.current = currentMetricsForm;
  }, [activeWorkout, currentMetricsForm]);

  // --- INIT & PERSISTENCE ---
  const vKeys = ['_v16', '_v15', '_v14', '_v13'];

  useEffect(() => {
    // PWA (Standalone) Kontrolü
    const checkStandalone = () => {
      return (window.matchMedia('(display-mode: standalone)').matches) || (window.navigator.standalone) || document.referrer.includes('android-app://');
    };
    setIsStandalone(checkStandalone());

    const requestPersistentStorage = async () => {
      if (navigator.storage && navigator.storage.persist) {
        try {
          let isPersisted = await navigator.storage.persisted();
          if (!isPersisted) {
            isPersisted = await navigator.storage.persist();
          }
          setIsStoragePersisted(isPersisted);
        } catch (error) {
          setIsStoragePersisted(false);
        }
      }
    };
    requestPersistentStorage();

    setLastBackupDate(localStorage.getItem('po_last_backup'));

    setWorkouts(loadWithFallback(vKeys.map(k => `po_workouts${k}`), []));
    setTemplates(loadWithFallback(vKeys.map(k => `po_templates${k}`), []));
    setCustomExercises(loadWithFallback(vKeys.map(k => `po_custom_exercises${k}`), []));

    const savedSettings = loadWithFallback(vKeys.map(k => `po_settings${k}`), {});
    setSettings({
      autoCopyLastSet: savedSettings.autoCopyLastSet ?? true,
      nutritionGoal: savedSettings.nutritionGoal || 'bulk',
      proteinPerFfmBulk: savedSettings.proteinPerFfmBulk || 2.2,
      proteinPerFfmCut: savedSettings.proteinPerFfmCut || 2.6
    });

    setMealTemplates(loadWithFallback(vKeys.map(k => `po_meal_templates${k}`), []));
    setDayTemplates(loadWithFallback(vKeys.map(k => `po_day_templates${k}`), []));
    setActiveWorkout(loadWithFallback(vKeys.map(k => `po_active_workout${k}`), null));

    const loadedMetrics = loadWithFallback(vKeys.map(k => `po_metrics${k}`), []);
    if (Array.isArray(loadedMetrics) && loadedMetrics.length > 0) {
      const parsedMetrics = loadedMetrics.map(mergeMetrics);
      setMetricsHistory(parsedMetrics);
      const todayStr = getLocalDateString();
      const todayData = parsedMetrics.find(m => m.date === todayStr);
      if (todayData) setCurrentMetricsForm(mergeMetrics(todayData));
      else setCurrentMetricsForm(mergeMetrics({ ...parsedMetrics[0], id: generateId(), date: todayStr }));
    }

    const loadedNutri = loadWithFallback(vKeys.map(k => `po_nutrition${k}`), []);
    if (Array.isArray(loadedNutri)) {
      const parsedNutri = loadedNutri.map(mergeNutrition);
      setNutritionHistory(parsedNutri);
      const todayStr = getLocalDateString();
      const todayData = parsedNutri.find(n => n.date === todayStr);
      if (todayData) setCurrentNutritionForm(mergeNutrition(todayData));
      else setCurrentNutritionForm(mergeNutrition({ date: todayStr }));
    }
  }, []);

  useEffect(() => { localStorage.setItem('po_workouts_v16', JSON.stringify(workouts)); }, [workouts]);
  useEffect(() => { localStorage.setItem('po_templates_v16', JSON.stringify(templates)); }, [templates]);
  useEffect(() => { localStorage.setItem('po_custom_exercises_v16', JSON.stringify(customExercises)); }, [customExercises]);
  useEffect(() => { localStorage.setItem('po_metrics_v16', JSON.stringify(metricsHistory)); }, [metricsHistory]);
  useEffect(() => { localStorage.setItem('po_nutrition_v16', JSON.stringify(nutritionHistory)); }, [nutritionHistory]);
  useEffect(() => { localStorage.setItem('po_settings_v16', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('po_meal_templates_v16', JSON.stringify(mealTemplates)); }, [mealTemplates]);
  useEffect(() => { localStorage.setItem('po_day_templates_v16', JSON.stringify(dayTemplates)); }, [dayTemplates]);

  // Optimizasyon: Diske yazma I/O bloklamasını önlemek için 500ms Debounce.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('po_active_workout_v16', JSON.stringify(activeWorkout));
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [activeWorkout]);

  useEffect(() => {
    let interval;
    if (restTimer > 0) interval = setInterval(() => setRestTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [restTimer]);

  // Optimizasyon: Hareketsizlik Kontrolü (Memory Leak ve Re-render döngüsü giderildi)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentAw = activeWorkoutRef.current;
      if (!currentAw || currentAw.isEditingOld) return;

      if (Date.now() - currentAw.lastInteraction > 15 * 60 * 1000) {
        // 15 dakika hareketsizlik varsa otomatik bitir veya iptal et
        const cleanedExercises = currentAw.exercises.map(ex => ({
          ...ex,
          sets: (ex.sets || []).filter(s => parseNumber(s.weight) > 0 || parseNumber(s.reps) > 0)
        })).filter(ex => ex.sets.length > 0);

        if (cleanedExercises.length === 0) {
          setActiveWorkout(null);
          setView('home');
        } else {
          let durationMinutes = 0;
          if (currentAw.timer) {
            let totalSecs = currentAw.timer.accumulatedSeconds || 0;
            if (currentAw.timer.status === 'running') {
              totalSecs += Math.floor((Date.now() - currentAw.timer.startTime) / 1000);
            }
            durationMinutes = Math.round(totalSecs / 60);
          }

          const finalizedWorkout = { ...currentAw, duration: durationMinutes, exercises: cleanedExercises };
          delete finalizedWorkout.isEditingOld;
          delete finalizedWorkout.timer;
          delete finalizedWorkout.lastInteraction;

          // Kalori Senkronizasyonu (Oto)
          const userWeight = parseNumber(currentMetricsFormRef.current.weight) || 75;
          const burnedCals = Math.round(durationMinutes * userWeight * 0.08);

          if (burnedCals > 0) {
            setCurrentNutritionForm(prev => {
              if (prev.date === getLocalDateString()) {
                return { ...prev, dayType: 'training', activeCaloriesOut: String(parseNumber(prev.activeCaloriesOut) + burnedCals) };
              }
              return prev;
            });
            setNutritionHistory(prev => prev.map(n => n.date === getLocalDateString() ? { ...n, dayType: 'training', activeCaloriesOut: String(parseNumber(n.activeCaloriesOut) + burnedCals) } : n));
          }

          setWorkouts(prev => {
            const existingIndex = prev.findIndex(w => w.id === finalizedWorkout.id);
            let newWorkouts = [...prev];
            if (existingIndex >= 0) newWorkouts[existingIndex] = finalizedWorkout;
            else newWorkouts.push(finalizedWorkout);
            return newWorkouts.sort((a, b) => new Date(b.date) - new Date(a.date));
          });
          setActiveWorkout(null);
          setIsEndWorkoutModalOpen(false);
          setView('home');
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []); // Boş bağımlılık dizisi sayesinde sadece bir kez mount edilir.

  // --- MEMOIZED ANALİZLER ---
  const composition = useMemo(() => {
    const age = parseNumber(currentMetricsForm.age);
    const heightCm = parseNumber(currentMetricsForm.height);
    const weightKg = parseNumber(currentMetricsForm.weight);
    const gender = currentMetricsForm.gender;
    const method = currentMetricsForm.method;

    const { neck, waist, hip, wrist } = currentMetricsForm.measurements || {};
    const sf = currentMetricsForm.skinfolds || {};

    const nNeck = parseNumber(neck); const nWaist = parseNumber(waist); const nHip = parseNumber(hip); const nWrist = parseNumber(wrist);

    let sumSkinfolds = 0; let isValidSkinfold = false;

    if (method === '7') {
      const vals = [sf.chest, sf.axilla, sf.triceps, sf.subscapular, sf.abdomen, sf.suprailiac, sf.thigh].map(parseNumber);
      if (vals.every(v => v > 0)) { sumSkinfolds = vals.reduce((a, b) => a + b, 0); isValidSkinfold = true; }
    } else {
      if (gender === 'male') {
        const vals = [sf.chest, sf.abdomen, sf.thigh].map(parseNumber);
        if (vals.every(v => v > 0)) { sumSkinfolds = vals.reduce((a, b) => a + b, 0); isValidSkinfold = true; }
      } else {
        const vals = [sf.triceps, sf.suprailiac, sf.thigh].map(parseNumber);
        if (vals.every(v => v > 0)) { sumSkinfolds = vals.reduce((a, b) => a + b, 0); isValidSkinfold = true; }
      }
    }

    let density = 0;
    if (isValidSkinfold && age > 0) {
      if (method === '7') {
        density = gender === 'male'
          ? 1.112 - (0.00043499 * sumSkinfolds) + (0.00000055 * Math.pow(sumSkinfolds, 2)) - (0.00028826 * age)
          : 1.097 - (0.00046971 * sumSkinfolds) + (0.00000056 * Math.pow(sumSkinfolds, 2)) - (0.00012828 * age);
      } else {
        density = gender === 'male'
          ? 1.10938 - (0.0008267 * sumSkinfolds) + (0.0000016 * Math.pow(sumSkinfolds, 2)) - (0.0002574 * age)
          : 1.0994921 - (0.0009929 * sumSkinfolds) + (0.0000023 * Math.pow(sumSkinfolds, 2)) - (0.0001392 * age);
      }
    }

    let siriBF = 0;
    if (density > 0) { siriBF = Math.max(3.0, Math.min((4.95 / density - 4.50) * 100, 60.0)); }

    let navyBF = 0;
    if (heightCm > 0 && nWaist > 0 && nNeck > 0) {
      if (gender === 'male' && nWaist > nNeck) {
        const denom = 1.0324 - 0.19077 * Math.log10(nWaist - nNeck) + 0.15456 * Math.log10(heightCm);
        if (denom !== 0) navyBF = Math.max(3.0, Math.min(495 / denom - 450, 60.0));
      } else if (gender === 'female' && (nWaist + nHip > nNeck)) {
        const denom = 1.29579 - 0.35004 * Math.log10(nWaist + nHip - nNeck) + 0.22100 * Math.log10(heightCm);
        if (denom !== 0) navyBF = Math.max(3.0, Math.min(495 / denom - 450, 60.0));
      }
    }

    let averageBF = 0;
    if (siriBF > 0 && navyBF > 0) averageBF = (siriBF + navyBF) / 2;

    let activeBF = parseNumber(currentMetricsForm.bodyFat) || 15.0;
    const pref = currentMetricsForm.fatPreference;
    if (pref === 'skinfold' && siriBF > 0) activeBF = siriBF;
    else if (pref === 'navy' && navyBF > 0) activeBF = navyBF;
    else if (pref === 'average' && averageBF > 0) activeBF = averageBF;
    else if (pref === 'manual' && parseNumber(currentMetricsForm.bodyFat) > 0) activeBF = parseNumber(currentMetricsForm.bodyFat);
    else activeBF = siriBF > 0 ? siriBF : (navyBF > 0 ? navyBF : (parseNumber(currentMetricsForm.bodyFat) || 15.0));

    const fatMass = weightKg * (activeBF / 100);
    const leanMass = weightKg - fatMass;
    const heightM = heightCm / 100;
    const ffmi = heightM > 0 ? leanMass / Math.pow(heightM, 2) : 0;
    const bmr = leanMass > 0 ? Math.round(370 + (21.6 * leanMass)) : 0;

    let whtr = 0; if (heightCm > 0) whtr = nWaist / heightCm;
    let frameSize = "-";
    if (heightCm > 0 && nWrist > 0) {
      const rValue = heightCm / nWrist;
      if (gender === 'male') frameSize = (rValue > 10.4) ? "İnce" : (rValue < 9.6) ? "Kalın" : "Orta";
      else frameSize = (rValue > 11.0) ? "İnce" : (rValue < 10.1) ? "Kalın" : "Orta";
    }

    let maxPotentialFFMI = 0;
    if (gender === 'male') {
      if (frameSize === 'İnce') maxPotentialFFMI = 24.0;
      else if (frameSize === 'Orta') maxPotentialFFMI = 25.5;
      else if (frameSize === 'Kalın') maxPotentialFFMI = 27.0;
    } else {
      if (frameSize === 'İnce') maxPotentialFFMI = 20.0;
      else if (frameSize === 'Orta') maxPotentialFFMI = 21.5;
      else if (frameSize === 'Kalın') maxPotentialFFMI = 23.0;
    }

    const potentialAchieved = maxPotentialFFMI > 0 && ffmi > 0 ? Math.min((ffmi / maxPotentialFFMI) * 100, 100) : 0;

    let maxNaturalWeight = 0;
    if (heightM > 0 && activeBF < 100 && maxPotentialFFMI > 0) {
      const maxFFM = maxPotentialFFMI * Math.pow(heightM, 2);
      maxNaturalWeight = maxFFM / (1 - (activeBF / 100));
    }

    let trainingAdvice = "";
    let nutritionAdvice = "";

    if (potentialAchieved === 0) {
      trainingAdvice = "Yeterli veri yok.";
      nutritionAdvice = "Yeterli veri yok.";
    } else if (potentialAchieved < 80) {
      trainingAdvice = "Doğal sınırın oldukça altındasınız (Acemi/Orta). Ana bileşke egzersizlerde lineer progresyon (sürekli ağırlık/tekrar artışı) yapabilirsiniz. Antrenman hacmi tolere edilebilir seviyededir.";
      nutritionAdvice = "Kas inşası için kalori fazlası (surplus) elzemdir. Günlük +300-500 kcal ekleyerek büyümeyi hızlandırabilirsiniz, yağlanma riski görece daha düşüktür.";
    } else if (potentialAchieved < 92) {
      trainingAdvice = "Genetik sınırlarınıza yaklaşıyorsunuz (İleri Seviye). Gelişim ivmesi düşmüştür. Sürekli ağırlık artırmak yerine hacim/yoğunluk periyotlaması (periodization) ve deload stratejileri uygulanmalıdır.";
      nutritionAdvice = "Agresif kalori fazlası artık çoğunlukla yağ olarak depolanır. Yavaş ve temiz büyüme (lean bulk) için kalori fazlası +150-250 kcal ile sınırlandırılmalıdır.";
    } else {
      trainingAdvice = "Doğal hipertrofi limitlerinizdesiniz (Elit Seviye). Kas eklemek mekanik olarak çok zordur. Zayıf kas gruplarına spesifik izolasyon ve çok yüksek teknik uzmanlık gerekir.";
      nutritionAdvice = "Fazla kalori alımı direkt yağlanmaya yol açar. Vücut kompozisyonunu koruma (maintenance) veya çok küçük kalori dalgalanmaları (recomp) ile form korunmalıdır.";
    }

    return {
      siriBF: siriBF > 0 ? siriBF.toFixed(2) : "-",
      navyBF: navyBF > 0 ? navyBF.toFixed(2) : "-",
      averageBF: averageBF > 0 ? averageBF.toFixed(2) : "-",
      activeBF,
      ffm: leanMass.toFixed(1), fm: fatMass.toFixed(1), ffmi: ffmi.toFixed(1), bmr,
      whtr: whtr > 0 ? whtr.toFixed(2) : "-", frameSize, maxNaturalWeight: maxNaturalWeight > 0 ? maxNaturalWeight.toFixed(1) : "-",
      maxPotentialFFMI: maxPotentialFFMI > 0 ? maxPotentialFFMI.toFixed(1) : "-",
      potentialAchieved: potentialAchieved.toFixed(1),
      trainingAdvice, nutritionAdvice
    };
  }, [currentMetricsForm]);

  const performedExercises = useMemo(() => {
    const exerciseSet = new Set();
    workouts.forEach(w => {
      (w.exercises || []).forEach(ex => {
        if (Array.isArray(ex.sets) && ex.sets.length > 0) exerciseSet.add(ex.name);
      });
    });
    return Array.from(exerciseSet).sort();
  }, [workouts]);

  useEffect(() => {
    if (performedExercises.length > 0 && (!analysisExercise || !performedExercises.includes(analysisExercise))) {
      setAnalysisExercise(performedExercises[0]);
    }
  }, [performedExercises, analysisExercise]);

  const dashboardStats = useMemo(() => {
    const monday = getLocalDateString(getMondayOfCurrentWeek());
    const thisWeek = workouts.filter(w => w.date >= monday);

    let thisWeekEffSets = 0;
    const volume = { 'Göğüs': 0, 'Sırt': 0, 'Bacak': 0, 'Omuz': 0, 'Kol': 0, 'Merkez': 0 };
    let pushSets = 0; let pullSets = 0;

    thisWeek.forEach(w => {
      (w.exercises || []).forEach(ex => {
        const { muscle, mechanics } = detectMuscleGroup(ex.name, customExercises);
        const effSets = (ex.sets || []).filter(s => parseNumber(s.rir) <= 3 && parseNumber(s.reps) > 0).length;
        thisWeekEffSets += effSets;
        if (volume[muscle] !== undefined) volume[muscle] += effSets;
        if (mechanics === 'Push') pushSets += effSets;
        if (mechanics === 'Pull') pullSets += effSets;
      });
    });

    const pushPullRatio = pullSets > 0 ? (pushSets / pullSets).toFixed(2) : pushSets;

    const today = new Date(); today.setHours(0, 0, 0, 0);
    let acuteLoad = 0; let chronicLoad = 0;
    workouts.forEach(w => {
      const wDate = new Date(w.date); wDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil(Math.abs(today - wDate) / (1000 * 60 * 60 * 24));
      const fatigueMultiplier = w.readiness?.score ? (15 / Math.max(w.readiness.score, 1)) : 1;
      const sRPE = (w.rating || 3) * fatigueMultiplier * (w.exercises || []).reduce((acc, ex) => acc + (ex.sets || []).filter(s => parseNumber(s.rir) <= 3 && parseNumber(s.reps) > 0).length, 0);

      if (diffDays <= 7) acuteLoad += sRPE;
      if (diffDays <= 28) chronicLoad += sRPE;
    });

    const averageChronic = chronicLoad / 4;
    const acwr = averageChronic === 0 ? 0 : (acuteLoad / averageChronic).toFixed(2);
    const isDeloadNeeded = acwr > 1.4 && workouts.length > 10;

    return {
      thisWeekSessions: thisWeek.length, thisWeekEffectiveSets: thisWeekEffSets,
      acwr: Number(acwr), muscleVolume: volume, pushPullRatio, isDeloadNeeded
    };
  }, [workouts, customExercises]);

  const weeklyVolumeData = useMemo(() => {
    const weeks = {};
    workouts.forEach(w => {
      const d = new Date(w.date);
      const monday = new Date(d);
      const day = monday.getDay();
      const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
      monday.setDate(diff);
      const key = monday.toISOString().split('T')[0];

      if (!weeks[key]) weeks[key] = { label: monday.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }), tonnage: 0, date: monday };
      weeks[key].tonnage += calcTonnage(w.exercises);
    });
    return Object.values(weeks).sort((a, b) => a.date - b.date).slice(-12);
  }, [workouts]);

  const needsBackup = useMemo(() => {
    if (workouts.length === 0 && metricsHistory.length === 0) return false;
    if (!lastBackupDate) return workouts.length >= 3;
    const daysSinceBackup = (new Date() - new Date(lastBackupDate)) / (1000 * 60 * 60 * 24);
    return daysSinceBackup > 7;
  }, [lastBackupDate, workouts, metricsHistory]);

  // --- ANTRENMAN MANTIĞI ---
  const updateInteraction = () => {
    if (activeWorkout && !activeWorkout.isEditingOld) {
      setActiveWorkout(p => ({ ...p, lastInteraction: Date.now() }));
    }
  };

  const handleStartRequest = (sourceData = null) => {
    setPreWorkoutModal({ sourceData });
    setReadinessForm({ sleep: 3, stress: 3, soreness: 3 });
  };

  const confirmStartWorkout = () => {
    const { sleep, stress, soreness } = readinessForm;
    const score = sleep + (6 - stress) + (6 - soreness);

    let newExercises = [];
    if (preWorkoutModal.sourceData && Array.isArray(preWorkoutModal.sourceData.exercises)) {
      newExercises = preWorkoutModal.sourceData.exercises.map(ex => ({
        id: generateId(), name: ex.name,
        sets: Array.isArray(ex.sets) ? ex.sets.map(s => ({
          id: generateId(), weight: s.weight || '', reps: s.reps || '', rir: s.rir || 2, tempo: s.tempo || '', formRating: s.formRating || 8
        })) : []
      }));
    }

    setActiveWorkout({
      id: generateId(),
      date: getLocalDateString(),
      timer: {
        status: 'running',
        startTime: Date.now(),
        accumulatedSeconds: 0
      },
      lastInteraction: Date.now(),
      notes: '',
      rating: 0,
      readiness: { sleep, stress, soreness, score },
      exercises: newExercises
    });
    setPreWorkoutModal(null);
    setView('active');
  };

  const toggleWorkoutTimer = () => {
    updateInteraction();
    setActiveWorkout(prev => {
      if (prev.timer.status === 'running') {
        const elapsedSinceStart = Math.floor((Date.now() - prev.timer.startTime) / 1000);
        return {
          ...prev,
          timer: { status: 'paused', startTime: null, accumulatedSeconds: prev.timer.accumulatedSeconds + elapsedSinceStart }
        };
      } else {
        return {
          ...prev,
          timer: { status: 'running', startTime: Date.now(), accumulatedSeconds: prev.timer.accumulatedSeconds }
        };
      }
    });
  };

  const editWorkout = (workout) => {
    setActiveWorkout(JSON.parse(JSON.stringify({ ...workout, isEditingOld: true })));
    setView('active');
  };

  const handleEndWorkoutRequest = () => {
    if (!activeWorkout) return;
    const hasSets = (activeWorkout.exercises || []).some(ex => (ex.sets || []).some(s => parseNumber(s.weight) > 0 || parseNumber(s.reps) > 0));

    // Eğer hiçbir set girilmediyse idmanı kaydetmeden direkt çöp kutusuna at
    if (!hasSets) {
      setActiveWorkout(null);
      setView('home');
      return;
    }

    if (!activeWorkout.isEditingOld) {
      let durationMinutes = 0;
      if (activeWorkout.timer) {
        let totalSecs = activeWorkout.timer.accumulatedSeconds || 0;
        if (activeWorkout.timer.status === 'running') {
          totalSecs += Math.floor((Date.now() - activeWorkout.timer.startTime) / 1000);
        }
        durationMinutes = Math.round(totalSecs / 60);
      }
      setActiveWorkout(prev => ({ ...prev, duration: durationMinutes }));
    }
    setIsEndWorkoutModalOpen(true);
  };

  const confirmSaveWorkout = () => {
    if (!activeWorkout || !Array.isArray(activeWorkout.exercises)) return;

    const cleanedExercises = activeWorkout.exercises.map(ex => ({
      ...ex,
      sets: (ex.sets || []).filter(s => parseNumber(s.weight) > 0 || parseNumber(s.reps) > 0).map(s => ({
        ...s, weight: String(s.weight).replace(',', '.'), reps: String(s.reps).replace(',', '.'), rir: String(s.rir).replace(',', '.'), tempo: s.tempo || ''
      }))
    })).filter(ex => ex.sets.length > 0);

    let durationMinutes = activeWorkout.duration || 0;

    const finalizedWorkout = { ...activeWorkout, duration: durationMinutes, exercises: cleanedExercises };
    delete finalizedWorkout.isEditingOld;
    delete finalizedWorkout.timer;
    delete finalizedWorkout.lastInteraction;

    // Kalori Senkronizasyonu
    const userWeight = parseNumber(currentMetricsForm.weight) || 75;
    const burnedCals = Math.round(durationMinutes * userWeight * 0.08); // Ortalama 4.8 METs Ağırlık Antrenmanı

    if (burnedCals > 0) {
      setCurrentNutritionForm(prev => {
        if (prev.date === getLocalDateString()) {
          return { ...prev, dayType: 'training', activeCaloriesOut: String(parseNumber(prev.activeCaloriesOut) + burnedCals) };
        }
        return prev;
      });
      setNutritionHistory(prev => prev.map(n => n.date === getLocalDateString() ? { ...n, dayType: 'training', activeCaloriesOut: String(parseNumber(n.activeCaloriesOut) + burnedCals) } : n));
    }

    const existingIndex = workouts.findIndex(w => w.id === activeWorkout.id);

    if (existingIndex >= 0) {
      const updatedWorkouts = [...workouts];
      updatedWorkouts[existingIndex] = finalizedWorkout;
      updatedWorkouts.sort((a, b) => new Date(b.date) - new Date(a.date));
      setWorkouts(updatedWorkouts);
    } else {
      setWorkouts([finalizedWorkout, ...workouts].sort((a, b) => new Date(b.date) - new Date(a.date)));
    }

    setActiveWorkout(null);
    setIsEndWorkoutModalOpen(false);
    setView('home');
  };

  const saveAsTemplate = (workout) => {
    const mainEx = workout.exercises[0]?.name || 'Antrenman';
    const exCount = Math.max(0, workout.exercises.length - 1);
    const name = `Şablon: ${mainEx} ${exCount > 0 ? `(+${exCount})` : ''}`;

    const templateExercises = Array.isArray(workout.exercises) ? workout.exercises.map(ex => ({ name: ex.name, sets: [{ weight: '', reps: '', rir: 2, tempo: '', formRating: 8 }] })) : [];
    setTemplates([...templates, { id: generateId(), name, exercises: templateExercises }]);
  };

  const getPreviousPerformance = (exerciseName) => {
    for (let w of workouts) {
      if (!Array.isArray(w.exercises)) continue;
      if (activeWorkout && w.id === activeWorkout.id) continue;
      const ex = w.exercises.find(e => e.name === exerciseName);
      if (ex && Array.isArray(ex.sets) && ex.sets.length > 0) {
        return ex.sets.reduce((prev, current) => ((parseNumber(prev.weight) * parseNumber(prev.reps)) > (parseNumber(current.weight) * parseNumber(current.reps)) ? prev : current));
      }
    }
    return null;
  };

  const getRecentExerciseData = (exerciseName) => {
    for (let w of workouts) {
      if (activeWorkout && w.id === activeWorkout.id) continue;
      const ex = (w.exercises || []).find(e => e.name === exerciseName);
      if (ex && Array.isArray(ex.sets) && ex.sets.length > 0) {
        return { date: w.date, sets: ex.sets };
      }
    }
    return null;
  };

  const calcEstimated1RM = (weight, reps, rir) => {
    const w = parseNumber(weight);
    const r = parseNumber(reps);
    const reserve = parseNumber(rir);
    if (w > 0 && r > 0) {
      return Math.round(w * (1 + (r + reserve) / 30)); // Epley
    }
    return 0;
  };

  const allExercisesNames = [...new Set([
    ...DEFAULT_EXERCISES,
    ...customExercises.map(ex => typeof ex === 'object' ? ex.name : ex)
  ])].sort();

  const filteredExercises = allExercisesNames.filter(ex => ex.toLowerCase().includes((exerciseSearchQuery || '').trim().toLowerCase()));

  const handleSelectExercise = (exerciseName) => {
    updateInteraction();
    const prevPerf = getPreviousPerformance(exerciseName);
    const initialSet = prevPerf
      ? { id: generateId(), weight: prevPerf.weight, reps: prevPerf.reps, rir: prevPerf.rir, tempo: prevPerf.tempo || '', formRating: prevPerf.formRating || 8 }
      : { id: generateId(), weight: '', reps: '', rir: 2, tempo: '', formRating: 8 };

    setActiveWorkout(prev => ({ ...prev, exercises: [...(prev?.exercises || []), { id: generateId(), name: exerciseName, sets: [initialSet] }] }));
    setIsExerciseModalOpen(false);
    setExerciseSearchQuery('');
  };

  const handleCreateExplicitCustomExercise = () => {
    const newEx = (newCustomExercise || '').trim();
    if (!newEx) return;
    const exists = allExercisesNames.some(ex => ex.toLowerCase() === newEx.toLowerCase());
    if (!exists) {
      setCustomExercises(prev => [...prev, { name: newEx, muscle: newExMuscle, mechanics: newExMechanics }]);
    }
    setNewCustomExercise('');
    setIsAddingCustom(false);
    handleSelectExercise(newEx);
  };

  const addSet = (exerciseId) => {
    updateInteraction();
    setActiveWorkout(prev => ({
      ...prev, exercises: (prev?.exercises || []).map(ex => {
        if (ex.id === exerciseId) {
          const lastSet = ex.sets[ex.sets.length - 1] || { weight: '', reps: '', rir: 2, tempo: '', formRating: 8 };
          const newSet = settings.autoCopyLastSet ? { ...lastSet, id: generateId() } : { id: generateId(), weight: '', reps: '', rir: 2, tempo: '', formRating: 8 };
          return { ...ex, sets: [...ex.sets, newSet] };
        }
        return ex;
      })
    }));
  };

  const updateSet = (exerciseId, setId, field, value) => {
    updateInteraction();
    setActiveWorkout(prev => ({
      ...prev, exercises: (prev?.exercises || []).map(ex => ex.id === exerciseId
        ? { ...ex, sets: (ex.sets || []).map(s => s.id === setId ? { ...s, [field]: value } : s) } : ex)
    }));
  };

  const removeSet = (exerciseId, setId) => {
    updateInteraction();
    setActiveWorkout(prev => ({ ...prev, exercises: (prev?.exercises || []).map(ex => ex.id === exerciseId ? { ...ex, sets: (ex.sets || []).filter(s => s.id !== setId) } : ex) }));
  };

  const calcEffectiveSets = (workoutOrExercises) => {
    const exercises = workoutOrExercises?.exercises || workoutOrExercises;
    if (!Array.isArray(exercises)) return 0;
    return exercises.reduce((acc, ex) => acc + (ex.sets || []).filter(s => parseNumber(s.rir) <= 3 && parseNumber(s.reps) > 0).length, 0);
  };

  const get1RMData = (exerciseName) => {
    if (!exerciseName) return [];
    const data = [];
    workouts.forEach(w => {
      const ex = (w.exercises || []).find(e => e.name === exerciseName);
      if (ex && Array.isArray(ex.sets) && ex.sets.length > 0) {
        let max1RM = 0;
        ex.sets.forEach(s => {
          const weight = parseNumber(s.weight); const reps = parseNumber(s.reps);
          if (weight > 0 && reps > 0 && reps <= 15) {
            const epley1RM = weight * (1 + reps / 30);
            if (epley1RM > max1RM) max1RM = epley1RM;
          }
        });
        if (max1RM > 0) data.push({ date: w.date, rm: Math.round(max1RM) });
      }
    });
    return data.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const exportJSON = () => {
    const data = { workouts, templates, customExercises, metricsHistory, nutritionHistory, mealTemplates, dayTemplates, settings };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `HypertrophyLab_Backup_${getLocalDateString()}.json`;
    a.click();

    const now = new Date().toISOString();
    localStorage.setItem('po_last_backup', now);
    setLastBackupDate(now);
  };

  const importJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (Array.isArray(data.workouts)) setWorkouts(data.workouts);
        if (Array.isArray(data.templates)) setTemplates(data.templates);
        if (Array.isArray(data.customExercises)) setCustomExercises(data.customExercises);
        if (Array.isArray(data.metricsHistory)) setMetricsHistory(data.metricsHistory);
        if (Array.isArray(data.nutritionHistory)) setNutritionHistory(data.nutritionHistory);
        if (Array.isArray(data.mealTemplates)) setMealTemplates(data.mealTemplates);
        if (Array.isArray(data.dayTemplates)) setDayTemplates(data.dayTemplates);
        if (data.settings) setSettings(data.settings);
      } catch (err) { }
    };
    reader.readAsText(file);
  };

  // --- BESLENME YÖNETİMİ ---
  const handleNutritionDateChange = (date) => {
    const existing = nutritionHistory.find(n => n.date === date);
    if (existing) setCurrentNutritionForm(mergeNutrition(existing));
    else setCurrentNutritionForm(mergeNutrition({ date: date }));
  };

  const updateMeal = (id, field, value) => {
    setCurrentNutritionForm(prev => {
      const safeMeals = Array.isArray(prev.meals) ? prev.meals : [];
      const updatedMeals = safeMeals.map(m => {
        if (m.id !== id) return m;
        const updated = { ...m, [field]: value };
        if (['protein', 'carbs', 'fats'].includes(field)) {
          const p = parseNumber(updated.protein); const c = parseNumber(updated.carbs); const f = parseNumber(updated.fats);
          if (updated.protein !== '' || updated.carbs !== '' || updated.fats !== '') {
            updated.calories = String(Math.round((p * 4) + (c * 4) + (f * 9)));
          }
        }
        return updated;
      });
      return { ...prev, meals: updatedMeals };
    });
  };

  const addMeal = () => {
    setCurrentNutritionForm(prev => {
      const safeMeals = Array.isArray(prev.meals) ? prev.meals : [];
      if (safeMeals.length >= 9) return prev;
      return { ...prev, meals: [...safeMeals, { id: generateId(), name: `${safeMeals.length + 1}. Öğün`, calories: '', protein: '', carbs: '', fats: '' }] };
    });
  };

  const removeMeal = (id) => {
    setCurrentNutritionForm(prev => {
      const safeMeals = Array.isArray(prev.meals) ? prev.meals : [];
      const filtered = safeMeals.filter(m => m.id !== id);
      const renamed = filtered.map((m, idx) => ({ ...m, name: `${idx + 1}. Öğün` }));
      return { ...prev, meals: renamed };
    });
  };

  const saveMealAsTemplate = (meal) => {
    const p = parseNumber(meal.protein); const c = parseNumber(meal.carbs); const f = parseNumber(meal.fats);
    const name = `${meal.calories || 0}kcal (P:${p} K:${c} Y:${f})`;
    setMealTemplates([...mealTemplates, { ...meal, id: generateId(), name }]);
  };

  const addMealFromTemplate = (template) => {
    setCurrentNutritionForm(prev => {
      const safeMeals = Array.isArray(prev.meals) ? prev.meals : [];
      if (safeMeals.length >= 9) return prev;
      return { ...prev, meals: [...safeMeals, { id: generateId(), name: `${safeMeals.length + 1}. Öğün`, calories: template.calories, protein: template.protein, carbs: template.carbs, fats: template.fats }] };
    });
  };

  const saveDayAsTemplate = () => {
    const safeMeals = Array.isArray(currentNutritionForm.meals) ? currentNutritionForm.meals : [];
    const totalCals = safeMeals.reduce((sum, m) => sum + parseNumber(m.calories), 0);
    const totalPro = safeMeals.reduce((sum, m) => sum + parseNumber(m.protein), 0);
    const name = `Makro Planı: ${totalCals}kcal (P:${totalPro}g)`;
    const templateMeals = safeMeals.map(m => ({ ...m, id: generateId() }));
    setDayTemplates([...dayTemplates, { id: generateId(), name, dayType: currentNutritionForm.dayType, meals: templateMeals }]);
  };

  const loadDayTemplate = (template) => {
    if (!Array.isArray(template.meals)) return;
    const copiedMeals = template.meals.map((m, i) => ({ ...m, id: generateId(), name: `${i + 1}. Öğün` }));
    setCurrentNutritionForm(prev => ({ ...prev, dayType: template.dayType || 'training', meals: copiedMeals }));
  };

  const copyNutritionDay = (pastDay) => {
    const todayStr = getLocalDateString();
    const safeMeals = Array.isArray(pastDay.meals) ? pastDay.meals : [];
    const copiedMeals = safeMeals.map((m, i) => ({ ...m, id: generateId(), name: `${i + 1}. Öğün` }));
    setCurrentNutritionForm({ date: todayStr, dayType: pastDay.dayType || 'training', activeCaloriesOut: pastDay.activeCaloriesOut || '', meals: copiedMeals });
    setView('nutrition');
  };

  const editNutrition = (nutrition) => {
    setCurrentNutritionForm(mergeNutrition({ ...nutrition }));
    setView('nutrition');
  };

  const saveNutrition = () => {
    const safeMeals = Array.isArray(currentNutritionForm.meals) ? currentNutritionForm.meals : [];
    const totalCals = safeMeals.reduce((sum, m) => sum + parseNumber(m.calories), 0);
    if (!currentNutritionForm.date || totalCals === 0) return;

    const totalPro = safeMeals.reduce((sum, m) => sum + parseNumber(m.protein), 0);
    const totalCarbs = safeMeals.reduce((sum, m) => sum + parseNumber(m.carbs), 0);
    const totalFats = safeMeals.reduce((sum, m) => sum + parseNumber(m.fats), 0);

    const currentBMR = composition.bmr;

    const existingEntry = nutritionHistory.find(n => n.date === currentNutritionForm.date);
    const entryId = existingEntry ? existingEntry.id : generateId();

    const newEntry = {
      id: entryId, date: currentNutritionForm.date, dayType: currentNutritionForm.dayType, activeCaloriesOut: String(currentNutritionForm.activeCaloriesOut).replace(',', '.'),
      caloriesIn: totalCals, protein: totalPro, carbs: totalCarbs, fats: totalFats,
      meals: safeMeals, bmrAtTheTime: currentBMR
    };

    let updatedHistory = nutritionHistory.filter(n => n.date !== currentNutritionForm.date);
    updatedHistory.push(newEntry);
    updatedHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

    setNutritionHistory(updatedHistory);
  };

  // --- BİYOMETRİ YÖNETİMİ ---
  const handleMetricDateChange = (date) => {
    const existing = metricsHistory.find(m => m.date === date);
    if (existing) setCurrentMetricsForm(mergeMetrics(existing));
    else setCurrentMetricsForm(prev => mergeMetrics({ ...prev, id: generateId(), date }));
  };
  const handleMetricChange = (field, value) => { setCurrentMetricsForm(prev => ({ ...prev, [field]: value })); };
  const handleMeasurementChange = (field, value) => { setCurrentMetricsForm(prev => ({ ...prev, measurements: { ...prev.measurements, [field]: value } })); };
  const handleSkinfoldChange = (field, value) => { setCurrentMetricsForm(prev => ({ ...prev, skinfolds: { ...prev.skinfolds, [field]: value } })); };

  const saveMetrics = () => {
    const dateToUse = currentMetricsForm.date || getLocalDateString();
    const existingIndex = metricsHistory.findIndex(m => m.date === dateToUse);
    const newEntry = { ...currentMetricsForm, date: dateToUse };
    if (!newEntry.id) newEntry.id = generateId();

    let updatedHistory = [...metricsHistory];
    if (existingIndex >= 0) updatedHistory[existingIndex] = newEntry;
    else updatedHistory.push(newEntry);

    updatedHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    setMetricsHistory(updatedHistory);
  };

  const editMetric = (metric) => {
    setCurrentMetricsForm(mergeMetrics({ ...metric }));
    setView('profile');
    setProfileTab('metrics');
  };

  const executeDelete = () => {
    if (deleteConfirm.type === 'workout') setWorkouts(workouts.filter(w => w.id !== deleteConfirm.id));
    else if (deleteConfirm.type === 'metric') setMetricsHistory(metricsHistory.filter(m => m.id !== deleteConfirm.id));
    else if (deleteConfirm.type === 'nutrition') setNutritionHistory(nutritionHistory.filter(n => n.id !== deleteConfirm.id));
    else if (deleteConfirm.type === 'template') setTemplates(templates.filter(t => t.id !== deleteConfirm.id));
    else if (deleteConfirm.type === 'mealTemplate') setMealTemplates(mealTemplates.filter(t => t.id !== deleteConfirm.id));
    else if (deleteConfirm.type === 'dayTemplate') setDayTemplates(dayTemplates.filter(t => t.id !== deleteConfirm.id));
    setDeleteConfirm({ isOpen: false, type: null, id: null });
  };

  // --- RENDER BİLEŞENLERİ ---

  const renderHome = () => (
    <div className="p-4 space-y-5 pb-24 h-full overflow-y-auto hide-scrollbar bg-black">

      {needsBackup && (
        <div className="bg-orange-900/20 border border-orange-900/50 p-3 rounded-2xl flex items-start space-x-3">
          <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={16} />
          <div className="flex-1">
            <h4 className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Yedekleme Uyarısı</h4>
            <p className="text-[9px] text-orange-300 mt-1 font-mono">Verilerinizi en son 7 günden uzun süre önce yedeklediniz veya hiç yedeklemediniz. Cihaz hafızası temizlenirse verileriniz kaybolur.</p>
          </div>
          <button onClick={() => setIsSettingsModalOpen(true)} className="text-[9px] bg-orange-500/20 text-orange-400 px-3 py-2 rounded-xl font-bold uppercase tracking-wider hover:bg-orange-500/30 transition-colors">Aç</button>
        </div>
      )}

      {dashboardStats.isDeloadNeeded && (
        <div className="bg-red-900/20 border border-red-900/50 p-3 rounded-2xl flex items-start space-x-3">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
          <div>
            <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Dinlenme (Deload) İhtiyacı</h4>
            <p className="text-[9px] text-red-300 mt-1 font-mono">Yorgunluk sınırını aştınız. Bu hafta çalıştığınız set sayılarını veya ağırlıkları %30 oranında düşürün.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-5"><Activity size={64} /></div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 z-10">Bu Hafta</span>
          <span className="text-2xl font-mono text-zinc-100 z-10">{dashboardStats.thisWeekSessions} <span className="text-xs text-zinc-500">Antrenman</span></span>
        </div>
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-5"><Target size={64} /></div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 z-10">Haftalık Hacim</span>
          <span className="text-2xl font-mono text-cyan-400 z-10">{dashboardStats.thisWeekEffectiveSets} <span className="text-xs text-zinc-500">Set</span></span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Aşırı Yük Riski (ACWR)</span>
          <span className={`text-xl font-mono font-bold block mb-1 ${dashboardStats.acwr < 0.8 ? 'text-blue-400' : dashboardStats.acwr > 1.3 ? 'text-red-500' : 'text-emerald-500'}`}>{dashboardStats.acwr}</span>
          <div className={`text-[8px] font-bold uppercase tracking-widest ${dashboardStats.acwr < 0.8 ? 'text-blue-400' : dashboardStats.acwr > 1.3 ? 'text-red-500' : 'text-emerald-500'}`}>
            {dashboardStats.acwr < 0.8 ? 'Yetersiz' : dashboardStats.acwr > 1.3 ? 'Riskli' : 'İdeal'}
          </div>
        </div>
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">İtme / Çekme Oranı</span>
          <span className={`text-xl font-mono font-bold block mb-1 ${parseNumber(dashboardStats.pushPullRatio) > 1.5 ? 'text-orange-400' : 'text-emerald-500'}`}>{dashboardStats.pushPullRatio}</span>
          <div className={`text-[8px] font-bold uppercase tracking-widest ${parseNumber(dashboardStats.pushPullRatio) > 1.5 ? 'text-orange-400' : 'text-emerald-500'}`}>
            {parseNumber(dashboardStats.pushPullRatio) > 1.5 ? 'Dengesiz (Risk)' : 'Dengeli'}
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 space-y-3">
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2">Kas Grubu Hacmi (Etkili Set)</h3>
        <div className="space-y-2.5 pt-1">
          {Object.entries(dashboardStats.muscleVolume).map(([muscle, vol]) => {
            const target = 15;
            const percentage = Math.min(100, (vol / target) * 100);
            return (
              <div key={muscle}>
                <div className="flex justify-between text-[9px] text-zinc-300 font-mono mb-1 uppercase font-bold">
                  <span>{muscle}</span>
                  <span className={vol >= 10 ? 'text-emerald-400' : 'text-zinc-500'}>{vol} / {target} Set</span>
                </div>
                <div className="w-full bg-zinc-950 rounded-full h-1.5 border border-zinc-800">
                  <div className={`h-1.5 rounded-full transition-all duration-500 ${vol >= 10 ? 'bg-emerald-500' : 'bg-cyan-600'}`} style={{ width: `${percentage}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={() => handleStartRequest()} className="w-full bg-cyan-600 active:bg-cyan-700 text-white font-bold py-4 px-4 rounded-2xl flex justify-center items-center uppercase tracking-wide text-sm shadow-lg shadow-cyan-900/20 transition-all">
        <Zap size={18} className="mr-2" /> Antrenman Başlat
      </button>

      {templates.length > 0 && (
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="p-3 border-b border-zinc-800 bg-zinc-950/50">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center"><BookmarkPlus size={12} className="mr-2 text-cyan-500" /> Şablonlar</h3>
          </div>
          <div className="divide-y divide-zinc-800">
            {templates.map(t => (
              <div key={t.id} className="p-3 flex justify-between items-center">
                <span className="text-xs font-bold text-cyan-400 truncate pr-2">{t.name}</span>
                <div className="flex items-center space-x-2 shrink-0">
                  <button onClick={() => handleStartRequest(t)} className="bg-cyan-900/30 active:bg-cyan-900/60 text-cyan-400 border border-cyan-800 text-[10px] font-bold py-1.5 px-3 rounded-lg uppercase tracking-wider">Başlat</button>
                  <button onClick={() => setDeleteConfirm({ isOpen: true, type: 'template', id: t.id })} className="text-zinc-600 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderActiveWorkout = () => (
    <div className="absolute inset-0 bg-black z-40 flex flex-col h-[100dvh]">
      <div className="flex justify-between items-center bg-zinc-950 px-4 py-3 border-b border-zinc-800 shadow-md pt-safe">
        <div className="flex items-center">
          <Activity size={16} className="mr-3 text-emerald-400 animate-pulse" />
          <div>
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider leading-none">Aktif Antrenman</h2>
            <div className="text-[10px] mt-1 flex items-center">
              <WorkoutTimer timer={activeWorkout.timer} isEditing={activeWorkout.isEditingOld} initialDuration={activeWorkout.duration} />
              {!activeWorkout.isEditingOld && (
                <button onClick={toggleWorkoutTimer} className="ml-3 text-zinc-300 hover:text-white bg-zinc-800 rounded-lg p-1.5 transition-colors border border-zinc-700 flex items-center justify-center">
                  {activeWorkout.timer?.status === 'running' ? <Pause size={14} /> : <Play size={14} />}
                </button>
              )}
            </div>
          </div>
        </div>
        <button onClick={handleEndWorkoutRequest} className="bg-emerald-600 active:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded-xl uppercase tracking-wider transition-colors">Bitir</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar pb-32">

        {activeWorkout.readiness && !activeWorkout.isEditingOld && (
          <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
            <div>
              <div className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Toparlanma Skoru</div>
              <div className="flex space-x-3 text-[10px] font-mono">
                <span className="text-blue-400">Uyku: {activeWorkout.readiness.sleep}/5</span>
                <span className="text-orange-400">Stres: {activeWorkout.readiness.stress}/5</span>
                <span className="text-red-400">Ağrı: {activeWorkout.readiness.soreness}/5</span>
              </div>
            </div>
            <div className={`text-lg font-mono font-bold ${activeWorkout.readiness.score < 9 ? 'text-red-500' : activeWorkout.readiness.score < 12 ? 'text-yellow-500' : 'text-emerald-500'}`}>
              {activeWorkout.readiness.score}/15
            </div>
          </div>
        )}

        {(activeWorkout.exercises || []).map((ex, exIndex) => {
          const effSets = calcEffectiveSets([ex]);
          const recentData = getRecentExerciseData(ex.name);

          return (
            <div key={ex.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
              <div className="bg-zinc-950 px-3 py-2 border-b border-zinc-800 flex justify-between items-center">
                <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wide truncate pr-2"><span className="text-cyan-500 mr-1">{exIndex + 1}.</span>{ex.name}</h3>
                <button onClick={() => setActiveWorkout(prev => ({ ...prev, exercises: prev.exercises.filter(e => e.id !== ex.id) }))} className="text-zinc-600 p-1"><X size={14} /></button>
              </div>

              {recentData && (
                <div className="bg-cyan-950/20 px-3 py-1.5 border-b border-zinc-800 text-[9px] text-cyan-500/70 font-mono flex gap-3 overflow-x-auto hide-scrollbar items-center">
                  <span className="text-cyan-600 font-bold shrink-0">Geçmiş:</span>
                  {recentData.sets.map((s, i) => (
                    <span key={i} className="shrink-0">{s.weight}x{s.reps} {s.rir && `(RIR:${s.rir})`}</span>
                  ))}
                </div>
              )}

              <div className="p-2 space-y-2 mt-1">
                <div className="grid grid-cols-12 gap-1 text-[8px] uppercase tracking-wider text-zinc-500 text-center font-bold px-0.5">
                  <div className="col-span-1">S</div><div className="col-span-3">KG</div><div className="col-span-2">Tekrar</div><div className="col-span-2">RIR</div><div className="col-span-2">Tempo</div><div className="col-span-2">Form</div>
                </div>

                {(ex.sets || []).map((set, setIndex) => {
                  const isEffective = parseNumber(set.rir) <= 3 && parseNumber(set.reps) > 0;
                  const e1rm = calcEstimated1RM(set.weight, set.reps, set.rir);
                  return (
                    <div key={set.id} className={`grid grid-cols-12 gap-1 items-center bg-zinc-950 p-1 rounded-xl border transition-colors ${isEffective ? 'border-cyan-900/50' : 'border-zinc-800'} relative`}>
                      <div className="col-span-1 text-center text-[10px] font-mono text-zinc-500">{setIndex + 1}</div>
                      <div className="col-span-3"><input type="number" inputMode="decimal" value={set.weight} onChange={(e) => updateSet(ex.id, set.id, 'weight', e.target.value)} onFocus={e => e.target.select()} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-cyan-400 font-mono text-sm outline-none text-center focus:bg-zinc-800 h-10 transition-colors" placeholder="0" /></div>
                      <div className="col-span-2"><input type="number" inputMode="decimal" value={set.reps} onChange={(e) => updateSet(ex.id, set.id, 'reps', e.target.value)} onFocus={e => e.target.select()} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-100 font-mono text-sm outline-none text-center focus:bg-zinc-800 h-10 transition-colors" placeholder="0" /></div>
                      <div className="col-span-2"><input type="number" inputMode="decimal" step="0.5" value={set.rir} onChange={(e) => updateSet(ex.id, set.id, 'rir', e.target.value)} onFocus={e => e.target.select()} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-300 font-mono text-xs outline-none text-center focus:bg-zinc-800 h-10 transition-colors" placeholder="0" /></div>
                      <div className="col-span-2"><input type="text" maxLength="4" value={set.tempo || ''} onChange={(e) => updateSet(ex.id, set.id, 'tempo', e.target.value)} onFocus={e => e.target.select()} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-400 font-mono text-[10px] outline-none text-center focus:bg-zinc-800 h-10 transition-colors" placeholder="TUT" /></div>
                      <div className="col-span-2 flex items-center pr-1">
                        <select value={set.formRating} onChange={(e) => updateSet(ex.id, set.id, 'formRating', parseNumber(e.target.value))} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-zinc-300 font-mono text-[10px] outline-none text-center h-10 appearance-none transition-colors">
                          {FORM_RATINGS.map(r => <option key={r.value} value={r.value}>{r.value}</option>)}
                        </select>
                      </div>
                      <div className="col-span-12 flex justify-end px-2 -mt-0.5 mb-0.5">
                        <span className="text-[8px] text-cyan-600/70 font-mono tracking-widest">1RM: {e1rm}kg</span>
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center justify-between pt-1 px-1">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Etkili Set: <span className="font-mono text-cyan-400">{effSets}</span></span>
                  <div className="flex space-x-1">
                    <button onClick={() => setRestTimer(60)} className="bg-zinc-950 active:bg-zinc-800 text-zinc-400 text-[10px] font-bold py-1.5 px-2.5 rounded-lg border border-zinc-800 uppercase transition-colors">60s</button>
                    <button onClick={() => setRestTimer(90)} className="bg-zinc-950 active:bg-zinc-800 text-zinc-400 text-[10px] font-bold py-1.5 px-2.5 rounded-lg border border-zinc-800 uppercase transition-colors">90s</button>
                    <button onClick={() => setRestTimer(120)} className="bg-zinc-950 active:bg-zinc-800 text-zinc-400 text-[10px] font-bold py-1.5 px-2.5 rounded-lg border border-zinc-800 uppercase transition-colors">120s</button>
                    <button onClick={() => addSet(ex.id)} className="bg-zinc-800 active:bg-zinc-700 text-zinc-300 text-[10px] font-bold py-1.5 px-3 rounded-lg border border-zinc-700 uppercase tracking-wider flex items-center transition-colors"><Plus size={12} className="mr-1" /> Set</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <button onClick={() => setIsExerciseModalOpen(true)} className="w-full bg-zinc-900 active:bg-zinc-800 text-cyan-500 font-bold py-4 rounded-2xl border border-cyan-900/50 border-dashed flex justify-center items-center uppercase tracking-wider text-xs transition-colors">
          <Plus size={16} className="mr-2" /> Hareket Ekle
        </button>
      </div>

      {restTimer > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-700 text-cyan-400 px-5 py-3 rounded-full shadow-2xl flex items-center space-x-3 z-50">
          <Timer size={18} className="animate-pulse" />
          <span className="font-mono font-bold text-xl tracking-widest">{Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}</span>
          <div className="w-px h-6 bg-zinc-700 mx-1"></div>
          <button onClick={() => setRestTimer(0)} className="text-zinc-400 hover:text-red-400 bg-zinc-900 p-2 rounded-full"><X size={14} /></button>
        </div>
      )}
    </div>
  );

  const renderProfile = () => {
    return (
      <div className="p-4 space-y-4 pb-24 h-full overflow-y-auto hide-scrollbar bg-black">
        <div className="flex bg-zinc-900 rounded-xl p-1 border border-zinc-800">
          <button onClick={() => setProfileTab('metrics')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-colors ${profileTab === 'metrics' ? 'bg-zinc-800 text-cyan-400 shadow' : 'text-zinc-500'}`}>Ölçümler</button>
          <button onClick={() => setProfileTab('analysis')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-colors ${profileTab === 'analysis' ? 'bg-zinc-800 text-cyan-400 shadow' : 'text-zinc-500'}`}>Gelişim Grafiği</button>
        </div>

        {profileTab === 'metrics' && (() => {
          const isUpdating = metricsHistory.some(m => m.date === currentMetricsForm.date);

          return (
            <div className="space-y-4">
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
                <h3 className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-4 flex items-center"><Activity size={14} className="mr-2" /> Vücut Analizi</h3>

                <div className="flex items-center justify-between bg-cyan-900/10 p-3 rounded-xl border border-cyan-900/30 mb-4">
                  <div>
                    <div className="text-[9px] uppercase text-cyan-500 font-bold mb-1">Geçerli Yağ Oranı</div>
                    <div className="text-[8px] text-cyan-600/70">{currentMetricsForm.fatPreference === 'skinfold' ? 'Kaliper Bazlı' : currentMetricsForm.fatPreference === 'navy' ? 'Mezura Bazlı' : currentMetricsForm.fatPreference === 'average' ? 'Ortalama' : 'Manuel'}</div>
                  </div>
                  <div className="text-3xl font-mono text-zinc-100 font-bold">%{composition.activeBF.toFixed(1)}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 flex flex-col items-center">
                    <span className="text-[9px] uppercase text-zinc-500 font-bold mb-1">Kas ve Kemik Kütlesi</span>
                    <span className="font-mono text-sm text-zinc-200 font-bold">{composition.ffm} kg</span>
                  </div>
                  <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 flex flex-col items-center">
                    <span className="text-[9px] uppercase text-zinc-500 font-bold mb-1">Yağ Kütlesi</span>
                    <span className="font-mono text-sm text-zinc-200 font-bold">{composition.fm} kg</span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-zinc-800 pt-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider">Bel/Boy Oranı</div>
                      <div className="text-[8px] text-zinc-600">İdeal sağlık için: &lt; 0.50</div>
                    </div>
                    <div className={`font-mono text-xs font-bold ${parseNumber(composition.whtr) > 0.5 ? 'text-red-400' : 'text-emerald-400'}`}>{composition.whtr}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider">Kemik Yapısı</div>
                      <div className="text-[8px] text-zinc-600">Bilek kalınlığına göre (İskelet Çapı)</div>
                    </div>
                    <div className="font-mono text-xs text-cyan-400 font-bold">{composition.frameSize}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider">Mevcut Kas Kütlesi (FFMI)</div>
                      <div className="text-[8px] text-zinc-600">Maks. Tahmini Üst Sınır: {composition.maxPotentialFFMI}</div>
                    </div>
                    <div className="font-mono text-xs text-emerald-400 font-bold">{composition.ffmi}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider">Maksimum Doğal Kilo</div>
                      <div className="text-[8px] text-zinc-600">Geçerli yağ oranında ulaşılabilir tavan kütle</div>
                    </div>
                    <div className="font-mono text-xs text-yellow-500 font-bold">{composition.maxNaturalWeight} kg</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider">Dinlenik Kalori (BMR)</div>
                      <div className="text-[8px] text-zinc-600">Sadece hayatta kalmak için gereken (Katch-McArdle)</div>
                    </div>
                    <div className="font-mono text-xs text-orange-400 font-bold">{composition.bmr} kcal</div>
                  </div>
                </div>
              </div>

              {parseNumber(composition.potentialAchieved) > 0 && (
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
                  <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center"><TrendingUp size={14} className="mr-2" /> Genetik Potansiyel & Strateji</h3>

                  <div className="mb-4">
                    <div className="flex justify-between text-[9px] text-zinc-300 font-mono mb-1 uppercase font-bold">
                      <span>Kapasite Doluluğu</span>
                      <span className={parseNumber(composition.potentialAchieved) > 90 ? 'text-orange-400' : 'text-emerald-400'}>%{composition.potentialAchieved}</span>
                    </div>
                    <div className="w-full bg-zinc-950 rounded-full h-2 border border-zinc-800 relative overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${parseNumber(composition.potentialAchieved) > 90 ? 'bg-orange-500' : parseNumber(composition.potentialAchieved) > 75 ? 'bg-indigo-500' : 'bg-emerald-500'}`} style={{ width: `${composition.potentialAchieved}%` }}></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                      <h4 className="text-[9px] text-cyan-500 font-bold uppercase tracking-widest flex items-center mb-1"><Zap size={10} className="mr-1" /> Antrenman</h4>
                      <p className="text-[9px] text-zinc-400 leading-relaxed font-mono">{composition.trainingAdvice}</p>
                    </div>
                    <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                      <h4 className="text-[9px] text-orange-500 font-bold uppercase tracking-widest flex items-center mb-1"><Flame size={10} className="mr-1" /> Beslenme</h4>
                      <p className="text-[9px] text-zinc-400 leading-relaxed font-mono">{composition.nutritionAdvice}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-zinc-950/50">
                  <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wider flex items-center">
                    <Scale size={14} className="mr-2 text-cyan-500" /> Ölçüm Girişi
                  </h2>
                  <button onClick={saveMetrics} className={`text-zinc-900 text-[10px] font-bold py-1.5 px-4 rounded-xl flex items-center uppercase tracking-wider transition-all ${isUpdating ? 'bg-cyan-500 active:bg-cyan-600' : 'bg-zinc-100 active:bg-white'}`}>
                    <Save size={12} className="mr-1" /> {isUpdating ? 'Güncelle' : 'Kaydet'}
                  </button>
                </div>
                <div className="p-4 space-y-6">

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">Tarih</label>
                      <input type="date" value={currentMetricsForm.date || ''} onChange={(e) => handleMetricDateChange(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-zinc-300 font-mono text-xs outline-none focus:border-cyan-500 transition-colors" />
                    </div>
                    <div><label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">Cinsiyet</label><select value={currentMetricsForm.gender} onChange={(e) => handleMetricChange('gender', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-zinc-300 text-xs outline-none transition-colors"><option value="male">Erkek</option><option value="female">Kadın</option></select></div>
                    <div><label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">Yaş</label><input type="number" inputMode="decimal" value={currentMetricsForm.age || ''} onChange={(e) => handleMetricChange('age', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-zinc-300 font-mono text-xs outline-none transition-colors" /></div>
                    <div className="col-span-2"><label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">Boy (cm)</label><input type="number" inputMode="decimal" value={currentMetricsForm.height || ''} onChange={(e) => handleMetricChange('height', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-zinc-300 font-mono text-xs outline-none transition-colors" /></div>
                    <div className="col-span-2"><label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">Vücut Ağırlığı (kg)</label><input type="number" inputMode="decimal" value={currentMetricsForm.weight || ''} onChange={(e) => handleMetricChange('weight', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-zinc-300 font-mono text-xs outline-none transition-colors" /></div>

                    <div className="col-span-2 md:col-span-4 border-t border-zinc-800 pt-3 mt-1">
                      <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-2">Hesaplamalarda Kullanılacak Yağ Oranı Seçimi</label>
                      <div className="grid grid-cols-4 gap-2">
                        <label className={`flex flex-col items-center justify-center p-2 rounded-xl border cursor-pointer transition-colors ${currentMetricsForm.fatPreference === 'skinfold' ? 'bg-cyan-900/20 border-cyan-500 text-cyan-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}>
                          <input type="radio" name="fatPreference" value="skinfold" checked={currentMetricsForm.fatPreference === 'skinfold'} onChange={(e) => handleMetricChange('fatPreference', e.target.value)} className="hidden" />
                          <span className="text-[9px] font-bold uppercase mb-1">Kaliper</span>
                          <span className="font-mono text-[10px]">{composition.siriBF !== "-" ? `%${composition.siriBF}` : '-'}</span>
                        </label>
                        <label className={`flex flex-col items-center justify-center p-2 rounded-xl border cursor-pointer transition-colors ${currentMetricsForm.fatPreference === 'navy' ? 'bg-cyan-900/20 border-cyan-500 text-cyan-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}>
                          <input type="radio" name="fatPreference" value="navy" checked={currentMetricsForm.fatPreference === 'navy'} onChange={(e) => handleMetricChange('fatPreference', e.target.value)} className="hidden" />
                          <span className="text-[9px] font-bold uppercase mb-1">Mezura</span>
                          <span className="font-mono text-[10px]">{composition.navyBF !== "-" ? `%${composition.navyBF}` : '-'}</span>
                        </label>
                        <label className={`flex flex-col items-center justify-center p-2 rounded-xl border cursor-pointer transition-colors ${currentMetricsForm.fatPreference === 'average' ? 'bg-cyan-900/20 border-cyan-500 text-cyan-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}>
                          <input type="radio" name="fatPreference" value="average" checked={currentMetricsForm.fatPreference === 'average'} onChange={(e) => handleMetricChange('fatPreference', e.target.value)} className="hidden" />
                          <span className="text-[9px] font-bold uppercase mb-1">Ortalama</span>
                          <span className="font-mono text-[10px]">{composition.averageBF !== "-" ? `%${composition.averageBF}` : '-'}</span>
                        </label>
                        <label className={`flex flex-col items-center justify-center p-2 rounded-xl border cursor-pointer transition-colors relative ${currentMetricsForm.fatPreference === 'manual' ? 'bg-cyan-900/20 border-cyan-500 text-cyan-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}>
                          <input type="radio" name="fatPreference" value="manual" checked={currentMetricsForm.fatPreference === 'manual'} onChange={(e) => handleMetricChange('fatPreference', e.target.value)} className="hidden" />
                          <span className="text-[9px] font-bold uppercase mb-1">Manuel</span>
                          <div className="flex items-center">
                            <span className="text-[10px] font-mono mr-0.5">%</span>
                            <input type="number" inputMode="decimal" value={currentMetricsForm.bodyFat || ''} onChange={(e) => { handleMetricChange('bodyFat', e.target.value); handleMetricChange('fatPreference', 'manual'); }} onClick={(e) => { handleMetricChange('fatPreference', 'manual'); }} className="w-8 bg-transparent text-center font-mono text-[10px] outline-none text-inherit border-b border-zinc-700/50 focus:border-cyan-500" placeholder="0" />
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-zinc-800 pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center"><Ruler size={12} className="mr-2" /> Mezura Ölçümleri (Çevre)</h3>
                      <button onClick={() => setIsMeasurementGuideOpen(true)} className="text-zinc-500 hover:text-cyan-400 transition-colors" title="Nasıl Ölçülür?"><Info size={14} /></button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {['boyun', 'bel', 'kalça', 'bilek', 'omuz', 'göğüs', 'kol', 'bacak', 'kalf'].map((bolge, idx) => {
                        const keys = ['neck', 'waist', 'hip', 'wrist', 'shoulder', 'chest', 'arm', 'thigh', 'calf'];
                        return (
                          <div key={keys[idx]}>
                            <label className="block text-[8px] font-bold uppercase text-zinc-500 mb-1">{bolge}</label>
                            <input type="number" inputMode="decimal" value={currentMetricsForm.measurements?.[keys[idx]] || ''} onChange={(e) => handleMeasurementChange(keys[idx], e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-300 font-mono text-xs outline-none transition-colors" placeholder="0.0" />
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="border-t border-zinc-800 pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-[9px] font-bold uppercase text-zinc-500">Yağ Ölçüm Modeli</label>
                      <button onClick={() => setIsMeasurementGuideOpen(true)} className="text-zinc-500 hover:text-cyan-400 transition-colors" title="Nasıl Ölçülür?"><Info size={14} /></button>
                    </div>
                    <div className="flex space-x-4 mb-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="method" value="3" checked={currentMetricsForm.method === '3'} onChange={(e) => handleMetricChange('method', e.target.value)} className="text-cyan-500 bg-zinc-900 border-zinc-700" />
                        <span className="text-[10px] text-zinc-300 uppercase tracking-wider font-bold">3 Bölge</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="method" value="7" checked={currentMetricsForm.method === '7'} onChange={(e) => handleMetricChange('method', e.target.value)} className="text-cyan-500 bg-zinc-900 border-zinc-700" />
                        <span className="text-[10px] text-zinc-300 uppercase tracking-wider font-bold">7 Bölge (Detaylı)</span>
                      </label>
                    </div>

                    <h3 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2 mt-4 flex items-center"><Target size={10} className="mr-1" /> Yağ Katmanı (mm)</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {(currentMetricsForm.method === '7' || currentMetricsForm.gender === 'male') && (
                        <div><label className="block text-[8px] text-zinc-500 mb-1 uppercase">Göğüs</label><input type="number" inputMode="decimal" value={currentMetricsForm.skinfolds?.chest || ''} onChange={(e) => handleSkinfoldChange('chest', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-300 font-mono text-xs outline-none" /></div>
                      )}
                      {(currentMetricsForm.method === '7' || currentMetricsForm.gender === 'male') && (
                        <div><label className="block text-[8px] text-zinc-500 mb-1 uppercase">Karın</label><input type="number" inputMode="decimal" value={currentMetricsForm.skinfolds?.abdomen || ''} onChange={(e) => handleSkinfoldChange('abdomen', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-300 font-mono text-xs outline-none" /></div>
                      )}
                      <div><label className="block text-[8px] text-zinc-500 mb-1 uppercase">Uyluk (Ön)</label><input type="number" inputMode="decimal" value={currentMetricsForm.skinfolds?.thigh || ''} onChange={(e) => handleSkinfoldChange('thigh', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-300 font-mono text-xs outline-none" /></div>
                      {(currentMetricsForm.method === '7' || currentMetricsForm.gender === 'female') && (
                        <div><label className="block text-[8px] text-zinc-500 mb-1 uppercase">Triceps</label><input type="number" inputMode="decimal" value={currentMetricsForm.skinfolds?.triceps || ''} onChange={(e) => handleSkinfoldChange('triceps', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-300 font-mono text-xs outline-none" /></div>
                      )}
                      {(currentMetricsForm.method === '7' || currentMetricsForm.gender === 'female') && (
                        <div><label className="block text-[8px] text-zinc-500 mb-1 uppercase">Suprailiak</label><input type="number" inputMode="decimal" value={currentMetricsForm.skinfolds?.suprailiac || ''} onChange={(e) => handleSkinfoldChange('suprailiac', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-300 font-mono text-xs outline-none" /></div>
                      )}
                      {currentMetricsForm.method === '7' && (
                        <>
                          <div><label className="block text-[8px] text-zinc-500 mb-1 uppercase">Aksilla</label><input type="number" inputMode="decimal" value={currentMetricsForm.skinfolds?.axilla || ''} onChange={(e) => handleSkinfoldChange('axilla', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-300 font-mono text-xs outline-none" /></div>
                          <div><label className="block text-[8px] text-zinc-500 mb-1 uppercase">Subskapular</label><input type="number" inputMode="decimal" value={currentMetricsForm.skinfolds?.subscapular || ''} onChange={(e) => handleSkinfoldChange('subscapular', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-300 font-mono text-xs outline-none" /></div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {profileTab === 'analysis' && (
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex flex-col space-y-3">
              <div className="flex bg-zinc-900 rounded-xl p-1 border border-zinc-800">
                <button onClick={() => setAnalysisType('1rm')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-colors ${analysisType === '1rm' ? 'bg-zinc-800 text-cyan-400 shadow' : 'text-zinc-500'}`}>1RM</button>
                <button onClick={() => setAnalysisType('volume')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-colors ${analysisType === 'volume' ? 'bg-zinc-800 text-cyan-400 shadow' : 'text-zinc-500'}`}>Hacim Yükü</button>
              </div>

              {analysisType === '1rm' ? (
                <>
                  <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wider flex items-center mt-2"><LineChart size={14} className="mr-2 text-cyan-500" /> Tahmini 1RM Trendi</h2>
                  {performedExercises.length > 0 ? (
                    <select value={analysisExercise || ''} onChange={(e) => setAnalysisExercise(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-zinc-300 font-mono text-xs outline-none transition-colors">
                      {performedExercises.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                    </select>
                  ) : (
                    <div className="text-xs text-zinc-500 font-mono">Antrenman verisi bulunamadı.</div>
                  )}
                </>
              ) : (
                <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wider flex items-center mt-2"><BarChart size={14} className="mr-2 text-cyan-500" /> Haftalık İş Kapasitesi (Kg)</h2>
              )}
            </div>

            <div className="p-4 h-64 bg-zinc-950 relative flex items-end justify-between overflow-x-auto hide-scrollbar">
              {analysisType === '1rm' && (() => {
                if (performedExercises.length === 0) return <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-xs font-mono">Kayıt Yok</div>;

                const data = get1RMData(analysisExercise);
                if (data.length < 2) return <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-[10px] font-mono text-center px-4">Gelişim analizi için (Maks 15 tekrarlı) en az 2 kayıt gereklidir.</div>;

                const maxRm = Math.max(...data.map(d => d.rm));
                const minRm = Math.min(...data.map(d => d.rm));
                const range = maxRm - minRm || 1;

                return (
                  <div className="min-w-full h-full flex items-end justify-start space-x-6 pt-6 pb-4 px-2">
                    {data.map((point, i) => {
                      const heightPercent = ((point.rm - minRm) / range) * 70 + 15;
                      return (
                        <div key={i} className="relative flex flex-col items-center group w-6 shrink-0">
                          <div className="absolute bottom-full mb-1 text-[9px] font-bold font-mono text-cyan-400 bg-zinc-800 px-1.5 py-0.5 rounded shadow">{point.rm} PR</div>
                          <div className="w-full bg-cyan-600 rounded-t-md transition-all duration-500 hover:bg-cyan-400" style={{ height: `${heightPercent}%` }}></div>
                          <div className="absolute top-full mt-2 text-[8px] text-zinc-500 font-mono whitespace-nowrap">{new Date(point.date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {analysisType === 'volume' && (() => {
                if (weeklyVolumeData.length === 0) return <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-xs font-mono">Kayıt Yok</div>;

                const maxVol = Math.max(...weeklyVolumeData.map(d => d.tonnage));
                if (maxVol === 0) return <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-[10px] font-mono text-center px-4">Hacim verisi hesaplanamadı.</div>;

                return (
                  <div className="min-w-full h-full flex items-end justify-start space-x-8 pt-6 pb-4 px-2">
                    {weeklyVolumeData.map((point, i) => {
                      const heightPercent = (point.tonnage / maxVol) * 85;
                      return (
                        <div key={i} className="relative flex flex-col items-center group w-8 shrink-0">
                          <div className="absolute bottom-full mb-1 text-[8px] font-bold font-mono text-cyan-400 bg-zinc-800 px-1.5 py-0.5 rounded shadow">{(point.tonnage / 1000).toFixed(1)}k</div>
                          <div className="w-full bg-cyan-700/80 rounded-t-md transition-all duration-500 hover:bg-cyan-500" style={{ height: `${heightPercent}%` }}></div>
                          <div className="absolute top-full mt-2 text-[7px] text-zinc-500 font-mono whitespace-nowrap">{point.label}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderNutrition = () => {
    const safeMeals = Array.isArray(currentNutritionForm.meals) ? currentNutritionForm.meals : [];
    const totalCalIn = safeMeals.reduce((sum, m) => sum + parseNumber(m.calories), 0);
    const totalP = safeMeals.reduce((sum, m) => sum + parseNumber(m.protein), 0);
    const totalC = safeMeals.reduce((sum, m) => sum + parseNumber(m.carbs), 0);
    const totalF = safeMeals.reduce((sum, m) => sum + parseNumber(m.fats), 0);

    const calOut = parseNumber(currentNutritionForm.activeCaloriesOut);
    const netEnergy = totalCalIn - composition.bmr - calOut;

    const isUpdating = nutritionHistory.some(n => n.date === currentNutritionForm.date);

    // LBM Bazlı Makro Hedefleyici
    const getMacroTargets = () => {
      const bmr = composition.bmr || 2000;
      const weight = parseNumber(currentMetricsForm.weight) || 75;
      const leanMass = parseNumber(composition.ffm) || (weight * 0.85);

      const goal = settings.nutritionGoal || 'bulk';
      const pMultiplierBulk = parseNumber(settings.proteinPerFfmBulk) || 2.2;
      const pMultiplierCut = parseNumber(settings.proteinPerFfmCut) || 2.6;

      let pTarget = 0;
      let targetCals = bmr + calOut;
      let tF = weight * 1.0;

      // Hedefe göre kalori ve protein ayarı
      if (goal === 'cut') {
        pTarget = leanMass * pMultiplierCut;
        targetCals -= 500; // Standart kalori açığı
        tF = weight * 0.8;
      } else if (goal === 'bulk') {
        pTarget = leanMass * pMultiplierBulk;
        targetCals += 300; // Temiz büyüme için kalori fazlası
        tF = weight * 1.0;
      } else { // maintenance (koruma)
        pTarget = leanMass * ((pMultiplierBulk + pMultiplierCut) / 2);
        tF = weight * 1.0;
      }

      // Günlük karbonhidrat döngüsüne (Carb Cycle) göre kalori modülasyonu
      if (currentNutritionForm.dayType === 'training') {
        targetCals += 200;
      } else if (currentNutritionForm.dayType === 'rest') {
        targetCals -= 200;
      }

      let tC = (targetCals - (pTarget * 4) - (tF * 9)) / 4;
      if (tC < 0) tC = 0;

      return { cals: Math.round(targetCals), p: Math.round(pTarget), c: Math.round(tC), f: Math.round(tF) };
    };
    const targets = getMacroTargets();

    return (
      <div className="p-4 space-y-4 pb-24 h-full overflow-y-auto hide-scrollbar bg-black">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-zinc-950/50">
            <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wider flex items-center">
              <Flame size={14} className="mr-2 text-orange-500" /> Günlük Makro Planı
            </h2>
            <button onClick={saveNutrition} className={`text-zinc-900 text-[10px] font-bold py-1.5 px-4 rounded-xl flex items-center uppercase tracking-wider transition-all ${isUpdating ? 'bg-cyan-500 active:bg-cyan-600' : 'bg-zinc-100 active:bg-white'}`}>
              <Save size={12} className="mr-1" /> {isUpdating ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>

          <div className="p-4 space-y-6">
            <div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">Kayıt Tarihi</label>
                  <input type="date" value={currentNutritionForm.date} onChange={(e) => handleNutritionDateChange(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-zinc-300 font-mono text-xs outline-none focus:border-orange-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">Günün Amacı</label>
                  <select value={currentNutritionForm.dayType || 'training'} onChange={(e) => setCurrentNutritionForm(p => ({ ...p, dayType: e.target.value }))} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-zinc-300 font-mono text-xs outline-none focus:border-orange-500 transition-colors">
                    <option value="training">Ağır Antrenman (Yüksek Karb)</option>
                    <option value="light">Hafif Antrenman (Orta Karb)</option>
                    <option value="rest">Dinlenme Günü (Düşük Karb)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">Toplam Alınan</label>
                  <div className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-emerald-400 font-mono text-sm text-center h-11 flex items-center justify-center font-bold">{totalCalIn} kcal</div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">Antrenman (Harcanan)</label>
                  <input type="number" inputMode="decimal" value={currentNutritionForm.activeCaloriesOut} onChange={(e) => setCurrentNutritionForm(p => ({ ...p, activeCaloriesOut: e.target.value }))} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-orange-400 font-mono text-sm outline-none h-11 text-center transition-colors" placeholder="0 kcal" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-2 text-center relative">
                  <label className="flex items-center justify-center text-[9px] font-bold uppercase text-zinc-500 mb-1"><Beef size={10} className="mr-1 text-red-400" /> Pro</label>
                  <div className={`font-mono text-sm font-bold ${totalP >= targets.p ? 'text-emerald-400' : 'text-zinc-300'}`}>{totalP}g</div>
                  <div className="text-[8px] text-zinc-600 mt-1 font-mono border-t border-zinc-800 pt-1">Hedef: {targets.p}g</div>
                </div>
                <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-2 text-center relative">
                  <label className="flex items-center justify-center text-[9px] font-bold uppercase text-zinc-500 mb-1"><Wheat size={10} className="mr-1 text-yellow-400" /> Karb</label>
                  <div className="font-mono text-sm font-bold text-zinc-300">{totalC}g</div>
                  <div className="text-[8px] text-zinc-600 mt-1 font-mono border-t border-zinc-800 pt-1">Hedef: {targets.c}g</div>
                </div>
                <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-2 text-center relative">
                  <label className="flex items-center justify-center text-[9px] font-bold uppercase text-zinc-500 mb-1"><Droplets size={10} className="mr-1 text-blue-400" /> Yağ</label>
                  <div className="font-mono text-sm font-bold text-zinc-300">{totalF}g</div>
                  <div className="text-[8px] text-zinc-600 mt-1 font-mono border-t border-zinc-800 pt-1">Hedef: {targets.f}g</div>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-4 space-y-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center">Öğün Dağılımı</h3>
                <button onClick={saveDayAsTemplate} className="text-zinc-500 hover:text-cyan-400 flex items-center text-[9px] uppercase font-bold transition-colors" title="Günü Şablon Yap"><BookmarkPlus size={12} className="mr-1" /> Günü Kaydet</button>
              </div>

              {safeMeals.map((meal, index) => (
                <div key={meal.id} className="bg-zinc-950 rounded-xl border border-zinc-800 p-3 relative">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">{meal.name}</span>
                    <div className="flex space-x-1">
                      <button onClick={() => saveMealAsTemplate(meal)} className="text-zinc-500 hover:text-cyan-400 p-1 transition-colors"><BookmarkPlus size={14} /></button>
                      {safeMeals.length > 1 && (
                        <button onClick={() => removeMeal(meal.id)} className="text-zinc-600 hover:text-red-500 p-1 transition-colors"><X size={14} /></button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-4">
                      <input type="number" inputMode="decimal" value={meal.calories} onChange={(e) => updateMeal(meal.id, 'calories', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-emerald-400 font-mono text-xs outline-none text-center transition-colors" placeholder="Kalori (Kcal)" />
                    </div>
                    <div className="col-span-1">
                      <input type="number" inputMode="decimal" value={meal.protein} onChange={(e) => updateMeal(meal.id, 'protein', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-300 font-mono text-xs outline-none text-center transition-colors" placeholder="Pro" />
                    </div>
                    <div className="col-span-2">
                      <input type="number" inputMode="decimal" value={meal.carbs} onChange={(e) => updateMeal(meal.id, 'carbs', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-300 font-mono text-xs outline-none text-center transition-colors" placeholder="Karb" />
                    </div>
                    <div className="col-span-1">
                      <input type="number" inputMode="decimal" value={meal.fats} onChange={(e) => updateMeal(meal.id, 'fats', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-300 font-mono text-xs outline-none text-center transition-colors" placeholder="Yağ" />
                    </div>
                  </div>
                </div>
              ))}

              {safeMeals.length < 9 && (
                <div>
                  <button onClick={addMeal} className="w-full bg-zinc-800 active:bg-zinc-700 text-zinc-300 text-[10px] font-bold py-2.5 rounded-xl border border-zinc-700 uppercase tracking-wider flex justify-center items-center mt-2 transition-all">
                    <Plus size={14} className="mr-1" /> Boş Öğün Ekle
                  </button>

                  {mealTemplates.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                      <span className="w-full text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Kayıtlı Öğünler</span>
                      {mealTemplates.map(t => (
                        <button key={t.id} onClick={() => addMealFromTemplate(t)} className="bg-cyan-900/30 text-cyan-400 text-[9px] font-bold px-3 py-1.5 rounded-lg border border-cyan-900/50 flex items-center active:bg-cyan-900/60 transition-colors">
                          <Plus size={10} className="mr-1" /> {t.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-4 space-y-2 font-mono text-xs mt-4">
              <div className="flex justify-between text-zinc-400"><span>Toplam Alınan:</span> <span className="text-emerald-400">+{totalCalIn}</span></div>
              <div className="flex justify-between text-zinc-400"><span>Dinlenik Harcanan:</span> <span className="text-orange-400">-{composition.bmr}</span></div>
              <div className="flex justify-between text-zinc-400 border-b border-zinc-800 pb-2"><span>Aktif Harcanan:</span> <span className="text-orange-400">-{calOut}</span></div>
              <div className="flex justify-between font-bold pt-1 text-sm">
                <span className="text-zinc-300">Günlük Net Kalori:</span>
                <span className={netEnergy > 0 ? "text-emerald-400" : netEnergy < 0 ? "text-orange-400" : "text-zinc-500"}>{netEnergy > 0 ? '+' : ''}{netEnergy}</span>
              </div>
              <div className="text-right text-[8px] uppercase tracking-wider text-zinc-500 mt-1 font-sans font-bold">
                {netEnergy > 0 ? "Kilo Alma (Büyüme)" : netEnergy < 0 ? "Yağ Yakımı (Defisit)" : "Kilo Koruma"}
              </div>
            </div>

            {dayTemplates.length > 0 && (
              <div className="pt-2 border-t border-zinc-800">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Beslenme Şablonları</h3>
                <div className="flex flex-wrap gap-2">
                  {dayTemplates.map(t => (
                    <div key={t.id} className="flex items-center bg-cyan-900/20 border border-cyan-900/50 rounded-lg p-1">
                      <button onClick={() => loadDayTemplate(t)} className="text-cyan-400 text-[10px] font-bold px-2 py-1">{t.name}</button>
                      <button onClick={() => setDeleteConfirm({ isOpen: true, type: 'dayTemplate', id: t.id })} className="text-zinc-500 hover:text-red-500 px-2 border-l border-cyan-900/50 transition-colors"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  };

  const renderHistory = () => (
    <div className="p-4 space-y-4 pb-24 h-full overflow-y-auto hide-scrollbar bg-black">
      <div className="flex bg-zinc-900 rounded-xl p-1 border border-zinc-800">
        <button onClick={() => setHistoryTab('workouts')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-colors ${historyTab === 'workouts' ? 'bg-zinc-800 text-cyan-400 shadow' : 'text-zinc-500'}`}>Antrenman</button>
        <button onClick={() => setHistoryTab('metrics')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-colors ${historyTab === 'metrics' ? 'bg-zinc-800 text-cyan-400 shadow' : 'text-zinc-500'}`}>Ölçümler</button>
        <button onClick={() => setHistoryTab('nutrition')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-colors ${historyTab === 'nutrition' ? 'bg-zinc-800 text-orange-400 shadow' : 'text-zinc-500'}`}>Beslenme</button>
      </div>

      {historyTab === 'workouts' && (
        <div className="space-y-4">
          {workouts.length === 0 ? <p className="text-zinc-600 font-mono text-xs text-center py-10 bg-zinc-900 border border-zinc-800 rounded-2xl">Arşiv boş.</p> : null}
          {workouts.map(w => {
            const effSets = calcEffectiveSets(w);
            const tonnage = calcTonnage(w.exercises);
            return (
              <div key={w.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden relative">
                <div className="p-3 border-b border-zinc-800 bg-zinc-950/30 flex justify-between items-center pr-32">
                  <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">{new Date(w.date).toLocaleDateString('tr-TR')}</h3>
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <button onClick={() => saveAsTemplate(w)} className="text-zinc-500 hover:text-cyan-400 p-2 transition-colors"><BookmarkPlus size={14} /></button>
                    <button onClick={() => handleStartRequest(w)} className="text-zinc-500 hover:text-cyan-400 p-2 transition-colors"><Copy size={14} /></button>
                    <button onClick={() => editWorkout(w)} className="text-zinc-500 hover:text-cyan-400 p-2 transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteConfirm({ isOpen: true, type: 'workout', id: w.id })} className="text-zinc-600 hover:text-red-500 p-2 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} size={12} fill={w.rating >= star ? "currentColor" : "none"} className={w.rating >= star ? "text-yellow-500" : "text-zinc-700"} />
                      ))}
                    </div>
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest flex gap-4 mb-3">
                    <span>Süre: <strong className="text-emerald-400">{w.duration || 0} dk</strong></span>
                    <span>Etkili Set: <strong className="text-cyan-400">{effSets}</strong></span>
                    <span>Hacim: <strong className="text-zinc-300">{tonnage} kg</strong></span>
                  </div>
                  {w.notes && <div className="text-[10px] bg-zinc-950 p-2 rounded-lg border border-zinc-800 text-zinc-400 font-mono mb-2"><span className="text-cyan-700 font-bold">NOT:</span> {w.notes}</div>}

                  <div className="space-y-2 mt-3 border-t border-zinc-800 pt-3">
                    {(w.exercises || []).map(ex => (
                      <div key={ex.id} className="text-[10px] flex justify-between text-zinc-400 font-mono">
                        <span className="truncate w-2/3 font-bold">{ex.sets.length}x {ex.name}</span>
                        <span className="w-1/3 text-right">PR: {Math.max(...ex.sets.map(s => parseNumber(s.weight)))}kg</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {historyTab === 'metrics' && (
        <div className="space-y-3">
          {metricsHistory.length === 0 ? <p className="text-zinc-600 font-mono text-xs text-center py-10 bg-zinc-900 border border-zinc-800 rounded-2xl">Kayıt bulunamadı.</p> : null}
          {metricsHistory.map(m => (
            <div key={m.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 relative flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-cyan-400 mb-2">{new Date(m.date).toLocaleDateString('tr-TR')}</div>
                <div className="text-[10px] text-zinc-400 font-mono mb-1">Ağırlık: <span className="text-zinc-200 font-bold">{m.weight}kg</span> | Yağ: <span className="text-zinc-200 font-bold">{m.bodyFat}%</span></div>
                <div className="text-[9px] text-zinc-500 font-mono mt-1">Kol: {m.measurements?.arm || '-'} | Bel: {m.measurements?.waist || '-'} | Kalça: {m.measurements?.hip || '-'}</div>
              </div>
              <div className="flex flex-col space-y-1">
                <button onClick={() => editMetric(m)} className="text-zinc-500 hover:text-cyan-400 p-2 transition-colors"><Pencil size={14} /></button>
                <button onClick={() => setDeleteConfirm({ isOpen: true, type: 'metric', id: m.id })} className="text-zinc-600 hover:text-red-500 p-2 transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {historyTab === 'nutrition' && (
        <div className="space-y-3">
          {nutritionHistory.length === 0 ? <p className="text-zinc-600 font-mono text-xs text-center py-10 bg-zinc-900 border border-zinc-800 rounded-2xl">Kayıt bulunamadı.</p> : null}
          {nutritionHistory.map(n => {
            const historicalBMR = n.bmrAtTheTime || 2000;
            const netEnergy = (n.caloriesIn || 0) - historicalBMR - parseNumber(n.activeCaloriesOut);
            const netText = netEnergy > 0 ? `+${netEnergy} (Fazla)` : netEnergy < 0 ? `${netEnergy} (Açık)` : `0 (Denge)`;
            const netColor = netEnergy > 0 ? "text-emerald-400" : netEnergy < 0 ? "text-orange-400" : "text-zinc-500";

            return (
              <div key={n.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 relative flex items-center justify-between">
                <div className="w-full pr-20">
                  <div className="text-xs font-bold text-orange-400 mb-2">{new Date(n.date).toLocaleDateString('tr-TR')}</div>
                  <div className="flex justify-between text-[10px] font-mono mb-1">
                    <span className="text-emerald-400 font-bold">Giriş: {n.caloriesIn}kcal</span>
                    <span className="text-orange-500">Çıkış: {n.activeCaloriesOut || 0}kcal</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono mb-2 border-b border-zinc-800 pb-2">
                    <span className="text-zinc-300">Günlük Net: <span className={`${netColor} font-bold`}>{netText}</span></span>
                  </div>
                  <div className="text-[9px] text-zinc-400 flex gap-3 font-mono">
                    <span className="text-red-400">P:{n.protein || 0}g</span>
                    <span className="text-yellow-400">K:{n.carbs || 0}g</span>
                    <span className="text-blue-400">Y:{n.fats || 0}g</span>
                  </div>
                </div>
                <div className="absolute top-3 right-3 flex space-x-1">
                  <button onClick={() => copyNutritionDay(n)} className="text-zinc-500 hover:text-cyan-400 p-2 transition-colors"><Copy size={14} /></button>
                  <button onClick={() => editNutrition(n)} className="text-zinc-500 hover:text-orange-400 p-2 transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => setDeleteConfirm({ isOpen: true, type: 'nutrition', id: n.id })} className="text-zinc-600 hover:text-red-500 p-2 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex justify-center bg-black min-h-screen">
      <div className="w-full max-w-[420px] bg-zinc-950 h-[100dvh] flex flex-col relative overflow-hidden shadow-2xl">

        {/* HEADER */}
        <header className="bg-zinc-950 border-b border-zinc-800 pt-safe flex justify-between items-center z-10">
          <div className="px-4 py-3 flex items-center">
            <Activity size={18} className="mr-2 text-cyan-500" />
            <h1 className="text-sm font-bold tracking-widest text-zinc-100 uppercase">Hypertrophy<span className="text-cyan-500 font-light">Lab</span></h1>
          </div>
          <button onClick={() => setIsSettingsModalOpen(true)} className="px-4 py-3 text-zinc-500 hover:text-zinc-300 transition-colors"><Settings size={18} /></button>
        </header>

        {/* CONTENT */}
        <div className="flex-1 overflow-hidden relative">
          {view === 'home' && renderHome()}
          {view === 'profile' && renderProfile()}
          {view === 'nutrition' && renderNutrition()}
          {view === 'history' && renderHistory()}

          {/* Active Workout Overlay */}
          {activeWorkout && renderActiveWorkout()}
        </div>

        {/* BOTTOM NAVIGATION */}
        {!activeWorkout && (
          <nav className="bg-zinc-950 border-t border-zinc-900 pb-safe absolute bottom-0 w-full z-30 flex justify-around h-16">
            <button onClick={() => setView('home')} className={`flex flex-col items-center justify-center w-1/4 h-full transition-colors ${view === 'home' ? 'text-cyan-400' : 'text-zinc-600 hover:text-zinc-400'}`}>
              <Zap size={20} className="mb-1" /><span className="text-[9px] font-bold uppercase tracking-wider">Antrenman</span>
            </button>
            <button onClick={() => setView('profile')} className={`flex flex-col items-center justify-center w-1/4 h-full transition-colors ${view === 'profile' ? 'text-cyan-400' : 'text-zinc-600 hover:text-zinc-400'}`}>
              <User size={20} className="mb-1" /><span className="text-[9px] font-bold uppercase tracking-wider">Ölçümler</span>
            </button>
            <button onClick={() => setView('nutrition')} className={`flex flex-col items-center justify-center w-1/4 h-full transition-colors ${view === 'nutrition' ? 'text-orange-400' : 'text-zinc-600 hover:text-zinc-400'}`}>
              <Flame size={20} className="mb-1" /><span className="text-[9px] font-bold uppercase tracking-wider">Beslenme</span>
            </button>
            <button onClick={() => { setView('history'); setHistoryTab('workouts'); }} className={`flex flex-col items-center justify-center w-1/4 h-full transition-colors ${view === 'history' ? 'text-cyan-400' : 'text-zinc-600 hover:text-zinc-400'}`}>
              <History size={20} className="mb-1" /><span className="text-[9px] font-bold uppercase tracking-wider">Arşiv</span>
            </button>
          </nav>
        )}

        {/* READINESS MODAL (Pre-Workout) */}
        {preWorkoutModal && (
          <div className="absolute inset-0 bg-black/90 z-[60] flex justify-center items-center px-4 backdrop-blur-sm">
            <div className="bg-zinc-900 w-full rounded-2xl shadow-2xl border border-zinc-800 p-6 flex flex-col">
              <h3 className="text-sm font-bold text-zinc-100 mb-2 uppercase tracking-wide border-b border-zinc-800 pb-3 flex items-center">
                <BrainCircuit size={16} className="mr-2 text-cyan-500" /> Hazırbulunuşluk
              </h3>
              <p className="text-[10px] text-zinc-400 mb-6 mt-2 leading-tight">Yüklenme şiddetini ve sakatlık riskini hesaplayabilmemiz için bugünkü mental ve fiziksel toparlanmanızı puanlayın.</p>

              <div className="space-y-5 mb-8">
                <div>
                  <label className="flex justify-between text-xs text-zinc-300 font-bold mb-2"><span>Uyku & Toparlanma</span> <span className="text-cyan-400">{readinessForm.sleep}/5</span></label>
                  <input type="range" min="1" max="5" value={readinessForm.sleep} onChange={(e) => setReadinessForm(p => ({ ...p, sleep: parseInt(e.target.value) }))} className="w-full accent-cyan-500" />
                </div>
                <div>
                  <label className="flex justify-between text-xs text-zinc-300 font-bold mb-2"><span>Psikolojik Stres</span> <span className="text-orange-400">{readinessForm.stress}/5</span></label>
                  <input type="range" min="1" max="5" value={readinessForm.stress} onChange={(e) => setReadinessForm(p => ({ ...p, stress: parseInt(e.target.value) }))} className="w-full accent-orange-500" />
                  <div className="text-[8px] text-zinc-500 mt-1">1: Çok Sakin | 5: Çok Stresli</div>
                </div>
                <div>
                  <label className="flex justify-between text-xs text-zinc-300 font-bold mb-2"><span>Kas Ağrısı (DOMS)</span> <span className="text-red-400">{readinessForm.soreness}/5</span></label>
                  <input type="range" min="1" max="5" value={readinessForm.soreness} onChange={(e) => setReadinessForm(p => ({ ...p, soreness: parseInt(e.target.value) }))} className="w-full accent-red-500" />
                  <div className="text-[8px] text-zinc-500 mt-1">1: Ağrı Yok | 5: Aşırı Ağrılı</div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button onClick={() => setPreWorkoutModal(null)} className="flex-1 bg-zinc-800 active:bg-zinc-700 text-zinc-300 font-bold py-3.5 rounded-xl uppercase text-xs transition-colors">İptal</button>
                <button onClick={confirmStartWorkout} className="flex-1 bg-cyan-600 active:bg-cyan-700 text-white font-bold py-3.5 rounded-xl uppercase text-xs transition-colors shadow-lg shadow-cyan-900/20">Seansa Başla</button>
              </div>
            </div>
          </div>
        )}

        {/* END WORKOUT MODAL */}
        {isEndWorkoutModalOpen && (
          <div className="absolute inset-0 bg-black/90 z-[60] flex justify-center items-center px-4 backdrop-blur-sm">
            <div className="bg-zinc-900 w-full rounded-2xl shadow-2xl border border-zinc-800 p-6 flex flex-col">
              <h3 className="text-sm font-bold text-zinc-100 mb-4 uppercase tracking-wide border-b border-zinc-800 pb-3 flex items-center">
                <Save size={16} className="mr-2 text-emerald-500" /> Antrenmanı Tamamla
              </h3>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Toplam Süre (Dakika)</label>
                  <input type="number" inputMode="decimal" value={activeWorkout?.duration || ''} onChange={e => setActiveWorkout(p => ({ ...p, duration: parseNumber(e.target.value) }))} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-emerald-400 font-mono text-sm outline-none focus:border-emerald-500 transition-colors" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Zorluk Derecesi (RPE)</label>
                  <div className="flex space-x-2 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} onClick={() => setActiveWorkout(prev => ({ ...prev, rating: star }))} fill={activeWorkout?.rating >= star ? "currentColor" : "none"} className={`transition-colors cursor-pointer ${activeWorkout?.rating >= star ? "text-yellow-500" : "text-zinc-700"}`} size={24} />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Notlar (Pump, Tükeniş vb.)</label>
                  <textarea value={activeWorkout?.notes || ''} onChange={e => { updateInteraction(); setActiveWorkout(p => ({ ...p, notes: e.target.value })); }} rows="3" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-300 font-mono text-xs outline-none focus:border-emerald-500 transition-colors"></textarea>
                </div>
              </div>

              <div className="flex space-x-3">
                <button onClick={() => setIsEndWorkoutModalOpen(false)} className="flex-1 bg-zinc-800 active:bg-zinc-700 text-zinc-300 font-bold py-3.5 rounded-xl uppercase text-xs transition-colors">İptal</button>
                <button onClick={confirmSaveWorkout} className="flex-1 bg-emerald-600 active:bg-emerald-700 text-white font-bold py-3.5 rounded-xl uppercase text-xs transition-colors shadow-lg shadow-emerald-900/20">Kaydet</button>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS MODAL */}
        {isSettingsModalOpen && (
          <div className="absolute inset-0 bg-black/90 z-[60] flex justify-center items-center px-4 backdrop-blur-sm">
            <div className="bg-zinc-900 w-full rounded-2xl shadow-2xl border border-zinc-800 p-6 flex flex-col">
              <h3 className="text-sm font-bold text-zinc-100 mb-4 uppercase tracking-wide border-b border-zinc-800 pb-3 flex items-center">
                <Settings size={16} className="mr-2 text-zinc-400" /> Ayarlar & Yedekleme
              </h3>

              <div className="flex items-center justify-between mb-6">
                <div className="pr-4">
                  <div className="text-xs text-zinc-200 font-bold uppercase tracking-wider">Son Seti Kopyala</div>
                  <div className="text-[10px] text-zinc-500 mt-1 leading-tight">Yeni set eklerken bir önceki setin ağırlık ve tekrar verilerini klonlar.</div>
                </div>
                <button onClick={() => setSettings(p => ({ ...p, autoCopyLastSet: !p.autoCopyLastSet }))} className={`w-12 h-6 rounded-full relative transition-colors shrink-0 ${settings.autoCopyLastSet ? 'bg-cyan-600' : 'bg-zinc-700'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${settings.autoCopyLastSet ? 'translate-x-7' : 'translate-x-1'}`}></div>
                </button>
              </div>

              <div className="border-t border-zinc-800 pt-5 mb-6 space-y-4">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Beslenme ve Makro Hedefleri</h4>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-2">Mevcut Dönem Hedefi</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['bulk', 'maintenance', 'cut'].map(goal => (
                      <button key={goal} onClick={() => setSettings(p => ({ ...p, nutritionGoal: goal }))} className={`py-2 rounded-lg text-[9px] font-bold uppercase transition-colors border ${settings.nutritionGoal === goal ? 'bg-cyan-900/30 border-cyan-500 text-cyan-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}>
                        {goal === 'bulk' ? 'Büyüme (Bulk)' : goal === 'cut' ? 'Yağ Yakımı (Cut)' : 'Koruma'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">Bulk Protein Çarpanı</label>
                    <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg p-2">
                      <input type="number" step="0.1" value={settings.proteinPerFfmBulk} onChange={(e) => setSettings(p => ({ ...p, proteinPerFfmBulk: parseFloat(e.target.value) }))} className="w-full bg-transparent text-zinc-100 font-mono text-xs outline-none text-center" />
                      <span className="text-[8px] text-zinc-600 ml-1 whitespace-nowrap">g/kg FFM</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">Cut Protein Çarpanı</label>
                    <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg p-2">
                      <input type="number" step="0.1" value={settings.proteinPerFfmCut} onChange={(e) => setSettings(p => ({ ...p, proteinPerFfmCut: parseFloat(e.target.value) }))} className="w-full bg-transparent text-zinc-100 font-mono text-xs outline-none text-center" />
                      <span className="text-[8px] text-zinc-600 ml-1 whitespace-nowrap">g/kg FFM</span>
                    </div>
                  </div>
                </div>
                <p className="text-[8px] text-zinc-500 font-mono">Bilimsel Referans: Büyüme (Bulk) döneminde yağsız kütle (FFM) başına 2.0-2.4g protein yeterliyken, kalori açığı (Cut) yaratılan dönemlerde kas yıkımını önlemek için ihtiyaç 2.4-3.1g seviyelerine çıkar.</p>
              </div>

              <div className="border-t border-zinc-800 pt-5 mb-6">
                <div className="flex justify-between items-end mb-2">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Veritabanı Yönetimi (Local)</div>
                  <div className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${isStoragePersisted ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
                    {isStoragePersisted ? 'Kalıcı Bellek: Aktif' : 'Kalıcı Bellek: Pasif'}
                  </div>
                </div>
                <div className="text-[9px] text-zinc-600 mb-4 font-mono">Uygulama verileri sadece cihazınızdadır. Tarayıcıyı sıfırlamadan önce mutlaka JSON olarak indirin. <br /><span className="text-zinc-400">Son Yedek: {lastBackupDate ? new Date(lastBackupDate).toLocaleDateString('tr-TR') : 'Hiç Alınmadı'}</span></div>
                <div className="flex space-x-3">
                  <button onClick={exportJSON} className="flex-1 bg-zinc-800 active:bg-zinc-700 text-cyan-400 font-bold py-3 rounded-xl text-[10px] uppercase flex justify-center items-center transition-colors"><Download size={14} className="mr-2" /> İndir</button>
                  <label className="flex-1 bg-zinc-800 active:bg-zinc-700 text-orange-400 font-bold py-3 rounded-xl text-[10px] uppercase flex justify-center items-center cursor-pointer transition-colors">
                    <Upload size={14} className="mr-2" /> Yükle
                    <input type="file" accept=".json" onChange={importJSON} className="hidden" ref={fileInputRef} />
                  </label>
                </div>
              </div>

              {!isStandalone && (
                <div className="border-t border-zinc-800 pt-5 mb-6">
                  <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">Uygulamayı Cihaza Kur (PWA)</h4>
                  <p className="text-[9px] text-zinc-400 font-mono mb-3 leading-relaxed">
                    Bu sistemi adres çubuğu olmadan tam ekran bir uygulama gibi kullanmak için:
                  </p>
                  <ul className="text-[9px] text-zinc-300 font-mono space-y-2 mb-2">
                    <li><strong className="text-zinc-100">iOS (Safari):</strong> Alt menüdeki <span className="inline-block bg-zinc-800 px-1 rounded border border-zinc-700">Paylaş</span> (Yukarı ok) ikonuna dokunun ve <span className="inline-block bg-zinc-800 px-1 rounded border border-zinc-700">Ana Ekrana Ekle</span> seçeneğini seçin.</li>
                    <li><strong className="text-zinc-100">Android (Chrome):</strong> Sağ üstteki <span className="inline-block bg-zinc-800 px-1 rounded border border-zinc-700">Üç Nokta</span> ikonuna dokunun ve <span className="inline-block bg-zinc-800 px-1 rounded border border-zinc-700">Ana Ekrana Ekle / Uygulamayı Yükle</span> seçeneğini seçin.</li>
                  </ul>
                </div>
              )}

              <button onClick={() => setIsSettingsModalOpen(false)} className="w-full bg-zinc-100 active:bg-white text-zinc-900 font-bold py-3.5 rounded-xl uppercase text-xs transition-colors">Kapat</button>
            </div>
          </div>
        )}

        {/* EXERCISE MODAL */}
        {isExerciseModalOpen && (
          <div className="absolute inset-0 bg-zinc-950 z-50 flex flex-col h-[100dvh]">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center pt-safe">
              <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider flex items-center"><Database size={14} className="mr-2 text-cyan-500" /> Hareket Seçimi</h3>
              <button onClick={() => { setIsExerciseModalOpen(false); setIsAddingCustom(false); setNewCustomExercise(''); }} className="text-zinc-500 p-2"><X size={18} /></button>
            </div>
            <div className="p-4 border-b border-zinc-800 bg-zinc-950">
              {!isAddingCustom ? (
                <button onClick={() => setIsAddingCustom(true)} className="w-full bg-zinc-900 active:bg-zinc-800 border border-zinc-800 text-cyan-500 font-bold py-3 rounded-xl text-[10px] uppercase tracking-wider flex justify-center items-center transition-colors">
                  <Plus size={14} className="mr-2" /> Yeni Özel Hareket Ekle
                </button>
              ) : (
                <div className="space-y-3 bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                  <input type="text" value={newCustomExercise} onChange={(e) => setNewCustomExercise(e.target.value)} placeholder="Hareket Adı (Örn: Cable Lateral Raise)" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 font-mono text-xs outline-none focus:border-cyan-500 transition-colors" />
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <label className="block text-[8px] font-bold text-zinc-500 uppercase mb-1">Kas Grubu</label>
                      <select value={newExMuscle} onChange={e => setNewExMuscle(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-300 text-[10px] outline-none">
                        <option value="Göğüs">Göğüs</option>
                        <option value="Sırt">Sırt</option>
                        <option value="Bacak">Bacak</option>
                        <option value="Omuz">Omuz</option>
                        <option value="Kol">Kol</option>
                        <option value="Merkez">Merkez</option>
                        <option value="Diğer">Diğer</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-[8px] font-bold text-zinc-500 uppercase mb-1">Mekanik</label>
                      <select value={newExMechanics} onChange={e => setNewExMechanics(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-300 text-[10px] outline-none">
                        <option value="Push">İtme (Push)</option>
                        <option value="Pull">Çekme (Pull)</option>
                        <option value="Legs">Bacak (Legs)</option>
                        <option value="Core">Merkez (Core)</option>
                        <option value="Diğer">Diğer</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <button onClick={() => { setIsAddingCustom(false); setNewCustomExercise(''); }} className="flex-1 text-zinc-500 bg-zinc-950 active:bg-zinc-800 rounded-lg text-[10px] uppercase font-bold py-2.5 transition-colors">İptal</button>
                    <button onClick={handleCreateExplicitCustomExercise} className="flex-1 bg-cyan-600 active:bg-cyan-700 text-white rounded-lg text-[10px] uppercase font-bold py-2.5 transition-colors">Kaydet</button>
                  </div>
                </div>
              )}
            </div>
            {!isAddingCustom && (
              <div className="p-4 border-b border-zinc-800 bg-zinc-950">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input type="text" value={exerciseSearchQuery} onChange={(e) => setExerciseSearchQuery(e.target.value)} placeholder="Veritabanında ara..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-3 text-zinc-100 outline-none font-mono text-xs h-11 focus:border-cyan-500 transition-colors" />
                </div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto bg-zinc-950 pb-safe hide-scrollbar">
              {filteredExercises.map(ex => {
                const { muscle, mechanics } = detectMuscleGroup(ex, customExercises);
                return (
                  <button key={ex} onClick={() => handleSelectExercise(ex)} className="w-full flex justify-between items-center px-5 py-4 border-b border-zinc-900 text-zinc-300 active:bg-zinc-900 transition-colors text-left">
                    <div>
                      <div className="text-xs font-bold font-mono">{ex}</div>
                      <div className="text-[8px] text-zinc-500 uppercase tracking-widest mt-1">{muscle} &bull; {mechanics}</div>
                    </div>
                    {getPreviousPerformance(ex) && <Activity size={14} className="text-cyan-600" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* DELETE CONFIRM MODAL */}
        {deleteConfirm.isOpen && (
          <div className="absolute inset-0 bg-black/80 z-[60] flex justify-center items-center px-4 backdrop-blur-sm">
            <div className="bg-zinc-900 w-full rounded-2xl shadow-2xl border border-red-900/50 p-6 flex flex-col items-center text-center">
              <AlertCircle size={36} className="text-red-500 mb-4" />
              <h3 className="text-sm font-bold text-zinc-100 mb-2 uppercase tracking-wide">Kalıcı Silme</h3>
              <p className="text-xs text-zinc-400 mb-6 font-mono">Veri yerel bellekten kalıcı olarak silinecektir.</p>
              <div className="flex w-full space-x-3">
                <button onClick={() => setDeleteConfirm({ isOpen: false, type: null, id: null })} className="flex-1 bg-zinc-800 text-zinc-300 font-bold py-3.5 rounded-xl uppercase text-xs transition-colors">İptal</button>
                <button onClick={executeDelete} className="flex-1 bg-red-600/90 text-white font-bold py-3.5 rounded-xl uppercase text-xs transition-colors">Sil</button>
              </div>
            </div>
          </div>
        )}

        {/* MEASUREMENT GUIDE MODAL */}
        {isMeasurementGuideOpen && (
          <div className="absolute inset-0 bg-black/90 z-[60] flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-zinc-900 w-full max-h-[85vh] rounded-2xl shadow-2xl border border-zinc-800 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center shrink-0">
                <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider flex items-center">
                  <Info size={14} className="mr-2 text-cyan-500" /> Nasıl Ölçülür?
                </h3>
                <button onClick={() => setIsMeasurementGuideOpen(false)} className="text-zinc-500 p-2 hover:text-zinc-300"><X size={16} /></button>
              </div>
              <div className="p-5 overflow-y-auto hide-scrollbar space-y-6 text-zinc-300 text-xs">

                <div>
                  <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-3 border-b border-zinc-800 pb-1">Mezura Ölçümleri (Çevre)</h4>
                  <ul className="space-y-3">
                    <li><strong className="text-zinc-100 block mb-0.5">Boyun:</strong> Adem elmasının hemen altından, yere paralel.</li>
                    <li><strong className="text-zinc-100 block mb-0.5">Omuz:</strong> Kollar yanlardayken, omuzların en geniş (dışa çıkık) yerinden.</li>
                    <li><strong className="text-zinc-100 block mb-0.5">Göğüs:</strong> Normal bir nefes aldıktan sonra (şişirmeden), meme ucu hizasından.</li>
                    <li><strong className="text-zinc-100 block mb-0.5">Kol (Pazı):</strong> Kolunuzu büküp kasınızı (biceps) sıktığınızda en yüksek noktadan. Her seferinde aynı şiddette sıkmaya özen gösterin.</li>
                    <li><strong className="text-zinc-100 block mb-0.5">Bel:</strong> Göbek deliği seviyesinden veya belin en ince noktasından. Nefesinizi tamamen verdikten sonra ölçün.</li>
                    <li><strong className="text-zinc-100 block mb-0.5">Kalça:</strong> Yandan bakıldığında kalçanın en geriye çıkan (en geniş) kısmından.</li>
                    <li><strong className="text-zinc-100 block mb-0.5">Bacak (Üst):</strong> Bacaklar hafif açıkken, kasığın hemen altından bacağın en kalın noktasından.</li>
                    <li><strong className="text-zinc-100 block mb-0.5">Kalf (Alt Bacak):</strong> Baldır kasının en kalın yerinden.</li>
                    <li><strong className="text-zinc-100 block mb-0.5">Bilek:</strong> El bileğindeki çıkıntı kemiğin hemen arkasından (kola doğru).</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-3 border-b border-zinc-800 pb-1">Yağ Ölçümü (Deri Kıvrımı)</h4>
                  <div className="bg-orange-900/10 border border-orange-900/30 text-orange-400 p-3 rounded-lg mb-4 text-[10px] font-mono leading-relaxed">
                    <strong className="block mb-1 text-orange-300">Pensesiz (Elle ve Cetvelle) Ölçüm Yöntemi:</strong>
                    Kaliper (yağ pensesi) yoksa, baş parmak ve işaret parmağınızı ölçüm noktasının etrafında <strong>5-8 cm'lik bir açıklıkla</strong> yerleştirin. Deriyi ve altındaki yağ dokusunu (alttaki kası kavramadan) sıkıştırarak dışarı doğru yaklaşık <strong>1-2 cm</strong> çekin. Parmaklarınızın arasında kalan bu deri katmanının genişliğini düz bir cetvel veya mezura ile milimetre (mm) cinsinden ölçüp uygulamaya girin. Bilimsel kaliper kadar hassas olmasa da gelişimi (trendi) takip etmek için son derece rasyonel bir yöntemdir. Tüm ölçümleri vücudun sağ tarafından yapın.
                  </div>
                  <ul className="space-y-3">
                    <li><strong className="text-zinc-100 block mb-0.5">Göğüs:</strong> Koltuk altı çizgisi ile meme ucu arasındaki mesafenin tam ortasından, çaprazlama kavrayın.</li>
                    <li><strong className="text-zinc-100 block mb-0.5">Karın:</strong> Göbek deliğinin iki parmak (yaklaşık 2 cm) sağından dikey olarak kavrayın.</li>
                    <li><strong className="text-zinc-100 block mb-0.5">Uyluk (Ön Bacak):</strong> Kasık ile diz kapağı arasındaki mesafenin tam ortasından dikey olarak kavrayın. Bacak kası serbest olmalıdır.</li>
                    <li><strong className="text-zinc-100 block mb-0.5">Triceps (Arka Kol):</strong> Omuz ile dirsek arasındaki mesafenin tam ortasından (kolun arkasından) dikey olarak kavrayın.</li>
                    <li><strong className="text-zinc-100 block mb-0.5">Suprailiak (Bel Yanı):</strong> Leğen kemiğinin (kalça kemiği üst sınırı) hemen üzerinden, doğal çapraz çizgiyi takip ederek kavrayın.</li>
                    <li><strong className="text-zinc-100 block mb-0.5">Aksilla (Koltuk Altı):</strong> Koltuk altı hizasından aşağı inen hattan, göğüs kafesi bitimi seviyesinde dikey olarak kavrayın.</li>
                    <li><strong className="text-zinc-100 block mb-0.5">Subskapular (Kürek Kemiği):</strong> Kürek kemiğinin en alt ucunun hemen altından, sırta çapraz şekilde kavrayın.</li>
                  </ul>
                </div>

              </div>
              <div className="p-4 border-t border-zinc-800 bg-zinc-950">
                <button onClick={() => setIsMeasurementGuideOpen(false)} className="w-full bg-cyan-600 active:bg-cyan-700 text-white font-bold py-3 rounded-xl uppercase tracking-wider text-xs transition-colors">Anladım</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}