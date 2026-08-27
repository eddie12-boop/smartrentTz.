import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Search, Home, MapPin, Bed, Bath, Map, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import L from 'leaflet';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Property type tab config
const PROPERTY_TYPES = [
  { label: 'All', value: '' },
  { label: 'Apartments', value: 'APARTMENT' },
  { label: 'Houses', value: 'HOUSE' },
  { label: 'Rooms', value: 'ROOM' },
  { label: 'Villas', value: 'VILLA' },
  { label: 'Commercial', value: 'COMMERCIAL' },
  { label: 'Hostels', value: 'HOSTEL' },
];

export default function PropertySearchPage() {
  const [searchParams] = useSearchParams();
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    propertyType: searchParams.get('propertyType') || '',
    minRent: '',
    maxRent: '',
    bedrooms: '',
  });
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['properties', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.propertyType) params.append('propertyType', filters.propertyType);
      if (filters.minRent) params.append('minRent', filters.minRent);
      if (filters.maxRent) params.append('maxRent', filters.maxRent);
      if (filters.bedrooms) params.append('bedrooms', filters.bedrooms);
      params.append('limit', 'all');
      const response = await axios.get(`${API_URL}/properties?${params.toString()}`);
      return response.data;
    },
    staleTime: 5000,
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const setPropertyType = (value) => {
    setFilters(prev => ({ ...prev, propertyType: value }));
  };

  const properties = data?.data?.properties || [];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* ── Sticky Filter Bar ── */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">

          {/* Row 1: Search + More filters */}
          <div className="flex gap-3 items-center">
            <div className="flex-1 flex items-center bg-gray-50 rounded-xl border border-gray-200 px-4 py-2.5 gap-2 focus-within:ring-2 focus-within:ring-accent focus-within:border-accent transition-all">
              <Search className="h-4 w-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
              <label htmlFor="search-input" className="sr-only">Search by neighbourhood, street, or title</label>
              <input
                id="search-input"
                type="search"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by location, name, street…"
                className="w-full bg-transparent text-sm text-primary placeholder:text-gray-400 outline-none"
                autoComplete="off"
              />
              {filters.search && (
                <button onClick={() => setFilters(p => ({ ...p, search: '' }))} aria-label="Clear search" className="text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowMoreFilters(p => !p)}
              aria-expanded={showMoreFilters}
              aria-label="Toggle advanced filters"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${showMoreFilters ? 'bg-primary text-white border-primary' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Filters
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showMoreFilters ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
          </div>

          {/* Row 2: Property type tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" role="tablist" aria-label="Filter by property type">
            {PROPERTY_TYPES.map(type => (
              <button
                key={type.value}
                role="tab"
                aria-selected={filters.propertyType === type.value}
                onClick={() => setPropertyType(type.value)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  filters.propertyType === type.value
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Advanced Filters (collapsible) */}
          {showMoreFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1 border-t border-gray-100">
              <div>
                <label htmlFor="filter-beds" className="block text-xs font-medium text-gray-500 mb-1">Bedrooms</label>
                <select id="filter-beds" name="bedrooms" value={filters.bedrooms} onChange={handleFilterChange} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent">
                  <option value="">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                </select>
              </div>
              <div>
                <label htmlFor="filter-min-rent" className="block text-xs font-medium text-gray-500 mb-1">Min Rent (TZS)</label>
                <input id="filter-min-rent" type="number" name="minRent" value={filters.minRent} onChange={handleFilterChange} placeholder="e.g. 200,000" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div>
                <label htmlFor="filter-max-rent" className="block text-xs font-medium text-gray-500 mb-1">Max Rent (TZS)</label>
                <input id="filter-max-rent" type="number" name="maxRent" value={filters.maxRent} onChange={handleFilterChange} placeholder="e.g. 2,000,000" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ search: '', propertyType: '', minRent: '', maxRent: '', bedrooms: '' })}
                  className="w-full py-2 text-sm text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 rounded-lg transition-colors font-medium"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Results Area ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Results count heading */}
        <h1 className="text-sm font-semibold text-gray-500 mb-5">
          {isLoading ? 'Searching…' : `${properties.length} ${properties.length === 1 ? 'property' : 'properties'} found${filters.propertyType ? ` · ${PROPERTY_TYPES.find(t => t.value === filters.propertyType)?.label}` : ''}`}
        </h1>

        {/* Loading skeletons */}
        {isLoading ? (
          <div role="status" aria-live="polite" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <span className="sr-only">Loading properties, please wait…</span>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100">
                <div className="skeleton h-48 w-full" />
                <div className="p-4 space-y-3">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                  <div className="skeleton h-4 w-1/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5">
              <Home className="h-10 w-10 text-gray-300" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold text-primary mb-2">No properties found</h2>
            <p className="text-gray-500 text-sm max-w-xs">Try a different location, property type, or adjust your price range.</p>
            <button
              onClick={() => setFilters({ search: '', propertyType: '', minRent: '', maxRent: '', bedrooms: '' })}
              className="mt-6 px-6 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          /* Property Card Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-24">
            {properties.map(property => {
              const mainImage = property.images?.[0]?.url;
              const primaryUnit = property.units?.[0];
              const rent = primaryUnit?.monthlyRent;
              const beds = primaryUnit?.bedrooms;
              const baths = primaryUnit?.bathrooms;

              return (
                <Link
                  key={property.id}
                  to={`/properties/${property.id}`}
                  aria-label={`View ${property.title} in ${property.district}`}
                  className="group block"
                >
                  <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                    {/* Image */}
                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                      {mainImage ? (
                        <img
                          src={mainImage}
                          alt={`${property.title} — property photo`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300" aria-hidden="true">
                          <Home className="h-10 w-10" aria-hidden="true" />
                          <span className="text-xs mt-2 text-gray-400">No image</span>
                        </div>
                      )}
                      {/* Property type badge */}
                      <div className="absolute top-3 left-3" aria-hidden="true">
                        <span className="bg-primary/90 backdrop-blur-sm text-white text-[10px] uppercase font-bold tracking-wide px-2.5 py-1 rounded-full shadow">
                          {property.propertyType?.replace('_', ' ')}
                        </span>
                      </div>
                      {/* Verified badge */}
                      <div className="absolute top-3 right-3" aria-hidden="true">
                        <span className="bg-accent text-white text-[10px] font-bold px-2 py-1 rounded-full shadow">
                          ✓ Verified
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4">
                      <h2 className="font-bold text-primary text-[15px] leading-snug truncate mb-1 group-hover:text-accent transition-colors" title={property.title}>
                        {property.title}
                      </h2>
                      <div className="flex items-center text-xs text-muted gap-1 mb-3">
                        <MapPin className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                        <span className="truncate">{property.ward}{property.district ? `, ${property.district}` : ''}</span>
                      </div>

                      {/* Stats row */}
                      {(beds || baths) && (
                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 border-t border-gray-50 pt-3">
                          {beds && (
                            <span className="flex items-center gap-1">
                              <Bed className="h-3.5 w-3.5" aria-hidden="true" />
                              <span><span className="sr-only">Bedrooms: </span>{beds} Bed{beds > 1 ? 's' : ''}</span>
                            </span>
                          )}
                          {baths && (
                            <span className="flex items-center gap-1">
                              <Bath className="h-3.5 w-3.5" aria-hidden="true" />
                              <span><span className="sr-only">Bathrooms: </span>{baths} Bath{baths > 1 ? 's' : ''}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Price */}
                      <div className="flex items-end justify-between">
                        <div>
                          {rent ? (
                            <>
                              <span className="text-lg font-bold text-accent" aria-label={`Rent: TZS ${rent.toLocaleString()} per month`}>
                                TZS {rent.toLocaleString()}
                              </span>
                              <span className="text-xs text-gray-400 ml-1">/mo</span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-400 italic">Price on request</span>
                          )}
                        </div>
                        <span className="text-xs text-accent font-semibold bg-green-50 px-2 py-1 rounded-lg group-hover:bg-accent group-hover:text-white transition-colors">
                          View →
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Floating Map Button (bottom-right) ── */}
      <button
        onClick={() => setIsMapOpen(true)}
        aria-label="Open map view"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-primary hover:bg-secondary text-white px-5 py-3.5 rounded-full shadow-2xl hover:shadow-primary/30 transition-all duration-200 hover:-translate-y-0.5 font-semibold text-sm"
      >
        <Map className="h-5 w-5" aria-hidden="true" />
        Show Map
      </button>

      {/* ── Map Overlay Modal ── */}
      {isMapOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Property location map"
          className="fixed inset-0 z-50 flex flex-col"
        >
          {/* Map Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="font-bold text-primary text-sm">
                {properties.filter(p => p.latitude && p.longitude).length} properties on map
              </span>
            </div>
            <button
              onClick={() => setIsMapOpen(false)}
              aria-label="Close map view"
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Close
            </button>
          </div>

          {/* Full Map */}
          <div className="flex-1 relative">
            <MapContainer
              center={[-6.7924, 39.2083]}
              zoom={12}
              className="w-full h-full"
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              {properties.map(property => {
                if (!property.latitude || !property.longitude) return null;
                const rent = property.units?.[0]?.monthlyRent;
                return (
                  <Marker
                    key={property.id}
                    position={[property.latitude, property.longitude]}
                    title={property.title}
                  >
                    <Popup closeButton={false}>
                      <div className="w-52 p-0 m-0">
                        {property.images?.[0]?.url ? (
                          <div className="h-28 w-full overflow-hidden rounded-t-lg">
                            <img src={property.images[0].url} alt={`${property.title} photo`} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-20 w-full bg-gray-100 flex items-center justify-center rounded-t-lg">
                            <Home className="h-6 w-6 text-gray-300" aria-hidden="true" />
                          </div>
                        )}
                        <div className="p-3 bg-white rounded-b-lg">
                          <h3 className="font-bold text-sm text-primary line-clamp-1 mb-0.5">{property.title}</h3>
                          <p className="text-xs text-muted flex items-center gap-1 mb-2">
                            <MapPin className="h-3 w-3" aria-hidden="true" />
                            {property.ward}
                          </p>
                          {rent && (
                            <p className="font-bold text-accent text-sm mb-2">
                              TZS {rent.toLocaleString()}<span className="text-[10px] text-gray-400 font-normal">/mo</span>
                            </p>
                          )}
                          <Link
                            to={`/properties/${property.id}`}
                            onClick={() => setIsMapOpen(false)}
                            className="block text-center bg-primary hover:bg-secondary text-white py-1.5 rounded-lg text-xs font-semibold transition-colors w-full"
                          >
                            View Details →
                          </Link>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
}
