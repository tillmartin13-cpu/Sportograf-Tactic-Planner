import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { uid, normalizeEventId } from '../lib/id';
import { parseInfofile, infofileToTactic } from '../lib/parseInfofile';
import { parseGpx, trackToLatLng } from '../lib/parseGpx';
import { getGpxTracks } from '../lib/gpxTracks';
import { buildSpotResults, buildTrackMetrics, rematchPhotoSpot } from '../lib/trackMath';
import { detectSpotType } from '../lib/spotTypes';
import { isPhotoLocation } from '../lib/locationTypes';
import { parseKml } from '../lib/parseKml';
import { parseTeamCsv } from '../lib/csvImport';
import { windowsOverlap } from '../lib/timeConflict';
import { generateEventCode, normalizeEventCode, isValidEventCode, EVENT_CODE_LENGTH } from '../lib/eventCode';
import { REFERENCE_CODES } from '../lib/referenceCodes';
import { t as translate } from '../i18n/messages';
import { usePhotographerStore } from './usePhotographerStore';

const APP_SCREEN = {
  welcome: 'welcome',
  planner: 'planner',
  photographer: 'photographer',
};

function withEventCode(event) {
  if (!event) return event;
  if (event.eventCode && event.eventCode.length === EVENT_CODE_LENGTH) return event;
  return { ...event, eventCode: generateEventCode() };
}

const TACTIC_KEY = (eventId) => `stp_tactic_${eventId}`;

