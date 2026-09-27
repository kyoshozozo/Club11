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

export interface Booking {
  id: string;
  groupId?: string; // az egyszerre leadott tételek közös azonosítója
  type: TableType;
  typeName: string;
  date: string; // YYYY-MM-DD
  timeSlots: string[]; // e.g., ["14:00 - 15:00", "15:00 - 16:00"]
  timeSlot: string; // e.g., "14:00 - 16:00 (2 óra)"
  durationHours: number;
  totalPrice: number; // total price in HUF
  partySize: number; // hány fő érkezik
  note?: string; // megjegyzés, kérés
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  cancelToken?: string; // csak a foglaló böngészőjében van meg, ezzel mondható le
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
