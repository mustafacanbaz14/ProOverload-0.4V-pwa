import React, { memo } from 'react';
import { Trash2, Calendar, Scale, Beef, Pencil, Copy } from 'lucide-react';
import { calcTonnage, calcEffectiveSets, isWorkingSet } from '../utils/helpers';

// Listeler App tarafından tarihe göre azalan sırada verilir (en yeni en üstte).
// Burada tekrar sıralama veya ters çevirme yapılmaz.
const HistoryView = memo(({
  historyTab,
  setHistoryTab,
  workouts,
  metricsHistory,
  nutritionHistory,
  setDeleteConfirm,
  handleEditOldWorkoutDate,
  handleEditOldWorkout,
  handleRepeatWorkout,
  handleEditMetric,
  handleEditNutrition,
}) => {
  return (
    <div className="p-4 space-y-4 pb-24 h-full overflow-y-auto hide-scrollbar bg-black">
      <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
        <button
          onClick={() => setHistoryTab('workouts')}
          className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors ${historyTab === 'workouts' ? 'bg-cyan-600 text-white' : 'text-zinc-500'}`}
        >
          Antrenmanlar ({workouts.length})
        </button>
        <button
          onClick={() => setHistoryTab('metrics')}
          className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors ${historyTab === 'metrics' ? 'bg-cyan-600 text-white' : 'text-zinc-500'}`}
        >
          Ölçümler ({metricsHistory.length})
        </button>
        <button
          onClick={() => setHistoryTab('nutrition')}
          className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors ${historyTab === 'nutrition' ? 'bg-cyan-600 text-white' : 'text-zinc-500'}`}
        >
          Beslenme ({nutritionHistory.length})
        </button>
      </div>

      {historyTab === 'workouts' && (
        <div className="space-y-3">
          {workouts.length === 0 ? (
            <div className="text-center py-12 text-zinc-600 text-xs font-mono">Henüz antrenman kaydı yok</div>
          ) : (
            workouts.map(w => {
              const tonnage = calcTonnage(w.exercises);
              const effectiveSets = calcEffectiveSets(w.exercises);
              return (
                <div key={w.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 space-y-3">
                  <div className="flex justify-between items-start border-b border-zinc-800 pb-2">
                    <div>
                      <h4 className="text-sm font-bold text-cyan-400">{w.name || 'Serbest Antrenman'}</h4>
                      <div className="flex items-center space-x-2 text-[9px] font-mono text-zinc-500 mt-0.5">
                        <Calendar size={10} />
                        <input
                          type="date"
                          value={w.date}
                          onChange={(e) => handleEditOldWorkoutDate(w.id, e.target.value)}
                          className="bg-transparent text-zinc-400 font-mono outline-none border-b border-dashed border-zinc-700 focus:border-cyan-500 text-[9px]"
                        />
                      </div>
                    </div>
                    <div className="flex items-center shrink-0">
                      <button
                        onClick={() => handleRepeatWorkout?.(w)}
                        title="Bu antrenmanı bugün tekrarla"
                        className="text-zinc-500 active:text-cyan-400 p-2"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => handleEditOldWorkout?.(w)}
                        title="Setleri düzenle"
                        className="text-zinc-500 active:text-cyan-400 p-2"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ isOpen: true, type: 'workout', id: w.id })}
                        title="Sil"
                        className="text-zinc-600 active:text-red-500 p-2"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                    <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
                      <span className="text-zinc-500 block text-[8px] uppercase font-bold">Toplam Hacim</span>
                      <span className="text-zinc-200 font-bold">{tonnage} kg</span>
                    </div>
                    <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
                      <span className="text-zinc-500 block text-[8px] uppercase font-bold">Etkili Set (RIR ≤ 3)</span>
                      <span className="text-cyan-400 font-bold">{effectiveSets} Set</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {(w.exercises || []).map((ex, i) => (
                      <div key={i} className="text-[10px] font-mono text-zinc-300 bg-zinc-950/50 p-2 rounded-xl border border-zinc-800/50 flex justify-between items-center">
                        <span className="font-bold text-zinc-200 truncate pr-2">{ex.name}</span>
                        <span className="text-zinc-400 text-[9px] shrink-0">
                          {(ex.sets || []).filter(isWorkingSet).map(s => `${s.weight}x${s.reps}`).join(' · ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {historyTab === 'metrics' && (
        <div className="space-y-3">
          {metricsHistory.length === 0 ? (
            <div className="text-center py-12 text-zinc-600 text-xs font-mono">Henüz ölçüm kaydı yok</div>
          ) : (
            metricsHistory.map(m => (
              <div key={m.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 space-y-2">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <Scale size={14} className="text-cyan-400" />
                    <span className="text-xs font-bold text-zinc-200 font-mono">{m.date}</span>
                  </div>
                  <div className="flex items-center shrink-0">
                    <button onClick={() => handleEditMetric?.(m)} title="Bu ölçümü düzenle" className="text-zinc-500 active:text-cyan-400 p-2">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleteConfirm({ isOpen: true, type: 'metric', id: m.id })} title="Sil" className="text-zinc-600 active:text-red-500 p-2">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[9px] font-mono text-zinc-300 pt-1">
                  <div>Kilo: <strong className="text-cyan-400">{m.weight} kg</strong></div>
                  <div>Yağ: <strong className="text-cyan-400">%{m.bodyFat || '-'}</strong></div>
                  <div>Kol: <strong className="text-zinc-200">{m.measurements?.arm || '-'} cm</strong></div>
                  <div>Bel: <strong className="text-zinc-200">{m.measurements?.waist || '-'} cm</strong></div>
                  <div>Göğüs: <strong className="text-zinc-200">{m.measurements?.chest || '-'} cm</strong></div>
                  <div>Uyluk: <strong className="text-zinc-200">{m.measurements?.thigh || '-'} cm</strong></div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {historyTab === 'nutrition' && (
        <div className="space-y-3">
          {nutritionHistory.length === 0 ? (
            <div className="text-center py-12 text-zinc-600 text-xs font-mono">Henüz beslenme kaydı yok</div>
          ) : (
            nutritionHistory.map(n => (
              <div key={n.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 space-y-2">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <Beef size={14} className="text-cyan-400" />
                    <span className="text-xs font-bold text-zinc-200 font-mono">{n.date}</span>
                  </div>
                  <div className="flex items-center shrink-0">
                    <button onClick={() => handleEditNutrition?.(n)} title="Bu kaydı düzenle" className="text-zinc-500 active:text-cyan-400 p-2">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleteConfirm({ isOpen: true, type: 'nutrition', id: n.id })} title="Sil" className="text-zinc-600 active:text-red-500 p-2">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-[9px] font-mono text-zinc-300 pt-1">
                  <div>Kalori: <strong className="text-cyan-400">{n.caloriesIn} kcal</strong></div>
                  <div>Protein: <strong className="text-emerald-400">{n.protein}g</strong></div>
                  <div>Karb: <strong className="text-amber-400">{n.carbs}g</strong></div>
                  <div>Yağ: <strong className="text-purple-400">{n.fats}g</strong></div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
});

HistoryView.displayName = 'HistoryView';

export default HistoryView;
