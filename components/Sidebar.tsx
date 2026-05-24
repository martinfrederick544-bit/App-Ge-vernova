'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { Profile } from '@/types/database'
import clsx from 'clsx'

const ROLE_LABELS: Record<string, string> = {
  drafter: 'Dessinateur',
  engineer: 'Ingénieur',
  project_manager: 'Chef de Projet',
}

const navItems = [
  {
    href: '/',
    label: 'Tableau de bord',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/projects',
    label: 'Projets',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
  {
    href: '/notifications',
    label: 'Notifications',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
]

export default function Sidebar({
  profile,
  unreadCount,
}: {
  profile: Profile
  unreadCount: number
}) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-white border-r border-gray-200 shadow-sm">

      {/* Header — GE Vernova logo */}
      <div
        className="flex items-center gap-3 px-5 py-4 border-b border-white/10"
        style={{ background: 'linear-gradient(135deg, #005E60 0%, #003d3f 100%)' }}
      >
        <div className="bg-white rounded-xl p-1.5 shadow-sm shrink-0">
          <Image
            src="/ge-vernova-logo.png"
            alt="GE Vernova"
            width={32}
            height={32}
            className="block"
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white tracking-wide">GE Vernova</p>
          <p className="text-xs text-white/60 truncate">Dessins Techniques</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
              style={isActive ? { background: '#005E60' } : {}}
            >
              <span className={clsx(isActive ? 'text-white' : 'text-gray-400')}>
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.href === '/notifications' && unreadCount > 0 && (
                <span className="flex items-center justify-center h-5 min-w-5 rounded-full bg-red-500 text-white text-xs font-bold px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User info + sign out */}
      <div className="px-3 py-3 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-1 rounded-lg bg-gray-50">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-full text-white font-semibold text-sm shrink-0"
            style={{ background: '#005E60' }}
          >
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{profile.full_name}</p>
            <p className="text-xs text-gray-500">{ROLE_LABELS[profile.role] ?? profile.role}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Se déconnecter
        </button>
      </div>
    </aside>
  )
}
