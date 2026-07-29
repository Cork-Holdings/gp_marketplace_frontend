import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { DEFAULT_LOCALE } from '@/lib/locale';

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00',
];

function nextDays(count = 7) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

/**
 * Service appointment booking — ON_PREMISE_SERVICE & ON_SITE_SERVICE.
 */
export function ServiceBookingCalendar({
  bookedSlots = [],
  onBook,
  showMap = false,
  initialCoords = null,
}) {
  const days = useMemo(() => nextDays(7), []);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [address, setAddress] = useState({
    line1: '', city: '', region: '', phone: '',
  });
  const [coords, setCoords] = useState(initialCoords ?? { lat: '', lng: '' });
  const [submitting, setSubmitting] = useState(false);

  const dayKey = days[selectedDay]?.toISOString().slice(0, 10);
  const unavailable = useMemo(
    () => new Set(bookedSlots.filter((s) => s.date === dayKey).map((s) => s.time)),
    [bookedSlots, dayKey],
  );

  const handleBook = async () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    try {
      await onBook?.({
        scheduled_date: dayKey,
        scheduled_time: selectedSlot,
        delivery_address: showMap ? address : undefined,
        delivery_latitude: showMap && coords.lat ? parseFloat(coords.lat) : undefined,
        delivery_longitude: showMap && coords.lng ? parseFloat(coords.lng) : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-card space-y-5">
      <div>
        <h3 className="font-semibold text-charcoal">Book Appointment</h3>
        <p className="text-xs text-forest-muted">Select an available date and time slot</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {days.map((day, i) => (
          <button
            key={day.toISOString()}
            type="button"
            onClick={() => { setSelectedDay(i); setSelectedSlot(null); }}
            className={`shrink-0 rounded-xl border px-3 py-2 text-center transition ${
              selectedDay === i
                ? 'border-forest bg-forest text-cream'
                : 'border-cream-dark bg-white text-charcoal hover:bg-cream'
            }`}
          >
            <p className="text-[10px] uppercase opacity-70">
              {day.toLocaleDateString(DEFAULT_LOCALE, { weekday: 'short' })}
            </p>
            <p className="text-sm font-semibold">{day.getDate()}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {TIME_SLOTS.map((slot) => {
          const taken = unavailable.has(slot);
          const active = selectedSlot === slot;
          return (
            <button
              key={slot}
              type="button"
              disabled={taken}
              onClick={() => setSelectedSlot(slot)}
              className={`rounded-lg border py-2 text-xs font-medium transition ${
                taken
                  ? 'cursor-not-allowed border-cream-dark bg-cream-dark/50 text-forest-muted/50 line-through'
                  : active
                    ? 'border-forest bg-forest text-cream'
                    : 'border-cream-dark bg-white text-charcoal hover:border-forest-muted'
              }`}
            >
              {slot}
            </button>
          );
        })}
      </div>

      {showMap && (
        <div className="space-y-3 rounded-xl border border-cream-dark bg-cream/30 p-4">
          <p className="text-sm font-medium text-charcoal">On-site destination</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <input placeholder="Street address" value={address.line1} onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))} className="field-input" />
            <input placeholder="City" value={address.city} onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))} className="field-input" />
            <input placeholder="Latitude" value={coords.lat} onChange={(e) => setCoords((c) => ({ ...c, lat: e.target.value }))} className="field-input" />
            <input placeholder="Longitude" value={coords.lng} onChange={(e) => setCoords((c) => ({ ...c, lng: e.target.value }))} className="field-input" />
          </div>
          <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-forest-muted/40 bg-sage/30 text-xs text-forest-muted">
            {coords.lat && coords.lng
              ? `📍 ${coords.lat}, ${coords.lng}`
              : 'Enter coordinates to verify on-site destination'}
          </div>
        </div>
      )}

      <Button
        type="button"
        disabled={!selectedSlot || submitting}
        className="w-full"
        onClick={handleBook}
      >
        {submitting ? 'Booking…' : `Confirm ${selectedSlot ?? 'slot'}`}
      </Button>
    </div>
  );
}

export default ServiceBookingCalendar;
