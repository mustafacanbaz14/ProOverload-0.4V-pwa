import React, { useState, memo } from 'react';
import { X, HeartPulse, Flame, Clock, Plus, Trash2 } from 'lucide-react';
import { CARDIO_ACTIVITIES, CARDIO_GROUPS, findActivity, estimateCardioCalories } from '../utils/cardio';

const QUICK_MINUTES = [15, 20, 30, 45, 60];

/**
 * Kardiyo girişi. Süre yazıldığı anda vücut ağırlığından kalori tahmini yapar.
 *
 * `weightKg` en son ölçümden gelir; ölçüm yoksa tahmin yapılamaz ve kullanıcıya
 * uydurma bir sayı göstermek yerine ölçüm girmesi söylenir.
 */
const CardioModal = memo(({ isOpen, onClose, onSave, weightKg, existing = [], onDelete }) => {
  const [type, setType] = useState('zone2');
  const [minutes, setMinutes] = useState(30);

  if (!isOpen) return null;

  const activity = findActivity(type);
  const kcal = estimateCardioCalories(activity?.met || 0, weightKg, minutes);
  const canSave = Boolean(activity) && Number(minutes) > 0;

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[95] flex flex-col h-[100dvh] max-w-[420px] mx-auto">

      <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 shrink-0 pt-safe">
        <h3 className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
          <HeartPulse size={15} className="mr-2 text-red-400" /> Kardiyo Ekle
        </h3>
        <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1" aria-label="Kapat">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-3 pb-safe">

        {/* Kalori tahmini */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
          {weightKg > 0 ? (
            <>
              <Flame size={18} className="text-red-400 mx-auto mb-1.5" />
              <span className="text-3xl font-mono font-bold text-zinc-100">{kcal}</span>
              <span className="text-[11px] font-mono text-zinc-500 ml-1">kcal</span>
              <p className="text-[9px] font-mono text-zinc-600 mt-2 leading-relaxed">
                {minutes} dk · {activity?.label} · {activity?.met} MET · {weightKg} kg
                <br />
                Dinlenmenin üstüne yakılan miktar. Günlük hedefe eklenecek sayı budur.
              </p>
            </>
          ) : (
            <p className="text-[11px] font-mono text-amber-400 leading-relaxed">
              Kalori tahmini için kiloya ihtiyaç var.
              <br />
              <span className="text-zinc-500">Vücut sekmesinden bir ölçüm girdiğinde otomatik hesaplanacak.</span>
            </p>
          )}
        </div>

        {/* Süre */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center">
              <Clock size={12} className="mr-1.5 text-emerald-400" /> Süre
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={minutes}
                onChange={(e) => setMinutes(Math.max(0, Math.min(600, Number(e.target.value) || 0)))}
                className="w-20 bg-zinc-950 border border-zinc-800 rounded-lg py-2 text-center font-mono text-cyan-400 text-sm outline-none focus:border-cyan-500"
              />
              <span className="text-[11px] font-mono text-zinc-500">dk</span>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {QUICK_MINUTES.map(m => (
              <button
                key={m}
                onClick={() => setMinutes(m)}
                className={`py-2 rounded-lg text-[10px] font-bold border transition-colors ${minutes === m ? 'bg-cyan-900/30 border-cyan-600 text-cyan-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Aktivite */}
        {CARDIO_GROUPS.map(group => (
          <div key={group} className="space-y-1.5">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">{group}</h4>
            <div className="space-y-1.5">
              {CARDIO_ACTIVITIES.filter(a => a.group === group).map(a => (
                <button
                  key={a.key}
                  onClick={() => setType(a.key)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors ${type === a.key ? 'bg-red-950/25 border-red-700' : 'bg-zinc-900 border-zinc-800'}`}
                >
                  <div className="flex justify-between items-center gap-2">
                    <span className={`text-[11px] font-bold truncate ${type === a.key ? 'text-red-300' : 'text-zinc-200'}`}>{a.label}</span>
                    <span className="text-[9px] font-mono text-zinc-500 shrink-0">
                      {a.met} MET
                      {weightKg > 0 && (
                        <span className="text-zinc-600"> · {estimateCardioCalories(a.met, weightKg, minutes)} kcal</span>
                      )}
                    </span>
                  </div>
                  {a.hint && <span className="text-[9px] font-mono text-zinc-600 block mt-0.5">{a.hint}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Bu seansta eklenenler */}
        {existing.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Bu Kayıtta Eklenenler</h4>
            {existing.map(e => {
              const a = findActivity(e.type);
              return (
                <div key={e.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 flex justify-between items-center gap-2">
                  <span className="text-[11px] font-bold text-zinc-200 truncate min-w-0">{a?.label || e.type}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-zinc-500">
                      {e.minutes} dk · <strong className="text-red-400">{estimateCardioCalories(a?.met || 0, weightKg, e.minutes)}</strong> kcal
                    </span>
                    <button onClick={() => onDelete?.(e.id)} className="text-zinc-600 active:text-red-500 p-1">
                      <Trash2 size={13} />
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-zinc-800 bg-zinc-950 shrink-0 pb-safe">
        <button
          disabled={!canSave}
          onClick={() => { onSave({ type, minutes: Number(minutes) }); onClose(); }}
          className="w-full bg-red-600 active:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-3.5 rounded-xl uppercase text-[11px] tracking-wider flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={15} /> {activity?.label} · {minutes} dk Ekle
        </button>
      </div>
    </div>
  );
});

CardioModal.displayName = 'CardioModal';

export default CardioModal;
