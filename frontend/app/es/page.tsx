import HeroSection from '@/components/hero-section'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QrCode, Shield, MapPin, Bell, Heart, Smartphone, PawPrint } from 'lucide-react'
import * as motion from 'framer-motion/client'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col scroll-smooth">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <QrCode className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">PetQR</span>
          </Link>
          
          <nav className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Iniciar Sesión</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Registrarse</Button>
            </Link>
          </nav>
        </div>
      </header>
      
      {/* Contenido Principal */}
      <main className="flex-1">
        <HeroSection />
      
        {/* 2. Sección de Pasos */}
        <section id="como-funciona" className="py-20 bg-muted/30 scroll-mt-24">
          <div className="container mx-auto px-4">
            
            {/* Título con fundido (Fade-in) al aparecer */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-2xl mx-auto mb-12"
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">¿Cómo funciona PetQR?</h2>
              <p className="mt-4 text-lg text-muted-foreground">Proteger a tu compañero es más fácil de lo que crees.</p>
            </motion.div>

            {/* 🌟 Grilla adaptable: 1 columna en celular/tablet (grid-cols-1) y 3 en desktop (lg:grid-cols-3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              
              {/* Tarjeta 1 */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ amount: 0.1 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="flex"
              >
                <Card className="w-full border-2 hover:border-primary/50 transition-colors shadow-sm text-center">
                  <CardHeader>
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <QrCode className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">1. Escanea el código QR único para tu mascota.</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      Registra tus datos e información para que te contacten.
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Tarjeta 2 */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ amount: 0.1 }}
                transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
                className="flex"
              >
                <Card className="w-full border-2 hover:border-primary/50 transition-colors shadow-sm text-center">
                  <CardHeader>
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <PawPrint className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">2. Añade a tu mascota: nombre, foto, datos de contacto.</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      Accede a la previsualización de  los datos que se muestran al escanear QR  y reeditalos cuantas veces quieras. 
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Tarjeta 3 */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ amount: 0.1 }}
                transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
                className="flex"
              >
                <Card className="w-full border-2 hover:border-accent/50 transition-colors shadow-sm text-center">
                  <CardHeader>
                    <div className="w-16 h-16 rounded-2xl bg-accent/30 flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-8 h-8 text-accent-foreground" />
                    </div>
                    <CardTitle className="text-xl">3. Recibe Alertas: Si alguien escanea el QR, recibirás una notificación con la ubicación.</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      Accede a la app y sigue los últimos escaneos de tus mascotas.
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
              
            </div>
          </div>
        </section>
        {/* 3. Sección CTA con animación de transparencia */}
        <section className="py-20 bg-primary overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ amount: 0.2 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="container mx-auto px-4 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Protege a tu mascota hoy
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Únete a miles de familias que ya confían en PetQR para mantener a sus mascotas seguras.
            </p>
            <Link href="/auth/register">
              <Button size="lg" variant="secondary" className="text-lg px-8 shadow-lg hover:shadow-xl transition-all">
                Crear Cuenta Gratis
              </Button>
            </Link>
          </motion.div>
        </section>
      </main>      
    {/* Footer */}
      <footer className="py-8 bg-card border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <QrCode className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold">PetQR</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} PetQR. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}