// src/lib/supabaseClient.ts

import { createClient } from "@supabase/supabase-js"

// ✅ Vérification des variables d’environnement
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Les variables Supabase ne sont pas définies dans le .env")
}

// ✅ Création du client avec options propres
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,      // garde la session après refresh
    autoRefreshToken: true,    // refresh automatique du token
    detectSessionInUrl: true,  // utile si email confirmation
  },
})
