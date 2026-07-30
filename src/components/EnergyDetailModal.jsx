import React, { useState, useMemo, memo } from 'react';
import { X, Flame, CalendarDays, Table2, Sparkles, Scale, Moon, Dumbbell } from 'lucide-react';
import { buildEnergySeries, groupByWeek, dayEnergyBreakdown, theoreticalWeek } from '../utils/energyModel';
import { dailyTotals } from '../utils/nutritionStats';
import { parseNumber } from '../utils/helpers';

const TABS = [
  { key: 'today', label: 'Bugün', icon: Flame },
  { key: 'days', label: 'Gün Gün', icon: Table2 },
  { key: 'weeks', label: 'Hafta', icon: CalendarDays },
  { key: 'plan', label: 'Teorik', icon: Sparkles },
];

const kcal = (n) => `${n > 0 ? '+' : ''}${Math.round(n)}`;
const dateShort = (d) => new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

/**
 * Kalori giriş/çıkış detayı.
 *
 * Harcamayı tek sayı yerine kaynaklarına ayırır (bazal, günlük hareket,
 * sindirim, antrenman, kardiyo, toparlanma) ve gün/hafta ölçeğinde tablo verir.
 * Ayrıca haftalık programdan teorik harcama hesaplar — "bu programı uygularsam
 * ne yakarım" sorusu için.
 */
