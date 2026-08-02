import React, { memo, useMemo } from 'react';
import { BrainCircuit, CheckCircle2, Plus, TriangleAlert } from 'lucide-react';
import { analyzeTemplate } from '../utils/templateAssistant';

const TemplateAssistantCard = memo(({ exercises = [], customExercises = [], onAddSuggested }) => {
  const analysis = useMemo(
    () => analyzeTemplate(exercises, customExercises),
    [exercises, customExercises],
  );
  return (
    <section className="bg-gradient-to-br from-purple-950/25 to-zinc-900 border border-purple-900/35 rounded-2xl p-3.5 space-y-3">
      <div className="flex justify-between items-start gap-3">
        <div>
          <span className="text-[9px] font-mono text-purple-400 uppercase tracking-widest">Şablon Asistanı</span>
          <h4 className="text-[11px] font-bold text-zinc-100 mt-0.5">{analysis.focusLabel}</h4>
        </div>
        <span className="text-right"><strong className="text-lg font-mono text-purple-300 block leading-none">{analysis.coverage}</strong><span className="text-[7px] font-mono text-zinc-600 uppercase">kapsama</span></span>
      </div>

      <div className="space-y-1.5">
        {analysis.tips.map((tip, index) => (
          <p key={`${tip.text}-${index}`} className={`text-[9px] font-mono leading-relaxed flex gap-1.5 ${tip.tone === 'warn' ? 'text-amber-300' : tip.tone === 'good' ? 'text-emerald-300' : 'text-zinc-400'}`}>
            {tip.tone === 'warn' ? <TriangleAlert size={11} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={11} className="shrink-0 mt-0.5" />}{tip.text}
          </p>
        ))}
      </div>

      {analysis.additions.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-zinc-800">
          <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-wider flex items-center gap-1"><BrainCircuit size={9} /> Bölgesel öneriler</span>
          {analysis.additions.map(item => (
            <div key={`${item.muscle}-${item.exercise}`} className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-2.5 flex justify-between items-start gap-2">
              <span className="min-w-0"><strong className="text-[10px] text-zinc-200 block">{item.muscle} · {item.exercise}</strong><span className="text-[8px] font-mono text-zinc-600 leading-relaxed block mt-0.5">{item.reason}</span></span>
              {onAddSuggested && <button onClick={() => onAddSuggested(item.exercise)} aria-label={`${item.exercise} ekle`} className="w-7 h-7 rounded-lg bg-purple-950/40 border border-purple-900/50 text-purple-300 flex items-center justify-center shrink-0"><Plus size={12} /></button>}
            </div>
          ))}
        </div>
      )}
      <p className="text-[8px] font-mono text-zinc-700">Kapsama skoru performans veya bilimsel kalite puanı değildir; şablondaki bölge ve set boşluklarını özetler.</p>
    </section>
  );
});

TemplateAssistantCard.displayName = 'TemplateAssistantCard';
export default TemplateAssistantCard;
