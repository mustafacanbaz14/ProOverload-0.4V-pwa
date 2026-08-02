import React, { memo } from 'react';
import { Target, Check, TrendingDown, TrendingUp, Sparkles, AlertTriangle, RotateCcw } from 'lucide-react';
import { GOAL_FIELDS, goalProgress, deriveGoalSet, goalEta } from '../utils/goals';
import { formatDay } from '../utils/dates';
import { clampNumber, parseNumber } from '../utils/helpers';

/**
 * Vücut kompozisyonu hedefleri: kilo, yağ oranı, yağsız kütle ve FFMI.
 *
 * Dört değer boy sabitken birbirine bağlı, bu yüzden ikisini girmek yetiyor;
 * kalanı hesaplanıp "hesaplandı" etiketiyle gösteriliyor. Yalnızca kullanıcının
 * yazdığı değerler kaydedilir — hesaplananlar her render'da yeniden türetilir,
 * böylece bir hedefi değiştirince diğerleri eskimiş halde kalmaz.
 *
 * İlerleme yüzdesi en eski ölçümden hesaplanır — hedef sonradan konulduğu için
 * "hedefi koyduğum an" referans alınsa ilerleme hep %0 görünürdü.
 */
const GoalsCard = memo(({
  settings = {},
  setSettings,
  current = {},
  earliest = {},
  heightCm = 0,
  // Hedef başına ölçüm eğilimi: { goalWeight: { perWeek, spanDays, confidence }, ... }
  trends = {},
}) => {
  const { values: goalValues, derived, inconsistent } = deriveGoalSet(settings, heightCm);
  // Sınırlama YAZARKEN değil odaktan çıkışta uygulanır. Her tuşta sınıra
  // çekmek girişi kullanılamaz hale getiriyordu: min 30 olan alana "78"
  // yazmaya çalışınca "7" anında 30'a çekiliyor, sonraki tuşla "308" olup
  // üst sınıra (300) çarpıyordu. MetricsView aynı kalıbı zaten kullanıyor.
  const setGoal = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  const clampOnBlur = (field) => (e) => {
    const raw = e.target.value;
    // Boş bırakmak hedefi kaldırmak demek; sıfıra çevirmek yanlış olurdu.
    if (raw === '') return setGoal(field.key, '');
    setGoal(field.key, clampNumber(raw, field.min, field.max));
  };

  const rows = GOAL_FIELDS.map(f => {
    const target = goalValues[f.key];
    // Her ölçüm kendi hızıyla ilerliyor: kilo düşerken yağsız kütle sabit
    // kalabiliyor. Bu yüzden varış tahmini kilo hızından türetilmiyor, her
    // metrik kendi geçmişinden hesaplanıyor.
    const trend = trends[f.key] || null;
    return {
      ...f,
      target,
      isDerived: Boolean(derived[f.key]),
      hasTarget: parseNumber(target) > 0,
      progress: goalProgress(earliest[f.key], current[f.key], target),
      trend,
      eta: trend ? goalEta(current[f.key], target, trend.perWeek) : null,
    };
  });

  const anyUserEntered = GOAL_FIELDS.some(f => parseNumber(settings[f.key]) > 0);

  const clearAll = () => setSettings(prev => {
    const next = { ...prev };
    GOAL_FIELDS.forEach(f => { next[f.key] = ''; });
    return next;
  });

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-800 bg-zinc-950/60">
        <h3 className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider flex items-center">
          <Target size={13} className="mr-2 text-emerald-400" /> Hedefler
        </h3>
        <span className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono text-zinc-500">
            {rows.filter(r => r.hasTarget).length}/{rows.length} belirlendi
          </span>
          {anyUserEntered && (
            <button
              onClick={clearAll}
              title="Tüm hedefleri temizle"
              aria-label="Tüm hedefleri temizle"
              className="text-zinc-600 active:text-red-400 p-1 -mr-1"
            >
              <RotateCcw size={12} />
            </button>
          )}
        </span>
      </div>

      <div className="p-4 space-y-3.5">
        <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
          Dört değer birbirine bağlı. <strong className="text-zinc-400">İkisini gir</strong>,
          kalan ikisi otomatik hesaplanır. Hesaplananın üstüne yazarsan seninki geçerli olur.
        </p>

        {inconsistent && (
          <div className="bg-orange-950/20 border border-orange-900/40 rounded-xl p-2.5 flex items-start gap-2">
            <AlertTriangle size={13} className="text-orange-400 shrink-0 mt-0.5" />
            <p className="text-[9px] font-mono text-orange-200 leading-relaxed">
              Girdiğin hedefler birbirini tutmuyor — bu kilo ve yağ oranıyla o kas kütlesi
              mümkün değil. Birini boşaltırsan diğerlerinden doğru değeri hesaplarım.
            </p>
          </div>
        )}

        {rows.map(row => {
          const p = row.progress;
          return (
            <div key={row.key} className="space-y-1.5">
              <div className="flex justify-between items-center gap-2">
                <span className="text-[11px] font-bold text-zinc-200 min-w-0 truncate flex items-center gap-1.5">
                  {row.label}
                  {row.isDerived && (
                    <span className="text-[8px] font-mono text-cyan-500 uppercase tracking-wider flex items-center gap-0.5 shrink-0">
                      <Sparkles size={8} /> hesaplandı
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    inputMode="decimal"
                    step={row.step}
                    min={row.min}
                    max={row.max}
                    // Hesaplanan değer input'a YAZILMAZ, placeholder olarak
                    // gösterilir: kaydedilen yalnızca kullanıcının yazdığıdır.
                    // Böylece bir hedefi değiştirince diğerleri kendiliğinden
                    // yeniden hesaplanır, eski değerde donup kalmaz.
                    value={settings[row.key] ?? ''}
                    onChange={(e) => setGoal(row.key, e.target.value)}
                    onBlur={clampOnBlur(row)}
                    placeholder={row.isDerived ? String(row.target) : '—'}
                    className={`w-20 bg-zinc-950 border rounded-lg py-1.5 text-center font-mono text-[11px] outline-none transition-colors ${
                      row.isDerived
                        ? 'border-cyan-900/50 text-emerald-400 placeholder:text-cyan-400'
                        : 'border-zinc-800 text-emerald-400 focus:border-emerald-500'
                    }`}
                  />
                  {row.unit && <span className="text-[10px] font-mono text-zinc-600 w-4">{row.unit}</span>}
                </span>
              </div>

              {row.hasTarget && p && (
                <>
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-zinc-500">
                      Şu an <strong className="text-zinc-300">{p.current}{row.unit}</strong>
                    </span>
                    {p.reached ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Check size={11} /> Hedefe ulaştın
                      </span>
                    ) : (
                      <span className="text-zinc-400 flex items-center gap-1">
                        {p.direction === 'down'
                          ? <TrendingDown size={11} className="text-cyan-400" />
                          : <TrendingUp size={11} className="text-cyan-400" />}
                        {p.remaining}{row.unit} kaldı
                      </span>
                    )}
                  </div>
                  {p.percent !== null && (
                    <div className="w-full bg-zinc-950 rounded-full h-1.5 border border-zinc-800">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${p.reached ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                        style={{ width: `${p.percent}%` }}
                      />
                    </div>
                  )}

                  {/* Tahmini varış: ölçüm geçmişindeki eğilim aynı hızda sürerse.
                      Hız, tek tek ölçümlerin gürültüsünden etkilenmesin diye
                      son haftaların tamamına uydurulan doğrudan geliyor. */}
                  {!p.reached && row.eta && (
                    <p className="text-[9px] font-mono leading-relaxed">
                      {row.eta.wrongDirection ? (
                        <span className="text-amber-400">
                          Eğilim ters yönde (haftada {row.trend.perWeek > 0 ? '+' : ''}{row.trend.perWeek}{row.unit}) — bu gidişle hedefe yaklaşmıyorsun.
                        </span>
                      ) : row.eta.stalled ? (
                        <span className="text-zinc-500">
                          Son {row.trend.spanDays} günde bu değer yerinde sayıyor; süre tahmini yapılamıyor.
                        </span>
                      ) : row.eta.tooFar ? (
                        <span className="text-zinc-500">
                          Mevcut hız çok yavaş — hedef 3 yıldan uzak görünüyor.
                        </span>
                      ) : (
                        <span className="text-cyan-400">
                          Haftada {row.trend.perWeek > 0 ? '+' : ''}{row.trend.perWeek}{row.unit} hızında
                          {' '}<strong>~{row.eta.weeks} hafta</strong> ({formatDay(row.eta.date, 'medium', { year: true })})
                          {row.trend.confidence === 'low' && (
                            <span className="text-zinc-600"> · az veri, tahmin oynak</span>
                          )}
                        </span>
                      )}
                    </p>
                  )}
                </>
              )}
            </div>
          );
        })}

        {/* Varış tahmini her satırda kendi eğilimiyle veriliyor. Hiç eğilim
            çıkarılamıyorsa sebebi burada söyleniyor, satırlar sessizce boş
            kalmasın. */}
        {rows.some(r => r.hasTarget) && rows.every(r => !r.trend) && (
          <p className="text-[9px] font-mono text-zinc-600 leading-relaxed pt-1 border-t border-zinc-800">
            Varış tahmini için son 6 hafta içinde en az üç ölçüm gerekiyor. Ölçüm
            biriktikçe her hedefin altında tahmini tarih görünecek.
          </p>
        )}

        {rows.every(r => !r.hasTarget) && (
          <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
            Bir hedef gir, ilerlemen buradan takip edilir. İlerleme yüzdesi en eski
            ölçümünden bugüne kat ettiğin yola göre hesaplanır.
          </p>
        )}
      </div>
    </div>
  );
});

GoalsCard.displayName = 'GoalsCard';

export default GoalsCard;
