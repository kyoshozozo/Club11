/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ------------------------------------------------------------------
// PULTOS TABLET API
// A boltban lévő tablet (/pult) ugyanazt a foglalási adatot látja és írja,
// mint a weboldal: a telefonon/Messengeren/helyben felvett foglalások így a
// weboldal szabad helyeiből is levonódnak, a webes foglalások pedig azonnal
// megjelennek a tableten.
// Védelem: a PULT_KEY környezeti változóban megadott kulcs (X-Pult-Kulcs fejléc).
// ------------------------------------------------------------------

import type { Express, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import {
  TABLE_CATEGORIES,
  TABLE_UNITS,
  OPENING_HOURS,
  TIME_SLOTS,
  dayOfWeek,
  budapestNow,
  slotStartHour,
  bookingIntervals,
  bookingOverlaps,
  slotsForRange,
  onlineQuantity,
} from "./src/data";
import type { Booking, BookingSource } from "./src/types";

export interface PultDeps {
  readBookings: () => Booking[];
  writeBookings: (bookings: Booking[]) => void;
  isValidDate: (date: unknown) => date is string;
  // Visszaigazoló e-mail a csoportnak; siker esetén a confirmedAt időpontot adja vissza
  confirmBookingGroup: (key: string) => Promise<string>;
  groupKey: (b: Booking) => string;
  mailConfigured: boolean;
}

const SOURCES: BookingSource[] = ["web", "tel", "msg", "hely"];
const GRID_OPEN = Math.min(...OPENING_HOURS.filter(Boolean).map((h) => h!.open)) * 60;
const GRID_CLOSE = Math.max(...OPENING_HOURS.filter(Boolean).map((h) => h!.close)) * 60;
const STEP = 30;

const pad2 = (n: number) => String(n).padStart(2, "0");
const fmt = (m: number) => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
const unitById = (id: string) => TABLE_UNITS.find((u) => u.id === id);
const isWeb = (b: Booking) => !b.source || b.source === "web";
const sanitize = ({ cancelToken, ...rest }: Booking) => rest;

// Szabad konkrét asztalok egy webes foglaláshoz (az adott típusból, minden szakaszára szabad;
// a csak pultnál foglalható asztalokat, pl. a versenyasztalt, sosem osztjuk ki automatikusan)
export function pickFreeTables(booking: Booking, bookings: Booking[], wanted: number): string[] {
  const intervals = bookingIntervals(booking);
  const others = bookings.filter((b) => b.id !== booking.id && b.date === booking.date);
  return TABLE_UNITS.filter((u) => u.type === booking.type && u.online)
    .filter((u) => !others.some((b) => b.tables?.includes(u.id) && intervals.some(([s, e]) => bookingOverlaps(b, s, e))))
    .slice(0, wanted)
    .map((u) => u.id);
}

// Induláskor: a még ki nem osztott, jövőbeli webes foglalások asztalt kapnak, ha van szabad
export function assignMissingTables(bookings: Booking[]): number {
  const today = budapestNow().date;
  let changed = 0;
  for (const b of bookings) {
    if (b.date < today || b.tables) continue;
    b.tables = pickFreeTables(b, bookings, b.quantity ?? 1);
    changed++;
  }
  return changed;
}

export function registerPultRoutes(app: Express, deps: PultDeps) {
  const PULT_KEY = process.env.PULT_KEY?.trim();
  if (!PULT_KEY) console.warn("PULT_KEY nincs beállítva: a pultos tablet (/pult) le van tiltva.");
  else if (PULT_KEY.length < 16) console.warn("A PULT_KEY túl rövid, legalább 16 karakter ajánlott.");

  // Hibás kulcs: IP-nként 15 percen belül legfeljebb 10 próbálkozás
  const fails = new Map<string, { count: number; first: number }>();
  const keyMatches = (input: string) =>
    crypto.timingSafeEqual(crypto.createHash("sha256").update(input).digest(), crypto.createHash("sha256").update(PULT_KEY!).digest());

  function requireKey(req: Request, res: Response, next: NextFunction) {
    if (!PULT_KEY) return res.status(503).json({ error: "A pultos felület nincs bekapcsolva (hiányzik a PULT_KEY beállítás a tárhelyen)." });
    const ip = req.ip || "unknown";
    const now = Date.now();
    const entry = fails.get(ip);
    if (entry && now - entry.first > 15 * 60 * 1000) fails.delete(ip);
    const current = fails.get(ip);
    if (current && current.count >= 10) return res.status(429).json({ error: "Túl sok hibás próbálkozás. Próbáld újra 15 perc múlva." });
    if (keyMatches(req.get("X-Pult-Kulcs") || "")) {
      fails.delete(ip);
      return next();
    }
    if (current) current.count++;
    else fails.set(ip, { count: 1, first: now });
    res.status(401).json({ error: "Hibás pult kulcs." });
  }

  const config = {
    categories: TABLE_CATEGORIES.map(({ type, name, count, hourlyRate }) => ({ type, name, count, hourlyRate })),
    tables: TABLE_UNITS,
    openingHours: OPENING_HOURS,
    gridOpen: GRID_OPEN,
    gridClose: GRID_CLOSE,
    step: STEP,
    mailConfigured: deps.mailConfigured,
  };

  // Egy nap foglalásai + a még vissza nem igazolt webes foglalások (bármely jövőbeli napra)
  app.get("/api/pult/nap", requireKey, (req, res) => {
    const date = req.query.date;
    if (!deps.isValidDate(date)) return res.status(400).json({ error: "Érvénytelen dátum." });
    try {
      const all = deps.readBookings();
      const today = budapestNow().date;
      const pending = all
        .filter((b) => isWeb(b) && !b.confirmedAt && b.email && b.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date) || bookingIntervals(a)[0][0] - bookingIntervals(b)[0][0])
        .map(sanitize);
      res.json({
        config,
        date,
        hours: OPENING_HOURS[dayOfWeek(date)],
        bookings: all.filter((b) => b.date === date).map(sanitize),
        pending,
      });
    } catch (err) {
      console.error("[PULT] Hiba a foglalások beolvasásakor:", err);
      res.status(500).json({ error: "Nem sikerült beolvasni a foglalásokat." });
    }
  });

  // Naptár: egy hónap napjaira a foglalások száma (a nap részleteit a /nap végpont adja)
  app.get("/api/pult/honap", requireKey, (req, res) => {
    const month = req.query.month;
    if (typeof month !== "string" || !/^\d{4}-\d{2}$/.test(month)) return res.status(400).json({ error: "Érvénytelen hónap." });
    try {
      const days: Record<string, { bookings: number; tables: number }> = {};
      for (const b of deps.readBookings()) {
        if (!b.date.startsWith(month + "-")) continue;
        const d = (days[b.date] ??= { bookings: 0, tables: 0 });
        d.bookings++;
        d.tables += b.quantity ?? 1;
      }
      res.json({ month, days, openingHours: OPENING_HOURS });
    } catch (err) {
      console.error("[PULT] Hiba a naptár beolvasásakor:", err);
      res.status(500).json({ error: "Nem sikerült beolvasni a naptárat." });
    }
  });

  // Új foglalás vagy meglévő módosítása
  app.post("/api/pult/foglalas", requireKey, (req, res) => {
    try {
      const body = req.body || {};
      const bookings = deps.readBookings();
      const existing = typeof body.id === "string" ? bookings.find((b) => b.id === body.id) : undefined;
      if (body.id && !existing) return res.status(404).json({ error: "Ez a foglalás közben törlődött." });

      const date = body.date;
      if (!deps.isValidDate(date)) return res.status(400).json({ error: "Érvénytelen dátum." });

      // Asztalok: egy típusból; webes foglalásnál legfeljebb annyi, ahányat a vendég kért
      const tables: string[] = Array.isArray(body.tables) ? [...new Set(body.tables.filter((t: unknown) => typeof t === "string"))] as string[] : [];
      const units = tables.map(unitById);
      if (units.length === 0 || units.some((u) => !u)) return res.status(400).json({ error: "Válassz legalább egy asztalt/gépet." });
      const type = units[0]!.type;
      if (units.some((u) => u!.type !== type)) return res.status(400).json({ error: "Egy foglalásban csak azonos típusú asztalok lehetnek." });
      const web = existing ? isWeb(existing) : false;
      if (web && type !== existing!.type) return res.status(400).json({ error: "Webes foglalásnál nem lehet a játék típusát módosítani." });
      const quantity = web ? existing!.quantity ?? 1 : tables.length;
      if (tables.length > quantity) return res.status(400).json({ error: `Ehhez a foglaláshoz legfeljebb ${quantity} asztal osztható ki.` });

      // Időpont: webes foglalásnál csak akkor változik, ha a pultnál átírták
      let start: number | undefined = existing?.start;
      let end: number | undefined = existing?.end;
      let timeSlots = existing?.timeSlots ?? [];
      if (!existing || body.timeChanged) {
        start = Number(body.start);
        end = Number(body.end);
        if (![start, end].every((m) => Number.isInteger(m) && m % STEP === 0) || start < GRID_OPEN || end > GRID_CLOSE || end <= start) {
          return res.status(400).json({ error: `Az időpont ${fmt(GRID_OPEN)} és ${fmt(GRID_CLOSE)} közé essen, félórás lépésekben.` });
        }
        timeSlots = slotsForRange(start, end);
      }

      const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
      if (!name) return res.status(400).json({ error: "Add meg a vendég nevét." });
      const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 40) : "";
      const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : "";
      const partySize = Number(body.partySize);
      if (!Number.isInteger(partySize) || partySize < 1 || partySize > 99) return res.status(400).json({ error: "Érvénytelen létszám." });
      const source: BookingSource = web ? "web" : SOURCES.includes(body.source) && body.source !== "web" ? body.source : "tel";

      const candidate: Booking = {
        ...(existing ?? {
          id: `pult-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
          email: "",
          createdAt: new Date().toISOString(),
          confirmedAt: new Date().toISOString(), // a pultnál felvett foglalás eleve el van fogadva
        }),
        type,
        typeName: TABLE_CATEGORIES.find((c) => c.type === type)!.name,
        date,
        tables,
        quantity,
        timeSlots,
        ...(typeof start === "number" && typeof end === "number" ? { start, end } : {}),
        name,
        phone,
        partySize,
        source,
        ...(note ? { note } : { note: undefined }),
        arrived: !!body.arrived,
      } as Booking;
      const intervals = bookingIntervals(candidate);
      const minutes = intervals.reduce((sum, [s, e]) => sum + (e - s), 0);
      const category = TABLE_CATEGORIES.find((c) => c.type === type)!;
      candidate.durationHours = minutes / 60;
      candidate.totalPrice = Math.round((minutes / 60) * category.hourlyRate * quantity);
      candidate.timeSlot = `${intervals.map(([s, e]) => `${fmt(s)} - ${fmt(e)}`).join(", ")} (${String(minutes / 60).replace(".", ",")} óra)`;

      const others = bookings.filter((b) => b.id !== candidate.id && b.date === date);

      // 1) Konkrét asztal ütközés
      for (const t of tables) {
        const clash = others.find((b) => b.tables?.includes(t) && intervals.some(([s, e]) => bookingOverlaps(b, s, e)));
        if (clash) {
          const [cs, ce] = bookingIntervals(clash)[0];
          return res.status(409).json({ error: `${unitById(t)!.name} foglalt ${fmt(cs)}–${fmt(ce)} (${clash.name}).` });
        }
      }
      // 2) Kapacitás: a még ki nem osztott webes foglalásokkal együtt sem lehet több, mint ahány
      //    webről is foglalható asztal van (a csak pultnál foglalható asztalt az 1) pont védi)
      const wanted = onlineQuantity(candidate);
      for (const [s, e] of intervals) {
        for (let m = s; m < e && wanted > 0; m += STEP) {
          const used = others.filter((b) => b.type === type && bookingOverlaps(b, m, m + STEP)).reduce((sum, b) => sum + onlineQuantity(b), 0);
          if (used + wanted > category.count) {
            return res.status(409).json({
              error: `${fmt(m)}-kor már nincs elég szabad ${category.name.toLowerCase()} (a még ki nem osztott webes foglalásokkal együtt).`,
            });
          }
        }
      }

      if (existing) Object.assign(existing, candidate);
      else bookings.push(candidate);
      deps.writeBookings(bookings);
      console.log(`[PULT ${existing ? "MÓDOSÍTÁS" : "FOGLALÁS"}] ${date} ${candidate.timeSlot} – ${tables.map((t) => unitById(t)!.name).join(", ")} – ${name} (${source})`);
      res.json({ booking: sanitize(candidate) });
    } catch (err) {
      console.error("[PULT] Hiba a foglalás mentésekor:", err);
      res.status(500).json({ error: "Szerverhiba történt a mentés során." });
    }
  });

  app.post("/api/pult/foglalas/:id/megerkezett", requireKey, (req, res) => {
    try {
      const bookings = deps.readBookings();
      const b = bookings.find((x) => x.id === req.params.id);
      if (!b) return res.status(404).json({ error: "Ez a foglalás közben törlődött." });
      b.arrived = !!req.body?.arrived;
      deps.writeBookings(bookings);
      res.json({ success: true });
    } catch (err) {
      console.error("[PULT] Hiba:", err);
      res.status(500).json({ error: "Szerverhiba történt." });
    }
  });

  app.delete("/api/pult/foglalas/:id", requireKey, (req, res) => {
    try {
      const bookings = deps.readBookings();
      const b = bookings.find((x) => x.id === req.params.id);
      if (b) {
        deps.writeBookings(bookings.filter((x) => x.id !== b.id));
        console.log(`[PULT TÖRLÉS] ${b.date} ${b.timeSlot} – ${b.typeName} – ${b.name}`);
      }
      res.json({ success: true });
    } catch (err) {
      console.error("[PULT] Hiba a törléskor:", err);
      res.status(500).json({ error: "Szerverhiba történt a törlés során." });
    }
  });

  // Webes foglalás visszaigazolása e-mailben (ugyanaz, mint az admin felületen)
  app.post("/api/pult/foglalas/:id/visszaigazolas", requireKey, async (req, res) => {
    const b = deps.readBookings().find((x) => x.id === req.params.id);
    if (!b) return res.status(404).json({ error: "Ez a foglalás közben törlődött." });
    try {
      const confirmedAt = await deps.confirmBookingGroup(deps.groupKey(b));
      res.json({ success: true, confirmedAt });
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err?.message || "Nem sikerült a visszaigazolás." });
    }
  });
}

// A TIME_SLOTS és a rács egyezését induláskor ellenőrizzük (ha valaki bővíti a nyitvatartást)
if (slotStartHour(TIME_SLOTS[0]) * 60 > GRID_OPEN || slotStartHour(TIME_SLOTS[TIME_SLOTS.length - 1]) * 60 + 60 < GRID_CLOSE) {
  console.warn("[PULT] A TIME_SLOTS nem fedi le a teljes nyitvatartást – bővítsd a src/data.ts-ben.");
}
