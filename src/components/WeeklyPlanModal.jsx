import React, { useState, useMemo, memo } from 'react';
import {
  X, CalendarRange, Clock, Layers, Flame, Moon, AlertTriangle, CheckCircle2, Info,
  Plus, Trash2, Dumbbell, HeartPulse, Star, Pencil, Check, Zap, ChevronDown,
} from 'lucide-react';
import MuscleHeatmap from './MuscleHeatmap';
import PlanningGuide from './PlanningGuide';
import { WEEKDAYS, computeWeekPlan, STATUS_LABEL, STATUS_COLOR, emptyPlan } from '../utils/weekPlan';
import { CARDIO_ACTIVITIES, CARDIO_SECTIONS, CARDIO_EFFORTS, DEFAULT_EFFORT } from '../utils/cardio';
import { analyzeDayConflicts, activityImpact } from '../utils/interference';
import { generateId, clampNumber } from '../utils/helpers';

const kucukAlan = 'bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-zinc-200 outline-none font-mono text-[11px] focus:border-cyan-500 transition-colors';
const formatPlanDuration = (minutes) => minutes < 60
  ? `${minutes} dk`
  : `${Math.round(minutes / 60 * 10) / 10} sa`;

/**
 * Haftalık programlar.
 *
 * Birden fazla adlandırılmış program tutulabiliyor ve biri "aktif" seçiliyor;
 * ana ekrandaki teorik hesaplar aktif olanı kullanıyor. Bir günün içine hem
 * antrenman hem kardiyo, istenirse saatiyle birlikte eklenebiliyor — saat
 * girildiğinde çakışma asistanı aradaki boşluğa göre tavsiye veriyor.
 *
 * Hacimler "tüm setler etkili" varsayımıyla hesaplanır; şablonda RIR yok. Yani
 * buradaki sayılar üst sınırdır, gerçek hafta altında kalır.
 */
