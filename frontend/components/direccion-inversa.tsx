'use client'

import { useState, useEffect } from 'react'

interface DireccionInversaProps {
  lat: number | string | null | undefined;
  lng: number | string | null | undefined;
}

export default function DireccionInversa({ lat, lng }: DireccionInversaProps) {
  const [direccion, setDireccion] = useState<string>("Buscando ubicación...")

  // Convertimos a número de forma segura por si el backend los manda como string
  const numLat = lat != null ? Number(lat) : null;
  const numLng = lng != null ? Number(lng) : null;

  useEffect(() => {
    // 1. Validación inicial de seguridad
    if (numLat === null || numLng === null || isNaN(numLat) || isNaN(numLng)) {
      setDireccion("Ubicación no disponible")
      return
    }

    // 2. 🛡️ Candado para TypeScript: Creamos constantes que el compilador
    // garantiza que NUNCA van a ser null en los bloques de abajo.
    const latSegura: number = numLat;
    const lngSegura: number = numLng;

    async function obtenerDireccion() {
      try {
        // Consultamos a Nominatim de OpenStreetMap usando las variables seguras
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latSegura}&lon=${lngSegura}&format=json&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'es' // Forzamos idioma español
            }
          }
        )
        
        if (!response.ok) throw new Error("Error en la API")
        
        const data = await response.json()
        
        if (data && data.address) {
          const { road, house_number, city, town, suburb } = data.address
          const localidad = city || town || suburb || ""
          
          if (road) {
            // Retorna: "Calle Altura, Ciudad"
            setDireccion(`${road} ${house_number || ""}, ${localidad}`.trim().replace(/,\s*$/, ""))
          } else {
            // Si es una zona sin calles cargadas, tomamos los primeros 3 tramos de la descripción de OpenStreetMap
            setDireccion(data.display_name.split(',').slice(0, 3).join(','))
          }
        } else {
          setDireccion(`Lat: ${latSegura.toFixed(4)}, Lng: ${lngSegura.toFixed(4)}`)
        }
      } catch (error) {
        // Fallback de QA: si la API se satura, usamos las variables numéricas garantizadas
        setDireccion(`Lat: ${latSegura.toFixed(4)}, Lng: ${lngSegura.toFixed(4)}`)
      }
    }

    // Delay preventivo de 250ms para evitar spam a la API
    const timer = setTimeout(() => obtenerDireccion(), 250)
    return () => clearTimeout(timer)
  }, [numLat, numLng])

  return <span className="truncate">{direccion}</span>
}