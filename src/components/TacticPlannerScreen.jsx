import { Sidebar } from './Sidebar';
import { PlannerToolsPanel } from './PlannerToolsPanel';
import { PlanningHub } from './PlanningHub';
import { PlannerEntryModal } from './PlannerEntryModal';
import { usePlannerStore } from '../store/usePlannerStore';
import { useTranslation } from '../i18n/useTranslation';

export function TacticPlannerScreen() {
  const officeSession = usePlannerStore((s) => s.officeSession);
  const { t } = useTranslation();

  return (
    <div className="flex h-full overflow-hidden bg-[var(--sg-bg)]">
      {officeSession ? <Sidebar /> : <PlannerToolsPanel />}
      <PlanningHub title={officeSession ? t('officeSetup') : t('appTitle')} />
      <PlannerEntryModal />
    </div>
  );
}
