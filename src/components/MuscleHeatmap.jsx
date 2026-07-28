import React, { memo, useState } from 'react';
import { Activity, Flame, Info } from 'lucide-react';

function getMuscleColor(count) {
  if (count === 0) return '#27272a'; // Zinc 800
  if (count < 6) return '#38bdf8'; // Cyan 400 (Low / MEV)
  if (count <= 20) return '#34d399'; // Emerald 400 (Optimal / MAV)
  return '#f97316'; // Orange 500 (High / MRV)
}

function getMuscleStatus(count) {
  if (count === 0) return 'Çalışılmadı';
  if (count < 6) return 'Düşük / Bakım (MEV)';
  if (count <= 20) return 'Optimal (MAV)';
  return 'Aşırı Yük (MRV)';
}

const MuscleHeatmap = memo(({ muscleVolume = {} }) => {
  const [selectedMuscle, setSelectedMuscle] = useState('Göğüs');

  const chestCount = muscleVolume['Göğüs'] || 0;
  const backCount = muscleVolume['Sırt'] || 0;
  const shoulderCount = muscleVolume['Omuz'] || 0;
  const armCount = muscleVolume['Kol'] || 0;
  const legCount = muscleVolume['Bacak'] || 0;
  const coreCount = muscleVolume['Merkez'] || 0;

  const activeCount = muscleVolume[selectedMuscle] || 0;

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 space-y-3">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
        <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider flex items-center">
          <Flame size={15} className="mr-1.5 text-orange-500 animate-pulse" /> 7 Günlük Kas Isı Haritası
        </h3>
        <span className="text-[9px] font-mono text-zinc-500 uppercase">İnteraktif Görsel</span>
      </div>

      {/* SVG Silüetleri (Ön ve Arka Görünüm) */}
      <div className="flex justify-around items-center bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 my-2">
        {/* Ön Görünüm (Front View) */}
        <div className="flex flex-col items-center">
          <span className="text-[8px] font-mono text-zinc-500 uppercase mb-1">Ön Cephe</span>
          <svg viewBox="0 0 100 160" className="w-24 h-36 drop-shadow-md">
            {/* Kafa */}
            <circle cx="50" cy="18" r="10" fill="#3f3f46" />
            {/* Boyun */}
            <rect x="47" y="28" width="6" height="6" fill="#3f3f46" />
            {/* Omuzlar (Ön) */}
            <circle cx="31" cy="38" r="7" fill={getMuscleColor(shoulderCount)} className="cursor-pointer transition-colors" onClick={() => setSelectedMuscle('Omuz')} />
            <circle cx="69" cy="38" r="7" fill={getMuscleColor(shoulderCount)} className="cursor-pointer transition-colors" onClick={() => setSelectedMuscle('Omuz')} />
            {/* Göğüs */}
            <path d="M 36 38 L 64 38 L 61 54 L 39 54 Z" fill={getMuscleColor(chestCount)} className="cursor-pointer transition-colors" onClick={() => setSelectedMuscle('Göğüs')} />
            {/* Kollur (Pazu - Biceps) */}
            <rect x="23" y="46" width="7" height="22" rx="3" fill={getMuscleColor(armCount)} className="cursor-pointer transition-colors" onClick={() => setSelectedMuscle('Kol')} />
            <rect x="70" y="46" width="7" height="22" rx="3" fill={getMuscleColor(armCount)} className="cursor-pointer transition-colors" onClick={() => setSelectedMuscle('Kol')} />
            {/* Karın / Merkez (Core) */}
            <path d="M 40 56 L 60 56 L 57 82 L 43 82 Z" fill={getMuscleColor(coreCount)} className="cursor-pointer transition-colors" onClick={() => setSelectedMuscle('Merkez')} />
            {/* Bacaklar (Ön Uyluk / Quads) */}
            <path d="M 38 85 L 48 85 L 46 135 L 36 135 Z" fill={getMuscleColor(legCount)} className="cursor-pointer transition-colors" onClick={() => setSelectedMuscle('Bacak')} />
            <path d="M 52 85 L 62 85 L 64 135 L 54 135 Z" fill={getMuscleColor(legCount)} className="cursor-pointer transition-colors" onClick={() => setSelectedMuscle('Bacak')} />
          </svg>
        </div>

        {/* Arka Görünüm (Back View) */}
        <div className="flex flex-col items-center">
          <span className="text-[8px] font-mono text-zinc-500 uppercase mb-1">Arka Cephe</span>
          <svg viewBox="0 0 100 160" className="w-24 h-36 drop-shadow-md">
            {/* Kafa */}
            <circle cx="50" cy="18" r="10" fill="#3f3f46" />
            {/* Boyun */}
            <rect x="47" y="28" width="6" height="6" fill="#3f3f46" />
            {/* Omuzlar (Arka / Posterior Deltoid) */}
            <circle cx="31" cy="38" r="7" fill={getMuscleColor(shoulderCount)} className="cursor-pointer transition-colors" onClick={() => setSelectedMuscle('Omuz')} />
            <circle cx="69" cy="38" r="7" fill={getMuscleColor(shoulderCount)} className="cursor-pointer transition-colors" onClick={() => setSelectedMuscle('Omuz')} />
            {/* Sırt (Lat & Upper Back) */}
            <path d="M 35 38 L 65 38 L 58 75 L 42 75 Z" fill={getMuscleColor(backCount)} className="cursor-pointer transition-colors" onClick={() => setSelectedMuscle('Sırt')} />
            {/* Arka Kol (Triceps) */}
            <rect x="23" y="46" width="7" height="22" rx="3" fill={getMuscleColor(armCount)} className="cursor-pointer transition-colors" onClick={() => setSelectedMuscle('Kol')} />
            <rect x="70" y="46" width="7" height="22" rx="3" fill={getMuscleColor(armCount)} className="cursor-pointer transition-colors" onClick={() => setSelectedMuscle('Kol')} />
            {/* Kalça / Bacak Arka (Hamstrings/Glutes) */}
            <path d="M 38 78 L 62 78 L 64 135 L 36 135 Z" fill={getMuscleColor(legCount)} className="cursor-pointer transition-colors" onClick={() => setSelectedMuscle('Bacak')} />
          </svg>
        </div>
      </div>

      {/* Seçili Kas Grubu Detay Bilgisi */}
      <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex items-center justify-between">
        <div>
          <span className="text-[8px] font-mono text-zinc-500 uppercase block font-bold">Seçili Bölge</span>
          <span className="text-sm font-bold text-cyan-400">{selectedMuscle}</span>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono font-bold text-zinc-100">{activeCount} Set</span>
          <span className="text-[8px] font-mono block" style={{ color: getMuscleColor(activeCount) }}>
            {getMuscleStatus(activeCount)}
          </span>
        </div>
      </div>

      {/* Renk Lejandı */}
      <div className="grid grid-cols-4 gap-1 text-[7px] font-mono text-center pt-1">
        <div className="bg-zinc-950 p-1 rounded border border-zinc-800 text-zinc-500">0 Set (Pasif)</div>
        <div className="bg-zinc-950 p-1 rounded border border-cyan-900/50 text-cyan-400">1-5 (Düşük)</div>
        <div className="bg-zinc-950 p-1 rounded border border-emerald-900/50 text-emerald-400">6-20 (Optimal)</div>
        <div className="bg-zinc-950 p-1 rounded border border-orange-900/50 text-orange-400">21+ (Yüksek)</div>
      </div>
    </div>
  );
});

MuscleHeatmap.displayName = 'MuscleHeatmap';

export default MuscleHeatmap;
