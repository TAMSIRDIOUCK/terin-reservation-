// src/components/LoginForm.tsx
import React, { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

interface LoginFormProps {
  onLoginSuccess: () => void
  onShowSignup: () => void
}

type Role = 'proprietaire' | 'client'

interface Profile {
  id: string
  email: string
  full_name: string | null
  role: Role
  phone: string | null
  can_access_quiz: boolean
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, onShowSignup }) => {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // 🔹 Charger ou créer profil après login
  const loadOrCreateProfile = async (userId: string, email: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles_v2')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Erreur récupération profil:', error)
      return null
    }

    if (data) return data

    // Création du profil si inexistant
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles_v2')
      .insert({
        id: userId,
        email,
        role: 'client',
        can_access_quiz: false
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erreur création profil:', insertError)
      return null
    }

    return newProfile
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      if (!formData.email || !formData.password) {
        setErrorMsg("Veuillez remplir votre email et votre mot de passe.")
        setLoading(false)
        return
      }

      // 🔹 Connexion Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password
      })

      if (error) {
        console.error("Erreur login Supabase:", error)
        setErrorMsg("Email ou mot de passe incorrect.")
        setLoading(false)
        return
      }

      if (!data.user) {
        setErrorMsg("Impossible de récupérer l'utilisateur.")
        setLoading(false)
        return
      }

      // 🔹 Récupérer ou créer profil
      const profile = await loadOrCreateProfile(data.user.id, data.user.email!)
      if (!profile) {
        setErrorMsg("Impossible de charger le profil utilisateur.")
        setLoading(false)
        return
      }

      console.log('Connexion réussie pour:', data.user.email)
      onLoginSuccess() // Redirection via App.tsx

    } catch (err) {
      console.error('Erreur serveur login:', err)
      setErrorMsg("Erreur serveur, veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 border">
        <h2 className="text-3xl font-bold text-black text-center mb-6">Connexion</h2>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
            <AlertCircle size={18} />
            <span className="text-sm">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                placeholder="exemple@email.com"
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition duration-200"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onShowSignup}
            className="text-green-600 hover:underline font-medium"
          >
            Pas encore de compte ? S'inscrire
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginForm
