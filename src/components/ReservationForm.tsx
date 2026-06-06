/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Calendar, Clock, Users, MessageSquare, User, Mail, Phone, CheckCircle, AlertTriangle, ArrowRight, Table } from 'lucide-react';
import { Reservation, AppConfig } from '../types';

interface ReservationFormProps {
  config: AppConfig;
  onAddReservation: (reservation: Reservation) => void;
}

export default function ReservationForm({ config, onAddReservation }: ReservationFormProps) {
  // Form input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('18:00');
  const [guests, setGuests] = useState(2);
  const [specialRequest, setSpecialRequest] = useState('');

  // UI state managers
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successReservation, setSuccessReservation] = useState<Reservation | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // Static options for polished booking UX
  const availableSlots = [
    '12:00', '12:30', '13:00', '13:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
  ];

  // Get current date string (YYYY-MM-DD) to prevent past bookings
  const getTodayDateString = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    const todayStr = getTodayDateString();

    if (name.trim().length < 2) {
      errors.name = 'Please enter your full name (minimum 2 characters).';
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      errors.email = 'Please provide a valid email address.';
    }

    const phonePattern = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    if (!phonePattern.test(phone.replace(/\s/g, ''))) {
      errors.phone = 'Please provide a valid contact number.';
    }

    if (!date) {
      errors.date = 'Please pick a preferred booking date.';
    } else if (date < todayStr) {
      errors.date = 'Reservations cannot be back-dated. Please pick today or a future date.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    const payload = {
      customerName: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      reservationDate: date,
      reservationTime: time,
      guests: guests,
      specialRequest: specialRequest.trim(),
    };

    try {
      if (config.isSyncEnabled && config.googleSheetsUrl) {
        // Post directly to Google Apps Script
        const response = await fetch(config.googleSheetsUrl, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify({
            action: 'create',
            ...payload
          }),
        });

        const result = await response.json();

        if (result && result.status === 'success') {
          const finalReservation: Reservation = {
            id: result.data.id || `RES-${Math.floor(100000 + Math.random() * 900000)}`,
            customerName: result.data.customerName || payload.customerName,
            email: result.data.email || payload.email,
            phone: result.data.phone || payload.phone,
            reservationDate: result.data.reservationDate || payload.reservationDate,
            reservationTime: result.data.reservationTime || payload.reservationTime,
            guests: Number(result.data.guests) || payload.guests,
            specialRequest: result.data.specialRequest || payload.specialRequest,
            status: 'Pending',
            createdAt: result.data.createdAt || new Date().toISOString()
          };

          onAddReservation(finalReservation);
          setSuccessReservation(finalReservation);
          resetForm();
        } else {
          throw new Error(result.message || 'The Sheets API returned an operational error.');
        }
      } else {
        // Fallback: Local database mode
        setTimeout(() => {
          const mockReservation: Reservation = {
            id: `RES-${Math.floor(100000 + Math.random() * 900000)}`,
            customerName: payload.customerName,
            email: payload.email,
            phone: payload.phone,
            reservationDate: payload.reservationDate,
            reservationTime: payload.reservationTime,
            guests: payload.guests,
            specialRequest: payload.specialRequest,
            status: 'Pending',
            createdAt: new Date().toISOString()
          };
          onAddReservation(mockReservation);
          setSuccessReservation(mockReservation);
          resetForm();
          setIsSubmitting(false);
        }, 1200);
        return;
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      setErrorText(`Connection Failed: ${err.message || "Unable to reach Google Sheets Web App API. Check your connection or disable Google Sheets sync in Settings to run in offline dev mode."}`);
    } finally {
      if (config.isSyncEnabled) {
        setIsSubmitting(false);
      }
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setDate('');
    setTime('18:00');
    setGuests(2);
    setSpecialRequest('');
    setValidationErrors({});
  };

  const handleBookAnother = () => {
    setSuccessReservation(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {successReservation ? (
        /* SUCCESS SCREEN CARD OVERLAY */
        <div className="glassmorphism border-[#c5a059]/20 rounded-sm p-8 text-center space-y-6 relative overflow-hidden backdrop-blur-md transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#c5a059]/5 rounded-full blur-xl pointer-events-none"></div>
          
          <div className="w-16 h-16 bg-[#c5a059]/10 border border-[#c5a059]/20 text-[#c5a059] rounded-full flex items-center justify-center mx-auto shadow-inner pulse-gold">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="font-serif text-2xl text-white tracking-tight">Reservation Request Received</h3>
            <p className="text-sm text-white/60 max-w-md mx-auto leading-relaxed font-light">
              We have received your requested booking. It has been initially logged as <span className="text-[#c5a059] font-semibold">Pending</span>. Review details below:
            </p>
          </div>

          {/* Ticket styling detail box */}
          <div className="bg-[#050505] border border-white/10 rounded-sm p-5 text-left divide-y divide-white/10 max-w-md mx-auto text-sm space-y-3">
            <div className="flex justify-between items-center pb-2 pt-1 font-mono text-xs">
              <span className="text-white/40">BOOKING REFERENCE:</span>
              <span className="text-[#c5a059] font-bold tracking-wider">{successReservation.id}</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className="text-white/40">Customer:</span>
              <span className="text-white font-medium">{successReservation.customerName}</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className="text-white/40">Party Size:</span>
              <span className="text-white font-medium flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-white/40" />
                {successReservation.guests} Guests
              </span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className="text-white/40">Date & Time:</span>
              <span className="text-white font-mono text-xs">
                {successReservation.reservationDate} @ {successReservation.reservationTime}
              </span>
            </div>
          </div>

          <p className="text-xxs text-white/40 leading-relaxed max-w-sm mx-auto">
            Our hosts will cross-reference schedules. You will receive an automated validation email at <code className="text-[#c5a059] font-mono">{successReservation.email}</code> immediately upon confirmation.
          </p>

          <div className="pt-2">
            <button
              onClick={handleBookAnother}
              className="px-6 py-3 bg-[#c5a059] hover:bg-[#b08e4d] text-black text-xs font-bold uppercase tracking-widest rounded-sm transition-all cursor-pointer inline-flex items-center gap-2"
            >
              Book Another Table
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* RESERVATION FORM SCREEN */
        <form onSubmit={handleSubmit} className="glassmorphism-gold rounded-sm p-6 sm:p-8 space-y-6 shadow-xl relative backdrop-blur-md">
          
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="p-2 bg-[#c5a059]/10 border border-[#c5a059]/20 rounded-sm text-[#c5a059]">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg text-white">Arrange Your Table</h3>
              <p className="text-xs text-white/40">All instant requests receive immediate email updates.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Customer Name */}
            <div className="space-y-1.5 col-span-1 md:col-span-2">
              <label htmlFor="customer-name" className="text-xs font-semibold text-white/50 tracking-wide flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#c5a059]" />
                Full Name
              </label>
              <input
                id="customer-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (validationErrors.name) setValidationErrors(prev => ({ ...prev, name: '' }));
                }}
                placeholder="Eleanor Vance"
                className={`w-full bg-[#050505] border ${
                  validationErrors.name ? 'border-red-500/60 focus:ring-red-500 focus:border-red-500' : 'border-white/10 focus:border-[#c5a059] focus:ring-[#c5a059]'
                } rounded-sm px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 transition-all`}
              />
              {validationErrors.name && (
                <p className="text-xxs text-red-400 flex items-center gap-1 mt-1 font-mono">
                  <AlertTriangle className="w-3 h-3" /> {validationErrors.name}
                </p>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label htmlFor="customer-email" className="text-xs font-semibold text-white/50 tracking-wide flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#c5a059]" />
                Email Address
              </label>
              <input
                id="customer-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validationErrors.email) setValidationErrors(prev => ({ ...prev, email: '' }));
                }}
                placeholder="eleanor@example.com"
                className={`w-full bg-[#050505] border ${
                  validationErrors.email ? 'border-red-500/60 focus:ring-red-500' : 'border-white/10 focus:border-[#c5a059] focus:ring-[#c5a059]'
                } rounded-sm px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 transition-all font-mono`}
              />
              {validationErrors.email && (
                <p className="text-xxs text-red-400 flex items-center gap-1 mt-1 font-mono">
                  <AlertTriangle className="w-3 h-3" /> {validationErrors.email}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label htmlFor="customer-phone" className="text-xs font-semibold text-white/50 tracking-wide flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#c5a059]" />
                Phone Number
              </label>
              <input
                id="customer-phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (validationErrors.phone) setValidationErrors(prev => ({ ...prev, phone: '' }));
                }}
                placeholder="(555) 019-2834"
                className={`w-full bg-[#050505] border ${
                  validationErrors.phone ? 'border-red-500/60 focus:ring-red-500 font-mono' : 'border-white/10 focus:border-[#c5a059] focus:ring-[#c5a059]'
                } rounded-sm px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 transition-all font-mono`}
              />
              {validationErrors.phone && (
                <p className="text-xxs text-red-400 flex items-center gap-1 mt-1 font-mono">
                  <AlertTriangle className="w-3 h-3" /> {validationErrors.phone}
                </p>
              )}
            </div>

            {/* Reservation Date */}
            <div className="space-y-1.5">
              <label htmlFor="booking-date" className="text-xs font-semibold text-white/50 tracking-wide flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#c5a059]" />
                Reservation Date
              </label>
              <input
                id="booking-date"
                type="date"
                min={getTodayDateString()}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (validationErrors.date) setValidationErrors(prev => ({ ...prev, date: '' }));
                }}
                className={`w-full bg-[#050505] border ${
                  validationErrors.date ? 'border-red-500/60 focus:ring-red-500' : 'border-white/10 focus:border-[#c5a059] focus:ring-[#c5a059]'
                } rounded-sm px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 transition-all font-mono`}
              />
              {validationErrors.date && (
                <p className="text-xxs text-red-400 flex items-center gap-1 mt-1 font-mono">
                  <AlertTriangle className="w-3 h-3" /> {validationErrors.date}
                </p>
              )}
            </div>

            {/* Reservation Time */}
            <div className="space-y-1.5">
              <label htmlFor="booking-time" className="text-xs font-semibold text-white/50 tracking-wide flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#c5a059]" />
                Reservation Time
              </label>
              <select
                id="booking-time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-[#050505] border border-white/10 focus:border-[#c5a059] focus:ring-[#c5a059] rounded-sm px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 transition-all font-mono"
              >
                {availableSlots.map((slot) => (
                  <option key={slot} value={slot} className="bg-[#0a0a0a] text-white">
                    {slot}
                  </option>
                ))}
              </select>
            </div>

            {/* Number of Guests */}
            <div className="space-y-1.5">
              <label htmlFor="booking-guests" className="text-xs font-semibold text-white/50 tracking-wide flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#c5a059]" />
                Number of Guests
              </label>
              <select
                id="booking-guests"
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full bg-[#050505] border border-white/10 focus:border-[#c5a059] focus:ring-[#c5a059] rounded-sm px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 transition-all"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                  <option key={num} value={num} className="bg-[#0a0a0a] text-white">
                    {num} {num === 1 ? 'Guest' : 'Guests'}
                  </option>
                ))}
              </select>
            </div>

            {/* Special Request */}
            <div className="space-y-1.5 col-span-1 md:col-span-2">
              <label htmlFor="special-requests" className="text-xs font-semibold text-white/50 tracking-wide flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#c5a059]" />
                Special Requests
              </label>
              <textarea
                id="special-requests"
                rows={3}
                value={specialRequest}
                onChange={(e) => setSpecialRequest(e.target.value)}
                placeholder="Allergies, anniversaries, window seating request..."
                className="w-full bg-[#050505] border border-white/10 focus:border-[#c5a059] focus:ring-[#c5a059] rounded-sm px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 transition-all"
              />
            </div>
          </div>

          {errorText && (
            <div className="p-3.5 bg-red-950/25 border border-red-500/25 rounded-sm flex items-start gap-3 text-xs text-red-300 leading-relaxed font-mono">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{errorText}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#c5a059] hover:bg-[#b08e4d] disabled:bg-white/5 disabled:text-white/30 disabled:cursor-not-allowed text-black text-xs font-bold uppercase tracking-widest py-4 px-4 rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  Transmitting Reservation Booking...
                </span>
              ) : (
                'Reserve Dinner Table'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
