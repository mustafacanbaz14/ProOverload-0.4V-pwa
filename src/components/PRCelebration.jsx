import React, { useEffect, useState, memo } from 'react';
import { Trophy } from 'lucide-react';

/**
 * Rekor kutlaması.
 *
 * Konfeti saf CSS/DOM ile üretiliyor — bu offline-first bir PWA, tek bir görsel
 * efekt için paket eklemek indirme boyutunu ve önbellek yükünü artırırdı.
 *
 * Titreşim iOS Safari'de desteklenmiyor (navigator.vibrate yok); çağrı yine de
 * korunuyor çünkü Android'de çalışıyor ve desteklenmediğinde sessizce geçiliyor.
 */
const RENKLER = ['#22d3ee', '#34d399', '#fbbf24', '#f97316', '#a78bfa'];

const PRCelebration = memo(({ record, onDone }) => {
  const [parcalar] = useState(() =>
    Array.from({ length: 28 }, (_, i) => ({
      id: i,
      sol: Math.random() * 100,
      gecikme: Math.random() * 0.25,
      sure: 1.1 + Math.random() * 0.7,
      renk: RENKLER[i % RENKLER.length],
      boyut: 5 + Math.random() * 5,
      donme: Math.random() * 360,
    })));

  useEffect(() => {
    // Kısa çift titreşim: rekor bildirimi olduğu belli olsun ama rahatsız etmesin.
    try { navigator.vibrate?.([28, 45, 28]); } catch { /* desteklenmiyor */ }
    const t = setTimeout(() => onDone?.(), 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  if (!record) return null;

  return (
    <div className="fixed inset-0 z-[130] pointer-events-none flex items-start justify-center max-w-[420px] mx-auto overflow-hidden">
      {parcalar.map(p => (
        <span
          key={p.id}
          className="absolute top-0 rounded-[2px]"
          style={{
            left: `${p.sol}%`,
            width: p.boyut,
            height: p.boyut * 1.6,
            backgroundColor: p.renk,
            transform: `rotate(${p.donme}deg)`,
            animation: `pr-fall ${p.sure}s cubic-bezier(.25,.6,.4,1) ${p.gecikme}s forwards`,
          }}
        />
      ))}

      <div
        className="mt-24 bg-zinc-900 border border-yellow-700/60 rounded-2xl px-5 py-3.5 shadow-2xl text-center"
        style={{ animation: 'pr-pop .35s cubic-bezier(.2,1.4,.5,1) forwards' }}
      >
        <Trophy size={22} className="text-yellow-400 mx-auto mb-1.5" />
        <span className="text-[12px] font-bold text-yellow-400 uppercase tracking-widest block">Yeni Rekor</span>
        <span className="text-[11px] font-mono text-zinc-300 block mt-1">{record.name}</span>
        <span className="text-[13px] font-mono font-bold text-zinc-100 block mt-0.5">
          {record.weight} kg × {record.reps}
        </span>
      </div>
    </div>
  );
});

PRCelebration.displayName = 'PRCelebration';

export default PRCelebration;
