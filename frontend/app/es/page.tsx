import HeroSection from '@/components/hero-section'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QrCode, Shield, MapPin, Bell, Heart, Smartphone, PawPrint } from 'lucide-react'
import * as motion from 'framer-motion/client'
import ContactSection from '@/components/contactSection'

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
            {/* BOTÓN DE CONTACTO */}
            <Link href="#contact">
              <Button variant="ghost">Contactanos</Button>
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

            {/* Grilla adaptable */}
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
                      Accede a la previsualización de los datos que se muestran al escanear QR y reeditalos cuantas veces quieras. 
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
{/* 🌟 BANNER VISUAL (Conexión de colores exacta) */}
        <section className="relative h-[650px] w-full overflow-hidden flex items-center justify-center bg-background">
          
          {/* Foto nítida con colores naturales */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed opacity-90"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1544568100-847a948585b9?q=80&w=1974&auto=format&fit=crop')` }}
          />

          {/* 🔽 DEGRADADO SUPERIOR: Nace del gris de la sección de arriba y se estira */}
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#f4f4f5] via-[#f4f4f5]/40 to-transparent dark:from-muted dark:via-muted/90" />
          
          {/* 🔼 DEGRADADO INFERIOR: Nace del fondo de la sección de abajo y se estira */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/50 to-transparent" />

          {/* Tarjeta de vidrio compacta */}
          
        </section>
        {/* Nueva Sección Integrada: ¿Por qué elegir PetQR? */}
        {/* Nueva Sección Integrada: ¿Por qué elegir PetQR? */}
<section className="py-20 bg-background scroll-mt-24 relative overflow-hidden">
  
  {/* El destello azul ambiental al fondo */}
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.15),_transparent_45%)] pointer-events-none -z-10" />

  <div className="container mx-auto px-4">
    
    {/* Título idéntico en estructura al de la sección anterior */}
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className="text-center max-w-2xl mx-auto mb-16"
    >
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">¿Por qué elegir PetQR?</h2>
    </motion.div>

    {/* Grilla limpia y estática (exactamente como la de Pasos pero de 2 columnas) */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto lg:items-center">
      
      {/* Contenedor de los beneficios - Ahora es un div normal sin motion */}
      <div className="flex flex-col gap-8">
        
        {/* Beneficio 1 */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="flex gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-1">Seguridad Garantizada</h3>
            <p className="text-muted-foreground">
              Tu informacion personal esta protegida. Solo se muestra lo necesario para contactarte.
            </p>
          </div>
        </motion.div>

        {/* Beneficio 2 */}
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="flex gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Geolocalizacion</h3>
              <p className="text-muted-foreground">
                Visualiza en un mapa donde fue escaneado el codigo QR de tu mascota.
              </p>
            </div>
        </motion.div>

        {/* Beneficio 3 */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="flex gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-accent/30 flex items-center justify-center shrink-0">
            <Heart className="w-6 h-6 text-accent-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-1">Completamente Gratis</h3>
            <p className="text-muted-foreground">
              PetQR es 100% gratuito. Sin costos ocultos, sin suscripciones.
            </p>
          </div>
        </motion.div>

      </div>


      {/* Contenedor del QR gigante - Animado de forma individual */}
      {/* Contenedor del Carrusel de Iconos/Vistas con Motion Puro */}
{/* Contenedor del Carrusel con Efecto 3D de Fondo Escondido */}
<motion.div 
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.2 }}
  transition={{ duration: 0.8, delay: 0.3 }}
  className="relative flex items-center justify-center w-full"
>
  {/* El marco con gradiente + sombra interna para dar profundidad de "hueco" */}
  <div className="w-full max-w-[380px] aspect-square bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 rounded-3xl flex items-center justify-center p-8 overflow-hidden relative shadow-inner">
    
    {/* 🌟 MÁSCARA DE DESVANECIMIENTO LATERAL: Hace que las tarjetas parezcan desaparecer por detrás de los bordes */}
    <div 
      className="absolute inset-0 w-full h-full flex items-center"
      style={{
        maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)'
      }}
    >
      {/* Contenedor infinito en movimiento */}
      <motion.div 
        className="flex gap-12 absolute left-0 px-4 items-center"
        animate={{ x: [0, -740] }} 
        transition={{ 
          ease: "linear", 
          duration: 14, // Un poquitito más lento para apreciar el efecto de profundidad
          repeat: Infinity 
        }}
      >
        {/* Vista 1: QR */}
        <div className="w-48 h-48 bg-card rounded-2xl shadow-xl hover:shadow-2xl flex flex-col items-center justify-center p-6 shrink-0 text-center border border-muted/50 transition-all">
          <QrCode className="w-20 h-20 text-foreground mb-3" />
          <span className="text-xs font-semibold text-muted-foreground">Tu Código QR</span>
        </div>

        {/* Vista 2: Mapa */}
        <div className="w-48 h-48 bg-card rounded-2xl shadow-xl hover:shadow-2xl flex flex-col items-center justify-center p-6 shrink-0 text-center border border-muted/50 transition-all">
          <MapPin className="w-20 h-20 text-secondary-foreground mb-3" />
          <span className="text-xs font-semibold text-muted-foreground">Geolocalización</span>
        </div>

        {/* Vista 3: Alertas */}
        <div className="w-48 h-48 bg-card rounded-2xl shadow-xl hover:shadow-2xl flex flex-col items-center justify-center p-6 shrink-0 text-center border border-muted/50 transition-all">
          <Bell className="w-20 h-20 text-accent-foreground mb-3" />
          <span className="text-xs font-semibold text-muted-foreground">Alertas de Escaneo</span>
        </div>

        {/* Vista 4: Mascota */}
        <div className="w-48 h-48 bg-card rounded-2xl shadow-xl hover:shadow-2xl flex flex-col items-center justify-center p-6 shrink-0 text-center border border-muted/50 transition-all">
          <PawPrint className="w-20 h-20 text-primary mb-3" />
          <span className="text-xs font-semibold text-muted-foreground">Perfil de Mascota</span>
        </div>

        {/* REPETICIÓN PARA LOOP INFINITO SIN CORTES */}
        <div className="w-48 h-48 bg-card rounded-2xl shadow-xl flex flex-col items-center justify-center p-6 shrink-0 text-center border border-muted/50">
          <QrCode className="w-20 h-20 text-foreground mb-3" />
          <span className="text-xs font-semibold text-muted-foreground">Tu Código QR</span>
        </div>
        <div className="w-48 h-48 bg-card rounded-2xl shadow-xl flex flex-col items-center justify-center p-6 shrink-0 text-center border border-muted/50">
          <MapPin className="w-20 h-20 text-secondary-foreground mb-3" />
          <span className="text-xs font-semibold text-muted-foreground">Geolocalización</span>
        </div>

      </motion.div>
    </div>
    
  </div>
</motion.div>

    </div>
  </div>
</section>

        {/* 3. Sección CTA */}
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
      {/* NUEVA SECCIÓN DE CONTACTO CON DESTELLOS AZULES */}
      <section>
          <ContactSection />
      </section>
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