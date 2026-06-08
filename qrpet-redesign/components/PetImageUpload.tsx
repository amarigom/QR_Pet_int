'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, X, Camera } from 'lucide-react'
import { toast } from 'sonner'

interface PetImageUploadProps {
  petName: string
  onImageUpload?: (file: File) => Promise<void>
  initialImage?: string
  onImageChange?: (imageUrl: string) => void
}

export default function PetImageUpload({
  petName,
  onImageUpload,
  initialImage,
  onImageChange
}: PetImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(initialImage || null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setPreview(result)
      onImageChange?.(result)
    }
    reader.readAsDataURL(file)

    // Upload if handler provided
    if (onImageUpload) {
      setIsLoading(true)
      try {
        await onImageUpload(file)
        toast.success('Foto de ' + petName + ' subida con éxito')
      } catch (error) {
        console.error('Error uploading image:', error)
        toast.error('Error al subir la imagen')
        setPreview(null)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleRemove = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onImageChange?.('')
  }

  return (
    <div className="space-y-4">
      <div className="text-sm">
        <label className="font-semibold text-foreground block mb-2">
          Foto de {petName}
        </label>
      </div>

      {preview ? (
        <Card className="border-border overflow-hidden shadow-elevation-2">
          <div className="relative aspect-video bg-gradient-to-br from-secondary/10 to-accent/10 overflow-hidden">
            <img
              src={preview}
              alt={petName}
              className="w-full h-full object-cover"
            />
            <button
              onClick={handleRemove}
              disabled={isLoading}
              className="absolute top-2 right-2 p-2 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-md disabled:opacity-50"
              title="Eliminar foto"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <CardContent className="p-4 space-y-3">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Foto actual</p>
              <p>Haz clic en el botón de eliminar para cambiar la foto</p>
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              variant="secondary"
              className="w-full btn-transition"
            >
              <Camera className="w-4 h-4 mr-2" />
              {isLoading ? 'Subiendo...' : 'Cambiar foto'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card
          className={`border-2 border-dashed cursor-pointer transition-all duration-300 ${
            isDragging
              ? 'border-secondary bg-secondary/5'
              : 'border-border hover:border-secondary/50 hover:bg-secondary/5'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="py-12 px-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8 text-secondary/50" />
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">
                  Carga una foto de {petName}
                </p>
                <p className="text-sm text-muted-foreground">
                  Arrastra y suelta o haz clic para seleccionar
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, GIF hasta 5MB
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            handleFileSelect(file)
          }
        }}
        disabled={isLoading}
        className="hidden"
      />
    </div>
  )
}
