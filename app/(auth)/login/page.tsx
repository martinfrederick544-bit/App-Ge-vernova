'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const TEST_ACCOUNTS = [
  {
    role: 'Dessinateur',
    email: 'dessinateur@ge-vernova.com',
    password: 'GEVernova2024!',
    description: 'Soumet des révisions PDF',
    color: 'bg-teal-50 border-teal-200 text-teal-800',
    dot: 'bg-teal-500',
  },
  {
    role: 'Ingénieur',
    email: 'ingenieur@ge-vernova.com',
    password: 'GEVernova2024!',
    description: 'Approuve ou retourne',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
    dot: 'bg-blue-500',
  },
  {
    role: 'Chef de projet',
    email: 'pm@ge-vernova.com',
    password: 'GEVernova2024!',
    description: "Vue d'ensemble",
    color: 'bg-purple-50 border-purple-200 text-purple-800',
    dot: 'bg-purple-500',
  },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  function fillAccount(email: string, password: string) {
    setEmail(email)
    setPassword(password)
    setError(null)
  }

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* ── Panneau gauche — branding GE Vernova ── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #005E60 0%, #003d3f 60%, #001c1d 100%)' }}
      >
        {/* Grille de fond subtile */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="bg-white rounded-2xl p-2 shadow-lg">
            <Image
              src="/ge-vernova-logo.png"
              alt="GE Vernova"
              width={52}
              height={52}
              className="block"
            />
          </div>
          <div>
            <p className="text-white font-bold text-xl tracking-wide">GE Vernova</p>
            <p className="text-white/60 text-xs tracking-widest uppercase">Powering a Greener Future</p>
          </div>
        </div>

        {/* Centre */}
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Gestion des<br />Dessins Techniques
          </h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-sm">
            Plateforme centralisée pour l&apos;échange et la validation
            des dessins PDF entre dessinateurs et ingénieurs.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { label: 'Projets', icon: '📁' },
              { label: 'Révisions', icon: '📄' },
              { label: 'Notifications', icon: '🔔' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-white/10 backdrop-blur-sm p-4 text-center border border-white/20"
              >
                <p className="text-2xl mb-1">{item.icon}</p>
                <p className="text-white/80 text-xs font-medium">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bas */}
        <p className="relative z-10 text-white/30 text-xs">
          © 2024 GE Vernova Inc. All rights reserved.
        </p>
      </div>

      {/* ── Panneau droit — formulaire ── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12 xl:px-16 overflow-y-auto">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">

          {/* Logo mobile */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <Image
              src="/ge-vernova-logo.png"
              alt="GE Vernova"
              width={44}
              height={44}
            />
            <div>
              <p className="font-bold text-gray-900 text-lg">GE Vernova</p>
              <p className="text-gray-500 text-xs">Dessins Techniques</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Connexion</h2>
          <p className="text-gray-500 text-sm mb-8">Accédez à votre espace de travail</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="form-label">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input mt-1"
                placeholder="prenom.nom@ge.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="form-label">Mot de passe</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input mt-1"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-base"
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          {/*
           * PingID SSO — à ajouter ici quand disponible.
           * Activer le provider OIDC dans Supabase Dashboard
           * (Authentication → Providers → OpenID Connect),
           * puis décommenter le bouton ci-dessous.
           *
           * <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'pingid' })}
           *   className="btn-secondary w-full justify-center mt-3">
           *   Connexion avec PingID (SSO GE)
           * </button>
           */}

          {/* ── Comptes de test ── */}
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider whitespace-nowrap">
                Comptes de test
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="space-y-2">
              {TEST_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => fillAccount(account.email, account.password)}
                  className={`w-full rounded-lg border px-4 py-3 text-left transition-all hover:shadow-sm hover:-translate-y-px active:translate-y-0 ${account.color}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${account.dot}`} />
                      <span className="font-semibold text-sm">{account.role}</span>
                    </div>
                    <span className="text-xs opacity-50">Cliquer pour remplir →</span>
                  </div>
                  <p className="text-xs opacity-65 mt-0.5 ml-4">{account.email}</p>
                  <p className="text-xs opacity-50 ml-4">{account.description}</p>
                </button>
              ))}
            </div>

            <p className="text-xs text-gray-400 text-center mt-3">
              Mot de passe :{' '}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-600">
                GEVernova2024!
              </code>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
