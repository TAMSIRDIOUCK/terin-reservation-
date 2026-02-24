// src/lib/supabaseClient.ts

import { createClient } from "@supabase/supabase-js"

// ✅ Vérification des variables d’environnement
const supabaseUrl = 'https://netgmadtongdspojqaue.supabase.co'; // Remplacez par votre URL Supabase
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ldGdtYWR0b25nZHNwb2pxYXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMTg3NDIsImV4cCI6MjA2MzY5NDc0Mn0.h6lHxp0xUjiB2mE6OT-ePqNanmSFKs7zhvvHRtwKXKI'; // Remplacez par votre clé anonyme Supabase

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Les variables Supabase ne sont pas définies dans le .env")
}

// ✅ Création du client avec options propres
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,      // garde la session après refresh
    autoRefreshToken: true,    // refresh automatique du token
    detectSessionInUrl: true,  // utile si email confirmation
  },
})
