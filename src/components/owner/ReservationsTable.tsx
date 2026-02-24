import { Check, X } from "lucide-react"

interface Booking {
  id: string
  date: string
  start_time: string
  end_time: string
  status: "pending" | "confirmed" | "cancelled"
  terrain?: {
    name: string
  }
  client?: {
    full_name: string | null
    phone: string | null
  }
  phone?: string | null // numéro directement dans bookings si client non renseigné
}

interface Props {
  bookings: Booking[]
  onUpdateStatus: (
    bookingId: string,
    status: "confirmed" | "cancelled"
  ) => Promise<void>
}

export default function ReservationsTable({
  bookings,
  onUpdateStatus,
}: Props) {
  return (
    <div className="space-y-4">
      {bookings.length === 0 && (
        <p className="text-gray-500">Aucune réservation.</p>
      )}

      {bookings.map((booking) => (
        <div
          key={booking.id}
          className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
        >
          <div>
            <p className="font-semibold">{booking.client?.full_name || "Client"}</p>
            <p className="text-sm text-gray-500">{booking.terrain?.name}</p>
            <p className="text-sm">
              {booking.date} | {booking.start_time} - {booking.end_time}
            </p>

            {/* Numéro cliquable pour appeler */}
            {booking.client?.phone || booking.phone ? (
              <p className="text-sm">
                📞{" "}
                <a
                  href={`tel:${booking.client?.phone || booking.phone}`}
                  className="text-blue-600 hover:underline"
                >
                  {booking.client?.phone || booking.phone}
                </a>
              </p>
            ) : (
              <p className="text-sm text-gray-400">📞 Non renseigné</p>
            )}

            <p
              className={`text-sm font-medium ${
                booking.status === "confirmed"
                  ? "text-green-600"
                  : booking.status === "cancelled"
                  ? "text-red-600"
                  : "text-yellow-600"
              }`}
            >
              {booking.status}
            </p>
          </div>

          {booking.status === "pending" && (
            <div className="flex gap-3">
              <button
                onClick={() => onUpdateStatus(booking.id, "confirmed")}
                className="text-green-600 hover:text-green-800"
              >
                <Check size={18} />
              </button>
              <button
                onClick={() => onUpdateStatus(booking.id, "cancelled")}
                className="text-red-600 hover:text-red-800"
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}