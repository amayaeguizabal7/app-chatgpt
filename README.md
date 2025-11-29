# MySherlock 🔎 - ChatGPT App

**Voy a tener suerte** - Aplicación completa de ChatGPT para buscar lugares usando **OpenStreetMap** y **Overpass API**. Permite buscar cafeterías, parques, bibliotecas, museos y otros lugares cerca de cualquier ubicación, mostrándolos en un mapa interactivo.

## 🎯 Características

- 🔍 **Búsqueda de lugares** usando Overpass API de OpenStreetMap
- 🗺️ **Mapa interactivo** con marcadores de lugares encontrados
- 📍 **Geocodificación** automática de direcciones
- 📏 **Búsqueda por radio** configurable (500m, 1km, 2km, 5km)
- 🎨 **Interfaz moderna** con React y TypeScript
- 🔄 **Integración completa** con ChatGPT Apps SDK

## 📁 Estructura del Proyecto

```
app-chatgpt/
├── mcp_server_python/          # Servidor MCP en Python
│   ├── src/
│   │   ├── mcp_server.py      # Servidor MCP principal
│   │   ├── overpass_client.py # Cliente para Overpass API
│   │   └── nominatim_client.py # Cliente para geocodificación
│   ├── main.py                 # Punto de entrada
│   ├── requirements.txt        # Dependencias Python
│   └── Procfile               # Configuración para render.com
│
├── app-ui/                     # Frontend React/TypeScript
│   ├── src/
│   │   ├── components/        # Componentes React
│   │   │   ├── MapView.tsx    # Componente del mapa
│   │   │   ├── SearchPanel.tsx # Panel de búsqueda
│   │   │   └── ResultsList.tsx # Lista de resultados
│   │   ├── App.tsx            # Componente principal
│   │   └── types.ts           # Tipos TypeScript
│   ├── package.json           # Dependencias Node.js
│   └── vite.config.ts         # Configuración Vite
│
└── README.md                   # Este archivo
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- **Python 3.9+**
- **Node.js 18+** y npm
- **Cuenta en render.com** (para despliegue del backend)
- **ChatGPT con acceso a Apps SDK** (Developer Mode)

### 1. Configurar el Servidor MCP (Backend)

#### Instalación Local

```bash
cd mcp_server_python

# Crear entorno virtual (recomendado)
python3 -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar el servidor MCP
python main.py
```

El servidor MCP se ejecutará y estará listo para recibir conexiones a través de stdio.

#### Despliegue en render.com

1. **Crear un nuevo servicio en render.com:**
   - Tipo: **Web Service**
   - Nombre: `osm-finder-mcp`
   - Repositorio: Conecta tu repositorio de GitHub

2. **Configuración del servicio:**
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python main.py`
   - **Environment:** Python 3

3. **Variables de entorno (opcionales):**
   - No se requieren variables de entorno por defecto
   - Si quieres usar un servidor Overpass diferente, puedes agregar:
     - `OVERPASS_API_URL`: URL del servidor Overpass
     - `OVERPASS_TIMEOUT`: Timeout en segundos (default: 30)

4. **Nota importante:**
   - El servidor MCP usa stdio para comunicarse, por lo que en render.com necesitarás configurarlo como un servicio que acepte conexiones HTTP o usar un wrapper.
   - Alternativamente, puedes ejecutar el servidor MCP localmente y conectarlo a ChatGPT usando el modo desarrollador.

### 2. Configurar el Frontend (UI)

```bash
cd app-ui

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:3000`.

### 3. Configurar ChatGPT Apps SDK

1. **Instalar OpenAI CLI:**
   ```bash
   npm install -g @openai/apps-sdk
   ```

2. **Configurar la app:**
   - Edita `app.json` en la raíz del proyecto
   - Ajusta la URL del UI si es necesario
   - Ajusta el comando del servidor MCP si lo ejecutas de forma diferente

