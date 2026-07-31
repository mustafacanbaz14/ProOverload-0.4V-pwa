# ProOverload Tracker

Antrenman, beslenme ve vücut kompozisyonu takibi yapan offline PWA.
Tüm veri cihazda (`localStorage`) tutulur — sunucu, hesap veya internet gerekmez.

## Geliştirme

```bash
npm install
npm run dev
```

```bash
npm run lint
npm run build
```

## Veri nerede tutuluyor

Veri, tarayıcının `localStorage`'ında `po_*_v17` anahtarlarıyla saklanır ve
**siteye (origin) bağlıdır**. Bunun iki pratik sonucu var:

- **Aynı adrese** yeni sürüm yayınlarsan veri olduğu gibi kalır.
- **Adres değişirse** (farklı bir Vercel projesi / farklı alan adı) yeni adres
  veriyi göremez. Bu durumda JSON yedeği üzerinden taşımak gerekir.

Uygulama açılışta `_v17 → _v16 → _v15 → _v14 → _v13` sırasıyla eski anahtarları da
dener, yani daha eski sürümlerden gelen veri de otomatik okunur.

## Telefona kurma ve veri taşıma

### 1. Önce yedek al (eski sürüm hâlâ telefondayken)

Telefonda **mevcut** uygulamayı aç → sağ üstteki dişli → *Veritabanı Yönetimi* →
**İndir**. `HypertrophyLab_Backup_YYYY-AA-GG.json` dosyası iniyor.
Dosyayı Dosyalar/iCloud'a kaydet.

> Adres değişmeyecek olsa bile bu adımı atlama. Yedek, her şey ters giderse
> geri dönüş yolun.

### 2. Yeni sürümü yayınla

Vercel'de **var olan projeye** dağıt — yeni proje açma, çünkü adres değişirse
telefondaki veri görünmez olur.

- Vercel projesi bu depoya bağlıysa: `main` dalına push etmen yeterli.
- Vercel CLI ile dağıtıyorsan: `vercel --prod`
- `dist` klasörünü elle yüklüyorsan: önce `npm run build`, sonra `dist` içeriğini
  aynı projeye yükle.

Kök dizindeki `vercel.json`, `sw.js` ve `index.html`'in önbelleğe alınmamasını
sağlar. Bu olmadan servis worker eski sürümü sunmaya devam edebilir ve
güncelleme telefona hiç ulaşmaz.

### 3. Telefonda güncellemeyi al

Ana ekrandaki uygulamayı kapat (uygulama değiştiriciden yukarı kaydırarak
tamamen kapat), sonra yeniden aç. Servis worker `autoUpdate` modunda olduğu için
yeni sürüm bir sonraki açılışta devreye girer.

Değişiklik görünmüyorsa: Safari'de siteyi normal sekmede aç, yenile, sonra ana
ekrandaki uygulamayı tekrar aç.

### 4. Veri kontrolü

Arşiv sekmesini aç, antrenman/ölçüm/beslenme kayıtlarının yerinde olduğunu gör.

**Veri gitmişse** (adres değiştiyse böyle olur): dişli → *Veritabanı Yönetimi* →
**Yükle** → 1. adımdaki JSON dosyasını seç. Üzerine yazmadan önce dosyadaki kayıt
sayılarını gösteren bir onay ekranı çıkar.

Eski sürümden alınan yedekler yeni sürümle uyumludur: `setType` taşımayan eski
setler çalışma seti sayılır, eksik ayarlar varsayılanlarla tamamlanır.

### 5. Ana ekrana ekleme (ilk kez kuruyorsan)

Safari'de siteyi aç → **Paylaş** → **Ana Ekrana Ekle**.
Adres çubuğu olmadan tam ekran çalışır ve kilit ekranı kartı düzgün görünür.

## Kilit ekranı kartı hakkında

iOS'ta bir PWA gerçek Live Activity (ActivityKit) oluşturamaz — o API yalnızca
native uygulamalara açık. Bunun yerine Media Session API'sinin "Şu An Çalınan"
kartı kullanılır: duyulamayacak genlikte bir ses döngüsü çalarken kilit ekranında
geçen süre, mevcut hareket, geçen antrenmanın setleri ve dinlenme sayacı görünür.

Sayaçlar `setPositionState` ile bildirildiği için ekran kapalıyken JavaScript
askıya alınsa bile iOS geri sayımı kendi saatinden sürdürür. Kartın oynat/duraklat
düğmeleri antrenman kronometresini yönetir.

Ayarlar → *Antrenman Sırasında* bölümünden kapatılabilir.

## Yedekleme alışkanlığı

Veri yalnızca cihazda. iOS, uzun süre açılmayan sitelerin verisini temizleyebilir.
Uygulama 7 günden uzun süre yedek alınmadıysa ana ekranda uyarı gösterir —
o uyarıyı gördüğünde **İndir**'e bas.
