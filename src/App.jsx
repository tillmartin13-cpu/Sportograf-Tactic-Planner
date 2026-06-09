import { usePlannerStore } from './store/usePlannerStore';
import { useStoreHydration } from './hooks/useStoreHydration';
import { WelcomeScreen } from './components/WelcomeScreen';
import { TacticPlannerScreen } from './components/TacticPlannerScreen';
import { PhotographerScreen } from './components/PhotographerScreen';
import { Toast } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const hydrated = useStoreHydration();
  const appScreen = usePlannerStore((s) => s.appScreen);

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
        {appScreen === 'welcome' && <WelcomeScreen />}
        {appScreen === 'planner' && <TacticPlannerScreen />}
        {appScreen === 'photographer' && <PhotographerScreen />}
        <Toast />
      </div>
    </ErrorBoundary>
  );
}
