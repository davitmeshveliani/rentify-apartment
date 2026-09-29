'use client';

import { useState } from 'react';
import { api } from '@/services/api';

type ListingEditProps = {
  apartment: any;
  listingId: string;
  onSaved: () => Promise<void>;
};

export default function ListingEdit({
  apartment,
  listingId,
  onSaved,
}: ListingEditProps) {
  const [editingListing, setEditingListing] =
    useState<boolean>(false);

  const [savingListing, setSavingListing] =
    useState<boolean>(false);

  const [editError, setEditError] =
    useState<string | null>(null);

  const [editTitle, setEditTitle] =
    useState<string>('');

  const [editDescription, setEditDescription] =
    useState<string>('');

  const [editCity, setEditCity] =
    useState<string>('');

  const [editDistrict, setEditDistrict] =
    useState<string>('');

  const [editPrice, setEditPrice] =
    useState<string>('');

  const [editRooms, setEditRooms] =
    useState<string>('');

  const [editPropertyType, setEditPropertyType] =
    useState<string>('');

  const handleStartEdit = () => {
    setEditTitle(apartment.title || '');
    setEditDescription(apartment.description || '');
    setEditCity(apartment.address_city || '');
    setEditDistrict(apartment.address_district || '');
    setEditPrice(String(apartment.price || ''));
    setEditRooms(String(apartment.rooms || ''));
    setEditPropertyType(
      apartment.property_type || ''
    );

    setEditError(null);
    setEditingListing(true);
  };

  const handleCancelEdit = () => {
    setEditingListing(false);
    setEditError(null);
  };

  const handleSaveListing = async () => {
    try {
      setSavingListing(true);
      setEditError(null);

      await api.patch(
        `/api/listings/${listingId}/`,
        {
          title: editTitle,
          description: editDescription,
          address_city: editCity,
          address_district: editDistrict,
          price: editPrice,
          rooms: Number(editRooms),
          property_type: editPropertyType,
        },
        {
          withCredentials: true,
        }
      );

      await onSaved();

      setEditingListing(false);
    } catch (err: any) {
      console.error(
        'Error updating listing:',
        err
      );

      const detail =
        err?.response?.data?.errors?.[0]?.detail ||
        err?.response?.data?.detail ||
        'Failed to update listing.';

      setEditError(
        typeof detail === 'string'
          ? detail
          : 'Failed to update listing.'
      );
    } finally {
      setSavingListing(false);
    }
  };

  if (!editingListing) {
    return (
      <div className="bg-white border border-red-200 rounded-2xl p-6 shadow-md">
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          Manage Listing
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          You are the owner of this listing.
        </p>

        <button
          type="button"
          onClick={handleStartEdit}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2 rounded-lg transition cursor-pointer"
        >
          Edit Listing
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-emerald-200 rounded-2xl p-6 shadow-md">
      <h2 className="text-lg font-bold text-gray-900 mb-6">
        Edit Listing
      </h2>

      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm text-gray-600 mb-2">
            Title
          </label>

          <input
            type="text"
            value={editTitle}
            onChange={(event) =>
              setEditTitle(event.target.value)
            }
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 outline-none focus:border-emerald-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm text-gray-600 mb-2">
            Description
          </label>

          <textarea
            value={editDescription}
            onChange={(event) =>
              setEditDescription(event.target.value)
            }
            rows={5}
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 outline-none focus:border-emerald-500 resize-none"
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-sm text-gray-600 mb-2">
            City
          </label>

          <input
            type="text"
            value={editCity}
            onChange={(event) =>
              setEditCity(event.target.value)
            }
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 outline-none focus:border-emerald-500"
          />
        </div>

        {/* District */}
        <div>
          <label className="block text-sm text-gray-600 mb-2">
            District
          </label>

          <input
            type="text"
            value={editDistrict}
            onChange={(event) =>
              setEditDistrict(event.target.value)
            }
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 outline-none focus:border-emerald-500"
          />
        </div>

        {/* Price + Rooms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Price
            </label>

            <input
              type="text"
              value={editPrice}
              onChange={(event) =>
                setEditPrice(event.target.value)
              }
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Rooms
            </label>

            <input
              type="number"
              min="1"
              max="50"
              value={editRooms}
              onChange={(event) =>
                setEditRooms(event.target.value)
              }
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Property type */}
        <div>
          <label className="block text-sm text-gray-600 mb-2">
            Property Type
          </label>

          <input
            type="text"
            value={editPropertyType}
            onChange={(event) =>
              setEditPropertyType(
                event.target.value
              )
            }
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 outline-none focus:border-emerald-500"
          />
        </div>

        {editError && (
          <p className="text-sm text-red-600">
            {editError}
          </p>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleSaveListing}
            disabled={savingListing}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingListing
              ? 'Saving...'
              : 'Save Changes'}
          </button>

          <button
            type="button"
            onClick={handleCancelEdit}
            disabled={savingListing}
            className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold px-6 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
