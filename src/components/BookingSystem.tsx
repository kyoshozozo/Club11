/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  TABLE_CATEGORIES,
  getTableCategory,
  budapestNow,
  dayOfWeek,
  DAY_NAMES,
  formatSlotsSummary,
  isSlotInPast,
} from '../data';
import { Booking, TableType } from '../types';
import { Calendar, Clock, CheckCircle2, AlertCircle, Trash2, Gamepad2, Loader2 } from 'lucide-react';

const MY_BOOKINGS_KEY = 'club11_my_bookings';

interface Availability {
  closed: boolean;
  slots: string[];
  availability: Record<string, Record<string, number>>;
}

function loadMyBookings(): Booking[] {
  try {
    const saved = localStorage.getItem(MY_BOOKINGS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveMyBookings(bookings: Booking[]) {
  try {
    localStorage.setItem(MY_BOOKINGS_KEY, JSON.stringify(bookings));
  } catch {
    // ha a böngésző nem engedi a mentést, a foglalás a szerveren ettől még megvan
  }
}

export default function BookingSystem() {
  const today = budapestNow().date;

  const [selectedType, setSelectedType] = useState<TableType>('pool');
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  // User info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [availability, setAvailability] = useState<Availability | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal and submission states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalData, setModalData] = useState<Booking | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const category = getTableCategory(selectedType);

  // Saját (ebben a böngészőben leadott) foglalások, a már elmúlt napok nélkül
  useEffect(() => {
    try {
      localStorage.removeItem('club11_bookings'); // régi, csak böngészőben tárolt foglalások
    } catch {}
    const upcoming = loadMyBookings().filter(b => b.date >= today);
    setMyBookings(upcoming);
    saveMyBookings(upcoming);
  }, []);

  const fetchAvailability = useCallback(async (date: string) => {
    setIsLoadingSlots(true);
    try {
      const res = await fetch(`/api/bookings/availability?date=${encodeURIComponent(date)}`);
      if (!res.ok) throw new Error();
      setAvailability(await res.json());
    } catch {
      setAvailability(null);
      setErrorMsg('Nem sikerült betölteni a szabad időpontokat. Kérlek próbáld újra, vagy hívj minket telefonon!');
    } finally {
      setIsLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDate) fetchAvailability(selectedDate);
  }, [selectedDate, fetchAvailability]);

  const remainingFor = (slot: string) => availability?.availability[selectedType]?.[slot] ?? 0;

  const handleSlotClick = (slot: string) => {
    setSelectedSlots((prev) => {
      if (prev.includes(slot)) return prev.filter((s) => s !== slot);
      const order = availability?.slots ?? [];
      return [...prev, slot].sort((a, b) => order.indexOf(a) - order.indexOf(b));
    });
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedDate || availability?.closed) {
      setErrorMsg('Kérlek válassz egy olyan napot, amikor nyitva vagyunk!');
      return;
    }
    if (selectedSlots.length === 0) {
      setErrorMsg('Kérlek válassz ki legalább egy idősávot!');
      return;
    }
    if (selectedSlots.some(slot => isSlotInPast(selectedDate, slot))) {
      setErrorMsg('A kiválasztott idősávok közül legalább egy már elkezdődött. Kérlek válassz újra!');
      setSelectedSlots([]);
      fetchAvailability(selectedDate);
      return;
    }
    if (!name.trim()) {
      setErrorMsg('Kérlek add meg a nevedet!');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Kérlek adj meg egy érvényes e-mail címet!');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Kérlek add meg a telefonszámodat!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedType, date: selectedDate, timeSlots: selectedSlots, name, email, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Nem sikerült elküldeni a foglalást. Kérlek próbáld újra!');
        setSelectedSlots([]);
        fetchAvailability(selectedDate);
        return;
      }

      const booking = data as Booking;
      const updated = [booking, ...myBookings];
      setMyBookings(updated);
      saveMyBookings(updated);

      setModalData(booking);
      setShowModal(true);
      setSelectedSlots([]);
      fetchAvailability(selectedDate);
    } catch {
      setErrorMsg('Hálózati hiba történt, a foglalás nem ment el. Kérlek próbáld újra, vagy hívj minket telefonon!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelBooking = async (booking: Booking) => {
    if (!confirm('Biztosan lemondod ezt a foglalást?')) return;
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(booking.id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelToken: booking.cancelToken }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Nem sikerült lemondani a foglalást. Kérlek hívj minket telefonon!');
        return;
      }
      const updated = myBookings.filter(b => b.id !== booking.id);
      setMyBookings(updated);
      saveMyBookings(updated);
      if (booking.date === selectedDate) fetchAvailability(selectedDate);
    } catch {
      alert('Hálózati hiba a lemondás során. Kérlek próbáld újra, vagy hívj minket telefonon!');
    }
  };

  const selectedDayName = selectedDate ? DAY_NAMES[dayOfWeek(selectedDate)] : '';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 max-w-7xl mx-auto my-12 shadow-2xl" id="booking-section">
      <div className="text-center space-y-4 mb-10">
        <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold block">Online Asztalfoglalás</span>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Foglalj helyet nálunk!</h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm">
          Válaszd ki, mivel szeretnél játszani, és mikor. A konkrét asztalt érkezéskor a személyzet jelöli ki.
          A foglalás akkor érvényes, ha visszaigazolást kapsz róla.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* Left column: Game type selection */}
        <div className="lg:col-span-5 space-y-3">
          <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block">1. Mivel szeretnél játszani?</label>
          <div className="grid grid-cols-1 gap-4">
            {TABLE_CATEGORIES.map((cat) => {
              const isSelected = selectedType === cat.type;
              return (
                <button
                  key={cat.type}
                  type="button"
                  id={`type-card-${cat.type}`}
                  onClick={() => {
                    setSelectedType(cat.type);
                    setSelectedSlots([]);
                  }}
                  className={`p-4 rounded-2xl border transition-all text-left ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500 shadow-md shadow-emerald-500/5'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-sm text-white">{cat.name}</h4>
                    <span className="text-xs font-mono font-black text-white bg-slate-900 px-2.5 py-1 rounded-lg shrink-0">
                      {cat.hourlyRate.toLocaleString('hu-HU')} Ft / óra
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed pt-1">{cat.description}</p>
                  <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 mt-2">
                    <span className="text-[10px] font-mono text-slate-500">{cat.count} db a szalonban</span>
                    {isSelected ? (
                      <span className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Kijelölve
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-slate-500">Kijelölés</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right column: Date, Time & Details Form */}
        <div className="lg:col-span-7 bg-slate-950/80 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between shadow-inner">
          <form onSubmit={handleBookingSubmit} className="space-y-5">
            <h3 className="font-sans font-black text-lg text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-emerald-400" />
              Foglalási adatok – {category.name}
            </h3>

            {/* Date input */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                2. Foglalás dátuma {selectedDayName && <span className="text-slate-500 normal-case">({selectedDayName})</span>}
              </label>
              <input
                type="date"
                id="booking-date-input"
                value={selectedDate}
                min={today}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedDate(value && value < today ? today : value);
                  setSelectedSlots([]);
                  setErrorMsg('');
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono [color-scheme:dark]"
              />
            </div>

            {/* Slots selector */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  3. Idősávok
                </label>
                {selectedSlots.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedSlots([])}
                    className="text-[11px] font-mono text-slate-400 hover:text-rose-400 underline transition-colors"
                  >
                    Törlés ({selectedSlots.length})
                  </button>
                )}
              </div>

              {isLoadingSlots && !availability ? (
                <div className="text-center py-6 text-xs text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Szabad időpontok betöltése...
                </div>
              ) : !selectedDate ? (
                <div className="text-center py-4 bg-slate-900 rounded-xl border border-dashed border-slate-800 text-xs text-slate-500">
                  Válassz ki egy napot a szabad idősávok megtekintéséhez!
                </div>
              ) : availability?.closed ? (
                <div className="flex items-start gap-2 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300" id="booking-closed-msg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{selectedDayName} zárva vagyunk, erre a napra nem lehet foglalni. Kérlek válassz másik napot!</span>
                </div>
              ) : availability ? (
                <>
                  <p className="text-[11px] text-slate-400">
                    Kattints az idősávokra a kijelöléshez! Akár <strong className="text-emerald-400 font-bold">több idősávot</strong> is lefoglalhatsz egyszerre.
                  </p>

                  {selectedSlots.length > 0 && (
                    <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl flex items-center justify-between text-xs font-mono">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider">Kijelölt Időtartam</span>
                        <span className="text-white font-bold">{formatSlotsSummary(selectedSlots)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider">Várható Díj</span>
                        <span className="text-emerald-300 font-black text-sm">
                          {(selectedSlots.length * category.hourlyRate).toLocaleString('hu-HU')} Ft
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availability.slots.map((slot) => {
                      const isPast = isSlotInPast(selectedDate, slot);
                      const remaining = remainingFor(slot);
                      const isFull = !isPast && remaining <= 0;
                      const isDisabled = isPast || isFull;
                      const isSelected = selectedSlots.includes(slot);
                      const safeSlotId = slot.replace(/[^a-zA-Z0-9]/g, '-');

                      return (
                        <button
                          key={slot}
                          type="button"
                          id={`slot-button-${safeSlotId}`}
                          disabled={isDisabled}
                          onClick={() => handleSlotClick(slot)}
                          className={`py-2 px-2.5 rounded-xl text-[11px] font-semibold font-mono transition-all flex flex-col items-start gap-0.5 border ${
                            isDisabled
                              ? 'bg-slate-900 border-slate-850 text-slate-600 cursor-not-allowed'
                              : isSelected
                              ? 'bg-emerald-500 border-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <span className={isDisabled ? 'line-through' : ''}>{slot}</span>
                          <span className={`text-[9px] font-normal ${isSelected ? 'text-slate-950/70' : isDisabled ? 'text-slate-600' : 'text-emerald-400/80'}`}>
                            {isPast ? 'Elmúlt' : isFull ? 'Betelt' : isSelected ? '✓ Kijelölve' : `${remaining} szabad`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </div>

            {/* Personal Details form fields */}
            <div className="space-y-3.5 pt-2 border-t border-slate-800/60">
              <input
                type="text"
                placeholder="Teljes neved"
                id="booking-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="email"
                  placeholder="E-mail címed"
                  id="booking-email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="tel"
                  placeholder="Telefonszámod"
                  id="booking-phone"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400" id="booking-error-msg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                id="booking-submit-btn"
                disabled={selectedSlots.length === 0 || isSubmitting}
                className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all uppercase flex items-center justify-center gap-2 ${
                  selectedSlots.length === 0 || isSubmitting
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-[0.99]'
                }`}
              >
                {isSubmitting
                  ? 'Foglalás küldése...'
                  : selectedSlots.length === 0
                  ? 'Kérlek válassz idősávot a foglaláshoz'
                  : 'Foglalási igény elküldése'}
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Booking list: "Foglalásaim" */}
      {myBookings.length > 0 && (
        <div className="mt-12 pt-8 border-t border-slate-800/80" id="user-bookings-dashboard">
          <h3 className="font-sans font-black text-lg text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Foglalásaim ({myBookings.length} db)
          </h3>
          <p className="text-slate-500 text-xs mb-4">
            Az ebből a böngészőből leadott foglalásaid. Kérjük, érkezz meg a játék kezdete előtt legalább 10 perccel! Lemondáshoz kattints a kuka ikonra.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myBookings.map((booking) => (
              <div
                key={booking.id}
                id={`user-booking-item-${booking.id}`}
                className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl flex items-center justify-between"
              >
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-mono">{booking.date} ({DAY_NAMES[dayOfWeek(booking.date)]})</span>
                  <h4 className="font-bold text-sm text-white pt-1">{booking.typeName}</h4>
                  <p className="text-xs font-mono text-slate-400">
                    Időpont: <strong className="text-white">{booking.timeSlot}</strong>
                  </p>
                  <p className="text-xs font-mono text-emerald-400 font-bold">
                    Összeg: {booking.totalPrice.toLocaleString('hu-HU')} Ft
                  </p>
                  <p className="text-[11px] text-slate-500 font-sans">
                    Név: {booking.name} | Tel: {booking.phone}
                  </p>
                </div>

                <button
                  onClick={() => handleCancelBooking(booking)}
                  id={`cancel-booking-${booking.id}`}
                  title="Foglalás lemondása"
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-850 hover:border-rose-500/20 transition-all ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showModal && modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div
            id="booking-confirmation-modal"
            className="bg-slate-900 border-2 border-emerald-500/80 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative text-left space-y-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">Foglalási igény elküldve!</h3>
            </div>

            <div className="bg-amber-500/15 border-2 border-amber-500/70 p-4 rounded-2xl text-center space-y-1 shadow-lg">
              <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold flex items-center justify-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                FONTOS INFORMÁCIÓ
              </span>
              <p className="text-base sm:text-lg font-black text-amber-200 tracking-tight leading-snug">
                Akkor érvényes a foglalása, ha visszaigazolást kap róla!
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs font-mono">
              {[
                ['Játék:', modalData.typeName],
                ['Dátum:', `${modalData.date} (${DAY_NAMES[dayOfWeek(modalData.date)]})`],
                ['Idősáv(ok):', modalData.timeSlot],
                ['Foglaló neve:', modalData.name],
                ['Telefonszám:', modalData.phone],
                ['E-mail:', modalData.email],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-1 border-b border-slate-850">
                  <span className="text-slate-400">{label}</span>
                  <span className="font-bold text-white text-right break-all">{value}</span>
                </div>
              ))}
              <div className="flex justify-between py-1 pt-1">
                <span className="text-slate-400">Várható fizetendő:</span>
                <span className="font-black text-emerald-400 text-sm text-right">
                  {modalData.totalPrice.toLocaleString('hu-HU')} Ft
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center font-sans">
              Köszönjük! A Club 11 csapata hamarosan feldolgozza a foglalásodat, és e-mailben vagy telefonon visszajelez. Az asztalt érkezéskor jelöljük ki.
            </p>

            <button
              type="button"
              id="close-booking-modal-btn"
              onClick={() => setShowModal(false)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm tracking-wide transition-all shadow-lg"
            >
              Rendben, megértettem
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
