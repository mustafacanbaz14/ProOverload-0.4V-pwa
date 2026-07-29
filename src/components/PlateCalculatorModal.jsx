import React, { useState, memo } from 'react';
import { X, Layers, Flame } from 'lucide-react';
import {
  calculatePlates, groupPlates, generateWarmup, BAR_OPTIONS
} from '../utils/plates';

const PLATE_COLOR = {
  25: 'bg-red-600 border-red-500',
  20: 'bg-blue-600 border-blue-500',
  15: 'bg-yellow-500 border-yellow-400',
  10: 'bg-emerald-600 border-emerald-500',
  5: 'bg-zinc-300 border-zinc-200',
  2.5: 'bg-zinc-500 border-zinc-400',
  1.25: 'bg-zinc-600 border-zinc-500',
};

const PlateCalculatorModal = memo(({ isOpen, onClose, initialWeight = 0 }) => {
  const [weight, setWeight] = useState(initialWeight || 60);
  const [bar, setBar] = useState(20);
  const [tab, setTab] = useState('plates'); // 'plates' | 'warmup'

  if (!isOpen) return null;

  const result = calculatePlates(weight, bar);
  const grouped = groupPlates(result.perSide);
  const warmup = generateWarmup(weight, bar);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[95] flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[88dvh]">

        <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 shrink-0">
          <h3 className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
            <Layers size={15} className="mr-2 text-cyan-400" /> Plaka & Isınma
          </h3>
          <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1" aria-label="Kapat">
            <X size={20} />
          </button>
        </div>

        <div className="p-3 space-y-3 border-b border-zinc-800 bg-zinc-950 shrink-0">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Hedef (kg)</label>
              <input
                type="number" inputMode="decimal" step="1.25"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value) || 0)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 text-center font-mono text-lg font-bold text-cyan-400 outline-none focus:border-cyan-600"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Bar</label>
              <select
                value={bar}
                onChange={(e) => setBar(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 px-2 text-[11px] font-mono text-zinc-200 outline-none h-[46px]"
              >
                {BAR_OPTIONS.map(o => (
                  <option key={o.weight} value={o.weight}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-1.5">
            {[-5, -2.5, +2.5, +5].map(delta => (
              <button
                key={delta}
                onClick={() => setWeight(w => Math.max(0, Math.round((w + delta) * 100) / 100))}
                className="flex-1 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 text-[11px] font-bold active:bg-zinc-800 transition-colors"
              >
                {delta > 0 ? `+${delta}` : delta}
              </button>
            ))}
          </div>

          <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            {[
              { key: 'plates', label: 'Plakalar', icon: Layers },
              { key: 'warmup', label: 'Isınma', icon: Flame },
            ].map(t => {
              const TabIcon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center ${tab === t.key ? 'bg-cyan-600 text-white' : 'text-zinc-500'}`}
                >
                  <TabIcon size={12} className="mr-1" /> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar p-4">
          {tab === 'plates' ? (
            <div className="space-y-3">
              {!result.exact && (
                <div className="bg-orange-950/20 border border-orange-900/40 rounded-xl p-3">
                  <p className="text-[10px] font-mono text-orange-300 leading-relaxed">
                    {weight <= bar
                      ? 'Hedef bar ağırlığından düşük — plaka gerekmiyor.'
                      : `Bu ağırlık mevcut plakalarla tam kurulamıyor. En yakın: ${result.achievable} kg (${result.remainder > 0 ? 'eksik' : 'fazla'} ${Math.abs(result.remainder)} kg).`}
                  </p>
                </div>
              )}

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
                <div className="text-center mb-3">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Barın Tek Tarafına</span>
                  <span className="text-2xl font-mono font-bold text-zinc-100">{result.achievable} kg</span>
                  <span className="text-[10px] font-mono text-zinc-600 block">toplam ({bar} kg bar dahil)</span>
                </div>

                {grouped.length === 0 ? (
                  <div className="text-center py-4 text-zinc-600 text-[11px] font-mono">Plaka gerekmiyor</div>
                ) : (
                  <div className="space-y-2">
                    {grouped.map(({ plate, count }) => (
                      <div key={plate} className="flex items-center gap-3">
                        <div className={`w-2.5 rounded-sm border ${PLATE_COLOR[plate] || 'bg-zinc-600 border-zinc-500'}`}
                          style={{ height: `${Math.max(16, plate * 1.1)}px` }} />
                        <span className="font-mono text-sm text-zinc-200 font-bold flex-1">{plate} kg</span>
                        <span className="font-mono text-sm text-cyan-400 font-bold">× {count}</span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[9px] font-mono text-zinc-600 mt-3 pt-3 border-t border-zinc-900 leading-relaxed">
                  Listedeki plakalar <strong className="text-zinc-400">her iki tarafa ayrı ayrı</strong> takılır.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {warmup.length === 0 ? (
                <div className="text-center py-8 text-zinc-600 text-[11px] font-mono">
                  Bu ağırlık için ısınma kademesi gerekmiyor.
                </div>
              ) : (
                <>
                  {warmup.map((step, i) => (
                    <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-mono text-zinc-500">
                          {i + 1}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">{step.label}</span>
                      </div>
                      <span className="font-mono text-sm">
                        <strong className="text-zinc-100">{step.weight}</strong>
                        <span className="text-zinc-500"> kg × {step.reps}</span>
                      </span>
                    </div>
                  ))}
                  <div className="bg-cyan-950/20 border border-cyan-900/40 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-cyan-500 uppercase font-bold">Çalışma Seti</span>
                    <span className="font-mono text-sm font-bold text-cyan-400">{weight} kg</span>
                  </div>
                  <p className="text-[9px] font-mono text-zinc-600 mt-2 leading-relaxed">
                    Isınma setleri tükenişe gitmez; amaç sinir sistemini hazırlamak, yorgunluk
                    biriktirmemek. Uygulamada bunları <strong className="text-zinc-400">W</strong> ile
                    işaretlersen hacme sayılmaz.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

PlateCalculatorModal.displayName = 'PlateCalculatorModal';

export default PlateCalculatorModal;
