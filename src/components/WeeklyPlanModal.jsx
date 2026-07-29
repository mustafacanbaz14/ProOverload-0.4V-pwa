import React, { useState, useMemo, memo } from 'react';
import { X, CalendarRange, Clock, Layers, Flame, Moon, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import MuscleHeatmap from './MuscleHeatmap';
import { WEEKDAYS, computeWeekPlan, STATUS_LABEL, STATUS_COLOR } from '../utils/weekPlan';

/**
 * Haftalık program: şablonlar günlere dağıtılır, haftanın teorik ısı haritası
 * ve kas bazında yeterlilik/fazlalık özeti gösterilir.
 *
 * Hacimler "tüm setler etkili" varsayımıyla hesaplanır — şablonda RIR yok.
 * Yani buradaki sayılar üst sınırdır, gerçek hafta altında kalır.
 */
const WeeklyPlanModal = memo(({
  isOpen,
  onClose,
  plan = {},
  onChangePlan,
  templates = [],
  customExercises = [],
  restSeconds = 120,
  experienceLevel = 'intermediate',
  weightKg = 0,
}) => {
  const [editingDay, setEditingDay] = useState(null);

  const result = useMemo(
    () => computeWeekPlan(plan, templates, { customExercises, restSeconds, experienceLevel, weightKg }),
    [plan, templates, customExercises, restSeconds, experienceLevel, weightKg]);

  if (!isOpen) return null;

  const assign = (dayKey, templateId) => {
    onChangePlan({ ...plan, [dayKey]: templateId });
    setEditingDay(null);
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[86] flex flex-col h-[100dvh] max-w-[420px] mx-auto">

      <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 shrink-0 pt-safe">
        <h3 className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
          <CalendarRange size={15} className="mr-2 text-cyan-400" /> Haftalık Program
        </h3>
        <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1" aria-label="Kapat">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-3 pb-safe">

        {templates.length === 0 && (
          <div className="bg-amber-950/20 border border-amber-900/40 rounded-2xl p-3.5 flex items-start gap-2.5">
            <Info size={15} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[10px] font-mono text-amber-200 leading-relaxed">
              Henüz şablon yok. Önce <strong>Program Oluştur</strong> ile gün gün antrenman
              yaz, sonra buradan haftaya dağıt.
            </p>
          </div>
        )}

        {/* Hafta özeti */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: <CalendarRange size={13} className="text-cyan-400" />, value: result.trainingDays, label: 'Gün' },
            { icon: <Layers size={13} className="text-emerald-400" />, value: result.totalSets, label: 'Set' },
            { icon: <Clock size={13} className="text-amber-400" />, value: `${Math.round(result.totalMinutes / 60 * 10) / 10}s`, label: 'Süre' },
            { icon: <Flame size={13} className="text-red-400" />, value: weightKg > 0 ? result.totalKcal : '—', label: 'kcal' },
          ].map(item => (
            <div key={item.label} className="bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 text-center">
              <div className="flex justify-center mb-1">{item.icon}</div>
              <span className="text-sm font-mono font-bold text-zinc-100 block">{item.value}</span>
              <span className="text-[9px] font-mono text-zinc-500 uppercase">{item.label}</span>
            </div>
          ))}
        </div>

        {weightKg > 0 ? (
          <p className="text-[9px] font-mono text-zinc-600 leading-relaxed px-1">
            Kalori tahmini {weightKg} kg üzerinden, ağırlık antrenmanı için 4.5 MET
            varsayımıyla ve dinlenmenin üstüne hesaplandı. Kardiyo bu sayıya dahil değil.
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
            {result.days.map(d => (
              <div key={d.key} className="p-3">
                <button
                  onClick={() => setEditingDay(editingDay === d.key ? null : d.key)}
                  className="w-full flex justify-between items-center gap-2 text-left active:opacity-70 transition-opacity"
                >
                  <span className="min-w-0">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">{d.label}</span>
                    <span className={`text-[12px] font-bold truncate block ${d.template ? 'text-cyan-400' : 'text-zinc-600'}`}>
                      {d.template ? d.template.name : 'Dinlenme günü'}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    {d.template ? (
                      <span className="text-[10px] font-mono text-zinc-500">
                        {d.sets} set · ~{d.minutes} dk
                        {weightKg > 0 && <span className="text-zinc-600 block">{d.kcal} kcal</span>}
                      </span>
                    ) : (
                      <Moon size={14} className="text-zinc-700" />
                    )}
                  </span>
                </button>

                {editingDay === d.key && (
                  <div className="mt-2.5 space-y-1.5">
                    <button
                      onClick={() => assign(d.key, null)}
                      className={`w-full text-left px-3 py-2 rounded-lg border text-[11px] font-bold transition-colors ${!d.template ? 'border-cyan-600 text-cyan-400 bg-cyan-950/20' : 'border-zinc-800 text-zinc-500 bg-zinc-950'}`}
                    >
                      Dinlenme günü
                    </button>
                    {templates.map(t => (
                      <button
                        key={t.id}
                        onClick={() => assign(d.key, t.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-[11px] font-bold truncate transition-colors ${d.template?.id === t.id ? 'border-cyan-600 text-cyan-400 bg-cyan-950/20' : 'border-zinc-800 text-zinc-300 bg-zinc-950'}`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Teorik ısı haritası */}
        <MuscleHeatmap
          muscleVolume={result.muscleVolume}
          experienceLevel={experienceLevel}
          title="Haftanın Isı Haritası"
          subtitle="Teorik"
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
            {result.statuses.map(s => (
              <div key={s.muscle} className="px-4 py-2.5 flex justify-between items-center gap-2">
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[11px] font-bold text-zinc-200 truncate">{s.muscle}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border shrink-0 ${STATUS_COLOR[s.status]}`}>
                    {STATUS_LABEL[s.status]}
                  </span>
                </span>
                <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                  <strong className="text-zinc-100">{s.volume}</strong>
                  <span className="text-zinc-600"> · MEV {s.mev} / MAV {s.mav}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

WeeklyPlanModal.displayName = 'WeeklyPlanModal';

export default WeeklyPlanModal;
