import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import { TRACK_COLORS } from '../../lib/locationTypes';
import { buildSpotMarkerHtml } from '../../lib/spotMarkerHtml';
import L from 'leaflet';
import { usePhotographerStore } from '../../store/usePhotographerStore';
import { useMyProfile } from '../../hooks/useMyProfile';
import { formatTimeShort } from '../../lib/timeConflict';
import { findAllCameraSettings } from '../../lib/cameraSettings';
import { useWeather, wmoToEmoji, getPhotoTips } from '../../hooks/useWeather';
import 'leaflet/dist/leaflet.css';

// ─── Navigation options ───────────────────────────────────────────────────────

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

function navOptions(lat, lng) {
  const coord = `${lat},${lng}`;
  const options = [
    {
      id: 'googlemaps',
      label: 'Google Maps',
      img: '/mymaps.png',
      imgClass: 'h-6 w-6 object-contain',
      url: `https://www.google.com/maps/dir/?api=1&destination=${coord}&travelmode=driving`,
    },
    {
      id: 'waze',
      label: 'Waze',
      img: '/Waze_logo_2022.png',
      // Wide logo — show only the ghost (right side) via object-right
      imgClass: 'h-6 w-6 object-cover object-right',
      url: `https://waze.com/ul?ll=${coord}&navigate=yes`,
    },
    {
      id: 'komoot',
      label: 'Komoot',
      img: '/Komoot-logo-type.svg.png',
      // Wide logo — show only the circle (left side) via object-left
      imgClass: 'h-6 w-6 object-cover object-left',
      url: `https://www.komoot.com/plan/@${lat},${lng},15z`,
    },
  ];

  if (isIOS()) {
    options.splice(1, 0, {
      id: 'applemaps',
      label: 'Apple Maps',
      img: '/Apple_Maps_iOS_26_icon.png',
      imgClass: 'h-6 w-6 object-contain',
      url: `maps://maps.apple.com/?daddr=${coord}&dirflg=d`,
    });
  }

  return options;
}

// Street View first (more commonly used), Mapillary second
const VIEW_OPTIONS = (lat, lng) => [
  {
    id: 'streetview',
    label: 'Street View',
    img: '/streetview.png',
    url: `https://www.google.com/maps?q=&layer=c&cbll=${lat},${lng}`,
  },
  {
    id: 'mapillary',
    label: 'Mapillary',
    img: '/mapillary.png',
    url: `https://www.mapillary.com/app/?lat=${lat}&lng=${lng}&z=17`,
  },
];

// ─── Navigate dropdown ────────────────────────────────────────────────────────

