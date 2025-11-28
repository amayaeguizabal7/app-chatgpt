/**
 * Servicio para hacer llamadas directas a Overpass API y Nominatim
 * Esto permite que el frontend funcione sin el servidor MCP en modo demo
 */

export interface Place {
  name: string;
  lat: number;
  lng: number;
  type: string;
  tags: Record<string, string>;
  address?: string;
  osm_id: number;
  osm_type: string;
  osm_url: string;
  display_name: string;
  distance_meters: number;
}

export interface SearchResults {
  places: Place[];
  count: number;
  query: string;
  radius_meters: number;
  center?: {
    lat: number;
    lng: number;
  };
}

/**
 * Geocodifica una dirección usando Nominatim
 * Intenta múltiples variaciones de la dirección si la primera falla
 */
async function tryGeocode(locationText: string, params: URLSearchParams): Promise<any> {
  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'OSM-Finder-App/1.0 (https://github.com/amayaeguizabal7/app-chatgpt)'
    }
  });

  if (!response.ok) {
    throw new Error(`Error en geocodificación: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Genera variaciones de una dirección para intentar geocodificar
 * Ordenadas de más simple a más compleja
 */
function generateLocationVariations(locationText: string): string[] {
  const variations: string[] = [];
  const clean = locationText.trim();
  const parts = clean.split(',').map(p => p.trim()).filter(p => p);
  
  // Estrategia: empezar con lo más simple y agregar detalles
  
  // 1. Solo ciudad y provincia (más probable que funcione)
  if (parts.length >= 2) {
    // Buscar ciudad y provincia (últimas dos partes que no sean números)
    const nonNumericParts = parts.filter(p => !p.match(/^\d+$/) && !p.match(/^\d{5}$/));
    if (nonNumericParts.length >= 2) {
      // Ciudad y provincia
      variations.push(`${nonNumericParts[nonNumericParts.length - 2]}, ${nonNumericParts[nonNumericParts.length - 1]}`);
      // Solo ciudad
      variations.push(nonNumericParts[nonNumericParts.length - 2]);
    }
  }
  
  // 2. Sin código postal
  const withoutCP = clean.replace(/,\s*\d{5}/g, '').trim();
  if (withoutCP !== clean && !variations.includes(withoutCP)) {
    variations.push(withoutCP);
  }
  
  // 3. Sin "España"
  const withoutCountry = clean.replace(/,\s*España\s*$/i, '').trim();
  if (withoutCountry !== clean && !variations.includes(withoutCountry)) {
    variations.push(withoutCountry);
  }
  
  // 4. Sin número de calle
  const withoutNumber = clean.replace(/^(.+?)\s+\d+/, '$1').trim();
  if (withoutNumber !== clean && !variations.includes(withoutNumber)) {
    variations.push(withoutNumber);
  }
  
  // 5. Solo calle y ciudad (sin número, sin CP, sin país)
  if (parts.length >= 2) {
    const streetPart = parts[0];
    const cityPart = parts.find(p => !p.match(/^\d+$/) && !p.match(/^\d{5}$/) && p !== 'España' && p.length > 2);
    if (cityPart && streetPart !== cityPart) {
      const streetCity = `${streetPart}, ${cityPart}`;
      if (!variations.includes(streetCity)) {
        variations.push(streetCity);
      }
    }
  }
  
  // 6. Versión original completa (última opción)
  if (!variations.includes(clean)) {
    variations.push(clean);
  }
  
  // Eliminar duplicados manteniendo el orden
  return Array.from(new Set(variations));
}

/**
 * Geocodifica una dirección usando Nominatim
 * Intenta múltiples variaciones si la primera falla
 */
export async function geocodeLocation(locationText: string): Promise<{ lat: number; lng: number; display_name: string } | null> {
  try {
    const cleanLocation = locationText.trim();
    
    if (!cleanLocation) {
      throw new Error('La dirección no puede estar vacía');
    }

    // Generar variaciones de la dirección
    const variations = generateLocationVariations(cleanLocation);
    console.log('Intentando geocodificar con variaciones:', variations);

    // Intentar cada variación
    for (const variation of variations) {
      try {
        // Primero intentar con país específico (España)
        let params = new URLSearchParams({
          q: variation,
          format: 'json',
          limit: '5', // Aumentar límite para tener más opciones
          addressdetails: '1',
          countrycodes: 'es',
          'accept-language': 'es'
        });

        let data = await tryGeocode(variation, params);
        
        // Si no hay resultados con país específico, intentar sin restricción de país
        if (!data || data.length === 0) {
          params.delete('countrycodes');
          data = await tryGeocode(variation, params);
        }

        if (data && data.length > 0) {
          // Buscar el resultado más relevante
          // Priorizar resultados que contengan palabras clave de la búsqueda original
          const originalLower = cleanLocation.toLowerCase();
          const bestMatch = data.find((r: any) => {
            const displayLower = (r.display_name || '').toLowerCase();
            return originalLower.split(',').some(part => 
              part.trim() && displayLower.includes(part.trim().toLowerCase())
            );
          }) || data[0];

          console.log(`Geocodificación exitosa con: "${variation}"`);
          console.log('Resultado:', bestMatch.display_name);
          
          return {
            lat: parseFloat(bestMatch.lat),
            lng: parseFloat(bestMatch.lon),
            display_name: bestMatch.display_name
          };
        }
      } catch (error) {
        console.warn(`Error al intentar geocodificar "${variation}":`, error);
        // Continuar con la siguiente variación
        continue;
      }
    }

    // Si ninguna variación funcionó, lanzar error
    throw new Error(`No se pudo geocodificar la ubicación después de intentar ${variations.length} variaciones`);
    
  } catch (error) {
    console.error('Error en geocodificación:', error);
    throw error;
  }
}

/**
 * Calcula la distancia entre dos puntos usando la fórmula de Haversine
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Radio de la Tierra en metros
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Extrae tipos de lugares de una query de texto
 */
function extractPlaceTypes(query: string): string[] {
  const queryLower = query.toLowerCase();
  
  const typeMapping: Record<string, string[]> = {
    'cafe': ['amenity=cafe'],
    'cafetería': ['amenity=cafe'],
    'cafeteria': ['amenity=cafe'],
    'restaurante': ['amenity=restaurant'],
    'restaurant': ['amenity=restaurant'],
    'biblioteca': ['amenity=library'],
    'library': ['amenity=library'],
    'parque': ['leisure=park'],
    'park': ['leisure=park'],
    'museo': ['tourism=museum'],
    'museum': ['tourism=museum'],
    'farmacia': ['amenity=pharmacy'],
    'pharmacy': ['amenity=pharmacy'],
    'hospital': ['amenity=hospital'],
    'colegio': ['amenity=school'],
    'school': ['amenity=school'],
    'universidad': ['amenity=university'],
    'university': ['amenity=university'],
    'cine': ['amenity=cinema'],
    'cinema': ['amenity=cinema'],
    'teatro': ['amenity=theatre'],
    'theatre': ['amenity=theatre'],
    'gimnasio': ['leisure=fitness_centre'],
    'gym': ['leisure=fitness_centre'],
    'supermercado': ['shop=supermarket'],
    'supermarket': ['shop=supermarket'],
    'veterinaria': ['amenity=veterinary'],
    'veterinario': ['amenity=veterinary'],
    'veterinary': ['amenity=veterinary'],
    'clínica veterinaria': ['amenity=veterinary'],
    'clinica veterinaria': ['amenity=veterinary'],
  };

  const foundTypes: string[] = [];
  for (const [keyword, tags] of Object.entries(typeMapping)) {
    if (queryLower.includes(keyword)) {
      foundTypes.push(...tags);
    }
  }

  // Si no se encontró nada específico, buscar por nombre
  if (foundTypes.length === 0) {
    return [`name~"${query}",i`];
  }

  return foundTypes;
}

/**
 * Construye una consulta Overpass QL
 */
function buildOverpassQuery(placeTypes: string[], lat: number, lng: number, radiusMeters: number): string {
  const filters = placeTypes.map(type => `[${type}]`).join('');
  
  const query = `
    [out:json][timeout:25];
    (
      node${filters}(around:${radiusMeters},${lat},${lng});
      way${filters}(around:${radiusMeters},${lat},${lng});
      relation${filters}(around:${radiusMeters},${lat},${lng});
    );
    out center meta;
  `;
  
  return query;
}

/**
 * Parsea los resultados de Overpass
 */
function parseOverpassResults(data: any, centerLat: number, centerLng: number): Place[] {
  const places: Place[] = [];

  for (const element of data.elements || []) {
    if (!['node', 'way', 'relation'].includes(element.type)) {
      continue;
    }

    const tags = element.tags || {};
    
    // Obtener coordenadas
    let lat: number, lng: number;
    if (element.type === 'node') {
      lat = element.lat;
      lng = element.lon;
    } else if (element.center) {
      lat = element.center.lat;
      lng = element.center.lon;
    } else {
      continue;
    }

    // Obtener nombre
    const name = tags.name || tags['name:es'] || tags['name:en'] || tags.ref || 'Sin nombre';
    
    // Determinar tipo
    const placeType = tags.amenity || tags.leisure || tags.tourism || tags.shop || 'place';
    
    // Construir dirección
    const addressParts: string[] = [];
    if (tags['addr:street']) addressParts.push(tags['addr:street']);
    if (tags['addr:housenumber']) addressParts.push(tags['addr:housenumber']);
    if (tags['addr:city']) addressParts.push(tags['addr:city']);
    const address = addressParts.length > 0 ? addressParts.join(', ') : undefined;
    
    // URL de OSM
    const osmId = element.id;
    const osmType = element.type;
    const osmUrl = `https://www.openstreetmap.org/${osmType}/${osmId}`;
    
    // Calcular distancia
    const distanceMeters = calculateDistance(centerLat, centerLng, lat, lng);
    
    places.push({
      name,
      lat,
      lng,
      type: placeType,
      tags,
      address,
      osm_id: osmId,
      osm_type: osmType,
      osm_url: osmUrl,
      display_name: address ? `${name} - ${address}` : name,
      distance_meters: distanceMeters
    });
  }

  // Ordenar por distancia
  places.sort((a, b) => a.distance_meters - b.distance_meters);
  
  return places;
}

