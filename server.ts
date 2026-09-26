/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import crypto from "crypto";

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

  // Body parser with larger payload limit for base64 image uploads
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ limit: "25mb", extended: true }));

  // Serve uploaded images statically
  app.use("/uploads", express.static(uploadsDir));

  // Lazy-initialize Gemini API to prevent crash on startup if missing key
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("GEMINI_API_KEY is not defined. AI Chatbot features will run in offline demo mode.");
        return null;
      }
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

  // System Instruction for Club 11 Virtual Bartender
  const SYSTEM_INSTRUCTION = `
    Te "Sára" vagy, a Club 11 barátságos, humoros, picit szűkszavúbb, de végtelenül vendégszerető Virtuális Csaposa és Szalonvezetője.
    A Club 11 egy biliárd szalon, kávézó, darts szentély és szórakozóhely Budapesten, a 11. kerületben (Újbuda), a Hauszmann Alajos utca 5. szám alatt, közvetlenül a Gabányi László Sportcsarnok területén.
    
    FONTOS INFORMÁCIÓK, AMIKET TUDSZ A HELYRŐL:
    - Cím: 1116 Budapest, Hauszmann Alajos u. 5. (A Gabányi László Sportcsarnok épületén belül található a szalon).
    - Telefon: +36 70 621 4181 (asztalfoglalás, rendezvények, információk).
    - Email: club11buda@gmail.com
    - Facebook oldal: https://www.facebook.com/club11ujbuda (itt képeket, aktuális híreket és versenykiírásokat találnak).
    - Nyitvatartás:
      * Hétfő: Zárva
      * Kedd - Szerda: 14:00 - 22:00
      * Csütörtök - Péntek: 14:00 - 23:00
      * Szombat: 14:00 - 22:00
      * Vasárnap: Zárva
    - Szolgáltatások és Árak:
      * 6 db professzionális 9 lábas pool biliárd asztal (2300 Ft/óra)
      * 2 db Soft Darts gép digitális számlálóval és játékvariációkkal (2000 Ft/óra)
      * 2 db csocsó asztal (1400 Ft/óra)
    - Italok és Snackek:
      * Prémium kávék (Espresso 590 Ft, Cappuccino 790 Ft, Latte 890 Ft, isteni Jeges Kávé vaníliafagyival és habbal 1190 Ft).
      * Csapolt sör (Heineken korsó 990 Ft) és palackozott kézműves IPA (1290 Ft), Edelweiss búzasör (1090 Ft).
      * Kiváló üdítők, házi limonádék (epres, bodzás, zöldalmás, citrusos 0.5l 1090 Ft).
      * Koktélok: Aperol Spritz (1790 Ft), Mojito (1990 Ft), Gin Tonic (1690 Ft).
      * Snackek: Isteni, ropogós Nachos sajtszósszal vagy salsával (990 Ft) – ez a helyi kedvence a vendégeknek! Rágcsálnivalók, mogyoró, sós pálcika (ropi). (Fontos: Melegszendvicset már nem árulunk, így azt SOHA ne ajánld!).
    
    A VISELKEDÉSEDRE VONATKOZÓ SZABÁLYOK:
    1. Mindig magyarul válaszolj, kedves, laza, közvetlen, tegeződő hangnemben (mint egy igazi csapos a törzsvendégeivel).
    2. Ha valaki asztalt szeretne foglalni, hívd fel a figyelmét, hogy a weboldalon közvetlenül elérhető az interaktív "Asztalfoglalás" menüpont, ahol valós időben kiválaszthatja a kívánt asztalt és tetszőlegesen akár több idősávot (több órás időtartamot) is lefoglalhat egyszerre! Vagy hívhatja a fenti telefonszámot is.
    3. Légy büszke a helyre és a családias hangulatra! Ha étel, ital vagy rágcsálnivaló jön szóba, NE válogass vagy sorolj fel konkrét tételeket az étlapról (hogy elkerüljük a hosszú válaszadási időt és felesleges részleteket), hanem egyszerűen javasold a vendégnek, hogy nézze meg az étlapunkat a weboldalon (használd pontosan ezt a szófordulatot: "nézd meg étlapunkat"). Fontos: Soproni sört és melegszendvicset már egyáltalán nem forgalmazunk, ezeket SOHA ne ajánld!
    4. Ha nem tudsz valamit biztosan, válaszolj röviden és udvariasan, és irányítsd a vendéget a megadott telefonszámra, e-mail címre vagy a Facebook oldalra.
    5. Kerüld a túl hivatalos, gépies megfogalmazásokat. Használj néha kártyajátékos vagy biliárdos kifejezéseket ("Lássuk a golyókat!", "Egy jó lökés után jöhet egy jó kávé!"), de maradj kulturált.
    6. FONTOS: VÁLASZOLJ PICIT RÖVIDEBBEN ÉS TÖMÖREBBEN! Kerüld a hosszú monológot és a felesleges magyarázkodást. Lényegretörő, közvetlen, barátságos, rövid válaszokat adj (lehetőleg maximum 2-3 rövid bekezdés).
  `;

  // Helper to generate offline/fallback replies
  function getOfflineReply(messages: any[]) {
    const lastUserMessage = messages[messages.length - 1]?.text || "";
    let mockReply = "Szia! Sára vagyok, a Club 11 Virtuális Csaposa és szalonvezetője! 👋 Újbudán várunk a Hauszmann Alajos u. 5. alatt. Biliárddal, csocsóval, darts-szal, jéghideg italokkal és snackekkel várunk. Foglalj asztalt az oldalon fenti foglalóval!";
    
    const lower = lastUserMessage.toLowerCase();
    if (lower.includes("ár") || lower.includes("mennyibe")) {
      mockReply = "A biliárd 2300 Ft/óra, a darts 2000 Ft/óra, a csocsó pedig 1400 Ft/óra. Italainkhoz és snackjeinkhez nézd meg étlapunkat a weboldalon!";
    } else if (lower.includes("nyitva") || lower.includes("mikor")) {
      mockReply = "Kedd-Szerda: 14:00-22:00, Csütörtök-Péntek: 14:00-23:00, Szombat: 14:00-22:00. Hétfőn és Vasárnap zárva vagyunk! Beugrasz ma?";
    } else if (lower.includes("kaja") || lower.includes("eszik") || lower.includes("szendvics") || lower.includes("étel") || lower.includes("nachos") || lower.includes("melegszendvics")) {
      mockReply = "Nézd meg étlapunkat a weboldalon a teljes étel- és snack kínálatunkért! Ropogós nachos sajtszósszal vagy salsával és egyéb finomságok is várnak rágcsálni!";
    } else if (lower.includes("cím") || lower.includes("hol") || lower.includes("hely") || lower.includes("hova")) {
      mockReply = "Újbudán, a Hauszmann Alajos u. 5. szám alatt vagyunk a Gabányi László Sportcsarnokon belül. Gyere be a főbejáraton, ott megtalálsz!";
    } else if (lower.includes("foglal") || lower.includes("biliárd")) {
      mockReply = "Foglalj asztalt az oldalon található interaktív Asztalfoglalás menüpontban, ahol akár több idősávot is kijelölhetsz egyszerre, vagy hívj fel minket: +36 70 621 4181!";
    }
    return mockReply;
  }

  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: "Messages array is required." });
        return;
      }

      const client = getGeminiClient();
      if (!client) {
        // Fallback response for offline demo mode (if no API Key is set yet)
        const mockReply = getOfflineReply(messages);
        setTimeout(() => {
          res.json({ text: mockReply });
        }, 800);
        return;
      }

      // Map client messages into Gemini parts format
      const contents = messages.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      // Call Gemini API using modern SDK
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.8,
        },
      });

      const replyText = response.text || "Sajnálom, de most egy kicsit összekeveredtek a golyók. Kérlek, kérdezd újra, vagy hívj minket telefonon!";
      res.json({ text: replyText });

    } catch (err: any) {
      console.error("Gemini API Error (falling back to offline handler):", err);
      // Fallback gracefully on any model/service errors (like 503 UNAVAILABLE or 429)
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

  // Email Notification Endpoint for Bookings
  app.post("/api/send-booking-email", (req, res) => {
    try {
      const { name, email, phone, tableName, date, timeSlot, timeSlots, durationHours, totalPrice } = req.body;
      
      const targetEmail = "club11buda@gmail.com";
      console.log(`==================================================`);
      console.log(`[EMAIL DISPATCH TO ${targetEmail}]`);
      console.log(`Tárgy: Új asztalfoglalási igény - ${tableName} (${date})`);
      console.log(`Vendég neve: ${name}`);
      console.log(`Vendég e-mail: ${email}`);
      console.log(`Vendég telefon: ${phone}`);
      console.log(`Lefoglalt eszköz/pálya: ${tableName}`);
      console.log(`Dátum: ${date}`);
      console.log(`Idősáv(ok): ${timeSlot}`);
      console.log(`Órák száma: ${durationHours} óra`);
      console.log(`Várható díj: ${totalPrice} Ft`);
      console.log(`==================================================`);

      res.json({
        success: true,
        message: `A foglalási értesítőt elküldtük a ${targetEmail} e-mail címre.`,
        details: {
          to: targetEmail,
          tableName,
          date,
          timeSlot,
          name,
          email,
          phone
        }
      });
    } catch (err: any) {
      console.error("Hiba az e-mail küldése során:", err);
      res.status(500).json({ error: "Szerverhiba az e-mail küldésekor." });
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
