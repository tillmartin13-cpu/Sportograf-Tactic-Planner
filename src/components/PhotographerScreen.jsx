import { PhotographerApp } from './photographer/PhotographerApp';
import { usePlannerStore } from '../store/usePlannerStore';

export function PhotographerScreen() {
  const exitToWelcome = usePlannerStore((s) => s.exitToWelcome);
  return <PhotographerApp onExit={exitToWelcome} />;
}
