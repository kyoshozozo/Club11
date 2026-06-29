/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Table, MenuItem, Post } from './types';

export const TABLES: Table[] = [
  {
    id: 'pool-1',
    name: 'Professzionális Pool Biliárd Asztal',
    type: 'pool',
    description: 'Professzionális 9 lábas pool biliárd asztal kiváló posztóval és Simonis golyókészlettel.',
    hourlyRate: 2300,
    spots: 1,
  },
  {
    id: 'pool-2',
    name: 'Professzionális Pool Biliárd Asztal',
    type: 'pool',
    description: 'Professzionális 9 lábas pool biliárd asztal, ideális baráti társaságoknak vagy edzésekre.',
    hourlyRate: 2300,
    spots: 1,
  },
  {
    id: 'pool-3',
    name: 'Professzionális Pool Biliárd Asztal',
    type: 'pool',
    description: 'Precíz sávtartású 9 lábas pool asztal, tökéletes állapotban a klub közepén.',
    hourlyRate: 2300,
    spots: 1,
  },
  {
    id: 'pool-4',
    name: 'Professzionális Pool Biliárd Asztal',
    type: 'pool',
    description: 'Nyugodtabb sarokban elhelyezett pool asztal, ha elvonulva szeretnél játszani.',
    hourlyRate: 2300,
    spots: 1,
  },
  {
    id: 'pool-5',
    name: 'Professzionális Pool Biliárd Asztal',
    type: 'pool',
    description: 'Kiváló asztal baráti kihívásokhoz, a bárpult szomszédságában.',
    hourlyRate: 2300,
    spots: 1,
  },
  {
    id: 'pool-6',
    name: 'Professzionális Pool Biliárd Asztal',
    type: 'pool',
    description: 'Modern 9 lábas pool asztal prémium posztóval és kiváló kiegészítőkkel.',
    hourlyRate: 2300,
    spots: 1,
  },
  {
    id: 'darts-1',
    name: 'Soft Darts Pálya',
    type: 'darts',
    description: 'Modern, biztonságos és pontos soft darts gép digitális számlálóval és játékvariációkkal.',
    hourlyRate: 2000,
    spots: 2,
  },
  {
    id: 'darts-2',
    name: 'Soft Darts Pálya',
    type: 'darts',
    description: 'Második elektronikus soft darts pálya világító LED kijelzővel és kényelmes dobótávolsággal.',
    hourlyRate: 2000,
    spots: 2,
  },
  {
    id: 'foosball-1',
    name: 'Csocsó Asztal',
    type: 'foosball',
    description: 'Robusztus, üveglapos, professzionális csocsó asztal a pörgős, izgalmas meccsekhez.',
    hourlyRate: 1400,
    spots: 1,
  },
  {
    id: 'foosball-2',
    name: 'Csocsó Asztal',
    type: 'foosball',
    description: 'Második prémium csocsó asztalunk a családi és baráti bajnokságokhoz.',
    hourlyRate: 1400,
    spots: 1,
  },
];

export const MENU_ITEMS: MenuItem[] = [
  // Ételek & Rágcsálnivalók (Étlap)
  { id: 'et-lepeny', name: 'Lepény', category: 'etlap', price: 2590, description: 'Frissen sült, laktató és ízletes lepény.' },
  { id: 'et-retro-melegszendvics', name: 'Retró melegszendvics', category: 'etlap', price: 1990, description: 'Klasszikus retró melegszendvics gazdag feltéttel, ropogósra sütve.', isPopular: true },
  { id: 'et-hotdog', name: 'Hot-dog', category: 'etlap', price: 1300, description: 'Forró virsli puha kifliben, mustárral, ketchuppal és majonézzel.' },
  { id: 'et-burrito', name: 'Burrito', category: 'etlap', price: 1300, description: 'Ízletes, mexikói stílusú burrito dús töltelékkel.' },
  { id: 'et-melegszendvics', name: 'Melegszendvics', category: 'etlap', price: 650, description: 'Ropogós, meleg szendvics ínycsiklandó feltétekkel.' },
  { id: 'et-nachos', name: 'Nachos + szósz', category: 'etlap', price: 1850, description: 'Ropogós tortilla chips finom mártogatóssal.', isPopular: true },
  { id: 'et-chipsek', name: 'Chipsek', category: 'etlap', price: '700 - 1200', description: 'Válogatott, ropogós sós és ízesített chipsek.' },
  { id: 'et-sajtos-taller', name: 'Sajtos tallér', category: 'etlap', price: 800, description: 'Hagyományos, ropogós sajtos tallérok.' },
  { id: 'et-crocko', name: 'Crocko krékerek', category: 'etlap', price: '650 - 1200', description: 'Kellemesen sós Crocko krékerek rágcsáláshoz.' },
  { id: 'et-ropi', name: 'Ropi', category: 'etlap', price: 350, description: 'Klasszikus sós pálcikák játék mellé.' },
  { id: 'et-csokik', name: 'Csokik', category: 'etlap', price: 550, description: 'Különböző finom csokoládék az édesszájúaknak.' },
  { id: 'et-mogyi', name: 'Mogyi termékek', category: 'etlap', price: '600 - 1100', description: 'Mogyoró, kesudió és egyéb prémium Mogyi rágcsálnivalók.' },

  // Italok (Itallap)
  { id: 'it-udito', name: 'Üdítők', category: 'itallap', price: '600 - 900', description: 'Szénsavas és szénsavmentes frissítő üdítőitalok.' },
  { id: 'it-viz', name: 'Víz', category: 'itallap', price: '350 - 650', description: 'Csendes és szénsavas ásványvizek.' },
  { id: 'it-powerrade', name: 'Powerrade', category: 'itallap', price: 900, description: 'Izotóniás sportital a maximális fókuszért és energiáért.' },
  { id: 'it-energiaitalok', name: 'Energiaitalok', category: 'itallap', price: '550 - 900', description: 'Különböző prémium energiaitalok pörgetéshez.' },
  { id: 'it-limonade', name: 'Limonádé', category: 'itallap', price: '700 - 1450', description: 'Frissen készített, hűsítő limonádék gyümölcsökkel.', isPopular: true },
  { id: 'it-csapolt-sor', name: 'Csapolt sör', category: 'itallap', price: '1150 - 1400', description: 'Friss, jéghideg csapolt sörök különféle kiszerelésben.', isPopular: true },
  { id: 'it-uveges-sor', name: 'Üveges sörök', category: 'itallap', price: '1050 - 1700', description: 'Prémium minőségű palackozott sörkülönlegességek.' },
  { id: 'it-dobozos-sor', name: 'Dobozos sörök', category: 'itallap', price: '950 - 1900', description: 'Kényelmes dobozos sörök széles választéka.' },
  { id: 'it-sommersby', name: 'Sommersby', category: 'itallap', price: 1000, description: 'Könnyed, édeskés, gyümölcsös almabor.' },
  { id: 'it-bor', name: 'Bor / dl', category: 'itallap', price: '550 - 1100', description: 'Kiváló minőségű fehér, vörös és rosé borok deciliterenként.' },
  { id: 'it-cseles', name: 'Cseles', category: 'itallap', price: 1500, description: 'Különleges, fűszeres alkoholos italválaszték.' },
  { id: 'it-rovidek', name: 'Rövidek', category: 'itallap', price: '1200 - 1550', description: 'Kiváló minőségű röviditalok és párlatok.' },
  { id: 'it-kavek', name: 'Kávék', category: 'itallap', price: '600 - 1250', description: 'Frissen főzött olasz kávékülönlegességek és tejes kávéitalok.' },
  { id: 'it-tea-mezzel', name: 'Tea mézzel', category: 'itallap', price: 750, description: 'Melegítő, zamatos tea minőségi mézzel ízesítve.' },
];

