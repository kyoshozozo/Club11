/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, MapPin, Phone, Clock, MessageSquare, Coffee, Layers, BookOpen, Camera } from 'lucide-react';
import Club11Logo from './Club11Logo';

interface NavbarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
}

export default function Navbar({ activeSection, setActiveSection, isChatOpen, setIsChatOpen }: NavbarProps) {
  const navItems = [
    { id: 'home', label: 'Főoldal', icon: Layers },
    { id: 'booking', label: 'Asztalfoglalás', icon: Clock },
    { id: 'menu', label: 'Kávézó & Bár', icon: Coffee },
    { id: 'gallery', label: 'Galéria', icon: Camera },
    { id: 'posts', label: 'Hírek', icon: BookOpen },
    { id: 'about', label: 'Kapcsolat', icon: MapPin },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo and title */}
          <div 
            className="flex items-center gap-3 cursor-pointer group py-1"
            onClick={() => setActiveSection('home')}
            id="nav-logo"
          >
            <Club11Logo className="w-18 h-18 text-white group-hover:text-emerald-400 transition-all" showText={true} />
          </div>

          {/* Nav items */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Quick Contact & Chat toggle */}
          <div className="flex items-center gap-3">
            <a 
              href="tel:+36706214181" 
              className="hidden lg:flex items-center gap-2 text-slate-400 hover:text-white transition-all text-sm font-mono"
              id="nav-phone-link"
            >
              <Phone className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>+36 70 621 4181</span>
            </a>
            
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              id="chat-toggle-button"
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md ${
                isChatOpen
                  ? 'bg-teal-500 text-slate-950 shadow-teal-500/20'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 hover:opacity-95 hover:scale-102 active:scale-98 shadow-emerald-500/10'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">AI Csapos</span>
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