3. **Conectar en modo desarrollador:**
   - Abre ChatGPT en modo desarrollador
   - Conecta la app usando el SDK:
     ```bash
     openai apps dev
     ```

## 🛠️ Uso

### Desde ChatGPT

Una vez configurado, puedes usar la app directamente en ChatGPT:

```
Busca cafeterías tranquilas cerca de Plaza de España, Madrid, radio 1 km
```

```
Enséñame bibliotecas en un radio de 2 km desde la Sagrada Familia, Barcelona
```

```
Busca parques y zonas verdes cerca de esta dirección: Calle Gran Vía, Madrid
```

### Flujo de Funcionamiento

1. **Usuario escribe en ChatGPT** una búsqueda de lugares
2. **ChatGPT extrae** los parámetros (tipo de lugar, ubicación, radio)
3. **Se llama a la herramienta MCP** `search_places` con los parámetros
4. **El servidor MCP:**
   - Geocodifica la ubicación (si es necesario)
   - Construye una consulta Overpass
   - Obtiene resultados de OpenStreetMap
   - Devuelve lugares con coordenadas y detalles
5. **El widget muestra:**
   - Mapa centrado en la ubicación
   - Marcadores para cada lugar encontrado
   - Lista de resultados con detalles
6. **El usuario puede:**
   - Hacer clic en un resultado para centrar el mapa
   - Ajustar el radio de búsqueda
   - Cambiar el tipo de lugar

## 🔧 Herramientas MCP Disponibles

### `search_places`

Busca lugares cerca de una ubicación.

**Parámetros:**
- `query` (string, requerido): Tipo de lugar (ej: "cafeterías", "parques")
- `lat` (number, opcional): Latitud del centro
- `lng` (number, opcional): Longitud del centro
- `location_text` (string, opcional): Dirección en texto
- `radius_meters` (integer, opcional): Radio en metros (default: 1000)

**Retorna:**
- Lista de lugares con nombre, coordenadas, tipo, distancia, etc.

### `reverse_geocode`

Convierte coordenadas en una dirección.

**Parámetros:**
- `lat` (number, requerido): Latitud
- `lng` (number, requerido): Longitud

**Retorna:**
- Dirección como string

## 📝 Notas Técnicas

### Overpass API

- Usa el servidor público de Overpass: `https://overpass-api.de/api/interpreter`
- Respeta los límites de uso (no hacer demasiadas consultas seguidas)
- Timeout configurado a 30 segundos por defecto

### Nominatim (Geocodificación)

- Usa el servicio público de Nominatim
- Respeta el rate limit (1 segundo entre requests)
- Incluye User-Agent requerido

### Mapa

- Usa **Leaflet** con tiles de OpenStreetMap
- No requiere API keys
- Completamente open source

## 🐛 Solución de Problemas

### El servidor MCP no se conecta

- Verifica que Python esté instalado y en el PATH
- Asegúrate de que todas las dependencias estén instaladas
- Revisa los logs del servidor para errores

### No se encuentran lugares

- Verifica que la ubicación sea correcta
- Intenta ampliar el radio de búsqueda
- Algunos tipos de lugares pueden no estar disponibles en OpenStreetMap

### El mapa no se muestra

- Verifica que Leaflet esté cargado correctamente
- Revisa la consola del navegador para errores
- Asegúrate de que las coordenadas sean válidas

## 📄 Licencia

Este proyecto está bajo la licencia MIT.

## 🙏 Agradecimientos

- **OpenStreetMap** por los datos geográficos
- **Overpass API** por la API de consultas
- **Nominatim** por la geocodificación
- **Leaflet** por la librería de mapas
- **OpenAI** por el Apps SDK

## 📧 Contacto

- **GitHub:** [amayaeguizabal7](https://github.com/amayaeguizabal7)
- **Email:** aeguizabal.7@gmail.com

---

**¡Disfruta buscando lugares con MySherlock 🔎! ✨**
