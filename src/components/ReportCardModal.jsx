import React, { useRef, memo } from 'react';
import { X, Trophy, Zap, Activity, Download, Share2 } from 'lucide-react';
import { calcTonnage, calcEffectiveSets } from '../utils/helpers';

const ReportCardModal = memo(({ isOpen, onClose, workouts = [], personalRecords }) => {
  const cardRef = useRef(null);

  if (!isOpen) return null;

  const totalSessions = workouts.length;
  const totalTonnage = workouts.reduce((sum, w) => sum + calcTonnage(w.exercises), 0);
  const totalSets = workouts.reduce((sum, w) => sum + calcEffectiveSets(w.exercises), 0);
  const prCount = personalRecords ? personalRecords.size : 0;

  const handleDownloadCard = () => {
    if (!cardRef.current) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 700;

    // Arka plan gradyanı
    const grad = ctx.createLinearGradient(0, 0, 0, 700);
    grad.addColorStop(0, '#09090b');
    grad.addColorStop(1, '#18181b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 700);

    // Kenarlık
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 560, 660);

    // Başlık
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('HYPERTROPHY LAB', 50, 75);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '16px monospace';
    ctx.fillText('Gelişim & Başarım Rapor Karnesi', 50, 105);

    // Çizgi
    ctx.strokeStyle = '#27272a';
    ctx.beginPath();
    ctx.moveTo(50, 125);
    ctx.lineTo(550, 125);
    ctx.stroke();

    // İstatistik Kutu 1: Seans Sayısı
    ctx.fillStyle = '#18181b';
    ctx.fillRect(50, 150, 235, 100);
    ctx.fillStyle = '#71717a';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('TOPLAM SEANS', 70, 180);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 36px monospace';
    ctx.fillText(`${totalSessions}`, 70, 225);

    // İstatistik Kutu 2: Kaldırılan Tonaj
    ctx.fillStyle = '#18181b';
    ctx.fillRect(315, 150, 235, 100);
    ctx.fillStyle = '#71717a';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('KALDIRILAN TONAJ', 335, 180);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 32px monospace';
    ctx.fillText(`${Math.round(totalTonnage / 1000)} Ton`, 335, 225);

    // İstatistik Kutu 3: Etkili Setler
    ctx.fillStyle = '#18181b';
    ctx.fillRect(50, 275, 235, 100);
    ctx.fillStyle = '#71717a';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('ETKİLİ SET SAYISI', 70, 305);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 36px monospace';
    ctx.fillText(`${totalSets}`, 70, 350);

    // İstatistik Kutu 4: Kırılan Rekorlar
    ctx.fillStyle = '#18181b';
    ctx.fillRect(315, 275, 235, 100);
    ctx.fillStyle = '#71717a';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('1RM REKORLARI', 335, 305);
    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 36px monospace';
    ctx.fillText(`${prCount} Rekor`, 335, 350);

    // Rekor Hareket Özetleri
    ctx.fillStyle = '#a1a1aa';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('ÖNE ÇIKAN GÜÇ REKORLARI', 50, 420);

    let y = 460;
    if (personalRecords) {
      let count = 0;
      personalRecords.forEach((record, exName) => {
        if (count < 4) {
          ctx.fillStyle = '#27272a';
          ctx.fillRect(50, y, 500, 40);

          ctx.fillStyle = '#e4e4e7';
          ctx.font = 'bold 14px monospace';
          ctx.fillText(exName.substring(0, 25), 65, y + 25);

          ctx.fillStyle = '#06b6d4';
          ctx.font = 'bold 14px monospace';
          ctx.fillText(`1RM: ${record.e1rm} kg (${record.weight}x${record.reps})`, 360, y + 25);

          y += 50;
          count++;
        }
      });
    }

    // Alt Filigran
    ctx.fillStyle = '#52525b';
    ctx.font = '12px monospace';
    ctx.fillText('ProOverload Hypertrophy Lab • Progressive Overload Tracker', 50, 660);

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `Antrenman_Rapor_Karnesi.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[88vh]">
        {/* Üst Bar */}
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
          <div className="flex items-center space-x-2">
            <Trophy size={18} className="text-yellow-500" />
            <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">Antrenman & Gelişim Karnesi</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 p-1">
            <X size={16} />
          </button>
        </div>

        {/* Karne Önizleme Kartı */}
        <div className="p-4 overflow-y-auto space-y-4 hide-scrollbar">
          <div ref={cardRef} className="bg-gradient-to-b from-zinc-950 to-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-3">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <div>
                <span className="text-sm font-bold text-cyan-400 uppercase tracking-widest block">HYPERTROPHY LAB</span>
                <span className="text-[9px] text-zinc-500 font-mono">Gelişim & Başarım Karnesi</span>
              </div>
              <Activity size={20} className="text-cyan-500" />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
                <span className="text-[8px] text-zinc-500 uppercase font-bold block">Toplam Seans</span>
                <span className="text-cyan-400 font-bold text-lg">{totalSessions}</span>
              </div>
              <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
                <span className="text-[8px] text-zinc-500 uppercase font-bold block">Kaldırılan Tonaj</span>
                <span className="text-emerald-400 font-bold text-lg">{Math.round(totalTonnage / 1000)} Ton</span>
              </div>
              <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
                <span className="text-[8px] text-zinc-500 uppercase font-bold block">Etkili Setler</span>
                <span className="text-amber-400 font-bold text-lg">{totalSets}</span>
              </div>
              <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
                <span className="text-[8px] text-zinc-500 uppercase font-bold block">1RM Rekorları</span>
                <span className="text-purple-400 font-bold text-lg">{prCount} Rekor</span>
              </div>
            </div>

            {/* Öne Çıkan Rekorlar */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Öne Çıkan Güç Rekorları</span>
              {Array.from(personalRecords ? personalRecords.entries() : []).slice(0, 3).map(([name, rec]) => (
                <div key={name} className="bg-zinc-900/90 p-2 rounded-xl border border-zinc-800 flex justify-between items-center text-[10px] font-mono">
                  <span className="text-zinc-200 font-bold truncate pr-2">{name}</span>
                  <span className="text-cyan-400 font-bold shrink-0">1RM: {rec.e1rm}kg</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleDownloadCard}
            className="w-full bg-cyan-600 active:bg-cyan-700 text-white font-bold py-3.5 px-4 rounded-2xl flex justify-center items-center uppercase tracking-wide text-xs shadow-lg shadow-cyan-900/20 transition-all"
          >
            <Download size={16} className="mr-2" /> Kart Görselini İndir (PNG)
          </button>
        </div>
      </div>
    </div>
  );
});

ReportCardModal.displayName = 'ReportCardModal';

export default ReportCardModal;
