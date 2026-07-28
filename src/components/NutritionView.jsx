import React, { memo } from 'react';
import { Beef, Plus, Save, Trash2, Calendar, Search, TrendingUp } from 'lucide-react';
import { parseNumber } from '../utils/helpers';

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
}) => {
  const safeMeals = Array.isArray(currentNutritionForm.meals) ? currentNutritionForm.meals : [];

  const totals = safeMeals.reduce((acc, m) => ({
    calories: acc.calories + parseNumber(m.calories),
    protein: acc.protein + parseNumber(m.protein),
    carbs: acc.carbs + parseNumber(m.carbs),
    fats: acc.fats + parseNumber(m.fats)
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const ffm = parseNumber(computedComp?.ffm) || 60;
  const targetProteinMultiplier = settings.nutritionGoal === 'bulk'
    ? (settings.proteinPerFfmBulk || 2.2)
    : (settings.proteinPerFfmCut || 2.6);
  const targetProtein = Math.round(ffm * targetProteinMultiplier);

  // Son 7 günün ortalamasını hesapla
  const recent7Days = (nutritionHistory || []).slice(0, 7);
  const avgStats = recent7Days.length > 0 ? recent7Days.reduce((acc, n) => {
    const safeM = Array.isArray(n.meals) ? n.meals : [];
    const dayCals = safeM.reduce((s, m) => s + parseNumber(m.calories), 0);
    const dayProt = safeM.reduce((s, m) => s + parseNumber(m.protein), 0);
    const dayCarbs = safeM.reduce((s, m) => s + parseNumber(m.carbs), 0);
    const dayFats = safeM.reduce((s, m) => s + parseNumber(m.fats), 0);

    return {
      calories: acc.calories + dayCals,
      protein: acc.protein + dayProt,
      carbs: acc.carbs + dayCarbs,
      fats: acc.fats + dayFats,
    };
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 }) : null;

  const weeklyAvg = avgStats ? {
    calories: Math.round(avgStats.calories / recent7Days.length),
    protein: Math.round(avgStats.protein / recent7Days.length),
    carbs: Math.round(avgStats.carbs / recent7Days.length),
    fats: Math.round(avgStats.fats / recent7Days.length),
  } : null;

  return (
    <div className="p-4 space-y-4 pb-24 h-full overflow-y-auto hide-scrollbar bg-black">
      {/* Tarih ve Hedef Seçimi */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 space-y-3">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
          <div className="flex items-center space-x-2">
            <Beef size={16} className="text-cyan-400" />
            <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">Beslenme & Makrolar</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsFoodSearchOpen(true)}
              className="bg-orange-950/50 border border-orange-900/60 text-orange-400 text-[9px] font-bold px-2 py-1 rounded-lg flex items-center hover:bg-orange-900/50 transition-colors"
            >
              <Search size={10} className="mr-1" /> Gıda Ara
            </button>
            <input
              type="date"
              value={currentNutritionForm.date}
              onChange={(e) => handleNutritionDateChange(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-1 text-zinc-300 font-mono text-[10px] outline-none"
            />
          </div>
        </div>

        {/* Günlük Toplam Makrolar */}
        <div className="grid grid-cols-4 gap-2 text-xs font-mono text-center">
          <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
            <span className="text-[8px] text-zinc-500 uppercase font-bold block">Kalori</span>
            <span className="text-cyan-400 font-bold text-sm">{totals.calories}</span>
          </div>
          <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
            <span className="text-[8px] text-zinc-500 uppercase font-bold block">Protein</span>
            <span className="text-emerald-400 font-bold text-sm">{totals.protein}g</span>
            <span className="text-[7px] text-zinc-600 block">/ {targetProtein}g</span>
          </div>
          <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
            <span className="text-[8px] text-zinc-500 uppercase font-bold block">Karb</span>
            <span className="text-amber-400 font-bold text-sm">{totals.carbs}g</span>
          </div>
          <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
            <span className="text-[8px] text-zinc-500 uppercase font-bold block">Yağ</span>
            <span className="text-purple-400 font-bold text-sm">{totals.fats}g</span>
          </div>
        </div>
      </div>

      {/* Haftalık 7 Günlük Ortalama Kartı */}
      {weeklyAvg && (
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 space-y-2">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center">
              <TrendingUp size={12} className="mr-1.5 text-orange-400" /> Son 7 Günlük Haftalık Ortalama
            </span>
            <span className="text-[9px] font-mono text-zinc-500">{recent7Days.length} Gün Kaydı</span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-xs font-mono text-center pt-1">
            <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
              <span className="text-[7px] text-zinc-500 uppercase block">Ort. Kalori</span>
              <span className="text-cyan-400 font-bold">{weeklyAvg.calories}</span>
            </div>
            <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
              <span className="text-[7px] text-zinc-500 uppercase block">Ort. Protein</span>
              <span className="text-emerald-400 font-bold">{weeklyAvg.protein}g</span>
            </div>
            <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
              <span className="text-[7px] text-zinc-500 uppercase block">Ort. Karb</span>
              <span className="text-amber-400 font-bold">{weeklyAvg.carbs}g</span>
            </div>
            <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
              <span className="text-[7px] text-zinc-500 uppercase block">Ort. Yağ</span>
              <span className="text-purple-400 font-bold">{weeklyAvg.fats}g</span>
            </div>
          </div>
        </div>
      )}

      {/* Öğün Listesi */}
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
                <span className="text-[10px] font-mono font-bold text-cyan-400">{meal.calories || 0} kcal</span>
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
                <label className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">Protein (g)</label>
                <input
                  type="number"
                  value={meal.protein}
                  onChange={(e) => updateMeal(meal.id, 'protein', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 font-mono text-emerald-400 outline-none text-center"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">Karb (g)</label>
                <input
                  type="number"
                  value={meal.carbs}
                  onChange={(e) => updateMeal(meal.id, 'carbs', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 font-mono text-amber-400 outline-none text-center"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">Yağ (g)</label>
                <input
                  type="number"
                  value={meal.fats}
                  onChange={(e) => updateMeal(meal.id, 'fats', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 font-mono text-purple-400 outline-none text-center"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex space-x-2">
        <button
          onClick={addMeal}
          className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold py-3 px-4 rounded-2xl flex justify-center items-center uppercase tracking-wide text-xs transition-all"
        >
          <Plus size={14} className="mr-1.5" /> Öğün Ekle
        </button>
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
