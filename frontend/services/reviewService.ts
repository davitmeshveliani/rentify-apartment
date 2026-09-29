import { api } from './api';

export const reviewService = {
  async getListingReviews(listingId: string) {
    const response = await api.get('/api/reviews/', {
      params: {
        listing: listingId,
      },
    });

    return response.data;
  },

  async getMyReviews() {
    const response = await api.get('/api/reviews/my/');

    return response.data;
  },

  async createReview(
    listingId: string,
    rating: number,
    comment: string
  ) {
    const response = await api.post('/api/reviews/', {
      listing: listingId,
      rating,
      comment,
    });

    return response.data;
  },

  async updateReview(
    reviewId: string,
    rating: number,
    comment: string
  ) {
    const response = await api.patch(
      `/api/reviews/${reviewId}/`,
      {
        rating,
        comment,
      }
    );

    return response.data;
  },

  async deleteReview(reviewId: string) {
    const response = await api.delete(
      `/api/reviews/${reviewId}/`
    );

    return response.data;
  },
};