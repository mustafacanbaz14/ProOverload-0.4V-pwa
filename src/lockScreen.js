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

const drawArtwork = ({ elapsedSeconds, exerciseName, previousSets, previousDate, effectiveSets, isPaused }) => {
  const SIZE = 512;
  const PAD = 36;
  const BOTTOM_LIMIT = SIZE - 16; // Hiçbir şey bu çizginin altına taşmamalı

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#09090b';
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.fillStyle = '#0891b2';
  ctx.fillRect(0, 0, SIZE, 6);

  ctx.textBaseline = 'top';

  // Durum etiketi (sol) ve etkili set rozeti (sağ) aynı satırda:
  // böylece alt bölge tamamen geçmiş setlere kalır.
  ctx.fillStyle = '#52525b';
  ctx.font = 'bold 19px system-ui, -apple-system, sans-serif';
  ctx.fillText(isPaused ? 'DURAKLATILDI' : 'ANTRENMAN SÜRÜYOR', PAD, 36);

  const badge = `${effectiveSets} ETKİLİ SET`;
  ctx.textAlign = 'right';
  ctx.fillStyle = '#22d3ee';
  ctx.fillText(badge, SIZE - PAD, 36);
  ctx.textAlign = 'left';

  // Geçen süre
  ctx.fillStyle = isPaused ? '#a1a1aa' : '#34d399';
  ctx.font = 'bold 88px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText(formatDuration(elapsedSeconds), PAD, 64);

  // Mevcut hareket
  ctx.fillStyle = '#52525b';
  ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
  ctx.fillText('MEVCUT HAREKET', PAD, 176);

  ctx.fillStyle = '#fafafa';
  ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
  const nameLines = wrapText(ctx, exerciseName || 'Hareket seçilmedi', SIZE - PAD * 2).slice(0, 2);
  nameLines.forEach((line, i) => ctx.fillText(line, PAD, 200 + i * 40));

  let y = 200 + nameLines.length * 40 + 16;

  ctx.fillStyle = '#27272a';
  ctx.fillRect(PAD, y, SIZE - PAD * 2, 2);
  y += 20;

  ctx.fillStyle = '#52525b';
  ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
  ctx.fillText(previousDate ? `GEÇEN ANTRENMAN · ${previousDate}` : 'GEÇEN ANTRENMAN', PAD, y);
  y += 32;

  const sets = Array.isArray(previousSets) ? previousSets.slice(0, 4) : [];
  if (sets.length === 0) {
    ctx.fillStyle = '#71717a';
    ctx.font = '25px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText('Bu hareket için kayıt yok', PAD, y);
  } else {
    const ROW = 38;
    ctx.font = '27px ui-monospace, SFMono-Regular, Menlo, monospace';
    for (let i = 0; i < sets.length; i++) {
      // Alt sınıra sığmayan satır hiç çizilmez (taşma yerine kırpma).
      if (y + ROW > BOTTOM_LIMIT) break;
      const set = sets[i];
      ctx.fillStyle = '#52525b';
      ctx.fillText(`${i + 1}`, PAD, y);
      ctx.fillStyle = '#22d3ee';
      ctx.fillText(`${set.weight || 0} kg`, PAD + 38, y);
      ctx.fillStyle = '#e4e4e7';
      ctx.fillText(`× ${set.reps || 0}`, PAD + 174, y);
      ctx.fillStyle = '#a1a1aa';
      ctx.fillText(`RIR ${set.rir ?? '-'}`, PAD + 284, y);
      y += ROW;
    }
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
}) => {
  if (!isLockScreenSupported() || !isActive) return;

  const mySequence = ++updateSequence;

  const summary = previousSets.length > 0
    ? previousSets.slice(0, 3).map((s) => `${s.weight || 0}×${s.reps || 0} (RIR ${s.rir ?? '-'})`).join('  ')
    : 'Geçmiş kayıt yok';

  const nextArtwork = await drawArtwork({
    elapsedSeconds, exerciseName, previousSets, previousDate, effectiveSets, isPaused,
  });

  // Bu çağrı beklerken daha yenisi başladıysa sonucu at, aksi halde eski veriyi yazardık.
  if (mySequence !== updateSequence || !isActive) {
    if (nextArtwork) URL.revokeObjectURL(nextArtwork);
    return;
  }

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: exerciseName || 'Antrenman sürüyor',
      artist: `Geçen antrenman: ${summary}`,
      album: `${formatDuration(elapsedSeconds)} · ${effectiveSets} etkili set`,
      artwork: nextArtwork
        ? [{ src: nextArtwork, sizes: '512x512', type: 'image/png' }]
        : [],
    });

    navigator.mediaSession.playbackState = isPaused ? 'paused' : 'playing';

    // iOS bu değeri kendi saatinden ilerletir: ekran kapalıyken bile süre akar.
    if (navigator.mediaSession.setPositionState) {
      navigator.mediaSession.setPositionState({
        duration: MAX_SESSION_SECONDS,
        position: Math.min(Math.max(0, elapsedSeconds), MAX_SESSION_SECONDS),
        playbackRate: isPaused ? 0.0001 : 1, // 0 kabul edilmiyor
      });
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
