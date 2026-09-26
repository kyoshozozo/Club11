/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ExternalLink, Facebook } from 'lucide-react';

export default function FacebookFeed() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 max-w-4xl mx-auto my-12 shadow-2xl" id="posts-section">

      {/* Header */}
      <div className="text-center space-y-4 mb-10">
        <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold flex items-center justify-center gap-1.5">
          <Facebook className="w-4 h-4 fill-current text-emerald-400" />
          Hírek a Facebook oldalunkról
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Hírek és Bejegyzések</h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm">
          A Club 11 minden hírt, eseményt és akciót a hivatalos Facebook oldalán tesz közzé. Az alábbi idővonalon közvetlenül a Facebookról láthatod a legfrissebb bejegyzéseinket.
        </p>
      </div>

      {/* Egyetlen nézet: élő Facebook idővonal */}
      <div className="flex border-b border-slate-800 mb-8 p-1 bg-slate-950/40 rounded-2xl max-w-xs mx-auto">
        <button
          type="button"
          aria-pressed="true"
          className="flex-1 py-2.5 px-4 rounded-xl text-xs tracking-tight flex items-center justify-center gap-2 bg-emerald-500 text-slate-950 shadow-lg font-black cursor-default"
        >
          <Facebook className="w-3.5 h-3.5 fill-current" />
          Élő Idővonal Widget
        </button>
      </div>

      {/* Official Live Widget Embed */}
      <div className="space-y-6">
        <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 text-center text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">
          <span className="font-bold text-white block mb-1">Élő Idővonal a Facebookról</span>
          Ez az ablak a valós idejű Facebook idővonalunkat mutatja. Ha nem jelenik meg, ellenőrizd, hogy a böngésződ nem blokkolja-e a Facebook sütiket és widgeteket, vagy nyisd meg az oldalunkat közvetlenül a Facebookon!
        </div>

        <div className="flex justify-center bg-slate-950 rounded-2xl p-4 border border-slate-800 max-w-xl mx-auto overflow-hidden shadow-inner">
          <iframe
            src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fclub11ujbuda&tabs=timeline&width=500&height=700&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId"
            width="100%"
            height="650"
            style={{ border: 'none', overflow: 'hidden', borderRadius: '12px' }}
            scrolling="no"
            frameBorder="0"
            allowFullScreen={true}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            title="Club 11 Hivatalos Facebook Oldal"
          />
        </div>

        <div className="text-center">
          <a
            href="https://www.facebook.com/club11ujbuda"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-sm font-black text-slate-950 transition-all shadow-md"
          >
            Megnyitás közvetlenül a Facebookon
            <ExternalLink className="w-4 h-4 text-slate-950" />
          </a>
        </div>
      </div>

    </div>
  );
}