const EnergyDetailModal = memo(({
  isOpen,
  onClose,
  nutritionHistory = [],
  todayForm,
  maintenance = 0,
  computedComp,
  dayCalories,
  planDays = [],
  plannedCardioKcal = 0,
}) => {
  const [tab, setTab] = useState('today');
  const bmr = parseNumber(computedComp?.bmr);

  const series = useMemo(
    () => buildEnergySeries(nutritionHistory, { maintenance, bmr, dayCalories, days: 60 }),
    [nutritionHistory, maintenance, bmr, dayCalories]);

  const weeks = useMemo(() => groupByWeek(series), [series]);

  const today = useMemo(() => {
    if (!todayForm) return null;
    const w = dayCalories ? dayCalories(todayForm.date) : { lifting: 0, cardio: 0 };
    return dayEnergyBreakdown({
      maintenance, bmr,
      macros: dailyTotals(todayForm),
      lifting: w.lifting, cardio: w.cardio, manual: todayForm.activeCaloriesOut,
    });
  }, [todayForm, maintenance, bmr, dayCalories]);

  const plan = useMemo(
    () => theoreticalWeek(planDays, { maintenance, plannedCardioKcal }),
    [planDays, maintenance, plannedCardioKcal]);

  if (!isOpen) return null;

  const yetersiz = !(maintenance > 0);

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[96] flex flex-col h-[100dvh] max-w-[420px] mx-auto">
      <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 shrink-0 pt-safe">
        <h3 className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
          <Flame size={15} className="mr-2 text-red-400" /> Kalori Detayı
        </h3>
        <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1" aria-label="Kapat">
          <X size={20} />
        </button>
      </div>

      <div className="p-3 border-b border-zinc-800 bg-zinc-950 shrink-0">
        <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-colors ${tab === t.key ? 'bg-red-600 text-white' : 'text-zinc-500'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-3 pb-safe">
        {yetersiz && (
          <div className="bg-amber-950/20 border border-amber-900/40 rounded-2xl p-3.5">
            <p className="text-[11px] font-mono text-amber-200 leading-relaxed">
              Harcama dökümü için korunum kalorisi gerekiyor.
              <br />
              <span className="text-zinc-500">
                Vücut sekmesinden boy, kilo ve yağ oranı gir; birkaç gün beslenme
                kaydı biriktikten sonra gerçek TDEE hesaplanır.
              </span>
            </p>
          </div>
        )}

        {/* --- BUGÜN --- */}
        {tab === 'today' && today?.ready && (
          <>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-baseline justify-between mb-3">
                <div>
                  <span className="text-3xl font-mono font-bold text-red-400">{today.total}</span>
                  <span className="text-[11px] font-mono text-zinc-500 ml-1">kcal harcandı</span>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${
                  today.isRestDay
                    ? 'text-zinc-400 border-zinc-700 bg-zinc-950'
                    : 'text-emerald-400 border-emerald-900/50 bg-emerald-950/30'
                }`}>
                  {today.isRestDay ? 'Dinlenme günü' : 'Antrenman günü'}
                </span>
              </div>

              {/* Tek çubukta bileşenler — oranlar bir bakışta karşılaştırılabilir. */}
              <div className="flex w-full h-3 rounded-full overflow-hidden border border-zinc-800 bg-zinc-950 mb-3">
                {today.parts.map(p => (
                  <div key={p.key} className={p.color} style={{ width: `${(p.value / today.total) * 100}%` }} />
                ))}
              </div>

              <div className="space-y-2">
                {today.parts.map(p => (
                  <div key={p.key} className="flex justify-between items-start gap-2">
                    <span className="flex items-start gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${p.color}`} />
                      <span className="min-w-0">
                        <span className="text-[11px] font-bold text-zinc-200 block truncate">{p.label}</span>
                        <span className="text-[9px] font-mono text-zinc-600 block leading-snug">{p.hint}</span>
                      </span>
                    </span>
                    <span className="text-[11px] font-mono text-zinc-300 shrink-0">
                      {p.value}
                      <span className="text-zinc-600"> · %{Math.round((p.value / today.total) * 100)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vücut kompozisyonunun etkisi */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-2">
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center">
                <Scale size={11} className="mr-1.5 text-cyan-400" /> Vücudunun Etkisi
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { l: 'Yağsız Kütle', v: `${computedComp?.ffm || '—'} kg` },
                  { l: 'Yağ Oranı', v: `%${computedComp?.activeBF || '—'}` },
                  { l: 'FFMI', v: computedComp?.ffmi || '—' },
                ].map(x => (
                  <div key={x.l} className="bg-zinc-950 border border-zinc-800 rounded-xl py-2">
                    <span className="text-[9px] font-mono text-zinc-500 block">{x.l}</span>
                    <span className="text-[11px] font-mono font-bold text-zinc-200">{x.v}</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
                Bazal metabolizma yağsız kütleden hesaplanır (Katch-McArdle):
                <strong className="text-zinc-400"> 370 + 21.6 × {computedComp?.ffm || '—'} = {bmr} kcal</strong>.
                Kas kazanmak bazal harcamanı kalıcı olarak yükseltir; yağ kaybı
                doğrudan yükseltmez ama aynı kiloda yağsız oranını artırır.
              </p>
            </div>

            <p className="text-[9px] font-mono text-zinc-600 leading-relaxed px-1">
              Günlük hareket, korunum kalorisinden bazal ve sindirim payı düşülerek
              bulunur. Korunum gerçek kilo trendinden ölçüldüğü için belirsizlik
              uydurma bir katsayıya değil bu artığa yüklenir.
            </p>
          </>
        )}

        {/* --- GÜN GÜN --- */}
        {tab === 'days' && (
          series.length === 0 ? (
            <p className="text-center py-10 text-[11px] font-mono text-zinc-600">Kayıt yok.</p>
          ) : (
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
              <div className="overflow-x-auto hide-scrollbar">
                <table className="w-full text-[10px] font-mono">
                  <thead>
                    <tr className="text-zinc-500 uppercase border-b border-zinc-800 bg-zinc-950/60">
                      <th className="text-left font-bold px-3 py-2">Tarih</th>
                      <th className="text-right font-bold px-2 py-2">Alınan</th>
                      <th className="text-right font-bold px-2 py-2">Yakılan</th>
                      <th className="text-right font-bold px-3 py-2">Denge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {series.map(d => (
                      <tr key={d.date} className="border-b border-zinc-800/60">
                        <td className="text-left px-3 py-2 whitespace-nowrap">
                          <span className="text-zinc-300">{dateShort(d.date)}</span>
                          {d.isRestDay
                            ? <Moon size={9} className="inline ml-1 text-zinc-600" />
                            : <Dumbbell size={9} className="inline ml-1 text-emerald-500" />}
                        </td>
                        <td className="text-right px-2 py-2 text-cyan-400">{d.intake}</td>
                        <td className="text-right px-2 py-2 text-red-400">{d.out}</td>
                        <td className={`text-right px-3 py-2 font-bold ${d.balance < 0 ? 'text-cyan-400' : d.balance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {kcal(d.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[9px] font-mono text-zinc-600 px-3 py-2 border-t border-zinc-800 leading-relaxed">
                Ay ikonu dinlenme, halter antrenman günü. Yakılan sütunu bazal +
                günlük hareket + sindirim + egzersiz toplamıdır.
              </p>
            </div>
          )
        )}

        {/* --- HAFTA --- */}
        {tab === 'weeks' && (
          weeks.length === 0 ? (
            <p className="text-center py-10 text-[11px] font-mono text-zinc-600">Kayıt yok.</p>
          ) : (
            <div className="space-y-2.5">
              {weeks.map(w => (
                <div key={w.weekStart} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] font-bold text-zinc-200">{dateShort(w.weekStart)} haftası</span>
                    <span className="text-[9px] font-mono text-zinc-600">
                      {w.days} gün · {w.restDays} dinlenme
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className={`text-xl font-mono font-bold ${w.balance < 0 ? 'text-cyan-400' : w.balance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {kcal(w.balance)}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      kcal ≈ {w.kg > 0 ? '+' : ''}{w.kg} kg
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    {[
                      { l: 'Alınan', v: w.intake, c: 'text-cyan-400' },
                      { l: 'Yakılan', v: w.out, c: 'text-red-400' },
                      { l: 'Antrenman', v: w.lifting + w.cardio, c: 'text-emerald-400' },
                      { l: 'Sindirim', v: w.tef, c: 'text-amber-400' },
                    ].map(x => (
                      <div key={x.l} className="bg-zinc-950 border border-zinc-800 rounded-lg py-1.5">
                        <span className="text-[8px] font-mono text-zinc-500 block uppercase">{x.l}</span>
                        <span className={`text-[10px] font-mono font-bold ${x.c}`}>{x.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* --- TEORİK --- */}
        {tab === 'plan' && (
          !plan ? (
            <p className="text-center py-10 text-[11px] font-mono text-zinc-600 px-6 leading-relaxed">
              Teorik hesap için korunum kalorisi gerekiyor.
            </p>
          ) : plan.trainingDays === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center space-y-2">
              <Sparkles size={18} className="text-zinc-600 mx-auto" />
              <p className="text-[11px] font-bold text-zinc-300">Haftalık program kurulmamış</p>
              <p className="text-[10px] font-mono text-zinc-600 leading-relaxed">
                Ana sayfadan Haftalık Program ile şablonlarını günlere dağıtırsan,
                o programı uyguladığında ne kadar yakacağını buradan görürsün.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">
                  Programı uygularsan haftalık
                </span>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-3xl font-mono font-bold text-emerald-400">{plan.total}</span>
                  <span className="text-[11px] font-mono text-zinc-500">kcal</span>
                </div>

                <div className="space-y-1.5 text-[10px] font-mono">
                  {[
                    { l: `Bazal + günlük hareket (7 gün)`, v: plan.baseKcal, c: 'text-zinc-300' },
                    { l: `Ağırlık antrenmanı (${plan.trainingDays} gün)`, v: plan.liftingKcal, c: 'text-emerald-400' },
                    { l: 'Kardiyo (bu haftaki gerçekleşen)', v: plan.cardioKcal, c: 'text-red-400' },
                    { l: 'Toparlanma (EPOC)', v: plan.epoc, c: 'text-orange-400' },
                  ].filter(x => x.v > 0).map(x => (
                    <div key={x.l} className="flex justify-between text-zinc-500">
                      <span>{x.l}</span>
                      <span className={x.c}>{x.v} kcal</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
                  <Dumbbell size={13} className="text-emerald-400 mx-auto mb-1" />
                  <span className="text-sm font-mono font-bold text-zinc-100 block">{plan.trainingDayKcal}</span>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">Antrenman günü</span>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
                  <Moon size={13} className="text-zinc-500 mx-auto mb-1" />
                  <span className="text-sm font-mono font-bold text-zinc-100 block">{plan.restDayKcal}</span>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">Dinlenme günü</span>
                </div>
              </div>

              <p className="text-[9px] font-mono text-zinc-600 leading-relaxed px-1">
                Aradaki fark <strong className="text-zinc-400">{plan.trainingDayKcal - plan.restDayKcal} kcal</strong>.
                Dinlenme günlerinde alımı bu kadar düşürmek, haftalık dengeyi
                bozmadan antrenman günü daha rahat beslenmeni sağlar.
                Bu sayılar plana göre teoriktir; gerçekleşen Gün Gün sekmesinde.
              </p>
            </>
          )
        )}
      </div>
    </div>
  );
});

EnergyDetailModal.displayName = 'EnergyDetailModal';

export default EnergyDetailModal;
