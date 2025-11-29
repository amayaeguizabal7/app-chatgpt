"""
Cliente para interactuar con la API de Overpass de OpenStreetMap.
"""
import requests
import time
from typing import List, Dict, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

# URL del servidor Overpass público (puedes cambiarlo si prefieres otro)
OVERPASS_API_URL = "https://overpass-api.de/api/interpreter"
OVERPASS_TIMEOUT = 30  # segundos


class OverpassClient:
    """Cliente para realizar consultas a la API de Overpass."""
    
    def __init__(self, api_url: str = OVERPASS_API_URL, timeout: int = OVERPASS_TIMEOUT):
        self.api_url = api_url
        self.timeout = timeout
    
    def build_query(
        self,
        place_types: List[str],
        lat: float,
        lng: float,
        radius_meters: int = 1000,
        limit: int = 50
    ) -> str:
        """
        Construye una consulta Overpass QL para buscar lugares.
        
        Args:
            place_types: Lista de tipos de lugares (ej: ['cafe', 'restaurant'])
            lat: Latitud del centro de búsqueda
            lng: Longitud del centro de búsqueda
            radius_meters: Radio de búsqueda en metros
            limit: Límite de resultados
        
        Returns:
            Consulta Overpass QL como string
        """
        # Construir filtros para diferentes tipos de lugares
        filters = []
        
        # Mapeo de tipos comunes a tags OSM
        type_mapping = {
            'cafe': 'amenity=cafe',
            'cafeteria': 'amenity=cafe',
            'restaurant': 'amenity=restaurant',
            'bar': 'amenity=bar',
            'pub': 'amenity=pub',
            'library': 'amenity=library',
            'biblioteca': 'amenity=library',
            'park': 'leisure=park',
            'parque': 'leisure=park',
            'museum': 'tourism=museum',
            'museo': 'tourism=museum',
            'pharmacy': 'amenity=pharmacy',
            'farmacia': 'amenity=pharmacy',
            'hospital': 'amenity=hospital',
            'hospital': 'amenity=hospital',
            'school': 'amenity=school',
            'colegio': 'amenity=school',
            'university': 'amenity=university',
            'universidad': 'amenity=university',
            'cinema': 'amenity=cinema',
            'cine': 'amenity=cinema',
            'theatre': 'amenity=theatre',
            'teatro': 'amenity=theatre',
            'gym': 'leisure=fitness_centre',
            'gimnasio': 'leisure=fitness_centre',
            'supermarket': 'shop=supermarket',
            'supermercado': 'shop=supermarket',
        }
        
        # Construir filtros basados en los tipos solicitados
        for place_type in place_types:
            place_type_lower = place_type.lower()
            if place_type_lower in type_mapping:
                filters.append(f'({type_mapping[place_type_lower]})')
            else:
                # Si no está en el mapeo, intentar buscar por nombre o tag genérico
                filters.append(f'(name~"{place_type}",i)')
        
        # Si no hay filtros específicos, buscar cualquier amenity o leisure
        if not filters:
            filters = ['(amenity~".*")', '(leisure~".*")', '(tourism~".*")']
        
        filter_str = '|'.join(filters)
        
        # Consulta Overpass QL
        query = f"""
        [out:json][timeout:{self.timeout}];
        (
          node[{filter_str}](around:{radius_meters},{lat},{lng});
          way[{filter_str}](around:{radius_meters},{lat},{lng});
          relation[{filter_str}](around:{radius_meters},{lat},{lng});
        );
        out center meta;
        """
        
        return query
    
    def execute_query(self, query: str) -> Dict:
        """
        Ejecuta una consulta Overpass y devuelve los resultados.
        
        Args:
            query: Consulta Overpass QL
        
        Returns:
            Diccionario con los resultados de Overpass
        """
        try:
            logger.info(f"Ejecutando consulta Overpass...")
            response = requests.post(
                self.api_url,
                data={'data': query},
                timeout=self.timeout,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            response.raise_for_status()
            
            data = response.json()
            
            if 'elements' not in data:
                logger.warning("Respuesta de Overpass sin elementos")
                return {'elements': []}
            
            return data
        
        except requests.exceptions.Timeout:
            logger.error("Timeout al consultar Overpass")
            raise Exception("La consulta a Overpass ha excedido el tiempo límite")
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Error al consultar Overpass: {e}")
            raise Exception(f"Error al consultar Overpass: {str(e)}")
    
    def parse_results(self, overpass_data: Dict) -> List[Dict]:
        """
        Parsea los resultados de Overpass a un formato más limpio.
        
        Args:
            overpass_data: Datos crudos de Overpass
        
        Returns:
            Lista de lugares parseados
        """
        places = []
        
        for element in overpass_data.get('elements', []):
            if element.get('type') not in ['node', 'way', 'relation']:
                continue
            
            tags = element.get('tags', {})
            
            # Obtener coordenadas
            if element.get('type') == 'node':
                lat = element.get('lat')
                lng = element.get('lon')
            elif 'center' in element:
                lat = element['center'].get('lat')
                lng = element['center'].get('lon')
            else:
                continue
            
            if not lat or not lng:
                continue
            
            # Obtener nombre
            name = (
                tags.get('name') or
                tags.get('name:es') or
                tags.get('name:en') or
                tags.get('ref') or
                'Sin nombre'
            )
            
            # Determinar tipo de lugar
            place_type = self._determine_place_type(tags)
            
            # Construir dirección aproximada
            address_parts = []
            if tags.get('addr:street'):
                address_parts.append(tags.get('addr:street'))
            if tags.get('addr:housenumber'):
                address_parts.append(tags.get('addr:housenumber'))
            if tags.get('addr:city'):
                address_parts.append(tags.get('addr:city'))
            
            address = ', '.join(address_parts) if address_parts else None
            
            # URL de OpenStreetMap
            osm_id = element.get('id')
            osm_type = element.get('type')
            osm_url = f"https://www.openstreetmap.org/{osm_type}/{osm_id}"
            
            place = {
                'name': name,
                'lat': lat,
                'lng': lng,
                'type': place_type,
                'tags': tags,
                'address': address,
                'osm_id': osm_id,
                'osm_type': osm_type,
                'osm_url': osm_url,
                'display_name': self._build_display_name(name, place_type, address)
            }
            
            places.append(place)
        
        return places
    
    def _determine_place_type(self, tags: Dict) -> str:
        """Determina el tipo de lugar basándose en los tags OSM."""
        if tags.get('amenity'):
            return tags.get('amenity')
        elif tags.get('leisure'):
            return tags.get('leisure')
        elif tags.get('tourism'):
            return tags.get('tourism')
        elif tags.get('shop'):
            return tags.get('shop')
        else:
            return 'place'
    
    def _build_display_name(self, name: str, place_type: str, address: Optional[str]) -> str:
        """Construye un nombre para mostrar."""
        parts = [name]
        if place_type:
            parts.append(f"({place_type})")
        if address:
            parts.append(f"- {address}")
        return ' '.join(parts)
    
    def calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """
        Calcula la distancia en metros entre dos puntos usando la fórmula de Haversine.
        
        Args:
            lat1, lng1: Coordenadas del primer punto
            lat2, lng2: Coordenadas del segundo punto
        
        Returns:
            Distancia en metros
        """
        import math
        
        R = 6371000  # Radio de la Tierra en metros
        
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lng2 - lng1)
        
        a = (
            math.sin(delta_phi / 2) ** 2 +
            math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c
    
    def search_places(
        self,
        query: str,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        location_text: Optional[str] = None,
        radius_meters: int = 1000
    ) -> List[Dict]:
        """
        Busca lugares usando Overpass.
        
        Args:
            query: Descripción del tipo de lugar (ej: "cafeterías", "parques")
            lat: Latitud del centro de búsqueda
            lng: Longitud del centro de búsqueda
            location_text: Texto de ubicación (si no hay lat/lng)
            radius_meters: Radio de búsqueda en metros
        
        Returns:
            Lista de lugares encontrados
        """
        # Si no hay coordenadas, intentar geocodificar
        if (lat is None or lng is None) and location_text:
            from .nominatim_client import NominatimClient
            nominatim = NominatimClient()
            geocode_result = nominatim.geocode(location_text)
            if geocode_result:
                lat = geocode_result['lat']
                lng = geocode_result['lng']
            else:
                raise Exception(f"No se pudo geocodificar la ubicación: {location_text}")
        
        if lat is None or lng is None:
            raise Exception("Se requiere lat/lng o location_text para buscar lugares")
        
        # Extraer tipos de lugares de la query
        place_types = self._extract_place_types(query)
        
        # Construir y ejecutar consulta
        overpass_query = self.build_query(place_types, lat, lng, radius_meters)
        overpass_data = self.execute_query(overpass_query)
        
        # Parsear resultados
        places = self.parse_results(overpass_data)
        
        # Calcular distancias y ordenar
        for place in places:
            place['distance_meters'] = self.calculate_distance(
                lat, lng, place['lat'], place['lng']
            )
        
        # Ordenar por distancia
        places.sort(key=lambda x: x['distance_meters'])
        
        return places
    
    def _extract_place_types(self, query: str) -> List[str]:
        """Extrae tipos de lugares de una query de texto."""
        query_lower = query.lower()
        
        # Palabras clave comunes
        keywords = {
            'cafe': ['café', 'cafe', 'cafetería', 'cafeteria', 'coffee'],
            'restaurant': ['restaurante', 'restaurant', 'comida'],
            'library': ['biblioteca', 'library', 'libro'],
            'park': ['parque', 'park', 'verde', 'zona verde'],
            'museum': ['museo', 'museum'],
            'pharmacy': ['farmacia', 'pharmacy'],
            'hospital': ['hospital'],
            'school': ['colegio', 'school', 'escuela'],
            'cinema': ['cine', 'cinema', 'película'],
            'theatre': ['teatro', 'theatre'],
            'gym': ['gimnasio', 'gym', 'fitness'],
            'supermarket': ['supermercado', 'supermarket', 'tienda']
        }
        
        found_types = []
        for place_type, keywords_list in keywords.items():
            if any(keyword in query_lower for keyword in keywords_list):
                found_types.append(place_type)
        
        # Si no se encontró nada específico, devolver la query como está
        if not found_types:
            found_types = [query]
        
        return found_types


