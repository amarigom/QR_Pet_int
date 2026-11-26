import Link from 'next/link'
import { ArrowLeft, MessageCircle, Instagram, QrCode, Tag, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const PROMOTIONS = [
  {
    title: 'Pack Hermanos (2 Medallas Clásicas)',
    tag: 'Ideal 2 mascotas',
    highlight: 'Descuento especial llevando 2 unidades',
    desc: 'Dos medallas sublimadas personalizadas con el nombre, color y código QR independiente de cada mascota.',
    includes: [
      '2 medallas circulares de 35 mm o 25 mm a elección',
      'Diseños y colores distintos para cada mascota',
      '2 perfiles digitales completos y gratuitos en PetQR',
    ],
  },
  {
    title: 'Combo Seguridad Total (Clásica + Premium QR/NFC)',
    tag: 'Más completo',
    highlight: 'Doble respaldo para paseos y collar diario',
    desc: 'Una medalla liviana para uso diario en casa y una medalla encapsulada en resina con chip NFC para paseos y viajes.',
    includes: [
      '1 medalla sublimada standard + 1 medalla resina QR + NFC',
      'Vinculadas al mismo perfil de mascota o a dos perfiles',
      'Acceso inmediato a historia clínica y alertas GPS',
    ],
  },
  {
    title: 'Pack Inicial Veterinarias & Pet Shops',
    tag: 'Para comercios y clínicas',
    highlight: 'Exhibidor + lote de medallas listas para activar',
    desc: 'Sumá identificación inteligente en tu mostrador o consultorio con medallas listas para vincular al momento.',
    includes: [
      'Lote de 20 o 50 medallas con QR único pre-generado',
      'Opción con logo de tu veterinaria',
      'Alta gratuita en el portal de veterinarias PetQR',
    ],
  },
]

const WHATSAPP_PHONE = '5492494630750'
const INSTAGRAM_HANDLE = 'petqr.ar'

export default function PromocionesPage() {
  const getWhatsAppLink = (promoTitle: string) => {
    const message = encodeURIComponent(
      `¡Hola! Vi en la web de PetQR la promoción *${promoTitle}* y quería consultar precio y detalles.`
    )
    return `https://wa.me/${WHATSAPP_PHONE}?text=${message}`
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>

          <Link href="/productos/clasicas" className="text-sm font-medium text-primary hover:underline">
            Ver catálogo de medallas →
          </Link>
        </div>
      </header>

      <div className="container mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="max-w-2xl mb-12">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <Tag className="h-3.5 w-3.5" />
            Promociones Vigentes
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Combos y packs PetQR
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            Elegí el combo que mejor se adapte a tus mascotas o a tu veterinaria y coordiná tu pedido directo por WhatsApp o Instagram.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {PROMOTIONS.map((promo) => (
            <div key={promo.title} className="group relative flex">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-br from-primary/60 via-sky-500/40 to-secondary/60 opacity-0 blur-lg transition-all duration-500 group-hover:opacity-100"
              />

              <Card className="relative z-10 flex w-full flex-col justify-between border-2 border-border bg-card shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/60 group-hover:shadow-xl group-hover:shadow-primary/20">
                <CardHeader>
                  <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {promo.tag}
                  </span>
                  <CardTitle className="pt-3 text-xl transition-colors group-hover:text-primary">
                    {promo.title}
                  </CardTitle>
                  <p className="text-xs font-semibold text-primary">{promo.highlight}</p>
                  <CardDescription className="pt-2 text-sm leading-relaxed">
                    {promo.desc}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {promo.includes.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-col gap-2.5 pt-2">
                    <a
                      href={getWhatsAppLink(promo.title)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button className="w-full gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Consultar por WhatsApp
                      </Button>
                    </a>
                    <a
                      href={`https://instagram.com/${INSTAGRAM_HANDLE}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" className="w-full gap-2">
                        <Instagram className="h-4 w-4" />
                        Escribir por Instagram
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}