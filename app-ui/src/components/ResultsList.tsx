import React from 'react';
import { Place, SearchStatus } from '../types';
import './ResultsList.css';

interface ResultsListProps {
  places: Place[];
  selectedPlace: Place | null;
  onPlaceSelect: (place: Place) => void;
  status: SearchStatus;
  errorMessage: string;
}

const ResultsList: React.FC<ResultsListProps> = ({
  places,
  selectedPlace,
  onPlaceSelect,
  status,
  errorMessage,
}) => {
  if (status === 'loading') {
    return (
      <div className="results-list">
        <div className="status-message">
          <div className="loading-spinner"></div>
          <p>Buscando lugares...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="results-list">
        <div className="status-message error">
          <p>❌ Error</p>
          <p>{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (status === 'idle' || places.length === 0) {
    return (
      <div className="results-list">
        <div className="status-message">
          <p>🔍 Realiza una búsqueda para ver resultados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="results-list">
      <div className="results-header">
        <h2>Resultados ({places.length})</h2>
      </div>
      <div className="results-items">
        {places.map((place) => {
          const isSelected = selectedPlace?.osm_id === place.osm_id;
          return (
            <div
              key={`${place.osm_type}-${place.osm_id}`}
              className={`result-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onPlaceSelect(place)}
            >
              <div className="result-item-header">
                <h3>{place.name}</h3>
                {place.distance_meters && (
                  <span className="distance-badge">
                    {place.distance_meters < 1000
                      ? `${Math.round(place.distance_meters)} m`
                      : `${(place.distance_meters / 1000).toFixed(2)} km`}
                  </span>
                )}
              </div>
              <div className="result-item-type">{place.type}</div>
              {place.address && (
                <div className="result-item-address">📍 {place.address}</div>
              )}
              <div className="result-item-footer">
                <a
                  href={place.osm_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  Ver en OSM →
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResultsList;

