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
    <div className="flex min-h-full flex-col items-center justify-center bg-[#0f1a3d] px-6 text-center">
      <img src="/sg-logo-white.svg" alt="Sportograf" className="mb-8 h-10 opacity-90" />
      <div className="mb-3 flex items-center gap-2 text-amber-400 text-sm font-semibold tracking-widest uppercase">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Wartung
      </div>
      <h1 className="mb-4 text-3xl font-black text-white leading-tight">
        Tactic Planner
      </h1>
      <p className="max-w-sm text-[#8a9ac8] text-sm leading-relaxed">
        Das Tool wird gerade weiterentwickelt und ist vorübergehend nicht verfügbar.
        <br className="hidden sm:block" />
        Wir sind bald wieder da.
      </p>
      <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-xs text-[#6b7db3]">
        Sportograf · internal planning tool
      </div>
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
