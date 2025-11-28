import React, { useState, useEffect } from 'react';
// Importar el SDK de OpenAI Apps
// Nota: La API exacta puede variar según la versión del SDK
// Ajusta estos imports según la documentación oficial del SDK
import MapView from './components/MapView';
import SearchPanel from './components/SearchPanel';
import ResultsList from './components/ResultsList';
import { SearchParams, SearchResults, Place, SearchStatus } from './types';
import './App.css';

// Hook personalizado para el SDK (ajusta según la API real del SDK)
function useChatGPTAppSDK() {
  // Esta es una implementación de ejemplo
  // Reemplaza con la API real del SDK cuando esté disponible
  const [app, setApp] = useState<any>(null);

  useEffect(() => {
    // Inicializar el SDK cuando esté disponible
    if (typeof window !== 'undefined' && (window as any).chatgptApp) {
      setApp((window as any).chatgptApp);
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
   * Realiza una búsqueda llamando a la herramienta MCP search_places
   */
  const performSearch = async (params: SearchParams) => {
    setStatus('loading');
    setErrorMessage('');
    setSelectedPlace(null);

    try {
      // Llamar a la herramienta MCP
      // Ajusta esto según la API real del SDK de OpenAI Apps
      let result;
      if (app && app.callTool) {
        result = await app.callTool('search_places', {
          query: params.query,
          lat: params.lat,
          lng: params.lng,
          location_text: params.location_text,
          radius_meters: params.radius_meters,
        });
      } else {
        // Fallback: llamar directamente a la API si el SDK no está disponible
        // Esto es solo para desarrollo/testing
        throw new Error('SDK no disponible. Ejecuta la app dentro de ChatGPT.');
      }

      if (!result || !result.content) {
        throw new Error('No se recibió respuesta del servidor MCP');
      }

      // Parsear la respuesta
      // El servidor MCP devuelve JSON en el texto
      const content = result.content[0];
      if (content.type !== 'text') {
        throw new Error('Respuesta inesperada del servidor');
      }

      const text = content.text;
      
      // Extraer el JSON de la respuesta
      const jsonMatch = text.match(/--- DATOS JSON PARA EL WIDGET ---\n([\s\S]*)$/);
      if (!jsonMatch) {
        throw new Error('No se encontraron datos JSON en la respuesta');
      }

      const results: SearchResults = JSON.parse(jsonMatch[1]);
      setSearchResults(results);
      setStatus('success');

      // Si hay resultados, centrar el mapa en el primer lugar o en el centro
      if (results.places.length > 0 && results.center) {
        // El mapa se centrará automáticamente cuando cambien los resultados
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
      <div className="app-header">
        <h1>🗺️ OSM Finder</h1>
        <p>Busca lugares usando OpenStreetMap</p>
      </div>

      <div className="app-content">
        <div className="search-section">
          <SearchPanel
            searchParams={searchParams}
            onSearchChange={handleSearchChange}
            onSearch={handleSearch}
            status={status}
            errorMessage={errorMessage}
          />
        </div>

        <div className="results-section">
          <div className="map-container">
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

          <div className="list-container">
            <ResultsList
              places={searchResults?.places || []}
              selectedPlace={selectedPlace}
              onPlaceSelect={handlePlaceSelect}
              status={status}
              errorMessage={errorMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

