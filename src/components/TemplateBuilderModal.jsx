import React, { useState, memo } from 'react';
import { X, Plus, Trash2, Save, Clock, Layers, Calendar, ChevronUp, ChevronDown } from 'lucide-react';
import { getVolumeLandmarks } from '../utils/constants';
import { previewTemplateVolume, estimateDuration } from '../utils/templates';
import ExerciseLibraryModal from './ExerciseLibraryModal';

const DAY_NAMES = ['1. Gün', '2. Gün', '3. Gün', '4. Gün', '5. Gün', '6. Gün', '7. Gün'];

/**
 * Gün gün şablon oluşturucu.
 *
 * Her gün ayrı bir şablon olarak kaydedilir (uygulamanın şablon modeli tek
 * seanslık). Program adı gün adlarının önüne eklenir: "PPL — Push".
 *
 * Önizlemede hacim, TÜM SETLER ETKİLİ varsayımıyla hesaplanır: şablonda henüz
 * RIR yoktur, bu yüzden gösterilen değer üst sınırdır.
 */
const TemplateBuilderModal = memo(({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  // Doluysa tek şablonu düzenleme kipi: gün sekmeleri gizlenir, program adı
  // doğrudan şablonun adıdır. Üst bileşen key ile yeniden bağlar.
  editing = null,
  customExercises = [],
  restSeconds = 120,
  experienceLevel = 'intermediate',
  libraryProps = {},
}) => {
  const [programName, setProgramName] = useState(editing?.name || '');
  const [days, setDays] = useState(() => editing
    ? [{
      name: editing.name,
      exercises: (editing.exercises || []).map(ex => ({
        name: ex.name,
        sets: Math.max(1, (ex.sets || []).length),
      })),
    }]
    : [{ name: DAY_NAMES[0], exercises: [] }]);
  const [activeDay, setActiveDay] = useState(0);
  // Kütüphane bu bileşenin içinden açılır; böylece seçilen hareket bir üst
  // bileşene çıkıp geri dönmek zorunda kalmaz (render sırasında yan etki olurdu).
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!isOpen) return null;

  const day = days[activeDay] || days[0];

  // Şablon önizlemesi için set sayısını gerçek set nesnelerine çevir.
  const toExercises = (d) => d.exercises.map(ex => ({
    name: ex.name,
    sets: Array.from({ length: ex.sets }, () => ({ weight: '', reps: '', rir: 2, setType: 'normal' })),
  }));

  const { byMuscle, totalSets } = previewTemplateVolume(toExercises(day), customExercises);
  // Boş günde "~1 dk" saçma görünüyor; süre ancak set varsa anlamlı.
  const minutes = totalSets > 0 ? estimateDuration(toExercises(day), restSeconds) : 0;
  const ranked = Object.entries(byMuscle).sort((a, b) => b[1] - a[1]);
  const maxVol = ranked.length ? ranked[0][1] : 1;

  const updateDay = (patch) => setDays(prev => prev.map((d, i) => i === activeDay ? { ...d, ...patch } : d));
  const setExerciseSets = (idx, n) => updateDay({
    exercises: day.exercises.map((ex, i) => i === idx ? { ...ex, sets: Math.max(1, Math.min(12, n)) } : ex)
  });

  const canSave = programName.trim() && days.some(d => d.exercises.length > 0);

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[88] flex flex-col h-[100dvh] max-w-[420px] mx-auto">

      <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 shrink-0 pt-safe">
        <h3 className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
          <Calendar size={15} className="mr-2 text-cyan-400" /> {editing ? 'Şablonu Düzenle' : 'Program Oluştur'}
        </h3>
        <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1" aria-label="Kapat">
          <X size={20} />
        </button>
      </div>

      <div className="p-3 space-y-2.5 border-b border-zinc-800 bg-zinc-950 shrink-0">
        <input
          type="text"
          value={programName}
          onChange={(e) => setProgramName(e.target.value)}
          placeholder={editing ? 'Şablon adı' : 'Program adı (örn. Push Pull Legs)'}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-100 outline-none font-mono text-xs focus:border-cyan-500 transition-colors"
        />

        {!editing && (
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar -mx-1 px-1 items-center">
          {days.map((d, i) => (
            <button
              key={i}
              onClick={() => setActiveDay(i)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${activeDay === i ? 'border-cyan-600 text-cyan-400 bg-cyan-950/20' : 'border-zinc-800 text-zinc-500'}`}
            >
              {d.name} <span className="text-zinc-600">({d.exercises.length})</span>
            </button>
          ))}
          {days.length < 7 && (
            <button
              onClick={() => { setDays(prev => [...prev, { name: DAY_NAMES[prev.length], exercises: [] }]); setActiveDay(days.length); }}
              className="shrink-0 px-2.5 py-1.5 rounded-lg border border-dashed border-zinc-700 text-zinc-500 active:text-cyan-400"
            >
              <Plus size={13} />
            </button>
          )}
        </div>
        )}

        {!editing && (
          <input
            type="text"
            value={day.name}
            onChange={(e) => updateDay({ name: e.target.value })}
            placeholder="Gün adı (örn. Push)"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-300 outline-none font-mono text-[11px] focus:border-cyan-500 transition-colors"
          />
        )}
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-3 pb-safe">

        {/* Gün özeti */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 text-center">
            <Clock size={13} className="text-emerald-400 mx-auto mb-1" />
            <span className="text-sm font-mono font-bold text-zinc-100 block">~{minutes} dk</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 text-center">
            <Layers size={13} className="text-cyan-400 mx-auto mb-1" />
            <span className="text-sm font-mono font-bold text-zinc-100 block">{totalSets} set</span>
          </div>
        </div>

        {/* Hareketler */}
        <div className="space-y-2">
          {day.exercises.length === 0 ? (
            <div className="text-center py-8 text-zinc-600 text-[11px] font-mono">
              Bu güne henüz hareket eklenmedi.
            </div>
          ) : day.exercises.map((ex, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
              <div className="flex justify-between items-center gap-2 mb-2">
                <span className="text-[11px] font-bold text-zinc-200 truncate min-w-0">{ex.name}</span>
                <div className="flex items-center shrink-0">
                  <button
                    onClick={() => updateDay({ exercises: day.exercises.filter((_, j) => j !== i) })}
                    className="text-zinc-600 active:text-red-500 p-1.5"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-500">Set sayısı</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setExerciseSets(i, ex.sets - 1)} className="w-7 h-7 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 flex items-center justify-center active:bg-zinc-800">
                    <ChevronDown size={13} />
                  </button>
                  <span className="w-6 text-center font-mono text-sm font-bold text-cyan-400">{ex.sets}</span>
                  <button onClick={() => setExerciseSets(i, ex.sets + 1)} className="w-7 h-7 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 flex items-center justify-center active:bg-zinc-800">
                    <ChevronUp size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setPickerOpen(true)}
          className="w-full bg-zinc-900 border border-dashed border-cyan-900/50 text-cyan-400 font-bold py-3 rounded-xl flex justify-center items-center uppercase tracking-wide text-[11px] active:bg-zinc-800 transition-colors"
        >
          <Plus size={15} className="mr-2" /> Kütüphaneden Hareket Ekle
        </button>

        {/* Kas dağılımı */}
        {ranked.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-2">
            <div className="flex justify-between items-baseline">
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Bu Gün Ne Çalışacak</h4>
              <span className="text-[9px] font-mono text-zinc-600">tüm setler etkili varsayımı</span>
            </div>
            {ranked.map(([muscle, vol]) => {
              const lm = getVolumeLandmarks(muscle, experienceLevel);
              const share = Math.round((vol / lm.mav) * 100);
              return (
                <div key={muscle} className="space-y-1">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[11px] font-bold text-zinc-200 truncate">{muscle}</span>
                    <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                      <strong className="text-cyan-400">{vol}</strong> set
                      <span className="text-zinc-600"> · haftalığın %{share}'i</span>
                    </span>
                  </div>
                  <div className="w-full bg-zinc-950 rounded-full h-1.5 border border-zinc-800">
                    <div className="h-1.5 rounded-full bg-cyan-500" style={{ width: `${Math.min(100, (vol / maxVol) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-zinc-800 bg-zinc-950 shrink-0 pb-safe">
        <button
          disabled={!canSave}
          onClick={() => {
            if (editing) onUpdate(editing.id, programName.trim(), days[0].exercises);
            else onSave(programName.trim(), days);
            onClose();
          }}
          className="w-full bg-cyan-600 active:bg-cyan-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-3.5 rounded-xl uppercase text-[11px] tracking-wider flex items-center justify-center gap-2 transition-colors"
        >
          <Save size={15} />
          {editing
            ? 'Şablonu Güncelle'
            : `${days.filter(d => d.exercises.length > 0).length} Günü Şablon Olarak Kaydet`}
        </button>
      </div>

      <ExerciseLibraryModal
        {...libraryProps}
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectMode
        onSelect={(name) => {
          setDays(prev => prev.map((d, i) => i === activeDay
            ? { ...d, exercises: [...d.exercises, { name, sets: 3 }] }
            : d));
          setPickerOpen(false);
        }}
      />
    </div>
  );
});

TemplateBuilderModal.displayName = 'TemplateBuilderModal';

export default TemplateBuilderModal;
