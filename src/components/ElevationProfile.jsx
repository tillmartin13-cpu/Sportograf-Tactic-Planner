import { useCallback, useMemo, useRef, useState } from 'react';
import { TRACK_COLORS } from '../lib/locationTypes';

const HEIGHT = 96;
const HEIGHT_COLLAPSED = 28;
const PAD_TOP = 10;
const PAD_BOTTOM = 20;
const PAD_LEFT = 36;
const PAD_RIGHT = 8;

function buildProfile(track) {
  const pts = track.points;
  const eles = pts.map((p) => p.ele).filter((e) => e != null);
  if (eles.length < 2) return null;

  const minEle = Math.min(...eles);
  const maxEle = Math.max(...eles);
  const range = maxEle - minEle || 1;
  const totalKm = track.totalKm || track.cumKm?.[track.cumKm.length - 1] || 1;

  return { pts, eles, minEle, maxEle, range, totalKm, cumKm: track.cumKm };
}

function kmToX(km, totalKm, width) {
  return PAD_LEFT + ((km / totalKm) * (width - PAD_LEFT - PAD_RIGHT));
}

function eleToY(ele, minEle, range) {
  return PAD_TOP + (1 - (ele - minEle) / range) * (HEIGHT - PAD_TOP - PAD_BOTTOM);
}

function buildPath(profile, width) {
  if (!profile) return '';
  const { pts, cumKm, totalKm, minEle, range } = profile;
  const pts2 = pts
    .map((p, i) => (p.ele != null ? `${kmToX(cumKm[i], totalKm, width).toFixed(1)},${eleToY(p.ele, minEle, range).toFixed(1)}` : null))
    .filter(Boolean);
  if (pts2.length < 2) return '';
  return `M${pts2.join('L')}`;
}

function buildFill(profile, width) {
  const path = buildPath(profile, width);
  if (!path) return '';
  const bottom = HEIGHT - PAD_BOTTOM;
  const firstX = kmToX(profile.cumKm[0], profile.totalKm, width);
  const lastX = kmToX(profile.cumKm[profile.pts.length - 1], profile.totalKm, width);
  return `${path}L${lastX},${bottom}L${firstX},${bottom}Z`;
}

function kmTicks(totalKm, width) {
  const step = totalKm <= 20 ? 5 : totalKm <= 50 ? 10 : totalKm <= 100 ? 20 : 50;
  const ticks = [];
  for (let k = 0; k <= totalKm; k += step) {
    ticks.push({ km: k, x: kmToX(k, totalKm, width) });
  }
  return ticks;
}

function getHoverInfo(profile, km, width) {
  if (!profile || km == null) return null;
  const idx = profile.cumKm.findIndex((c) => c >= km);
  const i = idx === -1 ? profile.pts.length - 1 : idx;
  const ele = profile.pts[i]?.ele;
  return { x: kmToX(km, profile.totalKm, width), ele };
}

// Elevation at a specific km on this track
function eleAtKm(profile, km) {
  if (!profile || km == null) return null;
  const idx = profile.cumKm.findIndex((c) => c >= km);
  const i = idx === -1 ? profile.pts.length - 1 : Math.max(0, idx);
  return profile.pts[i]?.ele ?? null;
}

// Build spot markers with elevation-accurate y position
function buildSpotMarkers(spots, profile, width) {
  if (!spots?.length || !profile) return [];
  return spots
    .filter((s) => s.km_mark != null && s.km_mark >= 0 && s.km_mark <= profile.totalKm)
    .map((s) => {
      const ele = eleAtKm(profile, s.km_mark);
      const x = kmToX(s.km_mark, profile.totalKm, width);
      const y = ele != null ? eleToY(ele, profile.minEle, profile.range) : (HEIGHT - PAD_BOTTOM);
      return { spot: s, x, y };
    });
}

