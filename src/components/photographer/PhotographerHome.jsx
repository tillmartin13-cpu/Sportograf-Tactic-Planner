import { usePhotographerStore, ACADEMY_URL, EM_URL } from '../../store/usePhotographerStore';

const SUPPORT_URL = 'mailto:support@sportograf.com';

const TILES = [
  {
    id: 'tactics',
    label: 'Event Tactics',
    sub: 'Spots, routes & check-in',
    color: '#1C2B6B',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
    ),
  },
  {
    id: 'academy',
    label: 'Academy',
    sub: 'Training & guides',
    color: '#7c3aed',
    href: ACADEMY_URL,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    ),
  },
  {
    id: 'em',
    label: 'Event Manager',
    sub: 'Manage your events',
    color: '#0369a1',
    href: EM_URL,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
        <path d="M7 8h10M7 12h6"/>
      </svg>
    ),
  },
  {
    id: 'support',
    label: 'Support',
    sub: 'Help & contact',
    color: '#059669',
    href: SUPPORT_URL,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <circle cx="12" cy="17" r=".5" fill="currentColor"/>
      </svg>
    ),
  },
];

export function PhotographerHome({ onExit }) {
  const goToTactics = usePhotographerStore((s) => s.goToTactics);

  function handleTile(tile) {
    if (tile.id === 'tactics') {
      goToTactics();
    } else if (tile.href) {
      window.open(tile.href, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <div className="flex h-full flex-col bg-[#f4f5f8]">
      {/* Header */}
      <header className="bg-[#cc1336]">
        <div className="safe-top" />
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Modul beenden
          </button>
          <span className="text-xs font-bold text-white/60">Photographer</span>
          <div className="w-20" />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <h1 className="mb-1 text-xl font-black text-[#1C2B6B]">Home</h1>
        <p className="mb-6 text-sm text-gray-400">Was möchtest du tun?</p>

        <div className="grid grid-cols-2 gap-3">
          {TILES.map((tile) => (
            <button
              key={tile.id}
              type="button"
              onClick={() => handleTile(tile)}
              className="flex flex-col items-start gap-3 rounded-2xl bg-white p-5 text-left shadow-sm border border-gray-100 transition-all active:scale-[0.97] hover:shadow-md"
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: tile.color + '18', color: tile.color }}
              >
                {tile.icon}
              </span>
              <div>
                <div className="text-sm font-bold text-gray-800 leading-tight">{tile.label}</div>
                <div className="mt-0.5 text-[11px] text-gray-400 leading-snug">{tile.sub}</div>
              </div>
              {tile.href && (
                <span className="mt-auto text-[10px] font-semibold" style={{ color: tile.color }}>
                  Extern ↗
                </span>
              )}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
