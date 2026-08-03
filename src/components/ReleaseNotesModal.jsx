import React, { memo } from 'react';
import { Sparkles, X, CheckCircle2 } from 'lucide-react';
import { LATEST_RELEASE_NOTES } from '../utils/constants';

const ReleaseNotesModal = memo(({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
              <Sparkles size={18} />
            </div>
            <div>
              <span className="text-[9px] font-mono font-bold uppercase text-cyan-400 tracking-wider block">
                Sürüm Güncellemesi
              </span>
              <h3 className="text-base font-black text-zinc-100 mt-0.5">
                {LATEST_RELEASE_NOTES.title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 p-1 -mr-1 transition-colors"
            aria-label="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto hide-scrollbar pt-1">
          {LATEST_RELEASE_NOTES.items.map((item, index) => (
            <div
              key={index}
              className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-3 flex items-start gap-2.5"
            >
              <CheckCircle2 size={16} className="text-cyan-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <h4 className="text-[11px] font-bold text-zinc-200 leading-snug">
                  {item.title}
                </h4>
                <p className="text-[10px] font-mono text-zinc-500 leading-relaxed mt-0.5">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full bg-cyan-600 active:bg-cyan-700 text-white font-bold py-3 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-cyan-950/40 transition-colors"
        >
          Anladım, Harika!
        </button>
      </div>
    </div>
  );
});

ReleaseNotesModal.displayName = 'ReleaseNotesModal';
export default ReleaseNotesModal;
