import React, { memo } from 'react';
import { Ruler, Droplet, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

const TAPE_SITES = [
  ['Boyun', 'Dik dur. Başını öne eğme. Mezurayı Adem elmasının hemen altından geçir. Arkadaki çizgi öndekiyle aynı yükseklikte olsun. Boynunu şişirmeden normal nefeste oku.'],
  ['Omuz', 'Mümkünse birinden yardım iste. Kolların yanda gevşek olsun. Mezura iki omuz başının en dış noktasından ve sırtın en geniş yerinden dolaşsın. Göğsünü şişirme.'],
  ['Göğüs', 'Mezurayı meme başı hizasında, yere tam paralel dolaştır. Normal nefes ver. Göğsünü içeri çekmeden veya şişirmeden sayıyı oku.'],
  ['Kol', 'Her ölçümde aynı yöntemi kullan: uygulamada sıkılı kol kabul edilir. Dirseği yaklaşık 90° bük, pazıyı sık ve en kalın noktayı ölç. Sağ kolu kullan.'],
  ['Bel', 'Göbek deliği hizasını işaretle. Ayaklarını omuz genişliğinde aç. Normal nefes ver, karnını içeri çekme. Mezura cilde değsin fakat iz bırakmasın.'],
  ['Kalça', 'Ayaklarını birleştir. Yandan bakınca kalçanın en geriye çıktığı en geniş noktayı bul. Mezurayı yere paralel dolaştır.'],
  ['Uyluk', 'Sağ bacakta kasık kıvrımının hemen altındaki en kalın noktayı bul. Ağırlığı iki ayağa eşit ver, bacağını sıkma.'],
  ['Kalf', 'Ayakta dur, topuk yerde olsun. Sağ baldırın en kalın noktasını bulmak için mezurayı biraz yukarı-aşağı gezdir. En büyük değeri yaz.'],
  ['El Bileği', 'Bilek kemiğinin hemen kol tarafındaki en ince noktayı ölç. Mezurayı sıkma. Bu değer iskelet yapısı içindir ve hızlı değişmesi beklenmez.'],
];

const SKINFOLD_SITES = [
  ['Göğüs', 'Sağ tarafta koltuk altı çizgisi ile meme başı arasının ortasını işaretle. Deri kıvrımını çapraz, yani / yönünde tut.'],
  ['Karın', 'Göbek deliğinin yaklaşık 2 cm sağını işaretle. Kıvrımı yukarı-aşağı, yani dikey tut.'],
  ['Uyluk', 'Sağ bacağın önünde kasık kıvrımı ile diz kapağının üstü arasının tam ortası. Ayağı gevşet, kıvrımı dikey tut.'],
  ['Triseps', 'Sağ kolun arkasında omuz ucu ile dirsek arasının ortası. Kol serbestçe aşağı sarksın, kıvrım dikey olsun. Yardımcıyla ölçmek daha doğrudur.'],
  ['Suprailiak', 'Sağ kalça kemiğinin üst kenarını bul. Hemen üstündeki doğal kıvrımı öne-aşağı çapraz yönde tut.'],
  ['Aksilla', 'Sağ koltuk altından aşağı inen çizgi üzerinde, göğüs kemiğinin alt ucu hizasını bul. Kıvrımı dikey tut.'],
  ['Subskapular', 'Sağ kürek kemiğinin alt ucunu bul. Yaklaşık 2 cm altındaki kıvrımı omurgadan dışarı doğru 45° çapraz tut. Yardımcı gerekir.'],
];

const Step = ({ number, title, children }) => (
  <li className="flex gap-2.5">
    <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 text-[9px] font-mono font-bold flex items-center justify-center shrink-0">{number}</span>
    <span className="text-[10px] font-mono text-zinc-400 leading-relaxed"><strong className="text-zinc-200 block">{title}</strong>{children}</span>
  </li>
);

const Preparation = () => (
  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2">
    <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider flex items-center"><Clock size={12} className="mr-1.5 text-cyan-400" />Her seferinde aynı koşul</h4>
    <ul className="text-[10px] font-mono text-zinc-500 leading-relaxed space-y-1">
      <li>• Sabah, tuvaletten sonra ve yemeden/içmeden önce ölç.</li>
      <li>• Antrenmandan önce ölç; pompa ölçüyü geçici olarak büyütür.</li>
      <li>• Hep vücudun sağ tarafını ve aynı noktayı kullan.</li>
      <li>• Haftada bir ölç. Aynı gün iki ölçüm arasında büyük fark varsa üçüncüyü al.</li>
      <li>• Noktayı silinmeyen küçük bir cilt kalemiyle işaretlemek tekrar hatasını azaltır.</li>
    </ul>
  </div>
);

const TapeGuide = () => (
  <div className="space-y-3">
    <Preparation />
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
      <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center mb-2"><Ruler size={12} className="mr-1.5" />Mezurayı nasıl kullanacaksın?</h4>
      <ol className="space-y-2.5">
        <Step number="1" title="Mezurayı kontrol et">Esnemeyen yumuşak terzi mezurası kullan. Metal metre kullanma.</Step>
        <Step number="2" title="Doğru noktayı bul">Aşağıdaki tariften ölçüm yerini bul ve gerekirse küçük bir noktayla işaretle.</Step>
        <Step number="3" title="Yere paralel tut">Aynadan öne ve arkaya bak. Mezura arkada yukarı veya aşağı kaçmamalı.</Step>
        <Step number="4" title="Doğru sıkılık">Mezura cilde tamamen değsin; fakat cildi içeri gömmesin ve iz bırakmasın.</Step>
        <Step number="5" title="İki kez ölç">Mezurayı tamamen çıkarıp yeniden yerleştir. Fark 0,5 cm’den fazlaysa üçüncü kez ölç ve birbirine yakın iki değerin ortalamasını yaz.</Step>
      </ol>
    </div>
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2.5">
      <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">Nokta nokta tarif</h4>
      {TAPE_SITES.map(([name, description]) => <p key={name} className="text-[10px] font-mono text-zinc-500 leading-relaxed"><strong className="text-zinc-200">{name}:</strong> {description}</p>)}
    </div>
    <div className="bg-orange-950/15 border border-orange-900/30 rounded-xl p-3">
      <p className="text-[10px] font-mono text-orange-300 leading-relaxed"><AlertTriangle size={12} className="inline mr-1" /><strong>En sık hata:</strong> Karnı içeri çekmek, göğsü şişirmek, mezurayı çapraz tutmak ve kolu her hafta farklı şiddette sıkmak. Tek sayıya değil 3–4 haftalık trende bak.</p>
    </div>
  </div>
);

const SkinfoldGuide = () => (
  <div className="space-y-3">
    <Preparation />
    <div className="bg-amber-950/15 border border-amber-900/30 rounded-xl p-3">
      <p className="text-[10px] font-mono text-amber-300 leading-relaxed"><AlertTriangle size={12} className="inline mr-1" /><strong>Kaliperin yoksa bu alanı kullanma.</strong> Parmak ve cetvelle güvenilir milimetre ölçümü alınamaz. Yağ oranı kaynağını “Mezura” veya “Manuel” seç.</p>
    </div>
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
      <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center mb-2"><Droplet size={12} className="mr-1.5" />Bir noktayı ölçme işlemi</h4>
      <ol className="space-y-2.5">
        <Step number="1" title="Noktayı işaretle">Tarife göre sağ taraftaki noktayı bul. Kaliperi tahminî bir yere koyma.</Step>
        <Step number="2" title="Deriyi kavra">Baş ve işaret parmağını işaretin iki yanına, yaklaşık 5–7 cm açıklıkla koy. Deri ve deri altı yağı tut; kası kavramamaya çalış.</Step>
        <Step number="3" title="Kıvrımı kaldır">Kıvrımı vücuttan hafifçe uzaklaştır ve ölçüm boyunca parmaklarınla tutmaya devam et.</Step>
        <Step number="4" title="Kaliperi yerleştir">Çeneleri parmaklarının yaklaşık 1 cm altına, tarifteki dikey veya çapraz yönde koy. Kaliperi bırak, kıvrımı bırakma.</Step>
        <Step number="5" title="1–2 saniyede oku">Daha uzun beklersen doku sıkışır ve değer yapay olarak küçülür. Sonucu milimetre olarak yaz.</Step>
        <Step number="6" title="Üç tur yap">Aynı noktayı arka arkaya sıkıştırma; diğer noktalara geçip sonra geri dön. Üç sonuçtan birbirine yakın olanların ortalamasını gir.</Step>
      </ol>
    </div>
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2.5">
      <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">Nokta ve kıvrım yönleri</h4>
      {SKINFOLD_SITES.map(([name, description]) => <p key={name} className="text-[10px] font-mono text-zinc-500 leading-relaxed"><strong className="text-zinc-200">{name}:</strong> {description}</p>)}
    </div>
    <div className="bg-emerald-950/15 border border-emerald-900/30 rounded-xl p-3 text-[10px] font-mono text-emerald-300 leading-relaxed"><CheckCircle2 size={12} className="inline mr-1" />Aynı kişi, aynı kaliper, aynı noktalar ve aynı saat kullanıldığında trend mutlak yağ oranından daha değerlidir.</div>
  </div>
);

const MeasurementGuide = memo(({ type = 'tape' }) => type === 'skinfold' ? <SkinfoldGuide /> : <TapeGuide />);
MeasurementGuide.displayName = 'MeasurementGuide';
export default MeasurementGuide;
