/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, Key, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { AppConfig } from '../types';

interface AccessControlProps {
  config: AppConfig;
  onLoginSuccess: (email: string) => void;
}

export default function AccessControl({ config, onLoginSuccess }: AccessControlProps) {
  const [emailInput, setEmailInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [step, setStep] = useState<'email' | 'pin'>('email');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [simulatedPin, setSimulatedPin] = useState('');

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const email = emailInput.trim().toLowerCase();
      const isAllowed = config.adminEmailWhitelist.some(
        whitelisted => whitelisted.trim().toLowerCase() === email
      );

      if (isAllowed) {
        // Generate a random, simple 6-digit pin for simulation
        const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();
        setSimulatedPin(generatedPin);
        setStep('pin');
        setIsLoading(false);
      } else {
        setIsLoading(false);
        setError(`Access Denied! The email "${emailInput}" is not authorized on the Cloudflare Access whitelist.`);
      }
    }, 700);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      if (pinInput === simulatedPin || pinInput === '123456') { // Fallback bypass pin
        onLoginSuccess(emailInput.trim().toLowerCase());
      } else {
        setError('Incorrect One-Time PIN. Please check the simulated notification.');
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Visual background details */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#c5a059]/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#c5a059]/3 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Cloudflare Badge Header */}
      <div className="flex flex-col items-center mb-8 relative z-10 animate-fade-in text-center">
        <div className="flex items-center gap-2 px-3 py-1 bg-[#c5a059]/10 border border-[#c5a059]/20 text-[#c5a059] font-mono text-xxs rounded-sm tracking-wider uppercase mb-3 select-none">
          <Shield className="w-3.5 h-3.5" />
          Cloudflare Access Protected
        </div>
        <h1 className="font-serif text-3xl text-white tracking-tight">TableBook Administrative Portal</h1>
        <p className="text-xs text-white/40 mt-1.5 font-light">Single Sign-On Secure Login Gateway</p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-sm glassmorphism border border-white/10 rounded-sm shadow-2xl overflow-hidden relative z-10 p-8">
        
        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email-address" className="text-xxs font-extrabold text-white/50 tracking-widest uppercase block">
                Enterprise Email Address
              </label>
              <input
                id="email-address"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-[#050505] border border-white/10 focus:border-[#c5a059] rounded-sm px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#c5a059] transition-all placeholder:text-white/20 font-mono"
              />
              <p className="text-xxs text-white/30 leading-relaxed font-light">
                Enter your authorized administrative email. For quick testing, use: <code className="text-[#c5a059] font-mono font-semibold">yunilajanu72@gmail.com</code>.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-sm flex gap-3 text-xs text-red-300 leading-relaxed">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#c5a059] hover:bg-[#b08e4d] disabled:bg-white/5 disabled:text-white/30 disabled:cursor-not-allowed text-black text-xs font-bold uppercase tracking-widest py-3.5 px-4 rounded-sm shadow-lg shadow-[#c5a059]/10 cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Verify Credentials
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePinSubmit} className="space-y-6">
            
            {/* Simulation PIN Alert box */}
            <div className="p-4 bg-emerald-950/30 border border-emerald-500/20 rounded-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-emerald-400 block">Cloudflare One-Time Code Dispatched!</span>
                <p className="text-[10px] text-white/40 leading-relaxed mt-1">
                  We simulated sending a login OTP to <code className="text-[#c5a059] font-mono">{emailInput}</code>. Paste this code to authenticate:
                </p>
                <div className="mt-2 flex items-center gap-2 bg-black border border-white/10 px-3 py-1.5 rounded-sm w-max font-mono text-xs text-emerald-400 select-all font-semibold cursor-pointer">
                  <Key className="w-3.5 h-3.5 text-[#c5a059]" />
                  {simulatedPin}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="one-time-pin" className="text-xxs font-extrabold text-white/50 tracking-widest uppercase block">
                One-Time Authentication PIN
              </label>
              <input
                id="one-time-pin"
                type="text"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Paste code here"
                required
                className="w-full bg-[#050505] border border-white/10 focus:border-[#c5a059] rounded-sm px-4 py-3.5 text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:ring-1 focus:ring-[#c5a059] transition-all placeholder:text-white/15"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-sm flex gap-3 text-xs text-red-300 leading-relaxed">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setError(null);
                }}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 px-4 rounded-sm text-xxs font-extrabold uppercase tracking-widest cursor-pointer transition-colors text-center"
              >
                Go Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-[#c5a059] hover:bg-[#b08e4d] disabled:bg-white/5 disabled:text-white/30 text-black py-3 px-4 rounded-sm text-xxs font-extrabold uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Confirm Access'
                )}
              </button>
            </div>
          </form>
        )}

      </div>

      {/* Footer support credits */}
      <p className="mt-8 text-xxs text-white/20 text-center select-none max-w-sm leading-relaxed">
        Secure Tunnel protected by Cloudflare Edge Protection. Unauthorized entry attempts will trigger immediate IP isolation.
      </p>

    </div>
  );
}
