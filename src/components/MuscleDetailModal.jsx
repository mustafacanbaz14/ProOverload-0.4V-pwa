import React, { memo } from 'react';
import { X, Target, Calendar } from 'lucide-react';
import { getVolumeLandmarks, volumeStatusOf, VOLUME_STATUS } from '../utils/constants';
import { formatDay } from '../utils/dates';

const WEIGHT_LABEL = {
  1: 'Birincil',
  0.5: 'Yardımcı',
  0.25: 'Hafif',
};

const WEIGHT_COLOR = {
  1: 'text-emerald-400 border-emerald-900/50 bg-emerald-950/30',
  0.5: 'text-cyan-400 border-cyan-900/50 bg-cyan-950/30',
  0.25: 'text-zinc-400 border-zinc-700 bg-zinc-900',
};

/**
 * Bir kas grubunun bu haftaki hacminin hangi hareketlerden geldiğini gösterir.
 * `breakdown`: [{ exerciseName, weight, sets, contributed, dates: [] }]
 */
const MuscleDetailModal = memo(({ isOpen, onClose, muscle, total = 0, breakdown = [], experienceLevel = 'intermediate' }) => {
  if (!isOpen || !muscle) return null;

  const landmark = getVolumeLandmarks(muscle, experienceLevel);

  const state = VOLUME_STATUS[volumeStatusOf(total, muscle, experienceLevel)];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[85] flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[85dvh]">

        <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 shrink-0">
          <h3 className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
            <Target size={15} className="mr-2 text-cyan-400" /> {muscle}
          </h3>
          <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1" aria-label="Kapat">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">

          {/* Özet */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-end justify-between mb-3">
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Bu Hafta</span>
                <span className="text-3xl font-mono font-bold text-zinc-100">{total}</span>
                <span className="text-[11px] font-mono text-zinc-500 ml-1">set</span>
              </div>
              <span className={`text-[11px] font-bold ${state.text}`}>{state.label}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'MEV', value: landmark.mev, hint: 'Koruma' },
                { label: 'MAV', value: landmark.mav, hint: 'Verimli tavan' },
                { label: 'MRV', value: landmark.mrv, hint: 'Toparlanma sınırı' },
              ].map(l => (
                <div key={l.label} className="bg-zinc-900 border border-zinc-800 rounded-xl py-2">
                  <span className="text-[9px] font-mono text-zinc-500 block">{l.label}</span>
                  <span className="text-sm font-mono font-bold text-zinc-200">{l.value}</span>
                  <span className="text-[8px] font-mono text-zinc-600 block">{l.hint}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Katkı dökümü */}
          <div>
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
              Katkı Veren Hareketler
            </h4>

            {breakdown.length === 0 ? (
              <div className="text-center py-8 text-zinc-600 text-[11px] font-mono">
                Bu hafta bu kasa katkı veren hareket yok.
              </div>
            ) : (
              <div className="space-y-2">
                {breakdown.map((item) => (
                  <div key={item.exerciseName} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="text-[11px] font-bold text-zinc-200 min-w-0 truncate">{item.exerciseName}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${WEIGHT_COLOR[item.weight] || WEIGHT_COLOR[0.25]}`}>
                        {WEIGHT_LABEL[item.weight] || `×${item.weight}`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-zinc-500">
                        {item.sets} set × {item.weight}
                      </span>
                      <span className="text-cyan-400 font-bold">= {item.contributed} set</span>
                    </div>

                    {item.dates?.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-zinc-900 text-[9px] font-mono text-zinc-600">
                        <Calendar size={9} />
                        {item.dates.map(d => formatDay(d)).join(' · ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
            Bir set, hareketin o kasa katkı ağırlığı kadar sayılır: birincil hedef 1,
            belirgin yardımcı 0.5, hafif katkı 0.25. Isınma setleri hiç sayılmaz.
          </p>
        </div>
      </div>
    </div>
  );
});

MuscleDetailModal.displayName = 'MuscleDetailModal';

export default MuscleDetailModal;
