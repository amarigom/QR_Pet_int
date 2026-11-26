import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, MessageCircle, Instagram, QrCode, Ruler, Palette, Sparkles, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface MedalProduct {
  name: string
  badge?: string
  desc: string
  size: string
  colorsOrDesign: string
  tech: string
  features: string[]
}

interface ProductCategory {
  title: string
  subtitle: string
  items: MedalProduct[]
}

const productDetails: Record<string, ProductCategory> = {
  clasicas: {
    title: 'Medallas Clásicas Sublimadas',
    subtitle: 'Livianas, resistentes al agua y personalizadas a todo color con el nombre de tu mascota y su código QR único.',
    items: [
      {
        name: 'Medalla Circular Standard',
        badge: 'Más elegida',
        desc: 'Ideal para perros medianos y grandes. Impresión de alta definición por sublimación con terminación brillante resistente a rayones y lluvia.',
        size: '35 mm de diámetro · Espesor 2 mm',
        colorsOrDesign: 'Fondo blanco brillante, bordes en azul PetQR, celeste, rosa pastel, amarillo o diseño personalizado con huellitas.',
        tech: 'Código QR de alto contraste grabado en dorso',
        features: ['Incluye argolla metálica reforzada', 'Resistente al agua y al sol', 'Perfil digital editable sin límites'],
      },
      {
        name: 'Medalla Mini Gatos & Razas Pequeñas',
        badge: 'Ultra liviana',
        desc: 'Diseñada para no molestar en el cuello de gatos o perros toy, manteniendo lectura instantánea desde cualquier celular.',
        size: '25 mm de diámetro · Peso < 5 g',
        colorsOrDesign: 'Colores pasteles, tonos neón, diseño galaxia, corazones o fondo liso a elección.',
        tech: 'Código QR de alta densidad',
        features: ['No hace ruido ni pesa', 'Argolla liviana incluida', 'Alertas de escaneo con GPS'],
      },
    ],
  },
  premium: {
    title: 'Medallas Premium QR + NFC',
    subtitle: 'Doble tecnología de lectura: escaneo por cámara o acercando el teléfono sin necesidad de abrir ninguna app.',
    items: [
      {
        name: 'Medalla Resina Epoxi Cristal (QR + NFC)',
        badge: 'Doble tecnología',
        desc: 'Encapsulado en resina cristal 3D que protege el diseño y aloja un chip NFC interno de lectura inmediata por contacto.',
        size: '38 mm de diámetro · Relieve cristal 3D',
        colorsOrDesign: 'Acabado cristal brillante · Azul marino, negro mate, dorado suave o diseño corporativo Le Plop.',
        tech: 'Chip NFC NTAG213 + Código QR impreso',
        features: ['Lectura sin cámara acercando el celular', 'Máxima resistencia a golpes y mordidas', 'Historia clínica y vacunas accesibles'],
      },
      {
        name: 'Medalla Huesito / Escudo Clínico',
        desc: 'Formato anatómico pensado para identificación rápida en paseos y consultas veterinarias.',
        size: '42 mm x 28 mm',
        colorsOrDesign: 'Azul clínico, turquesa, rojo alerta médica o combinación bicolor.',
        tech: 'Código QR + NFC opcional',
        features: ['Espacio para alerta médica ("Toma medicación")', 'Argolla doble de acero', 'Sincronización instantánea con PetQR'],
      },
    ],
  },
  veterinarias: {
    title: 'Medallas Clínicas & Identificación',
    subtitle: 'Pensadas para veterinarias, pet shops y campañas de identificación que vinculan cada mascota a su historia clínica digital.',
    items: [
      {
        name: 'Medalla Clínica Co-Brandeada',
        badge: 'Para Veterinarias',
        desc: 'Personalizada con el logo de tu veterinaria al frente y el código QR clínico en el dorso para vincular estudios y controles.',
        size: '35 mm circular o 40 mm escudo',
        colorsOrDesign: 'Paleta institucional de tu clínica veterinaria + identidad PetQR.',
        tech: 'QR clínico vinculable al portal veterinario',
        features: ['Packs mayoristas desde 20 unidades', 'Activación rápida desde el panel vet', 'Fidelización de pacientes'],
      },
    ],
  },
}

