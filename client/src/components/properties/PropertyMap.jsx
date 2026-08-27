import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Home } from 'lucide-react';
import { renderToString } from 'react-dom/server';

// Fix for default Leaflet icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// A custom map event handler to update bounds
function MapBoundsTracker({ setBounds }) {
  const map = useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      setBounds({
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLng: bounds.getWest(),
        maxLng: bounds.getEast(),
      });
    }
  });
  return null;
}

// Function to create a custom div icon
const createCustomIcon = (price) => {
  return L.divIcon({
    className: 'custom-pin',
    html: `<div class="bg-primary text-white px-2 py-1 rounded-full text-xs font-bold shadow-md border border-white whitespace-nowrap -translate-y-full -translate-x-1/2 mt-3 hover:bg-accent transition-colors duration-200">
            ${price}
           </div>`,
    iconSize: [0, 0],
  });
};

export default function PropertyMap({ properties, setBounds }) {
  // Default to Dar es Salaam center
  const defaultCenter = [-6.7924, 39.2083];
  const mapRef = useRef();

  // Helper to format rent
  const getMinRent = (units) => {
    if (!units || units.length === 0) return 'Price on Request';
    const rents = units.map(u => u.monthlyRent).filter(Boolean);
    if (rents.length === 0) return 'Price on Request';
    const minRent = Math.min(...rents);
    
    // Format shorthand (e.g. 500k, 1.2M)
    if (minRent >= 1000000) return `TZS ${(minRent/1000000).toFixed(1)}M`;
    if (minRent >= 1000) return `TZS ${(minRent/1000).toFixed(0)}k`;
    return `TZS ${minRent}`;
  };

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={12} 
        className="w-full h-full"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {setBounds && <MapBoundsTracker setBounds={setBounds} />}

        {properties?.map(property => {
          if (!property.latitude || !property.longitude) return null;
          
          const price = getMinRent(property.units);
          
          return (
            <Marker 
              key={property.id} 
              position={[property.latitude, property.longitude]}
              icon={createCustomIcon(price)}
            >
              <Popup className="property-popup rounded-xl">
                <div className="w-48 overflow-hidden rounded-lg">
                  {property.images && property.images.length > 0 ? (
                    <img src={property.images[0].url} alt={property.title} className="w-full h-32 object-cover" />
                  ) : (
                    <div className="w-full h-32 bg-slate-100 flex items-center justify-center">
                      <Home className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                  <div className="p-3">
                    <h4 className="font-semibold text-sm truncate">{property.title}</h4>
                    <p className="text-accent font-medium text-sm mt-1">{price}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
