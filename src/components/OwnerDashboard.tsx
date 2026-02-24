import { useState, useEffect } from "react"
import { supabase } from "../lib/supabaseClient"
import { Plus, LogOut, Edit, Trash2 } from "lucide-react"
import AddTerrainForm from "./owner/AddTerrainForm"
import ReservationsTable from "./owner/ReservationsTable"
import ReservationsModal from "./ReservationsModal"
import { User } from "@supabase/supabase-js"

interface Profile {
  id: string
  full_name: string | null
  email: string | null
}

interface Props {
  user: User
  profile: Profile
  onSignOut: () => void
}

export function OwnerDashboard({ user, profile, onSignOut }: Props) {
  const [terrains, setTerrains] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedTerrain, setSelectedTerrain] = useState<any | null>(null)
  const [openReservations, setOpenReservations] = useState(false)

  // -------------------
  // LOAD TERRAINS
  // -------------------
  const loadTerrains = async () => {
    if (!profile) return
    setLoading(true)
    const { data, error } = await supabase
      .from("terrains")
      .select("*")
      .eq("owner_id", profile.id)
      .order("created_at", { ascending: false })

    if (!error) setTerrains(data || [])
    setLoading(false)
  }

  // -------------------
  // LOAD BOOKINGS (CORRIGÉ)
  // -------------------
  const loadBookings = async () => {
    if (!terrains.length) {
      setBookings([])
      return
    }

    const terrainIds = terrains.map((t) => t.id)

    // Requête sans relation automatique
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .in("terrain_id", terrainIds)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erreur bookings:", error)
      setBookings([])
      return
    }

    // Pour chaque booking, récupérer manuellement le client et le terrain
    const enrichedBookings = await Promise.all(
      (data || []).map(async (b: any) => {
        const { data: client } = await supabase
          .from("profiles_v2")
          .select("full_name, phone")
          .eq("id", b.client_id)
          .single()

        const { data: terrain } = await supabase
          .from("terrains")
          .select("name")
          .eq("id", b.terrain_id)
          .single()

        return { ...b, client, terrain }
      })
    )

    setBookings(enrichedBookings)
  }

  useEffect(() => {
    loadTerrains()
  }, [profile])

  useEffect(() => {
    loadBookings()
  }, [terrains])

  // -------------------
  // UPDATE BOOKING STATUS
  // -------------------
  const updateBookingStatus = async (
    bookingId: string,
    status: "confirmed" | "cancelled"
  ) => {
    try {
      await supabase.from("bookings").update({ status }).eq("id", bookingId)
      loadBookings()
    } catch (err) {
      console.error(err)
    }
  }

  // -------------------
  // DELETE TERRAIN
  // -------------------
  const deleteTerrain = async (id: string) => {
    if (!confirm("Supprimer ce terrain ?")) return
    await supabase.from("terrains").delete().eq("id", id)
    loadTerrains()
  }

  // -------------------
  // LOADER
  // -------------------
  if (loading) return <div className="p-10 text-center text-gray-600">Chargement...</div>

  // -------------------
  // DASHBOARD
  // -------------------
  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <header className="bg-white shadow-sm border-b p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo Football Booking" className="w-10 h-10 object-contain" />
          <h1 className="text-2xl font-bold">Football Booking</h1>
        </div>
        <div className="flex items-center gap-4">
          <p className="font-medium">{profile.full_name || user.email}</p>
          <button onClick={onSignOut} className="text-gray-600 hover:text-red-600">
            <LogOut />
          </button>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto">

        {/* ACTIONS */}
        <div className="flex justify-between mb-6">
          <h2 className="text-xl font-bold">Mes terrains</h2>
          <button
            onClick={() => {
              setSelectedTerrain(null)
              setShowAddForm(!showAddForm)
            }}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            <Plus size={18} />
            Ajouter un terrain
          </button>
        </div>

        {/* FORMULAIRE AJOUT / MODIFICATION */}
        {showAddForm && profile && (
          <AddTerrainForm
            ownerId={profile.id}
            terrain={selectedTerrain || undefined}
            onSuccess={() => {
              setShowAddForm(false)
              setSelectedTerrain(null)
              loadTerrains()
            }}
          />
        )}

        {/* LISTE DES TERRAINS */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {terrains.map((terrain) => (
            <div key={terrain.id} className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden">

              {/* SCROLL IMAGES */}
              <div className="flex overflow-x-auto gap-2 p-2">
                {terrain.image_url?.length > 0 ? (
                  terrain.image_url.map((img: string, idx: number) => (
                    <img key={idx} src={img} alt="terrain" className="w-32 h-32 object-cover rounded-lg flex-shrink-0" />
                  ))
                ) : (
                  <div className="w-full h-32 bg-gray-200 flex items-center justify-center text-gray-400 rounded-lg">
                    Aucune image
                  </div>
                )}
              </div>

              {/* INFOS TERRAIN */}
              <div className="p-4 space-y-2">
                <h3 className="text-lg font-bold">{terrain.name}</h3>
                <p className="text-sm text-gray-600">📍 {terrain.location}</p>
                <p className="text-sm text-gray-500 line-clamp-3">{terrain.description}</p>
                <p className="text-green-600 font-semibold text-lg">{terrain.price_per_hour} FCFA / heure</p>

                {/* ACTIONS */}
                <div className="flex justify-between pt-3">
                <button
                    onClick={() => {
                      setSelectedTerrain(terrain)
                      setShowAddForm(true)
                    }}
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <Edit size={16} />
                    Modifier
                  </button>
                  <button
                    onClick={() => deleteTerrain(terrain.id)}
                    className="flex items-center gap-1 text-red-600 hover:underline"
                  >
                    <Trash2 size={16} />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}

          {terrains.length === 0 && (
            <p className="text-center col-span-full text-gray-500 mt-6">Aucun terrain trouvé.</p>
          )}
        </div>

        {/* MODAL RESERVATIONS */}
        <ReservationsModal open={openReservations} onClose={() => setOpenReservations(false)}>
          <ReservationsTable bookings={bookings} onUpdateStatus={updateBookingStatus} />
        </ReservationsModal>
      </main>

      {/* BOUTON FLOTTANT MES RESERVATIONS */}
      <button
        onClick={() => setOpenReservations(true)}
        className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-green-700"
      >
        Mes réservations
      </button>
    </div>
  )
}