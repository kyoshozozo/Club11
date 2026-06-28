/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Table, MenuItem, Post } from './types';

export const TABLES: Table[] = [
  {
    id: 'pool-1',
    name: 'Brunswick Pool Biliárd Asztal #1',
    type: 'pool',
    description: 'Professzionális 9 lábas pool biliárd asztal kiváló posztóval és Simonis golyókészlettel.',
    hourlyRate: 2800,
    spots: 1,
  },
  {
    id: 'pool-2',
    name: 'Brunswick Pool Biliárd Asztal #2',
    type: 'pool',
    description: 'Professzionális 9 lábas pool biliárd asztal, ideális baráti társaságoknak vagy edzésekre.',
    hourlyRate: 2800,
    spots: 1,
  },
  {
    id: 'pool-3',
    name: 'Dynamic Pool Biliárd Asztal #3',
    type: 'pool',
    description: 'Precíz sávtartású 9 lábas pool asztal, tökéletes állapotban a klub közepén.',
    hourlyRate: 2800,
    spots: 1,
  },
  {
    id: 'pool-4',
    name: 'Dynamic Pool Biliárd Asztal #4',
    type: 'pool',
    description: 'Nyugodtabb sarokban elhelyezett pool asztal, ha elvonulva szeretnél játszani.',
    hourlyRate: 2800,
    spots: 1,
  },
  {
    id: 'pool-5',
    name: 'Classic Pool Biliárd Asztal #5',
    type: 'pool',
    description: 'Kiváló asztal baráti kihívásokhoz, a bárpult szomszédságában.',
    hourlyRate: 2800,
    spots: 1,
  },
  {
    id: 'pool-6',
    name: 'Dynamic Pool Biliárd Asztal #6',
    type: 'pool',
    description: 'Modern 9 lábas pool asztal prémium posztóval és kiváló kiegészítőkkel.',
    hourlyRate: 2800,
    spots: 1,
  },
  {
    id: 'pool-7',
    name: 'Dynamic Pool Biliárd Asztal #7',
    type: 'pool',
    description: 'A legújabb 9 lábas professzionális pool biliárd asztalunk a tökéletes játékélményért.',
    hourlyRate: 2800,
    spots: 1,
  },
  {
    id: 'rex-1',
    name: 'Klasszikus Magyar Rex Asztal',
    type: 'rex',
    description: 'A nosztalgikus magyar kocsmai játék kedvelőinek. Gomba és lyukak a helyükön, indulhat a csata!',
    hourlyRate: 2000,
    spots: 1,
  },
  {
    id: 'darts-1',
    name: 'Soft Darts Pálya #1',
    type: 'darts',
    description: 'Modern, biztonságos és pontos soft darts gép digitális számlálóval és játékvariációkkal.',
    hourlyRate: 1200,
    spots: 2,
  },
  {
    id: 'darts-2',
    name: 'Soft Darts Pálya #2',
    type: 'darts',
    description: 'Második elektronikus soft darts pálya világító LED kijelzővel és kényelmes dobótávolsággal.',
    hourlyRate: 1200,
    spots: 2,
  },
  {
    id: 'foosball-1',
    name: 'Garlando Csocsó Asztal #1',
    type: 'foosball',
    description: 'Robusztus, üveglapos, professzionális csocsó asztal a pörgős, izgalmas meccsekhez.',
    hourlyRate: 1000,
    spots: 1,
  },
  {
    id: 'foosball-2',
    name: 'Garlando Csocsó Asztal #2',
    type: 'foosball',
    description: 'Második prémium Garlando csocsó asztalunk a családi és baráti bajnokságokhoz.',
    hourlyRate: 1000,
    spots: 1,
  },
];

