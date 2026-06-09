import { useRef, useState } from 'react';

const STATUS_ICON = {
  ok: '✅',
  failed: '❌',
  warning: '⚠️',
  unreadable: '❓',
};

const CHECK_LABELS = {
  time: 'Uhrzeit',
  date: 'Datum & Jahr',
  format: 'Bildformat (JPG)',
  cardImages: 'Speicherkarte',
  pictureStyle: 'Bildprofil',
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

export function CameraCheck({ onAccepted, onResult, initialResult, cameraModel, expectedImageSize, expectedJpeg }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [mediaType, setMediaType] = useState('image/jpeg');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(initialResult ?? null);
  const [error, setError] = useState(null);

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    setMediaType(file.type || 'image/jpeg');
    setResult(null);
    setError(null);
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
    try {
      const res = await fetch('/api/camera-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData, mediaType, cameraModel, expectedImageSize, expectedJpeg }),
      });
      const data = await res.json();
      setResult(data);
      if (onResult) onResult(data);
      if (data.status === 'accepted' && onAccepted) onAccepted();
    } catch (err) {
      setError('Verbindungsfehler. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setPreview(null);
    setImageData(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  const accepted = result?.status === 'accepted';
  const declined = result?.status === 'declined';
  const hasWarning = result?.status === 'warning';

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
          <p className="font-bold text-gray-700 text-sm">Foto des Kamera-Displays</p>
          <p className="text-xs text-gray-400 mt-1">Tippen zum Aufnehmen oder Auswählen</p>
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
            <img src={preview} alt="Kamera-Display" className="w-full object-contain max-h-72" />
          </div>
          {loading ? (
            <div className="rounded-2xl bg-[#f0f2fa] p-4 text-center">
              <div className="text-2xl mb-1 animate-pulse">🤖</div>
              <p className="text-sm font-semibold text-[#1C2B6B]">KI analysiert dein Kamera-Display…</p>
              <p className="text-xs text-gray-400 mt-0.5">Uhrzeit · Datum · Format · Karte · Bildprofil</p>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleReset}
                className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 active:scale-95 transition-transform">
                Anderes Foto
              </button>
              <button onClick={handleSubmit}
                className="flex-[2] rounded-2xl bg-[#1C2B6B] py-3 text-sm font-bold text-white hover:bg-[#16225a] active:scale-95 transition-transform">
                Jetzt prüfen →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-3">
          {/* Status banner */}
          <div className={`rounded-xl p-4 border ${
            accepted ? 'bg-green-50 border-green-300' :
            hasWarning ? 'bg-amber-50 border-amber-300' :
            'bg-red-50 border-red-300'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">
                {accepted ? '✅' : hasWarning ? '⚠️' : '❌'}
              </span>
              <span className={`font-bold text-base ${
                accepted ? 'text-green-800' :
                hasWarning ? 'text-amber-800' :
                'text-red-800'
              }`}>
                {accepted ? 'Kamera-Check bestanden' :
                 hasWarning ? 'Bestanden mit Hinweisen' :
                 'Nicht bestanden'}
              </span>
            </div>

            {/* Decline reasons */}
            {result.declineReasons?.length > 0 && (
              <ul className="mt-2 space-y-1">
                {result.declineReasons.map((r, i) => (
                  <li key={i} className="text-sm text-red-700">• {r}</li>
                ))}
              </ul>
            )}

            {/* Warnings */}
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
            <img src={preview} alt="Kamera-Display" className="w-full object-contain max-h-40 opacity-70" />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {(declined || result.uploadNewPhoto) && (
              <button
                onClick={handleReset}
                className="flex-1 py-2 rounded-lg bg-[#1C2B6B] text-white text-sm font-semibold"
              >
                Neues Foto hochladen
              </button>
            )}
            {(accepted || hasWarning) && (
              <button
                onClick={handleReset}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-sm text-gray-600"
              >
                Foto ersetzen
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
