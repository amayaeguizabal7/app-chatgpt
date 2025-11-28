import React from 'react';
import { SearchParams, SearchStatus } from '../types';
import './SearchPanel.css';

interface SearchPanelProps {
  searchParams: SearchParams;
  onSearchChange: (params: Partial<SearchParams>) => void;
  onSearch: () => void;
  status: SearchStatus;
  errorMessage: string;
}

const SearchPanel: React.FC<SearchPanelProps> = ({
  searchParams,
  onSearchChange,
  onSearch,
  status,
  errorMessage,
}) => {
  const radiusOptions = [
    { value: 500, label: '500 m' },
    { value: 1000, label: '1 km' },
    { value: 2000, label: '2 km' },
    { value: 5000, label: '5 km' },
  ];

  return (
    <div className="search-panel">
      <div className="search-row">
        <div className="search-field">
          <label htmlFor="query">Tipo de lugar</label>
          <input
            id="query"
            type="text"
            placeholder="Ej: cafeterías, parques, bibliotecas..."
            value={searchParams.query}
            onChange={(e) => onSearchChange({ query: e.target.value })}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                onSearch();
              }
            }}
            disabled={status === 'loading'}
          />
        </div>

        <div className="search-field location-field">
          <label htmlFor="location">
            Ubicación
            <span className="field-hint" title="Formato recomendado: Calle, Número, Ciudad, Código Postal, País">
              ℹ️
            </span>
          </label>
          <input
            id="location"
            type="text"
            placeholder="Ej: Calle Gran Vía 1, Madrid, 28013, España"
            value={searchParams.location_text || ''}
            onChange={(e) => onSearchChange({ location_text: e.target.value })}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                onSearch();
              }
            }}
            disabled={status === 'loading'}
          />
          <div className="location-examples">
            <small>
              <strong>Ejemplo:</strong> "Calle Mayor 5, Madrid" o "Falces, Navarra"
            </small>
          </div>
        </div>

        <div className="search-field">
          <label htmlFor="radius">Radio</label>
          <select
            id="radius"
            value={searchParams.radius_meters}
            onChange={(e) =>
              onSearchChange({ radius_meters: parseInt(e.target.value) })
            }
            disabled={status === 'loading'}
          >
            {radiusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button
          className="search-button"
          onClick={onSearch}
          disabled={status === 'loading' || !searchParams.query.trim()}
        >
          {status === 'loading' ? 'Buscando...' : '🔍 Buscar'}
        </button>
      </div>

      {errorMessage && (
        <div className="error-message">{errorMessage}</div>
      )}

      {searchParams.lat && searchParams.lng && (
        <div className="coordinates-info">
          Coordenadas: {searchParams.lat.toFixed(6)}, {searchParams.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
};

export default SearchPanel;

