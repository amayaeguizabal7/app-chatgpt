import React, { useState, useEffect } from 'react';
// Importar el SDK de OpenAI Apps
// Nota: La API exacta puede variar según la versión del SDK
// Ajusta estos imports según la documentación oficial del SDK
import MapView from './components/MapView';
import SearchPanel from './components/SearchPanel';
import ResultsList from './components/ResultsList';
import { SearchParams, SearchResults, Place, SearchStatus } from './types';
import { searchPlaces as searchPlacesDirect } from './services/overpassService';
import './App.css';

// Hook personalizado para el SDK (modo demo para visualización local)
function useChatGPTAppSDK() {
  const [app, setApp] = useState<any>(null);

  useEffect(() => {
    // Para modo demo local, no necesitamos el SDK real
    // El código usará directamente Overpass API
    if (typeof window !== 'undefined') {
      // Si el SDK está disponible (cuando se ejecuta en ChatGPT), lo usamos
      if ((window as any).chatgptApp) {
        setApp((window as any).chatgptApp);
      } else {
        // En modo demo, retornamos null y el código usará Overpass directamente
        setApp(null);
      }
    }
  }, []);

  return app;
}

function App() {
  const app = useChatGPTAppSDK();
  const [searchParams, setSearchParams] = useState<SearchParams>({
    query: '',
    radius_meters: 1000,
  });
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Escuchar mensajes del modelo de ChatGPT
  useEffect(() => {
    if (!app) return;

    // Ajusta esto según la API real del SDK
    // El SDK puede proporcionar eventos o métodos diferentes
    const handleMessage = async (message: any) => {
      // El modelo puede enviar parámetros de búsqueda directamente
      if (message.type === 'search_params') {
        setSearchParams(message.params);
        await performSearch(message.params);
      }
    };

    // Ajusta según la API real del SDK
    if (app.on) {
      app.on('message', handleMessage);
      return () => {
        app.off('message', handleMessage);
      };
    }
  }, [app]);

  /**
   * Realiza una búsqueda llamando a la herramienta MCP search_places o directamente a Overpass
   */
  const performSearch = async (params: SearchParams) => {
    setStatus('loading');
    setErrorMessage('');
    setSelectedPlace(null);

    try {
      let results: SearchResults;

      // Intentar usar el SDK de ChatGPT si está disponible
      if (app && app.callTool) {
        const result = await app.callTool('search_places', {
          query: params.query,
          lat: params.lat,
          lng: params.lng,
          location_text: params.location_text,
          radius_meters: params.radius_meters,
        });

        if (!result || !result.content) {
          throw new Error('No se recibió respuesta del servidor MCP');
        }

        const content = result.content[0];
        if (content.type !== 'text') {
          throw new Error('Respuesta inesperada del servidor');
        }

        const text = content.text;
        const jsonMatch = text.match(/--- DATOS JSON PARA EL WIDGET ---\n([\s\S]*)$/);
        if (!jsonMatch) {
          throw new Error('No se encontraron datos JSON en la respuesta');
        }

        results = JSON.parse(jsonMatch[1]);
      } else {
        // Modo demo: llamar directamente a Overpass API
        console.log('Usando modo demo - llamando directamente a Overpass API');
        results = await searchPlacesDirect(
          params.query,
          params.lat,
          params.lng,
          params.location_text,
          params.radius_meters
        );
      }

      setSearchResults(results);
      setStatus('success');

      if (results.places.length === 0) {
        setStatus('success');
        setErrorMessage(
          `No se encontraron lugares de tipo '${params.query}' en un radio de ${params.radius_meters}m. Intenta ampliar el radio o cambiar el tipo de lugar.`
        );
      }

    } catch (error) {
      console.error('Error en la búsqueda:', error);
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Error desconocido al buscar lugares'
      );
      setSearchResults(null);
    }
  };

  /**
   * Maneja el cambio en los parámetros de búsqueda desde el panel
   */
  const handleSearchChange = (params: Partial<SearchParams>) => {
    const newParams = { ...searchParams, ...params };
    setSearchParams(newParams);
  };

  /**
   * Maneja el clic en el botón de búsqueda
   */
  const handleSearch = () => {
    if (!searchParams.query.trim()) {
      setErrorMessage('Por favor, ingresa un tipo de lugar a buscar');
      return;
    }

    if (!searchParams.lat && !searchParams.lng && !searchParams.location_text) {
      setErrorMessage('Por favor, proporciona una ubicación (coordenadas o texto)');
      return;
    }

    performSearch(searchParams);
  };

  /**
   * Maneja la selección de un lugar de la lista
   */
  const handlePlaceSelect = (place: Place) => {
    setSelectedPlace(place);
  };

  return (
    <div className="app-container">
      <div className="app-layout">
        {/* Panel izquierdo: Controles y resultados */}
        <div className="left-panel">
          <div className="panel-header">
            <h1>MySherlock 🔎</h1>
            <p>Voy a tener suerte</p>
          </div>

          <div className="panel-content">
            <SearchPanel
              searchParams={searchParams}
              onSearchChange={handleSearchChange}
              onSearch={handleSearch}
              status={status}
              errorMessage={errorMessage}
            />

            <ResultsList
              places={searchResults?.places || []}
              selectedPlace={selectedPlace}
              onPlaceSelect={handlePlaceSelect}
              status={status}
              errorMessage={errorMessage}
            />
          </div>
        </div>

        {/* Panel derecho: Mapa */}
        <div className="right-panel">
          <MapView
            places={searchResults?.places || []}
            center={
              searchResults?.center || 
              (searchParams.lat && searchParams.lng
                ? { lat: searchParams.lat, lng: searchParams.lng }
                : undefined)
            }
            selectedPlace={selectedPlace}
            onPlaceSelect={handlePlaceSelect}
          />
        </div>
      </div>
    </div>
  );
}

export default App;

