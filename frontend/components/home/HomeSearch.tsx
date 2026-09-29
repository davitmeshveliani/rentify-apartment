'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface LocationSuggestion {
  place_id?: string | number;
  display_name: string;
  lat: string;
  lon: string;
}

export default function HomeSearch() {
  const router = useRouter();

  const [location, setLocation] = useState('');
  const [selectedLocation, setSelectedLocation] =
    useState<LocationSuggestion | null>(null);

  const [suggestions, setSuggestions] = useState<
    LocationSuggestion[]
  >([]);

  const [showSuggestions, setShowSuggestions] =
    useState(false);

  const [loadingSuggestions, setLoadingSuggestions] =
    useState(false);

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  const [guests, setGuests] = useState(1);

  const locationRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        locationRef.current &&
        !locationRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  useEffect(() => {
    const trimmedLocation = location.trim();

    if (
      trimmedLocation.length < 2 ||
      selectedLocation?.display_name === location
    ) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);

        const params = new URLSearchParams({
          q: trimmedLocation,
          format: 'jsonv2',
          addressdetails: '1',
          limit: '5',
        });

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`,
          {
            signal: controller.signal,
            headers: {
              Accept: 'application/json',
              'User-Agent': 'Rentify/1.0',
            },
          }
        );

        if (!response.ok) {
          setSuggestions([]);
          return;
        }

        const data =
          (await response.json()) as LocationSuggestion[];

        setSuggestions(
          Array.isArray(data) ? data : []
        );

        setShowSuggestions(true);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === 'AbortError'
        ) {
          return;
        }

        console.error(
          'Failed to search location:',
          error
        );

        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 350);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [location, selectedLocation]);

  const handleLocationSelect = (
    suggestion: LocationSuggestion
  ) => {
    setLocation(suggestion.display_name);
    setSelectedLocation(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    setSelectedLocation(null);

    if (value.trim().length >= 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleGuestsChange = (value: number) => {
    const nextValue = Math.min(
      20,
      Math.max(1, value)
    );

    setGuests(nextValue);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (location.trim()) {
      params.set('city', location.trim());
      params.set('location', location.trim());
    }

    if (checkIn) {
      params.set('check_in', checkIn);
    }

    if (checkOut) {
      params.set('check_out', checkOut);
    }

    params.set('guests', String(guests));

    if (selectedLocation) {
      params.set('lat', selectedLocation.lat);
      params.set('lon', selectedLocation.lon);
      params.set(
        'location',
        selectedLocation.display_name
      );
    }

    router.push(`/search?${params.toString()}`);
  };

  return (
    <section className="relative z-20 mx-auto w-full max-w-[1600px] px-2 sm:px-4 lg:px-6">
      <div className="overflow-visible rounded-[30px] border border-gray-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
        <div className="p-3 sm:p-4">
          <div className="grid grid-cols-1 overflow-visible rounded-[28px] border border-gray-200 bg-white lg:grid-cols-[1.45fr_0.9fr_0.9fr_0.85fr_auto]">
            {/* Location */}
            <div
              ref={locationRef}
              className="relative"
            >
              <div className="flex min-h-[82px] flex-col justify-center rounded-[20px] px-5 py-4 transition hover:bg-gray-50 lg:min-h-[92px]">
                <label
                  htmlFor="rentify-location"
                  className="mb-1 text-lg font-bold uppercase tracking-[0.14em] text-gray-500"
                >
                  Where
                </label>

                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-6 w-6"
                    >
                      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                      <circle
                        cx="12"
                        cy="10"
                        r="2.5"
                      />
                    </svg>
                  </div>

                  <input
                    id="rentify-location"
                    type="text"
                    value={location}
                    onChange={(event) =>
                      handleLocationChange(
                        event.target.value
                      )
                    }
                    onFocus={() => {
                      if (
                        location.trim().length >= 2
                      ) {
                        setShowSuggestions(true);
                      }
                    }}
                    placeholder="Search destinations"
                    autoComplete="off"
                    className="w-full min-w-0 bg-transparent text-lg font-semibold text-gray-900 outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>

              {showSuggestions &&
                (loadingSuggestions ||
                  suggestions.length > 0) && (
                  <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-2xl">
                    {loadingSuggestions && (
                      <div className="px-4 py-4 text-lg text-gray-500">
                        Searching locations...
                      </div>
                    )}

                    {!loadingSuggestions &&
                      suggestions.map(
                        (
                          suggestion,
                          index
                        ) => (
                          <button
                            key={`${suggestion.place_id ?? suggestion.lat}-${suggestion.lon}-${index}`}
                            type="button"
                            onClick={() =>
                              handleLocationSelect(
                                suggestion
                              )
                            }
                            className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-gray-50"
                          >
                            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="h-5 w-5"
                              >
                                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                                <circle
                                  cx="12"
                                  cy="10"
                                  r="2.5"
                                />
                              </svg>
                            </span>

                            <span className="line-clamp-2 pt-1 text-lg font-medium text-gray-800">
                              {suggestion.display_name}
                            </span>
                          </button>
                        )
                      )}
                  </div>
                )}
            </div>

            {/* Check-in */}
            <div className="border-t border-gray-200 lg:border-l lg:border-t-0">
              <div className="flex min-h-[82px] flex-col justify-center rounded-[20px] px-5 py-4 transition hover:bg-gray-50 lg:min-h-[92px]">
                <label
                  htmlFor="rentify-check-in"
                  className="mb-1 text-lg font-bold uppercase tracking-[0.14em] text-gray-500"
                >
                  Check in
                </label>

                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-6 w-6"
                    >
                      <rect
                        x="3"
                        y="4"
                        width="18"
                        height="17"
                        rx="2"
                      />
                      <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                  </div>

                  <input
                    id="rentify-check-in"
                    type="date"
                    value={checkIn}
                    onChange={(event) =>
                      setCheckIn(event.target.value)
                    }
                    className="w-full min-w-0 bg-transparent text-lg font-semibold text-gray-900 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Check-out */}
            <div className="border-t border-gray-200 lg:border-l lg:border-t-0">
              <div className="flex min-h-[90px] flex-col justify-center rounded-[20px] px-5 py-4 transition hover:bg-gray-50 lg:min-h-[100px]">
                <label
                  htmlFor="rentify-check-out"
                  className="mb-1 text-lg font-bold uppercase tracking-[0.14em] text-gray-500"
                >
                  Check out
                </label>

                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-6 w-6"
                    >
                      <rect
                        x="3"
                        y="4"
                        width="18"
                        height="17"
                        rx="2"
                      />
                      <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                  </div>

                  <input
                    id="rentify-check-out"
                    type="date"
                    value={checkOut}
                    min={checkIn || undefined}
                    onChange={(event) =>
                      setCheckOut(event.target.value)
                    }
                    className="w-full min-w-0 bg-transparent text-lg font-semibold text-gray-900 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Guests */}
            <div className="border-t border-gray-200 lg:border-l lg:border-t-0">
              <div className="flex min-h-[82px] flex-col justify-center rounded-[20px] px-5 py-4 transition hover:bg-gray-50 lg:min-h-[92px]">
                <label className="mb-1 text-lg font-bold uppercase tracking-[0.14em] text-gray-500">
                  Guests
                </label>

                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-6 w-6"
                    >
                      <circle
                        cx="9"
                        cy="8"
                        r="3"
                      />
                      <path d="M3 20a6 6 0 0 1 12 0" />
                      <path d="M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4" />
                    </svg>
                  </div>

                  <div className="flex min-w-0 w-full items-center justify-between gap-2">
                    <span className="truncate text-lg font-semibold text-gray-900">
                      {guests}{' '}
                      {guests === 1
                        ? 'guest'
                        : 'guests'}
                    </span>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleGuestsChange(
                            guests - 1
                          )
                        }
                        disabled={guests <= 1}
                        aria-label="Decrease guests"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-lg text-gray-700 transition hover:border-gray-300 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        −
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleGuestsChange(
                            guests + 1
                          )
                        }
                        disabled={guests >= 20}
                        aria-label="Increase guests"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-lg text-gray-700 transition hover:border-gray-300 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search button */}
            <div className="border-t border-gray-200 p-2 lg:border-l lg:border-t-0">
              <button
                type="button"
                onClick={handleSearch}
                className="flex min-h-[76px] w-full items-center justify-center gap-2 rounded-[20px] bg-emerald-600 px-5 text-lg font-bold text-white shadow-lg shadow-emerald-600/20 transition duration-200 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/25 active:scale-[0.98] lg:min-h-[76px] lg:min-w-[125px]"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="h-6 w-6 shrink-0"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                  />
                  <path d="m20 20-4-4" />
                </svg>

                <span className="whitespace-nowrap">
                  Search
                </span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
