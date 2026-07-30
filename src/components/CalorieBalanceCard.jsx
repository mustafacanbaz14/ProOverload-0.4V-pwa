import React, { memo } from 'react';
import { Flame, ArrowDown, ArrowUp, Minus, Target, CalendarDays, Info } from 'lucide-react';
import { clampNumber } from '../utils/helpers';

/**
 * Kalori panosu.
 *
 * Amaç: "bugün nerede duruyorum" sorusunu tek bakışta cevaplamak. Ham sayı
 * yığını yerine önce cümleyle söylenir, sonra dökümü verilir. Günlük ve
 * haftalık iki ölçek birlikte gösterilir çünkü tek gün gürültülü, karar
 * haftalık toplamdan verilir.
 */
const CalorieBalanceCard = memo(({ data, dateLabel, manualValue, onChangeManual, goalLabel,
  stepsValue, onChangeSteps, stepsMode }) => {
  if (!data?.ready) {
    return (
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
        <h3 className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider flex items-center mb-2">
          <Flame size={13} className="mr-2 text-red-400" /> Kalori Panosu
        </h3>
        <p className="text-[11px] font-mono text-amber-400 leading-relaxed">
          Hesap için korunum kalorisi gerekiyor.
          <br />
          <span className="text-zinc-500">
            Vücut sekmesinden boy, kilo ve yağ oranı girdiğinde burası dolacak.
          </span>
        </p>
      </div>
    );
  }

  const deficit = data.balance < -50;
  const surplus = data.balance > 50;
  const durum = deficit ? 'açık' : surplus ? 'fazla' : 'korunumda';
  const renk = deficit ? 'text-cyan-400' : surplus ? 'text-amber-400' : 'text-emerald-400';
  const Ikon = deficit ? ArrowDown : surplus ? ArrowUp : Minus;

  // Hedefe göre sapma: kullanıcının asıl merak ettiği "bugün iyi gittim mi".
  const sapma = data.vsTarget;
  const hedefteMi = Math.abs(sapma) <= 100;

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-800 bg-zinc-950/60">
        <h3 className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider flex items-center">
          <Flame size={13} className="mr-2 text-red-400" /> Kalori Panosu
        </h3>
        <span className="text-[10px] font-mono text-zinc-500">{dateLabel}</span>
      </div>

      <div className="p-4 space-y-3.5">

        {/* Önce cümle, sonra sayı: sayı yığını tek başına yorumlanamıyor. */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <Ikon size={16} className={renk} />
            <span className={`text-2xl font-mono font-bold ${renk}`}>
              {Math.abs(data.balance)}
            </span>
            <span className="text-[11px] font-mono text-zinc-500">kcal {durum}</span>
          </div>
          <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">
            {data.intake} aldın, {data.totalOut} harcadın
            <span className="text-zinc-600"> (korunum {data.maintenance} + egzersiz {data.burned})</span>.
            {data.projectedWeeklyKg !== 0 && (
              <> Bu tempo sürerse haftada{' '}
                <strong className={renk}>
                  {data.projectedWeeklyKg > 0 ? '+' : ''}{data.projectedWeeklyKg} kg
                </strong>.
              </>
            )}
          </p>
        </div>

        {/* Hedefe göre bugün */}
        <div className={`rounded-2xl border p-3 ${
          hedefteMi
            ? 'bg-emerald-950/15 border-emerald-900/40'
            : 'bg-zinc-950 border-zinc-800'
        }`}>
          <div className="flex justify-between items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center">
              <Target size={11} className="mr-1.5 text-emerald-400" /> Bugünkü Hedef
            </span>
            <span className="text-[11px] font-mono">
              <strong className="text-emerald-400">{data.target}</strong>
              <span className="text-zinc-600"> kcal{goalLabel ? ` · ${goalLabel}` : ''}</span>
            </span>
          </div>
          <p className="text-[10px] font-mono leading-relaxed">
            {hedefteMi ? (
              <span className="text-emerald-300">Hedefindesin — sapma {Math.abs(sapma)} kcal.</span>
            ) : sapma > 0 ? (
              <span className="text-amber-300">
                Hedefin <strong>{sapma} kcal</strong> üstündesin.
                {data.burned > 0 && <span className="text-zinc-500"> Egzersiz yakımın hesaba katıldı.</span>}
              </span>
            ) : (
              <span className="text-cyan-300">
                Hedefin <strong>{Math.abs(sapma)} kcal</strong> altındasın.
                <span className="text-zinc-500"> Fazla açık kas kaybı riskini artırır.</span>
              </span>
            )}
          </p>
        </div>

        {/* Yakım dökümü — elle ekleme burada */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 space-y-2">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Yakılan</span>
          <div className="space-y-1.5 text-[10px] font-mono">
            <div className="flex justify-between text-zinc-500">
              <span>Antrenman + kardiyo (otomatik)</span>
              <span className="text-zinc-300">{data.burnedAuto} kcal</span>
            </div>
            <div className="flex justify-between items-center text-zinc-500">
              <span>Elle eklenen</span>
              <span className="flex items-center gap-1.5">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={5000}
                  value={manualValue ?? ''}
                  onChange={(e) => onChangeManual?.(e.target.value)}
                  // Sınırlama odaktan çıkışta: yazarken ara değerler üst sınıra çarpıyor.
                  onBlur={(e) => onChangeManual?.(
                    e.target.value === '' ? '' : clampNumber(e.target.value, 0, 5000))}
                  placeholder="0"
                  className="w-16 bg-zinc-900 border border-zinc-800 rounded-lg py-1 text-center font-mono text-red-400 text-[10px] outline-none focus:border-red-500"
                />
                <span className="text-zinc-600">kcal</span>
              </span>
            </div>
            <div className="flex justify-between text-zinc-400 pt-1.5 border-t border-zinc-800 font-bold">
              <span>Toplam</span>
              <span className="text-red-400">{data.burned} kcal</span>
            </div>
          </div>
          {stepsMode && (
            <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 pt-1.5 border-t border-zinc-800">
              <span>Günlük adım</span>
              <span className="flex items-center gap-1.5">
                <input
                  type="number" inputMode="numeric" min={0} max={100000}
                  value={stepsValue ?? ''}
                  onChange={(e) => onChangeSteps?.(e.target.value)}
                  onBlur={(e) => onChangeSteps?.(e.target.value === '' ? '' : clampNumber(e.target.value, 0, 100000))}
                  placeholder="0"
                  className="w-20 bg-zinc-900 border border-zinc-800 rounded-lg py-1 text-center font-mono text-cyan-400 text-[10px] outline-none focus:border-cyan-500"
                />
                <span className="text-zinc-600">adım</span>
              </span>
            </div>
          )}
          <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
            Adım sayısı, yürüyüş gibi gün içi hareketliliği elle ekleyebilirsin.
            {stepsMode && ' Koşu/yürüyüş kardiyosu girdiysen o adımlar düşülür, iki kez sayılmaz.'}
          </p>
        </div>

        {/* Haftalık ölçek */}
        {data.week ? (
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3">
            <div className="flex justify-between items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center">
                <CalendarDays size={11} className="mr-1.5 text-cyan-400" /> Bu Hafta
              </span>
              <span className="text-[9px] font-mono text-zinc-600">{data.week.days} gün kayıtlı</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-lg font-mono font-bold ${data.week.balance < 0 ? 'text-cyan-400' : data.week.balance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {data.week.balance > 0 ? '+' : ''}{data.week.balance}
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                kcal ≈ {data.week.kg > 0 ? '+' : ''}{data.week.kg} kg
              </span>
            </div>
            <p className="text-[9px] font-mono text-zinc-600 leading-relaxed mt-1">
              Yalnızca kayıt girilen günler sayılır. Karar tek günden değil bu
              toplamdan verilir — günlük dalgalanma normaldir.
            </p>
          </div>
        ) : (
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 flex items-start gap-2">
            <Info size={12} className="text-zinc-600 shrink-0 mt-0.5" />
            <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
              Haftalık toplam için birkaç gün daha kayıt girmen yeterli.
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

CalorieBalanceCard.displayName = 'CalorieBalanceCard';

export default CalorieBalanceCard;
