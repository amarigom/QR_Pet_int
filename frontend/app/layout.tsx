import type { Metadata, Viewport } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'
import { Analytics } from '@vercel/analytics/next'

// --- NUEVAS IMPORTACIONES MODULARES ---
import { AuthProvider } from './context/auth/AuthProvider'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
//import 'leaflet/dist/leaflet.css'

const nunito = Nunito({ subsets: ['latin'] })

// Definición de la URL base para convertir rutas relativas en absolutas para los bots
const rawSiteUrl = process.env.APP_URL || 'https://qr-pet-int.vercel.app'
const siteUrl = rawSiteUrl.startsWith('http') ? rawSiteUrl : `https://${rawSiteUrl}`

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'PetQR — Identificación Inteligente y Gestión Médica para Mascotas',
  description: 'Plataforma SaaS B2B/B2C para la identificación de mascotas mediante QR/NFC y gestión clínica veterinaria asistida por IA.',
  generator: 'Next.js',
  manifest: '/manifest.json',
  keywords: ['mascotas', 'QR', 'identificación', 'perros', 'gatos', 'perdidos', 'veterinaria', 'PetQR'],
  
  icons: {
    icon: [
      { url: '/favicon.ico', media: '(prefers-color-scheme: light)' },
      { url: '/icon.png', media: '(prefers-color-scheme: dark)' },
      { url: '/PETQR_icono_solo_512.jpg', type: 'image/jpeg' },
    ],
    apple: '/icon.png',
  },

  // --- CONFIGURACIÓN PARA LINKEDIN, WHATSAPP Y FACEBOOK ---
  openGraph: {
    title: 'PetQR — Identificación Inteligente y Gestión Médica para Mascotas',
    description: 'Plataforma SaaS B2B/B2C para la identificación de mascotas mediante QR/NFC y gestión clínica veterinaria asistida por IA.',
    url: siteUrl,
    siteName: 'PetQR',
    locale: 'es_AR',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PetQR — Identificación Inteligente y Gestión Médica para Mascotas',
      },
    ],
  },

  // --- CONFIGURACIÓN PARA TWITTER / X ---
  twitter: {
    card: 'summary_large_image',
    title: 'PetQR — Identificación Inteligente para Mascotas',
    description: 'Plataforma SaaS B2B/B2C para la identificación de mascotas mediante QR/NFC y gestión clínica veterinaria asistida por IA.',
    images: ['/og-image.png'],
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