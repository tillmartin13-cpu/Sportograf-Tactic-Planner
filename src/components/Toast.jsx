import { usePlannerStore } from '../store/usePlannerStore';

export function Toast() {
  const toast = usePlannerStore((s) => s.toast);
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-[9999] -translate-x-1/2 rounded-[10px] bg-[var(--sg-navy)] px-5 py-3 text-sm font-semibold text-white shadow-xl">
      {toast}
    </div>
  );
}
