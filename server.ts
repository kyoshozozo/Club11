/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import fs from "fs";
import crypto from "crypto";
import {
  TABLE_CATEGORIES,
  MENU_ITEMS,
  OPENING_HOURS,
  DAY_NAMES,
  WEEK_ORDER,
  formatDayHours,
  getSlotsForDate,
  isSlotInPast,
  formatSlotsSummary,
  budapestNow,
  dayOfWeek,
  slotStartHour,
  MAX_CHAT_QUESTIONS,
  CHAT_LIMIT_MESSAGE,
  HOUSE_RULES,
  BOOKING_INFO,
  GAME_CATEGORIES,
  MAX_ONLINE_PARTY_SIZE,
  CLUB_EMAIL,
} from "./src/data";
import type { Booking, TableType } from "./src/types";

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Create uploads and data directories if they do not exist
  const uploadsDir = path.join(process.cwd(), "uploads");
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const galleryFilePath = path.join(dataDir, "gallery.json");
  if (!fs.existsSync(galleryFilePath)) {
    fs.writeFileSync(galleryFilePath, JSON.stringify([]), "utf-8");
  }

  const bookingsFilePath = path.join(dataDir, "bookings.json");
  if (!fs.existsSync(bookingsFilePath)) {
    fs.writeFileSync(bookingsFilePath, JSON.stringify([]), "utf-8");
  }

  const readBookings = (): Booking[] => JSON.parse(fs.readFileSync(bookingsFilePath, "utf-8"));
  const writeBookings = (bookings: Booking[]) =>
    fs.writeFileSync(bookingsFilePath, JSON.stringify(bookings, null, 2), "utf-8");

  const countBooked = (bookings: Booking[], type: TableType, date: string, slot: string) =>
    bookings.filter((b) => b.type === type && b.date === date && b.timeSlots.includes(slot)).length;

  // Szabad helyek száma idősávonként és típusonként egy adott napra
  // (elmúlt/elkezdődött idősávnál 0). A foglaló és az AI csapos is ezt használja.
  function computeAvailability(date: string, bookings = readBookings()) {
    const slots = getSlotsForDate(date);
    const availability: Record<string, Record<string, number>> = {};
    for (const category of TABLE_CATEGORIES) {
      availability[category.type] = {};
      for (const slot of slots) {
        availability[category.type][slot] = isSlotInPast(date, slot)
          ? 0
          : Math.max(0, category.count - countBooked(bookings, category.type, date, slot));
      }
    }
    return { slots, availability };
  }

  // Body parser with larger payload limit for base64 image uploads
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ limit: "25mb", extended: true }));

  // Serve uploaded images statically
  app.use("/uploads", express.static(uploadsDir));

  // Az AI csapos a Claude Haiku 4.5 modellel válaszol (Anthropic API).
  // A kulcs az ANTHROPIC_API_KEY környezeti változóból jön; ha nincs megadva,
  // a csapos a beépített tartalék válaszokkal működik.
  const CHAT_MODEL = "claude-haiku-4-5";
  let aiClient: Anthropic | null = null;
  function getClaudeClient() {
    if (!aiClient) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        console.warn("ANTHROPIC_API_KEY is not defined. AI Chatbot features will run in offline demo mode.");
        return null;
      }
      aiClient = new Anthropic({ apiKey, timeout: 30_000, maxRetries: 1 });
    }
    return aiClient;
  }

  // A nyitvatartás és az árlista a weboldal adataiból (src/data.ts) készül,
  // így a csapos pontosan ugyanazokat az árakat ismeri, amik az oldalon szerepelnek.
  const formatPrice = (price: number | string) =>
    typeof price === "number" ? `${price.toLocaleString("hu-HU")} Ft` : `${price} Ft`;
  const OPENING_HOURS_TEXT = WEEK_ORDER
    .map((day) => `      * ${DAY_NAMES[day]}: ${formatDayHours(OPENING_HOURS[day])}`)
    .join("\n");
  const TABLES_TEXT = TABLE_CATEGORIES
    .map((c) => c.hourlyRate > 0
      ? `      * ${c.name}: ${c.count} db, ${formatPrice(c.hourlyRate)}/óra`
      : `      * ${c.name}: ${c.count} db, díjmentesen foglalható (a fogyasztás kötelező)`)
    .join("\n");
  const menuText = (category: "etlap" | "itallap") =>
    MENU_ITEMS.filter((item) => item.category === category)
      .map((item) => `      * ${item.name}: ${formatPrice(item.price)}`)
      .join("\n");

  // System Instruction for Club 11 Virtual Bartender
  const SYSTEM_INSTRUCTION = `
    Te "Sára" vagy, a Club 11 barátságos, humoros, picit szűkszavúbb, de végtelenül vendégszerető Virtuális Csaposa és Szalonvezetője.
    A Club 11 egy biliárd szalon, kávézó, darts szentély és szórakozóhely Budapesten, a 11. kerületben (Újbuda), a Hauszmann Alajos utca 5. szám alatt, közvetlenül a Gabányi László Sportcsarnok területén.

    FONTOS INFORMÁCIÓK, AMIKET TUDSZ A HELYRŐL:
    - Cím: 1116 Budapest, Hauszmann Alajos u. 5. (A Gabányi László Sportcsarnok épületén belül található a szalon).
    - Telefon: +36 70 621 4181 (asztalfoglalás, rendezvények, információk).
    - Email: club11buda@gmail.com
    - Facebook oldal: https://www.facebook.com/club11ujbuda (itt képeket, aktuális híreket és eseményeket találnak).
    - Rendezvények: a Club 11 lehetőséget biztosít baráti összejövetelek, céges rendezvények (csapatépítők, évzárók, céges bulik), családi ünnepségek, születésnapi bulik, osztálytalálkozók, leány- és legénybúcsúk megtartására. Kisebb és nagyobb társaságoknak is ideális. Érdeklődni a club11buda@gmail.com címen lehet (a weboldalon a "Rendezvények" menüpontban is megtalálják). Rendezvényre árajánlatot ne adj, az e-mailben egyeztetendő.
    - Nyitvatartás:
${OPENING_HOURS_TEXT}
    - Játékterek és óradíjak (Rex asztal nincs):
${TABLES_TEXT}
    - Árlista – Étlap:
${menuText("etlap")}
    - Árlista – Itallap:
${menuText("itallap")}
    - Az italokra +50 Ft DRS (visszaváltási díj) jön. Melegétel mindennap 20:00-ig rendelhető.
    - Házirend és foglalási tudnivalók (ha szóba kerül, ezeket pontosan így mondd el):
      * ${BOOKING_INFO}
${HOUSE_RULES.map((rule) => `      * ${rule}`).join("\n")}
      * Környezetünk és programjaink elsősorban felnőtt vendégeink igényeihez igazodnak.

    A VISELKEDÉSEDRE VONATKOZÓ SZABÁLYOK:
    1. Mindig magyarul válaszolj, kedves, laza, közvetlen, tegeződő hangnemben (mint egy igazi csapos a törzsvendégeivel).
    2. SZABAD ASZTAL ÉS FOGLALÁS: Ha valaki azt kérdezi, van-e szabad asztal/gép egy időpontra, a lenti "SZABAD HELYEK" adatok alapján válaszolj egyértelműen igennel vagy nemmel, és ha nincs, ajánld fel a legközelebbi szabad idősávokat. Ha a kért időpont nyitvatartáson kívül esik (pl. zárás után vagy vasárnap), mondd meg, hogy akkor zárva vagyunk. Te magad nem tudsz foglalni: foglalni a weboldal "Asztalfoglalás" menüpontjában lehet (játék típusa, nap, egy vagy több idősáv; a konkrét asztalt a személyzet jelöli ki), vagy telefonon. A foglalás akkor érvényes, ha visszaigazolást kap róla. Soha ne állítsd, hogy lefoglaltál valamit.
    2/b. IDŐ: A "ma", "holnap", "ma este" stb. kifejezéseket a lenti AKTUÁLIS IDŐ alapján értelmezd. Mivel 14:00-tól vagyunk nyitva, a 12 alatti órák délutánt/estét jelentenek (pl. "tizenegy óra" = 23:00, "8-ra" = 20:00). Kérdezz vissza, ha nem egyértelmű, melyik napra vagy játékra gondol a vendég.
    3. ÁRAK: KIZÁRÓLAG a fenti árlistában és óradíjakban szereplő árakat mondhatod, pontosan úgy, ahogy ott szerepelnek. Soha ne találj ki árat, ne becsülj, ne kerekíts és ne mondj akciót vagy kedvezményt. Ha valaminek nincs ára a listában, vagy nincs a listában, mondd, hogy erről a pultnál vagy telefonon tudnak felvilágosítást adni. Ha étel, ital vagy rágcsálnivaló jön szóba általánosságban, ne sorold fel a teljes kínálatot, hanem javasold, hogy "nézd meg étlapunkat" a weboldalon.
    4. Melegszendvicset magadtól SOHA ne ajánlj. Csak akkor beszélj róla, ha a vendég kifejezetten rákérdez, és akkor is csak az árlistában szereplő árat mondd. Soproni sört nem forgalmazunk, azt ne ajánld.
    5. Ha nem tudsz valamit biztosan, válaszolj röviden és udvariasan, és irányítsd a vendéget a megadott telefonszámra, e-mail címre vagy a Facebook oldalra.
    6. Kerüld a túl hivatalos, gépies megfogalmazásokat. Használj néha kártyajátékos vagy biliárdos kifejezéseket ("Lássuk a golyókat!", "Egy jó lökés után jöhet egy jó kávé!"), de maradj kulturált.
    7. FONTOS: VÁLASZOLJ PICIT RÖVIDEBBEN ÉS TÖMÖREBBEN! Kerüld a hosszú monológot és a felesleges magyarázkodást. Lényegretörő, közvetlen, barátságos, rövid válaszokat adj (lehetőleg maximum 2-3 rövid bekezdés).
  `;

  // ------------------------------------------------------------------
  // Dátum/idő és foglaltság a csapos számára
  // ------------------------------------------------------------------
  const addDays = (date: string, days: number) => {
    const [y, m, d] = date.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
  };
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const categoryName = (type: TableType) => TABLE_CATEGORIES.find((c) => c.type === type)!.name.toLowerCase();

  const describeDay = (date: string, today: string) => {
    const dayName = DAY_NAMES[dayOfWeek(date)].toLowerCase();
    if (date === today) return `Ma (${dayName})`;
    if (date === addDays(today, 1)) return `Holnap (${dayName})`;
    return `${date} (${dayName})`;
  };

  // Az adott napon még szabad idősávok egy típusból, pl. "20:00 - 21:00 (6 szabad), ..."
  const freeSlotsText = (date: string, type: TableType, availability: Record<string, Record<string, number>>) =>
    Object.entries(availability[type] || {})
      .filter(([, free]) => free > 0)
      .map(([slot, free]) => `${slot} (${free} szabad)`)
      .join(", ");

  // Élő adatok az AI csapos számára: pontos idő és a következő 7 nap szabad helyei
  function buildLiveContext() {
    const now = budapestNow();
    const hoursToday = OPENING_HOURS[now.day];
    const openNow = !!hoursToday && now.hour >= hoursToday.open && now.hour < hoursToday.close;
    const bookings = readBookings();
    const lines = [
      `AKTUÁLIS IDŐ (Budapest): ${now.date}, ${DAY_NAMES[now.day].toLowerCase()}, ${pad2(now.hour)}:${pad2(now.minute)}. Most ${openNow ? "NYITVA" : "ZÁRVA"} vagyunk.`,
      `SZABAD HELYEK a következő 7 napra (csak a még foglalható idősávok, zárójelben a szabad asztalok/gépek száma):`,
    ];
    for (let i = 0; i < 7; i++) {
      const date = addDays(now.date, i);
      const label = `${date} (${DAY_NAMES[dayOfWeek(date)].toLowerCase()})`;
      const { slots, availability } = computeAvailability(date, bookings);
      if (slots.length === 0) {
        lines.push(`- ${label}: ZÁRVA, nem lehet foglalni.`);
        continue;
      }
      lines.push(`- ${label}, nyitva ${formatDayHours(OPENING_HOURS[dayOfWeek(date)])}:`);
      for (const category of TABLE_CATEGORIES) {
        const free = freeSlotsText(date, category.type, availability);
        lines.push(`    ${category.name}: ${free || "erre a napra már nincs szabad idősáv"}`);
      }
    }
    return lines.join("\n");
  }

  // Egyszerű magyar szövegértelmezés a tartalék (AI nélküli) válaszokhoz
  const HU_NUMBERS: [string, number][] = [
    ["tizenkettő", 12], ["tizenkét", 12], ["tizenegy", 11], ["kettő", 2], ["három", 3], ["négy", 4],
    ["nyolc", 8], ["kilenc", 9], ["tíz", 10], ["két", 2], ["hat", 6], ["hét", 7], ["öt", 5], ["egy", 1],
  ];
  const TIME_SUFFIXES = ["", "kor", "órakor", "órára", "óra", "ra", "re", "ig", "tól", "től", "óráig"];
  const WEEKDAY_STEMS = ["vasárn", "hétf", "kedd", "szerd", "csütört", "pént", "szomb"];

  function parseQuestion(text: string, today: string) {
    const lower = text.toLowerCase();
    const words = lower.split(/[^0-9a-záéíóöőúüű]+/).filter(Boolean);

    // Nap: ma / holnap / holnapután / hét napjai (a legközelebbi ilyen nap)
    let date = today;
    if (words.some((w) => w.startsWith("holnapután"))) date = addDays(today, 2);
    else if (words.some((w) => w.startsWith("holnap"))) date = addDays(today, 1);
    else {
      const idx = WEEKDAY_STEMS.findIndex((stem) => words.some((w) => w.startsWith(stem)));
      if (idx >= 0) date = addDays(today, (idx - dayOfWeek(today) + 7) % 7);
    }

    // Óra: "18:00", "18 órára", "11-re", "este tizenegyre", "hétkor" ...
    let hour: number | null = null;
    const clock = lower.match(/\b(\d{1,2})[:.]\d{2}\b/);
    if (clock) hour = Number(clock[1]);
    for (let i = 0; hour === null && i < words.length; i++) {
      const w = words[i];
      const next = words[i + 1] || "";
      const prev = words[i - 1] || "";
      // "este 8", "8 órára", "8-ra" -> időpont; "egy asztal", "ma 4 fő" -> nem
      const timeContext = next.startsWith("ór") || ["kor", "ra", "re", "ig", "tól", "től"].includes(next) ||
        ["este", "délután", "reggel"].includes(prev);
      if (/^\d{1,2}$/.test(w) && Number(w) <= 23 && (timeContext || ["ma", "holnap"].includes(prev) && next !== "fő" && !next.startsWith("fő"))) {
        hour = Number(w);
        break;
      }
      for (const [word, value] of HU_NUMBERS) {
        if (w.startsWith(word) && TIME_SUFFIXES.includes(w.slice(word.length)) && (w !== word || timeContext)) {
          hour = value;
          break;
        }
      }
    }
    // 14 és 23 óra között vagyunk nyitva, ezért a 12 alatti órák délutánt/estét jelentenek
    if (hour !== null && hour < 12) hour += 12;

    let type: TableType | null = null;
    if (words.some((w) => w.startsWith("darts"))) type = "darts";
    else if (words.some((w) => w.startsWith("csocs"))) type = "foosball";
    else if (words.some((w) => w.startsWith("leül") || w.startsWith("ülő") || w.startsWith("ülhet"))) type = "seating";
    else if (words.some((w) => w.startsWith("biliárd") || w.startsWith("pool"))) type = "pool";

    const has = (...stems: string[]) => words.some((w) => stems.some((s) => w.startsWith(s)));
    return { words, date, hour, type, has };
  }

  function availabilityReply(date: string, hour: number | null, type: TableType, today: string) {
    const label = describeDay(date, today);
    const dayHours = OPENING_HOURS[dayOfWeek(date)];
    if (!dayHours) {
      return `${label} zárva vagyunk, akkor sajnos nem tudunk asztalt adni. Hétfőtől szombatig várunk 14:00-tól, a pontos nyitvatartást a Kapcsolat oldalon találod!`;
    }
    const { slots, availability } = computeAvailability(date);
    const name = categoryName(type);
    const free = freeSlotsText(date, type, availability);
    const freeText = free ? `Még szabad ${name}: ${free}.` : `Erre a napra már nincs szabad ${name}.`;
    const bookHint = "Foglalni az Asztalfoglalás menüpontban tudsz, vagy hívj minket: +36 70 621 4181. A foglalás akkor érvényes, ha visszaigazoljuk.";
    const withHint = (text: string) => (free ? `${text} ${bookHint}` : text);

    if (hour === null) {
      return withHint(free ? `${label} még szabad ${name}: ${free}.` : `${label} már nincs szabad ${name}.`);
    }
    const slot = slots.find((s) => slotStartHour(s) === hour);
    if (!slot) {
      return withHint(`${label} ${formatDayHours(dayHours)} között vagyunk nyitva, így ${pad2(hour)}:00 órára sajnos nem lehet foglalni. ${freeText}`);
    }
    if (isSlotInPast(date, slot)) {
      return withHint(`A ${slot} idősáv már elkezdődött vagy elmúlt. ${freeText}`);
    }
    const remaining = availability[type][slot];
    if (remaining > 0) {
      return `Igen! ${label} ${slot} között még ${remaining} szabad ${name} van. ${bookHint}`;
    }
    return withHint(`Sajnos ${label.charAt(0).toLowerCase()}${label.slice(1)} ${slot} között már minden ${name} foglalt. ${freeText}`);
  }

  // Tartalék válaszok, ha nincs Claude API kulcs vagy az AI épp nem elérhető
  function getOfflineReply(messages: any[]) {
    const lastUserMessage = [...messages].reverse().find((m) => m?.role === "user")?.text || "";
    const today = budapestNow().date;
    const q = parseQuestion(String(lastUserMessage), today);

    // Rendezvények (céges, születésnap, osztálytalálkozó stb.) – e-mailes egyeztetés
    if (q.has("rendezvény", "céges", "csapatépít", "évzáró", "születésnap", "szülinap", "osztálytalálkoz", "legénybúcsú", "lánybúcsú", "leánybúcsú", "parti", "buli")) {
      return `Szívesen látunk titeket! A Club 11-ben baráti összejövetelt, céges rendezvényt, családi ünnepséget, születésnapi bulit, osztálytalálkozót, leány- vagy legénybúcsút is tarthattok. Érdeklődni a ${CLUB_EMAIL} címen tudtok, a részleteket a weboldal Rendezvények menüpontjában találjátok.`;
    }
    // Szabad hely / foglalás (ha van benne időpont, nap vagy játék, az a legfontosabb)
    if (q.hour !== null || q.has("foglal", "asztal", "szabad", "időpont", "pálya", "gép") ||
        (q.type && q.has("ma", "holnap", ...WEEKDAY_STEMS, "van", "lehet"))) {
      return availabilityReply(q.date, q.hour, q.type ?? "pool", today);
    }
    if (q.has("nyitva", "nyitvatart", "zárva", "zártok", "mikor", "meddig")) {
      const hours = WEEK_ORDER.map((day) => `${DAY_NAMES[day]}: ${formatDayHours(OPENING_HOURS[day])}`).join(", ");
      return `Nyitvatartásunk: ${hours}. Beugrasz?`;
    }
    if (q.words.some((w) => ["ár", "ára", "árak", "árat", "áron", "árai", "áruk"].includes(w)) || q.has("mennyi", "óradíj", "díj", "kerül")) {
      const rates = GAME_CATEGORIES.map((c) => `${c.name.toLowerCase()} ${formatPrice(c.hourlyRate)}/óra`).join(", ");
      return `Óradíjaink: ${rates}. Az ételek és italok árait az étlapunkon találod – nézd meg étlapunkat a weboldalon!`;
    }
    if (q.has("kaja", "étel", "enni", "eszik", "ennék", "szendvics", "nachos", "étlap", "ital", "inni", "sör", "kávé", "innék")) {
      return "Nézd meg étlapunkat a weboldalon (Kávézó & Bisztró menüpont), ott megtalálod a teljes kínálatot árakkal együtt!";
    }
    if (q.words.some((w) => ["hol", "hova", "merre", "honnan"].includes(w)) || q.has("cím", "megközelít", "parkol", "odajut")) {
      return "Újbudán, a Hauszmann Alajos u. 5. szám alatt vagyunk, a Gabányi László Sportcsarnok épületén belül. Gyere be a főbejáraton, ott megtalálsz!";
    }
    return "Szia! Sára vagyok, a Club 11 virtuális csaposa. 👋 Kérdezhetsz a szabad asztalokról (pl. „Van ma este 8-ra biliárdasztal?”), a nyitvatartásról, az árakról vagy a megközelítésről. Telefonon is elérsz minket: +36 70 621 4181.";
  }

  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: "Messages array is required." });
        return;
      }

      // Kérdéskorlát: a 12. kérdés után nem válaszolunk, hanem telefonra irányítunk
      const questionCount = messages.filter((msg: any) => msg?.role === "user").length;
      if (questionCount > MAX_CHAT_QUESTIONS) {
        res.json({ text: CHAT_LIMIT_MESSAGE, limitReached: true });
        return;
      }

      const client = getClaudeClient();
      if (!client) {
        // Fallback response for offline demo mode (if no API Key is set yet)
        const mockReply = getOfflineReply(messages);
        setTimeout(() => {
          res.json({ text: mockReply });
        }, 800);
        return;
      }

      // Az utolsó 20 üzenetet küldjük; a beszélgetésnek vendég üzenettel kell kezdődnie
      // (a csapos nyitó üdvözlését kihagyjuk) és vendég üzenettel kell végződnie.
      const recent = messages
        .filter((msg: any) => typeof msg?.text === "string" && msg.text.trim())
        .slice(-20);
      while (recent.length && recent[0].role !== "user") recent.shift();
      while (recent.length && recent[recent.length - 1].role !== "user") recent.pop();
      if (recent.length === 0) {
        res.json({ text: getOfflineReply(messages) });
        return;
      }
      const conversation: Anthropic.MessageParam[] = recent.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: String(msg.text).slice(0, 2000),
      }));

      const response = await client.messages.create({
        model: CHAT_MODEL,
        max_tokens: 1024, // rövid, csevegős válaszok
        temperature: 0.4,
        // Az állandó szabályok és árlista, utána az élő adatok (idő, szabad helyek)
        system: [
          { type: "text", text: SYSTEM_INSTRUCTION },
          { type: "text", text: buildLiveContext() },
        ],
        messages: conversation,
      });

      const replyText = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .trim();
      if (response.stop_reason === "refusal" || !replyText) {
        res.json({ text: "Erre most nem tudok válaszolni. Kérdezz a nyitvatartásról, az árakról vagy a szabad asztalokról, vagy hívj minket: +36 70 621 4181!" });
        return;
      }
      res.json({ text: replyText });

    } catch (err: any) {
      if (err instanceof Anthropic.AuthenticationError) {
        console.error("Claude API: érvénytelen ANTHROPIC_API_KEY – tartalék válasz megy ki.");
      } else if (err instanceof Anthropic.RateLimitError) {
        console.error("Claude API: túl sok kérés (429) – tartalék válasz megy ki.");
      } else if (err instanceof Anthropic.APIError) {
        console.error(`Claude API hiba ${err.status}: ${err.message} – tartalék válasz megy ki.`);
      } else {
        console.error("Chat hiba (tartalék válasz megy ki):", err);
      }
      // Bármilyen AI-hiba esetén a beépített tartalék válasz megy ki, hogy a vendég ne maradjon válasz nélkül
      try {
        const fallbackReply = getOfflineReply(req.body.messages || []);
        res.json({ text: fallbackReply });
      } catch (innerErr) {
        res.status(500).json({ error: "Szerverhiba történt a válaszadás során.", details: err.message });
      }
    }
  });

  // Gallery Endpoints
  app.get("/api/gallery", (req, res) => {
    try {
      if (!fs.existsSync(galleryFilePath)) {
        return res.json([]);
      }
      const data = fs.readFileSync(galleryFilePath, "utf-8");
      res.json(JSON.parse(data));
    } catch (err: any) {
      console.error("Failed to read gallery file:", err);
      res.status(500).json({ error: "Sikertelen galéria betöltés" });
    }
  });

  // ------------------------------------------------------------------
  // ADMIN AUTHENTICATION (galéria kezelés)
  // A jelszó NEM a kódban van, hanem az ADMIN_PASSWORD környezeti változóban.
  // Sikeres belépéskor a szerver kriptográfiailag véletlen, lejáró tokent ad ki.
  // ------------------------------------------------------------------
  const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // a token 12 óráig érvényes
  const adminSessions = new Map<string, number>(); // token -> lejárat (ms)

  function isValidAdminToken(token?: unknown): boolean {
    if (typeof token !== "string" || !token) return false;
    const expiry = adminSessions.get(token);
    if (!expiry) return false;
    if (Date.now() > expiry) {
      adminSessions.delete(token);
      return false;
    }
    return true;
  }

  // Időzítés-biztos jelszó-összehasonlítás
  function passwordMatches(input: string, configured: string): boolean {
    const a = crypto.createHash("sha256").update(input).digest();
    const b = crypto.createHash("sha256").update(configured).digest();
    return crypto.timingSafeEqual(a, b);
  }

  // Védelem a jelszó-próbálgatás ellen: 5 hibás próbálkozás / 15 perc
  const LOGIN_WINDOW_MS = 15 * 60 * 1000;
  const LOGIN_MAX_FAILS = 5;
  const failedLogins = new Map<string, { count: number; first: number }>();

  app.post("/api/gallery/login", (req, res) => {
    const configuredPassword = process.env.ADMIN_PASSWORD?.trim();
    if (!configuredPassword) {
      return res.status(403).json({
        success: false,
        error: "Az adminisztrátori belépés jelenleg le van tiltva, mert nincs beállítva az ADMIN_PASSWORD környezeti változó!"
      });
    }

    const key = req.ip || "unknown";
    const now = Date.now();
    const entry = failedLogins.get(key);
    if (entry && now - entry.first > LOGIN_WINDOW_MS) failedLogins.delete(key);
    const current = failedLogins.get(key);
    if (current && current.count >= LOGIN_MAX_FAILS) {
      return res.status(429).json({ success: false, error: "Túl sok hibás próbálkozás. Próbáld újra 15 perc múlva." });
    }

    const { password } = req.body || {};
    if (typeof password === "string" && passwordMatches(password, configuredPassword)) {
      failedLogins.delete(key);
      const token = crypto.randomBytes(32).toString("hex");
      adminSessions.set(token, now + TOKEN_TTL_MS);
      return res.json({ success: true, token });
    }

    if (current) current.count += 1;
    else failedLogins.set(key, { count: 1, first: now });
    return res.status(401).json({ success: false, error: "Hibás jelszó!" });
  });

  app.post("/api/gallery/verify", (req, res) => {
    res.json({ valid: isValidAdminToken(req.body?.token) });
  });

  app.post("/api/gallery/logout", (req, res) => {
    const { token } = req.body || {};
    if (typeof token === "string") adminSessions.delete(token);
    res.json({ success: true });
  });

  app.post("/api/gallery/upload", (req, res) => {
    try {
      const { title, description, image, token } = req.body;

      if (!isValidAdminToken(token)) {
        return res.status(403).json({ error: "Nincs jogosultságod a kép feltöltéséhez!" });
      }

      if (!image) {
        return res.status(400).json({ error: "Hiányzó képfájl!" });
      }

      // Handle base64 image parsing
      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: "Érvénytelen képformátum!" });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      // Determine extension
      let extension = "png";
      if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
        extension = "jpg";
      } else if (mimeType.includes("webp")) {
        extension = "webp";
      } else if (mimeType.includes("gif")) {
        extension = "gif";
      }

      const filename = `img_${Date.now()}.${extension}`;
      const savePath = path.join(uploadsDir, filename);

      fs.writeFileSync(savePath, buffer);

      // Save metadata
      const newItem = {
        id: `img-${Date.now()}`,
        title: title || "Club 11 Kép",
        description: description || "Az admin által feltöltött kép.",
        url: `/uploads/${filename}`,
        createdAt: new Date().toISOString()
      };

      const galleryData = JSON.parse(fs.readFileSync(galleryFilePath, "utf-8"));
      galleryData.unshift(newItem); // put it first
      fs.writeFileSync(galleryFilePath, JSON.stringify(galleryData, null, 2), "utf-8");

      res.json(newItem);
    } catch (err: any) {
      console.error("Failed to upload image:", err);
      res.status(500).json({ error: "Szerverhiba történt a kép feltöltése során." });
    }
  });

  app.delete("/api/gallery/:id", (req, res) => {
    try {
      const { id } = req.params;
      const { token } = req.body;

      if (!isValidAdminToken(token)) {
        return res.status(403).json({ error: "Nincs jogosultságod a kép törléséhez!" });
      }

      const galleryData = JSON.parse(fs.readFileSync(galleryFilePath, "utf-8"));
      const itemToDelete = galleryData.find((item: any) => item.id === id);

      if (!itemToDelete) {
        return res.status(404).json({ error: "A kép nem található!" });
      }

      // Remove the file from disk if it exists
      const filename = path.basename(itemToDelete.url);
      const filePath = path.join(uploadsDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Remove from json list
      const updatedGallery = galleryData.filter((item: any) => item.id !== id);
      fs.writeFileSync(galleryFilePath, JSON.stringify(updatedGallery, null, 2), "utf-8");

      res.json({ success: true });
    } catch (err: any) {
      console.error("Failed to delete image:", err);
      res.status(500).json({ error: "Szerverhiba történt a kép törlése során." });
    }
  });

  // ------------------------------------------------------------------
  // ASZTALFOGLALÁS
  // A vendég csak a játék típusát (pool / darts / csocsó) foglalja, a konkrét
  // asztalt a személyzet jelöli ki. Egy idősávban egy típusból legfeljebb annyi
  // foglalás lehet, ahány asztal/gép van belőle (pl. 6 pool asztal -> 6 foglalás).
  // Zárt napra, zárás utáni vagy már elkezdődött idősávra nem lehet foglalni.
  // ------------------------------------------------------------------
  const isValidDate = (date: unknown): date is string =>
    typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
  const isValidEmail = (email: string) => /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/.test(email);

  // ------------------------------------------------------------------
  // FOGLALÁSI E-MAILEK
  // Beállítás környezeti változókkal (pl. Gmail esetén alkalmazásjelszóval):
  //   SMTP_USER=club11buda@gmail.com   SMTP_PASS=<16 jegyű alkalmazásjelszó>
  //   (nem kötelező: SMTP_HOST, SMTP_PORT, SMTP_SECURE, BOOKING_NOTIFY_EMAIL)
  // Ha nincs beállítva, a foglalás ugyanúgy mentődik, csak e-mail nem megy ki.
  // ------------------------------------------------------------------
  const smtpPort = Number(process.env.SMTP_PORT) || 465;
  const mailTransport = process.env.SMTP_USER && process.env.SMTP_PASS
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: smtpPort,
        secure: (process.env.SMTP_SECURE ?? String(smtpPort === 465)) === "true",
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })
    : null;
  const notifyEmail = process.env.BOOKING_NOTIFY_EMAIL || CLUB_EMAIL;
  if (!mailTransport) {
    console.warn("SMTP_USER / SMTP_PASS nincs beállítva: a foglalásokról nem megy ki e-mail.");
  }

  function bookingSummaryText(group: Booking[]) {
    const first = group[0];
    const total = group.reduce((sum, b) => sum + b.totalPrice, 0);
    const lines = [
      `Dátum: ${first.date} (${DAY_NAMES[dayOfWeek(first.date)].toLowerCase()})`,
      ...group.map((b) => `  • ${b.typeName}: ${b.timeSlot}${b.totalPrice > 0 ? ` – ${formatPrice(b.totalPrice)}` : " – díjmentes, a fogyasztás kötelező"}`),
      `Létszám: ${first.partySize} fő`,
      `Név: ${first.name}`,
      `E-mail: ${first.email}`,
      `Telefon: ${first.phone}`,
    ];
    if (first.note) lines.push(`Megjegyzés, kérés: ${first.note}`);
    lines.push(`Várható fizetendő: ${total > 0 ? formatPrice(total) : "díjmentes (a fogyasztás kötelező)"}`);
    return lines.join("\n");
  }

  // Két e-mail: értesítés a klubnak és visszaigazolás a vendégnek. Hiba esetén a foglalás megmarad.
  async function sendBookingEmails(group: Booking[]): Promise<boolean> {
    if (!mailTransport || group.length === 0) return false;
    const first = group[0];
    const from = process.env.MAIL_FROM || `"Club 11 Újbuda" <${process.env.SMTP_USER}>`;
    const summary = bookingSummaryText(group);
    try {
      await mailTransport.sendMail({
        from,
        to: notifyEmail,
        replyTo: first.email,
        subject: `Új foglalási igény – ${first.date} – ${first.name}`,
        text: `Új foglalási igény érkezett a weboldalról.\n\n${summary}\n\nA vendégnek erre az e-mailre válaszolva tudsz visszaigazolást küldeni.`,
      });
      await mailTransport.sendMail({
        from,
        to: first.email,
        replyTo: notifyEmail,
        subject: "Club 11 – megkaptuk a foglalási igényedet",
        text:
          `Kedves ${first.name}!\n\nKöszönjük, megkaptuk a foglalási igényedet:\n\n${summary}\n\n` +
          `FONTOS: a foglalás akkor érvényes, ha visszaigazolást kapsz róla.\n` +
          `Az asztalt érkezéskor a személyzet jelöli ki.\n\n` +
          `Kérdés esetén hívj minket: +36 70 621 4181, vagy válaszolj erre az e-mailre.\n\n` +
          `Club 11 Újbuda\n1116 Budapest, Hauszmann Alajos u. 5. (Gabányi László Sportcsarnok)`,
      });
      console.log(`[E-MAIL] Foglalási értesítő elküldve: ${notifyEmail} és ${first.email}`);
      return true;
    } catch (err: any) {
      console.error("[E-MAIL] Nem sikerült elküldeni a foglalási e-mailt:", err?.message || err);
      return false;
    }
  }

  // Szabad helyek száma idősávonként és típusonként egy adott napra
  app.get("/api/bookings/availability", (req, res) => {
    const date = req.query.date;
    if (!isValidDate(date)) {
      return res.status(400).json({ error: "Érvénytelen dátum!" });
    }
    const { slots, availability } = computeAvailability(date);
    res.json({ date, closed: slots.length === 0, slots, availability });
  });

  // Túl sok foglalás ugyanarról a címről (a foglaló e-mailt is küld, így ez a visszaélést is fékezi)
  const BOOKING_WINDOW_MS = 60 * 60 * 1000;
  const BOOKING_MAX_PER_WINDOW = 10;
  const bookingAttempts = new Map<string, number[]>();

  // Egy foglalás több tételből állhat: pl. pool 18-20 és leülős asztal 18-21, ugyanarra a napra.
  // Minden tételt együtt ellenőrzünk: ha bármelyik nem foglalható, semmi sem mentődik el.
  app.post("/api/bookings", async (req, res) => {
    try {
      const ipKey = req.ip || "unknown";
      const now = Date.now();
      const recent = (bookingAttempts.get(ipKey) || []).filter((t) => now - t < BOOKING_WINDOW_MS);
      if (recent.length >= BOOKING_MAX_PER_WINDOW) {
        return res.status(429).json({ error: "Túl sok foglalási kísérlet. Kérlek próbáld újra később, vagy hívj minket telefonon!" });
      }
      recent.push(now);
      bookingAttempts.set(ipKey, recent);

      const { items, date, name, email, phone, partySize, note } = req.body || {};

      if (!isValidDate(date)) {
        return res.status(400).json({ error: "Kérlek válassz egy érvényes dátumot!" });
      }
      const openSlots = getSlotsForDate(date);
      if (openSlots.length === 0) {
        return res.status(400).json({ error: "Ezen a napon zárva vagyunk, nem lehet foglalni." });
      }
      if (!Array.isArray(items) || items.length === 0 || items.length > TABLE_CATEGORIES.length) {
        return res.status(400).json({ error: "Kérlek válassz ki legalább egy játékot vagy asztalt és idősávot!" });
      }
      const seenTypes = new Set<string>();
      const parsedItems: { category: (typeof TABLE_CATEGORIES)[number]; slots: string[] }[] = [];
      for (const item of items) {
        const category = TABLE_CATEGORIES.find((c) => c.type === item?.type);
        if (!category || seenTypes.has(category.type)) {
          return res.status(400).json({ error: "Érvénytelen foglalási tétel." });
        }
        seenTypes.add(category.type);
        const timeSlots = item.timeSlots;
        if (
          !Array.isArray(timeSlots) || timeSlots.length === 0 ||
          new Set(timeSlots).size !== timeSlots.length ||
          timeSlots.some((slot: unknown) => typeof slot !== "string" || !openSlots.includes(slot))
        ) {
          return res.status(400).json({ error: `${category.name}: a kiválasztott idősáv nyitvatartási időn kívül esik.` });
        }
        if (timeSlots.some((slot: string) => isSlotInPast(date, slot))) {
          return res.status(400).json({ error: "Már elkezdődött vagy elmúlt idősávra nem lehet foglalni." });
        }
        parsedItems.push({ category, slots: openSlots.filter((slot) => timeSlots.includes(slot)) });
      }

      const cleanName = typeof name === "string" ? name.trim().slice(0, 100) : "";
      const cleanEmail = typeof email === "string" ? email.trim().slice(0, 200) : "";
      const cleanPhone = typeof phone === "string" ? phone.trim().slice(0, 40) : "";
      if (!cleanName || !isValidEmail(cleanEmail) || !cleanPhone) {
        return res.status(400).json({ error: "Kérlek add meg a nevedet, egy érvényes e-mail címet és a telefonszámodat!" });
      }
      const people = Number(partySize);
      if (!Number.isInteger(people) || people < 1) {
        return res.status(400).json({ error: "Kérlek add meg, hány fő érkezik!" });
      }
      if (people > MAX_ONLINE_PARTY_SIZE) {
        return res.status(400).json({
          error: `${MAX_ONLINE_PARTY_SIZE} fő felett csak e-mailes foglalást fogadunk el. Kérlek írj nekünk: ${CLUB_EMAIL}`,
        });
      }
      const cleanNote = typeof note === "string" ? note.trim().slice(0, 500) : "";

      const bookings = readBookings();
      for (const { category, slots } of parsedItems) {
        const fullSlots = slots.filter((slot) => countBooked(bookings, category.type, date, slot) >= category.count);
        if (fullSlots.length > 0) {
          return res.status(409).json({
            error: `Sajnáljuk, ebben az idősávban már minden ${category.name.toLowerCase()} foglalt: ${fullSlots.join(", ")}. Kérlek válassz másik időpontot!`,
          });
        }
      }

      const groupId = `grp-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
      const created: Booking[] = parsedItems.map(({ category, slots }) => ({
        id: `book-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
        groupId,
        type: category.type,
        typeName: category.name,
        date,
        timeSlots: slots,
        timeSlot: formatSlotsSummary(slots),
        durationHours: slots.length,
        totalPrice: slots.length * category.hourlyRate,
        partySize: people,
        ...(cleanNote ? { note: cleanNote } : {}),
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        createdAt: new Date().toISOString(),
        cancelToken: crypto.randomBytes(16).toString("hex"),
      }));
      bookings.push(...created);
      writeBookings(bookings);

      console.log(`==================================================`);
      console.log(`[ÚJ FOGLALÁS] ${date} – ${cleanName} | ${cleanEmail} | ${cleanPhone} | ${people} fő`);
      for (const b of created) console.log(`  • ${b.typeName}: ${b.timeSlot}`);
      if (cleanNote) console.log(`Megjegyzés, kérés: ${cleanNote}`);
      console.log(`==================================================`);

      const emailSent = await sendBookingEmails(created);
      res.json({ bookings: created, emailSent });
    } catch (err: any) {
      console.error("Hiba a foglalás mentése során:", err);
      res.status(500).json({ error: "Szerverhiba történt a foglalás mentése során." });
    }
  });

  // Lemondás: csak az tudja lemondani, akinek a böngészőjében ott a foglaláshoz kapott kód
  app.delete("/api/bookings/:id", (req, res) => {
    try {
      const { cancelToken } = req.body || {};
      const bookings = readBookings();
      const booking = bookings.find((b) => b.id === req.params.id);
      if (!booking) {
        return res.json({ success: true }); // már nincs meg, nincs mit lemondani
      }
      if (typeof cancelToken !== "string" || cancelToken !== booking.cancelToken) {
        return res.status(403).json({ error: "Ezt a foglalást nem mondhatod le." });
      }
      writeBookings(bookings.filter((b) => b.id !== booking.id));
      console.log(`[FOGLALÁS LEMONDVA] ${booking.typeName} – ${booking.date} ${booking.timeSlot} – ${booking.name}`);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Hiba a foglalás lemondása során:", err);
      res.status(500).json({ error: "Szerverhiba történt a lemondás során." });
    }
  });

  // Serve uploaded images directly from various directories for maximum robustness
  app.get(["/asztalok.jpg", "/asztalok.png", "/asztalok.jpeg", "/asztalok.webp"], (req, res) => {
    const filename = path.basename(req.path);
    const searchPaths = [
      path.join(process.cwd(), filename),
      path.join(process.cwd(), "src", filename),
      path.join(process.cwd(), "assets", filename),
      path.join(process.cwd(), "public", filename),
      path.join(process.cwd(), "src", "assets", filename),
    ];

    let found = false;
    for (const filePath of searchPaths) {
      if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
        found = true;
        break;
      }
    }

    if (!found) {
      res.status(404).send("Not found");
    }
  });

  // Vite development or production routing
  const isDev = process.env.NODE_ENV !== "production" && (process.argv[1]?.includes("server.ts") ?? false);
  if (isDev) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Club 11 backend server running on http://localhost:${PORT}`);
  });
}

startServer();
