function fmtTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d)) return null;
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

export function buildReferenceSpotMarkerHtml(name, index, timeFrom, timeTo, images) {
  const text = (name || `#${index}`).slice(0, 16);
  const t1 = fmtTime(timeFrom);
  const t2 = fmtTime(timeTo);
  const timeStr = t1 && t2 ? `${t1}–${t2}` : null;
  const imgStr = images > 0 ? `${images.toLocaleString()} img` : null;

  const meta = [timeStr, imgStr].filter(Boolean).join('  ·  ');

  return `
    <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);opacity:0.72">
      <div style="background:#64748b;color:#fff;border:1.5px dashed #94a3b8;border-radius:6px;padding:3px 8px 4px;font-weight:700;white-space:nowrap;position:relative;margin-bottom:4px;letter-spacing:0.01em;text-align:center">
        <div style="font-size:10px;line-height:1.3">${text}</div>
        ${meta ? `<div style="font-size:9px;font-weight:600;color:#cbd5e1;margin-top:1px;letter-spacing:0.02em">${meta}</div>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;margin:0 auto;width:fit-content">
        <div style="width:1.5px;height:7px;background:#94a3b8;border-radius:2px"></div>
        <div style="width:6px;height:6px;background:#94a3b8;border-radius:50%;border:1.5px solid #fff"></div>
      </div>
    </div>
  `;
}
