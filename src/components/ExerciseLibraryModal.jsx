import React, { useState, useMemo, memo } from 'react';
import { X, Search, Star, Settings, Trash2, Eye, EyeOff, Plus, Dumbbell, Check } from 'lucide-react';
import { MUSCLE_GROUPS } from '../utils/constants';
import { foldForSearch } from '../utils/helpers';
import { exerciseMuscleRank, exerciseRankLabel, sortExercisesForMuscle } from '../utils/exerciseSort';

const chip = (w) =>
  w === 1 ? 'text-emerald-400 border-emerald-900/50 bg-emerald-950/30'
    : w === 0.5 ? 'text-cyan-400 border-cyan-900/50 bg-cyan-950/30'
      : 'text-zinc-500 border-zinc-800 bg-zinc-900';

const suffix = (w) => (w === 0.5 ? ' ½' : w === 0.25 ? ' ¼' : '');

/**
 * Hareket kütüphanesi: tüm hareketleri görüntüleme, kas eşlemesini düzenleme,
 * kullanıcının eklediklerini silme ve seçim listesinde görünürlüğü ayarlama.
 *
 * `selectMode` açıkken şablon oluşturucudan çağrılır ve dokunulan hareket
 * doğrudan geri döner.
 */
const ExerciseLibraryModal = memo(({
  isOpen,
  onClose,
  allExerciseNames = [],
  getContributions,
  isUserAdded,
  performedNames = new Set(),
  hiddenNames = new Set(),
  onEditExercise,
  onDeleteExercise,
  onToggleHidden,
  onAddNew,
  selectMode = false,
  onSelect,
}) => {
  const [query, setQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('Tümü');
  const [onlyMine, setOnlyMine] = useState(false);

  const list = useMemo(() => {
    const q = foldForSearch(query).trim();
    const filtered = allExerciseNames.filter(name => {
      if (onlyMine && !isUserAdded(name)) return false;
      if (q && !foldForSearch(name).includes(q)) return false;
      if (muscleFilter !== 'Tümü') {
        const c = getContributions(name);
        if (!c || !c[muscleFilter]) return false;
      }
      return true;
    });
    return sortExercisesForMuscle(filtered, muscleFilter, getContributions);
  }, [allExerciseNames, query, muscleFilter, onlyMine, getContributions, isUserAdded]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[92] flex flex-col h-[100dvh] max-w-[420px] mx-auto">

      <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 shrink-0 pt-safe">
        <h3 className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
          <Dumbbell size={15} className="mr-2 text-cyan-400" />
          {selectMode ? 'Hareket Seç' : 'Hareket Kütüphanesi'}
        </h3>
        <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1" aria-label="Kapat">
          <X size={20} />
        </button>
      </div>

      <div className="p-3 space-y-2.5 border-b border-zinc-800 bg-zinc-950 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hareket ara..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-3 text-zinc-100 outline-none font-mono text-xs h-11 focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar -mx-1 px-1">
          {['Tümü', ...MUSCLE_GROUPS].map(m => (
            <button
              key={m}
              onClick={() => setMuscleFilter(m)}
              className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition-colors ${muscleFilter === m ? 'border-cyan-600 text-cyan-400 bg-cyan-950/20' : 'border-zinc-800 text-zinc-500'}`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setOnlyMine(v => !v)}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-colors flex items-center gap-1 ${onlyMine ? 'border-amber-600 text-amber-400 bg-amber-950/20' : 'border-zinc-800 text-zinc-500'}`}
          >
            <Star size={11} fill={onlyMine ? 'currentColor' : 'none'} /> Sadece Benimkiler
          </button>
          <span className="text-[10px] font-mono text-zinc-600">{list.length} hareket</span>
        </div>
        {muscleFilter !== 'Tümü' && (
          <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
            Sıra: %100 izolasyon → %100 bileşik → yardımcı katkılar.
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto bg-zinc-950 hide-scrollbar pb-safe">
        {!selectMode && (
          <button
            onClick={onAddNew}
            className="w-full px-4 py-3 border-b border-zinc-900 text-cyan-400 active:bg-zinc-900 transition-colors flex items-center text-[11px] font-bold uppercase tracking-wider"
          >
            <Plus size={15} className="mr-2" /> Yeni Hareket Ekle
          </button>
        )}

        {list.length === 0 && (
          <div className="text-center py-12 text-zinc-600 text-[11px] font-mono">Eşleşen hareket yok.</div>
        )}

        {list.map(name => {
          const contributions = getContributions(name) || {};
          const parts = Object.entries(contributions).sort((a, b) => b[1] - a[1]);
          const mine = isUserAdded(name);
          const hidden = hiddenNames.has(name);
          const done = performedNames.has(name);
          const rank = muscleFilter !== 'Tümü'
            ? exerciseMuscleRank(name, muscleFilter, getContributions)
            : null;

          return (
            <div
              key={name}
              className={`px-4 py-3 border-b border-zinc-900 flex justify-between items-start gap-2 ${hidden ? 'opacity-45' : ''}`}
            >
              <button
                onClick={() => selectMode && onSelect?.(name)}
                disabled={!selectMode}
                className={`min-w-0 flex-1 text-left ${selectMode ? 'active:opacity-60' : 'cursor-default'}`}
              >
                <div className="text-xs font-bold font-mono text-zinc-200 flex items-center gap-1.5">
                  {mine && <Star size={10} className="text-amber-400 shrink-0" fill="currentColor" />}
                  <span className="truncate">{name}</span>
                  {done && <span className="text-[8px] font-sans text-cyan-600 shrink-0">YAPILDI</span>}
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {rank && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${rank.weight === 1 ? 'text-emerald-300 border-emerald-900/60 bg-emerald-950/25' : 'text-amber-300 border-amber-900/50 bg-amber-950/20'}`}>
                      {exerciseRankLabel(rank)}
                    </span>
                  )}
                  {parts.length === 0 ? (
                    <span className="text-[10px] text-zinc-600 font-mono">Kas eşlemesi yok</span>
                  ) : parts.map(([m, w]) => (
                    <span key={m} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${chip(w)}`}>
                      {m}{suffix(w)}
                    </span>
                  ))}
                </div>
              </button>

              {selectMode ? (
                <span className="text-cyan-500 p-1.5 shrink-0"><Check size={16} /></span>
              ) : (
                <div className="flex items-center shrink-0">
                  <button
                    onClick={() => onToggleHidden(name)}
                    title={hidden ? 'Seçim listesinde göster' : 'Seçim listesinde gizle'}
                    className="text-zinc-600 active:text-cyan-400 p-1.5"
                  >
                    {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => onEditExercise(name)}
                    title="Kas eşlemesini düzenle"
                    className="text-zinc-600 active:text-cyan-400 p-1.5"
                  >
                    <Settings size={14} />
                  </button>
                  {mine && (
                    <button
                      onClick={() => onDeleteExercise(name)}
                      title="Bu hareketi sil"
                      className="text-zinc-600 active:text-red-500 p-1.5"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

ExerciseLibraryModal.displayName = 'ExerciseLibraryModal';

export default ExerciseLibraryModal;
