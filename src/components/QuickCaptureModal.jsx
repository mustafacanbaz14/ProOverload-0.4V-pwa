import React, { memo } from 'react';
import {
  BarChart3, Beef, Brain, CalendarRange, CheckCircle2, Dumbbell,
  HeartPulse, Moon, Scale, X,
} from 'lucide-react';

const CAPTURE_ITEMS = [
  { key: 'workout', label: 'Antrenman', hint: 'Serbest veya şablondan başlat', icon: Dumbbell, color: 'text-cyan-400', bg: 'bg-cyan-950/30 border-cyan-900/50' },
  { key: 'nutrition', label: 'Besin Ekle', hint: 'Öğün, barkod veya toplam gir', icon: Beef, color: 'text-orange-400', bg: 'bg-orange-950/25 border-orange-900/50' },
  { key: 'cardio', label: 'Kardiyo / Aktivite', hint: 'Koşu, yürüyüş, spor ve diğerleri', icon: HeartPulse, color: 'text-rose-400', bg: 'bg-rose-950/25 border-rose-900/50' },
  { key: 'metrics', label: 'Vücut Ölçümü', hint: 'Kilo, mezura veya kaliper', icon: Scale, color: 'text-emerald-400', bg: 'bg-emerald-950/25 border-emerald-900/50' },
  { key: 'sleep', label: 'Uyku', hint: 'Hızlı puan veya ayrıntılı kayıt', icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-950/25 border-indigo-900/50' },
  { key: 'mind', label: 'Zihin & Esneme', hint: 'Meditasyon ve esneme süresi', icon: Brain, color: 'text-purple-400', bg: 'bg-purple-950/25 border-purple-900/50' },
];

const TOOL_ITEMS = [
  { key: 'energy', label: 'Kalori Detayı', icon: BarChart3 },
  { key: 'plan', label: 'Haftalık Plan', icon: CalendarRange },
];

const QuickCaptureModal = memo(({ isOpen, onClose, onSelect, status = {} }) => {
  if (!isOpen) return null;

  const choose = (key) => {
    onClose?.();
    onSelect?.(key);
  };

  return (
    <div className="fixed inset-0 z-[118] bg-black/80 backdrop-blur-sm flex items-end justify-center" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-capture-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-[420px] max-h-[88dvh] overflow-y-auto hide-scrollbar rounded-t-[28px] border border-zinc-800 border-b-0 bg-zinc-950 shadow-2xl pb-safe"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3.5 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-xl">
          <div>
            <span className="text-[9px] font-mono text-cyan-500 uppercase tracking-[0.18em]">3.0 Hızlı Kayıt</span>
            <h2 id="quick-capture-title" className="text-sm font-black text-zinc-100 mt-0.5">Ne eklemek istiyorsun?</h2>
          </div>
          <button onClick={onClose} aria-label="Hızlı kaydı kapat" className="p-2 rounded-xl text-zinc-500 active:bg-zinc-800 active:text-zinc-200">
            <X size={19} />
          </button>
        </div>

        <div className="p-4">
          <p className="text-[10px] font-mono text-zinc-500 leading-relaxed mb-3">
            Bulunduğun sekmeden ayrılmadan doğru giriş ekranına tek dokunuşla git.
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {CAPTURE_ITEMS.map((item) => {
              const Icon = item.icon;
              const complete = Boolean(status[item.key]);
              return (
                <button
                  key={item.key}
                  onClick={() => choose(item.key)}
                  className={`relative min-h-[104px] rounded-2xl border p-3 text-left active:scale-[0.98] transition-transform ${item.bg}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className={`w-9 h-9 rounded-xl bg-black/25 flex items-center justify-center ${item.color}`}><Icon size={17} /></span>
                    {complete && <CheckCircle2 size={15} className="text-emerald-400" aria-label="Bugün kaydedildi" />}
                  </div>
                  <strong className="text-[11px] text-zinc-100 block mt-2">{item.label}</strong>
                  <span className="text-[9px] font-mono text-zinc-500 leading-snug block mt-0.5">{complete ? 'Bugün kayıt var · yeniden aç' : item.hint}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-zinc-800">
            {TOOL_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.key} onClick={() => choose(item.key)} className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 py-3 text-[10px] font-bold text-zinc-300 active:bg-zinc-800">
                  <Icon size={14} className="text-cyan-400" /> {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
});

QuickCaptureModal.displayName = 'QuickCaptureModal';
export default QuickCaptureModal;
