// src/components/client/BookingModal.tsx
import { supabase } from '../../lib/supabaseClient';
import { HOURS, addHours, overlaps, formatCFA } from './utils';

interface Props {
  selectedTerrain: any;
  selectedDate: string;
  setSelectedDate: (v: string) => void;
  selectedStart: string | null;
  setSelectedStart: (v: string | null) => void;
  selectedEnd: string | null;
  setSelectedEnd: (v: string | null) => void;
  phone: string;
  setPhone: (v: string) => void;
  allBookings: any[];
  user: any;
  onClose: () => void;
  onBooked: () => void;
}

export function BookingModal({
  selectedTerrain,
  selectedDate,
  setSelectedDate,
  selectedStart,
  setSelectedStart,
  selectedEnd,
  setSelectedEnd,
  phone,
  setPhone,
  allBookings,
  user,
  onClose,
  onBooked,
}: Props) {

  const resetAll = () => {
    setSelectedStart(null);
    setSelectedEnd(null);
    setSelectedDate('');
    setPhone('');
  };

  const getSlotStatus = (start: string) => {
    const end = addHours(start, 1);

    const booking = allBookings.find(
      (b) =>
        b.terrain_id === selectedTerrain.id &&
        b.date === selectedDate &&
        overlaps(start, end, b.start_time, b.end_time)
    );

    if (!booking) return 'available';
    if (booking.status === 'pending') return 'pending';
    if (booking.status === 'confirmed') return 'confirmed';
    return 'available';
  };

  const isSelectedHour = (hour: string) => {
    if (!selectedStart || !selectedEnd) return false;
    return hour >= selectedStart && hour < selectedEnd;
  };

  const onSelectSlot = (time: string) => {
    const status = getSlotStatus(time);
    if (status !== 'available') return;

    // 🔥 SI ON CLIQUE SUR UNE HEURE DÉJÀ SÉLECTIONNÉE → RESET
    if (isSelectedHour(time)) {
      setSelectedStart(null);
      setSelectedEnd(null);
      return;
    }

    // Première sélection
    if (!selectedStart) {
      setSelectedStart(time);
      setSelectedEnd(addHours(time, 1));
      return;
    }

    // Deuxième sélection → étend la plage
    if (time > selectedStart) {
      setSelectedEnd(addHours(time, 1));
    } else {
      setSelectedStart(time);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStart || !selectedEnd || !user || !selectedDate) {
      alert("Veuillez sélectionner une date, un créneau et saisir votre téléphone.");
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles_v2')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError || !profileData) {
      alert("Votre compte utilisateur n'existe pas.");
      return;
    }

    const startIndex = HOURS.indexOf(selectedStart);
    const endIndex = HOURS.indexOf(selectedEnd);
    const hoursCount = endIndex - startIndex;

    if (hoursCount <= 0) {
      alert("Sélection invalide.");
      return;
    }

    const totalPrice = selectedTerrain.price_per_hour * hoursCount;

    const conflict = allBookings.find(b =>
      b.terrain_id === selectedTerrain.id &&
      b.date === selectedDate &&
      overlaps(selectedStart, selectedEnd!, b.start_time, b.end_time)
    );

    if (conflict) {
      alert("Créneau déjà réservé.");
      return;
    }

    const { error } = await supabase.from('bookings').insert({
      terrain_id: selectedTerrain.id,
      client_id: profileData.id,
      date: selectedDate,
      start_time: selectedStart,
      end_time: selectedEnd,
      phone,
      status: 'pending',
      total_price: totalPrice,
      created_at: new Date().toISOString(),
    });

    if (error) {
      alert(`Erreur réservation : ${error.message}`);
      return;
    }

    onBooked();
    resetAll();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3">
      <div className="bg-white w-full max-w-md p-4 rounded-2xl max-h-[95vh] overflow-y-auto shadow-xl">

        <h2 className="text-lg font-bold mb-4 text-center">
          {selectedTerrain.name}
        </h2>

        <p className="text-sm text-gray-600 mb-1">{selectedTerrain.location}</p>
        <p className="text-xs text-gray-500 mb-2 line-clamp-3">
          {selectedTerrain.description}
        </p>
        <p className="text-green-600 font-semibold mb-4 text-sm">
          {formatCFA(selectedTerrain.price_per_hour)} / heure
        </p>

        <form onSubmit={handleBooking} className="space-y-3">

          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Téléphone"
            className="w-full border p-2 rounded-lg text-sm"
          />

          <input
            type="date"
            required
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedStart(null);
              setSelectedEnd(null);
            }}
            className="w-full border p-2 rounded-lg text-sm"
          />

          {selectedDate && (
            <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto">
              {HOURS.map((h) => {
                const status = getSlotStatus(h);
                const selected = isSelectedHour(h);

                let cls =
                  status === 'confirmed'
                    ? 'bg-red-500 text-white cursor-not-allowed'
                    : status === 'pending'
                    ? 'bg-yellow-400 text-black cursor-not-allowed'
                    : selected
                    ? 'bg-yellow-400 text-black'
                    : 'bg-green-500 text-white';

                return (
                  <button
                    type="button"
                    key={h}
                    disabled={status !== 'available'}
                    onClick={() => onSelectSlot(h)}
                    className={`p-2 rounded-lg text-xs transition ${cls}`}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm active:scale-95 transition"
            >
              Confirmer
            </button>

            <button
              type="button"
              onClick={() => {
                resetAll();
                onClose();
              }}
              className="flex-1 bg-gray-300 py-2 rounded-lg text-sm active:scale-95 transition"
            >
              Annuler
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}