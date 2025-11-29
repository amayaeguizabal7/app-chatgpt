/**
 * Tipos TypeScript para la aplicación OSM Finder
 */

export interface Place {
  name: string;
  lat: number;
  lng: number;
  type: string;
  tags: Record<string, string>;
  address?: string;
  phone?: string;
  osm_id: number;
  osm_type: string;
  osm_url: string;
  display_name: string;
  distance_meters: number;
}

export interface SearchParams {
  query: string;
  lat?: number;
  lng?: number;
  location_text?: string;
  radius_meters: number;
}

export interface SearchResults {
  places: Place[];
  count: number;
  query: string;
  radius_meters: number;
  center?: {
    lat: number;
    lng: number;
  };
}

export type SearchStatus = 'idle' | 'loading' | 'success' | 'error';


