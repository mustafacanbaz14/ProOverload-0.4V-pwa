import { previewTemplateVolume } from './templates.js';
import { parseNumber } from './number.js';

const REGIONS = {
  push: ['Göğüs', 'Ön Omuz', 'Yan Omuz', 'Triseps'],
  pull: ['Kanat', 'Orta Sırt', 'Trapez', 'Arka Omuz', 'Biseps', 'Önkol'],
  legs: ['Quadriceps', 'Hamstring', 'Kalça', 'Baldır'],
  core: ['Karın', 'Bel'],
};

const LABELS = { push: 'İtme', pull: 'Çekme', legs: 'Alt Vücut', core: 'Merkez' };
const sum = (byMuscle, muscles) => muscles.reduce((total, muscle) => total + parseNumber(byMuscle[muscle]), 0);

const suggestion = (muscle, exercise, reason) => ({ muscle, exercise, reason });

export const analyzeTemplate = (exercises = [], customExercises = []) => {
  const preview = previewTemplateVolume(exercises, customExercises);
  const { byMuscle, totalSets } = preview;
  const regional = Object.fromEntries(Object.entries(REGIONS).map(([key, muscles]) => [key, sum(byMuscle, muscles)]));
  const rankedRegions = Object.entries(regional).sort((a, b) => b[1] - a[1]);
  const top = rankedRegions[0] || ['push', 0];
  const second = rankedRegions[1] || ['pull', 0];
  const combined = rankedRegions.reduce((total, [, value]) => total + value, 0);
  const focused = combined > 0 && top[1] >= combined * 0.48;
  const focusKey = focused ? top[0] : 'mixed';
  const focusLabel = focused ? `${LABELS[top[0]]} odaklı` : combined > 0 ? 'Karma / tüm vücut' : 'Boş şablon';
  const tips = [];
  const additions = [];

  if (totalSets === 0) {
    tips.push({ tone: 'warn', text: 'Henüz çalışma seti yok; önce ana hareketi ekle.' });
    return { ...preview, regional, focusKey, focusLabel, coverage: 0, tips, additions };
  }

  if (totalSets < 6) tips.push({ tone: 'info', text: `${totalSets} set kısa bir seans. Ana bölge için uyaran düşük kalabilir.` });
  if (totalSets > 28) tips.push({ tone: 'warn', text: `${totalSets} set tek seans için yoğun. Son hareketlerde kalite düşüyorsa hacmi iki güne böl.` });

  const v = muscle => parseNumber(byMuscle[muscle]);
  if (focusKey === 'push') {
    if (v('Göğüs') > 0 && v('Yan Omuz') === 0) additions.push(suggestion('Yan Omuz', 'Lateral Raise (Cable)', 'İtme gününde omuz genişliği için doğrudan yan deltoid yok.'));
    if (v('Triseps') < v('Göğüs') * 0.25) additions.push(suggestion('Triseps', 'Tricep Pushdown', 'Göğüs hacmine göre doğrudan triseps katkısı düşük.'));
  } else if (focusKey === 'pull') {
    if (v('Kanat') > 0 && v('Orta Sırt') < v('Kanat') * 0.35) additions.push(suggestion('Orta Sırt', 'Chest Supported Row', 'Dikey çekiş var; yatay çekiş/orta sırt geride.'));
    if (v('Orta Sırt') > 0 && v('Kanat') < v('Orta Sırt') * 0.35) additions.push(suggestion('Kanat', 'Lat Pulldown', 'Yatay çekiş var; kanat için dikey çekiş geride.'));
    if (v('Arka Omuz') === 0) additions.push(suggestion('Arka Omuz', 'Face Pull', 'Çekiş gününde doğrudan arka omuz katkısı yok.'));
  } else if (focusKey === 'legs') {
    if (v('Quadriceps') > 0 && v('Hamstring') < v('Quadriceps') * 0.4) additions.push(suggestion('Hamstring', 'Seated Leg Curl', 'Diz önü baskın; hamstring katkısı geride.'));
    if (v('Hamstring') > 0 && v('Quadriceps') < v('Hamstring') * 0.4) additions.push(suggestion('Quadriceps', 'Leg Press', 'Arka zincir baskın; quadriceps katkısı geride.'));
    if (v('Baldır') === 0) additions.push(suggestion('Baldır', 'Standing Calf Raise', 'Alt vücut gününde doğrudan baldır seti yok.'));
  } else if (focusKey === 'core') {
    if (v('Karın') === 0) additions.push(suggestion('Karın', 'Cable Crunch', 'Merkez gününde ön karın yükü yok.'));
    if (v('Bel') === 0) additions.push(suggestion('Bel', 'Back Extension', 'Merkez gününde arka gövde yükü yok.'));
  } else {
    if (regional.push === 0) additions.push(suggestion('Göğüs', 'Dumbbell Bench Press', 'Karma şablonda itme hareketi yok.'));
    if (regional.pull === 0) additions.push(suggestion('Kanat', 'Lat Pulldown', 'Karma şablonda çekiş hareketi yok.'));
    if (regional.legs === 0) additions.push(suggestion('Quadriceps', 'Leg Press', 'Karma şablonda alt vücut hareketi yok.'));
  }

  const highestMuscle = Object.entries(byMuscle).sort((a, b) => b[1] - a[1])[0];
  if (highestMuscle?.[1] > 12) tips.push({ tone: 'warn', text: `${highestMuscle[0]} tek seansta ${highestMuscle[1]} teorik set alıyor; kalite düşüyorsa haftaya yay.` });
  if (!tips.length) tips.push({ tone: 'good', text: 'Set sayısı ve bölgesel kapsama belirgin bir sorun göstermiyor.' });

  const regionCoverage = Object.values(regional).filter(value => value > 0).length;
  const volumeScore = totalSets >= 6 && totalSets <= 24 ? 45 : totalSets <= 28 ? 30 : 15;
  const coverage = Math.min(100, volumeScore + regionCoverage * 12 + (additions.length === 0 ? 7 : 0));

  return {
    ...preview,
    regional,
    focusKey,
    focusLabel,
    secondaryLabel: second[1] > 0 ? LABELS[second[0]] : null,
    coverage,
    tips,
    additions: additions.slice(0, 3),
  };
};
