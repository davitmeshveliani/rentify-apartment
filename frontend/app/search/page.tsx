'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Link from 'next/link';

import { api } from '@/services/api';
import { Apartment } from '@/types/listing';

import type { MapLocation } from '@/components/home/LocationMap';

import { geocodeCity } from './locationUtils';

import {
  findAlternativeListings,
  type ApartmentWithCoordinates,
} from './alternativeListings';

const LocationMap = dynamic(
  () => import('@/components/home/LocationMap'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-500">
        Loading map...
      </div>
    ),
  }
);

interface ListingsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApartmentWithCoordinates[];
}

type Radius = 1 | 2 | 3 | 5 | 10 | 20 | 50;

const RADIUS_OPTIONS: Radius[] = [
  1,
  2,
  3,
  5,
  10,
  20,
  50,
];

const PAGE_SIZE = 10;

function getDisplayImage(item: Apartment) {
  return (
    item.main_image ||
    (item.images && item.images.length > 0
      ? typeof item.images[0] === 'string'
        ? item.images[0]
        : item.images[0].image
      : '')
  );
}

export default function SearchPage() {
  const [listings, setListings] = useState<
    ApartmentWithCoordinates[]
  >([]);

  const [
    alternativeListings,
    setAlternativeListings,
  ] = useState<ApartmentWithCoordinates[]>([]);

  const [
    alternativeDistances,
    setAlternativeDistances,
  ] = useState<Record<string, number>>({});

  const [loading, setLoading] =
    useState(true);

  const [
    alternativesLoading,
    setAlternativesLoading,
  ] = useState(false);

  const [error, setError] =
    useState('');

  const [
    selectedLocation,
    setSelectedLocation,
  ] = useState<MapLocation | null>(null);

  const [
    selectedAddress,
    setSelectedAddress,
  ] = useState('');

  const [radius, setRadius] =
    useState<Radius>(3);

  const [
    hasSearchedAlternatives,
    setHasSearchedAlternatives,
  ] = useState(false);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [totalListings, setTotalListings] =
    useState(0);

  const totalPages = Math.ceil(
    totalListings / PAGE_SIZE
  );

  const loadAllListings = async () => {
    const allListings: ApartmentWithCoordinates[] =
      [];

    let nextUrl: string | null =
      '/api/listings/?page_size=100';

    while (nextUrl) {
      const response = await api.get(nextUrl);

      const data =
        response.data as ListingsResponse;

      if (Array.isArray(data.results)) {
        allListings.push(...data.results);
      }

      if (!data.next) {
        nextUrl = null;
        continue;
      }

      try {
        const next = new URL(data.next);

        nextUrl =
          `${next.pathname}${next.search}`;
      } catch {
        nextUrl = null;
      }
    }

    return allListings;
  };

  const searchAlternatives = async () => {
    if (!selectedLocation) {
      return;
    }

    try {
      setAlternativesLoading(true);
      setHasSearchedAlternatives(false);

      const allListings =
        await loadAllListings();

      /*
       * Keep the listings that already match
       * the current search separate.
       *
       * These listings must not appear again
       * inside Alternative stays.
       */
      const matchingListingIds =
        new Set(
          listings.map((listing) =>
            String(listing.id)
          )
        );

      const results =
        await findAlternativeListings(
          allListings,
          selectedLocation,
          radius,
          matchingListingIds
        );

      const alternatives =
        results.map(
          (result) => result.listing
        );

      const distanceMap: Record<
        string,
        number
      > = {};

      results.forEach((result) => {
        distanceMap[
          String(result.listing.id)
        ] = result.distance;
      });

      setAlternativeListings(
        alternatives
      );

      setAlternativeDistances(
        distanceMap
      );

      setHasSearchedAlternatives(true);
    } catch (err) {
      console.error(
        'Failed to search nearby alternatives:',
        err
      );

      setAlternativeListings([]);
      setAlternativeDistances({});
      setHasSearchedAlternatives(true);
    } finally {
      setAlternativesLoading(false);
    }
  };

  const loadResults = async (
    page = 1,
    restoreLocation = false
  ) => {
    try {
      setLoading(true);
      setError('');

      setListings([]);
      setAlternativeListings([]);
      setAlternativeDistances({});
      setHasSearchedAlternatives(false);

      const searchParams =
        new URLSearchParams(
          window.location.search
        );

      const city =
        searchParams.get('city')?.trim() ||
        '';

      const propertyType =
        searchParams.get(
          'property_type'
        ) || '';

      const rooms =
        searchParams.get('rooms') || '';

      const minPrice =
        searchParams.get('min_price') || '';

      const maxPrice =
        searchParams.get('max_price') || '';

      const listingId =
        searchParams.get('listing_id') || '';

      const minRating =
        searchParams.get('min_rating') || '';

      const ordering =
        searchParams.get('ordering') || '';

      const savedLocation =
        searchParams.get('location') || '';

      const urlLat =
        searchParams.get('lat');

      const urlLon =
        searchParams.get('lon');

      const params = new URLSearchParams();

      if (city) {
        params.set('city', city);
      }

      if (propertyType) {
        params.set(
          'property_type',
          propertyType
        );
      }

      if (rooms) {
        params.set('min_rooms', rooms);
        params.set('max_rooms', rooms);
      }

      if (minPrice) {
        params.set(
          'min_price',
          minPrice
        );
      }

      if (maxPrice) {
        params.set(
          'max_price',
          maxPrice
        );
      }

      if (ordering) {
        params.set(
          'ordering',
          ordering
        );
      }

      params.set(
        'page',
        String(page)
      );

      params.set(
        'page_size',
        String(PAGE_SIZE)
      );

      const response =
        await api.get<ListingsResponse>(
          '/api/listings/',
          { params }
        );

      const data = response.data;

      let results: ApartmentWithCoordinates[] =
        [];

      let count = 0;

      if (Array.isArray(data)) {
        results = data;
        count = data.length;
      } else if (
        Array.isArray(data.results)
      ) {
        results = data.results;
        count = Number(data.count || 0);
      }

      if (listingId) {
        results = results.filter(
          (listing) =>
            String(listing.id)
              .toLowerCase() ===
            listingId.toLowerCase()
        );

        count = results.length;
      }

      if (minRating) {
        const minimumRating =
          Number(minRating);

        results = results.filter(
          (listing) =>
            Number(
              listing.average_rating ?? 0
            ) >= minimumRating
        );

        count = results.length;
      }

      setListings(results);
      setTotalListings(count);
      setCurrentPage(page);

      if (
        restoreLocation &&
        urlLat &&
        urlLon &&
        !Number.isNaN(Number(urlLat)) &&
        !Number.isNaN(Number(urlLon))
      ) {
        const restoredLocation: MapLocation =
          {
            lat: Number(urlLat),
            lon: Number(urlLon),
            displayName:
              savedLocation ||
              city ||
              'Selected location',
          };

        setSelectedLocation(
          restoredLocation
        );

        setSelectedAddress(
          restoredLocation.displayName
        );
      } else if (
        restoreLocation &&
        city
      ) {
        const cityLocation =
          await geocodeCity(city);

        if (cityLocation) {
          const restoredLocation: MapLocation =
            {
              lat: cityLocation.lat,
              lon: cityLocation.lon,
              displayName:
                savedLocation ||
                city,
            };

          setSelectedLocation(
            restoredLocation
          );

          setSelectedAddress(
            restoredLocation.displayName
          );
        }
      }
    } catch (err) {
      console.error(
        'Failed to load search results:',
        err
      );

      setError(
        'Failed to load listings.'
      );

      setListings([]);
      setTotalListings(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const searchParams =
      new URLSearchParams(
        window.location.search
      );

    const urlPage = Number(
      searchParams.get('page') || '1'
    );

    const initialPage =
      Number.isInteger(urlPage) &&
      urlPage > 0
        ? urlPage
        : 1;

    loadResults(
      initialPage,
      true
    );
  }, []);

  const handlePageChange = (
    page: number
  ) => {
    if (
      page < 1 ||
      page > totalPages ||
      page === currentPage
    ) {
      return;
    }

    const params = new URLSearchParams(
      window.location.search
    );

    params.set(
      'page',
      String(page)
    );

    window.history.replaceState(
      null,
      '',
      `/search?${params.toString()}`
    );

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

    loadResults(page);
  };

  const getPaginationPages = () => {
    if (totalPages <= 7) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1
      );
    }

    const pages: (
      | number
      | string
    )[] = [];

    pages.push(1);

    if (currentPage > 4) {
      pages.push('...');
    }

    const start = Math.max(
      2,
      currentPage - 1
    );

    const end = Math.min(
      totalPages - 1,
      currentPage + 1
    );

    for (
      let page = start;
      page <= end;
      page++
    ) {
      pages.push(page);
    }

    if (
      currentPage <
      totalPages - 3
    ) {
      pages.push('...');
    }

    pages.push(totalPages);

    return pages;
  };

  const handleMapLocationChange = (
    newLocation: MapLocation
  ) => {
    setSelectedLocation(newLocation);

    setSelectedAddress(
      newLocation.displayName
    );

    setAlternativeListings([]);
    setAlternativeDistances({});
    setHasSearchedAlternatives(false);

    const params = new URLSearchParams(
      window.location.search
    );

    params.set(
      'location',
      newLocation.displayName
    );

    params.set(
      'lat',
      String(newLocation.lat)
    );

    params.set(
      'lon',
      String(newLocation.lon)
    );

    params.set(
      'page',
      '1'
    );

    window.history.replaceState(
      null,
      '',
      `/search?${params.toString()}`
    );
  };

  const handleRadiusChange = (
    value: Radius
  ) => {
    setRadius(value);

    setAlternativeListings([]);
    setAlternativeDistances({});
    setHasSearchedAlternatives(false);
  };

  const renderListingCard = (
    item: ApartmentWithCoordinates,
    alternative = false
  ) => {
    const displayImage =
      getDisplayImage(item);

    const distance = alternative
      ? alternativeDistances[
          String(item.id)
        ]
      : undefined;

    return (
      <Link
        key={`${alternative ? 'alternative' : 'matching'}-${item.id}`}
        href={`/listings/${item.id}`}
        className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-lg"
      >
        {displayImage ? (
          <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
            <img
              src={displayImage}
              alt={item.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center bg-gray-100 text-sm text-gray-500">
            No Image
          </div>
        )}

        <div className="flex flex-1 flex-col p-4">
          <div className="mb-2 flex items-start justify-between gap-3">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
              {item.property_type ||
                'Apartment'}
            </span>

            <span className="whitespace-nowrap text-base font-bold text-gray-900">
              €{item.price}
            </span>
          </div>

          {alternative &&
            distance !== undefined && (
              <span className="mb-2 text-xs font-semibold text-emerald-600">
                About {distance.toFixed(1)} km away
              </span>
            )}

          <h3 className="line-clamp-1 text-base font-bold text-gray-900 group-hover:text-emerald-600">
            {item.title}
          </h3>

          <p className="mt-1 line-clamp-1 text-sm text-gray-500">
            {item.address_city}
          </p>

          <div className="mt-3 flex items-center gap-1">
            <span className="text-yellow-400">
              ⭐
            </span>

            {item.average_rating !==
              undefined &&
            item.average_rating !== null &&
            Number(
              item.average_rating
            ) > 0 ? (
              <span className="text-sm font-semibold text-gray-900">
                {Number(
                  item.average_rating
                ).toFixed(2)}
              </span>
            ) : (
              <span className="text-sm text-gray-500">
                No reviews
              </span>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
            <span>
              {item.rooms}{' '}
              {item.rooms === 1
                ? 'room'
                : 'rooms'}
            </span>

            <span className="font-semibold text-emerald-600">
              View details →
            </span>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1650px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-tight text-gray-900"
          >
            Rent
            <span className="text-emerald-600">
              ify
            </span>
          </Link>

          <Link
            href="/"
            className="text-sm font-medium text-gray-600 transition hover:text-emerald-600"
          >
            Back to home
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1650px] px-3 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Search results
          </h1>

          <p className="mt-2 text-gray-600">
            Available places matching your
            search.
          </p>
        </div>

        {selectedAddress && (
          <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Selected location
            </p>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {selectedAddress}
            </p>
          </div>
        )}

        <section className="mb-8">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Explore locations
            </h2>

            <p className="text-sm text-gray-500">
              Click on the map to choose the starting
              point for nearby search.
            </p>
          </div>

          <LocationMap
            selectedLocation={
              selectedLocation
            }
            onLocationChange={
              handleMapLocationChange
            }
          />
        </section>

        {selectedLocation && (
          <section className="mb-10 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div>
                  <label
                    htmlFor="radius"
                    className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600"
                  >
                    Radius
                  </label>

                  <select
                    id="radius"
                    value={radius}
                    onChange={(event) =>
                      handleRadiusChange(
                        Number(
                          event.target.value
                        ) as Radius
                      )
                    }
                    className="h-11 min-w-[130px] cursor-pointer rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                  >
                    {RADIUS_OPTIONS.map(
                      (value) => (
                        <option
                          key={value}
                          value={value}
                        >
                          {value} km
                        </option>
                      )
                    )}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={
                    searchAlternatives
                  }
                  disabled={
                    alternativesLoading
                  }
                  className="h-11 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {alternativesLoading
                    ? 'Searching...'
                    : 'Search nearby'}
                </button>
              </div>
            </div>

            {hasSearchedAlternatives &&
              !alternativesLoading &&
              alternativeListings.length ===
                0 && (
                <div className="mt-5 rounded-xl bg-gray-50 px-4 py-3">
                  <p className="text-sm text-gray-600">
                    No alternative listings were
                    found within {radius} km.
                  </p>
                </div>
              )}
          </section>
        )}

        {loading && (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <p className="text-gray-600">
              Loading listings...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-600">
              {error}
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          listings.length > 0 && (
            <section className="mb-12">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Matching stays
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Only listings matching your search
                    are shown.
                  </p>
                </div>

                <span className="text-sm text-gray-600">
                  {totalListings} listing
                  {totalListings !== 1
                    ? 's'
                    : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {listings.map((item) =>
                  renderListingCard(
                    item
                  )
                )}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handlePageChange(
                        currentPage - 1
                      )
                    }
                    disabled={
                      currentPage === 1 ||
                      loading
                    }
                    className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-emerald-500 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  {getPaginationPages().map(
                    (page, index) =>
                      page === '...' ? (
                        <span
                          key={`ellipsis-${index}`}
                          className="px-2 text-sm text-gray-400"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          type="button"
                          onClick={() =>
                            handlePageChange(
                              Number(page)
                            )
                          }
                          disabled={
                            loading
                          }
                          className={`min-w-[42px] rounded-xl px-3 py-2 text-sm font-semibold transition ${
                            currentPage ===
                            page
                              ? 'bg-emerald-600 text-white'
                              : 'border border-gray-300 bg-white text-gray-700 hover:border-emerald-500 hover:text-emerald-600'
                          }`}
                        >
                          {page}
                        </button>
                      )
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      handlePageChange(
                        currentPage + 1
                      )
                    }
                    disabled={
                      currentPage ===
                        totalPages ||
                      loading
                    }
                    className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-emerald-500 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </section>
          )}

        {!loading &&
          !error &&
          listings.length === 0 && (
            <div className="mb-12 rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">
                No matching listings found
              </h2>

              <p className="mt-2 text-gray-600">
                Try a different search or use the
                nearby search above.
              </p>

              <Link
                href="/"
                className="mt-5 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Back to search
              </Link>
            </div>
          )}

        {!loading &&
          !error &&
          hasSearchedAlternatives &&
          alternativeListings.length > 0 && (
            <section className="border-t border-gray-200 pt-10">
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                  Alternative stays
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {alternativeListings.map(
                  (item) =>
                    renderListingCard(
                      item,
                      true
                    )
                )}
              </div>
            </section>
          )}
      </div>
    </main>
  );
}