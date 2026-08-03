import React, { memo, useState } from 'react';
import { BookOpen, ChevronDown } from 'lucide-react';

const CONTENT = {
  template: {
    title: 'Şablon oluşturma rehberi',
    steps: [
      'Günün ana hedefini seç: örneğin göğüs + triseps veya quadriceps.',
      'Önce 1–2 bileşik hareket, sonra hedef kasa %100 etki eden izolasyonları ekle.',
      'Yeni başlayan için kas başına 2–4 etkili setle başla; ısı haritasını haftalık plan içinde değerlendir.',
      'Aynı hareketi gereksiz yere çoğaltma; eklem açısı veya ekipman gerçekten değişiyorsa varyasyon ekle.',
      'Tahmini süre ve kalori plan değeridir; gerçek kayıt RIR, dinlenme ve süreye göre değişir.',
    ],
  },
  week: {
    title: 'Haftalık plan rehberi',
    steps: [
      'Şablonları günlere ata; dinlenme günlerini bilinçli şekilde boş bırak.',
      'Aynı kası ağır çalıştıran günler arasında çoğunlukla 48 saat bırak.',
      'Bacak antrenmanı ile sert koşuyu aynı güne koyacaksan araya en az 6 saat koy; önceliğin olanı önce yap.',
      'Yürüyüş ve aktif toparlanma off day durumunu bozmaz; HIIT ve maç temposu bozar.',
      'Isı haritasında MEV altı eksik uyaran, MRV üstü toparlanma riski işaretidir; kişisel performans trendi son karardır.',
    ],
  },
};

const PlanningGuide = memo(({ mode = 'template' }) => {
  const [open, setOpen] = useState(false);
  const content = CONTENT[mode] || CONTENT.template;
  return (
    <section className="bg-cyan-950/15 border border-cyan-900/35 rounded-2xl overflow-hidden">
      <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open}
        className="w-full px-3.5 py-3 flex justify-between items-center text-left">
        <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
          <BookOpen size={13} /> {content.title}
        </span>
        <ChevronDown size={14} className={`text-cyan-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ol className="px-4 pb-3.5 space-y-2 list-decimal list-inside">
          {content.steps.map(step => <li key={step} className="text-[9px] font-mono text-zinc-400 leading-relaxed">{step}</li>)}
        </ol>
      )}
    </section>
  );
});

PlanningGuide.displayName = 'PlanningGuide';
export default PlanningGuide;
