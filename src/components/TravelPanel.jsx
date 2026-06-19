import { useState } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { useCurrentEvent } from '../hooks/useCurrentEvent';

const VEHICLE_TYPES = [
  { value: 'private', label: 'Private Car', emoji: '🚗' },
  { value: 'rental', label: 'Rental', emoji: '🔑' },
  { value: 'van', label: 'Sportograf Van', emoji: '🚐' },
  { value: 'other', label: 'Other', emoji: '🚙' },
];

function vehicleEmoji(type) {
  return VEHICLE_TYPES.find((v) => v.value === type)?.emoji ?? '🚗';
}

function CarCard({ car, photographers, onUpdate, onDelete }) {
  const [editingDriver, setEditingDriver] = useState(false);
  const [driverDraft, setDriverDraft] = useState(car.driver);
  const [dragOver, setDragOver] = useState(false);

  const assignedIds = car.passengers || [];
  const assignedPhotographers = assignedIds
    .map((id) => photographers.find((p) => p.id === id))
    .filter(Boolean);

  const freeSeats = car.seats - assignedIds.length;

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const id = e.dataTransfer.getData('photographer_id');
    if (!id || assignedIds.includes(id)) return;
    if (assignedIds.length >= car.seats) return;
    onUpdate({ passengers: [...assignedIds, id] });
  }

  function removePassenger(id) {
    onUpdate({ passengers: assignedIds.filter((p) => p !== id) });
  }

  function commitDriver() {
    onUpdate({ driver: driverDraft.trim() });
    setEditingDriver(false);
  }

  return (
    <div
      className={`rounded-xl border-2 bg-white p-3 transition-colors ${
        dragOver ? 'border-[#1C2B6B] bg-[#f0f2fa]' : 'border-[#e3e7f2]'
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <select
            value={car.vehicleType || 'private'}
            onChange={(e) => onUpdate({ vehicleType: e.target.value })}
            className="border-none bg-transparent outline-none cursor-pointer text-base pr-1"
            title="Vehicle type"
          >
            {VEHICLE_TYPES.map((v) => (
              <option key={v.value} value={v.value}>{v.emoji} {v.label}</option>
            ))}
          </select>
          {editingDriver ? (
            <input
              autoFocus
              value={driverDraft}
              onChange={(e) => setDriverDraft(e.target.value)}
              onBlur={commitDriver}
              onKeyDown={(e) => e.key === 'Enter' && commitDriver()}
              className="text-sm font-bold text-[#1C2B6B] border-b border-[#1C2B6B] outline-none bg-transparent w-full"
            />
          ) : (
            <button
              type="button"
              onClick={() => { setDriverDraft(car.driver); setEditingDriver(true); }}
              className="text-sm font-bold text-[#1C2B6B] truncate hover:underline text-left"
            >
              {car.driver || 'Driver?'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            freeSeats === 0 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-700'
          }`}>
            {freeSeats} free
          </span>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-gray-300 hover:text-red-400 rounded"
            aria-label="Delete car"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M9 6V4h6v2" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
        {assignedPhotographers.map((ph) => (
          <span
            key={ph.id}
            className="flex items-center gap-1 rounded-full bg-[#f0f2fa] px-2 py-0.5 text-[11px] font-bold text-[#1C2B6B]"
          >
            {ph.code || ph.name}
            <button
              type="button"
              onClick={() => removePassenger(ph.id)}
              className="ml-0.5 text-[#8a93b0] hover:text-red-400 leading-none"
              aria-label={`Remove ${ph.code}`}
            >×</button>
          </span>
        ))}
        {assignedIds.length === 0 && (
          <span className="text-[11px] text-gray-300 italic">Drop photographers here</span>
        )}
      </div>
    </div>
  );
}

function PhotographerChip({ photographer, assignedCarId }) {
  function handleDragStart(e) {
    e.dataTransfer.setData('photographer_id', photographer.id);
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`flex cursor-grab items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold select-none transition-opacity ${
        assignedCarId
          ? 'bg-gray-100 text-gray-400 opacity-60'
          : 'bg-[#1C2B6B] text-white hover:bg-[#16225a]'
      }`}
      title={photographer.name || photographer.code}
    >
      {photographer.code || photographer.name}
    </div>
  );
}

