'use client'

import { useState } from "react"
import { motion, Variants } from "framer-motion"
import { Instagram, MessageCircle } from "lucide-react"

export default function ContactSection() {
  // Estado para saber qué tarjeta tiene el mouse arriba ('whatsapp', 'instagram' o null)
  const [hoveredCard, setHoveredCard] = useState<"whatsapp" | "instagram" | null>(null)

  // Variantes para animar la entrada secuencial (stagger) de las tarjetas
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  }

  // Transición ultra suave y elástica de resorte para hovers y clicks
  const springTransition = { 
    type: "spring", 
    stiffness: 260, 
    damping: 25 
  }as const

  return (
    <section className="relative py-24 bg-background overflow-hidden border-t border-border" id="contact">
      
      {/* 🌌 Efectos de Destello con Animación de Pulso Sutil */}
      <motion.div 
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.7, 0.9, 0.7]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" 
      />
      <motion.div 
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.6, 0.8, 0.6]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
        className="absolute top-1/3 right-1/4 -translate-y-1/2 w-[350px] h-[350px] bg-primary/10 rounded-full blur-[90px] pointer-events-none" 
      />

      <div className="relative container mx-auto px-6 max-w-5xl z-10">
        
        {/* Encabezado */}
        <motion.div 
          initial={{ opacity: 0, y: -15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Contacto
          </h2>
          <p className="text-muted-foreground tracking-wide text-sm max-w-md mx-auto">
            ¿Tenés alguna duda o necesitás ayuda con tus códigos QR? Escribinos y te respondemos al toque.
          </p>
        </motion.div>

        {/* Grid de Tarjetas */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          
          {/* Tarjeta WhatsApp */}
          <motion.div 
            variants={itemVariants}
            onMouseEnter={() => setHoveredCard("whatsapp")}
            onMouseLeave={() => setHoveredCard(null)}
            // Al hacer hover, se eleva sutilmente y toma opacidad total. 
            // Si la OTRA tarjeta tiene hover, esta baja su opacidad a 0.4.
            animate={{
              y: hoveredCard === "whatsapp" ? -6 : 0,
              scale: hoveredCard === "whatsapp" ? 1.01 : 1,
              opacity: hoveredCard === null ? 1 : hoveredCard === "whatsapp" ? 1 : 0.4,
              boxShadow: hoveredCard === "whatsapp" 
                ? "0 10px 30px -10px rgba(78, 205, 196, 0.25)" // Sombra turquesa sutil
                : "0 1px 3px 0 rgba(0, 0, 0, 0.05)"
            }}
            whileTap={{ scale: 0.985 }} // Efecto click súper sutil y elástico
            transition={springTransition}
            className="group relative rounded-2xl border border-border bg-card p-10 text-center hover:border-primary/50 transition-colors duration-500 backdrop-blur-md cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/0 to-primary/[0.01] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />
            
            <div className="w-16 h-16 bg-secondary/20 border border-secondary/30 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform duration-300">
              <MessageCircle className="w-8 h-8 text-secondary-foreground" />
            </div>
            
            <h3 className="tracking-wide uppercase text-lg font-bold text-foreground mb-2">
              WhatsApp
            </h3>
            <p className="text-muted-foreground mb-6 font-medium">+54 9 249 4630750</p>
            <a 
              href="https://wa.me/5492494630750" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-3 bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wider hover:bg-primary/95 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md active:scale-95"
            >
              Enviar mensaje
            </a>
          </motion.div>

          {/* Tarjeta Instagram */}
          <motion.div 
            variants={itemVariants}
            onMouseEnter={() => setHoveredCard("instagram")}
            onMouseLeave={() => setHoveredCard(null)}
            // Al hacer hover, se eleva sutilmente y toma opacidad total. 
            // Si la OTRA tarjeta tiene hover, esta baja su opacidad a 0.4.
            animate={{
              y: hoveredCard === "instagram" ? -6 : 0,
              scale: hoveredCard === "instagram" ? 1.01 : 1,
              opacity: hoveredCard === null ? 1 : hoveredCard === "instagram" ? 1 : 0.4,
              boxShadow: hoveredCard === "instagram" 
                ? "0 10px 30px -10px rgba(255, 107, 107, 0.25)" // Sombra coral sutil
                : "0 1px 3px 0 rgba(0, 0, 0, 0.05)"
            }}
            whileTap={{ scale: 0.985 }} // Efecto click súper sutil y elástico
            transition={springTransition}
            className="group relative rounded-2xl border border-border bg-card p-10 text-center hover:border-secondary/50 transition-colors duration-500 backdrop-blur-md cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-secondary/0 to-secondary/[0.01] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />
            
            <div className="w-16 h-16 bg-primary/20 border border-primary/30 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform duration-300">
              <Instagram className="w-8 h-8 text-primary" />
            </div>
            
            <h3 className="tracking-wide uppercase text-lg font-bold text-foreground mb-2">
              Instagram
            </h3>
            <p className="text-muted-foreground mb-6 font-medium">@petqr.ok</p>
            <a 
              href="https://instagram.com/" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-3 border border-border text-foreground hover:bg-muted text-xs font-semibold uppercase tracking-wider rounded-xl transition-all duration-300 hover:shadow-sm active:scale-95"
            >
              Seguir
            </a>
          </motion.div>

        </motion.div>
      </div>
    </section>
  )
}