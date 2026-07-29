import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Plus, Save, Activity, X, Search, Trash2, AlertCircle, Settings, BrainCircuit, Star, Database
} from 'lucide-react';
import {
  startLockScreenActivity, updateLockScreenActivity, stopLockScreenActivity,
  requestWakeLock, playRestAlert, vibrateAlert
} from './lockScreen';

import { DEFAULT_EXERCISES, MUSCLE_GROUPS, getVolumeLandmarks } from './utils/constants';
import { migrateCustomExercises } from './utils/migrations';
import { computeAdaptiveTDEE } from './utils/tdee';
import { totalCardioCalories } from './utils/cardio';
import { safeSetItem, safeSetRawItem, createErrorThrottle } from './utils/persist';
import { templateToExercises, workoutToTemplate, suggestTemplateName } from './utils/templates';

import {
  generateId, getLocalDateString, getMondayOfCurrentWeek, detectMuscleGroup,
  foldForSearch, parseNumber, mergeMetrics, mergeNutrition,
  isWorkingSet, calcEffectiveSets, buildPersonalRecords, loadPersistedState,
  computeComposition, sortByDateDesc, storageKey, suggestNextTarget, mergeSettings,
  mergeWorkout, mergeTemplate
} from './utils/helpers';

import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import ActiveWorkoutView from './components/ActiveWorkoutView';
import HistoryView from './components/HistoryView';
import MetricsView from './components/MetricsView';
import NutritionView from './components/NutritionView';
import AnalyticsView from './components/AnalyticsView';
import SettingsModal from './components/SettingsModal';
import QRCodeModal from './components/QRCodeModal';
import FoodSearchModal from './components/FoodSearchModal';
import MetricsComparisonModal from './components/MetricsComparisonModal';
import ReportCardModal from './components/ReportCardModal';
import MuscleDetailModal from './components/MuscleDetailModal';
import PlateCalculatorModal from './components/PlateCalculatorModal';
import TemplatePreviewModal from './components/TemplatePreviewModal';
import ExerciseEditorModal from './components/ExerciseEditorModal';
import ExerciseLibraryModal from './components/ExerciseLibraryModal';
import TemplateBuilderModal from './components/TemplateBuilderModal';
import CardioModal from './components/CardioModal';
import WeeklyPlanModal from './components/WeeklyPlanModal';

