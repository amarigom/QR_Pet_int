"use client"

import { useState, useEffect } from 'react' // 🌟 Añadido para el carrusel
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

// 🌟 Listado de tus imágenes en la carpeta public
const IMAGENES_HERO = [
  '/hero-1.jpg',
  '/hero-2.jpg',
  '/qr-1.jpg',
  '/qr2-.jpg',
  '/qr-3.jpg'
]

export default function HeroSection() {
  const [indiceActual, setIndiceActual] = useState(0) // 🌟 Estado de la imagen actual

  // 🌟 Función para avanzar de imagen
  const siguienteImagen = () => {
    setIndiceActual((prevIndice) => 
      prevIndice === IMAGENES_HERO.length - 1 ? 0 : prevIndice + 1
    )
  }

  // 🌟 Cambiar de imagen automáticamente cada 3 segundos
  useEffect(() => {
    const intervalo = setInterval(() => {
      siguienteImagen()
    }, 7000)
    return () => clearInterval(intervalo)
  }, [indiceActual])

  return (
    <section className="relative overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.2),_transparent_45%)]" />
      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-12 px-6 py-24 sm:px-8 lg:flex-row lg:px-10 lg:py-28">
        <div className="max-w-2xl">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-primary"
          >
            QR Pet
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl"
          >
            Tu mascota, conectada con el mundo.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground"
          >
            Descubre una experiencia de identificación y seguimiento pensada para facilitar la vida de tu familia y de los centros de ayuda.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/es/shop"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Explorar tienda
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#como-funciona"
              className="inline-flex items-center rounded-full border border-border px-6 py-3 text-sm font-medium transition hover:bg-accent"
            >
              Ver más
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.75, delay: 0.52 }}
          className="w-full max-w-xl rounded-3xl border border-border/70 bg-card/80 p-4 shadow-2xl shadow-black/10 backdrop-blur"
        >
          <div 
            onClick={siguienteImagen}
            className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted cursor-pointer group"
            title="Hacé click para cambiar de imagen"
          >
            {/* 🌟 Animación de transparencia suave usando Framer Motion */}
            <motion.div
              key={indiceActual} // Crucial: obliga a React a re-animar al cambiar de foto
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }} // Controla la velocidad del fade
              className="absolute inset-0 w-full h-full"
            >
              <Image
                src={IMAGENES_HERO[indiceActual]}
                alt="Mascota con un código QR"
                fill
                priority
                className="object-cover object-top transition-transform duration-500 ease-in-out group-hover:scale-105"
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}