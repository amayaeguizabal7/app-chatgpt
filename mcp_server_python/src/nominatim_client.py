"""
Cliente para interactuar con Nominatim (geocodificación de OpenStreetMap).
"""
import requests
import time
from typing import Optional, Dict
import logging

logger = logging.getLogger(__name__)

NOMINATIM_API_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_TIMEOUT = 10


class NominatimClient:
    """Cliente para geocodificación usando Nominatim."""
    
    def __init__(self, api_url: str = NOMINATIM_API_URL, timeout: int = NOMINATIM_TIMEOUT):
        self.api_url = api_url
        self.timeout = timeout
        self.last_request_time = 0
        self.min_request_interval = 1.0  # Nominatim requiere 1 segundo entre requests
    
    def _wait_for_rate_limit(self):
        """Espera para respetar el rate limit de Nominatim."""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        if time_since_last < self.min_request_interval:
            time.sleep(self.min_request_interval - time_since_last)
        self.last_request_time = time.time()
    
    def geocode(self, location_text: str) -> Optional[Dict]:
        """
        Geocodifica una dirección o nombre de lugar.
        
        Args:
            location_text: Texto de la ubicación (ej: "Plaza de España, Madrid")
        
        Returns:
            Diccionario con 'lat' y 'lng', o None si no se encuentra
        """
        self._wait_for_rate_limit()
        
        try:
            params = {
                'q': location_text,
                'format': 'json',
                'limit': 1,
                'addressdetails': 1
            }
            
            headers = {
                'User-Agent': 'OSM-Finder-App/1.0'  # Nominatim requiere User-Agent
            }
            
            response = requests.get(
                self.api_url,
                params=params,
                timeout=self.timeout,
                headers=headers
            )
            response.raise_for_status()
            
            results = response.json()
            
            if not results:
                logger.warning(f"No se encontró geocodificación para: {location_text}")
                return None
            
            result = results[0]
            
            return {
                'lat': float(result['lat']),
                'lng': float(result['lon']),
                'display_name': result.get('display_name', location_text),
                'address': result.get('address', {})
            }
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Error al geocodificar: {e}")
            return None
    
    def reverse_geocode(self, lat: float, lng: float) -> Optional[str]:
        """
        Realiza geocodificación inversa (coordenadas -> dirección).
        
        Args:
            lat: Latitud
            lng: Longitud
        
        Returns:
            Dirección como string, o None si no se encuentra
        """
        self._wait_for_rate_limit()
        
        try:
            url = "https://nominatim.openstreetmap.org/reverse"
            params = {
                'lat': lat,
                'lon': lng,
                'format': 'json',
                'addressdetails': 1
            }
            
            headers = {
                'User-Agent': 'OSM-Finder-App/1.0'
            }
            
            response = requests.get(
                url,
                params=params,
                timeout=self.timeout,
                headers=headers
            )
            response.raise_for_status()
            
            result = response.json()
            
            if 'address' not in result:
                return None
            
            address = result.get('display_name', '')
            return address
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Error en reverse geocode: {e}")
            return None

