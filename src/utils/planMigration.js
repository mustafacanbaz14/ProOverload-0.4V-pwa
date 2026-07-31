/**
 * Haftalık program göçü — bağımlılığı olmayan alt katman.
 *
 * Ayrı bir dosyada duruyor çünkü `helpers.js` ayarları yüklerken bunu çağırıyor
 * ve `weekPlan.js` (hesap tarafı) `templates.js` üzerinden yeniden `helpers.js`
 * içeri çekiyor. Göçü buraya almak o döngüyü kırıyor.
 */

export const PLAN_DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/** Her gün anahtarının var olmasını ve dizi olmasını garanti eder. */
export const normalizeDays = (days) => {
  const out = {};
  PLAN_DAY_KEYS.forEach(k => {
    const v = days?.[k];
    // Eski biçimde gün değeri doğrudan şablon kimliğiydi.
    if (typeof v === 'string' && v) out[k] = [{ id: `n-${k}`, type: 'workout', templateId: v, time: '' }];
    else out[k] = Array.isArray(v) ? v : [];
  });
  return out;
};

export const emptyPlan = (id, name) => ({ id, name, days: normalizeDays(null) });

/**
 * Eski tek program biçimini yeni listeye taşır.
 *
 * Önceden `settings.weekPlan` tek bir `{ mon: templateId }` nesnesiydi. Artık
 * birden fazla adlandırılmış program tutuluyor ve her gün saatli slot listesi.
 * Göç idempotent: yeni biçim aynen geçer, eskisi tek programa dönüştürülür —
 * kullanıcının kurduğu hafta hiçbir durumda kaybolmaz.
 */
export const migrateWeekPlans = (settings = {}) => {
  const mevcut = Array.isArray(settings.weekPlans) ? settings.weekPlans : null;
  if (mevcut && mevcut.length > 0) {
    const plans = mevcut.map(p => ({ ...p, days: normalizeDays(p.days) }));
    const activeId = plans.some(p => p.id === settings.activePlanId)
      ? settings.activePlanId
      : plans[0].id;
    return { plans, activeId };
  }

  const eski = settings.weekPlan;
  const dolu = eski && typeof eski === 'object' && Object.values(eski).some(Boolean);
  const days = normalizeDays(null);
  if (dolu) {
    PLAN_DAY_KEYS.forEach(k => {
      const tid = eski[k];
      if (tid) days[k] = [{ id: `mig-${k}`, type: 'workout', templateId: tid, time: '' }];
    });
  }

  const plan = { id: 'plan-1', name: dolu ? 'Haftalık Program' : 'Program 1', days };
  return { plans: [plan], activeId: plan.id };
};

export const findPlan = (plans = [], id) => plans.find(p => p.id === id) || plans[0] || null;

/** Silinen bir şablonu bütün haftalık program slotlarından kaldırır. */
export const removeTemplateFromPlans = (plans = [], templateId) =>
  (Array.isArray(plans) ? plans : []).map(plan => ({
    ...plan,
    days: Object.fromEntries(
      PLAN_DAY_KEYS.map(key => [
        key,
        (Array.isArray(plan?.days?.[key]) ? plan.days[key] : [])
          .filter(slot => slot?.type !== 'workout' || slot.templateId !== templateId),
      ]),
    ),
  }));
