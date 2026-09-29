export type ReservationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'CANCELLED';

export interface Reservation {
  id: string;
  listing: string;
  listing_title: string;
  user?: string;
  status: ReservationStatus;
  start_date: string;
  end_date: string;
  created_at: string;
}