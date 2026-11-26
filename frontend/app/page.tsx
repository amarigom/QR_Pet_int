import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QrCode, Shield, MapPin, Bell, Heart, Smartphone } from 'lucide-react'
import ContactSection from '@/components/contactSection'
import { TiltMedalScene } from '@/components/tilt-medal-scene'
import { FaqSection } from '@/components/ui/FaqSection'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col scroll-smooth">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <QrCode className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">PetQR</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Link href="/es/shop">
              <Button variant="ghost">Productos</Button>
            </Link>
            <Link href="/promociones">
              <Button variant="ghost">Promociones</Button>
            </Link>
            <Link href="#preguntas-frecuentes">
              <Button variant="ghost">Preguntas Frecuentes</Button>
            </Link>
            <Link href="#contact">
              <Button variant="ghost">Contacto</Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost">Iniciar Sesión</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Registrarse</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-background via-secondary/10 to-accent/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 text-secondary-foreground mb-6">
              <Heart className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Protege a quien más quieres</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
              Identifica a tu mascota con un simple{' '}
              <span className="text-primary">código QR</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 text-pretty">
              PetQR es la forma más rápida y segura de reunir a las mascotas perdidas con sus familias.
              Escanea el código, contacta al dueño, salva una vida.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                  Comenzar Gratis
                </Button>
              </Link>
              <Link href="/productos">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8">
                  Ver Medallas
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="como-funciona" className="py-20 bg-card scroll-mt-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Cómo Funciona PetQR
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              En solo 3 simples pasos, tu mascota estará protegida con identificación QR
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Tarjeta 1 */}
            <div className="group relative flex">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-br from-primary/60 via-sky-500/40 to-secondary/60 opacity-0 blur-lg transition-all duration-500 group-hover:opacity-100"
              />
              <Card className="relative z-10 w-full text-center border-2 border-border bg-card shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/60 group-hover:bg-gradient-to-b group-hover:from-card group-hover:to-primary/5 group-hover:shadow-xl group-hover:shadow-primary/20">
                <CardHeader>
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-105 group-hover:bg-primary/15">
                    <Smartphone className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl transition-colors duration-300 group-hover:text-primary">
                    1. Escanea el código QR único para tu mascota
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Registra tus datos e información para que te contacten.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            {/* Tarjeta 2 */}
            <div className="group relative flex">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-br from-primary/60 via-sky-500/40 to-secondary/60 opacity-0 blur-lg transition-all duration-500 group-hover:opacity-100"
              />
              <Card className="relative z-10 w-full text-center border-2 border-border bg-card shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/60 group-hover:bg-gradient-to-b group-hover:from-card group-hover:to-primary/5 group-hover:shadow-xl group-hover:shadow-primary/20">
                <CardHeader>
                  <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-105 group-hover:bg-primary/15">
                    <QrCode className="w-8 h-8 text-secondary-foreground transition-colors duration-300 group-hover:text-primary" />
                  </div>
                  <CardTitle className="text-xl transition-colors duration-300 group-hover:text-primary">
                    2. Añade a tu mascota: nombre, foto, datos de contacto.
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Podrás acceder a la previsualización de los datos públicos de tu mascota y reeditarlos cuantas veces quieras.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            {/* Tarjeta 3 */}
            <div className="group relative flex">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-br from-primary/60 via-sky-500/40 to-secondary/60 opacity-0 blur-lg transition-all duration-500 group-hover:opacity-100"
              />
              <Card className="relative z-10 w-full text-center border-2 border-border bg-card shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/60 group-hover:bg-gradient-to-b group-hover:from-card group-hover:to-primary/5 group-hover:shadow-xl group-hover:shadow-primary/20">
                <CardHeader>
                  <div className="w-16 h-16 rounded-2xl bg-accent/30 flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-105 group-hover:bg-primary/15">
                    <Bell className="w-8 h-8 text-accent-foreground transition-colors duration-300 group-hover:text-primary" />
                  </div>
                  <CardTitle className="text-xl transition-colors duration-300 group-hover:text-primary">
                    3. Recibe Alertas: Si alguien escanea el QR, recibirás una notificación con la ubicación donde fue encontrada
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Accede a la app y verás los últimos escaneos de tus mascotas.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                ¿Por qué elegir PetQR?
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Seguridad Garantizada</h3>
                    <p className="text-muted-foreground">
                      Tu información personal está protegida. Solo se muestra lo necesario para contactarte.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Geolocalización</h3>
                    <p className="text-muted-foreground">
                      Visualiza en un mapa dónde fue escaneado el código QR de tu mascota.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/30 flex items-center justify-center shrink-0">
                    <Heart className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Completamente Gratis</h3>
                    <p className="text-muted-foreground">
                      PetQR es 100% gratuito. Sin costos ocultos, sin suscripciones.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square max-w-md mx-auto bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 rounded-3xl flex items-center justify-center">
                <div className="w-48 h-48 bg-card rounded-2xl shadow-2xl flex items-center justify-center">
                  <QrCode className="w-32 h-32 text-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Protege a tu mascota hoy
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Únete a miles de familias que ya confían en PetQR para mantener a sus mascotas seguras.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <Link href="/auth/register">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Crear Cuenta Gratis
              </Button>
            </Link>
            <Link href="/productos">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                Ver Modelos de Medallas
              </Button>
            </Link>
          </div>
          <TiltMedalScene />
        </div>
      </section>

      {/* Preguntas Frecuentes (Dueños y Veterinarias) */}
      <div id="preguntas-frecuentes" className="scroll-mt-24 bg-background">
        <FaqSection />
      </div>

      {/* NUEVA SECCIÓN DE CONTACTO CON DESTELLOS AZULES */}
      <section id="contact" className="scroll-mt-24">
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

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <Link href="/productos" className="transition-colors hover:text-foreground">
                Productos
              </Link>
              <Link href="/promociones" className="transition-colors hover:text-foreground">
                Promociones
              </Link>
              <Link href="#como-funciona" className="transition-colors hover:text-foreground">
                Cómo funciona
              </Link>
              <Link href="#preguntas-frecuentes" className="transition-colors hover:text-foreground">
                Preguntas Frecuentes
              </Link>
              <Link href="#contact" className="transition-colors hover:text-foreground">
                Contacto
              </Link>
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