# ProOverload Tracker

Offline-first hipertrofi takip PWA'sı. React 19 + Vite + Tailwind v4. Tüm veri
tarayıcının `localStorage`'ında; sunucu yok.

## Sürüm numaralandırma

Kullanıcı sürümü iki anlamlı parçalıdır: `MAJOR.MINOR`. `package.json` semver
gerektirdiği için teknik biçim `MAJOR.MINOR.0` olur; yama daima sıfırdır.

- Her yayın MINOR'u bir artırır: `2.2.0` → `2.3.0` → `2.4.0` …
- MINOR `9`'a ulaştıktan sonraki yayın MAJOR'u artırır ve MINOR'u sıfırlar:
  `2.9.0` → `3.0.0`
- Ara değer yok: `2.2.1` gibi bir sürüm üretilmez. Küçük bir düzeltme de
  yayınlanıyorsa MINOR yine bir artar.
- Tek kaynak `package.json`'daki `version` alanıdır; ekranda görünen sürüm
  (`src/App.jsx`) ve yedek dosyaları oradan okur. Elle ikinci bir yere sürüm
  yazılmaz.
- Commit başlığının sonuna sürüm parantez içinde eklenir:
  `Özet cümlesi (2.3.0)`

## Veri ve göç

- Depolama anahtarları sürümlü: `po_<ad>_v17` (`STORAGE_VERSION`).
- Okuma birkaç eski sürüme geriye düşer (`STORAGE_VERSIONS`), yazma daima en
  yeniye yapılır.
- Şekil değişikliği yapan her göç **idempotent** olmalı: yeni biçim dokunulmadan
  geçmeli, eski biçim taşınmalı. Kullanıcı verisi hiçbir durumda kaybolmaz.
- Ayarlara yeni alan eklerken `DEFAULT_SETTINGS`'e de eklenmeli; `mergeSettings`
  varsayılanların üstüne yayıyor.

## Hesap katmanı

`src/utils/` altındaki saf modüller React'e bağlı değil ve `node` ile doğrudan
çalıştırılıp test edilebilir. Bağımlılık yönü tek taraflı:

```
number.js / dates.js  →  (bağımsız yaprak)
nutritionStats, energyModel, cardio, wellness, goals, coach, interference
constants → helpers → templates → weekPlan
```

`helpers.js` ile `weekPlan.js` arasında döngü oluşmasın diye plan göçü ayrı bir
yaprak modülde (`planMigration.js`) duruyor.

## Doğrulama

- `npm run build` içinde `scripts/verify-muscles.mjs` çalışır: hareket → kas
  eşlemelerinin altın anahtar karşılaştırması. Kural eklerken mevcut
  sınıflandırmaların değişmediği buradan doğrulanır.
- `npx eslint src --quiet` temiz olmalı (React Compiler kuralları dahil).
- Arayüzü etkileyen değişiklikler tarayıcıda gerçek veriyle doğrulanır.

## Yazım

- Arayüz metinleri ve kod yorumları Türkçe.
- Yorum "ne yaptığını" değil "neden böyle" olduğunu anlatır.
