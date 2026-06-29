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
    Te a "Club 11 Virtuális Csaposa és Szalonvezetője" vagy, egy barátságos, humoros és végtelenül vendégszerető vendéglátó.
    A Club 11 egy biliárd szalon, kávézó, darts szentély és szórakozóhely Budapesten, a 11. kerületben (Újbuda), a Hauszmann Alajos utca 5. szám alatt, közvetlenül a Gabányi László Sportcsarnok területén.
    
    FONTOS INFORMÁCIÓK, AMIKET TUDSZ A HELYRŐL:
    - Cím: 1116 Budapest, Hauszmann Alajos u. 5. (A Gabányi László Sportcsarnok épületén belül található a szalon).
    - Telefon: +36 70 621 4181 (asztalfoglalás, rendezvények, információk).
    - Facebook oldal: https://www.facebook.com/club11ujbuda (itt képeket, aktuális híreket és versenykiírásokat találnak).
    - Nyitvatartás:
      * Hétfő: Zárva
      * Kedd - Szerda: 14:00 - 22:00
      * Csütörtök - Szombat: 14:00 - 23:00
      * Vasárnap: Zárva
    - Szolgáltatások és Árak:
      * 6 db professzionális 9 lábas pool biliárd asztal (2300 Ft/óra)
      * 2 db Soft Darts gép digitális számlálóval és játékvariációkkal (2000 Ft/óra)
      * 2 db csocsó asztal (1400 Ft/óra)
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
        let mockReply = "Szia! A Club 11 Virtuális Csaposa vagyok. Jelenleg offline demó módban futok, de szívesen segítek! Újbudán várunk a Hauszmann Alajos u. 5. alatt biliárddal, csocsóval, darts-szal, csapolt sörökkel és isteni melegszendviccsel. Foglalj asztalt az oldalon fenti foglalóval!";
        
        const lower = lastUserMessage.toLowerCase();
        if (lower.includes("ár") || lower.includes("mennyibe")) {
          mockReply = "A biliárd asztalok óradíja 2300 Ft. Dartsunk is van 2000 Ft-ért óránként, a csocsó pedig 1400 Ft/óra! Igyál mellé egy jó csapolt sört vagy kávét!";
        } else if (lower.includes("nyitva") || lower.includes("mikor")) {
          mockReply = "Kedd-Szerda 14:00-22:00 között, Csütörtök-Szombat 14:00-23:00 között vagyunk nyitva! Hétfőn és Vasárnap zárva tartunk.";
        } else if (lower.includes("kaja") || lower.includes("eszik") || lower.includes("szendvics") || lower.includes("étel")) {
          mockReply = "Ó, a melegszendvicsünk legendás! Sonkás-sajtos vagy szalámis-sajtos, ropogósra sütve, ketchuppal és majonézzel, mindössze 1290 Ft-ért. Emellett nachos is vár sajtszósszal vagy salsával (990 Ft)!";
        } else if (lower.includes("cím") || lower.includes("hol") || lower.includes("hely") || lower.includes("hova")) {
          mockReply = "A Club 11 Budapesten, a 11. kerületben (Újbuda) található a Hauszmann Alajos utca 5. szám alatt, a Gabányi László Sportcsarnokon belül! Gyere be bátran a főbejáraton, ott megtalálsz minket!";
        } else if (lower.includes("foglal") || lower.includes("biliárd")) {
          mockReply = "Biliárd asztal foglalásához használd az oldalon felül található interaktív Asztalfoglalás menüpontot! Ott kiválaszthatod a neked tetsző pool asztalt, és azonnal lefoglalhatod. Vagy hívhatsz minket telefonon a +36 70 621 4181 számon!";
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

  app.post("/api/gallery/login", (req, res) => {
    const { password } = req.body;
    // Set a very simple password
    if (password === "club11admin") {
      res.json({ success: true, token: "admin-session-club11-token" });
    } else {
      res.status(401).json({ success: false, error: "Hibás jelszó!" });
    }
  });

  app.post("/api/gallery/upload", (req, res) => {
    try {
      const { title, description, image, token } = req.body;

      if (token !== "admin-session-club11-token") {
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

      if (token !== "admin-session-club11-token") {
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
