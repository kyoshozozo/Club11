/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, Navigation, Compass, AlertCircle, Loader2 } from 'lucide-react';
import { OPENING_HOURS, DAY_NAMES, WEEK_ORDER, formatDayHours, CLUB_EMAIL } from '../data';

export default function About() {
  const [msgName, setMsgName] = useState('');
  const [msgEmail, setMsgEmail] = useState('');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgText, setMsgText] = useState('');
  const [website, setWebsite] = useState(''); // rejtett mező a spamrobotok ellen
  const [isSent, setIsSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');

  // A régi változat csak a böngészőben tárolta az üzeneteket (el sem küldte őket): ezt töröljük
  useEffect(() => {
    try {
      localStorage.removeItem('club11_messages_log');
    } catch {}
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError('');
    setIsSent(false);
    setIsSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: msgName, email: msgEmail, subject: msgSubject, message: msgText, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSendError(data.error || `Nem sikerült elküldeni az üzenetet. Kérlek írj nekünk közvetlenül: ${CLUB_EMAIL}`);
        return;
      }
      setIsSent(true);
      setMsgText('');
      setMsgSubject('');
    } catch {
      setSendError(`Hálózati hiba, az üzenet nem ment el. Kérlek próbáld újra, vagy írj nekünk: ${CLUB_EMAIL}`);
    } finally {
      setIsSending(false);
    }
  };

  const schedule = WEEK_ORDER.map(day => ({
    days: DAY_NAMES[day],
    hours: formatDayHours(OPENING_HOURS[day]),
  }));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 max-w-7xl mx-auto my-12 shadow-2xl space-y-12" id="about-section">
      
      {/* Intro section */}
      <div className="text-center space-y-4">
        <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold block">Kapcsolat & Elérhetőség</span>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Hol találsz meg minket?</h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm">
          A Club 11 Budapest XI. kerületében, Újbudán vár téged a Gabányi László Sportcsarnok szívében. Nézz be hozzánk egy kávéra vagy egy izgalmas biliárd meccsre!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left pane: Contact details & Opening Hours */}
        <div className="lg:col-span-6 space-y-8">
          
          {/* Quick info list */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-sans">Elérhetőségek</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-850/80 flex gap-3.5 items-start">
                <MapPin className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-white">Címünk</h4>
                  <p className="text-xs text-slate-400 font-sans leading-relaxed pt-1">
                    1116 Budapest,<br />
                    Hauszmann Alajos u. 5.<br />
                    <span className="text-emerald-400 font-medium">(Gabányi László Sportcsarnok)</span>
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-850/80 flex gap-3.5 items-start">
                <Phone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-white">Telefonszám</h4>
                  <p className="text-xs text-slate-400 font-mono leading-relaxed pt-1">
                    <a href="tel:+36706214181" className="hover:text-emerald-400 transition-colors">+36 70 621 4181</a>
                  </p>
                  <p className="text-[10px] text-slate-500 pt-1 font-sans">
                    Hívható nyitvatartási időben asztalfoglaláshoz is!
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-850/80 flex gap-3.5 items-start">
                <Mail className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-white">E-mail</h4>
                  <p className="text-xs text-slate-400 font-mono leading-relaxed pt-1">
                    <a href="mailto:club11buda@gmail.com" className="hover:text-emerald-400 transition-colors">club11buda@gmail.com</a>
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-850/80 flex gap-3.5 items-start">
                <Compass className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-white">Megközelítés</h4>
                  <p className="text-xs text-slate-400 font-sans leading-relaxed pt-1">
                    M4 metróval, valamint 1, 17, 41, 47, 56 villamosokkal (Hauszmann Alajos utca megálló).
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Opening Hours list */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-sans flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              Heti Nyitvatartás
            </h3>
            <div className="bg-slate-950/50 rounded-2xl border border-slate-850 p-5 space-y-3 font-mono text-sm shadow-inner">
              {schedule.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-1.5 border-b border-slate-900 last:border-0 text-xs">
                  <span className="text-slate-400 font-semibold">{item.days}</span>
                  <span className="text-white font-bold">{item.hours}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right pane: Interactive Contact message form */}
        <div className="lg:col-span-6 bg-slate-950/80 rounded-2xl border border-slate-850 p-6 shadow-inner space-y-6">
          <div className="space-y-1">
            <h3 className="font-sans font-black text-lg text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-400" />
              Üzenetküldés
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Kérdésed van csoportos foglalással, céges vagy családi rendezvényekkel kapcsolatban? Írj nekünk üzenetet, és hamarosan válaszolunk!
            </p>
          </div>

          <form onSubmit={handleSendMessage} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Neved"
                id="msg-name"
                required
                value={msgName}
                onChange={(e) => setMsgName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <input
                type="email"
                placeholder="E-mail címed"
                id="msg-email"
                required
                value={msgEmail}
                onChange={(e) => setMsgEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <input
              type="text"
              placeholder="Tárgy"
              id="msg-subject"
              required
              value={msgSubject}
              onChange={(e) => setMsgSubject(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500"
            />

            <textarea
              placeholder="Üzenet szövege..."
              id="msg-textarea"
              required
              rows={4}
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
            ></textarea>

            {/* Rejtett mező: a látogató nem látja, csak a spamrobotok töltik ki */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="hidden"
            />

            {isSent && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-mono" id="about-sent-success">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Üzenet elküldve! Köszönjük a megkeresést, hamarosan válaszolunk. A megadott címre visszaigazolást küldtünk.</span>
              </div>
            )}

            {sendError && (
              <div className="flex items-start gap-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400" id="about-sent-error">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{sendError}</span>
              </div>
            )}

            <button
              type="submit"
              id="about-submit-btn"
              disabled={isSending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs tracking-wide transition-all uppercase flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSending ? (
                <>
                  Küldés...
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </>
              ) : (
                <>
                  Üzenet Küldése
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

        </div>

      </div>

      {/* Styled directions section / Embedded Map visualizer */}
      <div className="pt-6 border-t border-slate-800/80">
        <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-850 flex flex-col md:flex-row gap-6 items-center">
          
          <div className="w-full md:w-1/3 space-y-3">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">Hogyan találsz be?</span>
            <h4 className="font-sans font-black text-lg text-white">Megközelítés sporttelepen belül</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              A Club 11 a <strong className="text-white">Gabányi László Sportcsarnok</strong> területén található. A sportcsarnok <strong className="text-white">főbejáratán</strong> belépve fordulj <strong className="text-white">balra</strong>: az <strong className="text-white">első ajtónál</strong> találod a klubot.
            </p>
            <div className="pt-2">
              <a 
                href="https://www.google.com/maps/place/Club11+%C3%9Ajbuda+Bili%C3%A1rd,+darts+bistro/@47.4664317,19.0479528,17z/data=!4m6!3m5!1s0x4741ddc3b8ccd9ab:0x4a422135d07b34a!8m2!3d47.4664317!4d19.0479528!16s%2Fg%2F11h3qxd3jv"
                target="_blank"
                rel="noopener noreferrer"
                id="maps-direction-link"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold font-mono transition-all hover:bg-emerald-400"
              >
                Útvonaltervezés Google Maps-en
                <Navigation className="w-3.5 h-3.5 fill-current" />
              </a>
            </div>
          </div>

          <div className="w-full md:w-2/3 h-64 bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden flex items-center justify-center">
            {/* High-fidelity Mock Map Layout utilizing HTML elements */}
            <div className="absolute inset-0 bg-slate-950/40 opacity-25" style={{backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', backgroundSize: '16px 16px'}}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-10 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 border-2 border-white animate-bounce">
                <MapPin className="w-6 h-6 fill-current" />
              </div>
              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl shadow-md space-y-0.5">
                <span className="text-xs font-black text-white block">Club 11 Biliárd</span>
                <span className="text-[10px] font-mono text-emerald-400 block">Gabányi László Sportcsarnok</span>
              </div>
            </div>

            {/* Simulated streets / paths layout */}
            <div className="absolute top-12 left-0 right-0 h-4 bg-slate-900 border-t border-b border-slate-800/80"></div>
            <div className="absolute bottom-16 left-0 right-0 h-6 bg-slate-900 border-t border-b border-slate-800/80 flex items-center justify-center">
              <span className="text-[9px] font-mono tracking-widest text-slate-600 uppercase">Hauszmann Alajos utca</span>
            </div>
            <div className="absolute top-0 bottom-0 left-1/3 w-6 bg-slate-900 border-l border-r border-slate-800/80"></div>
            <div className="absolute top-0 bottom-0 right-1/4 w-8 bg-slate-900 border-l border-r border-slate-800/80"></div>
            <div className="absolute right-12 top-1/4 w-32 h-20 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center justify-center">
              <span className="text-[9px] font-mono text-emerald-500/40 uppercase">Parkoló</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
