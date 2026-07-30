import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

/*
 * Otomatik güncelleme.
 *
 * Servis çalışanı yalnızca eklentinin enjekte ettiği betikle kaydediliyordu;
 * yeni sürüm indirilse bile sayfa yenilenmediği için ana ekrana eklenmiş
 * uygulamada eski sürüm görünmeye devam ediyordu. iOS uygulamayı kapatmayıp
 * askıya aldığından yeni çalışan hiç devreye girmiyor, kullanıcı silip yeniden
 * eklemek zorunda kalıyordu.
 *
 * Artık yeni sürüm hazır olunca devralıp sayfa yenileniyor; ayrıca saatte bir
 * ve uygulama her öne geldiğinde güncelleme kontrol ediliyor.
 */
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true); // skipWaiting + reload
  },
  onRegisteredSW(_url, registration) {
    if (!registration) return;
    const kontrolEt = () => registration.update().catch(() => { /* çevrimdışı olabilir */ });
    setInterval(kontrolEt, 60 * 60 * 1000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') kontrolEt();
    });
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
