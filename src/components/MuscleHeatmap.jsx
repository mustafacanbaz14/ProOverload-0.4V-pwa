import React, { memo, useId, useState } from 'react';
import { Flame, Box } from 'lucide-react';
import { getVolumeLandmarks, volumeStatusOf, VOLUME_STATUS } from '../utils/constants';

const MUSCLE_LOCATION = {
  'Göğüs': 'Köprücük kemiğinin altından göğüs kafesinin ortasına uzanan ön bölge.',
  'Kanat': 'Koltuk altından bele doğru inen, sırtın dış V çizgisini oluşturan bölge.',
  'Orta Sırt': 'İki kürek kemiğinin arasında, omurganın iki yanında kalan bölge.',
  'Trapez': 'Boyun tabanından omuzlara ve kürek kemiklerinin üstüne yayılan bölge.',
  'Ön Omuz': 'Omuz başının öne bakan kısmı.',
  'Yan Omuz': 'Omuz başının dış yan kısmı; omuz genişliğini belirginleştirir.',
  'Arka Omuz': 'Omuz başının arkaya bakan, sırtla birleşen kısmı.',
  'Biseps': 'Üst kolun ön yüzü.',
  'Triseps': 'Üst kolun arka yüzü.',
  'Önkol': 'Dirsek ile el bileği arasındaki bölüm.',
  'Quadriceps': 'Uyluğun ön yüzü.',
  'Hamstring': 'Uyluğun arka yüzü.',
  'Kalça': 'Leğen kemiğinin arkasındaki kalça kasları.',
  'Baldır': 'Diz ile ayak bileği arasındaki arka alt bacak.',
  'Karın': 'Göğüs kafesi ile leğen kemiği arasındaki ön merkez.',
  'Bel': 'Alt sırtta omurganın iki yanında kalan erektör bölgesi.',
};

// Eşikler hem kasa hem deneyim seviyesine özeldir; seviye parametre olarak
// geçirilir (modül düzeyinde tutulsaydı render saf olmazdı).
function getMuscleColor(count, muscle, level) {
  return VOLUME_STATUS[volumeStatusOf(count, muscle, level)].hex;
}

// Etikete eşiği de ekler: kullanıcı rengin neye göre belirlendiğini görmeli.
function getMuscleStatus(count, muscle, level) {
  const { mev, mav, mrv } = getVolumeLandmarks(muscle, level);
  const key = volumeStatusOf(count, muscle, level);
  const suffix = { none: '', under: ` · MEV ${mev}`, optimal: ` · MAV ${mav}`, high: ` · MRV ${mrv}`, over: ` · MRV ${mrv}` };
  return VOLUME_STATUS[key].label + suffix[key];
}

