import React, { memo, useMemo, useState } from 'react';
import {
  Activity, BarChart3, Beef, ChevronDown, Copy,
  Droplets, Flame, Plus, Save, Search, Sparkles, Trash2, TrendingUp,
} from 'lucide-react';
import {
  parseNumber, clampNumber, INPUT_LIMITS, getLocalDateString,
} from '../utils/helpers';
import { dailyTotals, nutritionDayScore } from '../utils/nutritionStats';
import { dayWorkoutCalories } from '../utils/cardio';
import { calorieDashboard, recommendedCalories } from '../utils/goals';
import CalorieBalanceCard from './CalorieBalanceCard';
import DisclosureCard from './DisclosureCard';
import { formatDay, weekdayName } from '../utils/dates';
import { dayMindCalories } from '../utils/wellness';
import { dayEnergyBreakdown, neatOptsForDay } from '../utils/energyModel';

const MacroTile = ({ label, value, numericValue, target, color, bar }) => {
  const ratio = target > 0 ? Math.min(100, Math.round((parseNumber(numericValue) / target) * 100)) : null;
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 min-w-0">
      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide block">{label}</span>
      <span className={`text-sm font-mono font-bold block mt-0.5 ${color}`}>{value}</span>
      {ratio !== null && (
        <>
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden mt-1.5">
            <div className={`h-full rounded-full ${bar}`} style={{ width: `${ratio}%` }} />
          </div>
          <span className="text-[8px] font-mono text-zinc-600 block mt-1">hedef {target}g</span>
        </>
      )}
    </div>
  );
};

