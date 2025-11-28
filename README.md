# app-chatgpt

Repositorio para la aplicación ChatGPT.

## Configuración inicial

Este repositorio está configurado localmente y listo para ser subido a GitHub.

### Crear el repositorio en GitHub

Tienes dos opciones:

#### Opción 1: Crear manualmente (Recomendado)
1. Ve a https://github.com/new
2. Nombre del repositorio: `app-chatgpt`
3. Elige si será público o privado
4. **NO** inicialices con README, .gitignore o licencia (ya están creados)
5. Haz clic en "Create repository"
6. Luego ejecuta:
   ```bash
   git push -u origin main
   ```

#### Opción 2: Usando la API de GitHub
1. Genera un token de acceso personal en: https://github.com/settings/tokens
2. Selecciona el scope `repo`
3. Ejecuta:
   ```bash
   curl -X POST \
     -H "Authorization: token TU_TOKEN_AQUI" \
     -H "Accept: application/vnd.github.v3+json" \
     https://api.github.com/user/repos \
     -d '{"name":"app-chatgpt","private":false}'
   ```
4. Luego ejecuta:
   ```bash
   git push -u origin main
   ```

## Información del repositorio

- **Usuario de GitHub**: amayaeguizabal7
- **Email**: aeguizabal.7@gmail.com
- **URL del repositorio**: https://github.com/amayaeguizabal7/app-chatgpt

