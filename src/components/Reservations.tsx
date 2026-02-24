import { useState, useMemo } from 'react';

export function ReservationsAlert({ bookings }: { bookings: any[] }) {
  const [showAlert, setShowAlert] = useState(false);

  // Trier par date décroissante et heure de début pour les plus récentes en haut
  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.start_time}`);
      const dateB = new Date(`${b.date}T${b.start_time}`);
      return dateB.getTime() - dateA.getTime();
    });
  }, [bookings]);

  // Déterminer si on affiche un badge sur le bouton
  const badgeStatus = useMemo(() => {
    if (sortedBookings.length === 0) return null;
    const firstBooking = sortedBookings[0];
    if (firstBooking.status === 'pending') return 'pending';
    if (firstBooking.status === 'confirmed') return 'confirmed';
    return null;
  }, [sortedBookings]);

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setShowAlert(true)}
        className="fixed bottom-4 right-4 bg-green-500 text-white px-5 py-3 rounded-full shadow-lg hover:bg-green-600 transition-colors z-50 flex items-center gap-2"
      >
        Mes réservations
        {badgeStatus && (
          <span
            className={`w-3 h-3 rounded-full inline-block ${
              badgeStatus === 'pending' ? 'bg-red-500' : 'bg-green-500'
            }`}
          />
        )}
      </button>

      {/* Modal */}
      {showAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[80vh] flex flex-col">
            
            {/* Header */}
            <div className="p-5 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                Mes réservations
              </h2>
            </div>

            {/* Contenu scrollable */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {sortedBookings.length === 0 ? (
                <p className="text-center text-gray-500 py-10">
                  Vous n'avez pas encore de réservations
                </p>
              ) : (
                sortedBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow flex justify-between items-center"
                  >
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {booking.terrain?.name || 'Terrain'}
                      </h3>

                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <div>📅 {new Date(booking.date).toLocaleDateString('fr-FR')}</div>
                        <div>⏰ {booking.start_time} - {booking.end_time}</div>
                        <div>💶 {booking.total_price} €</div>
                      </div>
                    </div>

                    {/* Status */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap
                        ${
                          booking.status === 'pending'
                            ? 'bg-red-100 text-red-700'
                            : booking.status === 'confirmed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                    >
                      {booking.status === 'pending'
                        ? 'En attente'
                        : booking.status === 'confirmed'
                        ? 'Confirmée'
                        : 'Annulée'}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t">
              <button
                onClick={() => setShowAlert(false)}
                className="w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-900 transition-colors"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}