# 🚀 Guía Paso a Paso: Desplegar MySherlock en Render.com

Esta guía te llevará paso a paso para crear y configurar tu servicio en Render.com.

## 📋 Paso 1: Preparar el Código (Ya está hecho ✅)

Primero, asegúrate de que todos los cambios estén en GitHub:

```bash
# Desde la raíz del proyecto
git add .
git commit -m "Configuración completa para Render.com"
git push origin main
```

## 🌐 Paso 2: Crear Cuenta en Render.com

1. Ve a [https://render.com](https://render.com)
2. Click en **"Get Started for Free"** o **"Sign Up"**
3. Elige una de estas opciones:
   - **Sign up with GitHub** (recomendado - más fácil)
   - **Sign up with Email**

## 🔗 Paso 3: Conectar tu Repositorio de GitHub

1. Una vez dentro de Render, verás el dashboard
2. Click en **"New +"** (botón en la esquina superior derecha)
3. Selecciona **"Web Service"**

4. Render te pedirá conectar un repositorio:
   - Si usaste "Sign up with GitHub", verás tus repositorios
   - Si usaste email, necesitarás autorizar acceso a GitHub
   - Busca y selecciona: **`amayaeguizabal7/app-chatgpt`**

## ⚙️ Paso 4: Configurar el Servicio

### 4.1 Configuración Básica

**Name:**
```
mysherlock-mcp
```

**Region:**
- Selecciona la región más cercana a ti (ej: **Oregon (US West)** o **Frankfurt (EU Central)**)

**Branch:**
```
main
```

**Root Directory:**
- Déjalo vacío (Render usará la raíz del repositorio)

### 4.2 Configuración de Build & Deploy

**Environment:**
- Selecciona **"Python 3"**

**Build Command:**
Copia y pega exactamente esto:
```bash
cd app-ui && npm install && npm run build && cd .. && pip install -r mcp_server_python/requirements.txt
```

**Start Command:**
Copia y pega exactamente esto:
```bash
cd mcp_server_python && uvicorn main:app --host 0.0.0.0 --port $PORT
```

**Auto-Deploy:**
- Deja **"Yes"** (se actualizará automáticamente con cada push)

### 4.3 Health Check

**Health Check Path:**
```
/health
```

### 4.4 Plan

**Instance Type:**
- Selecciona **"Free"** (0.1 CPU, 512 MB RAM)
- Es suficiente para empezar

## 🚀 Paso 5: Crear el Servicio

1. Revisa todas las configuraciones
2. Click en **"Create Web Service"** (botón azul al final)
3. Render comenzará a construir tu aplicación

## ⏳ Paso 6: Esperar el Build

1. Verás una pantalla con los **logs en tiempo real**
2. El proceso puede tardar **5-15 minutos** la primera vez
3. Verás mensajes como:
   - "Installing dependencies..."
   - "Building application..."
   - "Starting service..."

**⚠️ IMPORTANTE:** No cierres la pestaña, pero puedes minimizarla. El proceso continuará.

## ✅ Paso 7: Verificar el Despliegue

Una vez que veas **"Your service is live"** o el estado cambie a **"Live"**:

1. **Copia la URL** que Render te da (algo como: `https://mysherlock-mcp-xxxx.onrender.com`)

2. **Prueba estos endpoints:**

   a) **Health Check:**
   ```
   https://TU-URL.onrender.com/health
   ```
   Debe devolver: `{"status": "healthy", "service": "MySherlock 🔎"}`

   b) **Endpoint raíz:**
   ```
   https://TU-URL.onrender.com/
   ```
   Debe devolver: `{"message": "MySherlock 🔎 MCP Server", "status": "running"}`

   c) **Widget:**
   ```
   https://TU-URL.onrender.com/widget
   ```
   Debe mostrar el widget HTML

## 🔧 Paso 8: Actualizar app.json

1. Abre el archivo `app.json` en tu proyecto local
2. Actualiza la URL con tu URL real de Render:

```json
{
  "mcp_servers": {
    "mysherlock": {
      "url": "https://TU-URL-REAL.onrender.com/mcp",
      "env": {}
    }
  }
}
```

3. Guarda y haz commit:
```bash
git add app.json
git commit -m "Actualizar URL de Render.com"
git push origin main
```

## 🎯 Paso 9: Configurar en ChatGPT

1. Abre **ChatGPT** → **Settings** ⚙️
2. Ve a **Connectors** o **MCP Settings**
3. Click en **"Add Connector"** ➕
4. Configura:
   - **Name:** `MySherlock`
   - **Type:** `MCP` o `HTTP`
   - **URL:** `https://TU-URL.onrender.com/mcp`
5. Click en **"Save"** y luego **"Refresh"** ↻

## 🐛 Solución de Problemas Comunes

### El build falla

**Síntoma:** Error en los logs de build

**Soluciones:**
- Verifica que todos los archivos estén en GitHub
- Revisa los logs para ver el error específico
- Asegúrate de que `requirements.txt` y `mcp_server_python/requirements.txt` existan

### El servicio no inicia

**Síntoma:** El servicio se queda en "Building" o falla al iniciar

**Soluciones:**
- Verifica que el Start Command sea correcto
- Revisa los logs de inicio
- Asegúrate de que gunicorn esté en `mcp_server_python/requirements.txt`

### Error 404 en /health

**Síntoma:** El health check falla

**Soluciones:**
- Verifica que el endpoint `/health` esté en `main.py`
- Revisa que el servicio esté realmente "Live"
- Espera unos minutos después del despliegue

### El widget no carga

**Síntoma:** Error 404 al acceder a /widget

**Soluciones:**
- Verifica que el build se completó correctamente
- Revisa que `app-ui/dist/index.html` exista
- Verifica los logs del build para errores de compilación

## 📝 Notas Importantes

1. **Primera vez:** El despliegue inicial puede tardar 10-15 minutos
2. **Auto-deploy:** Cada push a `main` desplegará automáticamente
3. **Sleep mode:** En el plan gratuito, el servicio se "duerme" después de 15 minutos de inactividad. La primera petición después de dormir puede tardar ~30 segundos
4. **Logs:** Siempre revisa los logs en Render si algo no funciona (pestaña "Logs" en el dashboard)

## 🎉 ¡Listo!

Una vez completado, tu servicio estará disponible en Render.com y podrás usarlo con ChatGPT.

Si tienes problemas, revisa:
- Los logs en Render.com (pestaña "Logs")
- Que todos los archivos estén en GitHub
- Que el build se complete sin errores

