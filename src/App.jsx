import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Plus, Save, Activity, X, Search, Trash2, AlertCircle, Settings, BrainCircuit, Star, Database
} from 'lucide-react';
import {
  startLockScreenActivity, updateLockScreenActivity, stopLockScreenActivity,
  requestWakeLock, playRestAlert, vibrateAlert
} from './lockScreen';

import { DEFAULT_EXERCISES, MUSCLE_GROUPS, MUSCLE_VOLUME_LANDMARKS } from './utils/constants';

import {
  generateId, getLocalDateString, getMondayOfCurrentWeek, detectMuscleGroup,
  foldForSearch, parseNumber, mergeMetrics, mergeNutrition,
  isWorkingSet, calcEffectiveSets, buildPersonalRecords, loadPersistedState,
  computeComposition, sortByDateDesc
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

  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newCustomExercise, setNewCustomExercise] = useState('');
  const [newExMuscle, setNewExMuscle] = useState('Göğüs');
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

  const showToast = useCallback((message) => {
    setToast({ message, type: 'info' });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Kayıtları kalıcı belleğe kaydetme
  useEffect(() => {
    try {
      localStorage.setItem('po_workouts_v16', JSON.stringify(workouts));
    } catch { /* yoksay */ }
  }, [workouts]);

  useEffect(() => {
    try {
      localStorage.setItem('po_templates_v16', JSON.stringify(templates));
    } catch { /* yoksay */ }
  }, [templates]);

  useEffect(() => {
    try {
      localStorage.setItem('po_custom_exercises_v16', JSON.stringify(customExercises));
    } catch { /* yoksay */ }
  }, [customExercises]);

  useEffect(() => {
    try {
      localStorage.setItem('po_custom_foods_v16', JSON.stringify(customFoods));
    } catch { /* yoksay */ }
  }, [customFoods]);

  useEffect(() => {
    try {
      localStorage.setItem('po_active_workout_v16', JSON.stringify(activeWorkout));
    } catch { /* yoksay */ }
  }, [activeWorkout]);

  useEffect(() => {
    try {
      localStorage.setItem('po_metrics_v16', JSON.stringify(metricsHistory));
    } catch { /* yoksay */ }
  }, [metricsHistory]);

  useEffect(() => {
    try {
      localStorage.setItem('po_nutrition_v16', JSON.stringify(nutritionHistory));
    } catch { /* yoksay */ }
  }, [nutritionHistory]);

  useEffect(() => {
    try {
      localStorage.setItem('po_settings_v16', JSON.stringify(settings));
    } catch { /* yoksay */ }
  }, [settings]);

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

  const filteredExercises = useMemo(() => {
    if (!exerciseSearchQuery.trim()) return allExercisesNames;
    const query = foldForSearch(exerciseSearchQuery);
    return allExercisesNames.filter(ex => foldForSearch(ex).includes(query));
  }, [allExercisesNames, exerciseSearchQuery]);

  // Tarihe göre azalan sıralı listeler: hem arşiv görünümü hem de "en son ne yaptım"
  // sorguları bunlara dayanır, böylece kayıt sırasından bağımsız olarak doğru çalışır.
  const sortedWorkouts = useMemo(() => sortByDateDesc(workouts), [workouts]);
  const sortedMetrics = useMemo(() => sortByDateDesc(metricsHistory), [metricsHistory]);
  const sortedNutrition = useMemo(() => sortByDateDesc(nutritionHistory), [nutritionHistory]);

  const personalRecords = useMemo(() => {
    return buildPersonalRecords(workouts, activeWorkout?.id);
  }, [workouts, activeWorkout?.id]);

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
          if (muscleVolume[muscle] !== undefined) muscleVolume[muscle] += count * weight;
        });
      });
    });

    // Yarım set katkıları ondalık biriktirdiği için yuvarlanır.
    Object.keys(muscleVolume).forEach(m => {
      muscleVolume[m] = Math.round(muscleVolume[m] * 4) / 4;
    });

    // Deload kararı kasa özel MRV tavanına göre verilir, sabit bir eşiğe göre değil.
    const isDeloadNeeded = Object.entries(muscleVolume).some(
      ([muscle, volume]) => volume > (MUSCLE_VOLUME_LANDMARKS[muscle]?.mrv ?? 22)
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
      settings.keepScreenAwake, getRecentExerciseData]);


  const handleStartRequest = useCallback((templateOrWorkout = null) => {
    setPreWorkoutModal({ template: templateOrWorkout });
  }, []);

  const confirmStartWorkout = () => {
    const template = preWorkoutModal?.template;
    const todayStr = getLocalDateString();
    const readinessScore = readinessForm.sleep + (6 - readinessForm.stress) + (6 - readinessForm.soreness);

    let initialExercises = [];
    if (template && Array.isArray(template.exercises)) {
      initialExercises = template.exercises.map(ex => ({
        id: generateId(),
        name: ex.name,
        sets: (ex.sets || []).map(s => ({
          id: generateId(), weight: s.weight || '', reps: s.reps || '', rir: s.rir ?? 2, tempo: s.tempo || '', formRating: s.formRating || 8, setType: s.setType || 'normal'
        }))
      }));
    }

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
    localStorage.setItem('po_last_backup', today);
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
    if (Array.isArray(data.workouts || data.w)) setWorkouts(data.workouts || data.w);
    if (Array.isArray(data.templates || data.t)) setTemplates(data.templates || data.t);
    if (Array.isArray(data.customExercises)) setCustomExercises(data.customExercises);
    if (Array.isArray(data.customFoods)) setCustomFoods(data.customFoods);
    if (Array.isArray(data.metricsHistory || data.m)) setMetricsHistory((data.metricsHistory || data.m).map(mergeMetrics));
    if (Array.isArray(data.nutritionHistory || data.n)) setNutritionHistory((data.nutritionHistory || data.n).map(mergeNutrition));
    if (data.settings || data.s) setSettings(prev => ({ ...prev, ...(data.settings || data.s) }));
    showToast('Veriler başarıyla yüklendi.');
  };

  const handleDeleteConfirmExecute = () => {
    const { type, id } = deleteConfirm;
    if (!type || !id) return;

    if (type === 'workout') setWorkouts(prev => prev.filter(w => w.id !== id));
    else if (type === 'metric') setMetricsHistory(prev => prev.filter(m => m.id !== id));
    else if (type === 'nutrition') setNutritionHistory(prev => prev.filter(n => n.id !== id));
    else if (type === 'template') setTemplates(prev => prev.filter(t => t.id !== id));

    setDeleteConfirm({ isOpen: false, type: null, id: null });
    showToast('Kayıt silindi.');
  };

  const handleNutritionDateChange = (date) => {
    const existing = nutritionHistory.find(n => n.date === date);
    if (existing) setCurrentNutritionForm(mergeNutrition(existing));
    else setCurrentNutritionForm(mergeNutrition({ date: date }));
  };

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
          <div className="absolute top-4 left-4 right-4 z-50 bg-zinc-900 border border-zinc-700 text-zinc-100 px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-mono animate-in fade-in slide-in-from-top-4">
            <Activity size={14} className="text-cyan-400 shrink-0" />
            <span>{toast.message}</span>
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
              rest={rest}
              restSecondsLeft={restSecondsLeft}
            />
          )}
        </div>

        {/* BOTTOM NAVIGATION */}
        {!activeWorkout && (
          <Navbar view={view} setView={setView} />
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
        />

        {/* QR CODE MODAL */}
        <QRCodeModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          fullData={{ workouts, templates, customExercises, metricsHistory, nutritionHistory, settings }}
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
              <p className="text-[10px] text-zinc-400 mb-6 mt-2 leading-tight">Yüklenme şiddetini ve sakatlık riskini hesaplayabilmemiz için bugünkü mental ve fiziksel toparlanmanızı puanlayın.</p>

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
        {deleteConfirm.isOpen && (
          <div className="absolute inset-0 bg-black/90 z-[70] flex justify-center items-center px-4 backdrop-blur-sm">
            <div className="bg-zinc-900 w-full max-w-xs rounded-2xl border border-zinc-800 p-5 text-center space-y-4">
              <AlertCircle size={32} className="text-red-500 mx-auto" />
              <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">Silme Onayı</h4>
              <p className="text-[10px] text-zinc-400 font-mono">Bu kaydı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
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
                    <button onClick={() => {
                      const newEx = (newCustomExercise || '').trim();
                      if (!newEx) return;
                      const exists = allExercisesNames.some(ex => ex.toLowerCase() === newEx.toLowerCase());
                      if (!exists) {
                        setCustomExercises(prev => [...prev, { name: newEx, muscle: newExMuscle, mechanics: newExMechanics }]);
                      }
                      setNewCustomExercise('');
                      setIsAddingCustom(false);
                      handleSelectExercise(newEx);
                    }} className="flex-1 bg-cyan-600 active:bg-cyan-700 text-white rounded-lg text-[10px] uppercase font-bold py-2.5 transition-colors">Kaydet</button>
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
                    {getRecentExerciseData(ex) && <Activity size={14} className="text-cyan-600" />}
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