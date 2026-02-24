import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabaseClient"

interface Props {
  ownerId: string
  onSuccess: () => void
  terrain?: any // si présent, on modifie au lieu de créer
}

export default function AddTerrainForm({ ownerId, onSuccess, terrain }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "Terrain calme et bien entretenu, avec pelouse gazonnée de qualité et espace agréable pour jouer en toute tranquillité. Idéal pour matchs entre amis, entraînements et événements sportifs. Réservez dès maintenant et profitez d’une expérience unique.",
    location: "",
    price_per_hour: "",
  })

  const [existingImages, setExistingImages] = useState<string[]>([]) // images déjà présentes
  const [newImages, setNewImages] = useState<File[]>([]) // nouvelles images ajoutées
  const [previewImages, setPreviewImages] = useState<string[]>([]) // aperçu des nouvelles images

  // Préremplir les données si modification
  useEffect(() => {
    if (terrain) {
      setFormData({
        name: terrain.name,
        description: terrain.description,
        location: terrain.location,
        price_per_hour: terrain.price_per_hour,
      })
      setExistingImages(terrain.image_url || [])
    }
  }, [terrain])

  // ----------------------
  // Gérer ajout d'images
  // ----------------------
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    setNewImages([...newImages, ...files])
    const previews = files.map((file) => URL.createObjectURL(file))
    setPreviewImages([...previewImages, ...previews])
  }

  // Supprimer image existante
  const removeExistingImage = (url: string) => {
    setExistingImages(existingImages.filter((img) => img !== url))
  }

  // Supprimer image nouvelle
  const removeNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index))
    setPreviewImages(previewImages.filter((_, i) => i !== index))
  }

  // ----------------------
  // Upload images sur Supabase
  // ----------------------
  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = []
    for (const file of newImages) {
      const fileName = `${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from("terrains").upload(fileName, file)
      if (error) throw error
      const { data } = supabase.storage.from("terrains").getPublicUrl(fileName)
      urls.push(data.publicUrl)
    }
    return urls
  }

  // ----------------------
  // Soumettre le formulaire
  // ----------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const uploadedUrls = await uploadImages()
      const finalImages = [...existingImages, ...uploadedUrls]

      if (terrain) {
        // UPDATE
        await supabase
          .from("terrains")
          .update({
            name: formData.name,
            description: formData.description,
            location: formData.location,
            price_per_hour: parseFloat(formData.price_per_hour),
            image_url: finalImages,
          })
          .eq("id", terrain.id)
      } else {
        // INSERT
        await supabase.from("terrains").insert([
          {
            owner_id: ownerId,
            name: formData.name,
            description: formData.description,
            location: formData.location,
            price_per_hour: parseFloat(formData.price_per_hour),
            image_url: finalImages,
            created_at: new Date().toISOString(),
          },
        ])
      }

      // RESET FORMULAIRE
      setFormData({
        name: "",
        description: "Terrain calme et bien entretenu, avec pelouse gazonnée de qualité et espace agréable pour jouer en toute tranquillité. Idéal pour matchs entre amis, entraînements et événements sportifs. Réservez dès maintenant et profitez d’une expérience unique.",
        location: "",
        price_per_hour: "",
      })
      setExistingImages([])
      setNewImages([])
      setPreviewImages([])
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-500">{error}</p>}

        <input
          type="text"
          placeholder="Nom du terrain"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full border p-2 rounded"
        />

        <textarea
          placeholder="Description"
          required
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full border p-2 rounded"
        />

        <input
          type="text"
          placeholder="Localisation"
          required
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="w-full border p-2 rounded"
        />

        <input
          type="number"
          step="0.01"
          placeholder="Prix par heure"
          required
          value={formData.price_per_hour}
          onChange={(e) => setFormData({ ...formData, price_per_hour: e.target.value })}
          className="w-full border p-2 rounded"
        />

        {/* Input fichiers */}
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageChange}
          className="w-full border p-2 rounded"
        />

        {/* Aperçu images existantes */}
        {existingImages.length > 0 && (
          <div className="flex gap-2 overflow-x-auto mt-2">
            {existingImages.map((img, idx) => (
              <div key={idx} className="relative">
                <img src={img} alt="terrain" className="w-24 h-24 object-cover rounded" />
                <button
                  type="button"
                  onClick={() => removeExistingImage(img)}
                  className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Aperçu nouvelles images */}
        {previewImages.length > 0 && (
          <div className="flex gap-2 overflow-x-auto mt-2">
            {previewImages.map((img, idx) => (
              <div key={idx} className="relative">
                <img src={img} alt="preview" className="w-24 h-24 object-cover rounded" />
                <button
                  type="button"
                  onClick={() => removeNewImage(idx)}
                  className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white w-full py-2 rounded hover:bg-green-700 transition"
        >
          {loading ? "En cours..." : terrain ? "Mettre à jour" : "Ajouter"}
        </button>
      </form>
    </div>
  )
}