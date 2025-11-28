#!/bin/bash

# Script para crear el repositorio en GitHub y conectarlo

echo "Para crear el repositorio en GitHub, necesitas un token de acceso personal."
echo ""
echo "Pasos:"
echo "1. Ve a https://github.com/settings/tokens"
echo "2. Genera un nuevo token (classic) con permisos 'repo'"
echo "3. Copia el token"
echo ""
echo "Luego ejecuta este comando (reemplaza YOUR_TOKEN con tu token):"
echo ""
echo "curl -X POST -H 'Authorization: token YOUR_TOKEN' -H 'Accept: application/vnd.github.v3+json' https://api.github.com/user/repos -d '{\"name\":\"app-chatgpt\",\"private\":false}'"
echo ""
echo "O simplemente crea el repositorio manualmente en:"
echo "https://github.com/new"
echo ""
echo "Luego conecta el remoto con:"
echo "git remote add origin https://github.com/amayaeguizabal7/app-chatgpt.git"
echo "git branch -M main"
echo "git push -u origin main"

