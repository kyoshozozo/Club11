/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navigation, ShieldCheck, ArrowRight, Flame, Gamepad2, Coffee } from 'lucide-react';
import Club11Logo from './Club11Logo';
import { OPENING_HOURS, budapestNow, MENU_ITEMS, TABLE_CATEGORIES } from '../data';

// A kiemelt snack neve és ára az árlistából jön, így nem térhet el tőle
const FEATURED_SNACK = MENU_ITEMS.find(item => item.id === 'et-nachos')!;

// A bisztró pillér kiemelt tételei (csak olyan, ami az árlistában is szerepel)
const BISTRO_HIGHLIGHTS = ['Illy kávék', 'Retró melegszendvics', 'Nachos sajtszósszal', 'Csapolt sör: Dreher Gold és Pilsner'];

interface HeroProps {
  onStartBooking: () => void;
  onExploreMenu: () => void;
  onOpenChat: () => void;
}

// Nyitva/zárva a közös nyitvatartás (src/data.ts) és a budapesti idő alapján
function getOpenStatus() {
  const now = budapestNow();
  const hours = OPENING_HOURS[now.day];
  return {
    isOpen: !!hours && now.hour >= hours.open && now.hour < hours.close,
    time: `${String(now.hour).padStart(2, '0')}:${String(now.minute).padStart(2, '0')}`,
  };
}

