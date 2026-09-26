/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import BookingSystem from './components/BookingSystem';
import Menu from './components/Menu';
import FacebookFeed from './components/FacebookFeed';
import About from './components/About';
import Gallery from './components/Gallery';
import AiChatbot from './components/AiChatbot';
import Club11Logo from './components/Club11Logo';
import { Layers, Clock, Coffee, BookOpen, MapPin, MessageSquare, Facebook, Phone, Heart } from 'lucide-react';

export default function App() {
  const [activeSection, setActiveSection] = useState<string>('home');
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  // Oldalváltás: az új oldal tetejére ugrik (mobilon különösen fontos)
  const navigate = (section: string) => {
    setActiveSection(section);
    window.scrollTo({ top: 0 });
  };

  // Quick navigation helpers
  const handleStartBooking = () => navigate('booking');

  const handleExploreMenu = () => navigate('menu');

  const handleOpenChat = () => {
    setIsChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950 font-sans">
      
      {/* Top Navigation */}
      <Navbar 
        activeSection={activeSection} 
        setActiveSection={navigate}
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
      />

      {/* Main Content Area */}
      <main className="flex-grow">
        {activeSection === 'home' && (
          <div className="space-y-4">
            <Hero 
              onStartBooking={handleStartBooking} 
              onExploreMenu={handleExploreMenu}
              onOpenChat={handleOpenChat}
            />
            
            {/* Features Spotlight / Showcase Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="text-center space-y-4 mb-12">
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold block">
                  Club 11 Élmény
                </span>
                <h2 className="text-3xl font-black text-white tracking-tight">Mit találsz nálunk?</h2>
                <p className="text-slate-400 max-w-xl mx-auto text-xs">
                  Nem csak egy asztalt adunk – nálunk a hangulat, a kiszolgálás és a minőség kéz a kézben járnak.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Feature 1 */}
                <div 
                  className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
                  onClick={() => navigate('booking')}
                  id="feature-card-biliard"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">Professzionális Biliárd</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    9 lábas professzionális pool biliárd asztalok várják a precíz lökések kedvelőit, mellettük soft darts gépek és csocsó asztalok.
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold font-mono pt-4">
                    Asztalfoglalás indítása &rarr;
                  </span>
                </div>

                {/* Feature 2 */}
                <div 
                  className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
                  onClick={() => navigate('menu')}
                  id="feature-card-bar"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Coffee className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">Kávézó és Bár</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Frissen pörkölt olasz arabica kávék, jéghideg csapolt sörök, válogatott kézműves IPA-k és hűsítő házi limonádék. Ropogós melegszendvicsünk legendás!
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold font-mono pt-4">
                    Itallap böngészése &rarr;
                  </span>
                </div>

                {/* Feature 3 */}
                <div 
                  className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
                  onClick={() => navigate('posts')}
                  id="feature-card-events"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">Közösség és Versenyek</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Rendszeresen szervezünk amatőr pool biliárd háziversenyeket, sport közvetítéseket óriás kivetítőn, és darts kihívásokat. Csatlakozz te is a Club 11-hez!
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold font-mono pt-4">
                    Friss hírek olvasása &rarr;
                  </span>
                </div>

              </div>
            </section>
          </div>
        )}

        {activeSection === 'booking' && <BookingSystem />}
        {activeSection === 'menu' && <Menu />}
        {activeSection === 'gallery' && <Gallery />}
        {activeSection === 'posts' && <FacebookFeed />}
        {activeSection === 'about' && <About />}
      </main>

      {/* Floating AI Chatbot Modal */}
      <AiChatbot 
        isOpen={isChatOpen} 
        setIsOpen={setIsChatOpen} 
        onNavigateToBooking={handleStartBooking}
      />

      {/* Chat launcher shortcut button (when chat is closed) */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          id="chat-launcher-floating"
          title="Kérdezz az AI Csapostól"
          className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-xl hover:scale-105 active:scale-95 transition-all shadow-emerald-500/10 animate-pulse"
        >
          <MessageSquare className="w-6 h-6 fill-slate-950" />
        </button>
      )}

      {/* Footer bar */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Col 1: Brand details */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Club11Logo className="w-24 h-24 text-white hover:text-emerald-400 transition-all cursor-pointer" showText={true} />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Minőségi biliárd szalon, kávézó és szórakozóhely Budapesten, a 11. kerületben a Gabányi László Sportcsarnokban.
              </p>
              <p className="text-xs text-emerald-400/80 font-mono flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-current text-rose-500" /> Családi Vállalkozás
              </p>
            </div>

            {/* Col 2: Navigation Links */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-white font-sans">Menüpontok</h4>
              <ul className="space-y-2 text-xs font-medium">
                <li>
                  <button onClick={() => navigate('home')} className="hover:text-emerald-400 transition-colors">Főoldal</button>
                </li>
                <li>
                  <button onClick={() => navigate('booking')} className="hover:text-emerald-400 transition-colors">Interaktív Asztalfoglalás</button>
                </li>
                <li>
                  <button onClick={() => navigate('menu')} className="hover:text-emerald-400 transition-colors">Bár és Kávézó</button>
                </li>
                <li>
                  <button onClick={() => navigate('gallery')} className="hover:text-emerald-400 transition-colors">Galéria</button>
                </li>
                <li>
                  <button onClick={() => navigate('posts')} className="hover:text-emerald-400 transition-colors">Hírek és Facebook bejegyzések</button>
                </li>
                <li>
                  <button onClick={() => navigate('about')} className="hover:text-emerald-400 transition-colors">Kapcsolat & Nyitvatartás</button>
                </li>
              </ul>
            </div>

            {/* Col 3: Practical Info */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-white font-sans">Kapcsolat</h4>
              <ul className="space-y-2 text-xs font-sans">
                <li className="flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>1116 Budapest, Hauszmann Alajos u. 5.</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                  <a href="tel:+36706214181" className="hover:text-emerald-400 font-mono transition-colors">+36 70 621 4181</a>
                </li>
              </ul>
            </div>

            {/* Col 4: Facebook block */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-white font-sans">Kövess minket</h4>
              <p className="text-xs text-slate-500 font-sans">
                Tekintsd meg legújabb fotóinkat és bejegyzéseinket a hivatalos közösségi oldalunkon!
              </p>
              <div className="pt-1">
                <a
                  href="https://www.facebook.com/club11ujbuda"
                  target="_blank"
                  rel="noopener noreferrer"
                  id="footer-facebook-btn"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-all font-mono"
                >
                  <Facebook className="w-4 h-4 text-emerald-400 fill-current" />
                  Club 11 Facebook
                </a>
              </div>
            </div>

          </div>

          <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600 font-mono">
            <span>&copy; {new Date().getFullYear()} Club 11 Újbuda. Minden jog fenntartva.</span>
            <span>Készült a család és az AI segítségével</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
