import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { MapPin, Bed, Bath, Shield, CheckCircle, Home, User, Phone, Image as ImageIcon, X, Calendar } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
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

// UNDERSTANDABLE — Accessible toast notification (replaces alert())
function Toast({ message, type = 'info', onClose }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 px-5 py-4 rounded-xl shadow-xl max-w-sm text-sm font-medium transition-all ${
        type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
        type === 'error'   ? 'bg-red-50 text-red-800 border border-red-200' :
                             'bg-blue-50 text-blue-800 border border-blue-200'
      }`}
    >
      <span className="flex-1">{message}</span>
      <button onClick={onClose} aria-label="Dismiss notification" className="ml-2 text-gray-400 hover:text-gray-600">
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

// PERCEIVABLE — Accessible loading spinner
function LoadingSpinner({ label = 'Loading…' }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export default function PropertyDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [isViewingModalOpen, setIsViewingModalOpen] = useState(false);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/properties/${id}`);
      return response.data;
    }
  });

  if (isLoading) return <LoadingSpinner label="Loading property details…" />;

  if (error || !data?.data?.property) {
    return (
      <div className="text-center py-20" role="main">
        <h1 className="text-2xl font-bold text-gray-700 mb-4">Property not found</h1>
        <Link to="/search" className="text-accent hover:underline">← Back to search</Link>
      </div>
    );
  }

  const property = data.data.property;
  const primaryUnit = property.units?.[0];

  const applyForProperty = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Please log in as a tenant to apply for this property.', 'info');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    try {
      await axios.post(`${API_URL}/applications`, {
        propertyId: id,
        unitId: primaryUnit?.id,
        message: 'I am highly interested in renting this unit.'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Application submitted successfully! The landlord will review it shortly.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit application. Please try again.', 'error');
    }
  };

  const ownerName = `${(property.agent || property.owner)?.firstName || ''} ${(property.agent || property.owner)?.lastName || ''}`.trim();

  return (
    <div className="bg-background min-h-screen pb-20">

      {/* PERCEIVABLE — Accessible toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* PERCEIVABLE — Proper breadcrumb with aria-label + aria-current (WCAG 1.3.1) */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li aria-hidden="true"><span className="mx-1">/</span></li>
              <li><Link to="/properties" className="hover:text-primary transition-colors">Properties</Link></li>
              <li aria-hidden="true"><span className="mx-1">/</span></li>
              <li>
                <span className="text-primary font-medium truncate" aria-current="page">{property.title}</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <main className="w-full lg:w-2/3">

            {/* Header */}
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-primary mb-2">{property.title}</h1>
                <div className="flex items-center text-muted">
                  <MapPin className="h-4 w-4 mr-1 flex-shrink-0" aria-hidden="true" />
                  <address className="not-italic text-sm">
                    {property.address}, {property.ward}, {property.district}, {property.region}
                  </address>
                </div>
              </div>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                <span>Verified</span>
              </div>
            </div>

            {/* PERCEIVABLE — Image gallery with meaningful alt text (WCAG 1.1.1) */}
            <div className="rounded-2xl overflow-hidden mb-8 grid grid-cols-4 gap-2 h-96" role="img" aria-label={`Photo gallery for ${property.title}`}>
              {property.images && property.images.length > 0 ? (
                <>
                  <div className="col-span-4 md:col-span-3 h-full">
                    <img
                      src={property.images[0].url}
                      alt={`${property.title} — main photo`}
                      className="w-full h-full object-cover"
                      loading="eager"
                      decoding="async"
                    />
                  </div>
                  <div className="hidden md:flex col-span-1 flex-col gap-2 h-full">
                    {property.images[1] ? (
                      <img src={property.images[1].url} alt={`${property.title} — photo 2`} className="w-full h-1/2 object-cover" loading="lazy" decoding="async" />
                    ) : <div className="w-full h-1/2 bg-gray-200" aria-hidden="true" />}
                    {property.images[2] ? (
                      <img src={property.images[2].url} alt={`${property.title} — photo 3`} className="w-full h-1/2 object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-full h-1/2 flex items-center justify-center bg-gray-100" aria-hidden="true">
                        <ImageIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="col-span-4 bg-gray-200 h-full flex items-center justify-center" aria-label="No photos available">
                  <Home className="h-16 w-16 text-gray-400" aria-hidden="true" />
                </div>
              )}
            </div>

            {/* Quick Stats */}
            {primaryUnit && (
              <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8 divide-x divide-gray-100" role="list" aria-label="Property quick statistics">
                <div className="flex-1 flex flex-col items-center justify-center p-2" role="listitem">
                  <Bed className="h-6 w-6 text-muted mb-1" aria-hidden="true" />
                  <span className="font-semibold text-primary">{primaryUnit.bedrooms} Beds</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-2" role="listitem">
                  <Bath className="h-6 w-6 text-muted mb-1" aria-hidden="true" />
                  <span className="font-semibold text-primary">{primaryUnit.bathrooms} Baths</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-2" role="listitem">
                  <Home className="h-6 w-6 text-muted mb-1" aria-hidden="true" />
                  <span className="font-semibold text-primary">{property.propertyType}</span>
                </div>
              </div>
            )}

            {/* Description */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8" aria-labelledby="desc-heading">
              <h2 id="desc-heading" className="text-xl font-bold text-primary mb-4">About this property</h2>
              <p className="text-gray-600 leading-relaxed">{property.description}</p>
            </section>

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8" aria-labelledby="amenities-heading">
                <h2 id="amenities-heading" className="text-xl font-bold text-primary mb-4">Amenities</h2>
                <ul className="grid grid-cols-2 md:grid-cols-3 gap-y-4">
                  {property.amenities.map(pa => (
                    <li key={pa.amenity.id} className="flex items-center text-gray-700">
                      <CheckCircle className="h-5 w-5 text-accent mr-3 flex-shrink-0" aria-hidden="true" />
                      <span>{pa.amenity.name}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Units — PERCEIVABLE: status not color-only (WCAG 1.4.1) */}
            {property.units?.length > 0 && (
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8" aria-labelledby="units-heading">
                <h2 id="units-heading" className="text-xl font-bold text-primary mb-4">Available Units</h2>
                <ul className="space-y-4">
                  {property.units.map(unit => (
                    <li key={unit.id} className="border border-gray-200 rounded-xl p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg text-primary">Unit {unit.unitNumber}</h3>
                        <div className="text-sm text-gray-500 flex space-x-3 mt-1">
                          <span>{unit.bedrooms} Beds</span>
                          <span>{unit.bathrooms} Baths</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xl text-accent">TZS {unit.monthlyRent?.toLocaleString()}</div>
                        {/* PERCEIVABLE — Status with icon + text, not color alone (WCAG 1.4.1) */}
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full uppercase mt-1 ${
                          unit.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {unit.status === 'AVAILABLE' ? (
                            <><CheckCircle className="h-3 w-3" aria-hidden="true" /> Available</>
                          ) : (
                            <><span aria-hidden="true">✕</span> {unit.status}</>
                          )}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </main>

          {/* Sidebar */}
          <aside className="w-full lg:w-1/3 space-y-6" aria-label="Property actions and contact">

            {/* Rent + Action Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-24">
              {primaryUnit ? (
                <>
                  <div className="mb-4">
                    <span className="text-sm text-gray-500 block mb-1">Rent starting from</span>
                    <div className="text-3xl font-bold text-primary flex items-end">
                      TZS {primaryUnit.monthlyRent?.toLocaleString()}
                      <span className="text-base text-gray-500 font-normal ml-1">/month</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-2">Security Deposit: TZS {primaryUnit.securityDeposit?.toLocaleString()}</div>
                  </div>

                  <div className="space-y-3 mt-6">
                    <button
                      onClick={applyForProperty}
                      className="w-full bg-accent hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md"
                      aria-describedby="apply-desc"
                    >
                      Apply Now
                    </button>
                    <span id="apply-desc" className="sr-only">Submit a rental application for {property.title}</span>

                    {/* OPERABLE — "Request a Viewing" now opens a modal (WCAG 4.1.2) */}
                    <button
                      onClick={() => setIsViewingModalOpen(true)}
                      className="w-full bg-white border-2 border-primary hover:bg-gray-50 text-primary font-bold py-3 px-4 rounded-xl transition-colors"
                    >
                      <Calendar className="inline h-4 w-4 mr-2" aria-hidden="true" />
                      Request a Viewing
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-gray-500">Price details not available</div>
              )}
            </div>

            {/* Contact Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-lg mb-4">Listed by</h2>
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-14 w-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {(property.agent || property.owner)?.profileImage ? (
                    <img
                      src={(property.agent || property.owner).profileImage}
                      alt={`Profile photo of ${ownerName}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-gray-400" aria-hidden="true" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-primary text-lg">{ownerName || 'Property Owner'}</div>
                  <div className="text-sm text-gray-500">{property.agent ? 'Real Estate Agent' : 'Property Owner'}</div>
                </div>
              </div>
              <a
                href={`tel:${(property.agent || property.owner)?.phone}`}
                aria-label={`Call ${ownerName}`}
                className="w-full flex items-center justify-center space-x-2 bg-blue-50 text-blue-700 font-semibold py-3 px-4 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <Phone className="h-5 w-5" aria-hidden="true" />
                <span>Show Phone Number</span>
              </a>
            </div>

            {/* ROBUST — Map with aria-label + OSM attribution (Legal requirement) */}
            {property.latitude && property.longitude && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 h-64 overflow-hidden relative">
                <div className="absolute top-4 left-4 z-[1000] bg-white px-3 py-1 rounded shadow-md text-xs font-bold text-primary" aria-hidden="true">Location</div>
                <MapContainer
                  center={[property.latitude, property.longitude]}
                  zoom={14}
                  scrollWheelZoom={false}
                  className="w-full h-full rounded-xl z-0"
                  zoomControl={false}
                  aria-label={`Map showing location of ${property.title} in ${property.district}, ${property.region}`}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  />
                  <Marker
                    position={[property.latitude, property.longitude]}
                    title={`${property.title} location marker`}
                  />
                </MapContainer>
              </div>
            )}

            <div className="text-center">
              <button
                className="text-sm text-red-500 hover:underline flex items-center justify-center w-full"
                aria-label={`Report ${property.title} as suspicious or fraudulent`}
              >
                <Shield className="h-4 w-4 mr-1" aria-hidden="true" />
                Report this property
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Request a Viewing Modal */}
      {isViewingModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="viewing-modal-title"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 id="viewing-modal-title" className="text-xl font-bold text-primary">Request a Viewing</h2>
              <button onClick={() => setIsViewingModalOpen(false)} aria-label="Close viewing request dialog" className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <p className="text-gray-500 text-sm mb-4">Contact the landlord to schedule a viewing of <strong>{property.title}</strong>.</p>
            <div className="space-y-3">
              <a
                href={`tel:${(property.agent || property.owner)?.phone}`}
                className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-secondary transition-colors"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                Call {ownerName || 'Owner'}
              </a>
              <button onClick={() => setIsViewingModalOpen(false)} className="w-full py-3 border border-gray-300 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
