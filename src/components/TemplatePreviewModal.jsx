import React, { memo } from 'react';
import { X, Zap, Clock, Layers, Link2 } from 'lucide-react';
import { MUSCLE_VOLUME_LANDMARKS } from '../utils/constants';
import { previewTemplateVolume, estimateDuration } from '../utils/templates';
import { isWorkingSet } from '../utils/helpers';

const TemplatePreviewModal = memo(({
  isOpen,
  onClose,
  template,
  customExercises = [],
  restSeconds = 120,
  onStart,
}) => {
  if (!isOpen || !template) return null;

  const { byMuscle, totalSets, exercises } = previewTemplateVolume(template.exercises, customExercises);
  const minutes = estimateDuration(template.exercises, restSeconds);

  // En çok yüklenen kaslar üstte
  const ranked = Object.entries(byMuscle).sort((a, b) => b[1] - a[1]);
  const maxVol = ranked.length ? ranked[0][1] : 1;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[88dvh]">

        <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 shrink-0">
          <div className="min-w-0">
            <h3 className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider truncate">{template.name}</h3>
            <span className="text-[10px] font-mono text-zinc-500">Şablon önizlemesi</span>
          </div>
          <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1 shrink-0" aria-label="Kapat">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">

          {/* Özet */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: <Clock size={13} className="text-emerald-400" />, label: 'Süre', value: `~${minutes} dk` },
              { icon: <Layers size={13} className="text-cyan-400" />, label: 'Set', value: totalSets },
              { icon: <Zap size={13} className="text-amber-400" />, label: 'Hareket', value: exercises },
            ].map(item => (
              <div key={item.label} className="bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 text-center">
                <div className="flex justify-center mb-1">{item.icon}</div>
                <span className="text-sm font-mono font-bold text-zinc-100 block">{item.value}</span>
                <span className="text-[9px] font-mono text-zinc-500 uppercase">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Kas dağılımı */}
          <div>
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
              Hangi Bölge Ne Kadar Çalışacak
            </h4>
            {ranked.length === 0 ? (
              <div className="text-center py-6 text-zinc-600 text-[11px] font-mono">
                Bu şablonda set tanımlı değil.
              </div>
            ) : (
              <div className="space-y-2">
                {ranked.map(([muscle, vol]) => {
                  const landmark = MUSCLE_VOLUME_LANDMARKS[muscle];
                  // Tek seansın haftalık MAV hedefine oranı: "bu seans haftalık
                  // hedefin ne kadarını karşılıyor" sorusuna cevap verir.
                  const weeklyShare = landmark ? Math.round((vol / landmark.mav) * 100) : 0;
                  return (
                    <div key={muscle} className="space-y-1">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-[11px] font-bold text-zinc-200 truncate">{muscle}</span>
                        <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                          <strong className="text-cyan-400">{vol}</strong> set
                          {landmark && <span className="text-zinc-600"> · haftalığın %{weeklyShare}'i</span>}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-950 rounded-full h-1.5 border border-zinc-800">
                        <div
                          className="h-1.5 rounded-full bg-cyan-500 transition-all duration-500"
                          style={{ width: `${Math.min(100, (vol / maxVol) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Hareket listesi */}
          <div>
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Hareketler</h4>
            <div className="space-y-1.5">
              {(template.exercises || []).map((ex, i) => {
                const sets = (ex.sets || []).filter(isWorkingSet);
                const topSet = sets[0];
                return (
                  <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 flex justify-between items-center gap-2">
                    <span className="text-[11px] text-zinc-200 font-bold truncate flex items-center min-w-0">
                      {ex.supersetId && <Link2 size={11} className="mr-1.5 text-purple-400 shrink-0" />}
                      <span className="truncate">{ex.name}</span>
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                      {sets.length} set{topSet?.weight ? ` · ${topSet.weight}kg` : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
            Süre tahmini set başına 45 sn ve {restSeconds} sn dinlenme varsayar.
            Süperset çiftlerinde araya dinlenme girmediği için o setler yarım sayılır.
          </p>
        </div>

        <div className="p-3 border-t border-zinc-800 bg-zinc-950 shrink-0 pb-safe">
          <button
            onClick={() => { onStart(template); onClose(); }}
            className="w-full bg-cyan-600 active:bg-cyan-700 text-white font-bold py-3.5 rounded-xl uppercase text-[11px] tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            <Zap size={15} /> Bu Şablonla Başla
          </button>
        </div>
      </div>
    </div>
  );
});

TemplatePreviewModal.displayName = 'TemplatePreviewModal';

export default TemplatePreviewModal;
