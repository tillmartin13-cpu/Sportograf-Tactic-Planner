import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const ACADEMY_URL = 'https://sportografacademy2.super.site/';
const EM_URL = 'https://em2.sportograf.com/';

export { ACADEMY_URL, EM_URL };

export const usePhotographerStore = create(
  persist(
    (set, get) => ({
      // Photographer identity
      acronym: '',
      language: 'en',

      // Loaded tactics (array — one per event day)
      tactics: [],

      // Active tactic ID (when viewing detail)
      activeTacticId: null,

      // Active screen: 'home' | 'manager' | 'detail' | 'checkin'
      screen: 'home',

      // Check-in state per tactic: { [tacticId]: { steps, cameraCheckResult, completedAt } }
      checkIns: {},

      // ── Identity ─────────────────────────────────────────────────────────
      setAcronym: (acronym) => set({ acronym: acronym.toUpperCase().trim() }),
      setLanguage: (language) => set({ language }),

      // ── Tactics ──────────────────────────────────────────────────────────
      importTacticJson: (jsonText) => {
        let pkg;
        try {
          pkg = JSON.parse(jsonText);
        } catch {
          return { error: 'Invalid JSON file.' };
        }

        const event = pkg?.event;
        if (!event?.id) return { error: 'This file does not look like a valid tactic.' };

        const id = String(event.id);
        const existing = (get().tactics ?? []).find((t) => t.id === id);
        if (existing) {
          // Update existing
          set((s) => ({
            tactics: (s.tactics ?? []).map((t) => (t.id === id ? { id, importedAt: new Date().toISOString(), pkg } : t)),
          }));
          return { updated: true };
        }

        set((s) => ({
          tactics: [
            { id, importedAt: new Date().toISOString(), pkg },
            ...(s.tactics ?? []),
          ],
        }));
        return { created: true };
      },

      deleteTactic: (id) => {
        set((s) => ({
          tactics: (s.tactics ?? []).filter((t) => t.id !== id),
          checkIns: Object.fromEntries(Object.entries(s.checkIns).filter(([k]) => k !== id)),
          activeTacticId: s.activeTacticId === id ? null : s.activeTacticId,
          screen: s.activeTacticId === id ? 'manager' : s.screen,
        }));
      },

      goHome: () => set({ screen: 'home' }),
      goToTactics: () => set({ screen: 'manager' }),
      openTactic: (id) => set({ activeTacticId: id, screen: 'detail' }),
      closeDetail: () => set({ activeTacticId: null, screen: 'manager' }),
      openCheckIn: () => set({ screen: 'checkin' }),
      closeCheckIn: () => set({ screen: 'detail' }),

      // ── Check-in steps ───────────────────────────────────────────────────
      // steps: tutorials | settings | card | cameraCheck
      setCheckInStep: (tacticId, step, value) => {
        set((s) => ({
          checkIns: {
            ...s.checkIns,
            [tacticId]: {
              ...s.checkIns[tacticId],
              steps: {
                ...(s.checkIns[tacticId]?.steps || {}),
                [step]: value,
              },
            },
          },
        }));
      },

      setCameraCheckResult: (tacticId, result) => {
        set((s) => ({
          checkIns: {
            ...s.checkIns,
            [tacticId]: {
              ...s.checkIns[tacticId],
              cameraCheckResult: result,
            },
          },
        }));
      },

      setCameraCheckout: (tacticId, cameraModel, checked) => {
        set((s) => {
          const prev = s.checkIns[tacticId]?.cameraCheckouts ?? {};
          return {
            checkIns: {
              ...s.checkIns,
              [tacticId]: {
                ...s.checkIns[tacticId],
                cameraCheckouts: { ...prev, [cameraModel]: checked ? 'checked_out' : null },
              },
            },
          };
        });
      },

      completeCheckIn: (tacticId) => {
        set((s) => ({
          checkIns: {
            ...s.checkIns,
            [tacticId]: {
              ...s.checkIns[tacticId],
              completedAt: new Date().toISOString(),
            },
          },
        }));
      },

      // ── Helpers ──────────────────────────────────────────────────────────
      getActiveTactic: () => {
        const { tactics, activeTacticId } = get();
        return (tactics ?? []).find((t) => t.id === activeTacticId) ?? null;
      },

      getCheckIn: (tacticId) => get().checkIns[tacticId] ?? {},

      isCheckInComplete: (tacticId) => !!get().checkIns[tacticId]?.completedAt,

      // My spots for a given tactic (filtered by acronym)
      getMySpots: (tacticId) => {
        const { tactics, acronym } = get();
        const entry = (tactics ?? []).find((t) => t.id === tacticId);
        if (!entry) return [];
        const { tactic, photographers, assignments } = entry.pkg ?? {};
        const spots = tactic?.spots ?? [];
        const ph = (photographers ?? []).find(
          (p) => p.code === acronym || p.code === acronym.replace(/\d+$/, ''),
        );
        if (!ph) return spots; // if no match show all
        const mySpotIds = new Set(
          (assignments ?? []).filter((a) => a.photographer_id === ph.id).map((a) => a.spot_id),
        );
        return spots.filter((s) => mySpotIds.has(s.id));
      },
    }),
    {
      name: 'stp_photographer_v1',
      merge: (persisted, current) => ({
        ...current,
        ...persisted,
        tactics: Array.isArray(persisted?.tactics) ? persisted.tactics : [],
      }),
    },
  ),
);
