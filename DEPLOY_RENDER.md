# Guía de Despliegue en Render.com - MySherlock 🔎

Esta guía te ayudará a desplegar MySherlock en Render.com para que funcione con ChatGPT.

## 📋 Requisitos Previos

1. **Cuenta en Render.com**: [https://render.com](https://render.com) (gratis)
2. **Repositorio en GitHub**: Tu código debe estar en GitHub
3. **Node.js instalado localmente** (para compilar el widget antes del push, opcional)

## 🚀 Pasos para Desplegar

### Paso 1: Preparar el Repositorio

Asegúrate de que todos los cambios estén en GitHub:

```bash
git add .
git commit -m "Configuración para Render.com"
git push origin main
```

### Paso 2: Crear Servicio en Render.com

1. **Inicia sesión en Render.com**: [https://dashboard.render.com](https://dashboard.render.com)

2. **Crea un nuevo Web Service**:
   - Click en **"New +"** → **"Web Service"**
   - Conecta tu repositorio de GitHub
   - Selecciona el repositorio `app-chatgpt`

3. **Configuración del Servicio**:

   **Nombre del servicio:**
   ```
   mysherlock-mcp
   ```

   **Configuración automática:**
   - Render detectará automáticamente el archivo `render.yaml`
   - Si no lo detecta, usa estas configuraciones manuales:

   **Build Command:**
   ```bash
   cd app-ui && npm install && npm run build && cd .. && pip install -r mcp_server_python/requirements.txt
   ```

   **Start Command:**
   ```bash
   uvicorn mcp_server_python.main:app --host 0.0.0.0 --port $PORT
   ```

   **Health Check Path:**
   ```
   /health
   ```

   **Environment:**
   - **Python**: 3.11.0 (o la versión más reciente disponible)

   **Variables de Entorno:**
   - `PORT`: `8000` (Render lo configurará automáticamente, pero puedes añadirlo por si acaso)

### Paso 3: Configuración Avanzada (Opcional)

Si Render no detecta automáticamente el `render.yaml`, configura manualmente:

**Plan:**
- **Free** (suficiente para empezar)

**Auto-Deploy:**
- ✅ **Yes** (se actualiza automáticamente con cada push a main)

**Health Check Path:**
```
/
```

### Paso 4: Desplegar

1. Click en **"Create Web Service"**
2. Render comenzará a construir y desplegar tu aplicación
3. El proceso puede tardar 5-10 minutos la primera vez
4. Verás los logs en tiempo real

### Paso 5: Obtener la URL

Una vez desplegado, Render te dará una URL como:
```
https://mysherlock-mcp.onrender.com
```

**⚠️ IMPORTANTE**: Guarda esta URL, la necesitarás para configurar ChatGPT.

### Paso 6: Actualizar app.json

Actualiza el archivo `app.json` con tu URL real de Render:

```json
{
  "mcp_servers": {
    "mysherlock": {
      "url": "https://TU-URL-AQUI.onrender.com/mcp",
      "env": {}
    }
  }
}
```

Reemplaza `TU-URL-AQUI` con tu URL real (sin el `https://`).

### Paso 7: Verificar el Despliegue

1. **Verifica que el servidor funciona:**
   - Visita: `https://TU-URL.onrender.com/`
   - Deberías ver: `{"message": "MySherlock 🔎 MCP Server", "status": "running"}`

2. **Verifica el widget:**
   - Visita: `https://TU-URL.onrender.com/widget`
   - Deberías ver el widget HTML

3. **Verifica el endpoint MCP:**
   - Puedes probar con curl:
   ```bash
   curl -X POST https://TU-URL.onrender.com/mcp \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
   ```

## 🔧 Solución de Problemas

### El build falla

**Problema**: Error al compilar el widget
**Solución**: 
- Verifica que `node_modules` no esté en `.gitignore` (debe estar)
- Verifica que `app-ui/package.json` tenga todas las dependencias
- Revisa los logs de build en Render

### El servidor no inicia

**Problema**: Error al iniciar el servidor Python
**Solución**:
- Verifica que `requirements.txt` tenga todas las dependencias
- Verifica que `main.py` esté en la ruta correcta
- Revisa los logs de inicio en Render

### El widget no se carga

**Problema**: El widget HTML no se encuentra
**Solución**:
- Verifica que el build se completó correctamente
- Verifica que `app-ui/dist/index.html` existe después del build
- Revisa los logs para ver si hay errores al cargar el HTML

### Error 404 en assets

**Problema**: Los archivos JS/CSS no se cargan
**Solución**:
- Verifica que `app-ui/dist/assets/` tenga los archivos compilados
- Verifica que las rutas en el HTML sean relativas (`./assets/...`)

## 📝 Notas Importantes

1. **Primera vez**: El despliegue inicial puede tardar 10-15 minutos
2. **Auto-deploy**: Cada push a `main` desplegará automáticamente
3. **Sleep mode**: En el plan gratuito, el servicio se "duerme" después de 15 minutos de inactividad. La primera petición después de dormir puede tardar ~30 segundos
4. **Logs**: Siempre revisa los logs en Render si algo no funciona

## 🔗 Siguiente Paso

Una vez desplegado, configura ChatGPT siguiendo las instrucciones en `README.md` o `OPCIONES_CHATGPT.md`.

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Render.com
2. Verifica que todos los archivos estén en GitHub
3. Asegúrate de que el build se complete sin errores

