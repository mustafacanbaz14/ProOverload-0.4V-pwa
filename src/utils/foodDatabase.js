// Yerleşik besin veritabanı — 100 gram başına değerler.
//
// Değerler yaygın besin kompozisyon tablolarından alınmış YAKLAŞIK referanslardır;
// marka, pişirme yöntemi ve porsiyon büyüklüğüne göre sapma gösterir. Paketli bir
// ürünün kesin değeri için barkod aramasını kullanmak daha doğrudur.
//
// Alanlar: [ad, kategori, kcal, protein(g), karbonhidrat(g), yağ(g)]

const RAW = [
  // --- ET, TAVUK, BALIK ---
  ['Tavuk Göğsü (derisiz, pişmiş)', 'Et & Balık', 165, 31, 0, 3.6],
  ['Tavuk But (derisiz, pişmiş)', 'Et & Balık', 209, 26, 0, 10.9],
  ['Hindi Göğsü', 'Et & Balık', 135, 29, 0, 1.7],
  ['Dana Kıyma (%15 yağlı, pişmiş)', 'Et & Balık', 250, 26, 0, 15],
  ['Dana Bonfile (pişmiş)', 'Et & Balık', 212, 30, 0, 9.3],
  ['Kuzu Pirzola (pişmiş)', 'Et & Balık', 294, 25, 0, 21],
  ['Ton Balığı (suda, konserve)', 'Et & Balık', 116, 26, 0, 1],
  ['Somon (pişmiş)', 'Et & Balık', 208, 20, 0, 13],
  ['Hamsi', 'Et & Balık', 131, 20, 0, 4.8],
  ['Levrek', 'Et & Balık', 124, 23, 0, 2.6],
  ['Sardalya', 'Et & Balık', 208, 25, 0, 11.5],
  ['Karides', 'Et & Balık', 99, 24, 0.2, 0.3],
  ['Sucuk', 'Et & Balık', 458, 22, 2, 40],
  ['Salam', 'Et & Balık', 310, 18, 3, 25],
  ['Hindi Jambon', 'Et & Balık', 110, 17, 2, 3.5],

  // --- YUMURTA ---
  ['Yumurta (tam)', 'Yumurta', 155, 13, 1.1, 11],
  ['Yumurta Akı', 'Yumurta', 52, 11, 0.7, 0.2],
  ['Yumurta Sarısı', 'Yumurta', 322, 16, 3.6, 27],

  // --- SÜT ÜRÜNLERİ ---
  ['Süt (tam yağlı)', 'Süt Ürünleri', 61, 3.2, 4.8, 3.3],
  ['Süt (yarım yağlı)', 'Süt Ürünleri', 50, 3.3, 4.8, 1.6],
  ['Süt (yağsız)', 'Süt Ürünleri', 34, 3.4, 5, 0.1],
  ['Yoğurt (tam yağlı)', 'Süt Ürünleri', 61, 3.5, 4.7, 3.3],
  ['Yoğurt (light)', 'Süt Ürünleri', 45, 4.5, 6, 0.1],
  ['Süzme Yoğurt (Yunan)', 'Süt Ürünleri', 97, 9, 3.6, 5],
  ['Kefir', 'Süt Ürünleri', 55, 3.3, 4.5, 2.5],
  ['Ayran', 'Süt Ürünleri', 37, 1.7, 2.6, 1.9],
  ['Beyaz Peynir (tam yağlı)', 'Süt Ürünleri', 264, 17, 1.5, 21],
  ['Beyaz Peynir (light)', 'Süt Ürünleri', 180, 20, 2, 10],
  ['Kaşar Peyniri', 'Süt Ürünleri', 375, 25, 1.5, 30],
  ['Lor Peyniri', 'Süt Ürünleri', 98, 12, 3, 4],
  ['Çökelek', 'Süt Ürünleri', 130, 22, 2, 4],
  ['Labne', 'Süt Ürünleri', 250, 6, 4, 23],
  ['Tereyağı', 'Süt Ürünleri', 717, 0.9, 0.1, 81],

  // --- TAHIL & EKMEK ---
  ['Yulaf Ezmesi (kuru)', 'Tahıl', 389, 16.9, 66, 6.9],
  ['Pirinç (pişmiş)', 'Tahıl', 130, 2.7, 28, 0.3],
  ['Bulgur (pişmiş)', 'Tahıl', 83, 3.1, 19, 0.2],
  ['Makarna (pişmiş)', 'Tahıl', 158, 5.8, 31, 0.9],
  ['Kepekli Makarna (pişmiş)', 'Tahıl', 124, 5, 25, 0.5],
  ['Tam Buğday Ekmeği', 'Tahıl', 247, 13, 41, 3.4],
  ['Beyaz Ekmek', 'Tahıl', 265, 9, 49, 3.2],
  ['Simit', 'Tahıl', 320, 9.5, 60, 4],
  ['Lavaş', 'Tahıl', 275, 8, 55, 1.5],
  ['Kinoa (pişmiş)', 'Tahıl', 120, 4.4, 21, 1.9],
  ['Mısır Gevreği', 'Tahıl', 357, 7, 84, 0.4],
  ['Granola', 'Tahıl', 471, 10, 64, 20],

  // --- BAKLAGİL ---
  ['Mercimek (pişmiş)', 'Baklagil', 116, 9, 20, 0.4],
  ['Nohut (pişmiş)', 'Baklagil', 164, 8.9, 27, 2.6],
  ['Kuru Fasulye (pişmiş)', 'Baklagil', 127, 8.7, 23, 0.5],
  ['Barbunya (pişmiş)', 'Baklagil', 127, 9, 22, 0.5],
  ['Soya Fasulyesi (pişmiş)', 'Baklagil', 172, 18, 8.4, 9],

  // --- SEBZE ---
  ['Brokoli', 'Sebze', 34, 2.8, 7, 0.4],
  ['Ispanak', 'Sebze', 23, 2.9, 3.6, 0.4],
  ['Domates', 'Sebze', 18, 0.9, 3.9, 0.2],
  ['Salatalık', 'Sebze', 15, 0.7, 3.6, 0.1],
  ['Marul', 'Sebze', 15, 1.4, 2.9, 0.2],
  ['Havuç', 'Sebze', 41, 0.9, 10, 0.2],
  ['Patates (haşlanmış)', 'Sebze', 87, 1.9, 20, 0.1],
  ['Tatlı Patates (pişmiş)', 'Sebze', 90, 2, 21, 0.1],
  ['Kabak', 'Sebze', 17, 1.2, 3.1, 0.3],
  ['Patlıcan', 'Sebze', 25, 1, 6, 0.2],
  ['Yeşil Biber', 'Sebze', 20, 0.9, 4.6, 0.2],
  ['Soğan', 'Sebze', 40, 1.1, 9.3, 0.1],
  ['Karnabahar', 'Sebze', 25, 1.9, 5, 0.3],
  ['Yeşil Fasulye', 'Sebze', 31, 1.8, 7, 0.2],
  ['Bezelye', 'Sebze', 81, 5.4, 14, 0.4],
  ['Mantar', 'Sebze', 22, 3.1, 3.3, 0.3],

  // --- MEYVE ---
  ['Muz', 'Meyve', 89, 1.1, 23, 0.3],
  ['Elma', 'Meyve', 52, 0.3, 14, 0.2],
  ['Portakal', 'Meyve', 47, 0.9, 12, 0.1],
  ['Çilek', 'Meyve', 32, 0.7, 7.7, 0.3],
  ['Üzüm', 'Meyve', 69, 0.7, 18, 0.2],
  ['Karpuz', 'Meyve', 30, 0.6, 7.6, 0.2],
  ['Kavun', 'Meyve', 34, 0.8, 8.2, 0.2],
  ['Armut', 'Meyve', 57, 0.4, 15, 0.1],
  ['Şeftali', 'Meyve', 39, 0.9, 10, 0.3],
  ['Ananas', 'Meyve', 50, 0.5, 13, 0.1],
  ['Kivi', 'Meyve', 61, 1.1, 15, 0.5],
  ['Avokado', 'Meyve', 160, 2, 8.5, 15],
  ['Kuru Kayısı', 'Meyve', 241, 3.4, 63, 0.5],
  ['Kuru İncir', 'Meyve', 249, 3.3, 64, 0.9],
  ['Hurma', 'Meyve', 282, 2.5, 75, 0.4],

  // --- KURUYEMİŞ & YAĞ ---
  ['Badem', 'Kuruyemiş & Yağ', 579, 21, 22, 50],
  ['Ceviz', 'Kuruyemiş & Yağ', 654, 15, 14, 65],
  ['Fındık', 'Kuruyemiş & Yağ', 628, 15, 17, 61],
  ['Antep Fıstığı', 'Kuruyemiş & Yağ', 560, 20, 28, 45],
  ['Yer Fıstığı', 'Kuruyemiş & Yağ', 567, 26, 16, 49],
  ['Fıstık Ezmesi', 'Kuruyemiş & Yağ', 588, 25, 20, 50],
  ['Kaju', 'Kuruyemiş & Yağ', 553, 18, 30, 44],
  ['Ay Çekirdeği', 'Kuruyemiş & Yağ', 584, 21, 20, 51],
  ['Tahin', 'Kuruyemiş & Yağ', 595, 17, 21, 54],
  ['Chia Tohumu', 'Kuruyemiş & Yağ', 486, 17, 42, 31],
  ['Zeytinyağı', 'Kuruyemiş & Yağ', 884, 0, 0, 100],
  ['Ayçiçek Yağı', 'Kuruyemiş & Yağ', 884, 0, 0, 100],
  ['Siyah Zeytin', 'Kuruyemiş & Yağ', 115, 0.8, 6, 11],

  // --- TÜRK MUTFAĞI & HAZIR YEMEK ---
  ['Mercimek Çorbası', 'Türk Mutfağı', 60, 3, 9, 1.5],
  ['Pilav (tereyağlı)', 'Türk Mutfağı', 180, 3.5, 32, 4],
  ['Menemen', 'Türk Mutfağı', 95, 5, 5, 6],
  ['Lahmacun', 'Türk Mutfağı', 240, 10, 33, 8],
  ['Kıymalı Pide', 'Türk Mutfağı', 260, 11, 35, 8],
  ['Tavuk Döner', 'Türk Mutfağı', 220, 20, 3, 14],
  ['Et Döner', 'Türk Mutfağı', 280, 22, 3, 20],
  ['İskender', 'Türk Mutfağı', 290, 18, 25, 14],
  ['Izgara Köfte', 'Türk Mutfağı', 240, 18, 5, 16],
  ['Kuru Fasulye Yemeği', 'Türk Mutfağı', 130, 7, 20, 3],
  ['Karnıyarık', 'Türk Mutfağı', 120, 4, 10, 7],
  ['Yaprak Sarma', 'Türk Mutfağı', 180, 3, 22, 9],
  ['Peynirli Börek', 'Türk Mutfağı', 300, 8, 30, 17],
  ['Baklava', 'Türk Mutfağı', 430, 6, 50, 23],
  ['Sütlaç', 'Türk Mutfağı', 145, 3.5, 25, 3.5],
  ['Künefe', 'Türk Mutfağı', 350, 8, 40, 18],

  // --- İÇECEK ---
  ['Türk Kahvesi (sade)', 'İçecek', 2, 0.2, 0.3, 0],
  ['Çay (şekersiz)', 'İçecek', 1, 0, 0.2, 0],
  ['Kola', 'İçecek', 42, 0, 10.6, 0],
  ['Portakal Suyu', 'İçecek', 45, 0.7, 10, 0.2],

  // --- TAKVİYE ---
  ['Whey Protein Tozu', 'Takviye', 400, 80, 8, 5],
  ['Kazein Protein Tozu', 'Takviye', 370, 78, 6, 3],
  ['Protein Bar', 'Takviye', 350, 30, 35, 10],
  ['Maltodekstrin', 'Takviye', 380, 0, 95, 0],
];

export const FOOD_DATABASE = RAW.map(([name, category, kcal, protein, carbs, fats], i) => ({
  id: `local-${i}`,
  name,
  category,
  brand: '',
  source: 'local',
  calories100g: kcal,
  protein100g: protein,
  carbs100g: carbs,
  fats100g: fats,
}));

export const FOOD_CATEGORIES = [...new Set(FOOD_DATABASE.map(f => f.category))];