const WHATSAPP_PHONE = '5492494630750'
const INSTAGRAM_HANDLE = 'petqr.ar' // Ajustá al usuario exacto de Instagram de PetQR / Le Plop

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ categorie: string }>
}) {
  const { categorie } = await params
  const category = productDetails[categorie]

  if (!category) return notFound()

  const getWhatsAppLink = (item: MedalProduct) => {
    const message = encodeURIComponent(
      `¡Hola! Vi en la web de PetQR la *${item.name}* (${item.size}) y quiero consultar disponibilidad, colores y precio.`
    )
    return `https://wa.me/${WHATSAPP_PHONE}?text=${message}`
  }

  const getInstagramLink = () => {
    return `https://instagram.com/${INSTAGRAM_HANDLE}`
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Barra superior simple */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-4">
          <Link
            href="/productos"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al catálogo
          </Link>

          <Link href="/" className="flex items-center gap-2 font-bold text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <QrCode className="h-5 w-5" />
            </div>
            <span>PetQR</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto max-w-6xl px-4 py-12 md:py-16">
        {/* Encabezado de categoría */}
        <div className="max-w-3xl mb-12">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Catálogo Oficial PetQR · Le Plop
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {category.title}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            {category.subtitle}
          </p>

          {/* Navegación rápida entre categorías */}
          <div className="mt-6 flex flex-wrap gap-2">
            {Object.entries(productDetails).map(([slug, cat]) => {
              const isActive = slug === categorie
              return (
                <Link
                  key={slug}
                  href={`/productos/${slug}`}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium border transition-colors ${
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  {cat.title}
                </Link>
              )
            })}
            <Link
              href="/promociones"
              className="rounded-full px-4 py-1.5 text-xs font-medium border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
            >
              Ver Promociones →
            </Link>
          </div>
        </div>

        {/* Grilla de medallas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {category.items.map((item) => (
            <div key={item.name} className="group relative flex">
              {/* Sombreado degradado azul en hover */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-br from-primary/60 via-sky-500/40 to-secondary/60 opacity-0 blur-lg transition-all duration-500 group-hover:opacity-100"
              />

              <Card className="relative z-10 flex w-full flex-col justify-between border-2 border-border bg-card shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/60 group-hover:shadow-xl group-hover:shadow-primary/20">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-xl sm:text-2xl transition-colors group-hover:text-primary">
                      {item.name}
                    </CardTitle>
                    {item.badge && (
                      <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <CardDescription className="pt-2 text-sm sm:text-base leading-relaxed">
                    {item.desc}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Ficha de tamaño, colores/diseño y tecnología */}
                  <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4 text-sm">
                    <div className="flex items-start gap-2.5">
                      <Ruler className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-foreground">Tamaño: </span>
                        <span className="text-muted-foreground">{item.size}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Palette className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-foreground">Colores y diseño: </span>
                        <span className="text-muted-foreground">{item.colorsOrDesign}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <QrCode className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-foreground">Tecnología: </span>
                        <span className="text-muted-foreground">{item.tech}</span>
                      </div>
                    </div>
                  </div>

                  {/* Lista de beneficios incluidos */}
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {item.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Botones de contacto directo (WhatsApp + Instagram) */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <a
                      href={getWhatsAppLink(item)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button className="w-full gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Pedir por WhatsApp
                      </Button>
                    </a>

                    <a
                      href={getInstagramLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full gap-2 hover:border-primary/50">
                        <Instagram className="h-4 w-4" />
                        Consultar por Instagram
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Aviso de modalidad de compra */}
        <div className="mt-12 rounded-2xl border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Por el momento tomamos pedidos personalizados directamente por <strong className="text-foreground">WhatsApp</strong> o <strong className="text-foreground">Instagram</strong> para coordinar el diseño, nombre de tu mascota y envío o retiro.
        </div>
      </div>
    </main>
  )
}