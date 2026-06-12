import { useCallback, useMemo, useRef, useState } from 'react';
import { TRACK_COLORS } from '../lib/locationTypes';

const HEIGHT = 100;
const PAD_TOP = 14;
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
  const pts2 = profile.pts
    .map((p, i) => p.ele != null
      ? `${kmToX(profile.cumKm[i], profile.totalKm, width).toFixed(1)},${eleToY(p.ele, profile.minEle, profile.range).toFixed(1)}`
      : null)
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
  for (let k = 0; k <= totalKm; k += step) ticks.push({ km: k, x: kmToX(k, totalKm, width) });
  return ticks;
}

function eleAtKm(profile, km) {
  if (!profile || km == null) return null;
  const idx = profile.cumKm.findIndex((c) => c >= km);
  const i = idx === -1 ? profile.pts.length - 1 : Math.max(0, idx);
  return profile.pts[i]?.ele ?? null;
}

function buildSpotMarkers(spots, profile, width) {
  if (!spots?.length || !profile) return [];
  return spots
    .filter((s) => s.km_mark != null && s.km_mark >= 0 && s.km_mark <= profile.totalKm)
    .map((s) => {
      const ele = eleAtKm(profile, s.km_mark);
      const x = kmToX(s.km_mark, profile.totalKm, width);
      const y = ele != null ? eleToY(ele, profile.minEle, profile.range) : HEIGHT - PAD_BOTTOM;
      return { spot: s, x, y };
    });
}

function ActiveProfile({ track, trackIndex, spots, color, onHoverKm }) {
  const svgRef = useRef(null);
  const [width, setWidth] = useState(600);
  const [hoverKm, setHoverKm] = useState(null);

  const measuredRef = useCallback((node) => {
    if (!node) return;
    const ro = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width || 600));
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const profile = useMemo(() => buildProfile(track), [track]);
  if (!profile) return null;

  const linePath = buildPath(profile, width);
  const fillPath = buildFill(profile, width);
  const ticks = kmTicks(profile.totalKm, width);
  const spotMarkers = buildSpotMarkers(spots, profile, width);

  const hoverX = hoverKm != null ? kmToX(hoverKm, profile.totalKm, width) : null;
  const hoverEle = hoverKm != null ? eleAtKm(profile, hoverKm) : null;
  const hoverY = hoverEle != null ? eleToY(hoverEle, profile.minEle, profile.range) : null;

  function handleMouseMove(e) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const km = Math.max(0, Math.min(profile.totalKm, ((x - PAD_LEFT) / (width - PAD_LEFT - PAD_RIGHT)) * profile.totalKm));
    setHoverKm(km);
    onHoverKm?.(km);
  }

  function handleMouseLeave() {
    setHoverKm(null);
    onHoverKm?.(null);
  }

  return (
    <div ref={measuredRef} className="relative w-full select-none" style={{ height: HEIGHT }}>
      <svg
        ref={svgRef}
        width={width}
        height={HEIGHT}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="cursor-crosshair block"
      >
        <path d={fillPath} fill={color} fillOpacity={0.13} />
        <path d={linePath} fill="none" stroke={color} strokeWidth={1.5} />

        <line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={HEIGHT - PAD_BOTTOM} stroke="#e3e7f2" strokeWidth={1} />
        <line x1={PAD_LEFT} y1={HEIGHT - PAD_BOTTOM} x2={width - PAD_RIGHT} y2={HEIGHT - PAD_BOTTOM} stroke="#e3e7f2" strokeWidth={1} />

        {ticks.map(({ km, x }) => (
          <g key={km}>
            <line x1={x} y1={HEIGHT - PAD_BOTTOM} x2={x} y2={HEIGHT - PAD_BOTTOM + 3} stroke="#c0c8e0" strokeWidth={1} />
            <text x={x} y={HEIGHT - 4} textAnchor="middle" fontSize={9} fill="#9aa3bf">{km}</text>
          </g>
        ))}

        <text x={PAD_LEFT - 3} y={PAD_TOP + 4} textAnchor="end" fontSize={9} fill="#9aa3bf">{Math.round(profile.maxEle)}</text>
        <text x={PAD_LEFT - 3} y={HEIGHT - PAD_BOTTOM - 1} textAnchor="end" fontSize={9} fill="#9aa3bf">{Math.round(profile.minEle)}</text>
        <text x={width - PAD_RIGHT} y={HEIGHT - 4} textAnchor="end" fontSize={9} fill="#9aa3bf">km</text>

        {spotMarkers.map(({ spot, x, y }) => (
          <g key={spot.id}>
            <line x1={x} y1={y} x2={x} y2={HEIGHT - PAD_BOTTOM} stroke="#1C2B6B" strokeWidth={0.7} strokeDasharray="2,2" strokeOpacity={0.3} />
            <circle cx={x} cy={y} r={3.5} fill="#1C2B6B" fillOpacity={0.75} stroke="white" strokeWidth={1} />
            {spot.name && (
              <text x={x} y={y - 6} textAnchor="middle" fontSize={8} fill="#1C2B6B" fontWeight="bold" opacity={0.85}>
                {spot.name}
              </text>
            )}
          </g>
        ))}

        {hoverX != null && (
          <g>
            <line x1={hoverX} y1={PAD_TOP} x2={hoverX} y2={HEIGHT - PAD_BOTTOM} stroke={color} strokeWidth={1} strokeDasharray="3,2" />
            {hoverY != null && (
              <>
                <circle cx={hoverX} cy={hoverY} r={3.5} fill={color} />
                <text
                  x={Math.min(hoverX + 5, width - 60)}
                  y={hoverY - 5}
                  fontSize={9} fill={color} fontWeight="bold"
                >
                  {Math.round(hoverEle)}m · {hoverKm?.toFixed(1)}km
                </text>
              </>
            )}
          </g>
        )}
      </svg>
    </div>
  );
}

