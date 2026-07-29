import React, { memo } from 'react';
import { Ruler, Droplet, Clock, AlertTriangle } from 'lucide-react';

const TAPE_SITES = [
  ['Boyun', 'Adem elmasının hemen ALTINDAN, mezura yere paralel. Omuzlar gevşek, baş düz ileri bakıyor. Boynu şişirme.'],
  ['Omuz', 'Kollar yanda gevşek dururken, omuzların en dış noktalarından geçerek gövdenin etrafını dolaş. Nefes verdikten sonra ölç.'],
  ['Göğüs', 'Meme başı hizasından, mezura sırtta yere paralel. Normal nefes alıp verdikten sonra, göğsü şişirmeden ölç.'],
  ['Kol', 'Kolu 90° bük, pazıyı sık. En kalın noktadan ölç. Her seferinde AYNI şiddette sıkmaya dikkat et — bu ölçümün en büyük hata kaynağı.'],
  ['Bel', 'Göbek deliği hizasından. Nefesini tamamen verip karnını normal bıraktıktan sonra ölç. İçe çekme, dışa itme.'],
  ['Kalça', 'Yandan bakınca kalçanın en geriye çıktığı nokta. Ayaklar bitişik, ağırlık iki bacağa eşit.'],
  ['Uyluk', 'Kasık kıvrımının hemen altından, bacağın en kalın yeri. Ayakta dur, ağırlığı iki bacağa eşit dağıt, kası sıkma.'],
  ['Kalf', 'Baldırın en kalın noktası. Ayakta, ağırlık iki ayakta eşit, topuklar yerde.'],
  ['El Bileği', 'Bilek çıkıntı kemiğinin hemen KOLA doğru arkasından, en ince nokta. Bu ölçüm iskelet çatısı hesabında kullanılır, kas gelişimiyle değişmez.'],
];

const SKINFOLD_SITES = [
  ['Göğüs', 'Koltuk altı çizgisi ile meme başı arasındaki mesafenin ortası. Kıvrımı ÇAPRAZ (diagonal) al.'],
  ['Karın', 'Göbek deliğinin 2 cm sağından. Kıvrımı DİKEY al.'],
  ['Uyluk', 'Kalça kıvrımı ile diz kapağı üstü arasındaki mesafenin tam ortası, bacağın önü. DİKEY. Bacak gevşek olmalı.'],
  ['Triceps', 'Omuz ucu ile dirsek arasının ortası, kolun ARKASI. DİKEY. Kol yanda serbest sarkarken.'],
  ['Suprailiak', 'Kalça kemiğinin üst çıkıntısının hemen üstü, koltuk altı çizgisinin devamında. Doğal ÇAPRAZ hattı takip et.'],
  ['Aksilla', 'Koltuk altından inen dikey hat üzerinde, göğüs kafesinin bittiği hizada. DİKEY.'],
  ['Subskapular', 'Kürek kemiğinin en alt ucunun hemen altı. ÇAPRAZ, omurgadan dışa doğru 45°.'],
];

const Block = ({ icon, title, children }) => (
  <div className="space-y-2">
    <h4 className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center">
      <span className="mr-1.5 flex items-center">{icon}</span>{title}
    </h4>
    {children}
  </div>
);

