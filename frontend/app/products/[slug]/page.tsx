import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, MessageCircle, Instagram, QrCode, Ruler, Palette, Sparkles, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface MedalProduct {
  name: string
  badge?: string
  image: string
  imageAlt: string
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
  'medallas-pet-qr': {
    title: 'Medallas Pet QR',
    subtitle: 'Identificación inteligente al instante para tu mascota. Se activa mediante escaneo del código QR y vincula su perfil digital y clínico.',
    items: [
      {
        name: 'Medalla Circular Standard',
        badge: 'Más elegida',
        image: '/images/products/qr-4.jpg',
        imageAlt: 'Medalla Circular Standard PetQR personalizada con código QR',
        desc: 'Ideal para perros medianos y grandes. Impresión de alta definición por sublimación con terminación brillante resistente al agua y rayones.',
        size: '35 mm de diámetro · Espesor 2 mm',
        colorsOrDesign: 'Azul PetQR, celeste, rosa pastel, amarillo o diseño personalizado con huellitas.',
        tech: 'Código QR de alto contraste grabado en dorso',
        features: ['Incluye argolla metálica reforzada', 'Resistente al agua y al sol', 'Perfil digital editable sin límites'],
      },
      {
        name: 'Medalla Mini Gatos & Razas Pequeñas',
        badge: 'Ultra liviana',
        image: '/images/products/qr-mini.jpg', // Reemplazá por la foto de tu medalla mini si tiene otro nombre
        imageAlt: 'Medalla Mini PetQR liviana para gatos y perros pequeños',
        desc: 'Diseñada para no molestar en el cuello de gatos o perros toy, manteniendo lectura instantánea desde cualquier celular.',
        size: '25 mm de diámetro · Peso menor a 5 g',
        colorsOrDesign: 'Colores pasteles, tonos neón, diseño galaxia, corazones o fondo liso a elección.',
        tech: 'Código QR de alta densidad',
        features: ['No hace ruido ni pesa', 'Argolla liviana incluida', 'Alertas de escaneo con ubicación'],
      },
    ],
  },
  'medallas-twit-nfc-qr': {
    title: 'Medallas Twit NFC / QR',
    subtitle: 'Doble protección: se activan mediante escaneo con cámara o acercando el celular sin contacto (Contactless).',
    items: [
      {
        name: 'Medalla Twit Resina Cristal (NFC + QR)',
        badge: 'Doble tecnología',
        image: '/qr2.jpg',
        imageAlt: 'Medalla Twit con chip NFC y código QR encapsulada en resina cristal',
        desc: 'Encapsulado en resina cristal 3D que protege el diseño y aloja un chip NFC interno de lectura inmediata por proximidad.',
        size: '38 mm de diámetro · Relieve cristal 3D',
        colorsOrDesign: 'Azul marino, rosa,blanco o diseño exclusivo Le Plop.',
        tech: 'Chip NFC NTAG213 + Código QR impreso',
        features: ['Lectura sin cámara acercando el teléfono', 'Máxima resistencia a golpes y agua', 'Historia clínica y vacunas accesibles'],
      },
      {
        name: 'Medalla Escudo Clínico NFC ',
        image: '/images/products/airtag.jpg', // Reemplazá por la foto correspondiente en /public/images/products/
        imageAlt: 'Medalla formato escudo con alerta médica NFC ',
        desc: 'Formato anatómico pensado para identificación rápida en paseos y consultas veterinarias.',
        size: '25 mm x 28 mm',
        colorsOrDesign: 'negro con etiqueta roja',
        tech: 'Chip NFC + Código QR de respaldo',
        features: ['Espacio para alerta médica ("Toma medicación")', 'Argolla doble de acero', 'Sincronización instantánea con PetQR'],
      },
    ],
  },
  'accesorios-le-plop': {
    title: 'Accesorios Le Plop',
    subtitle: 'Diseños exclusivos creados para acompañar las medallas PetQR con comodidad y estilo.',
    items: [
      {
        name: 'Collar Regulable Edición Le Plop',
        badge: 'Diseño exclusivo',
        image: '/images/products/Leplop.jpg',
        imageAlt: 'Collar regulable diseño exclusivo Le Plop para mascotas',
        desc: 'Cinta reforzada suave al tacto con herrajes metálicos y argolla dedicada para colgar la medalla PetQR sin que se enganche.',
        size: 'Talles XS, S, M y L (regulables)',
        colorsOrDesign: 'Estampados exclusivos Le Plop, azul PetQR, verde salvia y tonos pastel.',
        tech: 'Compatible con medallas QR y Twit NFC/QR',
        features: ['Hebilla de cierre seguro', 'Lavable y de secado rápido', 'Combinable con medalla personalizada'],
      },
      {
        name: 'Kit Collar + Medalla PetQR',
        badge: 'Combo ideal',
        image: '/images/products/kit-leplop.jpg', // Reemplazá por la foto del combo en /public/images/products/
        imageAlt: 'Combo collar Le Plop con medalla personalizada PetQR',
        desc: 'Llevá el collar Le Plop haciendo juego con la medalla personalizada de tu mascota lista para activar.',
        size: 'A medida según talle de tu mascota',
        colorsOrDesign: 'Diseños combinados a elección.',
        tech: 'Medalla QR o Twit NFC/QR incluida',
        features: ['Descuento por combo completo', 'Personalización con nombre', 'Alta gratuita en plataforma PetQR'],
      },
    ],
  },
}

