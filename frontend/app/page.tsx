'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import HomeSearch from '@/components/home/HomeSearch';

import { api } from '@/services/api';
import { Apartment } from '@/types/listing';

export default function Home() {
  const router = useRouter();

  const [listings, setListings] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const fetchListings = () => {
    setLoading(true);

    api
      .get('/api/listings/?page=1')
      .then((res: any) => {
        const data = res.data ? res.data : res;

        if (data.results) {
          setListings(data.results);
        } else if (Array.isArray(data)) {
          setListings(data);
        } else {
          setListings([]);
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching listings:', err);
        setListings([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchListings();

    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('access');

    if (token) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  const getDisplayImage = (item: Apartment) => {
    return (
      item.main_image ||
      (item.images && item.images.length > 0
        ? typeof item.images[0] === 'string'
          ? item.images[0]
          : item.images[0].image
        : '')
    );
  };

  const renderListingCard = (item: Apartment) => {
    const displayImage = getDisplayImage(item);

    return (
      <article
        key={item.id}
        onClick={() => router.push(`/listings/${item.id}`)}
        className="group flex cursor-pointer flex-col overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {displayImage ? (
            <img
              src={displayImage}
              alt={item.title}
              className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-base text-gray-400">
              No Image
            </div>
          )}

          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3.5">
            <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-800 shadow-sm backdrop-blur-md">
              {item.property_type || 'Apartment'}
            </span>

            <span className="rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-bold text-white shadow-sm">
              €{item.price} / Month
            </span>
          </div>
        </div>

        <div className="flex flex-grow flex-col justify-between p-5">
          <div>
            <h3 className="truncate text-lg font-bold tracking-tight text-gray-900 transition group-hover:text-emerald-600">
              {item.title}
            </h3>

            <p className="mt-1.5 text-sm text-gray-500">
              {item.address_city || 'Location not specified'}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
            <span className="text-gray-500">
              {item.rooms}{' '}
              {item.rooms === 1 ? 'room' : 'rooms'}
            </span>

            <div className="flex items-center gap-1.5 font-semibold text-gray-900">
              <span>⭐</span>

              <span>
                {item.average_rating !== undefined &&
                item.average_rating !== null &&
                Number(item.average_rating) > 0
                  ? Number(item.average_rating).toFixed(1)
                  : '5.0'}
              </span>

              <span className="font-normal text-gray-400">
                ({item.reviews_count || 38})
              </span>
            </div>
          </div>
        </div>
      </article>
    );
  };

  const featuredListings = listings.slice(0, 4);

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <header className="absolute inset-x-0 top-0 z-50 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="mx-auto flex h-24 w-full max-w-none items-center justify-between px-6 lg:px-12">
          <Link
            href="/"
            className="flex items-center gap-5 text-3xl font-black tracking-tight text-white drop-shadow-md"
          >
            Rent
            <span className="text-emerald-400">ify</span>
          </Link>

          <div className="flex items-center gap-3">
            {!isLoggedIn && (
              <>
                <Link
                  href="/login"
                  className="rounded-full border border-white/20 bg-white/15 px-10 py-3 text-sm font-semibold text-white shadow-md backdrop-blur-md transition hover:bg-white/25"
                >
                  Sign In
                </Link>

                <Link
                  href="/register"
                  className="rounded-full bg-emerald-600 px-10 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-700"
                >
                  Register
                </Link>
              </>
            )}

            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-10 py-3 text-sm font-semibold text-white shadow-md backdrop-blur-md transition hover:bg-white/25"
            >
              <span>👤</span>
              <span>My Account</span>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative flex min-h-[780px] w-full flex-col items-center justify-center overflow-hidden bg-gray-950">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />

          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop"
            alt="Modern apartment"
            className="h-full w-full scale-105 object-cover brightness-90"
          />
        </div>

        <div className="relative z-20 mx-auto flex w-full max-w-[1700px] flex-col items-center px-10 pb-16 pt-28 text-center lg:px-12">
          <h1 className="max-w-5xl text-5xl font-black leading-[1.1] tracking-tight text-white drop-shadow-lg sm:text-7xl lg:text-8xl">
            Find a place that feels like{' '}
            <span className="text-emerald-400">home.</span>
          </h1>

          <div className="mt-10 w-full max-w-[1700px]">
            <div className="rounded-[32px] border border-white/20 bg-white/95 p-3 text-left shadow-2xl backdrop-blur-xl">
              <HomeSearch />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto w-full max-w-[1700px] px-6 lg:px-12">
          <div className="mb-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-4xl font-black tracking-tight text-gray-950 sm:text-5xl">
                Premium Selections
              </h2>

              <p className="mt-3 text-base text-gray-500 sm:text-lg">
                Hand-picked, verified homes available right now on Rentify.
              </p>
            </div>

            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-7 py-3.5 text-base font-bold text-white shadow-md transition hover:bg-emerald-700 hover:shadow-lg"
            >
              Explore all properties →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="space-y-4">
                  <div className="aspect-[4/3] animate-pulse rounded-[24px] bg-gray-100" />

                  <div className="space-y-2">
                    <div className="h-5 w-3/4 animate-pulse rounded bg-gray-100" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredListings.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-gray-200 bg-gray-50 p-16 text-center text-base text-gray-500">
              No properties available at the moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {featuredListings.map(renderListingCard)}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
