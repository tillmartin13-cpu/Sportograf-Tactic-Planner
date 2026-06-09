import { useMemo } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';

export function useTactic(eventId) {
  const tacticRevision = usePlannerStore((s) => s.tacticRevision);
  const getTactic = usePlannerStore((s) => s.getTactic);

  return useMemo(() => getTactic(eventId), [getTactic, eventId, tacticRevision]);
}
