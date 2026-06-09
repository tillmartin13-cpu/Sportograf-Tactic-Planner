export function buildReferenceSpotMarkerHtml(name, index) {
  const text = (name || `#${index}`).slice(0, 12);
  return `
    <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);opacity:0.72">
      <div style="background:#7c3aed;color:#fff;border:2px dashed #c4b5fd;border-radius:8px;padding:3px 8px;font-size:10px;font-weight:800;white-space:nowrap;position:relative;margin-bottom:5px">
        <span style="opacity:0.9;margin-right:3px">REF</span>${text}
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;margin:0 auto;width:fit-content">
        <div style="width:2px;height:8px;background:#7c3aed;border-radius:2px"></div>
        <div style="width:7px;height:7px;background:#7c3aed;border-radius:50%;border:2px solid #fff"></div>
      </div>
    </div>
  `;
}
