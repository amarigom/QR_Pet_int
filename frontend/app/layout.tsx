import type { Metadata, Viewport } from 'next'
import { Nunito } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { Analytics } from '@vercel/analytics/next'

// --- NUEVAS IMPORTACIONES MODULARES ---
import { AuthProvider } from './context/auth/AuthProvider'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
//import 'leaflet/dist/leaflet.css'

const nunito = Nunito({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PetQR - Protege a tu mascota con tecnología QR',
  description: 'Sistema de identificación QR para mascotas. Escanea el código y encuentra al dueño rápidamente.',
  generator: ' Next.js',
  manifest: '/manifest.json',
  keywords: ['mascotas', 'QR', 'identificación', 'perros', 'gatos', 'perdidos'],
  icons: {
    icon: [
      { url: '/favicon.ico', media: '(prefers-color-scheme: light)' },
      { url: '/icon.png', media: '(prefers-color-scheme: dark)' },
      { url: '/PETQR_icono_solo_512.jpg', type: 'image/svg+xml' },
    ],
    apple: '/icon.png',
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
      <head>
        {/* Google Tag Manager - HEAD */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-W7DHXZ2L');
            `,
          }}
        />
      </head>
      <body className={`${nunito.className} antialiased`}>
        {/* Google Tag Manager (noscript) - BODY */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-W7DHXZ2L"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>

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