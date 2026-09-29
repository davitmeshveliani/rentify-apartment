'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/services/api';

const LocationMap = dynamic(
  () => import('@/components/home/LocationMap'),
  {
    ssr: false,
  }
);

type MapLocation = {
  lat: number;
  lon: number;
  displayName: string;
};

export default function CreateListingPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    city: '',
    property_type: 'apartment',
    rooms: '1',
  });

  const [selectedLocation, setSelectedLocation] =
    useState<MapLocation | null>(null);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(files);
  };

  const handleLocationChange = (location: MapLocation) => {
    setSelectedLocation(location);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      if (!selectedLocation) {
        throw new Error(
          'Please select the property location on the map.'
        );
      }

      // 1. Create the property.
      const listingPayload = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        address_city: formData.city,
        address_district: '',
        latitude: Number(selectedLocation.lat.toFixed(6)),
        longitude: Number(selectedLocation.lon.toFixed(6)),
        rooms: Number(formData.rooms),
        property_type: formData.property_type,
        is_active: true,
      };

      const listingResponse = await api.post(
        '/api/listings/',
        listingPayload,
        {
          withCredentials: true,
        }
      );

      console.log(
        'LISTING RESPONSE:',
        listingResponse.data
      );

      // Get the apartment UUID.
      const apartmentId =
        listingResponse.data?.id ??
        listingResponse.data?.data?.id;

      if (!apartmentId) {
        throw new Error(
          'Property was created, but the apartment ID was not returned by the server.'
        );
      }

      // 2. Upload selected images.
      for (let index = 0; index < imageFiles.length; index++) {
        const imageFormData = new FormData();

        imageFormData.append(
          'apartment',
          String(apartmentId)
        );

        imageFormData.append(
          'image',
          imageFiles[index]
        );

        imageFormData.append(
          'is_main',
          index === 0 ? 'true' : 'false'
        );

        await api.post(
          '/api/listings/images/upload/',
          imageFormData,
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      }

      // 3. Go back to the home page.
      router.push('/');
      router.refresh();
    } catch (err: any) {
      console.error(
        'Error creating listing:',
        JSON.stringify(
          err?.response?.data || err?.message || err,
          null,
          2
        )
      );

      const responseData = err?.response?.data;

      let message =
        'Failed to create listing. Please make sure you are logged in as a host.';

      if (err?.message) {
        message = err.message;
      }

      if (responseData?.detail) {
        message = responseData.detail;
      } else if (responseData?.message) {
        message = responseData.message;
      } else if (
        responseData &&
        typeof responseData === 'object'
      ) {
        const firstError = Object.values(responseData)[0];

        if (Array.isArray(firstError)) {
          message = String(firstError[0]);
        } else if (firstError) {
          message = String(firstError);
        }
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-12">
      <div className="max-w-2xl mx-auto bg-white border border-gray-200 p-8 rounded-3xl shadow-2xl">

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Add New Property
          </h1>

          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 transition"
          >
            ← Back to Home
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6"
        >

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
              Property Title
            </label>

            <input
              type="text"
              name="title"
              required
              placeholder="e.g. Modern Apartment"
              value={formData.title}
              onChange={handleChange}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                City
              </label>

              <input
                type="text"
                name="city"
                required
                placeholder="e.g. Aschaffenburg"
                value={formData.city}
                onChange={handleChange}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                Price (€)
              </label>

              <input
                type="number"
                name="price"
                required
                min="0.01"
                max="50000"
                step="0.01"
                placeholder="e.g. 1200"
                value={formData.price}
                onChange={handleChange}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                Rooms
              </label>

              <input
                type="number"
                name="rooms"
                required
                min="1"
                max="50"
                value={formData.rooms}
                onChange={handleChange}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
              Property Type
            </label>

            <select
              name="property_type"
              value={formData.property_type}
              onChange={handleChange}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="apartment">Apartment</option>
              <option value="studio">Studio</option>
              <option value="house">House</option>
              <option value="villa">Villa</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
              Property Location
            </label>

            <input
              type="text"
              value={selectedLocation?.displayName || ''}
              readOnly
              placeholder="Click on the map to select the property location"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none mb-4"
            />

            <div className="rounded-2xl overflow-hidden border border-gray-200">
              <LocationMap
                selectedLocation={selectedLocation}
                onLocationChange={handleLocationChange}
              />
            </div>

            {selectedLocation && (
              <div className="mt-3 rounded-xl bg-gray-50 border border-gray-200 p-3 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">
                  Selected location
                </p>

                <p className="mt-1">
                  {selectedLocation.displayName}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Latitude: {selectedLocation.lat.toFixed(6)}
                  {' | '}
                  Longitude: {selectedLocation.lon.toFixed(6)}
                </p>
              </div>
            )}

            {!selectedLocation && (
              <p className="text-xs text-gray-500 mt-2">
                Click on the map to select the exact property location.
              </p>
            )}
          </div>

          {/* Photos */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
              Photos
            </label>

            <input
              type="file"
              name="images"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-white file:font-semibold hover:file:bg-emerald-500"
            />

            {imageFiles.length > 0 && (
              <div className="mt-3 rounded-xl bg-gray-50 border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Selected photos ({imageFiles.length})
                </p>

                <div className="flex flex-col gap-2">
                  {imageFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between text-sm text-gray-700"
                    >
                      <span className="truncate">
                        {index === 0 && (
                          <span className="font-semibold text-emerald-600 mr-2">
                            Main
                          </span>
                        )}
                        {file.name}
                      </span>

                      <span className="text-xs text-gray-500 ml-3">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-2">
              You can select multiple images. The first image will be used as the main photo.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
              Description
            </label>

            <textarea
              name="description"
              rows={4}
              required
              placeholder="Describe the property..."
              value={formData.description}
              onChange={handleChange}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl py-4 transition shadow-lg shadow-emerald-200 cursor-pointer disabled:opacity-50 mt-4"
          >
            {loading ? 'Publishing...' : 'Publish Property'}
          </button>

        </form>
      </div>
    </main>
  );
}