function TrackProfile({ track, trackIndex, spots, isActive, isAnyActive, onHoverKm, onHoverStart, onHoverEnd }) {
  const svgRef = useRef(null);
  const [width, setWidth] = useState(600);
  const [hoverKm, setHoverKm] = useState(null);

  const measuredRef = useCallback((node) => {
    if (!node) return;
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width || 600);
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const profile = useMemo(() => buildProfile(track), [track]);
  const color = TRACK_COLORS[trackIndex % TRACK_COLORS.length] ?? '#1C2B6B';

  if (!profile) return null;

  const collapsed = isAnyActive && !isActive;
  const h = collapsed ? HEIGHT_COLLAPSED : HEIGHT;

  const hoverInfo = isActive ? getHoverInfo(profile, hoverKm, width) : null;
  const spotMarkers = isActive || !isAnyActive ? buildSpotMarkers(spots, profile, width) : [];
  const linePath = buildPath(profile, width);
  const fillPath = buildFill(profile, width);
  const ticks = kmTicks(profile.totalKm, width);

  function handleMouseMove(e) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const km = Math.max(0, Math.min(profile.totalKm, ((x - PAD_LEFT) / (width - PAD_LEFT - PAD_RIGHT)) * profile.totalKm));
    setHoverKm(km);
    onHoverKm?.(km);
  }

  function handleMouseEnter() {
    onHoverStart?.(trackIndex);
  }

  function handleMouseLeave() {
    setHoverKm(null);
    onHoverKm?.(null);
    onHoverEnd?.();
  }

  // Scale SVG content for collapsed state
  const scaleY = collapsed ? (HEIGHT_COLLAPSED / HEIGHT) : 1;

  return (
    <div
      className="flex flex-col transition-all duration-200"
      style={{ opacity: collapsed ? 0.45 : 1 }}
    >
      <div className="flex items-center gap-2 px-2 py-0.5">
        <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-[10px] font-semibold text-[#8a93b0] truncate">{track.name || `Track ${trackIndex + 1}`}</span>
        <span className="text-[10px] text-[#b0b8cf]">{profile.totalKm.toFixed(1)} km · {Math.round(profile.minEle)}–{Math.round(profile.maxEle)} m</span>
      </div>
      <div
        ref={measuredRef}
        className="relative w-full select-none overflow-hidden transition-all duration-200"
        style={{ height: h }}
      >
        <svg
          ref={svgRef}
          width={width}
          height={HEIGHT}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="cursor-crosshair"
          style={{ transform: `scaleY(${scaleY})`, transformOrigin: 'bottom', display: 'block' }}
        >
          {/* Fill */}
          <path d={fillPath} fill={color} fillOpacity={0.13} />
          {/* Line */}
          <path d={linePath} fill="none" stroke={color} strokeWidth={1.5} />

          {/* Axes */}
          <line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={HEIGHT - PAD_BOTTOM} stroke="#e3e7f2" strokeWidth={1} />
          <line x1={PAD_LEFT} y1={HEIGHT - PAD_BOTTOM} x2={width - PAD_RIGHT} y2={HEIGHT - PAD_BOTTOM} stroke="#e3e7f2" strokeWidth={1} />

          {!collapsed && (
            <>
              {/* Km ticks */}
              {ticks.map(({ km, x }) => (
                <g key={km}>
                  <line x1={x} y1={HEIGHT - PAD_BOTTOM} x2={x} y2={HEIGHT - PAD_BOTTOM + 3} stroke="#c0c8e0" strokeWidth={1} />
                  <text x={x} y={HEIGHT - 4} textAnchor="middle" fontSize={9} fill="#9aa3bf">{km}</text>
                </g>
              ))}

              {/* Ele labels */}
              <text x={PAD_LEFT - 3} y={PAD_TOP + 4} textAnchor="end" fontSize={9} fill="#9aa3bf">{Math.round(profile.maxEle)}</text>
              <text x={PAD_LEFT - 3} y={HEIGHT - PAD_BOTTOM - 1} textAnchor="end" fontSize={9} fill="#9aa3bf">{Math.round(profile.minEle)}</text>
              <text x={width - PAD_RIGHT} y={HEIGHT - 4} textAnchor="end" fontSize={9} fill="#9aa3bf">km</text>

              {/* Spot markers at correct elevation */}
              {spotMarkers.map(({ spot, x, y }) => {
                const display = spot.name || '';
                return (
                  <g key={spot.id}>
                    {/* Vertical drop line from spot dot to x-axis */}
                    <line x1={x} y1={y} x2={x} y2={HEIGHT - PAD_BOTTOM} stroke="#1C2B6B" strokeWidth={0.7} strokeDasharray="2,2" strokeOpacity={0.3} />
                    {/* Dot on the elevation line */}
                    <circle cx={x} cy={y} r={3.5} fill="#1C2B6B" fillOpacity={0.75} stroke="white" strokeWidth={1} />
                    {/* Label above the dot */}
                    {display && (
                      <text x={x} y={y - 6} textAnchor="middle" fontSize={8} fill="#1C2B6B" fontWeight="bold" opacity={0.85}>
                        {display}
                      </text>
                    )}
                  </g>
                );
              })}
            </>
          )}

          {/* Hover cursor */}
          {hoverInfo && (
            <g>
              <line x1={hoverInfo.x} y1={PAD_TOP} x2={hoverInfo.x} y2={HEIGHT - PAD_BOTTOM} stroke={color} strokeWidth={1} strokeDasharray="3,2" />
              <circle
                cx={hoverInfo.x}
                cy={hoverInfo.ele != null ? eleToY(hoverInfo.ele, profile.minEle, profile.range) : HEIGHT - PAD_BOTTOM}
                r={3.5} fill={color}
              />
              {hoverInfo.ele != null && (
                <text
                  x={Math.min(hoverInfo.x + 5, width - 55)}
                  y={eleToY(hoverInfo.ele, profile.minEle, profile.range) - 5}
                  fontSize={9} fill={color} fontWeight="bold"
                >
                  {Math.round(hoverInfo.ele)}m · {hoverKm?.toFixed(1)}km
                </text>
              )}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

export function ElevationProfile({ tracks = [], spots = [], onHoverKm, onActiveTrackIndex }) {
  const profiles = useMemo(() => tracks.map(buildProfile), [tracks]);
  const hasData = profiles.some(Boolean);
  const [activeTrackIndex, setActiveTrackIndex] = useState(null);

  if (!hasData) return null;

  function handleHoverStart(i) {
    setActiveTrackIndex(i);
    onActiveTrackIndex?.(i);
  }

  function handleHoverEnd() {
    setActiveTrackIndex(null);
    onActiveTrackIndex?.(null);
  }

  return (
    <div className="flex flex-col divide-y divide-[#f0f2fa] rounded-xl border border-[#e3e7f2] bg-white overflow-hidden">
      {tracks.map((track, i) => (
        <TrackProfile
          key={track.name ?? i}
          track={track}
          trackIndex={i}
          spots={spots}
          isActive={activeTrackIndex === i}
          isAnyActive={activeTrackIndex !== null}
          onHoverKm={activeTrackIndex === i || activeTrackIndex === null ? onHoverKm : undefined}
          onHoverStart={handleHoverStart}
          onHoverEnd={handleHoverEnd}
        />
      ))}
    </div>
  );
}
