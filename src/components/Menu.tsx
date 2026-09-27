/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MENU_ITEMS, GAME_CATEGORIES } from '../data';
import { Search, Heart, Award, AlertCircle } from 'lucide-react';

type Category = 'etlap' | 'itallap' | 'jatekok';

interface PriceCard {
  id: string;
  name: string;
  description?: string;
  priceLabel: string;
  isPopular?: boolean;
}

const formatPrice = (price: number | string) =>
  typeof price === 'number' ? `${price.toLocaleString('hu-HU')} Ft` : `${price} Ft`;

// A lapok kártyái: étlap és itallap az árlistából, a játékok az asztalok óradíjaiból
const CARDS: Record<Category, PriceCard[]> = {
  etlap: MENU_ITEMS.filter(i => i.category === 'etlap').map(i => ({ ...i, priceLabel: formatPrice(i.price) })),
  itallap: MENU_ITEMS.filter(i => i.category === 'itallap').map(i => ({ ...i, priceLabel: formatPrice(i.price) })),
  jatekok: GAME_CATEGORIES.map(c => ({
    id: `game-${c.type}`,
    name: c.name,
    description: `${c.description} (${c.count} db a szalonban)`,
    priceLabel: `${formatPrice(c.hourlyRate)} / óra`,
  })),
};

// A kártyákon a megnevezés és az ár színe lapok szerint: étlap és játékok zöld, itallap sárga
const ACCENT: Record<Category, string> = {
  etlap: 'text-emerald-400',
  itallap: 'text-amber-400',
  jatekok: 'text-emerald-400',
};

export default function Menu() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('etlap');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavs = localStorage.getItem('club11_menu_favorites');
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (e) {
        console.error('Error parsing menu favorites:', e);
      }
    }
  }, []);

  const toggleFavorite = (itemId: string) => {
    let updated: string[];
    if (favorites.includes(itemId)) {
      updated = favorites.filter(id => id !== itemId);
    } else {
      updated = [...favorites, itemId];
    }
    setFavorites(updated);
    localStorage.setItem('club11_menu_favorites', JSON.stringify(updated));
  };

  const categories = [
    { id: 'etlap', label: 'Étlap' },
    { id: 'itallap', label: 'Itallap' },
    { id: 'jatekok', label: 'Játékok' },
  ] as const;

  // Filter items based on category and search query
  const query = searchQuery.toLowerCase();
  const filteredItems = CARDS[selectedCategory].filter((item) =>
    item.name.toLowerCase().includes(query) ||
    (item.description && item.description.toLowerCase().includes(query))
  );
  const accent = ACCENT[selectedCategory];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 max-w-7xl mx-auto my-12 shadow-2xl" id="menu-section">
      
      {/* Header */}
      <div className="text-center space-y-4 mb-10">
        <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold block">Kávézó, Bisztró & Snackek</span>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Áraink</h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm">
          Frissülj fel a játék közben! Kiváló italok, kávék, sörök és ínycsiklandó meleg ételek, snackek várnak rád.
        </p>
      </div>

      {/* Search and Categories Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 pb-6 border-b border-slate-800/60">
        
        {/* Categories Tab list */}
        <div className="flex gap-2 justify-center md:justify-start w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              id={`menu-cat-${cat.id}`}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/10'
                  : 'bg-slate-950/60 text-slate-300 hover:text-white border border-slate-850 hover:border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            id="menu-search-input"
            placeholder="Keresés a kínálatban..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 font-medium"
          />
        </div>

      </div>

      {/* Menu Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const isFav = favorites.includes(item.id);
            return (
              <div
                key={item.id}
                id={`menu-item-${item.id}`}
                className="group relative p-5 bg-slate-950/40 rounded-2xl border border-slate-850 hover:border-slate-800 transition-all flex flex-col justify-between h-44 shadow-sm"
              >
                {/* Decorative border highlight on hover */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      {/* Popular indicator */}
                      {item.isPopular && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-mono font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                          <Award className="w-2.5 h-2.5" /> Közkedvelt
                        </span>
                      )}
                      <h3 className={`font-bold text-base ${accent} font-sans group-hover:text-emerald-400 transition-colors`}>
                        {item.name}
                      </h3>
                    </div>
                    
                    {/* Favorite heart button */}
                    <button
                      onClick={() => toggleFavorite(item.id)}
                      id={`fav-btn-${item.id}`}
                      className="text-slate-600 hover:text-rose-500 transition-colors p-1"
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}`} />
                    </button>
                  </div>

                  {item.description && (
                    <p className="text-xs text-slate-400 font-sans leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-800/40 pt-3 mt-3">
                  <span className="text-xs font-mono text-slate-500">Ár</span>
                  <span className={`font-sans font-black text-lg ${accent} group-hover:scale-105 transition-all`}>
                    {item.priceLabel}
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-950/20 rounded-2xl border border-dashed border-slate-800">
          <p className="text-sm text-slate-500 font-mono">
            Nem találtunk ilyen tételt a kínálatban. Kérlek próbálkozz más kifejezéssel!
          </p>
        </div>
      )}

      {/* Important Information / Notes Banner */}
      <div className="mt-12 p-6 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
        <div className="space-y-3 text-center md:text-left w-full">
          <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 tracking-wider block">Fontos információk / Megjegyzések</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-slate-300">
            <div className="flex items-center gap-2.5 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/50">
              <AlertCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-xs font-semibold leading-relaxed">+50 Ft DRS (visszaváltási díj) az italokra.</p>
            </div>
            <div className="flex items-center gap-2.5 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/50">
              <AlertCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-xs font-semibold leading-relaxed">Melegétel mindennap 20:00-ig rendelhető.</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