export default function App() {
  const [initial] = useState(loadPersistedState);

  const [workouts, setWorkouts] = useState(initial.workouts);
  const [templates, setTemplates] = useState(initial.templates);
  const [activeWorkout, setActiveWorkout] = useState(initial.activeWorkout);

  const [preWorkoutModal, setPreWorkoutModal] = useState(null);
  const [isEndWorkoutModalOpen, setIsEndWorkoutModalOpen] = useState(false);
  const [readinessForm, setReadinessForm] = useState({ sleep: 3, stress: 3, soreness: 3 });

  const [view, setView] = useState('home');
  const [historyTab, setHistoryTab] = useState('workouts');
  const [analysisType, setAnalysisType] = useState('body');

  const [customExercises, setCustomExercises] = useState(initial.customExercises);
  const [customFoods, setCustomFoods] = useState(initial.customFoods);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isFoodSearchOpen, setIsFoodSearchOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [isReportCardOpen, setIsReportCardOpen] = useState(false);
  const [detailMuscle, setDetailMuscle] = useState(null);
  const [plateCalc, setPlateCalc] = useState(null); // { weight } | null
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [editorExercise, setEditorExercise] = useState(null); // hareket adı
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isCardioOpen, setIsCardioOpen] = useState(false);
  const [isWeekPlanOpen, setIsWeekPlanOpen] = useState(false);
  // Kütüphaneden "yeni hareket" ile gelindiğinde kapanışta oraya dönülür.
  const [pickerReturnsToLibrary, setPickerReturnsToLibrary] = useState(false);

  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newCustomExercise, setNewCustomExercise] = useState('');
  const [newExContribs, setNewExContribs] = useState({});
  const [newExMechanics, setNewExMechanics] = useState('Push');

  const [settings, setSettings] = useState(initial.settings);
  const [metricsHistory, setMetricsHistory] = useState(initial.metricsHistory);
  const [currentMetricsForm, setCurrentMetricsForm] = useState(initial.currentMetricsForm);

  const [nutritionHistory, setNutritionHistory] = useState(initial.nutritionHistory);
  const [currentNutritionForm, setCurrentNutritionForm] = useState(initial.currentNutritionForm);

  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: null, id: null });
  const [rest, setRest] = useState(null);
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);

  const [analysisExercise, setAnalysisExercise] = useState('');
  const [bodyMetricKey, setBodyMetricKey] = useState('weight');

  const [lastBackupDate, setLastBackupDate] = useState(initial.lastBackupDate);
  const [isMeasurementGuideOpen, setIsMeasurementGuideOpen] = useState(false);

  const [toast, setToast] = useState(null);
  const [lockScreenOn, setLockScreenOn] = useState(false);

  const [todayTime] = useState(() => Date.now());

  const activeWorkoutRef = useRef(activeWorkout);
  const restRef = useRef(rest);
  const repsOnFocusRef = useRef(null);

  useEffect(() => { activeWorkoutRef.current = activeWorkout; }, [activeWorkout]);
  useEffect(() => { restRef.current = rest; }, [rest]);

  // Hata tostu daha uzun durur: veri kaybı uyarısını kaçırmak kritik.
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), type === 'error' ? 6000 : 3000);
  }, []);

  // Kayıt hatalarını tek toasta indirger: sekiz effect aynı kota hatasına
  // takıldığında kullanıcı sekiz uyarı görmemeli.
  const notifyPersistError = useMemo(
    () => createErrorThrottle((message) => showToast(message, 'error')),
    [showToast]);

  const persist = useCallback(
    (name, value) => safeSetItem(storageKey(name), value, notifyPersistError),
    [notifyPersistError]);

  // Kayıtları kalıcı belleğe kaydetme. Yazma başarısız olursa (kota dolu veya
  // depolama kapalı) kullanıcı uyarılır — sessizce yutulursa veri kaybını fark
  // etmeden antrenman girmeye devam eder.
  useEffect(() => { persist('workouts', workouts); }, [workouts, persist]);
  useEffect(() => { persist('templates', templates); }, [templates, persist]);
  useEffect(() => { persist('custom_exercises', customExercises); }, [customExercises, persist]);
  useEffect(() => { persist('custom_foods', customFoods); }, [customFoods, persist]);
  useEffect(() => { persist('active_workout', activeWorkout); }, [activeWorkout, persist]);
  useEffect(() => { persist('metrics', metricsHistory); }, [metricsHistory, persist]);
  useEffect(() => { persist('nutrition', nutritionHistory); }, [nutritionHistory, persist]);
  useEffect(() => { persist('settings', settings); }, [settings, persist]);

  // Dinlenme sayacı
  useEffect(() => {
    if (!rest) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((rest.endsAt - Date.now()) / 1000));
      setRestSecondsLeft(remaining);
      if (remaining === 0) {
        setRest(null);
        if (settings.restAlert) playRestAlert();
        vibrateAlert();
      }
    };
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [rest, settings.restAlert]);


  // Antrenman işlemleri
  const startRest = useCallback((seconds) => {
    const total = Math.max(1, Math.round(seconds));
    setRest({ endsAt: Date.now() + total * 1000, total });
    setRestSecondsLeft(total);
  }, []);

  const stopRest = useCallback(() => {
    setRest(null);
    setRestSecondsLeft(0);
  }, []);

  const allExercisesNames = useMemo(() => {
    const customNames = customExercises.map(ex => typeof ex === 'object' ? ex.name : ex);
    return Array.from(new Set([...DEFAULT_EXERCISES, ...customNames])).sort();
  }, [customExercises]);

  // Daha önce en az bir kez yapılmış hareketler. Seçim listesinin varsayılan
  // içeriği bu; kalan ~100 hareket arama çubuğundan bulunur.
  const performedNames = useMemo(() => {
    const s = new Set();
    workouts.forEach(w => (w.exercises || []).forEach(ex => { if (ex?.name) s.add(ex.name); }));
    return s;
  }, [workouts]);

  // Yerleşik veritabanında olmayan her ad kullanıcının kendi eklediğidir.
  // Yerleşik bir hareketin kas eşlemesini düzenlemek de customExercises'a kayıt
  // yazar, bu yüzden "customExercises içinde mi" sorusu bu ayrımı yapamaz.
  const isUserAddedExercise = useCallback(
    (name) => !DEFAULT_EXERCISES.includes(name), []);

  // Seçim listesinde görünmeyecek hareketler.
  const pickerHiddenNames = useMemo(() => {
    const hidden = new Set(settings.hiddenExercises || []);
    const pinned = new Set(settings.pinnedExercises || []);
    const out = new Set();
    allExercisesNames.forEach(name => {
      if (hidden.has(name)) { out.add(name); return; }
      if (!performedNames.has(name) && !pinned.has(name)) out.add(name);
    });
    return out;
  }, [allExercisesNames, performedNames, settings.hiddenExercises, settings.pinnedExercises]);

  const filteredExercises = useMemo(() => {
    const query = foldForSearch(exerciseSearchQuery).trim();
    if (query) return allExercisesNames.filter(ex => foldForSearch(ex).includes(query));
    if (settings.pickerShowAll) return allExercisesNames;
    const shortlist = allExercisesNames.filter(ex => !pickerHiddenNames.has(ex));
    // Hiç antrenman geçmişi olmayan kullanıcı boş listeyle karşılaşmasın.
    return shortlist.length ? shortlist : allExercisesNames;
  }, [allExercisesNames, exerciseSearchQuery, pickerHiddenNames, settings.pickerShowAll]);

  // Tarihe göre azalan sıralı listeler: hem arşiv görünümü hem de "en son ne yaptım"
  // sorguları bunlara dayanır, böylece kayıt sırasından bağımsız olarak doğru çalışır.
  const sortedWorkouts = useMemo(() => sortByDateDesc(workouts), [workouts]);
  const sortedMetrics = useMemo(() => sortByDateDesc(metricsHistory), [metricsHistory]);
  const sortedNutrition = useMemo(() => sortByDateDesc(nutritionHistory), [nutritionHistory]);

  const personalRecords = useMemo(() => {
    return buildPersonalRecords(workouts, activeWorkout?.id);
  }, [workouts, activeWorkout?.id]);

  // Gerçek (adaptif) TDEE: ölçülen kilo değişimi + kaydedilen alım.
  // Formül BMR yalnızca bir tahmindir; bu hesap gerçek harcamayı doğrudan ölçer.
  const adaptiveTDEE = useMemo(
    () => computeAdaptiveTDEE(metricsHistory, nutritionHistory),
    [metricsHistory, nutritionHistory]
  );

  const computedComp = useMemo(() => {
    return computeComposition(currentMetricsForm);
  }, [currentMetricsForm]);

  const dashboardStats = useMemo(() => {
    const monday = getMondayOfCurrentWeek();
    const thisWeekWorkouts = workouts.filter(w => new Date(w.date) >= monday);
    const thisWeekSessions = thisWeekWorkouts.length;
    const thisWeekEffectiveSets = thisWeekWorkouts.reduce((sum, w) => sum + calcEffectiveSets(w.exercises), 0);

    const muscleVolume = Object.fromEntries(MUSCLE_GROUPS.map(m => [m, 0]));

    // Her çalışma seti, hareketin katkı tablosundaki ağırlıkla ilgili kaslara yazılır:
    // birincil kas 1, belirgin yardımcılar 0.5, hafif katkılar 0.25 set sayılır.
    thisWeekWorkouts.forEach(w => {
      (w.exercises || []).forEach(ex => {
        const { contributions } = detectMuscleGroup(ex.name, customExercises);
        const count = (ex.sets || []).filter(isWorkingSet).length;
        if (count === 0) return;

        Object.entries(contributions || {}).forEach(([muscle, weight]) => {
          if (muscleVolume[muscle] !== undefined) {
            muscleVolume[muscle] += count * weight;
          } else if (import.meta.env.DEV) {
            // Bu koruma bir sürüm boyunca geçersiz kas adlarını gizledi.
            console.warn('[hacim] tanınmayan kas grubu:', muscle, '·', ex.name);
          }
        });
      });
    });

    // Yarım set katkıları ondalık biriktirdiği için yuvarlanır.
    Object.keys(muscleVolume).forEach(m => {
      muscleVolume[m] = Math.round(muscleVolume[m] * 4) / 4;
    });

    // Deload kararı kasa özel MRV tavanına göre verilir, sabit bir eşiğe göre değil.
    const isDeloadNeeded = Object.entries(muscleVolume).some(
      ([muscle, volume]) => volume > getVolumeLandmarks(muscle, settings.experienceLevel).mrv
    );

    // İtme/çekme dengesi: bu haftaki etkili setlerin mekanik dağılımı.
    let pushSets = 0;
    let pullSets = 0;
    thisWeekWorkouts.forEach(w => {
      (w.exercises || []).forEach(ex => {
        const { mechanics } = detectMuscleGroup(ex.name, customExercises);
        const effective = calcEffectiveSets([ex]);
        if (mechanics === 'Push') pushSets += effective;
        else if (mechanics === 'Pull') pullSets += effective;
      });
    });
    // Hiç çekme yapılmamışken oran sayısal olarak tanımsızdır; bu durumu
    // "dengeli" saymamak için denge bilgisi ayrı bir bayrakla taşınır.
    const hasPushPullData = pushSets > 0 || pullSets > 0;
    const pushPullRatio = pullSets > 0
      ? (pushSets / pullSets).toFixed(2)
      : (pushSets > 0 ? 'Çekme yok' : '—');
    const pushPullBalanced = pullSets > 0 && pushSets > 0
      ? (pushSets / pullSets) <= 1.5 && (pullSets / pushSets) <= 1.5
      : !hasPushPullData;

    // ACWR (akut:kronik yük oranı). Akut = son 7 gün, kronik = son 28 günün
    // haftalık ortalaması. 0.8-1.3 aralığı güvenli kabul edilir.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let acuteLoad = 0;
    let chronicLoad = 0;
    workouts.forEach(w => {
      const wDate = new Date(w.date);
      wDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today - wDate) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return; // gelecek tarihli kayıtlar sayılmaz
      // Seans yükü: sRPE benzeri — zorluk derecesi × etkili set sayısı
      const load = (w.rating || 3) * calcEffectiveSets(w.exercises);
      if (diffDays <= 7) acuteLoad += load;
      if (diffDays <= 28) chronicLoad += load;
    });
    const averageChronic = chronicLoad / 4;
    const acwr = averageChronic > 0 ? (acuteLoad / averageChronic).toFixed(2) : '0.00';

    return {
      thisWeekSessions,
      thisWeekEffectiveSets,
      muscleVolume,
      isDeloadNeeded,
      acwr,
      pushPullRatio,
      pushPullBalanced,
      hasPushPullData
    };
  }, [workouts, customExercises, settings.experienceLevel]);

  // Kas başına haftalık hacmin hangi hareketlerden geldiği.
  // Hacim hesabıyla aynı kuralları izler: yalnızca çalışma setleri, katkı ağırlığıyla.
  const muscleBreakdown = useMemo(() => {
    const monday = getMondayOfCurrentWeek();
    const byMuscle = {};

    workouts
      .filter(w => new Date(w.date) >= monday)
      .forEach(w => {
        (w.exercises || []).forEach(ex => {
          const { contributions } = detectMuscleGroup(ex.name, customExercises);
          const sets = (ex.sets || []).filter(isWorkingSet).length;
          if (sets === 0) return;

          Object.entries(contributions || {}).forEach(([muscle, weight]) => {
            const bucket = (byMuscle[muscle] ||= {});
            const entry = (bucket[ex.name] ||= { exerciseName: ex.name, weight, sets: 0, contributed: 0, dates: [] });
            entry.sets += sets;
            entry.contributed = Math.round(entry.sets * weight * 4) / 4;
            if (!entry.dates.includes(w.date)) entry.dates.push(w.date);
          });
        });
      });

    // Her kasın listesi katkısı büyükten küçüğe sıralanır.
    return Object.fromEntries(
      Object.entries(byMuscle).map(([muscle, items]) => [
        muscle,
        Object.values(items).sort((a, b) => b.contributed - a.contributed)
      ])
    );
  }, [workouts, customExercises]);

  const handleSelectExercise = useCallback((exerciseName) => {
    setActiveWorkout(prev => {
      if (!prev) return prev;
      const newExerciseId = generateId();
      const initialSet = { id: generateId(), weight: '', reps: '', rir: 2, tempo: '', formRating: 8, setType: 'normal' };
      return {
        ...prev,
        activeExerciseId: newExerciseId,
        exercises: [...(prev?.exercises || []), { id: newExerciseId, name: exerciseName, sets: [initialSet] }]
      };
    });
    setIsExerciseModalOpen(false);
    setExerciseSearchQuery('');
  }, []);

  const addSet = useCallback((exerciseId) => {
    setActiveWorkout(prev => ({
      ...prev, activeExerciseId: exerciseId, exercises: (prev?.exercises || []).map(ex => {
        if (ex.id === exerciseId) {
          const lastSet = ex.sets[ex.sets.length - 1] || { weight: '', reps: '', rir: 2, tempo: '', formRating: 8, setType: 'normal' };
          const newSet = settings.autoCopyLastSet
            ? { ...lastSet, id: generateId() }
            : { id: generateId(), weight: '', reps: '', rir: 2, tempo: '', formRating: 8, setType: 'normal' };
          return { ...ex, sets: [...ex.sets, newSet] };
        }
        return ex;
      })
    }));
  }, [settings.autoCopyLastSet]);

  const updateSet = useCallback((exerciseId, setId, field, value) => {
    setActiveWorkout(prev => ({
      ...prev,
      activeExerciseId: exerciseId,
      exercises: (prev?.exercises || []).map(ex => ex.id === exerciseId
        ? { ...ex, sets: (ex.sets || []).map(s => s.id === setId ? { ...s, [field]: value } : s) } : ex)
    }));
  }, []);

  const removeSet = useCallback((exerciseId, setId) => {
    setActiveWorkout(prev => ({ ...prev, exercises: (prev?.exercises || []).map(ex => ex.id === exerciseId ? { ...ex, sets: (ex.sets || []).filter(s => s.id !== setId) } : ex) }));
  }, []);

  // Sıralı liste üzerinden gezilir: sırasız bir dizide ilk eşleşme en eski seans olur
  // ve "geçen antrenman" bilgisi ile progresyon önerisi yanlış çıkardı.
  const getRecentExerciseData = useCallback((exerciseName) => {
    for (const w of sortedWorkouts) {
      if (w.id === activeWorkout?.id) continue;
      const ex = (w.exercises || []).find(e => e.name === exerciseName);
      if (ex && Array.isArray(ex.sets) && ex.sets.some(s => isWorkingSet(s) && parseNumber(s.reps) > 0)) {
        return { date: w.date, sets: ex.sets.filter(isWorkingSet) };
      }
    }
    return null;
  }, [sortedWorkouts, activeWorkout?.id]);

  // iOS Lock Screen entegrasyonu
  const activeWorkoutId = activeWorkout?.id;
  const isEditingOldWorkout = activeWorkout?.isEditingOld;
  const currentExerciseName = activeWorkout?.exercises?.find(e => e.id === activeWorkout.activeExerciseId)?.name;
  const timerStatus = activeWorkout?.timer?.status;

  useEffect(() => {
    if (!lockScreenOn || !activeWorkoutId || isEditingOldWorkout) return;

    const pushUpdate = () => {
      const workout = activeWorkoutRef.current;
      if (!workout) return;

      const exercises = workout.exercises || [];
      const activeIdx = exercises.findIndex(e => e.id === workout.activeExerciseId);
      const active = activeIdx >= 0 ? exercises[activeIdx] : exercises[exercises.length - 1];
      const history = active ? getRecentExerciseData(active.name) : null;

      const totalExercises = Math.max(1, exercises.length);
      const exerciseIndex = activeIdx >= 0 ? activeIdx + 1 : totalExercises;

      const currentSets = active?.sets || [];
      const completedSetsCount = currentSets.filter(s => parseNumber(s.reps) > 0 || parseNumber(s.weight) > 0).length;
      const totalSetsCount = Math.max(1, currentSets.length);

      let elapsed = workout.timer?.accumulatedSeconds || 0;
      if (workout.timer?.status === 'running' && workout.timer.startTime) {
        elapsed += Math.floor((Date.now() - workout.timer.startTime) / 1000);
      }

      const currentRest = restRef.current;
      const secondsLeft = currentRest ? Math.max(0, Math.ceil((currentRest.endsAt - Date.now()) / 1000)) : 0;

      const { muscle } = active ? detectMuscleGroup(active.name, customExercises) : {};
      const target = history ? suggestNextTarget(history.sets, settings, muscle) : null;
      const partner = active?.supersetId
        ? exercises.find(e => e.supersetId === active.supersetId && e.id !== active.id)
        : null;

      updateLockScreenActivity({
        elapsedSeconds: elapsed,
        exerciseName: active?.name || '',
        previousSets: (history?.sets || []).filter(isWorkingSet),
        previousDate: history ? new Date(history.date).toLocaleDateString('tr-TR') : '',
        effectiveSets: calcEffectiveSets(exercises),
        isPaused: workout.timer?.status !== 'running',
        restSecondsLeft: secondsLeft,
        restTotalSeconds: currentRest?.total || 0,
        exerciseIndex,
        totalExercises,
        completedSetsCount,
        totalSetsCount,
        // Bugünkü hedef ve süperset eşi kilit ekranından da görünsün.
        targetText: target ? `${target.weight} kg × ${target.reps}` : '',
        supersetName: partner?.name || '',
      });
    };

    pushUpdate();
    const interval = setInterval(pushUpdate, 1000);

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        pushUpdate();
      } else if (settings.keepScreenAwake) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [lockScreenOn, activeWorkoutId, isEditingOldWorkout, currentExerciseName, timerStatus, rest,
      settings, customExercises, getRecentExerciseData]);


  const handleStartRequest = useCallback((templateOrWorkout = null) => {
    setPreWorkoutModal({ template: templateOrWorkout });
  }, []);

  const confirmStartWorkout = () => {
    const template = preWorkoutModal?.template;
    const todayStr = getLocalDateString();
    const readinessScore = readinessForm.sleep + (6 - readinessForm.stress) + (6 - readinessForm.soreness);

    // Süperset bağları ve set yapısı şablondan aynen taşınır.
    const initialExercises = template ? templateToExercises(template, generateId) : [];

    const newWorkout = {
      id: generateId(),
      date: todayStr,
      name: template?.name || 'Serbest Antrenman',
      exercises: initialExercises,
      activeExerciseId: initialExercises[0]?.id || null,
      readiness: { ...readinessForm, score: readinessScore },
      timer: { status: 'running', startTime: Date.now(), accumulatedSeconds: 0 },
      rating: 4,
      notes: ''
    };

    setActiveWorkout(newWorkout);
    setPreWorkoutModal(null);

    if (initialExercises.length === 0) {
      setIsExerciseModalOpen(true);
    }

    if (settings.lockScreenActivity) {
      try {
        startLockScreenActivity({
          onPause: () => setActiveWorkout(p => p ? { ...p, timer: { ...p.timer, status: 'paused' } } : p),
          onResume: () => setActiveWorkout(p => p ? { ...p, timer: { ...p.timer, status: 'running', startTime: Date.now() } } : p)
        }).then(ok => setLockScreenOn(!!ok)).catch(() => setLockScreenOn(false));
      } catch {
        setLockScreenOn(false);
      }
    }
  };

  const confirmSaveWorkout = () => {
    if (!activeWorkout) return;
    let finalDuration = activeWorkout.duration;
    if (!finalDuration && activeWorkout.timer) {
      let secs = activeWorkout.timer.accumulatedSeconds || 0;
      if (activeWorkout.timer.status === 'running' && activeWorkout.timer.startTime) {
        secs += Math.floor((Date.now() - activeWorkout.timer.startTime) / 1000);
      }
      finalDuration = Math.max(1, Math.round(secs / 60));
    }

    const saved = { ...activeWorkout, duration: finalDuration || 45, timer: { status: 'finished' } };

    setWorkouts(prev => {
      const idx = prev.findIndex(w => w.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });

    stopLockScreenActivity();
    setLockScreenOn(false);
    setActiveWorkout(null);
    setIsEndWorkoutModalOpen(false);
    showToast('Antrenman kaydedildi.');
  };

  const handleSaveMetrics = () => {
    if (!currentMetricsForm.date) { showToast('Önce bir tarih seç.'); return; }

    let updated = false;
    setMetricsHistory(prev => {
      const idx = prev.findIndex(m => m.date === currentMetricsForm.date);
      if (idx >= 0) {
        updated = true;
        const next = [...prev];
        // Mevcut kaydın kimliği korunur; aksi halde aynı güne ikinci bir kayıt
        // gibi davranıp geçmişteki referanslar kopardı.
        next[idx] = { ...currentMetricsForm, id: prev[idx].id };
        return next;
      }
      return [{ ...currentMetricsForm, id: currentMetricsForm.id || generateId() }, ...prev];
    });
    showToast(updated ? 'Ölçüm güncellendi.' : 'Ölçüm kaydedildi.');
  };

  // Geçmişteki bir ölçümü ölçüm sayfasında düzenlemeye açar.
  const handleEditMetric = useCallback((metric) => {
    setCurrentMetricsForm(mergeMetrics(metric));
    setView('profile');
    showToast('Ölçüm düzenleniyor.');
  }, [showToast]);

  // Geçmişteki bir beslenme kaydını beslenme sayfasında düzenlemeye açar.
  const handleEditNutrition = useCallback((entry) => {
    setCurrentNutritionForm(mergeNutrition(entry));
    setView('nutrition');
    showToast('Beslenme kaydı düzenleniyor.');
  }, [showToast]);

  const handleSaveNutrition = () => {
    setNutritionHistory(prev => {
      const idx = prev.findIndex(n => n.date === currentNutritionForm.date);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = currentNutritionForm;
        return next;
      }
      return [currentNutritionForm, ...prev];
    });
    showToast('Beslenme kaydedildi.');
  };

  const handleEditOldWorkoutDate = (workoutId, newDate) => {
    setWorkouts(prev => prev.map(w => w.id === workoutId ? { ...w, date: newDate } : w));
  };

  // Geçmiş bir seansı düzenlemek için aktif antrenman ekranına yükler.
  // isEditingOld işaretiyle kronometre çalışmaz ve kilit ekranı kartı açılmaz;
  // kaydedildiğinde yeni kayıt eklenmez, mevcut kaydın üzerine yazılır.
  const handleEditOldWorkout = useCallback((workout) => {
    const copy = JSON.parse(JSON.stringify(workout));
    setActiveWorkout({
      ...copy,
      isEditingOld: true,
      activeExerciseId: copy.exercises?.[0]?.id || null,
      timer: {
        status: 'paused',
        startTime: null,
        accumulatedSeconds: Math.max(0, Math.round((copy.duration || 0) * 60))
      }
    });
    showToast('Geçmiş antrenman düzenleniyor.');
  }, [showToast]);

  // Geçmiş bir seansı bugün için şablon olarak tekrarlar.
  const handleRepeatWorkout = useCallback((workout) => {
    setPreWorkoutModal({ template: workout });
  }, []);

  // --- SÜPERSET ---
  // Model olabildiğince basit: bir hareket, kendisinden SONRA gelen hareketle
  // eşleşir ve ikisi aynı supersetId'yi paylaşır. Bağı koparmak ikisini de
  // serbest bırakır. Üçlü/dörtlü grup gerekmediği için ayrı bir yapı kurulmadı.
  const handleToggleSuperset = useCallback((exerciseId) => {
    setActiveWorkout(prev => {
      if (!prev) return prev;
      const list = prev.exercises || [];
      const i = list.findIndex(e => e.id === exerciseId);
      if (i < 0) return prev;

      const current = list[i];

      // Zaten bağlıysa: aynı gruptaki tüm hareketleri serbest bırak.
      if (current.supersetId) {
        return {
          ...prev,
          exercises: list.map(e => e.supersetId === current.supersetId ? { ...e, supersetId: null } : e)
        };
      }

      const next = list[i + 1];
      if (!next || next.supersetId) return prev; // eşleşecek serbest hareket yok

      const groupId = generateId();
      return {
        ...prev,
        exercises: list.map((e, idx) =>
          idx === i || idx === i + 1 ? { ...e, supersetId: groupId } : e)
      };
    });
  }, []);

  // --- ŞABLONLAR ---

  // Aktif veya geçmiş bir antrenmanı şablona çevirir.
  const handleSaveAsTemplate = useCallback((workout) => {
    const source = workout || activeWorkoutRef.current;
    if (!source) return;
    const suggested = source.name && source.name !== 'Serbest Antrenman'
      ? source.name
      : suggestTemplateName(source.exercises, customExercises);
    const template = workoutToTemplate(source, suggested, generateId);
    if (template.exercises.length === 0) {
      showToast('Şablon için en az bir dolu set gerekiyor.');
      return;
    }
    setTemplates(prev => [template, ...prev]);
    showToast(`"${suggested}" şablon olarak kaydedildi.`);
  }, [customExercises, showToast]);


  // --- HAREKET KAS EŞLEMESİ ---

  // Yerleşik hareketler de düzenlenebilir: kayıt customExercises içine aynı ADLA
  // yazılır, detectMuscleGroup önce oraya baktığı için yerleşik kuralı ezer.
  const handleSaveExerciseMapping = useCallback((name, { contributions, mechanics }) => {
    const primary = Object.entries(contributions).sort((a, b) => b[1] - a[1])[0]?.[0];
    setCustomExercises(prev => {
      const rest = prev.filter(ex => (typeof ex === 'object' ? ex.name : ex) !== name);
      return [...rest, { name, contributions, muscle: primary, mechanics, schema: 2 }];
    });
    setEditorExercise(null);
    showToast('Kas eşlemesi kaydedildi.');
  }, [showToast]);

  const handleResetExerciseMapping = useCallback((name) => {
    setCustomExercises(prev => prev.filter(ex => (typeof ex === 'object' ? ex.name : ex) !== name));
    setEditorExercise(null);
    showToast('Varsayılan eşlemeye dönüldü.');
  }, [showToast]);

  // --- HAREKET KÜTÜPHANESİ ---

  const getExerciseContributions = useCallback(
    (name) => detectMuscleGroup(name, customExercises).contributions,
    [customExercises]);

  // Tek düğme iki listeyi birden yönetir: görünürse gizlenenlere, gizliyse
  // sabitlenenlere yazılır. Böylece hem "yaptım ama listede istemiyorum" hem de
  // "hiç yapmadım ama listede dursun" durumu tek dokunuşla kurulur.
  const handleTogglePickerVisibility = useCallback((name) => {
    setSettings(prev => {
      const hidden = new Set(prev.hiddenExercises || []);
      const pinned = new Set(prev.pinnedExercises || []);
      const wasVisible = !hidden.has(name) && (performedNames.has(name) || pinned.has(name));
      if (wasVisible) { hidden.add(name); pinned.delete(name); }
      else { hidden.delete(name); if (!performedNames.has(name)) pinned.add(name); }
      return { ...prev, hiddenExercises: [...hidden], pinnedExercises: [...pinned] };
    });
  }, [performedNames]);

  const handleDeleteExercise = useCallback((name) => {
    setCustomExercises(prev => prev.filter(ex => (typeof ex === 'object' ? ex.name : ex) !== name));
    setSettings(prev => ({
      ...prev,
      hiddenExercises: (prev.hiddenExercises || []).filter(n => n !== name),
      pinnedExercises: (prev.pinnedExercises || []).filter(n => n !== name),
    }));
    showToast(`"${name}" silindi. Geçmiş antrenman kayıtları korundu.`);
  }, [showToast]);

  // Program oluşturucu her dolu günü ayrı bir şablon yapar: uygulamanın şablon
  // modeli tek seanslık, program adı gün adının önüne eklenir.
  // Var olan şablonu günceller. Set sayısı değişse bile eski setlerin ağırlık ve
  // tekrar bilgisi korunur — şablonlar bir sonraki seansın başlangıç değerlerini
  // taşıyor, sıfırlamak kullanıcının girdiği veriyi çöpe atmak olurdu.
  const handleUpdateTemplate = useCallback((templateId, name, exercises) => {
    setTemplates(prev => prev.map(t => {
      if (t.id !== templateId) return t;
      const oldByName = new Map((t.exercises || []).map(ex => [ex.name, ex.sets || []]));
      return {
        ...t,
        name: name || t.name,
        exercises: exercises.map(ex => {
          const old = oldByName.get(ex.name) || [];
          return {
            name: ex.name,
            sets: Array.from({ length: ex.sets }, (_, i) => old[i]
              ? { ...old[i], id: old[i].id || generateId() }
              : { id: generateId(), weight: '', reps: '', rir: 2, tempo: '', formRating: 8, setType: 'normal' }),
          };
        }),
      };
    }));
    showToast('Şablon güncellendi.');
  }, [showToast]);

  const handleSaveProgram = useCallback((programName, days) => {
    const created = days
      .filter(d => d.exercises.length > 0)
      .map(d => ({
        id: generateId(),
        name: `${programName} — ${d.name}`,
        createdAt: new Date().toISOString(),
        exercises: d.exercises.map(ex => ({
          name: ex.name,
          sets: Array.from({ length: ex.sets }, () => ({
            id: generateId(), weight: '', reps: '', rir: 2, tempo: '', formRating: 8, setType: 'normal'
          })),
        })),
      }));
    if (created.length === 0) return;
    setTemplates(prev => [...created, ...prev]);
    showToast(`${created.length} günlük "${programName}" programı kaydedildi.`);
  }, [showToast]);

  const closeExercisePicker = useCallback(() => {
    setIsExerciseModalOpen(false);
    setIsAddingCustom(false);
    setNewCustomExercise('');
    setNewExContribs({});
    setExerciseSearchQuery('');
    if (pickerReturnsToLibrary) {
      setPickerReturnsToLibrary(false);
      setIsLibraryOpen(true);
    }
  }, [pickerReturnsToLibrary]);

  const handleExportData = () => {
    const backup = {
      version: '0.5.0',
      exportedAt: new Date().toISOString(),
      workouts, templates, customExercises, customFoods, metricsHistory, nutritionHistory, settings
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ProOverload_Backup_${getLocalDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    const today = getLocalDateString();
    setLastBackupDate(today);
    // Yedek tarihi yazılamazsa yalnızca "yedekleme uyarısı" erken görünür;
    // dosya zaten indi, bu yüzden hata kullanıcıya ayrıca bildirilmiyor.
    safeSetRawItem('po_last_backup', today);
    showToast('Yedek indirildi.');
  };

  const handleImportFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (data && typeof data === 'object') {
          handleImportData(data);
        }
      } catch {
        showToast('Yedek dosyası okunamadı.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleImportData = (data) => {
    // Antrenman ve şablonlar da ölçüm/beslenme gibi normalize edilir: bozuk
    // şekilli bir yedek (örn. `workouts: [{}]`) doğrudan state'e girerse
    // aşağıdaki hacim/tonaj hesapları eksik alanlarla çalışmak zorunda kalır.
    if (Array.isArray(data.workouts || data.w)) setWorkouts((data.workouts || data.w).map(mergeWorkout));
    if (Array.isArray(data.templates || data.t)) setTemplates((data.templates || data.t).map(mergeTemplate));
    // Sürüm damgasına değil şekle bakılır: göç idempotent olduğu için yeni
    // yedekler dokunulmadan geçer, eski yedekler taşınır.
    // Yerelde oluşturulmuş kayıtlar silinmesin diye isimle birleştirilir.
    if (Array.isArray(data.customExercises)) {
      const incoming = migrateCustomExercises(data.customExercises);
      setCustomExercises(prev => {
        const byName = new Map(prev.map(ex => [typeof ex === 'object' ? ex.name : ex, ex]));
        incoming.forEach(ex => byName.set(typeof ex === 'object' ? ex.name : ex, ex));
        return [...byName.values()];
      });
    }
    if (Array.isArray(data.customFoods)) {
      setCustomFoods(prev => {
        const byName = new Map(prev.map(f => [f.name, f]));
        data.customFoods.forEach(f => byName.set(f.name, f));
        return [...byName.values()];
      });
    }
    if (Array.isArray(data.metricsHistory || data.m)) setMetricsHistory((data.metricsHistory || data.m).map(mergeMetrics));
    if (Array.isArray(data.nutritionHistory || data.n)) setNutritionHistory((data.nutritionHistory || data.n).map(mergeNutrition));
    // Eski yedekler eksik/bozuk ayar taşıyabilir; aynı birleştirme kuralından geçirilir.
    if (data.settings || data.s) setSettings(prev => mergeSettings({ ...prev, ...(data.settings || data.s) }));
    showToast('Veriler başarıyla yüklendi.');
  };

  const handleDeleteConfirmExecute = () => {
    const { type, id } = deleteConfirm;
    if (!type || !id) return;

    if (type === 'template') {
      setTemplates(prev => prev.filter(t => t.id !== id));
      // Plana atanmış şablon silinirse o gün dinlenmeye döner, yoksa plan
      // var olmayan bir kimliği gösterip boş kalırdı.
      setSettings(prev => {
        const plan = prev.weekPlan || {};
        if (!Object.values(plan).includes(id)) return prev;
        const next = {};
        Object.entries(plan).forEach(([k, v]) => { next[k] = v === id ? null : v; });
        return { ...prev, weekPlan: next };
      });
      setDeleteConfirm({ isOpen: false, type: null, id: null });
      showToast('Şablon silindi.');
      return;
    }

    if (type === 'exercise') {
      handleDeleteExercise(id);
      setDeleteConfirm({ isOpen: false, type: null, id: null });
      return;
    }

    if (type === 'workout') setWorkouts(prev => prev.filter(w => w.id !== id));
    else if (type === 'metric') setMetricsHistory(prev => prev.filter(m => m.id !== id));
    else if (type === 'nutrition') setNutritionHistory(prev => prev.filter(n => n.id !== id));

    setDeleteConfirm({ isOpen: false, type: null, id: null });
    showToast('Kayıt silindi.');
  };

  const handleNutritionDateChange = (date) => {
    const existing = nutritionHistory.find(n => n.date === date);
    if (existing) setCurrentNutritionForm(mergeNutrition(existing));
    else setCurrentNutritionForm(mergeNutrition({ date: date }));
  };

  // Beslenme sekmesi her zaman bugünle açılır. Geçmiş bir günü Geçmiş
  // bölümünden düzenledikten sonra sekmeye dönünce eski günde takılı kalmasın.
  const handleChangeView = useCallback((next) => {
    if (next === 'nutrition') {
      const today = getLocalDateString();
      setCurrentNutritionForm(prev => {
        if (prev.date === today) return prev;
        const existing = nutritionHistory.find(n => n.date === today);
        return mergeNutrition(existing || { date: today });
      });
    }
    setView(next);
  }, [nutritionHistory]);

  // --- KARDİYO ---

  // Kalori tahmini vücut ağırlığına dayanır; en son girilen ölçüm kullanılır.
  const latestWeight = useMemo(() => {
    const rec = sortedMetrics.find(m => parseNumber(m.weight) > 0);
    return rec ? parseNumber(rec.weight) : 0;
  }, [sortedMetrics]);

  // Aktif antrenman varsa oraya yazılır; yoksa bugünün kardiyo kaydına eklenir
  // (yoksa oluşturulur), böylece basketbol/koşu için seans başlatmak gerekmez.
  const handleAddCardio = useCallback((entry) => {
    const item = { id: generateId(), ...entry };
    if (activeWorkoutRef.current) {
      setActiveWorkout(prev => prev ? { ...prev, cardio: [...(prev.cardio || []), item] } : prev);
      showToast('Kardiyo antrenmana eklendi.');
      return;
    }
    const today = getLocalDateString();
    setWorkouts(prev => {
      const idx = prev.findIndex(w => w.date === today && (w.exercises || []).length === 0 && w.cardio);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], cardio: [...(next[idx].cardio || []), item] };
        return next;
      }
      return [{
        id: generateId(), date: today, name: 'Kardiyo', duration: 0,
        exercises: [], cardio: [item], timer: { status: 'finished' },
      }, ...prev];
    });
    showToast('Kardiyo bugüne kaydedildi.');
  }, [showToast]);

  const handleDeleteCardio = useCallback((entryId) => {
    if (activeWorkoutRef.current) {
      setActiveWorkout(prev => prev ? { ...prev, cardio: (prev.cardio || []).filter(c => c.id !== entryId) } : prev);
      return;
    }
    const today = getLocalDateString();
    setWorkouts(prev => prev
      .map(w => w.date === today && w.cardio
        ? { ...w, cardio: w.cardio.filter(c => c.id !== entryId) }
        : w)
      // Son kardiyo da silinince boş kayıt geride kalmasın.
      .filter(w => (w.exercises || []).length > 0 || (w.cardio || []).length > 0));
  }, []);

  // Kardiyo penceresinde listelenecek girişler: aktif seans varsa onunkiler.
  const cardioEntries = useMemo(() => {
    if (activeWorkout) return activeWorkout.cardio || [];
    const today = getLocalDateString();
    return workouts.find(w => w.date === today && w.cardio)?.cardio || [];
  }, [activeWorkout, workouts]);

  // Bu haftaki toplam kardiyo kalorisi (dinlenme üstü).
  const weeklyCardioKcal = useMemo(() => {
    const monday = getMondayOfCurrentWeek();
    return workouts
      .filter(w => new Date(w.date) >= monday)
      .reduce((sum, w) => sum + totalCardioCalories(w.cardio || [], latestWeight), 0);
  }, [workouts, latestWeight]);

  const needsBackup = useMemo(() => {
    if (!lastBackupDate) return true;
    const diffDays = (todayTime - new Date(lastBackupDate).getTime()) / (1000 * 3600 * 24);
    return diffDays > 7;
  }, [lastBackupDate, todayTime]);

  return (
    <div className="flex justify-center bg-black min-h-screen font-sans antialiased text-zinc-100 select-none">
      <div className="w-full max-w-[420px] bg-zinc-950 h-[100dvh] flex flex-col relative overflow-hidden shadow-2xl">

        {/* TOAST BİLDİRİMİ */}
        {toast && (
          <div className={`absolute top-4 left-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-start space-x-2 text-xs font-mono animate-in fade-in slide-in-from-top-4 ${
            toast.type === 'error'
              ? 'bg-red-950/95 border border-red-800 text-red-100'
              : 'bg-zinc-900 border border-zinc-700 text-zinc-100'
          }`}>
            {toast.type === 'error'
              ? <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              : <Activity size={14} className="text-cyan-400 shrink-0 mt-0.5" />}
            <span className="leading-relaxed">{toast.message}</span>
          </div>
        )}

        {/* HEADER */}
        <header className="bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 pt-safe flex justify-between items-center z-10 shadow-lg shadow-black/40">
          <div className="px-4 py-3.5 flex items-center space-x-2">
            <div className="p-1.5 bg-cyan-950/50 border border-cyan-800/50 rounded-xl">
              <Activity size={16} className="text-cyan-400 animate-pulse" />
            </div>
            <h1 className="text-sm font-black tracking-widest uppercase bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-500 bg-clip-text text-transparent">
              Hypertrophy<span className="text-cyan-400 font-light ml-0.5">LAB</span>
            </h1>
          </div>
          <button onClick={() => setIsSettingsModalOpen(true)} className="px-4 py-3.5 text-zinc-400 hover:text-cyan-400 active:scale-95 transition-all">
            <Settings size={18} />
          </button>
        </header>

        {/* MAIN VIEW CONTENT */}
        <div className="flex-1 overflow-hidden relative">
          {view === 'home' && (
            <HomeView
              needsBackup={needsBackup}
              dashboardStats={dashboardStats}
              templates={templates}
              setIsSettingsModalOpen={setIsSettingsModalOpen}
              handleStartRequest={handleStartRequest}
              setDeleteConfirm={setDeleteConfirm}
              setIsReportCardOpen={setIsReportCardOpen}
              onSelectMuscle={setDetailMuscle}
              onPreviewTemplate={setPreviewTemplate}
              onEditTemplate={(t) => { setEditingTemplate(t); setIsBuilderOpen(true); }}
              customExercises={customExercises}
              restSeconds={settings.restSeconds}
              experienceLevel={settings.experienceLevel}
              onOpenLibrary={() => setIsLibraryOpen(true)}
              onOpenTemplateBuilder={() => setIsBuilderOpen(true)}
              onOpenCardio={() => setIsCardioOpen(true)}
              onOpenWeekPlan={() => setIsWeekPlanOpen(true)}
              weeklyCardioKcal={weeklyCardioKcal}
            />
          )}

          {view === 'profile' && (
            <MetricsView
              currentMetricsForm={currentMetricsForm}
              setCurrentMetricsForm={setCurrentMetricsForm}
              computedComp={computedComp}
              handleSaveMetrics={handleSaveMetrics}
              setIsMeasurementGuideOpen={setIsMeasurementGuideOpen}
              isMeasurementGuideOpen={isMeasurementGuideOpen}
              setIsComparisonOpen={setIsComparisonOpen}
              latestMetrics={sortedMetrics[0] || null}
              isExistingRecord={metricsHistory.some(m => m.date === currentMetricsForm.date)}
            />
          )}

          {view === 'nutrition' && (
            <NutritionView
              currentNutritionForm={currentNutritionForm}
              setCurrentNutritionForm={setCurrentNutritionForm}
              handleNutritionDateChange={handleNutritionDateChange}
              updateMeal={(id, field, value) => {
                setCurrentNutritionForm(prev => ({
                  ...prev,
                  meals: (prev.meals || []).map(m => m.id === id ? { ...m, [field]: value } : m)
                }));
              }}
              addMeal={() => {
                setCurrentNutritionForm(prev => ({
                  ...prev,
                  meals: [...(prev.meals || []), { id: generateId(), name: `${(prev.meals || []).length + 1}. Öğün`, calories: '', protein: '', carbs: '', fats: '' }]
                }));
              }}
              handleSaveNutrition={handleSaveNutrition}
              computedComp={computedComp}
              settings={settings}
              nutritionHistory={nutritionHistory}
              setIsFoodSearchOpen={setIsFoodSearchOpen}
              adaptiveTDEE={adaptiveTDEE}
            />
          )}

          {view === 'analysis' && (
            <AnalyticsView
              analysisType={analysisType}
              setAnalysisType={setAnalysisType}
              bodyMetricKey={bodyMetricKey}
              setBodyMetricKey={setBodyMetricKey}
              analysisExercise={analysisExercise}
              setAnalysisExercise={setAnalysisExercise}
              metricsHistory={metricsHistory}
              workouts={workouts}
              allExercisesNames={allExercisesNames}
              customExercises={customExercises}
              experienceLevel={settings.experienceLevel}
            />
          )}

          {view === 'history' && (
            <HistoryView
              historyTab={historyTab}
              setHistoryTab={setHistoryTab}
              workouts={sortedWorkouts}
              metricsHistory={sortedMetrics}
              nutritionHistory={sortedNutrition}
              setDeleteConfirm={setDeleteConfirm}
              handleEditOldWorkoutDate={handleEditOldWorkoutDate}
              handleEditOldWorkout={handleEditOldWorkout}
              handleRepeatWorkout={handleRepeatWorkout}
              handleEditMetric={handleEditMetric}
              handleEditNutrition={handleEditNutrition}
              handleSaveAsTemplate={handleSaveAsTemplate}
              latestWeight={latestWeight}
            />
          )}

          {/* ACTIVE WORKOUT OVERLAY */}
          {activeWorkout && (
            <ActiveWorkoutView
              activeWorkout={activeWorkout}
              setActiveWorkout={setActiveWorkout}
              setIsEndWorkoutModalOpen={setIsEndWorkoutModalOpen}
              setIsExerciseModalOpen={setIsExerciseModalOpen}
              getRecentExerciseData={getRecentExerciseData}
              personalRecords={personalRecords}
              customExercises={customExercises}
              settings={settings}
              updateSet={updateSet}
              addSet={addSet}
              removeSet={removeSet}
              repsOnFocusRef={repsOnFocusRef}
              startRest={startRest}
              stopRest={stopRest}
              onOpenPlateCalc={(w) => setPlateCalc({ weight: w })}
              onSaveAsTemplate={() => handleSaveAsTemplate(null)}
              onToggleSuperset={handleToggleSuperset}
              onEditExercise={setEditorExercise}
              onOpenCardio={() => setIsCardioOpen(true)}
              cardioKcal={totalCardioCalories(activeWorkout.cardio || [], latestWeight)}
              rest={rest}
              restSecondsLeft={restSecondsLeft}
            />
          )}
        </div>

        {/* BOTTOM NAVIGATION */}
        {!activeWorkout && (
          <Navbar view={view} setView={handleChangeView} />
        )}

        {/* SETTINGS MODAL */}
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          settings={settings}
          setSettings={setSettings}
          handleExportData={handleExportData}
          handleImportFileSelect={handleImportFileSelect}
          setIsQRModalOpen={setIsQRModalOpen}
          workouts={workouts}
          nutritionHistory={nutritionHistory}
          lastBackupDate={lastBackupDate}
        />

        {/* QR CODE MODAL */}
        <QRCodeModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          fullData={{ workouts, templates, customExercises, customFoods, metricsHistory, nutritionHistory, settings }}
          onImportData={handleImportData}
        />

        {/* FOOD SEARCH MODAL */}
        <FoodSearchModal
          isOpen={isFoodSearchOpen}
          onClose={() => setIsFoodSearchOpen(false)}
          customFoods={customFoods}
          setCustomFoods={setCustomFoods}
          onAddFoodToMeal={(food) => {
            setCurrentNutritionForm(prev => ({
              ...prev,
              meals: [...(prev.meals || []), {
                id: generateId(),
                name: food.name,
                calories: food.calories,
                protein: food.protein,
                carbs: food.carbs,
                fats: food.fats,
              }]
            }));
            showToast(`${food.name} öğüne eklendi.`);
          }}
        />

        {/* METRICS COMPARISON MODAL */}
        <MetricsComparisonModal
          isOpen={isComparisonOpen}
          onClose={() => setIsComparisonOpen(false)}
          metricsHistory={metricsHistory}
        />

        {/* TEMPLATE PREVIEW */}
        <TemplatePreviewModal
          isOpen={Boolean(previewTemplate)}
          onClose={() => setPreviewTemplate(null)}
          template={previewTemplate}
          customExercises={customExercises}
          restSeconds={settings.restSeconds}
          experienceLevel={settings.experienceLevel}
          onStart={(t) => handleStartRequest(t)}
        />

        {/* EXERCISE MAPPING EDITOR */}
        <ExerciseEditorModal
          key={editorExercise || 'none'}
          isOpen={Boolean(editorExercise)}
          onClose={() => setEditorExercise(null)}
          exerciseName={editorExercise || ''}
          currentContributions={editorExercise ? detectMuscleGroup(editorExercise, customExercises).contributions : {}}
          currentMechanics={editorExercise ? detectMuscleGroup(editorExercise, customExercises).mechanics : 'Push'}
          isOverridden={customExercises.some(ex => (typeof ex === 'object' ? ex.name : ex) === editorExercise)}
          onSave={(data) => handleSaveExerciseMapping(editorExercise, data)}
          onReset={() => handleResetExerciseMapping(editorExercise)}
        />

        {/* HAREKET KÜTÜPHANESİ */}
        <ExerciseLibraryModal
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
          allExerciseNames={allExercisesNames}
          getContributions={getExerciseContributions}
          isUserAdded={isUserAddedExercise}
          performedNames={performedNames}
          hiddenNames={pickerHiddenNames}
          onEditExercise={setEditorExercise}
          onDeleteExercise={(name) => setDeleteConfirm({ isOpen: true, type: 'exercise', id: name })}
          onToggleHidden={handleTogglePickerVisibility}
          onAddNew={() => { setPickerReturnsToLibrary(true); setIsLibraryOpen(false); setIsExerciseModalOpen(true); setIsAddingCustom(true); }}
        />

        {/* PROGRAM OLUŞTURUCU */}
        <TemplateBuilderModal
          key={editingTemplate?.id || 'new'}
          isOpen={isBuilderOpen}
          onClose={() => { setIsBuilderOpen(false); setEditingTemplate(null); }}
          onSave={handleSaveProgram}
          onUpdate={handleUpdateTemplate}
          editing={editingTemplate}
          customExercises={customExercises}
          restSeconds={settings.restSeconds}
          experienceLevel={settings.experienceLevel}
          libraryProps={{
            allExerciseNames: allExercisesNames,
            getContributions: getExerciseContributions,
            isUserAdded: isUserAddedExercise,
            performedNames,
            hiddenNames: pickerHiddenNames,
          }}
        />

        {/* HAFTALIK PROGRAM */}
        <WeeklyPlanModal
          isOpen={isWeekPlanOpen}
          onClose={() => setIsWeekPlanOpen(false)}
          plan={settings.weekPlan || {}}
          onChangePlan={(plan) => setSettings(prev => ({ ...prev, weekPlan: plan }))}
          templates={templates}
          customExercises={customExercises}
          restSeconds={settings.restSeconds}
          experienceLevel={settings.experienceLevel}
          weightKg={latestWeight}
        />

        {/* KARDİYO */}
        <CardioModal
          isOpen={isCardioOpen}
          onClose={() => setIsCardioOpen(false)}
          onSave={handleAddCardio}
          onDelete={handleDeleteCardio}
          weightKg={latestWeight}
          existing={cardioEntries}
        />

        {/* PLATE CALCULATOR */}
        <PlateCalculatorModal
          isOpen={Boolean(plateCalc)}
          onClose={() => setPlateCalc(null)}
          initialWeight={plateCalc?.weight || 0}
        />

        {/* MUSCLE DETAIL MODAL */}
        <MuscleDetailModal
          isOpen={Boolean(detailMuscle)}
          onClose={() => setDetailMuscle(null)}
          muscle={detailMuscle}
          total={detailMuscle ? (dashboardStats.muscleVolume[detailMuscle] || 0) : 0}
          breakdown={detailMuscle ? (muscleBreakdown[detailMuscle] || []) : []}
          experienceLevel={settings.experienceLevel}
        />

        {/* REPORT CARD MODAL */}
        <ReportCardModal
          isOpen={isReportCardOpen}
          onClose={() => setIsReportCardOpen(false)}
          workouts={workouts}
          personalRecords={personalRecords}
        />

        {/* PRE-WORKOUT READINESS MODAL */}
        {preWorkoutModal && (
          <div className="absolute inset-0 bg-black/90 z-[60] flex justify-center items-center px-4 backdrop-blur-sm">
            <div className="bg-zinc-900 w-full max-h-[88dvh] overflow-y-auto hide-scrollbar rounded-2xl shadow-2xl border border-zinc-800 p-6 flex flex-col">
              <h3 className="text-sm font-bold text-zinc-100 mb-2 uppercase tracking-wide border-b border-zinc-800 pb-3 flex items-center">
                <BrainCircuit size={16} className="mr-2 text-cyan-500" /> Hazırbulunuşluk
              </h3>
              <p className="text-[11px] text-zinc-400 mb-6 mt-2 leading-tight">Yüklenme şiddetini ve sakatlık riskini hesaplayabilmemiz için bugünkü mental ve fiziksel toparlanmanızı puanlayın.</p>

              <div className="space-y-5 mb-8">
                <div>
                  <label className="flex justify-between text-xs text-zinc-300 font-bold mb-2"><span>Uyku & Toparlanma</span> <span className="text-cyan-400">{readinessForm.sleep}/5</span></label>
                  <input type="range" min="1" max="5" value={readinessForm.sleep} onChange={(e) => setReadinessForm(p => ({ ...p, sleep: parseInt(e.target.value) }))} className="w-full accent-cyan-500" />
                </div>
                <div>
                  <label className="flex justify-between text-xs text-zinc-300 font-bold mb-2"><span>Psikolojik Stres</span> <span className="text-orange-400">{readinessForm.stress}/5</span></label>
                  <input type="range" min="1" max="5" value={readinessForm.stress} onChange={(e) => setReadinessForm(p => ({ ...p, stress: parseInt(e.target.value) }))} className="w-full accent-orange-500" />
                </div>
                <div>
                  <label className="flex justify-between text-xs text-zinc-300 font-bold mb-2"><span>Kas Ağrısı (DOMS)</span> <span className="text-red-400">{readinessForm.soreness}/5</span></label>
                  <input type="range" min="1" max="5" value={readinessForm.soreness} onChange={(e) => setReadinessForm(p => ({ ...p, soreness: parseInt(e.target.value) }))} className="w-full accent-red-500" />
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
            <div className="bg-zinc-900 w-full max-h-[88dvh] overflow-y-auto hide-scrollbar rounded-2xl shadow-2xl border border-zinc-800 p-6 flex flex-col">
              <h3 className="text-sm font-bold text-zinc-100 mb-4 uppercase tracking-wide border-b border-zinc-800 pb-3 flex items-center">
                <Save size={16} className="mr-2 text-emerald-500" /> Antrenmanı Tamamla
              </h3>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Toplam Süre (Dakika)</label>
                  <input type="number" inputMode="decimal" value={activeWorkout?.duration || ''} onChange={e => setActiveWorkout(p => ({ ...p, duration: parseNumber(e.target.value) }))} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-emerald-400 font-mono text-sm outline-none focus:border-emerald-500 transition-colors" />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Zorluk Derecesi (RPE)</label>
                  <div className="flex space-x-2 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} onClick={() => setActiveWorkout(prev => ({ ...prev, rating: star }))} fill={activeWorkout?.rating >= star ? "currentColor" : "none"} className={`transition-colors cursor-pointer ${activeWorkout?.rating >= star ? "text-yellow-500" : "text-zinc-700"}`} size={24} />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Notlar (Pump, Tükeniş vb.)</label>
                  <textarea value={activeWorkout?.notes || ''} onChange={e => setActiveWorkout(p => ({ ...p, notes: e.target.value }))} rows="3" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-300 font-mono text-xs outline-none focus:border-emerald-500 transition-colors"></textarea>
                </div>
              </div>

              <div className="flex space-x-3">
                <button onClick={() => setIsEndWorkoutModalOpen(false)} className="flex-1 bg-zinc-800 active:bg-zinc-700 text-zinc-300 font-bold py-3.5 rounded-xl uppercase text-xs transition-colors">İptal</button>
                <button onClick={confirmSaveWorkout} className="flex-1 bg-emerald-600 active:bg-emerald-700 text-white font-bold py-3.5 rounded-xl uppercase text-xs transition-colors shadow-lg shadow-emerald-900/20">Kaydet</button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE CONFIRM MODAL */}
        {/* z-[120]: kütüphane (92), kardiyo (95), hareket seçimi (100) ve barkod
            tarayıcının (110) üstünde kalmalı — aksi halde onay penceresi açık
            pencerenin arkasında kalır ve ancak oradan çıkınca görünür. */}
        {deleteConfirm.isOpen && (
          <div className="fixed inset-0 bg-black/90 z-[120] flex justify-center items-center px-4 backdrop-blur-sm">
            <div className="bg-zinc-900 w-full max-w-xs rounded-2xl border border-zinc-800 p-5 text-center space-y-4">
              <AlertCircle size={32} className="text-red-500 mx-auto" />
              <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">Silme Onayı</h4>
              <p className="text-[11px] text-zinc-400 font-mono">
                {deleteConfirm.type === 'exercise'
                  ? `"${deleteConfirm.id}" kütüphaneden silinecek. Geçmiş antrenman kayıtların korunur.`
                  : 'Bu kaydı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'}
              </p>
              <div className="flex space-x-2 pt-2">
                <button onClick={() => setDeleteConfirm({ isOpen: false, type: null, id: null })} className="flex-1 bg-zinc-800 text-zinc-300 font-bold py-2.5 rounded-xl text-xs uppercase">İptal</button>
                <button onClick={handleDeleteConfirmExecute} className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl text-xs uppercase shadow-lg shadow-red-900/30">Sil</button>
              </div>
            </div>
          </div>
        )}

        {/* EXERCISE SELECTION MODAL */}
        {isExerciseModalOpen && (
          <div className="fixed inset-0 bg-zinc-950 z-[100] flex flex-col h-[100dvh] max-w-[420px] mx-auto shadow-2xl">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center pt-safe">
              <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider flex items-center"><Database size={14} className="mr-2 text-cyan-500" /> Hareket Seçimi</h3>
              <button onClick={closeExercisePicker} className="text-zinc-500 p-2"><X size={18} /></button>
            </div>
            <div className="p-4 border-b border-zinc-800 bg-zinc-950">
              {!isAddingCustom ? (
                <button onClick={() => setIsAddingCustom(true)} className="w-full bg-zinc-900 active:bg-zinc-800 border border-zinc-800 text-cyan-500 font-bold py-3 rounded-xl text-[11px] uppercase tracking-wider flex justify-center items-center transition-colors">
                  <Plus size={14} className="mr-2" /> Yeni Özel Hareket Ekle
                </button>
              ) : (
                <div className="space-y-3 bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                  <input type="text" value={newCustomExercise} onChange={(e) => setNewCustomExercise(e.target.value)} placeholder="Hareket Adı (Örn: Cable Lateral Raise)" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 font-mono text-xs outline-none focus:border-cyan-500 transition-colors" />
                  <div>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase">Kas Katkıları</label>
                      <span className="text-[9px] font-mono text-zinc-600">dokun: 1 → ½ → ¼ → yok</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {MUSCLE_GROUPS.map(m => {
                        const w = newExContribs[m] || 0;
                        const cycle = { 0: 1, 1: 0.5, 0.5: 0.25, 0.25: 0 };
                        return (
                          <button
                            key={m}
                            onClick={() => setNewExContribs(prev => {
                              const next = { ...prev };
                              const val = cycle[w];
                              if (val === 0) delete next[m]; else next[m] = val;
                              return next;
                            })}
                            className={`py-1.5 px-1 rounded-lg border text-[9px] font-bold transition-colors ${
                              w === 1 ? 'text-emerald-400 border-emerald-600 bg-emerald-950/40'
                                : w === 0.5 ? 'text-cyan-400 border-cyan-700 bg-cyan-950/30'
                                  : w === 0.25 ? 'text-zinc-300 border-zinc-600 bg-zinc-800'
                                    : 'text-zinc-600 border-zinc-800 bg-zinc-950'
                            }`}
                          >
                            {m}{w === 1 ? ' •' : w === 0.5 ? ' ½' : w === 0.25 ? ' ¼' : ''}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[9px] font-mono text-zinc-600 mt-1.5 leading-snug">
                      Tek kasa bir kez dokunmak yeterli. En az bir kas birincil (•) olmalı.
                    </p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Mekanik</label>
                    <select value={newExMechanics} onChange={e => setNewExMechanics(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-300 text-[11px] outline-none">
                      <option value="Push">İtme (Push)</option>
                      <option value="Pull">Çekme (Pull)</option>
                      <option value="Legs">Bacak (Legs)</option>
                      <option value="Core">Merkez (Core)</option>
                    </select>
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <button onClick={() => { setIsAddingCustom(false); setNewCustomExercise(''); setNewExContribs({}); }} className="flex-1 text-zinc-500 bg-zinc-950 active:bg-zinc-800 rounded-lg text-[11px] uppercase font-bold py-2.5 transition-colors">İptal</button>
                    <button
                      disabled={!newCustomExercise.trim() || !Object.values(newExContribs).includes(1)}
                      onClick={() => {
                        const newEx = newCustomExercise.trim();
                        const exists = allExercisesNames.some(ex => ex.toLowerCase() === newEx.toLowerCase());
                        if (!exists) {
                          setCustomExercises(prev => [...prev, {
                            name: newEx,
                            contributions: newExContribs,
                            muscle: Object.entries(newExContribs).sort((a, b) => b[1] - a[1])[0][0],
                            mechanics: newExMechanics,
                            schema: 2
                          }]);
                        }
                        setNewCustomExercise('');
                        setNewExContribs({});
                        setIsAddingCustom(false);
                        if (pickerReturnsToLibrary || !activeWorkout) {
                          showToast(`"${newEx}" kütüphaneye eklendi.`);
                          closeExercisePicker();
                        } else {
                          handleSelectExercise(newEx);
                        }
                      }}
                      className="flex-1 bg-cyan-600 active:bg-cyan-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg text-[11px] uppercase font-bold py-2.5 transition-colors"
                    >
                      Kaydet
                    </button>
                  </div>
                </div>
              )}
            </div>
            {!isAddingCustom && (
              <div className="p-4 border-b border-zinc-800 bg-zinc-950 space-y-2.5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input type="text" value={exerciseSearchQuery} onChange={(e) => setExerciseSearchQuery(e.target.value)} placeholder="Tüm veritabanında ara..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-3 text-zinc-100 outline-none font-mono text-xs h-11 focus:border-cyan-500 transition-colors" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-mono text-zinc-600 leading-snug min-w-0">
                    {exerciseSearchQuery.trim()
                      ? `${filteredExercises.length} sonuç · tüm veritabanı`
                      : settings.pickerShowAll
                        ? `Tüm ${filteredExercises.length} hareket listeleniyor`
                        : `Kendi listen (${filteredExercises.length}) · diğerleri için ara`}
                  </span>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, pickerShowAll: !prev.pickerShowAll }))}
                    className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wide border transition-colors ${settings.pickerShowAll ? 'border-cyan-600 text-cyan-400 bg-cyan-950/20' : 'border-zinc-800 text-zinc-500'}`}
                  >
                    {settings.pickerShowAll ? 'Kendi listem' : 'Hepsini göster'}
                  </button>
                </div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto bg-zinc-950 pb-safe hide-scrollbar">
              {filteredExercises.map(ex => {
                const { contributions } = detectMuscleGroup(ex, customExercises);
                // Katkılar büyükten küçüğe: birincil kas en solda görünsün.
                const parts = Object.entries(contributions || {}).sort((a, b) => b[1] - a[1]);
                return (
                  <button key={ex} onClick={() => handleSelectExercise(ex)} className="w-full flex justify-between items-start gap-3 px-5 py-3.5 border-b border-zinc-900 text-zinc-300 active:bg-zinc-900 transition-colors text-left">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold font-mono">{ex}</div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {parts.length === 0 ? (
                          <span className="text-[10px] text-zinc-600 font-mono">Kas eşlemesi yok</span>
                        ) : parts.map(([muscle, weight]) => (
                          <span
                            key={muscle}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                              weight === 1 ? 'text-emerald-400 border-emerald-900/50 bg-emerald-950/30'
                                : weight === 0.5 ? 'text-cyan-400 border-cyan-900/50 bg-cyan-950/30'
                                  : 'text-zinc-500 border-zinc-800 bg-zinc-900'
                            }`}
                          >
                            {muscle}{weight === 0.5 ? ' ½' : weight === 0.25 ? ' ¼' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="flex items-center gap-1 shrink-0 mt-0.5">
                      {getRecentExerciseData(ex) && <Activity size={14} className="text-cyan-600" />}
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); setEditorExercise(ex); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setEditorExercise(ex); } }}
                        title="Kas eşlemesini düzenle"
                        className="text-zinc-600 active:text-cyan-400 p-1.5 -m-0.5 cursor-pointer"
                      >
                        <Settings size={13} />
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}