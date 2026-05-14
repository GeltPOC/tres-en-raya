import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tres en Raya Online',
  description: 'Juega al Tres en Raya en tiempo real contra otros jugadores'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
