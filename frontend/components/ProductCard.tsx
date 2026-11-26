'use client'

import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Instagram,
  QrCode,
  Ruler,
  Palette,
  CheckCircle2,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export interface ProductImage {
  src: string
  alt: string
}

export interface ProductColorOption {
  name: string
  hex: string
}

export interface MedalProduct {
  name: string
  badge?: string
  images: ProductImage[]
  desc: string
  sizes: string[] // Si tiene 1 solo elemento -> se muestra como tamaño único deshabilitado
  colors: ProductColorOption[] // Si tiene 1 solo elemento -> se muestra como color único deshabilitado
  colorsNote?: string
  tech: string
  features: string[]
}

interface ProductCardProps {
  item: MedalProduct
  whatsappPhone: string
  instagramHandle: string
}

export function ProductCard({ item, whatsappPhone, instagramHandle }: ProductCardProps) {
  const [activeImgIndex, setActiveImgIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string>(item.sizes[0] ?? '')
  const [selectedColor, setSelectedColor] = useState<string>(item.colors[0]?.name ?? '')

  const isSingleSize = item.sizes.length <= 1
  const isSingleColor = item.colors.length <= 1
  const hasMultipleImages = item.images.length > 1

  const currentImage = item.images[activeImgIndex] ?? item.images[0]

  const handlePrevImage = () => {
    setActiveImgIndex((prev) => (prev === 0 ? item.images.length - 1 : prev - 1))
  }

  const handleNextImage = () => {
    setActiveImgIndex((prev) => (prev === item.images.length - 1 ? 0 : prev + 1))
  }

  const getWhatsAppLink = () => {
    const sizeText = isSingleSize ? `${selectedSize} (tamaño único)` : selectedSize
    const colorText = isSingleColor ? `${selectedColor} (color/diseño único)` : selectedColor
    const message = encodeURIComponent(
      `¡Hola! Vi en la web de PetQR *${item.name}*.\n` +
        `• Tamaño: ${sizeText}\n` +
        `• Color / Diseño: ${colorText}\n` +
        `Quería consultar disponibilidad y precio.`
    )
    return `https://wa.me/${whatsappPhone}?text=${message}`
  }

  return (
    <div className="group relative flex">
      {/* Sombreado degradado azul en hover */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-br from-primary/60 via-sky-500/40 to-secondary/60 opacity-0 blur-lg transition-all duration-500 group-hover:opacity-100"
      />

      <Card className="relative z-10 flex w-full flex-col justify-between overflow-hidden border-2 border-border bg-card shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/60 group-hover:shadow-xl group-hover:shadow-primary/20">
        <div>
          {/* Carrusel de imagen principal */}
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted border-b border-border">
            {currentImage && (
              <img
                src={currentImage.src}
                alt={currentImage.alt}
                className="h-full w-full object-cover transition-all duration-500"
              />
            )}

            {item.badge && (
              <span className="absolute top-3 right-3 rounded-full bg-background/90 backdrop-blur-sm border border-primary/20 px-3 py-1 text-xs font-semibold text-primary shadow-sm">
                {item.badge}
              </span>
            )}

            {/* Controles anterior / siguiente si hay más de 1 imagen */}
            {hasMultipleImages && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  aria-label="Imagen anterior"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm backdrop-blur-sm border border-border transition hover:bg-background hover:text-primary"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  aria-label="Imagen siguiente"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm backdrop-blur-sm border border-border transition hover:bg-background hover:text-primary"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {/* Tira de miniaturas seleccionables abajo de la foto */}
          {hasMultipleImages && (
            <div className="flex items-center gap-2 overflow-x-auto border-b border-border bg-muted/30 px-4 py-2.5">
              {item.images.map((img, idx) => {
                const isSelected = idx === activeImgIndex
                return (
                  <button
                    key={`${img.src}-${idx}`}
                    type="button"
                    onClick={() => setActiveImgIndex(idx)}
                    aria-label={`Ver imagen ${idx + 1}: ${img.alt}`}
                    className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/25 scale-105'
                        : 'border-transparent opacity-65 hover:opacity-100 hover:border-border'
                    }`}
                  >
                    <img src={img.src} alt={img.alt} className="h-full w-full object-cover" />
                  </button>
                )
              })}
            </div>
          )}

          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl transition-colors group-hover:text-primary">
              {item.name}
            </CardTitle>
            <CardDescription className="pt-1.5 text-sm sm:text-base leading-relaxed">
              {item.desc}
            </CardDescription>
          </CardHeader>
        </div>

        <CardContent className="space-y-5">
          {/* Selectores de Tamaño y Color (con estado deshabilitado si es único) */}
          <div className="space-y-4 rounded-xl border border-border bg-muted/40 p-4 text-sm">
            {/* Selector de Tamaño */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                  <Ruler className="h-4 w-4 text-primary" />
                  Tamaño
                </span>
                {isSingleSize && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    Tamaño único
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {item.sizes.map((size) => {
                  const active = selectedSize === size
                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={isSingleSize}
                      onClick={() => setSelectedSize(size)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                        isSingleSize
                          ? 'cursor-not-allowed border-border bg-muted/70 text-muted-foreground opacity-80'
                          : active
                            ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                            : 'border-border bg-background text-foreground hover:border-primary/50'
                      }`}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Selector de Color / Diseño */}
            <div className="space-y-2 pt-1 border-t border-border/60">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                  <Palette className="h-4 w-4 text-primary" />
                  Color / Diseño:{' '}
                  <span className="font-normal text-muted-foreground">{selectedColor}</span>
                </span>
                {isSingleColor && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    Color único
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {item.colors.map((color) => {
                  const active = selectedColor === color.name
                  return (
                    <button
                      key={color.name}
                      type="button"
                      disabled={isSingleColor}
                      onClick={() => setSelectedColor(color.name)}
                      title={isSingleColor ? `${color.name} (Color único)` : color.name}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                        isSingleColor
                          ? 'cursor-not-allowed border-border bg-muted/70 text-muted-foreground opacity-80'
                          : active
                            ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                            : 'border-border bg-background text-foreground hover:border-primary/50'
                      }`}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-black/15 shrink-0"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span>{color.name}</span>
                    </button>
                  )
                })}
              </div>

              {item.colorsNote && (
                <p className="text-xs text-muted-foreground pt-0.5">{item.colorsNote}</p>
              )}
            </div>

            {/* Tecnología */}
            <div className="flex items-start gap-2 pt-2 border-t border-border/60">
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

          {/* Botones de contacto directo */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button className="w-full gap-2">
                <MessageCircle className="h-4 w-4" />
                Pedir por WhatsApp
              </Button>
            </a>

            <a
              href={`https://instagram.com/${instagramHandle}`}
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
  )
}