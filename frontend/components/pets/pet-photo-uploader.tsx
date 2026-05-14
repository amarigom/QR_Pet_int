'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface PetPhotoUploaderProps {
  currentPhoto?: string | null;
  onPhotoChange: (photoUrl: string) => void;
  isLoading?: boolean;
}

export function PetPhotoUploader({ currentPhoto, onPhotoChange, isLoading = false }: PetPhotoUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentPhoto || null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Solo se permiten archivos JPG, PNG o WebP')
      return
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      toast.error('El archivo debe ser menor a 5MB')
      return
    }

    // Crear preview
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setPreview(result)
      // Simular upload (en producción usarías una API)
      uploadPhoto(result)
    }
    reader.readAsDataURL(file)
  }

  async function uploadPhoto(photoData: string) {
    setIsUploading(true)
    try {
      // En un caso real, subirías a un servicio como Vercel Blob o AWS S3
      // Por ahora, simularemos que el upload fue exitoso
      await new Promise(resolve => setTimeout(resolve, 1000))
      onPhotoChange(photoData)
      toast.success('Foto actualizada correctamente')
    } catch (error) {
      toast.error('Error al subir la foto')
      setPreview(currentPhoto || null)
    } finally {
      setIsUploading(false)
    }
  }

  function handleRemovePhoto() {
    setPreview(null)
    onPhotoChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden group">
        {preview ? (
          <>
            <Image
              src={preview}
              alt="Foto de mascota"
              fill
              className="object-cover"
            />
            {/* Overlay al hacer hover */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isUploading}
              >
                <Camera className="w-4 h-4 mr-1" />
                Cambiar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={handleRemovePhoto}
                disabled={isLoading || isUploading}
              >
                <X className="w-4 h-4 mr-1" />
                Quitar
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 font-medium">Sube una foto de tu mascota</p>
            <p className="text-xs text-gray-500">JPG, PNG o WebP (máx. 5MB)</p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isLoading || isUploading}
      />

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading || isUploading}
      >
        <Upload className="w-4 h-4 mr-2" />
        {isUploading ? 'Subiendo...' : 'Seleccionar Foto'}
      </Button>

      {/* Ejemplos sugeridos */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-600">O elige una foto de ejemplo:</p>
        <div className="grid grid-cols-3 gap-2">
          {EXAMPLE_PHOTOS.map((photo) => (
            <button
              key={photo.id}
              type="button"
              className="relative h-20 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-primary transition-colors"
              onClick={() => {
                setPreview(photo.url)
                onPhotoChange(photo.url)
                toast.success('Foto de ejemplo seleccionada')
              }}
              disabled={isLoading || isUploading}
            >
              <Image
                src={photo.url}
                alt={photo.name}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Fotos de ejemplo
const EXAMPLE_PHOTOS = [
  {
    id: 1,
    name: 'Perro 1',
    url: 'https://images.unsplash.com/photo-1633772715463-7516aa541e61?w=400&h=400&fit=crop'
  },
  {
    id: 2,
    name: 'Perro 2',
    url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=400&fit=crop'
  },
  {
    id: 3,
    name: 'Gato',
    url: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=400&fit=crop'
  },
]
