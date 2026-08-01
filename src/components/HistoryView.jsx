import React, { memo, useMemo, useState } from 'react';
import { Trash2, Calendar, Scale, Beef, Pencil, Copy, BookmarkPlus, HeartPulse, Search, Timer, Flame, Activity } from 'lucide-react';
import { calcTonnage, calcEffectiveSets, isWorkingSet, foldForSearch } from '../utils/helpers';
import {
  findActivity, findEffort, effortDelta, cardioEntryCalories, totalCardioCalories,
  dayWorkoutCalories, cardioArchiveSummary, evaluateCardioEntry,
} from '../utils/cardio';
import { dailyTotals } from '../utils/nutritionStats';
import { parseNumber, clampNumber } from '../utils/helpers';
import { formatDay, weekdayName } from '../utils/dates';
import { dayMindCalories } from '../utils/wellness';

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
  handleSaveAsTemplate,
  latestWeight = 0,
  wellness = [],
  maintenanceCalories = 0,
  onUpdateNutrition,
}) => {
  const [query, setQuery] = useState('');
  const q = foldForSearch(query).trim();
  const strengthWorkouts = useMemo(() => workouts.filter(w => (w.exercises || []).length > 0), [workouts]);
  const cardioRecords = useMemo(() => workouts.flatMap(workout => (workout.cardio || []).map(cardio => ({
    workoutId: workout.id, date: workout.date, workoutName: workout.name, cardio,
  }))), [workouts]);
  const filteredWorkouts = useMemo(() => !q ? strengthWorkouts : strengthWorkouts.filter(w =>
    foldForSearch(`${w.name || ''} ${w.date} ${(w.exercises || []).map(ex => ex.name).join(' ')}`).includes(q)), [strengthWorkouts, q]);
  const filteredCardio = useMemo(() => !q ? cardioRecords : cardioRecords.filter(record =>
    foldForSearch(`${record.date} ${findActivity(record.cardio.type)?.label || record.cardio.type} ${record.workoutName || ''}`).includes(q)), [cardioRecords, q]);
  const filteredMetrics = useMemo(() => !q ? metricsHistory : metricsHistory.filter(m =>
    foldForSearch(`${m.date} ${m.weight} ${m.bodyFat || ''}`).includes(q)), [metricsHistory, q]);
  const filteredNutrition = useMemo(() => !q ? nutritionHistory : nutritionHistory.filter(n =>
    foldForSearch(`${n.date} ${(n.meals || []).map(meal => meal.name).join(' ')}`).includes(q)), [nutritionHistory, q]);
  const cardioSummary = useMemo(
    () => cardioArchiveSummary(workouts, latestWeight),
    [workouts, latestWeight]);

  return (
    <div className="p-4 space-y-4 pb-nav h-full overflow-y-auto hide-scrollbar bg-black">
      <div>
        <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest">Kayıt Arşivi</span>
        <h2 className="text-xl font-black text-zinc-100 mt-0.5">Geçmiş</h2>
      </div>
      <div className="grid grid-cols-4 bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
        <button
          onClick={() => setHistoryTab('workouts')}
          className={`py-2 rounded-xl text-[9px] font-bold uppercase tracking-wide transition-colors ${historyTab === 'workouts' ? 'bg-cyan-600 text-white' : 'text-zinc-500'}`}
        >
          Ağırlık ({strengthWorkouts.length})
        </button>
        <button
          onClick={() => setHistoryTab('cardio')}
          className={`py-2 rounded-xl text-[9px] font-bold uppercase tracking-wide transition-colors ${historyTab === 'cardio' ? 'bg-red-600 text-white' : 'text-zinc-500'}`}
        >
          Kardiyo ({cardioRecords.length})
        </button>
        <button
          onClick={() => setHistoryTab('metrics')}
          className={`py-2 rounded-xl text-[9px] font-bold uppercase tracking-wide transition-colors ${historyTab === 'metrics' ? 'bg-cyan-600 text-white' : 'text-zinc-500'}`}
        >
          Ölçüm ({metricsHistory.length})
        </button>
        <button
          onClick={() => setHistoryTab('nutrition')}
          className={`py-2 rounded-xl text-[9px] font-bold uppercase tracking-wide transition-colors ${historyTab === 'nutrition' ? 'bg-cyan-600 text-white' : 'text-zinc-500'}`}
        >
          Besin ({nutritionHistory.length})
        </button>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tarih, hareket, öğün veya kayıt ara…" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-zinc-200 outline-none focus:border-cyan-600" />
      </div>

      {historyTab === 'workouts' && (
        <div className="space-y-3">
          {filteredWorkouts.length === 0 ? (
            <div className="text-center py-12 text-zinc-600 text-xs font-mono">Henüz antrenman kaydı yok</div>
          ) : (
            filteredWorkouts.map(w => {
              const tonnage = calcTonnage(w.exercises);
              const effectiveSets = calcEffectiveSets(w.exercises);
              const cardio = w.cardio || [];
              const cardioKcal = totalCardioCalories(cardio, latestWeight);
              return (
                <div key={w.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 space-y-3">
                  <div className="flex justify-between items-start border-b border-zinc-800 pb-2">
                    <div>
                      <h4 className="text-sm font-bold text-cyan-400">{w.name || 'Serbest Antrenman'}</h4>
                      <div className="flex items-center space-x-2 text-[10px] font-mono text-zinc-500 mt-0.5">
                        <Calendar size={10} />
                        <input
                          type="date"
                          value={w.date}
                          onChange={(e) => handleEditOldWorkoutDate(w.id, e.target.value)}
                          className="bg-transparent text-zinc-400 font-mono outline-none border-b border-dashed border-zinc-700 focus:border-cyan-500 text-[10px]"
                        />
                        {/* Tarih girdisi gün adını göstermiyor; program takibinde
                            asıl bilgi o olduğu için yanına ayrıca yazılıyor. */}
                        <span className="text-cyan-500/80 font-bold">{weekdayName(w.date)}</span>
                      </div>
                    </div>
                    <div className="flex items-center shrink-0">
                      <button
                        onClick={() => handleSaveAsTemplate?.(w)}
                        title="Şablon olarak kaydet"
                        className="text-zinc-500 active:text-cyan-400 p-2"
                      >
                        <BookmarkPlus size={14} />
                      </button>
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

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
                      <span className="text-zinc-500 block text-[10px] uppercase font-bold">Toplam Hacim</span>
                      <span className="text-zinc-200 font-bold">{tonnage} kg</span>
                    </div>
                    <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
                      <span className="text-zinc-500 block text-[10px] uppercase font-bold">Etkili Set (RIR ≤ 3)</span>
                      <span className="text-cyan-400 font-bold">{effectiveSets} Set</span>
                    </div>
                  </div>

                  {cardio.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between px-0.5">
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center">
                          <HeartPulse size={11} className="mr-1.5" /> Kardiyo
                        </span>
                        {cardioKcal > 0 && (
                          <span className="text-[10px] font-mono text-zinc-500">
                            toplam <strong className="text-red-400">{cardioKcal}</strong> kcal
                          </span>
                        )}
                      </div>
                      {cardio.map(c => {
                        // Planla arasındaki tempo farkı varsa gösterilir: haftalık
                        // dengeyi bozan çoğunlukla plandan sapan şiddet oluyor.
                        const sapma = effortDelta(c, latestWeight);
                        return (
                          <div key={c.id} className="text-[11px] font-mono text-zinc-300 bg-red-950/10 p-2 rounded-xl border border-red-900/25 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-zinc-200 truncate pr-2">{findActivity(c.type)?.label || c.type}</span>
                              <span className="text-zinc-400 text-[10px] shrink-0">
                                {c.minutes} dk
                                {c.effort && ` · ${findEffort(c.effort).label}`}
                                {latestWeight > 0 && ` · ${cardioEntryCalories(c, latestWeight)} kcal`}
                              </span>
                            </div>
                            {sapma && (
                              <p className={`text-[9px] ${sapma.harder ? 'text-amber-400' : 'text-cyan-400'}`}>
                                Plan {sapma.planned.label} → gerçekleşen {sapma.actual.label}
                                {' · '}{sapma.kcalDiff > 0 ? '+' : ''}{sapma.kcalDiff} kcal
                                {' · yorgunluk '}{sapma.fatigueDiff > 0 ? '+' : ''}{sapma.fatigueDiff}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Set özeti alt satıra sarar: shrink-0 ile tek satırda
                      tutulunca çok setli hareketlerde metin ekranın dışına
                      taşıp görünmeden kesiliyordu. */}
                  <div className="space-y-1.5 pt-1">
                    {(w.exercises || []).map((ex, i) => (
                      <div key={i} className="text-[11px] font-mono text-zinc-300 bg-zinc-950/50 p-2 rounded-xl border border-zinc-800/50 flex justify-between items-start gap-2">
                        <span className="font-bold text-zinc-200 truncate shrink-0 max-w-[45%]">{ex.name}</span>
                        <span className="text-zinc-400 text-[10px] text-right break-words min-w-0">
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

      {historyTab === 'cardio' && (
        <div className="space-y-3">
          {cardioSummary.count > 0 && (
            <section className="bg-gradient-to-br from-red-950/35 to-zinc-900 rounded-2xl border border-red-900/35 p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[9px] font-mono text-red-400 uppercase tracking-widest">Kardiyo Özeti</span>
                  <h3 className="text-[12px] font-bold text-zinc-100">Kişisel arşiv ortalamaların</h3>
                </div>
                <Activity size={18} className="text-red-400" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  [<HeartPulse key="sessions" size={11} />, 'Kayıt', cardioSummary.count],
                  [<Timer key="minutes" size={11} />, 'Toplam', `${cardioSummary.totalMinutes} dk`],
                  [<Flame key="calories" size={11} />, 'Yakım', latestWeight > 0 ? `${cardioSummary.totalCalories} kcal` : '—'],
                ].map(([icon, label, value]) => (
                  <div key={label} className="bg-zinc-950/80 border border-zinc-800 rounded-xl py-2">
                    <span className="flex justify-center text-red-400 mb-0.5">{icon}</span>
                    <strong className="text-[11px] font-mono text-zinc-100 block">{value}</strong>
                    <span className="text-[8px] font-mono text-zinc-600 uppercase">{label}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                {cardioSummary.activities.map(item => (
                  <div key={item.type} className="flex justify-between text-[9px] font-mono text-zinc-500">
                    <span>{findActivity(item.type)?.label || item.type}</span>
                    <span>{item.count} kayıt · ort. {Math.round(item.minutes / item.count)} dk</span>
                  </div>
                ))}
              </div>
            </section>
          )}
          {filteredCardio.length === 0 ? (
            <div className="text-center py-12 text-zinc-600 text-xs font-mono">Henüz kardiyo kaydı yok</div>
          ) : filteredCardio.map(record => {
            const activity = findActivity(record.cardio.type);
            const effort = findEffort(record.cardio.effort);
            const calories = cardioEntryCalories(record.cardio, latestWeight);
            const deviation = effortDelta(record.cardio, latestWeight);
            const evaluation = evaluateCardioEntry(record.cardio, workouts, latestWeight);
            return (
              <div key={`${record.workoutId}-${record.cardio.id}`} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 space-y-2.5">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-red-400 flex items-center"><HeartPulse size={14} className="mr-1.5" />{activity?.label || record.cardio.type}</h4>
                    <span className="text-[10px] font-mono text-zinc-500">{formatDay(record.date, 'medium', { year: true })}</span>
                  </div>
                  <button onClick={() => setDeleteConfirm({ isOpen: true, type: 'cardio', id: `${record.workoutId}::${record.cardio.id}` })} aria-label="Kardiyo kaydını sil" className="p-2 text-zinc-600 active:text-red-500"><Trash2 size={14} /></button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    ['Süre', `${record.cardio.minutes} dk`],
                    ['Tempo', effort?.label || 'Orta'],
                    ['Yakım', latestWeight > 0 ? `${calories} kcal` : '—'],
                  ].map(([label, value]) => <div key={label} className="bg-zinc-950 border border-zinc-800 rounded-xl py-2"><span className="text-[8px] font-mono text-zinc-600 uppercase block">{label}</span><strong className="text-[10px] font-mono text-zinc-200">{value}</strong></div>)}
                </div>
                {evaluation.stats.count > 1 && (
                  <div className={`rounded-xl border px-3 py-2 ${evaluation.tone === 'harder'
                    ? 'border-amber-900/40 bg-amber-950/15'
                    : evaluation.tone === 'lighter'
                      ? 'border-cyan-900/40 bg-cyan-950/15'
                      : 'border-zinc-800 bg-zinc-950/60'}`}>
                    <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">
                      Bu aktivitedeki son {evaluation.stats.count} kayıt ortalaman:
                      {' '}<strong className="text-zinc-200">{evaluation.stats.avgMinutes} dk</strong>
                      {latestWeight > 0 && <> · <strong className="text-zinc-200">{evaluation.stats.avgCalories} kcal</strong></>}
                      . Bu kayıt süre olarak {evaluation.minuteDiff === 0 ? 'ortalamanla aynı' : `${Math.abs(evaluation.minuteDiff)} dk ${evaluation.minuteDiff > 0 ? 'uzun' : 'kısa'}`}
                      {evaluation.tone === 'harder' ? ' ve normalden daha yorucu.' : evaluation.tone === 'lighter' ? ' ve daha hafif.' : '.'}
                    </p>
                  </div>
                )}
                {record.cardio.effort === 'fun' && (
                  <span className="inline-flex text-[9px] font-bold text-indigo-300 border border-indigo-900/40 bg-indigo-950/20 rounded-lg px-2 py-1">
                    Aktif toparlanma temposu
                  </span>
                )}
                {deviation && <p className={`text-[9px] font-mono ${deviation.harder ? 'text-amber-400' : 'text-cyan-400'}`}>Plan {deviation.planned.label} → gerçekleşen {deviation.actual.label} · {deviation.kcalDiff > 0 ? '+' : ''}{deviation.kcalDiff} kcal</p>}
              </div>
            );
          })}
        </div>
      )}

      {historyTab === 'metrics' && (
        <div className="space-y-3">
          {filteredMetrics.length === 0 ? (
            <div className="text-center py-12 text-zinc-600 text-xs font-mono">Henüz ölçüm kaydı yok</div>
          ) : (
            filteredMetrics.map(m => (
              <div key={m.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 space-y-2">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <Scale size={14} className="text-cyan-400" />
                    <span className="text-xs font-bold text-zinc-200 font-mono">{formatDay(m.date, 'medium', { year: true })}</span>
                  </div>
                  <div className="flex items-center shrink-0">
                    <button onClick={() => handleEditMetric?.(m)} title="Bu ölçümü düzenle" aria-label="Bu ölçümü düzenle" className="text-zinc-500 active:text-cyan-400 p-2">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleteConfirm({ isOpen: true, type: 'metric', id: m.id })} title="Sil" aria-label="Ölçümü sil" className="text-zinc-600 active:text-red-500 p-2">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-zinc-300 pt-1">
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
          {filteredNutrition.length === 0 ? (
            <div className="text-center py-12 text-zinc-600 text-xs font-mono">Henüz beslenme kaydı yok</div>
          ) : (
            filteredNutrition.map(n => {
              // Toplamlar öğünlerden hesaplanır. Eskiden kayıttaki üst düzey
              // caloriesIn/protein/carbs/fats alanları okunuyordu ama bu alanlar
              // hiçbir zaman doldurulmuyordu; veri girilmiş günler bile 0 görünüyordu.
              const t = dailyTotals(n);
              const isDaily = n.entryMode === 'daily';
              return (
                <div key={n.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 space-y-2">
                  <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      <Beef size={14} className="text-cyan-400 shrink-0" />
                      <span className="text-xs font-bold text-zinc-200 font-mono">{formatDay(n.date, 'medium', { year: true })}</span>
                      <span className="text-[9px] font-mono text-zinc-600 uppercase shrink-0">
                        {isDaily ? 'günlük toplam' : `${(n.meals || []).length} öğün`}
                      </span>
                    </div>
                    <div className="flex items-center shrink-0">
                      <button onClick={() => handleEditNutrition?.(n)} title="Bu kaydı düzenle" aria-label="Bu kaydı düzenle" className="text-zinc-500 active:text-cyan-400 p-2">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteConfirm({ isOpen: true, type: 'nutrition', id: n.id })} title="Sil" aria-label="Sil" className="text-zinc-600 active:text-red-500 p-2">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-[10px] font-mono text-zinc-300 pt-1">
                    <div>Kalori: <strong className="text-cyan-400">{Math.round(t.calories)}</strong></div>
                    <div>Protein: <strong className="text-emerald-400">{Math.round(t.protein)}g</strong></div>
                    <div>Karb: <strong className="text-amber-400">{Math.round(t.carbs)}g</strong></div>
                    <div>Yağ: <strong className="text-purple-400">{Math.round(t.fats)}g</strong></div>
                  </div>

                  {/* O günün enerji dengesi. Yakım antrenman kayıtlarından
                      otomatik gelir; elle eklenen kısım burada düzenlenebilir. */}
                  {(() => {
                    const auto = dayWorkoutCalories(workouts, n.date, latestWeight);
                    const zihin = dayMindCalories(wellness, n.date, latestWeight);
                    const manual = parseNumber(n.activeCaloriesOut);
                    const burned = auto.total + zihin + manual;
                    const balance = maintenanceCalories > 0
                      ? Math.round(t.calories - burned - maintenanceCalories)
                      : null;
                    const weeklyKg = balance !== null
                      ? Math.round((balance * 7 / 7700) * 100) / 100
                      : null;
                    const tone = balance === null ? 'text-zinc-500'
                      : balance < -100 ? 'text-cyan-400'
                        : balance > 100 ? 'text-amber-400'
                          : 'text-emerald-400';
                    const etiket = balance === null ? '—'
                      : balance < -100 ? 'Açık'
                        : balance > 100 ? 'Fazla'
                          : 'Korunum';
                    return (
                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-zinc-500 uppercase tracking-wider text-[9px] font-bold">Enerji Dengesi</span>
                          {balance !== null && (
                            <span className={`font-bold ${tone}`}>
                              {balance > 0 ? '+' : ''}{balance} kcal · {etiket}
                            </span>
                          )}
                        </div>

                        <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                          <span>Yakılan (antrenman + kardiyo)</span>
                          <span className="text-zinc-300">{auto.total} kcal</span>
                        </div>

                        <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
                          <span>Elle eklenen</span>
                          <span className="flex items-center gap-1.5">
                            <input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              max={5000}
                              value={n.activeCaloriesOut ?? ''}
                              onChange={(e) => onUpdateNutrition?.(n.id, { activeCaloriesOut: e.target.value })}
                              onBlur={(e) => onUpdateNutrition?.(n.id, {
                                activeCaloriesOut: e.target.value === '' ? '' : clampNumber(e.target.value, 0, 5000),
                              })}
                              placeholder="0"
                              className="w-16 bg-zinc-900 border border-zinc-800 rounded-lg py-1 text-center font-mono text-red-400 text-[10px] outline-none focus:border-red-500"
                            />
                            <span className="text-zinc-600">kcal</span>
                          </span>
                        </div>

                        {balance !== null ? (
                          <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
                            {Math.round(t.calories)} alındı − {burned} yakıldı, korunum {maintenanceCalories} kcal.
                            {weeklyKg !== 0 && (
                              <> Bu tempo sürseydi haftada {weeklyKg > 0 ? '+' : ''}{weeklyKg} kg.</>
                            )}
                          </p>
                        ) : (
                          <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
                            Denge için korunum kalorisi gerekiyor — Vücut sekmesinden ölçüm gir.
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
});

HistoryView.displayName = 'HistoryView';

export default HistoryView;
