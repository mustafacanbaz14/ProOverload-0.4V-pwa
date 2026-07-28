import React, { useState, memo } from 'react';
import { X, Search, Barcode, Plus, Loader2, Utensils } from 'lucide-react';
import { parseNumber } from '../utils/helpers';

const FoodSearchModal = memo(({ isOpen, onClose, onAddFoodToMeal }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('text'); // 'text' | 'barcode'
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [servingGram, setServingGram] = useState(100);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setLoading(true);
    setErrorMsg('');
    setResults([]);

    try {
      if (searchMode === 'barcode') {
        const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(query)}.json`);
        const data = await res.json();
        if (data.status === 1 && data.product) {
          const p = data.product;
          const nutriments = p.nutriments || {};
          setResults([{
            id: p.code || query,
            name: p.product_name_tr || p.product_name || 'Bilinmeyen Ürün',
            brand: p.brands || '',
            calories100g: Math.round(parseNumber(nutriments['energy-kcal_100g'] || nutriments['energy-kcal'])),
            protein100g: Math.round(parseNumber(nutriments.proteins_100g || nutriments.proteins) * 10) / 10,
            carbs100g: Math.round(parseNumber(nutriments.carbohydrates_100g || nutriments.carbohydrates) * 10) / 10,
            fats100g: Math.round(parseNumber(nutriments.fat_100g || nutriments.fat) * 10) / 10,
          }]);
        } else {
          setErrorMsg('Barkoda ait ürün bulunamadı.');
        }
      } else {
        const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=15`);
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          const mapped = data.products
            .filter(p => p.product_name || p.product_name_tr)
            .map(p => {
              const nutriments = p.nutriments || {};
              return {
                id: p.code || String(Math.random()),
                name: p.product_name_tr || p.product_name || 'Gıda Ürünü',
                brand: p.brands || '',
                calories100g: Math.round(parseNumber(nutriments['energy-kcal_100g'] || nutriments['energy-kcal'])),
                protein100g: Math.round(parseNumber(nutriments.proteins_100g || nutriments.proteins) * 10) / 10,
                carbs100g: Math.round(parseNumber(nutriments.carbohydrates_100g || nutriments.carbohydrates) * 10) / 10,
                fats100g: Math.round(parseNumber(nutriments.fat_100g || nutriments.fat) * 10) / 10,
              };
            });
          setResults(mapped);
        } else {
          setErrorMsg('Aramaya uygun gıda bulunamadı.');
        }
      }
    } catch {
      setErrorMsg('Arama sırasında bağlantı hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFood = (food) => {
    const factor = (parseNumber(servingGram) || 100) / 100;
    const computedFood = {
      name: `${food.name}${food.brand ? ` (${food.brand})` : ''} - ${servingGram}g`,
      calories: Math.round(food.calories100g * factor),
      protein: Math.round(food.protein100g * factor * 10) / 10,
      carbs: Math.round(food.carbs100g * factor * 10) / 10,
      fats: Math.round(food.fats100g * factor * 10) / 10,
    };
    onAddFoodToMeal(computedFood);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[85vh]">
        {/* Üst Bar */}
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
          <div className="flex items-center space-x-2">
            <Utensils size={18} className="text-orange-400" />
            <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">OpenFoodFacts Veritabanı</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 p-1">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-3 border-b border-zinc-800 bg-zinc-950">
          {/* Arama Modu Seçimi */}
          <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => { setSearchMode('text'); setSearchQuery(''); setResults([]); }}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-colors ${searchMode === 'text' ? 'bg-orange-600 text-white' : 'text-zinc-500'}`}
            >
              İsimle Ara
            </button>
            <button
              onClick={() => { setSearchMode('barcode'); setSearchQuery(''); setResults([]); }}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-colors flex items-center justify-center space-x-1 ${searchMode === 'barcode' ? 'bg-orange-600 text-white' : 'text-zinc-500'}`}
            >
              <Barcode size={12} className="mr-1" /> Barkod Gir
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSearch} className="flex space-x-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchMode === 'barcode' ? 'Barkod numarası (Örn: 869050400...)' : 'Ürün adı (Örn: Yulaf, Süt, Tavuk...)'}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono outline-none focus:border-orange-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-orange-600 active:bg-orange-700 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            </button>
          </form>

          <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-zinc-400">
            <span>Porsiyon Miktarı:</span>
            <div className="flex items-center space-x-1">
              <input
                type="number"
                value={servingGram}
                onChange={(e) => setServingGram(parseNumber(e.target.value) || 100)}
                className="w-14 bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-center font-mono text-orange-400 outline-none"
              />
              <span className="text-zinc-500">gram</span>
            </div>
          </div>
        </div>

        {/* Sonuç Listesi */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 hide-scrollbar">
          {errorMsg && (
            <div className="text-center py-6 text-zinc-500 font-mono text-xs">{errorMsg}</div>
          )}

          {results.map((food) => {
            const factor = (parseNumber(servingGram) || 100) / 100;
            const cal = Math.round(food.calories100g * factor);
            const p = Math.round(food.protein100g * factor * 10) / 10;
            const c = Math.round(food.carbs100g * factor * 10) / 10;
            const f = Math.round(food.fats100g * factor * 10) / 10;

            return (
              <div key={food.id} className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200 line-clamp-1">{food.name}</h4>
                    {food.brand && <span className="text-[9px] text-zinc-500 uppercase font-mono">{food.brand}</span>}
                  </div>
                  <button
                    onClick={() => handleSelectFood(food)}
                    className="bg-orange-950/40 border border-orange-900/50 text-orange-400 active:bg-orange-900/60 p-1.5 rounded-xl flex items-center space-x-1 text-[9px] font-bold uppercase transition-colors"
                  >
                    <Plus size={12} />
                    <span>Ekle</span>
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-1 text-[9px] font-mono text-center pt-1 border-t border-zinc-900">
                  <div className="bg-zinc-900 p-1 rounded-lg">
                    <span className="text-zinc-500 block text-[7px]">KALORİ</span>
                    <span className="text-cyan-400 font-bold">{cal}</span>
                  </div>
                  <div className="bg-zinc-900 p-1 rounded-lg">
                    <span className="text-zinc-500 block text-[7px]">PROT</span>
                    <span className="text-emerald-400 font-bold">{p}g</span>
                  </div>
                  <div className="bg-zinc-900 p-1 rounded-lg">
                    <span className="text-zinc-500 block text-[7px]">KARB</span>
                    <span className="text-amber-400 font-bold">{c}g</span>
                  </div>
                  <div className="bg-zinc-900 p-1 rounded-lg">
                    <span className="text-zinc-500 block text-[7px]">YAĞ</span>
                    <span className="text-purple-400 font-bold">{f}g</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

FoodSearchModal.displayName = 'FoodSearchModal';

export default FoodSearchModal;