const WHATSAPP_PHONE = '5492494630750'
const INSTAGRAM_HANDLE = 'petqr.ar'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const category = productDetails[slug]

  if (!category) return notFound()

  const getWhatsAppLink = (item: MedalProduct) => {
    const message = encodeURIComponent(
      `¡Hola! Vi en la web de PetQR *${item.name}* (${item.size}) y quiero consultar disponibilidad, colores y precio.`
    )
    return `https://wa.me/${WHATSAPP_PHONE}?text=${message}`
  }

  return (
    <main className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.15),_transparent_45%)] pointer-events-none" />

      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-4">
          <Link
            href="/es/shop"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Shop
          </Link>

          <Link href="/" className="flex items-center gap-2 font-bold text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <QrCode className="h-5 w-5" />
            </div>
            <span>PetQR</span>
          </Link>
        </div>
      </header>

      <div className="relative z-10 container mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="max-w-3xl mb-12">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Colección Oficial PetQR · Le Plop
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {category.title}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            {category.subtitle}
          </p>

          {/* Pestañas rápidas entre las 3 colecciones del Shop */}
          <div className="mt-6 flex flex-wrap gap-2">
            {Object.entries(productDetails).map(([key, cat]) => {
              const isActive = key === slug
              return (
                <Link
                  key={key}
                  href={`/products/${key}`}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {category.items.map((item) => (
            <div key={item.name} className="group relative flex">
              {/* Sombreado degradado azul en hover */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-br from-primary/60 via-sky-500/40 to-secondary/60 opacity-0 blur-lg transition-all duration-500 group-hover:opacity-100"
              />

              <Card className="relative z-10 flex w-full flex-col justify-between overflow-hidden border-2 border-border bg-card shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/60 group-hover:shadow-xl group-hover:shadow-primary/20">
                <div>
                  {/* Imagen del producto */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted border-b border-border">
                    <img
                      src={item.image}
                      alt={item.imageAlt}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {item.badge && (
                      <span className="absolute top-3 right-3 rounded-full bg-background/90 backdrop-blur-sm border border-primary/20 px-3 py-1 text-xs font-semibold text-primary shadow-sm">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl transition-colors group-hover:text-primary">
                      {item.name}
                    </CardTitle>
                    <CardDescription className="pt-1.5 text-sm sm:text-base leading-relaxed">
                      {item.desc}
                    </CardDescription>
                  </CardHeader>
                </div>

                <CardContent className="space-y-6">
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

                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {item.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <a href={getWhatsAppLink(item)} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button className="w-full gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Pedir por WhatsApp
                      </Button>
                    </a>

                    <a href={`https://instagram.com/${INSTAGRAM_HANDLE}`} target="_blank" rel="noopener noreferrer" className="flex-1">
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

        <div className="mt-12 rounded-2xl border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Por el momento tomamos pedidos personalizados directamente por <strong className="text-foreground">WhatsApp</strong> o <strong className="text-foreground">Instagram</strong> para coordinar el diseño, nombre de tu mascota y envío o retiro.
        </div>
      </div>
    </main>
  )
}