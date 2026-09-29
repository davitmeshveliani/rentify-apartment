'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { reservationService } from '@/services/reservationService';
import { listingService } from '@/services/listingService';
import type { Reservation } from '@/types/reservation';
import type { Apartment } from '@/types/listing';

function formatReservationDate(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleString('de-DE', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [hostReservations, setHostReservations] = useState<Reservation[]>([]);
  const [listings, setListings] = useState<Apartment[]>([]);

  const [loading, setLoading] = useState(true);
  const [hostLoading, setHostLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [hostError, setHostError] = useState<string | null>(null);

  const [updatingReservationId, setUpdatingReservationId] =
    useState<string | null>(null);

  const loadReservations = async () => {
    try {
      setLoading(true);
      setError(null);

      const reservationData =
        await reservationService.getMyReservations();

      const reservationList: Reservation[] =
        Array.isArray(reservationData)
          ? reservationData
          : reservationData?.results || [];

      setReservations(reservationList);

      const uniqueListingIds = [
        ...new Set(
          reservationList.map(
            (reservation) => reservation.listing
          )
        ),
      ];

      const listingData = await Promise.all(
        uniqueListingIds.map((listingId) =>
          listingService.getListingById(listingId)
        )
      );

      setListings(listingData);
    } catch (err: any) {
      console.error(
        'Error loading reservations:',
        err
      );

      const detail =
        err?.response?.data?.errors?.[0]?.detail ||
        err?.response?.data?.detail ||
        'Failed to load reservations.';

      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const loadHostReservations = async () => {
    try {
      setHostLoading(true);
      setHostError(null);

      const hostReservationData =
        await reservationService.getHostReservations();

      setHostReservations(
        Array.isArray(hostReservationData)
          ? hostReservationData
          : hostReservationData?.results || []
      );
    } catch (err: any) {
      console.error(
        'Error loading host reservations:',
        err
      );

      const detail =
        err?.response?.data?.errors?.[0]?.detail ||
        err?.response?.data?.detail ||
        'Failed to load host reservations.';

      setHostError(detail);
    } finally {
      setHostLoading(false);
    }
  };

  const handleCancel = async (
    reservationId: string
  ) => {
    try {
      setError(null);

      await reservationService.cancelReservation(
        reservationId
      );

      await loadReservations();
    } catch (err: any) {
      console.error(
        'Error cancelling reservation:',
        err
      );

      const detail =
        err?.response?.data?.errors?.[0]?.detail ||
        err?.response?.data?.detail ||
        'Failed to cancel reservation.';

      setError(detail);
    }
  };

  const handleUpdateStatus = async (
    reservationId: string,
    status: 'CONFIRMED' | 'REJECTED'
  ) => {
    try {
      setUpdatingReservationId(reservationId);
      setHostError(null);

      await reservationService.updateReservationStatus(
        reservationId,
        status
      );

      await loadHostReservations();
    } catch (err: any) {
      console.error(
        'Error updating reservation status:',
        err
      );

      const detail =
        err?.response?.data?.errors?.[0]?.detail ||
        err?.response?.data?.detail ||
        'Failed to update reservation status.';

      setHostError(detail);
    } finally {
      setUpdatingReservationId(null);
    }
  };

  useEffect(() => {
    loadReservations();
    loadHostReservations();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10 text-gray-900">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-10">
          <Link
            href="/profile"
            className="mb-4 inline-flex items-center text-sm text-gray-600 transition hover:text-emerald-600"
          >
            ← Back to My Account
          </Link>

          <h1 className="text-3xl font-bold text-gray-900">
            Reservations
          </h1>

          <p className="mt-2 text-gray-600">
            View your reservations and manage booking
            requests for your listings.
          </p>
        </div>

        {/* ========================= */}
        {/* MY RESERVATIONS */}
        {/* ========================= */}

        <section className="mb-14">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              My Reservations
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Reservations you have created.
            </p>
          </div>

          {!loading &&
            !error &&
            reservations.length === 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
                <p className="text-gray-500">
                  You don't have any reservations yet.
                </p>
              </div>
            )}

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-5">
            {reservations.map((reservation) => {
              const listing = listings.find(
                (item) =>
                  item.id === reservation.listing
              );

              let imageUrl: string | null = null;

              if (listing?.main_image) {
                imageUrl = listing.main_image;
              } else if (
                listing?.images &&
                listing.images.length > 0
              ) {
                const firstImage =
                  listing.images[0];

                imageUrl =
                  typeof firstImage === 'string'
                    ? firstImage
                    : firstImage.image;
              }

              return (
                <div
                  key={reservation.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md"
                >
                  <div className="flex flex-col md:flex-row">
                    <Link
                      href={`/listings/${reservation.listing}`}
                      className="block w-full md:w-64 md:shrink-0"
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={reservation.listing_title}
                          className="h-56 w-full object-cover transition hover:opacity-90 md:h-full"
                        />
                      ) : (
                        <div className="flex h-56 w-full items-center justify-center bg-gray-100 text-sm text-gray-500 md:h-full">
                          No image
                        </div>
                      )}
                    </Link>

                    <div className="flex-1 p-6">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <Link
                            href={`/listings/${reservation.listing}`}
                            className="text-xl font-semibold text-gray-900 transition hover:text-emerald-600"
                          >
                            {reservation.listing_title}
                          </Link>

                          <div className="mt-4 space-y-2 text-sm text-gray-600">
                            <p>
                              <span className="text-gray-500">
                                Start:
                              </span>{' '}
                              {formatReservationDate(
                                reservation.start_date
                              )}
                            </p>

                            <p>
                              <span className="text-gray-500">
                                End:
                              </span>{' '}
                              {formatReservationDate(
                                reservation.end_date
                              )}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                            reservation.status ===
                            'CONFIRMED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : reservation.status ===
                                'REJECTED'
                              ? 'bg-red-50 text-red-700'
                              : reservation.status ===
                                'CANCELLED'
                              ? 'bg-gray-100 text-gray-500'
                              : 'bg-yellow-50 text-yellow-700'
                          }`}
                        >
                          {reservation.status}
                        </span>
                      </div>

                      {reservation.status !==
                        'CANCELLED' &&
                        reservation.status !==
                          'REJECTED' && (
                          <button
                            type="button"
                            onClick={() =>
                              handleCancel(
                                reservation.id
                              )
                            }
                            className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                          >
                            Cancel Reservation
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================= */}
        {/* HOST RESERVATIONS */}
        {/* ========================= */}

        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Host Reservations
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Booking requests for your listings.
            </p>
          </div>

          {hostError && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {hostError}
            </div>
          )}

          {!hostLoading &&
            !hostError &&
            hostReservations.length === 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
                <p className="text-gray-500">
                  You don't have any booking requests
                  for your listings.
                </p>
              </div>
            )}

          <div className="grid gap-5">
            {hostReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <Link
                      href={`/listings/${reservation.listing}`}
                      className="text-xl font-semibold text-gray-900 transition hover:text-emerald-600"
                    >
                      {reservation.listing_title}
                    </Link>

                    <div className="mt-4 space-y-2 text-sm text-gray-600">
                      <p>
                        <span className="text-gray-500">
                          Guest:
                        </span>{' '}
                        {reservation.user}
                      </p>

                      <p>
                        <span className="text-gray-500">
                          Start:
                        </span>{' '}
                        {formatReservationDate(
                          reservation.start_date
                        )}
                      </p>

                      <p>
                        <span className="text-gray-500">
                          End:
                        </span>{' '}
                        {formatReservationDate(
                          reservation.end_date
                        )}
                      </p>

                      <p>
                        <span className="text-gray-500">
                          Created:
                        </span>{' '}
                        {new Date(
                          reservation.created_at
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      reservation.status ===
                      'CONFIRMED'
                        ? 'bg-emerald-50 text-emerald-700'
                        : reservation.status ===
                          'REJECTED'
                        ? 'bg-red-50 text-red-700'
                        : reservation.status ===
                          'CANCELLED'
                        ? 'bg-gray-100 text-gray-500'
                        : 'bg-yellow-50 text-yellow-700'
                    }`}
                  >
                    {reservation.status}
                  </span>
                </div>

                {reservation.status ===
                  'PENDING' && (
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={
                        updatingReservationId ===
                        reservation.id
                      }
                      onClick={() =>
                        handleUpdateStatus(
                          reservation.id,
                          'CONFIRMED'
                        )
                      }
                      className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updatingReservationId ===
                      reservation.id
                        ? 'Updating...'
                        : 'Confirm'}
                    </button>

                    <button
                      type="button"
                      disabled={
                        updatingReservationId ===
                        reservation.id
                      }
                      onClick={() =>
                        handleUpdateStatus(
                          reservation.id,
                          'REJECTED'
                        )
                      }
                      className="rounded-lg border border-red-200 bg-red-50 px-5 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updatingReservationId ===
                      reservation.id
                        ? 'Updating...'
                        : 'Reject'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
