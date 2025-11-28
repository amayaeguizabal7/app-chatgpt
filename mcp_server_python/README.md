# Servidor MCP - OSM Finder

Servidor MCP (Model Context Protocol) en Python para buscar lugares usando OpenStreetMap y Overpass API.

## Instalación

```bash
# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt
```

## Ejecución Local

```bash
python main.py
```

El servidor se ejecutará y escuchará conexiones a través de stdio (entrada/salida estándar).

## Despliegue en render.com

1. Conecta tu repositorio de GitHub a render.com
2. Crea un nuevo **Web Service**
3. Configuración:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python main.py`
   - **Environment:** Python 3

**Nota:** Los servidores MCP normalmente usan stdio, pero render.com espera servicios HTTP. Puedes:
- Ejecutar el servidor localmente y conectarlo a ChatGPT
- O crear un wrapper HTTP que convierta las peticiones HTTP a stdio

## Herramientas Disponibles

### `search_places`

Busca lugares cerca de una ubicación.

**Ejemplo de uso:**
```json
{
  "query": "cafeterías",
  "location_text": "Plaza de España, Madrid",
  "radius_meters": 1000
}
```

### `reverse_geocode`

Convierte coordenadas en dirección.

**Ejemplo de uso:**
```json
{
  "lat": 40.4168,
  "lng": -3.7038
}
```

## Estructura

- `src/mcp_server.py`: Servidor MCP principal
- `src/overpass_client.py`: Cliente para Overpass API
- `src/nominatim_client.py`: Cliente para geocodificación
- `main.py`: Punto de entrada

