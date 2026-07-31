import { useCallback, useEffect, useMemo } from 'react';
import { safeSetItem, createErrorThrottle } from '../utils/persist.js';
import { storageKey } from '../utils/helpers.js';

/** Kalıcı veri yazımlarını App görünüm mantığından ayırır. */
export const useAppPersistence = ({
  workouts,
  templates,
  customExercises,
  customFoods,
  recentFoods,
  activeWorkout,
  metricsHistory,
  nutritionHistory,
  wellness,
  settings,
}, showToast) => {
  const notifyPersistError = useMemo(
    () => createErrorThrottle((message) => showToast(message, 'error')),
    [showToast]);

  const persist = useCallback(
    (name, value) => safeSetItem(storageKey(name), value, notifyPersistError),
    [notifyPersistError]);

  useEffect(() => { persist('workouts', workouts); }, [workouts, persist]);
  useEffect(() => { persist('templates', templates); }, [templates, persist]);
  useEffect(() => { persist('custom_exercises', customExercises); }, [customExercises, persist]);
  useEffect(() => { persist('custom_foods', customFoods); }, [customFoods, persist]);
  useEffect(() => { persist('recent_foods', recentFoods); }, [recentFoods, persist]);
  useEffect(() => { persist('active_workout', activeWorkout); }, [activeWorkout, persist]);
  useEffect(() => { persist('metrics', metricsHistory); }, [metricsHistory, persist]);
  useEffect(() => { persist('nutrition', nutritionHistory); }, [nutritionHistory, persist]);
  useEffect(() => { persist('wellness', wellness); }, [wellness, persist]);
  useEffect(() => { persist('settings', settings); }, [settings, persist]);
};