function loadTactic(eventId) {
  try {
    const raw = localStorage.getItem(TACTIC_KEY(eventId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveTactic(eventId, tactic) {
  try {
    localStorage.setItem(TACTIC_KEY(eventId), JSON.stringify(tactic));
  } catch {
    /* quota or private mode — planner still works in memory */
  }
}

function emptyTactic() {
  return {
    spots: [],
    assignments: [],
    referenceSpots: [],
    referenceTimeline: [],
    showReferenceLayer: true,
    gpxTracks: [],
    gpxTrack: [],
    importedFrom: null,
  };
}

function snapshotReferenceSpots(spots) {
  return JSON.parse(JSON.stringify(spots || []));
}

function normalizeTactic(raw) {
  if (!raw || typeof raw !== 'object') return emptyTactic();
  let gpxTracks = Array.isArray(raw.gpxTracks) ? raw.gpxTracks : [];
  if (!gpxTracks.length && Array.isArray(raw.gpxTrack) && raw.gpxTrack.length) {
    const points = raw.gpxTrack.map(([lat, lng]) => ({ lat, lng }));
    const { cumKm, totalKm } = buildTrackMetrics(points);
    gpxTracks = [{ name: 'route', points, cumKm, totalKm }];
  }
  const gpxTrack =
    Array.isArray(raw.gpxTrack) && raw.gpxTrack.length
      ? raw.gpxTrack
      : gpxTracks.length
        ? trackToLatLng(gpxTracks[0])
        : [];

  return {
    ...emptyTactic(),
    ...raw,
    spots: Array.isArray(raw.spots) ? raw.spots : [],
    assignments: Array.isArray(raw.assignments) ? raw.assignments : [],
    referenceSpots: Array.isArray(raw.referenceSpots) ? raw.referenceSpots : [],
    showReferenceLayer: raw.showReferenceLayer !== false,
    gpxTracks,
    gpxTrack,
  };
}

function rematchAllPhotoSpots(spots, tracks) {
  return spots.map((spot) => (isPhotoLocation(spot) ? rematchPhotoSpot(spot, tracks) : spot));
}

function photographerIndex(photographers) {
  const map = new Map();
  (photographers || []).forEach((p) => map.set(p.code, p.id));
  return map;
}

function normalizeStoredState(state) {
  if (!state) return state;
  return {
    ...state,
    events: (state.events || []).map(withEventCode).filter(Boolean),
    photographers: Array.isArray(state.photographers) ? state.photographers : [],
    currentEventId: state.currentEventId || null,
  };
}

export const usePlannerStore = create(
  persist(
    (set, get) => ({
      events: [],
      photographers: [],
      language: 'en',
      currentEventId: null,
      appScreen: APP_SCREEN.welcome,
      officeSession: false,
      showPlannerEntryModal: false,
      photographerPackage: null,
      mapExpanded: false,
      spotModal: { open: false, mode: 'create', spotId: null, lat: null, lng: null },
      toast: null,
      tacticRevision: 0,
      checkInRevision: 0,

      setLanguage: (language) => set({ language }),

      showToast: (message, duration = 2600) => {
        set({ toast: message });
        setTimeout(() => {
          if (get().toast === message) set({ toast: null });
        }, duration);
      },

      setMapExpanded: (mapExpanded) => set({ mapExpanded }),

      openCreateSpotModal: (lat, lng, prefill = null) =>
        set({
          spotModal: { open: true, mode: 'create', spotId: null, lat, lng, prefill },
        }),

      openEditSpotModal: (spotId) => {
        const tactic = get().getTactic(get().currentEventId);
        const spot = tactic.spots.find((s) => s.id === spotId);
        if (!spot) return;
        set({
          spotModal: {
            open: true,
            mode: 'edit',
            spotId,
            lat: spot.latitude,
            lng: spot.longitude,
          },
        });
      },

      closeSpotModal: () =>
        set({
          spotModal: { open: false, mode: 'create', spotId: null, lat: null, lng: null, prefill: null },
        }),

      saveSpotFromModal: ({
        mode,
        spotId,
        locationType,
        name,
        notes,
        lat,
        lng,
        kmOverrides = {},
        refImages = [],
      }) => {
        const event = get().getCurrentEvent();
        if (!event) return;

        const tactic = get().getTactic(event.id);
        const tracks = getGpxTracks(tactic);
        const isPhoto = locationType === 'photo';

        let finalLat = lat;
        let finalLng = lng;
        let results = [];

        if (isPhoto && tracks.length) {
          const built = buildSpotResults(lat, lng, tracks, kmOverrides, true);
          finalLat = built.snapped.lat;
          finalLng = built.snapped.lng;
          results = built.results;
        }

        if (mode === 'edit' && spotId) {
          const spots = tactic.spots.map((s) =>
            s.id === spotId
              ? {
                  ...s,
                  name,
                  location_type: locationType,
                  spot_type: detectSpotType(name),
                  notes,
                  refImages,
                  ...(isPhoto
                    ? {
                        latitude: finalLat,
                        longitude: finalLng,
                        results,
                        km_mark: results[0]?.km ?? s.km_mark,
                      }
                    : {
                        latitude: lat,
                        longitude: lng,
                        results: [],
                        km_mark: null,
                      }),
                }
              : s,
          );
          get().updateTactic(event.id, { spots });
          get().closeSpotModal();
          get().showToast(`Spot "${name}" updated.`);
          return;
        }

        const spot = {
          id: uid('spot'),
          name,
          location_type: locationType,
          spot_type: detectSpotType(name),
          position: tactic.spots.length,
          km_mark: results[0]?.km ?? null,
          latitude: finalLat,
          longitude: finalLng,
          results,
          time_from: '',
          time_to: '',
          tele: true,
          wide: false,
          notes: notes || '',
          refImages,
        };

        let assignments = [...tactic.assignments];
        if (isPhoto) {
          // Match photographer by exact code OR stripping trailing digits (TILL2 → TILL)
          const ph = get().photographers.find(
            (p) => p.code === name || p.code === name.replace(/\d+$/, ''),
          );
          if (ph && !assignments.some((a) => a.spot_id === spot.id && a.photographer_id === ph.id)) {
            assignments.push({
              id: uid('asg'),
              spot_id: spot.id,
              photographer_id: ph.id,
              time_from: '',
              time_to: '',
              tele: true,
              wide: false,
            });
          }
        }

        get().updateTactic(event.id, {
          spots: [...tactic.spots, spot],
          assignments,
        });
        get().closeSpotModal();
        get().showToast(`Spot "${name}" saved.`);
      },

      movePhotoSpot: (spotId, lat, lng) => {
        const event = get().getCurrentEvent();
        if (!event) return;
        const tactic = get().getTactic(event.id);
        const tracks = getGpxTracks(tactic);
        const spots = tactic.spots.map((s) => {
          if (s.id !== spotId || !isPhotoLocation(s)) return s;
          return rematchPhotoSpot({ ...s, latitude: lat, longitude: lng }, tracks);
        });
        get().updateTactic(event.id, { spots });
        get().showToast('Spot updated.');
      },

      bumpCheckInRevision: () => set((state) => ({ checkInRevision: state.checkInRevision + 1 })),

      exitToWelcome: () =>
        set({
          appScreen: APP_SCREEN.welcome,
          officeSession: false,
          showPlannerEntryModal: false,
          photographerPackage: null,
          mapExpanded: false,
        }),

      openTacticPlanner: () =>
        set({
          appScreen: APP_SCREEN.planner,
          officeSession: false,
          showPlannerEntryModal: true,
          currentEventId: null, // intentional: new event flow
          photographerPackage: null,
          mapExpanded: false,
        }),

      closePlannerEntryModal: () => set({ showPlannerEntryModal: false }),

      openOfficePlanner: () => {
        set({
          appScreen: APP_SCREEN.planner,
          officeSession: true,
          showPlannerEntryModal: false,
          currentEventId: null,
          photographerPackage: null,
          mapExpanded: false,
        });
      },

      applyReferenceCode: async (rawCode) => {
        const lang = get().language;
        const code = normalizeEventCode(rawCode);
        if (!isValidEventCode(code)) {
          get().showToast(translate(lang, 'invalidCodeLength'));
          return false;
        }
        const event = get().getCurrentEvent();
        if (!event) {
          get().showToast(translate(lang, 'referenceNeedsEvent'));
          return false;
        }
        const entry = REFERENCE_CODES[code];
        if (!entry || String(entry[0]) !== String(event.id)) {
          get().showToast(translate(lang, 'codeEventMismatch'));
          return false;
        }
        const predecessorId = entry[1];
        let text;
        try {
          const res = await fetch(`/infofiles/${predecessorId}.txt`);
          if (!res.ok) {
            get().showToast(translate(lang, 'referenceFileNotFound'));
            return false;
          }
          text = await res.text();
        } catch {
          get().showToast(translate(lang, 'referenceFileFetchError'));
          return false;
        }
        try {
          const parsed = parseInfofile(text);
          const tracks = getGpxTracks(get().getTactic(event.id));
          const converted = infofileToTactic(parsed, photographerIndex(get().photographers));
          const matched = rematchAllPhotoSpots(converted.spots, tracks);
          // Build per-photographer timeline from raw camera data
          const referenceTimeline = [];
          for (const rawSpot of parsed.rawSpots) {
            for (const cam of rawSpot.cameras) {
              if (cam.code && cam.time_from && cam.time_to) {
                referenceTimeline.push({
                  code: cam.code,
                  spotName: rawSpot.name,
                  time_from: cam.time_from,
                  time_to: cam.time_to,
                  images: cam.images || 0,
                });
              }
            }
          }
          get().updateTactic(event.id, {
            referenceSpots: snapshotReferenceSpots(matched),
            referenceTimeline,
            showReferenceLayer: true,
            referenceImportedFrom: {
              eventId: predecessorId,
              eventDate: parsed.meta.date || '',
              at: new Date().toISOString(),
            },
          });
        } catch {
          get().showToast(translate(lang, 'referenceFileParseError'));
          return false;
        }
        set({ showPlannerEntryModal: false, officeSession: false });
        get().showToast(translate(lang, 'referenceAccessGranted'));
        return true;
      },

      toggleReferenceLayer: () => {
        const event = get().getCurrentEvent();
        if (!event) return;
        const tactic = get().getTactic(event.id);
        get().updateTactic(event.id, { showReferenceLayer: !tactic.showReferenceLayer });
      },

      openPhotographerImport: () => {
        usePhotographerStore.getState().goHome();
        set({
          appScreen: APP_SCREEN.photographer,
          photographerPackage: null,
        });
      },

      importPhotographerJson: (text) => {
        try {
          const data = JSON.parse(text);
          const format = data._sportograf?.format;
          if (!format || !data.event || !data.tactic) {
            get().showToast('Invalid tactic JSON file.');
            return false;
          }
          if (!['tactic-package', 'tactic-planner-draft'].includes(format)) {
            get().showToast('Unsupported tactic file format.');
            return false;
          }
          set({
            appScreen: APP_SCREEN.photographer,
            photographerPackage: {
              event: data.event,
              photographers: data.photographers || [],
              tactic: data.tactic,
              meta: data._sportograf,
            },
          });
          get().showToast('Tactic loaded.');
          return true;
        } catch {
          get().showToast('Could not read JSON file.');
          return false;
        }
      },

      copyEventCode: async (eventId) => {
        const event = get().events.find((e) => e.id === eventId);
        if (!event?.eventCode) {
          get().showToast('No event code for this event.');
          return;
        }
        try {
          await navigator.clipboard.writeText(event.eventCode);
          get().showToast('Event code copied.');
        } catch {
          get().showToast(`Code: ${event.eventCode}`);
        }
      },

      regenerateEventCode: (eventId) => {
        const nextCode = generateEventCode();
        get().updateEvent(eventId, { eventCode: nextCode });
        get().showToast('New event code generated.');
        return nextCode;
      },

      createEvent: ({ id, name, eventDate }) => {
        const lang = get().language;
        try {
          const eventId = normalizeEventId(id);
          if (!eventId) {
            get().showToast(translate(lang, 'eventIdRequired'));
            return null;
          }
          if (get().events.some((e) => e.id === eventId)) {
            get().showToast(`Event ${eventId} already exists.`);
            return null;
          }
          const event = withEventCode({
            id: eventId,
            name: (name || '').trim(),
            eventDate: eventDate || '',
            predecessorEventId: '',
            createdAt: Date.now(),
          });
          saveTactic(eventId, emptyTactic());
          set({
            events: [event, ...get().events],
            currentEventId: eventId,
            appScreen: APP_SCREEN.planner,
            officeSession: false,
            showPlannerEntryModal: false,
            mapExpanded: false,
          });
          get().showToast(translate(lang, 'eventCreated').replace('{id}', eventId));
          return event;
        } catch (err) {
          get().showToast(err?.message || 'Could not create event.');
          return null;
        }
      },

      updateEventType: (eventId, eventType) =>
        set((state) => ({
          events: state.events.map((e) =>
            e.id === eventId ? { ...e, eventType } : e,
          ),
        })),

      selectEvent: (eventId) =>
        set({
          currentEventId: eventId,
          mapExpanded: false,
          appScreen: APP_SCREEN.planner,
          showPlannerEntryModal: false,
          officeSession: false,
        }),

      deleteEvent: (eventId) => {
        if (!window.confirm(`Delete event ${eventId}?`)) return;
        localStorage.removeItem(TACTIC_KEY(eventId));
        set((state) => ({
          events: state.events.filter((e) => e.id !== eventId),
          currentEventId: state.currentEventId === eventId ? null : state.currentEventId,
        }));
        get().showToast('Event deleted.');
      },

      updateEvent: (eventId, patch) => {
        set((state) => ({
          events: state.events.map((e) => (e.id === eventId ? { ...e, ...patch } : e)),
        }));
      },

      getCurrentEvent: () => {
        const { events, currentEventId } = get();
        return events.find((e) => e.id === currentEventId) || null;
      },

      getTactic: (eventId = get().currentEventId) => {
        if (!eventId) return emptyTactic();
        return normalizeTactic(loadTactic(eventId));
      },

      updateTactic: (eventId, patch) => {
        if (!eventId) return;
        const current = loadTactic(eventId) || emptyTactic();
        const next = { ...current, ...patch };
        saveTactic(eventId, next);
        set((state) => ({ tacticRevision: state.tacticRevision + 1 }));
      },

      removeGpxTrack: (eventId, trackIndex) => {
        if (!eventId) return;
        const tactic = loadTactic(eventId) || emptyTactic();
        const tracks = getGpxTracks(tactic);
        const next = tracks.filter((_, i) => i !== trackIndex);
        const gpxTrack = next.length ? trackToLatLng(next[0]) : [];
        get().updateTactic(eventId, { gpxTracks: next, gpxTrack });
        get().showToast(`Track removed.`);
      },

      importTeamCsv: (text) => {
        const lang = get().language;
        try {
          const { eventId, eventName, eventDate, predecessorEventId, photographers } = parseTeamCsv(text);
          let targetEventId = eventId || get().currentEventId;

          if (!targetEventId) {
            get().showToast('CSV needs an ID column or open an event first.');
            return false;
          }

          targetEventId = normalizeEventId(targetEventId);
          let events = [...get().events];
          let existing = events.find((e) => e.id === targetEventId);

          const eventPatch = {};
          if (eventName) eventPatch.name = eventName;
          if (eventDate) eventPatch.eventDate = eventDate;
          if (predecessorEventId) eventPatch.predecessorEventId = predecessorEventId;

          if (!existing) {
            existing = withEventCode({
              id: targetEventId,
              name: eventName || '',
              eventDate: eventDate || '',
              predecessorEventId: predecessorEventId || '',
              createdAt: Date.now(),
            });
            events = [existing, ...events];
            saveTactic(targetEventId, emptyTactic());
          } else if (Object.keys(eventPatch).length) {
            existing = { ...existing, ...eventPatch };
            events = events.map((e) => (e.id === targetEventId ? existing : e));
          }

          const merged = [...get().photographers];
          photographers.forEach((incoming) => {
            const idx = merged.findIndex((p) => p.code === incoming.code);
            if (idx >= 0) {
              const { id: _dropId, ...rest } = incoming;
              const existingEventIds = merged[idx].eventIds || (merged[idx].eventId ? [merged[idx].eventId] : []);
              const eventIds = existingEventIds.includes(targetEventId)
                ? existingEventIds
                : [...existingEventIds, targetEventId];
              merged[idx] = { ...merged[idx], ...rest, eventIds };
            } else {
              merged.push({ ...incoming, eventIds: [targetEventId] });
            }
          });

          const tactic = loadTactic(targetEventId) || emptyTactic();
          const hasReference = tactic.referenceSpots && tactic.referenceSpots.length > 0;
          set({
            events,
            photographers: merged,
            currentEventId: targetEventId,
            appScreen: APP_SCREEN.planner,
            officeSession: false,
            showPlannerEntryModal: !hasReference,
          });
          get().showToast(
            translate(lang, 'csvImported')
              .replace('{n}', String(photographers.length))
              .replace('{id}', targetEventId),
          );
          return true;
        } catch (err) {
          get().showToast(err?.message || 'Could not import team CSV.');
          return false;
        }
      },

      importInfofile: (text) => {
        const event = get().getCurrentEvent();
        if (!event) {
          get().showToast('Open or create an event first.');
          return;
        }

        const parsed = parseInfofile(text);
        const index = photographerIndex(get().photographers);
        const converted = infofileToTactic(parsed, index);

        const missing = converted.photographerCodes.filter((code) => !index.has(code));
        if (missing.length) {
          const add = window.confirm(
            `${missing.length} photographer codes from the infofile are not in your team yet.\n\nAdd them automatically? (${missing.slice(0, 8).join(', ')}${missing.length > 8 ? '…' : ''})`,
          );
          if (add) {
            const extra = missing.map((code) => ({
              id: uid('ph'),
              code,
              firstName: '',
              lastName: '',
              email: '',
              phone: '',
              cameras: '',
              lenses: '',
            }));
            const mergedPhotographers = [...get().photographers, ...extra];
            set({ photographers: mergedPhotographers });
            const reconverted = infofileToTactic(parsed, photographerIndex(mergedPhotographers));
            const tracks = getGpxTracks(get().getTactic(event.id));
            const matched = rematchAllPhotoSpots(reconverted.spots, tracks);
            get().updateTactic(event.id, {
              spots: matched,
              referenceSpots: snapshotReferenceSpots(matched),
              showReferenceLayer: true,
              assignments: reconverted.assignments,
              importedFrom: {
                type: 'infofile',
                eventId: parsed.meta.eventId || event.id,
                eventDate: parsed.meta.date || '',
                at: new Date().toISOString(),
              },
            });
            get().showToast(`Imported ${reconverted.spots.length} spots from infofile.`);
            return;
          }
        }

        const tracks = getGpxTracks(get().getTactic(event.id));
        const matched = rematchAllPhotoSpots(converted.spots, tracks);
        get().updateTactic(event.id, {
          spots: matched,
          referenceSpots: snapshotReferenceSpots(matched),
          showReferenceLayer: true,
          assignments: converted.assignments,
          importedFrom: {
            type: 'infofile',
            eventId: parsed.meta.eventId || event.id,
            eventDate: parsed.meta.date || '',
            at: new Date().toISOString(),
          },
        });
        get().showToast(`Imported ${converted.spots.length} spots from infofile.`);
      },

      loadGpx: async (file) => {
        const event = get().getCurrentEvent();
        if (!event) {
          get().showToast('Open or create an event first.');
          return;
        }
        const text = await file.text();
        try {
          const track = parseGpx(text, file.name);
          const tactic = get().getTactic(event.id);
          const gpxTracks = [...getGpxTracks(tactic), track];
          const gpxTrack = trackToLatLng(track);
          const spots = rematchAllPhotoSpots(tactic.spots, gpxTracks);
          get().updateTactic(event.id, { gpxTracks, gpxTrack, spots });
          get().showToast(`"${track.name}" loaded · ${track.totalKm.toFixed(1)} km`);
        } catch (err) {
          get().showToast(err.message || 'GPX import failed.');
        }
      },

      importKml: async (file) => {
        const event = get().getCurrentEvent();
        if (!event) {
          get().showToast('Open or create an event first.');
          return;
        }
        try {
          let kmlText = '';
          const lowerName = file.name.toLowerCase();
          if (lowerName.endsWith('.kmz')) {
            const { default: JSZip } = await import('jszip');
            const zip = await JSZip.loadAsync(await file.arrayBuffer());
            let kmlFile = null;
            zip.forEach((path, entry) => {
              if (!kmlFile && path.toLowerCase().endsWith('.kml')) kmlFile = entry;
            });
            if (!kmlFile) throw new Error('No KML found inside KMZ.');
            kmlText = await kmlFile.async('string');
          } else {
            kmlText = await file.text();
          }

          const { spots: incomingSpots, tracks: kmlTracks } = parseKml(kmlText);
          const tactic = get().getTactic(event.id);
          let spots = incomingSpots;

          if (incomingSpots.length > 0 && tactic.spots.length > 0) {
            const add = window.confirm(
              `Add ${incomingSpots.length} spots from KML to the existing ${tactic.spots.length} spots?\n\nOK = Add · Cancel = Replace all spots`,
            );
            spots = add
              ? [
                  ...tactic.spots,
                  ...incomingSpots.map((spot, index) => ({
                    ...spot,
                    position: tactic.spots.length + index,
                  })),
                ]
              : incomingSpots;
          }

          // Merge KML tracks with any existing GPX tracks
          const existingTracks = getGpxTracks(tactic);
          const mergedTracks = kmlTracks.length > 0 ? [...existingTracks, ...kmlTracks] : existingTracks;

          const update = {
            spots: rematchAllPhotoSpots(spots, mergedTracks),
            importedFrom: { type: 'kml', fileName: file.name, at: new Date().toISOString() },
          };
          if (kmlTracks.length > 0) update.gpxTracks = mergedTracks;

          get().updateTactic(event.id, update);

          const parts = [];
          if (incomingSpots.length > 0) parts.push(`${incomingSpots.length} spots`);
          if (kmlTracks.length > 0) parts.push(`${kmlTracks.length} route${kmlTracks.length > 1 ? 's' : ''}`);
          get().showToast(`KML imported: ${parts.join(' + ') || 'no data found'}.`);
        } catch (err) {
          get().showToast(err?.message || 'KML import failed.');
        }
      },

      addSpot: () => {
        const event = get().getCurrentEvent();
        if (!event) return;
        const tactic = get().getTactic(event.id);
        const spot = {
          id: uid('spot'),
          name: `Spot ${tactic.spots.length + 1}`,
          location_type: 'photo',
          spot_type: 'custom',
          position: tactic.spots.length,
          km_mark: null,
          latitude: null,
          longitude: null,
          results: [],
          time_from: '',
          time_to: '',
          tele: true,
          wide: false,
          notes: '',
        };
        get().updateTactic(event.id, { spots: [...tactic.spots, spot] });
      },

      updateSpot: (spotId, patch) => {
        const event = get().getCurrentEvent();
        if (!event) return;
        const tactic = get().getTactic(event.id);
        get().updateTactic(event.id, {
          spots: tactic.spots.map((s) => (s.id === spotId ? { ...s, ...patch } : s)),
        });
      },

      removeSpot: (spotId) => {
        const event = get().getCurrentEvent();
        if (!event) return;
        const tactic = get().getTactic(event.id);
        get().updateTactic(event.id, {
          spots: tactic.spots.filter((s) => s.id !== spotId),
          assignments: tactic.assignments.filter((a) => a.spot_id !== spotId),
        });
      },

      assignPhotographer: (spotId, photographer, options = {}) => {
        const event = get().getCurrentEvent();
        if (!event) return false;
        const tactic = get().getTactic(event.id);
        const spot = tactic.spots.find((s) => s.id === spotId);
        if (!spot) return false;

        const existingForPhotographer = tactic.assignments.filter((a) => a.photographer_id === photographer.id);
        const conflicts = existingForPhotographer.filter((a) => {
          const otherSpot = tactic.spots.find((s) => s.id === a.spot_id);
          if (!otherSpot) return false;
          return windowsOverlap(
            a.time_from || otherSpot.time_from,
            a.time_to || otherSpot.time_to,
            spot.time_from,
            spot.time_to,
          );
        });

        if (conflicts.length && !options.force) {
          const otherSpot = tactic.spots.find((s) => s.id === conflicts[0].spot_id);
          const ok = window.confirm(
            `Time conflict!\n\n${photographer.code} is already planned at "${otherSpot?.name || 'another spot'}".\n\nAssign to "${spot.name}" anyway?`,
          );
          if (!ok) return false;
        }

        const already = tactic.assignments.some(
          (a) => a.spot_id === spotId && a.photographer_id === photographer.id,
        );
        if (already) return true;

        const assignment = {
          id: uid('asg'),
          spot_id: spotId,
          photographer_id: photographer.id,
          time_from: spot.time_from || '',
          time_to: spot.time_to || '',
          tele: true,
          wide: false,
        };

        get().updateTactic(event.id, {
          assignments: [...tactic.assignments, assignment],
        });
        return true;
      },

      unassignPhotographer: (spotId, photographerId) => {
        const event = get().getCurrentEvent();
        if (!event) return;
        const tactic = get().getTactic(event.id);
        get().updateTactic(event.id, {
          assignments: tactic.assignments.filter(
            (a) => !(a.spot_id === spotId && a.photographer_id === photographerId),
          ),
        });
      },

      replacePhotographer: (photographerId, { code, firstName }) => {
        const trimCode = code.trim().toUpperCase();
        if (!trimCode) return false;
        set((state) => ({
          photographers: state.photographers.map((p) =>
            p.id === photographerId
              ? { ...p, code: trimCode, firstName: (firstName || '').trim() }
              : p,
          ),
        }));
        return true;
      },

      deletePhotographer: (photographerId) => {
        const eventId = get().currentEventId;
        set((state) => ({
          photographers: state.photographers.filter((p) => p.id !== photographerId),
        }));
        if (eventId) {
          const tactic = get().getTactic(eventId);
          get().updateTactic(eventId, {
            assignments: tactic.assignments.filter((a) => a.photographer_id !== photographerId),
          });
        }
        return true;
      },

      addPhotographerManually: ({ code, firstName, lastName, cameras }) => {
        const eventId = get().currentEventId;
        if (!eventId) return false;
        const trimmed = code.trim().toUpperCase();
        if (!trimmed) return false;
        const existing = get().photographers.find((p) => p.code === trimmed && (p.eventIds || []).includes(eventId));
        if (existing) {
          get().showToast(`${trimmed} already in team.`);
          return false;
        }
        const ph = {
          id: uid(),
          code: trimmed,
          firstName: (firstName || '').trim(),
          lastName: (lastName || '').trim(),
          cameras: (cameras || '').trim(),
          eventIds: [eventId],
        };
        set({ photographers: [...get().photographers, ph] });
        return true;
      },

      importTacticJson: async (text) => {
        const lang = get().language;
        try {
          const pkg = JSON.parse(text);
          if (!pkg._sportograf || !pkg.event) {
            get().showToast('Invalid tactic JSON file.');
            return false;
          }
          const { event, photographers, tactic } = pkg;
          const eventId = normalizeEventId(event.id);
          if (!eventId) { get().showToast('JSON missing valid event ID.'); return false; }

          const existing = get().events.find((e) => e.id === eventId);
          if (existing) {
            // Update tactic and photographers but keep existing event entry
            if (tactic) saveTactic(eventId, tactic);
            if (Array.isArray(photographers)) set({ photographers });
            set({ currentEventId: eventId, appScreen: APP_SCREEN.planner, showPlannerEntryModal: false, mapExpanded: false });
            get().showToast(`Event ${eventId} updated from JSON.`);
          } else {
            const newEvent = withEventCode({
              id: eventId,
              name: (event.name || '').trim(),
              eventDate: event.eventDate || '',
              predecessorEventId: event.predecessorEventId || '',
              eventType: event.eventType || '',
              createdAt: Date.now(),
            });
            if (tactic) saveTactic(eventId, tactic);
            set({
              events: [newEvent, ...get().events],
              photographers: Array.isArray(photographers) ? photographers : get().photographers,
              currentEventId: eventId,
              appScreen: APP_SCREEN.planner,
              showPlannerEntryModal: false,
              mapExpanded: false,
            });
            get().showToast(translate(lang, 'eventCreated').replace('{id}', eventId));
          }
          return true;
        } catch (err) {
          get().showToast('Failed to import JSON: ' + (err?.message || 'unknown error'));
          return false;
        }
      },

      exportTacticJson: (forTeam = false) => {
        const event = get().getCurrentEvent();
        if (!event) return;
        const tactic = get().getTactic(event.id);
        const photographers = get().photographers;
        const { eventCode, ...publicEvent } = event;
        const payload = {
          _sportograf: {
            format: forTeam ? 'tactic-package' : 'tactic-planner-draft',
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
          },
          event: forTeam ? publicEvent : event,
          photographers,
          tactic,
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = forTeam
          ? `SportografTactic_${event.id}_team.json`
          : `SportografTactic_${event.id}_backup.json`;
        a.click();
        URL.revokeObjectURL(url);
        get().showToast(forTeam ? 'Team tactic JSON exported.' : 'Backup exported.');
      },
    }),
    {
      name: 'stp_planner_v2',
      partialize: (state) => ({
        events: (state.events || []).map(withEventCode).filter(Boolean),
        photographers: Array.isArray(state.photographers) ? state.photographers : [],
        language: state.language,
        currentEventId: state.currentEventId || null,
      }),
      merge: (persisted, current) =>
        normalizeStoredState({
          ...current,
          ...persisted,
          photographerPackage: null,
        }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        Object.assign(state, normalizeStoredState(state));
        state.photographerPackage = null;
      },
    },
  ),
);
