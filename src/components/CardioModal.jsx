import React, { useState, memo } from 'react';
import { X, HeartPulse, Flame, Clock, Plus, Trash2, Gauge, CalendarCheck, ChevronDown, Search, Save, CalendarDays } from 'lucide-react';
import {
  CARDIO_ACTIVITIES, CARDIO_GROUPS, CARDIO_EFFORTS, DEFAULT_EFFORT,
  findActivity, findEffort, estimateCardioCalories, cardioEntryCalories, effortDelta,
} from '../utils/cardio';
import { clampNumber, INPUT_LIMITS, foldForSearch, getLocalDateString } from '../utils/helpers';
import { formatDay } from '../utils/dates';

const QUICK_MINUTES = [15, 20, 30, 45, 60];

/**
 * Kardiyo girişi. Süre yazıldığı anda vücut ağırlığından kalori tahmini yapar.
 *
 * `weightKg` en son ölçümden gelir; ölçüm yoksa tahmin yapılamaz ve kullanıcıya
 * uydurma bir sayı göstermek yerine ölçüm girmesi söylenir.
 */
const CardioModal = memo(({
  isOpen, onClose, onSave, weightKg, entriesFor, onDelete, planned = [],
  initialDate, editingEntry = null,
}) => {
  const [type, setType] = useState(editingEntry?.type || 'zone2');
  const [minutes, setMinutes] = useState(editingEntry?.minutes || 30);
  const [effort, setEffort] = useState(editingEntry?.effort || DEFAULT_EFFORT);
  const [date, setDate] = useState(initialDate || getLocalDateString());
  const [note, setNote] = useState(editingEntry?.note || '');
  const [showActivities, setShowActivities] = useState(false);
  const [activityQuery, setActivityQuery] = useState('');
  // Ekran kapanmadan kaç aktivite eklendiği — geri bildirim için.
  const [eklenenSayisi, setEklenenSayisi] = useState(0);
  // Plandan yüklendiyse planlanan tempo/süre burada tutulur; kayda da yazılır
  // ki sonradan "planladığımdan sert mi geçti" sorusu cevaplanabilsin.
  const [plan, setPlan] = useState(editingEntry?.plannedEffort ? {
    effort: editingEntry.plannedEffort,
    minutes: Number(editingEntry.plannedMinutes) || 0,
  } : null);

  if (!isOpen) return null;

  const activity = findActivity(type);
  const effortInfo = findEffort(effort);
  const kcal = estimateCardioCalories((activity?.met || 0) * effortInfo.met, weightKg, minutes);
  const canSave = Boolean(activity) && Number(minutes) > 0;
  const normalizedActivityQuery = foldForSearch(activityQuery).trim();
  const visibleActivities = normalizedActivityQuery
    ? CARDIO_ACTIVITIES.filter(item => foldForSearch(`${item.label} ${item.group} ${item.hint || ''}`).includes(normalizedActivityQuery))
    : CARDIO_ACTIVITIES;

  const planiYukle = (slot) => {
    const activityKey = typeof slot.activity === 'string' ? slot.activity : slot.activity?.key;
    setType(activityKey);
    setMinutes(slot.minutes);
    setEffort(slot.effort || DEFAULT_EFFORT);
    setShowActivities(false);
    setPlan({ effort: slot.effort || DEFAULT_EFFORT, minutes: Number(slot.minutes) || 0 });
  };

  // Planlanan ile şu an seçilen arasındaki fark — kaydetmeden önce görünür.
  const fark = plan ? effortDelta({
    type, minutes, effort, plannedEffort: plan.effort, plannedMinutes: plan.minutes,
  }, weightKg) : null;

  const kaydet = () => onSave({
    ...(editingEntry?.id ? { id: editingEntry.id } : {}),
    type, minutes: Number(minutes), effort, date, note: note.trim(),
    ...(plan ? { plannedEffort: plan.effort, plannedMinutes: plan.minutes } : {}),
  });

  // O günün kayıtları — tarih penceresinin içinden değişebildiği için üst
  // bileşenden sabit liste değil, tarihe göre sorgulanabilir bir fonksiyon geliyor.
  const existing = entriesFor ? entriesFor(date) : [];

  /**
   * Kayıttan sonra formu bir sonraki aktiviteye hazırlar.
   *
   * Tarih ve tempo korunuyor: aynı gün ikinci bir aktivite ekleyen kullanıcı
   * çoğunlukla tarihi değiştirmiyor. Süre, not ve plan bağı sıfırlanıyor —
   * plan bağı taşınırsa ikinci kayıt da aynı planla karşılaştırılırdı.
   */
  const yeniGirdiyeHazirla = () => {
    setMinutes(30);
    setNote('');
    setPlan(null);
    setShowActivities(false);
    setEklenenSayisi(n => n + 1);
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[95] flex flex-col h-[100dvh] max-w-[420px] mx-auto">

      <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 shrink-0 pt-safe">
        <h3 className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
          <HeartPulse size={15} className="mr-2 text-red-400" /> {editingEntry ? 'Kardiyo Düzenle' : 'Kardiyo Ekle'}
        </h3>
        <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1" aria-label="Kapat">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-3 pb-safe">

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 flex items-center gap-3">
          <CalendarDays size={16} className="text-cyan-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest block">Kayıt tarihi</span>
            <span className="text-[10px] font-bold text-zinc-300 block truncate">{formatDay(date, 'medium', { year: true })}</span>
          </div>
          <input
            type="date"
            value={date}
            max={getLocalDateString()}
            onChange={(event) => setDate(event.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-[10px] font-mono text-zinc-300 outline-none focus:border-cyan-600 max-w-[132px]"
          />
        </div>

        {/* Bugün için planlanmış kardiyo varsa tek dokunuşla yüklenir */}
        {planned.length > 0 && (
          <div className="bg-cyan-950/15 border border-cyan-900/40 rounded-2xl p-3 space-y-2">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center">
              <CalendarCheck size={12} className="mr-1.5" /> Bugün Planlanan
            </span>
            {planned.map(s => (
              <button
                key={s.id}
                onClick={() => planiYukle(s)}
                className="w-full text-left px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 active:border-cyan-600 transition-colors flex justify-between items-center gap-2"
              >
                <span className="text-[11px] font-bold text-zinc-200 truncate">
                  {s.time && <span className="text-zinc-500 font-mono mr-1.5">{s.time}</span>}
                  {(typeof s.activity === 'string' ? findActivity(s.activity)?.label : s.activity?.label) || 'Kardiyo'}
                </span>
                <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                  {s.minutes} dk · {findEffort(s.effort).fullLabel}
                  {s.minuteSource === 'history' && ' · arşiv ort.'}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* İlk karar tek kartta: uzun aktivite listesi yalnızca değiştirirken açılır. */}
        <button
          onClick={() => setShowActivities(value => !value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-left active:border-red-700"
          aria-expanded={showActivities}
        >
          <span className="min-w-0">
            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest block">1 · Ne yaptın?</span>
            <strong className="text-[12px] text-zinc-100 block truncate">{activity?.label}</strong>
            <span className="text-[9px] font-mono text-zinc-500">{activity?.hint}</span>
            {activity?.activeRecovery && (
              <span className="text-[8px] font-bold text-indigo-300 block mt-1">Off day&apos;i bozmaz · aktif toparlanma</span>
            )}
          </span>
          <span className="text-[9px] font-bold text-red-400 flex items-center shrink-0">Değiştir <ChevronDown size={12} className={`ml-1 transition-transform ${showActivities ? 'rotate-180' : ''}`} /></span>
        </button>

        {/* Kalori tahmini */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
          {weightKg > 0 ? (
            <>
              <Flame size={18} className="text-red-400 mx-auto mb-1.5" />
              <span className="text-3xl font-mono font-bold text-zinc-100">{kcal}</span>
              <span className="text-[11px] font-mono text-zinc-500 ml-1">kcal</span>
              <p className="text-[9px] font-mono text-zinc-600 mt-2 leading-relaxed">
                {minutes} dk · {activity?.label} · {activity?.met} MET × {effortInfo.met} ({effortInfo.fullLabel}) · {weightKg} kg
                <br />
                Dinlenmenin üstüne yakılan miktar. Günlük hedefe eklenecek sayı budur.
              </p>
              {fark && (
                <p className={`text-[10px] font-mono leading-relaxed mt-2 pt-2 border-t border-zinc-800 ${fark.harder ? 'text-amber-300' : 'text-cyan-300'}`}>
                  Plan <strong>{fark.planned.label}</strong> idi, <strong>{fark.actual.label}</strong> seçtin:
                  {' '}{fark.kcalDiff > 0 ? '+' : ''}{fark.kcalDiff} kcal,
                  {' '}yorgunluk {fark.fatigueDiff > 0 ? '+' : ''}{fark.fatigueDiff} birim.
                  {fark.harder
                    ? ' Bugün planladığından sert geçti — yarınki bacak/ağırlık seansında bunu hesaba kat.'
                    : ' Planladığından hafif geçti; haftalık açığın beklediğinden küçük olacak.'}
                </p>
              )}
            </>
          ) : (
            <p className="text-[11px] font-mono text-amber-400 leading-relaxed">
              Kalori tahmini için kiloya ihtiyaç var.
              <br />
              <span className="text-zinc-500">Vücut sekmesinden bir ölçüm girdiğinde otomatik hesaplanacak.</span>
            </p>
          )}
        </div>

        {/* Süre */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center">
              <Clock size={12} className="mr-1.5 text-emerald-400" /> 2 · Ne kadar sürdü?
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={INPUT_LIMITS.minutes.min}
                max={INPUT_LIMITS.minutes.max}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                // Sınırlama odaktan çıkışta: yazarken uygulanınca "700" yazmaya
                // çalışan kullanıcı ara değerde üst sınıra çarpıyor.
                onBlur={(e) => setMinutes(clampNumber(e.target.value, INPUT_LIMITS.minutes.min, INPUT_LIMITS.minutes.max) || 0)}
                className="w-20 bg-zinc-950 border border-zinc-800 rounded-lg py-2 text-center font-mono text-cyan-400 text-sm outline-none focus:border-cyan-500"
              />
              <span className="text-[11px] font-mono text-zinc-500">dk</span>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {QUICK_MINUTES.map(m => (
              <button
                key={m}
                onClick={() => setMinutes(m)}
                className={`py-2 rounded-lg text-[10px] font-bold border transition-colors ${Number(minutes) === m ? 'bg-cyan-900/30 border-cyan-600 text-cyan-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Tempo / zorluk */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-2">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center">
            <Gauge size={12} className="mr-1.5 text-amber-400" /> 3 · Tempo nasıldı?
          </span>
          <div className="grid grid-cols-5 gap-1.5">
            {CARDIO_EFFORTS.map(e => (
              <button
                key={e.key}
                onClick={() => setEffort(e.key)}
                className={`py-1.5 px-1 rounded-lg border leading-tight transition-colors ${effort === e.key ? 'bg-amber-900/25 border-amber-600 text-amber-300' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}
              >
                <span className="text-[9px] font-bold block">{e.label}</span>
                {/* Kademenin ne anlama geldiği etiketin altında: "Eğlence" tek
                    başına aktif toparlanma olduğunu söylemiyordu. */}
                <span className="text-[7px] font-mono opacity-70 block leading-tight mt-0.5">{e.subLabel}</span>
              </button>
            ))}
          </div>
          <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">
            {effortInfo.hint}. Kalori ×{effortInfo.met}, yorgunluk ×{effortInfo.fatigue}.
            Compendium aynı aktiviteyi şiddete göre ayrı listeliyor; tek MET değeri
            maç temposunu da yavaş tempoyu da temsil edemiyor.
          </p>
        </div>

        {/* Aktivite kütüphanesi yalnızca kullanıcı değiştirmek istediğinde açılır. */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-2">
          <label htmlFor="cardio-note" className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Not (isteğe bağlı)</label>
          <input
            id="cardio-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={160}
            placeholder="Parkur, nabız, nasıl hissettin…"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-[11px] text-zinc-200 outline-none focus:border-cyan-600"
          />
        </div>

        {showActivities && <div className="space-y-3 bg-zinc-950 border border-zinc-800 rounded-2xl p-2.5">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              value={activityQuery}
              onChange={(event) => setActivityQuery(event.target.value)}
              placeholder="Koşu, basketbol, yürüyüş…"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-2.5 text-[11px] text-zinc-200 outline-none focus:border-red-700"
            />
          </div>
          {CARDIO_GROUPS.map(group => {
            const groupActivities = visibleActivities.filter(a => a.group === group);
            if (groupActivities.length === 0) return null;
            return (
          <div key={group} className="space-y-1.5">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">{group}</h4>
            <div className="space-y-1.5">
              {groupActivities.map(a => (
                <button
                  key={a.key}
                  onClick={() => { setType(a.key); setShowActivities(false); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors ${type === a.key ? 'bg-red-950/25 border-red-700' : 'bg-zinc-900 border-zinc-800'}`}
                >
                  <div className="flex justify-between items-center gap-2">
                    <span className={`text-[11px] font-bold truncate ${type === a.key ? 'text-red-300' : 'text-zinc-200'}`}>{a.label}</span>
                    <span className="text-[9px] font-mono text-zinc-500 shrink-0">
                      {a.met} MET
                      {weightKg > 0 && (
                        <span className="text-zinc-600"> · {estimateCardioCalories(a.met * effortInfo.met, weightKg, minutes)} kcal</span>
                      )}
                    </span>
                  </div>
                  {a.hint && <span className="text-[9px] font-mono text-zinc-600 block mt-0.5">{a.hint}</span>}
                  {a.activeRecovery && <span className="text-[8px] font-bold text-indigo-400 block mt-0.5">Aktif toparlanma · off day korunur</span>}
                </button>
              ))}
            </div>
          </div>
            );
          })}
          {visibleActivities.length === 0 && (
            <p className="text-center text-[10px] font-mono text-zinc-600 py-5">Eşleşen kardiyo bulunamadı.</p>
          )}
        </div>}

        {/* Bu seansta eklenenler */}
        {existing.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">{formatDay(date, 'medium')} · Bu Güne Eklenenler</h4>
            {existing.map(e => {
              const a = findActivity(e.type);
              return (
                <div key={e.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 flex justify-between items-center gap-2">
                  <span className="text-[11px] font-bold text-zinc-200 truncate min-w-0">{a?.label || e.type}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-zinc-500">
                      {e.minutes} dk · {findEffort(e.effort).label} · <strong className="text-red-400">{cardioEntryCalories(e, weightKg)}</strong> kcal
                    </span>
                    <button onClick={() => onDelete?.(e.id)} className="text-zinc-600 active:text-red-500 p-1">
                      <Trash2 size={13} />
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-zinc-800 bg-zinc-950 shrink-0 pb-safe space-y-2">
        {editingEntry ? (
          <button
            disabled={!canSave}
            onClick={() => { kaydet(); onClose(); }}
            className="w-full bg-red-600 active:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-3.5 rounded-xl uppercase text-[11px] tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            <Save size={15} /> Değişiklikleri Kaydet
          </button>
        ) : (
          <>
            {/* Bir günde birden fazla aktivite olabiliyor (sabah koşu, akşam maç).
                Bu yüzden asıl buton kaydedip formu sıfırlıyor ve ekran açık
                kalıyor; kapatmak ayrı ve ikincil bir eylem. */}
            <button
              disabled={!canSave}
              onClick={() => { kaydet(); yeniGirdiyeHazirla(); }}
              className="w-full bg-red-600 active:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-3.5 rounded-xl uppercase text-[11px] tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <Plus size={15} />
              {activity?.label} · {minutes} dk · {effortInfo.label}
            </button>
            <div className="flex gap-2">
              <button
                disabled={!canSave}
                onClick={() => { kaydet(); onClose(); }}
                className="flex-1 bg-zinc-900 border border-zinc-800 active:bg-zinc-800 disabled:opacity-40 text-zinc-300 font-bold py-2.5 rounded-xl uppercase text-[10px] tracking-wider flex items-center justify-center gap-1.5 transition-colors"
              >
                <Save size={13} /> Kaydet ve kapat
              </button>
              <button
                onClick={onClose}
                className="px-4 bg-zinc-900 border border-zinc-800 active:bg-zinc-800 text-zinc-500 font-bold py-2.5 rounded-xl uppercase text-[10px] tracking-wider transition-colors"
              >
                Bitti
              </button>
            </div>
            {eklenenSayisi > 0 && (
              <p className="text-[9px] font-mono text-emerald-400 text-center">
                Bu güne {eklenenSayisi} aktivite eklendi — istersen bir tane daha ekle.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
});

CardioModal.displayName = 'CardioModal';

export default CardioModal;
