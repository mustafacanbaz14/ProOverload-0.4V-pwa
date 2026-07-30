import React, { memo } from 'react';
import { User, Scale, Ruler, Info, Save, ArrowRightLeft, Calendar, Droplet, History } from 'lucide-react';
import { BODY_METRICS, FAT_METHOD_LABELS } from '../utils/constants';
import { parseNumber, clampNumber, INPUT_LIMITS } from '../utils/helpers';
import MeasurementGuide from './MeasurementGuide';
import GoalsCard from './GoalsCard';
import { computeBMI, BMI_STATUS_COLOR } from '../utils/goals';

// Kaliper ölçüm noktaları. 3 bölge yöntemi cinsiyete göre farklı noktalar kullanır,
// 7 bölge yönteminde hepsi girilir.
const SKINFOLD_SITES = [
  { key: 'chest', label: 'Göğüs', male3: true, female3: false },
  { key: 'abdomen', label: 'Karın', male3: true, female3: false },
  { key: 'thigh', label: 'Uyluk', male3: true, female3: true },
  { key: 'triceps', label: 'Triceps', male3: false, female3: true },
  { key: 'suprailiac', label: 'Suprailiak', male3: false, female3: true },
  { key: 'axilla', label: 'Aksilla', male3: false, female3: false },
  { key: 'subscapular', label: 'Subskapular', male3: false, female3: false },
];

const Section = ({ icon, title, action, children }) => (
  <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
    <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-800 bg-zinc-950/60">
      <h3 className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider flex items-center">
        <span className="mr-2 text-cyan-400 flex items-center">{icon}</span>{title}
      </h3>
      {action}
    </div>
    <div className="p-4 space-y-3">{children}</div>
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1.5">{label}</label>
    {children}
  </div>
);

const inputClass = 'w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-zinc-200 font-mono text-sm outline-none focus:border-cyan-600 transition-colors';

