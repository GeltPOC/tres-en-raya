import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tres en Raya',
  description: 'Juego clásico de Tic-Tac-Toe'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
