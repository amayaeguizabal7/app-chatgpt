import { useState, useEffect } from 'react';
import MapView from './components/MapView';
import SearchPanel from './components/SearchPanel';
import ResultsList from './components/ResultsList';
import { SearchParams, SearchResults, Place, SearchStatus } from './types';
import { searchPlaces as searchPlacesDirect } from './services/overpassService';
import './App.css';

// Tipos para el SDK de OpenAI Apps
declare global {
  interface Window {
    openai?: {
      toolOutput?: {
        searchResults?: SearchResults;
      };
      callTool?: (toolName: string, args: any) => Promise<any>;
    };
  }
}

function App() {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    query: '',
    radius_meters: 1000,
  });
  
  // Inicializar searchResults desde toolOutput o datos inyectados
  const [searchResults, setSearchResults] = useState<SearchResults | null>(() => {
    if (typeof window !== 'undefined') {
      // Prioridad 1: toolOutput del SDK
      if (window.openai?.toolOutput?.searchResults) {
        return window.openai.toolOutput.searchResults;
      }
      // Prioridad 2: datos inyectados directamente en el HTML
      if ((window as any).__MYSHERLOCK_SEARCH_RESULTS__) {
        return (window as any).__MYSHERLOCK_SEARCH_RESULTS__;
      }
    }
    return null;
  });
  
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Escuchar eventos de ChatGPT para actualizar los datos
  useEffect(() => {
    const handleSetGlobals = (event: CustomEvent) => {
      const globals = event.detail?.globals;
      if (globals?.toolOutput?.searchResults) {
        setSearchResults(globals.toolOutput.searchResults);
        setStatus('success');
        if (globals.toolOutput.searchResults.places.length === 0) {
          setErrorMessage(
            `No se encontraron lugares de tipo '${globals.toolOutput.searchResults.query}' en un radio de ${globals.toolOutput.searchResults.radius_meters}m.`
          );
        }
      }
    };

    // Escuchar eventos de OpenAI
    window.addEventListener('openai:set_globals', handleSetGlobals as EventListener);
    
    // También verificar si hay datos inyectados directamente
    if (typeof window !== 'undefined' && (window as any).__MYSHERLOCK_SEARCH_RESULTS__) {
      const injectedData = (window as any).__MYSHERLOCK_SEARCH_RESULTS__;
      setSearchResults(injectedData);
      setStatus('success');
      if (injectedData.places && injectedData.places.length === 0) {
        setErrorMessage(
          `No se encontraron lugares de tipo '${injectedData.query}' en un radio de ${injectedData.radius_meters}m.`
        );
      }
    }
    
    return () => {
      window.removeEventListener('openai:set_globals', handleSetGlobals as EventListener);
    };
  }, []);

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
      if (window.openai?.callTool) {
        try {
          const result = await window.openai.callTool('search_places', {
            query: params.query,
            lat: params.lat,
            lng: params.lng,
            location_text: params.location_text,
            radius_meters: params.radius_meters,
          });

          // El resultado puede venir en structuredContent
          if (result?.structuredContent?.searchResults) {
            results = result.structuredContent.searchResults;
          } else if (result?.content) {
            // Buscar en el contenido
            const textContent = result.content.find((c: any) => c.type === 'text');
            if (textContent?.text) {
              // Intentar parsear JSON si está en el texto
              const jsonMatch = textContent.text.match(/--- DATOS JSON PARA EL WIDGET ---\n([\s\S]*)$/);
              if (jsonMatch) {
                results = JSON.parse(jsonMatch[1]);
              } else {
                throw new Error('No se encontraron datos en la respuesta');
              }
            } else {
              throw new Error('Respuesta inesperada del servidor');
            }
          } else {
            throw new Error('No se recibió respuesta del servidor MCP');
          }
        } catch (toolError) {
          console.warn('Error llamando a la herramienta, usando modo directo:', toolError);
          // Fallback a modo directo
          results = await searchPlacesDirect(
            params.query,
            params.lat,
            params.lng,
            params.location_text,
            params.radius_meters
          );
        }
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

