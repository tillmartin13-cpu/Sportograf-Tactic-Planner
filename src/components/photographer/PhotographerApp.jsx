import { useState } from 'react';
import { usePhotographerStore } from '../../store/usePhotographerStore';
import { BrandLogo } from '../BrandLogo';
import { BottomNav } from './BottomNav';
import { TacticManager } from './TacticManager';
import { TacticDetail } from './TacticDetail';
import { CheckInFlow } from './CheckInFlow';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
  { code: 'es', label: 'ES' },
  { code: 'it', label: 'IT' },
  { code: 'fr', label: 'FR' },
];

function SettingsSheet({ onClose }) {
  const acronym = usePhotographerStore((s) => s.acronym);
  const language = usePhotographerStore((s) => s.language);
  const setAcronym = usePhotographerStore((s) => s.setAcronym);
  const setLanguage = usePhotographerStore((s) => s.setLanguage);
  const [draft, setDraft] = useState(acronym);

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <div
        className="w-full rounded-t-3xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Settings</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Your Acronym
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value.toUpperCase())}
                placeholder="e.g. ALN"
                maxLength={6}
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#1C2B6B]"
              />
              <button
                type="button"
                onClick={() => { setAcronym(draft); onClose(); }}
                className="rounded-xl bg-[#1C2B6B] px-4 py-2.5 text-sm font-bold text-white"
              >
                Save
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Language
            </label>
            <div className="flex gap-2 flex-wrap">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLanguage(l.code)}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                    language === l.code
                      ? 'bg-[#1C2B6B] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PhotographerApp({ onExit }) {
  const acronym = usePhotographerStore((s) => s.acronym);
  const screen = usePhotographerStore((s) => s.screen);
  const openCheckIn = usePhotographerStore((s) => s.openCheckIn);
  const activeTacticId = usePhotographerStore((s) => s.activeTacticId);
  const getActiveTactic = usePhotographerStore((s) => s.getActiveTactic);

  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('tactics');

  const activeTactic = getActiveTactic();
  const photographers = activeTactic?.pkg?.photographers ?? [];
  const myPhotographer = photographers.find(
    (p) => p.code === acronym || p.code === acronym.replace(/\d+$/, ''),
  );
  const cameraString = myPhotographer?.cameras || myPhotographer?.equipment || '';

  const greeting = acronym
    ? `Hello, ${acronym}`
    : 'Sportograf';

  return (
    <div className="flex h-full flex-col bg-[#f4f5f8]">
      {/* Header */}
      <header className="flex items-center justify-between bg-[#1C2B6B] px-4 py-3">
        <BrandLogo variant="white" className="h-6 w-[90px]" />
        <span className="text-xs font-semibold text-white/70">{greeting}</span>
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="rounded-lg p-1.5 text-white/70 hover:text-white"
          aria-label="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </header>

      {/* Main scrollable content */}
      <main className="flex-1 overflow-y-auto">
        {screen === 'manager' && <TacticManager />}
        {screen === 'detail' && <TacticDetail onOpenCheckIn={openCheckIn} />}
        {screen === 'checkin' && (
          <CheckInFlow
            tacticId={activeTacticId}
            cameraString={cameraString}
          />
        )}
      </main>

      {/* Bottom nav */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Settings sheet */}
      {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}
    </div>
  );
}
