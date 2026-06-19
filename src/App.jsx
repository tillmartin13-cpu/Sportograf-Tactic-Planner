import { useState } from 'react';
import { usePlannerStore } from './store/usePlannerStore';
import { useStoreHydration } from './hooks/useStoreHydration';
import { WelcomeScreen } from './components/WelcomeScreen';
import { TacticPlannerScreen } from './components/TacticPlannerScreen';
import { PhotographerScreen } from './components/PhotographerScreen';
import { TLPasswordGate } from './components/TLPasswordGate';
import { Toast } from './components/Toast';
import { CsvDiffModal } from './components/CsvDiffModal';
import { ErrorBoundary } from './components/ErrorBoundary';

const MAINTENANCE_MODE = false;
const APP_PASSWORD = '0750';

function PasswordGate({ onUnlock }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (value === APP_PASSWORD) {
      sessionStorage.setItem('app_unlocked', '1');
      onUnlock();
    } else {
      setError(true);
      setValue('');
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#111827',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '24px',
      padding: '32px',
      textAlign: 'center',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <img src="/sg-logo-white.svg" alt="Sportograf" style={{ height: 28, opacity: 0.6 }} />
      <div style={{ color: '#6b7db3', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        Geschützter Bereich
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 260 }}>
        <input
          autoFocus
          type="password"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(false); }}
          placeholder="Passwort"
          style={{
            background: '#1f2937',
            border: error ? '1.5px solid #f87171' : '1.5px solid #374151',
            borderRadius: 10,
            color: '#e5e7eb',
            fontSize: 16,
            padding: '10px 14px',
            outline: 'none',
            textAlign: 'center',
            letterSpacing: '0.2em',
          }}
        />
        {error && <div style={{ color: '#f87171', fontSize: 12 }}>Falsches Passwort</div>}
        <button
          type="submit"
          style={{
            background: '#1C2B6B',
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
            padding: '10px 14px',
          }}
        >
          Zugang
        </button>
      </form>
    </div>
  );
}

function MaintenancePage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#111827',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '24px',
      padding: '32px',
      textAlign: 'center',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <img src="/sg-logo-white.svg" alt="Sportograf" style={{ height: 32, opacity: 0.7 }} />
      <p style={{ color: '#6b7db3', fontSize: 13, lineHeight: 1.7, maxWidth: 320, margin: 0 }}>
        Dieses Tool befindet sich aktuell in der Wartung und ist vorübergehend nicht verfügbar.
      </p>
    </div>
  );
}

export default function App() {
  const hydrated = useStoreHydration();
  const appScreen = usePlannerStore((s) => s.appScreen);
  const [tlUnlocked, setTlUnlocked] = useState(false);
  if (MAINTENANCE_MODE) return <MaintenancePage />;

  if (!hydrated) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--sg-bg)] text-sm text-[var(--sg-muted)]">
        Loading…
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-full overflow-hidden">
        {appScreen === 'welcome' && <WelcomeScreen tlUnlocked={tlUnlocked} onTLUnlock={() => setTlUnlocked(true)} />}
        {appScreen === 'planner' && !tlUnlocked && <TLPasswordGate onUnlock={() => setTlUnlocked(true)} />}
        {appScreen === 'planner' && tlUnlocked && <TacticPlannerScreen />}
        {appScreen === 'photographer' && <PhotographerScreen />}
        <Toast />
        <CsvDiffModal />
      </div>
    </ErrorBoundary>
  );
}
