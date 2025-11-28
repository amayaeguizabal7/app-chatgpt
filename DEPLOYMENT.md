# Guía de Despliegue - OSM Finder

Esta guía detalla cómo desplegar la aplicación OSM Finder completa.

## Opciones de Despliegue

### Opción 1: Desarrollo Local (Recomendado para empezar)

#### Backend MCP (Local)

1. **Instalar dependencias:**
   ```bash
   cd mcp_server_python
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Ejecutar el servidor:**
   ```bash
   python main.py
   ```

El servidor MCP se ejecutará y estará listo para recibir conexiones a través de stdio.

#### Frontend (Local)

1. **Instalar dependencias:**
   ```bash
   cd app-ui
   npm install
   ```

2. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```

3. **Acceder a:** `http://localhost:3000`

### Opción 2: Despliegue en render.com (Backend)

#### Configuración del Servidor MCP en render.com

**Nota importante:** Los servidores MCP normalmente usan stdio (entrada/salida estándar), pero render.com espera servicios HTTP. Tienes dos opciones:

##### Opción A: Wrapper HTTP (Recomendado)

Crea un wrapper que convierta peticiones HTTP a stdio. Puedes usar FastAPI:

```python
# mcp_server_python/http_wrapper.py
from fastapi import FastAPI, HTTPException
from src.mcp_server import app as mcp_app
import asyncio
import json

http_app = FastAPI()

@http_app.post("/mcp/call")
async def call_mcp_tool(tool_name: str, arguments: dict):
    # Convertir petición HTTP a llamada MCP
    # Esto requiere adaptar el código MCP para aceptar HTTP
    pass
```

##### Opción B: Ejecutar Localmente

Ejecuta el servidor MCP localmente y conéctalo a ChatGPT usando el modo desarrollador.

#### Pasos en render.com:

1. **Crear nuevo servicio:**
   - Tipo: Web Service
   - Nombre: `osm-finder-mcp`
   - Repositorio: Tu repositorio de GitHub

2. **Configuración:**
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python main.py` (o `uvicorn http_wrapper:http_app` si usas wrapper)
   - **Environment:** Python 3

3. **Variables de entorno (opcionales):**
   - `OVERPASS_API_URL`: URL del servidor Overpass
   - `OVERPASS_TIMEOUT`: Timeout en segundos

### Opción 3: Frontend en Vercel/Netlify

#### Despliegue del Frontend

1. **Build del proyecto:**
   ```bash
   cd app-ui
   npm run build
   ```

2. **Desplegar en Vercel:**
   - Conecta tu repositorio
   - Directorio raíz: `app-ui`
   - Build command: `npm run build`
   - Output directory: `dist`

3. **Desplegar en Netlify:**
   - Similar a Vercel
   - Build command: `npm run build`
   - Publish directory: `dist`

## Configuración de ChatGPT Apps SDK

### 1. Instalar OpenAI CLI

```bash
npm install -g @openai/apps-sdk
```

### 2. Configurar la App

Edita `app.json`:

```json
{
  "name": "OSM Finder",
  "mcp_servers": {
    "osm-finder": {
      "command": "python",
      "args": ["mcp_server_python/main.py"],
      "env": {}
    }
  },
  "ui": {
    "type": "iframe",
    "url": "http://localhost:3000"  // O la URL de tu frontend desplegado
  }
}
```

### 3. Conectar en Modo Desarrollador

```bash
# En la raíz del proyecto
openai apps dev
```

Esto iniciará el modo desarrollador y conectará tu app a ChatGPT.

## Variables de Entorno

### Backend (MCP Server)

- `OVERPASS_API_URL`: URL del servidor Overpass (default: `https://overpass-api.de/api/interpreter`)
- `OVERPASS_TIMEOUT`: Timeout en segundos (default: 30)

### Frontend

No requiere variables de entorno por defecto.

## Troubleshooting

### El servidor MCP no se conecta

- Verifica que Python esté instalado
- Asegúrate de que todas las dependencias estén instaladas
- Revisa los logs del servidor

### El frontend no se conecta al MCP

- Verifica que el servidor MCP esté ejecutándose
- Asegúrate de que la configuración en `app.json` sea correcta
- Revisa la consola del navegador para errores

### No se encuentran lugares

- Verifica que la ubicación sea correcta
- Intenta ampliar el radio de búsqueda
- Algunos tipos de lugares pueden no estar en OpenStreetMap

## Próximos Pasos

1. **Mejorar el manejo de errores** en el frontend
2. **Agregar más tipos de lugares** al mapeo
3. **Implementar caché** para consultas frecuentes
4. **Agregar autocompletado** en el campo de búsqueda
5. **Mejorar la UI** con más detalles de cada lugar

