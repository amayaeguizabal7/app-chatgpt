#!/usr/bin/env python3
"""
Servidor FastAPI + MCP para MySherlock 🔎
Sirve el widget HTML y maneja las herramientas MCP para búsqueda de lugares.
"""
import os
import sys
import json
import logging
from pathlib import Path
from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Agregar el directorio mcp_server_python al path para que los imports funcionen
mcp_server_dir = os.path.dirname(os.path.abspath(__file__))
if mcp_server_dir not in sys.path:
    sys.path.insert(0, mcp_server_dir)

# Importar los módulos
from src.overpass_client import OverpassClient
from src.nominatim_client import NominatimClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inicializar clientes
overpass_client = OverpassClient()
nominatim_client = NominatimClient()

# Crear aplicación FastAPI
app = FastAPI(title="MySherlock 🔎 - MCP Server")

# CORS middleware para permitir requests desde ChatGPT
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas para el directorio de trabajo
# Si estamos en mcp_server_python/, subir un nivel; si no, estamos en la raíz
if Path(__file__).parent.name == 'mcp_server_python':
    BASE_DIR = Path(__file__).parent.parent
else:
    BASE_DIR = Path(__file__).parent
WIDGET_DIR = BASE_DIR / "app-ui" / "dist"
WIDGET_HTML = WIDGET_DIR / "index.html"


def load_widget_html(search_results: Dict[str, Any] = None) -> str:
    """Carga el HTML del widget compilado e inyecta los datos si se proporcionan."""
    try:
        if WIDGET_HTML.exists():
            with open(WIDGET_HTML, "r", encoding="utf-8") as f:
                html = f.read()
            
            # Obtener la URL base del servidor (para producción)
            import os
            server_url = os.getenv("RENDER_EXTERNAL_URL", "https://mysherlock-mcp.onrender.com")
            
            # Reemplazar rutas absolutas por rutas relativas o con URL base
            # Para que funcionen cuando se inyecta como recurso
            html = html.replace('href="/assets/', f'href="{server_url}/assets/')
            html = html.replace('src="/assets/', f'src="{server_url}/assets/')
            html = html.replace('href="/vite.svg', f'href="{server_url}/vite.svg')
            
            # Si hay datos de búsqueda, inyectarlos en el HTML para que el widget los pueda usar
            if search_results:
                import json
                data_script = f"""
<script>
  // Inyectar datos de búsqueda en el widget
  window.__MYSHERLOCK_SEARCH_RESULTS__ = {json.dumps(search_results, ensure_ascii=False)};
  
  // Configurar toolOutput para el SDK de OpenAI Apps
  if (typeof window !== 'undefined') {{
    window.openai = window.openai || {{}};
    window.openai.toolOutput = window.openai.toolOutput || {{}};
    window.openai.toolOutput.searchResults = {json.dumps(search_results, ensure_ascii=False)};
  }}
</script>
"""
                # Insertar el script antes del cierre de </head> o al inicio de <body>
                if '</head>' in html:
                    html = html.replace('</head>', data_script + '</head>')
                elif '<body>' in html:
                    html = html.replace('<body>', '<body>' + data_script)
                else:
                    # Si no hay head ni body, añadir al inicio
                    html = data_script + html
            
            return html
        else:
            logger.warning(f"Widget HTML no encontrado en {WIDGET_HTML}")
            return "<html><body><h1>Widget no encontrado. Ejecuta 'npm run build' en app-ui</h1></body></html>"
    except Exception as e:
        logger.error(f"Error cargando widget HTML: {e}")
        return f"<html><body><h1>Error cargando widget: {e}</h1></body></html>"


@app.get("/")
async def root():
    """Endpoint raíz - redirige al widget."""
    return {"message": "MySherlock 🔎 MCP Server", "status": "running"}

@app.get("/health")
async def health_check():
    """Health check endpoint para Render.com"""
    return {"status": "healthy", "service": "MySherlock 🔎"}


@app.get("/widget", response_class=HTMLResponse)
async def get_widget():
    """Sirve el widget HTML."""
    html = load_widget_html()
    return HTMLResponse(content=html)


