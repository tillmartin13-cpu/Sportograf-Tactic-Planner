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

export default function App() {
  const hydrated = useStoreHydration();
  const appScreen = usePlannerStore((s) => s.appScreen);
  const [tlUnlocked, setTlUnlocked] = useState(false);

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
