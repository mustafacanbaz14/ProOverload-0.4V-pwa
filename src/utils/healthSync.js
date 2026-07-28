import { parseNumber } from './helpers';

export function exportAppleHealthXML(workouts = [], nutritionHistory = []) {
  const records = [];

  workouts.forEach(w => {
    const durationMin = parseNumber(w.duration) || 45;
    const dateStr = new Date(w.date).toISOString();
    const estCalories = Math.round(durationMin * 7.5);

    records.push(`  <Record type="HKWorkoutTypeIdentifier" startDate="${dateStr}" endDate="${dateStr}" duration="${durationMin}" durationUnit="min" totalEnergyBurned="${estCalories}" totalEnergyBurnedUnit="kcal" sourceName="HypertrophyLab"/>`);
  });

  nutritionHistory.forEach(n => {
    const dateStr = new Date(n.date).toISOString();
    const safeM = Array.isArray(n.meals) ? n.meals : [];
    const cal = safeM.reduce((s, m) => s + parseNumber(m.calories), 0);
    const prot = safeM.reduce((s, m) => s + parseNumber(m.protein), 0);
    const carbs = safeM.reduce((s, m) => s + parseNumber(m.carbs), 0);
    const fats = safeM.reduce((s, m) => s + parseNumber(m.fats), 0);

    if (cal > 0) {
      records.push(`  <Record type="HKQuantityTypeIdentifierDietaryEnergyConsumed" startDate="${dateStr}" endDate="${dateStr}" value="${cal}" unit="kcal" sourceName="HypertrophyLab"/>`);
      records.push(`  <Record type="HKQuantityTypeIdentifierDietaryProtein" startDate="${dateStr}" endDate="${dateStr}" value="${prot}" unit="g" sourceName="HypertrophyLab"/>`);
      records.push(`  <Record type="HKQuantityTypeIdentifierDietaryCarbohydrates" startDate="${dateStr}" endDate="${dateStr}" value="${carbs}" unit="g" sourceName="HypertrophyLab"/>`);
      records.push(`  <Record type="HKQuantityTypeIdentifierDietaryFatTotal" startDate="${dateStr}" endDate="${dateStr}" value="${fats}" unit="g" sourceName="HypertrophyLab"/>`);
    }
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="tr_TR">
  <ExportDate value="${new Date().toISOString()}"/>
${records.join('\n')}
</HealthData>`;
}

export function exportGoogleFitJSON(workouts = [], nutritionHistory = []) {
  const dataPoints = [];

  workouts.forEach(w => {
    const durationMin = parseNumber(w.duration) || 45;
    const startTimeNanos = new Date(w.date).getTime() * 1000000;
    const endTimeNanos = (new Date(w.date).getTime() + durationMin * 60 * 1000) * 1000000;

    dataPoints.push({
      dataTypeName: 'com.google.workout',
      startTimeNanos,
      endTimeNanos,
      value: [{ intVal: 97 }] // Weightlifting activity type
    });
  });

  nutritionHistory.forEach(n => {
    const timeNanos = new Date(n.date).getTime() * 1000000;
    const safeM = Array.isArray(n.meals) ? n.meals : [];
    const cal = safeM.reduce((s, m) => s + parseNumber(m.calories), 0);

    if (cal > 0) {
      dataPoints.push({
        dataTypeName: 'com.google.nutrition',
        startTimeNanos: timeNanos,
        endTimeNanos: timeNanos,
        value: [{ fpVal: cal }]
      });
    }
  });

  return JSON.stringify({ source: 'HypertrophyLab', dataPoints }, null, 2);
}
