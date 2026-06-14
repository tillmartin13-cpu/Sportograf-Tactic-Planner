import { useEffect, useState } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { useCurrentEvent } from '../hooks/useCurrentEvent';
import { loadCheckIns } from '../lib/checkIns';
import { listCertificatesForEvent } from '../lib/supabase';

function StatusBadge({ status }) {
  if (status === 'ok') {
    return <span className="rounded-full bg-[#dcfce7] px-2 py-0.5 text-[10px] font-bold text-[#166534]">OK</span>;
  }
  if (status === 'manual') {
    return <span className="rounded-full bg-[#fef3c7] px-2 py-0.5 text-[10px] font-bold text-[#92400e]">Manual</span>;
  }
  if (status === 'failed') {
    return <span className="rounded-full bg-[#fee2e2] px-2 py-0.5 text-[10px] font-bold text-[#991b1b]">Failed</span>;
  }
  return <span className="rounded-full bg-[#f1f3f9] px-2 py-0.5 text-[10px] font-bold text-[#8a93b0]">Pending</span>;
}

function CertPreviewModal({ cert, onClose }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <div className="text-sm font-extrabold text-[#1C2B6B]">{cert.acronym}</div>
            <div className="text-[10px] text-gray-400">{cert.updatedAt ? new Date(cert.updatedAt).toLocaleString() : ''}</div>
          </div>
          <button onClick={onClose} className="text-xs font-bold text-gray-400 hover:text-gray-600 px-2 py-1">✕ Close</button>
        </div>
        <img src={cert.url} alt={`Certificate ${cert.acronym}`} className="w-full" />
        <div className="px-4 py-3">
          <a href={cert.url} target="_blank" rel="noreferrer"
            className="block w-full rounded-xl bg-[#1C2B6B] py-2.5 text-center text-sm font-bold text-white hover:bg-[#16225a]">
            Open full size ↗
          </a>
        </div>
      </div>
    </div>
  );
}

export function TeamCheckInPanel() {
  const event = useCurrentEvent();
  const photographers = usePlannerStore((s) => s.photographers) || [];
  const checkInRevision = usePlannerStore((s) => s.checkInRevision);
  const [checkIns, setCheckIns] = useState({});
  const [certs, setCerts] = useState([]);
  const [certsLoading, setCertsLoading] = useState(false);
  const [certsError, setCertsError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [previewCert, setPreviewCert] = useState(null);

  useEffect(() => {
    if (!event) return undefined;
    const refresh = () => setCheckIns(loadCheckIns(event.id));
    refresh();
    const timer = setInterval(refresh, 60000);
    return () => clearInterval(timer);
  }, [event, checkInRevision]);

  async function fetchCerts(silent = false) {
    if (!event) return;
    if (!silent) setCertsLoading(true);
    setCertsError(null);
    try {
      const result = await listCertificatesForEvent(String(event.id));
      setCerts(result);
      setLastFetched(new Date());
    } catch {
      if (!silent) setCertsError('Could not load — check connection.');
    } finally {
      if (!silent) setCertsLoading(false);
    }
  }

  // Auto-poll every 5 minutes
  useEffect(() => {
    if (!event) return undefined;
    const timer = setInterval(() => fetchCerts(true), 60000);
    return () => clearInterval(timer);
  }, [event?.id]);

  if (!event) return null;

  const done = photographers.filter((p) => checkIns[p.code]?.checkedIn).length;

  // Build a map from acronym → cert for quick lookup
  const certMap = Object.fromEntries(certs.map((c) => [c.acronym, c]));

  return (
    <div className="rounded-xl border border-[#e3e7f2] bg-white">
      {previewCert && <CertPreviewModal cert={previewCert} onClose={() => setPreviewCert(null)} />}

      <div className="border-b border-[#eef0f6] px-4 py-3">
        <h2 className="text-sm font-extrabold text-[#1C2B6B]">Team check-in</h2>
        <p className="text-xs text-[#8a93b0]">
          {photographers.length ? `${done} / ${photographers.length} checked in` : 'Import team CSV first'}
        </p>
      </div>

      <div className="max-h-[280px] overflow-y-auto p-2">
        {photographers.length === 0 && (
          <p className="px-2 py-4 text-sm text-[#9aa3bf]">No team members yet.</p>
        )}
        {photographers.map((ph) => {
          const entry = checkIns[ph.code];
          const cert = certMap[ph.code];
          return (
            <div
              key={ph.id}
              className="mb-1 flex items-center justify-between gap-2 rounded-lg px-3 py-2 hover:bg-[#fafbff]"
            >
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-[#1C2B6B]">{ph.code}</div>
                <div className="truncate text-[11px] text-[#8a93b0]">
                  {[ph.firstName, ph.lastName].filter(Boolean).join(' ') || '—'}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-[#8a93b0]">In</span>
                  {entry?.checkedIn ? (
                    <span className="text-[10px] font-bold text-[#166534]">✓</span>
                  ) : (
                    <span className="text-[10px] text-[#c5cbe0]">—</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-[#8a93b0]">Cam</span>
                  <StatusBadge status={entry?.cameraStatus} />
                </div>
                {cert && (
                  <button
                    type="button"
                    onClick={() => setPreviewCert(cert)}
                    className="mt-0.5 rounded-md bg-[#eef1fb] px-1.5 py-0.5 text-[10px] font-bold text-[#1C2B6B] hover:bg-[#dde3f5]"
                  >
                    cert ↗
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Supabase fetch section */}
      <div className="border-t border-[#eef0f6] px-4 py-3">
        <button
          type="button"
          onClick={fetchCerts}
          disabled={certsLoading}
          className="w-full rounded-xl bg-[#1C2B6B] py-2.5 text-xs font-bold text-white hover:bg-[#16225a] disabled:opacity-60 transition-colors"
        >
          {certsLoading ? 'Checking…' : 'Check certificate status'}
        </button>
        {lastFetched && !certsLoading && (
          <p className="mt-1.5 text-center text-[10px] text-[#8a93b0]">
            {certs.length} certificate{certs.length !== 1 ? 's' : ''} found · {lastFetched.toLocaleTimeString()}
          </p>
        )}
        {certsError && (
          <p className="mt-1.5 text-center text-[10px] text-red-500">{certsError}</p>
        )}
      </div>
    </div>
  );
}