const NutritionView = memo(({
  currentNutritionForm,
  setCurrentNutritionForm,
  handleNutritionDateChange,
  updateMeal,
  handleSaveNutrition,
  computedComp,
  settings,
  nutritionHistory,
  setIsFoodSearchOpen,
  adaptiveTDEE,
  workouts = [],
  latestWeight = 0,
  wellness = [],
  maintenanceCalories = 0,
  neatOpts = {},
  onOpenEnergyDetail,
}) => {
  const safeMeals = Array.isArray(currentNutritionForm.meals) ? currentNutritionForm.meals : [];
  const isDaily = currentNutritionForm.entryMode === 'daily';
  const isToday = currentNutritionForm.date === getLocalDateString();
  const detailed = settings.interfaceMode === 'detailed';
  const [expandedMeals, setExpandedMeals] = useState(() => new Set());

  const dailyMeal = safeMeals[0] || {};
  const totals = dailyTotals(currentNutritionForm);
  const ffm = parseNumber(computedComp?.ffm) || 60;
  const targetProteinMultiplier = settings.nutritionGoal === 'bulk'
    ? (settings.proteinPerFfmBulk || 2.2)
    : (settings.proteinPerFfmCut || 2.6);
  const targetProtein = Math.round(ffm * targetProteinMultiplier);

  const recent7Days = useMemo(() => [...(nutritionHistory || [])]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 7), [nutritionHistory]);

  const recommended = recommendedCalories(maintenanceCalories, settings.nutritionGoal, {
    weightKg: latestWeight,
    bodyFatPct: parseNumber(computedComp?.activeBF),
    rate: settings.paceRate,
  });

  const energyFor = (record) => {
    const recordTotals = dailyTotals(record);
    const workout = dayWorkoutCalories(workouts, record.date, latestWeight);
    const recovery = dayMindCalories(wellness, record.date, latestWeight);
    return dayEnergyBreakdown({
      maintenance: maintenanceCalories,
      bmr: parseNumber(computedComp?.bmr),
      macros: recordTotals,
      lifting: workout.lifting,
      cardio: workout.cardio,
      activeRecovery: workout.activeRecovery,
      recovery,
      manual: record.activeCaloriesOut,
      steps: record.steps,
      // Güne özel hareket çarpanı varsa genel ayarı ezer.
      ...neatOptsForDay(neatOpts, record),
    });
  };

  const currentEnergy = energyFor(currentNutritionForm);
  const automaticExercise = currentEnergy.lifting + currentEnergy.cardio + currentEnergy.recovery;
  const calorieData = calorieDashboard({
    intake: totals.calories,
    burnedAuto: automaticExercise,
    burnedManual: currentNutritionForm.activeCaloriesOut,
    maintenance: maintenanceCalories,
    targetIntake: recommended?.target,
    totalOut: currentEnergy.total,
    weekDays: recent7Days.map(record => ({
      intake: dailyTotals(record).calories,
      out: energyFor(record).total,
    })),
  });

  const weeklyAvg = useMemo(() => {
    if (recent7Days.length === 0) return null;
    const sum = recent7Days.map(dailyTotals).reduce((acc, day) => ({
      calories: acc.calories + day.calories,
      protein: acc.protein + day.protein,
      carbs: acc.carbs + day.carbs,
      fats: acc.fats + day.fats,
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
    return Object.fromEntries(Object.entries(sum).map(([key, value]) => [key, Math.round(value / recent7Days.length)]));
  }, [recent7Days]);

  const dayScore = nutritionDayScore({
    totals,
    targetCalories: calorieData?.adjustedTarget || recommended?.target,
    targetProtein,
    waterMl: currentNutritionForm.waterMl,
    weightKg: latestWeight,
  });

  const yesterdayRecord = useMemo(() => {
    const date = new Date(`${currentNutritionForm.date}T12:00:00`);
    date.setDate(date.getDate() - 1);
    const yesterday = getLocalDateString(date);
    return (nutritionHistory || []).find(record => record.date === yesterday) || null;
  }, [currentNutritionForm.date, nutritionHistory]);

  const setEntryMode = (mode) => {
    setCurrentNutritionForm(prev => {
      if (mode === prev.entryMode) return prev;
      if (mode === 'daily') {
        const sum = dailyTotals(prev);
        return {
          ...prev,
          entryMode: 'daily',
          meals: [{
            id: prev.meals?.[0]?.id || `daily-${Date.now()}`,
            name: 'Günlük Toplam',
            calories: Math.round(sum.protein * 4 + sum.carbs * 4 + sum.fats * 9),
            protein: sum.protein || '',
            carbs: sum.carbs || '',
            fats: sum.fats || '',
          }],
        };
      }
      return { ...prev, entryMode: 'meals' };
    });
  };

  const updateDailyMacro = (field, value) => {
    setCurrentNutritionForm(prev => {
      const base = (Array.isArray(prev.meals) && prev.meals[0]) || {};
      const next = { ...base, name: 'Günlük Toplam', id: base.id || `daily-${Date.now()}`, [field]: value };
      next.calories = Math.round(
        parseNumber(next.protein) * 4 + parseNumber(next.carbs) * 4 + parseNumber(next.fats) * 9
      );
      return { ...prev, meals: [next] };
    });
  };

  const addMealAndOpen = () => {
    const id = `meal-${Date.now()}`;
    setCurrentNutritionForm(prev => ({
      ...prev,
      meals: [...(prev.meals || []), {
        id,
        name: `${(prev.meals || []).length + 1}. Öğün`,
        calories: '', protein: '', carbs: '', fats: '',
      }],
    }));
    setExpandedMeals(prev => new Set([...prev, id]));
  };

  const copyYesterday = () => {
    if (!yesterdayRecord) return;
    setCurrentNutritionForm(prev => ({
      ...prev,
      entryMode: yesterdayRecord.entryMode || 'meals',
      meals: (yesterdayRecord.meals || []).map((meal, index) => ({
        ...meal,
        id: `copy-${Date.now()}-${index}`,
      })),
    }));
  };

  const targetCalories = calorieData?.adjustedTarget || recommended?.target || 0;
  const remaining = targetCalories > 0 ? targetCalories - totals.calories : null;
  const calorieProgress = targetCalories > 0 ? Math.min(100, totals.calories / targetCalories * 100) : 0;
  const scoreColor = !dayScore ? 'text-zinc-500' : dayScore.score >= 65 ? 'text-emerald-400' : dayScore.score >= 45 ? 'text-amber-400' : 'text-orange-400';

  return (
    <div className="p-4 space-y-3.5 pb-nav h-full overflow-y-auto hide-scrollbar bg-black">
      <header className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-400">Günlük Takip</span>
          <h2 className="text-xl font-black text-zinc-100 mt-0.5">Beslenme</h2>
          <p className="text-[10px] font-mono text-zinc-500 mt-1">Önce {isToday ? 'bugünün' : 'seçili günün'} özeti, ayrıntılar aşağıda.</p>
        </div>
        <label className="text-right">
          <span className="text-[9px] font-bold uppercase text-zinc-600 block mb-1">{weekdayName(currentNutritionForm.date)}</span>
          <input
            type="date"
            value={currentNutritionForm.date}
            onChange={(event) => handleNutritionDateChange(event.target.value)}
            aria-label="Beslenme tarihi"
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-2 text-zinc-300 font-mono text-[10px] outline-none focus:border-orange-500"
          />
        </label>
      </header>

      <section className="bg-gradient-to-br from-orange-950/40 via-zinc-900 to-zinc-900 rounded-3xl border border-orange-900/30 p-4 shadow-lg shadow-black/20">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{isToday ? 'Bugün Kalan' : 'O Gün Kalan'}</span>
            {remaining === null ? (
              <span className="text-xl font-bold text-zinc-400 block mt-1">Hedef bekleniyor</span>
            ) : (
              <div className="mt-0.5">
                <span className={`text-4xl font-mono font-black ${remaining < 0 ? 'text-amber-400' : 'text-orange-400'}`}>
                  {Math.abs(Math.round(remaining))}
                </span>
                <span className="text-xs font-mono text-zinc-500 ml-1">kcal</span>
                <span className="text-[10px] font-mono text-zinc-500 block">
                  {remaining < 0 ? 'hedefin üzerinde' : 'daha yiyebilirsin'}
                </span>
              </div>
            )}
          </div>
          <div className="text-right bg-zinc-950/70 border border-zinc-800 rounded-2xl px-3 py-2">
            <span className={`text-lg font-mono font-bold block ${scoreColor}`}>{dayScore ? dayScore.score : '—'}</span>
            <span className="text-[8px] font-bold uppercase text-zinc-600 block">Günlük Uyum</span>
            {dayScore && <span className="text-[9px] font-mono text-zinc-500 block">{dayScore.label}</span>}
          </div>
        </div>

        <div className="h-2 bg-zinc-950 border border-zinc-800 rounded-full overflow-hidden mt-4">
          <div
            className={`h-full rounded-full ${remaining !== null && remaining < 0 ? 'bg-amber-500' : 'bg-orange-500'}`}
            style={{ width: `${calorieProgress}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-mono text-zinc-500 mt-1.5">
          <span>{totals.calories} kcal alındı</span>
          <span>{targetCalories > 0 ? `${targetCalories} kcal hedef` : 'Vücut verisi gerekli'}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3">
          <MacroTile label="Protein" value={`${totals.protein}g`} numericValue={totals.protein} target={targetProtein} color="text-emerald-400" bar="bg-emerald-500" />
          <MacroTile label="Karbonhidrat" value={`${totals.carbs}g`} color="text-amber-400" />
          <MacroTile label="Yağ" value={`${totals.fats}g`} color="text-purple-400" />
        </div>
        {dayScore?.next?.length > 0 && (
          <p className="text-[9px] font-mono text-zinc-500 mt-2.5">
            {isToday ? 'Bugün' : 'Bu gün'} öncelik: <strong className="text-zinc-300">{dayScore.next.join(' ve ')}</strong>.
          </p>
        )}
      </section>

      <section className="grid grid-cols-4 gap-2" aria-label="Hızlı işlemler">
        {[
          { label: 'Besin Ekle', icon: Search, action: () => setIsFoodSearchOpen(true), enabled: !isDaily, color: 'text-orange-400' },
          { label: 'Dünü Kopyala', icon: Copy, action: copyYesterday, enabled: Boolean(yesterdayRecord), color: 'text-cyan-400' },
          { label: 'Toplam Gir', icon: Beef, action: () => setEntryMode('daily'), enabled: true, color: 'text-emerald-400' },
          { label: 'Kalori Detayı', icon: BarChart3, action: onOpenEnergyDetail, enabled: true, color: 'text-red-400' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={item.action}
              disabled={!item.enabled}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl py-3 px-1 flex flex-col items-center gap-1.5 active:bg-zinc-800 disabled:opacity-35 transition-colors"
            >
              <Icon size={16} className={item.color} />
              <span className="text-[9px] font-bold text-zinc-400 leading-tight text-center">{item.label}</span>
            </button>
          );
        })}
      </section>

      <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-3.5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-zinc-100">{isToday ? 'Bugünün kaydı' : 'Geçmiş gün kaydı'}</h3>
            <span className="text-[9px] font-mono text-zinc-500">{safeMeals.length} öğün · {totals.calories} kcal</span>
          </div>
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            {[
              { key: 'meals', label: 'Öğünler' },
              { key: 'daily', label: 'Toplam' },
            ].map(mode => (
              <button
                key={mode.key}
                type="button"
                onClick={() => setEntryMode(mode.key)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-colors ${
                  (currentNutritionForm.entryMode || 'meals') === mode.key
                    ? 'bg-orange-600 text-white'
                    : 'text-zinc-500'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl p-2.5">
          <span className="flex items-center gap-2 text-[10px] font-bold text-zinc-400">
            <Droplets size={14} className="text-cyan-400" /> Su
          </span>
          <span className="flex items-center gap-1.5">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={10000}
              value={currentNutritionForm.waterMl ?? ''}
              onChange={(event) => setCurrentNutritionForm(prev => ({ ...prev, waterMl: event.target.value }))}
              onBlur={(event) => setCurrentNutritionForm(prev => ({
                ...prev,
                waterMl: event.target.value === '' ? '' : clampNumber(event.target.value, 0, 10000),
              }))}
              placeholder="0"
              aria-label="İçilen su miktarı"
              className="w-20 bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 text-center font-mono text-cyan-400 text-[11px] outline-none focus:border-cyan-500"
            />
            <span className="text-[9px] font-mono text-zinc-600">/ {dayScore?.waterTarget || 2500} ml</span>
          </span>
        </div>

        {isDaily ? (
          <div className="space-y-3">
            <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">
              Başka bir uygulamada saydıysan yalnızca günlük toplam makroları yaz. Kalori otomatik hesaplanır.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'protein', label: 'Protein', color: 'text-emerald-400' },
                { key: 'carbs', label: 'Karb.', color: 'text-amber-400' },
                { key: 'fats', label: 'Yağ', color: 'text-purple-400' },
              ].map(field => (
                <label key={field.key}>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">{field.label}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={INPUT_LIMITS.macro.min}
                    max={INPUT_LIMITS.macro.max}
                    value={dailyMeal[field.key] ?? ''}
                    onChange={(event) => updateDailyMacro(field.key, event.target.value)}
                    onBlur={(event) => updateDailyMacro(field.key, clampNumber(event.target.value, INPUT_LIMITS.macro.min, INPUT_LIMITS.macro.max))}
                    placeholder="0 g"
                    className={`w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 font-mono text-sm text-center outline-none focus:border-orange-500 ${field.color}`}
                  />
                </label>
              ))}
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-center">
              <strong className="text-xl font-mono text-orange-400">{parseNumber(dailyMeal.calories)}</strong>
              <span className="text-[10px] font-mono text-zinc-500 ml-1">kcal hesaplandı</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {safeMeals.map((meal, index) => {
              const open = safeMeals.length === 1 || expandedMeals.has(meal.id);
              return (
                <article key={meal.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => setExpandedMeals(prev => {
                        const next = new Set(prev);
                        if (next.has(meal.id)) next.delete(meal.id);
                        else next.add(meal.id);
                        return next;
                      })}
                      aria-expanded={open}
                      className="flex-1 min-w-0 text-left flex items-center gap-2"
                    >
                      <ChevronDown size={14} className={`text-zinc-600 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                      <span className="min-w-0">
                        <span className="text-[11px] font-bold text-zinc-200 block truncate">{meal.name || `${index + 1}. Öğün`}</span>
                        <span className="text-[9px] font-mono text-zinc-500 block">
                          {meal.calories || 0} kcal · P {meal.protein || 0} · K {meal.carbs || 0} · Y {meal.fats || 0}
                        </span>
                      </span>
                    </button>
                    {safeMeals.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setCurrentNutritionForm(prev => ({
                          ...prev,
                          meals: prev.meals.filter(item => item.id !== meal.id),
                        }))}
                        aria-label={`${meal.name || 'Öğünü'} sil`}
                        className="p-2 text-zinc-600 active:text-red-500"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  {open && (
                    <div className="border-t border-zinc-800 p-3 space-y-2.5">
                      <input
                        type="text"
                        value={meal.name}
                        onChange={(event) => updateMeal(meal.id, 'name', event.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-[11px] font-bold text-zinc-200 outline-none focus:border-orange-500"
                        placeholder={`${index + 1}. Öğün`}
                      />
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: 'protein', label: 'Protein', color: 'text-emerald-400' },
                          { key: 'carbs', label: 'Karb.', color: 'text-amber-400' },
                          { key: 'fats', label: 'Yağ', color: 'text-purple-400' },
                        ].map(field => (
                          <label key={field.key}>
                            <span className="text-[9px] font-bold text-zinc-600 uppercase block mb-1">{field.label}</span>
                            <input
                              type="number"
                              min={INPUT_LIMITS.macro.min}
                              max={INPUT_LIMITS.macro.max}
                              value={meal[field.key] ?? ''}
                              onChange={(event) => updateMeal(meal.id, field.key, event.target.value)}
                              onBlur={(event) => updateMeal(meal.id, field.key, clampNumber(event.target.value, INPUT_LIMITS.macro.min, INPUT_LIMITS.macro.max))}
                              placeholder="0"
                              className={`w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 font-mono text-center outline-none focus:border-orange-500 ${field.color}`}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={addMealAndOpen}
                className="bg-zinc-950 border border-zinc-800 text-zinc-300 font-bold py-2.5 rounded-xl flex justify-center items-center text-[10px]"
              >
                <Plus size={13} className="mr-1.5" /> Boş Öğün
              </button>
              <button
                type="button"
                onClick={() => setIsFoodSearchOpen(true)}
                className="bg-orange-950/40 border border-orange-900/50 text-orange-400 font-bold py-2.5 rounded-xl flex justify-center items-center text-[10px]"
              >
                <Search size={13} className="mr-1.5" /> Besin Bul
              </button>
            </div>
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={handleSaveNutrition}
        className="w-full bg-orange-600 active:bg-orange-700 text-white font-bold py-3.5 px-4 rounded-2xl flex justify-center items-center text-xs shadow-lg shadow-orange-950/30"
      >
        <Save size={15} className="mr-2" /> {isToday ? 'Bugünün Kaydını Kaydet' : 'Geçmiş Kaydı Kaydet'}
      </button>

      <DisclosureCard
        key={`energy-${detailed}`}
        icon={Flame}
        title="Enerji dengesi"
        summary={calorieData?.ready ? `${Math.abs(calorieData.balance)} kcal ${calorieData.balance < 0 ? 'açık' : calorieData.balance > 0 ? 'fazla' : 'korunum'}` : 'Vücut verisiyle hesaplanır'}
        defaultOpen={detailed}
        accentClass="text-red-400"
      >
        <CalorieBalanceCard
          data={calorieData}
          dateLabel={formatDay(currentNutritionForm.date, 'medium')}
          goalLabel={recommended?.label}
          manualValue={currentNutritionForm.activeCaloriesOut}
          onChangeManual={(value) => setCurrentNutritionForm(prev => ({ ...prev, activeCaloriesOut: value }))}
          stepsMode={settings.neatMode === 'steps'}
          stepsValue={currentNutritionForm.steps}
          onChangeSteps={(value) => setCurrentNutritionForm(prev => ({ ...prev, steps: value }))}
        />
        <button
          type="button"
          onClick={() => onOpenEnergyDetail?.()}
          className="w-full mt-2.5 bg-zinc-950 border border-zinc-800 text-zinc-300 font-bold py-2.5 rounded-xl text-[10px] flex items-center justify-center"
        >
          <BarChart3 size={13} className="mr-1.5 text-red-400" /> Günlük ve Haftalık Tüm Detaylar
        </button>
      </DisclosureCard>

      <DisclosureCard
        key={`analysis-${detailed}`}
        icon={TrendingUp}
        title="7 günlük analiz"
        summary={weeklyAvg ? `${recent7Days.length} gün · ort. ${weeklyAvg.calories} kcal · ${weeklyAvg.protein}g protein` : 'Henüz yeterli kayıt yok'}
        defaultOpen={detailed}
        accentClass="text-emerald-400"
      >
        {weeklyAvg ? (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'Kalori', value: weeklyAvg.calories, color: 'text-cyan-400' },
                { label: 'Protein', value: `${weeklyAvg.protein}g`, color: 'text-emerald-400' },
                { label: 'Karb.', value: `${weeklyAvg.carbs}g`, color: 'text-amber-400' },
                { label: 'Yağ', value: `${weeklyAvg.fats}g`, color: 'text-purple-400' },
              ].map(item => (
                <div key={item.label} className="bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-center">
                  <strong className={`text-[11px] font-mono block ${item.color}`}>{item.value}</strong>
                  <span className="text-[8px] font-bold uppercase text-zinc-600">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="overflow-hidden rounded-xl border border-zinc-800">
              {recent7Days.map(record => {
                const day = dailyTotals(record);
                return (
                  <div key={record.id || record.date} className="grid grid-cols-[1.35fr_repeat(4,0.75fr)] gap-1 px-2.5 py-2 text-[9px] font-mono odd:bg-zinc-950 even:bg-zinc-900">
                    <span className="text-zinc-400 truncate">{formatDay(record.date, 'short')}</span>
                    <span className="text-cyan-400 text-right">{day.calories}</span>
                    <span className="text-emerald-400 text-right">{day.protein}P</span>
                    <span className="text-amber-400 text-right">{day.carbs}K</span>
                    <span className="text-purple-400 text-right">{day.fats}Y</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-[10px] font-mono text-zinc-500">Kayıt girdikçe günlük tablo ve ortalamalar burada oluşacak.</p>
        )}
      </DisclosureCard>

      {adaptiveTDEE && (
        <DisclosureCard
          key={`tdee-${detailed}`}
          icon={Activity}
          title="Gerçek günlük harcama"
          summary={adaptiveTDEE.insufficient ? adaptiveTDEE.reason : `${adaptiveTDEE.tdee} kcal/gün · ${adaptiveTDEE.confidence} güven`}
          defaultOpen={false}
          accentClass="text-cyan-400"
        >
          {adaptiveTDEE.insufficient ? (
            <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">
              {adaptiveTDEE.reason} Yeterli veri oluşana kadar vücut ölçülerinden hesaplanan tahmin kullanılır.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Harcama', value: `${adaptiveTDEE.tdee} kcal` },
                  { label: 'Ort. Alım', value: `${adaptiveTDEE.avgIntake} kcal` },
                  { label: 'Kilo Hızı', value: `${adaptiveTDEE.weightChangePerWeek > 0 ? '+' : ''}${adaptiveTDEE.weightChangePerWeek} kg` },
                ].map(item => (
                  <div key={item.label} className="bg-zinc-950 border border-zinc-800 rounded-xl py-2">
                    <strong className="text-[10px] font-mono text-zinc-200 block">{item.value}</strong>
                    <span className="text-[8px] text-zinc-600 uppercase">{item.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">{adaptiveTDEE.note}</p>
            </div>
          )}
        </DisclosureCard>
      )}

      <div className="flex items-start gap-2 px-1 pb-2 text-[9px] font-mono text-zinc-600 leading-relaxed">
        <Sparkles size={12} className="text-orange-400 shrink-0" />
        Basit görünüm yalnızca kartları kapalı başlatır; tüm hesaplar ve girişler kullanılmaya devam eder.
      </div>
    </div>
  );
});

NutritionView.displayName = 'NutritionView';

export default NutritionView;
