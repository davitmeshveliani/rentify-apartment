import { api } from './api';

export const reservationService = {
  async createReservation(
    listingId: string,
    startDate: string,
    endDate: string
  ) {
    const response = await api.post(
      '/api/reservations/',
      {
        listing: listingId,
        start_date: startDate,
        end_date: endDate,
      }
    );

    return response.data;
  },

  async getMyReservations() {
    const response = await api.get(
      '/api/reservations/my/'
    );

    return response.data;
  },

  async getHostReservations() {
    const response = await api.get(
      '/api/reservations/host/'
    );

    return response.data;
  },

  async updateReservationStatus(
    reservationId: string,
    status: 'CONFIRMED' | 'REJECTED'
  ) {
    const response = await api.patch(
      `/api/reservations/${reservationId}/`,
      {
        status,
      }
    );

    return response.data;
  },

  async cancelReservation(
    reservationId: string
  ) {
    const response = await api.post(
      `/api/reservations/${reservationId}/cancel/`
    );

    return response.data;
  },
};