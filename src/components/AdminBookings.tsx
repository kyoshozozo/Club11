/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CalendarCheck, Mail, Phone, Users, Send, Trash2, RefreshCw, Loader2, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import { DAY_NAMES, dayOfWeek } from '../data';
import type { Booking } from '../types';

interface AdminBookingsProps {
  token: string;
  onSessionExpired: () => void;
}

// Az egyszerre leadott tételek (pl. pool + leülős asztal) egy kártyán jelennek meg
type BookingGroup = { key: string; items: Booking[] };

const todayInBudapest = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Budapest' });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('hu-HU', { timeZone: 'Europe/Budapest', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function AdminBookings({ token, onSessionExpired }: AdminBookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);

  const post = async (url: string, body: object) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, ...body })
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 403) onSessionExpired();
    if (!res.ok) throw new Error(data.error || 'Hiba történt.');
    return data;
  };

  const loadBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await post('/api/admin/bookings', {});
      setBookings(data.bookings);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [token]);

  const groups: BookingGroup[] = [];
  for (const b of bookings) {
    const key = b.groupId || b.id;
    const group = groups.find(g => g.key === key);
    if (group) group.items.push(b);
    else groups.push({ key, items: [b] });
  }
  const today = todayInBudapest();
  const upcoming = groups.filter(g => g.items[0].date >= today);
  const past = groups.filter(g => g.items[0].date < today).reverse();
  const unconfirmedCount = upcoming.filter(g => !g.items[0].confirmedAt).length;

  const confirmGroup = async (group: BookingGroup) => {
    const first = group.items[0];
    const again = first.confirmedAt ? 'újra ' : '';
    if (!confirm(`Elküldjük ${again}a visszaigazoló e-mailt ${first.name} részére (${first.email})?`)) return;
    setBusyKey(group.key);
    setError(null);
    try {
      const data = await post('/api/admin/bookings/confirm', { key: group.key });
      setBookings(prev => prev.map(b => ((b.groupId || b.id) === group.key ? { ...b, confirmedAt: data.confirmedAt } : b)));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyKey(null);
    }
  };

  const deleteGroup = async (group: BookingGroup) => {
    const first = group.items[0];
    if (!confirm(`Biztosan törlöd ${first.name} foglalását (${first.date})? A vendég erről nem kap e-mailt, és az időpont újra foglalhatóvá válik.`)) return;
    setBusyKey(group.key);
    setError(null);
    try {
      await post('/api/admin/bookings/delete', { key: group.key });
      setBookings(prev => prev.filter(b => (b.groupId || b.id) !== group.key));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyKey(null);
    }
  };

  const renderGroup = (group: BookingGroup) => {
    const first = group.items[0];
    const isBusy = busyKey === group.key;
    return (
      <div
        key={group.key}
        className={`p-4 rounded-xl bg-slate-950 border ${first.confirmedAt ? 'border-slate-800' : 'border-amber-500/40'} space-y-3`}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-black text-white">
              {first.date} <span className="text-slate-400 font-medium">({DAY_NAMES[dayOfWeek(first.date)].toLowerCase()})</span>
            </p>
            <ul className="text-xs text-emerald-300 mt-1 space-y-0.5">
              {group.items.map(b => (
                <li key={b.id}>• {b.typeName}: {b.timeSlot}</li>
              ))}
            </ul>
          </div>
          {first.confirmedAt ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Visszaigazolva: {formatDateTime(first.confirmedAt)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-[11px] font-bold">
              <AlertCircle className="w-3.5 h-3.5" /> Még nincs visszaigazolva
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-300">
          <p className="font-bold text-white flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-500" /> {first.name} – {first.partySize} fő
          </p>
          <a href={`tel:${first.phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 hover:text-emerald-400 font-mono">
            <Phone className="w-3.5 h-3.5 text-slate-500" /> {first.phone}
          </a>
          <a href={`mailto:${first.email}`} className="flex items-center gap-1.5 hover:text-emerald-400 break-all">
            <Mail className="w-3.5 h-3.5 text-slate-500" /> {first.email}
          </a>
          <p className="text-slate-500">Leadva: {formatDateTime(first.createdAt)}</p>
        </div>

        {first.note && (
          <p className="text-xs text-slate-300 flex items-start gap-1.5 p-2 rounded-lg bg-slate-900">
            <MessageSquare className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" /> {first.note}
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => confirmGroup(group)}
            disabled={isBusy}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${
              first.confirmedAt
                ? 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
            }`}
          >
            {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {first.confirmedAt ? 'Visszaigazolás újraküldése' : 'Visszaigazolás küldése e-mailben'}
          </button>
          <button
            onClick={() => deleteGroup(group)}
            disabled={isBusy}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-rose-500/30 text-xs font-bold text-slate-400 hover:text-rose-400 transition-all disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Törlés
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4 text-left" id="admin-bookings">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Foglalások</h3>
            <p className="text-xs text-slate-400">
              {upcoming.length} közelgő foglalás
              {unconfirmedCount > 0 && <span className="text-amber-400 font-bold">, ebből {unconfirmedCount} még nincs visszaigazolva</span>}
            </p>
          </div>
        </div>
        <button
          onClick={loadBookings}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Frissítés
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center">{error}</div>
      )}

      {isLoading && bookings.length === 0 ? (
        <div className="py-8 text-center">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
        </div>
      ) : (
        <>
          {upcoming.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">Nincs közelgő foglalás.</p>
          ) : (
            <div className="space-y-3">{upcoming.map(renderGroup)}</div>
          )}

          {past.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => setShowPast(!showPast)}
                className="text-xs font-mono font-bold text-slate-500 hover:text-slate-300"
              >
                {showPast ? '▾' : '▸'} Korábbi foglalások ({past.length})
              </button>
              {showPast && <div className="space-y-3 mt-3 opacity-70">{past.map(renderGroup)}</div>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