// PWA-safe external link opener — target="_blank" is unreliable in iOS standalone mode
function openExternal(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function NavigateButton({ lat, lng }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    // Use touchend (not touchstart) — touchstart fires before tap completes
    // and closes the dropdown before the user can select an option
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchend', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchend', handler);
    };
  }, [open]);

  const options = navOptions(lat, lng);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold text-gray-500 hover:bg-[#f0f2fa] hover:text-[#1C2B6B] transition-colors active:bg-[#f0f2fa]"
      >
        <span className="flex items-center gap-1">
          <img src="/mymaps.png" alt="Navigate" className="h-5 w-5 object-contain" />
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
        Navigate
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => { setOpen(false); openExternal(opt.url); }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-[#f0f2fa] hover:text-[#1C2B6B] transition-colors active:bg-[#f0f2fa]"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded">
                <img src={opt.img} alt={opt.label} className={opt.imgClass} />
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Personalized profile card ───────────────────────────────────────────────

function ProfileCard({ profile, spotCount }) {
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.name || profile.code;
  const cameras = profile.cameras || profile.equipment || '';
  const lenses = profile.lenses || '';
  const flashes = profile.flashes || '';
  const dispatch = profile.dispatch || '';

  const camSettings = cameras ? findAllCameraSettings(cameras) : [];

  return (
    <div className="rounded-2xl border border-[#1C2B6B]/20 bg-[#f0f2fa] p-4">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1C2B6B] text-sm font-extrabold text-white">
          {profile.code}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-extrabold text-[#1C2B6B] leading-tight">{fullName}</div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <span className="rounded-full bg-[#1C2B6B]/10 px-2 py-0.5 text-[10px] font-bold text-[#1C2B6B]">
              📷 {spotCount} spot{spotCount !== 1 ? 's' : ''}
            </span>
            {dispatch && (
              <span className="rounded-full bg-[#1C2B6B]/10 px-2 py-0.5 text-[10px] font-bold text-[#1C2B6B]">
                📍 {dispatch.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Equipment */}
      {cameras && (
        <div className="mt-3 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#1C2B6B]/50">Equipment</div>
          <div className="text-xs text-[#1C2B6B]/80 leading-snug">{cameras}</div>

          {/* Camera settings recommendations */}
          {camSettings.length > 0 && (
            <div className="mt-2 space-y-1">
              {camSettings.map((s, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
                  <span className="text-[11px] font-extrabold text-[#1C2B6B] min-w-[80px]">{s.model}</span>
                  <span className="text-[10px] text-gray-500">
                    {s.imageSize} · {s.jpeg}
                  </span>
                </div>
              ))}
            </div>
          )}

          {lenses && (
            <div className="text-[10px] text-[#1C2B6B]/60 leading-snug">
              <span className="font-bold">Lenses: </span>{lenses}
            </div>
          )}
          {flashes && (
            <div className="text-[10px] text-[#1C2B6B]/60 leading-snug">
              <span className="font-bold">Flash: </span>{flashes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Spot card ────────────────────────────────────────────────────────────────

function SpotCard({ spot, index }) {
  const lat = spot.latitude;
  const lng = spot.longitude;
  const hasCoords = lat != null && lng != null;
  const viewOptions = hasCoords ? VIEW_OPTIONS(lat, lng) : [];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Main info */}
      <div className="p-4">
        <div className="font-bold text-[#1C2B6B] leading-snug">
          <span className="mr-1 font-normal text-gray-400">#{index + 1}</span>
          {spot.name}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {(spot.time_from || spot.time_to) && (
            <span className="rounded-full bg-[#f0f2fa] px-2 py-0.5 text-[11px] font-semibold text-[#1C2B6B]">
              🕐 {formatTimeShort(spot.time_from)}–{formatTimeShort(spot.time_to)}
            </span>
          )}
          {spot.km_mark != null && (
            <span className="rounded-full bg-[#f0f2fa] px-2 py-0.5 text-[11px] font-semibold text-[#1C2B6B]">
              📍 {Number(spot.km_mark).toFixed(1)} km
            </span>
          )}
        </div>
        {spot.notes && (
          <p className="mt-2 text-xs text-gray-500">{spot.notes}</p>
        )}

        {/* Reference photos */}
        {spot.refImages?.length > 0 && (
          <div className="mt-3">
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Reference photos
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {spot.refImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => openExternal(img.data)}
                  className="shrink-0"
                >
                  <img
                    src={img.data}
                    alt={img.name || `ref-${idx}`}
                    className="h-24 w-24 rounded-xl object-cover border border-gray-200 active:opacity-80"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action bar */}
      {hasCoords && (
        <div className="flex border-t border-gray-100">
          {/* View options — window.open for PWA/iOS standalone compatibility */}
          {viewOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => openExternal(opt.url)}
              className="flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold text-gray-500 hover:bg-[#f0f2fa] hover:text-[#1C2B6B] transition-colors border-r border-gray-100 active:bg-[#f0f2fa]"
            >
              <img src={opt.img} alt={opt.label} className="h-5 w-5 object-contain" />
              {opt.label}
            </button>
          ))}
          {/* Navigate dropdown */}
          <div className="flex-1">
            <NavigateButton lat={lat} lng={lng} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Spot map ────────────────────────────────────────────────────────────────

// Fix Leaflet default marker icons (missing in bundlers)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Track direction arrows (same logic as TacticMap) ────────────────────────

function DirectionArrows({ track, color }) {
  const map = useMap();
  const markers = useMemo(() => {
    if (!track?.points?.length || track.points.length < 2) return [];
    const count = Math.max(3, Math.min(15, Math.floor((track.totalKm || 0) / 2)));
    const intervalKm = (track.totalKm || 1) / (count + 1);
    let nextKm = intervalKm;
    const arrows = [];
    for (let i = 1; i < track.points.length; i++) {
      if ((track.cumKm?.[i] ?? i / track.points.length * (track.totalKm || 1)) < nextKm) continue;
      nextKm += intervalKm;
      const p1 = track.points[i];
      const p2 = track.points[Math.min(i + 10, track.points.length - 1)];
      const deg = (Math.atan2(p2.lng - p1.lng, p2.lat - p1.lat) * 180) / Math.PI;
      const html = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14"><polygon points="7,1 11,11 7,8 3,11" fill="${color}" opacity="0.75" stroke="rgba(255,255,255,0.6)" stroke-width="0.8" stroke-linejoin="round" transform="rotate(${deg.toFixed(1)},7,7)"/></svg>`;
      arrows.push({ key: `${i}`, pos: [p1.lat, p1.lng], icon: L.divIcon({ className: '', html, iconSize: [14, 14], iconAnchor: [7, 7] }) });
      if (nextKm > (track.totalKm || 0)) break;
    }
    return arrows;
  }, [track, color]);

  useEffect(() => {
    const refs = markers.map((a) => L.marker(a.pos, { icon: a.icon, interactive: false, zIndexOffset: -200 }).addTo(map));
    return () => refs.forEach((m) => m.remove());
  }, [map, markers]);

  return null;
}

// ─── Spot marker — identical style to planning map ────────────────────────────

function makeSpotMarkerIcon(spot, index, isMine) {
  // Wrap in opacity container for non-own spots
  const html = isMine
    ? buildSpotMarkerHtml(spot, index)
    : `<div style="opacity:0.5">${buildSpotMarkerHtml(spot, index)}</div>`;
  return L.divIcon({ className: '', html, iconSize: [0, 0], iconAnchor: [0, 0] });
}

// ─── GPS location icon ────────────────────────────────────────────────────────

// Build SVG location icon — dot + optional directional cone
function makeLocationIcon(heading) {
  const hasHeading = heading !== null && heading !== undefined;
  const size = 48;
  const cx = 24;
  const cy = 24;
  const dotR = 8;
  const ringR = 13;

  // Triangle points toward heading (up = north = 0°)
  // We draw it pointing up and rotate around center
  const coneH = 14; // height of triangle above dot
  const coneW = 8;  // half-width
  const tipY = cy - dotR - coneH;
  const baseY = cy - dotR + 1;
  const triangle = hasHeading
    ? `<path d="M ${cx} ${tipY} L ${cx - coneW} ${baseY} L ${cx + coneW} ${baseY} Z"
         fill="rgba(37,99,235,0.85)" stroke="white" stroke-width="1.2" stroke-linejoin="round"
         transform="rotate(${heading}, ${cx}, ${cy})" />`
    : '';

  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${cx}" cy="${cy}" r="${ringR}" fill="rgba(37,99,235,0.18)" />
    ${triangle}
    <circle cx="${cx}" cy="${cy}" r="${dotR}" fill="#2563eb" stroke="white" stroke-width="2.5" />
  </svg>`;

  return L.divIcon({
    className: '',
    html: svg,
    iconSize: [size, size],
    iconAnchor: [cx, cy],
  });
}

function FitBounds({ allSpots, gpxTracks }) {
  const map = useMap();
  useEffect(() => {
    const spotCoords = allSpots.filter((s) => s.latitude != null).map((s) => [s.latitude, s.longitude]);
    const trackCoords = gpxTracks.flatMap((t) => (t.points || []).map((p) => [p.lat, p.lng]));
    const all = [...spotCoords, ...trackCoords];
    if (all.length === 1) {
      map.setView(all[0], 14);
    } else if (all.length > 1) {
      map.fitBounds(all, { padding: [20, 20] });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // only on mount — don't re-fit when position updates
  return null;
}

function CenterOnMe({ position }) {
  const map = useMap();
  const handleClick = () => {
    if (position) map.setView(position, Math.max(map.getZoom(), 15), { animate: true });
  };
  if (!position) return null;
  return (
    <div className="leaflet-bottom leaflet-right" style={{ marginBottom: 8, marginRight: 8 }}>
      <button
        type="button"
        onClick={handleClick}
        title="Center on my location"
        style={{
          background: '#fff', border: '2px solid #e5e7eb', borderRadius: 10,
          width: 36, height: 36, display: 'flex', alignItems: 'center',
          justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          cursor: 'pointer', fontSize: 16,
        }}
      >
        📍
      </button>
    </div>
  );
}

function headingLabel(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

const TILES = {
  street:    { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',                                                               attr: '© OpenStreetMap' },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: '© Esri' },
};

/** mySpotIds: Set of spot IDs belonging to this photographer */
function SpotsMap({ allSpots, mySpotIds, gpxTracks }) {
  const [layer, setLayer] = useState('street');
  const [myPos, setMyPos] = useState(null);
  const [heading, setHeading] = useState(null);
  const [geoError, setGeoError] = useState(false);
  const [needsCompassPerm, setNeedsCompassPerm] = useState(false);

  const visibleSpots = allSpots.filter((s) => s.latitude != null);
  const hasContent = visibleSpots.length > 0 || gpxTracks.some((t) => t.points?.length > 1);
  if (!hasContent) return null;

  // Live GPS
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) => setMyPos([p.coords.latitude, p.coords.longitude]),
      () => setGeoError(true),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // Compass
  useEffect(() => {
    function onOrientation(e) {
      const h = e.webkitCompassHeading != null
        ? e.webkitCompassHeading
        : e.alpha != null ? (360 - e.alpha + (screen.orientation?.angle ?? 0)) % 360 : null;
      if (h != null) setHeading(Math.round(h));
    }
    if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
      setNeedsCompassPerm(true);
    } else {
      window.addEventListener('deviceorientation', onOrientation, true);
      return () => window.removeEventListener('deviceorientation', onOrientation, true);
    }
  }, []);

  async function requestCompassPerm() {
    try {
      if ((await DeviceOrientationEvent.requestPermission()) === 'granted') {
        setNeedsCompassPerm(false);
        window.addEventListener('deviceorientation', (e) => {
          const h = e.webkitCompassHeading ?? null;
          if (h != null) setHeading(Math.round(h));
        }, true);
      }
    } catch { setNeedsCompassPerm(false); }
  }

  const fallbackCenter = visibleSpots[0]
    ? [visibleSpots[0].latitude, visibleSpots[0].longitude]
    : gpxTracks[0]?.points?.[0]
      ? [gpxTracks[0].points[0].lat, gpxTracks[0].points[0].lng]
      : [51.5, 10];

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      {/* Layer toggle */}
      <div className="flex border-b border-gray-100 bg-white">
        {[['street', '🗺️ Map'], ['satellite', '🛰️ Satellite']].map(([k, label]) => (
          <button key={k} type="button" onClick={() => setLayer(k)}
            className={`flex-1 py-2 text-xs font-bold transition-colors ${layer === k ? 'bg-[#1C2B6B] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            {label}
          </button>
        ))}
      </div>

      <MapContainer style={{ height: 300, width: '100%' }} zoom={13} center={fallbackCenter}
        zoomControl={false} attributionControl={false} scrollWheelZoom={false}>
        <TileLayer key={layer} url={TILES[layer].url} attribution={TILES[layer].attr} />
        <FitBounds allSpots={visibleSpots} gpxTracks={gpxTracks} />

        {/* GPX Tracks — polyline + direction arrows (same as planning map) */}
        {gpxTracks.map((track, ti) => {
          const color = TRACK_COLORS[ti % TRACK_COLORS.length];
          const pts = (track.points || []).map((p) => [p.lat, p.lng]);
          if (pts.length < 2) return null;
          return (
            <React.Fragment key={track.name + ti}>
              <Polyline positions={pts} color={color} weight={4} opacity={0.88} />
              <DirectionArrows track={track} color={color} />
            </React.Fragment>
          );
        })}

        {/* All spots — same marker style as planning map */}
        {visibleSpots.map((spot, i) => {
          const isMine = mySpotIds ? mySpotIds.has(spot.id) : true;
          return (
            <Marker
              key={spot.id || i}
              position={[spot.latitude, spot.longitude]}
              icon={makeSpotMarkerIcon(spot, i + 1, isMine)}
              zIndexOffset={isMine ? 500 : 100}
            >
              <Popup>
                <div className="text-xs font-bold text-[#1C2B6B]">{spot.name}</div>
                {!isMine && (spot.location_type === 'photo' || !spot.location_type) && (
                  <div className="text-[10px] text-gray-400">Other photographer</div>
                )}
                {(spot.time_from || spot.time_to) && (
                  <div className="text-xs text-[#5b6aa8] mt-0.5">
                    {formatTimeShort(spot.time_from)}–{formatTimeShort(spot.time_to)}
                  </div>
                )}
                {spot.notes && <div className="text-xs text-gray-500 mt-0.5">{spot.notes}</div>}
              </Popup>
            </Marker>
          );
        })}

        {/* Own GPS position */}
        {myPos && (
          <Marker position={myPos} icon={makeLocationIcon(heading)}>
            <Popup>
              <div className="text-xs font-bold">📍 Your position</div>
              {heading !== null && (
                <div className="text-xs text-gray-500">{heading}° {headingLabel(heading)}</div>
              )}
            </Popup>
          </Marker>
        )}

        <CenterOnMe position={myPos} />
      </MapContainer>

      {/* Legend — track names only */}
      {gpxTracks.length > 0 && (
        <div className="flex items-center gap-3 bg-white px-3 py-1.5 text-[10px] text-gray-400 flex-wrap border-t border-gray-100">
          {gpxTracks.map((t, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-5 rounded-full" style={{ background: TRACK_COLORS[i % TRACK_COLORS.length] }} />
              {t.name || `Route ${i + 1}`}
              {t.totalKm ? ` · ${t.totalKm.toFixed(1)} km` : ''}
            </span>
          ))}
        </div>
      )}

      {needsCompassPerm && myPos && (
        <button type="button" onClick={requestCompassPerm}
          className="flex w-full items-center justify-center gap-2 bg-[#f0f2fa] px-3 py-2 text-xs font-bold text-[#1C2B6B] hover:bg-[#e4e8f5] transition-colors">
          🧭 Enable compass direction
        </button>
      )}
      {geoError && (
        <div className="bg-amber-50 px-3 py-1.5 text-[10px] text-amber-700 text-center">
          ⚠️ Location access denied — enable in browser settings
        </div>
      )}
    </div>
  );
}

// ─── Weather briefing ─────────────────────────────────────────────────────────

function WeatherBriefing({ event, spots }) {
  const [expanded, setExpanded] = useState(false);

  // Use event location or first spot with coords
  const lat = event?.latitude ?? event?.lat ?? spots.find((s) => s.latitude != null)?.latitude;
  const lon = event?.longitude ?? event?.lon ?? spots.find((s) => s.longitude != null)?.longitude;
  // Support both date field names
  const dateStr = event?.date || event?.eventDate || null;

  const { weather, loading, error } = useWeather(lat, lon, dateStr);

  if (!dateStr) return null; // no date, can't show weather
  if (!lat || !lon) return null; // no location

  const diffDays = (new Date(dateStr) - new Date()) / 86400000;
  if (diffDays < -1 || diffDays > 16) {
    // Out of forecast range
    return (
      <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-400">
        🌤️ Weather forecast only available within 16 days of the event.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-400 flex items-center gap-2">
        <span className="animate-spin inline-block">🌀</span> Loading weather…
      </div>
    );
  }

  if (error || !weather) return null;

  const { daily, hourly } = weather;
  const { icon, label } = wmoToEmoji(daily.weathercode);

  // Filter hourly to event time window (roughly); time_from/to are "HH:MM"
  const parseHour = (t) => t ? parseInt(t.split(':')[0], 10) : NaN;
  const timeFroms = spots.map((s) => parseHour(s.time_from)).filter((n) => !isNaN(n));
  const timeTos = spots.map((s) => parseHour(s.time_to)).filter((n) => !isNaN(n));
  const startHour = timeFroms.length ? Math.min(...timeFroms) : 6;
  const endHour = timeTos.length ? Math.max(...timeTos) : 18;
  const window = hourly.filter((h) => h.hour >= startHour && h.hour <= endHour);
  const tips = getPhotoTips(daily, window);

  // Group hourly for small chart (every 2h within window ±2)
  const chartHours = hourly.filter((h) => h.hour >= Math.max(0, startHour - 1) && h.hour <= Math.min(23, endHour + 1));

  return (
    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="text-2xl leading-none">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold uppercase tracking-wider text-[#1C2B6B]/50 mb-0.5">
            Weather Briefing
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-extrabold text-[#1C2B6B]">
              {Math.round(daily.tempMin)}°–{Math.round(daily.tempMax)}°C
            </span>
            <span className="text-xs text-[#1C2B6B]/70">{label}</span>
            {daily.rain > 0 && (
              <span className="text-xs text-blue-600 font-semibold">
                💧 {daily.rain.toFixed(1)} mm
              </span>
            )}
          </div>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 text-[#1C2B6B]/40 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-blue-100 px-4 pb-4 pt-3 space-y-3">
          {/* Hourly chart (simple text table) */}
          {chartHours.length > 0 && (
            <div className="overflow-x-auto">
              <div className="flex gap-2 min-w-max pb-1">
                {chartHours.map((h) => {
                  const { icon: hIcon } = wmoToEmoji(h.weathercode);
                  return (
                    <div key={h.hour} className="flex flex-col items-center gap-0.5 min-w-[36px]">
                      <span className="text-[10px] font-bold text-[#1C2B6B]/50">{h.hour}:00</span>
                      <span className="text-base leading-none">{hIcon}</span>
                      <span className="text-[11px] font-bold text-[#1C2B6B]">{Math.round(h.temp)}°</span>
                      {h.rain > 0 && (
                        <span className="text-[9px] text-blue-500">💧{h.rain.toFixed(1)}</span>
                      )}
                      <span className="text-[9px] text-gray-400">{Math.round(h.windspeed)}km/h</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sunrise/Sunset */}
          {(daily.sunrise || daily.sunset) && (
            <div className="flex gap-3 text-xs text-[#1C2B6B]/70">
              {daily.sunrise && (
                <span>🌅 {new Date(daily.sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              )}
              {daily.sunset && (
                <span>🌇 {new Date(daily.sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              )}
            </div>
          )}

          {/* Photo tips */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#1C2B6B]/40">
              📸 Photo Tips
            </div>
            {tips.map((tip, i) => (
              <div key={i} className="text-xs text-[#1C2B6B]/80 leading-snug">{tip}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function TacticDetail({ onOpenCheckIn }) {
  const activeTacticId = usePhotographerStore((s) => s.activeTacticId);
  const tactics = usePhotographerStore((s) => s.tactics);
  const closeDetail = usePhotographerStore((s) => s.closeDetail);
  const acronym = usePhotographerStore((s) => s.acronym);
  const checkIn = usePhotographerStore((s) => s.checkIns[activeTacticId]);

  const entry = tactics.find((t) => t.id === activeTacticId) ?? null;
  const isComplete = !!checkIn?.completedAt;
  const profile = useMyProfile(entry?.pkg);

  // Compute my spots locally to avoid selector returning new array on every render
  const spots = entry?.pkg?.tactic?.spots ?? [];
  const photographers = entry?.pkg?.photographers ?? [];
  const assignments = entry?.pkg?.tactic?.assignments ?? [];
  const ph = photographers.find(
    (p) => p.code === acronym || p.code === acronym?.replace(/\d+$/, ''),
  );
  const mySpotIds = ph
    ? new Set(assignments.filter((a) => a.photographer_id === ph.id).map((a) => a.spot_id))
    : null;
  // Primary: assignment-based. Fallback: spot name starts with photographer code
  // (e.g. "TILL2" matches photographer "TILL" when TL forgot to create the assignment)
  const mySpots = mySpotIds
    ? spots.filter(
        (s) =>
          mySpotIds.has(s.id) ||
          (acronym && s.name?.toUpperCase().startsWith(acronym.toUpperCase())),
      )
    : spots;

  if (!entry) return null;

  const { pkg } = entry;
  const event = pkg?.event;
  const isMatched = !!profile;

  const firstName = profile?.firstName || profile?.name?.split(' ')[0] || null;
  const greeting = firstName ? `Hey ${firstName} 👋` : acronym ? `Hey ${acronym} 👋` : null;

  const date = event?.date
    ? new Date(event.date).toLocaleDateString(undefined, {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
      })
    : null;

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <button
            type="button"
            onClick={closeDetail}
            className="mb-1 block text-xs text-gray-400 hover:text-gray-600"
          >
            ← All tactics
          </button>
          {greeting && (
            <div className="text-sm font-bold text-[#1C2B6B]/60 mb-0.5">{greeting}</div>
          )}
          <h2 className="text-base font-extrabold leading-tight text-[#1C2B6B]">{event?.name}</h2>
          {date && <div className="mt-0.5 text-xs text-gray-400">{date}</div>}
        </div>
        <button
          type="button"
          onClick={onOpenCheckIn}
          className={`shrink-0 rounded-2xl px-4 py-2 text-xs font-bold transition-colors ${
            isComplete
              ? 'bg-green-100 text-green-700'
              : 'bg-[#1C2B6B] text-white hover:bg-[#16225a]'
          }`}
        >
          {isComplete ? '✅ Checked in' : 'Check-in'}
        </button>
      </div>

      {/* Personalized profile card */}
      {isMatched && profile && (
        <ProfileCard profile={profile} spotCount={mySpots.length} />
      )}

      {/* Spots map — all spots + GPX tracks */}
      <SpotsMap
        allSpots={spots}
        mySpotIds={mySpotIds ?? null}
        gpxTracks={entry?.pkg?.tactic?.gpxTracks ?? []}
      />

      {/* Weather briefing */}
      <WeatherBriefing event={event} spots={mySpots.length > 0 ? mySpots : spots} />

      {/* Not matched hint */}
      {!isMatched && acronym && (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
          ⚠️ Acronym <strong>{acronym}</strong> not found in this tactic. Showing all spots.
        </div>
      )}

      {/* No acronym hint */}
      {!acronym && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
          💡 Enter your acronym in settings to see only your spots and personalized info.
        </div>
      )}

      {/* Spots */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
          {isMatched ? `My spots` : 'All spots'} · {mySpots.length}
        </h3>
        {mySpots.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-400">
            No spots found.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {mySpots.map((spot, i) => (
              <SpotCard key={spot.id || i} spot={spot} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
