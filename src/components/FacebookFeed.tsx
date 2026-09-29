/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ExternalLink, Facebook, MessageCircle, Phone } from 'lucide-react';
import Club11Logo from './Club11Logo';

// A beágyazott Facebook idővonal a legtöbb böngészőben nem tölt be (harmadik féltől
// származó sütik tiltása), ezért az oldal közvetlenül a Facebook oldalra és a Messengerre visz.
const FACEBOOK_URL = 'https://www.facebook.com/club11ujbuda';
const MESSENGER_URL = 'https://m.me/club11ujbuda';

export default function FacebookFeed() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 max-w-4xl mx-auto my-12 shadow-2xl" id="posts-section">

      {/* Header */}
      <div className="text-center space-y-4 mb-10">
        <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold flex items-center justify-center gap-1.5">
          <Facebook className="w-4 h-4 fill-current text-emerald-400" />
          Hírek a Facebook oldalunkon
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Hírek és Bejegyzések</h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm">
          A Club 11 minden hírt, eseményt és újdonságot a hivatalos Facebook oldalán tesz közzé. Kövess minket, hogy ne maradj le semmiről!
        </p>
      </div>

      {/* Fő kártya: a Facebook oldal */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 to-slate-950/40 p-6 sm:p-8 text-center space-y-6" id="facebook-card">
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-full bg-slate-950 border-2 border-emerald-500/40 flex items-center justify-center">
            <Club11Logo className="w-20 h-20 text-white" showText={true} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Club 11 Újbuda Biliárd club</h3>
            <p className="text-xs font-mono text-slate-400">facebook.com/club11ujbuda</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            id="facebook-open-btn"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-500/20"
          >
            <Facebook className="w-4 h-4 fill-current" />
            Legfrissebb híreink a Facebookon
            <ExternalLink className="w-4 h-4" />
          </a>
          <a
            href={MESSENGER_URL}
            target="_blank"
            rel="noopener noreferrer"
            id="messenger-open-btn"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-sm transition-all"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            Írj nekünk Messengeren
          </a>
        </div>

        <p className="text-[11px] text-slate-500">
          A gombok új lapon nyitják meg a Facebookot. Messengeren asztalt is foglalhatsz, vagy bármit kérdezhetsz tőlünk.
        </p>
      </div>

      {/* Telefon */}
      <div className="mt-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
        <Phone className="w-4 h-4 text-emerald-400" />
        Kérdésed van? Hívj minket:
        <a href="tel:+36706214181" className="font-mono font-bold text-white hover:text-emerald-400 transition-colors">+36 70 621 4181</a>
      </div>

    </div>
  );
}
