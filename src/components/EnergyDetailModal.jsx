import React, { useState, useMemo, memo } from 'react';
import { X, Flame, CalendarDays, Table2, Sparkles, Scale, Moon, Dumbbell, ChevronDown, Footprints } from 'lucide-react';
import { buildEnergySeries, groupByWeek, dayEnergyBreakdown, theoreticalWeek, planVsActual, neatMethodComparison, neatOptsForDay } from '../utils/energyModel';
import { dailyTotals } from '../utils/nutritionStats';
import { parseNumber } from '../utils/helpers';
import { formatDay } from '../utils/dates';

const TABS = [
  { key: 'today', label: 'Bugün', icon: Flame },
  { key: 'days', label: 'Gün Gün', icon: Table2 },
  { key: 'weeks', label: 'Hafta', icon: CalendarDays },
  { key: 'plan', label: 'Teorik', icon: Sparkles },
];

const kcal = (n) => `${n > 0 ? '+' : ''}${Math.round(n)}`;

/**
 * Güne özel günlük hareket çarpanı seçenekleri.
 *
 * Serbest sayı girmek yerine hazır kademeler var: kullanıcı bir günü "daha
 * hareketliydi" diye işaretlerken 1.13 gibi bir sayı üretmiyor, "hareketli"
 * diyor. "Varsayılan" seçeneği güne özel değeri kaldırıp ayarlardakine döner.
 */