export default function Hero({ onStartBooking, onExploreMenu, onOpenChat }: HeroProps) {
  // Már az első megjelenéskor a helyes állapot látszik (nincs üres idő / téves "ZÁRVA" villanás)
  const [status, setStatus] = useState(getOpenStatus);
  const { isOpen, time: currentTime } = status;

  useEffect(() => {
    const interval = setInterval(() => setStatus(getOpenStatus()), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative bg-slate-950 overflow-hidden py-16 lg:py-24" id="home-section">
      {/* Background Image Overlay with deep slate tint */}
      <div className="absolute inset-0 z-0 opacity-30" aria-hidden="true">
        <div className="w-full h-full filter blur-[2px] [&>svg]:w-full [&>svg]:h-full">
          <BilliardHallIllustration slice />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>
      </div>

      {/* Decorative colored glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full filter blur-3xl z-0 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full filter blur-3xl z-0 pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero text panel */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            
            {/* Brand Logo Showcase */}
            <div className="flex justify-center lg:justify-start -mb-4">
              <Club11Logo className="w-48 h-48 text-white hover:text-emerald-400 transition-all cursor-pointer" glow={true} />
            </div>

            {/* Live status badge */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 shadow-inner justify-center mx-auto lg:mx-0">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOpen ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              </span>
              <span>Helyi idő: <strong className="text-white">{currentTime}</strong></span>
              <span className="text-slate-600">|</span>
              <span className={isOpen ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                {isOpen ? 'NYITVA VAGYUNK' : 'ZÁRVA VAGYUNK'}
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                Biliárd, játékok és <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-300">
                  Szórakozás Újbudán
                </span>
              </h1>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 font-sans leading-relaxed">
                Üdvözlünk a <strong>Club 11</strong>-ben! Egy igazi családi vállalkozás, ahol a billiárd szerelmesei, a csapatépítők kedvelői és a kikapcsolódni vágyó baráti társaságok találkoznak. Keress minket Budapest 11. kerületében!
              </p>
            </div>

            {/* Két egyenrangú pillér: Játék és Kávézó & Bisztró */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left" id="hero-pillars">
              <div className="flex flex-col justify-between gap-4 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30" id="hero-pillar-games">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Gamepad2 className="w-5 h-5" />
                    <h2 className="text-lg font-black text-white">Játék</h2>
                  </div>
                  <ul className="text-sm text-slate-300 space-y-1">
                    {TABLE_CATEGORIES.map(c => (
                      <li key={c.type}>
                        <span className="font-mono font-bold text-emerald-400">{c.count}×</span> {c.name.replace(' Asztal', '').replace(' Gép', '')}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={onStartBooking}
                  id="hero-booking-cta"
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20"
                >
                  Asztalfoglalás
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col justify-between gap-4 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30" id="hero-pillar-bistro">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Coffee className="w-5 h-5" />
                    <h2 className="text-lg font-black text-white">Kávézó és bisztró</h2>
                  </div>
                  <ul className="text-sm text-slate-300 space-y-1">
                    {BISTRO_HIGHLIGHTS.map(name => (
                      <li key={name}><span className="text-amber-400">•</span> {name}</li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={onExploreMenu}
                  id="hero-menu-cta"
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20"
                >
                  Étlap és itallap
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-6 justify-center lg:justify-start text-xs text-slate-400 font-mono pt-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Online asztalfoglalás
              </span>
              <span className="flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-emerald-500" />
                Hauszmann Alajos utca 5.
              </span>
            </div>
          </div>

          {/* Interactive Hero Banner / Feature Cards */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-sm rounded-3xl overflow-hidden border-4 border-slate-800 bg-slate-900 shadow-2xl shadow-emerald-500/5">
              
              {/* Card visual header */}
              <div className="relative h-48 bg-slate-950 overflow-hidden">
                <div className="w-full h-full opacity-75" role="img" aria-label="Biliárd asztalok illusztráció">
                  <BilliardHallIllustration slice />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                
                {/* Float tag */}
                <span className="absolute top-4 right-4 bg-emerald-500 text-slate-950 font-mono text-[11px] font-black px-2 py-1 rounded-md uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-current animate-bounce" />
                  Kiemelt Helyszín
                </span>
                
                <div className="absolute bottom-4 left-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">Budapest, XI. kerület</span>
                  <h3 className="text-xl font-black text-white">Gabányi László Sportcsarnok</h3>
                </div>
              </div>

              {/* Card content list */}
              <div className="p-6 space-y-5 bg-gradient-to-b from-slate-900 to-slate-950">
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Miért a Club 11?</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Több mint egy biliárdszalon: családi vállalkozásként olyan helyet teremtettünk, ahol a játék mellé egy finom Illy kávé, egy retró melegszendvics vagy egy hideg csapolt sör is jár. Gyere egyedül, a barátaiddal vagy a családdal!
                  </p>
                </div>

                <div className="border-t border-slate-800/80 pt-4 space-y-3 text-xs font-mono">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-500">Pool Biliárd</span>
                    <span className="text-emerald-400 font-bold">6 asztal</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-500">Soft Darts</span>
                    <span className="text-emerald-400 font-bold">2 gép</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-500">Csocsó</span>
                    <span className="text-emerald-400 font-bold">2 asztal</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-500">{FEATURED_SNACK.name}</span>
                    <span className="text-emerald-400 font-bold">{FEATURED_SNACK.price.toLocaleString('hu-HU')} Ft</span>
                  </div>
                </div>

                <button
                  onClick={onOpenChat}
                  id="hero-chat-prompt"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 text-xs font-bold font-mono transition-all"
                >
                  Kérdezz az AI Csapostól!
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function BilliardHallIllustration({ slice = false }: { slice?: boolean }) {
  return (
    <svg
      viewBox="0 0 400 200"
      className="w-full h-full"
      preserveAspectRatio={slice ? 'xMidYMid slice' : 'xMidYMid meet'}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background Room Gradient */}
      <defs>
        <radialGradient id="roomBg" cx="50%" cy="30%" r="85%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="65%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>
        
        {/* Lamp light beam gradient */}
        <linearGradient id="lampBeam" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.55" />
          <stop offset="35%" stopColor="#fef08a" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
        </linearGradient>

        {/* Felt gradients */}
        <linearGradient id="greenFelt" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        <linearGradient id="blueFelt" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>

        {/* Wood gradient */}
        <linearGradient id="woodTable" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#78350f" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>
        
        {/* Soft shadow for tables */}
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Background */}
      <rect width="400" height="200" fill="url(#roomBg)" />

      {/* Left side windows soft natural light ambient */}
      <path d="M 0 40 L 45 48 L 45 152 L 0 160 Z" fill="#38bdf8" opacity="0.08" />
      <path d="M 0 60 L 30 65 L 30 135 L 0 140 Z" fill="#38bdf8" opacity="0.05" />

      {/* Row of Blue Felt Tables in background (Perspective) */}
      {/* Table 3 (Furthest) */}
      <g transform="translate(195, 42) scale(0.35)" filter="url(#shadow)" opacity="0.7">
        <polygon points="0,35 120,0 240,35 120,70" fill="url(#woodTable)" />
        <polygon points="10,35 120,5 230,35 120,65" fill="url(#blueFelt)" />
        <circle cx="120" cy="5" r="4" fill="#111" />
        <circle cx="10" cy="35" r="4" fill="#111" />
        <circle cx="230" cy="35" r="4" fill="#111" />
        <circle cx="120" cy="65" r="4" fill="#111" />
      </g>

      {/* Table 2 (Middle Background) */}
      <g transform="translate(145, 58) scale(0.55)" filter="url(#shadow)" opacity="0.85">
        <polygon points="0,35 120,0 240,35 120,70" fill="url(#woodTable)" />
        <polygon points="10,35 120,5 230,35 120,65" fill="url(#blueFelt)" />
        <circle cx="120" cy="5" r="5" fill="#111" />
        <circle cx="10" cy="35" r="5" fill="#111" />
        <circle cx="230" cy="35" r="5" fill="#111" />
        <circle cx="120" cy="65" r="5" fill="#111" />
      </g>

      {/* Table 1 (Foreground Background) */}
      <g transform="translate(95, 82) scale(0.75)" filter="url(#shadow)">
        <polygon points="0,35 120,0 240,35 120,70" fill="url(#woodTable)" />
        <polygon points="10,35 120,5 230,35 120,65" fill="url(#blueFelt)" />
        <circle cx="120" cy="5" r="6" fill="#111" />
        <circle cx="10" cy="35" r="6" fill="#111" />
        <circle cx="230" cy="35" r="6" fill="#111" />
        <circle cx="120" cy="65" r="6" fill="#111" />
      </g>

      {/* Foreground Green Felt Table (Brunswick Pool / Snooker) */}
      <g transform="translate(100, 112) scale(1.18)" filter="url(#shadow)">
        <ellipse cx="110" cy="72" rx="100" ry="12" fill="#000" opacity="0.5" />
        <rect x="35" y="55" width="12" height="25" fill="#1e1b4b" rx="2" />
        <rect x="165" y="55" width="12" height="25" fill="#1e1b4b" rx="2" />
        <polygon points="0,40 110,0 220,40 110,80" fill="#020617" stroke="#334155" strokeWidth="2.5" />
        <polygon points="6,40 110,4 214,40 110,76" fill="#065f46" />
        <polygon points="12,40 110,8 208,40 110,72" fill="url(#greenFelt)" />
        <circle cx="110" cy="8" r="7" fill="#111" />
        <circle cx="12" cy="40" r="7" fill="#111" />
        <circle cx="208" cy="40" r="7" fill="#111" />
        <circle cx="110" cy="72" r="7" fill="#111" />
        <circle cx="56" cy="24" r="5" fill="#111" />
        <circle cx="164" cy="24" r="5" fill="#111" />
        <circle cx="56" cy="56" r="5" fill="#111" />
        <circle cx="164" cy="56" r="5" fill="#111" />

        {/* Cues resting on table */}
        <line x1="45" y1="42" x2="175" y2="35" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="45" y1="42" x2="65" y2="41" stroke="#fef08a" strokeWidth="2.2" /> 
        <line x1="155" y1="36" x2="175" y2="35" stroke="#1e293b" strokeWidth="2.8" /> 

        {/* Billiard Balls */}
        <circle cx="100" cy="30" r="3.2" fill="#facc15" /> 
        <circle cx="120" cy="35" r="3.2" fill="#ef4444" /> 
        <circle cx="110" cy="45" r="3.2" fill="#ffffff" /> 
        <circle cx="115" cy="42" r="3.2" fill="#111111" /> 
      </g>

      {/* Overhead Brass Lamps & Light Cones */}
      <polygon points="110,15 15,180 235,180" fill="url(#lampBeam)" opacity="0.55" />
      <polygon points="230,12 150,140 310,140" fill="url(#lampBeam)" opacity="0.4" />
      <polygon points="310,8 250,110 370,110" fill="url(#lampBeam)" opacity="0.3" />

      {/* Hanging fixtures */}
      <line x1="90" y1="12" x2="330" y2="10" stroke="#ca8a04" strokeWidth="2.5" />
      <line x1="160" y1="0" x2="160" y2="11" stroke="#a16207" strokeWidth="1.5" />
      <line x1="260" y1="0" x2="260" y2="10" stroke="#a16207" strokeWidth="1.5" />

      {/* Individual lamps */}
      <g transform="translate(110, 15)">
        <path d="M -16 6 L 16 6 L 10 -4 L -10 -4 Z" fill="#ca8a04" stroke="#854d0e" strokeWidth="1" />
        <ellipse cx="0" cy="6" rx="16" ry="3" fill="#fef08a" />
        <circle cx="0" cy="7" r="2.5" fill="#ffffff" filter="blur(1px)" />
      </g>

      <g transform="translate(230, 13)">
        <path d="M -14 5 L 14 5 L 9 -3 L -9 -3 Z" fill="#ca8a04" stroke="#854d0e" strokeWidth="1" />
        <ellipse cx="0" cy="5" rx="14" ry="2.5" fill="#fef08a" />
        <circle cx="0" cy="6" r="2" fill="#ffffff" filter="blur(1px)" />
      </g>

      <g transform="translate(310, 10)">
        <path d="M -12 4 L 12 4 L 8 -2 L -8 -2 Z" fill="#ca8a04" stroke="#854d0e" strokeWidth="1" />
        <ellipse cx="0" cy="4" rx="12" ry="2" fill="#fef08a" />
        <circle cx="0" cy="5" r="1.5" fill="#ffffff" filter="blur(1px)" />
      </g>

      {/* Soft dust particles */}
      <circle cx="95" cy="80" r="0.8" fill="#ffffff" opacity="0.4" />
      <circle cx="130" cy="110" r="1.2" fill="#ffffff" opacity="0.3" />
      <circle cx="160" cy="70" r="0.6" fill="#ffffff" opacity="0.5" />
    </svg>
  );
}
