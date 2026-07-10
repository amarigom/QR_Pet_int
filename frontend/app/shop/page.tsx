'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PRODUCTOS_DATA = [
  {
    nombre: 'QR Pet Tags',
    img: '/images/products/qr-4.jpg',
    desc: 'Smart identification and instant tracking for your pet.'
  },
  {
    nombre: 'AirTag Cases with QR',
    img: '/images/products/airtag.jpg',
    desc: 'Dual protection: Satellite tracking and instant contact scanning.'
  },
  {
    nombre: 'Le Plop Accessories',
    img: '/images/products/Leplop.jpg',
    desc: 'Exclusive design, comfort, and premium style for daily walks.'
  }
];

export default function ShopPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    // relative y z-0 obligatorios para armar el escenario de capas de fondo
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden z-0">
      
      {/* 🌟 1. EL DESTELLO DE LUZ AMBIENTAL (Subido a 0.2 de opacidad para que resalte) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.2),_transparent_45%)] pointer-events-none z-0" />
      
      {/* ─── HEADER REAL (Le ponemos z-50 para que quede arriba, pero bg-transparent para dejar pasar la luz) ─── */}
      <header className="border-b bg-card/40 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <QrCode className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">PetQR</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Iniciar Sesion</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Registrarse</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* 🌟 2. EL CONTENEDOR SELECCIONADO (Flota con z-10 sobre el destello) */}
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-start gap-12 px-6 py-16 sm:px-8 lg:flex-row lg:px-10 lg:py-24">
        
        {/* --- COLUMNA IZQUIERDA: ENCABEZADO DE TEXTOS --- */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6 lg:sticky lg:top-28">
          <p className={`text-sm font-semibold uppercase tracking-[0.3em] text-primary transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Shop
          </p>
          
          <h1 className={`text-4xl font-semibold sm:text-5xl tracking-tight text-foreground transition-all duration-1000 delay-150 ease-out transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            Explore our collections
          </h1>
          
          <p className={`text-lg text-muted-foreground transition-all duration-1000 delay-300 ease-out transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            Discover products for pets and the people who care for them.
          </p>
          
          <div className={`transition-all duration-1000 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            <Link
              href="/"
              className="inline-flex w-fit items-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 shadow-xs"
            >
              Back to home
            </Link>
          </div>
        </div>

        {/* --- COLUMNA DERECHA: GRILLA DE PRODUCTOS PET QR --- */}
        <div className={`w-full lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6 transition-all duration-1000 delay-700 ease-out transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {PRODUCTOS_DATA.map((producto) => {
            const productSlug = producto.nombre
              .toLowerCase()
              .replace(/\s+/g, '-');

            return (
              <div 
                key={producto.nombre} 
                className="group bg-card/60 backdrop-blur-xs border border-border/60 p-4 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Contenedor de la Imagen */}
                  <div className="aspect-square bg-muted mb-4 relative overflow-hidden rounded-xl">
                    <img 
                      src={producto.img} 
                      alt={producto.nombre}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* Textos de Producto */}
                  <h3 className="text-foreground text-lg font-bold tracking-tight mb-1">
                    {producto.nombre}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    {producto.desc}
                  </p>
                </div>
                
                {/* Botón de Acción */}
                <div className="pt-2">
                  <Link 
                    href={`/products/${productSlug}`} 
                    className="inline-flex w-full items-center justify-center rounded-xl bg-secondary text-secondary-foreground font-medium text-sm py-3 transition hover:bg-secondary/80 text-center"
                  >
                    Explore Line
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  )
}