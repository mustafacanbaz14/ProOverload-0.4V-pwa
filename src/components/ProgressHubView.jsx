import React, { memo } from 'react';
import { Scale, LineChart, CalendarDays } from 'lucide-react';
import MetricsView from './MetricsView';
import AnalyticsView from './AnalyticsView';
import CycleView from './CycleView';

const ProgressHubView = memo(({ tab, setTab, metricsProps, analyticsProps, gender = 'male', cycleProps }) => {
  const visibleTab = gender === 'female' ? tab : tab === 'cycle' ? 'body' : tab;
  return <div className="h-full flex flex-col bg-black">
    <div className="px-4 pt-4 pb-2 shrink-0">
      <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">Gelişim Merkezi</span>
      <div className={`grid ${gender === 'female' ? 'grid-cols-3' : 'grid-cols-2'} bg-zinc-900 p-1 rounded-2xl border border-zinc-800 mt-2`}>
        <button onClick={() => setTab('body')} className={`py-2.5 rounded-xl text-[11px] font-bold flex justify-center items-center gap-1.5 ${visibleTab === 'body' ? 'bg-cyan-600 text-white' : 'text-zinc-500'}`}>
          <Scale size={14} /> Vücut & Hedefler
        </button>
        <button onClick={() => setTab('analysis')} className={`py-2.5 rounded-xl text-[11px] font-bold flex justify-center items-center gap-1.5 ${visibleTab === 'analysis' ? 'bg-emerald-600 text-white' : 'text-zinc-500'}`}>
          <LineChart size={14} /> Analizler
        </button>
        {gender === 'female' && (
          <button onClick={() => setTab('cycle')} className={`py-2.5 rounded-xl text-[11px] font-bold flex justify-center items-center gap-1.5 ${visibleTab === 'cycle' ? 'bg-rose-600 text-white' : 'text-zinc-500'}`}>
            <CalendarDays size={14} /> Döngü
          </button>
        )}
      </div>
    </div>
    <div className="flex-1 min-h-0">
      {visibleTab === 'body'
        ? <MetricsView {...metricsProps} embedded />
        : visibleTab === 'cycle'
          ? <CycleView {...cycleProps} embedded />
          : <AnalyticsView {...analyticsProps} embedded />}
    </div>
  </div>
});

ProgressHubView.displayName = 'ProgressHubView';
export default ProgressHubView;
