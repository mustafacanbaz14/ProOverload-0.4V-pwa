import React, { memo } from 'react';
import {
  X, Wrench, Brain, Dumbbell, CalendarPlus, CalendarRange, HeartPulse,
  Trophy, Flame, Calculator, ArrowRightLeft, Ruler, Moon, BatteryLow, CalendarDays,
} from 'lucide-react';

/**
 * Araçlar merkezi.
 *
 * Ana sayfa zamanla yan yana yığılmış yedi düğmeyle ikinci bir gezinme çubuğuna
 * dönüşmüştü. Araçlar burada gruplanıyor; ana sayfada tek giriş kalıyor.
 *
 * Not: buradaki girişler diğer sekmelerdeki kısayolları KALDIRMAZ. Kalori
 * detayına Beslenme'den, ölçüm kıyaslamasına Vücut'tan ulaşmak hâlâ mümkün —
 * bir aracın birden fazla yerden açılması kullanıcıyı yormuyor, aksine
 * bulunduğu bağlamda erişim sağlıyor.
 */
const GROUPS = [
  {
    title: 'Antrenman',
    items: [
      { key: 'library', label: 'Hareket Kütüphanesi', hint: '250+ hareket, kas eşlemesi düzenleme', icon: Dumbbell, color: 'text-cyan-400' },
      { key: 'builder', label: 'Program Oluştur', hint: 'Gün gün şablon yaz', icon: CalendarPlus, color: 'text-emerald-400' },
      { key: 'weekPlan', label: 'Haftalık Programlar', hint: 'Çoklu program, saatli kardiyo, çakışma asistanı', icon: CalendarRange, color: 'text-cyan-400' },
      { key: 'plates', label: 'Plaka Hesaplayıcı', hint: 'Bar yüklemesi ve ısınma setleri', icon: Calculator, color: 'text-amber-400' },
      { key: 'deload', label: 'Deload', hint: 'Boşaltma haftası kur; hedefler otomatik ölçeklenir', icon: BatteryLow, color: 'text-amber-400' },
    ],
  },
  {
    title: 'Enerji & Beslenme',
    items: [
      { key: 'cardio', label: 'Kardiyo / Aktivite Ekle', hint: 'Kondisyon, spor ve günlük aktiviteler', icon: HeartPulse, color: 'text-red-400' },
      { key: 'energy', label: 'Kalori Detayı', hint: 'Gün gün, hafta hafta harcama dökümü', icon: Flame, color: 'text-red-400' },
    ],
  },
  {
    title: 'Toparlanma',
    items: [
      { key: 'sleep', label: 'Uyku Takibi', hint: 'Yatış/uyanış saati, 100 üzerinden puan', icon: Moon, color: 'text-purple-400' },
      { key: 'mind', label: 'Meditasyon & Esneme', hint: 'Günlük, haftalık, aylık log', icon: Brain, color: 'text-cyan-400' },
    ],
  },
  {
    title: 'Ölçüm & Rapor',
    items: [
      { key: 'compare', label: 'Dönemsel Kıyaslama', hint: 'İki ölçümü yan yana karşılaştır', icon: ArrowRightLeft, color: 'text-cyan-400' },
      { key: 'guide', label: 'Ölçüm Rehberi', hint: 'Çevre ve kaliper ölçüm teknikleri', icon: Ruler, color: 'text-zinc-400' },
      { key: 'report', label: 'Gelişim Raporu', hint: 'Rekorlar ve dönem özeti', icon: Trophy, color: 'text-yellow-400' },
    ],
  },
];

const ToolsModal = memo(({ isOpen, onClose, onSelect, showCycle = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[94] flex flex-col h-[100dvh] max-w-[420px] mx-auto">
      <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 shrink-0 pt-safe">
        <h3 className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
          <Wrench size={15} className="mr-2 text-cyan-400" /> Araçlar
        </h3>
        <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1" aria-label="Kapat">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-4 pb-safe">
        {GROUPS.map(group => (
          <div key={group.title} className="space-y-1.5">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">{group.title}</h4>
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800">
              {(showCycle && group.title === 'Toparlanma'
                ? [...group.items, { key: 'cycle', label: 'Döngü & Performans', hint: 'Belirti odaklı antrenman, kardiyo ve beslenme desteği', icon: CalendarDays, color: 'text-rose-400' }]
                : group.items).map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => { onSelect(item.key); onClose(); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-zinc-800 transition-colors text-left"
                  >
                    <Icon size={17} className={`${item.color} shrink-0`} />
                    <span className="min-w-0">
                      <span className="text-[12px] font-bold text-zinc-100 block truncate">{item.label}</span>
                      <span className="text-[10px] font-mono text-zinc-500 block truncate">{item.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <p className="text-[9px] font-mono text-zinc-600 leading-relaxed px-1">
          Bu araçların çoğuna ilgili sekmeden de ulaşabilirsin — kalori detayı
          Beslenme&apos;de, kıyaslama ve rehber Vücut&apos;ta duruyor.
        </p>
      </div>
    </div>
  );
});

ToolsModal.displayName = 'ToolsModal';

export default ToolsModal;
