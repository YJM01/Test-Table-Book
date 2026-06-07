/**
 * TableBook - Public Client Operations (Vanilla JS Version)
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('reservation-form');
  const formContainer = document.getElementById('form-container');
  const submitBtn = document.getElementById('submit-btn');
  const spinner = document.getElementById('spinner');
  const formError = document.getElementById('form-error');

  // Hardcoded configuration for Google Sheets integration (removing dependency on localStorage)
  const googleSheetsUrl = 'https://script.google.com/macros/s/AKfycbw2VIzTKkXeWz0uN18gc6m-QzmnfIvBdzNB4JOAzd8RJ8VB-wS4OMPBEjNWyAVNgGN1/exec';
  const isSyncEnabled = true;

  console.log('Google Sheets Sync ACTIVE');

  // Pick tomorrow as default booking date (convenient UX)
  const setTomorrowDefaultDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const yyyy = tomorrow.getFullYear();
    document.getElementById('reservationDate').value = `${yyyy}-${mm}-${dd}`;
    document.getElementById('reservationDate').min = `${yyyy}-${mm}-${dd}`;
  };
  setTomorrowDefaultDate();

  // Validate fields helper
  const validateForm = (data) => {
    let isValid = true;
    
    // Reset errors
    const errors = document.querySelectorAll('[id^="err-"]');
    errors.forEach(e => e.classList.add('hidden'));

    if (data.customerName.trim().length < 2) {
      document.getElementById('err-customerName').classList.remove('hidden');
      isValid = false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(data.email)) {
      document.getElementById('err-email').classList.remove('hidden');
      isValid = false;
    }

    const phonePattern = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    if (!phonePattern.test(data.phone.replace(/\s/g, ''))) {
      document.getElementById('err-phone').classList.remove('hidden');
      isValid = false;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (!data.reservationDate || data.reservationDate < todayStr) {
      document.getElementById('err-reservationDate').classList.remove('hidden');
      isValid = false;
    }

    return isValid;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.classList.add('hidden');

    const formData = new FormData(form);
    const payload = {
      customerName: formData.get('customerName').trim(),
      email: formData.get('email').trim(),
      phone: formData.get('phone').trim(),
      reservationDate: formData.get('reservationDate'),
      reservationTime: formData.get('reservationTime'),
      guests: parseInt(formData.get('guests')),
      specialRequest: formData.get('specialRequest').trim(),
    };

    console.log('[TableBook Client] Form payload collected:', payload);

    if (!validateForm(payload)) {
      console.warn('[TableBook Client] Validation failed for payload!');
      return;
    }

    // Show loading spinner
    submitBtn.disabled = true;
    spinner.classList.remove('hidden');

    try {
      console.log('Posting reservation to Apps Script');
      const postBody = {
        action: 'create',
        ...payload
      };
      
      console.log('[TableBook Client] Posting reservation to Apps Script. URL:', googleSheetsUrl, 'Payload:', postBody);

      const response = await fetch(googleSheetsUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(postBody)
      });

      console.log('[TableBook Client] Network reply status code:', response.status);
      const result = await response.json();
      console.log('[TableBook Client] Decoded JSON payload response:', result);

      if (result && result.status === 'success') {
        console.log('[TableBook Client] Reservation registered successfully.', result.data);
        displaySuccess(result.data);
        saveLocalBackup({
          id: result.data.id,
          ...payload,
          status: 'Pending',
          createdAt: result.data.createdAt
        });
      } else {
        console.error('[TableBook Client] Sheets API returned error state:', result);
        throw new Error(result.message || 'Sheets script execution error.');
      }

    } catch (err) {
      console.error('[TableBook Client] Integration Failure occurred, falling back to Local Sandbox:', err);
      
      // Fallback: Use Local Sandbox Mode only since Apps Script failed
      const generatedId = `RES-${Math.floor(100000 + Math.random() * 900000)}`;
      const localRecord = {
        id: generatedId,
        ...payload,
        status: 'Pending',
        createdAt: new Date().toISOString()
      };
      console.log('[TableBook Client] Local Sandbox fallback activated. Saved state record:', localRecord);
      saveLocalBackup(localRecord);
      displaySuccess(localRecord);

      // Show temporary inline warning informing that sync is local-only due to connectivity issue
      formError.textContent = `Note: Synced to local storage. (Connection Error: ${err.message || 'Check Apps Script endpoint'}).`;
      formError.classList.remove('hidden');
    }
  });

  const saveLocalBackup = (record) => {
    let current = [];
    const saved = localStorage.getItem('tablebook_reservations');
    if (saved) {
      try {
        current = JSON.parse(saved);
      } catch(e) {}
    }
    current.unshift(record);
    localStorage.setItem('tablebook_reservations', JSON.stringify(current));
  };

  const displaySuccess = (record) => {
    formContainer.innerHTML = `
      <div class="text-center space-y-6 py-6 animate-fade-in">
        <div class="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-sm flex items-center justify-center mx-auto shadow-inner">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>

        <div class="space-y-2">
          <h3 class="font-display font-bold text-2xl text-white tracking-tight">Booking Requested</h3>
          <p class="text-slate-400 text-xs max-w-sm mx-auto">Your table request is logged as Pending. Check details below:</p>
        </div>

        <div class="bg-[#0b0f19] border border-slate-800 rounded-sm p-5 text-left divide-y divide-slate-800 max-w-md mx-auto text-xs leading-relaxed font-mono">
          <div class="flex justify-between items-center pb-2 text-xxs">
            <span class="text-slate-500">REFERENCE:</span>
            <span class="text-amber-400 font-bold tracking-wider">${record.id}</span>
          </div>
          <div class="flex justify-between items-center py-2.5">
            <span class="text-slate-400">Customer:</span>
            <span class="text-white">${record.customerName}</span>
          </div>
          <div class="flex justify-between items-center py-2.5 font-sans">
            <span class="text-slate-400">Date & Time:</span>
            <span class="text-white font-mono font-semibold">${record.reservationDate} @ ${record.reservationTime}</span>
          </div>
        </div>

        <p class="text-[10px] text-slate-500 max-w-xs mx-auto leading-relaxed">
          Our team is coordinating tables. We will dispatch automated confirmations to <strong class="text-slate-300 font-normal">${record.email}</strong> as soon as the status updates.
        </p>

        <div class="pt-2">
          <button onclick="window.location.reload()" class="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-sm text-xs shadow-md transition-colors cursor-pointer">
            Book Another Visit
          </button>
        </div>
      </div>
    `;
  };

});
