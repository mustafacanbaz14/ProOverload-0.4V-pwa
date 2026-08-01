import React, { memo, useState } from 'react';
import { User, Scale, Ruler, Info, Save, ArrowRightLeft, Calendar, Droplet, History, ChevronDown } from 'lucide-react';
import { BODY_METRICS, FAT_METHOD_LABELS } from '../utils/constants';
import { parseNumber, clampNumber, INPUT_LIMITS } from '../utils/helpers';
import MeasurementGuide from './MeasurementGuide';
import GoalsCard from './GoalsCard';
import { computeBMI, BMI_STATUS_COLOR } from '../utils/goals';
import { formatDay } from '../utils/dates';

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

const Section = ({ icon, title, action, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className={`flex justify-between items-center px-3 border-zinc-800 bg-zinc-950/60 ${open ? 'border-b' : ''}`}>
        <button onClick={() => setOpen(value => !value)} aria-expanded={open} className="flex-1 py-3 text-left flex items-center justify-between min-w-0">
          <h3 className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider flex items-center min-w-0">
            <span className="mr-2 text-cyan-400 flex items-center">{icon}</span>{title}
          </h3>
          <ChevronDown size={14} className={`text-zinc-600 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {action && <div className="ml-2 shrink-0">{action}</div>}
      </div>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
};

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
  onDateChange,
  embedded = false,
}) => {
  const form = currentMetricsForm;
  const [guideType, setGuideType] = useState('tape');

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

  const updateGoal = (collection, field, value) => setSettings(prev => ({
    ...prev,
    [collection]: { ...(prev[collection] || {}), [field]: value },
  }));

  const toggleGuide = (type) => {
    if (isMeasurementGuideOpen && guideType === type) {
      setIsMeasurementGuideOpen(false);
      return;
    }
    setGuideType(type);
    setIsMeasurementGuideOpen(true);
  };

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
    <div className={`${embedded ? 'px-4 pt-2' : 'p-4'} space-y-4 pb-28 h-full overflow-y-auto hide-scrollbar bg-black`}>

      <div className="bg-gradient-to-br from-cyan-950/35 to-zinc-900 border border-cyan-900/35 rounded-2xl p-4">
        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Son Durum</span>
        <div className="grid grid-cols-4 gap-2 mt-2 text-center">
          {[
            ['Kilo', `${parseNumber(form.weight) || '—'}`, 'kg'],
            ['Yağ', computedComp.activeBF || '—', '%'],
            ['FFMI', computedComp.ffmi || '—', ''],
            ['BMI', computeBMI(form.weight, form.height)?.bmi || '—', ''],
          ].map(([label, value, unit]) => <div key={label}><strong className="text-sm font-mono text-zinc-100 block">{value}<small className="text-[8px] text-zinc-500 ml-0.5">{unit}</small></strong><span className="text-[8px] font-mono text-zinc-600 uppercase">{label}</span></div>)}
        </div>
      </div>

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
          onChange={(e) => (onDateChange ? onDateChange(e.target.value) : updateField('date', e.target.value))}
          className={inputClass}
        />
        <p className="text-[10px] font-mono font-bold text-cyan-500/80">{formatDay(form.date, 'long')}</p>
        <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">
          {isExistingRecord
            ? 'Bu tarihte kayıt var — kaydettiğinde üzerine yazılır.'
            : 'Bu tarihte kayıt yok. Alanlar son ölçümünden dolduruldu; değişenleri güncelleyip kaydet.'}
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
      <Section
        icon={<Droplet size={13} />}
        title="Yağ Oranı & Kaliper"
        defaultOpen={settings.interfaceMode === 'detailed'}
        action={<button onClick={() => toggleGuide('skinfold')} className="text-[9px] text-cyan-400 border border-cyan-900/50 rounded-lg px-2 py-1">Kaliper Rehberi</button>}
      >
        {isMeasurementGuideOpen && guideType === 'skinfold' && <MeasurementGuide type="skinfold" />}
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

          <div className="grid grid-cols-1 gap-2">
            <div className="grid grid-cols-[1fr_70px_70px] gap-2 px-1 text-[8px] font-mono text-zinc-600 uppercase">
              <span>Nokta</span><span className="text-center">Şu an</span><span className="text-center">Hedef</span>
            </div>
            {visibleSites.map(site => (
              <div key={site.key} className="grid grid-cols-[1fr_70px_70px] gap-2 items-center bg-zinc-950 border border-zinc-800 rounded-xl p-2">
                <label className="text-[10px] font-mono text-zinc-400">{site.label}</label>
                <input
                  type="number" inputMode="decimal" step="0.5"
                  min={INPUT_LIMITS.skinfold.min} max={INPUT_LIMITS.skinfold.max}
                  value={form.skinfolds?.[site.key] || ''}
                  onChange={(e) => updateSkinfold(site.key, e.target.value)}
                  onBlur={(e) => updateSkinfold(site.key, clampNumber(e.target.value, INPUT_LIMITS.skinfold.min, INPUT_LIMITS.skinfold.max))}
                  placeholder="mm"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200 font-mono text-xs text-center outline-none focus:border-cyan-600"
                />
                <input type="number" inputMode="decimal" step="0.5" min={0} max={100}
                  value={settings.goalSkinfolds?.[site.key] || ''}
                  onChange={(e) => updateGoal('goalSkinfolds', site.key, e.target.value)}
                  onBlur={(e) => updateGoal('goalSkinfolds', site.key, e.target.value === '' ? '' : clampNumber(e.target.value, 0, 100))}
                  placeholder="mm" aria-label={`${site.label} kaliper hedefi`}
                  className="w-full bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-2 text-cyan-400 font-mono text-xs text-center outline-none focus:border-cyan-500" />
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

        {(() => {
          const shoulder = parseNumber(form.measurements?.shoulder);
          const waist = parseNumber(form.measurements?.waist);
          const ratio = shoulder > 0 && waist > 0 ? shoulder / waist : 0;
          const goalShoulder = parseNumber(settings.goalMeasurements?.shoulder);
          const goalWaist = parseNumber(settings.goalMeasurements?.waist);
          const target = goalShoulder > 0 && goalWaist > 0 ? goalShoulder / goalWaist : 0;
          return (
            <div className="bg-purple-950/15 border border-purple-900/35 p-3 rounded-xl">
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">Omuz / Bel Oranı</span>
                <strong className="text-lg font-mono text-purple-300">{ratio ? ratio.toFixed(2) : '—'}</strong>
              </div>
              <p className="text-[9px] font-mono text-zinc-500 leading-relaxed mt-1">
                Omuz çevresi ÷ bel çevresi. Sayı yükseldikçe V görünümü belirginleşir; sağlık tanısı değildir ve ölçüm tekniğinden etkilenir.
                {target > 0 && ` Hedef ölçülerinin oranı ${target.toFixed(2)}.`}
              </p>
            </div>
          );
        })()}

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
        defaultOpen={settings.interfaceMode === 'detailed'}
        action={
          <button
            onClick={() => toggleGuide('tape')}
            className="text-[10px] text-cyan-400 flex items-center font-mono border border-cyan-900/50 rounded-lg px-2 py-1"
          >
            <Info size={10} className="mr-1" /> Mezura Rehberi
          </button>
        }
      >
        {isMeasurementGuideOpen && guideType === 'tape' && <MeasurementGuide type="tape" />}

        <div className="grid grid-cols-[1fr_62px_62px] gap-2 px-1 text-[8px] font-mono text-zinc-600 uppercase">
          <span>Bölge</span><span className="text-center">Şu an</span><span className="text-center">Hedef</span>
        </div>
        <div className="space-y-2">
          {BODY_METRICS.filter(m => m.key !== 'weight').map(m => (
            <div key={m.key} className="bg-zinc-950 px-2.5 py-2 rounded-xl border border-zinc-800 grid grid-cols-[1fr_62px_62px] gap-2 items-center">
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
              <input type="number" inputMode="decimal" step="0.5" min={0} max={300}
                value={settings.goalMeasurements?.[m.key] || ''}
                onChange={(e) => updateGoal('goalMeasurements', m.key, e.target.value)}
                onBlur={(e) => updateGoal('goalMeasurements', m.key, e.target.value === '' ? '' : clampNumber(e.target.value, 0, 300))}
                placeholder="—" aria-label={`${m.label} hedefi`}
                className="w-full bg-cyan-950/20 border border-cyan-900/50 rounded-lg py-1 font-mono text-xs text-center text-cyan-400 outline-none focus:border-cyan-500" />
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
