import { useState } from 'react';

const TL_PASSWORD = 'TL365ONLY';

export function TLPasswordGate({ onUnlock }) {
  const [value, setValue] = useState('');
  const [shake, setShake] = useState(false);
  const [showPw, setShowPw] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (value.toUpperCase() === TL_PASSWORD) {
      onUnlock();
    } else {
      setShake(true);
      setValue('');
      setTimeout(() => setShake(false), 600);
    }
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-[#1C2B6B]">
      <div className="w-full max-w-sm px-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="text-xl font-extrabold text-white">Team Leader Area</h1>
          <p className="mt-1 text-sm text-white/50">Enter your TL password to continue</p>
        </div>

        <form onSubmit={handleSubmit} className={shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}>
          <style>{`
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              20% { transform: translateX(-8px); }
              40% { transform: translateX(8px); }
              60% { transform: translateX(-6px); }
              80% { transform: translateX(6px); }
            }
          `}</style>

          <div className="relative mb-4">
            <input
              type={showPw ? 'text' : 'password'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Password"
              autoFocus
              autoComplete="current-password"
              className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3.5 pr-12 text-base font-semibold text-white placeholder-white/30 outline-none focus:border-white/50 focus:bg-white/15"
            />
            <button
              type="button"
              onClick={() => setShowPw((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white/70"
              tabIndex={-1}
            >
              {showPw ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={!value}
            className="w-full rounded-2xl bg-white py-3.5 text-base font-bold text-[#1C2B6B] transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-40"
          >
            Unlock →
          </button>
        </form>
      </div>
    </div>
  );
}
