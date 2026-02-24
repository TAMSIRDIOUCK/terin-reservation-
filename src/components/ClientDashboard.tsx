// src/components/ClientDashboard.tsx
import { useState, useEffect } from "react"
import { supabase } from "../lib/supabaseClient"
import { LogOut, Search } from "lucide-react"
import { ReservationsAlert } from "./Reservations"
import { BookingModal } from "./client/BookingModal"
import { formatCFA } from "./client/utils"
import { User } from "@supabase/supabase-js"
import logo from "./assets/logo.png"

interface Profile {
  full_name: string | null
  id: string
}

interface Props {
  user: User | null
  profile: Profile
  onSignOut: () => void
}

export function ClientDashboard({ user, profile, onSignOut }: Props) {
  const [terrains, setTerrains] = useState<any[]>([])
  const [filteredTerrains, setFilteredTerrains] = useState<any[]>([])
  const [myBookings, setMyBookings] = useState<any[]>([])
  const [allBookings, setAllBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedTerrain, setSelectedTerrain] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedStart, setSelectedStart] = useState<string | null>(null)
  const [selectedEnd, setSelectedEnd] = useState<string | null>(null)
  const [phone, setPhone] = useState('')
  const [search, setSearch] = useState('')

  // Charger terrains et réservations
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const loadData = async () => {
      setLoading(true)
      try {
        const { data: terrainsData, error: terrainsError } = await supabase.from("terrains").select("*")
        const { data: bookingsData, error: bookingsError } = await supabase.from("bookings").select("*")

        if (terrainsError) throw terrainsError
        if (bookingsError) throw bookingsError

        setTerrains(terrainsData || [])
        setFilteredTerrains(terrainsData || [])
        setAllBookings(bookingsData || [])

        const my = bookingsData?.filter((b) => b.client_id === user.id)
        setMyBookings(my || [])
      } catch (err) {
        console.error("Erreur chargement ClientDashboard :", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  // Filtrer terrains
  useEffect(() => {
    if (!search) {
      setFilteredTerrains(terrains)
      return
    }

    const filtered = terrains.filter((t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.location.toLowerCase().includes(search.toLowerCase()) ||
      t.price_per_hour.toString().includes(search.replace(/\D/g, ''))
    )
    setFilteredTerrains(filtered)
  }, [search, terrains])

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-600">
        Chargement…
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* HEADER */}
        <header className="bg-white border-b shadow-sm p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-10 w-10 object-contain" />
            <h1 className="text-xl font-bold">Football Booking</h1>
          </div>

          <div className="flex gap-4 items-center">
            <span className="font-medium">{profile.full_name || user?.email}</span>
            <button onClick={onSignOut} className="text-red-600">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* SEARCH BAR */}
        <div className="p-6 flex justify-center">
          <div className="relative w-full md:w-1/2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un terrain par nom, lieu ou prix…"
              className="w-full border border-gray-300 rounded pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            {search && filteredTerrains.length > 0 && (
              <ul className="absolute z-10 bg-white border border-gray-200 w-full mt-1 max-h-60 overflow-auto rounded shadow-lg">
                {filteredTerrains.map((t) => (
                  <li
                    key={t.id}
                    className="p-2 hover:bg-green-100 cursor-pointer"
                    onClick={() => setSelectedTerrain(t)}
                  >
                    <span className="font-bold">{t.name}</span> — {t.location} — {formatCFA(t.price_per_hour)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* LISTE MODERNE DES TERRAINS */}
        <main className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTerrains.map((t) => (
            <div key={t.id} className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden">
              {/* IMAGES SCROLLABLE */}
              <div className="flex overflow-x-auto gap-2 p-2">
                {t.image_url?.length > 0 ? (
                  t.image_url.map((img: string, idx: number) => (
                    <img
                      key={idx}
                      src={img}
                      alt={t.name}
                      className="w-32 h-32 object-cover rounded-lg flex-shrink-0"
                    />
                  ))
                ) : (
                  <div className="w-full h-32 bg-gray-200 flex items-center justify-center text-gray-400 rounded-lg">
                    Aucune image
                  </div>
                )}
              </div>

              {/* INFOS */}
              <div className="p-4 space-y-2">
                <h3 className="text-lg font-bold">{t.name}</h3>
                <p className="text-gray-600">{t.location}</p>
                <p className="text-gray-500 text-sm line-clamp-3">{t.description}</p>
                <p className="text-green-600 font-semibold">{formatCFA(t.price_per_hour)} / heure</p>

                <button
                  onClick={() => setSelectedTerrain(t)}
                  className="mt-2 w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Réserver
                </button>
              </div>
            </div>
          ))}

          {filteredTerrains.length === 0 && (
            <p className="text-center col-span-full text-gray-500 mt-6">
              Aucun terrain trouvé.
            </p>
          )}
        </main>
      </div>

      {/* MODAL BOOKING */}
      {selectedTerrain && (
        <BookingModal
          selectedTerrain={selectedTerrain}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedStart={selectedStart}
          setSelectedStart={setSelectedStart}
          selectedEnd={selectedEnd}
          setSelectedEnd={setSelectedEnd}
          phone={phone}
          setPhone={setPhone}
          allBookings={allBookings}
          user={user!}
          onClose={() => setSelectedTerrain(null)}
          onBooked={async () => {
            setSelectedTerrain(null)
            const { data } = await supabase.from("bookings").select("*")
            setAllBookings(data || [])
            setMyBookings(data?.filter((b) => b.client_id === user!.id) || [])
          }}
        />
      )}

      <ReservationsAlert bookings={myBookings} />
    </>
  )
}