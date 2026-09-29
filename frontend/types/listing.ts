export interface Apartment {
  id: string;
  title: string;
  description?: string;
  address_city: string;
  price: number | string;
  rooms: number;
  property_type?: string;
  main_image?: string;
  reviews_count?: number;
  average_rating?: number | string;
  images?: { id: string; image: string }[] | string[];
}

export interface PaginatedApartmentList {
  count: number;
  results: Apartment[];
}