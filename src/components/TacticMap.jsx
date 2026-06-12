import { Fragment, useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import { usePlannerStore } from '../store/usePlannerStore';
import { buildSpotMarkerHtml } from '../lib/spotMarkerHtml';
import { buildReferenceSpotMarkerHtml } from '../lib/referenceSpotMarkerHtml';
import { formatTimeShort } from '../lib/timeConflict';
import { isPhotoLocation, TRACK_COLORS } from '../lib/locationTypes';
import { getSpotNavUrls } from '../lib/navUrls';
import { getGpxTracks, pointsToLatLngArray } from '../lib/gpxTracks';
import { useTranslation } from '../i18n/useTranslation';

const TILES = {
  map: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
    maxZoom: 19,
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
  },
};

function FitBounds({ spots, referenceSpots, tracks }) {
  const map = useMap();

  useEffect(() => {
    const points = [];
    tracks.forEach((t) => t.points.forEach((p) => points.push([p.lat, p.lng])));
    [...spots, ...referenceSpots].forEach((s) => {
      if (s.latitude != null && s.longitude != null) points.push([s.latitude, s.longitude]);
    });
    if (points.length > 1) {
      map.fitBounds(points, { padding: [48, 48], maxZoom: 15 });
    } else if (points.length === 1) {
      map.setView(points[0], 15);
    }
  }, [map, spots, referenceSpots, tracks]);

  return null;
}

function formatExactTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
}