export const POSTS: Post[] = [
  {
    id: 'post-1',
    title: '🏆 Pool Biliárd Házibajnokság a Club 11-ben!',
    content: 'Figyelem, biliárd rajongók! 🎯 Közkívánatra újra megrendezzük a Club 11 pool házibajnokságot! \n\nIdőpont: Következő péntek, 18:00 órától.\nKategória: Amatőr 9-es pool biliárd.\nNevezési díj: NINCS, de a helyek száma korlátozott (max. 16 fő).\nDíjazás: Az első három helyezett kupa, érem és értékes italkupon elismerésben részesül!\n\nNevezni személyesen a pultnál, itt az oldalon a csevegőben, vagy a Facebook üzenetben tudtok. Várunk titeket a megszokott jó hangulattal és zenével!',
    date: '2026-06-25',
    likes: 42,
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1200',
    category: 'tournament',
  },
  {
    id: 'post-2',
    title: '🍺 Új kézműves sörök a csapon és a hűtőben!',
    content: 'Egy jó játék mellé jár egy kiváló ital is! 🍻 Bővítettük a sörkínálatunkat a legfinomabb hazai kisüzemi sörökkel. \n\nMár csapon is elérhető a közkedvelt hidegkomlós IPA-nk, a hűtőnkbe pedig prémium gyümölcsös és búzasörök költöztek. \n\nHozd el a barátokat egy meccsre, és kóstoljátok meg az újdonságokat! Foglalj asztalt az online foglalónkon keresztül még ma!',
    date: '2026-06-20',
    likes: 29,
    image: 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?q=80&w=1200',
    category: 'drink',
  },
  {
    id: 'post-3',
    title: '🔴 Rex reneszánsz a 11. kerületben!',
    content: 'Emlékeztek még a klasszikus rex játékra? A gombákra, a lyukakra, a zöld posztóra? 🕹️\n\nA Club 11-ben kiemelt figyelmet fordítunk a hagyományokra, így nálunk egy tökéletes állapotban lévő, felújított rex asztalon is játszhattok!\n\nTökéletes kikapcsolódás két generáció számára is – hozd el apukádat, nagypapádat, vagy mutasd meg a barátaidnak, mit tudsz a gomba körül!\n\nAsztaldíj mindössze 2000 Ft/óra.',
    date: '2026-06-15',
    likes: 56,
    image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=1200',
    category: 'general',
  },
  {
    id: 'post-4',
    title: '⚽ Eb- és VB meccsek közvetítése óriás kivetítőn!',
    content: 'Nálunk nem kell lemaradnod a legfontosabb sporteseményekről játék közben sem! 📺\n\nA Club 11 kávézó és bár részén hatalmas kivetítőn közvetítjük az összes izgalmas futballmeccset, Forma-1 futamot és kézilabda rangadót.\n\nSzurkoljunk együtt Újbudán! Kérj egy hideg csapolt sört, dőlj hátra a kényelmes foteleinkben, vagy játssz egy jó meccset a barátokkal két félidő között!',
    date: '2026-06-10',
    likes: 38,
    image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=1200',
    category: 'event',
  },
];

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
  '23:00 - 00:00',
];