export function ElevationProfile({ tracks = [], spots = [], onHoverKm, onActiveTrackIndex }) {
  const profiles = useMemo(() => tracks.map(buildProfile), [tracks]);
  const hasData = profiles.some(Boolean);

  // Default to first track that has elevation data
  const [activeIndex, setActiveIndex] = useState(() => profiles.findIndex(Boolean));

  if (!hasData) return null;

  function selectTrack(i) {
    setActiveIndex(i);
    onActiveTrackIndex?.(i);
    onHoverKm?.(null);
  }

  return (
    <div className="flex flex-col bg-white">
      {/* Track selector tabs */}
      {tracks.length > 1 && (
        <div className="flex gap-0 border-b border-[#e3e7f2] overflow-x-auto">
          {tracks.map((track, i) => {
            const profile = profiles[i];
            if (!profile) return null;
            const color = TRACK_COLORS[i % TRACK_COLORS.length];
            const isActive = activeIndex === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => selectTrack(i)}
                className={`flex shrink-0 items-center gap-1.5 px-3 py-2 text-[11px] font-bold transition-colors border-b-2 ${
                  isActive
                    ? 'border-[#1C2B6B] text-[#1C2B6B] bg-[#f4f6ff]'
                    : 'border-transparent text-[#8a93b0] hover:text-[#1C2B6B] hover:bg-[#f8f9ff]'
                }`}
              >
                <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
                {track.name || `Track ${i + 1}`}
                <span className="text-[9px] font-normal opacity-70">{profile.totalKm.toFixed(1)} km</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Single track header (no tabs needed) */}
      {tracks.length === 1 && profiles[0] && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#f0f2fa]">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: TRACK_COLORS[0] }} />
          <span className="text-[10px] font-semibold text-[#8a93b0]">{tracks[0].name || 'Track 1'}</span>
          <span className="text-[10px] text-[#b0b8cf]">
            {profiles[0].totalKm.toFixed(1)} km · {Math.round(profiles[0].minEle)}–{Math.round(profiles[0].maxEle)} m
          </span>
        </div>
      )}

      {/* Active profile */}
      {activeIndex != null && tracks[activeIndex] && profiles[activeIndex] && (
        <ActiveProfile
          key={activeIndex}
          track={tracks[activeIndex]}
          trackIndex={activeIndex}
          spots={spots}
          color={TRACK_COLORS[activeIndex % TRACK_COLORS.length]}
          onHoverKm={(km) => {
            onHoverKm?.(km);
          }}
        />
      )}
    </div>
  );
}
