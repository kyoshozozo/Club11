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
  MAX_ONLINE_PARTY_SIZE,
  CLUB_EMAIL,
} from '../data';
import { Booking, TableType } from '../types';
import { Calendar, Clock, CheckCircle2, AlertCircle, Trash2, Gamepad2, Loader2, Users, X } from 'lucide-react';

const formatHuf = (amount: number) => `${amount.toLocaleString('hu-HU')} Ft`;

const MY_BOOKINGS_KEY = 'club11_my_bookings';

interface Availability {
  closed: boolean;
  slots: string[];
  availability: Record<string, Record<string, number>>;
}

// Játékonként külön megjegyzett idősávok: így több dolog is foglalható egyszerre
type Selections = Partial<Record<TableType, string[]>>;

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
  const [selections, setSelections] = useState<Selections>({});

  // User info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState('');
  const [note, setNote] = useState('');

  const [availability, setAvailability] = useState<Availability | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal and submission states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalData, setModalData] = useState<Booking[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const category = getTableCategory(selectedType);
  const currentSlots = selections[selectedType] ?? [];
  const people = Number(partySize);
  const tooManyPeople = Number.isInteger(people) && people > MAX_ONLINE_PARTY_SIZE;

  // Az összes kijelölt tétel (játékonként), a bal oldali sorrendben
  const chosenItems = TABLE_CATEGORIES
    .filter(c => (selections[c.type]?.length ?? 0) > 0)
    .map(c => ({ category: c, slots: selections[c.type]! }));
  const totalPrice = chosenItems.reduce((sum, i) => sum + i.slots.length * i.category.hourlyRate, 0);

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

  // Ha a foglaltság frissül, a közben betelt vagy elmúlt idősávok kikerülnek a kijelölésből
  useEffect(() => {
    if (!availability) return;
    setSelections(prev => {
      const next: Selections = {};
      for (const [type, slots] of Object.entries(prev) as [TableType, string[]][]) {
        const kept = slots.filter(slot =>
          !isSlotInPast(selectedDate, slot) && (availability.availability[type]?.[slot] ?? 0) > 0);
        if (kept.length > 0) next[type] = kept;
      }
      return next;
    });
  }, [availability]);

  const remainingFor = (slot: string) => availability?.availability[selectedType]?.[slot] ?? 0;

  const handleSlotClick = (slot: string) => {
    setSelections(prev => {
      const current = prev[selectedType] ?? [];
      const order = availability?.slots ?? [];
      const updated = current.includes(slot)
        ? current.filter(s => s !== slot)
        : [...current, slot].sort((a, b) => order.indexOf(a) - order.indexOf(b));
      return { ...prev, [selectedType]: updated };
    });
  };

  const clearType = (type: TableType) => setSelections(prev => ({ ...prev, [type]: [] }));

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedDate || availability?.closed) {
      setErrorMsg('Kérlek válassz egy olyan napot, amikor nyitva vagyunk!');
      return;
    }
    if (chosenItems.length === 0) {
      setErrorMsg('Kérlek válassz ki legalább egy idősávot!');
      return;
    }
    if (chosenItems.some(i => i.slots.some(slot => isSlotInPast(selectedDate, slot)))) {
      setErrorMsg('A kiválasztott idősávok közül legalább egy már elkezdődött. Kérlek nézd át a kijelölést!');
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
    if (!Number.isInteger(people) || people < 1) {
      setErrorMsg('Kérlek add meg, hány fő érkezik!');
      return;
    }
    if (tooManyPeople) {
      setErrorMsg(`${MAX_ONLINE_PARTY_SIZE} fő felett csak e-mailes foglalást fogadunk el. Kérlek írj nekünk: ${CLUB_EMAIL}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          items: chosenItems.map(i => ({ type: i.category.type, timeSlots: i.slots })),
          name, email, phone, partySize: people, note,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Nem sikerült elküldeni a foglalást. Kérlek próbáld újra!');
        fetchAvailability(selectedDate);
        return;
      }

      const created = data.bookings as Booking[];
      const updated = [...created, ...myBookings];
      setMyBookings(updated);
      saveMyBookings(updated);

      setModalData(created);
      setShowModal(true);
      setSelections({});
      setNote('');
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
  const modalTotal = modalData ? modalData.reduce((sum, b) => sum + b.totalPrice, 0) : 0;
  const first = modalData?.[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 max-w-7xl mx-auto my-12 shadow-2xl" id="booking-section">
      <div className="text-center space-y-4 mb-10">
        <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold block">Online Asztalfoglalás</span>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Foglalj helyet nálunk!</h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm">
          Válaszd ki, mit és mikor szeretnél foglalni – akár több dolgot is egyszerre. A konkrét asztalt érkezéskor a személyzet jelöli ki.
          A foglalás akkor érvényes, ha visszaigazolást kapsz róla.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* Left column: Game type selection */}
        <div className="lg:col-span-5 space-y-3">
          <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block">1. Mit szeretnél foglalni?</label>
          <p className="text-[11px] text-slate-500">
            Több dolgot is foglalhatsz: jelöld ki az idősávokat, majd kattints egy másik kockára – a korábbi kijelölésed megmarad.
          </p>
          <div className="grid grid-cols-1 gap-4">
            {TABLE_CATEGORIES.map((cat) => {
              const isActive = selectedType === cat.type;
              const chosenCount = selections[cat.type]?.length ?? 0;
              return (
                <button
                  key={cat.type}
                  type="button"
                  id={`type-card-${cat.type}`}
                  onClick={() => setSelectedType(cat.type)}
                  className={`p-4 rounded-2xl border transition-all text-left ${
                    isActive
                      ? 'bg-emerald-500/10 border-emerald-500 shadow-md shadow-emerald-500/5'
                      : chosenCount > 0
                      ? 'bg-slate-950/60 border-emerald-500/40 hover:border-emerald-500/70'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-sm text-white">{cat.name}</h4>
                    {cat.hourlyRate > 0 && (
                      <span className="text-xs font-mono font-black text-white bg-slate-900 px-2.5 py-1 rounded-lg shrink-0">
                        {formatHuf(cat.hourlyRate)} / óra
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed pt-1">{cat.description}</p>
                  <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 mt-2">
                    <span className="text-[10px] font-mono text-slate-500">{cat.hourlyRate > 0 ? `${cat.count} db a szalonban` : ''}</span>
                    {chosenCount > 0 ? (
                      <span className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-1" id={`type-card-count-${cat.type}`}>
                        <CheckCircle2 className="w-4 h-4" /> {chosenCount} idősáv kijelölve
                      </span>
                    ) : isActive ? (
                      <span className="text-xs font-bold font-mono text-emerald-400">Most ezt választod</span>
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
              Foglalási adatok
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
                  setSelections({}); // más napra minden kijelölés újrakezdődik
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
                  3. Idősávok – <span className="text-emerald-400 normal-case">{category.name}</span>
                </label>
                {currentSlots.length > 0 && (
                  <button
                    type="button"
                    onClick={() => clearType(selectedType)}
                    className="text-[11px] font-mono text-slate-400 hover:text-rose-400 underline transition-colors"
                  >
                    Törlés ({currentSlots.length})
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
              ) : availability && !availability.availability[selectedType] ? (
                <div className="flex items-start gap-2 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300" id="booking-outdated-msg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>A foglaltsági adatok nem frissek. Kérlek töltsd újra az oldalt!</span>
                </div>
              ) : availability ? (
                <>
                  <p className="text-[11px] text-slate-400">
                    Kattints az idősávokra a kijelöléshez! Akár <strong className="text-emerald-400 font-bold">több idősávot</strong> is kijelölhetsz.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availability.slots.map((slot) => {
                      const isPast = isSlotInPast(selectedDate, slot);
                      const remaining = remainingFor(slot);
                      const isFull = !isPast && remaining <= 0;
                      const isDisabled = isPast || isFull;
                      const isSelected = currentSlots.includes(slot);
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

              {/* Az összes kijelölt tétel összesítése */}
              {chosenItems.length > 0 && (
                <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl text-xs font-mono space-y-2" id="booking-summary">
                  <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider">A foglalásod</span>
                  {chosenItems.map(({ category: c, slots }) => (
                    <div key={c.type} className="flex items-center justify-between gap-2" id={`summary-item-${c.type}`}>
                      <div className="min-w-0">
                        <span className="text-white font-bold">{c.name}</span>
                        <span className="text-slate-300"> · {formatSlotsSummary(slots)}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-emerald-300 font-bold">{c.hourlyRate > 0 ? formatHuf(slots.length * c.hourlyRate) : 'díjmentes'}</span>
                        <button
                          type="button"
                          onClick={() => clearType(c.type)}
                          title={`${c.name} eltávolítása`}
                          aria-label={`${c.name} eltávolítása`}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {totalPrice > 0 && (
                    <div className="flex items-center justify-between border-t border-emerald-500/20 pt-2">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Várható díj összesen</span>
                      <span className="text-emerald-300 font-black text-sm">{formatHuf(totalPrice)}</span>
                    </div>
                  )}
                </div>
              )}
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

              {/* Hány fő érkezik */}
              <div className="space-y-1.5">
                <label htmlFor="booking-party-size" className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  Hány fő érkezik?
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  placeholder="Pl. 4"
                  id="booking-party-size"
                  required
                  value={partySize}
                  onChange={(e) => setPartySize(e.target.value)}
                  className={`w-full sm:w-40 bg-slate-900 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none ${
                    tooManyPeople ? 'border-amber-500 focus:border-amber-500' : 'border-slate-800 focus:border-emerald-500'
                  }`}
                />
                {tooManyPeople && (
                  <p className="text-[11px] text-amber-300" id="booking-party-size-warning">
                    {MAX_ONLINE_PARTY_SIZE} fő felett csak e-mailes foglalást fogadunk el. Kérlek írj nekünk:{' '}
                    <a href={`mailto:${CLUB_EMAIL}`} className="underline font-bold">{CLUB_EMAIL}</a>
                  </p>
                )}
              </div>

              {/* Megjegyzés, kérés */}
              <div className="space-y-1.5">
                <label htmlFor="booking-note" className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block">
                  Megjegyzés, kérés <span className="normal-case font-normal text-slate-500">(nem kötelező)</span>
                </label>
                <textarea
                  id="booking-note"
                  rows={3}
                  maxLength={500}
                  placeholder="Pl. születésnapot tartunk, egymás melletti asztalokat kérünk…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 resize-y"
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
                disabled={chosenItems.length === 0 || isSubmitting}
                className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all uppercase flex items-center justify-center gap-2 ${
                  chosenItems.length === 0 || isSubmitting
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-[0.99]'
                }`}
              >
                {isSubmitting
                  ? 'Foglalás küldése...'
                  : chosenItems.length === 0
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
                  {booking.totalPrice > 0 && (
                    <p className="text-xs font-mono text-emerald-400 font-bold">
                      Összeg: {formatHuf(booking.totalPrice)}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-500 font-sans">
                    Név: {booking.name} | Tel: {booking.phone}{booking.partySize ? ` | ${booking.partySize} fő` : ''}
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
      {showModal && modalData && first && (
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
                ['Dátum:', `${first.date} (${DAY_NAMES[dayOfWeek(first.date)]})`],
                ...modalData.map(b => [`${b.typeName}:`, b.timeSlot]),
                ['Létszám:', `${first.partySize} fő`],
                ['Foglaló neve:', first.name],
                ['Telefonszám:', first.phone],
                ['E-mail:', first.email],
                ...(first.note ? [['Megjegyzés, kérés:', first.note]] : []),
              ].map(([label, value], index) => (
                <div key={`${label}-${index}`} className="flex justify-between gap-4 py-1 border-b border-slate-850">
                  <span className="text-slate-400">{label}</span>
                  <span className="font-bold text-white text-right break-all">{value}</span>
                </div>
              ))}
              <div className="flex justify-between py-1 pt-1">
                <span className="text-slate-400">Várható fizetendő:</span>
                <span className="font-black text-emerald-400 text-sm text-right">
                  {modalTotal > 0 ? formatHuf(modalTotal) : 'Díjmentes – a fogyasztás kötelező'}
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
