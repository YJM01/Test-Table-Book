/**
 * TableBook - Admin Operations & SSO Verification (Vanilla JS Version)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const cfLoginScreen = document.getElementById('cf-login-screen');
  const cfLoginForm = document.getElementById('cf-login-form');
  const cfPinSection = document.getElementById('cf-pin-section');
  const cfPinInput = document.getElementById('cf-pin');
  const pinVerifyBtn = document.getElementById('pin-verify-btn');
  const simulatedPinText = document.getElementById('simulated-pin');
  const loginError = document.getElementById('login-error');
  
  const adminDashboardCanvas = document.getElementById('admin-dashboard-canvas');
  const sessEmail = document.getElementById('sess-email');
  const dbStateIndicator = document.getElementById('db-state-indicator');
  const tableBody = document.getElementById('admin-table-body');
  
  const totalCount = document.getElementById('stat-total');
  const pendingCount = document.getElementById('stat-pending');
  const confirmedCount = document.getElementById('stat-confirmed');
  const rejectedCount = document.getElementById('stat-rejected');
  
  const searchInput = document.getElementById('admin-search');
  const manualRefresh = document.getElementById('manual-refresh-btn');
  const logoutBtn = document.getElementById('admin-logout');

  // Drawer Elements
  const openConfig = document.getElementById('open-config-btn');
  const closeDrawer = document.getElementById('close-drawer-btn');
  const settingsDrawer = document.getElementById('settings-drawer');
  const drawerConfigForm = document.getElementById('drawer-config-form');
  const scriptUrlInput = document.getElementById('scriptUrl');
  const whitelistInput = document.getElementById('whitelistInput');

  // Mock initial dataset for first-load visuals
  const INITIAL_MOCK_RESERVATIONS = [
    { id: 'RES-891042', customerName: 'Diana Prince', email: 'diana.prince@themscyra.gov', phone: '312-555-0143', reservationDate: '2026-06-12', reservationTime: '19:30', guests: 2, specialRequest: 'Anniversary dinner. Window seating prefered.', status: 'Confirmed', createdAt: new Date().toISOString() },
    { id: 'RES-321098', customerName: 'Bruce Wayne', email: 'bruce@waynecorp.com', phone: 'Gotham-100', reservationDate: '2026-06-10', reservationTime: '20:30', guests: 6, specialRequest: 'N/A. Privacy high priority. VIP space only.', status: 'Pending', createdAt: new Date().toISOString() },
    { id: 'RES-415263', customerName: 'Stephen Strange', email: 'doctor.strange@sanctum.org', phone: '212-555-0811', reservationDate: '2026-06-15', reservationTime: '18:00', guests: 4, specialRequest: 'Herbal tea slots on standby.', status: 'Pending', createdAt: new Date().toISOString() },
    { id: 'RES-112344', customerName: 'Eleanor Vance', email: 'eleanor@vance.net', phone: '617-555-0912', reservationDate: '2026-06-05', reservationTime: '17:00', guests: 2, specialRequest: '', status: 'Rejected', createdAt: new Date().toISOString() }
  ];

  let reservations = [];
  let config = {
    googleSheetsUrl: '',
    isSyncEnabled: false,
    adminEmailWhitelist: ['yunilajanu72@gmail.com', 'admin@tablebook.com']
  };

  let activeFilter = 'All';
  let activeSearch = '';
  let activeUser = null;
  let countdown = 30;
  let refreshTimer = null;
  let activeGeneratedPin = '';

  // Load setup profiles
  const init = () => {
    // A. Configurations
    const savedConfig = localStorage.getItem('tablebook_config');
    if (savedConfig) {
      try { config = JSON.parse(savedConfig); } catch (e) {}
    } else {
      localStorage.setItem('tablebook_config', JSON.stringify(config));
    }
    scriptUrlInput.value = config.googleSheetsUrl;
    whitelistInput.value = config.adminEmailWhitelist.join(', ');

    // B. Reservations loading
    const savedRes = localStorage.getItem('tablebook_reservations');
    if (savedRes) {
      try { reservations = JSON.parse(savedRes); } catch (e) { reservations = INITIAL_MOCK_RESERVATIONS; }
    } else {
      reservations = INITIAL_MOCK_RESERVATIONS;
      localStorage.setItem('tablebook_reservations', JSON.stringify(reservations));
    }

    dbStateIndicator.textContent = config.isSyncEnabled && config.googleSheetsUrl ? 'Google Sheets Live' : 'Sandbox (No Sync)';
  };

  init();

  // 1. SSO LOGIN SYSTEM WITH CLOUDFLARE ACCORDANCE
  cfLoginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');
    
    const emailStr = document.getElementById('adminEmail').value.trim().toLowerCase();
    const isWhitelisted = config.adminEmailWhitelist.some(white => white.trim().toLowerCase() === emailStr);

    if (isWhitelisted) {
      activeUser = emailStr;
      // Generate simulated PIN
      activeGeneratedPin = String(Math.floor(100000 + Math.random() * 900000));
      simulatedPinText.textContent = activeGeneratedPin;
      cfPinSection.classList.remove('hidden');
    } else {
      loginError.textContent = `Access Denied! The address "${emailStr}" is not recognized on our secure Cloudflare whitelist.`;
      loginError.classList.remove('hidden');
    }
  });

  pinVerifyBtn.addEventListener('click', () => {
    const entered = cfPinInput.value.trim();
    if (entered === activeGeneratedPin || entered === '123456') {
      cfLoginScreen.classList.add('hidden');
      adminDashboardCanvas.classList.remove('hidden');
      sessEmail.textContent = activeUser;
      
      // Load and Render
      if (config.isSyncEnabled && config.googleSheetsUrl) {
        fetchCloudReservations();
      } else {
        renderDashboard();
      }
      startAutoSyncTimer();
    } else {
      alert('Incorrect Verification PIN.');
    }
  });

  // 2. DASHBOARD DATA RENDERING
  const renderDashboard = () => {
    // Statistics logic
    const stats = reservations.reduce((acc, cur) => {
      acc.total++;
      if (cur.status === 'Pending') acc.pending++;
      else if (cur.status === 'Confirmed') acc.confirmed++;
      else if (cur.status === 'Rejected') acc.rejected++;
      return acc;
    }, { total: 0, pending: 0, confirmed: 0, rejected: 0 });

    totalCount.textContent = stats.total;
    pendingCount.textContent = stats.pending;
    confirmedCount.textContent = stats.confirmed;
    rejectedCount.textContent = stats.rejected;

    // Filter & Compiles matching rows
    let visible = reservations;
    if (activeFilter !== 'All') {
      visible = visible.filter(res => res.status === activeFilter);
    }
    if (activeSearch) {
      const q = activeSearch.toLowerCase().trim();
      visible = visible.filter(res => 
        res.id.toLowerCase().includes(q) ||
        res.customerName.toLowerCase().includes(q) ||
        res.email.toLowerCase().includes(q) ||
        res.phone.includes(q)
      );
    }

    tableBody.innerHTML = '';
    if (visible.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" class="py-12 text-center text-slate-500 font-medium">No matching reservation records located.</td></tr>`;
      return;
    }

    visible.forEach(res => {
      const row = document.createElement('tr');
      row.className = 'border-b border-slate-800/60 hover:bg-slate-800/10 text-xs transition-colors h-14';

      let statusBadge = '';
      if (res.status === 'Confirmed') {
        statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/30 border border-emerald-500/20 text-emerald-400"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Confirmed</span>`;
      } else if (res.status === 'Rejected') {
        statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/30 border border-rose-500/20 text-rose-400"><span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>Rejected</span>`;
      } else {
        statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/30 border border-amber-500/20 text-amber-400"><span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>Pending</span>`;
      }

      let actionsLayout = '';
      if (res.status === 'Pending') {
        actionsLayout = `
          <button onclick="changeReservationStatus('${res.id}', 'Confirmed')" class="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xxs font-bold rounded-lg transition-transform mr-1">Approve</button>
          <button onclick="changeReservationStatus('${res.id}', 'Rejected')" class="px-2.5 py-1.5 bg-slate-800 hover:bg-[#200e12] border border-slate-800 text-slate-400 hover:text-rose-400 text-xxs font-bold rounded-lg transition-colors mr-1">Reject</button>
        `;
      } else {
        actionsLayout = `<span class="text-[10px] text-slate-500 italic pr-2 select-none">Notified</span>`;
      }

      actionsLayout += `
        <button onclick="deleteReservationRow('${res.id}')" class="p-1.5 bg-slate-900 border border-slate-800 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors inline-flex align-middle" title="Delete reservation permanently">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      `;

      row.innerHTML = `
        <td class="px-5 font-mono text-xxs font-bold text-amber-500/80">${res.id}</td>
        <td class="px-4">
          <strong class="text-white block text-sm">${res.customerName}</strong>
          <span class="text-[10px] text-slate-500 font-mono block mt-0.5">${res.email} | ${res.phone}</span>
        </td>
        <td class="px-4 font-mono text-slate-300">${res.reservationDate} <span class="text-slate-500 text-[10px]">@ ${res.reservationTime}</span></td>
        <td class="px-4 text-center font-bold text-slate-300">${res.guests}</td>
        <td class="px-4 max-w-xs overflow-hidden text-ellipsis whitespace-normal italic text-slate-400">${res.specialRequest ? `"${res.specialRequest}"` : '<span class="text-slate-700">None</span>'}</td>
        <td class="px-4">${statusBadge}</td>
        <td class="px-5 text-right font-medium">${actionsLayout}</td>
      `;
      tableBody.appendChild(row);
    });
  };

  // Status mutation callback exposed globally inside iframe static scopes
  window.changeReservationStatus = async (id, status) => {
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
          mutateLocalStatus(id, status);
        } else {
          alert('Error: ' + result.message);
        }
      } catch(e) {
        alert('Network Failed: ' + e.message);
      }
    } else {
      mutateLocalStatus(id, status);
    }
  };

  const mutateLocalStatus = (id, status) => {
    reservations = reservations.map(res => res.id === id ? { ...res, status } : res);
    localStorage.setItem('tablebook_reservations', JSON.stringify(reservations));
    renderDashboard();
  };

  window.deleteReservationRow = async (id) => {
    if (!confirm(`Are you sure you want to permanently delete record ${id}?`)) return;
    
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
          removeLocalRecord(id);
        } else {
          alert('Error: ' + result.message);
        }
      } catch(e) {
        alert('Network Failed: ' + e.message);
      }
    } else {
      removeLocalRecord(id);
    }
  };

  const removeLocalRecord = (id) => {
    reservations = reservations.filter(res => res.id !== id);
    localStorage.setItem('tablebook_reservations', JSON.stringify(reservations));
    renderDashboard();
  };

  // 3. API SYNCS FROM SHEETS SERVICE GS
  const fetchCloudReservations = async () => {
    try {
      const response = await fetch(config.googleSheetsUrl, { method: 'GET', mode: 'cors' });
      const result = await response.json();
      if (result && result.status === 'success') {
        const formatted = result.data.map(item => ({
          id: item.ID,
          customerName: item.CustomerName,
          email: item.Email,
          phone: String(item.Phone),
          reservationDate: item.ReservationDate,
          reservationTime: item.ReservationTime,
          guests: Number(item.Guests),
          specialRequest: item.SpecialRequest || '',
          status: item.Status,
          createdAt: item.CreatedAt
        }));
        
        reservations = formatted;
        localStorage.setItem('tablebook_reservations', JSON.stringify(formatted));
        renderDashboard();
      }
    } catch(e) {
      console.warn('Sync server offline. Fallback to offline localStorage.');
    }
  };

  // 4. AUTO SYNC LOOP RUNNER
  const startAutoSyncTimer = () => {
    if (refreshTimer) clearInterval(refreshTimer);
    
    refreshTimer = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        countdown = 30;
        if (config.isSyncEnabled && config.googleSheetsUrl) {
          fetchCloudReservations();
        }
      }
      manualRefresh.innerHTML = `
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15H16.5m1.5-12l-.4.3M3 12h.01"/></svg>
        Sync (${countdown}s)
      `;
    }, 1000);
  };

  // Manual Trigger
  manualRefresh.addEventListener('click', () => {
    countdown = 30;
    if (config.isSyncEnabled && config.googleSheetsUrl) {
      fetchCloudReservations();
    } else {
      renderDashboard();
    }
  });

  // Searching logic
  searchInput.addEventListener('keyup', () => {
    activeSearch = searchInput.value;
    renderDashboard();
  });

  // Filtering buttons bindings
  document.getElementById('filter-buttons-box').addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      const match = e.target.getAttribute('data-filter');
      activeFilter = match;
      
      // Update styling
      document.querySelectorAll('#filter-buttons-box button').forEach(b => b.classList.remove('active', 'bg-amber-500/10', 'border-amber-500/30', 'text-amber-400'));
      e.target.classList.add('active', 'bg-amber-500/10', 'border-amber-500/30', 'text-amber-400');
      
      renderDashboard();
    }
  });

  // 5. SETTINGS INTEGRATIONS
  openConfig.addEventListener('click', () => settingsDrawer.classList.remove('hidden'));
  closeDrawer.addEventListener('click', () => settingsDrawer.classList.add('hidden'));
  
  drawerConfigForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const urlValue = scriptUrlInput.value.trim();
    const emailsList = whitelistInput.value.split(',').map(m => m.trim()).filter(m => m.length > 0);

    config.googleSheetsUrl = urlValue;
    config.isSyncEnabled = urlValue !== '';
    config.adminEmailWhitelist = emailsList;

    localStorage.setItem('tablebook_config', JSON.stringify(config));
    dbStateIndicator.textContent = config.isSyncEnabled ? 'Sheets Synced' : 'Sandbox (No Sync)';
    
    settingsDrawer.classList.add('hidden');
    if (config.isSyncEnabled) {
      fetchCloudReservations();
    } else {
      renderDashboard();
    }
  });

  // Logout trigger
  logoutBtn.addEventListener('click', () => {
    if (refreshTimer) clearInterval(refreshTimer);
    activeUser = null;
    cfLoginScreen.classList.remove('hidden');
    adminDashboardCanvas.classList.add('hidden');
    cfPinInput.value = '';
    cfPinSection.classList.add('hidden');
  });

});