const MetricsView = memo(({
  currentMetricsForm,
  setCurrentMetricsForm,
  computedComp,
  handleSaveMetrics,
  setIsMeasurementGuideOpen,
  isMeasurementGuideOpen,
  setIsComparisonOpen,
  latestMetrics,
  isExistingRecord,
  settings = {},
  setSettings,
  goalValues = {},
  weeklyKg = 0,
}) => {
  const form = currentMetricsForm;

  const updateField = (field, value) =>
    setCurrentMetricsForm(prev => ({ ...prev, [field]: value }));

  // Sınırlama odaktan çıkışta uygulanır: yazarken her tuşta alt sınıra
  // zıplamak "17" yazmaya çalışan kullanıcıyı engellerdi.
  const clampFieldOnBlur = (field, limit) => (e) =>
    updateField(field, clampNumber(e.target.value, limit.min, limit.max));

  const updateMeasurement = (field, value) =>
    setCurrentMetricsForm(prev => ({
      ...prev,
      measurements: { ...(prev.measurements || {}), [field]: value }
    }));

  const updateSkinfold = (field, value) =>
    setCurrentMetricsForm(prev => ({
      ...prev,
      skinfolds: { ...(prev.skinfolds || {}), [field]: value }
    }));

  // Son kaydedilen ölçümün tüm değerlerini forma taşır, tarihi korur.
  const fillFromLatest = () => {
    if (!latestMetrics) return;
    setCurrentMetricsForm(prev => ({
      ...latestMetrics,
      id: prev.id,
      date: prev.date
    }));
  };

  const visibleSites = SKINFOLD_SITES.filter(site => {
    if (form.method === '7') return true;
    return form.gender === 'female' ? site.female3 : site.male3;
  });

  const fatOptions = [
    { key: 'skinfold', value: computedComp.siriBF },
    { key: 'navy', value: computedComp.navyBF },
    { key: 'average', value: computedComp.averageBF },
    { key: 'manual', value: null },
  ];

  return (
    <div className="p-4 space-y-4 pb-28 h-full overflow-y-auto hide-scrollbar bg-black">

      <button
        onClick={() => setIsComparisonOpen(true)}
        className="w-full bg-zinc-900 active:bg-zinc-800 border border-zinc-800 text-cyan-400 font-bold py-3 px-4 rounded-2xl flex justify-center items-center uppercase tracking-wide text-[11px] transition-colors"
      >
        <ArrowRightLeft size={15} className="mr-2" /> Dönemsel Kıyaslama
      </button>

      {/* --- KAYIT TARİHİ --- */}
      <Section icon={<Calendar size={13} />}
        title="Kayıt Tarihi"
        action={
          latestMetrics && (
            <button
              onClick={fillFromLatest}
              className="text-[10px] font-mono text-cyan-400 active:text-cyan-300 flex items-center border border-cyan-900/50 rounded-lg px-2 py-1"
            >
              <History size={10} className="mr-1" /> Son ölçümden doldur
            </button>
          )
        }
      >
        <input
          type="date"
          value={form.date || ''}
          onChange={(e) => updateField('date', e.target.value)}
          className={inputClass}
        />
        <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">
          {isExistingRecord
            ? 'Bu tarihte kayıt var — kaydettiğinde üzerine yazılır.'
            : 'Bu tarihte kayıt yok — kaydettiğinde yeni kayıt oluşur.'}
        </p>
      </Section>

      {/* --- PROFİL --- */}
      <Section icon={<User size={13} />} title="Profil">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cinsiyet">
            <select value={form.gender} onChange={(e) => updateField('gender', e.target.value)} className={inputClass}>
              <option value="male">Erkek</option>
              <option value="female">Kadın</option>
            </select>
          </Field>
          <Field label="Yaş">
            <input type="number" inputMode="numeric" min={INPUT_LIMITS.age.min} max={INPUT_LIMITS.age.max} value={form.age} onChange={(e) => updateField('age', e.target.value)} onBlur={clampFieldOnBlur('age', INPUT_LIMITS.age)} className={`${inputClass} text-center`} />
          </Field>
          <Field label="Boy (cm)">
            <input type="number" inputMode="decimal" min={INPUT_LIMITS.height.min} max={INPUT_LIMITS.height.max} value={form.height} onChange={(e) => updateField('height', e.target.value)} onBlur={clampFieldOnBlur('height', INPUT_LIMITS.height)} className={`${inputClass} text-center`} />
          </Field>
          <Field label="Kilo (kg)">
            <input type="number" inputMode="decimal" step="0.1" min={INPUT_LIMITS.bodyWeight.min} max={INPUT_LIMITS.bodyWeight.max} value={form.weight} onChange={(e) => updateField('weight', e.target.value)} onBlur={clampFieldOnBlur('weight', INPUT_LIMITS.bodyWeight)} className={`${inputClass} text-center text-cyan-400 font-bold`} />
          </Field>
        </div>
      </Section>

      {/* --- YAĞ ORANI YÖNTEMİ --- */}
      <Section icon={<Droplet size={13} />} title="Yağ Oranı Kaynağı">
        <div className="grid grid-cols-4 gap-2">
          {fatOptions.map(opt => {
            const selected = form.fatPreference === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => updateField('fatPreference', opt.key)}
                className={`py-2 px-1 rounded-xl border text-center transition-colors ${selected ? 'bg-cyan-900/25 border-cyan-600' : 'bg-zinc-950 border-zinc-800'}`}
              >
                <span className={`block text-[10px] font-bold uppercase tracking-wide ${selected ? 'text-cyan-400' : 'text-zinc-500'}`}>
                  {FAT_METHOD_LABELS[opt.key].replace(' Bazlı', '')}
                </span>
                <span className={`block text-[11px] font-mono mt-0.5 ${selected ? 'text-zinc-100' : 'text-zinc-500'}`}>
                  {opt.key === 'manual' ? `%${parseNumber(form.bodyFat) || 0}` : (opt.value !== '-' ? `%${opt.value}` : '—')}
                </span>
              </button>
            );
          })}
        </div>

        {form.fatPreference === 'manual' && (
          <Field label="Manuel Yağ Oranı (%)">
            <input
              type="number" inputMode="decimal" step="0.1" min="1" max="70"
              value={form.bodyFat || ''}
              onChange={(e) => updateField('bodyFat', e.target.value)}
              onBlur={(e) => updateField('bodyFat', clampNumber(e.target.value, 1, 70))}
              placeholder="örn. 14.5"
              className={`${inputClass} text-center`}
            />
          </Field>
        )}

        <div className="border-t border-zinc-800 pt-3">
          <div className="flex gap-2 mb-3">
            {['3', '7'].map(m => (
              <button
                key={m}
                onClick={() => updateField('method', m)}
                className={`flex-1 py-2 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-colors ${form.method === m ? 'bg-cyan-900/25 border-cyan-600 text-cyan-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}
              >
                {m} Bölge Kaliper
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {visibleSites.map(site => (
              <div key={site.key}>
                <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">{site.label}</label>
                <input
                  type="number" inputMode="decimal" step="0.5"
                  min={INPUT_LIMITS.skinfold.min} max={INPUT_LIMITS.skinfold.max}
                  value={form.skinfolds?.[site.key] || ''}
                  onChange={(e) => updateSkinfold(site.key, e.target.value)}
                  onBlur={(e) => updateSkinfold(site.key, clampNumber(e.target.value, INPUT_LIMITS.skinfold.min, INPUT_LIMITS.skinfold.max))}
                  placeholder="mm"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 font-mono text-xs text-center outline-none focus:border-cyan-600 transition-colors"
                />
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* --- HESAPLANAN KOMPOZİSYON --- */}
      <Section icon={<Scale size={13} />} title="Hesaplanan Kompozisyon">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Aktif Yağ Oranı', value: `%${computedComp.activeBF}`, color: 'text-cyan-400' },
            { label: 'Yağsız Kütle', value: `${computedComp.ffm} kg`, color: 'text-emerald-400' },
            { label: 'FFMI', value: computedComp.ffmi, color: 'text-zinc-100' },
            { label: 'BMR', value: `${computedComp.bmr} kcal`, color: 'text-amber-400' },
          ].map(item => (
            <div key={item.label} className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
              <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">{item.label}</span>
              <span className={`${item.color} font-bold text-base font-mono`}>{item.value}</span>
            </div>
          ))}
        </div>

        {(() => {
          const bmi = computeBMI(form.weight, form.height, {
            mode: settings.bmiMode || 'athletic',
            bodyFatPct: parseNumber(computedComp.activeBF),
            ffmi: parseNumber(computedComp.ffmi),
            gender: form.gender,
          });
          if (!bmi) return null;
          return (
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                  BMI · {bmi.mode === 'athletic' ? 'Sporcu' : 'Klasik'}
                </span>
                <span className="flex items-baseline gap-1.5">
                  <span className="text-base font-mono font-bold text-zinc-100">{bmi.bmi}</span>
                  <span className={`text-[11px] font-bold ${BMI_STATUS_COLOR[bmi.key]}`}>{bmi.label}</span>
                </span>
              </div>
              {bmi.note && (
                <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">{bmi.note}</p>
              )}
            </div>
          );
        })()}

        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-1.5 text-[10px] font-mono text-zinc-300">
          <div className="flex justify-between"><span>Genetik potansiyel</span> <strong className="text-cyan-400">%{computedComp.potentialAchieved} (max FFMI {computedComp.maxPotentialFFMI})</strong></div>
          <div className="flex justify-between"><span>İskelet çatısı</span> <strong className="text-zinc-200">{computedComp.frameSize}</strong></div>
          <div className="flex justify-between"><span>Max doğal kilo</span> <strong className="text-emerald-400">{computedComp.maxNaturalWeight} kg</strong></div>
          <div className="flex justify-between"><span>Bel/boy oranı</span> <strong className={parseNumber(computedComp.whtr) > 0.5 ? 'text-orange-400' : 'text-emerald-400'}>{computedComp.whtr}</strong></div>
        </div>

        <div className="bg-cyan-950/20 border border-cyan-900/30 p-3 rounded-xl space-y-1">
          <span className="text-cyan-400 font-bold uppercase block text-[10px] tracking-wider">Tavsiye</span>
          <p className="text-zinc-300 leading-relaxed text-[10px] font-mono">{computedComp.trainingAdvice}</p>
        </div>
      </Section>

      {/* Hedefler hesaplanan kompozisyonun hemen altında: karşılaştırılan
          değerler (yağ oranı, yağsız kütle, FFMI) tam üstte duruyor. */}
      <GoalsCard
        settings={settings}
        setSettings={setSettings}
        current={goalValues.current}
        earliest={goalValues.earliest}
        weeklyKg={weeklyKg}
        heightCm={form.height}
      />

      {/* --- ÇEVRE ÖLÇÜLERİ --- */}
      <Section icon={<Ruler size={13} />}
        title="Çevre Ölçüleri (cm)"
        action={
          <button
            onClick={() => setIsMeasurementGuideOpen(!isMeasurementGuideOpen)}
            className="text-[10px] text-cyan-400 flex items-center font-mono border border-cyan-900/50 rounded-lg px-2 py-1"
          >
            <Info size={10} className="mr-1" /> Rehber
          </button>
        }
      >
        {isMeasurementGuideOpen && <MeasurementGuide />}

        <div className="grid grid-cols-2 gap-2.5">
          {BODY_METRICS.filter(m => m.key !== 'weight').map(m => (
            <div key={m.key} className="bg-zinc-950 px-2.5 py-2 rounded-xl border border-zinc-800 flex justify-between items-center">
              <span className="text-[11px] font-mono text-zinc-400">{m.label}</span>
              <input
                type="number" inputMode="decimal" step="0.5"
                min={INPUT_LIMITS.measurement.min} max={INPUT_LIMITS.measurement.max}
                value={form.measurements?.[m.key] || ''}
                onChange={(e) => updateMeasurement(m.key, e.target.value)}
                onBlur={(e) => updateMeasurement(m.key, clampNumber(e.target.value, INPUT_LIMITS.measurement.min, INPUT_LIMITS.measurement.max))}
                placeholder="0"
                className="w-14 bg-zinc-900 border border-zinc-800 rounded-lg py-1 font-mono text-xs text-center text-cyan-400 outline-none focus:border-cyan-600 transition-colors"
              />
            </div>
          ))}
        </div>
      </Section>

      <button
        onClick={handleSaveMetrics}
        className="w-full bg-cyan-600 active:bg-cyan-700 text-white font-bold py-3.5 px-4 rounded-2xl flex justify-center items-center uppercase tracking-wide text-xs shadow-lg shadow-cyan-900/20 transition-all"
      >
        <Save size={16} className="mr-2" /> {isExistingRecord ? 'Kaydı Güncelle' : 'Ölçümü Kaydet'}
      </button>
    </div>
  );
});

MetricsView.displayName = 'MetricsView';

export default MetricsView;
