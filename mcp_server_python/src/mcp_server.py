"""
Servidor MCP para OSM Finder.
Expone herramientas para buscar lugares usando OpenStreetMap y Overpass.
"""
import asyncio
import logging
from typing import Any, Sequence
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent, ImageContent, EmbeddedResource

from .overpass_client import OverpassClient
from .nominatim_client import NominatimClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inicializar clientes
overpass_client = OverpassClient()
nominatim_client = NominatimClient()

# Crear servidor MCP
app = Server("osm-finder-mcp")


@app.list_tools()
async def list_tools() -> list[Tool]:
    """
    Lista las herramientas disponibles en el servidor MCP.
    """
    return [
        Tool(
            name="search_places",
            description=(
                "Busca lugares (cafeterías, parques, bibliotecas, etc.) cerca de una ubicación "
                "usando OpenStreetMap y Overpass API. "
                "Puedes proporcionar coordenadas (lat/lng) o un texto de ubicación (location_text). "
                "Si solo proporcionas location_text, se geocodificará automáticamente."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": (
                            "Descripción del tipo de lugar a buscar. "
                            "Ejemplos: 'cafeterías', 'parques', 'bibliotecas', 'museos', 'restaurantes'. "
                            "Puedes usar términos en español o inglés."
                        )
                    },
                    "lat": {
                        "type": "number",
                        "description": "Latitud del centro de búsqueda (opcional si se proporciona location_text)"
                    },
                    "lng": {
                        "type": "number",
                        "description": "Longitud del centro de búsqueda (opcional si se proporciona location_text)"
                    },
                    "location_text": {
                        "type": "string",
                        "description": (
                            "Texto de la ubicación (dirección, nombre de lugar, ciudad). "
                            "Ejemplos: 'Plaza de España, Madrid', 'Sagrada Familia, Barcelona'. "
                            "Se usará para geocodificar si no se proporcionan lat/lng."
                        )
                    },
                    "radius_meters": {
                        "type": "integer",
                        "description": "Radio de búsqueda en metros. Por defecto: 1000 (1 km)",
                        "default": 1000
                    }
                },
                "required": ["query"],
                "anyOf": [
                    {"required": ["lat", "lng"]},
                    {"required": ["location_text"]}
                ]
            }
        ),
        Tool(
            name="reverse_geocode",
            description=(
                "Convierte coordenadas (latitud, longitud) en una dirección legible "
                "usando geocodificación inversa de OpenStreetMap."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "lat": {
                        "type": "number",
                        "description": "Latitud"
                    },
                    "lng": {
                        "type": "number",
                        "description": "Longitud"
                    }
                },
                "required": ["lat", "lng"]
            }
        )
    ]


@app.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> Sequence[TextContent | ImageContent | EmbeddedResource]:
    """
    Ejecuta una herramienta MCP.
    """
    try:
        if name == "search_places":
            return await handle_search_places(arguments)
        elif name == "reverse_geocode":
            return await handle_reverse_geocode(arguments)
        else:
            raise ValueError(f"Herramienta desconocida: {name}")
    
    except Exception as e:
        logger.error(f"Error al ejecutar herramienta {name}: {e}", exc_info=True)
        return [
            TextContent(
                type="text",
                text=f"Error: {str(e)}"
            )
        ]


async def handle_search_places(arguments: dict[str, Any]) -> Sequence[TextContent]:
    """
    Maneja la búsqueda de lugares.
    """
    query = arguments.get("query", "")
    lat = arguments.get("lat")
    lng = arguments.get("lng")
    location_text = arguments.get("location_text")
    radius_meters = arguments.get("radius_meters", 1000)
    
    logger.info(f"Buscando lugares: query={query}, lat={lat}, lng={lng}, location_text={location_text}, radius={radius_meters}m")
    
    try:
        # Buscar lugares
        places = overpass_client.search_places(
            query=query,
            lat=lat,
            lng=lng,
            location_text=location_text,
            radius_meters=radius_meters
        )
        
        if not places:
            return [
                TextContent(
                    type="text",
                    text=(
                        f"No se encontraron lugares de tipo '{query}' "
                        f"en un radio de {radius_meters}m. "
                        "Intenta ampliar el radio o cambiar el tipo de lugar."
                    )
                )
            ]
        
        # Formatear resultados como JSON para que el frontend los pueda parsear
        import json
        results_json = json.dumps({
            "places": places,
            "count": len(places),
            "query": query,
            "radius_meters": radius_meters,
            "center": {
                "lat": lat or places[0]["lat"],
                "lng": lng or places[0]["lng"]
            } if places else None
        }, indent=2, ensure_ascii=False)
        
        # También crear un resumen legible
        summary_lines = [
            f"Encontrados {len(places)} lugares de tipo '{query}':\n"
        ]
        
        for i, place in enumerate(places[:10], 1):  # Mostrar solo los primeros 10
            distance_km = place["distance_meters"] / 1000
            summary_lines.append(
                f"{i}. {place['name']} ({place.get('type', 'lugar')}) - "
                f"{distance_km:.2f} km"
            )
            if place.get("address"):
                summary_lines.append(f"   Dirección: {place['address']}")
        
        if len(places) > 10:
            summary_lines.append(f"\n... y {len(places) - 10} lugares más")
        
        summary = "\n".join(summary_lines)
        
        return [
            TextContent(
                type="text",
                text=f"{summary}\n\n--- DATOS JSON PARA EL WIDGET ---\n{results_json}"
            )
        ]
    
    except Exception as e:
        logger.error(f"Error en search_places: {e}", exc_info=True)
        return [
            TextContent(
                type="text",
                text=f"Error al buscar lugares: {str(e)}"
            )
        ]


async def handle_reverse_geocode(arguments: dict[str, Any]) -> Sequence[TextContent]:
    """
    Maneja la geocodificación inversa.
    """
    lat = arguments.get("lat")
    lng = arguments.get("lng")
    
    if lat is None or lng is None:
        return [
            TextContent(
                type="text",
                text="Error: Se requieren lat y lng"
            )
        ]
    
    logger.info(f"Reverse geocoding: lat={lat}, lng={lng}")
    
    try:
        address = nominatim_client.reverse_geocode(lat, lng)
        
        if not address:
            return [
                TextContent(
                    type="text",
                    text=f"No se pudo obtener la dirección para las coordenadas ({lat}, {lng})"
                )
            ]
        
        return [
            TextContent(
                type="text",
                text=address
            )
        ]
    
    except Exception as e:
        logger.error(f"Error en reverse_geocode: {e}", exc_info=True)
        return [
            TextContent(
                type="text",
                text=f"Error en geocodificación inversa: {str(e)}"
            )
        ]


async def main():
    """
    Punto de entrada principal del servidor MCP.
    """
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())

