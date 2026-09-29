'use client';

import { useEffect, useRef } from 'react';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface MapLocation {
lat: number;
lon: number;
displayName: string;
}

export interface MapListing {
id: string;
title: string;
price: number | string;
address_city?: string | null;
latitude?: number | string | null;
longitude?: number | string | null;
main_image?: string | null;
average_rating?: number | string | null;
}

interface LocationMapProps {
selectedLocation: MapLocation | null;
onLocationChange: (
location: MapLocation
) => void;

listings?: MapListing[];
onListingClick?: (
listing: MapListing
) => void;
}

const DEFAULT_CENTER: [number, number] = [
50.9787,
9.7735,
];

const DEFAULT_ZOOM = 6;

function createLocationIcon() {
return L.divIcon({
className: '',
html: `       <div
        style="
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          background: #059669;
          border: 3px solid white;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
          transform: rotate(-45deg);
          position: relative;
        "       >         <div
          style="
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: white;
            position: absolute;
            left: 9px;
            top: 9px;
          "         ></div>       </div>
    `,
iconSize: [32, 32],
iconAnchor: [16, 32],
});
}

function createListingIcon(
price: number | string
) {
return L.divIcon({
className: '',
html: ` <div
     style="
       display: flex;
       flex-direction: column;
       align-items: center;
       transform: translateY(-4px);
     "
   > <div
       style="
         background: #111827;
         color: white;
         padding: 6px 10px;
         border-radius: 999px;
         font-size: 12px;
         font-weight: 700;
         line-height: 1;
         white-space: nowrap;
         box-shadow: 0 4px 12px rgba(0, 0, 0, 0.22);
         border: 2px solid white;
       "
     >
€${Number(price).toLocaleString('de-DE')} </div>

    <div
      style="
        width: 14px;
        height: 14px;
        margin-top: -2px;
        border-radius: 50%;
        background: #059669;
        border: 3px solid white;
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
      "
    ></div>
  </div>
`,
iconSize: [90, 50],
iconAnchor: [45, 45],

});
}

function createPopupContent(
listing: MapListing
) {
const image = listing.main_image;

const rating =
listing.average_rating !== undefined &&
listing.average_rating !== null &&
Number(listing.average_rating) > 0
? `⭐ ${Number(listing.average_rating).toFixed(1)}`
: 'No reviews';

const imageHtml = image
? `       <img
        src="${image}"
        alt="${listing.title}"
        style="
          width: 100%;
          height: 120px;
          object-fit: cover;
          border-radius: 12px;
          margin-bottom: 10px;
        "
      />
    `
: `       <div
        style="
          width: 100%;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          border-radius: 12px;
          margin-bottom: 10px;
          color: #6b7280;
          font-size: 12px;
        "       >
        No image       </div>
    `;

return ` <div
   style="
     width: 240px;
     font-family: Arial, sans-serif;
   "
 >
${imageHtml}

  <div
    style="
      font-size: 14px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 5px;
    "
  >
    ${listing.title}
  </div>

  <div
    style="
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 8px;
    "
  >
    ${listing.address_city || 'Location unavailable'}
  </div>

  <div
    style="
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    "
  >
    <span
      style="
        font-size: 14px;
        font-weight: 700;
        color: #059669;
      "
    >
      €${Number(listing.price).toLocaleString('de-DE')}
    </span>

    <span
      style="
        font-size: 12px;
        color: #374151;
      "
    >
      ${rating}
    </span>
  </div>

  <div
    style="
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px solid #e5e7eb;
      font-size: 11px;
      font-weight: 600;
      color: #059669;
    "
  >
    Click marker to view property
  </div>
</div>

`;
}

