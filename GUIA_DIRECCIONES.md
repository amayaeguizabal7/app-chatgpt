# Guía de Direcciones para OSM Finder

Esta guía explica cómo escribir direcciones correctamente para obtener los mejores resultados de búsqueda en OSM Finder.

## 📍 Formato Recomendado

Para obtener los mejores resultados, escribe las direcciones en este orden:

```
Calle/Nombre del lugar, Número, Ciudad, Código Postal, País
```

### Ejemplos de Direcciones Correctas

#### ✅ Formato Completo (Recomendado)
```
Calle Gran Vía 1, Madrid, 28013, España
Avenida el Salvador 2, Falces, 31370, Navarra, España
Plaza de España 1, Barcelona, 08004, España
```

#### ✅ Formato con Nombre de Lugar
```
Plaza Mayor, Madrid
Sagrada Familia, Barcelona
Estadio Santiago Bernabéu, Madrid
```

#### ✅ Formato con Calle y Ciudad
```
Calle Mayor 5, Madrid
Avenida Diagonal 100, Barcelona
Paseo de la Castellana 200, Madrid
```

#### ✅ Formato con Código Postal
```
Calle Serrano 50, 28001 Madrid
Avenida Diagonal 200, 08018 Barcelona
```

#### ✅ Formato Simple (Solo Ciudad)
```
Madrid
Barcelona
Valencia
Falces, Navarra
```

## 🎯 Mejores Prácticas

### 1. Incluir la Ciudad
**Siempre incluye el nombre de la ciudad** para evitar ambigüedades:
- ✅ "Calle Mayor, Madrid"
- ❌ "Calle Mayor" (puede haber muchas calles con ese nombre)

### 2. Usar Nombres Completos
- ✅ "Avenida el Salvador" (completo)
- ❌ "Av. Salvador" (abreviado puede no funcionar)

### 3. Incluir Código Postal (Opcional pero Recomendado)
El código postal ayuda a precisar la ubicación:
- ✅ "Calle Gran Vía 1, Madrid, 28013"
- ✅ "Calle Gran Vía 1, Madrid" (también funciona)

### 4. Para Pueblos Pequeños
Incluye la provincia o región:
- ✅ "Falces, Navarra"
- ✅ "Avenida el Salvador 2, Falces, Navarra"
- ❌ "Falces" (puede haber varios lugares con ese nombre)

### 5. Usar Nombres de Lugares Conocidos
Para lugares famosos, solo el nombre suele ser suficiente:
- ✅ "Plaza de España, Madrid"
- ✅ "Sagrada Familia, Barcelona"
- ✅ "Puerta del Sol, Madrid"

## 🔍 Cómo Funciona la Geocodificación

OSM Finder usa **Nominatim** (servicio de geocodificación de OpenStreetMap) que:

1. **Busca coincidencias** en la base de datos de OpenStreetMap
2. **Prioriza resultados** basándose en:
   - Coincidencias exactas de nombres
   - Importancia del lugar (ciudades > calles > puntos específicos)
   - Proximidad a otros lugares mencionados

3. **Devuelve coordenadas** (latitud y longitud) que se usan para la búsqueda

## 📝 Ejemplos por Tipo de Búsqueda

### Búsqueda en Ciudad Grande (Madrid, Barcelona)
```
✅ "Calle Serrano 50, Madrid"
✅ "Plaza Catalunya, Barcelona"
✅ "Gran Vía, Madrid"
```

### Búsqueda en Pueblo Pequeño
```
✅ "Avenida el Salvador 2, Falces, Navarra"
✅ "Calle Mayor, Falces, Navarra, España"
✅ "Falces, Navarra" (si buscas en todo el pueblo)
```

### Búsqueda por Punto de Referencia
```
✅ "Cerca de Plaza de España, Madrid"
✅ "Alrededor de Sagrada Familia, Barcelona"
✅ "Cerca de Estación Atocha, Madrid"
```

### Búsqueda por Barrio o Zona
```
✅ "Barrio de Salamanca, Madrid"
✅ "Distrito Centro, Madrid"
✅ "Eixample, Barcelona"
```

## ⚠️ Errores Comunes

### ❌ No incluir la ciudad
```
❌ "Calle Mayor 5" → ¿En qué ciudad?
✅ "Calle Mayor 5, Madrid"
```

### ❌ Abreviaciones muy cortas
```
❌ "Av. S." → Muy ambiguo
✅ "Avenida el Salvador"
```

### ❌ Solo el código postal
```
❌ "28013" → No es suficiente
✅ "Calle Gran Vía, Madrid, 28013"
```

### ❌ Formato incorrecto
```
❌ "Madrid, Calle Gran Vía" → Orden incorrecto
✅ "Calle Gran Vía, Madrid"
```

## 💡 Consejos Adicionales

1. **Si no encuentras resultados:**
   - Intenta con menos detalles (solo ciudad)
   - Verifica la ortografía
   - Prueba con el nombre del barrio o zona

2. **Para lugares muy específicos:**
   - Usa el formato completo: Calle + Número + Ciudad + CP
   - O busca un punto de referencia cercano

3. **Para búsquedas amplias:**
   - Solo el nombre de la ciudad funciona bien
   - Ejemplo: "Madrid" buscará en toda la ciudad

4. **Si la dirección no se encuentra:**
   - Puede que no esté en OpenStreetMap
   - Intenta con un lugar cercano conocido
   - Usa el nombre del barrio o zona

## 🗺️ Estructura de una Dirección Ideal

```
┌─────────────────────────────────────────┐
│ Tipo de vía + Nombre                    │
│ Ej: "Calle Gran Vía"                    │
├─────────────────────────────────────────┤
│ Número (opcional pero recomendado)     │
│ Ej: "1"                                  │
├─────────────────────────────────────────┤
│ Ciudad (OBLIGATORIO)                    │
│ Ej: "Madrid"                             │
├─────────────────────────────────────────┤
│ Código Postal (opcional)                │
│ Ej: "28013"                              │
├─────────────────────────────────────────┤
│ Provincia/Región (recomendado)          │
│ Ej: "Madrid" o "Navarra"                │
├─────────────────────────────────────────┤
│ País (opcional, por defecto España)     │
│ Ej: "España"                             │
└─────────────────────────────────────────┘
```

## 📞 Ejemplo Completo

**Búsqueda:** Clínicas veterinarias cerca de "Avenida el Salvador 2, Falces, Navarra"

**Dirección escrita:**
```
Avenida el Salvador 2, Falces, Navarra, España
```

**O también funciona:**
```
Avenida el Salvador, Falces, Navarra
```

**O incluso:**
```
Falces, Navarra
```
(Si quieres buscar en todo el pueblo)

---

**¿Tienes dudas?** Prueba diferentes formatos y verás cuál funciona mejor para tu ubicación específica.

