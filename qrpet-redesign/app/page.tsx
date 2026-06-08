import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QrCode, Shield, MapPin, Bell, Heart, Smartphone } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-50 bg-card/95 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 btn-transition">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-elevation-2">
              <QrCode className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">PetQR</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" className="btn-transition">Iniciar Sesión</Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-gradient-to-r from-primary to-primary/90 hover:shadow-elevation-3 btn-transition">
                Registrarse
              </Button>
            </Link>
          </nav>
          <div className="sm:hidden">
            <Link href="/auth/register">
              <Button size="sm">Comenzar</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-20 bg-gradient-to-br from-background via-secondary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/15 border border-secondary/30 text-secondary-foreground mb-6 btn-transition">
              <Heart className="w-4 h-4 text-accent fill-accent" />
              <span className="text-sm font-medium">Protege a quien más quieres</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance leading-tight">
              Identifica a tu mascota con un{' '}
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                código QR elegante
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto leading-relaxed">
              PetQR es la forma más rápida y segura de reunir a las mascotas perdidas con sus familias. Escanea, contacta, salva.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 bg-gradient-to-r from-primary to-primary/90 hover:shadow-elevation-3 btn-transition">
                  Comenzar Gratis
                </Button>
              </Link>
              <Link href="#como-funciona">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 hover:bg-secondary/10 btn-transition">
                  Cómo Funciona
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="como-funciona" className="py-16 md:py-24 bg-card/50 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
              Cómo Funciona PetQR
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              En 3 simples pasos, tu mascota estará protegida con identificación QR
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Smartphone,
                title: "1. Registra tu Mascota",
                desc: "Crea una cuenta gratuita y añade la información de tu mascota: nombre, foto, datos de contacto.",
                color: "from-primary/10 to-primary/5"
              },
              {
                icon: QrCode,
                title: "2. Genera el Código QR",
                desc: "Obtén un código QR único para tu mascota. Imprímelo y colócalo en su collar o placa.",
                color: "from-secondary/10 to-secondary/5"
              },
              {
                icon: Bell,
                title: "3. Recibe Alertas",
                desc: "Si alguien escanea el QR, recibirás una notificación con la ubicación donde fue encontrada.",
                color: "from-accent/10 to-accent/5"
              }
            ].map((item, idx) => (
              <Card key={idx} className="border-border hover:border-secondary/50 hover:shadow-elevation-3 transition-all duration-300 group">
                <CardHeader>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className="w-8 h-8 text-secondary-foreground" />
                  </div>
                  <CardTitle className="text-xl text-center">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-center text-muted-foreground">
                    {item.desc}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 text-balance">
                Por qué elegir PetQR
              </h2>
              <div className="space-y-6">
                {[
                  {
                    icon: Shield,
                    title: "Seguridad Garantizada",
                    desc: "Tu información personal está protegida. Solo se muestra lo necesario para contactarte.",
                    color: "from-primary/10 to-primary/5"
                  },
                  {
                    icon: MapPin,
                    title: "Geolocalización",
                    desc: "Visualiza en un mapa dónde fue escaneado el código QR de tu mascota.",
                    color: "from-secondary/10 to-secondary/5"
                  },
                  {
                    icon: Heart,
                    title: "Completamente Gratis",
                    desc: "PetQR es 100% gratuito. Sin costos ocultos, sin suscripciones.",
                    color: "from-accent/10 to-accent/5"
                  }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 group">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                      <item.icon className="w-6 h-6 text-secondary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground mb-1">{item.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative h-96 md:h-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 via-accent/10 to-primary/10 rounded-3xl blur-3xl -z-10" />
              <div className="relative aspect-square bg-gradient-to-br from-card to-card/50 rounded-3xl flex items-center justify-center shadow-elevation-4 border border-border/50">
                <div className="w-40 h-40 bg-gradient-to-br from-secondary/20 to-accent/20 rounded-2xl shadow-elevation-3 flex items-center justify-center">
                  <QrCode className="w-24 h-24 text-secondary/40" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary/95 via-primary to-primary/90">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4 text-balance">
            Protege a tu mascota hoy
          </h2>
          <p className="text-lg text-primary-foreground/85 mb-8 max-w-2xl mx-auto leading-relaxed">
            Únete a miles de familias que ya confían en PetQR para mantener a sus mascotas seguras y encontrar a las que se pierden.
          </p>
          <Link href="/auth/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 hover:shadow-elevation-4 btn-transition">
              Crear Cuenta Gratis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">PetQR</span>
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
