import { Search, SlidersHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function FilterBar({ filters, setFilters }) {
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: localSearch }));
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, setFilters]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10" role="search" aria-label="Filter rental properties">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center">

        {/* Search input — ROBUST: labelled (WCAG 4.1.2) */}
        <div className="relative w-full md:w-96 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" aria-hidden="true">
            <Search className="h-5 w-5 text-slate-400" aria-hidden="true" />
          </div>
          <label htmlFor="filterbar-search" className="sr-only">
            Search by property title or location
          </label>
          <input
            id="filterbar-search"
            type="search"
            name="search"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent sm:text-sm transition-colors"
            placeholder="Search by title, location..."
            autoComplete="off"
          />
        </div>

        {/* Filter Controls — ROBUST: all labelled (WCAG 4.1.2) */}
        <div className="flex gap-3 overflow-x-auto w-full pb-2 md:pb-0">
          <div>
            <label htmlFor="filterbar-type" className="sr-only">Filter by property type</label>
            <select
              id="filterbar-type"
              name="propertyType"
              value={filters.propertyType || ''}
              onChange={handleChange}
              className="shrink-0 bg-white border border-slate-300 text-slate-700 py-2 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Any Type</option>
              <option value="APARTMENT">Apartment</option>
              <option value="HOUSE">House</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="ROOM">Room</option>
            </select>
          </div>

          <div>
            <label htmlFor="filterbar-beds" className="sr-only">Filter by minimum number of bedrooms</label>
            <select
              id="filterbar-beds"
              name="bedrooms"
              value={filters.bedrooms || ''}
              onChange={handleChange}
              className="shrink-0 bg-white border border-slate-300 text-slate-700 py-2 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Any Beds</option>
              <option value="1">1+ Beds</option>
              <option value="2">2+ Beds</option>
              <option value="3">3+ Beds</option>
              <option value="4">4+ Beds</option>
            </select>
          </div>

          <div>
            <label htmlFor="filterbar-rent" className="sr-only">Filter by maximum monthly rent in Tanzanian Shillings</label>
            <select
              id="filterbar-rent"
              name="maxRent"
              value={filters.maxRent || ''}
              onChange={handleChange}
              className="shrink-0 bg-white border border-slate-300 text-slate-700 py-2 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Any Price</option>
              <option value="500000">Up to TZS 500k</option>
              <option value="1000000">Up to TZS 1M</option>
              <option value="2000000">Up to TZS 2M</option>
              <option value="5000000">Up to TZS 5M</option>
            </select>
          </div>

          <button
            className="shrink-0 flex items-center justify-center bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors ml-auto md:ml-0"
            aria-label="Open more filter options"
            type="button"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" aria-hidden="true" />
            More Filters
          </button>
        </div>
      </div>
    </div>
  );
}
