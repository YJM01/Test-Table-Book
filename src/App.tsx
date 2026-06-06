/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building, Utensils, MapPin, Clock, Phone, Mail, Settings, Shield, Globe, 
  CheckCircle2, ArrowRight, Instagram, Facebook, Calendar, AlertTriangle
} from 'lucide-react';
import { Reservation, AppConfig, ReservationStatus } from './types';
import ReservationForm from './components/ReservationForm';
import AdminDashboard from './components/AdminDashboard';
import AccessControl from './components/AccessControl';
import AppSettings from './components/AppSettings';

// Interactive Initial Mock Reservations for realistic SaaS testing
const INITIAL_MOCK_RESERVATIONS: Reservation[] = [
  {
    id: 'RES-891042',
    customerName: 'Diana Prince',
    email: 'diana.prince@themscyra.gov',
    phone: '312-555-0143',
    reservationDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 2 days in future
    reservationTime: '19:30',
    guests: 2,
    specialRequest: 'Anniversary dinner. Would prefer an intimate booth with a courtyard window view if possible.',
    status: 'Confirmed',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'RES-321098',
    customerName: 'Bruce Wayne',
    email: 'bruce@waynecorp.com',
    phone: 'Gotham-100',
    reservationDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
    reservationTime: '20:30',
    guests: 6,
    specialRequest: 'N/A. Privacy highly appreciated. VIP tables only.',
    status: 'Pending',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: 'RES-415263',
    customerName: 'Stephen Strange',
    email: 'doctor.strange@sanctum.org',
    phone: '212-555-0811',
    reservationDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0], // 4 days in future
    reservationTime: '18:00',
    guests: 4,
    specialRequest: 'Need herbal teas on standby, and plenty of table spacing for sensory comfort.',
    status: 'Pending',
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString()
  },
  {
    id: 'RES-112344',
    customerName: 'Eleanor Vance',
    email: 'eleanor@vance.net',
    phone: '617-555-0912',
    reservationDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // yesterday
    reservationTime: '17:00',
    guests: 2,
    specialRequest: '',
    status: 'Rejected',
    createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString()
  }
];

const DEFAULT_CONFIG: AppConfig = {
  googleSheetsUrl: '',
  isSyncEnabled: false,
  adminEmailWhitelist: ['yunilajanu72@gmail.com', 'admin@tablebook.com']
};

