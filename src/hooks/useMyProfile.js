import { usePhotographerStore } from '../store/usePhotographerStore';

/**
 * Returns the photographer profile that matches the current acronym,
 * pulled from a given tactic's pkg.photographers array.
 */
export function useMyProfile(pkg) {
  const acronym = usePhotographerStore((s) => s.acronym);

  if (!acronym || !pkg?.photographers?.length) return null;

  const match = pkg.photographers.find(
    (p) =>
      p.code?.toUpperCase() === acronym ||
      p.code?.toUpperCase() === acronym.replace(/\d+$/, ''),
  );

  return match ?? null;
}
