import React, { useState, useMemo, memo } from 'react';
import { X, Repeat, Check, Star } from 'lucide-react';
import { suggestSubstitutes, EQUIPMENT, detectEquipment } from '../utils/substitution';

/**
 * Hareket ikamesi.
 *
 * "Omzum ağrıyor, bench yerine ne yapayım" ya da "makine dolu" sorularının
 * cevabı. Öneriler kas katkı profilinin yakınlığına göre sıralanıyor; ekipman
 * filtresi var çünkü çoğu zaman asıl kısıt kas değil, elde ne olduğu.
 */
const SubstituteModal = memo(({ isOpen, onClose, exerciseName, allExerciseNames = [], customExercises = [], performedNames, onPick }) => {
  const [equipment, setEquipment] = useState(null);

  const oneriler = useMemo(
    () => suggestSubstitutes(exerciseName, allExerciseNames, {
      customExercises,
      performed: performedNames instanceof Set ? performedNames : new Set(performedNames || []),
      equipment,
      limit: equipment ? 10 : 8,
    }),
    [exerciseName, allExerciseNames, customExercises, performedNames, equipment]);

  if (!isOpen || !exerciseName) return null;

  const kaynakEkipman = detectEquipment(exerciseName);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center p-3">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[85dvh]">

        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center gap-2 shrink-0">
          <div className="min-w-0">
            <span className="text-[9px] font-mono text-cyan-500 uppercase tracking-widest block">Yerine ne yapılır</span>
            <h3 className="text-[12px] font-bold text-zinc-100 truncate">{exerciseName}</h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1 shrink-0" aria-label="Kapat">
            <X size={20} />
          </button>
        </div>

        {/* Ekipman filtresi */}
        <div className="px-3 py-2.5 border-b border-zinc-800 bg-zinc-950/60 shrink-0">
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setEquipment(null)}
              className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${!equipment ? 'border-cyan-600 text-cyan-400 bg-cyan-950/20' : 'border-zinc-800 text-zinc-500'}`}
            >
              Hepsi
            </button>
            {EQUIPMENT.map(e => (
              <button
                key={e.key}
                onClick={() => setEquipment(equipment === e.key ? null : e.key)}
                className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${equipment === e.key ? 'border-cyan-600 text-cyan-400 bg-cyan-950/20' : 'border-zinc-800 text-zinc-500'}`}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-2">
          {oneriler.length === 0 ? (
            <p className="text-center py-8 text-[11px] font-mono text-zinc-600 leading-relaxed px-4">
              {equipment
                ? 'Bu ekipmanla yeterince yakın bir hareket bulunamadı. Filtreyi kaldırıp bakabilirsin.'
                : 'Bu hareketin kas eşlemesi tanımlı değil, benzer hareket çıkarılamıyor. Kütüphaneden eşlemeyi düzenlersen öneri gelir.'}
            </p>
          ) : oneriler.map(o => (
            <button
              key={o.name}
              onClick={() => { onPick?.(o.name); onClose(); }}
              className="w-full text-left bg-zinc-950 border border-zinc-800 rounded-2xl p-3 active:border-cyan-600 transition-colors"
            >
              <div className="flex justify-between items-start gap-2 mb-1">
                <span className="text-[11px] font-bold text-zinc-100 truncate min-w-0 flex items-center gap-1.5">
                  {o.name}
                  {/* Daha önce yapılmış hareket teknik olarak daha tanıdık bir geçiş. */}
                  {o.isKnown && <Star size={9} className="text-amber-400 fill-amber-400 shrink-0" />}
                </span>
                <span className="text-[9px] font-mono text-zinc-500 shrink-0">
                  %{Math.round(o.similarity * 100)} örtüşme
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {o.equipment && (
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border border-cyan-900/50 bg-cyan-950/25 text-cyan-400">
                    {o.equipment.label}
                  </span>
                )}
                {o.sharedMuscles.slice(0, 3).map(m => (
                  <span key={m} className="text-[8px] font-bold px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400">
                    {m}
                  </span>
                ))}
              </div>
              <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">{o.note}</p>
            </button>
          ))}
        </div>

        <div className="px-4 py-2.5 border-t border-zinc-800 bg-zinc-950 shrink-0 pb-safe">
          <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
            Örtüşme, iki hareketin kas katkı dağılımının yakınlığı.
            {kaynakEkipman && ` Bu hareket ${kaynakEkipman.label.toLowerCase()} sınıfında;`}
            {' '}makine ve kablo varyantlarının hareket yolu daha kontrollü olabilir;
            bu, eklem için ağrısız veya güvenli olduklarını garanti etmez. <Check size={9} className="inline" /> ile
            seçtiğin hareket listede yerine geçer.
          </p>
        </div>
      </div>
    </div>
  );
});

SubstituteModal.displayName = 'SubstituteModal';

export default SubstituteModal;
