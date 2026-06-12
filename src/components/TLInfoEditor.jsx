import { useState } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { useCurrentEvent } from '../hooks/useCurrentEvent';
import { useTactic } from '../hooks/useTactic';

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.862L.053 23.447a.5.5 0 0 0 .608.61l5.701-1.494A11.954 11.954 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.89 0-3.663-.523-5.176-1.432l-.371-.22-3.383.887.9-3.293-.242-.381A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
    </svg>
  );
}

export function TLInfoEditor() {
  const event = useCurrentEvent();
  const tactic = useTactic(event?.id);
  const updateTactic = usePlannerStore((s) => s.updateTactic);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupUrl, setNewGroupUrl] = useState('');
  const [addingGroup, setAddingGroup] = useState(false);

  if (!event) return null;

  const tlInfo = tactic.tlInfo || { notes: '', whatsappGroups: [] };
  const groups = tlInfo.whatsappGroups || [];

  function patch(changes) {
    updateTactic(event.id, { tlInfo: { ...tlInfo, ...changes } });
  }

  function addGroup() {
    const name = newGroupName.trim();
    const url = newGroupUrl.trim();
    if (!url) return;
    patch({ whatsappGroups: [...groups, { id: Date.now().toString(), name: name || 'WhatsApp Group', url }] });
    setNewGroupName('');
    setNewGroupUrl('');
    setAddingGroup(false);
  }

  function removeGroup(id) {
    patch({ whatsappGroups: groups.filter((g) => g.id !== id) });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Notes */}
      <div>
        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[#9aa3bf]">
          Info for photographers
        </label>
        <textarea
          value={tlInfo.notes || ''}
          onChange={(e) => patch({ notes: e.target.value })}
          placeholder="Meeting point, parking, dress code, special instructions…"
          rows={4}
          className="w-full rounded-xl border border-[#e3e7f2] bg-white px-3 py-2 text-xs text-[#1C2B6B] outline-none placeholder:text-[#c0c8e0] focus:border-[#1C2B6B] resize-none"
        />
      </div>

      {/* WhatsApp groups */}
      <div>
        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[#9aa3bf]">
          WhatsApp groups
        </label>
        <div className="flex flex-col gap-1.5">
          {groups.map((g) => (
            <div key={g.id} className="flex items-center gap-2 rounded-xl border border-[#e3e7f2] bg-white px-3 py-2">
              <WhatsAppIcon />
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[#1C2B6B]">{g.name}</span>
              <a
                href={g.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-[#25D366] hover:underline"
              >
                Open
              </a>
              <button
                type="button"
                onClick={() => removeGroup(g.id)}
                className="text-[11px] text-[#c5cbe0] hover:text-[#cc2b2b]"
              >
                ✕
              </button>
            </div>
          ))}

          {addingGroup ? (
            <div className="flex flex-col gap-1.5 rounded-xl border border-[#e3e7f2] bg-[#f8f9ff] p-2.5">
              <input
                autoFocus
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group name (optional)"
                className="w-full rounded-lg border border-[#e3e7f2] px-2 py-1.5 text-xs outline-none focus:border-[#1C2B6B]"
              />
              <input
                value={newGroupUrl}
                onChange={(e) => setNewGroupUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addGroup()}
                placeholder="https://chat.whatsapp.com/…"
                className="w-full rounded-lg border border-[#e3e7f2] px-2 py-1.5 text-xs font-mono outline-none focus:border-[#1C2B6B]"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addGroup}
                  className="flex-1 rounded-lg bg-[#25D366] py-1.5 text-xs font-bold text-white hover:bg-[#1fba58]"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setAddingGroup(false)}
                  className="rounded-lg px-3 py-1.5 text-xs text-[#8a93b0] hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingGroup(true)}
              className="flex items-center gap-1.5 rounded-xl border border-dashed border-[#d5daea] px-3 py-2 text-xs font-semibold text-[#8a93b0] hover:border-[#25D366] hover:text-[#25D366] transition-colors"
            >
              <WhatsAppIcon />
              + Add WhatsApp group
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
