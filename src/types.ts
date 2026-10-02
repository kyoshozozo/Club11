/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TableType = 'pool' | 'darts' | 'foosball' | 'seating';

// A vendég csak a játéktípust választja, a konkrét asztalt a személyzet osztja ki.
export interface TableCategory {
  type: TableType;
  name: string;
  description: string;
  hourlyRate: number; // in HUF (0 = díjmentes, pl. leülős asztal)
  count: number; // ennyi asztal/gép van ebből, egy idősávban legfeljebb ennyi foglalás lehet
}

// Honnan jött a foglalás: weboldal, telefon, Messenger vagy helyben a pultnál
export type BookingSource = 'web' | 'tel' | 'msg' | 'hely';

export interface Booking {
  id: string;
  groupId?: string; // az egyszerre leadott tételek közös azonosítója
  type: TableType;
  typeName: string;
  date: string; // YYYY-MM-DD
  timeSlots: string[]; // e.g., ["14:00 - 15:00", "15:00 - 16:00"]
  timeSlot: string; // e.g., "14:00 - 16:00 (2 óra)"
  durationHours: number;
  quantity?: number; // hány asztalt/gépet foglal ebből egyszerre (régi foglalásoknál hiányzik = 1)
  totalPrice: number; // total price in HUF
  partySize: number; // hány fő érkezik
  note?: string; // megjegyzés, kérés
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  cancelToken?: string; // csak a foglaló böngészőjében van meg, ezzel mondható le
  confirmedAt?: string; // mikor küldte el a klub a visszaigazolást (admin felületről)
  // A pultos tablet mezői:
  source?: BookingSource; // hiányzik = weboldal
  tables?: string[]; // kiosztott konkrét asztalok/gépek, pl. ["pool-3"]
  start?: number; // pultnál felvett foglalás kezdete percben éjféltől (félórás pontosság)
  end?: number; // ...és vége; ha hiányzik, a timeSlots számít
  arrived?: boolean; // a pultnál megérkezettnek jelölve
}

// Nyitvatartás egy napra: nyitás és zárás egész órában, vagy null ha zárva
export type DayHours = { open: number; close: number } | null;

export interface MenuItem {
  id: string;
  name: string;
  category: 'etlap' | 'itallap';
  price: number | string; // in HUF
  description?: string;
  isPopular?: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}