const MuscleHeatmap = memo(({
  muscleVolume = {},
  onSelectMuscle,
  experienceLevel = 'intermediate',
  // Şablon ve haftalık plan önizlemelerinde de kullanılıyor; başlık oradan gelir.
  title = 'Kas Isı Haritası',
  subtitle = 'Bu Hafta',
  gender = 'male',
}) => {
  const [selected, setSelected] = useState('Göğüs');
  const [depthMode, setDepthMode] = useState(true);
  const filterId = `${useId().replace(/:/g, '')}-muscle-depth`;

  const vol = (m) => muscleVolume[m] || 0;
  const activeCount = vol(selected);
  const activeLandmarks = getVolumeLandmarks(selected, experienceLevel);
  const activeProgress = Math.min(100, Math.round(activeCount / activeLandmarks.mrv * 100));
  const bodyPath = gender === 'female'
    // Daha dar omuz/ribcage, belirgin bel, daha geniş pelvis ve uyluk oranı.
    // Önceki yol erkek gövdesinin yalnızca belini kıvırıyordu; siluet bu yüzden
    // kadın bedeni olarak okunmuyordu.
    ? 'M48 29 C44 29 39 31 36 34 C33 37 31 42 31 49 L27 91 C27 95 30 97 34 95 L40 79 C42 73 43 68 44 63 C44 73 43 81 40 89 C36 97 34 103 36 110 C37 117 40 123 40 132 L39 163 L51 163 L53 113 C53 109 54 107 55 107 C56 107 57 109 57 113 L59 163 L71 163 L70 132 C70 123 73 117 74 110 C76 103 74 97 70 89 C67 81 66 73 66 63 C67 68 68 73 70 79 L76 95 C80 97 83 95 83 91 L79 49 C79 42 77 37 74 34 C71 31 66 29 62 29 Z'
    : 'M42 29 Q31 31 25 39 L22 91 L31 94 L40 84 L42 130 L41 161 L52 161 L55 105 L58 161 L69 161 L68 130 L70 84 L79 94 L88 91 L85 39 Q79 31 68 29 Z';

  // Her bölge tek yerden tanımlanır; renk ve seçim davranışı ortaklaşır.
  const region = (muscle) => ({
    fill: getMuscleColor(vol(muscle), muscle, experienceLevel),
    onClick: () => setSelected(muscle),
    onKeyDown: (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setSelected(muscle);
      }
    },
    role: 'button',
    tabIndex: 0,
    'aria-label': `${muscle}: ${vol(muscle)} etkili set`,
    className: 'cursor-pointer transition-all duration-300 hover:brightness-110',
    stroke: selected === muscle ? 'var(--color-cyan-400)' : '#18181b',
    strokeWidth: selected === muscle ? 1.8 : 0.8,
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
    vectorEffect: 'non-scaling-stroke',
    filter: depthMode ? `url(#${filterId})` : undefined,
  });

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-800 bg-zinc-950/60">
        <h3 className="text-[11px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
          <Flame size={14} className="mr-2 text-orange-500" /> {title}
        </h3>
        <span className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{subtitle}</span>
          <button onClick={() => setDepthMode(value => !value)} aria-pressed={depthMode} className={`px-2 py-1 rounded-lg border text-[9px] font-mono flex items-center gap-1 ${depthMode ? 'border-cyan-700 bg-cyan-950/30 text-cyan-400' : 'border-zinc-800 text-zinc-600'}`}>
            <Box size={10} /> 3B
          </button>
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div className="bg-zinc-950 rounded-xl border border-zinc-800/80 overflow-hidden">
          <div className="px-3 pt-2.5 flex items-center justify-between">
            <span className="text-[9px] font-mono text-zinc-600">Bölgeye dokun · {gender === 'female' ? 'kadın' : 'erkek'} görünümü</span>
            <span className="text-[9px] font-mono text-cyan-600">{selected}</span>
          </div>
          <div className="flex justify-around items-start py-2.5">

          {/* --- ÖN CEPHE --- */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">Ön</span>
            <svg viewBox="0 0 110 180" className="w-32 h-52 transition-transform duration-300" style={depthMode ? { transform: 'perspective(360px) rotateY(8deg) rotateX(2deg)', filter: 'drop-shadow(4px 5px 5px rgb(0 0 0 / 0.35))' } : undefined} role="img" aria-label="Ön kas bölgeleri">
              <defs>
                <filter id={filterId} x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="1" dy="1.5" stdDeviation="0.8" floodColor="#000" floodOpacity="0.55" /></filter>
                <radialGradient id={`${filterId}-head-front`} cx="35%" cy="30%"><stop offset="0" stopColor="#71717a" /><stop offset="1" stopColor="#27272a" /></radialGradient>
              </defs>
              {gender === 'female' && <path d="M46 15 Q46 4 55 4 Q64 4 64 15 L62 24 Q58 20 55 21 Q52 20 48 24 Z" fill="#18181b" opacity="0.9" />}
              <ellipse cx="55" cy="15" rx={gender === 'female' ? 8 : 9} ry={gender === 'female' ? 9.5 : 9} fill={depthMode ? `url(#${filterId}-head-front)` : '#3f3f46'} />
              <rect x={gender === 'female' ? 52 : 51} y="24" width={gender === 'female' ? 6 : 8} height="5" fill="#3f3f46" />
              <path d={bodyPath} fill="#27272a" stroke="#3f3f46" strokeWidth="0.7" />

              {/* Trapez — boyun yanları, önden görünen üst kısım */}
              <path d={gender === 'female' ? 'M 47 30 L 55 27 L 63 30 L 61 36 L 49 36 Z' : 'M 43 30 L 55 27 L 67 30 L 62 37 L 48 37 Z'} {...region('Trapez')} />

              {/* Ön deltoid */}
              <ellipse cx={gender === 'female' ? 38 : 33} cy="41" rx={gender === 'female' ? 6 : 8} ry="7" {...region('Ön Omuz')} />
              <ellipse cx={gender === 'female' ? 72 : 77} cy="41" rx={gender === 'female' ? 6 : 8} ry="7" {...region('Ön Omuz')} />

              {/* Yan deltoid — omuzun dış kenarı */}
              <path d={gender === 'female' ? 'M 33 37 Q 29 44 31 51 L 36 48 Q 34 43 37 38 Z' : 'M 25 38 Q 21 45 24 51 L 29 48 Q 27 43 29 39 Z'} {...region('Yan Omuz')} />
              <path d={gender === 'female' ? 'M 77 37 Q 81 44 79 51 L 74 48 Q 76 43 73 38 Z' : 'M 85 38 Q 89 45 86 51 L 81 48 Q 83 43 81 39 Z'} {...region('Yan Omuz')} />

              {/* Göğüs */}
              <path d={gender === 'female' ? 'M 41 39 Q 47 35 54 39 L 54 55 Q 48 60 42 55 Z' : 'M 41 38 L 54 38 L 54 56 L 44 56 Z'} {...region('Göğüs')} />
              <path d={gender === 'female' ? 'M 56 39 Q 63 35 69 39 L 68 55 Q 62 60 56 55 Z' : 'M 56 38 L 69 38 L 66 56 L 56 56 Z'} {...region('Göğüs')} />

              {/* Biseps */}
              <rect x={gender === 'female' ? 27 : 24} y="53" width="8" height="20" rx="4" {...region('Biseps')} />
              <rect x={gender === 'female' ? 75 : 78} y="53" width="8" height="20" rx="4" {...region('Biseps')} />

              {/* Önkol */}
              <rect x="22" y="75" width="7" height="19" rx="3.5" {...region('Önkol')} />
              <rect x="81" y="75" width="7" height="19" rx="3.5" {...region('Önkol')} />

              {/* Karın */}
              <path d="M 47 58 L 54 58 L 54 86 L 49 86 Z" {...region('Karın')} />
              <path d="M 56 58 L 63 58 L 61 86 L 56 86 Z" {...region('Karın')} />

              {/* Quadriceps */}
              <path d={gender === 'female' ? 'M 36 92 Q 44 87 53 91 L 51 132 L 40 132 Z' : 'M 43 90 L 53 90 L 51 130 L 42 130 Z'} {...region('Quadriceps')} />
              <path d={gender === 'female' ? 'M 57 91 Q 66 87 74 92 L 70 132 L 59 132 Z' : 'M 57 90 L 67 90 L 68 130 L 59 130 Z'} {...region('Quadriceps')} />

              {/* Baldır */}
              <path d="M 43 133 L 51 133 L 50 160 L 44 160 Z" {...region('Baldır')} />
              <path d="M 59 133 L 67 133 L 66 160 L 60 160 Z" {...region('Baldır')} />
            </svg>
          </div>

          {/* --- ARKA CEPHE --- */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">Arka</span>
            <svg viewBox="0 0 110 180" className="w-32 h-52 transition-transform duration-300" style={depthMode ? { transform: 'perspective(360px) rotateY(-8deg) rotateX(2deg)', filter: 'drop-shadow(-4px 5px 5px rgb(0 0 0 / 0.35))' } : undefined} role="img" aria-label="Arka kas bölgeleri">
              <defs>
                <filter id={`${filterId}-back`} x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="-1" dy="1.5" stdDeviation="0.8" floodColor="#000" floodOpacity="0.55" /></filter>
                <radialGradient id={`${filterId}-head-back`} cx="65%" cy="30%"><stop offset="0" stopColor="#71717a" /><stop offset="1" stopColor="#27272a" /></radialGradient>
              </defs>
              {gender === 'female' && <path d="M46 15 Q46 4 55 4 Q64 4 64 15 L65 31 Q60 27 55 29 Q50 27 45 31 Z" fill="#18181b" opacity="0.9" />}
              <ellipse cx="55" cy="15" rx={gender === 'female' ? 8 : 9} ry={gender === 'female' ? 9.5 : 9} fill={depthMode ? `url(#${filterId}-head-back)` : '#3f3f46'} />
              <rect x={gender === 'female' ? 52 : 51} y="24" width={gender === 'female' ? 6 : 8} height="5" fill="#3f3f46" />
              <path d={bodyPath} fill="#27272a" stroke="#3f3f46" strokeWidth="0.7" />

              {/* Trapez — üst sırt, arkadan baskın */}
              <path d={gender === 'female' ? 'M 47 29 L 55 26 L 63 29 L 62 43 L 55 39 L 48 43 Z' : 'M 42 29 L 55 26 L 68 29 L 64 45 L 55 40 L 46 45 Z'} {...region('Trapez')} />

              {/* Arka deltoid */}
              <ellipse cx={gender === 'female' ? 38 : 33} cy="42" rx={gender === 'female' ? 6 : 8} ry="7" {...region('Arka Omuz')} />
              <ellipse cx={gender === 'female' ? 72 : 77} cy="42" rx={gender === 'female' ? 6 : 8} ry="7" {...region('Arka Omuz')} />

              {/* Kanatlar merkezde üst üste bindirilmez. Eski üçgenler x=55 çizgisini
                  paylaşınca özellikle iOS ölçeklemesinde dikiş/taşma oluşturuyordu. */}
              <path d="M 43 45 C 37 48 35 58 38 68 C 40 73 44 78 49 81 L 51 66 L 50 48 Z" {...region('Kanat')} />
              <path d="M 67 45 C 73 48 75 58 72 68 C 70 73 66 78 61 81 L 59 66 L 60 48 Z" {...region('Kanat')} />

              {/* Orta sırt iki romboid yüzeydir; dıştaki geniş kanat yüzeyinden
                  merkez boşluğu ve eğik sınırlarla ayrılır. */}
              <path d="M 49 47 L 54 50 L 54 66 L 47 60 Z" {...region('Orta Sırt')} />
              <path d="M 61 47 L 56 50 L 56 66 L 63 60 Z" {...region('Orta Sırt')} />
              <line x1="55" y1="43" x2="55" y2="86" stroke="#52525b" strokeWidth="0.55" strokeDasharray="1.5 2" />

              {/* Bel (erektörler) */}
              <path d="M 48 68 L 54 68 L 53 86 L 48 86 Z" {...region('Bel')} />
              <path d="M 56 68 L 62 68 L 62 86 L 57 86 Z" {...region('Bel')} />

              {/* Triseps */}
              <rect x="24" y="53" width="8" height="20" rx="4" {...region('Triseps')} />
              <rect x="78" y="53" width="8" height="20" rx="4" {...region('Triseps')} />

              {/* Önkol */}
              <rect x="22" y="75" width="7" height="19" rx="3.5" {...region('Önkol')} />
              <rect x="81" y="75" width="7" height="19" rx="3.5" {...region('Önkol')} />

              {/* Kalça */}
              <path d={gender === 'female' ? 'M 35 89 Q 45 83 55 88 Q 65 83 75 89 L 72 106 Q 64 113 55 107 Q 46 113 38 106 Z' : 'M 44 88 L 66 88 L 65 104 L 45 104 Z'} {...region('Kalça')} />

              {/* Hamstring */}
              <path d={gender === 'female' ? 'M 38 106 Q 46 111 53 106 L 51 132 L 40 132 Z' : 'M 43 106 L 53 106 L 51 130 L 42 130 Z'} {...region('Hamstring')} />
              <path d={gender === 'female' ? 'M 57 106 Q 64 111 72 106 L 70 132 L 59 132 Z' : 'M 57 106 L 67 106 L 68 130 L 59 130 Z'} {...region('Hamstring')} />

              {/* Baldır */}
              <path d="M 43 133 L 51 133 L 50 160 L 44 160 Z" {...region('Baldır')} />
              <path d="M 59 133 L 67 133 L 66 160 L 60 160 Z" {...region('Baldır')} />
            </svg>
          </div>
        </div>
        </div>

        {/* Seçili bölge özeti */}
        <button
          onClick={() => onSelectMuscle?.(selected)}
          className="w-full bg-zinc-950 px-4 py-3 rounded-xl border border-zinc-800 flex items-center justify-between active:bg-zinc-900 transition-colors text-left"
        >
          <div className="min-w-0 pr-3">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Seçili Bölge</span>
            <span className="text-sm font-bold text-zinc-100">{selected}</span>
            {onSelectMuscle && (
              <span className="text-[10px] font-mono text-cyan-500 block mt-0.5">Detay için dokun →</span>
            )}
            <span className="text-[9px] font-mono text-zinc-600 block mt-1 leading-relaxed">
              {MUSCLE_LOCATION[selected]}
            </span>
          </div>
          <div className="text-right">
            <span className="text-lg font-mono font-bold" style={{ color: getMuscleColor(activeCount, selected, experienceLevel) }}>
              {activeCount}
            </span>
            <span className="text-[10px] font-mono text-zinc-500 block">{getMuscleStatus(activeCount, selected, experienceLevel)}</span>
          </div>
        </button>

        <div className="bg-zinc-950 px-3 py-2.5 rounded-xl border border-zinc-800 space-y-2">
          <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${activeProgress}%`, backgroundColor: getMuscleColor(activeCount, selected, experienceLevel) }}
            />
          </div>
          <div className="grid grid-cols-3 gap-1 text-center text-[9px] font-mono">
            <span className="text-amber-400">MEV {activeLandmarks.mev}</span>
            <span className="text-emerald-400">MAV {activeLandmarks.mav}</span>
            <span className="text-red-400">MRV {activeLandmarks.mrv}</span>
          </div>
        </div>

        {/* Gösterge doğrudan VOLUME_STATUS'tan üretilir — haritadaki renklerle
            ayrı düşemez. */}
        <div className="grid grid-cols-5 gap-1 text-[9px] font-mono text-center">
          {Object.entries(VOLUME_STATUS).map(([key, v]) => (
            <div key={key} className={`py-1.5 rounded-lg border ${v.chip}`}>
              {key === 'none' ? 'Pasif' : v.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

MuscleHeatmap.displayName = 'MuscleHeatmap';

export default MuscleHeatmap;
