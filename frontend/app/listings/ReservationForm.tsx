'use client';

import { useState } from 'react';

import { reservationService } from '@/services/reservationService';

interface ReservationFormProps {
  listingId: string;
  isOwner: boolean;
}

export default function ReservationForm({
  listingId,
  isOwner,
}: ReservationFormProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleReservation = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates.');
      setSuccess(null);
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      setLoading(true);

      await reservationService.createReservation(
        listingId,
        startDate,
        endDate
      );

      setSuccess(
        'Reservation request created successfully.'
      );

      setStartDate('');
      setEndDate('');
    } catch (err: any) {
      console.error(
        'Error creating reservation:',
        err
      );

      const detail =
        err?.response?.data?.errors?.[0]?.detail ||
        err?.response?.data?.detail ||
        'Failed to create reservation.';

      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  if (isOwner) {
    return null;
  }

  return (
    <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900">
          Reserve this listing
        </h2>

        <p className="mt-1 text-sm text-gray-600">
          Select your preferred start and end dates.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="reservation-start"
            className="mb-2 block text-xs uppercase tracking-wider text-emerald-600"
          >
            Start date
          </label>

          <input
            id="reservation-start"
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={startDate}
            onChange={(event) => {
              setStartDate(event.target.value);
              setError(null);
              setSuccess(null);
            }}
            disabled={loading}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor="reservation-end"
            className="mb-2 block text-xs uppercase tracking-wider text-emerald-600"
          >
            End date
          </label>

          <input
            id="reservation-end"
            type="date"
            min={
              startDate ||
              new Date().toISOString().split('T')[0]
            }
            value={endDate}
            onChange={(event) => {
              setEndDate(event.target.value);
              setError(null);
              setSuccess(null);
            }}
            disabled={loading}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">
            Reservation could not be created.
          </p>

          <p className="mt-1 text-sm text-red-600">
            {error}
          </p>
        </div>
      )}

      {success && (
        <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-medium text-emerald-700">
            {success}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={handleReservation}
        disabled={loading}
        className="mt-5 w-full rounded-lg bg-emerald-600 px-7 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
      >
        {loading
          ? 'Creating reservation...'
          : 'Reserve'}
      </button>
    </div>
  );
}
