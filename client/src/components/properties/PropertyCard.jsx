import { MapPin, BedDouble, Bath, Image as ImageIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

export default function PropertyCard({ property }) {
  const { title, address, propertyType, images, units } = property;
  const mainImage = images && images.length > 0 ? images[0].url : null;
  const shouldReduceMotion = useReducedMotion();

  let rentDisplay = 'Price on Request';
  let bedDisplay = '-';
  let bathDisplay = '-';

  if (units && units.length > 0) {
    const rents = units.map(u => u.monthlyRent).filter(Boolean);
    if (rents.length > 0) {
      const minRent = Math.min(...rents);
      rentDisplay = `TZS ${minRent.toLocaleString()}`;
    }
    const beds = units.map(u => u.bedrooms).filter(Boolean);
    if (beds.length > 0) bedDisplay = Math.max(...beds);
    const baths = units.map(u => u.bathrooms).filter(Boolean);
    if (baths.length > 0) bathDisplay = Math.max(...baths);
  }

  // OPERABLE — Respect reduced motion (WCAG 2.3.3)
  const motionProps = shouldReduceMotion
    ? {}
    : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

  return (
    <motion.article
      {...motionProps}
      className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group"
    >
      {/* PERCEIVABLE — Meaningful alt text on property image (WCAG 1.1.1) */}
      <div className="relative h-48 w-full bg-slate-100">
        {mainImage ? (
          <img
            src={mainImage}
            alt={`${title} — property photo`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400" aria-label="No photo available">
            <ImageIcon className="w-10 h-10 mb-2" aria-hidden="true" />
            <span className="text-sm">No Image Available</span>
          </div>
        )}
        {/* PERCEIVABLE — Property type badge is decorative context */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-md text-xs font-medium shadow-sm" aria-hidden="true">
          {propertyType.replace('_', ' ')}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg text-slate-900 truncate" title={title}>
          {title}
        </h3>

        <div className="flex items-center text-slate-500 mt-1.5 text-sm">
          <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0" aria-hidden="true" />
          <span className="truncate" title={address}>{address}</span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          {/* PERCEIVABLE — Icon + text labels for beds/baths (not icon alone) */}
          <div className="flex gap-4" role="list" aria-label="Unit details">
            <div className="flex items-center text-slate-600 text-sm" role="listitem">
              <BedDouble className="w-4 h-4 mr-1.5 text-slate-400" aria-hidden="true" />
              <span><span className="sr-only">Bedrooms: </span>{bedDisplay}</span>
            </div>
            <div className="flex items-center text-slate-600 text-sm" role="listitem">
              <Bath className="w-4 h-4 mr-1.5 text-slate-400" aria-hidden="true" />
              <span><span className="sr-only">Bathrooms: </span>{bathDisplay}</span>
            </div>
          </div>
          <div className="font-semibold text-accent" aria-label={`Rent: ${rentDisplay} per month`}>
            {rentDisplay}<span className="text-xs font-normal text-slate-500" aria-hidden="true">/mo</span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