@app.post("/mcp")
async def mcp_endpoint(request: Dict[str, Any]):
    """
    Endpoint MCP que maneja las herramientas y devuelve el widget.
    Compatible con el protocolo MCP (JSON-RPC 2.0).
    """
    try:
        method = request.get("method")
        params = request.get("params", {})
        
        # Método initialize - requerido por el protocolo MCP
        if method == "initialize":
            return {
                "jsonrpc": "2.0",
                "id": request.get("id"),
                "result": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "tools": {}
                    },
                    "serverInfo": {
                        "name": "mysherlock-mcp",
                        "version": "1.0.0"
                    }
                }
            }
        
        # Método initialized - notificación después de initialize
        if method == "initialized":
            # Es una notificación, no requiere respuesta
            return {
                "jsonrpc": "2.0",
                "id": request.get("id") if request.get("id") is not None else None,
                "result": {}
            }
        
        if method == "tools/list":
            # Listar herramientas disponibles
            return {
                "jsonrpc": "2.0",
                "id": request.get("id"),
                "result": {
                    "tools": [
                        {
                            "name": "search_places",
                            "description": (
                                "Busca lugares (cafeterías, parques, bibliotecas, etc.) cerca de una ubicación "
                                "usando OpenStreetMap y Overpass API. "
                                "Puedes proporcionar coordenadas (lat/lng) o un texto de ubicación (location_text). "
                                "Si solo proporcionas location_text, se geocodificará automáticamente."
                            ),
                            "inputSchema": {
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
                        },
                        {
                            "name": "reverse_geocode",
                            "description": (
                                "Convierte coordenadas (latitud, longitud) en una dirección legible "
                                "usando geocodificación inversa de OpenStreetMap."
                            ),
                            "inputSchema": {
                                "type": "object",
                                "properties": {
                                    "lat": {"type": "number", "description": "Latitud"},
                                    "lng": {"type": "number", "description": "Longitud"}
                                },
                                "required": ["lat", "lng"]
                            }
                        }
                    ]
                }
            }
        
        elif method == "tools/call":
            # Ejecutar herramienta
            tool_name = params.get("name")
            arguments = params.get("arguments", {})
            
            if tool_name == "search_places":
                result = await handle_search_places(arguments)
            elif tool_name == "reverse_geocode":
                result = await handle_reverse_geocode(arguments)
            else:
                raise ValueError(f"Herramienta desconocida: {tool_name}")
            
            return {
                "jsonrpc": "2.0",
                "id": request.get("id"),
                "result": result
            }
        
        else:
            raise ValueError(f"Método desconocido: {method}")
    
    except Exception as e:
        logger.error(f"Error en MCP endpoint: {e}", exc_info=True)
        return {
            "jsonrpc": "2.0",
            "id": request.get("id"),
            "error": {
                "code": -32603,
                "message": f"Error interno: {str(e)}"
            }
        }


async def handle_search_places(arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Maneja la búsqueda de lugares y devuelve el widget con los resultados."""
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
        
        # Preparar datos para el widget
        search_results = {
            "places": places,
            "count": len(places),
            "query": query,
            "radius_meters": radius_meters,
            "center": {
                "lat": lat or (places[0]["lat"] if places else None),
                "lng": lng or (places[0]["lng"] if places else None)
            } if places else None
        }
        
        # Cargar widget HTML con los datos inyectados
        widget_html = load_widget_html(search_results)
        
        # Crear resumen de texto
        if not places:
            summary = (
                f"No se encontraron lugares de tipo '{query}' "
                f"en un radio de {radius_meters}m. "
                "Intenta ampliar el radio o cambiar el tipo de lugar."
            )
        else:
            summary_lines = [f"Encontrados {len(places)} lugares de tipo '{query}':\n"]
            for i, place in enumerate(places[:10], 1):
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
        
        # Devolver widget como recurso con datos
        return {
            "content": [
                {
                    "type": "text",
                    "text": summary
                },
                {
                    "type": "resource",
                    "resource": {
                        "uri": "ui://widget/mysherlock.html",
                        "mimeType": "text/html+skybridge",
                        "text": widget_html
                    }
                }
            ],
            "structuredContent": {
                "searchResults": search_results,
                "_meta": {
                    "openai/outputTemplate": {
                        "type": "resource",
                        "resource": "ui://widget/mysherlock.html"
                    }
                }
            }
        }
    
    except Exception as e:
        logger.error(f"Error en search_places: {e}", exc_info=True)
        return {
            "content": [
                {
                    "type": "text",
                    "text": f"Error al buscar lugares: {str(e)}"
                }
            ]
        }


async def handle_reverse_geocode(arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Maneja la geocodificación inversa."""
    lat = arguments.get("lat")
    lng = arguments.get("lng")
    
    if lat is None or lng is None:
        return {
            "content": [
                {
                    "type": "text",
                    "text": "Error: Se requieren lat y lng"
                }
            ]
        }
    
    logger.info(f"Reverse geocoding: lat={lat}, lng={lng}")
    
    try:
        address = nominatim_client.reverse_geocode(lat, lng)
        
        if not address:
            return {
                "content": [
                    {
                        "type": "text",
                        "text": f"No se pudo obtener la dirección para las coordenadas ({lat}, {lng})"
                    }
                ]
            }
        
        return {
            "content": [
                {
                    "type": "text",
                    "text": address
                }
            ]
        }
    
    except Exception as e:
        logger.error(f"Error en reverse_geocode: {e}", exc_info=True)
        return {
            "content": [
                {
                    "type": "text",
                    "text": f"Error en geocodificación inversa: {str(e)}"
                }
            ]
        }


# Servir archivos estáticos del widget
if WIDGET_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(WIDGET_DIR / "assets")), name="assets")

@app.get("/assets/{file_path:path}")
async def serve_assets(file_path: str):
    """Sirve los archivos estáticos del widget (JS, CSS, etc.)."""
    asset_file = WIDGET_DIR / "assets" / file_path
    if asset_file.exists() and asset_file.is_file():
        return FileResponse(asset_file)
    raise HTTPException(status_code=404, detail="Asset not found")

@app.get("/vite.svg")
async def serve_vite_svg():
    """Sirve el favicon vite.svg si existe."""
    vite_svg = WIDGET_DIR / "vite.svg"
    if vite_svg.exists():
        return FileResponse(vite_svg)
    raise HTTPException(status_code=404)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
