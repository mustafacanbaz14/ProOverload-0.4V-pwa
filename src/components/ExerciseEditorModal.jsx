import React, { useState, memo } from 'react';
import { X, Save, RotateCcw, Dumbbell } from 'lucide-react';
import { MUSCLE_SECTIONS } from '../utils/constants';

const MECHANICS = [
  { key: 'Push', label: 'İtme' },
  { key: 'Pull', label: 'Çekme' },
  { key: 'Legs', label: 'Bacak' },
  { key: 'Core', label: 'Merkez' },
];

// Dokunma sırası: yok → birincil → yardımcı → hafif → yok
const CYCLE = { 0: 1, 1: 0.5, 0.5: 0.25, 0.25: 0 };

const chipClass = (w) =>
  w === 1 ? 'text-emerald-400 border-emerald-600 bg-emerald-950/40'
    : w === 0.5 ? 'text-cyan-400 border-cyan-700 bg-cyan-950/30'
      : w === 0.25 ? 'text-zinc-300 border-zinc-600 bg-zinc-800'
        : 'text-zinc-600 border-zinc-800 bg-zinc-950';

const suffix = (w) => (w === 1 ? ' •' : w === 0.5 ? ' ½' : w === 0.25 ? ' ¼' : '');

/**
 * Bir hareketin kas katkılarını düzenler.
 *
 * Yerleşik hareketler için de çalışır: kaydedilen kayıt customExercises içine
 * aynı ADLA yazılır ve detectMuscleGroup önce oraya baktığı için yerleşik
 * kuralı geçersiz kılar. "Varsayılana dön" bu kaydı silerek kuralı geri getirir.
 */
const ExerciseEditorModal = memo(({
  isOpen,
  onClose,
  exerciseName,
  currentContributions,
  currentMechanics,
  isOverridden,
  onSave,
  onReset,
}) => {
  // Başlangıç değerleri prop'tan bir kez okunur. Farklı bir harekete geçildiğinde
  // App tarafındaki `key={exerciseName}` bileşeni yeniden bağlar; bu yüzden
  // prop'u state'e kopyalayan bir efekte gerek yok.
  const [contribs, setContribs] = useState(() => ({ ...(currentContributions || {}) }));
  const [mechanics, setMechanics] = useState(currentMechanics || 'Push');

  if (!isOpen) return null;

  const toggle = (muscle) => setContribs(prev => {
    const next = { ...prev };
    const val = CYCLE[prev[muscle] || 0];
    if (val === 0) delete next[muscle]; else next[muscle] = val;
    return next;
  });

  const hasPrimary = Object.values(contribs).includes(1);
  const total = Object.values(contribs).reduce((a, b) => a + b, 0);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[95] flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[88dvh]">

        <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 shrink-0">
          <div className="min-w-0">
            <h3 className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
              <Dumbbell size={15} className="mr-2 text-cyan-400 shrink-0" />
              <span className="truncate">Kas Katkıları</span>
            </h3>
            <span className="text-[10px] font-mono text-zinc-500 truncate block mt-0.5">{exerciseName}</span>
          </div>
          <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1 shrink-0" aria-label="Kapat">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">

          {isOverridden && (
            <div className="bg-cyan-950/20 border border-cyan-900/40 rounded-xl p-2.5">
              <p className="text-[10px] font-mono text-cyan-300 leading-relaxed">
                Bu hareket için kendi eşlemen kullanılıyor. Varsayılana dönersen
                uygulamanın yerleşik kuralı geri gelir.
              </p>
            </div>
          )}

          <div>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Katkı Ağırlıkları</span>
              <span className="text-[9px] font-mono text-zinc-600">dokun: • → ½ → ¼ → yok</span>
            </div>

            <div className="space-y-3">
              {MUSCLE_SECTIONS.map(section => (
                <div key={section.title}>
                  <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest block mb-1">
                    {section.title}
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {section.muscles.map(m => {
                      const w = contribs[m] || 0;
                      return (
                        <button
                          key={m}
                          onClick={() => toggle(m)}
                          className={`py-2 px-1.5 rounded-lg border text-[10px] font-bold transition-colors ${chipClass(w)}`}
                        >
                          {m}{suffix(w)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-3 px-1">
              <span className="text-[10px] font-mono text-zinc-500">
                Bir set toplam <strong className="text-zinc-300">{Math.round(total * 4) / 4}</strong> hacim yazar
              </span>
              {!hasPrimary && (
                <span className="text-[10px] font-mono text-orange-400">En az bir birincil (•) gerekli</span>
              )}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Mekanik</span>
            <div className="grid grid-cols-4 gap-1.5">
              {MECHANICS.map(m => (
                <button
                  key={m.key}
                  onClick={() => setMechanics(m.key)}
                  className={`py-2 rounded-lg border text-[10px] font-bold transition-colors ${mechanics === m.key ? 'text-cyan-400 border-cyan-600 bg-cyan-950/30' : 'text-zinc-500 border-zinc-800 bg-zinc-950'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <p className="text-[9px] font-mono text-zinc-600 mt-1.5 leading-snug">
              İtme/çekme dengesi hesabında kullanılır.
            </p>
          </div>
        </div>

        <div className="p-3 border-t border-zinc-800 bg-zinc-950 shrink-0 pb-safe space-y-2">
          <button
            disabled={!hasPrimary}
            onClick={() => onSave({ contributions: contribs, mechanics })}
            className="w-full bg-cyan-600 active:bg-cyan-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-3 rounded-xl uppercase text-[11px] tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            <Save size={14} /> Kaydet
          </button>
          {isOverridden && (
            <button
              onClick={onReset}
              className="w-full bg-zinc-900 border border-zinc-800 active:bg-zinc-800 text-zinc-400 font-bold py-2.5 rounded-xl uppercase text-[10px] tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw size={13} /> Varsayılana Dön
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

ExerciseEditorModal.displayName = 'ExerciseEditorModal';

export default ExerciseEditorModal;
