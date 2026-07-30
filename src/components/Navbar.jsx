import React, { memo } from 'react';
import { Activity, Scale, Beef, LineChart, History } from 'lucide-react';

const Navbar = memo(({ view, setView }) => {
  const navItems = [
    { key: 'home', label: 'Antrenman', icon: Activity, activeColor: 'text-cyan-400', glowColor: 'bg-cyan-500' },
    { key: 'profile', label: 'Vücut', icon: Scale, activeColor: 'text-cyan-400', glowColor: 'bg-cyan-500' },
    { key: 'nutrition', label: 'Beslenme', icon: Beef, activeColor: 'text-orange-400', glowColor: 'bg-orange-500' },
    { key: 'analysis', label: 'Analiz', icon: LineChart, activeColor: 'text-emerald-400', glowColor: 'bg-emerald-500' },
    { key: 'history', label: 'Geçmiş', icon: History, activeColor: 'text-cyan-400', glowColor: 'bg-cyan-500' },
  ];

  return (
    // Güvenli alan dolgusu DIŞ katmanda, sabit yükseklik İÇ katmanda olmak
    // zorunda. İkisi aynı elemanda olduğunda (h-16 + pb-safe) ana ekrana
    // eklenmiş uygulamada iOS'un ~34px alt güvenli alanı 64px'in içinden
    // düşüyordu; içerik 30px'e sıkışıp ikonlar tarayıcıdakinden küçük
    // görünüyordu. Tarayıcıda güvenli alan 0 olduğu için sorun fark edilmiyordu.
    <div className="fixed bottom-0 left-0 right-0 max-w-[420px] mx-auto bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/80 z-30 pb-safe shadow-2xl">
      <div className="h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = view === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={`relative flex flex-col items-center justify-center w-1/5 h-full transition-all duration-200 ${
                isActive ? `${item.activeColor} scale-105 font-bold` : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {isActive && (
                <span className={`absolute top-0 w-8 h-0.5 rounded-full ${item.glowColor} shadow-lg animate-fade-in`} />
              )}
              <Icon size={19} className="transition-transform group-active:scale-90" />
              <span className="text-[10px] font-mono mt-1 uppercase tracking-wider">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

Navbar.displayName = 'Navbar';

export default Navbar;
