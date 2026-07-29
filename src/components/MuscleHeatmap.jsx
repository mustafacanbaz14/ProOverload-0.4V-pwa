import React, { memo, useState } from 'react';
import { Flame } from 'lucide-react';
import { getVolumeLandmarks } from '../utils/constants';

// Eşikler hem kasa hem deneyim seviyesine özeldir; seviye parametre olarak
// geçirilir (modül düzeyinde tutulsaydı render saf olmazdı).
function getMuscleColor(count, muscle, level) {
  const { mev, mrv } = getVolumeLandmarks(muscle, level);
  if (!count) return '#27272a';       // çalışılmadı
  if (count < mev) return '#38bdf8';  // koruma altı
  if (count <= mrv) return '#34d399'; // verimli aralık
  return '#f97316';                    // tavanın üstü
}

function getMuscleStatus(count, muscle, level) {
  const { mev, mav, mrv } = getVolumeLandmarks(muscle, level);
  if (!count) return 'Çalışılmadı';
  if (count < mev) return `Koruma altı · MEV ${mev}`;
  if (count <= mav) return `Verimli aralık · MAV ${mav}`;
  if (count <= mrv) return `Yüksek · MRV ${mrv}`;
  return `Tavanın üstünde · MRV ${mrv}`;
}

const MuscleHeatmap = memo(({
  muscleVolume = {},
  onSelectMuscle,
  experienceLevel = 'intermediate',
  // Şablon ve haftalık plan önizlemelerinde de kullanılıyor; başlık oradan gelir.
  title = 'Kas Isı Haritası',
  subtitle = 'Bu Hafta',
}) => {
  const [selected, setSelected] = useState('Göğüs');

  const vol = (m) => muscleVolume[m] || 0;
  const activeCount = vol(selected);

  // Her bölge tek yerden tanımlanır; renk ve seçim davranışı ortaklaşır.
  const region = (muscle) => ({
    fill: getMuscleColor(vol(muscle), muscle, experienceLevel),
    onClick: () => setSelected(muscle),
    className: 'cursor-pointer transition-all duration-300',
    stroke: selected === muscle ? '#e4e4e7' : 'transparent',
    strokeWidth: selected === muscle ? 1.2 : 0,
  });

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-800 bg-zinc-950/60">
        <h3 className="text-[11px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
          <Flame size={14} className="mr-2 text-orange-500" /> {title}
        </h3>
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{subtitle}</span>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex justify-around items-start bg-zinc-950 py-4 rounded-xl border border-zinc-800/80">

          {/* --- ÖN CEPHE --- */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">Ön</span>
            <svg viewBox="0 0 110 180" className="w-28 h-44">
              <circle cx="55" cy="15" r="9" fill="#3f3f46" />
              <rect x="51" y="24" width="8" height="5" fill="#3f3f46" />

              {/* Trapez — boyun yanları, önden görünen üst kısım */}
              <path d="M 43 30 L 55 27 L 67 30 L 62 37 L 48 37 Z" {...region('Trapez')} />

              {/* Ön deltoid */}
              <ellipse cx="33" cy="41" rx="8" ry="7" {...region('Ön Omuz')} />
              <ellipse cx="77" cy="41" rx="8" ry="7" {...region('Ön Omuz')} />

              {/* Yan deltoid — omuzun dış kenarı */}
              <path d="M 25 38 Q 21 45 24 51 L 29 48 Q 27 43 29 39 Z" {...region('Yan Omuz')} />
              <path d="M 85 38 Q 89 45 86 51 L 81 48 Q 83 43 81 39 Z" {...region('Yan Omuz')} />

              {/* Göğüs */}
              <path d="M 41 38 L 69 38 L 66 56 L 44 56 Z" {...region('Göğüs')} />

              {/* Biseps */}
              <rect x="24" y="53" width="8" height="20" rx="4" {...region('Biseps')} />
              <rect x="78" y="53" width="8" height="20" rx="4" {...region('Biseps')} />

              {/* Önkol */}
              <rect x="22" y="75" width="7" height="19" rx="3.5" {...region('Önkol')} />
              <rect x="81" y="75" width="7" height="19" rx="3.5" {...region('Önkol')} />

              {/* Karın */}
              <path d="M 46 58 L 64 58 L 62 86 L 48 86 Z" {...region('Karın')} />

              {/* Quadriceps */}
              <path d="M 43 90 L 53 90 L 51 130 L 42 130 Z" {...region('Quadriceps')} />
              <path d="M 57 90 L 67 90 L 68 130 L 59 130 Z" {...region('Quadriceps')} />

              {/* Baldır */}
              <path d="M 43 133 L 51 133 L 50 160 L 44 160 Z" {...region('Baldır')} />
              <path d="M 59 133 L 67 133 L 66 160 L 60 160 Z" {...region('Baldır')} />
            </svg>
          </div>

          {/* --- ARKA CEPHE --- */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">Arka</span>
            <svg viewBox="0 0 110 180" className="w-28 h-44">
              <circle cx="55" cy="15" r="9" fill="#3f3f46" />
              <rect x="51" y="24" width="8" height="5" fill="#3f3f46" />

              {/* Trapez — üst sırt, arkadan baskın */}
              <path d="M 41 29 L 55 26 L 69 29 L 66 45 L 44 45 Z" {...region('Trapez')} />

              {/* Arka deltoid */}
              <ellipse cx="33" cy="42" rx="8" ry="7" {...region('Arka Omuz')} />
              <ellipse cx="77" cy="42" rx="8" ry="7" {...region('Arka Omuz')} />

              {/* Kanat (latissimus) — koltuk altından bele daralan V */}
              <path d="M 42 46 L 55 46 L 55 72 L 46 66 Z" {...region('Kanat')} />
              <path d="M 68 46 L 55 46 L 55 72 L 64 66 Z" {...region('Kanat')} />

              {/* Orta sırt (romboid) — kürek kemikleri arası */}
              <rect x="48" y="47" width="14" height="14" rx="2" {...region('Orta Sırt')} />

              {/* Bel (erektörler) */}
              <path d="M 47 73 L 63 73 L 62 86 L 48 86 Z" {...region('Bel')} />

              {/* Triseps */}
              <rect x="24" y="53" width="8" height="20" rx="4" {...region('Triseps')} />
              <rect x="78" y="53" width="8" height="20" rx="4" {...region('Triseps')} />

              {/* Önkol */}
              <rect x="22" y="75" width="7" height="19" rx="3.5" {...region('Önkol')} />
              <rect x="81" y="75" width="7" height="19" rx="3.5" {...region('Önkol')} />

              {/* Kalça */}
              <path d="M 44 88 L 66 88 L 65 104 L 45 104 Z" {...region('Kalça')} />

              {/* Hamstring */}
              <path d="M 43 106 L 53 106 L 51 130 L 42 130 Z" {...region('Hamstring')} />
              <path d="M 57 106 L 67 106 L 68 130 L 59 130 Z" {...region('Hamstring')} />

              {/* Baldır */}
              <path d="M 43 133 L 51 133 L 50 160 L 44 160 Z" {...region('Baldır')} />
              <path d="M 59 133 L 67 133 L 66 160 L 60 160 Z" {...region('Baldır')} />
            </svg>
          </div>
        </div>

        {/* Seçili bölge özeti */}
        <button
          onClick={() => onSelectMuscle?.(selected)}
          className="w-full bg-zinc-950 px-4 py-3 rounded-xl border border-zinc-800 flex items-center justify-between active:bg-zinc-900 transition-colors text-left"
        >
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Seçili Bölge</span>
            <span className="text-sm font-bold text-zinc-100">{selected}</span>
            {onSelectMuscle && (
              <span className="text-[10px] font-mono text-cyan-500 block mt-0.5">Detay için dokun →</span>
            )}
          </div>
          <div className="text-right">
            <span className="text-lg font-mono font-bold" style={{ color: getMuscleColor(activeCount, selected, experienceLevel) }}>
              {activeCount}
            </span>
            <span className="text-[10px] font-mono text-zinc-500 block">{getMuscleStatus(activeCount, selected, experienceLevel)}</span>
          </div>
        </button>

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