export default function App() {
  // Navigation View: 'public' | 'admin'
  const [currentView, setCurrentView] = useState<'public' | 'admin'>('public');
  
  // App Config Settings state
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Reservations Main Database state
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Administrative Login Authenticated Session State
  const [authenticatedUser, setAuthenticatedUser] = useState<string | null>(null);

  // Parse URL query parameter on init
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam === 'admin') {
      setCurrentView('admin');
    }
  }, []);

  // Sync state view to window url for bookmarking/navigation testing in iframe
  const handleViewChange = (view: 'public' | 'admin') => {
    setCurrentView(view);
    const url = new URL(window.location.href);
    if (view === 'admin') {
      url.searchParams.set('view', 'admin');
    } else {
      url.searchParams.delete('view');
    }
    window.history.pushState({}, '', url.toString());
  };

  // 1. Initial configuration and database load on mount
  useEffect(() => {
    // A. Load application configs
    const savedConfig = localStorage.getItem('tablebook_config');
    let loadedConfig = DEFAULT_CONFIG;
    if (savedConfig) {
      try {
        loadedConfig = JSON.parse(savedConfig);
        setConfig(loadedConfig);
      } catch (err) {
        console.error('Error loading config:', err);
      }
    }

    // B. Load reservation dataset
    const savedReservations = localStorage.getItem('tablebook_reservations');
    if (savedReservations) {
      try {
        setReservations(JSON.parse(savedReservations));
      } catch (err) {
        setReservations(INITIAL_MOCK_RESERVATIONS);
      }
    } else {
      setReservations(INITIAL_MOCK_RESERVATIONS);
      localStorage.setItem('tablebook_reservations', JSON.stringify(INITIAL_MOCK_RESERVATIONS));
    }

    // If config sync is active, trigger first fetch from Sheets API
    if (loadedConfig.isSyncEnabled && loadedConfig.googleSheetsUrl) {
      fetchCloudReservations(loadedConfig.googleSheetsUrl);
    }
  }, []);

  // Fetch reservations from Google Sheets API
  const fetchCloudReservations = async (url: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(url, { method: 'GET', mode: 'cors' });
      const result = await response.json();
      if (result && result.status === 'success') {
        const cloudData: Reservation[] = result.data.map((item: any) => ({
          id: item.ID,
          customerName: item.CustomerName,
          email: item.Email,
          phone: String(item.Phone),
          reservationDate: item.ReservationDate,
          reservationTime: item.ReservationTime,
          guests: Number(item.Guests),
          specialRequest: item.SpecialRequest || '',
          status: item.Status as ReservationStatus,
          createdAt: item.CreatedAt
        }));
        
        setReservations(cloudData);
        // Persist local backup updated copy
        localStorage.setItem('tablebook_reservations', JSON.stringify(cloudData));
      }
    } catch (err) {
      console.error('Failed to sync from Google Sheets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Trigger operational configurations mutation
  const handleUpdateConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    localStorage.setItem('tablebook_config', JSON.stringify(newConfig));
    
    // If newly enabled or changed Sheets URL, trigger manual fetch immediately
    if (newConfig.isSyncEnabled && newConfig.googleSheetsUrl) {
      fetchCloudReservations(newConfig.googleSheetsUrl);
    }
  };

  // 3. Callback: Form Booking adding new reservations
  const handleAddReservation = (res: Reservation) => {
    setReservations((prev) => {
      const updated = [res, ...prev];
      localStorage.setItem('tablebook_reservations', JSON.stringify(updated));
      return updated;
    });
  };

  // 4. Callback: Admin Core Operations - Change Booking Status (Approve/Reject)
  const handleUpdateStatus = async (id: string, status: ReservationStatus): Promise<boolean> => {
    // If sync enabled, trigger cloud POST operation
    if (config.isSyncEnabled && config.googleSheetsUrl) {
      try {
        const response = await fetch(config.googleSheetsUrl, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'update', id, status })
        });
        const result = await response.json();
        if (result && result.status === 'success') {
          updateLocalStatus(id, status);
          return true;
        }
        alert(`Error: ${result.message || 'Verification on Sheets API failed.'}`);
        return false;
      } catch (err: any) {
        alert(`Network Sync Failure: Unable to complete cloud request. ${err.message || ''}`);
        return false;
      }
    } else {
      // Offline mode mutation
      return new Promise((resolve) => {
        setTimeout(() => {
          updateLocalStatus(id, status);
          resolve(true);
        }, 500);
      });
    }
  };

  const updateLocalStatus = (id: string, status: ReservationStatus) => {
    setReservations((prev) => {
      const updated = prev.map((res) => res.id === id ? { ...res, status } : res);
      localStorage.setItem('tablebook_reservations', JSON.stringify(updated));
      return updated;
    });
  };

  // 5. Callback: Admin Core Operations - Deletion Row
  const handleDeleteReservation = async (id: string): Promise<boolean> => {
    if (config.isSyncEnabled && config.googleSheetsUrl) {
      try {
        const response = await fetch(config.googleSheetsUrl, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'delete', id })
        });
        const result = await response.json();
        if (result && result.status === 'success') {
          deleteLocalReservation(id);
          return true;
        }
        alert(`Error: ${result.message || 'Deletion failed on Sheets API.'}`);
        return false;
      } catch (err: any) {
        alert(`Network Sync Failure: Unable to remove item row. ${err.message || ''}`);
        return false;
      }
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          deleteLocalReservation(id);
          resolve(true);
        }, 400);
      });
    }
  };

  const deleteLocalReservation = (id: string) => {
    setReservations((prev) => {
      const updated = prev.filter((res) => res.id !== id);
      localStorage.setItem('tablebook_reservations', JSON.stringify(updated));
      return updated;
    });
  };

  const handleForceRefresh = async () => {
    if (config.isSyncEnabled && config.googleSheetsUrl) {
      await fetchCloudReservations(config.googleSheetsUrl);
    }
  };

  const handleLogout = () => {
    setAuthenticatedUser(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col antialiased selection:bg-[#c5a059] selection:text-black">
      
      {/* STICKY HEADER NAVBAR */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/10 h-16 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          
          {/* Logo brand */}
          <div 
            onClick={() => handleViewChange('public')}
            className="flex items-center gap-8 cursor-pointer"
          >
            <span className="text-2xl font-serif tracking-tighter text-[#c5a059]">
              TableBook
            </span>
            {/* Nav menu links */}
            <nav className="hidden lg:flex gap-6 text-sm uppercase tracking-widest text-white/60">
              <span onClick={() => handleViewChange('public')} className="hover:text-white cursor-pointer transition-colors">Home</span>
              <span onClick={() => handleViewChange('public')} className="hover:text-white cursor-pointer transition-colors">Reservations</span>
              <span onClick={() => handleViewChange('public')} className="hover:text-white cursor-pointer transition-colors">Contact</span>
            </nav>
          </div>

          {/* Settings & View Swapper Actions */}
          <div className="flex items-center gap-4">
            {/* Global configurations button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 bg-white/5 border border-white/10 hover:border-[#c5a059]/40 hover:text-white text-white/60 rounded-sm cursor-pointer transition-all"
              title="Configure Sheet/Sync Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Public <-> Dashboard toggle toggle button */}
            {currentView === 'public' ? (
              <button
                onClick={() => handleViewChange('admin')}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:border-[#c5a059]/40 text-white/80 hover:text-white rounded-sm text-xs font-semibold cursor-pointer transition-all"
              >
                <Shield className="w-3.5 h-3.5 text-[#c5a059]" />
                Admin Panel
              </button>
            ) : (
              <button
                onClick={() => handleViewChange('public')}
                className="flex items-center gap-2 px-4 py-2 bg-[#c5a059] text-black text-xs font-bold uppercase tracking-widest rounded-sm cursor-pointer hover:bg-[#b08e4d] transition-all"
              >
                <Globe className="w-3.5 h-3.5" />
                Public Site
              </button>
            )}

            {/* CTA anchor link button in public view */}
            {currentView === 'public' && (
              <a
                href="#reservations"
                className="hidden sm:inline-flex px-5 py-2 bg-[#c5a059] text-black text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-[#b08e4d] transition-all"
              >
                Book Table
              </a>
            )}
          </div>

        </div>
      </header>

      {/* CORE INNER VIEWS SWITCHER */}
      <main className="flex-1">
        {currentView === 'public' ? (
          /* PAGE 1: PUBLIC RESERVATION WEBSITE */
          <div className="space-y-24 pb-20">
            
            {/* HERO MODULE SECTION */}
            <section id="home" className="relative h-[85vh] min-h-[550px] flex items-center justify-center overflow-hidden">
              {/* Background cover image with premium parallax dark tint overlays */}
              <div className="absolute inset-0 z-0">
                <img 
                  src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1600&q=80" 
                  alt="Fine Dining Table Setup" 
                  className="w-full h-full object-cover brightness-[0.2]"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/95 via-[#0a0a0a]/40 to-transparent"></div>
              </div>

              {/* Hero Contents */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full text-center lg:text-left">
                <div className="max-w-2xl space-y-6">
                  
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#c5a059]/10 border border-[#c5a059]/20 text-[#c5a059] rounded-sm text-xxs font-mono tracking-widest uppercase animate-fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Now Accepting Dinner Bookings
                  </div>

                  <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-tight">
                    Reserve Your Perfect <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c5a059] via-[#ecdba4] to-[#c5a059]">
                      Dining Experience
                    </span>
                  </h1>

                  <p className="text-base sm:text-lg text-white/60 leading-relaxed font-light font-sans max-w-lg mx-auto lg:mx-0">
                    A culinary voyage where meticulous preparation meets warm, bespoke hosting. Secure your table online in seconds.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                    <a
                      href="#reservations"
                      className="w-full sm:w-auto px-7 py-4 bg-[#c5a059] hover:bg-[#b08e4d] text-black text-xs font-bold uppercase tracking-widest rounded-sm transition-all text-center"
                    >
                      Book Your Visit
                    </a>
                    <a
                      href="#contact"
                      className="w-full sm:w-auto px-7 py-4 bg-transparent hover:bg-white/5 border border-white/10 text-white font-semibold rounded-sm text-xs uppercase tracking-widest transition-all text-center"
                    >
                      Browse Hours
                    </a>
                  </div>

                </div>
              </div>

              {/* Decorative scroll icon pointer */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 font-mono text-xxs text-white/40 tracking-widest pointer-events-none uppercase">
                <span>Discover</span>
                <span className="w-1 h-8 bg-gradient-to-b from-[#c5a059] to-transparent rounded-full animate-bounce"></span>
              </div>
            </section>

            {/* RESERVATION FORM MODULE SECTION */}
            <section id="reservations" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
              <div className="text-center max-w-xl mx-auto space-y-3 mb-10">
                <span className="text-[#c5a059] font-mono text-xxs font-bold uppercase tracking-widest block">
                  Interactive Scheduler
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl text-white tracking-tight">
                  Instant Table Reservation
                </h2>
                <p className="text-white/40 text-sm leading-relaxed max-w-md mx-auto">
                  Pick date, timeslot, and register — our automated sync updates Google Sheets and dispatches confirmation alerts instantly.
                </p>
              </div>

              {/* Form Holder */}
              <ReservationForm 
                config={config} 
                onAddReservation={handleAddReservation} 
              />
            </section>

            {/* CONTACT & DETAILS SECTIONS MODULE */}
            <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                
                {/* Visual Location Frame */}
                <div className="col-span-1 lg:col-span-5 bg-[#050505] border border-white/10 rounded-sm p-8 flex flex-col justify-between space-y-8">
                  <div className="space-y-4">
                    <span className="text-[#c5a059] font-mono text-xxs font-bold uppercase tracking-widest block">
                      Fine Dining Location
                    </span>
                    <h3 className="font-serif text-2xl text-white tracking-tight">
                      Visit TableBook
                    </h3>
                    <p className="text-white/40 text-sm leading-relaxed font-light">
                      A premium ambient gastro-loft nestled in the heart of the culinary district. Elevate your milestones.
                    </p>
                  </div>

                  {/* Informative list cells */}
                  <div className="space-y-4 text-xs text-white/80">
                    <div className="flex gap-3.5 items-start">
                      <div className="p-2 bg-white/5 border border-white/10 text-[#c5a059] rounded-sm shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-white block text-sm">Gourmet Haven Blvd</strong>
                        <span className="text-white/40 block mt-0.5">452 Culinary Heights Way, Suite A</span>
                      </div>
                    </div>

                    <div className="flex gap-3.5 items-start">
                      <div className="p-2 bg-white/5 border border-white/10 text-[#c5a059] rounded-sm shrink-0 mt-0.5">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-white block text-sm">Operation Schedules</strong>
                        <span className="text-white/40 block mt-0.5">Tuesday - Saturday: 12:00 PM - 10:00 PM</span>
                        <span className="text-white/40 block">Sunday: 4:00 PM - 9:00 PM (Dinner Only)</span>
                      </div>
                    </div>

                    <div className="flex gap-3.5 items-start">
                      <div className="p-2 bg-white/5 border border-white/10 text-[#c5a059] rounded-sm shrink-0 mt-0.5">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-white block text-sm">Inquiries & Call Desk</strong>
                        <span className="text-white/40 block mt-0.5">+1 (555) 019-2834</span>
                        <span className="text-[#c5a059] font-mono text-xxs">concierge@tablebook.com</span>
                      </div>
                    </div>
                  </div>

                  {/* Decorative stamp banner */}
                  <div className="pt-4 border-t border-white/10 text-xxs text-white/30 font-mono leading-relaxed">
                    Reservations open 30 days in advance. Dedicated valet parking options available at the Boulevard entrance.
                  </div>
                </div>

                {/* Grid banner block 2 */}
                <div className="col-span-1 lg:col-span-7 rounded-sm relative overflow-hidden group min-h-[350px]">
                  <img 
                    src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80" 
                    alt="Chefs styling dinner dishes" 
                    className="w-full h-full object-cover brightness-[0.35] group-hover:scale-102 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Decorative luxury callout pane */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex flex-col justify-end p-8 sm:p-10">
                    <div className="max-w-md space-y-3">
                      <div className="w-10 h-10 bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059] rounded-sm flex items-center justify-center">
                        <Building className="w-5 h-5" />
                      </div>
                      <h4 className="font-serif text-2xl text-white tracking-tight">
                        Exquisite Culinary Craft
                      </h4>
                      <p className="text-white/60 text-xs leading-relaxed font-light">
                        Our world-renowned kitchen staff designs themed monthly seasonal menus highlighting organic, locally sourced farm-to-table selections.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </section>

          </div>
        ) : (
          /* PAGE 2: ADMIN DASHBOARD (GATEKEEPER SECURITY + SaaS PANEL) */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {authenticatedUser ? (
              /* ACTIVE ADMIN SaaS CONTROL PANEL */
              <AdminDashboard
                reservations={reservations}
                config={config}
                onUpdateStatus={handleUpdateStatus}
                onDeleteReservation={handleDeleteReservation}
                onForceRefresh={handleForceRefresh}
                onLogout={handleLogout}
                adminEmail={authenticatedUser}
              />
            ) : (
              /* CLOUDFLARE ACCESS SIMULATION AUTHENTICATION PORTAL */
              <AccessControl 
                config={config} 
                onLoginSuccess={(email) => setAuthenticatedUser(email)} 
              />
            )}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-[#050505] border-t border-white/10 py-12 text-sm text-white/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1">
            <span className="font-serif text-lg text-[#c5a059]">
              TableBook
            </span>
            <p className="text-xxs leading-relaxed text-white/30 max-w-xs mt-1">
              Fully functional modular system supporting Cloudflare Access, Google Sheet APIs, and automated Gmail trigger dispatches.
            </p>
          </div>

          <div className="flex gap-4">
            <a href="#" className="p-2.5 bg-white/5 border border-white/10 hover:border-[#c5a059]/30 text-white rounded-sm transition-all" aria-label="Facebook">
              <Facebook className="w-4 h-4 text-white/60" />
            </a>
            <a href="#" className="p-2.5 bg-white/5 border border-white/10 hover:border-[#c5a059]/30 text-white rounded-sm transition-all" aria-label="Instagram">
              <Instagram className="w-4 h-4 text-white/60" />
            </a>
          </div>

          <div className="text-center md:text-right space-y-1">
            <p className="text-xxs tracking-wider font-mono uppercase">
              &copy; {new Date().getFullYear()} TableBook Restaurants Inc.
            </p>
            <p className="text-[10px] text-white/20">
              Built on React + Google Apps Script Web App Engine.
            </p>
          </div>

        </div>
      </footer>

      {/* COMPACT APP SETTINGS DIALOG DRAWER */}
      <AppSettings
        config={config}
        onUpdateConfig={handleUpdateConfig}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

    </div>
  );
}
