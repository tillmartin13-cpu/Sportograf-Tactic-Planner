const SCALE = 2; // 2× for crisp sharing
const W = 600; // logical drawing size — canvas is W*SCALE × H*SCALE
const H = 520;

const COLORS = {
  navy: '#1C2B6B',
  red: '#CC2B2B',
  green: '#166534',
  greenBg: '#dcfce7',
  muted: '#8a93b0',
  border: '#e3e7f2',
  white: '#ffffff',
  bg: '#f6f8ff',
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(ctx, text, maxWidth) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  if (!words.length) return ['—'];
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

function formatCertTime(iso, locale) {
  try {
    return new Date(iso).toLocaleString(locale || 'en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function drawRow(ctx, label, value, y, valueColor = COLORS.navy) {
  ctx.font = '600 13px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillStyle = COLORS.muted;
  ctx.textAlign = 'left';
  ctx.fillText(label, 48, y);
  ctx.font = '700 15px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillStyle = valueColor;
  ctx.fillText(value, 180, y);
}

const CAM_DETAIL_LABELS = {
  shutterSpeed: 'Shutter Speed',
  format: 'File Format',
  date: 'Date',
  time: 'Time',
  cardImages: 'Card Images',
  pictureStyle: 'Picture Style',
};

const STATUS_ICON_TEXT = { ok: '✓', warning: '!', failed: '✗', unreadable: '?' };
const STATUS_COLOR = {
  ok: '#166534',
  warning: '#92400e',
  failed: '#CC2B2B',
  unreadable: '#8a93b0',
};

export async function generateCheckInCertificate({
  event,
  photographer,
  cameraOk,
  cameraStatus,
  cameraImageUrl,
  cameraDetails,
  checkedInAt,
  labels,
  completedChecks = [],
  locale = 'en-GB',
}) {
  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.scale(SCALE, SCALE);

  ctx.fillStyle = COLORS.white;
  ctx.fillRect(0, 0, W, H);

  const headerH = 88;
  const grad = ctx.createLinearGradient(0, 0, W, headerH);
  grad.addColorStop(0, COLORS.navy);
  grad.addColorStop(1, '#243680');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, headerH);

  let logoDrawn = false;
  try {
    const logo = await loadImage('/assets/sg-logo-white.svg');
    const logoW = 130;
    const logoH = (logo.height / logo.width) * logoW;
    ctx.drawImage(logo, 36, (headerH - logoH) / 2, logoW, logoH);
    logoDrawn = true;
  } catch {
    ctx.fillStyle = COLORS.white;
    ctx.font = '800 22px system-ui, -apple-system, Segoe UI, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SPORTOGRAF', 36, 48);
  }

  ctx.textAlign = 'right';
  ctx.font = '700 11px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText(labels.title.toUpperCase(), W - 36, logoDrawn ? 42 : 48);

  ctx.beginPath();
  ctx.arc(W - 72, headerH + 36, 28, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.greenBg;
  ctx.fill();
  ctx.strokeStyle = COLORS.green;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = COLORS.green;
  ctx.font = '800 28px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✓', W - 72, headerH + 46);

  const fullName = [photographer.firstName, photographer.lastName].filter(Boolean).join(' ') || '—';
  ctx.textAlign = 'left';
  ctx.font = '800 42px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillStyle = COLORS.navy;
  ctx.fillText(photographer.code, 48, headerH + 52);

  ctx.font = '600 16px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(fullName, 48, headerH + 78);

  const dividerY = headerH + 100;
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(36, dividerY);
  ctx.lineTo(W - 36, dividerY);
  ctx.stroke();

  const eventTitle = event.name || `Event ${event.id}`;
  ctx.font = '700 16px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillStyle = COLORS.navy;
  const eventLines = wrapText(ctx, eventTitle, W - 220);
  eventLines.forEach((line, i) => {
    ctx.fillText(line, 48, dividerY + 28 + i * 22);
  });

  ctx.font = '600 13px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(`#${event.id}${event.eventDate ? ` · ${event.eventDate}` : ''}`, 48, dividerY + 28 + eventLines.length * 22 + 6);

  // Compact info row: time + event ID
  let rowY = dividerY + 90;
  drawRow(ctx, labels.time, formatCertTime(checkedInAt, locale), rowY);
  rowY += 26;
  drawRow(ctx, labels.event, `#${event.id}${event.eventDate ? ' · ' + event.eventDate : ''}`, rowY);

  // Completed checks grid — 2 columns
  if (completedChecks.length > 0) {
    rowY += 36;
    const cols = 2;
    const cellW = (W - 96) / cols;
    const cellH = 22;
    completedChecks.forEach((label, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = 48 + col * cellW;
      const cy = rowY + row * cellH;
      // green circle check
      ctx.beginPath();
      ctx.arc(cx + 7, cy + 5, 7, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.greenBg;
      ctx.fill();
      ctx.fillStyle = COLORS.green;
      ctx.font = '700 9px system-ui, -apple-system, Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✓', cx + 7, cy + 9);
      // label
      ctx.textAlign = 'left';
      ctx.font = '600 11px system-ui, -apple-system, Segoe UI, sans-serif';
      ctx.fillStyle = COLORS.navy;
      ctx.fillText(label, cx + 18, cy + 9);
    });
  }

  // Camera check section
  const camSectionY = rowY + (completedChecks.length > 0 ? Math.ceil(completedChecks.length / 2) * 22 + 16 : 16);
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(36, camSectionY);
  ctx.lineTo(W - 36, camSectionY);
  ctx.stroke();

  const camLabelY = camSectionY + 18;
  const camStatusIcon = cameraStatus === 'accepted' ? '✅' : cameraStatus === 'warning' ? '⚠️' : cameraStatus === 'forced' ? '🔧' : '❌';
  const camStatusLabel = cameraStatus === 'accepted' ? 'Camera Check Passed' : cameraStatus === 'warning' ? 'Passed with Notes' : cameraStatus === 'forced' ? 'Manually Confirmed' : 'Not Passed';
  const camStatusColor = (cameraStatus === 'accepted' || cameraStatus === 'forced') ? COLORS.green : cameraStatus === 'warning' ? '#92400e' : COLORS.red;

  ctx.font = '700 12px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillStyle = COLORS.muted;
  ctx.textAlign = 'left';
  ctx.fillText('CAMERA CHECK', 48, camLabelY);
  ctx.font = '700 13px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillStyle = camStatusColor;
  ctx.fillText(`${camStatusIcon}  ${camStatusLabel}`, 48, camLabelY + 18);

  // Camera detail rows
  let detailY = camLabelY + 36;
  if (cameraDetails && typeof cameraDetails === 'object') {
    const detailOrder = ['shutterSpeed', 'format', 'date', 'time', 'cardImages', 'pictureStyle'];
    const rowH = 17;
    const colMid = 48 + 110;
    ctx.font = '600 10px system-ui, -apple-system, Segoe UI, sans-serif';
    detailOrder.forEach((key) => {
      const det = cameraDetails[key];
      if (!det) return;
      const icon = STATUS_ICON_TEXT[det.status] ?? '?';
      const color = STATUS_COLOR[det.status] ?? COLORS.muted;
      const detected = det.detected != null ? String(det.detected) : '—';

      // status icon circle
      ctx.beginPath();
      ctx.arc(48 + 6, detailY + 5, 6, 0, Math.PI * 2);
      ctx.fillStyle = color + '22';
      ctx.fill();
      ctx.font = 'bold 8px system-ui, -apple-system, Segoe UI, sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.fillText(icon, 48 + 6, detailY + 8.5);

      // label
      ctx.textAlign = 'left';
      ctx.font = '600 10px system-ui, -apple-system, Segoe UI, sans-serif';
      ctx.fillStyle = COLORS.muted;
      ctx.fillText(CAM_DETAIL_LABELS[key] ?? key, 48 + 16, detailY + 8);

      // detected value
      ctx.font = '700 10px system-ui, -apple-system, Segoe UI, sans-serif';
      ctx.fillStyle = color;
      ctx.fillText(detected, colMid, detailY + 8);

      detailY += rowH;
    });
    detailY += 4;
  }

  if (cameraImageUrl) {
    try {
      const camImg = await loadImage(cameraImageUrl);
      const maxImgH = H - 44 - detailY - 8;
      const maxImgW = W - 96;
      const scale = Math.min(maxImgW / camImg.width, maxImgH / camImg.height, 1);
      const iw = Math.round(camImg.width * scale);
      const ih = Math.round(camImg.height * scale);
      const ix = 48;
      const iy = detailY;
      ctx.drawImage(camImg, ix, iy, iw, ih);
      ctx.strokeStyle = COLORS.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(ix, iy, iw, ih);
    } catch {
      // image failed to load — skip
    }
  }

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, H - 44, W, 44);
  ctx.font = '600 11px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillStyle = COLORS.muted;
  ctx.textAlign = 'center';
  ctx.fillText(labels.footer, W / 2, H - 18);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create certificate image'));
      },
      'image/png',
      0.92,
    );
  });
}

export function certificateFilename(eventId, code) {
  const safe = String(code || 'PH').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `Sportograf_CheckIn_${eventId}_${safe}.png`;
}

export function downloadCertificateBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function shareCertificateBlob(blob, filename, title, cameraImageDataUrl) {
  const certFile = new File([blob], filename, { type: 'image/png' });
  const files = [certFile];

  if (cameraImageDataUrl) {
    try {
      const res = await fetch(cameraImageDataUrl);
      const camBlob = await res.blob();
      const ext = camBlob.type.includes('png') ? 'png' : 'jpg';
      files.push(new File([camBlob], filename.replace('.png', `_camera.${ext}`), { type: camBlob.type }));
    } catch { /* skip camera image if fetch fails */ }
  }

  if (navigator.share && navigator.canShare?.({ files })) {
    await navigator.share({ files, title });
    return true;
  }
  return false;
}
