'use client';

import { useState } from 'react';

interface SearchProps {
  city: string;
  setCity: (value: string) => void;

  propertyType: string;
  setPropertyType: (value: string) => void;

  selectedRooms: string;
  setSelectedRooms: (value: string) => void;

  minPrice: string;
  setMinPrice: (value: string) => void;

  maxPrice: string;
  setMaxPrice: (value: string) => void;

  listingId: string;
  setListingId: (value: string) => void;

  minRating: string;
  setMinRating: (value: string) => void;

  ordering: string;
  setOrdering: (value: string) => void;

  priceError: string;
  setPriceError: (value: string) => void;

  onSearch: (e: React.FormEvent) => void;
}

export default function Search({
  city,
  setCity,
  propertyType,
  setPropertyType,
  selectedRooms,
  setSelectedRooms,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  listingId,
  setListingId,
  minRating,
  setMinRating,
  ordering,
  setOrdering,
  priceError,
  setPriceError,
  onSearch,
}: SearchProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const handleMinPriceChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;

    if (value === '' || Number(value) >= 0) {
      setMinPrice(value);

      if (priceError) {
        setPriceError('');
      }
    }
  };

  const handleMaxPriceChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;

    if (value === '' || Number(value) >= 0) {
      setMaxPrice(value);

      if (priceError) {
        setPriceError('');
      }
    }
  };

  return (
    <>
      <form
        onSubmit={onSearch}
        className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg"
      >
        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-5">

          {/* Filters */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-4">

            {/* City */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-600">
                City
              </label>

              <input
                type="text"
                placeholder="e.g. Berlin"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-gray-900 placeholder-gray-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Property Type */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-600">
                Type
              </label>

              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-gray-900 transition focus:border-emerald-500 focus:bg-white focus:outline-none"
              >
                <option value="">All Types</option>
                <option value="apartment">Apartment</option>
                <option value="studio">Studio</option>
                <option value="house">House</option>
              </select>
            </div>

            {/* Rooms */}
            <div className="relative">
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-600">
                Rooms
              </label>

              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex h-12 w-full cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 text-left text-gray-900 transition focus:border-emerald-500 focus:bg-white focus:outline-none"
              >
                <span>
                  {selectedRooms
                    ? `${selectedRooms} Rooms`
                    : 'Any rooms'}
                </span>

                <span className="text-gray-400">▼</span>
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 top-full z-50 mt-2 flex w-full flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-xl">

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRooms('');
                      setIsDropdownOpen(false);
                    }}
                    className="cursor-pointer rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-100"
                  >
                    Any rooms
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRooms('1');
                      setIsDropdownOpen(false);
                    }}
                    className="cursor-pointer rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-100"
                  >
                    1 Room
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRooms('2');
                      setIsDropdownOpen(false);
                    }}
                    className="cursor-pointer rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-100"
                  >
                    2 Rooms
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRooms('3');
                      setIsDropdownOpen(false);
                    }}
                    className="cursor-pointer rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-100"
                  >
                    3 Rooms
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRooms('4');
                      setIsDropdownOpen(false);
                    }}
                    className="cursor-pointer rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-100"
                  >
                    4 Rooms
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRooms('5');
                      setIsDropdownOpen(false);
                    }}
                    className="cursor-pointer rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-100"
                  >
                    5+ Rooms
                  </button>

                </div>
              )}
            </div>

            {/* Min Price */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-600">
                Min Price (€)
              </label>

              <input
                type="number"
                min="0"
                placeholder="e.g. 300"
                value={minPrice}
                onChange={handleMinPriceChange}
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-gray-900 placeholder-gray-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Max Price */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-600">
                Max Price (€)
              </label>

              <input
                type="number"
                min="0"
                placeholder="e.g. 1500"
                value={maxPrice}
                onChange={handleMaxPriceChange}
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-gray-900 placeholder-gray-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Listing ID */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-600">
                Listing ID
              </label>

              <input
                type="text"
                placeholder="UUID"
                value={listingId}
                onChange={(e) => setListingId(e.target.value)}
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-gray-900 placeholder-gray-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Min Rating */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-600">
                Min Rating
              </label>

              <select
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-gray-900 transition focus:border-emerald-500 focus:bg-white focus:outline-none"
              >
                <option value="">Any Rating</option>
                <option value="1">1.0+</option>
                <option value="2">2.0+</option>
                <option value="3">3.0+</option>
                <option value="4">4.0+</option>
                <option value="5">5.0</option>
              </select>
            </div>

            {/* Sort Price */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-600">
                Sort Price
              </label>

              <select
                value={ordering}
                onChange={(e) => setOrdering(e.target.value)}
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-gray-900 transition focus:border-emerald-500 focus:bg-white focus:outline-none"
              >
                <option value="">Default</option>
                <option value="price">Low to High</option>
                <option value="-price">High to Low (-1)</option>
              </select>
            </div>

          </div>

          {/* Search */}
          <div className="flex items-stretch lg:col-span-1">
            <button
              type="submit"
              className="min-h-[108px] w-full cursor-pointer rounded-xl bg-emerald-600 px-6 font-medium text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-500"
            >
              Search
            </button>
          </div>

        </div>
      </form>

      {/* Price Error */}
      {priceError && (
        <div className="mb-8 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <span>⚠️</span>
          {priceError}
        </div>
      )}
    </>
  );
}