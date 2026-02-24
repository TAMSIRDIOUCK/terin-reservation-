// src/components/SignupForm.tsx
import React, { useState } from 'react';
import { Mail, Lock, User, Phone, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface SignupFormProps {
  onSignupSuccess: () => void;
  onShowLogin: () => void;
}

type Role = 'owner' | 'client';

const SignupForm: React.FC<SignupFormProps> = ({ onSignupSuccess, onShowLogin }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    role: null as Role | null,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.role) {
      setErrorMsg("Veuillez choisir un rôle.");
      return;
    }

    if (!formData.phone.trim()) {
      setErrorMsg("Le numéro de téléphone est requis.");
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Création utilisateur Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (authError) {
        setErrorMsg(`Erreur Auth: ${authError.message}`);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setErrorMsg("Utilisateur non créé. Vérifiez l’email ou la confirmation email.");
        setLoading(false);
        return;
      }

      const userId = authData.user.id;

      // 2️⃣ Insertion dans profiles_v2
      const { error: profileError } = await supabase
        .from('profiles_v2')
        .insert({
          id: userId,
          email: formData.email.trim(),
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim(),
          role: formData.role,
          can_access_quiz: formData.role === 'client', // clients ont accès quiz
        });

      if (profileError) {
        setErrorMsg(`Erreur Base de données: ${profileError.message}`);
        setLoading(false);
        return;
      }

      // ✅ Succès
      onSignupSuccess();

    } catch (err: any) {
      console.error("Erreur serveur:", err);
      setErrorMsg(`Erreur serveur: ${err.message ?? err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-gray-50 shadow-xl rounded-2xl p-8 border">
        <h2 className="text-3xl font-bold text-black text-center mb-6">
          Inscription
        </h2>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
            <AlertCircle size={18} />
            <span className="text-sm">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ROLE */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'client' })}
              className={`flex-1 py-3 rounded-lg border font-semibold transition
                ${formData.role === 'client'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-black border-gray-300 hover:border-green-500'}`}
            >
              Client
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'owner' })}
              className={`flex-1 py-3 rounded-lg border font-semibold transition
                ${formData.role === 'owner'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-black border-gray-300 hover:border-green-500'}`}
            >
              Propriétaire
            </button>
          </div>

          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Nom complet
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                placeholder="Votre nom"
              />
            </div>
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Téléphone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                placeholder="00 000 00 00"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Email
            </label>
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
            <label className="block text-sm font-medium text-black mb-2">
              Mot de passe
            </label>
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
                className="absolute right-3 top-3 text-gray-400"
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
            {loading ? 'Inscription...' : "S'inscrire"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onShowLogin}
            className="text-green-600 hover:underline font-medium"
          >
            Déjà un compte ? Se connecter
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
