import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tres en Raya',
  description: 'Juego clásico Tic-Tac-Toe'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
