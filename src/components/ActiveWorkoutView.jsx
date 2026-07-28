import React, { memo } from 'react';
import { Activity, Pause, Play, Plus, X, Trash2, Trophy, TrendingUp, AlertCircle, Save, Timer } from 'lucide-react';
import WorkoutTimer from './WorkoutTimer';
import { FORM_RATINGS, SET_TYPES } from '../utils/constants';
import {
  getNextSetType, calcFatigueDropoff,
  isWarmupSet, isWorkingSet, parseNumber, estimate1RM,
  suggestNextTarget, detectMuscleGroup
} from '../utils/helpers';

const ActiveWorkoutView = memo(({
  activeWorkout,
  setActiveWorkout,
  setIsEndWorkoutModalOpen,
  setIsExerciseModalOpen,
  getRecentExerciseData,
  personalRecords,
  customExercises,
  settings,
  updateSet,
  addSet,
  removeSet,
  repsOnFocusRef,
  startRest,
  stopRest,
  rest,
  restSecondsLeft,
}) => {
  if (!activeWorkout) return null;

  return (
    <div className="absolute inset-0 bg-black z-40 flex flex-col h-[100dvh]">
      {/* Üst Bar: Kronometre ve Seans Durumu */}
      <div className="flex justify-between items-center bg-zinc-950 px-4 py-3 border-b border-zinc-800 shadow-md pt-safe">
        <div className="flex items-center">
          <Activity size={16} className="mr-3 text-emerald-400 animate-pulse" />
          <div>
            <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wide truncate max-w-[160px]">
              {activeWorkout.name || 'Aktif Antrenman'}
            </h2>
            <div className="text-[10px] text-zinc-400 font-mono flex items-center space-x-1">
              <WorkoutTimer timer={activeWorkout.timer} />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setActiveWorkout(prev => {
                const status = prev.timer?.status === 'running' ? 'paused' : 'running';
                let accumulated = prev.timer?.accumulatedSeconds || 0;
                let startTime = prev.timer?.startTime || null;

                if (status === 'paused' && startTime) {
                  accumulated += Math.floor((Date.now() - startTime) / 1000);
                  startTime = null;
                } else if (status === 'running') {
                  startTime = Date.now();
                }
                return { ...prev, timer: { status, accumulatedSeconds: accumulated, startTime } };
              });
            }}
            className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl active:bg-zinc-800 transition-colors"
          >
            {activeWorkout.timer?.status === 'running' ? <Pause size={14} /> : <Play size={14} />}
          </button>

          <button
            onClick={() => setIsEndWorkoutModalOpen(true)}
            className="bg-emerald-600 active:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/30 transition-all flex items-center"
          >
            <Save size={13} className="mr-1" /> Bitir
          </button>
        </div>
      </div>

      {/* Ana İçerik: Egzersizler ve Setler */}
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

        {(activeWorkout.exercises || []).length === 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center space-y-3 my-4">
            <div className="p-3 bg-zinc-950 rounded-full w-12 h-12 mx-auto flex items-center justify-center border border-zinc-800 text-cyan-400">
              <Plus size={24} />
            </div>
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Antrenmana Hareket Ekle</h3>
            <p className="text-[10px] text-zinc-500 font-mono">Antrenmanınıza henüz bir hareket eklenmedi. Aşağıdaki butondan ilk hareketinizi seçin.</p>
            <button
              onClick={() => setIsExerciseModalOpen(true)}
              className="w-full bg-cyan-600 active:bg-cyan-700 text-white font-bold py-3 px-4 rounded-xl flex justify-center items-center uppercase tracking-wide text-xs transition-colors shadow-lg shadow-cyan-900/30"
            >
              <Plus size={16} className="mr-1.5" /> İlk Hareketi Seç
            </button>
          </div>
        )}

        {(activeWorkout.exercises || []).map((ex, exIndex) => {
          const recentData = getRecentExerciseData(ex.name);
          const { muscle } = detectMuscleGroup(ex.name, customExercises);
          const target = recentData ? suggestNextTarget(recentData.sets, settings, muscle) : null;
          const record = personalRecords.get(ex.name);

          return (
            <div key={ex.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
              <div className="bg-zinc-950 px-3 py-2 border-b border-zinc-800 flex justify-between items-center">
                <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wide truncate pr-2"><span className="text-cyan-500 mr-1">{exIndex + 1}.</span>{ex.name}</h3>
                <button onClick={() => setActiveWorkout(prev => ({ ...prev, exercises: prev.exercises.filter(e => e.id !== ex.id) }))} className="text-zinc-600 p-1"><X size={14} /></button>
              </div>

              {target && (
                <div className="bg-emerald-950/25 px-3 py-2 border-b border-emerald-900/40">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500 flex items-center">
                      <TrendingUp size={11} className="mr-1.5" /> Bugünkü Hedef
                    </span>
                    <span className="font-mono text-sm font-bold text-emerald-400">{target.weight} kg × {target.reps}</span>
                  </div>
                  <div className="text-[9px] text-emerald-700 font-mono mt-1">{target.note}</div>
                </div>
              )}

              {recentData && (
                <div className="bg-cyan-950/20 px-3 py-1.5 border-b border-zinc-800 text-[9px] text-cyan-500/70 font-mono flex gap-3 overflow-x-auto hide-scrollbar items-center">
                  <span className="text-cyan-600 font-bold shrink-0">Geçen ({new Date(recentData.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}):</span>
                  {recentData.sets.map((s, i) => (
                    <span key={i} className="shrink-0">{s.weight}x{s.reps} {s.rir !== '' && s.rir !== undefined && `(RIR:${s.rir})`}</span>
                  ))}
                </div>
              )}

              {record && (
                <div className="bg-yellow-950/15 px-3 py-1.5 border-b border-zinc-800 text-[9px] font-mono flex items-center gap-2">
                  <Trophy size={10} className="text-yellow-500 shrink-0" />
                  <span className="text-yellow-600/80">Rekor: <span className="text-yellow-500 font-bold">{record.e1rm} kg</span> (1RM tahmini · {record.weight}×{record.reps})</span>
                </div>
              )}

              {(() => {
                const fatigue = calcFatigueDropoff(ex.sets);
                if (!fatigue) return null;
                const isHighDropoff = fatigue.dropoff > 20;
                return (
                  <div className={`px-3 py-1 border-b border-zinc-800 text-[9px] font-mono flex items-center justify-between ${isHighDropoff ? 'bg-red-950/20 text-red-400' : 'bg-zinc-950/60 text-emerald-400'}`}>
                    <span className="flex items-center gap-1 font-bold">
                      {isHighDropoff ? <AlertCircle size={10} className="text-red-500" /> : <Activity size={10} className="text-emerald-500" />}
                      {isHighDropoff ? `Yorgunluk Yüksek (%${fatigue.dropoff} Güç Kaybı)` : `Hacim Korunumu: %${fatigue.retention}`}
                    </span>
                    <span className="text-zinc-500 text-[8px]">{fatigue.firstSet} → {fatigue.lastSet}</span>
                  </div>
                );
              })()}

              <div className="p-2 space-y-2 mt-1">
                <div className="grid grid-cols-12 gap-1 text-[8px] uppercase tracking-wider text-zinc-500 text-center font-bold px-0.5">
                  <div className="col-span-1">S</div><div className="col-span-3">KG</div><div className="col-span-2">Tekrar</div><div className="col-span-2">RIR</div><div className="col-span-2">Tempo</div><div className="col-span-2">Form</div>
                </div>

                {(ex.sets || []).map((set, setIndex) => {
                  const warmup = isWarmupSet(set);
                  const st = SET_TYPES[set.setType] || SET_TYPES.normal;
                  const isEffective = !warmup && parseNumber(set.rir) <= 3 && parseNumber(set.reps) > 0;
                  const e1rm = warmup ? 0 : estimate1RM(set.weight, set.reps, set.rir);
                  const isNewRecord = e1rm > 0 && (!record || e1rm > record.e1rm);
                  const workingIndex = (ex.sets || []).slice(0, setIndex + 1).filter(isWorkingSet).length;

                  const setBadgeText = set.setType === 'warmup' ? 'W' : set.setType === 'drop' ? 'D' : set.setType === 'failure' ? 'F' : set.setType === 'rest_pause' ? 'RP' : workingIndex;

                  const borderStyle = warmup
                    ? 'bg-zinc-950/50 border-orange-900/40'
                    : set.setType === 'drop'
                    ? 'bg-purple-950/20 border-purple-900/50'
                    : set.setType === 'failure'
                    ? 'bg-red-950/20 border-red-900/50'
                    : set.setType === 'rest_pause'
                    ? 'bg-emerald-950/20 border-emerald-900/50'
                    : isEffective
                    ? 'bg-zinc-950 border-cyan-900/50'
                    : 'bg-zinc-950 border-zinc-800';

                  return (
                    <div key={set.id} className={`grid grid-cols-12 gap-1 items-center p-1 rounded-xl border transition-colors relative ${borderStyle}`}>
                      <button
                        onClick={() => updateSet(ex.id, set.id, 'setType', getNextSetType(set.setType))}
                        title={`Set Tipi: ${st.label} (Dokun: değiştir)`}
                        className={`col-span-1 text-center text-[10px] font-mono font-bold h-10 rounded-lg transition-colors ${st.textClass}`}
                      >
                        {setBadgeText}
                      </button>
                      <div className="col-span-3"><input type="number" inputMode="decimal" value={set.weight} onChange={(e) => updateSet(ex.id, set.id, 'weight', e.target.value)} onFocus={e => e.target.select()} className={`w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 font-mono text-sm outline-none text-center focus:bg-zinc-800 h-10 transition-colors ${warmup ? 'text-orange-300/70' : 'text-cyan-400'}`} placeholder="0" /></div>
                      <div className="col-span-2">
                        <input
                          type="number" inputMode="decimal" value={set.reps}
                          onChange={(e) => updateSet(ex.id, set.id, 'reps', e.target.value)}
                          onFocus={(e) => { e.target.select(); repsOnFocusRef.current = e.target.value; }}
                          onBlur={(e) => {
                            const changed = repsOnFocusRef.current !== e.target.value;
                            repsOnFocusRef.current = null;
                            if (changed && settings.autoRestTimer && !warmup && parseNumber(e.target.value) > 0) {
                              startRest(settings.restSeconds);
                            }
                          }}
                          className={`w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 font-mono text-sm outline-none text-center focus:bg-zinc-800 h-10 transition-colors ${warmup ? 'text-zinc-500' : 'text-zinc-100'}`}
                          placeholder="0" />
                      </div>
                      <div className="col-span-2"><input type="number" inputMode="decimal" step="0.5" value={set.rir} onChange={(e) => updateSet(ex.id, set.id, 'rir', e.target.value)} onFocus={e => e.target.select()} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-300 font-mono text-xs outline-none text-center focus:bg-zinc-800 h-10 transition-colors" placeholder="0" /></div>
                      <div className="col-span-2"><input type="text" maxLength="4" value={set.tempo || ''} onChange={(e) => updateSet(ex.id, set.id, 'tempo', e.target.value)} onFocus={e => e.target.select()} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-400 font-mono text-[10px] outline-none text-center focus:bg-zinc-800 h-10 transition-colors" placeholder="TUT" /></div>
                      <div className="col-span-2 flex items-center pr-1">
                        <select value={set.formRating} onChange={(e) => updateSet(ex.id, set.id, 'formRating', parseNumber(e.target.value))} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-zinc-300 font-mono text-[10px] outline-none text-center h-10 appearance-none transition-colors">
                          {FORM_RATINGS.map(r => <option key={r.value} value={r.value}>{r.value}</option>)}
                        </select>
                      </div>
                      <div className="col-span-12 flex justify-between items-center px-1.5 -mt-0.5 mb-0.5">
                        <div className="flex items-center gap-2">
                          <button onClick={() => removeSet(ex.id, set.id)} className="text-zinc-700 active:text-red-500 hover:text-red-500 p-1 -m-1 transition-colors" title="Bu seti sil">
                            <Trash2 size={11} />
                          </button>
                          <select
                            value={set.setType || 'normal'}
                            onChange={(e) => updateSet(ex.id, set.id, 'setType', e.target.value)}
                            className="bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-[9px] font-mono rounded p-0.5 outline-none border border-zinc-800 transition-colors"
                          >
                            <option value="normal">Normal (N)</option>
                            <option value="warmup">Isınma (W)</option>
                            <option value="drop">Drop Set (D)</option>
                            <option value="failure">Tükeniş (F)</option>
                            <option value="rest_pause">Rest-Pause (RP)</option>
                          </select>
                        </div>
                        {warmup ? (
                          <span className="text-[8px] text-orange-600/70 font-mono tracking-widest uppercase">Isınma · hacme sayılmaz</span>
                        ) : (
                          <span className="text-[8px] font-mono tracking-widest flex items-center gap-1.5">
                            {isNewRecord && (
                              <span className="text-yellow-400 font-bold flex items-center"><Trophy size={9} className="mr-0.5" /> REKOR</span>
                            )}
                            <span className="text-cyan-600/70">1RM: {e1rm > 0 ? `${e1rm}kg` : '—'}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => addSet(ex.id)}
                    className="flex-1 py-2 bg-zinc-950 hover:bg-zinc-900 active:bg-zinc-800 text-cyan-400 border border-dashed border-zinc-800 rounded-xl font-bold text-xs flex items-center justify-center uppercase tracking-wider transition-colors"
                  >
                    <Plus size={14} className="mr-1" /> Set Ekle
                  </button>
                  <button
                    onClick={() => startRest(settings.restSeconds || 120)}
                    title="Dinlenme sayacını başlat"
                    className="px-3 py-2 bg-zinc-950 active:bg-zinc-800 text-zinc-400 border border-zinc-800 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-colors shrink-0"
                  >
                    {settings.restSeconds || 120}s
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <button
          onClick={() => setIsExerciseModalOpen(true)}
          className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-bold py-3.5 px-4 rounded-2xl flex justify-center items-center uppercase tracking-wide text-xs transition-colors"
        >
          <Plus size={16} className="mr-2 text-cyan-400" /> Hareket Ekle
        </button>
      </div>

      {/* Dinlenme geri sayımı — ekranın altında sabit durur */}
      {rest && restSecondsLeft > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[360px]">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-cyan-500 flex items-center">
                <Timer size={12} className="mr-1.5 animate-pulse" /> Dinlenme
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startRest(restSecondsLeft + 30)}
                  className="text-[9px] font-bold text-zinc-400 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 active:bg-zinc-800 transition-colors"
                >
                  +30s
                </button>
                <button
                  onClick={stopRest}
                  className="text-zinc-500 active:text-red-400 bg-zinc-950 border border-zinc-800 p-1.5 rounded-lg transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-3xl text-cyan-400 tabular-nums tracking-tight">
                {Math.floor(restSecondsLeft / 60)}:{(restSecondsLeft % 60).toString().padStart(2, '0')}
              </span>
              <div className="flex-1 bg-zinc-950 rounded-full h-2 border border-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(0, Math.min(100, (restSecondsLeft / rest.total) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ActiveWorkoutView.displayName = 'ActiveWorkoutView';

export default ActiveWorkoutView;
