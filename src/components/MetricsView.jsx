import React, { memo } from 'react';
import { User, Scale, Ruler, Info, Save, ArrowRightLeft } from 'lucide-react';
import { BODY_METRICS } from '../utils/constants';

const MetricsView = memo(({
  currentMetricsForm,
  setCurrentMetricsForm,
  computedComp,
  handleSaveMetrics,
  setIsMeasurementGuideOpen,
  isMeasurementGuideOpen,
  setIsComparisonOpen,
}) => {
  const updateMetricsField = (field, value) => {
    setCurrentMetricsForm(prev => ({ ...prev, [field]: value }));
  };

  const updateMeasurement = (field, value) => {
    setCurrentMetricsForm(prev => ({
      ...prev,
      measurements: { ...(prev.measurements || {}), [field]: value }
    }));
  };

  return (
    <div className="p-4 space-y-4 pb-24 h-full overflow-y-auto hide-scrollbar bg-black">
      {/* Kıyaslama Butonu */}
      <button
        onClick={() => setIsComparisonOpen(true)}
        className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-cyan-400 font-bold py-3 px-4 rounded-2xl flex justify-center items-center uppercase tracking-wide text-xs transition-colors"
      >
        <ArrowRightLeft size={16} className="mr-2" /> Dönemsel Ölçüm Kıyaslayıcı (Before / After)
      </button>

      {/* Genel Profil Formu */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 space-y-3">
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center border-b border-zinc-800 pb-2">
          <User size={12} className="mr-1.5 text-cyan-400" /> Profil ve Temel Ölçümler
        </h3>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">Cinsiyet</label>
            <select
              value={currentMetricsForm.gender}
              onChange={(e) => updateMetricsField('gender', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-zinc-200 font-mono outline-none"
            >
              <option value="male">Erkek</option>
              <option value="female">Kadın</option>
            </select>
          </div>
          <div>
            <label className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">Yaş</label>
            <input
              type="number"
              value={currentMetricsForm.age}
              onChange={(e) => updateMetricsField('age', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-zinc-200 font-mono outline-none text-center"
            />
          </div>
          <div>
            <label className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">Boy (cm)</label>
            <input
              type="number"
              value={currentMetricsForm.height}
              onChange={(e) => updateMetricsField('height', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-zinc-200 font-mono outline-none text-center"
            />
          </div>
          <div>
            <label className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">Kilo (kg)</label>
            <input
              type="number"
              step="0.1"
              value={currentMetricsForm.weight}
              onChange={(e) => updateMetricsField('weight', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-cyan-400 font-mono outline-none font-bold text-center"
            />
          </div>
        </div>
      </div>

      {/* Hesaplanan Vücut Kompozisyonu Kartı */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 space-y-3">
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center border-b border-zinc-800 pb-2">
          <Scale size={12} className="mr-1.5 text-cyan-400" /> Analiz Edilen Vücut Kompozisyonu
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
            <span className="text-zinc-500 block text-[8px] uppercase font-bold">Aktif Yağ Oranı</span>
            <span className="text-cyan-400 font-bold text-base">%{computedComp.activeBF}</span>
          </div>
          <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
            <span className="text-zinc-500 block text-[8px] uppercase font-bold">Kas Kütlesi (FFM)</span>
            <span className="text-emerald-400 font-bold text-base">{computedComp.ffm} kg</span>
          </div>
          <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
            <span className="text-zinc-500 block text-[8px] uppercase font-bold">FFMI İndeksi</span>
            <span className="text-zinc-200 font-bold text-base">{computedComp.ffmi}</span>
          </div>
          <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
            <span className="text-zinc-500 block text-[8px] uppercase font-bold">BMR (Bazal Kalori)</span>
            <span className="text-amber-400 font-bold text-base">{computedComp.bmr} kcal</span>
          </div>
        </div>

        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-1.5 text-[9px] font-mono text-zinc-300">
          <div className="flex justify-between"><span>Genetik Potansiyel (FFMI):</span> <strong className="text-cyan-400">%{computedComp.potentialAchieved} (%{computedComp.maxPotentialFFMI} Max)</strong></div>
          <div className="flex justify-between"><span>İskelet Çatısı:</span> <strong className="text-zinc-200">{computedComp.frameSize}</strong></div>
          <div className="flex justify-between"><span>Max Doğal Kilo:</span> <strong className="text-emerald-400">{computedComp.maxNaturalWeight} kg</strong></div>
        </div>

        <div className="bg-cyan-950/20 border border-cyan-900/30 p-3 rounded-xl space-y-1 text-[9px] font-mono">
          <span className="text-cyan-400 font-bold uppercase block text-[8px]">Tavsiye & Periyotlama</span>
          <p className="text-zinc-300 leading-relaxed">{computedComp.trainingAdvice}</p>
        </div>
      </div>

      {/* Bölgesel Ölçümler */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 space-y-3">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
          <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center">
            <Ruler size={12} className="mr-1.5 text-cyan-400" /> Bölgesel Kas Ölçüleri (cm)
          </h3>
          <button
            onClick={() => setIsMeasurementGuideOpen(!isMeasurementGuideOpen)}
            className="text-[9px] text-cyan-400 hover:text-cyan-300 flex items-center font-mono"
          >
            <Info size={10} className="mr-1" /> Ölçüm Rehberi
          </button>
        </div>

        {isMeasurementGuideOpen && (
          <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-[9px] font-mono text-zinc-400 space-y-1.5">
            <p><strong>Kol:</strong> Pazu sıkılıyken en geniş nokta.</p>
            <p><strong>Bel:</strong> Göbek deliğinin hemen 2 cm üstünden rahat durumda.</p>
            <p><strong>Göğüs:</strong> Meme başı seviyesinden nefes verdikten sonra.</p>
            <p><strong>Uyluk:</strong> Kasık altından en kalın bölge.</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5 text-xs">
          {BODY_METRICS.filter(m => m.key !== 'weight').map(m => (
            <div key={m.key} className="bg-zinc-950 p-2 rounded-xl border border-zinc-800 flex justify-between items-center">
              <span className="text-[9px] font-mono text-zinc-400">{m.label}</span>
              <input
                type="number"
                step="0.5"
                value={currentMetricsForm.measurements?.[m.key] || ''}
                onChange={(e) => updateMeasurement(m.key, e.target.value)}
                placeholder="0"
                className="w-16 bg-zinc-900 border border-zinc-800 rounded-lg p-1 font-mono text-xs text-center text-cyan-400 outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSaveMetrics}
        className="w-full bg-cyan-600 active:bg-cyan-700 text-white font-bold py-3.5 px-4 rounded-2xl flex justify-center items-center uppercase tracking-wide text-xs shadow-lg shadow-cyan-900/20 transition-all"
      >
        <Save size={16} className="mr-2" /> Ölçüm Kaydını Sakla
      </button>
    </div>
  );
});

MetricsView.displayName = 'MetricsView';

export default MetricsView;
