'use client';

import { useState } from 'react';
import { api } from '@/services/api';

type ListingGalleryProps = {
  apartment: any;
  listingId: string;
  isOwner: boolean;
  onReload: () => Promise<void>;
};

/**
 * Read a cookie value from the browser.
 * The Django CSRF cookie is not HttpOnly, so it can be
 * read by the frontend and sent back in the X-CSRFToken header.
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split(';');

  for (const cookie of cookies) {
    const trimmedCookie = cookie.trim();

    if (
      trimmedCookie.startsWith(`${name}=`)
    ) {
      return decodeURIComponent(
        trimmedCookie.substring(name.length + 1)
      );
    }
  }

  return null;
}

export default function ListingGallery({
  apartment,
  listingId,
  isOwner,
  onReload,
}: ListingGalleryProps) {
  const [activeImage, setActiveImage] =
    useState<string>(
      apartment.main_image || ''
    );

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [uploading, setUploading] =
    useState<boolean>(false);

  const [imageError, setImageError] =
    useState<string | null>(null);

  const [deletingImageId, setDeletingImageId] =
    useState<string | null>(null);

  const images = apartment.images || [];

  const handleUploadImage = async () => {
    if (!selectedFile || !listingId) {
      return;
    }

    try {
      setUploading(true);
      setImageError(null);

      const formData = new FormData();

      formData.append(
        'apartment',
        String(listingId)
      );

      formData.append(
        'image',
        selectedFile
      );

      formData.append(
        'is_main',
        'false'
      );

      const csrftoken =
        getCookie('csrftoken');

      await api.post(
        '/api/listings/images/upload/',
        formData,
        {
          withCredentials: true,
          headers: {
            'X-CSRFToken': csrftoken || '',
          },
        }
      );

      setSelectedFile(null);

      const fileInput =
        document.getElementById(
          'image-upload'
        ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = '';
      }

      await onReload();
    } catch (err: any) {
      console.error(
        'Error uploading image:',
        err
      );

      const detail =
        err?.response?.data?.errors?.[0]
          ?.detail ||
        err?.response?.data?.detail ||
        'Failed to upload image.';

      setImageError(detail);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (
    imageId: string,
    imageUrl: string
  ) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this image?'
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingImageId(imageId);
      setImageError(null);

      const csrftoken =
        getCookie('csrftoken');

      await api.delete(
        `/api/listings/images/${imageId}/`,
        {
          withCredentials: true,
          headers: {
            'X-CSRFToken': csrftoken || '',
          },
        }
      );

      if (activeImage === imageUrl) {
        setActiveImage('');
      }

      await onReload();
    } catch (err: any) {
      console.error(
        'Error deleting image:',
        err
      );

      const detail =
        err?.response?.data?.errors?.[0]
          ?.detail ||
        err?.response?.data?.detail ||
        'Failed to delete image.';

      setImageError(detail);
    } finally {
      setDeletingImageId(null);
    }
  };

  return (
    <>
      {/* Photo gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main photo */}
        <div className="lg:col-span-2">
          {activeImage ? (
            <img
              src={activeImage}
              alt={apartment.title}
              className="w-full h-[400px] object-cover rounded-2xl border border-gray-200 shadow-lg"
            />
          ) : (
            <div className="w-full h-[400px] bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-gray-500">
              No image available
            </div>
          )}
        </div>

        {/* Thumbnails */}
        <div className="flex lg:flex-col gap-4 overflow-x-auto lg:overflow-y-auto max-h-[400px] p-1">
          {images.length > 0 ? (
            images.map(
              (
                imgObj: any,
                index: number
              ) => {
                const imageUrl =
                  typeof imgObj === 'string'
                    ? imgObj
                    : imgObj.image;

                const imageId =
                  typeof imgObj === 'string'
                    ? String(index)
                    : imgObj.id ||
                      String(index);

                return (
                  <div
                    key={imageId}
                    className="relative shrink-0"
                  >
                    <img
                      src={imageUrl}
                      alt="Thumbnail"
                      onClick={() =>
                        setActiveImage(
                          imageUrl
                        )
                      }
                      className={`w-28 h-20 object-cover rounded-xl cursor-pointer border-2 transition ${
                        activeImage ===
                        imageUrl
                          ? 'border-emerald-500 scale-105'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    />

                    {/* Delete photo */}
                    {isOwner &&
                      typeof imgObj !==
                        'string' && (
                        <button
                          type="button"
                          onClick={(
                            event
                          ) => {
                            event.stopPropagation();

                            handleDeleteImage(
                              imageId,
                              imageUrl
                            );
                          }}
                          disabled={
                            deletingImageId ===
                            imageId
                          }
                          className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm shadow-lg disabled:opacity-50 cursor-pointer"
                          title="Delete image"
                        >
                          {deletingImageId ===
                          imageId
                            ? '...'
                            : '×'}
                        </button>
                      )}
                  </div>
                );
              }
            )
          ) : (
            <p className="text-gray-500 text-sm">
              No images yet.
            </p>
          )}
        </div>
      </div>

      {/* Add Photo */}
      {isOwner && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-md">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Add Photo
          </h2>

          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file =
                  event.target.files?.[0] ||
                  null;

                setSelectedFile(file);
                setImageError(null);
              }}
              className="block w-full text-sm text-gray-600
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-emerald-600 file:text-white
                hover:file:bg-emerald-500"
            />

            <button
              type="button"
              onClick={
                handleUploadImage
              }
              disabled={
                !selectedFile ||
                uploading
              }
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {uploading
                ? 'Uploading...'
                : 'Upload Photo'}
            </button>
          </div>

          {selectedFile && (
            <p className="text-sm text-gray-600 mt-3">
              Selected:{' '}
              {selectedFile.name}
            </p>
          )}

          {imageError && (
            <p className="text-sm text-red-600 mt-3">
              {imageError}
            </p>
          )}
        </div>
      )}
    </>
  );
}