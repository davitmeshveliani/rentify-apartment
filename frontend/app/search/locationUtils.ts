export interface CityLocation {
  lat: number;
  lon: number;
}

export interface GeoResult {
  lat: string;
  lon: string;
  display_name: string;
}

/**
 * Coordinates for cities used by old/fake listings
 * that don't have latitude/longitude values.
 *
 * These coordinates are used only for distance calculation.
 * They do NOT change the listing's stored address.
 */
export const KNOWN_CITY_COORDINATES: Record<
  string,
  CityLocation
> = {
  berlin: {
    lat: 52.520008,
    lon: 13.404954,
  },

  hamburg: {
    lat: 53.551086,
    lon: 9.993682,
  },

  munich: {
    lat: 48.135125,
    lon: 11.581981,
  },

  münchen: {
    lat: 48.135125,
    lon: 11.581981,
  },

  cologne: {
    lat: 50.937531,
    lon: 6.960279,
  },

  köln: {
    lat: 50.937531,
    lon: 6.960279,
  },

  frankfurt: {
    lat: 50.110924,
    lon: 8.682127,
  },

  düsseldorf: {
    lat: 51.227741,
    lon: 6.773456,
  },

  dusseldorf: {
    lat: 51.227741,
    lon: 6.773456,
  },

  dortmund: {
    lat: 51.513587,
    lon: 7.465298,
  },

  essen: {
    lat: 51.455643,
    lon: 7.011555,
  },

  stuttgart: {
    lat: 48.775846,
    lon: 9.182932,
  },

  leipzig: {
    lat: 51.339695,
    lon: 12.373075,
  },

  bremen: {
    lat: 53.079296,
    lon: 8.801694,
  },

  dresden: {
    lat: 51.050407,
    lon: 13.737262,
  },

  hannover: {
    lat: 52.375893,
    lon: 9.73201,
  },

  nuremberg: {
    lat: 49.452103,
    lon: 11.076665,
  },

  nürnberg: {
    lat: 49.452103,
    lon: 11.076665,
  },

  bonn: {
    lat: 50.73743,
    lon: 7.098206,
  },

  mannheim: {
    lat: 49.487459,
    lon: 8.466039,
  },

  karlsruhe: {
    lat: 49.006889,
    lon: 8.403653,
  },

  augsburg: {
    lat: 48.370545,
    lon: 10.89779,
  },

  wiesbaden: {
    lat: 50.08258,
    lon: 8.24932,
  },

  mainz: {
    lat: 49.992863,
    lon: 8.247253,
  },

  kassel: {
    lat: 51.312711,
    lon: 9.479746,
  },

  freiburg: {
    lat: 47.999008,
    lon: 7.842104,
  },

  regensburg: {
    lat: 49.013432,
    lon: 12.101624,
  },

  aschaffenburg: {
    lat: 49.97704,
    lon: 9.15214,
  },

  sindorf: {
    lat: 50.9087,
    lon: 6.6559,
  },

  erlenbach: {
    lat: 49.803,
    lon: 9.163,
  },

  "erlenbach-am-main": {
    lat: 49.803,
    lon: 9.163,
  },
};

/**
 * Returns coordinates for a known city.
 * If the city is not in the local list,
 * it tries OpenStreetMap Nominatim.
 */
export async function geocodeCity(
  cityName: string
): Promise<CityLocation | null> {
  const normalizedCity = cityName.trim().toLowerCase();

  const knownCity =
    KNOWN_CITY_COORDINATES[normalizedCity];

  if (knownCity) {
    return knownCity;
  }

  try {
    const params = new URLSearchParams({
      q: cityName,
      format: "json",
      limit: "1",
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data =
      (await response.json()) as GeoResult[];

    if (!data.length) {
      return null;
    }

    const lat = Number(data[0].lat);
    const lon = Number(data[0].lon);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon)
    ) {
      return null;
    }

    return {
      lat,
      lon,
    };
  } catch (error) {
    console.error(
      `Failed to geocode "${cityName}":`,
      error
    );

    return null;
  }
}

/**
 * Calculates distance between two geographic points
 * using the Haversine formula.
 *
 * Result is returned in kilometers.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const earthRadiusKm = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadiusKm * c;
}
