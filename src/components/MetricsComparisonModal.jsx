import React, { useState, memo } from 'react';
import { X, Scale, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { parseNumber, computeComposition } from '../utils/helpers';
import { BODY_METRICS } from '../utils/constants';

const MetricsComparisonModal = memo(({ isOpen, onClose, metricsHistory = [] }) => {
  const sortedMetrics = [...metricsHistory].sort((a, b) => new Date(b.date) - new Date(a.date));

  const [dateA, setDateA] = useState(sortedMetrics[1]?.date || sortedMetrics[0]?.date || '');
  const [dateB, setDateB] = useState(sortedMetrics[0]?.date || '');

  if (!isOpen) return null;

  const recordA = sortedMetrics.find(m => m.date === dateA) || sortedMetrics[0];
  const recordB = sortedMetrics.find(m => m.date === dateB) || sortedMetrics[0];

  const compA = recordA ? computeComposition(recordA) : null;
  const compB = recordB ? computeComposition(recordB) : null;

  const calcDiff = (valA, valB) => {
    const a = parseNumber(valA);
    const b = parseNumber(valB);
    if (!a || !b) return null;
    const diff = Math.round((b - a) * 10) / 10;
    const pct = Math.round(((b - a) / a) * 1000) / 10;
    return { diff, pct };
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[88vh]">
        {/* Üst Bar */}
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
          <div className="flex items-center space-x-2">
            <Scale size={18} className="text-cyan-400" />
            <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">Dönemsel Ölçüm Kıyaslama</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 p-1">
            <X size={16} />
          </button>
        </div>

        {/* Tarih Seçimi */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 grid grid-cols-2 gap-2 text-xs font-mono">
          <div>
            <label className="text-[10px] text-zinc-500 uppercase block mb-1 font-bold">1. Tarih (Önce)</label>
            <select
              value={dateA}
              onChange={(e) => setDateA(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-zinc-300 text-[11px] outline-none"
            >
              {sortedMetrics.map(m => (
                <option key={`a-${m.id || m.date}`} value={m.date}>{new Date(m.date).toLocaleDateString('tr-TR')} ({m.weight}kg)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-zinc-500 uppercase block mb-1 font-bold">2. Tarih (Sonra)</label>
            <select
              value={dateB}
              onChange={(e) => setDateB(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-cyan-400 font-bold text-[11px] outline-none"
            >
              {sortedMetrics.map(m => (
                <option key={`b-${m.id || m.date}`} value={m.date}>{new Date(m.date).toLocaleDateString('tr-TR')} ({m.weight}kg)</option>
              ))}
            </select>
          </div>
        </div>

        {/* Kıyaslama Tablosu */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 hide-scrollbar">
          {(!recordA || !recordB) ? (
            <div className="text-center py-10 text-zinc-600 text-xs font-mono">Kıyaslanacak kayıt bulunamadı</div>
          ) : (
            <>
              {/* Temel Metrikler */}
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-2 font-mono text-xs">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block border-b border-zinc-800 pb-1">Vücut Kompozisyonu</span>

                {/* Kilo */}
                {(() => {
                  const res = calcDiff(recordA.weight, recordB.weight);
                  return (
                    <div className="flex justify-between items-center text-zinc-300">
                      <span>Kilo:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-zinc-500">{recordA.weight}kg</span>
                        <ArrowRight size={10} className="text-zinc-600" />
                        <span className="font-bold text-zinc-100">{recordB.weight}kg</span>
                        {res && (
                          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${res.diff > 0 ? 'bg-emerald-950 text-emerald-400' : res.diff < 0 ? 'bg-orange-950 text-orange-400' : 'bg-zinc-800 text-zinc-400'}`}>
                            {res.diff > 0 ? `+${res.diff}` : res.diff}kg (%{res.pct})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Yağ Oranı */}
                {compA && compB && (() => {
                  const res = calcDiff(compA.activeBF, compB.activeBF);
                  return (
                    <div className="flex justify-between items-center text-zinc-300">
                      <span>Yağ Oranı:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-zinc-500">%{compA.activeBF}</span>
                        <ArrowRight size={10} className="text-zinc-600" />
                        <span className="font-bold text-cyan-400">%{compB.activeBF}</span>
                        {res && (
                          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${res.diff < 0 ? 'bg-emerald-950 text-emerald-400' : res.diff > 0 ? 'bg-red-950 text-red-400' : 'bg-zinc-800 text-zinc-400'}`}>
                            {res.diff > 0 ? `+${res.diff}` : res.diff}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Kas Kütlesi (FFM) */}
                {compA && compB && (() => {
                  const res = calcDiff(compA.ffm, compB.ffm);
                  return (
                    <div className="flex justify-between items-center text-zinc-300">
                      <span>Kas (FFM):</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-zinc-500">{compA.ffm}kg</span>
                        <ArrowRight size={10} className="text-zinc-600" />
                        <span className="font-bold text-emerald-400">{compB.ffm}kg</span>
                        {res && (
                          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${res.diff > 0 ? 'bg-emerald-950 text-emerald-400' : res.diff < 0 ? 'bg-red-950 text-red-400' : 'bg-zinc-800 text-zinc-400'}`}>
                            {res.diff > 0 ? `+${res.diff}` : res.diff}kg
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Bölgesel Ölçüm Kıyaslamaları */}
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-2 font-mono text-xs">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block border-b border-zinc-800 pb-1">Bölgesel Kas Ölçüleri (cm)</span>

                {BODY_METRICS.filter(m => m.key !== 'weight').map(m => {
                  const valA = recordA.measurements?.[m.key];
                  const valB = recordB.measurements?.[m.key];
                  const res = calcDiff(valA, valB);
                  if (!valA && !valB) return null;

                  return (
                    <div key={m.key} className="flex justify-between items-center text-zinc-300">
                      <span>{m.label}:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-zinc-500">{valA || '-'}cm</span>
                        <ArrowRight size={10} className="text-zinc-600" />
                        <span className="font-bold text-zinc-100">{valB || '-'}cm</span>
                        {res && (
                          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${res.diff > 0 ? 'bg-cyan-950 text-cyan-400' : res.diff < 0 ? 'bg-orange-950 text-orange-400' : 'bg-zinc-800 text-zinc-400'}`}>
                            {res.diff > 0 ? `+${res.diff}` : res.diff}cm
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

MetricsComparisonModal.displayName = 'MetricsComparisonModal';

export default MetricsComparisonModal;
