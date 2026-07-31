import React, { memo } from 'react';
import { Scale, LineChart } from 'lucide-react';
import MetricsView from './MetricsView';
import AnalyticsView from './AnalyticsView';

const ProgressHubView = memo(({ tab, setTab, metricsProps, analyticsProps }) => (
  <div className="h-full flex flex-col bg-black">
    <div className="px-4 pt-4 pb-2 shrink-0">
      <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">Gelişim Merkezi</span>
      <div className="grid grid-cols-2 bg-zinc-900 p-1 rounded-2xl border border-zinc-800 mt-2">
        <button onClick={() => setTab('body')} className={`py-2.5 rounded-xl text-[11px] font-bold flex justify-center items-center gap-1.5 ${tab === 'body' ? 'bg-cyan-600 text-white' : 'text-zinc-500'}`}>
          <Scale size={14} /> Vücut & Hedefler
        </button>
        <button onClick={() => setTab('analysis')} className={`py-2.5 rounded-xl text-[11px] font-bold flex justify-center items-center gap-1.5 ${tab === 'analysis' ? 'bg-emerald-600 text-white' : 'text-zinc-500'}`}>
          <LineChart size={14} /> Analizler
        </button>
      </div>
    </div>
    <div className="flex-1 min-h-0">
      {tab === 'body' ? <MetricsView {...metricsProps} embedded /> : <AnalyticsView {...analyticsProps} embedded />}
    </div>
  </div>
));

ProgressHubView.displayName = 'ProgressHubView';
export default ProgressHubView;
