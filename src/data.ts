/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TableCategory, TableType, MenuItem, DayHours } from './types';

// Játékterek: a vendég a típust foglalja, egy idősávban legfeljebb `count` foglalás lehet.
export const TABLE_CATEGORIES: TableCategory[] = [
  {
    type: 'pool',
    name: 'Pool Biliárd Asztal',
    description: 'Professzionális 9 lábas pool biliárd asztal. Az asztalt érkezéskor a személyzet jelöli ki.',
    hourlyRate: 2300,
    count: 6,
  },
  {
    type: 'darts',
    name: 'Soft Darts Gép',
    description: 'Soft darts gép digitális számlálóval és játékvariációkkal.',
    hourlyRate: 2000,
    count: 2,
  },
  {
    type: 'foosball',
    name: 'Csocsó Asztal',
    description: 'Robusztus, professzionális csocsó asztal a pörgős meccsekhez.',
    hourlyRate: 1400,
    count: 2,
  },
];

export const getTableCategory = (type: TableType) => TABLE_CATEGORIES.find(c => c.type === type)!;

// Nyitvatartás a hét napjai szerint (index = Date.getDay(), 0 = vasárnap)
export const OPENING_HOURS: DayHours[] = [
  null,                    // Vasárnap
  { open: 14, close: 21 }, // Hétfő
  { open: 14, close: 22 }, // Kedd
  { open: 14, close: 22 }, // Szerda
  { open: 14, close: 22 }, // Csütörtök
  { open: 14, close: 23 }, // Péntek
  { open: 14, close: 23 }, // Szombat
];

export const DAY_NAMES = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];

// Hétfőtől vasárnapig, a megjelenítéshez
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const formatDayHours = (hours: DayHours) =>
  hours ? `${String(hours.open).padStart(2, '0')}:00 - ${String(hours.close).padStart(2, '0')}:00` : 'Zárva';

// Az aktuális budapesti dátum és idő, a látogató gépének időzónájától függetlenül
export function budapestNow() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Budapest',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (t: string) => parts.find(p => p.type === t)!.value;
  const date = `${get('year')}-${get('month')}-${get('day')}`;
  return { date, hour: Number(get('hour')), minute: Number(get('minute')), day: dayOfWeek(date) };
}

