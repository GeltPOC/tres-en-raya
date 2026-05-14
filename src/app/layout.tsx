import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tres en Raya',
  description: 'Juego de Tres en Raya multijugador en tiempo real',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="bg-gray-900 text-white min-h-screen">{children}</body>
    </html>
  )
}
