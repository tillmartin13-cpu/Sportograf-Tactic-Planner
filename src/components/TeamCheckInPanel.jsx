import { useEffect, useState } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { useCurrentEvent } from '../hooks/useCurrentEvent';
import { loadCheckIns } from '../lib/checkIns';

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

export function TeamCheckInPanel() {
  const event = useCurrentEvent();
  const photographers = usePlannerStore((s) => s.photographers) || [];
  const checkInRevision = usePlannerStore((s) => s.checkInRevision);
  const [checkIns, setCheckIns] = useState({});

  useEffect(() => {
    if (!event) return undefined;
    const refresh = () => setCheckIns(loadCheckIns(event.id));
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [event, checkInRevision]);

  if (!event) return null;

  const done = photographers.filter((p) => checkIns[p.code]?.checkedIn).length;

  return (
    <div className="rounded-xl border border-[#e3e7f2] bg-white">
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