export default function LocationMap({
selectedLocation,
onLocationChange,
listings = [],
onListingClick,
}: LocationMapProps) {
const mapContainerRef =
useRef<HTMLDivElement | null>(null);

const mapRef =
useRef<L.Map | null>(null);

const markerRef =
useRef<L.Marker | null>(null);

const listingMarkersRef =
useRef<L.Marker[]>([]);

const onLocationChangeRef =
useRef(onLocationChange);

const onListingClickRef =
useRef(onListingClick);

useEffect(() => {
onLocationChangeRef.current =
onLocationChange;
}, [onLocationChange]);

useEffect(() => {
onListingClickRef.current =
onListingClick;
}, [onListingClick]);

useEffect(() => {
const container =
mapContainerRef.current;

if (!container) {
  return;
}

if (mapRef.current) {
  return;
}

const leafletContainer =
  container as HTMLDivElement & {
    _leaflet_id?: number;
  };

if (leafletContainer._leaflet_id) {
  delete leafletContainer._leaflet_id;
}

const map = L.map(container, {
  center: DEFAULT_CENTER,
  zoom: DEFAULT_ZOOM,
  scrollWheelZoom: true,
});

mapRef.current = map;

L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  {
    attribution:
      '&copy; OpenStreetMap contributors',
  }
).addTo(map);

const handleMapClick = async (
  event: L.LeafletMouseEvent
) => {
  const lat = event.latlng.lat;
  const lon = event.latlng.lng;

  onLocationChangeRef.current({
    lat,
    lon,
    displayName: 'Selected location',
  });

  try {
    const params =
      new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        format: 'jsonv2',
        addressdetails: '1',
        zoom: '18',
      });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        'Reverse geocoding request failed.'
      );
    }

    const data =
      await response.json();

    const address =
      data.address || {};

    const readableAddress = [
      address.road,
      address.house_number,
      address.postcode,
      address.city ||
        address.town ||
        address.village ||
        address.municipality,
      address.country,
    ]
      .filter(Boolean)
      .join(', ');

    onLocationChangeRef.current({
      lat,
      lon,
      displayName:
        readableAddress ||
        data.display_name ||
        'Selected location',
    });
  } catch (error) {
    console.error(
      'Reverse geocoding error:',
      error
    );

    onLocationChangeRef.current({
      lat,
      lon,
      displayName: 'Selected location',
    });
  }
};

map.on(
  'click',
  handleMapClick
);

return () => {
  map.off(
    'click',
    handleMapClick
  );

  if (markerRef.current) {
    markerRef.current.remove();
    markerRef.current = null;
  }

  listingMarkersRef.current.forEach(
    (marker) => marker.remove()
  );

  listingMarkersRef.current = [];

  map.remove();

  mapRef.current = null;

  if (leafletContainer._leaflet_id) {
    delete leafletContainer._leaflet_id;
  }
};

}, []);

useEffect(() => {
const map = mapRef.current;

if (!map) {
  return;
}

listingMarkersRef.current.forEach(
  (marker) => marker.remove()
);

listingMarkersRef.current = [];

listings.forEach((listing) => {
  if (
    listing.latitude === undefined ||
    listing.latitude === null ||
    listing.longitude === undefined ||
    listing.longitude === null
  ) {
    return;
  }

  const lat = Number(listing.latitude);
  const lon = Number(listing.longitude);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon)
  ) {
    return;
  }

  const marker = L.marker(
    [lat, lon],
    {
      icon: createListingIcon(
        listing.price
      ),
    }
  ).addTo(map);

  marker.bindPopup(
    createPopupContent(listing),
    {
      maxWidth: 280,
      minWidth: 240,
    }
  );

  marker.on('click', () => {
    onListingClickRef.current?.(
      listing
    );
  });

  listingMarkersRef.current.push(
    marker
  );
});

}, [listings]);

useEffect(() => {
const map = mapRef.current;

if (!map) {
  return;
}

if (!selectedLocation) {
  if (markerRef.current) {
    markerRef.current.remove();
    markerRef.current = null;
  }

  return;
}

const position: L.LatLngExpression = [
  selectedLocation.lat,
  selectedLocation.lon,
];

map.flyTo(position, 13, {
  duration: 1,
});

if (markerRef.current) {
  markerRef.current.setLatLng(
    position
  );
} else {
  markerRef.current =
    L.marker(position, {
      icon: createLocationIcon(),
    })
      .addTo(map)
      .bindPopup(
        `<strong>Selected location</strong><br />${selectedLocation.displayName}`
      );
}

}, [selectedLocation]);

return ( <div className="relative h-[420px] w-full overflow-hidden rounded-xl"> <div
     ref={mapContainerRef}
     className="h-full w-full"
   />

  {listings.length > 0 && (
    <div className="pointer-events-none absolute left-4 top-4 z-[500] rounded-xl border border-white/80 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
      <p className="text-xs font-semibold text-gray-500">
        Properties on map
      </p>

      <p className="mt-0.5 text-lg font-bold text-gray-900">
        {
          listings.filter(
            (listing) =>
              listing.latitude !==
                undefined &&
              listing.latitude !==
                null &&
              listing.longitude !==
                undefined &&
              listing.longitude !==
                null
          ).length
        }
      </p>
    </div>
  )}
</div>

);
}
