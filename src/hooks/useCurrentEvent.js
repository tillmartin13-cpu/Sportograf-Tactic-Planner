import { usePlannerStore } from '../store/usePlannerStore';

export function useCurrentEvent() {
  const events = usePlannerStore((s) => s.events);
  const currentEventId = usePlannerStore((s) => s.currentEventId);
  return events.find((e) => e.id === currentEventId) || null;
}