const MeasurementGuide = memo(() => (
  <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl space-y-4">

    <Block icon={<Clock size={12} />} title="Her Ölçümde Aynı Koşullar">
      <ul className="text-[10px] font-mono text-zinc-400 space-y-1.5 leading-relaxed">
        <li>• <strong className="text-zinc-200">Sabah, aç karnına, tuvaletten sonra.</strong> Gün içinde bel çevresi yemek ve su yüzünden 3-4 cm oynar.</li>
        <li>• <strong className="text-zinc-200">Antrenmandan önce.</strong> Antrenman sonrası pompa kol ölçüsünü 1-2 cm şişirir, bu kas gelişimi değildir.</li>
        <li>• <strong className="text-zinc-200">Hep aynı taraf.</strong> Standart sağ taraftır. Sağ/sol arasında doğal fark vardır; taraf değiştirmek sahte artış üretir.</li>
        <li>• <strong className="text-zinc-200">Mezura cilde değsin ama batmasın.</strong> Sıkarsan küçük, gevşek bırakırsan büyük çıkar.</li>
        <li>• <strong className="text-zinc-200">Haftada birden sık ölçme.</strong> Çevre ölçüsü haftalık ölçekte anlamlı değişir; günlük dalgalanma gürültüdür.</li>
      </ul>
    </Block>

    <Block icon={<Ruler size={12} />} title="Çevre Ölçüleri">
      <ul className="space-y-2">
        {TAPE_SITES.map(([name, desc]) => (
          <li key={name} className="text-[10px] font-mono text-zinc-400 leading-relaxed">
            <strong className="text-zinc-200">{name}:</strong> {desc}
          </li>
        ))}
      </ul>
    </Block>

    <Block icon={<Droplet size={12} />} title="Kaliper (Deri Kıvrımı)">
      <div className="bg-orange-950/15 border border-orange-900/30 rounded-lg p-2.5 mb-2">
        <p className="text-[10px] font-mono text-orange-300/90 leading-relaxed">
          <strong className="text-orange-300">Kaliperin yoksa:</strong> Baş ve işaret parmağını ölçüm
          noktasının 6-8 cm iki yanına koy, deriyi ve altındaki yağı (kası kavramadan) 1-2 cm dışa
          çek. Parmakların arasında kalan katmanın genişliğini cetvelle mm cinsinden ölç.
          Kaliper kadar hassas değildir ama <strong className="text-orange-300">trendi</strong> takip
          etmek için yeterlidir — önemli olan mutlak değer değil, aynı yöntemle ölçülen değişimdir.
        </p>
      </div>
      <ul className="text-[10px] font-mono text-zinc-400 space-y-1.5 leading-relaxed mb-2">
        <li>• Kıvrımı çeneyle değil, <strong className="text-zinc-200">parmakla</strong> tut; kaliperi kıvrımın 1 cm altına yerleştir.</li>
        <li>• Kaliperi bıraktıktan <strong className="text-zinc-200">1-2 saniye sonra</strong> oku; doku sıkışmaya devam eder.</li>
        <li>• Her noktadan <strong className="text-zinc-200">2-3 ölçüm</strong> al, ortalamasını gir. Aralarında 1 mm'den fazla fark varsa tekrarla.</li>
        <li>• Tüm ölçümler vücudun <strong className="text-zinc-200">sağ tarafından</strong>.</li>
      </ul>
      <ul className="space-y-2">
        {SKINFOLD_SITES.map(([name, desc]) => (
          <li key={name} className="text-[10px] font-mono text-zinc-400 leading-relaxed">
            <strong className="text-zinc-200">{name}:</strong> {desc}
          </li>
        ))}
      </ul>
    </Block>

    <Block icon={<AlertTriangle size={12} />} title="Sık Yapılan Hatalar">
      <ul className="text-[10px] font-mono text-zinc-400 space-y-1.5 leading-relaxed">
        <li>• Kol ölçerken her seferinde farklı şiddette sıkmak — en yaygın hata.</li>
        <li>• Bel ölçerken karnı içe çekmek; ölçüm küçülür ama yağ oranı hesabı bozulur.</li>
        <li>• Göğsü şişirerek ölçmek.</li>
        <li>• Mezurayı çapraz tutmak; yere paralel olmayan her ölçüm büyük çıkar.</li>
        <li>• Tek bir ölçüme bakıp karar vermek. <strong className="text-zinc-200">Trend</strong> önemlidir, tek nokta değil.</li>
      </ul>
    </Block>
  </div>
));

MeasurementGuide.displayName = 'MeasurementGuide';

export default MeasurementGuide;