function ReferenceSpotMarker({ spot, index, referenceTimeline }) {
  const openCreateSpotModal = usePlannerStore((s) => s.openCreateSpotModal);
  const map = useMap();
  // Cameras at this spot from timeline
  const cameras = (referenceTimeline || []).filter((e) => e.spotName === spot.name);
  const totalImages = cameras.reduce((s, e) => s + (e.images || 0), 0);

  const icon = useMemo(
    () =>
      L.divIcon({
        className: '',
        html: buildReferenceSpotMarkerHtml(spot.name, index + 1, spot.time_from, spot.time_to, totalImages),
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      }),
    [spot.name, index, spot.time_from, spot.time_to, totalImages],
  );

  const lat = spot.latitude;
  const lng = spot.longitude;
  const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
  const mapillaryUrl = `https://www.mapillary.com/app/?lat=${lat}&lng=${lng}&z=17`;

  return (
    <Marker position={[lat, lng]} icon={icon} zIndexOffset={200}>
      <Popup minWidth={200} maxWidth={280}>
        <div style={{ fontFamily: 'inherit', fontSize: 12, lineHeight: 1.5 }}>
          <div style={{ fontWeight: 800, color: '#1C2B6B', marginBottom: 2 }}>{spot.name}</div>
          {(spot.time_from || spot.time_to) && (
            <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>
              {formatExactTime(spot.time_from)} – {formatExactTime(spot.time_to)}
            </div>
          )}
          {totalImages > 0 && (
            <div style={{ color: '#475569', fontSize: 11, marginBottom: 6 }}>
              {totalImages.toLocaleString()} images total
            </div>
          )}
          {cameras.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8, fontSize: 11 }}>
              <thead>
                <tr style={{ color: '#94a3b8', fontWeight: 700 }}>
                  <td style={{ paddingBottom: 2 }}>Code</td>
                  <td style={{ paddingBottom: 2 }}>Time</td>
                  <td style={{ paddingBottom: 2, textAlign: 'right' }}>Img</td>
                </tr>
              </thead>
              <tbody>
                {cameras.map((cam, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ paddingTop: 2, fontWeight: 700, color: '#1C2B6B' }}>{cam.code}</td>
                    <td style={{ paddingTop: 2, color: '#475569', whiteSpace: 'nowrap' }}>
                      {formatExactTime(cam.time_from)}–{formatExactTime(cam.time_to)}
                    </td>
                    <td style={{ paddingTop: 2, textAlign: 'right', color: '#64748b' }}>
                      {cam.images > 0 ? cam.images.toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <button
            type="button"
            onClick={() => {
              map.closePopup();
              openCreateSpotModal(lat, lng, { name: spot.name, location_type: 'photo' });
            }}
            style={{ display: 'block', width: '100%', marginTop: 8, marginBottom: 4, background: '#1C2B6B', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 0', fontSize: 12, fontWeight: 800, cursor: 'pointer', letterSpacing: '0.01em' }}
          >
            Übernehmen
          </button>
          <div style={{ display: 'flex', gap: 6 }}>
            <a href={streetViewUrl} target="_blank" rel="noreferrer"
              style={{ flex: 1, textAlign: 'center', background: '#f1f5f9', color: '#1C2B6B', borderRadius: 6, padding: '4px 0', fontSize: 11, fontWeight: 700, textDecoration: 'none', display: 'block' }}>
              Street View
            </a>
            <a href={mapillaryUrl} target="_blank" rel="noreferrer"
              style={{ flex: 1, textAlign: 'center', background: '#f1f5f9', color: '#1C2B6B', borderRadius: 6, padding: '4px 0', fontSize: 11, fontWeight: 700, textDecoration: 'none', display: 'block' }}>
              Mapillary
            </a>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

function MapResize({ active }) {
  const map = useMap();
  useEffect(() => {
    if (!active) return undefined;
    const timer = setTimeout(() => map.invalidateSize(), 120);
    return () => clearTimeout(timer);
  }, [map, active]);
  return null;
}

function MapClickHandler({ enabled, onMapClick }) {
  const map = useMap();
  useEffect(() => {
    if (!enabled || !onMapClick) return undefined;
    const handler = (e) => onMapClick(e.latlng.lat, e.latlng.lng);
    map.on('click', handler);
    return () => map.off('click', handler);
  }, [map, enabled, onMapClick]);
  return null;
}

function DirectionArrows({ track, color }) {
  const map = useMap();
  const markers = useMemo(() => {
    if (!track?.points?.length || track.points.length < 2) return [];
    const count = Math.max(3, Math.min(10, Math.floor((track.totalKm || 0) / 3)));
    const intervalKm = (track.totalKm || 1) / (count + 1);
    let nextKm = intervalKm;
    const arrows = [];

    for (let i = 1; i < track.points.length; i += 1) {
      if (track.cumKm[i] < nextKm) continue;
      nextKm += intervalKm;
      const p1 = track.points[i];
      const p2 = track.points[Math.min(i + 10, track.points.length - 1)];
      const deg = (Math.atan2(p2.lng - p1.lng, p2.lat - p1.lat) * 180) / Math.PI;
      const html = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14"><polygon points="7,1 11,11 7,8 3,11" fill="${color}" opacity="0.65" stroke="rgba(255,255,255,0.5)" stroke-width="0.8" stroke-linejoin="round" transform="rotate(${deg.toFixed(1)},7,7)"/></svg>`;
      arrows.push({
        key: `${i}-${nextKm}`,
        pos: [p1.lat, p1.lng],
        icon: L.divIcon({ className: '', html, iconSize: [14, 14], iconAnchor: [7, 7] }),
      });
      if (nextKm > track.totalKm) break;
    }
    return arrows;
  }, [track, color]);

  useEffect(() => {
    const refs = markers.map((a) => L.marker(a.pos, { icon: a.icon, interactive: false, zIndexOffset: -200 }).addTo(map));
    return () => refs.forEach((m) => m.remove());
  }, [map, markers]);

  return null;
}

function SpotMapMarker({
  spot,
  index,
  assignments,
  photographers,
  interactive,
  onSpotClick,
  onSpotDragEnd,
}) {
  const draggable = interactive && isPhotoLocation(spot);

  const icon = useMemo(
    () =>
      L.divIcon({
        className: '',
        html: buildSpotMarkerHtml(spot, index + 1),
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      }),
    [spot, index],
  );

  const spotAssignments = assignments.filter((a) => a.spot_id === spot.id);
  const nav = getSpotNavUrls(spot.latitude, spot.longitude);

  return (
    <Marker
      position={[spot.latitude, spot.longitude]}
      icon={icon}
      draggable={draggable}
      zIndexOffset={500}
      eventHandlers={{
        click: (e) => {
          L.DomEvent.stopPropagation(e);
          onSpotClick?.(spot.id);
        },
        dragend: (e) => {
          const { lat, lng } = e.target.getLatLng();
          onSpotDragEnd?.(spot.id, lat, lng);
        },
      }}
    >
      <Popup>
        <div className="min-w-[190px] text-xs leading-snug">
          <strong className="text-sm text-[#1C2B6B]">
            ({index + 1}) {spot.name}
          </strong>
          {(spot.time_from || spot.time_to) && (
            <div className="mt-1 font-semibold text-[#5b6aa8]">
              {formatTimeShort(spot.time_from)} – {formatTimeShort(spot.time_to)}
            </div>
          )}
          {spot.results?.length > 0 ? (
            <ul className="mt-1 space-y-0.5 text-[#5b6aa8]">
              {spot.results.map((r, i) => (
                <li key={i}>
                  {r.trackName}: <strong>KM {Number(r.km).toFixed(1)}</strong>
                </li>
              ))}
            </ul>
          ) : spot.km_mark != null ? (
            <div className="mt-0.5 text-[#8a93b0]">{spot.km_mark.toFixed?.(1) ?? spot.km_mark} km</div>
          ) : null}
          {spotAssignments.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {spotAssignments.map((a) => {
                const ph = photographers.find((p) => p.id === a.photographer_id);
                return (
                  <li key={a.id} className="font-bold text-[#1C2B6B]">
                    {ph?.code || '?'}
                  </li>
                );
              })}
            </ul>
          )}
          {spot.refImages?.length > 0 && (
            <div className="mt-2 flex gap-1">
              {spot.refImages.slice(0, 3).map((img, i) => (
                <img key={i} src={img.data} alt="" className="h-12 w-12 rounded object-cover" />
              ))}
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <a href={nav.mapsPin} target="_blank" rel="noreferrer" className="font-bold text-[#1C2B6B]">
              Maps
            </a>
            <a href={nav.streetView} target="_blank" rel="noreferrer" className="font-bold text-[#4285F4]">
              Street View
            </a>
            <a href={nav.mapillary} target="_blank" rel="noreferrer" className="font-bold text-[#1DB846]">
              Mapillary
            </a>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export function TacticMap({
  tactic,
  spots = [],
  referenceSpots = [],
  referenceTimeline = [],
  showReferenceLayer = true,
  assignments = [],
  photographers = [],
  interactive = true,
  showLayerToggle = true,
  enableMapClick = false,
  onMapClick,
  onSpotClick,
  onSpotDragEnd,
  onToggleReferenceLayer,
  hoverKm = null,
  className = 'h-full w-full',
}) {
  const [layer, setLayer] = useState('map');
  const { t } = useTranslation();
  const tracks = tactic ? getGpxTracks(tactic) : [];

  const spotsWithCoords = spots
    .filter((s) => s.latitude != null && s.longitude != null)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const referenceWithCoords = (showReferenceLayer ? referenceSpots : [])
    .filter((s) => s.latitude != null && s.longitude != null)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const referenceWithCoordsAll = referenceSpots.filter((s) => s.latitude != null && s.longitude != null);
  const hasData = spotsWithCoords.length > 0 || referenceWithCoordsAll.length > 0 || tracks.length > 0;
  const defaultCenter = spotsWithCoords[0]
    ? [spotsWithCoords[0].latitude, spotsWithCoords[0].longitude]
    : tracks[0]?.points[0]
      ? [tracks[0].points[0].lat, tracks[0].points[0].lng]
      : referenceWithCoordsAll[0]
        ? [referenceWithCoordsAll[0].latitude, referenceWithCoordsAll[0].longitude]
        : [51.5, -0.12];

  const startIcon = useMemo(
    () =>
      L.divIcon({
        className: '',
        html: '<div style="width:14px;height:14px;border-radius:50%;background:#22c55e;border:2.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      }),
    [],
  );

  const finishIcon = useMemo(
    () =>
      L.divIcon({
        className: '',
        html: '<div style="font-size:22px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.4))">🏁</div>',
        iconSize: [22, 22],
        iconAnchor: [4, 20],
      }),
    [],
  );

  if (!hasData) {
    return (
      <div className={`flex items-center justify-center bg-[#f8f9fc] text-sm text-[#9aa3bf] ${className}`}>
        Load GPX or import an infofile with coordinates.
      </div>
    );
  }

  const tile = TILES[layer];

  return (
    <div className={`relative ${className}`}>
      {showLayerToggle && (
        <div className="absolute right-2 top-2 z-[500] flex overflow-hidden rounded-lg border border-white/80 bg-white/95 text-[10px] font-bold shadow-md">
          {(['map', 'satellite', 'terrain']).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setLayer(key)}
              className={`px-2.5 py-1.5 capitalize ${layer === key ? 'bg-[#1C2B6B] text-white' : 'text-[#5b6aa8]'}`}
            >
              {key === 'map' ? 'Map' : key}
            </button>
          ))}
        </div>
      )}

      <div className="absolute left-2 top-[90px] z-[500] flex flex-col gap-1.5">
        {interactive && enableMapClick && (
          <div className="rounded-lg bg-black/30 px-2.5 py-1 text-[10px] text-white/80 backdrop-blur-sm">
            Click map to add spot
          </div>
        )}
        {referenceSpots.length > 0 && onToggleReferenceLayer && (
          <button
            type="button"
            onClick={onToggleReferenceLayer}
            className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold shadow-md ${
              showReferenceLayer ? 'bg-[#7c3aed] text-white' : 'bg-white/95 text-[#7c3aed]'
            }`}
          >
            {showReferenceLayer ? t('toolsHideReference') : t('toolsShowReference')}
          </button>
        )}
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={13}
        className="h-full w-full"
        scrollWheelZoom={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        touchZoom={interactive}
      >
        <TileLayer attribution={tile.attribution} url={tile.url} maxZoom={tile.maxZoom} />
        <MapResize active />
        <FitBounds spots={spotsWithCoords} referenceSpots={referenceWithCoords} tracks={tracks} />
        <MapClickHandler enabled={interactive && enableMapClick} onMapClick={onMapClick} />

        {tracks.map((track, trackIndex) => {
          const color = TRACK_COLORS[trackIndex % TRACK_COLORS.length];
          const positions = pointsToLatLngArray(track.points);
          if (positions.length < 2) return null;
          return (
            <Polyline key={track.name + trackIndex} positions={positions} color={color} weight={4} opacity={0.88} />
          );
        })}

        {/* Elevation profile hover marker */}
        {hoverKm != null && tracks.map((track, trackIndex) => {
          const idx = track.cumKm.findIndex((c) => c >= hoverKm);
          const i = idx === -1 ? track.points.length - 1 : idx;
          const pt = track.points[i];
          if (!pt) return null;
          const color = TRACK_COLORS[trackIndex % TRACK_COLORS.length];
          const icon = L.divIcon({
            className: '',
            html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4);margin:-7px 0 0 -7px"></div>`,
            iconSize: [0, 0],
          });
          return <Marker key={`hover-${trackIndex}`} position={[pt.lat, pt.lng]} icon={icon} interactive={false} />;
        })}

        {tracks.map((track, trackIndex) => (
          <DirectionArrows
            key={`arrows-${track.name}-${trackIndex}`}
            track={track}
            color={TRACK_COLORS[trackIndex % TRACK_COLORS.length]}
          />
        ))}

        {tracks.map((track, trackIndex) => {
          if (!track.points.length) return null;
          const start = track.points[0];
          const end = track.points[track.points.length - 1];
          return (
            <Fragment key={`ends-${trackIndex}`}>
              <Marker position={[start.lat, start.lng]} icon={startIcon} interactive={false} zIndexOffset={100} />
              {track.points.length > 1 && (
                <Marker position={[end.lat, end.lng]} icon={finishIcon} interactive={false} zIndexOffset={100} />
              )}
            </Fragment>
          );
        })}

        {referenceWithCoords.map((spot, index) => (
          <ReferenceSpotMarker
            key={`ref-${spot.id}-${index}`}
            spot={spot}
            index={index}
            referenceTimeline={referenceTimeline}
          />
        ))}

        {spotsWithCoords.map((spot, index) => (
          <SpotMapMarker
            key={spot.id}
            spot={spot}
            index={index}
            assignments={assignments}
            photographers={photographers}
            interactive={interactive}
            onSpotClick={onSpotClick}
            onSpotDragEnd={onSpotDragEnd}
          />
        ))}
      </MapContainer>
    </div>
  );
}