/**
 * Busca lugares usando Overpass API directamente
 */
export async function searchPlaces(
  query: string,
  lat?: number,
  lng?: number,
  locationText?: string,
  radiusMeters: number = 1000
): Promise<SearchResults> {
  try {
    // Si no hay coordenadas, geocodificar primero
    let centerLat = lat;
    let centerLng = lng;
    
    if ((!centerLat || !centerLng) && locationText) {
      const geocodeResult = await geocodeLocation(locationText);
      if (!geocodeResult) {
        throw new Error(`No se pudo geocodificar la ubicación: ${locationText}`);
      }
      centerLat = geocodeResult.lat;
      centerLng = geocodeResult.lng;
    }

    if (!centerLat || !centerLng) {
      throw new Error('Se requiere lat/lng o location_text para buscar lugares');
    }

    // Extraer tipos de lugares
    const placeTypes = extractPlaceTypes(query);
    
    // Construir consulta Overpass
    const overpassQuery = buildOverpassQuery(placeTypes, centerLat, centerLng, radiusMeters);
    
    // Llamar a Overpass API
    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    const response = await fetch(overpassUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    });

    if (!response.ok) {
      throw new Error(`Error en Overpass API: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Parsear resultados
    const places = parseOverpassResults(data, centerLat, centerLng);
    
    return {
      places,
      count: places.length,
      query,
      radius_meters: radiusMeters,
      center: {
        lat: centerLat,
        lng: centerLng
      }
    };
  } catch (error) {
    console.error('Error en búsqueda de lugares:', error);
    throw error;
  }
}

