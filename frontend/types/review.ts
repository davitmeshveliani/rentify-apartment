export interface Review {
  id: string;
  listing: string;
  user: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface PaginatedReviewList {
  count: number;
  next: string | null;
  previous: string | null;
  results: Review[];
}