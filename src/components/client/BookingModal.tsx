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
  user: any; // supabase user
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

  // Vérifie le statut d’un créneau
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

    if (!selectedStart) {
      setSelectedStart(time);
      setSelectedEnd(addHours(time, 1));
      return;
    }

    if (!selectedEnd) {
      setSelectedEnd(addHours(time, 1));
      return;
    }

    if (time > selectedStart) {
      setSelectedEnd(addHours(time, 1));
    } else if (time < selectedEnd) {
      setSelectedStart(time);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStart || !selectedEnd || !user || !selectedDate) {
      alert("Veuillez sélectionner une date, un créneau et saisir votre téléphone.");
      return;
    }

    // Vérifie que le user existe dans auth
    const { data: profileData, error: profileError } = await supabase
      .from('profiles_v2')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError || !profileData) {
      alert("Votre compte utilisateur n'existe pas. Reconnectez-vous ou contactez le support.");
      return;
    }

    const startIndex = HOURS.indexOf(selectedStart);
    const endIndex = HOURS.indexOf(selectedEnd);
    const hoursCount = endIndex - startIndex;

    if (hoursCount <= 0) {
      alert("Sélection invalide. Vérifiez l'heure de début et de fin.");
      return;
    }

    const totalPrice = selectedTerrain.price_per_hour * hoursCount;

    // Vérifie qu’aucun créneau n’est déjà réservé
    const conflict = allBookings.find(b =>
      b.terrain_id === selectedTerrain.id &&
      b.date === selectedDate &&
      overlaps(selectedStart, selectedEnd!, b.start_time, b.end_time)
    );

    if (conflict) {
      alert("Un ou plusieurs créneaux sélectionnés sont déjà réservés.");
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
      console.error("Erreur réservation :", error);
      alert(`Erreur réservation : ${error.message}`);
      return;
    }

    onBooked();
    setSelectedStart(null);
    setSelectedEnd(null);
    setPhone('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white w-full max-w-md p-4 sm:p-6 rounded-xl max-h-[90vh] overflow-y-auto shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-center">{selectedTerrain.name}</h2>

        {/* Images du terrain */}
        {selectedTerrain.image_url?.length > 0 ? (
          <div className="flex overflow-x-auto gap-2 mb-4">
            {selectedTerrain.image_url.map((img: string, idx: number) => (
              <img
                key={idx}
                src={img}
                alt={selectedTerrain.name}
                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg flex-shrink-0"
              />
            ))}
          </div>
        ) : (
          <div className="w-full h-20 sm:h-24 bg-gray-200 flex items-center justify-center text-gray-400 rounded-lg mb-4">
            Aucune image disponible
          </div>
        )}

        <p className="text-gray-600 mb-2">{selectedTerrain.location}</p>
        <p className="text-gray-500 mb-2 text-sm line-clamp-3">{selectedTerrain.description}</p>
        <p className="text-green-600 font-semibold mb-4">{formatCFA(selectedTerrain.price_per_hour)} / heure</p>

        <form onSubmit={handleBooking} className="space-y-4">
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Téléphone"
            className="w-full border p-2 rounded"
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
            className="w-full border p-2 rounded"
          />

          {selectedDate && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
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
                    className={`p-2 rounded text-sm transition ${cls}`}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-2">
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
            >
              Confirmer
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400 transition"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}