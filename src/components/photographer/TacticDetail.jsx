import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import { TRACK_COLORS, LOCATION_TYPES } from '../../lib/locationTypes';
import { buildSpotMarkerHtml } from '../../lib/spotMarkerHtml';
import L from 'leaflet';
import { usePhotographerStore } from '../../store/usePhotographerStore';
import { usePhTranslation } from '../../i18n/usePhTranslation';
import { useMyProfile } from '../../hooks/useMyProfile';
import { formatTimeShort } from '../../lib/timeConflict';
import { findAllCameraSettings, needsCardReader } from '../../lib/cameraSettings';
import { CheckInCertificateCard } from '../CheckInCertificateCard';
import { useWeather, wmoToEmoji, getPhotoTips } from '../../hooks/useWeather';
import { HYROX_STATIONS } from '../../lib/hyrox';
import { getStationImages } from '../../lib/hyroxStationImages';
import { ElevationProfile } from '../ElevationProfile';
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
      url: `https://www.google.com/maps/dir/?api=1&destination=${coord}&travelmode=driving`,
    },
    {
      id: 'waze',
      label: 'Waze',
      img: '/Waze_logo_2022.png',
      url: `https://waze.com/ul?ll=${coord}&navigate=yes`,
    },
  ];

  if (isIOS()) {
    options.splice(1, 0, {
      id: 'applemaps',
      label: 'Apple Maps',
      img: '/Apple_Maps_iOS_26_icon.png',
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
    url: `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`,
  },
  {
    id: 'mapillary',
    label: 'Mapillary',
    img: '/mapillary.png',
    url: `https://www.mapillary.com/app/?lat=${lat}&lng=${lng}&z=17`,
  },
];

// ─── Utilities ───────────────────────────────────────────────────────────────

// PWA-safe external link opener — target="_blank" is unreliable in iOS standalone mode
function openExternal(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

// ─── Image lightbox ───────────────────────────────────────────────────────────

function ImageLightbox({ src, onClose }) {
  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <img
        src={src}
        alt=""
        className="max-h-[90dvh] max-w-[95vw] rounded-xl object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>,
    document.body,
  );
}

// ─── Navigate modal ───────────────────────────────────────────────────────────

function NavigateButton({ lat, lng }) {
  const [open, setOpen] = useState(false);
  const options = navOptions(lat, lng);

  const modal = open && createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 px-6"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xs overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pb-1 pt-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400">Navigate to spot</p>
        </div>
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              setOpen(false);
              openExternal(opt.url);
            }}
            className="flex w-full items-center gap-4 px-5 py-3.5 text-left text-base font-semibold text-gray-800 active:bg-gray-50"
          >
            <img src={opt.img} alt={opt.label} className="h-8 w-8 object-contain" />
            {opt.label}
          </button>
        ))}
        <div className="p-3 pt-1">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold text-gray-500 hover:bg-[#f0f2fa] hover:text-[#1C2B6B] transition-colors active:bg-[#f0f2fa]"
      >
        <img src="/mymaps.png" alt="Navigate" className="h-5 w-5 object-contain" />
        Navigate
      </button>
      {modal}
    </>
  );
}

// ─── Personalized profile card ───────────────────────────────────────────────