const WeeklyPlanModal = memo(({
  isOpen,
  onClose,
  plans = [],
  activePlanId,
  onChangePlans,
  onChangeActive,
  templates = [],
  customExercises = [],
  restSeconds = 120,
  experienceLevel = 'intermediate',
  weightKg = 0,
  workouts = [],
  gender = 'male',
}) => {
  const [editingDay, setEditingDay] = useState(null);
  const [renaming, setRenaming] = useState(null);
  // Kas dökümünde açık olan satır — hangi hareketin kaç set yazdığı burada açılır.
  const [openMuscle, setOpenMuscle] = useState(null);
  const [seciliPlanId, setSeciliPlanId] = useState(activePlanId);

  // Görüntülenen program: kullanıcı listeden başkasını seçebilir, "aktif"
  // olması için ayrıca yıldıza basması gerekir.
  const plan = plans.find(p => p.id === seciliPlanId) || plans.find(p => p.id === activePlanId) || plans[0] || null;

  const result = useMemo(
    () => computeWeekPlan(plan || {}, templates, { customExercises, restSeconds, experienceLevel, weightKg, workouts }),
    [plan, templates, customExercises, restSeconds, experienceLevel, weightKg, workouts]);

  const cakismalar = useMemo(
    () => result.days.map(d => ({ key: d.key, analysis: analyzeDayConflicts(d) })),
    [result.days]);

  if (!isOpen) return null;

  /* --- program işlemleri --- */
  const planGuncelle = (patch) =>
    onChangePlans(plans.map(p => p.id === plan.id ? { ...p, ...patch } : p));

  const gunGuncelle = (dayKey, slots) =>
    planGuncelle({ days: { ...plan.days, [dayKey]: slots } });

  const planEkle = () => {
    const yeni = emptyPlan(generateId(), `Program ${plans.length + 1}`);
    onChangePlans([...plans, yeni]);
    setSeciliPlanId(yeni.id);
    setRenaming(yeni.id);
  };

  const planSil = () => {
    if (plans.length <= 1) return;
    const kalan = plans.filter(p => p.id !== plan.id);
    onChangePlans(kalan);
    if (activePlanId === plan.id) onChangeActive(kalan[0].id);
    setSeciliPlanId(kalan[0].id);
  };

  const planKopyala = () => {
    const kopya = {
      ...plan,
      id: generateId(),
      name: `${plan.name} (kopya)`,
      // Slot kimlikleri de tazelenir; yoksa iki program aynı kimliği paylaşır.
      days: Object.fromEntries(Object.entries(plan.days).map(([k, v]) =>
        [k, v.map(s => ({ ...s, id: generateId() }))])),
    };
    onChangePlans([...plans, kopya]);
    setSeciliPlanId(kopya.id);
  };

  /* --- slot işlemleri --- */
  const slotEkle = (dayKey, type) => {
    const slot = type === 'workout'
      ? { id: generateId(), type: 'workout', templateId: templates[0]?.id || '', time: '' }
      : { id: generateId(), type: 'cardio', activity: 'zone2', minutes: '', effort: DEFAULT_EFFORT, time: '' };
    gunGuncelle(dayKey, [...(plan.days[dayKey] || []), slot]);
  };

  const slotGuncelle = (dayKey, id, patch) =>
    gunGuncelle(dayKey, (plan.days[dayKey] || []).map(s => s.id === id ? { ...s, ...patch } : s));

  const slotSil = (dayKey, id) =>
    gunGuncelle(dayKey, (plan.days[dayKey] || []).filter(s => s.id !== id));

  if (!plan) return null;

  const aktifMi = plan.id === activePlanId;

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[86] flex flex-col h-[100dvh] max-w-[420px] mx-auto">

      <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 shrink-0 pt-safe">
        <h3 className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
          <CalendarRange size={15} className="mr-2 text-cyan-400" /> Haftalık Programlar
        </h3>
        <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1" aria-label="Kapat">
          <X size={20} />
        </button>
      </div>

      {/* Program seçici */}
      <div className="p-3 space-y-2 border-b border-zinc-800 bg-zinc-950 shrink-0">
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar -mx-1 px-1 items-center">
          {plans.map(p => (
            <button
              key={p.id}
              onClick={() => setSeciliPlanId(p.id)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-1.5 ${p.id === plan.id ? 'border-cyan-600 text-cyan-400 bg-cyan-950/20' : 'border-zinc-800 text-zinc-500'}`}
            >
              {p.id === activePlanId && <Star size={10} className="text-amber-400 fill-amber-400" />}
              {p.name}
            </button>
          ))}
          <button
            onClick={planEkle}
            aria-label="Yeni program"
            className="shrink-0 px-2.5 py-1.5 rounded-lg border border-dashed border-zinc-700 text-zinc-500 active:text-cyan-400"
          >
            <Plus size={13} />
          </button>
        </div>

        {renaming === plan.id ? (
          <div className="flex gap-1.5">
            <input
              autoFocus
              type="text"
              value={plan.name}
              onChange={(e) => planGuncelle({ name: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') setRenaming(null); }}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 outline-none font-mono text-[12px] focus:border-cyan-500"
            />
            <button onClick={() => setRenaming(null)} className="px-3 rounded-xl bg-cyan-600 text-white" aria-label="Adı onayla">
              <Check size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onChangeActive(plan.id)}
              disabled={aktifMi}
              className={`flex-1 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider border flex items-center justify-center gap-1.5 transition-colors ${aktifMi
                ? 'border-amber-700/60 text-amber-400 bg-amber-950/20'
                : 'border-zinc-800 text-zinc-400 bg-zinc-900 active:bg-zinc-800'}`}
            >
              <Star size={12} className={aktifMi ? 'fill-amber-400' : ''} />
              {aktifMi ? 'Aktif Şablon' : 'Aktif Yap'}
            </button>
            <button onClick={() => setRenaming(plan.id)} className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 active:text-cyan-400" aria-label="Adı değiştir">
              <Pencil size={13} />
            </button>
            <button onClick={planKopyala} className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 active:text-cyan-400" aria-label="Programı kopyala">
              <Layers size={13} />
            </button>
            <button
              onClick={planSil}
              disabled={plans.length <= 1}
              className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 active:text-red-500 disabled:opacity-30"
              aria-label="Programı sil"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}

        {!aktifMi && (
          <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
            Bu programı görüntülüyorsun. Ana ekrandaki teorik hesaplar yıldızlı
            (aktif) programı kullanır.
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-3 pb-safe">

        <PlanningGuide mode="week" />

        {templates.length === 0 && (
          <div className="bg-amber-950/20 border border-amber-900/40 rounded-2xl p-3.5 flex items-start gap-2.5">
            <Info size={15} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[10px] font-mono text-amber-200 leading-relaxed">
              Henüz şablon yok. Önce <strong>Program Oluştur</strong> ile gün gün antrenman
              yaz, sonra buradan haftaya dağıt. Kardiyoyu şablon olmadan da ekleyebilirsin.
            </p>
          </div>
        )}

        {/* Hafta özeti */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: <CalendarRange size={13} className="text-cyan-400" />, value: result.trainingDays, label: 'Gün' },
            { icon: <Layers size={13} className="text-emerald-400" />, value: result.totalSets, label: 'Set' },
            { icon: <Clock size={13} className="text-amber-400" />, value: formatPlanDuration(result.totalMinutes), label: 'Süre' },
            {
              icon: <Flame size={13} className="text-red-400" />,
              value: weightKg > 0 ? result.totalKcal + result.totalCardioKcal : '—',
              label: 'kcal',
            },
          ].map(item => (
            <div key={item.label} className="bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 text-center">
              <div className="flex justify-center mb-1">{item.icon}</div>
              <span className="text-sm font-mono font-bold text-zinc-100 block">{item.value}</span>
              <span className="text-[9px] font-mono text-zinc-500 uppercase">{item.label}</span>
            </div>
          ))}
        </div>

        {result.activeRecoveryDays > 0 && (
          <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-indigo-300">Aktif off day</span>
            <span className="text-[9px] font-mono text-zinc-500">{result.activeRecoveryDays} gün · düşük-yük aktivite veya aktif toparlanma temposu</span>
          </div>
        )}

        {weightKg > 0 ? (
          <p className="text-[9px] font-mono text-zinc-600 leading-relaxed px-1">
            Kalori {weightKg} kg üzerinden ve dinlenmenin üstüne hesaplandı; ağırlık
            için 4.5 MET, kardiyo için aktivitenin MET'i seçilen tempoyla ölçeklendi.
            Ağırlık {result.totalKcal}, kardiyo {result.totalCardioKcal} kcal.
          </p>
        ) : (
          <p className="text-[9px] font-mono text-amber-500/80 leading-relaxed px-1">
            Kalori tahmini için Vücut sekmesinden bir kilo ölçümü girmen gerekiyor.
          </p>
        )}

        {/* Gün atamaları */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/60">
            <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Günler</h4>
          </div>
          <div className="divide-y divide-zinc-800">
            {result.days.map(d => {
              const cakisma = cakismalar.find(c => c.key === d.key)?.analysis;
              const acik = editingDay === d.key;
              return (
                <div key={d.key} className="p-3">
                  <button
                    onClick={() => setEditingDay(acik ? null : d.key)}
                    className="w-full flex justify-between items-center gap-2 text-left active:opacity-70 transition-opacity"
                  >
                    <span className="min-w-0">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">{d.label}</span>
                      {d.slots.length === 0 ? (
                        <span className="text-[12px] font-bold text-zinc-600 block">Dinlenme günü</span>
                      ) : (
                        <span className="block space-y-0.5">
                          {d.workouts.map(w => (
                            <span key={w.id} className="text-[12px] font-bold text-cyan-400 truncate block">
                              {w.time && <span className="text-zinc-500 font-mono mr-1.5">{w.time}</span>}
                              {w.template.name}
                            </span>
                          ))}
                          {d.cardios.map(c => (
                            <span key={c.id} className="text-[11px] font-bold text-red-400 truncate block">
                              {c.time && <span className="text-zinc-500 font-mono mr-1.5">{c.time}</span>}
                              {c.activity.label}
                              <span className="text-zinc-500 font-mono font-normal">
                                {' '}· {c.minutes} dk · {c.effortInfo.label}
                                {c.minuteSource === 'history' && ' · arşiv ort.'}
                                {c.minuteSource === 'default' && ' · başlangıç tahmini'}
                              </span>
                            </span>
                          ))}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-right">
                      {d.slots.length > 0 ? (
                        <span className="text-[10px] font-mono text-zinc-500">
                          {d.isActiveRest && <span className="text-indigo-400 block font-bold">Aktif Off Day</span>}
                          {d.sets > 0 && <>{d.sets} set · </>}~{d.minutes} dk
                          {weightKg > 0 && <span className="text-zinc-600 block">{d.totalKcal} kcal</span>}
                          {cakisma && cakisma.level.key !== 'none' && cakisma.items.length > 0 && (
                            <span className={`block font-bold ${cakisma.level.text}`}>çakışma: {cakisma.level.label}</span>
                          )}
                        </span>
                      ) : (
                        <Moon size={14} className="text-zinc-700" />
                      )}
                    </span>
                  </button>

                  {acik && (
                    <div className="mt-3 space-y-2">
                      {(plan.days[d.key] || []).map(slot => (
                        <div key={slot.id} className={`rounded-xl border p-2.5 space-y-2 ${slot.type === 'cardio' ? 'border-red-900/40 bg-red-950/10' : 'border-cyan-900/40 bg-cyan-950/10'}`}>
                          <div className="flex items-center gap-2">
                            {slot.type === 'cardio'
                              ? <HeartPulse size={12} className="text-red-400 shrink-0" />
                              : <Dumbbell size={12} className="text-cyan-400 shrink-0" />}
                            {slot.type === 'workout' ? (
                              <select
                                value={slot.templateId || ''}
                                onChange={(e) => slotGuncelle(d.key, slot.id, { templateId: e.target.value })}
                                className={`${kucukAlan} flex-1 min-w-0`}
                              >
                                <option value="">— şablon seç —</option>
                                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                              </select>
                            ) : (
                              <select
                                value={slot.activity}
                                onChange={(e) => slotGuncelle(d.key, slot.id, { activity: e.target.value })}
                                className={`${kucukAlan} flex-1 min-w-0`}
                              >
                                {CARDIO_SECTIONS.flatMap(section => section.groups.map(group => (
                                  <optgroup key={`${section.key}-${group}`} label={`${section.label} — ${group}`}>
                                    {CARDIO_ACTIVITIES.filter(a => a.group === group).map(a => (
                                      <option key={a.key} value={a.key}>{a.label}</option>
                                    ))}
                                  </optgroup>
                                )))}
                              </select>
                            )}
                            <button
                              onClick={() => slotSil(d.key, slot.id)}
                              className="text-zinc-600 active:text-red-500 p-1 shrink-0"
                              aria-label="Bu girişi sil"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5">
                            <label className="space-y-0.5">
                              <span className="text-[9px] font-mono text-zinc-500 block">Saat</span>
                              <input
                                type="time"
                                value={slot.time || ''}
                                onChange={(e) => slotGuncelle(d.key, slot.id, { time: e.target.value })}
                                className={`${kucukAlan} w-full`}
                              />
                            </label>
                            <label className="space-y-0.5">
                              <span className="text-[9px] font-mono text-zinc-500 block">Süre (dk)</span>
                              <input
                                type="number" inputMode="numeric" min={0} max={300}
                                value={slot.minutes ?? ''}
                                onChange={(e) => slotGuncelle(d.key, slot.id, { minutes: e.target.value })}
                                // Sınırlama odaktan çıkışta: yazarken ara değerler tavana çarpıyor.
                                onBlur={(e) => slotGuncelle(d.key, slot.id, {
                                  minutes: e.target.value === '' ? '' : clampNumber(e.target.value, 0, 300),
                                })}
                                placeholder={slot.type === 'workout' ? 'oto' : 'arşiv'}
                                className={`${kucukAlan} w-full text-center`}
                              />
                            </label>
                            {slot.type === 'cardio' && (
                              <label className="space-y-0.5">
                                <span className="text-[9px] font-mono text-zinc-500 block">Tempo</span>
                                <select
                                  value={slot.effort || DEFAULT_EFFORT}
                                  onChange={(e) => slotGuncelle(d.key, slot.id, { effort: e.target.value })}
                                  className={`${kucukAlan} w-full`}
                                >
                                  {CARDIO_EFFORTS.map(x => <option key={x.key} value={x.key}>{x.fullLabel}</option>)}
                                </select>
                              </label>
                            )}
                          </div>

                          {slot.type === 'cardio' && (() => {
                            const etki = activityImpact(slot.activity);
                            const tempo = CARDIO_EFFORTS.find(x => x.key === (slot.effort || DEFAULT_EFFORT));
                            const hesaplanan = d.cardios.find(cardio => cardio.id === slot.id);
                            return (
                              <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">
                                {tempo?.hint}
                                {etki?.hint ? ` · ${etki.label}: ${etki.hint}` : ''}
                                {hesaplanan?.minuteSource === 'history' && ` · Süre boş: son ${hesaplanan.historyStats.count} kaydın ortalaması ${hesaplanan.minutes} dk kullanılıyor.`}
                                {hesaplanan?.minuteSource === 'default' && ` · Geçmiş yok: geçici ${hesaplanan.minutes} dk tahmini kullanılıyor.`}
                                {hesaplanan?.effortInfo.key === 'fun' && ' · O gün başka antrenman yoksa aktif off day sayılır.'}
                              </p>
                            );
                          })()}
                        </div>
                      ))}

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => slotEkle(d.key, 'workout')}
                          disabled={templates.length === 0}
                          className="py-2 rounded-xl border border-dashed border-cyan-900/50 text-cyan-400 font-bold text-[10px] uppercase tracking-wide flex items-center justify-center active:bg-zinc-800 disabled:opacity-30"
                        >
                          <Dumbbell size={12} className="mr-1.5" /> Antrenman
                        </button>
                        <button
                          onClick={() => slotEkle(d.key, 'cardio')}
                          className="py-2 rounded-xl border border-dashed border-red-900/50 text-red-400 font-bold text-[10px] uppercase tracking-wide flex items-center justify-center active:bg-zinc-800"
                        >
                          <HeartPulse size={12} className="mr-1.5" /> Kardiyo
                        </button>
                      </div>

                      {/* Çakışma asistanı */}
                      {cakisma && cakisma.items.length > 0 && (
                        <div className={`rounded-xl border p-3 space-y-2 ${cakisma.level.bg}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 flex items-center">
                              <Zap size={11} className="mr-1.5" /> Çakışma Asistanı
                            </span>
                            <span className={`text-[10px] font-bold ${cakisma.level.text}`}>{cakisma.level.label}</span>
                          </div>
                          {cakisma.items.map(i => (
                            <div key={i.key}>
                              <span className={`text-[10px] font-bold block ${i.level.text}`}>{i.title}</span>
                              <p className="text-[10px] font-mono text-zinc-400 leading-relaxed">{i.detail}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Haftanın çakışma özeti */}
        {cakismalar.some(c => c.analysis.level.key === 'high' || c.analysis.level.key === 'medium') && (
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/60">
              <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Haftanın Çakışmaları</h4>
            </div>
            <div className="divide-y divide-zinc-800/70">
              {cakismalar
                .filter(c => c.analysis.level.key === 'high' || c.analysis.level.key === 'medium')
                .map(c => {
                  const gun = WEEKDAYS.find(w => w.key === c.key);
                  return (
                    <button
                      key={c.key}
                      onClick={() => setEditingDay(c.key)}
                      className="w-full px-4 py-2.5 flex justify-between items-center gap-2 text-left active:bg-zinc-800"
                    >
                      <span className="text-[11px] font-bold text-zinc-200">{gun.label}</span>
                      <span className={`text-[10px] font-mono ${c.analysis.level.text}`}>
                        {c.analysis.items[0].title}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* Teorik ısı haritası */}
        <MuscleHeatmap
          muscleVolume={result.muscleVolume}
          experienceLevel={experienceLevel}
          title="Haftanın Isı Haritası"
          subtitle="Teorik"
          gender={gender}
        />

        {/* Uyarılar */}
        <div className="space-y-2">
          {result.over.length > 0 && (
            <div className="bg-orange-950/20 border border-orange-900/40 rounded-2xl p-3.5 flex items-start gap-2.5">
              <AlertTriangle size={15} className="text-orange-400 shrink-0 mt-0.5" />
              <p className="text-[10px] font-mono text-orange-200 leading-relaxed">
                <strong>Tavanın üstünde:</strong> {result.over.join(', ')}.
                Toparlanma sınırını (MRV) aşıyor — set azaltmazsan bu kaslarda
                gelişim yerine birikmiş yorgunluk alırsın.
              </p>
            </div>
          )}

          {(result.under.length > 0 || result.untrained.length > 0) && (
            <div className="bg-cyan-950/15 border border-cyan-900/40 rounded-2xl p-3.5 flex items-start gap-2.5">
              <AlertTriangle size={15} className="text-cyan-400 shrink-0 mt-0.5" />
              <p className="text-[10px] font-mono text-cyan-200 leading-relaxed">
                {result.untrained.length > 0 && (
                  <><strong>Hiç çalışılmıyor:</strong> {result.untrained.join(', ')}.<br /></>
                )}
                {result.under.length > 0 && (
                  <><strong>MEV altında:</strong> {result.under.join(', ')}.</>
                )}
                <br />
                Bu kaslar koruma eşiğinin altında; büyüme beklemek için set eklemen gerekir.
              </p>
            </div>
          )}

          {result.optimal.length > 0 && result.over.length === 0 && result.under.length === 0 && result.untrained.length === 0 && (
            <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-2xl p-3.5 flex items-start gap-2.5">
              <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[10px] font-mono text-emerald-200 leading-relaxed">
                Bütün kas grupları verimli aralıkta. Bu programı birkaç hafta koruyup
                ağırlık/tekrar üzerinden ilerlemek en mantıklısı.
              </p>
            </div>
          )}
        </div>

        {/* Kas kas döküm */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline">
            <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Kas Dökümü</h4>
            <span className="text-[9px] font-mono text-zinc-600">tüm setler etkili varsayımı</span>
          </div>
          <div className="divide-y divide-zinc-800/70">
            {result.statuses.map(s => {
              const acik = openMuscle === s.muscle;
              const kaynakVar = s.sources.length > 0;
              return (
                <div key={s.muscle}>
                  <button
                    onClick={() => setOpenMuscle(acik ? null : s.muscle)}
                    disabled={!kaynakVar}
                    className="w-full px-4 py-2.5 flex justify-between items-center gap-2 text-left active:bg-zinc-800/50 disabled:active:bg-transparent transition-colors"
                    aria-expanded={acik}
                  >
                    <span className="flex items-center gap-1.5 min-w-0">
                      {kaynakVar
                        ? <ChevronDown size={11} className={`text-zinc-600 shrink-0 transition-transform ${acik ? 'rotate-180' : ''}`} />
                        : <span className="w-[11px] shrink-0" />}
                      <span className="text-[11px] font-bold text-zinc-200 truncate">{s.muscle}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border shrink-0 ${STATUS_COLOR[s.status]}`}>
                        {STATUS_LABEL[s.status]}
                      </span>
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                      <strong className="text-zinc-100">{s.volume}</strong>
                      <span className="text-zinc-600"> · MEV {s.mev} / MAV {s.mav}</span>
                    </span>
                  </button>

                  {/* Hangi hareket bu kasa ne kadar yazıyor.
                      Katkı ağırlığı da gösteriliyor: bir hareket birincil kasına
                      tam set, yardımcı kaslarına yarım ya da çeyrek set yazıyor,
                      bu yüzden "4 set bench" göğüse 4, tricepse 2 set olabiliyor. */}
                  {acik && (
                    <div className="px-4 pb-3 pt-0.5 space-y-1 bg-zinc-950/50">
                      {s.sources.map((src, i) => (
                        <div key={`${src.day}-${src.name}-${i}`} className="flex justify-between items-baseline gap-2 text-[10px] font-mono">
                          <span className="text-zinc-400 truncate min-w-0">
                            <span className="text-zinc-600">{WEEKDAYS.find(w => w.key === src.day)?.short} · </span>
                            <span className="text-zinc-500">{src.templateName} · </span>{src.name}
                          </span>
                          <span className="text-zinc-500 shrink-0">
                            {src.sets} set × {src.weight === 1 ? 'tam' : src.weight === 0.5 ? '½' : '¼'}
                            {' = '}<strong className="text-cyan-400">{src.volume}</strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

WeeklyPlanModal.displayName = 'WeeklyPlanModal';

export default WeeklyPlanModal;
