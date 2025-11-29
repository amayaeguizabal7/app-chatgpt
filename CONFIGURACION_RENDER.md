# Configuración de Render.com para MySherlock 🔎

Esta guía muestra exactamente cómo configurar Render.com siguiendo el patrón del proyecto de referencia.

## 📋 Configuración en Render.com

Cuando crees el servicio en Render.com, usa estas configuraciones exactas:

### Build & Deploy

**Build Command:**
```bash
pip install -r requirements.txt && cd app-ui && npm install && npm run build && cd .. && pip install -r mcp_server_python/requirements.txt
```

**Start Command:**
```bash
gunicorn mcp_server_python.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
```

**Health Check Path:**
```
/health
```

### General

- **Name:** `mysherlock-mcp`
- **Region:** Oregon (US West) o la más cercana a ti
- **Instance Type:** Free 0.1 CPU 512 MB (para empezar)

### Auto-Deploy

- **Auto-Deploy:** On Commit (activado)

## ✅ Verificación

Una vez desplegado, verifica:

1. **Health Check:**
   ```
   https://TU-URL.onrender.com/health
   ```
   Debe devolver: `{"status": "healthy", "service": "MySherlock 🔎"}`

2. **Endpoint raíz:**
   ```
   https://TU-URL.onrender.com/
   ```
   Debe devolver: `{"message": "MySherlock 🔎 MCP Server", "status": "running"}`

3. **Widget:**
   ```
   https://TU-URL.onrender.com/widget
   ```
   Debe mostrar el widget HTML

4. **Endpoint MCP:**
   ```
   https://TU-URL.onrender.com/mcp
   ```
   Debe responder a peticiones POST con el protocolo MCP

## 🔧 Notas Importantes

- El `render.yaml` debería detectarse automáticamente
- Si no se detecta, configura manualmente con los valores de arriba
- El build puede tardar 5-10 minutos la primera vez
- Asegúrate de que el repositorio esté en GitHub antes de conectar

