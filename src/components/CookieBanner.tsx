/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Cookie } from 'lucide-react';
import { setConsent, type ConsentChoice } from '../analytics';

interface CookieBannerProps {
  onChoice: (choice: ConsentChoice) => void;
}

export default function CookieBanner({ onChoice }: CookieBannerProps) {
  const choose = (choice: ConsentChoice) => {
    setConsent(choice);
    onChoice(choice);
  };

  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-50 p-5 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl space-y-3"
      role="dialog"
      aria-label="Süti beállítások"
      id="cookie-banner"
    >
      <p className="text-sm font-bold text-white flex items-center gap-2">
        <Cookie className="w-4 h-4 text-amber-400" />
        Sütik a látogatottság méréséhez
      </p>
      <p className="text-xs text-slate-300 leading-relaxed">
        A Google Analytics segítségével névtelenül mérjük, hányan és mely oldalakat nézik meg a weboldalunkon.
        Ehhez a hozzájárulásodat kérjük. Ha nem fogadod el, az oldal ugyanúgy működik.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => choose('declined')}
          className="flex-1 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all"
        >
          Nem fogadom el
        </button>
        <button
          onClick={() => choose('accepted')}
          className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all"
        >
          Elfogadom
        </button>
      </div>
    </div>
  );
}
