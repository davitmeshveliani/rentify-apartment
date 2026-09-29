import { api } from './api';

export const listingService = {
  async getListings() {
    const response = await api.get('/api/listings/');
    return response.data;
  },

  async getListingById(listingId: string) {
    const response = await api.get(
      `/api/listings/${listingId}/`
    );
    return response.data;
  },
};