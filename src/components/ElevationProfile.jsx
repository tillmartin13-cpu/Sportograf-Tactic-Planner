import { useCallback, useMemo, useRef, useState } from 'react';
import { useTactic } from '../hooks/useTactic';
import { useCurrentEvent } from '../hooks/useCurrentEvent';
import { TRACK_COLORS } from '../lib/locationTypes';

const HEIGHT = 88;
const PAD_TOP = 8;
const PAD_BOTTOM = 20; // space for km labels
const PAD_LEFT = 36;
const PAD_RIGHT = 8;

function buildProfile(track) {
  const pts = track.points;
  const eles = pts.map((p) => p.ele).filter((e) => e != null);
  if (eles.length < 2) return null;

  const minEle = Math.min(...eles);
  const maxEle = Math.max(...eles);
  const range = maxEle - minEle || 1;
  const totalKm = track.totalKm || track.cumKm[track.cumKm.length - 1] || 1;

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
  const drawH = HEIGHT - PAD_TOP - PAD_BOTTOM;
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

export function ElevationProfile({ onHoverKm, hoverKm }) {
  const event = useCurrentEvent();
  const tactic = useTactic(event?.id);
  const svgRef = useRef(null);
  const [width, setWidth] = useState(600);

  const tracks = tactic?.gpxTracks ?? [];
  const profiles = useMemo(() => tracks.map(buildProfile), [tracks]);
  const hasData = profiles.some(Boolean);

  const measuredRef = useCallback((node) => {
    if (!node) return;
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width || 600);
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  if (!hasData) return null;

  function handleMouseMove(e) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const profile = profiles.find(Boolean);
    if (!profile) return;
    const km = Math.max(0, Math.min(profile.totalKm, ((x - PAD_LEFT) / (width - PAD_LEFT - PAD_RIGHT)) * profile.totalKm));
    onHoverKm?.(km);
  }

  function handleMouseLeave() {
    onHoverKm?.(null);
  }

  // Find ele at hoverKm for tooltip
  function getHoverInfo(profile, km) {
    if (!profile || km == null) return null;
    const idx = profile.cumKm.findIndex((c) => c >= km);
    const i = idx === -1 ? profile.pts.length - 1 : idx;
    const ele = profile.pts[i]?.ele;
    return { x: kmToX(km, profile.totalKm, width), ele };
  }

  return (
    <div ref={measuredRef} className="relative w-full select-none rounded-xl border border-[#e3e7f2] bg-white overflow-hidden" style={{ height: HEIGHT }}>
      <svg
        ref={svgRef}
        width={width}
        height={HEIGHT}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="cursor-crosshair"
      >
        {profiles.map((profile, ti) => {
          if (!profile) return null;
          const color = TRACK_COLORS[ti % TRACK_COLORS.length] ?? '#1C2B6B';
          const fillPath = buildFill(profile, width);
          const linePath = buildPath(profile, width);
          const ticks = kmTicks(profile.totalKm, width);
          const hoverInfo = getHoverInfo(profile, hoverKm);

          return (
            <g key={ti}>
              {/* Fill */}
              <path d={fillPath} fill={color} fillOpacity={0.12} />
              {/* Line */}
              <path d={linePath} fill="none" stroke={color} strokeWidth={1.5} />

              {/* Km axis ticks */}
              {ticks.map(({ km, x }) => (
                <g key={km}>
                  <line x1={x} y1={HEIGHT - PAD_BOTTOM} x2={x} y2={HEIGHT - PAD_BOTTOM + 3} stroke="#c0c8e0" strokeWidth={1} />
                  <text x={x} y={HEIGHT - 4} textAnchor="middle" fontSize={9} fill="#9aa3bf">{km}</text>
                </g>
              ))}

              {/* Ele labels */}
              <text x={PAD_LEFT - 3} y={PAD_TOP + 4} textAnchor="end" fontSize={9} fill="#9aa3bf">
                {Math.round(profile.maxEle)}
              </text>
              <text x={PAD_LEFT - 3} y={HEIGHT - PAD_BOTTOM - 1} textAnchor="end" fontSize={9} fill="#9aa3bf">
                {Math.round(profile.minEle)}
              </text>

              {/* Hover cursor */}
              {hoverInfo && (
                <g>
                  <line
                    x1={hoverInfo.x} y1={PAD_TOP} x2={hoverInfo.x} y2={HEIGHT - PAD_BOTTOM}
                    stroke={color} strokeWidth={1} strokeDasharray="3,2"
                  />
                  <circle cx={hoverInfo.x} cy={hoverInfo.ele != null ? eleToY(hoverInfo.ele, profile.minEle, profile.range) : PAD_TOP}
                    r={3.5} fill={color} />
                  {hoverInfo.ele != null && (
                    <text x={Math.min(hoverInfo.x + 4, width - 50)} y={eleToY(hoverInfo.ele, profile.minEle, profile.range) - 5}
                      fontSize={9} fill={color} fontWeight="bold">
                      {Math.round(hoverInfo.ele)}m · {hoverKm?.toFixed(1)}km
                    </text>
                  )}
                </g>
              )}
            </g>
          );
        })}

        {/* Y axis line */}
        <line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={HEIGHT - PAD_BOTTOM} stroke="#e3e7f2" strokeWidth={1} />
        {/* X axis line */}
        <line x1={PAD_LEFT} y1={HEIGHT - PAD_BOTTOM} x2={width - PAD_RIGHT} y2={HEIGHT - PAD_BOTTOM} stroke="#e3e7f2" strokeWidth={1} />

        {/* km label */}
        <text x={width - PAD_RIGHT} y={HEIGHT - 4} textAnchor="end" fontSize={9} fill="#9aa3bf">km</text>
      </svg>
    </div>
  );
}
