import { useRef, useState } from 'react';
import { t } from '../i18n/messages';

const STATUS_ICON = {
  ok: '✅',
  failed: '❌',
  warning: '⚠️',
  unreadable: '❓',
};

function CheckRow({ label, check }) {
  if (!check) return null;
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-base leading-none mt-0.5">{STATUS_ICON[check.status] ?? '❓'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-gray-800">{label}</span>
          {check.detected && (
            <span className="text-xs text-gray-500 font-mono">{check.detected}</span>
          )}
        </div>
        {check.message && (
          <p className="text-xs text-gray-600 mt-0.5">{check.message}</p>
        )}
      </div>
    </div>
  );
}

/** Compress image to max 1200px / ~500KB before sending to API */
function compressForApi(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 1200;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else { w = Math.round(w * MAX / h); h = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      let q = 0.85, out = canvas.toDataURL('image/jpeg', q);
      while (out.length > 500_000 && q > 0.45) {
        q -= 0.07;
        out = canvas.toDataURL('image/jpeg', q);
      }
      resolve(out);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/** Send with retry — up to maxAttempts times, doubling delay each time */
async function sendWithRetry(payload, maxAttempts = 3) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 28_000);
    try {
      const res = await fetch('/api/camera-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        let detail = '';
        try {
          const errJson = await res.json();
          detail = errJson.detail || errJson.error || JSON.stringify(errJson);
        } catch {
          detail = await res.text().catch(() => '');
        }
        throw new Error(`HTTP ${res.status}: ${detail.slice(0, 300)}`);
      }
      return await res.json();
    } catch (err) {
      clearTimeout(timeout);
      lastErr = err;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, attempt * 1000));
      }
    }
  }
  throw lastErr;
}