// YYYY-MM-DD dátum napja (0 = vasárnap)
export function dayOfWeek(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export const slotStartHour = (slot: string) => Number(slot.slice(0, 2));

// Az adott napon foglalható idősávok (zárt napon üres lista)
export function getSlotsForDate(date: string): string[] {
  const hours = OPENING_HOURS[dayOfWeek(date)];
  if (!hours) return [];
  return TIME_SLOTS.filter(slot => {
    const start = slotStartHour(slot);
    return start >= hours.open && start + 1 <= hours.close;
  });
}

// Elkezdődött-e már az idősáv (budapesti idő szerint)
export function isSlotInPast(date: string, slot: string, now = budapestNow()) {
  if (date < now.date) return true;
  return date === now.date && slotStartHour(slot) <= now.hour;
}

// Idősávok összefoglalása, pl. "14:00 - 17:00 (3 óra)"
export function formatSlotsSummary(slots: string[]): string {
  if (slots.length === 0) return '';
  const sorted = [...slots].sort((a, b) => TIME_SLOTS.indexOf(a) - TIME_SLOTS.indexOf(b));
  const blocks: string[] = [];
  let currentStart = '';
  let currentEnd = '';
  sorted.forEach((slot) => {
    const [start, end] = slot.split(' - ');
    if (!currentStart) {
      currentStart = start;
      currentEnd = end;
    } else if (currentEnd === start) {
      currentEnd = end;
    } else {
      blocks.push(`${currentStart} - ${currentEnd}`);
      currentStart = start;
      currentEnd = end;
    }
  });
  if (currentStart) blocks.push(`${currentStart} - ${currentEnd}`);
  return `${blocks.join(', ')} (${slots.length} óra)`;
}

export const MENU_ITEMS: MenuItem[] = [
  // Ételek & Rágcsálnivalók (Étlap)
  { id: 'et-lepeny', name: 'Lepény', category: 'etlap', price: 2590, description: 'Frissen sült, laktató lepény többféle ízben.' },
  { id: 'et-retro-melegszendvics', name: 'Retró melegszendvics', category: 'etlap', price: 1990, description: 'Klasszikus retró melegszendvics gazdag feltéttel, ropogósra sütve.', isPopular: true },
  { id: 'et-hotdog', name: 'Hot-dog', category: 'etlap', price: 1300, description: 'Forró virsli puha kifliben, mustárral, ketchuppal és majonézzel.' },
  { id: 'et-burrito', name: 'Burrito', category: 'etlap', price: 1300, description: 'Ízletes, mexikói stílusú burrito dús töltelékkel.' },
  { id: 'et-melegszendvics', name: 'Melegszendvics', category: 'etlap', price: 650, description: 'Ropogós, meleg szendvics.' },
  { id: 'et-nachos', name: 'Nachos + szósz', category: 'etlap', price: 1850, description: 'Ropogós tortilla chips sajtszósszal.', isPopular: true },
  { id: 'et-chipsek', name: 'Chipsek', category: 'etlap', price: '700 - 1200', description: 'Válogatott, ropogós sós és ízesített chipsek.' },
  { id: 'et-sajtos-taller', name: 'Sajtos tallér', category: 'etlap', price: 800, description: 'Hagyományos, ropogós sajtos tallérok.' },
  { id: 'et-crocko', name: 'Crocko krékerek', category: 'etlap', price: '650 - 1200', description: 'Kellemesen sós Crocko krékerek rágcsáláshoz.' },
  { id: 'et-ropi', name: 'Ropi', category: 'etlap', price: 350, description: 'Klasszikus sós pálcikák játék mellé.' },
  { id: 'et-csokik', name: 'Csokik', category: 'etlap', price: '500 - 600', description: 'Különböző finom csokoládék az édesszájúaknak.' },
  { id: 'et-mogyi', name: 'Mogyi termékek', category: 'etlap', price: '600 - 1100', description: 'Mogyoró, kesudió és egyéb prémium Mogyi rágcsálnivalók.' },

  // Italok (Itallap)
  { id: 'it-udito', name: 'Üdítők', category: 'itallap', price: '600 - 900', description: 'Szénsavas és szénsavmentes frissítő üdítőitalok.' },
  { id: 'it-viz', name: 'Víz', category: 'itallap', price: '350 - 650', description: 'Csendes és szénsavas ásványvizek.' },
  { id: 'it-powerrade', name: 'Powerrade', category: 'itallap', price: 900, description: 'Izotóniás sportital a maximális fókuszért és energiáért.' },
  { id: 'it-energiaitalok', name: 'Energiaitalok', category: 'itallap', price: '550 - 900', description: 'Különböző prémium energiaitalok pörgetéshez.' },
  { id: 'it-limonade', name: 'Limonádé', category: 'itallap', price: '700 - 1450', description: 'Frissen készített, hűsítő limonádék különböző ízesítésekben.', isPopular: true },
  { id: 'it-csapolt-sor', name: 'Csapolt sör', category: 'itallap', price: '1150 - 1400', description: 'Friss, jéghideg csapolt sörök: Dreher Gold és Pilsner.', isPopular: true },
  { id: 'it-uveges-sor', name: 'Üveges sörök', category: 'itallap', price: '1050 - 1700', description: 'Prémium minőségű palackozott sörök.' },
  { id: 'it-dobozos-sor', name: 'Dobozos sörök', category: 'itallap', price: '950 - 1900', description: 'Dobozos sörök széles választéka.' },
  { id: 'it-sommersby', name: 'Sommersby', category: 'itallap', price: 1000, description: 'Könnyed, édeskés, gyümölcsös almabor.' },
  { id: 'it-bor', name: 'Bor', category: 'itallap', price: '550 - 1100', description: 'Rosé és fehér borok kimérve.' },
  { id: 'it-cseles', name: 'Cseles', category: 'itallap', price: 1500, description: 'Különleges, fűszeres alkoholos koktél.' },
  { id: 'it-rovidek', name: 'Rövid italok', category: 'itallap', price: '1200 - 1550', description: 'Égetett szeszek, whiskey-k, vodka, gin, rumok és tequila.' },
  { id: 'it-kavek', name: 'Kávék', category: 'itallap', price: '600 - 1250', description: 'Frissen főzött Illy kávék és tejes kávéitalok.' },
  { id: 'it-tea-mezzel', name: 'Tea mézzel', category: 'itallap', price: 750, description: 'Melegítő, zamatos tea minőségi mézzel ízesítve.' },
];

// Házirend: a főoldal "Információk és szabályok" kockája és az AI csapos is ezt használja
export const BOOKING_INFO =
  'Biliárdhoz foglalás szükséges, a többi játékhoz ajánlott, e-mailen vagy messengeren, vagy 14h után telefonon.';
export const HOUSE_RULES = [
  '🎱 Biliárd és darts használata csak 12 év felett lehetséges szülői felügyelettel.‼️',
  '🔞 20:00 után csak 16+ tartózkodhat az üzletben‼️',
  '🍹 A játékok használata mellett fogyasztás kötelező‼️',
  '🍽 Melegétel fogyasztás 20:00 óráig.',
  '6 fő felett csak e-mailes foglalást fogadunk el.',
];

// AI csapos: egy beszélgetésben legfeljebb ennyi kérdésre válaszol, utána telefonra irányít
export const MAX_CHAT_QUESTIONS = 12;
export const CHAT_LIMIT_MESSAGE =
  'Köszönöm a sok kérdést! 😊 A további kérdéseiddel kérlek, inkább telefonon érdeklődj: +36 70 621 4181 – ott a kollégáim mindenben szívesen segítenek!';

// Minden lehetséges egyórás sáv; hogy egy adott napon melyik foglalható, azt a getSlotsForDate dönti el
export const TIME_SLOTS = [
  '14:00 - 15:00',
  '15:00 - 16:00',
  '16:00 - 17:00',
  '17:00 - 18:00',
  '18:00 - 19:00',
  '19:00 - 20:00',
  '20:00 - 21:00',
  '21:00 - 22:00',
  '22:00 - 23:00',
];
