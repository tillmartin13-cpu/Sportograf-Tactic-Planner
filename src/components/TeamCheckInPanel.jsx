import { useState } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { useCurrentEvent } from '../hooks/useCurrentEvent';
import { listCertificatesForEvent } from '../lib/supabase';

function CertPreviewModal({ cert, onClose }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <div className="text-sm font-extrabold text-[#1C2B6B]">{cert.acronym} — Check-in Certificate</div>
            <div className="text-[10px] text-gray-400">{cert.updatedAt ? new Date(cert.updatedAt).toLocaleString() : ''}</div>
          </div>
          <button onClick={onClose} className="text-xs font-bold text-gray-400 hover:text-gray-600 px-2 py-1">✕</button>
        </div>
        <img src={cert.url} alt={`Certificate ${cert.acronym}`} className="w-full" />
      </div>
    </div>
  );
}

export function TeamCheckInPanel() {
  const event = useCurrentEvent();
  const photographers = usePlannerStore((s) => s.photographers) || [];
  const [certs, setCerts] = useState([]);
  const [certsLoading, setCertsLoading] = useState(false);
  const [certsError, setCertsError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [previewCert, setPreviewCert] = useState(null);

  async function fetchCerts() {
    if (!event) return;
    setCertsLoading(true);
    setCertsError(null);
    try {
      const result = await listCertificatesForEvent(String(event.id));
      setCerts(result);
      setLastFetched(new Date());
    } catch {
      setCertsError('Could not load — check connection.');
    } finally {
      setCertsLoading(false);
    }
  }

  if (!event) return null;

  // Cert presence = checked in
  const certMap = Object.fromEntries(certs.map((c) => [c.acronym, c]));
  const checkedInCount = lastFetched ? photographers.filter((p) => certMap[p.code]).length : null;

  return (
    <div className="rounded-xl border border-[#e3e7f2] bg-white">
      {previewCert && <CertPreviewModal cert={previewCert} onClose={() => setPreviewCert(null)} />}

      <div className="border-b border-[#eef0f6] px-4 py-3">
        <h2 className="text-sm font-extrabold text-[#1C2B6B]">Team check-in</h2>
        <p className="text-xs text-[#8a93b0]">
          {photographers.length === 0
            ? 'Import team CSV first'
            : lastFetched
              ? `${checkedInCount} / ${photographers.length} checked in`
              : `${photographers.length} photographers · press button to load status`}
        </p>
      </div>

      <div className="max-h-[280px] overflow-y-auto p-2">
        {photographers.length === 0 && (
          <p className="px-2 py-4 text-sm text-[#9aa3bf]">No team members yet.</p>
        )}
        {photographers.map((ph) => {
          const cert = certMap[ph.code];
          return (
            <div key={ph.id} className="mb-1 flex items-center justify-between gap-2 rounded-lg px-3 py-2 hover:bg-[#fafbff]">
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-[#1C2B6B]">{ph.code}</div>
                <div className="truncate text-[11px] text-[#8a93b0]">
                  {[ph.firstName, ph.lastName].filter(Boolean).join(' ') || '—'}
                </div>
              </div>
              <div className="shrink-0">
                {!lastFetched ? (
                  <span className="rounded-full bg-[#f1f3f9] px-2.5 py-1 text-[10px] font-bold text-[#8a93b0]">—</span>
                ) : cert ? (
                  <button
                    type="button"
                    onClick={() => setPreviewCert(cert)}
                    className="flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-2.5 py-1 text-[10px] font-bold text-[#166534] hover:bg-[#bbf7d0] transition-colors"
                  >
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                    Checked in
                  </button>
                ) : (
                  <span className="rounded-full bg-[#f1f3f9] px-2.5 py-1 text-[10px] font-bold text-[#8a93b0]">Pending</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

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
