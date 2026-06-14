import { useEffect, useState } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { usePhotographerStore } from '../store/usePhotographerStore';

export function useStoreHydration() {
  const [hydrated, setHydrated] = useState(
    () => usePlannerStore.persist.hasHydrated() && usePhotographerStore.persist.hasHydrated(),
  );

  useEffect(() => {
    let plannerDone = usePlannerStore.persist.hasHydrated();
    let photographerDone = usePhotographerStore.persist.hasHydrated();

    const markReady = () => {
      if (plannerDone && photographerDone) setHydrated(true);
    };

    const unsubPlanner = usePlannerStore.persist.onFinishHydration(() => {
      plannerDone = true;
      markReady();
    });
    const unsubPhotographer = usePhotographerStore.persist.onFinishHydration(() => {
      photographerDone = true;
      markReady();
    });

    if (!plannerDone) void usePlannerStore.persist.rehydrate();
    if (!photographerDone) void usePhotographerStore.persist.rehydrate();

    return () => {
      unsubPlanner();
      unsubPhotographer();
    };
  }, []);

  return hydrated;
}
