import React, { memo, useState } from 'react';
import { ChevronDown } from 'lucide-react';

/** Ortak "özet önce, ayrıntı isteğe bağlı" kartı. */
const DisclosureCard = memo(({
  icon: Icon,
  title,
  summary,
  children,
  defaultOpen = false,
  accentClass = 'text-cyan-400',
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        className="w-full px-4 py-3.5 flex items-center gap-3 text-left active:bg-zinc-800/70 transition-colors"
      >
        {Icon && (
          <span className="w-8 h-8 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
            <Icon size={15} className={accentClass} />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="text-xs font-bold text-zinc-100 block">{title}</span>
          {summary && <span className="text-[10px] font-mono text-zinc-500 block mt-0.5 truncate">{summary}</span>}
        </span>
        <ChevronDown
          size={16}
          className={`text-zinc-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="border-t border-zinc-800 p-3.5">{children}</div>}
    </section>
  );
});

DisclosureCard.displayName = 'DisclosureCard';

export default DisclosureCard;
