import { getLocationColor, getMarkerDisplayName, isPhotoLocation } from './locationTypes';

export function buildSpotMarkerHtml(spot, index) {
  const color = getLocationColor(spot);
  const text = getMarkerDisplayName(spot);
  const showIndex = isPhotoLocation(spot);
  const label = showIndex ? `<span style="opacity:0.85;margin-right:3px">${index}.</span>${text}` : text;

  return `
    <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%)">
      <div style="background:${color};color:#fff;border-radius:8px;padding:3px 8px;font-size:11px;font-weight:900;letter-spacing:0.2px;white-space:nowrap;position:relative;margin-bottom:5px;box-shadow:0 2px 6px rgba(0,0,0,0.28)">
        ${label}
        <div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${color}"></div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;margin:0 auto;width:fit-content">
        <div style="width:2px;height:10px;background:${color};border-radius:2px"></div>
        <div style="width:8px;height:8px;background:${color};border-radius:50%;margin-top:-1px;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.25)"></div>
      </div>
    </div>
  `;
}
