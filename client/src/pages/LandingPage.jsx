import { motion, useReducedMotion } from 'framer-motion'
import { Search, MapPin, Home, Key, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function LandingPage() {
  const shouldReduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('');

  // OPERABLE — Respect reduced motion (WCAG 2.3.3)
  const fadeUp = shouldReduceMotion
    ? {}
    : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set('search', location);
    if (propertyType) params.set('propertyType', propertyType);
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-secondary text-white py-20 lg:py-32 overflow-hidden" aria-labelledby="hero-heading">
        {/* PERCEIVABLE — Decorative image with empty alt (WCAG 1.1.1) */}
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80"
            alt=""
            role="presentation"
            className="w-full h-full object-cover opacity-20"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-transparent opacity-90" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center md:items-start text-center md:text-left">
          <motion.h1
            id="hero-heading"
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-3xl"
          >
            FIND A PLACE <br className="hidden md:block" />
            <span className="text-accent">YOU'LL LOVE TO CALL HOME.</span>
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 0.1 }}
            className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl"
          >
            Discover verified properties, connect with trusted landlords and manage your rental experience from one platform.
          </motion.p>

          {/* PERCEIVABLE + UNDERSTANDABLE — Labelled search form (WCAG 1.3.1, 4.1.2) */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 0.2 }}
            className="w-full max-w-4xl"
          >
            <form
              onSubmit={handleSearch}
              role="search"
              aria-label="Search for rental properties"
              className="bg-white rounded-xl p-4 md:p-6 shadow-2xl flex flex-col md:flex-row gap-4"
            >
              {/* Location Input */}
              <div className="flex-1 border-b md:border-b-0 md:border-r border-gray-200 pb-4 md:pb-0 md:pr-4 flex items-center">
                <label htmlFor="hero-location" className="sr-only">Location — neighbourhood or area</label>
                <MapPin className="text-muted mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                <input
                  id="hero-location"
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Where? (e.g. Masaki, Upanga)"
                  className="w-full text-primary placeholder-gray-400 bg-transparent focus:outline-none"
                  autoComplete="address-level2"
                />
              </div>

              {/* Property Type Select */}
              <div className="flex-1 border-b md:border-b-0 md:border-r border-gray-200 pb-4 md:pb-0 md:px-4 flex items-center">
                <label htmlFor="hero-type" className="sr-only">Property type</label>
                <Home className="text-muted mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                <select
                  id="hero-type"
                  value={propertyType}
                  onChange={e => setPropertyType(e.target.value)}
                  className="w-full text-primary bg-transparent appearance-none focus:outline-none"
                >
                  <option value="">Property Type</option>
                  <option value="APARTMENT">Apartment</option>
                  <option value="HOUSE">House</option>
                  <option value="VILLA">Villa</option>
                  <option value="COMMERCIAL">Commercial</option>
                  <option value="OFFICE">Office</option>
                </select>
              </div>

              {/* Price Range — display only */}
              <div className="flex-1 pb-4 md:pb-0 md:px-4 flex items-center" aria-hidden="true">
                <span className="text-primary font-medium w-full select-none">TZS 100k - 5M+</span>
              </div>

              <button
                type="submit"
                className="bg-accent hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center justify-center transition-colors shadow-lg"
              >
                <Search className="mr-2 h-5 w-5" aria-hidden="true" />
                Search
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background" aria-labelledby="features-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 id="features-heading" className="text-3xl font-bold text-primary mb-4">Why SmartRent TZ?</h2>
            <p className="text-muted max-w-2xl mx-auto">We're transforming the rental experience in Tanzania with technology, transparency, and trust.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <ShieldCheck className="h-7 w-7 text-accent" aria-hidden="true" />,
                bg: 'bg-green-100',
                title: 'Verified Listings',
                desc: 'No more fake photos or scams. Every property and landlord on our platform is verified by our team.'
              },
              {
                icon: <Home className="h-7 w-7 text-blue-600" aria-hidden="true" />,
                bg: 'bg-blue-100',
                title: 'End-to-End Management',
                desc: 'From property discovery and viewings to lease signing and rent payments—all in one place.'
              },
              {
                icon: <Key className="h-7 w-7 text-purple-600" aria-hidden="true" />,
                bg: 'bg-purple-100',
                title: 'Seamless Experience',
                desc: "Request maintenance, track payments, and communicate easily whether you're a tenant or landlord."
              }
            ].map(({ icon, bg, title, desc }) => (
              <div key={title} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className={`w-14 h-14 ${bg} rounded-xl flex items-center justify-center mb-6`}>
                  {icon}
                </div>
                <h3 className="text-xl font-semibold text-primary mb-3">{title}</h3>
                <p className="text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white" aria-labelledby="cta-heading">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 id="cta-heading" className="text-3xl md:text-4xl font-bold mb-6">Ready to simplify your rental journey?</h2>
          <p className="text-gray-300 text-lg mb-10">Join thousands of Tanzanians already using SmartRent TZ.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              aria-label="Get started for free — create your SmartRent TZ account"
              className="bg-accent hover:bg-green-600 px-8 py-4 rounded-lg font-semibold text-lg transition-colors shadow-lg"
            >
              Get Started for Free
            </Link>
            <Link
              to="/properties"
              aria-label="Browse all rental properties on SmartRent TZ"
              className="bg-secondary hover:bg-gray-700 border border-gray-600 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Browse Properties
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
