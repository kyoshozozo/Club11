/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Booking {
  id: string;
  tableId: string;
  tableName: string;
  date: string;
  timeSlot: string; // e.g., "14:00 - 15:00"
  name: string;
  email: string;
  phone: string;
  status: 'confirmed' | 'cancelled';
}

export type TableType = 'pool' | 'rex' | 'darts' | 'foosball';

export interface Table {
  id: string;
  name: string;
  type: TableType;
  description: string;
  hourlyRate: number; // in HUF
  spots: number; // e.g., 1 for table, 2 for darts
}

export interface MenuItem {
  id: string;
  name: string;
  category: 'coffee' | 'beer' | 'soft' | 'cocktail' | 'snack';
  price: number; // in HUF
  description?: string;
  isPopular?: boolean;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  date: string;
  likes: number;
  image?: string;
  category: 'event' | 'tournament' | 'drink' | 'general';
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}
