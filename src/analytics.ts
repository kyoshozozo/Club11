/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Google Analytics (látogatottság-mérés). Csak akkor töltődik be, ha a látogató
// a süti-sávon az „Elfogadom” gombra kattintott (EU-s adatvédelmi szabályok).
export const GA_MEASUREMENT_ID = 'G-5PN4QRPH05';

const CONSENT_KEY = 'club11_cookie_consent'; // 'accepted' | 'declined'

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export type ConsentChoice = 'accepted' | 'declined';

export function getConsent(): ConsentChoice | null {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === 'accepted' || value === 'declined' ? value : null;
  } catch {
    return null;
  }
}

export function setConsent(choice: ConsentChoice) {
  try {
    localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    // privát módban a böngésző nem engedi menteni: legközelebb újra megkérdezzük
  }
  if (choice === 'accepted') loadAnalytics();
}

let loaded = false;
export function loadAnalytics() {
  if (loaded) return;
  loaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

// Az oldal egy oldalas alkalmazás, ezért a menüváltást külön oldalmegtekintésként küldjük
export function trackPage(section: string, title: string) {
  if (!loaded || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_title: title,
    page_location: `${window.location.origin}/#${section}`,
  });
}
