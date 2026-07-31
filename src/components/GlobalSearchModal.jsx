import React, { memo, useMemo, useState } from 'react';
import { X, Search, Dumbbell, LayoutGrid, Wrench, Clock } from 'lucide-react';
import { foldForSearch } from '../utils/helpers';
import { formatDay } from '../utils/dates';

const GlobalSearchModal = memo(({
  isOpen,
  onClose,
  exercises = [],
  templates = [],
  workouts = [],
  onNavigate,
  onExercise,
  onTemplate,
  onTool,
}) => {
  const [query, setQuery] = useState('');
  const q = foldForSearch(query).trim();
  const commands = useMemo(() => [
    { label: 'Bugün', hint: 'Günlük pano', action: () => onNavigate('home'), icon: LayoutGrid },
    { label: 'Antrenman Merkezi', hint: 'Başlat, şablonlar, programlar', action: () => onNavigate('training'), icon: Dumbbell },
    { label: 'Beslenme', hint: 'Günlük giriş ve enerji', action: () => onNavigate('nutrition'), icon: LayoutGrid },
    { label: 'Vücut Ölçümü', hint: 'Gelişim › Vücut', action: () => onNavigate('progress', 'body'), icon: LayoutGrid },
    { label: 'Gelişim Analizleri', hint: 'Grafikler ve kişisel koç', action: () => onNavigate('progress', 'analysis'), icon: LayoutGrid },
    { label: 'Geçmiş', hint: 'Tüm kayıtlar', action: () => onNavigate('history'), icon: Clock },
    { label: 'Hareket Kütüphanesi', hint: 'Hareketleri düzenle', action: () => onTool('library'), icon: Wrench },
    { label: 'Haftalık Program', hint: 'Aktif şablon ve plan', action: () => onTool('weekPlan'), icon: Wrench },
    { label: 'Kalori Detayı', hint: 'Enerji girdisi ve çıktısı', action: () => onTool('energy'), icon: Wrench },
    { label: 'Uyku ve Toparlanma', hint: 'Uyku, meditasyon, esneme', action: () => onTool('sleep'), icon: Wrench },
  ], [onNavigate, onTool]);

  const results = useMemo(() => {
    const commandMatches = commands.filter(item => !q || foldForSearch(`${item.label} ${item.hint}`).includes(q)).slice(0, q ? 6 : 5);
    const exerciseMatches = q ? exercises.filter(name => foldForSearch(name).includes(q)).slice(0, 6) : [];
    const templateMatches = q ? templates.filter(item => foldForSearch(item.name).includes(q)).slice(0, 4) : [];
    const workoutMatches = q ? workouts.filter(item => foldForSearch(`${item.name || ''} ${(item.exercises || []).map(e => e.name).join(' ')} ${item.date}`).includes(q)).slice(0, 4) : [];
    return { commandMatches, exerciseMatches, templateMatches, workoutMatches };
  }, [commands, exercises, templates, workouts, q]);

  if (!isOpen) return null;
  const run = (action) => { action?.(); setQuery(''); onClose(); };
  const hasAny = Object.values(results).some(list => list.length);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[120] flex flex-col">
      <header className="pt-safe px-4 py-3 border-b border-zinc-800 bg-zinc-950 flex items-center gap-2">
        <Search size={17} className="text-cyan-400 shrink-0" />
        <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Sayfa, araç, hareket veya kayıt ara…" className="flex-1 min-w-0 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600" />
        <button onClick={onClose} aria-label="Aramayı kapat" className="p-2 text-zinc-500"><X size={18} /></button>
      </header>
      <div className="flex-1 overflow-y-auto p-4 pb-safe space-y-4">
        {results.commandMatches.length > 0 && <ResultGroup title="Sayfalar & Araçlar" items={results.commandMatches.map(item => ({ ...item, onClick: () => run(item.action) }))} />}
        {results.exerciseMatches.length > 0 && <ResultGroup title="Hareketler" items={results.exerciseMatches.map(name => ({ label: name, hint: 'Kas katkılarını görüntüle ve düzenle', icon: Dumbbell, onClick: () => run(() => onExercise(name)) }))} />}
        {results.templateMatches.length > 0 && <ResultGroup title="Şablonlar" items={results.templateMatches.map(item => ({ label: item.name, hint: `${(item.exercises || []).length} hareket`, icon: LayoutGrid, onClick: () => run(() => onTemplate(item)) }))} />}
        {results.workoutMatches.length > 0 && <ResultGroup title="Geçmiş Antrenmanlar" items={results.workoutMatches.map(item => ({ label: item.name || 'Serbest Antrenman', hint: formatDay(item.date, 'medium', { year: true }), icon: Clock, onClick: () => run(() => onNavigate('history', 'workouts')) }))} />}
        {!hasAny && <p className="text-center py-16 text-xs font-mono text-zinc-600">Eşleşen sonuç yok.</p>}
      </div>
    </div>
  );
});

const ResultGroup = ({ title, items }) => (
  <section>
    <h3 className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-2 px-1">{title}</h3>
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
      {items.map((item, index) => {
        const Icon = item.icon || LayoutGrid;
        return <button key={`${item.label}-${index}`} onClick={item.onClick} className="w-full p-3 flex gap-3 items-center text-left active:bg-zinc-800"><Icon size={15} className="text-cyan-400 shrink-0" /><span className="min-w-0"><strong className="text-[11px] text-zinc-200 block truncate">{item.label}</strong><span className="text-[9px] font-mono text-zinc-600 block truncate">{item.hint}</span></span></button>;
      })}
    </div>
  </section>
);

GlobalSearchModal.displayName = 'GlobalSearchModal';
export default GlobalSearchModal;
