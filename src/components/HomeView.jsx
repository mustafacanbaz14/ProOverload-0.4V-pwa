import React, { memo } from 'react';
import { AlertCircle, Activity, Target, Zap, BookmarkPlus, Trash2, Clock, Layers, ChevronRight, ChevronDown, Dumbbell, CalendarPlus, HeartPulse, Flame, CalendarRange, Pencil, Wrench } from 'lucide-react';
import { MUSCLE_SECTIONS, getVolumeLandmarks, volumeStatusOf, VOLUME_STATUS, acwrStatusOf, ACWR_STATUS, ACWR_HINT } from '../utils/constants';
import { previewTemplateVolume, estimateDuration } from '../utils/templates';
import MuscleHeatmap from './MuscleHeatmap';

const HomeView = memo(({
  needsBackup,
  dashboardStats,
  templates,
  setIsSettingsModalOpen,
  handleStartRequest,
  setDeleteConfirm,
  onSelectMuscle,
  onPreviewTemplate,
  onEditTemplate,
  customExercises = [],
  restSeconds = 120,
  experienceLevel = 'intermediate',
  onOpenTemplateBuilder,
  onOpenTools,
  weeklyCardioKcal = 0,
  showMuscleVolume = false,
  onToggleMuscleVolume,
}) => {
  return (
    <div className="p-4 space-y-5 pb-nav h-full overflow-y-auto hide-scrollbar bg-black">

      {needsBackup && (
        <div className="bg-orange-900/20 border border-orange-900/50 p-3 rounded-2xl flex items-start space-x-3">
          <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={16} />
          <div className="flex-1">
            <h4 className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">Yedekleme Uyarısı</h4>
            <p className="text-[10px] text-orange-300 mt-1 font-mono">Verilerinizi en son 7 günden uzun süre önce yedeklediniz veya hiç yedeklemediniz. Cihaz hafızası temizlenirse verileriniz kaybolur.</p>
          </div>
          <button onClick={() => setIsSettingsModalOpen(true)} className="text-[10px] bg-orange-500/20 text-orange-400 px-3 py-2 rounded-xl font-bold uppercase tracking-wider hover:bg-orange-500/30 transition-colors">Aç</button>
        </div>
      )}

      {dashboardStats.isDeloadNeeded && (
        <div className="bg-red-900/20 border border-red-900/50 p-3 rounded-2xl flex items-start space-x-3">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
          <div>
            <h4 className="text-[11px] font-bold text-red-400 uppercase tracking-wider">Dinlenme (Deload) İhtiyacı</h4>
            <p className="text-[10px] text-red-300 mt-1 font-mono">Yorgunluk sınırını aştınız. Bu hafta çalıştığınız set sayılarını veya ağırlıkları %30 oranında düşürün.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-5"><Activity size={64} /></div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 z-10">Bu Hafta</span>
          <span className="text-2xl font-mono text-zinc-100 z-10">{dashboardStats.thisWeekSessions} <span className="text-xs text-zinc-500">Antrenman</span></span>
        </div>
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-5"><Target size={64} /></div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 z-10">Haftalık Hacim</span>
          <span className="text-2xl font-mono text-cyan-400 z-10">{dashboardStats.thisWeekEffectiveSets} <span className="text-xs text-zinc-500">Set</span></span>
        </div>
      </div>

      {/* İnteraktif Kas Isı Haritası */}
      <MuscleHeatmap muscleVolume={dashboardStats.muscleVolume} onSelectMuscle={onSelectMuscle} experienceLevel={experienceLevel} />

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Aşırı Yük Riski (ACWR)</span>
          {(() => {
            // Eşik ve renkler tek kaynaktan (constants.js) gelir; burada
            // tekrarlanınca iki yer birbirinden sapıyordu.
            const { acwr, hasEnoughData, nearCeiling } = dashboardStats;
            const key = acwrStatusOf(acwr, hasEnoughData, nearCeiling);
            const durum = ACWR_STATUS[key];
            return (
              <>
                <span className={`text-xl font-mono font-bold block mb-1 ${durum.text}`}>
                  {hasEnoughData ? acwr : '—'}
                </span>
                <div className={`text-[10px] font-bold uppercase tracking-widest ${durum.text}`}>{durum.label}</div>
                <p className="text-[9px] font-mono text-zinc-600 leading-snug mt-1">{ACWR_HINT[key]}</p>
              </>
            );
          })()}
        </div>
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">İtme / Çekme Oranı</span>
          {(() => {
            // Veri yokken "dengeli" demek yanıltıcı olur; üç durum ayrı ele alınır.
            const { hasPushPullData, pushPullBalanced, pushPullRatio } = dashboardStats;
            const renk = !hasPushPullData ? 'text-zinc-500' : pushPullBalanced ? 'text-emerald-500' : 'text-orange-400';
            const etiket = !hasPushPullData ? 'Veri Yok' : pushPullBalanced ? 'Dengeli' : 'Dengesiz (Risk)';
            return (
              <>
                <span className={`text-xl font-mono font-bold block mb-1 ${renk}`}>{pushPullRatio}</span>
                <div className={`text-[10px] font-bold uppercase tracking-widest ${renk}`}>{etiket}</div>
              </>
            );
          })()}
        </div>
      </div>

      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
        {/* 16 satırlık liste ana sayfayı çok uzatıyor; varsayılan olarak kapalı
            gelir. Kapalıyken bile kaç kasın eşik altında/üstünde olduğu görünür,
            böylece açmadan da durum anlaşılır. */}
        <button
          onClick={() => onToggleMuscleVolume?.()}
          aria-expanded={showMuscleVolume}
          className="w-full flex justify-between items-center px-4 py-3 bg-zinc-950/60 active:bg-zinc-900 transition-colors text-left"
        >
          <h3 className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider flex items-center">
            <Target size={13} className="mr-2 text-cyan-400" /> Haftalık Kas Hacmi
          </h3>
          <span className="flex items-center gap-2 shrink-0">
            {!showMuscleVolume && (() => {
              const stats = MUSCLE_SECTIONS.flatMap(s => s.muscles).reduce((acc, muscle) => {
                const key = volumeStatusOf(dashboardStats.muscleVolume[muscle] || 0, muscle, experienceLevel);
                acc[key] = (acc[key] || 0) + 1;
                return acc;
              }, {});
              const under = (stats.none || 0) + (stats.under || 0);
              const over = stats.over || 0;
              return (
                <span className="text-[9px] font-mono text-zinc-500">
                  {under > 0 && <span className="text-cyan-400">{under} eksik</span>}
                  {under > 0 && over > 0 && ' · '}
                  {over > 0 && <span className="text-orange-400">{over} tavan üstü</span>}
                  {under === 0 && over === 0 && <span className="text-emerald-400">hepsi verimli</span>}
                </span>
              );
            })()}
            <ChevronDown
              size={15}
              className={`text-zinc-500 transition-transform duration-200 ${showMuscleVolume ? 'rotate-180' : ''}`}
            />
          </span>
        </button>

        {showMuscleVolume && (
        <>
        <div className="px-4 py-2 border-y border-zinc-800 bg-zinc-950/40">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">MEV / MAV / MRV</span>
        </div>

        {/* 16 kas grubu tek listede uzun kalıyor; bölgelere ayrılıyor. */}
        <div className="p-4 space-y-4">
          {MUSCLE_SECTIONS.map(section => (
            <div key={section.title} className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{section.title}</h4>

              {section.muscles.map(muscle => {
                const vol = dashboardStats.muscleVolume[muscle] || 0;
                const landmark = getVolumeLandmarks(muscle, experienceLevel);
                const percentage = Math.min(100, Math.round((vol / landmark.mav) * 100));
                const status = VOLUME_STATUS[volumeStatusOf(vol, muscle, experienceLevel)];

                return (
                  <button
                    key={muscle}
                    onClick={() => onSelectMuscle?.(muscle)}
                    className="w-full space-y-1 text-left active:opacity-70 transition-opacity"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[11px] text-zinc-200 font-bold truncate">{muscle}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border shrink-0 ${status.chip}`}>{status.label}</span>
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                        <strong className="text-zinc-100">{vol}</strong>/{landmark.mav}
                        <span className="text-zinc-600"> (MEV {landmark.mev})</span>
                      </span>
                    </div>
                    <div className="w-full bg-zinc-950 rounded-full h-1.5 border border-zinc-800">
                      <div className={`h-1.5 rounded-full transition-all duration-500 ${status.bar}`} style={{ width: `${percentage}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        </>
        )}
      </div>

      <button onClick={() => handleStartRequest()} className="w-full bg-cyan-600 active:bg-cyan-700 text-white font-bold py-4 px-4 rounded-2xl flex justify-center items-center uppercase tracking-wide text-sm shadow-lg shadow-cyan-900/20 transition-all">
        <Zap size={18} className="mr-2" /> Antrenman Başlat
      </button>

      <button
        onClick={() => onOpenTools?.()}
        className="w-full bg-zinc-900 active:bg-zinc-800 border border-zinc-800 text-zinc-200 font-bold py-3.5 px-4 rounded-2xl flex justify-center items-center uppercase tracking-wide text-xs transition-colors"
      >
        <Wrench size={16} className="mr-2 text-cyan-400" /> Araçlar
        <span className="ml-2 text-[10px] font-mono text-zinc-500 normal-case tracking-normal">
          kütüphane · program · kardiyo
        </span>
      </button>

      {weeklyCardioKcal > 0 && (
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-zinc-500">
          <Flame size={11} className="text-red-400" />
          Bu hafta kardiyodan {weeklyCardioKcal} kcal
        </div>
      )}

      {/* Bölüm liste boşken de görünür: eskiden tamamen gizleniyordu ve
          kullanıcı şablon diye bir özellik olduğunu fark edemiyordu. */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/60">
          <h3 className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider flex items-center">
            <BookmarkPlus size={13} className="mr-2 text-cyan-400" /> Şablonlar
          </h3>
        </div>

        {templates.length === 0 ? (
          <div className="p-5 text-center space-y-2.5">
            <div className="w-10 h-10 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center mx-auto">
              <BookmarkPlus size={16} className="text-zinc-600" />
            </div>
            <p className="text-[11px] font-bold text-zinc-300">Henüz şablon yok</p>
            <p className="text-[10px] font-mono text-zinc-600 leading-relaxed">
              Sık yaptığın antrenmanı şablona çevirirsen tek dokunuşla başlatırsın.
              Antrenman bitince &quot;Şablon Yap&quot; ile kaydedebilir ya da baştan
              bir program kurabilirsin.
            </p>
            <button
              onClick={() => onOpenTemplateBuilder?.()}
              className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/30 border border-cyan-900/50 active:bg-cyan-900/40 px-4 py-2 rounded-xl transition-colors"
            >
              Program Oluştur
            </button>
          </div>
        ) : (
          <>
          <div className="divide-y divide-zinc-800">
            {templates.map(t => {
              // Kart üzerinde kısa önizleme: süre, set ve en çok yüklenen üç bölge.
              const { byMuscle, totalSets } = previewTemplateVolume(t.exercises, customExercises);
              const minutes = estimateDuration(t.exercises, restSeconds);
              const top = Object.entries(byMuscle).sort((a, b) => b[1] - a[1]).slice(0, 3);

              return (
                <div key={t.id} className="p-3 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <button
                      onClick={() => onPreviewTemplate?.(t)}
                      className="min-w-0 flex-1 text-left active:opacity-70 transition-opacity"
                    >
                      <span className="text-xs font-bold text-cyan-400 truncate flex items-center">
                        <span className="truncate">{t.name}</span>
                        <ChevronRight size={13} className="ml-1 shrink-0 text-zinc-600" />
                      </span>
                      <span className="flex items-center gap-3 mt-1 text-[10px] font-mono text-zinc-500">
                        <span className="flex items-center"><Clock size={10} className="mr-1" />~{minutes} dk</span>
                        <span className="flex items-center"><Layers size={10} className="mr-1" />{totalSets} set</span>
                      </span>
                    </button>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => handleStartRequest(t)} className="bg-cyan-900/30 active:bg-cyan-900/60 text-cyan-400 border border-cyan-800 text-[10px] font-bold py-1.5 px-3 rounded-lg uppercase tracking-wider">Başlat</button>
                      <button onClick={() => onEditTemplate?.(t)} title="Şablonu düzenle" aria-label="Şablonu düzenle" className="text-zinc-600 active:text-cyan-400 p-1.5"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteConfirm({ isOpen: true, type: 'template', id: t.id })} title="Şablonu sil" aria-label="Şablonu sil" className="text-zinc-600 active:text-red-500 p-1.5"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  {top.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {top.map(([m, v]) => (
                        <span key={m} className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-400">
                          {m} <strong className="text-cyan-400">{v}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </>
        )}
      </div>
    </div>
  );
});

HomeView.displayName = 'HomeView';

export default HomeView;