function ProfileCard({ profile }) {
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.name || profile.code;
  const cameras = profile.cameras || profile.equipment || '';
  const lenses = profile.lenses || '';
  const flashes = profile.flashes || '';

  const camSettings = cameras ? findAllCameraSettings(cameras) : [];

  return (
    <div className="rounded-2xl border border-[#1C2B6B]/20 bg-[#f0f2fa] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1C2B6B] text-sm font-extrabold text-white">
          {profile.code}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-extrabold text-[#1C2B6B] leading-tight">{fullName}</div>
        </div>
      </div>

      {/* Equipment */}
      {cameras && (
        <div className="mt-3 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#1C2B6B]/50">Equipment</div>
          <div className="text-xs text-[#1C2B6B]/80 leading-snug">{cameras}</div>

          {/* Camera settings recommendations */}
          {camSettings.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {camSettings.map((s, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
                  <span className="text-[11px] font-extrabold text-[#1C2B6B] min-w-[80px]">{s.model}</span>
                  <span className="text-[10px] text-gray-500">
                    {s.imageSize} · {s.jpeg}
                  </span>
                </div>
              ))}
              {camSettings.some((s) => s.electronicShutter && !s.globalShutter) && (
                <div className="flex gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5">
                  <span className="mt-px shrink-0 text-sm leading-none">⚠️</span>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-amber-700">Electronic Shutter — Rolling Shutter Risk</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-amber-800">
                      At fast-moving spots (e.g. road cycling), <strong>do not use electronic shutter</strong> — rolling shutter causes image distortion. Use <strong>mechanical shutter</strong>.
                    </p>
                  </div>
                </div>
              )}
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
  const [lightboxSrc, setLightboxSrc] = useState(null);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Main info */}
      <div className="p-4">
        <div className="font-bold text-[#1C2B6B] leading-snug">
          <span className="mr-1 font-normal text-gray-400">#{index + 1}</span>
          {spot.name}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {spot.location_type && spot.location_type !== 'photo' && (
            <span className="rounded-full bg-[#e8f0fe] px-2 py-0.5 text-[11px] font-semibold text-[#2563eb] capitalize">
              {LOCATION_TYPES[spot.location_type]?.label || spot.location_type}
            </span>
          )}
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
                  onClick={() => setLightboxSrc(img.data)}
                  className="shrink-0 active:opacity-70 transition-opacity"
                >
                  <img
                    src={img.data}
                    alt={img.name || `ref-${idx}`}
                    className="h-24 w-24 rounded-xl object-cover border border-gray-200"
                    loading="lazy"
                    decoding="async"
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
          {/* Navigate modal */}
          <div className="flex-1">
            <NavigateButton lat={lat} lng={lng} />
          </div>
        </div>
      )}
      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
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
  map:       { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '© OpenStreetMap' },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: '© Esri' },
  terrain:   { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attr: '© OpenTopoMap' },
};

/** mySpotIds: Set of spot IDs belonging to this photographer */
function SpotsMap({ allSpots, mySpotIds, gpxTracks }) {
  const [layer, setLayer] = useState('map');
  const [activeTrackIndex, setActiveTrackIndex] = useState(null);
  const [hoverKm, setHoverKm] = useState(null);
  const [myPos, setMyPos] = useState(null);
  const [heading, setHeading] = useState(null);
  const [geoError, setGeoError] = useState(false);
  const [needsCompassPerm, setNeedsCompassPerm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const visibleSpots = useMemo(() => allSpots.filter((s) => s.latitude != null), [allSpots]);
  const hasContent = visibleSpots.length > 0 || gpxTracks.some((t) => t.points?.length > 1);

  // Live GPS — all hooks before any early return
  useEffect(() => {
    if (!hasContent || !navigator.geolocation) return;
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

  const compassListenerRef = useRef(null);
  useEffect(() => () => {
    if (compassListenerRef.current) {
      window.removeEventListener('deviceorientation', compassListenerRef.current, true);
    }
  }, []);

  async function requestCompassPerm() {
    try {
      if ((await DeviceOrientationEvent.requestPermission()) === 'granted') {
        setNeedsCompassPerm(false);
        function onOrientation(e) {
          const h = e.webkitCompassHeading ?? null;
          if (h != null) setHeading(Math.round(h));
        }
        compassListenerRef.current = onOrientation;
        window.addEventListener('deviceorientation', onOrientation, true);
      }
    } catch { setNeedsCompassPerm(false); }
  }

  if (!hasContent) return null;

  const fallbackCenter = visibleSpots[0]
    ? [visibleSpots[0].latitude, visibleSpots[0].longitude]
    : gpxTracks[0]?.points?.[0]
      ? [gpxTracks[0].points[0].lat, gpxTracks[0].points[0].lng]
      : [51.5, 10];

  const hasElevation = gpxTracks.some((t) => t.points?.some((p) => p.ele != null));

  // Collapsed view — compact header with expand button
  if (!isExpanded) {
    return (
      <div className="rounded-2xl border border-[#e3e7f2] shadow-sm bg-white overflow-hidden">
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#f8f9ff] transition-colors"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef1fb] text-[#5b6aa8]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z"/><path d="M12 3v18M3 7l9 4 9-4"/>
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-[#1C2B6B]">Map &amp; Route</div>
            <div className="text-[10px] text-[#8a93b0]">
              {visibleSpots.length} spot{visibleSpots.length !== 1 ? 's' : ''}
              {gpxTracks.length > 0 && ` · ${gpxTracks.length} track${gpxTracks.length !== 1 ? 's' : ''}`}
              {hasElevation && ' · elevation'}
            </div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a93b0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-[#e3e7f2] shadow-sm bg-white">
      {/* Top bar: collapse button + layer pills + track tabs */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[#f0f2fa]">
        {/* Collapse button */}
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f3f5fa] text-[#8a93b0] hover:bg-[#e8ebf5] hover:text-[#1C2B6B] transition-colors"
          title="Collapse map"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
          </svg>
        </button>

        {/* Layer selector — subtle pills */}
        <div className="flex gap-1 rounded-lg bg-[#f3f5fa] p-0.5">
          {[['map','Map'],['satellite','Satellite'],['terrain','Terrain']].map(([k, lbl]) => (
            <button key={k} type="button" onClick={() => setLayer(k)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
                layer === k ? 'bg-white text-[#1C2B6B] shadow-sm' : 'text-[#8a93b0] hover:text-[#1C2B6B]'
              }`}>
              {lbl}
            </button>
          ))}
        </div>

        {/* Track selector tabs (only when multiple tracks, shown in top bar) */}
        {gpxTracks.length > 1 && !hasElevation && (
          <div className="flex gap-1 overflow-x-auto">
            {gpxTracks.map((t, i) => {
              const color = TRACK_COLORS[i % TRACK_COLORS.length];
              const isActive = activeTrackIndex === i;
              return (
                <button key={i} type="button" onClick={() => { setActiveTrackIndex(isActive ? null : i); setHoverKm(null); }}
                  className={`flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition-colors ${
                    isActive ? 'bg-[#1C2B6B] text-white' : 'bg-[#f3f5fa] text-[#5b6aa8] hover:bg-[#e8ebf5]'
                  }`}>
                  <span className="inline-block h-1.5 w-1.5 rounded-full shrink-0" style={{ background: isActive ? 'white' : color }} />
                  {t.name || `Track ${i+1}`}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <MapContainer style={{ height: 420, width: '100%' }} zoom={13} center={fallbackCenter}
        zoomControl={false} attributionControl={false} scrollWheelZoom={false}>
        <TileLayer key={layer} url={TILES[layer].url} attribution={TILES[layer].attr} />
        <FitBounds allSpots={visibleSpots} gpxTracks={gpxTracks} />

        {/* GPX Tracks */}
        {gpxTracks.map((track, ti) => {
          const color = TRACK_COLORS[ti % TRACK_COLORS.length];
          const pts = (track.points || []).map((p) => [p.lat, p.lng]);
          if (pts.length < 2) return null;
          const dimmed = activeTrackIndex !== null && activeTrackIndex !== ti;
          return (
            <React.Fragment key={track.name + ti}>
              <Polyline positions={pts} color={color} weight={4} opacity={dimmed ? 0.25 : 0.88} />
              {!dimmed && <DirectionArrows track={track} color={color} />}
            </React.Fragment>
          );
        })}

        {/* Elevation hover marker */}
        {hoverKm != null && gpxTracks.map((track, ti) => {
          if (activeTrackIndex !== null && activeTrackIndex !== ti) return null;
          const idx = track.cumKm?.findIndex((c) => c >= hoverKm);
          if (idx == null) return null;
          const i = idx === -1 ? track.points.length - 1 : idx;
          const pt = track.points[i];
          if (!pt) return null;
          const color = TRACK_COLORS[ti % TRACK_COLORS.length];
          const icon = L.divIcon({
            className: '',
            html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4);margin:-7px 0 0 -7px"></div>`,
            iconSize: [0, 0],
          });
          return <Marker key={`hover-${ti}`} position={[pt.lat, pt.lng]} icon={icon} interactive={false} />;
        })}

        {/* All spots — same marker style as planning map */}
        {visibleSpots.map((spot, i) => {
          const isMine = mySpotIds ? mySpotIds.has(spot.id) : true;
          const lat = spot.latitude, lng = spot.longitude;
          const svUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
          const mapUrl = `https://www.mapillary.com/app/?lat=${lat}&lng=${lng}&z=17`;
          const navOpts = navOptions(lat, lng);
          return (
            <Marker
              key={spot.id || i}
              position={[lat, lng]}
              icon={makeSpotMarkerIcon(spot, i + 1, isMine)}
              zIndexOffset={isMine ? 500 : 100}
            >
              <Popup minWidth={200}>
                <div style={{ fontFamily: 'system-ui', fontSize: 13 }}>
                  <div style={{ fontWeight: 800, color: '#1C2B6B', marginBottom: 2 }}>{spot.name}</div>
                  {!isMine && (spot.location_type === 'photo' || !spot.location_type) && (
                    <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>Other photographer</div>
                  )}
                  {(spot.time_from || spot.time_to) && (
                    <div style={{ fontSize: 11, color: '#5b6aa8', marginBottom: 4 }}>
                      {formatTimeShort(spot.time_from)}–{formatTimeShort(spot.time_to)}
                    </div>
                  )}
                  {spot.notes && (
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>{spot.notes}</div>
                  )}
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    <button onClick={() => openExternal(svUrl)}
                      style={{ display:'flex', alignItems:'center', gap:4, background:'#f0f2fa', border:'none', borderRadius:8, padding:'5px 8px', fontSize:11, fontWeight:700, color:'#1C2B6B', cursor:'pointer' }}>
                      <img src="/streetview.png" style={{ width:14, height:14, objectFit:'contain' }} alt="" /> Street View
                    </button>
                    <button onClick={() => openExternal(mapUrl)}
                      style={{ display:'flex', alignItems:'center', gap:4, background:'#f0f2fa', border:'none', borderRadius:8, padding:'5px 8px', fontSize:11, fontWeight:700, color:'#1C2B6B', cursor:'pointer' }}>
                      <img src="/mapillary.png" style={{ width:14, height:14, objectFit:'contain' }} alt="" /> Mapillary
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {navOpts.map((opt) => (
                      <button key={opt.id} onClick={() => openExternal(opt.url)}
                        style={{ display:'flex', alignItems:'center', gap:4, background:'#f0f2fa', border:'none', borderRadius:8, padding:'5px 8px', fontSize:11, fontWeight:700, color:'#1C2B6B', cursor:'pointer' }}>
                        <img src={opt.img} style={{ width:14, height:14, objectFit:'contain' }} alt="" /> {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
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

      {/* Elevation profile with track tabs below map */}
      {hasElevation && (
        <div className="border-t border-[#f0f2fa]">
          <ElevationProfile
            tracks={gpxTracks}
            spots={allSpots}
            onHoverKm={setHoverKm}
            onActiveTrackIndex={(i) => {
              if (i !== null) setActiveTrackIndex(i);
            }}
          />
        </div>
      )}

      {/* Track tabs below map when elevation is present (replaces top bar tabs) */}
      {gpxTracks.length > 1 && hasElevation && (
        <div className="flex gap-1 overflow-x-auto border-t border-[#f0f2fa] px-3 py-2">
          {gpxTracks.map((t, i) => {
            const color = TRACK_COLORS[i % TRACK_COLORS.length];
            const isActive = activeTrackIndex === i;
            return (
              <button key={i} type="button" onClick={() => { setActiveTrackIndex(isActive ? null : i); setHoverKm(null); }}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors ${
                  isActive ? 'bg-[#1C2B6B] text-white' : 'bg-[#f3f5fa] text-[#5b6aa8] hover:bg-[#e8ebf5]'
                }`}>
                <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ background: isActive ? 'white' : color }} />
                {t.name || `Track ${i+1}`}
              </button>
            );
          })}
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
  // Fall back to today if no event date set
  const today = new Date().toISOString().slice(0, 10);
  const dateStr = event?.date || event?.eventDate || today;

  const { weather, loading, error } = useWeather(lat, lon, dateStr);

  if (!lat || !lon) return null; // no location

  const diffDays = (new Date(dateStr) - new Date()) / 86400000;
  if (diffDays < -1 || diffDays > 16) {
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
        <span className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-colors shrink-0 ${
          expanded ? 'bg-blue-100 text-[#1C2B6B]' : 'bg-[#1C2B6B]/8 text-[#1C2B6B]/60'
        }`}>
          {expanded ? 'Close' : 'Open'}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
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

          {/* Tips */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#1C2B6B]/40">
              Tips
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

// ─── TL Info section ─────────────────────────────────────────────────────────

function TLInfoSection({ pkg }) {
  const tlInfo = pkg?.tactic?.tlInfo;
  const [open, setOpen] = useState(false);
  if (!tlInfo) return null;
  const { notes, whatsappGroups = [] } = tlInfo;
  if (!notes && !whatsappGroups.length) return null;

  // WhatsApp groups shown always as quick-access buttons; notes + non-chat groups behind toggle
  const chatGroups = whatsappGroups.filter((g) => g.name === 'Team Chat');
  const otherGroups = whatsappGroups.filter((g) => g.name !== 'Team Chat');

  return (
    <div className="rounded-2xl border border-[#e3e7f2] bg-white overflow-hidden">
      {/* Always visible: Team Chat buttons */}
      {chatGroups.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pt-3 pb-2">
          {chatGroups.map((g) => (
            <a key={g.id} href={g.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl bg-[#f0fdf4] px-3 py-2 text-sm font-bold text-[#166534] hover:bg-[#dcfce7] transition-colors">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-[#25D366] shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.862L.053 23.447a.5.5 0 0 0 .608.61l5.701-1.494A11.954 11.954 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.89 0-3.663-.523-5.176-1.432l-.371-.22-3.383.887.9-3.293-.242-.381A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              {g.name}
            </a>
          ))}
        </div>
      )}

      {/* Collapsible: notes + other groups */}
      {(notes || otherGroups.length > 0) && (
        <>
          <button type="button" onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-[#f8f9ff] transition-colors">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Team Info</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className={`text-[#b0b8cf] transition-transform ${open ? 'rotate-180' : ''}`}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {open && (
            <div className="border-t border-[#f0f2fa] px-4 pb-4 pt-3 space-y-3">
              {notes && <p className="whitespace-pre-wrap text-sm text-[#1C2B6B] leading-relaxed">{notes}</p>}
              {otherGroups.length > 0 && (
                <div className="flex flex-col gap-2">
                  {otherGroups.map((g) => (
                    <a key={g.id} href={g.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl bg-[#f0fdf4] px-3 py-2.5 text-sm font-bold text-[#166534] hover:bg-[#dcfce7] transition-colors">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-[#25D366] shrink-0">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.862L.053 23.447a.5.5 0 0 0 .608.61l5.701-1.494A11.954 11.954 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.89 0-3.663-.523-5.176-1.432l-.371-.22-3.383.887.9-3.293-.242-.381A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                      </svg>
                      {g.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── HYROX section ────────────────────────────────────────────────────────────

function HyroxSection({ pkg, acronym, photographers }) {
  const hyrox = pkg?.event?.hyrox;
  const [lightboxSrc, setLightboxSrc] = useState(null);

  if (!hyrox) return null;

  const assignments = hyrox.assignments || {};
  const waves = hyrox.waves || [];
  const waveTimes = hyrox.waveTimes || {};
  const cellTimes = hyrox.cellTimes || {};
  const activeStationIds = hyrox.stations || HYROX_STATIONS.map((s) => s.id);
  const stations = HYROX_STATIONS.filter((s) => activeStationIds.includes(s.id));

  const ph = photographers.find(
    (p) => p.code === acronym || p.code === acronym?.replace(/\d+$/, ''),
  );

  const myAssignments = [];
  stations.forEach((station) => {
    waves.forEach((wave) => {
      const key = `${station.id}__${wave}`;
      const phIds = assignments[key] || [];
      if (!ph || phIds.includes(ph.id)) {
        const ct = cellTimes[key];
        const wt = waveTimes[wave];
        myAssignments.push({ station, wave, cellTime: ct, waveTime: wt, isAssigned: phIds.includes(ph?.id) });
      }
    });
  });

  const relevant = ph ? myAssignments.filter((a) => a.isAssigned) : myAssignments;
  if (!relevant.length && ph) return null;

  return (
    <>
      {lightboxSrc && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <img
            src={lightboxSrc}
            alt=""
            className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setLightboxSrc(null)}
            className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/40"
          >
            ✕
          </button>
        </div>,
        document.body
      )}
      <div className="rounded-2xl border border-[#e3e7f2] bg-white p-4">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
          HYROX — {ph ? 'My Stations' : 'All Stations'}
        </h3>
        <div className="flex flex-col gap-2">
          {relevant.map(({ station, wave, cellTime, waveTime }) => {
            const images = getStationImages(station.id);
            const timeFrom = cellTime?.from || waveTime?.from;
            const timeTo = cellTime?.to || waveTime?.to;
            return (
              <div key={`${station.id}__${wave}`} className="rounded-xl border border-[#f0f2fa] bg-[#f8f9ff] p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: station.color }} />
                    <span className="text-sm font-extrabold text-[#1C2B6B]">{station.label}</span>
                    <span className="rounded bg-[#e8eaf6] px-1.5 py-0.5 text-[10px] font-bold text-[#4a5680]">Wave {wave}</span>
                  </div>
                  {(timeFrom || timeTo) && (
                    <span className="text-xs font-semibold text-[#6b7db3]">{timeFrom || '–'} – {timeTo || '–'}</span>
                  )}
                </div>
                {images.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {images.map((src) => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => setLightboxSrc(src)}
                        className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#e3e7f2] focus:outline-none"
                      >
                        <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Certificate button + modal ───────────────────────────────────────────────

const CAM_STATUS_META = {
  accepted: { icon: '✅', label: 'Passed',             color: '#166534', bg: '#f0fdf4', border: '#bbf7d0' },
  warning:  { icon: '⚠️', label: 'Passed with notes',  color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
  forced:   { icon: '🔧', label: 'Manually confirmed', color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
  declined: { icon: '❌', label: 'Not passed',          color: '#991b1b', bg: '#fff5f5', border: '#fecaca' },
};

const CHECK_ICONS = { ok: '✅', warning: '⚠️', failed: '❌', unreadable: '—' };
const CHECK_LABELS = {
  time: 'Camera time', date: 'Date', format: 'File format',
  shutterSpeed: 'Shutter speed', cardImages: 'Memory card', pictureStyle: 'Picture style',
};

function CertificateButton({ event, photographer, cameraOk, cameraStatus, cameraImageUrl, cameraResult, cameraString, checkedInAt, completedChecks }) {
  const [open, setOpen] = useState(false);
  const meta = CAM_STATUS_META[cameraStatus] ?? CAM_STATUS_META.declined;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-left transition-colors hover:bg-[#dcfce7]"
      >
        <span className="text-xl">📋</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-extrabold text-[#166534]">Check-in Zertifikat</div>
          <div className="text-[11px] text-[#4b7a5c]">Erstellt · Tippe zum Anzeigen & Teilen</div>
        </div>
        <span className="text-lg">✅</span>
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[9500] flex flex-col bg-[#f4f5f8]">
          {/* Header */}
          <div className="flex items-center justify-between bg-[#1C2B6B] px-4 py-3 shrink-0">
            <span className="text-sm font-extrabold text-white">Check-in Zertifikat</span>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Certificate card */}
            <CheckInCertificateCard
              event={event}
              photographer={photographer}
              cameraOk={cameraOk}
              cameraStatus={cameraStatus}
              cameraImageUrl={cameraImageUrl}
              cameraDetails={cameraResult?.details}
              cameraString={cameraString}
              checkedInAt={checkedInAt}
              completedChecks={completedChecks}
              extraShareFile={cameraImageUrl}
            />

            {/* Camera check image — full res */}
            {cameraImageUrl && (
              <div className="rounded-2xl border border-[#e3e7f2] bg-white overflow-hidden">
                <div className="border-b border-[#f0f2fa] bg-[#f4f5fa] px-4 py-3">
                  <div className="text-xs font-extrabold text-[#1C2B6B]">📷 Kamerabild (Original)</div>
                  <div className="text-[10px] text-[#8a93b0] mt-0.5">Der TL kann hier die Einstellungen prüfen</div>
                </div>
                <img src={cameraImageUrl} alt="Camera check" className="w-full" style={{ imageRendering: 'high-quality' }} />
              </div>
            )}

            {/* Camera check detail result */}
            {cameraResult?.details && (
              <div className="rounded-2xl border border-[#e3e7f2] bg-white overflow-hidden">
                <div className="border-b border-[#f0f2fa] bg-[#f4f5fa] px-4 py-3 flex items-center gap-2">
                  <span>{meta.icon}</span>
                  <div className="flex-1">
                    <div className="text-xs font-extrabold text-[#1C2B6B]">KI-Kameraprüfung — Detailergebnis</div>
                    <div className="text-[10px] mt-0.5 font-semibold" style={{ color: meta.color }}>{meta.label}</div>
                  </div>
                </div>
                <div className="divide-y divide-[#f0f2fa]">
                  {Object.entries(cameraResult.details).map(([key, val]) => {
                    if (!val) return null;
                    const icon = CHECK_ICONS[val.status] ?? '—';
                    const color = val.status === 'ok' ? '#166534' : val.status === 'warning' ? '#92400e' : val.status === 'failed' ? '#991b1b' : '#8a93b0';
                    return (
                      <div key={key} className="flex items-start gap-3 px-4 py-3">
                        <span className="mt-0.5 text-base leading-none">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-bold text-[#1C2B6B]">{CHECK_LABELS[key] ?? key}</div>
                          {val.detected != null && (
                            <div className="text-xs font-extrabold mt-0.5" style={{ color }}>{String(val.detected)}</div>
                          )}
                          {val.message && (
                            <div className="text-[10px] text-[#8a93b0] mt-0.5 leading-relaxed">{val.message}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {cameraResult.warnings?.length > 0 && (
                  <div className="border-t border-[#fde68a] bg-[#fffbeb] px-4 py-3 space-y-1">
                    {cameraResult.warnings.map((w, i) => (
                      <div key={i} className="text-[11px] text-[#92400e]">⚠️ {w}</div>
                    ))}
                  </div>
                )}
                {cameraResult.declineReasons?.length > 0 && (
                  <div className="border-t border-[#fecaca] bg-[#fff5f5] px-4 py-3 space-y-1">
                    {cameraResult.declineReasons.map((r, i) => (
                      <div key={i} className="text-[11px] text-[#991b1b]">❌ {r}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function TacticDetail({ onOpenCheckIn }) {
  const { t } = usePhTranslation();
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
  const normalizedAcronym = acronym?.trim().toUpperCase();
  const ph = photographers.find((p) => {
    const code = p.code?.trim().toUpperCase();
    return code === normalizedAcronym || code === normalizedAcronym?.replace(/\d+$/, '');
  });
  const mySpotIds = ph
    ? new Set(assignments.filter((a) => a.photographer_id === ph.id).map((a) => a.spot_id))
    : null;
  // Non-photo spots (meeting, copy, parking, other) are always shown to everyone
  const isGeneralSpot = (s) => s.location_type && s.location_type !== 'photo';
  // Primary: assignment-based. Fallback: spot name starts with photographer code. Always include general spots.
  const mySpots = mySpotIds
    ? spots.filter(
        (s) =>
          isGeneralSpot(s) ||
          mySpotIds.has(s.id) ||
          (normalizedAcronym && s.name?.toUpperCase().startsWith(normalizedAcronym.replace(/\d+$/, ''))),
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
            {t('tacticDetailBack')}
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
          {isComplete ? t('tacticDetailCheckedIn') : t('tacticDetailCheckIn')}
        </button>
      </div>

      {/* Certificate button — compact, opens modal */}
      {isComplete && (() => {
        const steps = checkIn?.steps ?? {};
        const cameraResult = checkIn?.cameraCheckResult;
        const cameraSettings = findAllCameraSettings(profile?.equipment || '');
        const requiresReader = cameraSettings.some((s) => needsCardReader(s.brand, s.model));
        const checks = [
          { key: 'tutorials', label: 'Academy Tutorials', done: ['settings','workflow','newcomer'].every((k) => steps[k]) },
          { key: 'settings', label: 'Camera Settings', done: !!steps.settings_confirmed },
          { key: 'battery', label: 'Batteries & Power', done: !!steps.battery_checked },
          { key: 'card', label: 'Memory Card', done: !!steps.card_formatted && (!requiresReader || !!steps.card_reader_packed) },
          { key: 'camera', label: 'Camera Time Check', done: ['accepted', 'warning', 'forced'].includes(cameraResult?.status) },
        ];
        const completedChecks = checks.filter((c) => c.done).map((c) => c.label);
        return (
          <CertificateButton
            event={{ id: event?.id, name: event?.name, eventDate: event?.date }}
            photographer={{ code: acronym, firstName: profile?.firstName, lastName: profile?.lastName }}
            cameraOk={['accepted', 'warning', 'forced'].includes(cameraResult?.status)}
            cameraStatus={cameraResult?.status}
            cameraImageUrl={cameraResult?.imageDataUrl}
            cameraResult={cameraResult}
            cameraString={profile?.cameras || profile?.equipment || ''}
            checkedInAt={checkIn.completedAt}
            completedChecks={completedChecks}
          />
        );
      })()}

      {/* Personalized profile card — equipment only */}
      {isMatched && profile && (
        <ProfileCard profile={profile} />
      )}

      {/* TL Info — collapsible, above map */}
      <TLInfoSection pkg={pkg} />

      {/* Weather briefing */}
      <WeatherBriefing event={event} spots={mySpots.length > 0 ? mySpots : spots} />

      {/* Spots map — all spots + GPX tracks */}
      <SpotsMap
        allSpots={spots}
        mySpotIds={mySpotIds ?? null}
        gpxTracks={entry?.pkg?.tactic?.gpxTracks ?? []}
      />

      {/* HYROX stations */}
      {event?.eventType === 'hyrox' && (
        <HyroxSection pkg={pkg} acronym={acronym} photographers={photographers} />
      )}

      {/* Not matched hint */}
      {!isMatched && acronym && (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
          ⚠️ {t('tacticDetailNotMatched', { code: acronym })}
        </div>
      )}

      {/* No acronym hint */}
      {!acronym && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
          💡 {t('tacticDetailNoAcronym')}
        </div>
      )}

      {/* Spots */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
          {isMatched ? t('tacticDetailMySpots') : t('tacticDetailAllSpots')} · {mySpots.length}
        </h3>
        {mySpots.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-400">
            {t('tacticDetailNoSpots')}
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
