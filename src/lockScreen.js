// --- KİLİT EKRANI CANLI ANTRENMAN KARTI ---
//
// iOS'ta bir PWA gerçek Live Activity (ActivityKit / WidgetKit) oluşturamaz;
// bunlar yalnızca native uygulamalara açıktır. Web'de kilit ekranına bilgi
// düşürmenin çalışan tek yolu Media Session API'sinin "Şu An Çalınan" kartıdır.
//
// Nasıl çalışıyor:
//  - Duyulamayacak kadar düşük genlikli bir ses döngüsü çalınır (tam sessizlikte
//    iOS kartı göstermiyor). Ses çalarken kilit ekranında medya kartı belirir.
//  - Başlık / alt satır / albüm alanları hareket ve geçmiş set bilgisiyle doldurulur.
//  - Kapak görseli canvas'ta çizilir; metin alanlarına sığmayan detaylar (geçen
//    antrenmanın tüm setleri, etkili set sayısı) buraya yazılır.
//  - Geçen süre setPositionState ile bildirilir. iOS bu değeri kendi saatinden
//    ilerlettiği için ekran kapalıyken JavaScript dursa bile sayaç akmaya devam eder.
//  - Kilit ekranındaki oynat/duraklat düğmeleri antrenman kronometresine bağlanır.

const MAX_SESSION_SECONDS = 6 * 60 * 60; // Kaydırıcı için üst sınır (6 saat)

let audioEl = null;
let audioSrcUrl = null;
let artworkUrl = null;
let isActive = false;
// Kapak görseli asenkron üretildiği için art arda gelen güncellemeler yarışabilir.
// Bu sayaç, geç tamamlanan eski bir çağrının yeni veriyi ezmesini engeller.
let updateSequence = 0;

// --- Sessize yakın WAV döngüsü (harici dosya gerektirmez) ---

const writeAscii = (view, offset, text) => {
  for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
};

const createQuietLoopUrl = () => {
  const sampleRate = 8000;
  const numSamples = sampleRate; // 1 saniyelik döngü
  const dataSize = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);   // PCM
  view.setUint16(22, 1, true);   // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // 20 Hz'lik, genliği 1/32768 olan bir dalga: hem duyulmaz hem de teknik olarak
  // "sessiz" sayılmadığı için iOS medya oturumunu canlı tutar.
  for (let i = 0; i < numSamples; i++) {
    view.setInt16(44 + i * 2, Math.floor(i / 200) % 2 === 0 ? 1 : -1, true);
  }

  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
};

// --- Kapak görseli ---

const wrapText = (ctx, text, maxWidth) => {
  const words = String(text).split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
};

export const formatDuration = (totalSeconds) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

