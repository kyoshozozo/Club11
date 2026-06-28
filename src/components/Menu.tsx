/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MENU_ITEMS } from '../data';
import { MenuItem } from '../types';
import { Search, Heart, Award, Coffee, Beer, Sparkles } from 'lucide-react';

export default function Menu() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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
    { id: 'all', label: 'Teljes kínálat', icon: Sparkles },
    { id: 'coffee', label: 'Kávé Különlegességek', icon: Coffee },
    { id: 'beer', label: 'Sörök', icon: Beer },
    { id: 'soft', label: 'Frissítő Üdítők', icon: Sparkles },
    { id: 'cocktail', label: 'Koktélok & Rövidek', icon: Award },
    { id: 'snack', label: 'Snackek & Harapnivalók', icon: Coffee },
  ];

  // Filter items based on category and search query
  const filteredItems = MENU_ITEMS.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 max-w-7xl mx-auto my-12 shadow-2xl" id="menu-section">
      
      {/* Header */}
      <div className="text-center space-y-4 mb-10">
        <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold block">Kávézó, Bár & Snackek</span>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Ital- és Étlapunk</h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm">
          Frissülj fel a játék közben! Kiváló olasz kávék, jéghideg csapolt sörök, koktélok és a legendás házi melegszendvicsünk várnak rád.
        </p>
      </div>

      {/* Search and Categories Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 pb-6 border-b border-slate-800/60">
        
        {/* Categories Tab list */}
        <div className="flex flex-wrap gap-2 justify-center md:justify-start w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              id={`menu-cat-${cat.id}`}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
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
            placeholder="Keresés az étlapon..."
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
                      <h3 className="font-bold text-base text-white font-sans group-hover:text-emerald-400 transition-colors">
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
                  <span className="text-xs font-mono text-slate-500">Egységár</span>
                  <span className="font-sans font-black text-lg text-white group-hover:scale-105 transition-all">
                    {item.price.toLocaleString('hu-HU')} Ft
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-950/20 rounded-2xl border border-dashed border-slate-800">
          <p className="text-sm text-slate-500 font-mono">
            Nem találtunk ilyen tételt az étlapon. Kérlek próbálkozz más kifejezéssel!
          </p>
        </div>
      )}

      {/* Special Offer Alert Banner */}
      <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-emerald-500/5">
        <div className="space-y-1 text-center md:text-left">
          <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 tracking-wider block">Ajánlatunk a Bajnokoknak!</span>
          <h4 className="font-bold text-base text-white">Próbáld ki a Helyi Kedvencet! 🥪</h4>
          <p className="text-xs text-slate-400 max-w-xl font-sans">
            A ropogós, házi melegszendvicsünk (sonkás-gombás-sajtos / szalámis-sajtos) legendás hírű Újbudán. Kérd hideg Soproni vagy Heineken csapolt sörrel!
          </p>
        </div>
        <div className="text-center font-mono">
          <span className="text-xs text-slate-500 block">Kombó ár kb.</span>
          <span className="text-2xl font-black text-emerald-400">2080 Ft</span>
        </div>
      </div>

    </div>
  );
}
