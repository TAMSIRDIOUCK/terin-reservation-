import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from './lib/supabaseClient'

import LoginForm from './components/loginForm'
import SignupForm from './components/SignupForm'
import { OwnerDashboard } from './components/OwnerDashboard'
import { ClientDashboard } from './components/ClientDashboard'

type Role = 'owner' | 'client'

interface Profile {
  id: string
  email: string | null
  full_name: string | null
  role: Role
  phone: string | null
  can_access_quiz: boolean
}

export function App() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSignup, setShowSignup] = useState(false)

  // -------------------------------
  // Charger ou créer le profil
  // -------------------------------
  const loadOrCreateProfile = async (user: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles_v2')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Erreur récupération profil :', error)
        return null
      }

      if (data) return data

      // Profil inexistant → création
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles_v2')
        .insert({
          id: user.id,
          email: user.email,
          role: 'client', // rôle par défaut
          can_access_quiz: true, // par défaut client a accès au quiz
        })
        .select()
        .maybeSingle()

      if (insertError) {
        console.error('Erreur création profil :', insertError)
        return null
      }

      return newProfile || null
    } catch (err) {
      console.error('Erreur loadOrCreateProfile :', err)
      return null
    }
  }

  // -------------------------------
  // Initialisation de la session
  // -------------------------------
  useEffect(() => {
    let isMounted = true

    const initialize = async () => {
      setLoading(true)
      try {
        const { data } = await supabase.auth.getSession()
        const sessionUser = data.session?.user ?? null
        if (!isMounted) return

        setUser(sessionUser)

        if (sessionUser) {
          const prof = await loadOrCreateProfile(sessionUser)
          if (!isMounted) return
          setProfile(prof)
        } else {
          setProfile(null)
        }
      } catch (err) {
        console.error('Erreur init session :', err)
        setUser(null)
        setProfile(null)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    initialize()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null
      setUser(sessionUser)
      if (!sessionUser) setProfile(null)
    })

    return () => {
      isMounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  // -------------------------------
  // Déconnexion
  // -------------------------------
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  // -------------------------------
  // Loader global
  // -------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-16 w-16 border-b-2 border-green-500 rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  // -------------------------------
  // Non connecté → Login / Signup
  // -------------------------------
  if (!user) {
    return showSignup ? (
      <SignupForm
        onSignupSuccess={() => setShowSignup(false)}
        onShowLogin={() => setShowSignup(false)}
      />
    ) : (
      <LoginForm
        onLoginSuccess={() => setShowSignup(false)}
        onShowSignup={() => setShowSignup(true)}
      />
    )
  }

  // -------------------------------
  // Profil récupéré → Dashboard selon rôle
  // -------------------------------
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        actualisez la page
      </div>
    )
  }

  if (profile.role === 'client') {
    return <ClientDashboard user={user} profile={profile} onSignOut={handleSignOut} />
  }

  if (profile.role === 'owner') {
    return <OwnerDashboard user={user} profile={profile} onSignOut={handleSignOut} />
  }

  return (
    <div className="min-h-screen flex items-center justify-center text-red-600">
      Rôle non reconnu
    </div>
  )
}
