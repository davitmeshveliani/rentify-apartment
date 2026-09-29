'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Reviews from '@/app/listings/Reviews';
import { api } from '@/services/api';
import { userService } from '@/services/userService';
import { Apartment } from '@/types/listing';

import ReservationForm from '@/app/listings/ReservationForm';
import ListingGallery from '@/app/listings/ListingGallery';
import ListingEdit from '@/app/listings/ListingEdit';

export default function ListingDetail() {
  const params = useParams();
  const router = useRouter();

  const id = params?.id;

  const [apartment, setApartment] =
    useState<Apartment | null>(null);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [error, setError] =
    useState<string | null>(null);

  const [currentUser, setCurrentUser] =
    useState<any>(null);

  const [deletingListing, setDeletingListing] =
    useState<boolean>(false);

  const [deleteError, setDeleteError] =
    useState<string | null>(null);

  const loadApartment = async () => {
    if (!id) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.get(
        `/api/listings/${id}/`
      );

      const data = response.data
        ? response.data
        : response;

      setApartment(data);
      setLoading(false);
    } catch (err) {
      console.error(
        'Error loading apartment:',
        err
      );

      setError(
        'Failed to load apartment details.'
      );

      setLoading(false);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const user =
        await userService.getProfile();

      setCurrentUser(user);
    } catch (err) {
      console.error(
        'Error loading current user:',
        err
      );

      setCurrentUser(null);
    }
  };

  useEffect(() => {
    loadApartment();
    loadCurrentUser();
  }, [id]);

  /*
   * Backend ApartmentSerializer returns `user`
   * as a string, for example:
   *
   * "user": "Rentify Host"
   *
   * The profile endpoint returns:
   *
   * first_name: "Rentify"
   * last_name: "Host"
   *
   * Therefore we compare the listing owner against
   * username, email, id, and full name.
   */
  const listingOwner =
    (apartment as any)?.user;

  const currentUserFullName =
    `${currentUser?.first_name ?? ''} ${
      currentUser?.last_name ?? ''
    }`.trim();

  const isOwner =
    !!currentUser &&
    !!listingOwner &&
    (
      currentUser.email === listingOwner ||
      currentUser.username === listingOwner ||
      currentUser.id === listingOwner?.id ||
      currentUserFullName === listingOwner
    );

  const handleDeleteListing = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this listing?'
    );

    if (!confirmed || !id) {
      return;
    }

    try {
      setDeletingListing(true);
      setDeleteError(null);

      /*
       * `api` already has:
       * - withCredentials: true
       * - CSRF token interceptor
       *
       * Therefore we don't need to manually add
       * cookies or X-CSRFToken here.
       */
      await api.delete(
        `/api/listings/${id}/`
      );

      router.push('/');
      router.refresh();
    } catch (err: any) {
      console.error(
        'Error deleting listing:',
        err
      );

      const detail =
        err?.response?.data?.errors?.[0]
          ?.detail ||
        err?.response?.data?.detail ||
        'Failed to delete listing.';

      setDeleteError(detail);
      setDeletingListing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-lg text-gray-500 bg-gray-50 min-h-screen">
        Loading...
      </div>
    );
  }

  if (error || !apartment) {
    return (
      <div className="p-8 text-center text-red-600 font-semibold bg-gray-50 min-h-screen">
        {error || 'Apartment not found.'}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-12">
      <div className="max-w-5xl mx-auto">

        {/* Back */}
        <button
          onClick={() => router.push('/')}
          className="text-emerald-600 hover:text-emerald-500 text-sm mb-6 flex items-center gap-2 cursor-pointer transition"
        >
          ← Back to listings
        </button>

        {/* Title */}
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
          {apartment.title}
        </h1>

        {/* Photos */}
        <ListingGallery
          apartment={apartment}
          listingId={String(id)}
          isOwner={isOwner}
          onReload={loadApartment}
        />

        {/* Listing details */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 shadow-md">
          <div>
            <span className="text-xs text-emerald-600 uppercase tracking-wider block mb-1">
              City
            </span>

            <span className="text-lg font-bold text-gray-900">
              {apartment.address_city}
            </span>
          </div>

          <div>
            <span className="text-xs text-emerald-600 uppercase tracking-wider block mb-1">
              Price
            </span>

            <span className="text-base md:text-lg font-bold text-emerald-600 whitespace-nowrap">
              €{apartment.price}
            </span>
          </div>

          <div>
            <span className="text-xs text-emerald-600 uppercase tracking-wider block mb-1">
              Rooms
            </span>

            <span className="text-lg font-bold text-gray-900">
              {apartment.rooms}
            </span>
          </div>

          <div>
            <span className="text-xs text-emerald-600 uppercase tracking-wider block mb-1">
              Type
            </span>

            <span className="text-sm bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full uppercase font-medium inline-block">
              {apartment.property_type ||
                'Apartment'}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            Description
          </h2>

          <p className="text-gray-600 leading-relaxed">
            {apartment.description ||
              'Experience comfort and modern living in this carefully designed property. Perfect for your stay with all necessary amenities nearby.'}
          </p>
        </div>

        <ReservationForm
          listingId={String(id)}
          isOwner={isOwner}
        />

        <Reviews
          listingId={String(id)}
          currentUser={currentUser}
          isOwner={isOwner}
        />

        {/* Owner controls */}
        {isOwner && (
          <>
            {/* Edit */}
            <div className="mb-8">
              <ListingEdit
                apartment={apartment}
                listingId={String(id)}
                onSaved={loadApartment}
              />
            </div>

            {/* Delete */}
            <div className="bg-white border border-red-200 rounded-2xl p-6 shadow-md">
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Delete Listing
              </h2>

              <p className="text-sm text-gray-600 mb-4">
                This action will remove the
                listing from the active listings.
              </p>

              <button
                type="button"
                onClick={handleDeleteListing}
                disabled={deletingListing}
                className="bg-red-600 hover:bg-red-500 text-white font-semibold px-6 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingListing
                  ? 'Deleting...'
                  : 'Delete Listing'}
              </button>

              {deleteError && (
                <p className="text-sm text-red-600 mt-3">
                  {deleteError}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}