#!/usr/bin/env python3
"""
Punto de entrada principal para el servidor MCP de OSM Finder.
Este archivo puede ejecutarse directamente o usarse como módulo.
"""
import asyncio
import sys
import os

# Agregar el directorio src al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.mcp_server import main

if __name__ == "__main__":
    asyncio.run(main())


