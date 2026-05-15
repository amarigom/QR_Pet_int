'use client'

import { QRCodeSVG } from 'qrcode.react'
import { PawPrint } from 'lucide-react'

interface QRCodeDisplayProps {
  code: string
  petName: string
  size?: number
}

export function QRCodeDisplay({ code, petName, size = 200 }: QRCodeDisplayProps) {
  const scanUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/scan/${code}` 
    : `/scan/${code}`

  return (
    <div className="flex flex-col items-center">
      <div className="p-4 bg-white rounded-xl shadow-sm border">
        <QRCodeSVG
          value={scanUrl}
          size={size}
          level="H"
          includeMargin={false}
          imageSettings={{
            src: '',
            height: 24,
            width: 24,
            excavate: true,
          }}
        />
      </div>
      <div className="mt-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <PawPrint className="w-4 h-4 text-primary" />
          <p className="font-semibold">{petName}</p>
        </div>
        <p className="text-xs text-muted-foreground font-mono">{code}</p>
      </div>
    </div>
  )
}
