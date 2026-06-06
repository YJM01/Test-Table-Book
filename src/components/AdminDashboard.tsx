/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, XCircle, AlertCircle, RefreshCw, Search, Filter, 
  Trash2, Mail, Phone, Calendar, Clock, Sparkles, FileSpreadsheet, LogOut, ChevronRight
} from 'lucide-react';
import { Reservation, ReservationStatus, AppConfig, DashboardStats } from '../types';

interface AdminDashboardProps {
  reservations: Reservation[];
  config: AppConfig;
  onUpdateStatus: (id: string, status: ReservationStatus) => Promise<boolean>;
  onDeleteReservation: (id: string) => Promise<boolean>;
  onForceRefresh: () => Promise<void>;
  onLogout: () => void;
  adminEmail: string;
}

export default function AdminDashboard({
  reservations,
  config,
  onUpdateStatus,
  onDeleteReservation,
  onForceRefresh,
  onLogout,
  adminEmail
}: AdminDashboardProps) {
  
  // Filtering and searching states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'All' | ReservationStatus>('All');
  
  // Sync processes loader
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  
  // Timer for auto-refresh (30 seconds)
  const [countdown, setCountdown] = useState(30);

  // Auto-refresh interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleAutoRefresh();
          return 30; // reset
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAutoRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onForceRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
      setCountdown(30);
    }
  };

  const handleManualRefresh = async () => {
    await handleAutoRefresh();
  };

  const handleStatusChange = async (id: string, newStatus: ReservationStatus) => {
    setActioningId(id);
    try {
      await onUpdateStatus(id, newStatus);
    } catch (e) {
      console.error('Failed to change status:', e);
    } finally {
      setActioningId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(`Are you sure you want to permanently delete reservation ${id}?`)) {
      setActioningId(id);
      try {
        await onDeleteReservation(id);
      } catch (e) {
        console.error('Failed to delete reservation:', e);
      } finally {
        setActioningId(null);
      }
    }
  };

  // 1. Calculate Stats
  const stats: DashboardStats = reservations.reduce(
    (acc, cur) => {
      acc.total += 1;
      if (cur.status === 'Pending') acc.pending += 1;
      else if (cur.status === 'Confirmed') acc.confirmed += 1;
      else if (cur.status === 'Rejected') acc.rejected += 1;
      return acc;
    },
    { total: 0, pending: 0, confirmed: 0, rejected: 0 }
  );

  // 2. Filter & Search records
  const filteredReservations = reservations.filter((res) => {
    // Stat filter match
    const matchesFilter = selectedFilter === 'All' ? true : res.status === selectedFilter;
    
    // Search match
    const searchString = searchTerm.trim().toLowerCase();
    const matchesSearch = searchString === '' ? true : (
      res.id.toLowerCase().includes(searchString) ||
      res.customerName.toLowerCase().includes(searchString) ||
      res.email.toLowerCase().includes(searchString) ||
      res.phone.includes(searchString) ||
      (res.specialRequest && res.specialRequest.toLowerCase().includes(searchString))
    );

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Upper Dashboard Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-[#c5a059]/10 border border-[#c5a059]/20 text-[#c5a059] text-xxs font-mono rounded-sm font-semibold tracking-wider uppercase">
              Operational Console
            </span>
            <div className="flex items-center gap-1.5 text-xs text-white/40 font-mono">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
              Auto-sync: {countdown}s remaining
            </div>
          </div>
          <h2 className="font-serif text-2xl text-white mt-1 flex items-center gap-2">
            TableBook Admin Dashboard
          </h2>
          <p className="text-xs text-white/40 mt-1">
            Running session as <span className="text-[#c5a059] font-mono font-semibold">{adminEmail}</span>. Connected to: <span className="font-mono text-white/60">{config.isSyncEnabled ? 'Google Sheets' : 'Local Sandbox Storage'}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Force sync */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:border-[#c5a059]/40 text-white rounded-sm text-xs font-semibold cursor-pointer transition-all h-10 select-none animate-fade-in"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Sync Now
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:border-red-500/30 text-slate-305 hover:text-red-400 rounded-sm text-xs font-semibold cursor-pointer transition-all h-10 select-none"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
        {/* Total Reservations */}
        <div className="glassmorphism rounded-sm p-5 relative overflow-hidden">
          <div className="absolute top-2 right-2 p-1.5 bg-white/5 border border-white/10 rounded-sm text-[#c5a059]">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xxs font-bold text-white/40 uppercase tracking-widest block font-mono">
            Total Requests
          </span>
          <span className="text-2xl font-serif text-white mt-1.5 block">
            {stats.total}
          </span>
          <p className="text-xxs text-white/35 mt-1 leading-relaxed">
            All submitted entries
          </p>
        </div>

        {/* Pending Card */}
        <div className="glassmorphism rounded-sm p-5 relative overflow-hidden border-[#c5a059]/10">
          <div className="absolute top-2 right-2 p-1.5 bg-[#c5a059]/5 rounded-sm text-[#c5a059]">
            <AlertCircle className="w-4 h-4" />
          </div>
          <span className="text-xxs font-bold text-white/40 uppercase tracking-widest block font-mono">
            Pending Core
          </span>
          <span className="text-2xl font-serif text-[#c5a059] mt-1.5 block">
            {stats.pending}
          </span>
          <p className="text-xxs text-white/35 mt-1 leading-relaxed">
            Awaiting action verification
          </p>
        </div>

        {/* Confirmed Card */}
        <div className="glassmorphism rounded-sm p-5 relative overflow-hidden border-emerald-500/10">
          <div className="absolute top-2 right-2 p-1.5 bg-emerald-500/5 rounded-sm text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-xxs font-bold text-white/40 uppercase tracking-widest block font-mono">
            Confirmed List
          </span>
          <span className="text-2xl font-serif text-emerald-400 mt-1.5 block">
            {stats.confirmed}
          </span>
          <p className="text-xxs text-white/35 mt-1 leading-relaxed">
            Emailed & allocated
          </p>
        </div>

        {/* Rejected Card */}
        <div className="glassmorphism rounded-sm p-5 relative overflow-hidden border-rose-500/10">
          <div className="absolute top-2 right-2 p-1.5 bg-rose-500/5 rounded-sm text-rose-400">
            <XCircle className="w-4 h-4" />
          </div>
          <span className="text-xxs font-bold text-white/40 uppercase tracking-widest block font-mono">
            Unavailable
          </span>
          <span className="text-2xl font-serif text-rose-400 mt-1.5 block">
            {stats.rejected}
          </span>
          <p className="text-xxs text-white/35 mt-1 leading-relaxed">
            Rejection email dispatch
          </p>
        </div>
      </div>

      {/* Database section */}
      <div className="glassmorphism rounded-sm overflow-hidden shadow-xl border border-white/10 bg-[#050505]">
        
        {/* Table Search & Filter Bar */}
        <div className="p-5 border-b border-white/10 bg-[#050505] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/30">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, name, email or phone..."
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-sm pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] transition-all font-mono"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xxs font-bold uppercase tracking-wider text-white/40 flex items-center gap-1.5 mr-1 select-none">
              <Filter className="w-3 h-3" />
              Filter State:
            </span>
            {(['All', 'Pending', 'Confirmed', 'Rejected'] as const).map((filterOpt) => (
              <button
                key={filterOpt}
                onClick={() => setSelectedFilter(filterOpt)}
                className={`px-3 py-1.5 rounded-sm text-xxs font-semibold tracking-wide transition-all select-none border cursor-pointer ${
                  selectedFilter === filterOpt
                    ? 'bg-[#c5a059]/15 border-[#c5a059]/30 text-[#c5a059]'
                    : 'bg-transparent hover:bg-white/5 border-white/10 text-white/50 hover:text-white'
                }`}
              >
                {filterOpt}
              </button>
            ))}
          </div>
        </div>

        {/* Big Table Container */}
        <div className="overflow-x-auto w-full">
          {filteredReservations.length === 0 ? (
            <div className="p-12 text-center text-white/40 space-y-2 select-none">
              <Search className="w-8 h-8 text-white/10 mx-auto" />
              <p className="text-sm font-medium text-white/60">No matching reservations located.</p>
              <p className="text-xs text-white/35">Refine your active filter parameters or lookup criteria.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-[#0a0a0a] border-b border-white/10 font-mono text-xxs text-white/30 uppercase tracking-widest select-none">
                  <th className="py-4 px-5">ID</th>
                  <th className="py-4 px-4">Contact</th>
                  <th className="py-4 px-4">Allocated Date/Time</th>
                  <th className="py-4 px-4 text-center">Guests</th>
                  <th className="py-4 px-4">Special Requests</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredReservations.map((res) => {
                  const isActioning = actioningId === res.id;

                  return (
                    <tr key={res.id} className="hover:bg-white/5 text-xs transition-colors">
                      {/* ID */}
                      <td className="py-4 px-5 font-mono text-xxs font-bold text-[#c5a059]">
                        {res.id}
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-4">
                        <span className="font-semibold text-white block text-sm">{res.customerName}</span>
                        <div className="space-y-0.5 mt-1 font-mono text-[10px] text-white/40">
                          <span className="flex items-center gap-1.5 hover:text-white/80">
                            <Mail className="w-3 h-3 text-white/30" />
                            {res.email}
                          </span>
                          <span className="flex items-center gap-1.5 hover:text-white/80">
                            <Phone className="w-3 h-3 text-white/30" />
                            {res.phone}
                          </span>
                        </div>
                      </td>

                      {/* Date / Time */}
                      <td className="py-4 px-4 font-mono">
                        <span className="text-white/80 font-sans block text-xs flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-white/30" />
                          {res.reservationDate}
                        </span>
                        <span className="text-[10px] text-white/40 block mt-1 flex items-center gap-1.5 font-bold">
                          <Clock className="w-3 h-3 text-white/30" />
                          {res.reservationTime}
                        </span>
                      </td>

                      {/* Party Guests */}
                      <td className="py-4 px-4 text-center">
                        <span className="px-2.5 py-1 bg-white/5 border border-white/10 text-white/70 rounded-sm text-xxs font-bold inline-flex items-center gap-1">
                          <Users className="w-3 h-3 text-white/30" />
                          {res.guests}
                        </span>
                      </td>

                      {/* Request details */}
                      <td className="py-4 px-4 max-w-xs overflow-hidden text-ellipsis whitespace-normal leading-relaxed text-slate-400">
                        {res.specialRequest ? (
                          <span className="text-xs italic bg-[#c5a059]/5 px-2.5 py-1.5 border border-[#c5a059]/10 rounded-sm block text-white/80">
                            "{res.specialRequest}"
                          </span>
                        ) : (
                          <span className="text-white/30 italic">None</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold select-none ${
                          res.status === 'Confirmed' 
                            ? 'bg-emerald-950/30 border border-emerald-500/20 text-emerald-400' 
                            : res.status === 'Rejected'
                            ? 'bg-rose-950/30 border border-rose-500/20 text-rose-400'
                            : 'bg-amber-950/30 border border-amber-500/20 text-amber-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            res.status === 'Confirmed' ? 'bg-emerald-400' : res.status === 'Rejected' ? 'bg-rose-400' : 'bg-amber-400'
                          }`}></span>
                          {res.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          {isActioning ? (
                            <div className="w-5 h-5 border-2 border-[#c5a059] border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <>
                              {res.status === 'Pending' && (
                                <>
                                  <button
                                    onClick={() => handleStatusChange(res.id, 'Confirmed')}
                                    className="px-2.5 py-1.5 bg-[#c5a059] hover:bg-[#b08e4d] text-black text-xxs font-bold uppercase tracking-wider rounded-sm cursor-pointer transition-all"
                                    title="Approve Table Reservation (dispatches confirmation email)"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(res.id, 'Rejected')}
                                    className="px-2.5 py-1.5 bg-white/5 hover:bg-rose-500/5 hover:text-rose-400 border border-white/10 hover:border-rose-500/20 text-white/60 text-xxs font-bold uppercase tracking-wider rounded-sm cursor-pointer transition-all"
                                    title="Reject Table Reservation (dispatches rejection email)"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {res.status !== 'Pending' && (
                                <span className="text-[10px] text-white/30 italic font-medium select-none pr-1.5">
                                  Notified
                                </span>
                              )}
                              <button
                                onClick={() => handleDelete(res.id)}
                                className="p-1.5 bg-white/5 border border-white/10 hover:border-red-500/20 hover:text-red-400 hover:bg-red-500/5 rounded-sm cursor-pointer transition-all"
                                title="Delete entry permanently row from Google Sheets"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Database sync status banner */}
      <div className="p-4 bg-[#050505] border border-white/10 rounded-sm text-xxs text-white/40 flex flex-col sm:flex-row justify-between items-center gap-3">
        <span className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-[#c5a059]" />
          <span>Real-time Google Sheets Datastore synchronization state: {config.isSyncEnabled ? 'CONNECTED' : 'STANDALONE (No Network Sync Active)'}</span>
        </span>
        {config.isSyncEnabled && (
          <span className="truncate max-w-[200px] text-white/20 font-mono">
            EndPoint: {config.googleSheetsUrl}
          </span>
        )}
      </div>

    </div>
  );
}
