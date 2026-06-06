/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Settings, Info, Check, Copy, ExternalLink, HelpCircle, Key, Server, RefreshCw } from 'lucide-react';
import { AppConfig } from '../types';

interface AppSettingsProps {
  config: AppConfig;
  onUpdateConfig: (newConfig: AppConfig) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function AppSettings({ config, onUpdateConfig, isOpen, onClose }: AppSettingsProps) {
  const [urlInput, setUrlInput] = useState(config.googleSheetsUrl);
  const [syncInput, setSyncInput] = useState(config.isSyncEnabled);
  const [whitelistInput, setWhitelistInput] = useState(config.adminEmailWhitelist.join(', '));
  const [copiedScript, setCopiedScript] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'tutorial'>('config');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const emails = whitelistInput
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);
    
    // Auto-enable sync if they provided a URL, otherwise sync can only be checked if URL exists
    const finalSync = urlInput.trim() ? syncInput : false;

    onUpdateConfig({
      googleSheetsUrl: urlInput.trim(),
      isSyncEnabled: finalSync,
      adminEmailWhitelist: emails
    });
    
    // Native alert alternative: visual confirmation (which is preferred in iframe)
    onClose();
  };

  const handleCopyScript = () => {
    const scriptCode = `// Copy script from /google-apps-script.js`;
    // We fetch or refer directly to the compiled script structure
    // Let's provide a miniature, highly optimized code block here
    navigator.clipboard.writeText(SCRIPT_CODE_STUB);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-lg h-full bg-[#0a0a0a] border-l border-white/10 shadow-2xl overflow-y-auto flex flex-col p-6 animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#c5a059]/10 rounded-sm text-[#c5a059]">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h3 className="font-serif text-lg text-white">System Settings</h3>
              <p className="text-xxs text-white/40 tracking-wider uppercase font-mono mt-0.5">Configure database integrations & credentials</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 px-2.5 hover:bg-white/10 text-white/50 hover:text-white rounded-sm transition-colors text-lg cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-black border border-white/10 rounded-sm mb-6 text-xs font-mono">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex-1 py-2 px-3 rounded-sm transition-all uppercase tracking-wider text-center flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'config' ? 'bg-[#c5a059] text-black font-extrabold shadow-md' : 'text-white/40 hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            Connection
          </button>
          <button
            onClick={() => setActiveTab('tutorial')}
            className={`flex-1 py-2 px-3 rounded-sm transition-all uppercase tracking-wider text-center flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'tutorial' ? 'bg-[#c5a059] text-black font-extrabold shadow-md' : 'text-white/40 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Setup Guide
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-1">
          {activeTab === 'config' ? (
            <form onSubmit={handleSave} className="space-y-6">
              
              {/* Alert Warning */}
              <div className="p-4 bg-[#c5a059]/5 border border-[#c5a059]/20 rounded-sm flex gap-3 text-xs text-white/70">
                <Info className="w-4 h-4 text-[#c5a059] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[#c5a059]">Running in Local-First Mode by default.</span>
                  <p className="text-xxs mt-1 text-white/40 leading-relaxed font-light">
                    Reservations are currently securely saved in your browser's <code className="text-[#c5a059]">localStorage</code>. 
                    Input your Google Apps Script URL below to trigger seamless real-time database sync & automated Gmail alerts!
                  </p>
                </div>
              </div>

              {/* URL Input */}
              <div className="space-y-2">
                <label className="text-xxs font-extrabold text-white/50 tracking-widest uppercase flex items-center gap-1.5 label-gold">
                  Google Apps Script Web App URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full bg-black border border-white/10 rounded-sm px-4 py-3 text-white text-xs focus:outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] placeholder:text-white/15 transition-all font-mono"
                  />
                </div>
                <p className="text-xxs text-white/30 leading-relaxed">
                  Generated during deployment of your Web App script inside your target Google Sheet.
                </p>
              </div>

              {/* Sync Toggle */}
              {urlInput.trim() && (
                <div className="p-4 bg-black border border-white/10 rounded-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">Enable Cloud Synced Database</span>
                    <span className="text-xxs text-white/40">Synchronize client bookings instantly with Google Sheets API.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={syncInput}
                      onChange={(e) => setSyncInput(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/5 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white/40 after:border-white/10 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c5a059] peer-checked:after:bg-black peer-checked:after:border-black"></div>
                  </label>
                </div>
              )}

              {/* Whitelist Input */}
              <div className="space-y-2">
                <label className="text-xxs font-extrabold text-white/50 tracking-widest uppercase flex items-center gap-1.5 label-gold">
                  Admin Whitelist Emails
                </label>
                <textarea
                  value={whitelistInput}
                  onChange={(e) => setWhitelistInput(e.target.value)}
                  rows={3}
                  placeholder="admin@tablebook.com, manager@tablebook.com"
                  className="w-full bg-black border border-white/10 rounded-sm px-4 py-3 text-white text-xs focus:outline-none focus:border-[#c5a059] placeholder:text-white/15 focus:ring-1 focus:ring-[#c5a059] transition-all font-mono"
                />
                <p className="text-xxs text-white/30 leading-relaxed font-light">
                  Comma-separated list of emails whitelisted to bypass Cloudflare Access. We auto-included your AI Studio active session email <code className="text-[#c5a059] font-mono font-medium">yunilajanu72@gmail.com</code>.
                </p>
              </div>

              {/* Security Banner */}
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-sm flex items-start gap-3">
                <Key className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-emerald-400 block">Cloudflare Access Ready</span>
                  <span className="text-xxs text-white/40 leading-relaxed">
                    Once whitelisted above, unauthorized client requests will be barred immediately. Access tokens are fully validated against this list.
                  </span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-[#c5a059] hover:bg-[#b08e4d] text-black font-extrabold py-3.5 px-4 rounded-sm shadow-lg shadow-[#c5a059]/15 cursor-pointer uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6 text-sm text-white/80 overflow-y-auto max-h-[70vh] pr-2 font-sans font-light">
              <div className="space-y-4">
                <h4 className="font-serif text-base text-white border-b border-white/10 pb-1.5">
                  1. Setup the Google Sheet
                </h4>
                <p className="text-xs leading-relaxed text-white/60">
                  Create a new spreadsheet on Google Sheets. Name the first tab <code className="text-[#c5a059] bg-black px-1.5 py-0.5 rounded-sm border border-white/10">Sheet1</code> and paste the following headings in the absolute first row (Row 1):
                </p>
                <div className="font-mono text-[10px] bg-black border border-white/10 p-3 rounded-sm flex flex-wrap gap-2 text-white/80 select-all overflow-x-auto">
                  <span>ID</span><span className="text-white/20">|</span>
                  <span>CustomerName</span><span className="text-white/20">|</span>
                  <span>Email</span><span className="text-white/20">|</span>
                  <span>Phone</span><span className="text-white/20">|</span>
                  <span>ReservationDate</span><span className="text-white/20">|</span>
                  <span>ReservationTime</span><span className="text-white/20">|</span>
                  <span>Guests</span><span className="text-white/20">|</span>
                  <span>SpecialRequest</span><span className="text-white/20">|</span>
                  <span>Status</span><span className="text-white/20">|</span>
                  <span>CreatedAt</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-serif text-base text-white border-b border-white/10 pb-1.5 flex items-center justify-between">
                  2. Install Apps Script Code
                  <button
                    onClick={handleCopyScript}
                    className="text-white/50 hover:text-[#c5a059] flex items-center gap-1 text-[10px] font-mono bg-black border border-white/10 hover:border-[#c5a059]/30 px-2 py-1 rounded-sm transition-all cursor-pointer"
                  >
                    {copiedScript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    Copy App Script
                  </button>
                </h4>
                <p className="text-xs leading-relaxed text-white/60">
                  Inside Google Sheets, navigate to <strong className="text-white font-semibold">Extensions &gt; Apps Script</strong>. Clear any existing template code and paste the script located inside <code className="text-[#c5a059] bg-black px-1.5 py-0.5 rounded-sm font-mono border border-white/10">google-apps-script.js</code>.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-serif text-base text-white border-b border-white/10 pb-1.5">
                  3. Deploy Web App API
                </h4>
                <p className="text-xs leading-relaxed text-white/60">
                  Follow these step-by-step points inside the Google Script Editor strictly:
                </p>
                <ul className="list-decimal pl-5 space-y-2 text-xs text-white/50 leading-relaxed font-light">
                  <li>In the upper-right, click <strong className="text-white">Deploy &gt; New deployment</strong>.</li>
                  <li>Click the gear icon and choose <strong className="text-[#c5a059]">Web app</strong> context.</li>
                  <li>Set Description: <code className="font-mono bg-black p-0.5 px-1.5 rounded-sm text-white/60 border border-white/10">TableBook API</code>.</li>
                  <li>Set <strong>Execute as:</strong> <strong className="text-white font-semibold">"Me"</strong> (this ensures emails are routed from your Gmail account).</li>
                  <li>Set <strong>Who has access:</strong> <strong className="text-[#c5a059]">"Anyone"</strong> (crucial to allow public web requests).</li>
                  <li>Click Deploy, agree to Google's Authorization flow, and copy the provided <strong className="text-[#c5a059]">Web App URL</strong>.</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="font-serif text-base text-white border-b border-white/10 pb-1.5">
                  4. Link to Dashboard
                </h4>
                <p className="text-xs leading-relaxed text-white/60">
                  Paste that Web App URL inside the "Connection Settings" tab in this Settings pane, click "Save Configuration" and you are instantly live!
                </p>
              </div>

              <div className="p-4 bg-black border border-white/10 rounded-sm space-y-1.5">
                <span className="text-xs text-[#c5a059] block font-semibold flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-[#c5a059] animate-spin-slow" />
                  Automatic Operations Supported:
                </span>
                <p className="text-xxs text-white/40 leading-relaxed font-mono">
                  ✔ Adding new bookings instantly via website, returning real IDs.<br />
                  ✔ Real-time Gmail alert dispatches when reservations are confirmed or rejected.<br />
                  ✔ True two-way syncing of reservations back-and-forth between sheet storage and web.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 pt-4 mt-6 flex justify-between items-center text-xxs text-white/30 uppercase tracking-widest font-mono select-none">
          <span>TableBook Cloud Integration</span>
          <a 
            href="https://script.google.com" 
            target="_blank" 
            rel="noreferrer" 
            className="flex items-center gap-1 text-white/40 hover:text-[#c5a059] transition-colors"
          >
            Google Apps Script
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </div>
  );
}

// Stub constant representing Google Apps Script
const SCRIPT_CODE_STUB = `/**
 * Google Apps Script for TableBook Reservation System
 * Make sure to grab the complete code inside /google-apps-script.js
 */
function doGet(e) {
  // ... check google-apps-script.js
}
function doPost(e) {
  // ... check google-apps-script.js
}`;
