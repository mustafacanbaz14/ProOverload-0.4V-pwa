import React from 'react';
import { AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { APP_VERSION } from '../utils/constants';
import { buildEmergencyBackup } from '../utils/emergencyBackup';

const downloadEmergencyBackup = () => {
  const backup = buildEmergencyBackup(localStorage);
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ProOverload_Acil_Yedek_${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

class AppErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('ProOverload arayüz hatası', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="min-h-[100dvh] bg-black text-zinc-100 flex items-center justify-center p-5">
        <section className="w-full max-w-sm rounded-3xl border border-red-900/60 bg-zinc-950 p-5 shadow-2xl">
          <span className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-900/60 flex items-center justify-center text-red-400">
            <AlertTriangle size={23} />
          </span>
          <span className="text-[9px] font-mono uppercase tracking-widest text-red-400 block mt-4">Güvenli Kurtarma · v{APP_VERSION}</span>
          <h1 className="text-lg font-black mt-1">Uygulama ekranı açılamadı</h1>
          <p className="text-[11px] font-mono text-zinc-400 leading-relaxed mt-2">
            Kayıtların tarayıcıda duruyor. Önce acil yedeği indir, ardından uygulamayı yeniden yükle.
          </p>
          <div className="space-y-2 mt-5">
            <button onClick={downloadEmergencyBackup} className="w-full rounded-xl bg-red-600 py-3 text-xs font-bold text-white flex items-center justify-center gap-2">
              <Download size={15} /> Acil Yedeği İndir
            </button>
            <button onClick={() => window.location.reload()} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-3 text-xs font-bold text-zinc-200 flex items-center justify-center gap-2">
              <RefreshCw size={15} /> Uygulamayı Yeniden Yükle
            </button>
          </div>
          <details className="mt-4 text-[9px] font-mono text-zinc-600">
            <summary className="cursor-pointer">Teknik ayrıntı</summary>
            <p className="mt-2 break-words">{String(this.state.error?.message || this.state.error)}</p>
          </details>
        </section>
      </main>
    );
  }
}

export default AppErrorBoundary;
