/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PartyPopper, Mail, Phone, ZoomIn } from 'lucide-react';
import { CLUB_EMAIL } from '../data';
import eventsFlyer from '../rendezvenyek.jpg';

export default function Events() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 max-w-4xl mx-auto my-12 shadow-2xl" id="events-section">

      {/* Header */}
      <div className="text-center space-y-4 mb-8">
        <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold flex items-center justify-center gap-1.5">
          <PartyPopper className="w-4 h-4 text-emerald-400" />
          Rendezvények
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Ünnepeljetek nálunk!</h2>
      </div>

      {/* Bevezető szöveg */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 to-slate-950/40 p-6 sm:p-8 text-center space-y-5">
        <p className="text-base sm:text-lg text-slate-200 leading-relaxed">
          A Club 11 lehetőséget biztosít baráti összejövetelek, céges rendezvények, családi ünnepségek,
          születésnapi bulik, osztálytalálkozók, leány- és legénybúcsúk megtartására.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={`mailto:${CLUB_EMAIL}?subject=${encodeURIComponent('Rendezvény érdeklődés')}`}
            id="events-email-btn"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-500/20"
          >
            <Mail className="w-4 h-4" />
            Érdeklődni: {CLUB_EMAIL}
          </a>
          <a
            href="tel:+36706214181"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-sm transition-all"
          >
            <Phone className="w-4 h-4 text-emerald-400" />
            +36 70 621 4181
          </a>
        </div>
      </div>

      {/* Plakát: kattintásra teljes méretben nyílik meg */}
      <a
        href={eventsFlyer}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block mt-8 rounded-2xl overflow-hidden border border-slate-800 hover:border-emerald-500/40 transition-all shadow-xl"
        id="events-flyer"
        title="Kattints a nagyításhoz"
      >
        <img
          src={eventsFlyer}
          alt="Tökéletes helyszín cégeknek! Csapatépítők, évzárók, céges bulik – biliárd, darts, italok és harapnivalók, barátságos, kötetlen környezet a Club 11 Újbudában."
          loading="lazy"
          className="w-full h-auto block"
        />
        <span className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700 text-xs font-mono text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn className="w-3.5 h-3.5" /> Nagyítás
        </span>
      </a>

    </div>
  );
}
