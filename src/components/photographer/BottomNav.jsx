import { ACADEMY_URL, EM_URL } from '../../store/usePhotographerStore';

const TABS = [
  {
    id: 'tactics',
    label: 'Tactics',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <rect x="9" y="2" width="6" height="4" rx="1" />
        <path d="M9 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-3" />
        <line x1="9" y1="10" x2="15" y2="10" />
        <line x1="9" y1="14" x2="13" y2="14" />
      </svg>
    ),
    external: false,
  },
  {
    id: 'academy',
    label: 'Academy',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
    external: true,
    url: ACADEMY_URL,
  },
  {
    id: 'em',
    label: 'Eventmanager',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
    external: true,
    url: EM_URL,
  },
];

export function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav className="flex border-t border-gray-200 bg-white">
      {TABS.map((tab) => {
        const isActive = !tab.external && activeTab === tab.id;
        if (tab.external) {
          return (
            <a
              key={tab.id}
              href={tab.url}
              target="_blank"
              rel="noreferrer"
              className="flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-semibold text-gray-400 hover:text-[#1C2B6B]"
            >
              {tab.icon}
              {tab.label}
            </a>
          );
        }
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-semibold transition-colors ${
              isActive ? 'text-[#1C2B6B]' : 'text-gray-400 hover:text-[#1C2B6B]'
            }`}
          >
            {tab.icon}
            <span className={isActive ? 'border-b-2 border-[#1C2B6B] pb-px' : ''}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