export function CameraCheck({ onAccepted, onResult, initialResult, cameraModel, expectedImageSize, expectedJpeg, lang = 'en' }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(initialResult ?? null);
  const [error, setError] = useState(null);

  // Translation helper
  const tr = (key, vars) => {
    let str = t(lang, key);
    if (vars) Object.entries(vars).forEach(([k, v]) => { str = str.replace(`{${k}}`, v); });
    return str;
  };

  const CHECK_LABELS = {
    time: tr('checkLabelTime'),
    date: tr('checkLabelDate'),
    format: tr('checkLabelFormat'),
    shutterSpeed: tr('checkLabelShutterSpeed'),
    cardImages: tr('checkLabelCardImages'),
    pictureStyle: tr('checkLabelPictureStyle'),
  };

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    setResult(null);
    setError(null);
    setAttempt(0);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      setImageData(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  async function handleSubmit() {
    if (!imageData) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setAttempt(1);
    try {
      const compressed = await compressForApi(imageData);
      const data = await sendWithRetry(
        { image: compressed, mediaType: 'image/jpeg', cameraModel, expectedImageSize, expectedJpeg, language: lang },
        3,
      );
      const dataWithImage = { ...data, imageDataUrl: imageData };
      setResult(dataWithImage);
      if (onResult) onResult(dataWithImage);
      if (data.status === 'accepted' && onAccepted) onAccepted();
    } catch (err) {
      const rawMsg = err?.message ?? 'unknown';
      const msg = err?.name === 'AbortError'
        ? tr('cameraCheckTimeout')
        : `${tr('cameraCheckErrorLabel')}: ${rawMsg}`;
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setPreview(null);
    setImageData(null);
    setResult(null);
    setError(null);
    setAttempt(0);
    if (inputRef.current) inputRef.current.value = '';
  }

  const accepted = result?.status === 'accepted';
  const declined = result?.status === 'declined';
  const hasWarning = result?.status === 'warning';
  const forced = result?.status === 'forced';

  function handleForceConfirm() {
    const forcedResult = { ...result, status: 'forced', imageDataUrl: preview ?? result?.imageDataUrl };
    setResult(forcedResult);
    if (onResult) onResult(forcedResult);
  }

  return (
    <div className="w-full">
      {/* Upload area */}
      {!preview && (
        <div
          className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center cursor-pointer hover:border-[#1C2B6B] hover:bg-[#f0f2fa] transition-colors active:scale-[0.98]"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="text-5xl mb-3">📷</div>
          <p className="font-bold text-gray-700 text-sm">{tr('cameraCheckUploadHint')}</p>
          <p className="text-xs text-gray-400 mt-1">{tr('cameraCheckUploadSubhint')}</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      )}

      {/* Preview */}
      {preview && !result && (
        <div className="space-y-3">
          <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
            <img src={preview} alt="Camera display" className="w-full object-contain max-h-72" />
          </div>
          {loading ? (
            <div className="rounded-2xl bg-[#f0f2fa] p-4 text-center">
              <div className="text-2xl mb-1 animate-pulse">🤖</div>
              <p className="text-sm font-semibold text-[#1C2B6B]">{tr('cameraCheckAnalyzing')}</p>
              <p className="text-xs text-gray-400 mt-0.5">{tr('cameraCheckAnalyzingDetail')}</p>
              {attempt > 1 && (
                <p className="text-xs text-amber-600 mt-1">{tr('cameraCheckAttempt', { n: attempt })}</p>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleReset}
                className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 active:scale-95 transition-transform">
                {tr('cameraCheckChangePhoto')}
              </button>
              <button onClick={handleSubmit}
                className="flex-[2] rounded-2xl bg-[#1C2B6B] py-3 text-sm font-bold text-white hover:bg-[#16225a] active:scale-95 transition-transform">
                {tr('cameraCheckVerify')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="mt-3 rounded-2xl bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700 font-semibold mb-1">⚠️ {tr('cameraCheckErrorLabel')}</p>
          <p className="text-xs text-red-600 mb-3">{error}</p>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 active:scale-95 transition-transform"
            >
              {tr('cameraCheckRetry')}
            </button>
            <button
              onClick={handleReset}
              className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600"
            >
              {tr('cameraCheckNewPhoto')}
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-3">
          {/* Status banner */}
          <div className={`rounded-xl p-4 border ${
            accepted || forced ? 'bg-green-50 border-green-300' :
            hasWarning ? 'bg-amber-50 border-amber-300' :
            'bg-red-50 border-red-300'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">
                {accepted ? '✅' : forced ? '🔧' : hasWarning ? '⚠️' : '❌'}
              </span>
              <span className={`font-bold text-base ${
                accepted || forced ? 'text-green-800' :
                hasWarning ? 'text-amber-800' :
                'text-red-800'
              }`}>
                {accepted ? tr('cameraCheckPassed') :
                 forced ? tr('cameraCheckForced') :
                 hasWarning ? tr('cameraCheckPassedWarnings') :
                 tr('cameraCheckFailed')}
              </span>
            </div>

            {result.declineReasons?.length > 0 && (
              <ul className="mt-2 space-y-1">
                {result.declineReasons.map((r, i) => (
                  <li key={i} className="text-sm text-red-700">• {r}</li>
                ))}
              </ul>
            )}

            {result.warnings?.length > 0 && (
              <ul className="mt-2 space-y-1">
                {result.warnings.map((w, i) => (
                  <li key={i} className="text-sm text-amber-700">• {w}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Detail checks */}
          {result.checks && Object.keys(result.checks).length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-2">
              {Object.entries(CHECK_LABELS).map(([key, label]) => (
                <CheckRow key={key} label={label} check={result.checks[key]} />
              ))}
            </div>
          )}

          {/* Preview thumbnail */}
          <div className="rounded-lg overflow-hidden border border-gray-100">
            <img src={preview} alt="Camera display" className="w-full object-contain max-h-40 opacity-70" />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              {(declined || result.uploadNewPhoto) && (
                <button
                  onClick={handleReset}
                  className="flex-1 py-2 rounded-lg bg-[#1C2B6B] text-white text-sm font-semibold"
                >
                  {tr('cameraCheckUploadNew')}
                </button>
              )}
              {(accepted || hasWarning || forced) && (
                <button
                  onClick={handleReset}
                  className="flex-1 py-2 rounded-lg border border-gray-300 text-sm text-gray-600"
                >
                  {tr('cameraCheckReplacePhoto')}
                </button>
              )}
            </div>
            {declined && (
              <button
                onClick={handleForceConfirm}
                className="w-full py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-xs font-semibold hover:bg-amber-100 active:scale-95 transition-transform"
              >
                🔧 {tr('cameraCheckForceConfirm')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