export function TravelPanel({ alwaysExpanded = false }) {
  const event = useCurrentEvent();
  const allPhotographers = usePlannerStore((s) => s.photographers) || [];
  const photographers = event
    ? allPhotographers.filter((p) =>
        p.eventIds ? p.eventIds.includes(event.id) : p.eventId === event.id,
      )
    : [];
  const updateEvent = usePlannerStore((s) => s.updateEvent);

  const [collapsed, setCollapsed] = useState(!alwaysExpanded);
  const [addingCar, setAddingCar] = useState(false);
  const [newDriver, setNewDriver] = useState('');
  const [newSeats, setNewSeats] = useState(4);

  if (!event) return null;

  const travel = event.travel || { hotelLink: '', meetingPoint: '', cars: [] };
  const cars = travel.cars || [];

  function patch(changes) {
    updateEvent(event.id, { travel: { ...travel, ...changes } });
  }

  function patchCar(carId, changes) {
    patch({
      cars: cars.map((c) => (c.id === carId ? { ...c, ...changes } : c)),
    });
  }

  function addCar() {
    if (!newDriver.trim()) return;
    const car = {
      id: `car_${Date.now()}`,
      driver: newDriver.trim(),
      seats: Number(newSeats),
      passengers: [],
    };
    patch({ cars: [...cars, car] });
    setNewDriver('');
    setNewSeats(4);
    setAddingCar(false);
  }

  function deleteCar(carId) {
    patch({ cars: cars.filter((c) => c.id !== carId) });
  }

  const assignedMap = {};
  cars.forEach((car) => {
    (car.passengers || []).forEach((pid) => { assignedMap[pid] = car.id; });
  });

  const unassigned = photographers.filter((p) => !assignedMap[p.id]);
  const assigned = photographers.filter((p) => assignedMap[p.id]);

  return (
    <div className="rounded-xl border border-[#e3e7f2] bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between border-b border-[#eef0f6] px-4 py-3 text-left"
      >
        <div>
          <h2 className="text-sm font-extrabold text-[#1C2B6B]">🚗 Travel & Carpool</h2>
          <p className="text-xs text-[#8a93b0]">{cars.length} car{cars.length !== 1 ? 's' : ''} · {assigned.length}/{photographers.length} assigned</p>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 text-[#8a93b0] transition-transform ${collapsed ? '' : 'rotate-180'}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {!collapsed && (
        <div className="p-3 space-y-3">
          {/* Hotel link */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Hotel Link</label>
            <input
              type="url"
              value={travel.hotelLink || ''}
              onChange={(e) => patch({ hotelLink: e.target.value })}
              placeholder="https://..."
              className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-[#1C2B6B] focus:ring-1 focus:ring-[#1C2B6B]"
            />
            {travel.hotelLink && (
              <a
                href={travel.hotelLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 block text-[11px] text-[#1C2B6B] hover:underline truncate"
              >
                Open hotel ↗
              </a>
            )}
          </div>

          {/* Meeting point */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Meeting Point</label>
            <input
              type="text"
              value={travel.meetingPoint || ''}
              onChange={(e) => patch({ meetingPoint: e.target.value })}
              placeholder="e.g. Hotel lobby, 07:00"
              className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-[#1C2B6B] focus:ring-1 focus:ring-[#1C2B6B]"
            />
          </div>

          {/* Unassigned photographers */}
          {photographers.length > 0 && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Photographers — drag onto a car
              </label>
              <div className="flex flex-wrap gap-1.5">
                {unassigned.map((p) => (
                  <PhotographerChip key={p.id} photographer={p} assignedCarId={null} />
                ))}
                {assigned.map((p) => (
                  <PhotographerChip key={p.id} photographer={p} assignedCarId={assignedMap[p.id]} />
                ))}
              </div>
            </div>
          )}

          {/* Cars */}
          <div className="space-y-2">
            {cars.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                photographers={photographers}
                onUpdate={(changes) => patchCar(car.id, changes)}
                onDelete={() => deleteCar(car.id)}
              />
            ))}
          </div>

          {/* Add car */}
          {addingCar ? (
            <div className="rounded-xl border border-dashed border-[#1C2B6B] p-3 space-y-2">
              <input
                autoFocus
                type="text"
                value={newDriver}
                onChange={(e) => setNewDriver(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCar()}
                placeholder="Driver name or acronym"
                className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-[#1C2B6B]"
              />
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-gray-500">Seats</label>
                <select
                  value={newSeats}
                  onChange={(e) => setNewSeats(e.target.value)}
                  className="rounded-lg border border-gray-200 px-2 py-1 text-xs outline-none"
                >
                  {[2,3,4,5,6,7,8,9].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <div className="flex gap-1.5 ml-auto">
                  <button type="button" onClick={() => setAddingCar(false)} className="rounded-lg px-3 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-100">Cancel</button>
                  <button type="button" onClick={addCar} className="rounded-lg bg-[#1C2B6B] px-3 py-1 text-xs font-bold text-white hover:bg-[#16225a]">Add</button>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingCar(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-200 py-2.5 text-xs font-bold text-gray-400 hover:border-[#1C2B6B] hover:text-[#1C2B6B] transition-colors"
            >
              + Add car
            </button>
          )}
        </div>
      )}
    </div>
  );
}
