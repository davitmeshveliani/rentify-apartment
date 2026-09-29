'use client';

import { useEffect, useState } from 'react';

import { reviewService } from '@/services/reviewService';
import { Review } from '@/types/review';

interface ReviewsProps {
  listingId: string;
  currentUser: any;
  isOwner: boolean;
}

export default function Reviews({
  listingId,
  currentUser,
  isOwner,
}: ReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const [editingReviewId, setEditingReviewId] =
    useState<string | null>(null);

  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const data =
        await reviewService.getListingReviews(
          listingId
        );

      setReviews(data?.results || []);
    } catch (err) {
      console.error(
        'Error loading reviews:',
        err
      );

      setError(
        'Failed to load reviews.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (listingId) {
      loadReviews();
    }
  }, [listingId]);

  const getErrorMessage = (err: any) => {
    return (
      err?.response?.data?.errors?.[0]?.detail ||
      err?.response?.data?.detail ||
      err?.response?.data?.listing?.[0] ||
      err?.response?.data?.comment?.[0] ||
      'Something went wrong.'
    );
  };

  const handleCreateReview = async () => {
    if (!currentUser) {
      setError(
        'You must be logged in to leave a review.'
      );
      return;
    }

    if (isOwner) {
      setError(
        'You cannot review your own listing.'
      );
      return;
    }

    if (!comment.trim()) {
      setError(
        'Please write a comment.'
      );
      return;
    }

    if (comment.trim().length < 10) {
      setError(
        'Comment must be at least 10 characters long.'
      );
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      await reviewService.createReview(
        listingId,
        rating,
        comment.trim()
      );

      setComment('');
      setRating(5);

      setSuccess(
        'Review submitted successfully.'
      );

      await loadReviews();
    } catch (err: any) {
      console.error(
        'Error creating review:',
        err
      );

      setError(
        getErrorMessage(err)
      );
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (review: Review) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment || '');
    setError(null);
    setSuccess(null);
  };

  const cancelEditing = () => {
    setEditingReviewId(null);
    setEditRating(5);
    setEditComment('');
  };

  const handleUpdateReview = async () => {
    if (!editingReviewId) {
      return;
    }

    if (!editComment.trim()) {
      setError(
        'Please write a comment.'
      );
      return;
    }

    if (editComment.trim().length < 10) {
      setError(
        'Comment must be at least 10 characters long.'
      );
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      await reviewService.updateReview(
        editingReviewId,
        editRating,
        editComment.trim()
      );

      setEditingReviewId(null);
      setEditComment('');
      setEditRating(5);

      setSuccess(
        'Review updated successfully.'
      );

      await loadReviews();
    } catch (err: any) {
      console.error(
        'Error updating review:',
        err
      );

      setError(
        getErrorMessage(err)
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (
    reviewId: string
  ) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this review?'
    );

    if (!confirmed) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      await reviewService.deleteReview(
        reviewId
      );

      setSuccess(
        'Review deleted successfully.'
      );

      await loadReviews();
    } catch (err: any) {
      console.error(
        'Error deleting review:',
        err
      );

      setError(
        getErrorMessage(err)
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isMyReview = (review: Review) => {
    if (!currentUser) {
      return false;
    }

    return (
      review.user === currentUser.username ||
      review.user === currentUser.email ||
      review.user === currentUser.id
    );
  };

  return (
    <section className="mb-8">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Reviews
        </h2>

        {loading ? (
          <p className="text-gray-500">
            Loading reviews...
          </p>
        ) : reviews.length === 0 ? (
          <p className="text-gray-500">
            No reviews yet.
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="border border-gray-200 rounded-xl p-5 bg-gray-50"
              >
                {editingReviewId ===
                review.id ? (
                  <>
                    <div className="mb-4">
                      <label className="text-xs text-emerald-600 uppercase tracking-wider block mb-2">
                        Rating
                      </label>

                      <select
                        value={editRating}
                        onChange={(event) =>
                          setEditRating(
                            Number(
                              event.target.value
                            )
                          )
                        }
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
                      >
                        <option value={5}>
                          5 ⭐
                        </option>
                        <option value={4}>
                          4 ⭐
                        </option>
                        <option value={3}>
                          3 ⭐
                        </option>
                        <option value={2}>
                          2 ⭐
                        </option>
                        <option value={1}>
                          1 ⭐
                        </option>
                      </select>
                    </div>

                    <textarea
                      value={editComment}
                      onChange={(event) =>
                        setEditComment(
                          event.target.value
                        )
                      }
                      rows={4}
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 outline-none focus:border-emerald-500"
                    />

                    <div className="flex gap-3 mt-4">
                      <button
                        type="button"
                        onClick={
                          handleUpdateReview
                        }
                        disabled={submitting}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
                      >
                        {submitting
                          ? 'Saving...'
                          : 'Save'}
                      </button>

                      <button
                        type="button"
                        onClick={
                          cancelEditing
                        }
                        disabled={submitting}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold px-4 py-2 rounded-lg transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {review.user}
                        </p>

                        <p className="text-sm text-emerald-600">
                          {'⭐'.repeat(
                            review.rating
                          )}
                        </p>
                      </div>

                      <span className="text-xs text-gray-500">
                        {new Date(
                          review.created_at
                        ).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-gray-700 leading-relaxed">
                      {review.comment ||
                        'No comment.'}
                    </p>

                    {isMyReview(review) && (
                      <div className="flex gap-3 mt-4">
                        <button
                          type="button"
                          onClick={() =>
                            startEditing(
                              review
                            )
                          }
                          className="text-sm text-emerald-600 hover:text-emerald-700 transition"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteReview(
                              review.id
                            )
                          }
                          disabled={submitting}
                          className="text-sm text-red-600 hover:text-red-700 transition disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 mt-4">
            {error}
          </p>
        )}

        {success && (
          <p className="text-sm text-emerald-600 mt-4">
            {success}
          </p>
        )}

        {currentUser && !isOwner && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Leave a review
            </h3>

            <div className="mb-4">
              <label className="text-xs text-emerald-600 uppercase tracking-wider block mb-2">
                Rating
              </label>

              <select
                value={rating}
                onChange={(event) =>
                  setRating(
                    Number(
                      event.target.value
                    )
                  )
                }
                className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
              >
                <option value={5}>
                  5 ⭐
                </option>
                <option value={4}>
                  4 ⭐
                </option>
                <option value={3}>
                  3 ⭐
                </option>
                <option value={2}>
                  2 ⭐
                </option>
                <option value={1}>
                  1 ⭐
                </option>
              </select>
            </div>

            <textarea
              value={comment}
              onChange={(event) =>
                setComment(event.target.value)
              }
              placeholder="Write your review..."
              rows={4}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 outline-none focus:border-emerald-500"
            />

            <button
              type="button"
              onClick={handleCreateReview}
              disabled={submitting}
              className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? 'Submitting...'
                : 'Submit Review'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
