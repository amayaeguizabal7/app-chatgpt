import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Place } from '../types';
import 'leaflet/dist/leaflet.css';

// Fix para los iconos de Leaflet en React
// Usar rutas relativas desde node_modules
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconShadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: iconUrl,
  shadowUrl: iconShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Icono personalizado para el lugar seleccionado
const SelectedIcon = L.icon({
  iconUrl: iconUrl,
  shadowUrl: iconShadowUrl,
  iconSize: [35, 51],
  iconAnchor: [17, 51],
  popupAnchor: [1, -34],
  shadowSize: [51, 51],
});

interface MapViewProps {
  places: Place[];
  center?: { lat: number; lng: number };
  selectedPlace: Place | null;
  onPlaceSelect: (place: Place) => void;
}

/**
 * Componente interno para centrar el mapa cuando cambia el centro o el lugar seleccionado
 */
function MapController({
  center,
  selectedPlace,
}: {
  center?: { lat: number; lng: number };
  selectedPlace: Place | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedPlace) {
      map.setView([selectedPlace.lat, selectedPlace.lng], 16);
    } else if (center) {
      map.setView([center.lat, center.lng], 14);
    }
  }, [map, center, selectedPlace]);

  return null;
}

const MapView: React.FC<MapViewProps> = ({
  places,
  center,
  selectedPlace,
  onPlaceSelect,
}) => {
  // Si no hay centro definido, usar el primer lugar o una ubicación por defecto
  const defaultCenter: [number, number] = center
    ? [center.lat, center.lng]
    : places.length > 0
    ? [places[0].lat, places[0].lng]
    : [40.4168, -3.7038]; // Madrid por defecto

  const defaultZoom = center || places.length > 0 ? 14 : 6;

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
        />

        <MapController center={center} selectedPlace={selectedPlace} />

        {/* Marcador del centro de búsqueda */}
        {center && (
          <Marker
            position={[center.lat, center.lng]}
            icon={L.divIcon({
              className: 'center-marker',
              html: '<div style="background-color: #667eea; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            })}
          >
            <Popup>
              <strong>Centro de búsqueda</strong>
            </Popup>
          </Marker>
        )}

        {/* Marcadores de los lugares encontrados */}
        {places.map((place) => {
          const isSelected = selectedPlace?.osm_id === place.osm_id;
          return (
            <Marker
              key={`${place.osm_type}-${place.osm_id}`}
              position={[place.lat, place.lng]}
              icon={isSelected ? SelectedIcon : DefaultIcon}
              eventHandlers={{
                click: () => onPlaceSelect(place),
              }}
            >
              <Popup>
                <div>
                  <strong>{place.name}</strong>
                  <br />
                  <span style={{ color: '#666', fontSize: '0.9em' }}>
                    {place.type}
                  </span>
                  {place.distance_meters && (
                    <>
                      <br />
                      <span style={{ color: '#666', fontSize: '0.85em' }}>
                        {place.distance_meters < 1000
                          ? `${Math.round(place.distance_meters)} m`
                          : `${(place.distance_meters / 1000).toFixed(2)} km`}
                      </span>
                    </>
                  )}
                  {place.address && (
                    <>
                      <br />
                      <span style={{ color: '#666', fontSize: '0.85em' }}>
                        {place.address}
                      </span>
                    </>
                  )}
                  <br />
                  <a
                    href={place.osm_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.85em', color: '#667eea' }}
                  >
                    Ver en OpenStreetMap →
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapView;

