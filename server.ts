/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

// Load environment variables
dotenv.config();

// ES Module support for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser
  app.use(express.json());

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
    Te a "Club 11 Virtuális Csaposa és Szalonvezetője" vagy, egy barátságos, humoros és végtelenül vendégszerető vendéglátó.
    A Club 11 egy biliárd szalon, kávézó, darts szentély és szórakozóhely Budapesten, a 11. kerületben (Újbuda), a Hauszmann Aladár utca 5. szám alatt, közvetlenül a Gabányi László Sportcsarnok területén.
    
    FONTOS INFORMÁCIÓK, AMIKET TUDSZ A HELYRŐL:
    - Cím: 1116 Budapest, Hauszmann Aladár u. 5. (A Gabányi László Sportcsarnok épületén belül található a szalon).
    - Telefon: +36 20 945 1111 (asztalfoglalás, rendezvények, információk).
    - Facebook oldal: https://www.facebook.com/club11ujbuda (itt képeket, aktuális híreket és versenykiírásokat találnak).
    - Nyitvatartás:
      * Hétfő - Csütörtök: 14:00 - 23:00
      * Péntek - Szombat: 14:00 - 01:00 (hosszabb nyitvatartás, pörgős hétvégi hangulat)
      * Vasárnap: 14:00 - 22:00
    - Szolgáltatások és Árak:
      * 7 db Brunswick/Dynamic professzionális 9 lábas pool biliárd asztal (2800 Ft/óra)
      * 1 db Klasszikus Magyar Rex asztal gombával és lyukakkal (2000 Ft/óra)
      * 2 db Soft Darts gép digitális számlálóval és játékvariációkkal (1200 Ft/óra)
      * 2 db Garlando csocsó asztal (1000 Ft/óra)
    - Italok és Snackek:
      * Prémium kávék (Espresso 590 Ft, Cappuccino 790 Ft, Latte 890 Ft, isteni Jeges Kávé vaníliafagyival és habbal 1190 Ft).
      * Csapolt sörök (Soproni korsó 790 Ft, Heineken korsó 990 Ft) és palackozott kézműves IPA (1290 Ft), Edelweiss búzasör (1090 Ft).
      * Kiváló üdítők, házi limonádék (epres, bodzás, zöldalmás, citrusos 0.5l 1090 Ft).
      * Koktélok: Aperol Spritz (1790 Ft), Mojito (1990 Ft), Gin Tonic (1690 Ft).
      * Snackek: Házias, ropogósra sütött Melegszendvics (sonkás-gombás vagy szalámis sajtos, ketchuppal/majonézzel 1290 Ft) – ez a helyi kedvenc! Nachos meleg sajtszósszal vagy salsával (990 Ft).
    
    A VISELKEDÉSEDRE VONATKOZÓ SZABÁLYOK:
    1. Mindig magyarul válaszolj, kedves, laza, közvetlen, tegeződő hangnemben (mint egy igazi csapos a törzsvendégeivel).
    2. Ha valaki asztalt szeretne foglalni, hívd fel a figyelmét, hogy a weboldalon közvetlenül elérhető az interaktív "Asztalfoglalás" menüpont, ahol valós időben kiválaszthatja a kívánt asztalt és időpontot, ami elmentődik a böngészőjében! Vagy hívhatja a fenti telefonszámot is.
    3. Légy büszke a helyre, a családias hangulatra és a kiváló melegszendvicsre. Ha szóba jön az étel, mindenképpen ajánld a melegszendvicset!
    4. Ha nem tudsz valamit biztosan, válaszolj udvariasan, és irányítsd a vendéget a megadott telefonszámra vagy a Facebook oldalra.
    5. Kerüld a túl hivatalos, gépies megfogalmazásokat. Használj néha kártyajátékos vagy biliárdos kifejezéseket ("Lássuk a golyókat!", "Egy jó lökés után jöhet egy jó kávé!"), de maradj kulturált.
  `;

  // API Endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Club 11 Server is running smoothly!" });
  });

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
        const lastUserMessage = messages[messages.length - 1]?.text || "";
        let mockReply = "Szia! A Club 11 Virtuális Csaposa vagyok. Jelenleg offline demó módban futok, de szívesen segítek! Újbudán várunk a Hauszmann Aladár u. 5. alatt biliárddal, rexszel, csapolt sörökkel és isteni melegszendviccsel. Foglalj asztalt az oldalon fenti foglalóval!";
        
        const lower = lastUserMessage.toLowerCase();
        if (lower.includes("ár") || lower.includes("mennyibe")) {
          mockReply = "A biliárd asztalok óradíja 2800 Ft, a klasszikus magyar rex pedig 2000 Ft/óra. Dartsunk is van 1200 Ft-ért óránként! Igyál mellé egy jó csapolt sört vagy kávét!";
        } else if (lower.includes("nyitva") || lower.includes("mikor")) {
          mockReply = "Minden nap nyitva vagyunk délután kettőtől (14:00)! Hétfőtől csütörtökig 23:00-ig, pénteken és szombaton hajnali 01:00-ig tartunk nyitva, vasárnap pedig 22:00-kor zárunk. Gyere el hozzánk!";
        } else if (lower.includes("kaja") || lower.includes("eszik") || lower.includes("szendvics") || lower.includes("étel")) {
          mockReply = "Ó, a melegszendvicsünk legendás! Sonkás-sajtos vagy szalámis-sajtos, ropogósra sütve, ketchuppal és majonézzel, mindössze 1290 Ft-ért. Emellett nachos is vár sajtszósszal vagy salsával (990 Ft)!";
        } else if (lower.includes("cím") || lower.includes("hol") || lower.includes("hely") || lower.includes("hova")) {
          mockReply = "A Club 11 Budapesten, a 11. kerületben (Újbuda) található a Hauszmann Aladár utca 5. szám alatt, a Gabányi László Sportcsarnokon belül! Gyere be bátran a főbejáraton, ott megtalálsz minket!";
        } else if (lower.includes("foglal") || lower.includes("biliárd")) {
          mockReply = "Biliárd asztal foglalásához használd az oldalon felül található interaktív Asztalfoglalás menüpontot! Ott kiválaszthatod a neked tetsző Brunswick pool asztalt vagy rexet, és azonnal lefoglalhatod. Vagy hívhatsz minket telefonon a +36 20 945 1111 számon!";
        }

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
      console.error("Gemini API Error:", err);
      res.status(500).json({ error: "Szerverhiba történt a válaszadás során.", details: err.message });
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
  if (process.env.NODE_ENV !== "production") {
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