export const MENU_ITEMS: MenuItem[] = [
  // Coffee
  { id: 'c1', name: 'Espresso', category: 'coffee', price: 590, description: '100% arabica kávéból készült klasszikus espresso.' },
  { id: 'c2', name: 'Ristretto', category: 'coffee', price: 590, description: 'Rövid, intenzív kávéélmény.' },
  { id: 'c3', name: 'Cappuccino', category: 'coffee', price: 790, description: 'Espresso, krémes meleg tejhabbal és kakaó szórással.', isPopular: true },
  { id: 'c4', name: 'Latte Macchiato', category: 'coffee', price: 890, description: 'Selymes tej, sűrű tejhab és espresso rétegek.' },
  { id: 'c5', name: 'Hosszú Kávé (Lungo)', category: 'coffee', price: 690, description: 'Lágyabb, hosszabb kávé a beszélgetésekhez.' },
  { id: 'c6', name: 'Jeges Kávé', category: 'coffee', price: 1190, description: 'Tejjel, vanília fagyival és tejszínhabbal.', isPopular: true },
  
  // Beer
  { id: 'b1', name: 'Csapolt Soproni (korsó - 0.5l)', category: 'beer', price: 790, description: 'Friss, hideg csapolt magyar sör.' },
  { id: 'b2', name: 'Csapolt Soproni (pohár - 0.3l)', category: 'beer', price: 550 },
  { id: 'b3', name: 'Csapolt Heineken (korsó - 0.5l)', category: 'beer', price: 990, description: 'Prémium minőségű csapolt világos sör.', isPopular: true },
  { id: 'b4', name: 'Csapolt Heineken (pohár - 0.25l)', category: 'beer', price: 650 },
  { id: 'b5', name: 'Krusovice Svetle (üveges - 0.5l)', category: 'beer', price: 890, description: 'Hagyományos cseh világos sör.' },
  { id: 'b6', name: 'Edelweiss búzasör (üveges - 0.5l)', category: 'beer', price: 1090, description: 'Kellemes, fűszeres osztrák szűretlen búzasör.' },
  { id: 'b7', name: 'Kézműves IPA (üveges - 0.33l)', category: 'beer', price: 1290, description: 'Helyi főzésű, gazdag komlózású, gyümölcsös IPA.', isPopular: true },
  { id: 'b8', name: 'Heineken 0.0% (alkoholmentes)', category: 'beer', price: 850, description: 'Alkoholmentes prémium sör.' },

  // Soft drinks
  { id: 's1', name: 'Coca-Cola / Coca-Cola Zero (0.25l)', category: 'soft', price: 590 },
  { id: 's2', name: 'Fanta Narancs (0.25l)', category: 'soft', price: 590 },
  { id: 's3', name: 'Kinley Tonic / Ginger Ale (0.25l)', category: 'soft', price: 590 },
  { id: 's4', name: 'Cappy Narancs / Alma / Őszibarack (0.25l)', category: 'soft', price: 650 },
  { id: 's5', name: 'Szentkirályi Ásványvíz (szénsavas/szénsavmentes - 0.33l)', category: 'soft', price: 490 },
  { id: 's6', name: 'Házi Limonádé (0.5l)', category: 'soft', price: 1090, description: 'Citrusos, epres, bodzás vagy zöldalmás ízben, friss gyümölcsökkel.', isPopular: true },
  { id: 's7', name: 'Red Bull (0.25l)', category: 'soft', price: 990, description: 'Energiaital a hosszú játékmenetekhez.' },

  // Cocktails & Spirits
  { id: 'ck1', name: 'Aperol Spritz', category: 'cocktail', price: 1790, description: 'Aperol, prosecco, szóda és narancskarika.', isPopular: true },
  { id: 'ck2', name: 'Gin Tonic Classic', category: 'cocktail', price: 1690, description: 'Beefeater gin, Kinley tonic, lime, jég.' },
  { id: 'ck3', name: 'Mojito', category: 'cocktail', price: 1990, description: 'Havana Club rum, menta, lime, cukorszirup, szóda.', isPopular: true },
  { id: 'ck4', name: 'Cuba Libre', category: 'cocktail', price: 1590, description: 'Rum, Coca-Cola, lime juice.' },
  { id: 'ck5', name: 'Tatratea 52% Original (4cl)', category: 'cocktail', price: 1290, description: 'Gyógynövényalapú szlovák teaszesz.' },
  { id: 'ck6', name: 'Jack Daniel\'s Whiskey (4cl)', category: 'cocktail', price: 1190 },

  // Snacks
  { id: 'sn1', name: 'Klasszikus Melegszendvics', category: 'snack', price: 1290, description: 'Sonkás-gombás-sajtos vagy szalámis-sajtos, ropogósra sütve, ketchuppal/majonézzel.', isPopular: true },
  { id: 'sn2', name: 'Nacho chips sajtszósszal / salsával', category: 'snack', price: 990, description: 'Meleg ropogós tortilla chips választható mártogatóssal.' },
  { id: 'sn3', name: 'Sós Mogyoró / Kesudió tál', category: 'snack', price: 490, description: 'Rágcsálnivaló a sör mellé.' },
  { id: 'sn4', name: 'Pringles Chips (sós / hagymás-tejfölös)', category: 'snack', price: 890 },
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
