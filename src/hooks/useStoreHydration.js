import { useEffect, useState } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';

export function useStoreHydration() {
  const [hydrated, setHydrated] = useState(() => usePlannerStore.persist.hasHydrated());

  useEffect(() => {
    const unsub = usePlannerStore.persist.onFinishHydration(() => setHydrated(true));
    if (!usePlannerStore.persist.hasHydrated()) {
      void usePlannerStore.persist.rehydrate();
    }
    return unsub;
  }, []);

  return hydrated;
}
