import React from 'react';
import { Place, SearchStatus } from '../types';
import './ResultsList.css';

interface ResultsListProps {
  places: Place[];
  selectedPlace: Place | null;
  onPlaceSelect: (place: Place) => void;
  status: SearchStatus;
  errorMessage: string;
}

/**
 * Capitaliza correctamente según las reglas del español
 * Primera letra en mayúscula, resto en minúsculas (excepto nombres propios)
 */
function capitalizeSpanish(text: string): string {
  if (!text) return text;
  // Convertir todo a minúsculas primero
  const lower = text.toLowerCase();
  // Capitalizar solo la primera letra
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * Traduce términos comunes al español
 */
function translateToSpanish(term: string): string {
  const translations: Record<string, string> = {
    'christian': 'cristiana',
    'catholic': 'católica',
    'protestant': 'protestante',
    'orthodox': 'ortodoxa',
    'muslim': 'musulmana',
    'islam': 'islam',
    'jewish': 'judía',
    'judaism': 'judaísmo',
    'buddhist': 'budista',
    'buddhism': 'budismo',
    'hindu': 'hindú',
    'hinduism': 'hinduismo',
    'spanish': 'española',
    'italian': 'italiana',
    'french': 'francesa',
    'chinese': 'china',
    'japanese': 'japonesa',
    'mexican': 'mexicana',
    'indian': 'india',
  };
  
  const lowerTerm = term.toLowerCase();
  return translations[lowerTerm] || term;
}

/**
 * Genera una descripción en español basada en los tags de OSM
 */
function getPlaceDescription(place: Place): string {
  const tags = place.tags || {};
  
  // Mapeo de tipos comunes a descripciones en español
  const typeDescriptions: Record<string, string> = {
    // Amenities
    'place_of_worship': 'Lugar de culto',
    'church': 'Iglesia',
    'cathedral': 'Catedral',
    'chapel': 'Capilla',
    'mosque': 'Mezquita',
    'synagogue': 'Sinagoga',
    'temple': 'Templo',
    'restaurant': 'Restaurante',
    'cafe': 'Cafetería',
    'bar': 'Bar',
    'fast_food': 'Comida rápida',
    'pharmacy': 'Farmacia',
    'hospital': 'Hospital',
    'clinic': 'Clínica',
    'school': 'Colegio',
    'university': 'Universidad',
    'library': 'Biblioteca',
    'cinema': 'Cine',
    'theatre': 'Teatro',
    'bank': 'Banco',
    'atm': 'Cajero automático',
    'fuel': 'Gasolinera',
    'parking': 'Aparcamiento',
    'post_office': 'Oficina de correos',
    'police': 'Comisaría de policía',
    'fire_station': 'Parque de bomberos',
    'townhall': 'Ayuntamiento',
    'courthouse': 'Palacio de justicia',
    'embassy': 'Embajada',
    'community_centre': 'Centro comunitario',
    'arts_centre': 'Centro cultural',
    'marketplace': 'Mercado',
    'veterinary': 'Clínica veterinaria',
    
    // Leisure
    'park': 'Parque',
    'playground': 'Parque infantil',
    'sports_centre': 'Polideportivo',
    'stadium': 'Estadio',
    'swimming_pool': 'Piscina',
    'fitness_centre': 'Gimnasio',
    'golf_course': 'Campo de golf',
    'pitch': 'Campo deportivo',
    'beach_resort': 'Playa',
    'marina': 'Puerto deportivo',
    
    // Tourism
    'museum': 'Museo',
    'gallery': 'Galería de arte',
    'attraction': 'Atracción turística',
    'monument': 'Monumento',
    'memorial': 'Monumento conmemorativo',
    'artwork': 'Obra de arte',
    'zoo': 'Zoológico',
    'aquarium': 'Acuario',
    'theme_park': 'Parque temático',
    'viewpoint': 'Mirador',
    'information': 'Oficina de información turística',
    'hotel': 'Hotel',
    'hostel': 'Albergue',
    'guest_house': 'Casa de huéspedes',
    'apartment': 'Apartamento turístico',
    
    // Shops
    'supermarket': 'Supermercado',
    'convenience': 'Tienda de conveniencia',
    'bakery': 'Panadería',
    'butcher': 'Carnicería',
    'fishmonger': 'Pescadería',
    'greengrocer': 'Frutería',
    'florist': 'Floristería',
    'clothes': 'Tienda de ropa',
    'shoes': 'Zapatería',
    'jewelry': 'Joyería',
    'bookshop': 'Librería',
    'hairdresser': 'Peluquería',
    'beauty': 'Centro de belleza',
    'optician': 'Óptica',
    'electronics': 'Tienda de electrónica',
    'mobile_phone': 'Tienda de móviles',
    'computer': 'Tienda de informática',
    'bicycle': 'Tienda de bicicletas',
    'car': 'Concesionario de coches',
    'car_repair': 'Taller de coches',
    'hardware': 'Ferretería',
    'furniture': 'Mueblería',
    'gift': 'Tienda de regalos',
    'toy': 'Juguetería',
    'pet': 'Tienda de mascotas',
    
    // Building types (especialmente para lugares de culto)
    'church': 'Iglesia',
    'cathedral': 'Catedral',
    'chapel': 'Capilla',
    'mosque': 'Mezquita',
    'synagogue': 'Sinagoga',
    'temple': 'Templo',
    'shrine': 'Santuario',
    'monastery': 'Monasterio',
    'convent': 'Convento',
    'basilica': 'Basílica',
  };
  
  // Intentar obtener descripción del tipo principal
  // Si el tipo es un building específico (como "church", "cathedral"), usarlo directamente
  // Si no, usar amenity, leisure, tourism, shop
  let mainType = place.type;
  
  // Si el tipo es un building y hay amenity=place_of_worship, usar el building
  if (tags.building && tags.amenity === 'place_of_worship') {
    mainType = tags.building;
  } else if (!mainType) {
    mainType = tags.amenity || tags.leisure || tags.tourism || tags.shop || tags.building;
  }
  
  if (mainType && typeDescriptions[mainType]) {
    // Si hay información adicional en los tags, añadirla
    const details: string[] = [];
    
    if (tags.denomination) {
      const translated = translateToSpanish(tags.denomination);
      details.push(capitalizeSpanish(translated));
    }
    
    if (tags.cuisine) {
      const translated = translateToSpanish(tags.cuisine);
      // Si no hay traducción, usar el término original en minúsculas
      const cuisineTerm = translated === tags.cuisine ? tags.cuisine.toLowerCase() : translated;
      details.push(`cocina ${cuisineTerm}`);
    }
    
    if (tags.religion) {
      const translated = translateToSpanish(tags.religion);
      // Si no hay traducción, usar el término original en minúsculas
      const religionTerm = translated === tags.religion ? tags.religion.toLowerCase() : translated;
      details.push(`religión ${religionTerm}`);
    }
    
    if (tags.brand) {
      // Las marcas se mantienen como están (pueden ser nombres propios)
      details.push(tags.brand);
    }
    
    const description = typeDescriptions[mainType];
    if (details.length > 0) {
      // Capitalizar la primera letra de la descripción y los detalles
      const capitalizedDetails = details.map(d => capitalizeSpanish(d));
      return `${description} (${capitalizedDetails.join(', ')})`;
    }
    return description;
  }
  
  // Si no hay tipo específico, intentar construir descripción desde tags
  if (tags.amenity) {
    const translated = typeDescriptions[tags.amenity];
    if (translated) return translated;
    // Si no hay traducción, capitalizar el término
    return capitalizeSpanish(`Lugar: ${tags.amenity}`);
  }
  if (tags.leisure) {
    const translated = typeDescriptions[tags.leisure];
    if (translated) return translated;
    return capitalizeSpanish(`Lugar de ocio: ${tags.leisure}`);
  }
  if (tags.tourism) {
    const translated = typeDescriptions[tags.tourism];
    if (translated) return translated;
    return capitalizeSpanish(`Lugar turístico: ${tags.tourism}`);
  }
  if (tags.shop) {
    const translated = typeDescriptions[tags.shop];
    if (translated) return translated;
    return capitalizeSpanish(`Tienda: ${tags.shop}`);
  }
  
  // Fallback genérico
  return 'Lugar de interés';
}

const ResultsList: React.FC<ResultsListProps> = ({
  places,
  selectedPlace,
  onPlaceSelect,
  status,
  errorMessage,
}) => {
  if (status === 'loading') {
    return (
      <div className="results-list">
        <div className="status-message">
          <div className="loading-spinner"></div>
          <p>Buscando lugares...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="results-list">
        <div className="status-message error">
          <p>❌ Error</p>
          <p>{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (status === 'idle' || places.length === 0) {
    return (
      <div className="results-list">
        <div className="status-message">
          <p>🔍 Realiza una búsqueda para ver resultados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="results-list">
      <div className="results-header">
        <h2>Resultados ({places.length})</h2>
      </div>
      <div className="results-items">
        {places.map((place) => {
          const isSelected = selectedPlace?.osm_id === place.osm_id;
          return (
            <div
              key={`${place.osm_type}-${place.osm_id}`}
              className={`result-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onPlaceSelect(place)}
            >
              <div className="result-item-header">
                <h3>{place.name}</h3>
                {place.distance_meters && (
                  <span className="distance-badge">
                    {place.distance_meters < 1000
                      ? `${Math.round(place.distance_meters)} m`
                      : `${(place.distance_meters / 1000).toFixed(2)} km`}
                  </span>
                )}
              </div>
              <div className="result-item-type">{getPlaceDescription(place)}</div>
              {place.address && (
                <div className="result-item-address">📍 {place.address}</div>
              )}
              {place.phone && (
                <div className="result-item-phone">📞 {place.phone}</div>
              )}
              <div className="result-item-footer">
                <a
                  href={place.osm_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  Ver en OSM →
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResultsList;


