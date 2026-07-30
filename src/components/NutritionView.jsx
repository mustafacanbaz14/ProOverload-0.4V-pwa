import React, { memo } from 'react';
import { Beef, Plus, Save, Trash2, Calendar, Search, TrendingUp, Activity, Flame } from 'lucide-react';
import { parseNumber, clampNumber, INPUT_LIMITS } from '../utils/helpers';
import { dailyTotals } from '../utils/nutritionStats';
import { dayWorkoutCalories } from '../utils/cardio';

const NutritionView = memo(({
  currentNutritionForm,
  setCurrentNutritionForm,
  handleNutritionDateChange,
  updateMeal,
  addMeal,
  handleSaveNutrition,
  computedComp,
  settings,
  nutritionHistory,
  setIsFoodSearchOpen,
  adaptiveTDEE,
  workouts = [],
  latestWeight = 0,
}) => {
  const safeMeals = Array.isArray(currentNutritionForm.meals) ? currentNutritionForm.meals : [];
  const isDaily = currentNutritionForm.entryMode === 'daily';

  // Günlük modda tüm gün tek bir sentetik öğünde tutulur. Böylece toplamlar,
  // geçmiş kayıtlar ve TDEE hesabı gibi öğün toplamına dayanan her şey
  // değişmeden çalışır — fark yalnızca giriş arayüzünde.
  const dailyMeal = safeMeals[0] || {};

  const setEntryMode = (mode) => {
    setCurrentNutritionForm(prev => {
      if (mode === prev.entryMode) return prev;
      if (mode === 'daily') {
        // Öğünlerden günlük moda geçerken girilen veri toplanarak korunur.
        const sum = (Array.isArray(prev.meals) ? prev.meals : []).reduce((acc, m) => ({
          protein: acc.protein + parseNumber(m.protein),
          carbs: acc.carbs + parseNumber(m.carbs),
          fats: acc.fats + parseNumber(m.fats),
        }), { protein: 0, carbs: 0, fats: 0 });
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

  // Kalori makrolardan türetilir (4/4/9), elle girilmez.
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

  // Günlük toplam ve ortalamalar tek bir yerden hesaplanır; analiz sekmesi de
  // aynı fonksiyonları kullanıyor, böylece iki ekran farklı sayı gösteremez.
  const totals = dailyTotals(currentNutritionForm);

  const ffm = parseNumber(computedComp?.ffm) || 60;
  const targetProteinMultiplier = settings.nutritionGoal === 'bulk'
    ? (settings.proteinPerFfmBulk || 2.2)
    : (settings.proteinPerFfmCut || 2.6);
  const targetProtein = Math.round(ffm * targetProteinMultiplier);

  // Günün yakımı: antrenman kayıtlarından otomatik + kullanıcının elle eklediği.
  const burned = (() => {
    const auto = dayWorkoutCalories(workouts, currentNutritionForm.date, latestWeight);
    const manual = parseNumber(currentNutritionForm.activeCaloriesOut);
    return { ...auto, manual, total: auto.total + manual };
  })();

  const recent7Days = (nutritionHistory || []).slice(0, 7);
  const weeklyAvg = (() => {
    if (recent7Days.length === 0) return null;
    // Önce toplanır, sonra bir kez bölünür: her günü ayrı yuvarlamak hata biriktirir.
    const sum = recent7Days.map(dailyTotals).reduce((acc, d) => ({
      calories: acc.calories + d.calories,
      protein: acc.protein + d.protein,
      carbs: acc.carbs + d.carbs,
      fats: acc.fats + d.fats,
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
    const n = recent7Days.length;
    return {
      calories: Math.round(sum.calories / n),
      protein: Math.round(sum.protein / n),
      carbs: Math.round(sum.carbs / n),
      fats: Math.round(sum.fats / n),
    };
  })();

  return (
    <div className="p-4 space-y-4 pb-nav h-full overflow-y-auto hide-scrollbar bg-black">
      {/* Gerçek harcama: kilo trendi + alım geçmişinden hesaplanır */}
      {adaptiveTDEE && (
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-800 bg-zinc-950/60">
            <h3 className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider flex items-center">
              <Activity size={13} className="mr-2 text-emerald-400" /> Gerçek Günlük Harcama
            </h3>
            {!adaptiveTDEE.insufficient && (
              <span className="text-[9px] font-mono text-zinc-500 uppercase">Güven: {adaptiveTDEE.confidence}</span>
            )}
          </div>

          <div className="p-4">
            {adaptiveTDEE.insufficient ? (
              <div className="space-y-1.5">
                <p className="text-[11px] font-mono text-zinc-400">{adaptiveTDEE.reason}</p>
                <p className="text-[10px] font-mono text-zinc-600 leading-relaxed">
                  Yeterli veri birikince gerçek metabolizma hızın buradan hesaplanacak.
                  O zamana kadar aşağıdaki hedefler formül BMR üzerinden veriliyor.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <span className="text-3xl font-mono font-bold text-emerald-400">{adaptiveTDEE.tdee}</span>
                    <span className="text-[11px] font-mono text-zinc-500 ml-1">kcal/gün</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 text-right">{adaptiveTDEE.note}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { l: 'Ort. Alım', v: adaptiveTDEE.avgIntake + ' kcal' },
                    { l: 'Haftalık', v: (adaptiveTDEE.weightChangePerWeek > 0 ? '+' : '') + adaptiveTDEE.weightChangePerWeek + ' kg' },
                    { l: 'Veri', v: adaptiveTDEE.days + ' gün' },
                  ].map(x => (
                    <div key={x.l} className="bg-zinc-950 border border-zinc-800 rounded-xl py-2">
                      <span className="text-[9px] font-mono text-zinc-500 block">{x.l}</span>
                      <span className="text-[11px] font-mono font-bold text-zinc-200">{x.v}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] font-mono text-zinc-600 mt-3 leading-relaxed">
                  Kilo değişimi × 7700 kcal, ortalama alımdan düşülerek hesaplanır.
                  Formül BMR'den farklıysa gerçek olan budur.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tarih ve Hedef Seçimi */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 space-y-3">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
          <div className="flex items-center space-x-2">
            <Beef size={16} className="text-cyan-400" />
            <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">Beslenme & Makrolar</h3>
          </div>
          <div className="flex items-center space-x-2">
            {/* Gıda arama öğün moduna özel: günlük toplam modunda besinler
                tek tek eklenmiyor, makrolar doğrudan yazılıyor. */}
            {!isDaily && (
              <button
                onClick={() => setIsFoodSearchOpen(true)}
                className="bg-orange-950/50 border border-orange-900/60 text-orange-400 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center hover:bg-orange-900/50 transition-colors"
              >
                <Search size={10} className="mr-1" /> Gıda Ara
              </button>
            )}
            <input
              type="date"
              value={currentNutritionForm.date}
              onChange={(e) => handleNutritionDateChange(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-1 text-zinc-300 font-mono text-[11px] outline-none"
            />
          </div>
        </div>

        {/* Günlük Toplam Makrolar */}
        <div className="grid grid-cols-4 gap-2 text-xs font-mono text-center">
          <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-500 uppercase font-bold block">Kalori</span>
            <span className="text-cyan-400 font-bold text-sm">{totals.calories}</span>
          </div>
          <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-500 uppercase font-bold block">Protein</span>
            <span className="text-emerald-400 font-bold text-sm">{totals.protein}g</span>
            <span className="text-[9px] text-zinc-600 block">/ {targetProtein}g</span>
          </div>
          <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-500 uppercase font-bold block">Karb</span>
            <span className="text-amber-400 font-bold text-sm">{totals.carbs}g</span>
          </div>
          <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-500 uppercase font-bold block">Yağ</span>
            <span className="text-purple-400 font-bold text-sm">{totals.fats}g</span>
          </div>
        </div>
      </div>

      {/* Haftalık 7 Günlük Ortalama Kartı */}
      {weeklyAvg && (
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 space-y-2">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center">
              <TrendingUp size={12} className="mr-1.5 text-orange-400" /> Son 7 Günlük Haftalık Ortalama
            </span>
            <span className="text-[10px] font-mono text-zinc-500">{recent7Days.length} Gün Kaydı</span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-xs font-mono text-center pt-1">
            <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
              <span className="text-[9px] text-zinc-500 uppercase block">Ort. Kalori</span>
              <span className="text-cyan-400 font-bold">{weeklyAvg.calories}</span>
            </div>
            <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
              <span className="text-[9px] text-zinc-500 uppercase block">Ort. Protein</span>
              <span className="text-emerald-400 font-bold">{weeklyAvg.protein}g</span>
            </div>
            <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
              <span className="text-[9px] text-zinc-500 uppercase block">Ort. Karb</span>
              <span className="text-amber-400 font-bold">{weeklyAvg.carbs}g</span>
            </div>
            <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
              <span className="text-[9px] text-zinc-500 uppercase block">Ort. Yağ</span>
              <span className="text-purple-400 font-bold">{weeklyAvg.fats}g</span>
            </div>
          </div>
        </div>
      )}

      {/* Enerji dengesi: yakım antrenman kayıtlarından otomatik gelir, kullanıcı
          üstüne elle ekleme yapabilir (adım sayısı, iş günü hareketliliği vb.) */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
        <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-800 bg-zinc-950/60">
          <h3 className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider flex items-center">
            <Flame size={13} className="mr-2 text-red-400" /> Enerji Dengesi
          </h3>
          <span className="text-[10px] font-mono text-zinc-500">{currentNutritionForm.date}</span>
        </div>

        <div className="p-4 space-y-3">
          {latestWeight > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl py-2.5">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block">Alınan</span>
                  <span className="text-sm font-mono font-bold text-cyan-400">{Math.round(totals.calories)}</span>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl py-2.5">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block">Yakılan</span>
                  <span className="text-sm font-mono font-bold text-red-400">{burned.total}</span>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl py-2.5">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block">Net</span>
                  <span className={`text-sm font-mono font-bold ${totals.calories - burned.total >= 0 ? 'text-zinc-100' : 'text-emerald-400'}`}>
                    {Math.round(totals.calories) - burned.total > 0 ? '+' : ''}{Math.round(totals.calories) - burned.total}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-[10px] font-mono">
                <div className="flex justify-between text-zinc-500">
                  <span>Ağırlık antrenmanı (otomatik)</span>
                  <span className="text-zinc-300">{burned.lifting} kcal</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Kardiyo (otomatik)</span>
                  <span className="text-zinc-300">{burned.cardio} kcal</span>
                </div>
                <div className="flex justify-between items-center text-zinc-500 pt-1.5 border-t border-zinc-800">
                  <span>Elle eklenen</span>
                  <span className="flex items-center gap-1.5">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={5000}
                      value={currentNutritionForm.activeCaloriesOut ?? ''}
                      onChange={(e) => setCurrentNutritionForm(prev => ({
                        ...prev, activeCaloriesOut: e.target.value,
                      }))}
                      // Sınırlama odaktan çıkışta: yazarken uygulanınca ara
                      // değerler üst sınıra çarpıyor.
                      onBlur={(e) => setCurrentNutritionForm(prev => ({
                        ...prev,
                        activeCaloriesOut: e.target.value === '' ? '' : clampNumber(e.target.value, 0, 5000),
                      }))}
                      placeholder="0"
                      className="w-20 bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 text-center font-mono text-red-400 text-[11px] outline-none focus:border-red-500"
                    />
                    <span className="text-zinc-600">kcal</span>
                  </span>
                </div>
              </div>

              <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
                Otomatik yakım {latestWeight} kg üzerinden, dinlenmenin üstüne hesaplanır.
                Adım sayısı gibi gün içi hareketliliği elle ekleyebilirsin.
              </p>
            </>
          ) : (
            <p className="text-[11px] font-mono text-amber-400 leading-relaxed">
              Kalori yakımı tahmini için kiloya ihtiyaç var.
              <br />
              <span className="text-zinc-500">Vücut sekmesinden bir ölçüm girdiğinde otomatik hesaplanacak.</span>
            </p>
          )}
        </div>
      </div>

      {/* Giriş modu: öğün öğün mü, günün toplamı mı */}
      <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
        {[
          { key: 'meals', label: 'Öğün Öğün' },
          { key: 'daily', label: 'Günlük Toplam' },
        ].map(m => (
          <button
            key={m.key}
            onClick={() => setEntryMode(m.key)}
            className={`flex-1 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors ${
              (currentNutritionForm.entryMode || 'meals') === m.key ? 'bg-orange-600 text-white' : 'text-zinc-500'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {isDaily ? (
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 space-y-3">
          <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">
            Günün toplam makrolarını gir; kalori bunlardan hesaplanır
            (protein ve karbonhidrat 4 kcal/g, yağ 9 kcal/g). Kaloriyi başka bir
            uygulamada saydıysan öğün öğün girmene gerek yok.
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'protein', label: 'Protein (g)', color: 'text-emerald-400' },
              { key: 'carbs', label: 'Karb (g)', color: 'text-amber-400' },
              { key: 'fats', label: 'Yağ (g)', color: 'text-purple-400' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">{f.label}</label>
                <input
                  type="number"
                  inputMode="decimal"
                  min={INPUT_LIMITS.macro.min}
                  max={INPUT_LIMITS.macro.max}
                  value={dailyMeal[f.key] ?? ''}
                  onChange={(e) => updateDailyMacro(f.key, e.target.value)}
                  onBlur={(e) => updateDailyMacro(f.key, clampNumber(e.target.value, INPUT_LIMITS.macro.min, INPUT_LIMITS.macro.max))}
                  placeholder="0"
                  className={`w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 font-mono text-sm text-center outline-none focus:border-orange-500 transition-colors ${f.color}`}
                />
              </div>
            ))}
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-center">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Hesaplanan Kalori</span>
            <span className="text-2xl font-mono font-bold text-cyan-400">{parseNumber(dailyMeal.calories)}</span>
            <span className="text-[11px] font-mono text-zinc-500 ml-1">kcal</span>
          </div>
        </div>
      ) : (
      /* Öğün Listesi */
      <div className="space-y-3">
        {safeMeals.map((meal, index) => (
          <div key={meal.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-3.5 space-y-2.5">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <input
                type="text"
                value={meal.name}
                onChange={(e) => updateMeal(meal.id, 'name', e.target.value)}
                className="bg-transparent font-bold text-xs text-zinc-200 outline-none w-1/2"
                placeholder={`${index + 1}. Öğün`}
              />
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono font-bold text-cyan-400">{meal.calories || 0} kcal</span>
                {safeMeals.length > 1 && (
                  <button
                    onClick={() => setCurrentNutritionForm(prev => ({
                      ...prev,
                      meals: prev.meals.filter(m => m.id !== meal.id)
                    }))}
                    className="text-zinc-600 hover:text-red-500 p-1"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Protein (g)</label>
                <input
                  type="number"
                  min={INPUT_LIMITS.macro.min} max={INPUT_LIMITS.macro.max}
                  value={meal.protein}
                  onChange={(e) => updateMeal(meal.id, 'protein', e.target.value)}
                  onBlur={(e) => updateMeal(meal.id, 'protein', clampNumber(e.target.value, INPUT_LIMITS.macro.min, INPUT_LIMITS.macro.max))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 font-mono text-emerald-400 outline-none text-center"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Karb (g)</label>
                <input
                  type="number"
                  min={INPUT_LIMITS.macro.min} max={INPUT_LIMITS.macro.max}
                  value={meal.carbs}
                  onChange={(e) => updateMeal(meal.id, 'carbs', e.target.value)}
                  onBlur={(e) => updateMeal(meal.id, 'carbs', clampNumber(e.target.value, INPUT_LIMITS.macro.min, INPUT_LIMITS.macro.max))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 font-mono text-amber-400 outline-none text-center"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Yağ (g)</label>
                <input
                  type="number"
                  min={INPUT_LIMITS.macro.min} max={INPUT_LIMITS.macro.max}
                  value={meal.fats}
                  onChange={(e) => updateMeal(meal.id, 'fats', e.target.value)}
                  onBlur={(e) => updateMeal(meal.id, 'fats', clampNumber(e.target.value, INPUT_LIMITS.macro.min, INPUT_LIMITS.macro.max))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 font-mono text-purple-400 outline-none text-center"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      <div className="flex space-x-2">
        {!isDaily && (
          <button
            onClick={addMeal}
            className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold py-3 px-4 rounded-2xl flex justify-center items-center uppercase tracking-wide text-xs transition-all"
          >
            <Plus size={14} className="mr-1.5" /> Öğün Ekle
          </button>
        )}
        <button
          onClick={handleSaveNutrition}
          className="flex-1 bg-cyan-600 active:bg-cyan-700 text-white font-bold py-3 px-4 rounded-2xl flex justify-center items-center uppercase tracking-wide text-xs shadow-lg shadow-cyan-900/20 transition-all"
        >
          <Save size={14} className="mr-1.5" /> Kaydet
        </button>
      </div>
    </div>
  );
});

NutritionView.displayName = 'NutritionView';

export default NutritionView;
