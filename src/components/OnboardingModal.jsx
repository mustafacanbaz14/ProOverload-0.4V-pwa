import React, { memo, useState } from 'react';
import { Activity, ChevronRight, Dumbbell, Beef, LineChart } from 'lucide-react';
import { EXPERIENCE_LEVELS } from '../utils/constants';

const OnboardingModal = memo(({ isOpen, settings, onFinish }) => {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState({
    nutritionGoal: settings.nutritionGoal || 'maintain',
    experienceLevel: settings.experienceLevel || 'intermediate',
    interfaceMode: settings.interfaceMode || 'simple',
  });
  if (!isOpen) return null;

  const finish = () => onFinish({ ...draft, onboardingComplete: true });
  return (
    <div className="fixed inset-0 bg-black z-[140] flex flex-col">
      <div className="pt-safe px-5 py-4 flex items-center justify-between">
        <span className="text-[10px] font-mono text-zinc-600">{step + 1} / 3</span>
        <button onClick={finish} className="text-[10px] font-mono text-zinc-500">Geç</button>
      </div>
      <div className="flex-1 px-5 flex flex-col justify-center max-w-sm w-full mx-auto">
        {step === 0 && <>
          <div className="w-14 h-14 rounded-2xl bg-cyan-950 border border-cyan-800 flex items-center justify-center mb-5"><Activity size={26} className="text-cyan-400" /></div>
          <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest">HypertrophyLAB</span>
          <h2 className="text-2xl font-black text-zinc-100 mt-2">Her şey tek akışta.</h2>
          <p className="text-sm text-zinc-400 leading-relaxed mt-3">Bugün kararını gör, Antrenman’dan uygula, Beslenme’den kaydet ve Gelişim’de sonucu izle.</p>
          <div className="grid grid-cols-3 gap-2 mt-6">
            {[
              { label: 'Antrenman', icon: <Dumbbell size={17} className="text-cyan-400 mx-auto mb-1.5" /> },
              { label: 'Beslenme', icon: <Beef size={17} className="text-cyan-400 mx-auto mb-1.5" /> },
              { label: 'Gelişim', icon: <LineChart size={17} className="text-cyan-400 mx-auto mb-1.5" /> },
            ].map(item => <div key={item.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">{item.icon}<span className="text-[9px] font-bold text-zinc-400">{item.label}</span></div>)}
          </div>
        </>}
        {step === 1 && <>
          <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest">Hedefin</span>
          <h2 className="text-2xl font-black text-zinc-100 mt-2 mb-5">Şu an neye odaklanıyorsun?</h2>
          <div className="space-y-2">
            {[{ key: 'cut', label: 'Yağ Kaybı', hint: 'Kontrollü kalori açığı' }, { key: 'maintain', label: 'Koruma', hint: 'Kilo ve performansı koru' }, { key: 'bulk', label: 'Kas Kazanımı', hint: 'Ölçülü kalori fazlası' }].map(item => <button key={item.key} onClick={() => setDraft(d => ({ ...d, nutritionGoal: item.key }))} className={`w-full p-3.5 rounded-2xl border text-left ${draft.nutritionGoal === item.key ? 'bg-cyan-950/30 border-cyan-600' : 'bg-zinc-900 border-zinc-800'}`}><strong className="text-sm text-zinc-200 block">{item.label}</strong><span className="text-[10px] font-mono text-zinc-500">{item.hint}</span></button>)}
          </div>
        </>}
        {step === 2 && <>
          <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest">Kişiselleştir</span>
          <h2 className="text-2xl font-black text-zinc-100 mt-2 mb-5">Deneyim ve görünüm</h2>
          <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-2">Antrenman seviyesi</label>
          <div className="space-y-2 mb-5">{EXPERIENCE_LEVELS.map(level => <button key={level.key} onClick={() => setDraft(d => ({ ...d, experienceLevel: level.key }))} className={`w-full p-3 rounded-xl border text-left ${draft.experienceLevel === level.key ? 'border-cyan-600 bg-cyan-950/30' : 'border-zinc-800 bg-zinc-900'}`}><strong className="text-[11px] text-zinc-200">{level.label}</strong><span className="text-[9px] font-mono text-zinc-500 block mt-0.5">{level.hint}</span></button>)}</div>
          <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-2">Arayüz</label>
          <div className="grid grid-cols-2 gap-2">{[['simple', 'Basit'], ['detailed', 'Detaylı']].map(([key, label]) => <button key={key} onClick={() => setDraft(d => ({ ...d, interfaceMode: key }))} className={`py-3 rounded-xl border text-[11px] font-bold ${draft.interfaceMode === key ? 'border-cyan-600 bg-cyan-950/30 text-cyan-400' : 'border-zinc-800 bg-zinc-900 text-zinc-500'}`}>{label}</button>)}</div>
        </>}
      </div>
      <div className="p-5 pb-safe max-w-sm w-full mx-auto">
        <button onClick={() => step < 2 ? setStep(s => s + 1) : finish()} className="w-full bg-cyan-600 text-white rounded-2xl py-4 font-bold text-sm flex items-center justify-center gap-2">{step < 2 ? 'Devam' : 'Başla'} <ChevronRight size={17}/></button>
      </div>
    </div>
  );
});

OnboardingModal.displayName = 'OnboardingModal';
export default OnboardingModal;
