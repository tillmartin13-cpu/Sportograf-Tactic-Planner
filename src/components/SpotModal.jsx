import { useEffect, useMemo, useState } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { useCurrentEvent } from '../hooks/useCurrentEvent';
import { useTactic } from '../hooks/useTactic';
import { LOCATION_TYPES } from '../lib/locationTypes';
import { TRACK_COLORS } from '../lib/locationTypes';
import { findAmbiguous, nearestKm } from '../lib/trackMath';
import { getGpxTracks } from '../lib/gpxTracks';
import { getSpotNavUrls } from '../lib/navUrls';
import { extractCoords } from '../lib/extractCoords';
import { compressImageFile, MAX_REF_IMAGES } from '../lib/compressImage';

function KmPreview({ lat, lng, tracks, kmOverrides, onToggleKm }) {
  if (!tracks.length) {
    return <p className="text-xs text-[#8a93b0]">Load a GPX route to see km marks and ambiguity hints.</p>;
  }

  return (
    <div className="rounded-lg bg-[#f6f8ff] p-2.5">
      {tracks.map((track, trackIndex) => {
        const color = TRACK_COLORS[trackIndex % TRACK_COLORS.length];
        const ambig = findAmbiguous(lat, lng, track);

        if (ambig) {
          return (
            <div key={track.name + trackIndex} className="border-b border-[#e8ebf4] py-2 last:border-0">
              <div className="mb-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                <span className="flex-1 text-xs text-[#5b6aa8]">{track.name}</span>
                <span className="rounded bg-[#FEF3C7] px-1.5 py-0.5 text-[10px] font-bold text-[#BA7517]">
                  Ambiguous
                </span>
              </div>
              <p className="mb-1.5 pl-4 text-[10px] text-[#8a93b0]">
                Route passes here more than once — select one or both:
              </p>
              <div className="flex flex-wrap gap-1.5 pl-4">
                {ambig.map((a) => {
                  const selected = (kmOverrides[trackIndex] || []).some(
                    (km) => Math.abs(km - a.km) < 0.05,
                  );
                  return (
                    <button
                      key={`${trackIndex}-${a.km}`}
                      type="button"
                      onClick={() => onToggleKm(trackIndex, a.km)}
                      className={`rounded-md border px-2 py-1 text-[11px] font-extrabold ${
                        selected
                          ? 'border-[#1C2B6B] bg-[#1C2B6B] text-white'
                          : 'border-[#1C2B6B] bg-white text-[#1C2B6B]'
                      }`}
                    >
                      KM {a.km.toFixed(1)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }

        const match = nearestKm(lat, lng, track);
        return (
          <div key={track.name + trackIndex} className="flex items-center gap-2 border-b border-[#e8ebf4] py-2 last:border-0">
            <span className="h-2 w-2 rounded-full" style={{ background: color }} />
            <span className="flex-1 text-xs text-[#5b6aa8]">{track.name}</span>
            <span className="text-sm font-extrabold text-[#1C2B6B]">KM {match.km.toFixed(1)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function SpotModal() {
  const spotModal = usePlannerStore((s) => s.spotModal);
  const closeSpotModal = usePlannerStore((s) => s.closeSpotModal);
  const saveSpotFromModal = usePlannerStore((s) => s.saveSpotFromModal);
  const removeSpot = usePlannerStore((s) => s.removeSpot);
  const event = useCurrentEvent();
  const tactic = useTactic(event?.id);
  const photographers = usePlannerStore((s) => s.photographers) || [];

  const [locationType, setLocationType] = useState('photo');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [pasteCoords, setPasteCoords] = useState(null);
  const [tab, setTab] = useState('map');
  const [kmOverrides, setKmOverrides] = useState({});
  const [refImages, setRefImages] = useState([]);

  const editingSpot = spotModal?.mode === 'edit' && spotModal.spotId
    ? tactic.spots.find((s) => s.id === spotModal.spotId)
    : null;

  const tracks = getGpxTracks(tactic);

  const coords = useMemo(() => {
    if (tab === 'paste' && pasteCoords) return pasteCoords;
    if (spotModal?.lat != null && spotModal?.lng != null) {
      return { lat: spotModal.lat, lng: spotModal.lng };
    }
    return null;
  }, [tab, pasteCoords, spotModal]);

  useEffect(() => {
    if (!spotModal?.open) return;
    setKmOverrides({});
    setPasteText('');
    setPasteCoords(null);
    setTab('map');

    if (editingSpot) {
      setLocationType(editingSpot.location_type || 'photo');
      setName(editingSpot.name || '');
      setNotes(editingSpot.notes || '');
      setRefImages(editingSpot.refImages || []);
    } else {
      setLocationType('photo');
      setName('');
      setNotes('');
      setRefImages([]);
    }
  }, [spotModal?.open, spotModal?.spotId, editingSpot?.id]);

  if (!spotModal?.open || !event) return null;

  const nav = coords ? getSpotNavUrls(coords.lat, coords.lng) : null;
  const isPhoto = locationType === 'photo';

  const toggleKm = (trackIndex, km) => {
    setKmOverrides((prev) => {
      const next = { ...prev };
      const list = [...(next[trackIndex] || [])];
      const idx = list.findIndex((v) => Math.abs(v - km) < 0.05);
      if (idx >= 0) list.splice(idx, 1);
      else list.push(km);
      if (list.length) next[trackIndex] = list;
      else delete next[trackIndex];
      return next;
    });
  };

  const resolvePaste = () => {
    const found = extractCoords(pasteText);
    if (!found) {
      usePlannerStore.getState().showToast('Location not recognised.');
      return;
    }
    setPasteCoords({ lat: found.lat, lng: found.lng });
    setKmOverrides({});
  };

  const handleSave = () => {
    if (!coords) {
      usePlannerStore.getState().showToast(tab === 'paste' ? 'Resolve the location first.' : 'No pin placed.');
      return;
    }
    const label = name.trim().toUpperCase();
    if (isPhoto && !label) {
      usePlannerStore.getState().showToast('Please enter a photographer acronym.');
      return;
    }
    if (!isPhoto && !name.trim()) {
      usePlannerStore.getState().showToast('Please enter a label.');
      return;
    }

    saveSpotFromModal({
      mode: spotModal.mode,
      spotId: spotModal.spotId,
      locationType,
      name: isPhoto ? label : name.trim(),
      notes: notes.trim(),
      lat: coords.lat,
      lng: coords.lng,
      kmOverrides,
      refImages,
    });
  };

  const handleRefPick = async (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = '';
    if (!files.length) return;
    let next = [...refImages];
    for (const file of files) {
      if (next.length >= MAX_REF_IMAGES) break;
      try {
        const img = await compressImageFile(file);
        next = [...next, img];
      } catch {
        usePlannerStore.getState().showToast('Could not load image.');
      }
    }
    if (refImages.length >= MAX_REF_IMAGES) {
      usePlannerStore.getState().showToast(`Max ${MAX_REF_IMAGES} photos per spot.`);
    }
    setRefImages(next.slice(0, MAX_REF_IMAGES));
  };

  const handleDelete = () => {
    if (!editingSpot || !window.confirm(`Delete spot "${editingSpot.name}"?`)) return;
    removeSpot(editingSpot.id);
    closeSpotModal();
  };

  return (
    <div className="fixed inset-0 z-[8000] flex items-end justify-center bg-black/45 p-4 sm:items-center">
      <div className="sg-card flex max-h-[92vh] w-full max-w-lg flex-col overflow-y-auto p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="sg-card-title">{spotModal.mode === 'edit' ? 'Edit spot' : 'New spot'}</h2>
          <button type="button" onClick={closeSpotModal} className="text-lg text-[#ccc] hover:text-[var(--sg-navy)]">
            ✕
          </button>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
              {Object.values(LOCATION_TYPES).map((type) => {
                const active = locationType === type.id;
                const isPhotoType = type.id === 'photo';
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setLocationType(type.id)}
                    className={`rounded-lg border px-3 py-2 text-xs font-extrabold ${
                      active
                        ? isPhotoType
                          ? 'border-[#CC2B2B] bg-[#fff5f5] text-[#CC2B2B]'
                          : 'border-[#2196F3] bg-[#eff6ff] text-[#1C2B6B]'
                        : 'border-[#ddd] bg-white text-[#555]'
                    }`}
                  >
                    {type.emoji ? `${type.emoji} ` : ''}
                    {type.label}
                  </button>
                );
              })}
        </div>

        {spotModal.mode === 'create' && (
          <>
            <div className="mb-3 flex gap-2">
              <button
                type="button"
                onClick={() => setTab('map')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${tab === 'map' ? 'bg-[#1C2B6B] text-white' : 'bg-[#f0f2f8] text-[#5b6aa8]'}`}
              >
                Map pin
              </button>
              <button
                type="button"
                onClick={() => setTab('paste')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${tab === 'paste' ? 'bg-[#1C2B6B] text-white' : 'bg-[#f0f2f8] text-[#5b6aa8]'}`}
              >
                Paste location
              </button>
            </div>

            {tab === 'paste' && (
              <div className="mb-3">
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Google Maps, WhatsApp or lat,lng"
                  className="sg-input min-h-[72px] text-sm"
                />
                <button type="button" onClick={resolvePaste} className="sg-btn mt-2 w-full text-sm">
                  Resolve location
                </button>
                {pasteCoords && (
                  <p className="mt-2 text-xs font-semibold text-[#166534]">
                    ✓ {pasteCoords.lat.toFixed(5)}, {pasteCoords.lng.toFixed(5)}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {coords && (
          <p className="mb-3 rounded-lg bg-[#f6f8ff] px-3 py-2 text-xs font-semibold text-[#5b6aa8]">
            📍 {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            {spotModal.mode === 'edit' && (
              <span className="mt-0.5 block text-[10px] font-normal text-[#8a93b0]">
                Move photo spots by dragging on the map
              </span>
            )}
          </p>
        )}

        {isPhoto ? (
          <label className="mb-3 block">
            <span className="text-[10px] font-bold uppercase tracking-wide text-[#bbb]">Photographer acronym</span>
            <input
              list="team-acronym-list"
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              className="sg-input mt-1.5 font-mono font-bold uppercase"
              placeholder="e.g. KG"
            />
            <datalist id="team-acronym-list">
              {photographers.map((p) => (
                <option key={p.id} value={p.code}>
                  {[p.firstName, p.lastName].filter(Boolean).join(' ')}
                </option>
              ))}
            </datalist>
          </label>
        ) : (
          <label className="mb-3 block">
            <span className="text-[10px] font-bold uppercase tracking-wide text-[#bbb]">Label</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="sg-input mt-1.5 text-sm"
              placeholder="Meeting point, parking…"
            />
          </label>
        )}

        {isPhoto && coords && spotModal.mode === 'create' && (
          <div className="mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wide text-[#bbb]">Route match</span>
            <div className="mt-1.5">
              <KmPreview
                lat={coords.lat}
                lng={coords.lng}
                tracks={tracks}
                kmOverrides={kmOverrides}
                onToggleKm={toggleKm}
              />
            </div>
          </div>
        )}

        {editingSpot?.results?.length > 0 && (
          <div className="mb-3 rounded-lg bg-[#f6f8ff] p-2.5 text-xs text-[#5b6aa8]">
            {editingSpot.results.map((r, i) => (
              <div key={i} className="flex justify-between py-0.5">
                <span>{r.trackName}</span>
                <span className="font-extrabold text-[#1C2B6B]">KM {r.km?.toFixed?.(1) ?? r.km}</span>
              </div>
            ))}
          </div>
        )}

        {coords && nav && (
          <div className="mb-3 flex gap-2">
            <a
              href={nav.streetView}
              target="_blank"
              rel="noreferrer"
              className="flex flex-1 items-center justify-center rounded-lg bg-[#4285F4] px-2 py-2.5 text-xs font-bold text-white"
            >
              Street View
            </a>
            <a
              href={nav.mapillary}
              target="_blank"
              rel="noreferrer"
              className="flex flex-1 items-center justify-center rounded-lg bg-[#1DB846] px-2 py-2.5 text-xs font-bold text-white"
            >
              Mapillary
            </a>
          </div>
        )}

        <label className="mb-4 block">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#bbb]">Comment (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 500))}
            className="sg-input mt-1.5 min-h-[60px] text-sm"
          />
        </label>

        <div className="mb-4">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#bbb]">
            Reference photos ({refImages.length}/{MAX_REF_IMAGES})
          </span>
          {refImages.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {refImages.map((img, idx) => (
                <div key={img.name + idx} className="relative h-16 w-16 overflow-hidden rounded-lg border border-[#e3e7f2]">
                  <img src={img.data} alt={img.name} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setRefImages(refImages.filter((_, i) => i !== idx))}
                    className="absolute right-0.5 top-0.5 rounded-full bg-black/60 px-1.5 text-[10px] text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {refImages.length < MAX_REF_IMAGES && (
            <label className="sg-btn mt-2 block w-full cursor-pointer text-center text-sm">
              Add reference photo
              <input type="file" accept="image/*" className="hidden" onChange={handleRefPick} />
            </label>
          )}
        </div>

        <div className="flex gap-2">
          {spotModal.mode === 'edit' && (
            <button type="button" onClick={handleDelete} className="sg-btn !border-[#fecaca] !text-[#991b1b] text-sm">
              Delete
            </button>
          )}
          <button type="button" onClick={closeSpotModal} className="sg-btn flex-1 text-sm">
            Cancel
          </button>
          <button type="button" onClick={handleSave} className="sg-btn sg-btn-navy flex-1 text-sm">
            Save spot
          </button>
        </div>
      </div>
    </div>
  );
}
