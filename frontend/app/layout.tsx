import type { Metadata, Viewport } from 'next'
import { Nunito } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'

// --- NUEVAS IMPORTACIONES MODULARES ---
import { AuthProvider } from './context/auth/AuthProvider'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import 'leaflet/dist/leaflet.css'
import './globals.css'



const nunito = Nunito({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PetQR - Protege a tu mascota con tecnología QR',
  description: 'Sistema de identificación QR para mascotas. Escanea el código y encuentra al dueño rápidamente.',
  generator: 'v0.app',
  keywords: ['mascotas', 'QR', 'identificación', 'perros', 'gatos', 'perdidos'],
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#FF6B6B',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${nunito.className} antialiased`}>
        {/* 
          ESTRATEGIA DE QA: 
          1. AuthProvider: El cerebro que maneja la sesión (Reducer + Storage).
          2. ThemeProvider: El estilo visual.
          3. children: Las páginas (Dashboard, etc.) que ya nacen con acceso al Auth.
        */}
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </AuthProvider>

        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}