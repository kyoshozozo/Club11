/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TABLES, TIME_SLOTS } from '../data';
import { Booking, Table, TableType } from '../types';
import { Calendar, Clock, CheckCircle2, AlertCircle, Trash2, HelpCircle, Gamepad2 } from 'lucide-react';

export default function BookingSystem() {
  const [selectedType, setSelectedType] = useState<TableType | 'all'>('all');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  
  // User info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal and submission states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalData, setModalData] = useState<Booking | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Set default date to today
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
    
    // Load bookings from localStorage
    const savedBookings = localStorage.getItem('club11_bookings');
    if (savedBookings) {
      try {
        setBookings(JSON.parse(savedBookings));
      } catch (e) {
        console.error('Error parsing saved bookings:', e);
      }
    }
  }, []);

  // Filter tables by type
  const filteredTables = selectedType === 'all' 
    ? TABLES 
    : TABLES.filter(t => t.type === selectedType);

  // Auto-select table when type changes or first load
  useEffect(() => {
    if (filteredTables.length > 0) {
      // Check if current selectedTable is in the filtered list
      const isStillAvailable = filteredTables.some(t => t.id === selectedTable?.id);
      if (!isStillAvailable) {
        setSelectedTable(filteredTables[0]);
        setSelectedSlots([]); // Reset slots on table change
      }
    } else {
      setSelectedTable(null);
    }
  }, [selectedType, filteredTables]);

  // Format slots array into clean readable range e.g. "14:00 - 17:00 (3 óra)"
  const formatSlotsSummary = (slots: string[]): string => {
    if (slots.length === 0) return '';
    const sorted = [...slots].sort((a, b) => TIME_SLOTS.indexOf(a) - TIME_SLOTS.indexOf(b));
    
    const blocks: string[] = [];
    let currentStart = '';
    let currentEnd = '';

    sorted.forEach((slot) => {
      const [start, end] = slot.split(' - ');
      if (!currentStart) {
        currentStart = start;
        currentEnd = end;
      } else if (currentEnd === start) {
        currentEnd = end;
      } else {
        blocks.push(`${currentStart} - ${currentEnd}`);
        currentStart = start;
        currentEnd = end;
      }
    });
    if (currentStart) {
      blocks.push(`${currentStart} - ${currentEnd}`);
    }

    return `${blocks.join(', ')} (${slots.length} óra)`;
  };

  const handleSlotClick = (slot: string) => {
    setSelectedSlots((prev) => {
      if (prev.includes(slot)) {
        return prev.filter((s) => s !== slot);
      } else {
        const next = [...prev, slot];
        return next.sort((a, b) => TIME_SLOTS.indexOf(a) - TIME_SLOTS.indexOf(b));
      }
    });
  };

  const clearSlots = () => {
    setSelectedSlots([]);
  };

  // Check if a specific slot is already booked for the selected table on the selected date
  const isSlotBooked = (tableId: string, date: string, slot: string) => {
    return bookings.some(b => {
      if (b.tableId !== tableId || b.date !== date || b.status !== 'confirmed') return false;
      if (b.timeSlots && Array.isArray(b.timeSlots)) {
        return b.timeSlots.includes(slot);
      }
      return b.timeSlot ? b.timeSlot.includes(slot) : false;
    });
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedTable) {
      setErrorMsg('Kérlek válassz ki egy asztalt vagy pályát!');
      return;
    }
    if (!selectedDate) {
      setErrorMsg('Kérlek válassz ki egy dátumot!');
      return;
    }
    if (selectedSlots.length === 0) {
      setErrorMsg('Kérlek válassz ki legalább egy idősávot!');
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

    // Double check availability for all selected slots
    const hasBookedSlot = selectedSlots.some(slot => isSlotBooked(selectedTable.id, selectedDate, slot));
    if (hasBookedSlot) {
      setErrorMsg('Sajnáljuk, a kiválasztott idősávok közül legalább egyet már lefoglaltak. Kérlek válassz másikat!');
      return;
    }

    setIsSubmitting(true);

    const slotsSummary = formatSlotsSummary(selectedSlots);
    const totalHours = selectedSlots.length;
    const totalPrice = totalHours * selectedTable.hourlyRate;

    // Create booking
    const newBooking: Booking = {
      id: `book-${Date.now()}`,
      tableId: selectedTable.id,
      tableName: selectedTable.name,
      date: selectedDate,
      timeSlot: slotsSummary,
      timeSlots: [...selectedSlots],
      durationHours: totalHours,
      totalPrice: totalPrice,
      name,
      email,
      phone,
      status: 'confirmed'
    };

    // Send email notification to club11buda@gmail.com
    try {
      await fetch('/api/send-booking-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'club11buda@gmail.com',
          name,
          email,
          phone,
          tableName: selectedTable.name,
          date: selectedDate,
          timeSlot: slotsSummary,
          timeSlots: selectedSlots,
          durationHours: totalHours,
          totalPrice: totalPrice,
        }),
      });
    } catch (err) {
      console.warn('Szerver e-mail küldési kísérlet:', err);
    }

    const updatedBookings = [newBooking, ...bookings];
    setBookings(updatedBookings);
    localStorage.setItem('club11_bookings', JSON.stringify(updatedBookings));

    setSuccessMsg(`A foglalási igény elküldve! Részletek a megjelenő ablakban.`);
    
    // Set modal data and display confirmation dialog
    setModalData(newBooking);
    setShowModal(true);

    // Reset selected slots & submission state so user must re-select slots for any subsequent booking
    setSelectedSlots([]);
    setIsSubmitting(false);
  };

  const handleCancelBooking = (id: string) => {
    const updatedBookings = bookings.map(b => 
      b.id === id ? { ...b, status: 'cancelled' as const } : b
    );
    // Remove cancelled bookings or just filter them to keep the list clean? 
    // Let's filter to remove completely to keep user dashboard clean
    const filtered = bookings.filter(b => b.id !== id);
    setBookings(filtered);
    localStorage.setItem('club11_bookings', JSON.stringify(filtered));
  };

  // Humanize table types for badge
  const typeLabels: Record<TableType, string> = {
    pool: 'Pool Biliárd',
    rex: 'Magyar Rex',
    darts: 'Darts Pálya',
    foosball: 'Csocsó Asztal',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 max-w-7xl mx-auto my-12 shadow-2xl" id="booking-section">
      <div className="text-center space-y-4 mb-10">
        <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold block">Interaktív Asztalfoglaló</span>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Válaszd ki a saját asztalodat!</h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm">
          Foglald le kedvenc pool biliárd asztalodat, darts pályáinkat vagy csocsó asztalainkat online. A foglalás azonnal érvénybe lép!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left column: Filters & Table Selection */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Game Type Buttons */}
          <div className="space-y-3">
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">1. Játéktípus kiválasztása</label>
            <div className="flex flex-wrap gap-2">
              {(['all', 'pool', 'darts', 'foosball'] as const).map((type) => (
                <button
                  key={type}
                  id={`type-filter-${type}`}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    selectedType === type
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  {type === 'all' ? 'Összes játéktér' : typeLabels[type as TableType]}
                </button>
              ))}
            </div>
          </div>

          {/* Table list with custom selection cards */}
          <div className="space-y-3">
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block">
              2. Asztal vagy Pálya kiválasztása ({filteredTables.length} db elérhető)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredTables.map((table) => {
                const isSelected = selectedTable?.id === table.id;
                return (
                  <div
                    key={table.id}
                    id={`table-card-${table.id}`}
                    onClick={() => {
                      setSelectedTable(table);
                      setSelectedSlots([]); // Reset slots when choosing a new table
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-44 ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 shadow-md shadow-emerald-500/5'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 text-emerald-400 border border-slate-800 font-bold uppercase">
                          {typeLabels[table.type]}
                        </span>
                        <span className="text-xs font-mono font-black text-white bg-slate-900 px-2.5 py-1 rounded-lg">
                          {table.hourlyRate.toLocaleString('hu-HU')} Ft / óra
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-white pt-1">{table.name}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-sans">
                        {table.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 mt-2">
                      <span className="text-[10px] font-mono text-slate-500">
                        Személyek száma: {table.spots === 1 ? 'Korlátlan' : `Max. ${table.spots} fő`}
                      </span>
                      {isSelected ? (
                        <span className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Kijelölve
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-slate-500 group-hover:text-slate-300">
                          Kijelölés
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right column: Date, Time & Details Form */}
        <div className="lg:col-span-5 bg-slate-950/80 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between shadow-inner">
          <form onSubmit={handleBookingSubmit} className="space-y-5">
            <h3 className="font-sans font-black text-lg text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-emerald-400" />
              Foglalási adatok
            </h3>

            {/* Selected table summary */}
            {selectedTable && (
              <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase block">Kiválasztott asztal</span>
                <span className="text-sm font-bold text-white block">{selectedTable.name}</span>
                <span className="text-xs text-slate-400 block font-mono">
                  Óradíj: {selectedTable.hourlyRate} Ft / óra
                </span>
              </div>
            )}

            {/* Date input */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Foglalás dátuma
              </label>
              <input
                type="date"
                id="booking-date-input"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]} // Block past dates
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlots([]); // Reset slots on date change
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>

            {/* Slots selector */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Szabad Idősávok
                </label>
                {selectedSlots.length > 0 && (
                  <button
                    type="button"
                    onClick={clearSlots}
                    className="text-[11px] font-mono text-slate-400 hover:text-rose-400 underline transition-colors"
                  >
                    Törlés ({selectedSlots.length})
                  </button>
                )}
              </div>
              
              <p className="text-[11px] text-slate-400">
                Kattints az idősávokra a kijelöléshez! Akár <strong className="text-emerald-400 font-bold">több egymást követő vagy különálló idősávot</strong> is lefoglalhatsz egyszerre.
              </p>

              {/* Selection Summary Box */}
              {selectedTable && selectedSlots.length > 0 && (
                <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl flex items-center justify-between text-xs font-mono animate-fadeIn">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider">Kijelölt Időtartam</span>
                    <span className="text-white font-bold">{formatSlotsSummary(selectedSlots)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider">Várható Díj</span>
                    <span className="text-emerald-300 font-black text-sm">
                      {(selectedSlots.length * selectedTable.hourlyRate).toLocaleString('hu-HU')} Ft
                    </span>
                  </div>
                </div>
              )}
              
              {selectedTable ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                  {TIME_SLOTS.map((slot) => {
                    const isBooked = isSlotBooked(selectedTable.id, selectedDate, slot);
                    const isSelected = selectedSlots.includes(slot);
                    const safeSlotId = slot.replace(/[^a-zA-Z0-9]/g, '-');
                    
                    return (
                      <button
                        key={slot}
                        type="button"
                        id={`slot-button-${safeSlotId}`}
                        disabled={isBooked}
                        onClick={() => handleSlotClick(slot)}
                        className={`py-2 px-2.5 rounded-xl text-[11px] font-semibold font-mono transition-all flex items-center justify-between gap-1 border ${
                          isBooked
                            ? 'bg-slate-900 border-slate-850 text-slate-600 line-through cursor-not-allowed'
                            : isSelected
                            ? 'bg-emerald-500 border-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span>{slot}</span>
                        {isSelected && <span className="text-[10px] font-black bg-slate-950/20 px-1 rounded">✓</span>}
                        {isBooked && <span className="text-[9px] text-slate-600 font-normal">Foglalt</span>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 bg-slate-900 rounded-xl border border-dashed border-slate-800 text-xs text-slate-500">
                  Válassz ki egy asztalt a szabad idősávok megtekintéséhez!
                </div>
              )}
            </div>

            {/* Personal Details form fields */}
            <div className="space-y-3.5 pt-2 border-t border-slate-800/60">
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Teljes neved"
                  id="booking-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              
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

            {/* Error & Success Messages */}
            {errorMsg && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400" id="booking-error-msg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-start gap-2 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400" id="booking-success-msg">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
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
                {isSubmitting ? (
                  'E-mail küldése és mentés...'
                ) : selectedSlots.length === 0 ? (
                  'Kérlek válassz idősávot a foglaláshoz'
                ) : (
                  'Foglalás Megerősítése'
                )}
              </button>

              {selectedSlots.length === 0 && (
                <p className="text-[11px] text-center text-slate-500 mt-2 font-mono">
                  *(A foglalás megerősítéséhez kattints a fenti zöld idősávok közül legalább egyre)*
                </p>
              )}
            </div>
          </form>
        </div>

      </div>

      {/* Booking list dashboard: "Aktív foglalásaim" */}
      {bookings.length > 0 && (
        <div className="mt-12 pt-8 border-t border-slate-800/80" id="user-bookings-dashboard">
          <h3 className="font-sans font-black text-lg text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-pulse" />
            Aktív foglalásaim ({bookings.length} db)
          </h3>
          <p className="text-slate-500 text-xs mb-4">
            A foglalásaid közvetlenül ebben a böngészőben vannak elmentve (Local Storage). Kérjük, érkezz meg a játék kezdete előtt legalább 10 perccel! Lemondáshoz kattints a törlés gombra.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                id={`user-booking-item-${booking.id}`}
                className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                      Megerősítve
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{booking.date}</span>
                  </div>
                  <h4 className="font-bold text-sm text-white pt-1">{booking.tableName}</h4>
                  <p className="text-xs font-mono text-slate-400">
                    Időpont: <strong className="text-white">{booking.timeSlot}</strong>
                  </p>
                  {booking.totalPrice && (
                    <p className="text-xs font-mono text-emerald-400 font-bold">
                      Összeg: {booking.totalPrice.toLocaleString('hu-HU')} Ft
                    </p>
                  )}
                  <p className="text-[11px] text-slate-500 font-sans">
                    Név: {booking.name} | Tel: {booking.phone}
                  </p>
                </div>

                <button
                  onClick={() => handleCancelBooking(booking.id)}
                  id={`cancel-booking-${booking.id}`}
                  title="Foglalás törlése"
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-850 hover:border-rose-500/20 transition-all ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prominent Confirmation Modal */}
      {showModal && modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div 
            id="booking-confirmation-modal"
            className="bg-slate-900 border-2 border-emerald-500/80 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative text-left space-y-6 transform transition-all scale-100"
          >
            {/* Top Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">Foglalási Igény Elküldve!</h3>
                <p className="text-xs font-mono text-emerald-400">E-mail értesítő elküldve: <span className="font-bold">club11buda@gmail.com</span></p>
              </div>
            </div>

            {/* Highly Prominent Notice Banner */}
            <div className="bg-amber-500/15 border-2 border-amber-500/70 p-4 rounded-2xl text-center space-y-1 shadow-lg">
              <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold block flex items-center justify-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                FONTOS INFORMÁCIÓ
              </span>
              <p className="text-base sm:text-lg font-black text-amber-200 tracking-tight leading-snug">
                Akkor érvényes a foglalása ha visszaigazolást kap róla!
              </p>
            </div>

            {/* Summary of reservation */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-850">
                <span className="text-slate-400">Lefoglalt eszköz/pálya:</span>
                <span className="font-bold text-white text-right">{modalData.tableName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-850">
                <span className="text-slate-400">Dátum:</span>
                <span className="font-bold text-emerald-400 text-right">{modalData.date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-850">
                <span className="text-slate-400">Idősáv(ok):</span>
                <span className="font-bold text-white text-right">{modalData.timeSlot}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-850">
                <span className="text-slate-400">Foglaló neve:</span>
                <span className="font-bold text-slate-200 text-right">{modalData.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-850">
                <span className="text-slate-400">Telefonszám:</span>
                <span className="font-bold text-slate-200 text-right">{modalData.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-850">
                <span className="text-slate-400">E-mail:</span>
                <span className="font-bold text-slate-200 text-right">{modalData.email}</span>
              </div>
              <div className="flex justify-between py-1 pt-1">
                <span className="text-slate-400">Várható fizetendő:</span>
                <span className="font-black text-emerald-400 text-sm text-right">
                  {modalData.totalPrice ? modalData.totalPrice.toLocaleString('hu-HU') : 0} Ft
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center font-sans">
              Köszönjük! A Club 11 csapata hamarosan feldolgozza a foglalásodat és e-mailben vagy telefonon visszajelez!
            </p>

            {/* Close Button */}
            <button
              type="button"
              id="close-booking-modal-btn"
              onClick={() => setShowModal(false)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm tracking-wide transition-all shadow-lg hover:scale-[1.01]"
            >
              Rendben, Megértettem
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
