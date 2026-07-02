import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QrCode, Shield, MapPin, Bell, Heart, Smartphone } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
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
              <Button variant="ghost">Iniciar Sesion</Button>
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
              <span className="text-primary">codigo QR</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 text-pretty">
              PetQR es la forma mas rápida y segura de reunir a las mascotas perdidas con sus familias.
              Escanea el codigo, contacta al dueño, salva una vida.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                  Comenzar Gratis
                </Button>
              </Link>
              <Link href="#como-funciona">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8">
                  Como Funciona
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="como-funciona" className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Como Funciona PetQR
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              En solo 3 simples pasos, tu mascota estará protegida con identificacion QR
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">1. Escanea el codigo QR único para tu mascota</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Registra tus datos e información para que te contacten.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center border-2 hover:border-secondary/50 transition-colors">
              <CardHeader>
                <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-8 h-8 text-secondary-foreground" />
                </div>
                <CardTitle className="text-xl">2. Añade a tu  mascota: nombre, foto, datos de contacto.</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Podrás acceder  a la previsualización de los datos públicos de tu mascota y reeditarlos cuantas veces quieras. 
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center border-2 hover:border-accent/50 transition-colors">
              <CardHeader>
                <div className="w-16 h-16 rounded-2xl bg-accent/30 flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-accent-foreground" />
                </div>
                <CardTitle className="text-xl">3. Recibe Alertas: Si alguien escanea el QR, recibiras una notificacion con la ubicacion donde fue encontrada</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Accede a la app y verás los ultimos escaneos  de tus mascotas.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Por que elegir PetQR?
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Seguridad Garantizada</h3>
                    <p className="text-muted-foreground">
                      Tu informacion personal esta protegida. Solo se muestra lo necesario para contactarte.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Geolocalizacion</h3>
                    <p className="text-muted-foreground">
                      Visualiza en un mapa donde fue escaneado el codigo QR de tu mascota.
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
            Unete a miles de familias que ya confian en PetQR para mantener a sus mascotas seguras.
          </p>
          <Link href="/auth/register">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Crear Cuenta Gratis
            </Button>
          </Link>
        </div>
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
