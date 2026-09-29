import { Apartment } from '@/types/listing';

import {
  calculateDistance,
  geocodeCity,
  type CityLocation,
} from './locationUtils';

export type ApartmentWithCoordinates = Apartment & {
  latitude?: number | string | null;
  longitude?: number | string | null;
};

export interface SelectedLocation {
  lat: number;
  lon: number;
}

export interface AlternativeListingResult {
  listing: ApartmentWithCoordinates;
  distance: number;
}

export async function findAlternativeListings(
  allListings: ApartmentWithCoordinates[],
  selectedLocation: SelectedLocation,
  radius: number,
  excludedListingIds: Set<string> = new Set()
): Promise<AlternativeListingResult[]> {
  const cityCoordinates = new Map<
    string,
    CityLocation | null
  >();

  /*
   * Find cities that belong to listings without
   * real latitude/longitude coordinates.
   */
  const uniqueCities = Array.from(
    new Set(
      allListings
        .filter(
          (item) =>
            item.latitude === undefined ||
            item.latitude === null ||
            item.longitude === undefined ||
            item.longitude === null
        )
        .map((item) =>
          item.address_city?.trim()
        )
        .filter(
          (city): city is string =>
            Boolean(city)
        )
    )
  );

  /*
   * Resolve city coordinates once.
   */
  await Promise.all(
    uniqueCities.map(async (cityName) => {
      const coordinates =
        await geocodeCity(cityName);

      cityCoordinates.set(
        cityName.toLowerCase(),
        coordinates
      );
    })
  );

  /*
   * Calculate distance for every listing.
   *
   * Matching listings are excluded so they
   * cannot appear again in Alternative stays.
   *
   * Priority:
   * 1. Real listing coordinates.
   * 2. City coordinates for old listings.
   */
  const alternatives = allListings
    .filter(
      (item) =>
        !excludedListingIds.has(
          String(item.id)
        )
    )
    .map((item) => {
      let listingLat: number | null = null;
      let listingLon: number | null = null;

      /*
       * First use the listing's real coordinates.
       */
      if (
        item.latitude !== undefined &&
        item.latitude !== null &&
        item.longitude !== undefined &&
        item.longitude !== null
      ) {
        const lat = Number(item.latitude);
        const lon = Number(item.longitude);

        if (
          Number.isFinite(lat) &&
          Number.isFinite(lon)
        ) {
          listingLat = lat;
          listingLon = lon;
        }
      }

      /*
       * If coordinates don't exist,
       * use the city coordinates.
       */
      if (
        listingLat === null ||
        listingLon === null
      ) {
        const cityName =
          item.address_city
            ?.trim()
            .toLowerCase();

        if (cityName) {
          const cityLocation =
            cityCoordinates.get(cityName);

          if (cityLocation) {
            listingLat =
              cityLocation.lat;

            listingLon =
              cityLocation.lon;
          }
        }
      }

      /*
       * No coordinates available.
       */
      if (
        listingLat === null ||
        listingLon === null
      ) {
        return null;
      }

      const distance =
        calculateDistance(
          selectedLocation.lat,
          selectedLocation.lon,
          listingLat,
          listingLon
        );

      /*
       * Keep only listings inside
       * the selected radius.
       */
      if (distance > radius) {
        return null;
      }

      return {
        listing: item,
        distance,
      };
    })
    .filter(
      (
        item
      ): item is AlternativeListingResult =>
        item !== null
    )
    .sort(
      (a, b) =>
        a.distance - b.distance
    );

  return alternatives;
}
