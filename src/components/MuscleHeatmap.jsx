import React, { memo, useState } from 'react';
import { Flame } from 'lucide-react';
import { MUSCLE_VOLUME_LANDMARKS } from '../utils/constants';

// Eşikler kasa özeldir: karın için 10 set yüksekken sırt için düşük kalır.
function getLandmarks(muscle) {
  return MUSCLE_VOLUME_LANDMARKS[muscle] || { mev: 6, mav: 16, mrv: 22 };
}

function getMuscleColor(count, muscle) {
  const { mev, mrv } = getLandmarks(muscle);
  if (!count) return '#27272a';       // çalışılmadı
  if (count < mev) return '#38bdf8';  // koruma altı
  if (count <= mrv) return '#34d399'; // verimli aralık
  return '#f97316';                    // tavanın üstü
}

function getMuscleStatus(count, muscle) {
  const { mev, mav, mrv } = getLandmarks(muscle);
  if (!count) return 'Çalışılmadı';
  if (count < mev) return `Koruma altı · MEV ${mev}`;
  if (count <= mav) return `Verimli aralık · MAV ${mav}`;
  if (count <= mrv) return `Yüksek · MRV ${mrv}`;
  return `Tavanın üstünde · MRV ${mrv}`;
}

const MuscleHeatmap = memo(({ muscleVolume = {} }) => {
  const [selected, setSelected] = useState('Göğüs');

  const vol = (m) => muscleVolume[m] || 0;
  const activeCount = vol(selected);

  // Her bölge tek yerden tanımlanır; tıklama ve renk davranışı ortaklaşır.
  const region = (muscle) => ({
    fill: getMuscleColor(vol(muscle), muscle),
    onClick: () => setSelected(muscle),
    className: 'cursor-pointer transition-all duration-300',
    stroke: selected === muscle ? '#e4e4e7' : 'transparent',
    strokeWidth: selected === muscle ? 1.2 : 0,
  });

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-800 bg-zinc-950/60">
        <h3 className="text-[11px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
          <Flame size={14} className="mr-2 text-orange-500" /> Kas Isı Haritası
        </h3>
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Bu Hafta</span>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex justify-around items-start bg-zinc-950 py-4 rounded-xl border border-zinc-800/80">
          {/* --- ÖN CEPHE --- */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">Ön</span>
            <svg viewBox="0 0 100 170" className="w-24 h-40">
              <circle cx="50" cy="16" r="9" fill="#3f3f46" />
              <rect x="46" y="25" width="8" height="6" fill="#3f3f46" />

              {/* Omuz (ön deltoid) */}
              <ellipse cx="30" cy="39" rx="8" ry="7" {...region('Omuz')} />
              <ellipse cx="70" cy="39" rx="8" ry="7" {...region('Omuz')} />

              {/* Göğüs */}
              <path d="M 37 34 L 63 34 L 61 53 L 39 53 Z" {...region('Göğüs')} />

              {/* Ön kol (biseps) */}
              <rect x="21" y="47" width="8" height="23" rx="4" {...region('Ön Kol')} />
              <rect x="71" y="47" width="8" height="23" rx="4" {...region('Ön Kol')} />

              {/* Karın */}
              <path d="M 41 55 L 59 55 L 57 82 L 43 82 Z" {...region('Karın')} />

              {/* Ön bacak (quadriceps) */}
              <path d="M 38 86 L 48 86 L 46 125 L 37 125 Z" {...region('Ön Bacak')} />
              <path d="M 52 86 L 62 86 L 63 125 L 54 125 Z" {...region('Ön Bacak')} />

              {/* Kalf */}
              <path d="M 38 128 L 46 128 L 45 152 L 39 152 Z" {...region('Kalf')} />
              <path d="M 54 128 L 62 128 L 61 152 L 55 152 Z" {...region('Kalf')} />
            </svg>
          </div>

          {/* --- ARKA CEPHE --- */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">Arka</span>
            <svg viewBox="0 0 100 170" className="w-24 h-40">
              <circle cx="50" cy="16" r="9" fill="#3f3f46" />
              <rect x="46" y="25" width="8" height="6" fill="#3f3f46" />

              {/* Omuz (arka deltoid) */}
              <ellipse cx="30" cy="39" rx="8" ry="7" {...region('Omuz')} />
              <ellipse cx="70" cy="39" rx="8" ry="7" {...region('Omuz')} />

              {/* Sırt (trapez + lat) */}
              <path d="M 36 33 L 64 33 L 59 62 L 41 62 Z" {...region('Sırt')} />

              {/* Bel (erektörler) */}
              <path d="M 42 64 L 58 64 L 57 76 L 43 76 Z" {...region('Bel')} />

              {/* Arka kol (triseps) */}
              <rect x="21" y="47" width="8" height="23" rx="4" {...region('Arka Kol')} />
              <rect x="71" y="47" width="8" height="23" rx="4" {...region('Arka Kol')} />

              {/* Kalça */}
              <path d="M 39 78 L 61 78 L 60 96 L 40 96 Z" {...region('Kalça')} />

              {/* Arka bacak (hamstring) */}
              <path d="M 38 98 L 48 98 L 46 125 L 37 125 Z" {...region('Arka Bacak')} />
              <path d="M 52 98 L 62 98 L 63 125 L 54 125 Z" {...region('Arka Bacak')} />

              {/* Kalf */}
              <path d="M 38 128 L 46 128 L 45 152 L 39 152 Z" {...region('Kalf')} />
              <path d="M 54 128 L 62 128 L 61 152 L 55 152 Z" {...region('Kalf')} />
            </svg>
          </div>
        </div>

        {/* Seçili bölge özeti */}
        <div className="bg-zinc-950 px-4 py-3 rounded-xl border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Seçili Bölge</span>
            <span className="text-sm font-bold text-zinc-100">{selected}</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-mono font-bold" style={{ color: getMuscleColor(activeCount, selected) }}>
              {activeCount}
            </span>
            <span className="text-[10px] font-mono text-zinc-500 block">{getMuscleStatus(activeCount, selected)}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5 text-[9px] font-mono text-center">
          <div className="py-1.5 rounded-lg border border-zinc-800 text-zinc-500">Pasif</div>
          <div className="py-1.5 rounded-lg border border-cyan-900/50 text-cyan-400">Koruma altı</div>
          <div className="py-1.5 rounded-lg border border-emerald-900/50 text-emerald-400">Verimli</div>
          <div className="py-1.5 rounded-lg border border-orange-900/50 text-orange-400">Tavan üstü</div>
        </div>
      </div>
    </div>
  );
});

MuscleHeatmap.displayName = 'MuscleHeatmap';

export default MuscleHeatmap;