const NEAT_PRESETS = [
  { label: 'Varsayılan', value: null },
  { label: 'Çok durgun ×0.75', value: 0.75 },
  { label: 'Durgun ×0.9', value: 0.9 },
  { label: 'Normal ×1', value: 1 },
  { label: 'Hareketli ×1.15', value: 1.15 },
  { label: 'Çok hareketli ×1.25', value: 1.25 },
  { label: 'Ayakta iş ×1.4', value: 1.4 },
];
const dateShort = (d) => formatDay(d);

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
  neatOpts = {},
  planDays = [],
  plannedCardioKcal = 0,
  // Kardiyo kalorisi plandan mı geldi yoksa gerçekleşenden mi — etiket buna göre.
  cardioIsPlanned = false,
  avgDailyExercise = 0,
  estimatedMacros = {},
  maintenanceEstimated = false,
  // Güne özel NEAT çarpanını yazan geri çağrı; verilmezse kontrol gizlenir.
  onSetDayNeat,
  defaultNeatMultiplier = 1,
}) => {
  const [tab, setTab] = useState('today');
  // Tabloda açılan gün — geçmiş günün dökümünü satır altında gösterir.
  const [openDay, setOpenDay] = useState(null);
  const bmr = parseNumber(computedComp?.bmr);

  const series = useMemo(
    () => buildEnergySeries(nutritionHistory, { maintenance, bmr, dayCalories, days: 60, neatOpts, estimatedMacros }),
    [nutritionHistory, maintenance, bmr, dayCalories, neatOpts, estimatedMacros]);

  const weeks = useMemo(() => groupByWeek(series), [series]);

  const today = useMemo(() => {
    if (!todayForm) return null;
    const w = dayCalories ? dayCalories(todayForm.date) : { lifting: 0, cardio: 0 };
    return dayEnergyBreakdown({
      maintenance, bmr,
      macros: dailyTotals(todayForm),
      estimatedMacros,
      lifting: w.lifting, cardio: w.cardio, recovery: w.mind, manual: todayForm.activeCaloriesOut,
      activeRecovery: w.activeRecovery,
      steps: todayForm.steps,
      ...neatOptsForDay(neatOpts, todayForm),
    });
  }, [todayForm, maintenance, bmr, dayCalories, neatOpts, estimatedMacros]);

  const plan = useMemo(
    () => theoreticalWeek(planDays, { maintenance, plannedCardioKcal, avgDailyExercise }),
    [planDays, maintenance, plannedCardioKcal, avgDailyExercise]);

  // Teorik hesap tek başına "programı uyguladım mı" sorusunu cevaplamıyor;
  // son haftanın gerçekleşeni plandaki karşılığıyla yan yana konuyor.
  const karsilastirma = useMemo(
    () => planVsActual(planDays, series, { maintenance, days: 7, avgDailyExercise }),
    [planDays, series, maintenance, avgDailyExercise]);

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
            {maintenanceEstimated && (
              <div className="bg-cyan-950/20 border border-cyan-900/40 rounded-2xl p-3 text-[10px] font-mono text-cyan-200 leading-relaxed">
                Adaptif TDEE için yeterli kilo/beslenme geçmişi yok. Günlük harcama şimdilik seçtiğin hareket seviyesi ve mevcut ölçümlerinden <strong>tahmini</strong> hesaplanıyor.
              </div>
            )}
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
                  {today.isActiveRest ? 'Aktif off day' : today.isRestDay ? 'Dinlenme günü' : 'Antrenman günü'}
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

            {today.tefEstimated && (
              <p className="text-[9px] font-mono text-amber-500/90 leading-relaxed px-1">
                Termik harcama henüz bugünün besinlerinden gelmiyor; son 14 günlük makro ortalaman kullanıldı. Geçmiş yoksa dengeli geçici makro dağılımı kullanılır. Besin girince otomatik olarak gerçek makrolara döner.
              </p>
            )}

            {/* NEAT detayı: hangi yöntem, hangi formül, alternatifler ne verirdi */}
            {today.neat !== null && (() => {
              const yontemler = neatMethodComparison({
                maintenance, bmr, tefTotal: today.tef.total,
                avgDailyExercise: neatOpts.avgDailyExercise,
                activityLevel: neatOpts.activityLevel,
                steps: todayForm?.steps,
                neatManual: neatOpts.neatManual,
                cardioKcal: today.cardio,
                weightKg: neatOpts.weightKg,
                multiplier: neatOpts.neatMultiplier,
              });
              const aktif = today.neatSource || 'auto';
              const carpan = Number(neatOpts.neatMultiplier) || 1;
              return (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center">
                      <Footprints size={11} className="mr-1.5 text-cyan-400" /> Günlük Hareket Detayı
                    </h4>
                    <span className="text-[9px] font-mono text-zinc-600">
                      {carpan !== 1 ? `çarpan ${carpan}×` : 'çarpan yok'}
                    </span>
                  </div>

                  {yontemler.map(y => {
                    const secili = y.key === aktif;
                    return (
                      <div
                        key={y.key}
                        className={`rounded-xl border p-2.5 ${secili ? 'border-cyan-700 bg-cyan-950/20' : 'border-zinc-800 bg-zinc-950'}`}
                      >
                        <div className="flex justify-between items-center gap-2">
                          <span className={`text-[11px] font-bold ${secili ? 'text-cyan-300' : 'text-zinc-300'}`}>
                            {y.label}{maintenanceEstimated && y.key === 'auto' ? ' · tahmini' : ''}{secili && ' · kullanılan'}
                          </span>
                          <span className={`text-[12px] font-mono font-bold shrink-0 ${y.value === null ? 'text-zinc-600' : secili ? 'text-cyan-400' : 'text-zinc-400'}`}>
                            {y.value === null ? '—' : `${y.value} kcal`}
                          </span>
                        </div>
                        <p className="text-[9px] font-mono text-zinc-600 leading-relaxed mt-1">{y.formula}</p>
                        {secili && (
                          <p className="text-[9px] font-mono text-zinc-500 leading-relaxed mt-1">{y.note}</p>
                        )}
                      </div>
                    );
                  })}

                  <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
                    Yöntemi ve çarpanı Ayarlar &gt; Vücut &amp; Hesaplama&apos;dan
                    değiştirebilirsin. Yöntemler arasındaki fark büyükse, veri
                    biriktikçe otomatik yöntem en isabetlisi olur.
                  </p>
                </div>
              );
            })()}

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
              {maintenanceEstimated
                ? 'Henüz gerçek TDEE olmadığı için günlük hareket, seçtiğin yaşam seviyesiyle kuruluyor. Kilo ve beslenme trendi yeterli olduğunda otomatik olarak kişisel artık yöntemine geçer.'
                : 'Günlük hareket, gerçek korunum kalorisinden bazal, sindirim ve ortalama egzersiz payı düşülerek bulunur; bugünkü egzersiz daha sonra ayrıca eklenir.'}
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
                      <React.Fragment key={d.date}>
                        <tr
                          onClick={() => setOpenDay(openDay === d.date ? null : d.date)}
                          className="border-b border-zinc-800/60 cursor-pointer active:bg-zinc-800/40"
                        >
                          <td className="text-left px-3 py-2 whitespace-nowrap">
                            <ChevronDown
                              size={10}
                              className={`inline mr-1 text-zinc-600 transition-transform ${openDay === d.date ? 'rotate-180' : ''}`}
                            />
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
                        {openDay === d.date && (
                          <tr className="border-b border-zinc-800/60 bg-zinc-950/60">
                            <td colSpan={4} className="px-3 py-2.5">
                              <div className="space-y-1.5">
                                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
                                  Harcama dökümü
                                </span>
                                {d.breakdown.parts.map(p => (
                                  <div key={p.key} className="flex justify-between items-center">
                                    <span className="flex items-center gap-1.5">
                                      <span className={`w-1.5 h-1.5 rounded-full ${p.color}`} />
                                      <span className="text-zinc-400">{p.label}</span>
                                    </span>
                                    <span className="text-zinc-300">{p.value} kcal</span>
                                  </div>
                                ))}
                                <div className="flex justify-between pt-1.5 border-t border-zinc-800">
                                  <span className="text-zinc-500">Makrolar</span>
                                  <span className="text-zinc-400">
                                    P {Math.round(d.macros.protein)} · K {Math.round(d.macros.carbs)} · Y {Math.round(d.macros.fats)}
                                  </span>
                                </div>

                                {/* Güne özel günlük hareket çarpanı.
                                    Bütün gün ayakta geçen bir gün ile masa başı
                                    geçen gün aynı çarpanla hesaplanamıyor; genel
                                    varsayılanı bozmadan tek gün düzeltilebiliyor. */}
                                {onSetDayNeat && (
                                  <div className="pt-1.5 border-t border-zinc-800 space-y-1.5">
                                    <div className="flex justify-between items-center">
                                      <span className="text-zinc-500">Günlük hareket çarpanı</span>
                                      <span className={parseNumber(d.neatOverride) > 0 ? 'text-cyan-400 font-bold' : 'text-zinc-500'}>
                                        ×{d.breakdown.neatMultiplier}
                                        {parseNumber(d.neatOverride) > 0
                                          ? ' · bu güne özel'
                                          : ` · genel (×${defaultNeatMultiplier})`}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {NEAT_PRESETS.map(p => {
                                        const secili = p.value === null
                                          ? !(parseNumber(d.neatOverride) > 0)
                                          : parseNumber(d.neatOverride) === p.value;
                                        return (
                                          <button
                                            key={p.label}
                                            onClick={(e) => { e.stopPropagation(); onSetDayNeat(d.date, p.value ?? ''); }}
                                            className={`px-2 py-1 rounded-lg border text-[9px] font-bold transition-colors ${secili
                                              ? 'border-cyan-600 text-cyan-400 bg-cyan-950/25'
                                              : 'border-zinc-800 text-zinc-500 bg-zinc-900'}`}
                                          >
                                            {p.label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[9px] font-mono text-zinc-600 px-3 py-2 border-t border-zinc-800 leading-relaxed">
                Satıra dokununca o günün dökümü açılır. Ay ikonu dinlenme, halter
                antrenman günü. Yakılan sütunu bazal + günlük hareket + sindirim +
                egzersiz toplamıdır.
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
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-[11px] font-bold text-zinc-200 min-w-0 truncate">
                      {w.rangeLabel}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-600 shrink-0">
                      {w.days}/7 gün · {w.restDays} dinlenme
                    </span>
                  </div>

                  {/* Eksik hafta tam haftayla doğrudan kıyaslanamaz; toplam yerine
                      günlük ortalamaya bakmak gerektiği burada söyleniyor. */}
                  {w.partial && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono text-amber-400 border border-amber-900/50 bg-amber-950/20 rounded-md px-1.5 py-0.5">
                      Kısmi hafta · günlük ort. {kcal(w.dailyBalance)} kcal
                    </span>
                  )}

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
                    { l: 'Egzersiz dışı temel harcama (7 gün)', v: plan.baseKcal, c: 'text-zinc-300' },
                    { l: `Ağırlık antrenmanı (${plan.trainingDays} gün)`, v: plan.liftingKcal, c: 'text-emerald-400' },
                    { l: cardioIsPlanned ? 'Kardiyo (plandaki)' : 'Kardiyo (bu haftaki gerçekleşen)', v: plan.cardioKcal, c: 'text-red-400' },
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

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/60">
                  <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Rutine Göre Günlük Harcama</h4>
                </div>
                <div className="divide-y divide-zinc-800/70">
                  {plan.days.map(day => (
                    <div key={day.key} className="px-4 py-2.5 flex justify-between items-center gap-3">
                      <span>
                        <strong className="text-[11px] text-zinc-200 block">{day.label}</strong>
                        <span className="text-[9px] font-mono text-zinc-600">
                          {day.isActiveRest ? `Aktif off day · ${day.exercise} kcal hareket` : day.isRestDay ? 'Dinlenme günü' : `${day.exercise} egzersiz + ${day.epoc} EPOC`}
                        </span>
                      </span>
                      <span className={`text-[12px] font-mono font-bold ${day.isRestDay ? 'text-zinc-400' : 'text-emerald-400'}`}>{day.total} kcal</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Plan ile gerçekleşen yan yana */}
              {karsilastirma && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline">
                    <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Plan mı, Gerçek mi</h4>
                    <span className="text-[9px] font-mono text-zinc-600">son {karsilastirma.days} gün</span>
                  </div>

                  <div className="p-3.5 space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { l: 'Plana göre', v: karsilastirma.plannedTotal, c: 'text-zinc-300' },
                        { l: 'Gerçekleşen', v: karsilastirma.actualTotal, c: 'text-emerald-400' },
                        {
                          l: 'Fark',
                          v: kcal(karsilastirma.diff),
                          c: karsilastirma.diff < 0 ? 'text-amber-400' : 'text-cyan-400',
                        },
                      ].map(x => (
                        <div key={x.l} className="bg-zinc-950 border border-zinc-800 rounded-xl py-2">
                          <span className="text-[8px] font-mono text-zinc-500 block uppercase">{x.l}</span>
                          <span className={`text-[12px] font-mono font-bold ${x.c}`}>{x.v}</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-[10px] font-mono text-zinc-400 leading-relaxed">
                      {karsilastirma.diff < -200 ? (
                        <>
                          Planladığından <strong className="text-amber-400">{Math.abs(karsilastirma.diff)} kcal</strong> az
                          yaktın{karsilastirma.skippedDays > 0 ? ` (${karsilastirma.skippedDays} gün atlanmış)` : ''}.
                          Alım aynı kaldıysa haftalık denge {karsilastirma.diffKg > 0 ? '+' : ''}{-karsilastirma.diffKg} kg
                          yönünde kaydı.
                        </>
                      ) : karsilastirma.diff > 200 ? (
                        <>
                          Planın <strong className="text-cyan-400">{karsilastirma.diff} kcal</strong> üstüne
                          çıktın{karsilastirma.extraDays > 0 ? ` (${karsilastirma.extraDays} gün planda olmayan egzersiz)` : ''}.
                          Kesme dönemindeysen iyi, kütle döneminde alımı da yukarı çekmen gerekir.
                        </>
                      ) : (
                        <>Gerçekleşen harcama planla uyumlu — sapma {Math.abs(karsilastirma.diff)} kcal.</>
                      )}
                    </p>

                    <div className="space-y-1">
                      {karsilastirma.rows.map(r => (
                        <div key={r.date} className="flex justify-between items-center text-[10px] font-mono gap-2">
                          <span className="text-zinc-400 truncate min-w-0">
                            {dateShort(r.date)}
                            {r.planName && <span className="text-zinc-600"> · {r.planName}</span>}
                          </span>
                          <span className="shrink-0 flex items-center gap-1.5">
                            <span className="text-zinc-600">{r.plannedTotal}</span>
                            <span className="text-zinc-700">→</span>
                            <span className="text-zinc-200">{r.actualTotal}</span>
                            {r.skipped && <span className="text-amber-500 text-[9px]">atlandı</span>}
                            {r.extra && <span className="text-cyan-500 text-[9px]">ekstra</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

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
