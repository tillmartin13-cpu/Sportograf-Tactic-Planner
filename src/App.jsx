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

const MAINTENANCE_MODE = true;

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
