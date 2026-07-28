import React, { useState, useMemo, memo } from 'react';
import { X, Search, Barcode, Plus, Loader2, Utensils, Database, Star, Trash2, Save, Globe } from 'lucide-react';
import { parseNumber, foldForSearch } from '../utils/helpers';
import { FOOD_DATABASE, FOOD_CATEGORIES } from '../utils/foodDatabase';

const EMPTY_CUSTOM = { name: '', calories100g: '', protein100g: '', carbs100g: '', fats100g: '' };

const FoodSearchModal = memo(({
  isOpen,
  onClose,
  onAddFoodToMeal,
  customFoods = [],
  setCustomFoods,
}) => {
  const [tab, setTab] = useState('local'); // 'local' | 'online' | 'custom'
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Tümü');
  const [servingGram, setServingGram] = useState(100);

  const [onlineMode, setOnlineMode] = useState('text'); // 'text' | 'barcode'
  const [loading, setLoading] = useState(false);
  const [onlineResults, setOnlineResults] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const [customForm, setCustomForm] = useState(EMPTY_CUSTOM);

  // Yerel liste: kullanıcının kendi besinleri her zaman en üstte.
  const localResults = useMemo(() => {
    const all = [...customFoods, ...FOOD_DATABASE];
    const q = foldForSearch(query).trim();
    return all.filter(f => {
      if (category !== 'Tümü' && f.category !== category) return false;
      if (!q) return true;
      return foldForSearch(f.name).includes(q);
    });
  }, [customFoods, query, category]);

  if (!isOpen) return null;

  const runOnlineSearch = async (e) => {
    if (e) e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setErrorMsg('');
    setOnlineResults([]);

    const mapProduct = (p) => {
      const n = p.nutriments || {};
      return {
        id: p.code || String(Math.random()),
        name: p.product_name_tr || p.product_name || 'Gıda Ürünü',
        brand: p.brands || '',
        source: 'online',
        calories100g: Math.round(parseNumber(n['energy-kcal_100g'] ?? n['energy-kcal'])),
        protein100g: Math.round(parseNumber(n.proteins_100g ?? n.proteins) * 10) / 10,
        carbs100g: Math.round(parseNumber(n.carbohydrates_100g ?? n.carbohydrates) * 10) / 10,
        fats100g: Math.round(parseNumber(n.fat_100g ?? n.fat) * 10) / 10,
      };
    };

    try {
      if (onlineMode === 'barcode') {
        const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(q)}.json`);
        const data = await res.json();
        if (data.status === 1 && data.product) setOnlineResults([mapProduct(data.product)]);
        else setErrorMsg('Bu barkoda ait ürün bulunamadı.');
      } else {
        const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=20`);
        const data = await res.json();
        const mapped = (data.products || [])
          .filter(p => p.product_name || p.product_name_tr)
          .map(mapProduct)
          .filter(f => f.calories100g > 0);
        if (mapped.length) setOnlineResults(mapped);
        else setErrorMsg('Aramaya uygun ürün bulunamadı.');
      }
    } catch {
      setErrorMsg('Bağlantı kurulamadı. Çevrimdışıysan yerel listeyi kullanabilirsin.');
    } finally {
      setLoading(false);
    }
  };

  const addToMeal = (food) => {
    const factor = (parseNumber(servingGram) || 100) / 100;
    onAddFoodToMeal({
      name: `${food.name}${food.brand ? ` (${food.brand})` : ''} · ${servingGram}g`,
      calories: Math.round(food.calories100g * factor),
      protein: Math.round(food.protein100g * factor * 10) / 10,
      carbs: Math.round(food.carbs100g * factor * 10) / 10,
      fats: Math.round(food.fats100g * factor * 10) / 10,
    });
    onClose();
  };

  // Makrolardan kalori tahmini: kullanıcı kalori alanını boş bırakırsa bu değer kullanılır.
  const estimatedKcal = Math.round(
    parseNumber(customForm.protein100g) * 4 +
    parseNumber(customForm.carbs100g) * 4 +
    parseNumber(customForm.fats100g) * 9
  );

  const saveCustomFood = () => {
    const name = customForm.name.trim();
    if (!name) return;
    const entry = {
      id: `custom-${Date.now()}`,
      name,
      category: 'Kendi Besinlerim',
      brand: '',
      source: 'custom',
      calories100g: parseNumber(customForm.calories100g) || estimatedKcal,
      protein100g: parseNumber(customForm.protein100g),
      carbs100g: parseNumber(customForm.carbs100g),
      fats100g: parseNumber(customForm.fats100g),
    };
    setCustomFoods(prev => [entry, ...prev]);
    setCustomForm(EMPTY_CUSTOM);
    setQuery('');
    setTab('local');
    setCategory('Kendi Besinlerim');
  };

  const categories = ['Tümü', ...(customFoods.length ? ['Kendi Besinlerim'] : []), ...FOOD_CATEGORIES];
  const results = tab === 'online' ? onlineResults : localResults;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[88dvh]">

        <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 shrink-0">
          <h3 className="text-[11px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
            <Utensils size={15} className="mr-2 text-orange-400" /> Besin Ekle
          </h3>
          <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1" aria-label="Kapat">
            <X size={18} />
          </button>
        </div>

        <div className="p-3 space-y-3 border-b border-zinc-800 bg-zinc-950 shrink-0">
          <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            {[
              { key: 'local', label: 'Yerel', icon: Database },
              { key: 'online', label: 'Çevrimiçi', icon: Globe },
              { key: 'custom', label: 'Yeni Besin', icon: Plus },
            ].map(t => {
              const active = tab === t.key;
              const TabIcon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setErrorMsg(''); }}
                  className={`flex-1 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center ${active ? 'bg-orange-600 text-white' : 'text-zinc-500'}`}
                >
                  <TabIcon size={11} className="mr-1" /> {t.label}
                </button>
              );
            })}
          </div>

          {tab !== 'custom' && (
            <>
              {tab === 'online' && (
                <div className="flex gap-2">
                  {[
                    { key: 'text', label: 'İsimle', icon: Search },
                    { key: 'barcode', label: 'Barkod', icon: Barcode },
                  ].map(m => {
                    const ModeIcon = m.icon;
                    return (
                      <button
                        key={m.key}
                        onClick={() => { setOnlineMode(m.key); setQuery(''); setOnlineResults([]); setErrorMsg(''); }}
                        className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase border transition-colors flex items-center justify-center ${onlineMode === m.key ? 'border-orange-600 text-orange-400 bg-orange-950/20' : 'border-zinc-800 text-zinc-500'}`}
                      >
                        <ModeIcon size={11} className="mr-1" /> {m.label}
                      </button>
                    );
                  })}
                </div>
              )}

              <form onSubmit={tab === 'online' ? runOnlineSearch : (e) => e.preventDefault()} className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={tab === 'online' && onlineMode === 'barcode' ? 'Barkod numarası' : 'Besin adı ara...'}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-100 font-mono outline-none focus:border-orange-500 transition-colors"
                />
                {tab === 'online' && (
                  <button type="submit" disabled={loading} className="bg-orange-600 active:bg-orange-700 text-white px-4 rounded-xl flex items-center justify-center">
                    {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                  </button>
                )}
              </form>

              {tab === 'local' && (
                <div className="flex gap-1.5 overflow-x-auto hide-scrollbar -mx-1 px-1">
                  {categories.map(c => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wide border transition-colors ${category === c ? 'border-orange-600 text-orange-400 bg-orange-950/20' : 'border-zinc-800 text-zinc-500'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                <span>Porsiyon</span>
                <div className="flex items-center gap-1.5">
                  {[50, 100, 150, 200].map(g => (
                    <button
                      key={g}
                      onClick={() => setServingGram(g)}
                      className={`px-2 py-1 rounded-lg border text-[9px] font-bold transition-colors ${servingGram === g ? 'border-orange-600 text-orange-400' : 'border-zinc-800 text-zinc-500'}`}
                    >
                      {g}
                    </button>
                  ))}
                  <input
                    type="number" inputMode="numeric"
                    value={servingGram}
                    onChange={(e) => setServingGram(parseNumber(e.target.value) || 0)}
                    className="w-14 bg-zinc-900 border border-zinc-800 rounded-lg py-1 text-center font-mono text-orange-400 outline-none"
                  />
                  <span className="text-zinc-500">g</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* --- İÇERİK --- */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 hide-scrollbar">
          {tab === 'custom' ? (
            <div className="space-y-3">
              <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">
                100 gram başına değerleri gir. Kaydettiğin besin yerel listede
                &quot;Kendi Besinlerim&quot; altında kalıcı olarak durur.
              </p>

              <input
                type="text"
                value={customForm.name}
                onChange={(e) => setCustomForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Besin adı (örn. Annemin Mercimek Köftesi)"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-100 font-mono outline-none focus:border-orange-500"
              />

              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'protein100g', label: 'Protein (g)', color: 'text-emerald-400' },
                  { key: 'carbs100g', label: 'Karbonhidrat (g)', color: 'text-amber-400' },
                  { key: 'fats100g', label: 'Yağ (g)', color: 'text-purple-400' },
                  { key: 'calories100g', label: 'Kalori (kcal)', color: 'text-cyan-400' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">{f.label}</label>
                    <input
                      type="number" inputMode="decimal" step="0.1"
                      value={customForm[f.key]}
                      onChange={(e) => setCustomForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.key === 'calories100g' && estimatedKcal > 0 ? String(estimatedKcal) : '0'}
                      className={`w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-center outline-none focus:border-orange-500 ${f.color}`}
                    />
                  </div>
                ))}
              </div>

              {estimatedKcal > 0 && (
                <div className="text-[9px] font-mono text-zinc-500 bg-zinc-950 border border-zinc-800 rounded-xl p-2.5">
                  Makrolara göre tahmini kalori: <strong className="text-cyan-400">{estimatedKcal} kcal</strong>
                  {' '}— kalori alanını boş bırakırsan bu değer kullanılır.
                </div>
              )}

              <button
                onClick={saveCustomFood}
                disabled={!customForm.name.trim()}
                className="w-full bg-orange-600 active:bg-orange-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-3 rounded-xl text-[11px] uppercase tracking-wider flex items-center justify-center transition-colors"
              >
                <Save size={14} className="mr-2" /> Besini Kaydet
              </button>
            </div>
          ) : (
            <>
              {errorMsg && <div className="text-center py-6 text-zinc-500 font-mono text-[10px] px-4">{errorMsg}</div>}
              {!errorMsg && results.length === 0 && (
                <div className="text-center py-8 text-zinc-600 font-mono text-[10px]">
                  {tab === 'online' ? 'Aramak için bir şeyler yaz.' : 'Eşleşen besin yok.'}
                </div>
              )}

              {results.map((food) => {
                const factor = (parseNumber(servingGram) || 100) / 100;
                const macros = [
                  { label: 'KCAL', value: Math.round(food.calories100g * factor), color: 'text-cyan-400' },
                  { label: 'PROT', value: `${Math.round(food.protein100g * factor * 10) / 10}g`, color: 'text-emerald-400' },
                  { label: 'KARB', value: `${Math.round(food.carbs100g * factor * 10) / 10}g`, color: 'text-amber-400' },
                  { label: 'YAĞ', value: `${Math.round(food.fats100g * factor * 10) / 10}g`, color: 'text-purple-400' },
                ];
                return (
                  <div key={food.id} className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h4 className="text-[11px] font-bold text-zinc-200 flex items-center">
                          {food.source === 'custom' && <Star size={10} className="mr-1 text-orange-400 shrink-0" fill="currentColor" />}
                          <span className="truncate">{food.name}</span>
                        </h4>
                        <span className="text-[8px] text-zinc-500 uppercase font-mono tracking-wider">
                          {food.brand || food.category || 'Çevrimiçi'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {food.source === 'custom' && (
                          <button
                            onClick={() => setCustomFoods(prev => prev.filter(f => f.id !== food.id))}
                            title="Bu özel besini sil"
                            className="text-zinc-600 active:text-red-500 p-1.5"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => addToMeal(food)}
                          className="bg-orange-950/40 border border-orange-900/50 text-orange-400 active:bg-orange-900/60 px-2.5 py-1.5 rounded-xl flex items-center text-[9px] font-bold uppercase transition-colors"
                        >
                          <Plus size={11} className="mr-0.5" /> Ekle
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-1 text-[9px] font-mono text-center pt-1 border-t border-zinc-900">
                      {macros.map(m => (
                        <div key={m.label} className="bg-zinc-900 py-1 rounded-lg">
                          <span className="text-zinc-500 block text-[7px]">{m.label}</span>
                          <span className={`${m.color} font-bold`}>{m.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

FoodSearchModal.displayName = 'FoodSearchModal';

export default FoodSearchModal;
