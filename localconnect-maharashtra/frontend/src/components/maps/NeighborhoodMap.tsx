import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapMarker, MapMarkerType } from '@/types/map';

const MARKER_COLORS: Record<MapMarkerType, string> = {
  post: '#2563eb',
  marketplace: '#16a34a',
  society: '#9333ea',
  place: '#ea580c',
};

const MARKER_LABELS: Record<MapMarkerType, string> = {
  post: 'Post',
  marketplace: 'Listing',
  society: 'Society',
  place: 'Place',
};

const iconCache = new Map<string, L.DivIcon>();

function markerIcon(type: MapMarkerType): L.DivIcon {
  const color = MARKER_COLORS[type];
  if (!iconCache.has(type)) {
    iconCache.set(
      type,
      L.divIcon({
        className: '',
        html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      }),
    );
  }
  return iconCache.get(type)!;
}

function MapRecenter({
  center,
  zoom,
}: {
  center: { lat: number; lng: number };
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom);
  }, [center.lat, center.lng, zoom, map]);
  return null;
}

interface NeighborhoodMapProps {
  center: { lat: number; lng: number };
  markers: MapMarker[];
  height?: string;
  zoom?: number;
  filterTypes?: MapMarkerType[];
}

export function NeighborhoodMap({
  center,
  markers,
  height = '420px',
  zoom = 14,
  filterTypes,
}: NeighborhoodMapProps) {
  const navigate = useNavigate();

  const visible = useMemo(() => {
    if (!filterTypes?.length) return markers;
    return markers.filter((m) => filterTypes.includes(m.type));
  }, [markers, filterTypes]);

  return (
    <div className="space-y-1">
      <div
        className="rounded-xl overflow-hidden border border-[hsl(var(--border))] z-0"
        style={{ height }}
      >
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapRecenter center={center} zoom={zoom} />
          {visible.map((m) => (
            <Marker
              key={`${m.type}-${m.id}`}
              position={[m.lat, m.lng]}
              icon={markerIcon(m.type)}
            >
              <Popup>
                <div className="text-sm text-gray-900 min-w-[160px]">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    {MARKER_LABELS[m.type]}
                  </p>
                  <p className="font-semibold mt-0.5">{m.title}</p>
                  {m.subtitle && (
                    <p className="text-gray-600 mt-1 text-xs">{m.subtitle}</p>
                  )}
                  {m.link && (
                    <button
                      type="button"
                      className="mt-2 text-brand-600 font-medium text-xs hover:underline"
                      onClick={() => navigate(m.link!)}
                    >
                      View details →
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <p className="text-[10px] text-[hsl(var(--muted-foreground))] text-right">
        Map data © OpenStreetMap contributors — free, no API key
      </p>
    </div>
  );
}

export function MapLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {(Object.keys(MARKER_COLORS) as MapMarkerType[]).map((type) => (
        <span key={type} className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: MARKER_COLORS[type] }}
          />
          {MARKER_LABELS[type]}
        </span>
      ))}
    </div>
  );
}
