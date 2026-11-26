import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, QrCode, Sparkles } from 'lucide-react'
import { ProductCard, type MedalProduct } from '@/components/ProductCard'

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
        images: [
          { src: '/images/products/qr-4.jpg', alt: 'Medalla Circular Standard PetQR personalizada con código QR' },
          { src: '/images/products/frente.jpeg', alt: 'Medalla Circular Standard PetQR personalizada con código QR' },
          { src: '/images/products/dorso.jpg', alt: 'Medalla Circular Standard PetQR personalizada con código QR' },
          // Agregá acá más fotos de este modelo para activar la tira de miniaturas abajo:
          // { src: '/images/products/qr-4-dorso.jpg', alt: 'Dorso con código QR' },
        ],
        desc: 'Ideal para perros medianos y grandes. Impresión de alta definición por sublimación con terminación brillante resistente al agua y rayones.',
        sizes: ['35 mm de diámetro · Espesor 2 mm'], // 1 solo elemento -> se muestra deshabilitado ("Tamaño único")
        colors: [
          { name: 'Azul PetQR', hex: '#2563eb' },
          { name: 'Celeste', hex: '#7dd3fc' },
          { name: 'Rosa Pastel', hex: '#f9a8d4' },
          { name: 'Amarillo', hex: '#fde047' },
          { name: 'Diseño Personalizado con Huellitas', hex: '#e2e8f0' },
        ],
        tech: 'Código QR de alto contraste grabado en dorso',
        features: ['Incluye argolla metálica reforzada', 'Resistente al agua y al sol', 'Perfil digital editable sin límites'],
      },
      {
        name: 'Medalla Mini Gatos & Razas Pequeñas',
        badge: 'Ultra liviana',
        images: [
          { src: '/images/products/qr-mini.jpg', alt: 'Medalla Mini PetQR liviana para gatos y perros pequeños' },
        ],
        desc: 'Diseñada para no molestar en el cuello de gatos o perros toy, manteniendo lectura instantánea desde cualquier celular.',
        sizes: ['25 mm de diámetro · Peso < 5 g'], // Tamaño único deshabilitado
        colors: [
          { name: 'Colores Pasteles', hex: '#bae6fd' },
          { name: 'Tonos Neón', hex: '#a3e635' },
          { name: 'Diseño Galaxia', hex: '#6366f1' },
          { name: 'Corazones', hex: '#f472b6' },
          { name: 'Fondo Liso a Elección', hex: '#ffffff' },
        ],
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
        images: [
          { src: '/qr2.jpg', alt: 'Medalla Twit con chip NFC y código QR encapsulada en resina cristal' },
          { src: '/images/products/medalla1.2.jpg', alt: 'Medalla Circular Standard PetQR personalizada con código QR' },
          { src: '/images/products/medalla1.3.jpg', alt: 'Medalla Circular Standard PetQR personalizada con código QR' },
        ],
        desc: 'Encapsulado en resina cristal 3D que protege el diseño y aloja un chip NFC interno de lectura inmediata por proximidad.',
        sizes: ['38 mm de diámetro · Relieve cristal 3D'], // Tamaño único deshabilitado
        colors: [
          { name: 'Azul Marino', hex: '#1e3a8a' },
          { name: 'Rosa', hex: '#f472b6' },
          { name: 'Blanco', hex: '#ffffff' },
          { name: 'Diseño Exclusivo Le Plop', hex: '#0284c7' },
        ],
        tech: 'Chip NFC NTAG213 + Código QR impreso',
        features: ['Lectura sin cámara acercando el teléfono', 'Máxima resistencia a golpes y agua', 'Historia clínica y vacunas accesibles'],
      },
      {
        name: 'Medalla Escudo Clínico NFC',
        images: [
          { src: '/images/products/airtag.jpg', alt: 'Medalla formato escudo con alerta médica NFC' },
        ],
        desc: 'Formato anatómico pensado para identificación rápida en paseos y consultas veterinarias.',
        sizes: ['25 mm x 28 mm'], // Tamaño único deshabilitado
        colors: [
          { name: 'Negro con etiqueta roja', hex: '#18181b' }, // Color único deshabilitado
        ],
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
        images: [
          { src: '/images/products/Leplop.jpg', alt: 'Collar regulable diseño exclusivo Le Plop para mascotas' },
        ],
        desc: 'Cinta reforzada suave al tacto con herrajes metálicos y argolla dedicada para colgar la medalla PetQR sin que se enganche.',
        sizes: ['Talle XS (regulable)', 'Talle S (regulable)', 'Talle M (regulable)', 'Talle L (regulable)'],
        colors: [
          { name: 'Estampados Exclusivos Le Plop', hex: '#3b82f6' },
          { name: 'Azul PetQR', hex: '#1d4ed8' },
          { name: 'Verde Salvia', hex: '#6ee7b7' },
          { name: 'Tonos Pastel', hex: '#fbcfe8' },
        ],
        tech: 'Compatible con medallas QR y Twit NFC/QR',
        features: ['Hebilla de cierre seguro', 'Lavable y de secado rápido', 'Combinable con medalla personalizada'],
      },
      {
        name: 'Kit Collar + Medalla PetQR',
        badge: 'Combo ideal',
        images: [
          { src: '/images/products/kit-leplop.jpg', alt: 'Combo collar Le Plop con medalla personalizada PetQR' },
        ],
        desc: 'Llevá el collar Le Plop haciendo juego con la medalla personalizada de tu mascota lista para activar.',
        sizes: ['A medida según talle de tu mascota'], // Tamaño único deshabilitado
        colors: [
          { name: 'Diseños combinados a elección', hex: '#0ea5e9' }, // Color único deshabilitado
        ],
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

        {/* Grilla de tarjetas interactivas con carrusel y selectores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {category.items.map((item) => (
            <ProductCard
              key={item.name}
              item={item}
              whatsappPhone={WHATSAPP_PHONE}
              instagramHandle={INSTAGRAM_HANDLE}
            />
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Por el momento tomamos pedidos personalizados directamente por <strong className="text-foreground">WhatsApp</strong> o <strong className="text-foreground">Instagram</strong> para coordinar el diseño, nombre de tu mascota y envío o retiro.
        </div>
      </div>
    </main>
  )
}