const drawArtwork = ({
  elapsedSeconds,
  exerciseName,
  previousSets,
  previousDate,
  effectiveSets,
  isPaused,
  restSecondsLeft,
  restTotalSeconds,
  exerciseIndex = 1,
  totalExercises = 1,
  completedSetsCount = 0,
  totalSetsCount = 0,
  targetText = '',
  supersetName = '',
}) => {
  const SIZE = 512;
  const PAD = 32;
  const W = SIZE - PAD * 2;

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');

  const isResting = Number(restSecondsLeft) > 0;

  // Zemin
  ctx.fillStyle = '#09090b';
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.textBaseline = 'top';

  // Yardımcılar
  const roundRect = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };
  const label = (text, x, y, color = '#52525b', size = 15) => {
    ctx.fillStyle = color;
    ctx.font = `bold ${size}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(text, x, y);
  };

  // ---------- ÜST ŞERİT: durum + ilerleme ----------
  // Dinlenmedeyken renk kodu değişir; kilide bakan biri tek bakışta
  // "çalışıyor mu, dinleniyor mu" ayırt edebilsin.
  const accent = isResting ? '#06b6d4' : isPaused ? '#71717a' : '#34d399';
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, SIZE, 5);

  label(isPaused ? 'DURAKLATILDI' : isResting ? 'DİNLENME' : 'ÇALIŞMA', PAD, 24, accent, 16);

  ctx.textAlign = 'right';
  label(`${exerciseIndex}/${totalExercises} HAREKET · ${effectiveSets} SET`, SIZE - PAD, 24, '#52525b', 15);
  ctx.textAlign = 'left';

  // ---------- ANA SAYAÇ ----------
  // Dinlenmedeyken kalan süre öne çıkar; asıl merak edilen o.
  let y = 52;
  const mainSeconds = isResting ? restSecondsLeft : elapsedSeconds;
  ctx.fillStyle = isResting ? '#ecfeff' : isPaused ? '#a1a1aa' : '#fafafa';
  ctx.font = 'bold 92px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText(formatDuration(mainSeconds), PAD, y);

  ctx.textAlign = 'right';
  if (isResting) {
    label('KALAN', SIZE - PAD, y + 24, '#67e8f9', 16);
    label(`SEANS ${Math.floor(elapsedSeconds / 60)} DK`, SIZE - PAD, y + 46, '#3f3f46', 14);
  } else {
    label('TOPLAM SÜRE', SIZE - PAD, y + 24, '#52525b', 16);
  }
  ctx.textAlign = 'left';

  y += 108;

  // ---------- DİNLENME İLERLEME ÇUBUĞU ----------
  if (isResting && restTotalSeconds > 0) {
    const ratio = Math.max(0, Math.min(1, restSecondsLeft / restTotalSeconds));
    ctx.fillStyle = '#18181b';
    roundRect(PAD, y, W, 12, 6);
    ctx.fill();
    ctx.fillStyle = '#06b6d4';
    roundRect(PAD, y, Math.max(12, W * ratio), 12, 6);
    ctx.fill();
    y += 30;
  } else {
    y += 6;
  }

  // ---------- MEVCUT HAREKET ----------
  const cardH = supersetName ? 118 : 96;
  ctx.fillStyle = '#18181b';
  roundRect(PAD, y, W, cardH, 14);
  ctx.fill();
  ctx.fillStyle = accent;
  roundRect(PAD, y, 5, cardH, 3);
  ctx.fill();

  const innerX = PAD + 20;
  label(`SET ${completedSetsCount + 1}/${Math.max(completedSetsCount + 1, totalSetsCount)}`, innerX, y + 14, '#52525b', 14);

  ctx.fillStyle = '#fafafa';
  ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
  const nameLines = wrapText(ctx, exerciseName || 'Hareket seçilmedi', W - 40).slice(0, 1);
  ctx.fillText(nameLines[0] || '', innerX, y + 36);

  if (targetText) {
    label(`HEDEF: ${targetText}`, innerX, y + 70, '#34d399', 17);
  }
  if (supersetName) {
    label(`SÜPERSET → ${supersetName}`, innerX, y + (targetText ? 92 : 70), '#c084fc', 15);
  }

  y += cardH + 18;

  // ---------- GEÇEN ANTRENMAN ----------
  label(previousDate ? `GEÇEN ANTRENMAN · ${previousDate}` : 'GEÇEN ANTRENMAN', PAD, y, '#52525b', 15);
  y += 26;

  const sets = Array.isArray(previousSets) ? previousSets : [];
  if (sets.length === 0) {
    label('Bu hareket için geçmiş kayıt yok', PAD, y, '#3f3f46', 18);
  } else {
    // Setler yan yana kutularda: dikey listeden daha az yer kaplar ve
    // kilit ekranındaki küçük görselde daha okunaklı olur.
    const maxCols = 4;
    const shown = sets.slice(0, maxCols);
    const gap = 10;
    const boxW = (W - gap * (shown.length - 1)) / shown.length;

    shown.forEach((set, i) => {
      const x = PAD + i * (boxW + gap);
      ctx.fillStyle = '#18181b';
      roundRect(x, y, boxW, 74, 12);
      ctx.fill();

      ctx.textAlign = 'center';
      const cx = x + boxW / 2;

      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 26px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillText(`${set.weight || 0}`, cx, y + 12);

      ctx.fillStyle = '#71717a';
      ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
      ctx.fillText(`× ${set.reps || 0}`, cx, y + 42);

      ctx.fillStyle = '#3f3f46';
      ctx.font = '13px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillText(`RIR ${set.rir ?? '-'}`, cx, y + 58);
      ctx.textAlign = 'left';
    });
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob ? URL.createObjectURL(blob) : null), 'image/png');
  });
};

// --- Genel API ---

export const isLockScreenSupported = () =>
  typeof navigator !== 'undefined' && 'mediaSession' in navigator;

/**
 * Kilit ekranı kartını başlatır. iOS ses çalmayı kullanıcı hareketine bağladığı
 * için bu fonksiyon mutlaka bir tıklama/dokunma akışı içinden çağrılmalıdır.
 */
export const startLockScreenActivity = async ({ onPause, onResume } = {}) => {
  if (!isLockScreenSupported()) return false;

  try {
    if (!audioEl) {
      audioSrcUrl = createQuietLoopUrl();
      audioEl = new Audio(audioSrcUrl);
      audioEl.loop = true;
      audioEl.volume = 1;      // kaynak zaten duyulmaz seviyede
      audioEl.preload = 'auto';
      audioEl.setAttribute('playsinline', '');
    }

    await audioEl.play();
    isActive = true;

    navigator.mediaSession.playbackState = 'playing';

    // Kilit ekranındaki oynat/duraklat kronometreyi yönetir.
    if (onPause) navigator.mediaSession.setActionHandler('pause', () => onPause());
    if (onResume) navigator.mediaSession.setActionHandler('play', () => onResume());
    // Kartın ileri/geri sarma düğmeleri anlamsız olduğu için kapatılır.
    ['previoustrack', 'nexttrack', 'seekbackward', 'seekforward', 'seekto'].forEach((action) => {
      try { navigator.mediaSession.setActionHandler(action, null); } catch { /* desteklenmiyor */ }
    });

    return true;
  } catch {
    // Otomatik oynatma engellendi (kullanıcı hareketi dışında çağrılmış olabilir).
    isActive = false;
    return false;
  }
};

/**
 * Karttaki bilgileri günceller. Ekran kapalıyken JavaScript askıya alındığı için
 * en kritik çağrı, uygulama arka plana geçmeden hemen önce yapılandır.
 */
export const updateLockScreenActivity = async ({
  elapsedSeconds = 0,
  exerciseName = '',
  previousSets = [],
  previousDate = '',
  effectiveSets = 0,
  isPaused = false,
  restSecondsLeft = 0,
  restTotalSeconds = 0,
  exerciseIndex = 1,
  totalExercises = 1,
  completedSetsCount = 0,
  totalSetsCount = 0,
  targetText = '',
  supersetName = '',
}) => {
  if (!isLockScreenSupported() || !isActive) return;

  const mySequence = ++updateSequence;
  const isResting = restSecondsLeft > 0 && restTotalSeconds > 0;
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);

  const summary = previousSets.length > 0
    ? previousSets.slice(0, 3).map((s) => `${s.weight || 0}×${s.reps || 0} (RIR ${s.rir ?? '-'})`).join('  ')
    : 'Geçmiş kayıt yok';

  const nextArtwork = await drawArtwork({
    elapsedSeconds,
    exerciseName,
    previousSets,
    previousDate,
    effectiveSets,
    isPaused,
    restSecondsLeft,
    restTotalSeconds,
    exerciseIndex,
    totalExercises,
    completedSetsCount,
    totalSetsCount,
    targetText,
    supersetName,
  });

  // Bu çağrı beklerken daha yenisi başladıysa sonucu at, aksi halde eski veriyi yazardık.
  if (mySequence !== updateSequence || !isActive) {
    if (nextArtwork) URL.revokeObjectURL(nextArtwork);
    return;
  }

  const setProgressStr = `Set ${completedSetsCount + 1}/${Math.max(completedSetsCount + 1, totalSetsCount)}`;
  const exProgressStr = `${exerciseIndex}/${totalExercises}. Hareket`;
  const timeStr = `${elapsedMinutes} Dk (${formatDuration(elapsedSeconds)})`;

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: isResting
        ? `⏱️ Dinlenme: ${formatDuration(restSecondsLeft)} (${restSecondsLeft}s) · ${exerciseName || 'Antrenman'}`
        : `🏋️ ${exerciseName || 'Antrenman'} (${setProgressStr})`,
      artist: isResting
        ? `🏋️ ${exerciseName || 'Mevcut Hareket'} (${exProgressStr} · ${setProgressStr})`
        : `⏱️ Toplam Antrenman Süresi: ${timeStr} · ${exProgressStr}`,
      album: `⏱️ Antrenman Süresi: ${timeStr} · ${effectiveSets} Etkili Set · Geçen: ${summary}`,
      artwork: nextArtwork
        ? [{ src: nextArtwork, sizes: '512x512', type: 'image/png' }]
        : [],
    });

    navigator.mediaSession.playbackState = isPaused ? 'paused' : 'playing';

    // iOS konum durumunu kendi saatinden ilerletir; ekran kapalıyken JavaScript
    // dursa bile burada bildirilen sayaç akmaya devam eder. Set arasındayken
    // kullanıcıyı ilgilendiren asıl sayaç dinlenme olduğu için ona geçilir.
    if (navigator.mediaSession.setPositionState) {
      navigator.mediaSession.setPositionState(
        isResting
          ? {
            duration: restTotalSeconds,
            position: Math.min(Math.max(0, restTotalSeconds - restSecondsLeft), restTotalSeconds),
            playbackRate: 1,
          }
          : {
            duration: MAX_SESSION_SECONDS,
            position: Math.min(Math.max(0, elapsedSeconds), MAX_SESSION_SECONDS),
            playbackRate: isPaused ? 0.0001 : 1, // 0 kabul edilmiyor
          }
      );
    }
  } catch { /* metadata desteklenmiyor olabilir */ }

  // Önceki kapak görselini serbest bırak
  if (artworkUrl && artworkUrl !== nextArtwork) URL.revokeObjectURL(artworkUrl);
  artworkUrl = nextArtwork;
};

export const stopLockScreenActivity = () => {
  isActive = false;
  updateSequence++; // uçuşta olan güncellemeleri geçersiz kıl

  if (audioEl) {
    audioEl.pause();
    audioEl.currentTime = 0;
  }

  if (isLockScreenSupported()) {
    try {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
      ['play', 'pause'].forEach((action) => {
        try { navigator.mediaSession.setActionHandler(action, null); } catch { /* yoksay */ }
      });
    } catch { /* yoksay */ }
  }

  if (artworkUrl) {
    URL.revokeObjectURL(artworkUrl);
    artworkUrl = null;
  }
};

// --- Dinlenme bitiş uyarısı ---

/**
 * Kısa çift bip. iOS Safari titreşim API'sini desteklemediği için
 * telefon cepteyken tek güvenilir uyarı yolu sestir.
 */
export const playRestAlert = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;

    [0, 0.24].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.4, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.22);
    });

    setTimeout(() => { try { ctx.close(); } catch { /* yoksay */ } }, 1000);
  } catch { /* ses çalınamadı */ }
};

/** Destekleyen cihazlarda (Android) titreşim. iOS'ta sessizce yok sayılır. */
export const vibrateAlert = () => {
  try { navigator.vibrate?.([140, 70, 140]); } catch { /* yoksay */ }
};

// --- Ekranı açık tutma (Wake Lock) ---
// Salonda telefonu bırakıp sete girerken ekranın kapanmaması için.

let wakeLock = null;

export const isWakeLockSupported = () =>
  typeof navigator !== 'undefined' && 'wakeLock' in navigator;

export const requestWakeLock = async () => {
  if (!isWakeLockSupported()) return false;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    // Uygulama arka plandan dönünce kilit düşer; çağıran taraf yeniden ister.
    wakeLock.addEventListener('release', () => { wakeLock = null; });
    return true;
  } catch {
    return false;
  }
};

export const releaseWakeLock = async () => {
  try {
    if (wakeLock) await wakeLock.release();
  } catch { /* yoksay */ }
  wakeLock = null;
};

export const hasWakeLock = () => wakeLock !== null;
