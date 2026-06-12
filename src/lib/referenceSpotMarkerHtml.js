export function buildReferenceSpotMarkerHtml(name, index) {
  const text = (name || `#${index}`).slice(0, 12);
  return `
    <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);opacity:0.65">
      <div style="background:#64748b;color:#fff;border:1.5px dashed #94a3b8;border-radius:6px;padding:2px 7px;font-size:10px;font-weight:700;white-space:nowrap;position:relative;margin-bottom:4px;letter-spacing:0.01em">
        ${text}
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;margin:0 auto;width:fit-content">
        <div style="width:1.5px;height:7px;background:#94a3b8;border-radius:2px"></div>
        <div style="width:6px;height:6px;background:#94a3b8;border-radius:50%;border:1.5px solid #fff"></div>
      </div>
    </div>
  `;
}
