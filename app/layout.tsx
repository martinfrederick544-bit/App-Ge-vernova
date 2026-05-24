import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GE Vernova — Gestion des Dessins',
  description: 'Plateforme de gestion des échanges de dessins techniques PDF',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  )
}
