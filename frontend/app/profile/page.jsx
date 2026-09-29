'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { api } from '../../services/api';
import { userService } from '../../services/userService';
import { listingService } from '../../services/listingService';
import { reservationService } from '../../services/reservationService';
import { reviewService } from '../../services/reviewService';

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [activeSection, setActiveSection] = useState('profile');

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editingRating, setEditingRating] = useState(5);
  const [editingComment, setEditingComment] = useState('');

  // SETTINGS
  const [editingProfile, setEditingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    address: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        await userService.getProfile();
        setCheckingAuth(false);
      } catch (err) {
        console.error('Authentication check error:', err);

        setCheckingAuth(false);
        router.push('/login');
      }
    };

    checkAuthentication();
  }, [router]);

  useEffect(() => {
    if (!checkingAuth) {
      loadAccount();
    }
  }, [checkingAuth]);

  const loadAccount = async () => {
    setLoading(true);
    setError('');

    try {
      const [
        profileData,
        reservationsData,
        listingsData,
        reviewsData,
      ] = await Promise.all([
        userService.getProfile(),
        reservationService.getMyReservations(),
        listingService.getListings(),
        reviewService.getMyReviews(),
      ]);

      setProfile(profileData);

      setProfileForm({
        first_name:
          profileData?.first_name ||
          profileData?.firstName ||
          '',
        last_name:
          profileData?.last_name ||
          profileData?.lastName ||
          '',
        phone_number:
          profileData?.phone_number ||
          profileData?.phone ||
          '',
        address: profileData?.address || '',
      });

      const reservationResults = Array.isArray(reservationsData)
        ? reservationsData
        : reservationsData?.results || [];

      const listingResults = Array.isArray(listingsData)
        ? listingsData
        : listingsData?.results || [];

      const reviewResults = Array.isArray(reviewsData)
        ? reviewsData
        : reviewsData?.results || [];

      setReservations(reservationResults);
      setListings(listingResults);
      setReviews(reviewResults);
    } catch (err) {
      console.error('Account loading error:', err);

      if (
        err?.response?.status === 401 ||
        err?.response?.status === 403
      ) {
        router.push('/login');
        return;
      }

      setError(
        err?.response?.data?.detail ||
          'Failed to load account data.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBecomeHost = async () => {
    setActionLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await userService.becomeHost();

      setMessage(
        response?.detail ||
          'You have successfully become a host!'
      );

      await loadAccount();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          'Failed to become a host. Please check your authentication.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId) => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this reservation?'
    );

    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    setMessage('');
    setError('');

    try {
      await reservationService.cancelReservation(reservationId);

      setMessage('Reservation cancelled successfully.');

      await loadAccount();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          'Failed to cancel the reservation.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this review?'
    );

    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    setMessage('');
    setError('');

    try {
      await reviewService.deleteReview(reviewId);

      setMessage('Review deleted successfully.');

      await loadAccount();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          'Failed to delete the review.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const startReviewEdit = (review) => {
    setEditingReviewId(review.id);
    setEditingRating(review.rating || 5);
    setEditingComment(review.comment || '');
    setMessage('');
    setError('');
  };

  const cancelReviewEdit = () => {
    setEditingReviewId(null);
    setEditingRating(5);
    setEditingComment('');
  };

  const saveReviewEdit = async (reviewId) => {
    setActionLoading(true);
    setMessage('');
    setError('');

    try {
      await reviewService.updateReview(
        reviewId,
        Number(editingRating),
        editingComment
      );

      setMessage('Review updated successfully.');

      cancelReviewEdit();
      await loadAccount();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          'Failed to update the review.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await userService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    }

    router.push('/login');
    router.refresh();
  };

  // -----------------------------
  // SETTINGS
  // -----------------------------

  const startProfileEdit = () => {
    setProfileForm({
      first_name:
        profile?.first_name ||
        profile?.firstName ||
        '',
      last_name:
        profile?.last_name ||
        profile?.lastName ||
        '',
      phone_number:
        profile?.phone_number ||
        profile?.phone ||
        '',
      address: profile?.address || '',
    });

    setEditingProfile(true);
    setChangingPassword(false);
    setMessage('');
    setError('');
  };

  const cancelProfileEdit = () => {
    setEditingProfile(false);

    setProfileForm({
      first_name:
        profile?.first_name ||
        profile?.firstName ||
        '',
      last_name:
        profile?.last_name ||
        profile?.firstName ||
        '',
      phone_number:
        profile?.phone_number ||
        profile?.phone ||
        '',
      address: profile?.address || '',
    });
  };

  const handleProfileFormChange = (event) => {
    const { name, value } = event.target;

    setProfileForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const saveProfileInformation = async (event) => {
    event.preventDefault();

    setActionLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await api.patch(
        '/api/users/profile/',
        {
          first_name: profileForm.first_name,
          last_name: profileForm.last_name,
          phone_number: profileForm.phone_number,
          address: profileForm.address,
        },
        {
          withCredentials: true,
        }
      );

      setProfile(response.data);

      setProfileForm({
        first_name:
          response.data?.first_name ||
          response.data?.firstName ||
          '',
        last_name:
          response.data?.last_name ||
          response.data?.lastName ||
          '',
        phone_number:
          response.data?.phone_number ||
          response.data?.phone ||
          '',
        address: response.data?.address || '',
      });

      setEditingProfile(false);
      setMessage('Personal information updated successfully.');
    } catch (err) {
      console.error(
        'Profile update error:',
        err?.response?.data || err
      );

      const responseData = err?.response?.data;

      let errorMessage =
        'Failed to update your personal information.';

      if (responseData?.detail) {
        errorMessage = responseData.detail;
      } else if (responseData?.message) {
        errorMessage = responseData.message;
      } else if (
        responseData &&
        typeof responseData === 'object'
      ) {
        const firstError = Object.values(responseData)[0];

        if (Array.isArray(firstError)) {
          errorMessage = String(firstError[0]);
        } else if (firstError) {
          errorMessage = String(firstError);
        }
      }

      setError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const startPasswordChange = () => {
    setChangingPassword(true);
    setEditingProfile(false);

    setPasswordForm({
      current_password: '',
      new_password: '',
      confirm_password: '',
    });

    setMessage('');
    setError('');
  };

  const cancelPasswordChange = () => {
    setChangingPassword(false);

    setPasswordForm({
      current_password: '',
      new_password: '',
      confirm_password: '',
    });
  };

  const handlePasswordFormChange = (event) => {
    const { name, value } = event.target;

    setPasswordForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const savePasswordChange = async (event) => {
    event.preventDefault();

    setMessage('');
    setError('');

    if (
      !passwordForm.current_password ||
      !passwordForm.new_password ||
      !passwordForm.confirm_password
    ) {
      setError('Please fill in all password fields.');
      return;
    }

    if (
      passwordForm.new_password !==
      passwordForm.confirm_password
    ) {
      setError('New password and confirmation do not match.');
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setError(
        'The new password must contain at least 8 characters.'
      );
      return;
    }

    setActionLoading(true);

    try {
      const response = await api.post(
        '/api/users/change-password/',
        {
          current_password:
            passwordForm.current_password,
          new_password: passwordForm.new_password,
          confirm_password:
            passwordForm.confirm_password,
        },
        {
          withCredentials: true,
        }
      );

      setChangingPassword(false);

      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });

      setMessage(
        response?.data?.detail ||
          'Password changed successfully.'
      );
    } catch (err) {
      console.error(
        'Password change error:',
        err?.response?.data || err
      );

      const responseData = err?.response?.data;

      let errorMessage =
        'Failed to change your password.';

      if (responseData?.detail) {
        errorMessage = responseData.detail;
      } else if (responseData?.message) {
        errorMessage = responseData.message;
      } else if (
        responseData &&
        typeof responseData === 'object'
      ) {
        const firstError = Object.values(responseData)[0];

        if (Array.isArray(firstError)) {
          errorMessage = String(firstError[0]);
        } else if (firstError) {
          errorMessage = String(firstError);
        }
      }

      setError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const openListingsCreate = () => {
    router.push('/listings/create');
  };

  const handleDeleteListing = async (listingId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this listing? This action cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    setMessage('');
    setError('');

    try {
      await api.delete(`/api/listings/${listingId}/`, {
        withCredentials: true,
      });

      setMessage('Listing deleted successfully.');
      await loadAccount();
    } catch (err) {
      console.error(
        'Listing delete error:',
        err?.response?.data || err
      );

      const responseData = err?.response?.data;

      let errorMessage = 'Failed to delete the listing.';

      if (responseData?.detail) {
        errorMessage = responseData.detail;
      } else if (responseData?.message) {
        errorMessage = responseData.message;
      } else if (
        responseData &&
        typeof responseData === 'object'
      ) {
        const firstError = Object.values(responseData)[0];

        if (Array.isArray(firstError)) {
          errorMessage = String(firstError[0]);
        } else if (firstError) {
          errorMessage = String(firstError);
        }
      }

      setError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // -----------------------------
  // HELPERS
  // -----------------------------

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PENDING':
        return 'Pending';

      case 'CONFIRMED':
        return 'Confirmed';

      case 'REJECTED':
        return 'Rejected';

      case 'CANCELLED':
        return 'Cancelled';

      default:
        return status || 'Unknown';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';

      case 'REJECTED':
        return 'bg-red-50 text-red-700 border-red-200';

      case 'CANCELLED':
        return 'bg-gray-100 text-gray-600 border-gray-200';

      case 'PENDING':
      default:
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
  };

  const getListingTitle = (listing) => {
    if (!listing) {
      return 'Listing';
    }

    return (
      listing.title ||
      listing.name ||
      listing.property_name ||
      'Property'
    );
  };

  const getReviewListingTitle = (review) => {
    if (!review) {
      return 'Property';
    }

    if (typeof review.listing === 'object') {
      return getListingTitle(review.listing);
    }

    return (
      review.listing_title ||
      review.title ||
      'Property'
    );
  };

  const getReservationListingTitle = (reservation) => {
    if (!reservation) {
      return 'Property';
    }

    if (typeof reservation.listing === 'object') {
      return getListingTitle(reservation.listing);
    }

    return (
      reservation.listing_title ||
      reservation.title ||
      'Property'
    );
  };

  const isHost =
    String(profile?.role || '').toUpperCase() === 'HOST' ||
    String(profile?.role || '').toUpperCase() === 'BOTH' ||
    profile?.is_host === true ||
    profile?.isHost === true;

  const myListings = listings.filter((listing) => {
    if (!profile || !listing) {
      return false;
    }

    return (
      String(listing.user || '').toLowerCase() ===
      String(profile.email || '').toLowerCase()
    );
  });

  const displayListings = myListings;

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-gray-500 text-sm">
        Loading profile...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="mx-auto flex h-20 w-full max-w-[1400px] items-center justify-between px-6 lg:px-12">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight text-emerald-600 flex items-center gap-1"
          >
            Rent<span className="text-gray-900">ify</span>
          </Link>

          <button
            onClick={handleLogout}
            className="text-xs font-bold text-gray-600 hover:text-emerald-600 transition"
          >
            Log Out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* BACK */}
        <Link
          href="/"
          className="inline-flex items-center text-sm font-bold text-gray-600 hover:text-emerald-600 transition"
        >
          ← Back to listings
        </Link>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-8">
          {/* SIDEBAR */}
          <aside>
            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-5 lg:sticky lg:top-28">
              <div className="flex items-center gap-3 pb-5 border-b border-gray-100">
                <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
                  👤
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-black text-gray-900 truncate">
                    {profile?.first_name ||
                      profile?.firstName ||
                      'User'}
                  </p>

                  <p className="text-xs text-gray-500 truncate">
                    {profile?.email || ''}
                  </p>
                </div>
              </div>

              <nav className="mt-5 space-y-1">
                <button
                  onClick={() => setActiveSection('profile')}
                  className={`w-full text-left rounded-xl px-4 py-3 text-sm font-bold transition ${
                    activeSection === 'profile'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  👤 Profile
                </button>

                <button
                  onClick={() =>
                    router.push('/reservations')
                  }
                  className={`w-full text-left rounded-xl px-4 py-3 text-sm font-bold transition ${
                    activeSection === 'reservations'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  📅 My Reservations
                </button>

                <button
                  onClick={() => setActiveSection('listings')}
                  className={`w-full text-left rounded-xl px-4 py-3 text-sm font-bold transition ${
                    activeSection === 'listings'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  🏠 My Listings
                </button>

                <button
                  onClick={() => setActiveSection('reviews')}
                  className={`w-full text-left rounded-xl px-4 py-3 text-sm font-bold transition ${
                    activeSection === 'reviews'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  ⭐ My Reviews
                </button>

                <button
                  onClick={() => setActiveSection('settings')}
                  className={`w-full text-left rounded-xl px-4 py-3 text-sm font-bold transition ${
                    activeSection === 'settings'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  ⚙️ Settings
                </button>

                <button
                  type="button"
                  onClick={openListingsCreate}
                  className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  + Add Listing
                </button>
              </nav>
            </div>
          </aside>

          {/* CONTENT */}
          <section>
            {message && (
              <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
                {message}
              </div>
            )}

            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-10 text-center">
                <p className="text-sm text-gray-500">
                  Loading account data...
                </p>
              </div>
            ) : (
              <>
                {/* PROFILE */}
                {activeSection === 'profile' && (
                  <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-8">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                        <div>
                          <h1 className="text-2xl font-black text-gray-900">
                            Profile
                          </h1>

                          <p className="text-xs text-gray-500 mt-1">
                            Manage your account and host status.
                          </p>
                        </div>

                        <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
                          👤
                        </div>
                      </div>

                      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
                          <p className="text-[11px] font-bold text-gray-500 uppercase">
                            First Name
                          </p>

                          <p className="mt-1 text-sm font-bold text-gray-900">
                            {profile?.first_name ||
                              profile?.firstName ||
                              '—'}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
                          <p className="text-[11px] font-bold text-gray-500 uppercase">
                            Last Name
                          </p>

                          <p className="mt-1 text-sm font-bold text-gray-900">
                            {profile?.last_name ||
                              profile?.lastName ||
                              '—'}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
                          <p className="text-[11px] font-bold text-gray-500 uppercase">
                            Email
                          </p>

                          <p className="mt-1 text-sm font-bold text-gray-900 break-all">
                            {profile?.email || '—'}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
                          <p className="text-[11px] font-bold text-gray-500 uppercase">
                            Phone
                          </p>

                          <p className="mt-1 text-sm font-bold text-gray-900">
                            {profile?.phone_number ||
                              profile?.phone ||
                              '—'}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100 md:col-span-2">
                          <p className="text-[11px] font-bold text-gray-500 uppercase">
                            Address
                          </p>

                          <p className="mt-1 text-sm font-bold text-gray-900">
                            {profile?.address || '—'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* HOST STATUS */}
                    <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6">
                      <h2 className="text-sm font-bold text-gray-900">
                        Host Status
                      </h2>

                      <p className="text-xs text-gray-500 mt-1">
                        Become a host to add and rent out your own
                        properties on Rentify.
                      </p>

                      {isHost ? (
                        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                          <p className="text-xs font-bold text-emerald-700">
                            ✓ You are a host
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={handleBecomeHost}
                          disabled={actionLoading}
                          className="mt-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 text-xs font-bold shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading
                            ? 'Processing...'
                            : 'Become a Host'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* RESERVATIONS */}
                {activeSection === 'reservations' && (
                  <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-8">
                    <div className="border-b border-gray-100 pb-6">
                      <h1 className="text-2xl font-black text-gray-900">
                        My Reservations
                      </h1>

                      <p className="text-xs text-gray-500 mt-1">
                        View all of your registered reservations.
                      </p>
                    </div>

                    {reservations.length === 0 ? (
                      <div className="py-12 text-center">
                        <div className="text-4xl mb-3">📅</div>

                        <p className="text-sm font-bold text-gray-900">
                          You have no reservations yet.
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          Search for a property and make your
                          first reservation.
                        </p>

                        <Link
                          href="/"
                          className="inline-block mt-5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 text-xs font-bold transition"
                        >
                          Browse Listings
                        </Link>
                      </div>
                    ) : (
                      <div className="mt-6 space-y-4">
                        {reservations.map((reservation) => (
                          <div
                            key={reservation.id}
                            className="rounded-2xl border border-gray-200 p-5"
                          >
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                              <div>
                                <h2 className="text-sm font-black text-gray-900">
                                  {getReservationListingTitle(
                                    reservation
                                  )}
                                </h2>

                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase">
                                      Check-in
                                    </p>

                                    <p className="text-sm font-bold text-gray-700 mt-1">
                                      {reservation.start_date ||
                                        '—'}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase">
                                      Check-out
                                    </p>

                                    <p className="text-sm font-bold text-gray-700 mt-1">
                                      {reservation.end_date ||
                                        '—'}
                                    </p>
                                  </div>
                                </div>

                                {(reservation.price ||
                                  reservation.total_price ||
                                  reservation.amount) && (
                                  <p className="mt-3 text-sm font-black text-gray-900">
                                    €
                                    {reservation.total_price ||
                                      reservation.price ||
                                      reservation.amount}
                                  </p>
                                )}
                              </div>

                              <div className="flex flex-col items-start md:items-end gap-3">
                                <span
                                  className={`rounded-full border px-3 py-1 text-[11px] font-bold ${getStatusClass(
                                    reservation.status
                                  )}`}
                                >
                                  {getStatusLabel(
                                    reservation.status
                                  )}
                                </span>

                                {reservation.status !==
                                  'CANCELLED' &&
                                  reservation.status !==
                                    'REJECTED' && (
                                    <button
                                      onClick={() =>
                                        handleCancelReservation(
                                          reservation.id
                                        )
                                      }
                                      disabled={actionLoading}
                                      className="text-xs font-bold text-red-600 hover:text-red-700 disabled:opacity-50"
                                    >
                                      Cancel Reservation
                                    </button>
                                  )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* LISTINGS */}
                {activeSection === 'listings' && (
                  <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-6">
                      <div>
                        <h1 className="text-2xl font-black text-gray-900">
                          My Listings
                        </h1>

                        <p className="text-xs text-gray-500 mt-1">
                          Manage your listed properties.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={openListingsCreate}
                        className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-md transition hover:bg-emerald-700"
                      >
                        + Add Listing
                      </button>
                    </div>

                    {displayListings.length === 0 ? (
                      <div className="py-12 text-center">
                        <div className="text-4xl mb-3">🏠</div>

                        <p className="text-sm font-bold text-gray-900">
                          You have no listings yet.
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          Your properties will appear here.
                        </p>

                        <button
                          type="button"
                          onClick={openListingsCreate}
                          className="mt-5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 text-xs font-bold transition"
                        >
                          + Add Listing
                        </button>
                      </div>
                    ) : (
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                        {displayListings.map((listing) => (
                          <div
                            key={listing.id}
                            className="rounded-2xl border border-gray-200 overflow-hidden"
                          >
                            <div className="h-40 bg-gray-100 flex items-center justify-center">
                              {listing.main_image ? (
                                <img
                                  src={listing.main_image}
                                  alt={getListingTitle(listing)}
                                  className="h-full w-full object-cover"
                                />
                              ) : listing.images?.length > 0 ? (
                                <img
                                  src={
                                    typeof listing.images[0] ===
                                    'string'
                                      ? listing.images[0]
                                      : listing.images[0]?.image
                                  }
                                  alt={getListingTitle(listing)}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-4xl">
                                  🏠
                                </span>
                              )}
                            </div>

                            <div className="p-5">
                              <h2 className="text-sm font-black text-gray-900">
                                {getListingTitle(listing)}
                              </h2>

                              <p className="text-xs text-gray-500 mt-1">
                                {listing.city || '—'}
                                {listing.district
                                  ? `, ${listing.district}`
                                  : ''}
                              </p>

                              <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-gray-600">
                                {listing.rooms !==
                                  undefined && (
                                  <span>
                                    🛏 {listing.rooms} rooms
                                  </span>
                                )}

                                {listing.price !==
                                  undefined && (
                                  <span>
                                    €{listing.price}
                                  </span>
                                )}

                                {(listing.average_rating !==
                                  undefined ||
                                  listing.rating !==
                                    undefined) && (
                                  <span>
                                    ⭐{' '}
                                    {listing.average_rating ??
                                      listing.rating}
                                  </span>
                                )}
                              </div>

                              <div className="mt-5 flex flex-wrap gap-2">
                                <Link
                                  href={`/listings/${listing.id}`}
                                  className="inline-flex rounded-full border border-gray-300 px-4 py-2.5 text-xs font-bold text-gray-700 hover:border-emerald-600 hover:text-emerald-600 transition"
                                >
                                  View Listing
                                </Link>

                                <Link
                                  href={`/listings/${listing.id}`}
                                  className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                                >
                                  Edit
                                </Link>

                                <Link
                                  href={`/listings/${listing.id}`}
                                  className="inline-flex rounded-full border border-gray-300 px-4 py-2.5 text-xs font-bold text-gray-700 hover:border-emerald-600 hover:text-emerald-600 transition"
                                >
                                  Reviews
                                </Link>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteListing(listing.id)
                                  }
                                  disabled={actionLoading}
                                  className="inline-flex rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100 transition disabled:opacity-50"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* REVIEWS */}
                {activeSection === 'reviews' && (
                  <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-8">
                    <div className="border-b border-gray-100 pb-6">
                      <h1 className="text-2xl font-black text-gray-900">
                        My Reviews
                      </h1>

                      <p className="text-xs text-gray-500 mt-1">
                        Manage the reviews you have written.
                      </p>
                    </div>

                    {reviews.length === 0 ? (
                      <div className="py-12 text-center">
                        <div className="text-4xl mb-3">⭐</div>

                        <p className="text-sm font-bold text-gray-900">
                          You have no reviews yet.
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          Your reviews will appear here.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-6 space-y-4">
                        {reviews.map((review) => (
                          <div
                            key={review.id}
                            className="rounded-2xl border border-gray-200 p-5"
                          >
                            {editingReviewId === review.id ? (
                              <div>
                                <h2 className="text-sm font-black text-gray-900">
                                  {getReviewListingTitle(
                                    review
                                  )}
                                </h2>

                                <div className="mt-4">
                                  <label className="text-xs font-bold text-gray-600">
                                    Rating
                                  </label>

                                  <select
                                    value={editingRating}
                                    onChange={(e) =>
                                      setEditingRating(
                                        Number(
                                          e.target.value
                                        )
                                      )
                                    }
                                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-600"
                                  >
                                    <option value={1}>
                                      1 ⭐
                                    </option>

                                    <option value={2}>
                                      2 ⭐
                                    </option>

                                    <option value={3}>
                                      3 ⭐
                                    </option>

                                    <option value={4}>
                                      4 ⭐
                                    </option>

                                    <option value={5}>
                                      5 ⭐
                                    </option>
                                  </select>
                                </div>

                                <div className="mt-4">
                                  <label className="text-xs font-bold text-gray-600">
                                    Comment
                                  </label>

                                  <textarea
                                    value={editingComment}
                                    onChange={(e) =>
                                      setEditingComment(
                                        e.target.value
                                      )
                                    }
                                    rows={4}
                                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-600 resize-none"
                                  />
                                </div>

                                <div className="mt-4 flex gap-3">
                                  <button
                                    onClick={() =>
                                      saveReviewEdit(
                                        review.id
                                      )
                                    }
                                    disabled={
                                      actionLoading
                                    }
                                    className="rounded-full bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50 transition"
                                  >
                                    Save
                                  </button>

                                  <button
                                    onClick={
                                      cancelReviewEdit
                                    }
                                    className="rounded-full border border-gray-300 px-5 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                  <div>
                                    <h2 className="text-sm font-black text-gray-900">
                                      {getReviewListingTitle(
                                        review
                                      )}
                                    </h2>

                                    <div className="mt-2 text-sm">
                                      {'⭐'.repeat(
                                        Math.max(
                                          0,
                                          Math.min(
                                            5,
                                            Number(
                                              review.rating ||
                                                0
                                            )
                                          )
                                        )
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex gap-3">
                                    <button
                                      onClick={() =>
                                        startReviewEdit(
                                          review
                                        )
                                      }
                                      className="text-xs font-bold text-gray-600 hover:text-emerald-600"
                                    >
                                      Edit
                                    </button>

                                    <button
                                      onClick={() =>
                                        handleDeleteReview(
                                          review.id
                                        )
                                      }
                                      disabled={
                                        actionLoading
                                      }
                                      className="text-xs font-bold text-red-600 disabled:opacity-50"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>

                                {review.comment && (
                                  <p className="mt-4 text-sm text-gray-600 leading-6">
                                    {review.comment}
                                  </p>
                                )}

                                {review.created_at && (
                                  <p className="mt-3 text-[11px] text-gray-400">
                                    {new Date(
                                      review.created_at
                                    ).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SETTINGS */}
                {activeSection === 'settings' && (
                  <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-8">
                      <div className="border-b border-gray-100 pb-6">
                        <h1 className="text-2xl font-black text-gray-900">
                          Settings
                        </h1>

                        <p className="text-xs text-gray-500 mt-1">
                          Manage your account settings.
                        </p>
                      </div>

                      <div className="mt-6 space-y-4">
                        {/* PERSONAL INFORMATION */}
                        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5">
                          <div className="flex items-start gap-4">
                            <div className="h-10 w-10 shrink-0 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-lg">
                              👤
                            </div>

                            <div className="flex-1">
                              <h2 className="text-sm font-bold text-gray-900">
                                Personal Information
                              </h2>

                              <p className="text-xs text-gray-500 mt-1">
                                Manage your name, phone number and
                                address.
                              </p>

                              {!editingProfile ? (
                                <button
                                  type="button"
                                  onClick={startProfileEdit}
                                  className="mt-4 rounded-full border border-gray-300 px-5 py-2.5 text-xs font-bold text-gray-700 bg-white hover:border-emerald-600 hover:text-emerald-600 transition"
                                >
                                  Edit Information
                                </button>
                              ) : (
                                <form
                                  onSubmit={
                                    saveProfileInformation
                                  }
                                  className="mt-5 space-y-4"
                                >
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-xs font-bold text-gray-600 mb-2">
                                        First Name
                                      </label>

                                      <input
                                        type="text"
                                        name="first_name"
                                        value={
                                          profileForm.first_name
                                        }
                                        onChange={
                                          handleProfileFormChange
                                        }
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-600"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-xs font-bold text-gray-600 mb-2">
                                        Last Name
                                      </label>

                                      <input
                                        type="text"
                                        name="last_name"
                                        value={
                                          profileForm.last_name
                                        }
                                        onChange={
                                          handleProfileFormChange
                                        }
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-600"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-2">
                                      Phone
                                    </label>

                                    <input
                                      type="text"
                                      name="phone_number"
                                      value={
                                        profileForm.phone_number
                                      }
                                      onChange={
                                        handleProfileFormChange
                                      }
                                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-600"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-2">
                                      Address
                                    </label>

                                    <input
                                      type="text"
                                      name="address"
                                      value={
                                        profileForm.address
                                      }
                                      onChange={
                                        handleProfileFormChange
                                      }
                                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-600"
                                    />
                                  </div>

                                  <div className="flex gap-3 pt-1">
                                    <button
                                      type="submit"
                                      disabled={
                                        actionLoading
                                      }
                                      className="rounded-full bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-xs font-bold text-white transition disabled:opacity-50"
                                    >
                                      {actionLoading
                                        ? 'Saving...'
                                        : 'Save Changes'}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={
                                        cancelProfileEdit
                                      }
                                      disabled={
                                        actionLoading
                                      }
                                      className="rounded-full border border-gray-300 px-6 py-3 text-xs font-bold text-gray-700 hover:bg-white transition disabled:opacity-50"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* CHANGE PASSWORD */}
                        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5">
                          <div className="flex items-start gap-4">
                            <div className="h-10 w-10 shrink-0 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-lg">
                              🔒
                            </div>

                            <div className="flex-1">
                              <h2 className="text-sm font-bold text-gray-900">
                                Change Password
                              </h2>

                              <p className="text-xs text-gray-500 mt-1">
                                Change the password for your Rentify
                                account.
                              </p>

                              {!changingPassword ? (
                                <button
                                  type="button"
                                  onClick={
                                    startPasswordChange
                                  }
                                  className="mt-4 rounded-full border border-gray-300 px-5 py-2.5 text-xs font-bold text-gray-700 bg-white hover:border-emerald-600 hover:text-emerald-600 transition"
                                >
                                  Change Password
                                </button>
                              ) : (
                                <form
                                  onSubmit={
                                    savePasswordChange
                                  }
                                  className="mt-5 space-y-4"
                                >
                                  <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-2">
                                      Current Password
                                    </label>

                                    <input
                                      type="password"
                                      name="current_password"
                                      value={
                                        passwordForm.current_password
                                      }
                                      onChange={
                                        handlePasswordFormChange
                                      }
                                      autoComplete="current-password"
                                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-600"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-2">
                                      New Password
                                    </label>

                                    <input
                                      type="password"
                                      name="new_password"
                                      value={
                                        passwordForm.new_password
                                      }
                                      onChange={
                                        handlePasswordFormChange
                                      }
                                      autoComplete="new-password"
                                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-600"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-2">
                                      Confirm New Password
                                    </label>

                                    <input
                                      type="password"
                                      name="confirm_password"
                                      value={
                                        passwordForm.confirm_password
                                      }
                                      onChange={
                                        handlePasswordFormChange
                                      }
                                      autoComplete="new-password"
                                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-600"
                                    />
                                  </div>

                                  <div className="flex gap-3 pt-1">
                                    <button
                                      type="submit"
                                      disabled={
                                        actionLoading
                                      }
                                      className="rounded-full bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-xs font-bold text-white transition disabled:opacity-50"
                                    >
                                      {actionLoading
                                        ? 'Changing...'
                                        : 'Change Password'}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={
                                        cancelPasswordChange
                                      }
                                      disabled={
                                        actionLoading
                                      }
                                      className="rounded-full border border-gray-300 px-6 py-3 text-xs font-bold text-gray-700 hover:bg-white transition disabled:opacity-50"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* SIGN OUT */}
                        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5">
                          <div className="flex items-start gap-4">
                            <div className="h-10 w-10 shrink-0 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-lg">
                              🚪
                            </div>

                            <div className="flex-1">
                              <h2 className="text-sm font-bold text-gray-900">
                                Sign Out
                              </h2>

                              <p className="text-xs text-gray-500 mt-1">
                                Sign out from your current account.
                              </p>

                              <button
                                onClick={handleLogout}
                                className="mt-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 text-xs font-bold transition"
                              >
                                Log Out
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}