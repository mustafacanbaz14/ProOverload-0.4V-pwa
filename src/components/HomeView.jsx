import React, { memo } from 'react';
import { AlertCircle, Activity, Target, Zap, BookmarkPlus, Trash2, Trophy } from 'lucide-react';
import { MUSCLE_VOLUME_LANDMARKS } from '../utils/constants';
import MuscleHeatmap from './MuscleHeatmap';

const HomeView = memo(({
  needsBackup,
  dashboardStats,
  templates,
  setIsSettingsModalOpen,
  handleStartRequest,
  setDeleteConfirm,
  setIsReportCardOpen,
}) => {
  return (
    <div className="p-4 space-y-5 pb-24 h-full overflow-y-auto hide-scrollbar bg-black">

      {needsBackup && (
        <div className="bg-orange-900/20 border border-orange-900/50 p-3 rounded-2xl flex items-start space-x-3">
          <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={16} />
          <div className="flex-1">
            <h4 className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Yedekleme Uyarısı</h4>
            <p className="text-[9px] text-orange-300 mt-1 font-mono">Verilerinizi en son 7 günden uzun süre önce yedeklediniz veya hiç yedeklemediniz. Cihaz hafızası temizlenirse verileriniz kaybolur.</p>
          </div>
          <button onClick={() => setIsSettingsModalOpen(true)} className="text-[9px] bg-orange-500/20 text-orange-400 px-3 py-2 rounded-xl font-bold uppercase tracking-wider hover:bg-orange-500/30 transition-colors">Aç</button>
        </div>
      )}

      {dashboardStats.isDeloadNeeded && (
        <div className="bg-red-900/20 border border-red-900/50 p-3 rounded-2xl flex items-start space-x-3">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
          <div>
            <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Dinlenme (Deload) İhtiyacı</h4>
            <p className="text-[9px] text-red-300 mt-1 font-mono">Yorgunluk sınırını aştınız. Bu hafta çalıştığınız set sayılarını veya ağırlıkları %30 oranında düşürün.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-5"><Activity size={64} /></div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 z-10">Bu Hafta</span>
          <span className="text-2xl font-mono text-zinc-100 z-10">{dashboardStats.thisWeekSessions} <span className="text-xs text-zinc-500">Antrenman</span></span>
        </div>
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-5"><Target size={64} /></div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 z-10">Haftalık Hacim</span>
          <span className="text-2xl font-mono text-cyan-400 z-10">{dashboardStats.thisWeekEffectiveSets} <span className="text-xs text-zinc-500">Set</span></span>
        </div>
      </div>

      {/* Antrenman Raporu Karnesi Oluştur Butonu */}
      <button
        onClick={() => setIsReportCardOpen(true)}
        className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-yellow-400 font-bold py-3 px-4 rounded-2xl flex items-center justify-center space-x-2 uppercase tracking-wide text-xs transition-colors"
      >
        <Trophy size={16} />
        <span>Gelişim Raporu Karnesi Oluştur</span>
      </button>

      {/* İnteraktif Kas Isı Haritası */}
      <MuscleHeatmap muscleVolume={dashboardStats.muscleVolume} />

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Aşırı Yük Riski (ACWR)</span>
          <span className={`text-xl font-mono font-bold block mb-1 ${dashboardStats.acwr < 0.8 ? 'text-blue-400' : dashboardStats.acwr > 1.3 ? 'text-red-500' : 'text-emerald-500'}`}>{dashboardStats.acwr}</span>
          <div className={`text-[8px] font-bold uppercase tracking-widest ${dashboardStats.acwr < 0.8 ? 'text-blue-400' : dashboardStats.acwr > 1.3 ? 'text-red-500' : 'text-emerald-500'}`}>
            {dashboardStats.acwr < 0.8 ? 'Yetersiz' : dashboardStats.acwr > 1.3 ? 'Riskli' : 'İdeal'}
          </div>
        </div>
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">İtme / Çekme Oranı</span>
          {(() => {
            // Veri yokken "dengeli" demek yanıltıcı olur; üç durum ayrı ele alınır.
            const { hasPushPullData, pushPullBalanced, pushPullRatio } = dashboardStats;
            const renk = !hasPushPullData ? 'text-zinc-500' : pushPullBalanced ? 'text-emerald-500' : 'text-orange-400';
            const etiket = !hasPushPullData ? 'Veri Yok' : pushPullBalanced ? 'Dengeli' : 'Dengesiz (Risk)';
            return (
              <>
                <span className={`text-xl font-mono font-bold block mb-1 ${renk}`}>{pushPullRatio}</span>
                <div className={`text-[8px] font-bold uppercase tracking-widest ${renk}`}>{etiket}</div>
              </>
            );
          })()}
        </div>
      </div>

      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 space-y-3">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
          <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center">
            <Target size={12} className="mr-1.5 text-cyan-400" /> Haftalık Kas Hacmi & Rehber (MEV / MAV / MRV)
          </h3>
        </div>
        <div className="space-y-3 pt-1">
          {Object.entries(dashboardStats.muscleVolume).map(([muscle, vol]) => {
            const landmark = MUSCLE_VOLUME_LANDMARKS[muscle] || { mev: 8, mav: 16, mrv: 22 };
            const mavTarget = landmark.mav;
            const percentage = Math.min(100, Math.round((vol / mavTarget) * 100));

            let statusLabel = 'Düşük (İdame)';
            let statusColor = 'text-amber-400 bg-amber-950/40 border-amber-900/40';
            let barColor = 'bg-amber-500';

            if (vol >= landmark.mev && vol <= landmark.mav) {
              statusLabel = 'Optimal (MAV)';
              statusColor = 'text-emerald-400 bg-emerald-950/40 border-emerald-900/40';
              barColor = 'bg-emerald-500';
            } else if (vol > landmark.mav && vol <= landmark.mrv) {
              statusLabel = 'Yüksek Hacim';
              statusColor = 'text-cyan-400 bg-cyan-950/40 border-cyan-900/40';
              barColor = 'bg-cyan-500';
            } else if (vol > landmark.mrv) {
              statusLabel = 'Aşırı Yükleme (MRV)';
              statusColor = 'text-red-400 bg-red-950/40 border-red-900/40';
              barColor = 'bg-red-500';
            }

            return (
              <div key={muscle} className="space-y-1">
                <div className="flex justify-between text-[9px] text-zinc-300 font-mono uppercase font-bold items-center">
                  <span className="flex items-center gap-1.5">
                    {muscle}
                    <span className={`text-[8px] px-1.5 py-0.5 rounded border ${statusColor}`}>{statusLabel}</span>
                  </span>
                  <span className="text-zinc-400 font-mono">
                    <strong className="text-zinc-100">{vol}</strong> / {mavTarget} Set <span className="text-zinc-500 text-[8px]">(MEV:{landmark.mev})</span>
                  </span>
                </div>
                <div className="w-full bg-zinc-950 rounded-full h-1.5 border border-zinc-800">
                  <div className={`h-1.5 rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${percentage}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={() => handleStartRequest()} className="w-full bg-cyan-600 active:bg-cyan-700 text-white font-bold py-4 px-4 rounded-2xl flex justify-center items-center uppercase tracking-wide text-sm shadow-lg shadow-cyan-900/20 transition-all">
        <Zap size={18} className="mr-2" /> Antrenman Başlat
      </button>

      {templates.length > 0 && (
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="p-3 border-b border-zinc-800 bg-zinc-950/50">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center"><BookmarkPlus size={12} className="mr-2 text-cyan-500" /> Şablonlar</h3>
          </div>
          <div className="divide-y divide-zinc-800">
            {templates.map(t => (
              <div key={t.id} className="p-3 flex justify-between items-center">
                <span className="text-xs font-bold text-cyan-400 truncate pr-2">{t.name}</span>
                <div className="flex items-center space-x-2 shrink-0">
                  <button onClick={() => handleStartRequest(t)} className="bg-cyan-900/30 active:bg-cyan-900/60 text-cyan-400 border border-cyan-800 text-[10px] font-bold py-1.5 px-3 rounded-lg uppercase tracking-wider">Başlat</button>
                  <button onClick={() => setDeleteConfirm({ isOpen: true, type: 'template', id: t.id })} className="text-zinc-600 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

HomeView.displayName = 'HomeView';

export default HomeView;
